import path from 'path';
import logger from '../../utils/logger.js';
import { runSitemapJsonCrawl, type SitemapJsonCrawlOptions } from './sitemap-json-runner.js';

/**
 * dulieuphapluat.vn business tax-registry (mã số thuế) scan.
 *
 * ~1.6M company detail pages (326 sub-sitemaps × ~5000, verified live via
 * sitemaptax.xml → sitemaptax-N.xml). Each page carries the company's
 * business-registration record: legal name, tax code, registered address,
 * business lines, and — notably — the legal representative's full name
 * (with the site's own "Yêu cầu ẩn thông tin" / request-to-hide-PII
 * mechanism on that field). Collecting this at scale is a real personal-
 * data question, not just an engineering one: this was flagged to the user
 * explicitly before building this module, and the user confirmed collecting
 * the representative name in full, accepting that responsibility.
 *
 * Parses the label/value table verified live: `table.tax-detail-table td`
 * pairs — "Tên tiếng Việt", "Tên viết tắt", "Tên tiếng Anh", "Tên giao
 * dịch", "Địa chỉ", "Người đại diện", "Ngày cấp GCN ĐKKD", "Ngày bắt đầu
 * hoạt động", "Kết thúc năm tài chính" — plus `.tax-detail-meta-value`
 * (mã số thuế) and `.tax-detail-meta-chip` (trạng thái hoạt động), and a
 * second `ngành nghề kinh doanh` table for business lines.
 */
const SITEMAP_INDEX_URL = 'https://dulieuphapluat.vn/sitemaptax.xml';
const DATASET_NAME = 'dulieuphapluat-tax';

function progressFilePath(shardIndex?: number, shardCount?: number): string {
  const suffix = shardCount && shardCount > 1 ? `-s${shardIndex}` : '';
  return path.resolve(process.cwd(), `${DATASET_NAME}-progress${suffix}.json`);
}

function parseDetailPage($: any, url: string): Record<string, unknown> | null {
  const taxCode = $('.tax-detail-meta-value').first().text().trim();
  const title = $('h1.tax-detail-title').first().text().trim();
  const status = $('.tax-detail-meta-chip').first().text().trim();
  if (!taxCode || !title) {
    logger.warn(`Skipping tax-registry page with missing taxCode/title: ${url}`);
    return null;
  }

  const fields: Record<string, string> = {};
  $('table.tax-detail-table td.tax-detail-label').each((_i: number, el: any) => {
    const label = $(el).text().trim().toLowerCase();
    const value = $(el).next('td.tax-detail-value').clone();
    value.find('button, a').remove(); // strip the "Yêu cầu ẩn thông tin" action control
    const text = value.text().trim();
    if (!label || !text) return;
    if (label.includes('tên tiếng việt')) fields.legalName = text;
    else if (label.includes('tên viết tắt')) fields.shortName = text;
    else if (label.includes('tên tiếng anh')) fields.englishName = text;
    else if (label.includes('tên giao dịch')) fields.tradingName = text;
    else if (label.includes('địa chỉ')) fields.address = text;
    else if (label.includes('người đại diện')) fields.legalRepresentative = text;
    else if (label.includes('ngày cấp gcn đkkd')) fields.registrationDate = text;
    else if (label.includes('ngày bắt đầu hoạt động')) fields.operationStartDate = text;
    else if (label.includes('kết thúc năm tài chính')) fields.fiscalYearEnd = text;
  });

  const businessLines: string[] = [];
  $('.tax-section:contains("Ngành nghề kinh doanh") table td').each((_i: number, el: any) => {
    const text = $(el).text().trim();
    if (text) businessLines.push(text);
  });

  return {
    taxCode,
    legalName: fields.legalName || title,
    status,
    ...fields,
    businessLines,
    url,
    source: 'dulieuphapluat.vn',
    crawledAt: new Date().toISOString(),
  };
}

export async function runDulieuphapluatTaxRegistryCrawler(options?: Omit<SitemapJsonCrawlOptions, 'datasetName' | 'sitemapIndexUrl' | 'progressFilePath' | 'jsonOutputDir' | 'filePrefix' | 'parseDetailPage'>) {
  const shardCount = options?.shardCount && options.shardCount > 1 ? options.shardCount : 1;
  await runSitemapJsonCrawl({
    datasetName: DATASET_NAME,
    sitemapIndexUrl: SITEMAP_INDEX_URL,
    progressFilePath: progressFilePath(options?.shardIndex, options?.shardCount),
    jsonOutputDir: path.resolve(process.cwd(), 'data', 'dulieuphapluat-doanh-nghiep'),
    filePrefix: shardCount > 1 ? `batch-s${options?.shardIndex ?? 0}-` : 'batch-',
    parseDetailPage: parseDetailPage as any,
    ...options,
  });
}

const isMain = process.argv[1]?.includes('tax-registry');
if (isMain) {
  const maxSitemaps = parseInt(process.env.DULIEUPHAPLUAT_MAX_SITEMAPS || '1', 10);
  const runAll = process.env.DULIEUPHAPLUAT_RUN_ALL === 'true';
  const shardIndex = process.env.DULIEUPHAPLUAT_SHARD_INDEX ? parseInt(process.env.DULIEUPHAPLUAT_SHARD_INDEX, 10) : undefined;
  const shardCount = process.env.DULIEUPHAPLUAT_SHARD_COUNT ? parseInt(process.env.DULIEUPHAPLUAT_SHARD_COUNT, 10) : undefined;
  runDulieuphapluatTaxRegistryCrawler({ maxSitemaps, runAll, shardIndex, shardCount })
    .then(() => logger.info('dulieuphapluat tax-registry crawl batch complete'))
    .catch((err) => logger.error('dulieuphapluat tax-registry crawl failed', { error: err.message }));
}
