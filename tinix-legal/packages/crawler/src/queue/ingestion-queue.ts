import { Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import { mapSourceSite } from '../utils/source-site.js';
import { INGESTION_QUEUE_NAME, INGESTION_JOB_NAME, RawScrapedDocument } from './types.js';

const prisma = new PrismaClient();

// Every crawler module (vbpl, tvpl, chinhphu, phapdien) enqueues here instead
// of calling the persistence pipeline directly — this is what actually lets
// `scheduled`/`full` mode persist data from all 4 sources: previously only
// the VBPL daily-service path called into the ingestion pipeline inline, so
// the other 3 sources scraped data that nothing ever read back. Routing every
// source through one queue also gives every source the same retry/backoff
// and failure-visibility behavior (see ingestion-worker.ts), instead of only
// VBPL's inline call getting error handling.
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export const ingestionQueue = new Queue<RawScrapedDocument>(INGESTION_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
});

// Same rationale as RiskAuditEngine/queue.ts in packages/backend: without an
// 'error' listener, ioredis dumps a full stack trace on every failed
// (re)connect attempt. One short warning per outage replaces that noise.
let loggedQueueUnavailable = false;
ingestionQueue.on('error', (err) => {
  if (!loggedQueueUnavailable) {
    logger.warn(`[IngestionQueue] Redis unavailable, crawl ingestion will not be enqueued until it recovers: ${err.message}`);
    loggedQueueUnavailable = true;
  }
});

/**
 * Enqueue one scraped document for ingestion. Races the enqueue against a
 * short timeout (matching RiskAuditEngine.requestAudit's pattern) because
 * ioredis buffers commands in memory rather than rejecting immediately when
 * Redis is unreachable, which would otherwise hang the caller indefinitely.
 * Throws on failure so callers can decide how to record it (crawlers call
 * this from inside a try/catch per document — see each source module under
 * src/crawlers/).
 */
export async function enqueueRawDocument(doc: RawScrapedDocument): Promise<void> {
  await Promise.race([
    ingestionQueue.add(INGESTION_JOB_NAME, doc),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Ingestion queue enqueue timed out (Redis unreachable?)')), 3000)),
  ]);
}

/**
 * What every crawler module actually calls after scraping a document — a
 * thin wrapper around enqueueRawDocument that also records a CrawlLog
 * 'error' row on failure (e.g. Redis unreachable), instead of leaving that
 * failure visible only in the crawler process's own log file. Centralized
 * here once instead of each of the 4 crawler modules duplicating the same
 * try/catch + CrawlLog boilerplate.
 */
export async function enqueueOrRecordFailure(doc: RawScrapedDocument): Promise<void> {
  try {
    await enqueueRawDocument(doc);
  } catch (err) {
    const msg = (err as Error).message;
    logger.error(`Failed to enqueue ${doc.url} for ingestion: ${msg}`);
    try {
      await prisma.crawlLog.create({
        data: {
          site: mapSourceSite(doc.source),
          url: doc.url || '',
          status: 'error',
          message: `Enqueue failed: ${msg}`,
          documentsFound: 0,
          duration: 0,
        },
      });
    } catch (logErr) {
      logger.error(`Also failed to record CrawlLog for enqueue failure: ${(logErr as Error).message}`);
    }
  }
}

export async function getQueuePendingCount(): Promise<number> {
  const counts = await ingestionQueue.getJobCounts('waiting', 'active', 'delayed');
  return (counts.waiting || 0) + (counts.active || 0) + (counts.delayed || 0);
}

export async function closeIngestionQueue(): Promise<void> {
  await ingestionQueue.close();
}
