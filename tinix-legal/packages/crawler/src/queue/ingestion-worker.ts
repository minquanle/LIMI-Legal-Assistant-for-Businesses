import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import { mapSourceSite } from '../utils/source-site.js';
import { ingestDocument } from '../pipeline/ingestion.js';
import { INGESTION_QUEUE_NAME, RawScrapedDocument } from './types.js';
import { getQueuePendingCount } from './ingestion-queue.js';

const prisma = new PrismaClient();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

/**
 * Consumer side of the ingestion queue. Every crawler source (vbpl, tvpl,
 * chinhphu, phapdien) enqueues here via ingestion-queue.ts; this worker is
 * the only place that calls the actual persistence pipeline for those jobs.
 * Fixes two things at once: (1) `scheduled`/`full` crawl modes now actually
 * write to the database for all 4 sources, not just VBPL; (2) a failure from
 * ANY source is now recorded as an 'error' CrawlLog row (previously only the
 * VBPL-only inline call ever wrote CrawlLog, and only for success/partial —
 * failures from the other 3 sources were invisible to the admin UI).
 */
export function startIngestionWorker(concurrency = 2): Worker<RawScrapedDocument> {
  const worker = new Worker<RawScrapedDocument>(
    INGESTION_QUEUE_NAME,
    async (job: Job<RawScrapedDocument>) => {
      return ingestDocument(job.data);
    },
    { connection, concurrency }
  );

  let loggedWorkerUnavailable = false;
  worker.on('error', (err) => {
    if (!loggedWorkerUnavailable) {
      logger.warn(`[IngestionWorker] Lost Redis connection, will keep retrying: ${err.message}`);
      loggedWorkerUnavailable = true;
    }
  });
  worker.on('ready', () => {
    loggedWorkerUnavailable = false;
  });

  worker.on('failed', async (job, err) => {
    logger.error(`[IngestionWorker] Job ${job?.id} failed for ${job?.data?.url}: ${err.message}`);
    if (!job) return;
    try {
      await prisma.crawlLog.create({
        data: {
          site: mapSourceSite(job.data.source),
          url: job.data.url || '',
          status: 'error',
          message: `Ingestion failed: ${err.message}`,
          documentsFound: 0,
          duration: 0,
        },
      });
    } catch (logErr) {
      logger.error(`[IngestionWorker] Also failed to record CrawlLog for failed job: ${(logErr as Error).message}`);
    }
  });

  return worker;
}

/**
 * Block until the ingestion queue has no waiting/active/delayed jobs left,
 * or `maxWaitMs` elapses. Used by one-shot crawl modes (`oneshot`, `full`)
 * which exit after a single pass — without this, documents enqueued near the
 * end of a crawl would be dropped when the process exits before the worker
 * gets to them.
 */
export async function waitForQueueDrain(maxWaitMs = 10 * 60 * 1000, pollMs = 2000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const pending = await getQueuePendingCount();
    if (pending === 0) return;
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  logger.warn('[IngestionWorker] Queue drain wait timed out with jobs still pending');
}
