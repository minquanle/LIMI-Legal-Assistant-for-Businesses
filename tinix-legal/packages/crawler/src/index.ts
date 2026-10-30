import 'dotenv/config';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import logger from './utils/logger.js';
import { runVbplCrawler } from './crawlers/vbpl/index.js';
import { runVbplDailyCrawl } from './services/vbpl-daily-service.js';
import { runChinhphuCrawler } from './crawlers/chinhphu/index.js';
import { runPhapdienCrawler } from './crawlers/phapdien/index.js';
import { runTvplCrawler } from './crawlers/tvpl/index.js';
import { updateHeartbeat, setHeartbeatStopped } from './utils/heartbeat.js';
import { startIngestionWorker, waitForQueueDrain } from './queue/ingestion-worker.js';
import { closeIngestionQueue } from './queue/ingestion-queue.js';
import { mapSourceSite } from './utils/source-site.js';

const prisma = new PrismaClient();

/**
 * Main entry point for the Vietnam Legal Document Crawler System.
 *
 * Modes (CRAWL_MODE env var):
 *  1. 'oneshot' (default): run one VBPL daily incremental sweep, then exit.
 *  2. 'daily': run the VBPL daily incremental sweep on a repeating cron
 *     schedule (CRAWL_SCHEDULE), long-running.
 *  3. 'scheduled': run all 4 sources (runAllCrawlers) on a repeating cron
 *     schedule, long-running.
 *  4. 'full': run all 4 sources (runAllCrawlers) once, then exit — a deeper
 *     one-off scan across every source, as opposed to 'oneshot' which only
 *     ever touches VBPL.
 *
 * All 4 site crawlers (vbpl, tvpl, chinhphu, phapdien) enqueue scraped
 * documents onto the ingestion queue (queue/ingestion-queue.ts) rather than
 * writing to the database inline; the worker started below is what actually
 * persists them. This process hosts both the producer (crawl) and consumer
 * (ingestion worker) side by side so a single `npx tsx src/index.ts`
 * invocation is still self-contained — no separate worker process to babysit
 * — while keeping scraping and persistence as decoupled queue stages.
 */
const DAILY_SCHEDULE = process.env.CRAWL_SCHEDULE || '0 2 * * *'; // Default 2:00 AM daily
const MODE = process.env.CRAWL_MODE || 'oneshot'; // 'oneshot' | 'daily' | 'scheduled'
const DAILY_MAX_PAGES = parseInt(process.env.DAILY_MAX_PAGES || '10', 10); // Top N newest pages per keyword

async function runDailySweep() {
  logger.info('═══════════════════════════════════════════════════');
  logger.info(`Starting Daily Sweep — top ${DAILY_MAX_PAGES} pages/keyword (VBPL Incremental + Lược đồ Fulltext)`);
  logger.info('═══════════════════════════════════════════════════');

  try {
    await runVbplDailyCrawl({
      maxPagesPerKeyword: DAILY_MAX_PAGES,
      harvestFullTextRelations: true,
    });
  } catch (err) {
    logger.error(`Daily sweep failed: ${(err as Error).message}`);
  }
}

