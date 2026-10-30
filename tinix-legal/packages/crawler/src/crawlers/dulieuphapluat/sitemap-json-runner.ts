import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import os from 'os';
import { CheerioCrawler } from 'crawlee';
import * as cheerio from 'cheerio';
import { config } from '../../config.js';
import logger from '../../utils/logger.js';
import { assertCrawlAllowed, fetchRobotsRules, isPathAllowed, type RobotsRules } from '../../utils/robots.js';

/**
 * Generic sitemap-driven → gzip-JSON-batch crawler, factored out of
 * dulieuphapluat/index.ts so dulieuphapluat.vn's other content types (tax
 * registry, form templates, legal glossary — see crawlers/dulieuphapluat-datasets/)
 * can reuse the same discovery/progress/batching machinery instead of each
 * re-implementing it. JSON-only by design (no DB/queue path) — these
 * datasets have no CanonicalDocument-shaped representation, so there is
 * nothing for persist.ts to do with them; the local gzip batch dump is the
 * only output.
 */

const BASE_URL = 'https://dulieuphapluat.vn';
const DEFAULT_JSON_BATCH_SIZE = 1000;

interface ProgressState {
  totalSitemaps: number;
  lastCompletedSitemapIndex: number;
  totalUrlsProcessed: number;
  nextJsonBatchIndex: number;
  updatedAt: string;
}

function loadProgress(progressFile: string): ProgressState {
  try {
    if (fs.existsSync(progressFile)) {
      const parsed = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
      return { nextJsonBatchIndex: 0, ...parsed };
    }
  } catch (err) {
    logger.warn(`Could not read ${progressFile}, starting fresh: ${(err as Error).message}`);
  }
  return { totalSitemaps: 0, lastCompletedSitemapIndex: 0, totalUrlsProcessed: 0, nextJsonBatchIndex: 0, updatedAt: new Date().toISOString() };
}

