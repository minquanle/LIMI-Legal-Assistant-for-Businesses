import { PlaywrightCrawler, Dataset } from 'crawlee';
import path from 'path';
import { config } from '../../config.js';
import logger from '../../utils/logger.js';
import { enqueueOrRecordFailure } from '../../queue/ingestion-queue.js';
import { assertCrawlAllowed } from '../../utils/robots.js';

const TVPL_BASE = 'https://thuvienphapluat.vn';
const LVN_BASE = 'https://luatvietnam.vn';
// Was hardcoded to a Windows-only path from the original author's machine
// (`F:/workspace/...`) — crashed or wrote to the wrong place on any other
// machine (Linux CI, another contributor, production). Defaults to a
// relative path under the crawler package's own storage dir instead.
const LVN_OUTPUT_DIR = process.env.LVN_OUTPUT_DIR || path.resolve(config.storagePath, 'luatvietnam');

/**
 * Thư viện Pháp luật (thuvienphapluat.vn) & Luật Việt Nam (luatvietnam.vn) Crawler
 * 
 * Uses PlaywrightCrawler because these commercial legal sites
 * use heavy JavaScript rendering and may have anti-bot protections.
 * 
 * Strategy:
 *  1. Crawl listing pages to discover document URLs
 *  2. Visit detail pages to extract metadata + structured content
 *  3. Download PDF/DOC attachments when available
 */
export async function runTvplCrawler(options?: {
  maxPages?: number;
  site?: 'tvpl' | 'luatvietnam' | 'both';
  mode?: 'seed' | 'daily';
  maxId?: number;
}) {
  const maxPages = options?.maxPages ?? 3;
  const site = options?.site ?? 'both';
  const mode = options?.mode ?? 'daily';
  const maxId = options?.maxId ?? 439384;

  if ((site === 'tvpl' || site === 'both') && !(await assertCrawlAllowed(TVPL_BASE, 'tvpl'))) return;
  if ((site === 'luatvietnam' || site === 'both') && !(await assertCrawlAllowed(LVN_BASE, 'luatvietnam'))) return;

  // Utility to generate shuffled IDs (Fisher-Yates)
  const generateShuffledIds = (max: number): number[] => {
    const ids = Array.from({ length: max }, (_, i) => i + 1);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  };

  const crawler = new PlaywrightCrawler({
    maxConcurrency: Math.min(config.concurrency, 2), // Conservative for commercial sites
    maxRequestsPerMinute: Math.min(config.maxRequestsPerMinute, 20),
    maxRequestRetries: config.retryCount,
    navigationTimeoutSecs: config.navigationTimeoutSecs,
    requestHandlerTimeoutSecs: 120,
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

    async requestHandler({ request, page, response }) {
      const url = request.url;
      const label = request.label || 'LIST';
      const source = url.includes('thuvienphapluat') ? 'thuvienphapluat.vn' : 'luatvietnam.vn';

      // Task 2.2: Smart skip 404
      if (response && response.status() === 404) {
        logger.info(`[404 SKIPPED] ${url}`);
        return;
      }

      logger.info(`Processing [${label}] [${source}]: ${url}`);

      // Task 2.3: Rate limit / Delay for seed mode
      if (mode === 'seed') {
        const delayMs = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
        await page.waitForTimeout(delayMs);
      }

      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {
        logger.warn(`Network idle timeout for ${url}`);
      });

      if (label === 'LIST') {
        await handleListPage(page, url, source);
      } else if (label === 'DETAIL') {
        const mdDir = mode === 'seed' ? LVN_OUTPUT_DIR : undefined;
        await handleDetailPage(page, url, source, mdDir);
      }
    },

    failedRequestHandler({ request }, error) {
      logger.error(`Request failed: ${request.url}`, { error: error.message });
    },
  });

  const startUrls: Array<{ url: string; label: string }> = [];

  if (mode === 'seed') {
    if (site === 'luatvietnam' || site === 'both') {
      const shuffledIds = generateShuffledIds(maxId);
      logger.info(`Generated ${shuffledIds.length} shuffled IDs for seed mode`);
      for (const id of shuffledIds) {
        startUrls.push({
          url: `${LVN_BASE}/a-b/a-b-${id}-d1.html`,
          label: 'DETAIL',
        });
      }
    }
    if (site === 'tvpl' || site === 'both') {
      logger.warn('Seed mode (bruteforce) is currently only implemented for luatvietnam.vn');
    }
  } else {
    if (site === 'tvpl' || site === 'both') {
      for (let p = 1; p <= maxPages; p++) {
        startUrls.push({
          url: `${TVPL_BASE}/page/tim-van-ban.aspx?keyword=&page=${p}`,
          label: 'LIST',
        });
      }
    }

    if (site === 'luatvietnam' || site === 'both') {
      for (let p = 1; p <= maxPages; p++) {
        startUrls.push({
          url: `${LVN_BASE}/van-ban?page=${p}`,
          label: 'LIST',
        });
      }
    }
  }

  logger.info(`Starting TVPL/LuatVN crawler with ${startUrls.length} URLs`);
  await crawler.run(startUrls);
  logger.info('TVPL/LuatVN crawler finished');
}

