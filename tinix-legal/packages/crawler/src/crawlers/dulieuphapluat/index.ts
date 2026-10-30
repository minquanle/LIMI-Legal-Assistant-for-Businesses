import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { CheerioCrawler, Dataset } from 'crawlee';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';
import { config } from '../../config.js';
import logger from '../../utils/logger.js';
import { enqueueOrRecordFailure } from '../../queue/ingestion-queue.js';
import { assertCrawlAllowed, fetchRobotsRules, isPathAllowed } from '../../utils/robots.js';
import { extractMetadataFromRaw } from '../../parsers/metadata-parser.js';
import { convertHtmlToMarkdownText } from '../../pipeline/storage.js';

const prisma = new PrismaClient();
const BASE_URL = 'https://dulieuphapluat.vn';
const SITEMAP_INDEX_URL = `${BASE_URL}/sitemap.xml`;

/**
 * dulieuphapluat.vn Crawler Module
 *
 * A commercial third-party legal-document aggregator (~1.08M pages across
 * its 217 `postSiteMapN.xml` sub-sitemaps, verified live), not a government
 * source. robots.txt (`Allow: /`, `Crawl-delay: 2`, `Disallow: /van-ban-docx/`,
 * `Disallow: /lien-quan-van-ban-phap-ly.html`) explicitly permits crawling —
 * this module discovers document URLs from the published sitemaps (the
 * site's own intended URL list) rather than brute-forcing the numeric ID
 * suffix, and never follows the disallowed `/van-ban-docx/` Word-download
 * links. The default `config.maxRequestsPerMinute` (30 = one request/2s)
 * already matches the mandated Crawl-delay.
 *
 * Two output modes:
 *  - 'db' (default): enqueues onto the ingestion queue like every other
 *    crawler module (see queue/ingestion-queue.ts), for the usual
 *    parse → persist → CanonicalDocument pipeline.
 *  - 'json': bypasses the queue/DB entirely and instead writes parsed
 *    documents to local gzip-compressed batch files (see JsonBatchWriter)
 *    — a local staging dump for out-of-band review, not going through
 *    persist.ts. Each record uses the project's own ParsedMetadata shape
 *    (metadata-parser.ts's extractMetadataFromRaw) plus fullText
 *    (storage.ts's convertHtmlToMarkdownText) — the site's own detail page
 *    was checked for any structured data beyond this (the "Lược đồ"
 *    relationship tab, "Văn bản gốc"/"Tiếng Anh" tabs) and found nothing
 *    extractable: the relationship diagram is populated by client-side
 *    JS/AJAX after load (empty `<ul>`s in the static HTML), and the other
 *    two tabs are "đang được cập nhật" (not yet populated) on essentially
 *    every document.
 *
 * Progress (which sitemap files have been fully processed, and — in json
 * mode — the next batch file index) is persisted to
 * `dulieuphapluat-progress.json` in the crawler process's cwd, mirroring
 * utils/heartbeat.ts's plain-JSON-file pattern — a full run is expected to
 * span process restarts (~1.08M pages / 30 req/min ≈ 25 days at 1x), and in
 * 'db' mode document upserts are idempotent (CanonicalDocument's
 * stable source identities) so re-processing
 * a sitemap file is safe but wasteful; resuming from the last completed
 * file avoids that.
 *
 * Optional sharding (shardIndex/shardCount, same convention as
 * services/backfill-service.ts's diacritic-remediation mode): splits the
 * 217 sitemap files round-robin across N independently-run processes, each
 * with its own progress file (`dulieuphapluat-progress-s{N}.json`) and
 * gzip-batch filename prefix (`batch-s{N}-00000.json.gz`) so they never
 * collide. Each shard still self-rate-limits to `config.maxRequestsPerMinute`
 * (default 30/min, matching the site's `Crawl-delay: 2`), so N shards run
 * concurrently means N× that aggregate request rate against the site — the
 * user explicitly chose this over staying within the site's suggested
 * Crawl-delay, accepting the added risk of the site throttling/blocking the
 * source IP, in exchange for finishing in ~1/N of the time.
 */
