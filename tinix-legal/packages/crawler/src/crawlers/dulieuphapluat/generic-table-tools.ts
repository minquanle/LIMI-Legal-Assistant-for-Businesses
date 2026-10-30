import path from 'path';
import logger from '../../utils/logger.js';
import { runSitemapJsonCrawl, type SitemapJsonCrawlOptions } from './sitemap-json-runner.js';

/**
 * dulieuphapluat.vn's "công cụ tra cứu" (lookup tool) section shares one
 * page template across ~21 different reference-data domains: a lookup page
 * per region/category rendering one or more `<table class="gc-table ...">`
 * elements (verified live across ma-buu-dien, lương-tối-thiểu-vùng,
 * đơn-vị-hành-chính, giá-đất, mức-phạt, lệ-phí-trước-bạ, tài-khoản-kế-toán,
 * mã-bệnh-ICD, biển-báo, thuốc-BVTV, đa-dạng-sinh-học, cảng-biển,
 * dinh-dưỡng, từ-vựng-tiếng-Anh, di-sản-văn-hóa, doanh-nghiệp-lữ-hành,
 * cơ-sở-lưu-trú, dược-phẩm, danh-mục-dùng-chung, định-mức-xây-dựng,
 * mua-sắm-công, lý-thuyết-lái-xe). Rather than 21 near-duplicate crawler
 * modules, one generic table-row extractor (parseGenericTables) is
 * registered per dataset in GENERIC_TABLE_TOOLS below — each with its own
 * sitemap source, output subdirectory, and progress-file prefix, but
 * identical parsing logic.
 *
 * A handful of tools (công-ty-niêm-yết, bảo-tàng, văn-phòng-công-chứng,
 * sổ-tay-kế-toán, trường-học, bảng-phiên-âm-IPA) do NOT use this table
 * template — verified live — and are intentionally left out of this
 * registry; they need their own bespoke parser (not yet written).
 *
 * NOT wired into ecosystem.prod.config.js / not run yet — per the user's
 * request, these are built now but only started on explicit go-ahead,
 * given the combined additional volume here (~140K pages) and that most
 * of it is general reference data (postal codes, ICD codes, nutrition,
 * driving-theory questions) rather than legal-document content.
 */

export interface GenericTableToolConfig {
  key: string; // used in the CLI/env selector and as the default progress-file/output-dir name
  sitemapIndexUrl: string | string[];
  outputDirName: string;
}