async function handleListPage(page: any, url: string, source: string) {
  const documentLinks = await page.$$eval(
    'a[href*="/van-ban/"], a[href*="/chi-tiet/"], .search-result a, .document-item a',
    (anchors: HTMLAnchorElement[]) =>
      anchors
        .filter((a) => a.href && a.textContent?.trim())
        .map((a) => ({
          url: a.href,
          title: a.textContent?.trim() || '',
        }))
  );

  const uniqueUrls = [...new Set(documentLinks.map((l: any) => l.url))];
  logger.info(`Found ${uniqueUrls.length} document links on ${url}`);

  for (const docUrl of uniqueUrls) {
    await Dataset.pushData({
      type: 'DOCUMENT_LINK',
      source,
      url: docUrl,
      discoveredAt: new Date().toISOString(),
    });
  }
}

async function handleDetailPage(page: any, url: string, source: string, mdOutputDir?: string) {
  const title = await page.$eval(
    'h1, [class*="title"], .doc-title',
    (el: HTMLElement) => el.textContent?.trim() || ''
  ).catch(() => '');

  const contentHtml = await page.$eval(
    '[class*="content"], [class*="fulltext"], [class*="noidung"], .toan-van, article',
    (el: HTMLElement) => el.innerHTML
  ).catch(() => '');

  // Extract metadata
  const metadata: Record<string, string> = {};

  // --- FIX: Parse 4-column metadata table by column pairs ---
  const tableMeta = await page.$eval('table.table-bordered', (table: HTMLElement) => {
    const res: Record<string, string> = {};
    const rows = table.querySelectorAll('tr');
    rows.forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('td'));
      // Handle colspan=3 row (TrichYeu)
      if (cells.length === 1 && cells[0].colSpan === 3) {
        const label = cells[0].textContent?.replace(/[:\s]/g, ' ').trim().toLowerCase() || '';
        const val = cells[0].textContent?.trim() || '';
        if (label.includes('trích yếu')) res.trichYeu = val;
        return;
      }
      // Standard 4-column row: label1 | val1 | label2 | val2
      for (let i = 0; i < cells.length; i += 2) {
        if (!cells[i]) continue;
        const labelText = (cells[i] as HTMLElement).textContent?.replace(/[:\s]/g, ' ').trim().toLowerCase() || '';
        const valText = cells[i + 1] ? (cells[i + 1] as HTMLElement).textContent?.trim() || '' : '';
        if (!labelText) continue;

        if (labelText.includes('cơ quan ban hành')) res.issuingBody = valText;
        else if (labelText.includes('số hiệu')) res.documentNumber = valText;
        else if (labelText.includes('trích yếu')) res.trichYeu = valText;
        else if (labelText.includes('người ký')) res.signer = valText;
        else if (labelText.includes('loại văn bản')) res.documentType = valText;
        else if (labelText.includes('ngày ban hành')) res.promulgationDate = valText;
        else if (labelText.includes('ngày hết hiệu lực')) res.expiryDate = valText;
        else if (labelText.includes('áp dụng')) res.effectiveDate = valText;
        else if (labelText.includes('tình trạng hiệu lực')) { res.validityStatus = valText; res.preciseValidityStatus = valText; }
        else if (labelText.includes('lĩnh vực')) res.field = valText;
        else if (labelText.includes('số công báo')) res.gazetteNumber = valText;
        else if (labelText.includes('ngày đăng công báo')) res.gazetteDate = valText;
        else if (labelText.includes('hợp nhất')) res.isConsolidated = 'true';
        else if (labelText.includes('tiếng anh') || labelText.includes('translation')) res.isTranslation = 'true';
      }
    });
    return res;
  }).catch(() => ({}));
  Object.assign(metadata, tableMeta);

  // --- Author extraction ---
  const author = await page.$eval('a[href*="/author/"]', (el: HTMLElement) => ({
    name: el.textContent?.trim() || '',
    url: (el as HTMLAnchorElement).href || '',
  })).catch(() => ({ name: '', url: '' }));
  if (author.name) {
    metadata.author = author.name;
    metadata.authorUrl = author.url;
  }

  // --- Last updated date ---
  const updateText = await page.evaluate(() => {
    const all = document.querySelectorAll('span, div, p');
    for (const el of all) {
      if (el.textContent?.includes('Ngày cập nhật:')) return el.textContent?.trim() || '';
    }
    return '';
  }).catch(() => '');
  if (updateText) {
    const dateMatch = updateText.match(/(\d{2}\/\d{2}\/\d{4}) (\d{2}:\d{2})/);
    if (dateMatch) metadata.lastUpdatedAt = `${dateMatch[1]} ${dateMatch[2]}`;
  }

  // --- Keywords extraction ---
  const keywords = await page.$$eval(
    'div:has(> :has-text("Từ khóa")) a:not(:has(img)), a[href*="/tu-khoa/"]',
    (anchors: HTMLAnchorElement[]) => anchors.map(a => ({
      text: a.textContent?.trim() || '',
      url: a.href || '',
    })).filter(k => k.text)
  ).catch(() => []);
  if (keywords.length > 0) {
    metadata.keywords = JSON.stringify(keywords);
  }

  // --- Legal basis (Căn cứ) extraction ---
  const legalBasis = await page.$$eval('em a, p a[href*="/"]', (anchors: HTMLAnchorElement[]) => {
    const results: Array<{ law: string; number: string; url: string }> = [];
    anchors.forEach(a => {
      const parentText = a.closest('em, p')?.textContent?.toLowerCase() || '';
      if (parentText.includes('căn cứ') || parentText.includes('theo đề nghị')) {
        results.push({
          law: a.textContent?.trim() || '',
          number: a.textContent?.trim() || '',
          url: a.href || '',
        });
      }
    });
    return results;
  }).catch((): Array<{ law: string; number: string; url: string }> => []);
  if (legalBasis.length > 0) {
    metadata.legalBasis = JSON.stringify(legalBasis);
    // Also create CAN_CU relationships
    const rels = legalBasis.map((r: { law: string; number: string; url: string }) => ({
      targetDocNumber: r.number,
      relationshipType: 'CAN_CU',
    }));
    const existingRels: any[] = metadata.rawRelationships ? JSON.parse(metadata.rawRelationships) : [];
    existingRels.push(...rels);
    metadata.rawRelationships = JSON.stringify(existingRels);
  }

  // --- Repeal (Bãi bỏ) detection from article body ---
  const repealMatches = contentHtml.match(/Bãi bỏ.*?số\s+([\d\/\-\wÀ-ỹ]+)/gi);
  if (repealMatches) {
    const repealRels = repealMatches.map((m: string) => {
      const numMatch = m.match(/số\s+([\d\/\-\wÀ-ỹ]+)/);
      return {
        targetDocNumber: numMatch ? numMatch[1] : m,
        relationshipType: 'BAI_BO',
      };
    });
    const existingRels: any[] = metadata.rawRelationships ? JSON.parse(metadata.rawRelationships) : [];
    existingRels.push(...repealRels);
    metadata.rawRelationships = JSON.stringify(existingRels);
  }

  // --- Keywords as LIEN_QUAN relationships ---
  if (keywords.length > 0) {
    const kwRels = keywords.map((k: { text: string; url: string }) => ({
      targetDocNumber: k.text,
      relationshipType: 'LIEN_QUAN',
    }));
    const existingRels: any[] = metadata.rawRelationships ? JSON.parse(metadata.rawRelationships) : [];
    existingRels.push(...kwRels);
    metadata.rawRelationships = JSON.stringify(existingRels);
  }

  // --- Gov header extraction ---
  const govHeader = await page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    for (const table of Array.from(tables)) {
      const text = table.textContent || '';
      if ((text.includes('CHÍNH PHỦ') || text.includes('QUỐC HỘI')) && text.includes('Hà Nội')) {
        const cells = Array.from(table.querySelectorAll('td'));
        return {
          issuingBodyShort: cells[0]?.textContent?.split(/\n\n/)[0]?.trim() || '',
          location: cells[1]?.textContent?.split('Hà Nội,').slice(1).join('Hà Nội,').trim() || '',
          fullHeader: text.replace(/\s+/g, ' ').trim(),
        };
      }
    }
    return null;
  }).catch(() => null);
  if (govHeader) {
    metadata.govHeaderIssuer = govHeader.issuingBodyShort;
    metadata.govHeaderLocation = govHeader.location;
  }

  // --- Find download links (mark premium) ---
  const downloadLinks = await page.$$eval(
    'a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[download]',
    (anchors: HTMLAnchorElement[]) =>
      anchors.map((a) => ({
        url: a.href,
        filename: a.download || a.textContent?.trim() || '',
        premium: a.closest('[class*="premium"], [class*="lock"], .need-login') !== null,
      }))
  ).catch(() => []);

  // --- Build result ---
  const result: Record<string, any> = {
    type: 'RAW_DOCUMENT',
    source,
    url,
    title,
    author: author.name,
    authorUrl: author.url,
    keywords,
    legalBasis,
    govHeader: govHeader || null,
    metadata,
    contentHtml,
    downloadLinks,
    crawledAt: new Date().toISOString(),
  };

  // --- Save Markdown to file if mdOutputDir is provided ---
  if (mdOutputDir) {
    const docNumber = metadata.documentNumber || 'unknown';
    const safeName = docNumber.replace(/[\\/:*?"<>|]/g, '_') || `id-${Date.now()}`;
    const mdDir = `${mdOutputDir}/${safeName}`;
    const fs = require('fs');
    const path = require('path');
    fs.mkdirSync(mdDir, { recursive: true });

    // Clean content HTML (remove "Đang theo dõi")
    const cleanContent = contentHtml.replace(/<p>\s*Đang theo dõi\s*<\/p>/gi, '');

    // Build markdown
    const lines: string[] = [];
    lines.push(`# ${title}`);
    lines.push('');
    lines.push(`**Nguồn:** ${source}`);
    lines.push(`**URL:** ${url}`);
    lines.push(`**Cào lúc:** ${result.crawledAt}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Metadata');
    lines.push('');
    for (const [key, val] of Object.entries(metadata)) {
      if (val && !['rawRelationships', 'keywords', 'legalBasis'].includes(key)) {
        lines.push(`- **${key}:** ${val}`);
      }
    }
    lines.push('');
    lines.push('## Tác giả');
    lines.push('');
    lines.push(author.name || '(không có)');
    if (author.url) lines.push(`\nLink: ${author.url}`);
    lines.push('');

    if (keywords.length > 0) {
      lines.push('## Từ khóa liên quan');
      lines.push('');
      keywords.forEach((k: { text: string; url: string }) => lines.push(`- [${k.text}](${k.url})`));
      lines.push('');
    }

    if (legalBasis.length > 0) {
      lines.push('## Căn cứ pháp lý');
      lines.push('');
      legalBasis.forEach((lb: { law: string; number: string; url: string }) => lines.push(`- ${lb.law} (\`${lb.number}\`) - <${lb.url}>`));
      lines.push('');
    }

    if (downloadLinks.length > 0) {
      lines.push('## Tải về');
      lines.push('');
      downloadLinks.forEach((dl: { url: string; filename: string; premium: boolean }) => lines.push(`- [${dl.filename}](${dl.url}) ${dl.premium ? '(Premium)' : ''}`));
      lines.push('');
    }

    lines.push('## Nội dung');
    lines.push('');
    // Extract clean text (lightweight)
    const cleanText = cleanContent
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\\s+/g, ' ')
      .trim();
    lines.push(cleanText);

    const mdContent = lines.join('\n');
    fs.writeFileSync(path.join(mdDir, 'document.md'), mdContent, 'utf-8');
    // Save raw HTML too
    fs.writeFileSync(path.join(mdDir, 'raw.html'), contentHtml, 'utf-8');

    logger.info(`Saved markdown to ${mdDir}/document.md`);
    result.mdDir = mdDir;
  }

  await Dataset.pushData(result);
  await enqueueOrRecordFailure({
    source,
    url,
    title,
    metadata,
    contentHtml,
    crawledAt: result.crawledAt,
  });

  logger.info(`Extracted document: ${title || url}`);
}

const isMain = process.argv[1]?.includes('tvpl');
if (isMain) {
  const mode = process.argv.includes('--seed') ? 'seed' : 'daily';
  const dryRun = process.argv.includes('--dry-run');
  const maxId = dryRun ? 100 : 439384;

  logger.info(`Starting crawler in ${mode} mode${dryRun ? ' (DRY RUN)' : ''}`);

  runTvplCrawler({ maxPages: 2, site: 'both', mode, maxId })
    .then(() => logger.info('TVPL/LuatVN crawl complete'))
    .catch((err) => logger.error('TVPL/LuatVN crawl failed', { error: err.message }));
}
