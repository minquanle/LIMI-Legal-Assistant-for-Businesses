import { PrismaClient } from '@prisma/client';
import { ParsedMetadata, extractMetadataFromRaw } from '../parsers/metadata-parser.js';
import { parseLegalText, flattenAST } from '@tinix-legal/shared';
import logger from '../utils/logger.js';
import { validateRawDocument } from './validate.js';
import { persistDocument } from './persist.js';
import { storeDocumentHtml, sanitizeHtml, convertHtmlToMarkdownText } from './storage.js';
import { storeEmbedding } from './embedding.js';
import { RawScrapedDocument } from '../queue/types.js';
import { mapSourceSite } from '../utils/source-site.js';

const prisma = new PrismaClient();

/**
 * Ingestion orchestrator: sanitize → parse AST → validate → persist
 * (transactional) → best-effort side effects (MinIO, embedding) → CrawlLog.
 * Called both directly (vbpl-daily-service.ts's early-exit-checked path) and
 * as the job processor for the ingestion queue (queue/ingestion-worker.ts) —
 * one code path for both, so behavior (validation, transaction safety,
 * CrawlLog visibility) is identical regardless of which route a document
 * came in through.
 *
 * Returns the persisted document, or null if the document was rejected by
 * validation (recorded as a 'skipped' CrawlLog, not retried by the queue).
 */
export async function ingestDocument(rawDoc: RawScrapedDocument) {
  const partialFailures: string[] = [];

  const metadata: ParsedMetadata = extractMetadataFromRaw(rawDoc.metadata || {}, rawDoc.title);

  const documentFullText = rawDoc.contentHtml
    ? convertHtmlToMarkdownText(rawDoc.contentHtml)
    : (rawDoc.fullText || '');

  const validation = validateRawDocument(rawDoc, metadata);
  if (!validation.valid) {
    logger.warn(`Skipping document (validation failed: ${validation.reason}): ${rawDoc.url}`);
    await prisma.crawlLog.create({
      data: {
        site: mapSourceSite(rawDoc.source),
        url: rawDoc.url || '',
        status: 'skipped',
        message: `Validation failed: ${validation.reason}`,
        documentsFound: 0,
        duration: 0,
      },
    }).catch((err) => logger.error(`Failed to record skipped CrawlLog: ${(err as Error).message}`));
    return null;
  }

  const parsedDoc = parseLegalText(documentFullText);
  const astTree = parsedDoc.isParsed ? parsedDoc.astNodes : [];
  const flattenedNodes = flattenAST(astTree);

  const doc = await persistDocument(rawDoc, metadata, documentFullText, astTree, flattenedNodes);

  if (rawDoc.contentHtml) {
    try {
      await storeDocumentHtml(doc.id, doc.documentNumber, rawDoc.source || 'vbpl.vn', rawDoc.url || '', rawDoc.contentHtml);
    } catch (err) {
      logger.error(`Failed to store HTML or link DocumentSource for doc ${doc.documentNumber}: ${(err as Error).message}`);
      partialFailures.push('minio_storage');
    }
  }

  try {
    await storeEmbedding(doc.id, doc.documentNumber, metadata.title, metadata.trichYeu);
  } catch (err) {
    logger.error(`Failed to store vector embedding for doc ${doc.documentNumber}: ${(err as Error).message}`);
    partialFailures.push('vector_embedding');
  }

  const baseMessage = `Ingested ${metadata.documentNumber} (${astTree.length} AST root nodes, ${metadata.relationships?.length || 0} relations)`;
  await prisma.crawlLog.create({
    data: {
      site: mapSourceSite(rawDoc.source),
      url: rawDoc.url || '',
      status: partialFailures.length > 0 ? 'partial' : 'success',
      message: partialFailures.length > 0 ? `${baseMessage} — FAILED: ${partialFailures.join(', ')}` : baseMessage,
      documentsFound: 1,
      duration: 0,
    },
  });

  logger.info(`Ingested document ${metadata.documentNumber} with ${flattenedNodes.length} AST nodes & ${metadata.relationships?.length || 0} relationships`);
  return doc;
}
