import path from 'path';
import logger from '../../utils/logger.js';
import { convertHtmlToMarkdownText } from '../../pipeline/storage.js';
import { runSitemapJsonCrawl, type SitemapJsonCrawlOptions } from './sitemap-json-runner.js';

/**
 * dulieuphapluat.vn "Sổ tay kế toán" (accounting/tax-compliance handbook)
 * scan — a small curated guide (63 pages total per sitemap-so-tay-ke-toan.xml,
 * verified live: 10 category-index pages + 53 leaf articles), covering
 * business tax registration, e-invoicing, tax filing, and enterprise
 * changes — legal/business-compliance content, kept per the user's
 * "luật, doanh nghiệp, hành chính công" scope after an earlier pass had
 * left it out (it doesn't use the `gc-table`/card-list templates the other
 * tools share).
 *
 * One record per URL (article or category-index page alike — a category
 * page's own intro text is still useful, its listed sub-articles are
 * separately crawled since they're their own sitemap entries). Parses
 * `h1.gc-tool-page-title` (title), `.stk-meta` (category label + "Cập nhật
 * DD/MM/YYYY"), `.gc-tool-intro.stk-prose` (intro), and `article.stk-prose`
 * (body, HTML→markdown-text via the same storage.ts helper the main
 * document pipeline uses).
 */
const SITEMAP_INDEX_URL = 'https://dulieuphapluat.vn/sitemap-so-tay-ke-toan.xml';
const DATASET_NAME = 'dulieuphapluat-so-tay-ke-toan';

function progressFilePath(shardIndex?: number, shardCount?: number): string {
  const suffix = shardCount && shardCount > 1 ? `-s${shardIndex}` : '';
  return path.resolve(process.cwd(), `${DATASET_NAME}-progress${suffix}.json`);
}

function parseDetailPage($: any, url: string): Record<string, unknown> | null {
  const title = $('h1.gc-tool-page-title').first().text().trim();
  const bodyHtml = $('article.stk-prose').first().html() || '';
  if (!title) {
    logger.warn(`Skipping so-tay-ke-toan page with missing title: ${url}`);
    return null;
  }

  const category = $('.stk-meta a').first().text().trim();
  const updatedText = $('.stk-meta').text();
  const updatedMatch = updatedText.match(/Cập nhật\s+(\d{2}\/\d{2}\/\d{4})/);
  const introHtml = $('.gc-tool-intro.stk-prose').first().html() || '';

  return {
    title,
    category,
    updatedDate: updatedMatch ? updatedMatch[1] : '',
    intro: convertHtmlToMarkdownText(introHtml),
    content: convertHtmlToMarkdownText(bodyHtml),
    url,
    source: 'dulieuphapluat.vn',
    crawledAt: new Date().toISOString(),
  };
}

export async function runDulieuphapluatAccountingHandbookCrawler(
  options?: Omit<SitemapJsonCrawlOptions, 'datasetName' | 'sitemapIndexUrl' | 'progressFilePath' | 'jsonOutputDir' | 'filePrefix' | 'parseDetailPage'>,
) {
  const shardCount = options?.shardCount && options.shardCount > 1 ? options.shardCount : 1;
  await runSitemapJsonCrawl({
    datasetName: DATASET_NAME,
    sitemapIndexUrl: SITEMAP_INDEX_URL,
    progressFilePath: progressFilePath(options?.shardIndex, options?.shardCount),
    jsonOutputDir: path.resolve(process.cwd(), 'data', 'dulieuphapluat-so-tay-ke-toan'),
    filePrefix: shardCount > 1 ? `batch-s${options?.shardIndex ?? 0}-` : 'batch-',
    parseDetailPage: parseDetailPage as any,
    ...options,
  });
}

const isMain = process.argv[1]?.includes('accounting-handbook');
if (isMain) {
  const maxSitemaps = parseInt(process.env.DULIEUPHAPLUAT_MAX_SITEMAPS || '1', 10);
  const runAll = process.env.DULIEUPHAPLUAT_RUN_ALL === 'true';
  runDulieuphapluatAccountingHandbookCrawler({ maxSitemaps, runAll })
    .then(() => logger.info('dulieuphapluat so-tay-ke-toan crawl batch complete'))
    .catch((err) => logger.error('dulieuphapluat so-tay-ke-toan crawl failed', { error: err.message }));
}