function saveProgress(progressFile: string, state: ProgressState) {
  try {
    fs.writeFileSync(progressFile, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
  } catch (err) {
    logger.warn(`Could not write ${progressFile}: ${(err as Error).message}`);
  }
}

function extractLocs(xml: string): string[] {
  const matches = xml.match(/<loc>([\s\S]*?)<\/loc>/g) || [];
  return matches.map((m) => m.replace(/<\/?loc>/g, '').trim());
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': config.userAgent }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

/**
 * Resolves a sitemap URL into the flat list of DETAIL page URLs it (or its
 * children, one level of index nesting) contains. Some of dulieuphapluat.vn's
 * top-level sitemaps (sitemapform.xml, sitemaptax.xml, sitemap-terms.xml)
 * are themselves `<sitemapindex>` documents pointing at per-batch child
 * sitemaps; others (sitemap-mst-khu-vuc.xml) list URLs directly. Detected
 * by checking for `<sitemapindex` in the raw XML rather than assuming a
 * fixed shape.
 */
async function resolveSitemapFiles(indexUrlOrUrls: string | string[]): Promise<string[]> {
  const entries = Array.isArray(indexUrlOrUrls) ? indexUrlOrUrls : [indexUrlOrUrls];
  const all: string[] = [];
  for (const indexUrl of entries) {
    const xml = await fetchText(indexUrl);
    if (xml.includes('<sitemapindex')) {
      all.push(...extractLocs(xml));
    } else {
      all.push(indexUrl); // already a leaf sitemap containing URLs directly
    }
  }
  return all;
}

class JsonBatchWriter {
  private buffer: Record<string, unknown>[] = [];
  constructor(
    private outputDir: string,
    private batchSize: number,
    private progress: ProgressState,
    private progressFile: string,
    private filePrefix: string,
  ) {
    fs.mkdirSync(this.outputDir, { recursive: true });
  }
  add(doc: Record<string, unknown>) {
    this.buffer.push(doc);
    if (this.buffer.length >= this.batchSize) this.flush();
  }
  flush() {
    if (this.buffer.length === 0) return;
    const idx = this.progress.nextJsonBatchIndex++;
    const filename = `${this.filePrefix}${String(idx).padStart(5, '0')}.json.gz`;
    const filePath = path.join(this.outputDir, filename);
    const gz = zlib.gzipSync(Buffer.from(JSON.stringify(this.buffer), 'utf-8'));
    fs.writeFileSync(filePath, gz);
    logger.info(`[${this.filePrefix}]: wrote ${this.buffer.length} records to ${filename} (${gz.length} bytes gzipped)`);
    this.buffer = [];
    saveProgress(this.progressFile, this.progress);
  }
}

type ParseResult = Record<string, unknown> | Record<string, unknown>[] | null;

/**
 * Incremental-update mode: instead of walking sitemaps by progress index,
 * fetch every sitemap, diff its URLs against the set already collected in
 * jsonOutputDir, and crawl only the new ones into fresh upd-* batch files.
 */
export interface UpdateModeOptions {
  maxNewUrls?: number;
  resultFile?: string; // JSON summary written when the run ends (read by the backend job runner)
}

export interface SitemapJsonCrawlOptions {
  datasetName: string; // used only for log lines, e.g. "dulieuphapluat-tax"
  sitemapIndexUrl: string | string[]; // e.g. https://dulieuphapluat.vn/sitemaptax.xml — an array combines multiple independent top-level sitemaps (e.g. sitemap-gia-dat-duong-1/2/3.xml, which aren't wrapped in a shared index)
  progressFilePath: string;
  jsonOutputDir: string;
  jsonBatchSize?: number;
  filePrefix: string; // e.g. 'batch-' or 'batch-s2-'
  /**
   * Parses one page into a record, an array of records (for pages that list
   * many rows — e.g. dulieuphapluat.vn's province-level lookup tools, one
   * page per province/table with dozens of `<tr>` rows), or null to skip
   * the page (e.g. missing required fields).
   */
  parseDetailPage: ($: cheerio.CheerioAPI, url: string) => ParseResult | Promise<ParseResult>;
  maxSitemaps?: number;
  runAll?: boolean;
  startFresh?: boolean;
  shardIndex?: number;
  shardCount?: number;
  update?: UpdateModeOptions;
}

export async function runSitemapJsonCrawl(opts: SitemapJsonCrawlOptions) {
  if (opts.update) return runSitemapJsonUpdate(opts, opts.update);
  const shardCount = opts.shardCount && opts.shardCount > 1 ? opts.shardCount : 1;
  const shardIndex = opts.shardIndex ?? 0;
  const shardLabel = shardCount > 1 ? ` [shard ${shardIndex}/${shardCount}]` : '';
  const tag = `[${opts.datasetName}]${shardLabel}`;

  if (!(await assertCrawlAllowed(BASE_URL, opts.datasetName))) return;
  const robotsRules = await fetchRobotsRules(BASE_URL);

  let progress = loadProgress(opts.progressFilePath);
  if (opts.startFresh) {
    progress = { totalSitemaps: 0, lastCompletedSitemapIndex: 0, totalUrlsProcessed: 0, nextJsonBatchIndex: 0, updatedAt: new Date().toISOString() };
  }

  let allSitemapFiles: string[];
  try {
    allSitemapFiles = await resolveSitemapFiles(opts.sitemapIndexUrl);
  } catch (err) {
    logger.error(`${tag}: failed to resolve sitemap index: ${(err as Error).message}`);
    return;
  }

  const sitemapFiles = shardCount > 1 ? allSitemapFiles.filter((_u, i) => i % shardCount === shardIndex) : allSitemapFiles;
  progress.totalSitemaps = sitemapFiles.length;

  const startIndex = progress.lastCompletedSitemapIndex;
  const endIndex = opts.runAll ? sitemapFiles.length : Math.min(sitemapFiles.length, startIndex + (opts.maxSitemaps ?? 1));

  if (startIndex >= sitemapFiles.length) {
    logger.info(`${tag}: all ${sitemapFiles.length} assigned sitemap files already processed`);
    return;
  }

  const jsonWriter = new JsonBatchWriter(opts.jsonOutputDir, opts.jsonBatchSize || DEFAULT_JSON_BATCH_SIZE, progress, opts.progressFilePath, opts.filePrefix);

  logger.info(`${tag}: processing sitemap files ${startIndex + 1}-${endIndex} of ${sitemapFiles.length} sequentially`);

  for (let i = startIndex; i < endIndex; i++) {
    const sitemapUrl = sitemapFiles[i];
    const urlsProcessed = await processSitemapFile(tag, sitemapUrl, robotsRules, opts.parseDetailPage, jsonWriter);
    progress.lastCompletedSitemapIndex = i + 1;
    progress.totalUrlsProcessed += urlsProcessed;
    saveProgress(opts.progressFilePath, progress);
    logger.info(`${tag}: completed sitemap ${i + 1}/${sitemapFiles.length} (${sitemapUrl}) — ${urlsProcessed} URLs; ${progress.totalUrlsProcessed} total so far`);
  }

  jsonWriter.flush();
  logger.info(`${tag}: batch finished`);
}

async function processSitemapFile(
  tag: string,
  sitemapUrl: string,
  robotsRules: RobotsRules,
  parseDetailPage: SitemapJsonCrawlOptions['parseDetailPage'],
  jsonWriter: JsonBatchWriter,
): Promise<number> {
  let xml: string;
  try {
    xml = await fetchText(sitemapUrl);
  } catch (err) {
    logger.error(`${tag}: failed to fetch ${sitemapUrl}: ${(err as Error).message}`);
    return 0;
  }

  const docUrls = extractLocs(xml).filter((u) => {
    try {
      return isPathAllowed(robotsRules, new URL(u).pathname);
    } catch {
      return false;
    }
  });
  if (docUrls.length === 0) return 0;

  const crawler = new CheerioCrawler({
    maxConcurrency: config.concurrency,
    maxRequestsPerMinute: config.maxRequestsPerMinute,
    maxRequestRetries: config.retryCount,
    requestHandlerTimeoutSecs: config.requestTimeoutSecs,
    async requestHandler({ request, $ }) {
      const result = await parseDetailPage($ as any, request.url);
      if (!result) return;
      const records = Array.isArray(result) ? result : [result];
      for (const r of records) jsonWriter.add(r);
      logger.info(`${tag}: extracted ${request.url} (${records.length} record${records.length === 1 ? '' : 's'})`);
    },
    failedRequestHandler({ request }, error) {
      logger.error(`${tag}: request failed: ${request.url}`, { error: error.message });
    },
  });

  await crawler.run(docUrls.map((url) => ({ url })));
  return docUrls.length;
}

// ─────────────────────────────────────────────────────────────────────────
// Incremental update mode
// ─────────────────────────────────────────────────────────────────────────

const KNOWN_URLS_FILE = '.known-urls.txt';

/**
 * Set of detail-page URLs already collected in `outputDir`. Built once by
 * scanning every existing gzip batch (records carry their page URL in `url`
 * or, for the table/directory tools, `sourceUrl`; some batches nest one
 * page's rows as a sub-array) and cached in `.known-urls.txt` so later runs
 * only read the cache. New URLs are appended to the cache after each run.
 */
function loadKnownUrls(outputDir: string, tag: string): Set<string> {
  const cacheFile = path.join(outputDir, KNOWN_URLS_FILE);
  const known = new Set<string>();
  if (fs.existsSync(cacheFile)) {
    for (const line of fs.readFileSync(cacheFile, 'utf-8').split('\n')) if (line) known.add(line);
    return known;
  }

  const files = fs.existsSync(outputDir) ? fs.readdirSync(outputDir).filter((f) => f.endsWith('.json.gz')) : [];
  logger.info(`${tag}: building known-URL index from ${files.length} existing batch files (first update run only)`);
  for (const file of files) {
    try {
      const arr = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(outputDir, file))).toString('utf-8'));
      for (const item of arr) {
        for (const rec of Array.isArray(item) ? item : [item]) {
          const u = (rec && (rec.url || rec.sourceUrl)) as string | undefined;
          if (u) known.add(u);
        }
      }
    } catch (err) {
      logger.warn(`${tag}: skipping unreadable batch ${file}: ${(err as Error).message}`);
    }
  }
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(cacheFile, [...known].join('\n') + (known.size ? '\n' : ''), 'utf-8');
  logger.info(`${tag}: known-URL index built: ${known.size} URLs`);
  return known;
}