async function runAllCrawlers() {
  const startTime = Date.now();
  logger.info('═══════════════════════════════════════════════════');
  logger.info('Starting full crawl cycle for all sources...');
  logger.info('═══════════════════════════════════════════════════');

  const results: Array<{ source: string; status: string; error?: string }> = [];

  // Each top-level source failure is also written to CrawlLog (not just the
  // process log file) — previously only VBPL's inline ingest call ever
  // wrote CrawlLog, so a failure in any of these other 3 sources was
  // invisible to the admin UI / GET /api/admin/crawler/logs.
  const recordTopLevelFailure = async (source: string, msg: string) => {
    try {
      await prisma.crawlLog.create({
        data: { site: mapSourceSite(source), url: '', status: 'error', message: `Crawl cycle failed: ${msg}`, documentsFound: 0, duration: 0 },
      });
    } catch (logErr) {
      logger.error(`Failed to record CrawlLog for ${source} failure: ${(logErr as Error).message}`);
    }
  };

  try {
    logger.info('--- [1/4] VBPL.vn ---');
    await runVbplCrawler({ maxPages: 5 });
    results.push({ source: 'vbpl.vn', status: 'success' });
  } catch (err) {
    const msg = (err as Error).message;
    logger.error(`VBPL.vn crawler failed: ${msg}`);
    results.push({ source: 'vbpl.vn', status: 'error', error: msg });
    await recordTopLevelFailure('vbpl.vn', msg);
  }

  try {
    logger.info('--- [2/4] Chinhphu.vn ---');
    await runChinhphuCrawler({ maxPages: 5 });
    results.push({ source: 'chinhphu.vn', status: 'success' });
  } catch (err) {
    const msg = (err as Error).message;
    logger.error(`Chinhphu.vn crawler failed: ${msg}`);
    results.push({ source: 'chinhphu.vn', status: 'error', error: msg });
    await recordTopLevelFailure('chinhphu.vn', msg);
  }

  try {
    logger.info('--- [3/4] Pháp điển MOJ ---');
    await runPhapdienCrawler({ maxPages: 3 });
    results.push({ source: 'phapdien.moj.gov.vn', status: 'success' });
  } catch (err) {
    const msg = (err as Error).message;
    logger.error(`Pháp điển crawl failed: ${msg}`);
    results.push({ source: 'phapdien.moj.gov.vn', status: 'error', error: msg });
    await recordTopLevelFailure('phapdien.moj.gov.vn', msg);
  }

  try {
    logger.info('--- [4/4] TVPL & LuatVN ---');
    await runTvplCrawler({ maxPages: 3, site: 'both', mode: 'daily' });
    results.push({ source: 'tvpl+luatvietnam', status: 'success' });
  } catch (err) {
    const msg = (err as Error).message;
    logger.error(`TVPL/LuatVN crawl failed: ${msg}`);
    results.push({ source: 'tvpl+luatvietnam', status: 'error', error: msg });
    await recordTopLevelFailure('tvpl+luatvietnam', msg);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info('═══════════════════════════════════════════════════');
  logger.info(`Crawl cycle complete in ${elapsed}s`);
  logger.info(`Results: ${JSON.stringify(results, null, 2)}`);
  logger.info('═══════════════════════════════════════════════════');

  return results;
}

async function main() {
  updateHeartbeat({ status: 'RUNNING', message: 'Crawler process starting...' });
  const hbInterval = setInterval(() => {
    updateHeartbeat({});
  }, 10000);

  // Started once, up front, so it's already consuming jobs concurrently
  // while the crawlers below are still producing them (rather than only
  // starting to drain the queue after crawling finishes).
  const ingestionWorker = startIngestionWorker();

  const cleanup = async (msg: string) => {
    clearInterval(hbInterval);
    await ingestionWorker.close().catch(() => {});
    await closeIngestionQueue().catch(() => {});
    setHeartbeatStopped(msg);
  };

  process.on('SIGINT', async () => {
    await cleanup('Process killed (SIGINT)');
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await cleanup('Process terminated (SIGTERM)');
    process.exit(0);
  });

  if (MODE === 'daily') {
    logger.info(`Crawler daily scheduled mode: "${DAILY_SCHEDULE}"`);
    updateHeartbeat({ message: 'Running initial daily sweep...' });
    logger.info('Running initial daily sweep...');
    await runDailySweep();

    cron.schedule(DAILY_SCHEDULE, async () => {
      updateHeartbeat({ message: 'Triggering scheduled daily sweep' });
      logger.info('Triggering scheduled daily sweep');
      await runDailySweep();
      updateHeartbeat({ message: 'Scheduled daily sweep complete, waiting for next run' });
    });

    logger.info('Daily crawler scheduler is active. Press Ctrl+C to exit.');
    updateHeartbeat({ message: 'Scheduler active, waiting for next run' });
  } else if (MODE === 'scheduled') {
    logger.info(`Crawler scheduled mode: "${DAILY_SCHEDULE}"`);
    updateHeartbeat({ message: 'Running initial full crawl...' });
    await runAllCrawlers();
    updateHeartbeat({ message: 'Initial full crawl complete, waiting for next run' });
    cron.schedule(DAILY_SCHEDULE, async () => {
      updateHeartbeat({ message: 'Triggering scheduled full crawl' });
      await runAllCrawlers();
      updateHeartbeat({ message: 'Scheduled full crawl complete, waiting for next run' });
    });
  } else if (MODE === 'full') {
    // Full deep scan: run all crawlers once, wait for every enqueued
    // document to finish ingesting, then exit. Without the drain, documents
    // enqueued near the end of the crawl would be silently dropped when the
    // process exits before the worker gets to them.
    updateHeartbeat({ message: 'Running full deep scan (all sources)...' });
    await runAllCrawlers();
    updateHeartbeat({ message: 'Draining ingestion queue...' });
    await waitForQueueDrain();
    await cleanup('Full deep scan complete');
    process.exit(0);
  } else {
    // One-shot incremental daily sweep
    updateHeartbeat({ message: `Running daily incremental sweep (top ${DAILY_MAX_PAGES} pages/keyword)...` });
    await runDailySweep();
    await waitForQueueDrain();
    await cleanup('Daily incremental sweep complete');
    process.exit(0);
  }
}

main().catch((err) => {
  setHeartbeatStopped(`Fatal error: ${err.message}`);
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
