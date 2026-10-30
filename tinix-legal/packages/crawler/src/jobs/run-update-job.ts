import path from 'path';
import logger from '../utils/logger.js';
import type { SitemapJsonCrawlOptions } from '../crawlers/dulieuphapluat/sitemap-json-runner.js';

/**
 * Entry point the backend's crawl-job scheduler spawns for one incremental
 * update of one dulieuphapluat.vn dataset:
 *
 *   JOB_DATASET=<key> JOB_MAX_NEW_URLS=5000 JOB_RESULT_FILE=/tmp/x.json \
 *     tsx src/jobs/run-update-job.ts
 *
 * Dataset keys must match packages/backend/src/application/crawl-job-registry.ts.
 * Deliberately lives outside crawlers/dulieuphapluat/: index.ts there guards
 * its own CLI block with `process.argv[1].includes('dulieuphapluat')`, which
 * would fire (and start a full crawl) if this entry file's path contained
 * that string while importing it.
 *
 * Each runner already spreads its `options` last, so passing `update` flips
 * it into diff-against-known-URLs mode (see runSitemapJsonUpdate).
 */

type RunnerOptions = Omit<
  SitemapJsonCrawlOptions,
  'datasetName' | 'sitemapIndexUrl' | 'progressFilePath' | 'jsonOutputDir' | 'filePrefix' | 'parseDetailPage'
>;

const GENERIC_TABLE_KEYS = [
  'danh-muc-dung-chung', 'co-so-luu-tru', 'doanh-nghiep-lu-hanh', 'mua-sam-cong', 'tai-khoan-ke-toan',
  'muc-phat-nghi-dinh', 'gia-dat', 'gia-dat-duong', 'don-vi-hanh-chinh', 'don-vi-hanh-chinh-cu',
  'muc-phat-giao-thong', 'le-phi-truoc-ba',
];
const DIRECTORY_KEYS = ['cong-ty-niem-yet', 'van-phong-cong-chung'];

async function run(dataset: string, options: RunnerOptions) {
  if (dataset === 'van-ban') {
    const { runSitemapJsonCrawl } = await import('../crawlers/dulieuphapluat/sitemap-json-runner.js');
    const { handleDetailPage } = await import('../crawlers/dulieuphapluat/index.js');
    return runSitemapJsonCrawl({
      datasetName: 'dulieuphapluat',
      sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap.xml',
      progressFilePath: path.resolve(process.cwd(), 'dulieuphapluat-update-unused.json'),
      jsonOutputDir: path.resolve(process.cwd(), 'data', 'dulieuphapluat'),
      filePrefix: 'upd-',
      // handleDetailPage writes into a JsonBatchWriter-like sink; capture its
      // single record instead so the shared runner owns batching.
      parseDetailPage: async ($, url) => {
        const out: Record<string, unknown>[] = [];
        await handleDetailPage($, url, 'json', { add: (d: Record<string, unknown>) => out.push(d) } as any);
        return out.length ? out : null;
      },
      ...options,
    });
  }
  if (dataset === 'tax-registry') {
    const { runDulieuphapluatTaxRegistryCrawler } = await import('../crawlers/dulieuphapluat/tax-registry.js');
    return runDulieuphapluatTaxRegistryCrawler(options);
  }
  if (dataset === 'form-templates') {
    const { runDulieuphapluatFormTemplateCrawler } = await import('../crawlers/dulieuphapluat/form-templates.js');
    return runDulieuphapluatFormTemplateCrawler(options);
  }
  if (dataset === 'legal-terms') {
    const { runDulieuphapluatLegalTermCrawler } = await import('../crawlers/dulieuphapluat/legal-terms.js');
    return runDulieuphapluatLegalTermCrawler(options);
  }
  if (dataset === 'so-tay-ke-toan') {
    const { runDulieuphapluatAccountingHandbookCrawler } = await import('../crawlers/dulieuphapluat/accounting-handbook.js');
    return runDulieuphapluatAccountingHandbookCrawler(options);
  }
  if (GENERIC_TABLE_KEYS.includes(dataset)) {
    const { runGenericTableToolCrawler } = await import('../crawlers/dulieuphapluat/generic-table-tools.js');
    return runGenericTableToolCrawler(dataset, options);
  }
  if (DIRECTORY_KEYS.includes(dataset)) {
    const { runDirectoryToolCrawler } = await import('../crawlers/dulieuphapluat/directory-tools.js');
    return runDirectoryToolCrawler(dataset, options);
  }
  throw new Error(`Unknown update-job dataset: "${dataset}"`);
}

const dataset = process.env.JOB_DATASET;
if (!dataset) {
  logger.error('JOB_DATASET env var is required');
  process.exit(2);
}

const maxNewUrls = process.env.JOB_MAX_NEW_URLS ? parseInt(process.env.JOB_MAX_NEW_URLS, 10) : undefined;

run(dataset, { update: { maxNewUrls, resultFile: process.env.JOB_RESULT_FILE } })
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(`update job "${dataset}" crashed: ${(err as Error).message}`);
    process.exit(1);
  });