function writeUpdateResult(file: string | undefined, result: Record<string, unknown>) {
  if (!file) return;
  try {
    fs.writeFileSync(file, JSON.stringify(result, null, 2), 'utf-8');
  } catch (err) {
    logger.warn(`Could not write update result ${file}: ${(err as Error).message}`);
  }
}

async function runSitemapJsonUpdate(opts: SitemapJsonCrawlOptions, update: UpdateModeOptions) {
  const started = Date.now();
  const tag = `[${opts.datasetName}:update]`;
  const result: Record<string, unknown> = {
    dataset: opts.datasetName,
    sitemapUrlsSeen: 0,
    newUrls: 0,
    crawledUrls: 0,
    failedUrls: 0,
    recordsWritten: 0,
    outputFiles: [] as string[],
    truncated: false,
    error: null,
    durationMs: 0,
  };
  const finish = () => {
    result.durationMs = Date.now() - started;
    writeUpdateResult(update.resultFile, result);
  };

  try {
    if (!(await assertCrawlAllowed(BASE_URL, opts.datasetName))) {
      result.error = 'robots.txt disallows crawling';
      return finish();
    }
    const robotsRules = await fetchRobotsRules(BASE_URL);
    const known = loadKnownUrls(opts.jsonOutputDir, tag);

    // 1. Diff every sitemap against what we already have.
    const leafSitemaps = await resolveSitemapFiles(opts.sitemapIndexUrl);
    const newUrls: string[] = [];
    const seenThisRun = new Set<string>();
    for (const sm of leafSitemaps) {
      let xml: string;
      try {
        xml = await fetchText(sm);
      } catch (err) {
        logger.error(`${tag}: failed to fetch ${sm}: ${(err as Error).message}`);
        result.failedSitemaps = ((result.failedSitemaps as number) || 0) + 1;
        continue;
      }
      for (const u of extractLocs(xml)) {
        result.sitemapUrlsSeen = (result.sitemapUrlsSeen as number) + 1;
        if (known.has(u) || seenThisRun.has(u)) continue;
        try {
          if (!isPathAllowed(robotsRules, new URL(u).pathname)) continue;
        } catch {
          continue;
        }
        seenThisRun.add(u);
        newUrls.push(u);
      }
    }
    result.newUrls = newUrls.length;
    logger.info(`${tag}: ${newUrls.length} new URLs out of ${result.sitemapUrlsSeen} in sitemaps`);

    const cap = update.maxNewUrls && update.maxNewUrls > 0 ? update.maxNewUrls : Infinity;
    const toCrawl = newUrls.slice(0, cap);
    if (toCrawl.length < newUrls.length) {
      result.truncated = true; // remaining ones stay unknown and get picked up by the next run
      logger.warn(`${tag}: capped at ${cap} URLs this run, ${newUrls.length - toCrawl.length} deferred`);
    }
    if (toCrawl.length === 0) return finish();

    // 2. Crawl only the new URLs into fresh upd-* batch files.
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
    const progress: ProgressState = { totalSitemaps: 0, lastCompletedSitemapIndex: 0, totalUrlsProcessed: 0, nextJsonBatchIndex: 0, updatedAt: new Date().toISOString() };
    const tmpProgress = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'upd-')), 'progress.json');
    const prefix = `upd-${stamp}-`;
    const writer = new JsonBatchWriter(opts.jsonOutputDir, opts.jsonBatchSize || DEFAULT_JSON_BATCH_SIZE, progress, tmpProgress, prefix);
    const okUrls: string[] = [];

    const crawler = new CheerioCrawler({
      maxConcurrency: config.concurrency,
      maxRequestsPerMinute: config.maxRequestsPerMinute,
      maxRequestRetries: config.retryCount,
      requestHandlerTimeoutSecs: config.requestTimeoutSecs,
      async requestHandler({ request, $ }) {
        const parsed = await opts.parseDetailPage($ as any, request.url);
        okUrls.push(request.url); // fetched fine even if the page had nothing to extract, so don't refetch it forever
        if (!parsed) return;
        const records = Array.isArray(parsed) ? parsed : [parsed];
        for (const r of records) writer.add(r);
        result.recordsWritten = (result.recordsWritten as number) + records.length;
      },
      failedRequestHandler({ request }, error) {
        result.failedUrls = (result.failedUrls as number) + 1;
        logger.error(`${tag}: request failed: ${request.url}`, { error: error.message });
      },
    });
    await crawler.run(toCrawl.map((url) => ({ url })));
    writer.flush();

    result.crawledUrls = okUrls.length;
    result.outputFiles = fs.readdirSync(opts.jsonOutputDir).filter((f) => f.startsWith(prefix)).map((f) => path.join(opts.jsonOutputDir, f));
    if (okUrls.length) fs.appendFileSync(path.join(opts.jsonOutputDir, KNOWN_URLS_FILE), okUrls.join('\n') + '\n', 'utf-8');
    logger.info(`${tag}: done — ${okUrls.length} pages crawled, ${result.recordsWritten} records, ${result.failedUrls} failed`);
  } catch (err) {
    result.error = (err as Error).message;
    logger.error(`${tag}: update failed: ${(err as Error).message}`);
  }
  finish();
}