const DEFAULT_JSON_OUTPUT_DIR = path.resolve(process.cwd(), 'data', 'dulieuphapluat');
const DEFAULT_JSON_BATCH_SIZE = 1000;

function progressFilePath(shardIndex?: number, shardCount?: number): string {
  const suffix = shardCount && shardCount > 1 ? `-s${shardIndex}` : '';
  return path.resolve(process.cwd(), `dulieuphapluat-progress${suffix}.json`);
}

interface ProgressState {
  totalSitemaps: number;
  lastCompletedSitemapIndex: number; // 1-based index into postSiteMap{N}.xml; 0 = none done yet
  totalUrlsProcessed: number;
  nextJsonBatchIndex: number; // next gzip batch filename index to write, in json mode
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
  const res = await fetch(url, {
    headers: { 'User-Agent': config.userAgent },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

/**
 * Fetches the sitemap index and returns the ordered list of sub-sitemap
 * URLs (`postSiteMap1.xml`..`postSiteMapN.xml`).
 */
async function fetchSitemapIndex(): Promise<string[]> {
  const xml = await fetchText(SITEMAP_INDEX_URL);
  return extractLocs(xml);
}

/**
 * Buffers parsed documents in memory and flushes them as one
 * gzip-compressed JSON array file (`batch-00001.json.gz`, ...) once the
 * buffer reaches `batchSize` — avoids creating ~1M tiny files on disk for a
 * full run, and keeps each file's uncompressed JSON small enough to
 * `JSON.parse` back in one shot for later review.
 */
class JsonBatchWriter {
  private buffer: Record<string, unknown>[] = [];

  constructor(
    private outputDir: string,
    private batchSize: number,
    private progress: ProgressState,
    private progressFile: string,
    private filePrefix: string, // e.g. 'batch-' or 'batch-s2-'
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
    logger.info(`dulieuphapluat: wrote ${this.buffer.length} docs to ${filename} (${gz.length} bytes gzipped)`);
    this.buffer = [];
    saveProgress(this.progressFile, this.progress);
  }
}

export interface DulieuphapluatOptions {
  maxSitemaps?: number; // how many additional sitemap files to process this run (resumes after last completed)
  runAll?: boolean; // process every remaining sitemap file sequentially in this one run, ignoring maxSitemaps
  startFresh?: boolean; // ignore saved progress and start from sitemap 1
  outputMode?: 'db' | 'json'; // 'db' (default): enqueue to ingestion queue; 'json': write local gzip batches, no DB
  jsonOutputDir?: string;
  jsonBatchSize?: number;
  shardIndex?: number; // 0-based; this process handles sitemap files where (originalIndex % shardCount) === shardIndex
  shardCount?: number; // total number of parallel shards; omit/1 = no sharding (sequential, single process)
}

export async function runDulieuphapluatCrawler(options?: DulieuphapluatOptions) {
  const outputMode = options?.outputMode ?? 'db';
  const shardCount = options?.shardCount && options.shardCount > 1 ? options.shardCount : 1;
  const shardIndex = options?.shardIndex ?? 0;
  const shardLabel = shardCount > 1 ? ` [shard ${shardIndex}/${shardCount}]` : '';

  if (!(await assertCrawlAllowed(BASE_URL, 'dulieuphapluat'))) return;
  const robotsRules = await fetchRobotsRules(BASE_URL);

  const progressFile = progressFilePath(shardIndex, shardCount);
  let progress = loadProgress(progressFile);
  if (options?.startFresh) {
    progress = { totalSitemaps: 0, lastCompletedSitemapIndex: 0, totalUrlsProcessed: 0, nextJsonBatchIndex: 0, updatedAt: new Date().toISOString() };
  }

  let allSitemapUrls: string[];
  try {
    allSitemapUrls = await fetchSitemapIndex();
  } catch (err) {
    logger.error(`dulieuphapluat${shardLabel}: failed to fetch sitemap index: ${(err as Error).message}`);
    return;
  }

  // Round-robin partition so each shard gets a spread across the whole
  // sitemap list (oldest→newest documents) rather than one contiguous
  // block — keeps each shard's progress representative if the run is
  // stopped early.
  const sitemapUrls = shardCount > 1 ? allSitemapUrls.filter((_u, i) => i % shardCount === shardIndex) : allSitemapUrls;
  progress.totalSitemaps = sitemapUrls.length;

  const startIndex = progress.lastCompletedSitemapIndex; // 0-based offset into this shard's sitemapUrls
  const endIndex = options?.runAll ? sitemapUrls.length : Math.min(sitemapUrls.length, startIndex + (options?.maxSitemaps ?? 1));

  if (startIndex >= sitemapUrls.length) {
    logger.info(`dulieuphapluat${shardLabel}: all ${sitemapUrls.length} assigned sitemap files already processed`);
    return;
  }

  const jsonWriter =
    outputMode === 'json'
      ? new JsonBatchWriter(
          options?.jsonOutputDir || DEFAULT_JSON_OUTPUT_DIR,
          options?.jsonBatchSize || DEFAULT_JSON_BATCH_SIZE,
          progress,
          progressFile,
          shardCount > 1 ? `batch-s${shardIndex}-` : 'batch-',
        )
      : null;

  logger.info(
    `dulieuphapluat${shardLabel}: processing sitemap files ${startIndex + 1}-${endIndex} of ${sitemapUrls.length} sequentially [outputMode=${outputMode}] (resuming from progress file)`,
  );

  for (let i = startIndex; i < endIndex; i++) {
    const sitemapUrl = sitemapUrls[i];
    const urlsProcessed = await processSitemapFile(sitemapUrl, robotsRules, outputMode, jsonWriter);
    progress.lastCompletedSitemapIndex = i + 1;
    progress.totalUrlsProcessed += urlsProcessed;
    saveProgress(progressFile, progress);
    logger.info(
      `dulieuphapluat${shardLabel}: completed sitemap ${i + 1}/${sitemapUrls.length} (${sitemapUrl}) — ${urlsProcessed} URLs; ${progress.totalUrlsProcessed} total so far`,
    );
  }

  jsonWriter?.flush(); // final partial batch, if any

  logger.info(`dulieuphapluat${shardLabel}: batch finished`);
}

/**
 * Fetches one `postSiteMapN.xml`, filters out anything robots.txt
 * disallows, and crawls every remaining document URL via CheerioCrawler
 * (static HTML — verified live, no JS rendering needed).
 */
async function processSitemapFile(
  sitemapUrl: string,
  robotsRules: { disallow: string[]; allow: string[] },
  outputMode: 'db' | 'json',
  jsonWriter: JsonBatchWriter | null,
): Promise<number> {
  let xml: string;
  try {
    xml = await fetchText(sitemapUrl);
  } catch (err) {
    logger.error(`dulieuphapluat: failed to fetch ${sitemapUrl}: ${(err as Error).message}`);
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
      await handleDetailPage($ as any, request.url, outputMode, jsonWriter);
    },

    failedRequestHandler({ request }, error) {
      logger.error(`dulieuphapluat: request failed: ${request.url}`, { error: error.message });
    },
  });

  await crawler.run(docUrls.map((url) => ({ url, label: 'DETAIL' })));
  return docUrls.length;
}

/**
 * Vietnamese labels for the 24 `luoc_do_item_{id}` relationship categories
 * rendered on every detail page's "Lược đồ" tab, keyed by their stable
 * numeric id (verified identical across multiple documents — e.g.
 * `luoc_do_item_2` is always "Hướng dẫn"). Odd ids are relationships this
 * document has TO other documents (this doc hướng dẫn/sửa đổi/thay thế…
 * another); even ids are the inverse (this doc được hướng dẫn bởi/bị sửa
 * đổi bởi… another) — kept as separate labels rather than collapsed,
 * since the direction is meaningful and the raw label is what
 * normalizeRelationshipType (metadata-parser.ts) already knows how to fold
 * down to the project's RelationshipType enum.
 */
const LUOC_DO_LABELS: Record<string, string> = {
  '1': 'Được hướng dẫn', '2': 'Hướng dẫn',
  '3': 'Hủy bỏ', '4': 'Bị hủy bỏ',
  '5': 'Bổ sung', '6': 'Được bổ sung',
  '7': 'Đình chỉ', '8': 'Bị đình chỉ',
  '9': 'Đình chỉ 1 phần', '10': 'Bị đinh chỉ 1 phần',
  '11': 'Quy định hết hiệu lực', '12': 'Bị quy định hết hiệu lực',
  '13': 'Bãi bỏ', '14': 'Bị bãi bỏ',
  '15': 'Sửa đổi', '16': 'Được sửa đổi',
  '17': 'Đính chính', '18': 'Được đính chính',
  '19': 'Thay thế', '20': 'Bị thay thế',
  '21': 'Điều chỉnh', '22': 'Được điều chỉnh',
  '23': 'Dẫn chiếu', '24': 'Được dẫn chiếu',
};

interface ExtractedRelationship {
  relationshipType: string; // raw Vietnamese label, e.g. "Hướng dẫn"
  targetDocNumber: string; // best-effort number parsed out of the link title, else the full title
  targetTitle: string;
  targetUrl: string;
}

/**
 * Loose Vietnamese legal document number pattern. Covers both the
 * with-year form ("43/2014/NĐ-CP", "85/2026/VBHN-TT-BNNMT") and the
 * no-year form ("1383/QĐ-TCHQ") — verified live: the original with-year-only
 * pattern silently failed to match no-year numbers (required a digit
 * immediately after the first `/`, but "QĐ-TCHQ" starts with a letter),
 * falling through to the `title` fallback below and polluting
 * targetDocNumber with the entire link title instead of just its number.
 */
const DOC_NUMBER_PATTERN = /\d{1,6}[A-Za-zĐđ]{0,3}\/(?:\d{2,4}\/)?[A-ZĐƯƠ][A-ZĐƯƠ0-9\-]*/;

function extractDocNumberFromTitle(title: string): string {
  const m = title.match(DOC_NUMBER_PATTERN);
  return m ? m[0] : title;
}

/**
 * Parses the "Lược đồ" tab's 24 relationship-category blocks. Contrary to
 * first appearances (two docs sampled with all-empty `<ul>`s), this is
 * verified live to be server-rendered, not AJAX-loaded — legal_doc.js only
 * toggles show/hide on `<li>`s already in the DOM (see its
 * `document.querySelectorAll(".luoc_do_item")` handler); documents with
 * zero relationships in a category genuinely have an empty `<ul>` there.
 * Confirmed non-empty on "Luật đất đai 2013" (25 `<li>` under "Hướng dẫn").
 *
 * Drops self-referencing entries (target URL === the current page's own
 * URL) and exact duplicates — verified live on "Nghị định 30/2006/NĐ-CP"
 * (https://dulieuphapluat.vn/van-ban/ke-toan-kiem-toan-van-ban/nghi-dinh-
 * 302006nd-cp-ve-thong-ke-khoa-hoc-va-cong-nghe-602551.html): its "Được
 * hướng dẫn" list twice links back to that exact same URL. That's a data
 * quirk on the source site's own page, not a parsing bug (the site really
 * does render that self-link), but it's noise worth filtering rather than
 * passing through.
 */
function extractRelationships($: cheerio.CheerioAPI, pageUrl: string): ExtractedRelationship[] {
  const relationships: ExtractedRelationship[] = [];
  const seen = new Set<string>();
  $('.luoc_do_item').each((_i, el) => {
    const id = $(el).attr('id')?.replace('luoc_do_item_', '') || '';
    const relationshipType =
      LUOC_DO_LABELS[id] || $(el).find('.luoc-do-title-text').text().replace(/\(.*/, '').trim();
    $(el)
      .find('ul li a')
      .each((_j, a) => {
        const $a = $(a);
        const href = $a.attr('href') || '';
        const targetTitle = $a.find('p').text().trim() || $a.text().trim() || $a.attr('title') || '';
        if (!targetTitle) return;
        const targetUrl = href ? new URL(href, BASE_URL).toString() : '';
        if (targetUrl && targetUrl === pageUrl) return; // self-reference noise
        const dedupeKey = `${relationshipType}|${targetUrl || targetTitle}`;
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
        relationships.push({
          relationshipType,
          targetDocNumber: extractDocNumberFromTitle(targetTitle),
          targetTitle,
          targetUrl,
        });
      });
  });
  return relationships;
}

interface TocEntry {
  title: string;
  anchor: string;
}

/**
 * Parses the "Mục lục" (table of contents) modal — a flat list of
 * Điều/Chương heading anchors (`#md_muc_luc .gc-sidebar-list
 * .gc-sidebar-link`, verified live), separate from and not duplicated by
 * `contentHtml`'s own headings (that's the rendered legal text; this is
 * the site's own navigation index over it).
 */
function extractTableOfContents($: cheerio.CheerioAPI): TocEntry[] {
  const toc: TocEntry[] = [];
  $('#md_muc_luc .gc-sidebar-list .gc-sidebar-link').each((_i, el) => {
    const $a = $(el);
    const title = $a.find('.gc-sidebar-text').text().trim() || $a.attr('title')?.trim() || $a.text().trim();
    const anchor = $a.attr('href') || '';
    if (title) toc.push({ title, anchor });
  });
  return toc;
}

/**
 * dulieuphapluat.vn publishes some documents twice: once at the normal
 * Vietnamese-slugged URL, and again at a separate English-slugged URL
 * (e.g. ".../decree-882021nd-cp-on-collection-of-fees...html") carrying an
 * official English translation — both land in the same sitemap, and the
 * summary table's labels ("Số hiệu", "Loại văn bản"...) stay Vietnamese
 * even on the English page, so only `h1.gc-detail-title`/body text reveal
 * it. Verified live by comparing a random-sample of crawled documents
 * against the project's existing (Vietnamese-only) VBPL corpus: 4 of 5
 * matched-by-number pairs turned out to be this English variant, silently
 * passed through as if Vietnamese. Rather than skip these pages (the user
 * still wants them collected), each record is now tagged with the
 * detected language so downstream consumers can filter/handle them
 * separately instead of mixing English text into a Vietnamese corpus
 * unflagged.
 *
 * Detection: presence of any Vietnamese diacritic character in the title.
 * Real Vietnamese legal-document titles are diacritic-dense (article/law
 * names virtually never go a full title without one); English titles
 * translating the same document number have none. Simple and
 * structure-independent — no reliance on URL slug wording, which could
 * shift.
 */
const VIETNAMESE_DIACRITIC_PATTERN =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function detectLanguage(title: string): 'vi' | 'en' {
  return VIETNAMESE_DIACRITIC_PATTERN.test(title) ? 'vi' : 'en';
}

/**
 * Parses a document detail page. Metadata lives in the summary table
 * (`table.table_tom_tat`, verified live: `td.col-1-tom-tat > strong` label +
 * sibling `td` value — "Số hiệu", "Loại văn bản", "Cơ quan", "Ngày ban hành",
 * "Người ký", "Ngày hiệu lực", "Tình trạng"); the lĩnh vực (field) comes
 * from the breadcrumb's second-to-last link; full text lives in
 * `article#printableContent`; relationships and table-of-contents are
 * covered by extractRelationships/extractTableOfContents above.
 */
export async function handleDetailPage(
  $: cheerio.CheerioAPI,
  url: string,
  outputMode: 'db' | 'json',
  jsonWriter: JsonBatchWriter | null,
) {
  const fields: Record<string, string> = {};
  $('table.table_tom_tat td.col-1-tom-tat').each((_i, el) => {
    const label = $(el).find('strong').text().trim().toLowerCase();
    const value = $(el).next('td').text().trim();
    if (!label || !value) return;
    if (label.includes('số hiệu')) fields.documentNumber = value;
    else if (label.includes('loại văn bản')) fields.documentType = value;
    else if (label.includes('cơ quan')) fields.issuingBody = value;
    else if (label.includes('ngày ban hành')) fields.promulgationDate = value;
    else if (label.includes('người ký')) fields.signer = value;
    else if (label.includes('ngày hiệu lực')) fields.effectiveDate = value;
    else if (label.includes('tình trạng')) fields.validityStatus = value;
  });

  const field = $('nav.gc-breadcrumb a.gc-breadcrumb-link').last().text().trim();
  const title = $('h1.gc-detail-title').first().text().trim() || $('title').text().trim();
  const contentHtml = $('article#printableContent').first().html() || '';
  const relationships = extractRelationships($, url);
  const tableOfContents = extractTableOfContents($);
  const language = detectLanguage(title);

  const documentNumber = fields.documentNumber;
  if (!documentNumber || !title) {
    logger.warn(`Skipping dulieuphapluat.vn detail page with missing documentNumber/title: ${url}`);
    return;
  }

  const metadata: Record<string, string> = {
    documentNumber,
    documentType: fields.documentType || '',
    trichYeu: title,
    promulgationDate: fields.promulgationDate || '',
    effectiveDate: fields.effectiveDate || '',
    issuingBody: fields.issuingBody || '',
    signer: fields.signer || '',
    validityStatus: fields.validityStatus || '',
    field,
    // Feeds extractMetadataFromRaw's own rawRelationships parsing
    // (metadata-parser.ts), which normalizeRelationshipType folds down to
    // the project's RelationshipType enum — same plumbing persist.ts
    // already uses to write DocumentRelation rows in 'db' mode.
    rawRelationships: JSON.stringify(
      relationships.map((r) => ({ targetDocNumber: r.targetDocNumber, relationshipType: r.relationshipType })),
    ),
  };

  if (outputMode === 'json') {
    // Same ParsedMetadata shape the DB pipeline would derive via
    // extractMetadataFromRaw, plus fullText via the same HTML→markdown-text
    // conversion persist.ts uses — a local dump that mirrors the project's
    // own canonical record shape rather than inventing a new one. Adds the
    // raw (pre-normalization) relationships and the table-of-contents,
    // which have no slot in ParsedMetadata/DB schema, purely for the local
    // JSON dump's benefit.
    const parsed = extractMetadataFromRaw(metadata, title);
    jsonWriter?.add({
      ...parsed,
      url,
      source: 'dulieuphapluat.vn',
      language,
      fullText: convertHtmlToMarkdownText(contentHtml || title),
      relationshipsRaw: relationships,
      tableOfContents,
      crawledAt: new Date().toISOString(),
    });
    logger.info(`Extracted (json): ${documentNumber} — ${title} [${language}] (${relationships.length} relationships, ${tableOfContents.length} TOC entries)`);
    return;
  }

  const rawDoc = {
    type: 'RAW_DOCUMENT',
    source: 'dulieuphapluat.vn',
    url,
    title,
    metadata: { ...metadata, language },
    contentHtml: contentHtml || title,
    crawledAt: new Date().toISOString(),
  };

  await Dataset.pushData(rawDoc);
  await enqueueOrRecordFailure(rawDoc);

  logger.info(`Extracted document: ${documentNumber} — ${title} [${language}] (${relationships.length} relationships)`);
}

// Run directly if executed as main
const isMain = process.argv[1]?.includes('dulieuphapluat');
if (isMain) {
  const maxSitemaps = parseInt(process.env.DULIEUPHAPLUAT_MAX_SITEMAPS || '1', 10);
  const runAll = process.env.DULIEUPHAPLUAT_RUN_ALL === 'true';
  const outputMode = (process.env.DULIEUPHAPLUAT_OUTPUT_MODE === 'json' ? 'json' : 'db') as 'db' | 'json';
  const shardIndex = process.env.DULIEUPHAPLUAT_SHARD_INDEX ? parseInt(process.env.DULIEUPHAPLUAT_SHARD_INDEX, 10) : undefined;
  const shardCount = process.env.DULIEUPHAPLUAT_SHARD_COUNT ? parseInt(process.env.DULIEUPHAPLUAT_SHARD_COUNT, 10) : undefined;
  runDulieuphapluatCrawler({ maxSitemaps, runAll, outputMode, shardIndex, shardCount })
    .then(() => logger.info('dulieuphapluat.vn crawl batch complete'))
    .catch((err) => logger.error('dulieuphapluat.vn crawl failed', { error: err.message }))
    .finally(() => prisma.$disconnect());
}