export const GENERIC_TABLE_TOOLS: GenericTableToolConfig[] = [
  { key: 'ma-buu-dien', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-ma-buu-dien.xml', outputDirName: 'dulieuphapluat-ma-buu-dien' },
  { key: 'dinh-muc-xay-dung', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-dinh-muc-xay-dung.xml', outputDirName: 'dulieuphapluat-dinh-muc-xay-dung' },
  { key: 'danh-muc-dung-chung', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-danh-muc-dung-chung.xml', outputDirName: 'dulieuphapluat-danh-muc-dung-chung' },
  { key: 'co-so-luu-tru', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-co-so-luu-tru.xml', outputDirName: 'dulieuphapluat-co-so-luu-tru' },
  { key: 'doanh-nghiep-lu-hanh', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-doanh-nghiep-lu-hanh.xml', outputDirName: 'dulieuphapluat-doanh-nghiep-lu-hanh' },
  { key: 'di-san-van-hoa', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-di-san-van-hoa.xml', outputDirName: 'dulieuphapluat-di-san-van-hoa' },
  { key: 'duoc-pham', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-duoc-pham.xml', outputDirName: 'dulieuphapluat-duoc-pham' },
  { key: 'thuoc-bvtv', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-thuoc-bvtv.xml', outputDirName: 'dulieuphapluat-thuoc-bvtv' },
  { key: 'luong-toi-thieu-vung', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-luong-toi-thieu-vung.xml', outputDirName: 'dulieuphapluat-luong-toi-thieu-vung' },
  { key: 'mua-sam-cong', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-mua-sam-cong.xml', outputDirName: 'dulieuphapluat-mua-sam-cong' },
  { key: 'tai-khoan-ke-toan', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-tai-khoan-ke-toan.xml', outputDirName: 'dulieuphapluat-tai-khoan-ke-toan' },
  { key: 'muc-phat-nghi-dinh', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-muc-phat-nghi-dinh.xml', outputDirName: 'dulieuphapluat-muc-phat-nghi-dinh' },
  { key: 'gia-dat', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-gia-dat.xml', outputDirName: 'dulieuphapluat-gia-dat' },
  { key: 'gia-dat-duong', sitemapIndexUrl: ['https://dulieuphapluat.vn/sitemap-gia-dat-duong-1.xml', 'https://dulieuphapluat.vn/sitemap-gia-dat-duong-2.xml', 'https://dulieuphapluat.vn/sitemap-gia-dat-duong-3.xml'], outputDirName: 'dulieuphapluat-gia-dat-duong' },
  { key: 'bien-bao', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-bien-bao.xml', outputDirName: 'dulieuphapluat-bien-bao' },
  { key: 'ma-benh-icd', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-ma-benh-icd.xml', outputDirName: 'dulieuphapluat-ma-benh-icd' },
  { key: 'ly-thuyet-lai-xe', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-ly-thuyet-lai-xe.xml', outputDirName: 'dulieuphapluat-ly-thuyet-lai-xe' },
  { key: 'tu-vung-tieng-anh', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-tu-vung-tieng-anh.xml', outputDirName: 'dulieuphapluat-tu-vung-tieng-anh' },
  { key: 'dinh-duong', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-dinh-duong.xml', outputDirName: 'dulieuphapluat-dinh-duong' },
  { key: 'don-vi-hanh-chinh', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-don-vi-hanh-chinh.xml', outputDirName: 'dulieuphapluat-don-vi-hanh-chinh' },
  { key: 'don-vi-hanh-chinh-cu', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-don-vi-hanh-chinh-cu.xml', outputDirName: 'dulieuphapluat-don-vi-hanh-chinh-cu' },
  { key: 'cang-bien', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-cang-bien.xml', outputDirName: 'dulieuphapluat-cang-bien' },
  { key: 'da-dang-sinh-hoc', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-da-dang-sinh-hoc.xml', outputDirName: 'dulieuphapluat-da-dang-sinh-hoc' },
  { key: 'muc-phat-giao-thong', sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-muc-phat-1.xml', outputDirName: 'dulieuphapluat-muc-phat-giao-thong' },
  { key: 'le-phi-truoc-ba', sitemapIndexUrl: ['https://dulieuphapluat.vn/sitemap-le-phi-truoc-ba-1.xml', 'https://dulieuphapluat.vn/sitemap-le-phi-truoc-ba-2.xml'], outputDirName: 'dulieuphapluat-le-phi-truoc-ba' },
];

/**
 * Extracts every `table.gc-table` on the page as an array of row records,
 * keyed by that table's own `<thead><th>` column headers (verified stable
 * across every sampled tool). When a cell contains a link (e.g. a postal
 * code's ward drill-down, or a land-price street link), the link URL is
 * captured alongside the cell text as `<header>_link`. Each row also
 * carries the table's `<caption>` (when present — many tools render the
 * page-level context, e.g. "Mã bưu chính 126 phường... Thành phố Hà Nội",
 * only there) so a row parsed from a paginated page is still
 * self-describing once flattened into one output file.
 */
function parseGenericTables($: any, url: string): Record<string, unknown>[] | null {
  const records: Record<string, unknown>[] = [];

  $('table.gc-table').each((_i: number, table: any) => {
    const $table = $(table);
    const caption = $table.find('caption').first().text().trim();
    const headers: string[] = [];
    $table.find('thead th').each((_j: number, th: any) => headers.push($(th).text().trim() || `col${headers.length}`));
    if (headers.length === 0) return;

    $table.find('tbody tr').each((_j: number, tr: any) => {
      const $cells = $(tr).find('td');
      if ($cells.length === 0) return;
      const row: Record<string, unknown> = {};
      $cells.each((k: number, td: any) => {
        const key = headers[k] || `col${k}`;
        const $td = $(td);
        const link = $td.find('a').first().attr('href');
        row[key] = $td.text().trim();
        if (link) row[`${key}_link`] = link.startsWith('http') ? link : new URL(link, url).toString();
      });
      if (caption) row.tableCaption = caption;
      row.sourceUrl = url;
      records.push(row);
    });
  });

  return records.length > 0 ? records : null;
}

function progressFilePath(datasetKey: string, shardIndex?: number, shardCount?: number): string {
  const suffix = shardCount && shardCount > 1 ? `-s${shardIndex}` : '';
  return path.resolve(process.cwd(), `dulieuphapluat-${datasetKey}-progress${suffix}.json`);
}

export async function runGenericTableToolCrawler(
  datasetKey: string,
  options?: Omit<SitemapJsonCrawlOptions, 'datasetName' | 'sitemapIndexUrl' | 'progressFilePath' | 'jsonOutputDir' | 'filePrefix' | 'parseDetailPage'>,
) {
  const cfg = GENERIC_TABLE_TOOLS.find((c) => c.key === datasetKey);
  if (!cfg) throw new Error(`Unknown generic-table-tool dataset key: "${datasetKey}". Valid keys: ${GENERIC_TABLE_TOOLS.map((c) => c.key).join(', ')}`);

  const shardCount = options?.shardCount && options.shardCount > 1 ? options.shardCount : 1;
  await runSitemapJsonCrawl({
    datasetName: `dulieuphapluat-${cfg.key}`,
    sitemapIndexUrl: cfg.sitemapIndexUrl,
    progressFilePath: progressFilePath(cfg.key, options?.shardIndex, options?.shardCount),
    jsonOutputDir: path.resolve(process.cwd(), 'data', cfg.outputDirName),
    filePrefix: shardCount > 1 ? `batch-s${options?.shardIndex ?? 0}-` : 'batch-',
    parseDetailPage: parseGenericTables,
    ...options,
  });
}

const isMain = process.argv[1]?.includes('generic-table-tools');
if (isMain) {
  const datasetKey = process.env.DULIEUPHAPLUAT_TOOL_KEY;
  if (!datasetKey) {
    logger.error('DULIEUPHAPLUAT_TOOL_KEY env var is required, e.g. DULIEUPHAPLUAT_TOOL_KEY=ma-buu-dien');
    process.exit(1);
  }
  const maxSitemaps = parseInt(process.env.DULIEUPHAPLUAT_MAX_SITEMAPS || '1', 10);
  const runAll = process.env.DULIEUPHAPLUAT_RUN_ALL === 'true';
  const shardIndex = process.env.DULIEUPHAPLUAT_SHARD_INDEX ? parseInt(process.env.DULIEUPHAPLUAT_SHARD_INDEX, 10) : undefined;
  const shardCount = process.env.DULIEUPHAPLUAT_SHARD_COUNT ? parseInt(process.env.DULIEUPHAPLUAT_SHARD_COUNT, 10) : undefined;
  runGenericTableToolCrawler(datasetKey, { maxSitemaps, runAll, shardIndex, shardCount })
    .then(() => logger.info(`dulieuphapluat ${datasetKey} crawl batch complete`))
    .catch((err) => logger.error(`dulieuphapluat ${datasetKey} crawl failed`, { error: err.message }));
}
