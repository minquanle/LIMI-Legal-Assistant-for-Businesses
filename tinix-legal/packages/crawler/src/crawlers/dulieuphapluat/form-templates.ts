import path from 'path';
import logger from '../../utils/logger.js';
import { convertHtmlToMarkdownText } from '../../pipeline/storage.js';
import { runSitemapJsonCrawl, type SitemapJsonCrawlOptions } from './sitemap-json-runner.js';

/**
 * dulieuphapluat.vn document-template (biểu mẫu) scan — up to ~14,000
 * templates across 14 `sitemap-form-N.xml` sub-sitemaps (verified live).
 * Parses `h1.gc-form-detail-title` (name), `.gc-form-guide-content` (usage
 * guide: tóm tắt/khi nào dùng/cần chuẩn bị gì), and
 * `#gc-form-content-body` (the template's own text, HTML→markdown-text via
 * the same storage.ts helper the main document pipeline uses).
 */
const SITEMAP_INDEX_URL = 'https://dulieuphapluat.vn/sitemapform.xml';
const DATASET_NAME = 'dulieuphapluat-form';

function progressFilePath(shardIndex?: number, shardCount?: number): string {
  const suffix = shardCount && shardCount > 1 ? `-s${shardIndex}` : '';
  return path.resolve(process.cwd(), `${DATASET_NAME}-progress${suffix}.json`);
}

function parseDetailPage($: any, url: string): Record<string, unknown> | null {
  const title = $('h1.gc-form-detail-title').first().text().trim();
  const guideHtml = $('.gc-form-guide-content').first().html() || '';
  const contentHtml = $('#gc-form-content-body').first().html() || '';
  if (!title) {
    logger.warn(`Skipping form-template page with missing title: ${url}`);
    return null;
  }
  return {
    title,
    guideText: convertHtmlToMarkdownText(guideHtml),
    contentText: convertHtmlToMarkdownText(contentHtml),
    url,
    source: 'dulieuphapluat.vn',
    crawledAt: new Date().toISOString(),
  };
}

export async function runDulieuphapluatFormTemplateCrawler(options?: Omit<SitemapJsonCrawlOptions, 'datasetName' | 'sitemapIndexUrl' | 'progressFilePath' | 'jsonOutputDir' | 'filePrefix' | 'parseDetailPage'>) {
  const shardCount = options?.shardCount && options.shardCount > 1 ? options.shardCount : 1;
  await runSitemapJsonCrawl({
    datasetName: DATASET_NAME,
    sitemapIndexUrl: SITEMAP_INDEX_URL,
    progressFilePath: progressFilePath(options?.shardIndex, options?.shardCount),
    jsonOutputDir: path.resolve(process.cwd(), 'data', 'dulieuphapluat-bieu-mau'),
    filePrefix: shardCount > 1 ? `batch-s${options?.shardIndex ?? 0}-` : 'batch-',
    parseDetailPage: parseDetailPage as any,
    ...options,
  });
}

const isMain = process.argv[1]?.includes('form-templates');
if (isMain) {
  const maxSitemaps = parseInt(process.env.DULIEUPHAPLUAT_MAX_SITEMAPS || '1', 10);
  const runAll = process.env.DULIEUPHAPLUAT_RUN_ALL === 'true';
  const shardIndex = process.env.DULIEUPHAPLUAT_SHARD_INDEX ? parseInt(process.env.DULIEUPHAPLUAT_SHARD_INDEX, 10) : undefined;
  const shardCount = process.env.DULIEUPHAPLUAT_SHARD_COUNT ? parseInt(process.env.DULIEUPHAPLUAT_SHARD_COUNT, 10) : undefined;
  runDulieuphapluatFormTemplateCrawler({ maxSitemaps, runAll, shardIndex, shardCount })
    .then(() => logger.info('dulieuphapluat form-template crawl batch complete'))
    .catch((err) => logger.error('dulieuphapluat form-template crawl failed', { error: err.message }));
}
