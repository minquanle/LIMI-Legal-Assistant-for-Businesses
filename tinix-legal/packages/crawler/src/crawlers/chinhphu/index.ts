import { CheerioCrawler, Dataset } from 'crawlee';
import * as cheerio from 'cheerio';
import { config } from '../../config.js';
import logger from '../../utils/logger.js';
import { enqueueOrRecordFailure } from '../../queue/ingestion-queue.js';
import { assertCrawlAllowed } from '../../utils/robots.js';

const BASE_URL_CHINHPHU = 'https://chinhphu.vn';
const BASE_URL_VANBAN = 'https://vanbanphapluat.gov.vn';

/**
 * Chinhphu.vn & vanbanphapluat.gov.vn Crawler Module
 * 
 * Uses CheerioCrawler because these government sites
 * primarily serve static/server-rendered HTML content.
 * 
 * Strategy:
 *  1. Crawl the legal document list on chinhphu.vn/he-thong-van-ban
 *  2. Extract metadata and content from detail pages
 *  3. Also crawl vanbanphapluat.gov.vn for supplementary documents
 */
export async function runChinhphuCrawler(options?: {
  maxPages?: number;
  startPage?: number;
}) {
  const maxPages = options?.maxPages ?? 5;
  const startPage = options?.startPage ?? 1;

  if (!(await assertCrawlAllowed(BASE_URL_CHINHPHU, 'chinhphu'))) return;

  const crawler = new CheerioCrawler({
    maxConcurrency: config.concurrency,
    maxRequestsPerMinute: config.maxRequestsPerMinute,
    maxRequestRetries: config.retryCount,
    requestHandlerTimeoutSecs: config.requestTimeoutSecs,

    async requestHandler({ request, $, body }) {
      const url = request.url;
      const label = request.label || 'LIST';
      const source = request.userData?.source || 'chinhphu.vn';

      logger.info(`Processing [${label}]: ${url}`);

      if (label === 'LIST') {
        await handleListPage($ as any, url);
      } else if (label === 'DETAIL') {
        await handleDetailPage($ as any, url);
      }
    },

    failedRequestHandler({ request }, error) {
      logger.error(`Request failed: ${request.url}`, { error: error.message });
    },
  });

  // Build initial URLs
  const startUrls = [];
  for (let p = startPage; p <= startPage + maxPages - 1; p++) {
    startUrls.push({
      url: `${BASE_URL_CHINHPHU}/he-thong-van-ban?page=${p}`,
      label: 'LIST',
    });
  }

  logger.info(`Starting Chinhphu.vn crawler with ${startUrls.length} list pages`);
  await crawler.run(startUrls);
  logger.info('Chinhphu.vn crawler finished');
}

/**
 * Handle the document list page — extract links to document details.
 */
async function handleListPage($: cheerio.CheerioAPI, url: string) {
  const documentLinks: Array<{ url: string; title: string }> = [];

  // Look for common selectors on chinhphu.vn document list
  $('a[href*="/van-ban/"], a[href*="/chi-tiet-van-ban/"], .document-item a, .list-vanban a').each(
    (_i, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      if (href && title) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL_CHINHPHU}${href}`;
        documentLinks.push({ url: fullUrl, title });
      }
    }
  );

  // Deduplicate
  const uniqueUrls = [...new Set(documentLinks.map((l) => l.url))];

  logger.info(`Found ${uniqueUrls.length} document links on ${url}`);

  for (const docUrl of uniqueUrls) {
    await Dataset.pushData({
      type: 'DOCUMENT_LINK',
      source: 'chinhphu.vn',
      url: docUrl,
      discoveredAt: new Date().toISOString(),
    });
  }
}

/**
 * Handle a document detail page — extract metadata, full content, and download links.
 */
async function handleDetailPage($: cheerio.CheerioAPI, url: string) {
  // Extract title
  const title =
    $('h1').first().text().trim() ||
    $('[class*="title"]').first().text().trim() ||
    $('title').text().trim();

  // Extract body content HTML
  const contentHtml =
    $('[class*="content"], [class*="toanvan"], [class*="noi-dung"], article, .detail-content')
      .first()
      .html() || '';

  // Extract metadata
  const metadata: Record<string, string> = {};

  // Look for attribute/info table rows
  $('table.info tr, .detail-info tr, dl dt, .thuoc-tinh .row, .attribute-row').each((_i, el) => {
    const label = $(el).find('td:first-child, dt, .label').text().trim().toLowerCase();
    const value = $(el).find('td:last-child, dd, .value').text().trim();

    if (label.includes('số') && (label.includes('hiệu') || label.includes('ký hiệu'))) {
      metadata.documentNumber = value;
    } else if (label.includes('loại văn bản')) {
      metadata.documentType = value;
    } else if (label.includes('cơ quan ban hành') || label.includes('nơi ban hành')) {
      metadata.issuingBody = value;
    } else if (label.includes('người ký')) {
      metadata.signer = value;
    } else if (label.includes('ngày ban hành')) {
      metadata.promulgationDate = value;
    } else if (label.includes('ngày hiệu lực') || label.includes('ngày có hiệu lực')) {
      metadata.effectiveDate = value;
    } else if (label.includes('hiệu lực') || label.includes('trạng thái')) {
      metadata.validityStatus = value;
    } else if (label.includes('lĩnh vực')) {
      metadata.field = value;
    }
  });

  // Find download links
  const downloadLinks: Array<{ url: string; filename: string }> = [];
  $('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"]').each((_i, el) => {
    const href = $(el).attr('href');
    if (href) {
      const fullUrl = href.startsWith('http') ? href : `${BASE_URL_CHINHPHU}${href}`;
      downloadLinks.push({
        url: fullUrl,
        filename: $(el).text().trim() || href.split('/').pop() || '',
      });
    }
  });

  const rawDoc = {
    type: 'RAW_DOCUMENT',
    source: 'chinhphu.vn',
    url,
    title,
    metadata,
    contentHtml,
    downloadLinks,
    crawledAt: new Date().toISOString(),
  };

  await Dataset.pushData(rawDoc);
  await enqueueOrRecordFailure(rawDoc);

  logger.info(`Extracted document: ${title || url}`);
}

// Run directly if executed as main
const isMain = process.argv[1]?.includes('chinhphu');
if (isMain) {
  runChinhphuCrawler({ maxPages: 3 })
    .then(() => logger.info('Chinhphu.vn crawl complete'))
    .catch((err) => logger.error('Chinhphu.vn crawl failed', { error: err.message }));
}
