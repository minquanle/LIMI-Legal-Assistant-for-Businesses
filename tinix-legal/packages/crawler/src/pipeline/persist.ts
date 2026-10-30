import { PrismaClient, Prisma } from '@prisma/client';
import { ParsedMetadata, normalizeDocumentNumber } from '../parsers/metadata-parser.js';
import { TextRelationExtractor } from '../parsers/relation-extractor.js';
import logger from '../utils/logger.js';
import { randomUUID } from 'node:crypto';
import { normalizeSourceUrl } from '@tinix-legal/shared/dist/source-identity.js';

const prisma = new PrismaClient();

export interface FlattenedAstNode {
  nodeType: string;
  ordinal?: string;
  heading?: string;
  content?: string;
  path: string;
  depth: number;
  orderIndex: number;
}

/**
 * Transactional core write: CanonicalDocument upsert + AST node replace +
 * relation diff, all in one `prisma.$transaction`. Previously these ran as
 * separate sequential statements — a crash between the AST `deleteMany` and
 * the node-recreation loop could leave a document with zero AST nodes while
 * the parent record still existed, with nothing to signal the corruption.
 * MinIO storage and embedding generation are deliberately NOT part of this
 * transaction (see storage.ts / embedding.ts) — they're external network
 * calls that shouldn't hold a DB transaction open, and are already tracked
 * as best-effort partial failures by the orchestrator (ingestion.ts).
 */
