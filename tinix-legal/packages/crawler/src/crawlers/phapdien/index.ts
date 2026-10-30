import { CheerioCrawler, Dataset } from 'crawlee';
import * as cheerio from 'cheerio';
import { config } from '../../config.js';
import logger from '../../utils/logger.js';
import { enqueueOrRecordFailure } from '../../queue/ingestion-queue.js';
import { assertCrawlAllowed } from '../../utils/robots.js';

const BASE_URL = 'http://phapdien.moj.gov.vn';

/**
 * Pháp điển MOJ (phapdien.moj.gov.vn) Crawler Module
 * 
 * Uses CheerioCrawler for the Ministry of Justice legal codification portal.
 * This site organizes legal documents by subject/topic (đề mục).
 */
export async function runPhapdienCrawler(options?: {
  maxPages?: number;
}) {
  const maxPages = options?.maxPages ?? 5;

  if (!(await assertCrawlAllowed(BASE_URL, 'phapdien'))) return;

  const crawler = new CheerioCrawler({
    maxConcurrency: config.concurrency,
    maxRequestsPerMinute: Math.min(config.maxRequestsPerMinute, 15), // Lower rate for gov site
    maxRequestRetries: config.retryCount,
    requestHandlerTimeoutSecs: config.requestTimeoutSecs,

    async requestHandler({ request, $ }) {
      const url = request.url;
      const label = request.label || 'LIST';

      logger.info(`Processing [${label}]: ${url}`);

      if (label === 'LIST') {
        await handleTopicListPage($ as any, url);
      } else if (label === 'DETAIL') {
        await handleDetailPage($ as any, url);
      }
    },

    failedRequestHandler({ request }, error) {
      logger.error(`Request failed: ${request.url}`, { error: error.message });
    },
  });

  const startUrls = [
    { url: `${BASE_URL}/Pages/home.aspx`, label: 'LIST' },
  ];

  logger.info('Starting Pháp điển MOJ crawler');
  await crawler.run(startUrls);
  logger.info('Pháp điển MOJ crawler finished');
}

async function handleTopicListPage($: cheerio.CheerioAPI, url: string) {
  const links: Array<{ url: string; title: string }> = [];

  $('a[href*="van-ban"], a[href*="detail"], a[href*="chi-tiet"], .topic-list a, .vanban a').each(
    (_i, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      if (href && title) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        links.push({ url: fullUrl, title });
      }
    }
  );

  const uniqueUrls = [...new Set(links.map((l) => l.url))];
  logger.info(`Found ${uniqueUrls.length} links on ${url}`);

  for (const docUrl of uniqueUrls) {
    await Dataset.pushData({
      type: 'DOCUMENT_LINK',
      source: 'phapdien.moj.gov.vn',
      url: docUrl,
      discoveredAt: new Date().toISOString(),
    });
  }
}

async function handleDetailPage($: cheerio.CheerioAPI, url: string) {
  const title = $('h1, .page-title, [class*="title"]').first().text().trim();
  const contentHtml = $('[class*="content"], [class*="detail"], .noi-dung, article').first().html() || '';

  const metadata: Record<string, string> = {};
  $('table tr, .info-row, dl').each((_i, el) => {
    const label = $(el).find('td:first-child, dt, .label').text().trim().toLowerCase();
    const value = $(el).find('td:last-child, dd, .value').text().trim();

    if (label.includes('số') && label.includes('hiệu')) metadata.documentNumber = value;
    else if (label.includes('loại')) metadata.documentType = value;
    else if (label.includes('cơ quan')) metadata.issuingBody = value;
    else if (label.includes('người ký')) metadata.signer = value;
    else if (label.includes('ngày ban hành')) metadata.promulgationDate = value;
    else if (label.includes('hiệu lực')) metadata.validityStatus = value;
  });

  const downloadLinks: Array<{ url: string; filename: string }> = [];
  $('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"]').each((_i, el) => {
    const href = $(el).attr('href');
    if (href) {
      downloadLinks.push({
        url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
        filename: $(el).text().trim() || href.split('/').pop() || '',
      });
    }
  });

  const rawDoc = {
    type: 'RAW_DOCUMENT',
    source: 'phapdien.moj.gov.vn',
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

const isMain = process.argv[1]?.includes('phapdien');
if (isMain) {
  runPhapdienCrawler()
    .then(() => logger.info('Pháp điển crawl complete'))
    .catch((err) => logger.error('Pháp điển crawl failed', { error: err.message }));
}
