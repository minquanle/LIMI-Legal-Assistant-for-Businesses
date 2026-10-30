import {
  CheerioCrawler,
  PlaywrightCrawler,
  Configuration,
  type CheerioCrawlerOptions,
  type PlaywrightCrawlerOptions,
  type RouterHandler,
} from 'crawlee';
import { config } from '../config.js';
import logger from '../utils/logger.js';

/**
 * Base crawler factory providing shared configuration for all source crawlers.
 * Each source module uses this to create its CheerioCrawler or PlaywrightCrawler instance.
 */

/** Common options shared by all crawlers */
const commonOptions = {
  maxConcurrency: config.concurrency,
  maxRequestsPerMinute: config.maxRequestsPerMinute,
  maxRequestRetries: config.retryCount,
  requestHandlerTimeoutSecs: config.requestTimeoutSecs,
};

/**
 * Create a CheerioCrawler for sources that serve static HTML
 * (e.g., vbpl.vn, chinhphu.vn)
 */
export function createCheerioCrawler(
  options: Partial<CheerioCrawlerOptions> = {}
): CheerioCrawler {
  const crawler = new CheerioCrawler({
    ...commonOptions,
    additionalMimeTypes: ['application/pdf', 'application/msword'],
    ...options,
  });

  logger.info('CheerioCrawler created', {
    concurrency: config.concurrency,
    maxRequestsPerMinute: config.maxRequestsPerMinute,
  });

  return crawler;
}

/**
 * Create a PlaywrightCrawler for sources that require JS rendering
 * or have anti-bot protections (e.g., thuvienphapluat, luatvietnam)
 */
export function createPlaywrightCrawler(
  options: Partial<PlaywrightCrawlerOptions> = {}
): PlaywrightCrawler {
  const crawler = new PlaywrightCrawler({
    ...commonOptions,
    navigationTimeoutSecs: config.navigationTimeoutSecs,
    headless: true,
    launchContext: {
      launchOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
        ],
      },
    },
    ...options,
  });

  logger.info('PlaywrightCrawler created', {
    concurrency: config.concurrency,
    maxRequestsPerMinute: config.maxRequestsPerMinute,
  });

  return crawler;
}

/**
 * Download a file from a URL and return the buffer.
 * Used for fetching PDF/DOC attachments.
 */
export async function downloadFile(
  url: string
): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': config.userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'application/octet-stream';

  // Extract filename from URL or Content-Disposition
  const disposition = response.headers.get('content-disposition');
  let fileName = url.split('/').pop() || 'unknown';
  if (disposition) {
    const match = disposition.match(/filename[*]?=(?:UTF-8''|")?([^";]+)/i);
    if (match) fileName = decodeURIComponent(match[1]);
  }

  logger.info(`Downloaded file: ${fileName} (${buffer.length} bytes)`);
  return { buffer, contentType, fileName };
}