export async function persistDocument(
  rawDoc: { id?: string; url?: string; fullText?: string; source?: string },
  metadata: ParsedMetadata,
  documentFullText: string,
  astTree: any[],
  flattenedNodes: FlattenedAstNode[]
) {
  return prisma.$transaction(async (tx) => {
    const source = rawDoc.url ? normalizeSourceUrl(rawDoc.url) : null;
    if (!rawDoc.id && !source) throw new Error('DOCUMENT_ID_OR_SOURCE_URL_REQUIRED');
    let sourceId: string | undefined;
    let documentId = rawDoc.id;
    if (source) {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`source:${source.domain}:${source.normalizedUrl}`}, 0))::text`;
      const sources = await tx.documentSource.findMany({where:{OR:[
        {domain:source.domain,normalizedUrl:source.normalizedUrl},{url:source.originalUrl}
      ]},take:2});
      if (new Set(sources.map(row=>row.documentId)).size>1) throw new Error('AMBIGUOUS_SOURCE_IDENTITY');
      const existing = sources[0];
      if (existing && documentId && existing.documentId!==documentId) throw new Error('SOURCE_DOCUMENT_CONFLICT');
      documentId ??= existing?.documentId;
      sourceId = existing?.id;
    }
    documentId ??= randomUUID();
    const previous = await tx.canonicalDocument.findUnique({where:{id:documentId},select:{selectedSnapshotId:true}});
    if (previous?.selectedSnapshotId) throw new Error('VERSIONED_DOCUMENT_REQUIRES_SNAPSHOT_IMPORT');
    const doc = await tx.canonicalDocument.upsert({
      where: { id: documentId },
      create: {
        id: documentId,
        documentNumber: metadata.documentNumber,
        normalizedNumber: metadata.normalizedNumber,
        documentType: metadata.documentType as any,
        title: metadata.title,
        issuingBody: metadata.issuingBody,
        // Kept for candidate lookup, never used as a unique identity.
        issuingBodyCode: metadata.issuingBodyCode,
        signer: metadata.signer,
        promulgationDate: metadata.promulgationDate ? new Date(metadata.promulgationDate) : null,
        effectiveDate: metadata.effectiveDate ? new Date(metadata.effectiveDate) : null,
        expiryDate: metadata.expiryDate ? new Date(metadata.expiryDate) : null,
        validityStatus: metadata.validityStatus as any,
        preciseValidityStatus: metadata.preciseValidityStatus || '',
        field: metadata.field,
        gazetteNumber: metadata.gazetteNumber || '',
        gazetteDate: metadata.gazetteDate ? new Date(metadata.gazetteDate) : null,
        isConsolidated: metadata.isConsolidated || false,
        isTranslation: metadata.isTranslation || false,
        trichYeu: metadata.trichYeu || '',
        author: metadata.author || '',
        lastUpdatedAt: metadata.lastUpdatedAt ? new Date(metadata.lastUpdatedAt) : null,
        fullText: documentFullText,
        ast: astTree as any,
      },
      update: {
        title: metadata.title,
        issuingBodyCode: metadata.issuingBodyCode,
        validityStatus: metadata.validityStatus as any,
        preciseValidityStatus: metadata.preciseValidityStatus || '',
        expiryDate: metadata.expiryDate ? new Date(metadata.expiryDate) : null,
        gazetteNumber: metadata.gazetteNumber || '',
        gazetteDate: metadata.gazetteDate ? new Date(metadata.gazetteDate) : null,
        isConsolidated: metadata.isConsolidated || false,
        isTranslation: metadata.isTranslation || false,
        lastUpdatedAt: metadata.lastUpdatedAt ? new Date(metadata.lastUpdatedAt) : null,
        fullText: documentFullText,
        ast: astTree as any,
      },
    });

    if (source) {
      const data = {domain:source.domain,normalizedUrl:source.normalizedUrl,sourceKind:source.sourceKind,lastCrawledAt:new Date()};
      if (sourceId) await tx.documentSource.update({where:{id:sourceId},data});
      else await tx.documentSource.create({data:{...data,documentId:doc.id,site:source.site,url:source.originalUrl}});
    }

    if (flattenedNodes.length > 0) {
      await tx.legalASTNode.deleteMany({ where: { documentId: doc.id } });
      await tx.legalASTNode.createMany({
        data: flattenedNodes.map((node) => ({
          documentId: doc.id,
          nodeType: node.nodeType as any,
          ordinal: node.ordinal || '',
          heading: node.heading || '',
          content: node.content || '',
          path: node.path,
          depth: node.depth,
          orderIndex: node.orderIndex,
        })),
      });
    }

    await persistRelations(tx, doc.id, rawDoc.fullText || documentFullText, metadata);

    return doc;
  });
}

async function persistRelations(
  tx: Prisma.TransactionClient,
  docId: string,
  fullTextForRelations: string,
  metadata: ParsedMetadata
) {
  const textRelations = TextRelationExtractor.extractFromFullText(fullTextForRelations || '');
  const mergedRelations = TextRelationExtractor.mergeRelations(metadata.relationships || [], textRelations);

  const existingRelations = await tx.documentRelation.findMany({ where: { sourceDocId: docId } });
  const existingCrawlerRelations = existingRelations.filter((r) => (r.description || '').startsWith('Extracted relation '));

  const mergedNormTargets = new Set(
    mergedRelations.map((rel) => {
      const norm = rel.normalizedTargetNumber || (rel.targetDocNumber ? normalizeDocumentNumber(rel.targetDocNumber) : '');
      return `${norm}_${rel.relationshipType}`;
    })
  );

  const relationsToDelete = existingCrawlerRelations.filter((r) => {
    const normTarget = normalizeDocumentNumber(r.targetDocNumber);
    return !mergedNormTargets.has(`${normTarget}_${r.relationType}`);
  });

  if (relationsToDelete.length > 0) {
    await tx.documentRelation.deleteMany({ where: { id: { in: relationsToDelete.map((r) => r.id) } } });
  }

  const existingNormTargets = new Set(
    existingRelations.map((r) => {
      const norm = normalizeDocumentNumber(r.targetDocNumber);
      return `${norm}_${r.relationType}`;
    })
  );

  for (const rel of mergedRelations) {
    const normTarget = rel.normalizedTargetNumber || (rel.targetDocNumber ? normalizeDocumentNumber(rel.targetDocNumber) : '');
    const key = `${normTarget}_${rel.relationshipType}`;
    if (existingNormTargets.has(key)) continue;

    const candidates = await tx.canonicalDocument.findMany({ where: { normalizedNumber: normTarget }, select:{id:true}, take:2 });

    await tx.documentRelation.create({
      data: {
        sourceDocId: docId,
        targetDocId: null,
        targetDocNumber: rel.targetDocNumber,
        relationType: rel.relationshipType as any,
        description: `Extracted relation ${rel.relationshipType} to ${rel.targetDocNumber}`,
        sourceNodeRef: rel.sourceNodeRef || null,
        targetNodeRef: rel.targetNodeRef || null,
        origin: 'TEXT_EXTRACTION',
        resolveStatus: candidates.length>1?'AMBIGUOUS':candidates.length===1?'CANDIDATE':'UNRESOLVED',
        provenanceJson: {candidateDocumentIds:candidates.map(row=>row.id)},
      },
    });
    existingNormTargets.add(key);
  }
}
