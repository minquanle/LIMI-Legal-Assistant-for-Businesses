import path from 'path';
import logger from '../../utils/logger.js';
import { runSitemapJsonCrawl, type SitemapJsonCrawlOptions } from './sitemap-json-runner.js';

/**
 * dulieuphapluat.vn legal-glossary (định nghĩa) scan — 57,935+ terms per
 * the site's own count, spread across sitemap-terms-N.xml sub-sitemaps
 * (verified live, sitemap-terms-1.xml alone already has 10,000 entries).
 * Parses `h1.dns-hero-title` (the term as a "X là gì?" question),
 * `.dns-blockquote` (the definition text), and `.dns-source` (the citing
 * legal document's name — the "Căn cứ pháp lý" line).
 */
const SITEMAP_INDEX_URL = 'https://dulieuphapluat.vn/sitemap-terms.xml';
const DATASET_NAME = 'dulieuphapluat-term';

function progressFilePath(shardIndex?: number, shardCount?: number): string {
  const suffix = shardCount && shardCount > 1 ? `-s${shardIndex}` : '';
  return path.resolve(process.cwd(), `${DATASET_NAME}-progress${suffix}.json`);
}

function parseDetailPage($: any, url: string): Record<string, unknown> | null {
  const question = $('h1.dns-hero-title').first().text().trim();
  const definition = $('.dns-blockquote').first().text().trim();
  if (!question || !definition) {
    logger.warn(`Skipping legal-term page with missing question/definition: ${url}`);
    return null;
  }
  const term = question.replace(/\s*là gì\??\s*$/i, '').trim();
  const legalBasis = $('.dns-source').first().text().replace(/^\s*Căn cứ pháp lý:\s*/i, '').trim();

  return {
    term,
    question,
    definition,
    legalBasis,
    url,
    source: 'dulieuphapluat.vn',
    crawledAt: new Date().toISOString(),
  };
}

export async function runDulieuphapluatLegalTermCrawler(options?: Omit<SitemapJsonCrawlOptions, 'datasetName' | 'sitemapIndexUrl' | 'progressFilePath' | 'jsonOutputDir' | 'filePrefix' | 'parseDetailPage'>) {
  const shardCount = options?.shardCount && options.shardCount > 1 ? options.shardCount : 1;
  await runSitemapJsonCrawl({
    datasetName: DATASET_NAME,
    sitemapIndexUrl: SITEMAP_INDEX_URL,
    progressFilePath: progressFilePath(options?.shardIndex, options?.shardCount),
    jsonOutputDir: path.resolve(process.cwd(), 'data', 'dulieuphapluat-dinh-nghia'),
    filePrefix: shardCount > 1 ? `batch-s${options?.shardIndex ?? 0}-` : 'batch-',
    parseDetailPage: parseDetailPage as any,
    ...options,
  });
}

const isMain = process.argv[1]?.includes('legal-terms');
if (isMain) {
  const maxSitemaps = parseInt(process.env.DULIEUPHAPLUAT_MAX_SITEMAPS || '1', 10);
  const runAll = process.env.DULIEUPHAPLUAT_RUN_ALL === 'true';
  const shardIndex = process.env.DULIEUPHAPLUAT_SHARD_INDEX ? parseInt(process.env.DULIEUPHAPLUAT_SHARD_INDEX, 10) : undefined;
  const shardCount = process.env.DULIEUPHAPLUAT_SHARD_COUNT ? parseInt(process.env.DULIEUPHAPLUAT_SHARD_COUNT, 10) : undefined;
  runDulieuphapluatLegalTermCrawler({ maxSitemaps, runAll, shardIndex, shardCount })
    .then(() => logger.info('dulieuphapluat legal-term crawl batch complete'))
    .catch((err) => logger.error('dulieuphapluat legal-term crawl failed', { error: err.message }));
}
