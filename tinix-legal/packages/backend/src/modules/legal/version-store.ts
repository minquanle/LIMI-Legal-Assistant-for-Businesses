import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { normalizeSourceUrl } from '@tinix-legal/shared/dist/source-identity.js';
import { canonicalJson, prepareParse, sha256, snapshotHashes } from './record-adapter.js';
const json = (value: unknown) => JSON.parse(canonicalJson(value)) as Prisma.InputJsonValue;

export async function resolveImportedIdentity(tx: Prisma.TransactionClient, datasetKey: string, externalId: string, create: Prisma.CanonicalDocumentUncheckedCreateInput) {
  if (!datasetKey.trim() || !externalId.trim()) throw new Error('INVALID_IMPORTED_IDENTITY');
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify(['dataset',datasetKey,externalId])},0))::text`;
  const existing=await tx.importedDocumentIdentity.findUnique({where:{imported_identity:{datasetKey,externalId}},include:{document:true}});
  if (existing) return {document:existing.document,created:false};
  // The self-owner composite snapshot FK also uses id; supply it explicitly
  // rather than relying on Prisma's client default for this relation shape.
  const document=await tx.canonicalDocument.create({data:{...create,id:create.id??randomUUID()}});
  await tx.importedDocumentIdentity.create({data:{datasetKey,externalId,documentId:document.id}});
  return {document,created:true};
}
export async function resolveDocumentSource(tx: Prisma.TransactionClient, documentId: string, rawUrl: string, sourceRecordId?: string) {
  const source=normalizeSourceUrl(rawUrl);
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`source:${source.domain}:${source.normalizedUrl}`},0))::text`;
  const matches=await tx.documentSource.findMany({where:{OR:[
    {domain:source.domain,normalizedUrl:source.normalizedUrl},{url:source.originalUrl}
  ]},take:2});
  if (matches.some(row=>row.documentId!==documentId)) throw new Error('SOURCE_DOCUMENT_CONFLICT');
  if (matches.length>1) throw new Error('AMBIGUOUS_SOURCE_IDENTITY');
  if (matches[0]) {
    if (sourceRecordId && matches[0].sourceRecordId && sourceRecordId!==matches[0].sourceRecordId) throw new Error('SOURCE_RECORD_ID_CONFLICT');
    return tx.documentSource.update({where:{id:matches[0].id},data:{domain:source.domain,normalizedUrl:source.normalizedUrl,sourceKind:source.sourceKind,
      ...(sourceRecordId?{sourceRecordId}:{}),lastCrawledAt:new Date()}});
  }
  return tx.documentSource.create({data:{documentId,site:source.site,url:source.originalUrl,domain:source.domain,
    normalizedUrl:source.normalizedUrl,sourceKind:source.sourceKind,sourceRecordId:sourceRecordId??null}});
}
export async function getOrCreateSnapshot(tx: Prisma.TransactionClient, documentId: string, record: Record<string,unknown>) {
  const hashes=snapshotHashes(record);
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify(['snapshot',documentId])},0))::text`;
  const existing=await tx.documentSnapshot.findUnique({where:{snapshot_version:{documentId,contentHash:hashes.contentHash,metadataHash:hashes.metadataHash}}});
  if (existing) return {snapshot:existing,created:false};
  const timestamp=(value:unknown):Date|null=>{
    if (value==null) return null;
    if (typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value)||!/(Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value))) throw new Error('INVALID_OBSERVED_TIMESTAMP');
    return new Date(value);
  };
  const previous=await tx.documentSnapshot.findFirst({where:{documentId},orderBy:{createdAt:'desc'},select:{contentHash:true}});
  const reason=!previous?'INITIAL_IMPORT':Array.isArray(record.textCorrections)&&record.textCorrections.length?'TEXT_CORRECTION':previous.contentHash===hashes.contentHash?'METADATA_CORRECTION':'UNKNOWN';
  const snapshot=await tx.documentSnapshot.create({data:{documentId,...hashes,reason,fullText:record.fullText as string,
    qualityJson:json({parseQuality:record.parseQuality??{},legalReview:record.legalReview??'PENDING',relationshipReview:record.relationshipReview??'PENDING',readyForAutomaticChecklist:false}),
    correctionsJson:json({metadata:record.metadataCorrections??[],text:record.textCorrections??[]}),
    parserVersion:typeof record.parserVersion==='string'?record.parserVersion:null,parsedAt:timestamp(record.parsedAt),
    observedAt:timestamp(record.sourceCollectedAt??record.crawledAt),rawRecordObjectKey:null}});
  return {snapshot,created:true};
}
export async function getOrCreateParse(tx: Prisma.TransactionClient, snapshot: {id:string;fullText:string}, structuredContent: unknown, parserVersion: string, quality: unknown={}) {
  if (!parserVersion.trim()) throw new Error('INVALID_PARSER_VERSION');
  const parsed=prepareParse(snapshot.fullText,structuredContent);
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify(['parse',snapshot.id])},0))::text`;
  const existing=await tx.parseRun.findUnique({where:{parse_version:{snapshotId:snapshot.id,parserVersion,structureHash:parsed.structureHash}}});
  if (existing) {
    if (!existing.sealedAt) throw new Error('INCOMPLETE_EXISTING_PARSE');
    return {parseRun:existing,created:false};
  }
  const run=await tx.parseRun.create({data:{snapshotId:snapshot.id,parserVersion,structureHash:parsed.structureHash,
    structureJson:parsed.structureJson,qualityJson:json(quality)}});
  // Parent-first inserts satisfy the composite parent FK and span guard.
  // One transaction includes the whole tree and its seal; no partially built tree is published.
  for (let start=0;start<parsed.provisions.length;start+=200) await tx.parsedProvision.createMany({
    data:parsed.provisions.slice(start,start+200).map(node=>({...node,parseRunId:run.id,contextJson:json(node.contextJson)}))});
  const sealed=await tx.parseRun.update({where:{id:run.id},data:{sealedAt:new Date()}});
  return {parseRun:sealed,created:true};
}
export async function linkSnapshotSource(tx: Prisma.TransactionClient, documentId:string, snapshotId:string, sourceId:string,
  role:'METADATA'|'CONTENT'|'ATTACHMENT', provenance:unknown) {
  const provenanceJson=json(provenance),provenanceHash=sha256(canonicalJson(provenance));
  return tx.snapshotSource.upsert({where:{snapshotId_sourceId_role_provenanceHash:{snapshotId,sourceId,role,provenanceHash}},
    create:{documentId,snapshotId,sourceId,role,provenanceHash,provenanceJson},update:{}});
}
