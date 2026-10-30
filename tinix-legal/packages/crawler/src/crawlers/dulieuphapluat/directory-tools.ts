import path from 'path';
import logger from '../../utils/logger.js';
import { runSitemapJsonCrawl, type SitemapJsonCrawlOptions } from './sitemap-json-runner.js';

/**
 * A second small family of dulieuphapluat.vn "công cụ" pages: card-list
 * directories (one entry per organization) rather than the
 * generic-table-tools.ts family's `<table>` rows. Verified live for 3 of
 * the ~6 tools that don't use `table.gc-table`:
 *  - công ty niêm yết (listed companies): `.nym-list article.nym-card`
 *  - bảo tàng (museums): `.bt-list article.bt-item` — excluded from the
 *    run list (not legal/business/administrative), kept here only because
 *    it's already verified/coded; see index.ts's DATASETS_TO_RUN.
 *  - văn phòng công chứng (notary offices): `.tco-list .tco-item` — like
 *    tax-registry.ts, each card includes the office's "Người đại diện"
 *    (legal representative) name; same public-business-registration-data
 *    reasoning applies. NOTE: each province page paginates past 20 entries
 *    (`?page=2`, `?page=3`, ...) via query string, and only the page-1 URL
 *    is in sitemap-danh-ba.xml — larger cities (e.g. Hà Nội's 47 offices)
 *    are undercounted to their first 20 until pagination-following is
 *    added. Flagged, not silently swallowed.
 *
 * The other ~3 non-table tools (sổ tay kế toán, trường học, bảng phiên âm
 * IPA) use yet other structures and are out of scope anyway (not
 * legal/business/administrative) — not covered.
 *
 * NOT wired into ecosystem.prod.config.js / not run yet — started on
 * explicit go-ahead, and even then only the subset in index.ts's
 * DATASETS_TO_RUN (legal/business/public-administration relevant; the
 * general reference-data tools like bảo tàng are excluded per the user's
 * explicit scoping).
 */

export interface DirectoryToolConfig {
  key: string;
  sitemapIndexUrl: string | string[];
  outputDirName: string;
  listSelector: string; // container of the repeated card elements
  itemSelector: string; // one card
}

export const DIRECTORY_TOOLS: DirectoryToolConfig[] = [
  {
    key: 'cong-ty-niem-yet',
    sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-cong-ty-niem-yet.xml',
    outputDirName: 'dulieuphapluat-cong-ty-niem-yet',
    listSelector: '.nym-list',
    itemSelector: 'article.nym-card',
  },
  {
    key: 'bao-tang',
    sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-bao-tang.xml',
    outputDirName: 'dulieuphapluat-bao-tang',
    listSelector: '.bt-list',
    itemSelector: 'article.bt-item',
  },
  {
    key: 'van-phong-cong-chung',
    sitemapIndexUrl: 'https://dulieuphapluat.vn/sitemap-danh-ba.xml',
    outputDirName: 'dulieuphapluat-van-phong-cong-chung',
    listSelector: '.tco-list',
    itemSelector: '.tco-item',
  },
];

/**
 * Generic card-item extractor: for each `itemSelector` element, captures
 * its title+link (from the first heading-level `<a>`), then every other
 * text-bearing child as a loosely-labeled field (falling back to
 * positional keys) — good enough for review/backfill without a bespoke
 * field map per tool, at the cost of less precise field names than
 * generic-table-tools.ts's header-driven extraction (cards have no
 * `<thead>` equivalent to name columns from). Several same-class elements
 * per card are common (e.g. `.tco-meta` repeats for address, legal
 * representative, and tax code on notary-office cards) — collected as an
 * array under that class rather than overwriting, so only the last match
 * survives.
 */
function parseCardList(listSelector: string, itemSelector: string) {
  return ($: any, url: string): Record<string, unknown>[] | null => {
    const records: Record<string, unknown>[] = [];
    $(listSelector)
      .find(itemSelector)
      .each((_i: number, el: any) => {
        const $el = $(el);
        const titleLink = $el.find('h1 a, h2 a, h3 a, h4 a').first();
        const title = titleLink.text().trim() || $el.find('a').first().text().trim();
        const link = titleLink.attr('href') || $el.find('a').first().attr('href') || '';
        if (!title) return;

        const fields: Record<string, string[]> = {};
        $el.find('[class]').each((_j: number, sub: any) => {
          const $sub = $(sub);
          const cls = ($sub.attr('class') || '').split(/\s+/).find((c: string) => /meta|addr|contact|tag|san|ma\b/.test(c));
          if (!cls) return;
          const text = $sub.text().trim();
          if (!text) return;
          (fields[cls] ??= []).push(text);
        });
        const flatFields: Record<string, string | string[]> = {};
        for (const [k, v] of Object.entries(fields)) flatFields[k] = v.length === 1 ? v[0] : v;

        records.push({
          title,
          url: link ? (link.startsWith('http') ? link : new URL(link, url).toString()) : '',
          ...flatFields,
          sourceUrl: url,
        });
      });
    return records.length > 0 ? records : null;
  };
}

function progressFilePath(datasetKey: string, shardIndex?: number, shardCount?: number): string {
  const suffix = shardCount && shardCount > 1 ? `-s${shardIndex}` : '';
  return path.resolve(process.cwd(), `dulieuphapluat-${datasetKey}-progress${suffix}.json`);
}

export async function runDirectoryToolCrawler(
  datasetKey: string,
  options?: Omit<SitemapJsonCrawlOptions, 'datasetName' | 'sitemapIndexUrl' | 'progressFilePath' | 'jsonOutputDir' | 'filePrefix' | 'parseDetailPage'>,
) {
  const cfg = DIRECTORY_TOOLS.find((c) => c.key === datasetKey);
  if (!cfg) throw new Error(`Unknown directory-tool dataset key: "${datasetKey}". Valid keys: ${DIRECTORY_TOOLS.map((c) => c.key).join(', ')}`);

  const shardCount = options?.shardCount && options.shardCount > 1 ? options.shardCount : 1;
  await runSitemapJsonCrawl({
    datasetName: `dulieuphapluat-${cfg.key}`,
    sitemapIndexUrl: cfg.sitemapIndexUrl,
    progressFilePath: progressFilePath(cfg.key, options?.shardIndex, options?.shardCount),
    jsonOutputDir: path.resolve(process.cwd(), 'data', cfg.outputDirName),
    filePrefix: shardCount > 1 ? `batch-s${options?.shardIndex ?? 0}-` : 'batch-',
    parseDetailPage: parseCardList(cfg.listSelector, cfg.itemSelector),
    ...options,
  });
}

const isMain = process.argv[1]?.includes('directory-tools');
if (isMain) {
  const datasetKey = process.env.DULIEUPHAPLUAT_TOOL_KEY;
  if (!datasetKey) {
    logger.error('DULIEUPHAPLUAT_TOOL_KEY env var is required, e.g. DULIEUPHAPLUAT_TOOL_KEY=bao-tang');
    process.exit(1);
  }
  const maxSitemaps = parseInt(process.env.DULIEUPHAPLUAT_MAX_SITEMAPS || '1', 10);
  const runAll = process.env.DULIEUPHAPLUAT_RUN_ALL === 'true';
  const shardIndex = process.env.DULIEUPHAPLUAT_SHARD_INDEX ? parseInt(process.env.DULIEUPHAPLUAT_SHARD_INDEX, 10) : undefined;
  const shardCount = process.env.DULIEUPHAPLUAT_SHARD_COUNT ? parseInt(process.env.DULIEUPHAPLUAT_SHARD_COUNT, 10) : undefined;
  runDirectoryToolCrawler(datasetKey, { maxSitemaps, runAll, shardIndex, shardCount })
    .then(() => logger.info(`dulieuphapluat ${datasetKey} crawl batch complete`))
    .catch((err) => logger.error(`dulieuphapluat ${datasetKey} crawl failed`, { error: err.message }));
}
