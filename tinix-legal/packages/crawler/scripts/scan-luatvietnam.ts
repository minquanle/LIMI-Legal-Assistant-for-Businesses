/**
 * LuatVietNam Lightweight Scanner
 * 
 * Brute-force scan IDs 1..maxId, fetch each page via HTTP GET,
 * extract metadata with cheerio, save formatted markdown to output dir.
 * 
 * Usage (from packages/crawler):
 *   tsx scripts/scan-luatvietnam.ts [--max=5000] [--dir=../../data/luatvietnam] [--concurrency=5]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { extractWithLLM } from './llm-extract';
import { parseTOC, generateTOCBlock, generateTOCJSON } from './index-builder';

const LVN_BASE = 'https://luatvietnam.vn';
const DEFAULT_MAX = 5000;
const DEFAULT_OUT = 'F:/workspace/tinix-legal/data/luatvietnam';
const DEFAULT_CONCURRENCY = 5;

const args = process.argv.slice(2);
const maxId = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || String(DEFAULT_MAX), 10);
const outDir = path.resolve(args.find(a => a.startsWith('--dir='))?.split('=')[1] || DEFAULT_OUT);
const concurrency = parseInt(args.find(a => a.startsWith('--concurrency='))?.split('=')[1] || String(DEFAULT_CONCURRENCY), 10);
const useLLM = args.includes('--llm');
const modeRandom = args.includes('--mode=random');
const samplesArg = parseInt(args.find(a => a.startsWith('--samples='))?.split('=')[1] || '1000', 10);

fs.mkdirSync(outDir, { recursive: true });

interface ScanResult {
  id: number;
  url: string;
  status: number | 'error';
  title: string;
  error?: string;
}

const results: ScanResult[] = [];

function extractMetadata(html: string, $: cheerio.CheerioAPI): Record<string, string> {
  const meta: Record<string, string> = {};

  // Parse 4-column metadata table
  $('table.table-bordered tr').each((_i, tr) => {
    const cells = $(tr).find('td');
    if (cells.length === 1 && (cells.first() as any).attr('colspan') === '3') {
      const text = cells.first().text().trim().toLowerCase();
      if (text.includes('trích yếu')) {
        meta.trichYeu = text.replace(/trích yếu[:\s]*/i, '').trim() || cells.first().text().trim();
      }
      return;
    }
    for (let i = 0; i < cells.length; i += 2) {
      const label = $(cells[i]).text().replace(/[:\s]/g, ' ').trim().toLowerCase();
      let value = cells[i + 1] ? $(cells[i + 1]).text().trim() : '';
      if (value) {
        value = value.split('\n')[0].trim();
        if (value.includes('Đã biết') || value.includes('Đang cập nhật') || value.includes('Vui lòng Đăng nhập')) value = '';
      }
      const trimmed = !!value && !value.toLowerCase().includes('vui lòng') ? value : '';
      if (!label) continue;

      if (label.includes('cơ quan ban hành')) meta.issuingBody = trimmed;
      else if (label.includes('số hiệu')) meta.documentNumber = trimmed;
      else if (label.includes('trích yếu')) meta.trichYeu = trimmed;
      else if (label.includes('người ký')) meta.signer = trimmed;
      else if (label.includes('loại văn bản')) meta.documentType = trimmed;
      else if (label.includes('ngày ban hành')) meta.promulgationDate = trimmed;
      else if (label.includes('ngày hết hiệu lực')) meta.expiryDate = trimmed;
      else if (label.includes('áp dụng')) meta.effectiveDate = trimmed;
      else if (label.includes('tình trạng hiệu lực')) { meta.validityStatus = trimmed; meta.preciseValidityStatus = trimmed; }
      else if (label.includes('lĩnh vực')) meta.field = trimmed;
      else if (label.includes('số công báo')) meta.gazetteNumber = trimmed;
      else if (label.includes('ngày đăng công báo')) meta.gazetteDate = trimmed;
    }
  });

  return meta;
}

/** Convert snippet of content HTML into formatted markdown (structure-aware) */
function htmlToMd(html: string): string {
  let md = html;
  // Remove empty bold tags first (avoids ** ** artifacts)
  md = md.replace(/<b>\s*<\/b>/gi, '');
  md = md.replace(/<b>\s*<span[^>]*>\s*<\/span>\s*<\/b>/gi, '');
  md = md.replace(/<b><span[^>]*>&nbsp;<\/span><\/b>/gi, '');
  md = md.replace(/<b>&nbsp;<\/b>/gi, '');
  md = md.replace(/<span[^>]*>\s*<\/span>/gi, '');
  md = md.replace(/&nbsp;/g, ' ');
  // Headers: Chương / Mục / Phần
  md = md.replace(/<b><span[^>]*>(CHƯƠNG|Chương|Mục|Phần)\s+([^<]+)<\/span><\/b>/gi, '\n## $1 $2\n');
  // Điều numbered
  md = md.replace(/<b><span[^>]*>(Điều)\s+(\d+[^<]*)<\/span><\/b>/gi, '\n### $1 $2\n');
  // Other bold as emphasis heading
  md = md.replace(/<b><span[^>]*>([^<]+)<\/span><\/b>/g, '\n**$1**\n');
  md = md.replace(/<b>([^<]+)<\/b>/g, '\n**$1**\n');
  md = md.replace(/<strong>([^<]+)<\/strong>/g, '\n**$1**\n');
  // Italic
  md = md.replace(/<i>([^<]+)<\/i>/g, '*$1*');
  md = md.replace(/<em>([^<]+)<\/em>/g, '*$1*');
  // Paragraph break -> newline
  md = md.replace(/<p[^>]*>/gi, '\n');
  md = md.replace(/<\/p>/gi, '');
  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, '');
  // HTML entities
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#(\d+);/g, (_m: string, c: string) => String.fromCharCode(Number(c)));
  // Trim whitespace per line
  md = md.replace(/[ \t]+\n/g, '\n');
  md = md.replace(/\n{4,}/g, '\n\n\n');
  return md.trim();
}

/** Clean premium noise from content HTML */
function scrubNoise(html: string): string {
  return html
    .replace(/<p>\s*Đang theo dõi\s*<\/p>/gi, '')
    .replace(/<div[^>]*class="[^"]*(?:fix_docquyen|khung_docquyen|text_docquyen)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');
}

async function scanId(id: number): Promise<ScanResult> {
  const url = `${LVN_BASE}/a-b/a-b-${id}-d1.html`;
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    if (resp.status === 404) {
      return { id, url, status: 404, title: '' };
    }

    const html = await resp.text();
    const $ = cheerio.load(html);
    const title = $('h1').first().text().trim() || $('.doc-title').text().trim() || '';

    if (!title) {
      return { id, url, status: resp.status, title: '' };
    }

    // Extract metadata
    const meta = extractMetadata(html, $);
    const docNumber = meta.documentNumber || 'unknown';
    const safeName = docNumber.replace(/[\\/:*?"<>|]/g, '_') || `id-${id}`;
    const mdDir = path.join(outDir, safeName);
    fs.mkdirSync(mdDir, { recursive: true });

    // Extract real content from the document body tab
    const contentEl = $('#noidung [data-role="content-body"]');
    const articleHtml = contentEl.length
      ? contentEl.html() || ''
      : $('.the-document-body').html() || '';

    // Build markdown
    const lines: string[] = [];
    lines.push(`# ${title}`);
    lines.push('');
    lines.push(`**Nguồn:** luatvietnam.vn`);
    lines.push(`**URL:** ${url}`);
    lines.push(`**ID:** ${id}`);
    lines.push(`**Crawl lúc:** ${new Date().toISOString()}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Metadata');
    lines.push('');
    for (const [key, val] of Object.entries(meta)) {
      if (val) lines.push(`- **${key}:** ${val}`);
    }
    lines.push('');

    // Author
    const authorEl = $('a[href*="/author/"]').first();
    if (authorEl.length) {
      lines.push('## Tác giả');
      lines.push('');
      lines.push(authorEl.text().trim());
      lines.push(`\nLink: ${authorEl.attr('href') || ''}`);
      lines.push('');
    }

    // Từ khóa
    const keywords = $('a[href*="/tu-khoa/"]').map((_, el) => ({
      text: $(el).text().trim(),
      url: $(el).attr('href') || '',
    })).get().filter((k: { text: string; url: string }) => k.text);
    if (keywords.length > 0) {
      lines.push('## Từ khóa');
      lines.push('');
      keywords.forEach((k: { text: string; url: string }) => lines.push(`- [${k.text}](${k.url})`));
      lines.push('');
    }

    // Căn cứ pháp lý
    const legalEm = $('em a').map((_, el) => {
      const parent = $(el).closest('em').text().toLowerCase();
      if (parent.includes('căn cứ')) {
        return { law: $(el).text().trim(), url: $(el).attr('href') || '' };
      }
      return null;
    }).get().filter(Boolean);
    if (legalEm.length > 0) {
      lines.push('## Căn cứ pháp lý');
      lines.push('');
      legalEm.forEach((lb: any) => lines.push(`- ${lb.law} (${lb.url})`));
      lines.push('');
    }

    // Download links
    const downloads = $('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[download]').map((_, el) => ({
      url: $(el).attr('href') || '',
      filename: $(el).attr('download') || $(el).text().trim(),
      premium: $(el).closest('[class*="premium"], [class*="lock"], .need-login').length > 0,
    })).get().filter((d: { url: string; filename: string; premium: boolean }) => d.url);
    if (downloads.length > 0) {
      lines.push('## Tải về');
      lines.push('');
      downloads.forEach((dl: { url: string; filename: string; premium: boolean }) => lines.push(`- [${dl.filename}](${dl.url}) ${dl.premium ? '(🔒 Premium)' : ''}`));
      lines.push('');
    }

    // Content
    lines.push('## Nội dung');
    lines.push('');
    const cleanContent = scrubNoise(articleHtml);
    lines.push(htmlToMd(cleanContent));

    const mdContent = lines.join('\n');
    fs.writeFileSync(path.join(mdDir, 'document.md'), mdContent, 'utf-8');
    fs.writeFileSync(path.join(mdDir, 'raw.html'), articleHtml, 'utf-8');

    // LLM structured extraction (when --llm flag is on)
    if (useLLM && articleHtml.length > 50) {
      try {
        const llmResult = await extractWithLLM(articleHtml);
        if (llmResult.source === 'llm') {
          const structuredMd = [lines.slice(0, 8).join('\n'), '', '## Nội dung', '', llmResult.markdown].join('\n');
          fs.writeFileSync(path.join(mdDir, 'document.structured.md'), structuredMd, 'utf-8');
          // Build TOC
          const toc = parseTOC(safeName, llmResult.markdown, title);
          fs.writeFileSync(path.join(mdDir, 'document.toc.json'), generateTOCJSON(toc), 'utf-8');
          // Insert TOC block into structured.md
          const tocBlock = generateTOCBlock(toc);
          // Re-read and add TOC
          const currStructured = fs.readFileSync(path.join(mdDir, 'document.structured.md'), 'utf-8');
          fs.writeFileSync(path.join(mdDir, 'document.structured.md'), tocBlock + '\n\n' + currStructured, 'utf-8');
        }
      } catch {
        console.log(`  [LLM] ID ${id}: fallback (no llm result)`);
      }
    }

    return {
      id,
      url,
      status: resp.status,
      title,
    };
  } catch (err: any) {
    return { id, url, status: 'error', title: '', error: err.message };
  }
}

async function main() {
  console.log(`=== LuatVietNam Scanner ===`);
  console.log(`Max ID: ${maxId}, Output: ${outDir}, Concurrency: ${concurrency}`);
  console.log(`LLM extraction: ${useLLM ? 'ON' : 'OFF'}`);
  if (modeRandom) console.log(`Mode: RANDOM STRATIFIED (${samplesArg} samples)`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('');

  // Determine which IDs to scan
  let ids: number[];
  if (modeRandom) {
    // Stratified sampling — first discover which IDs exist via HEAD probes
    const kBaseStrata = [
      { start: 1, end: 500, count: Math.round(samplesArg * 0.17) },
      { start: 501, end: 2000, count: Math.round(samplesArg * 0.17) },
      { start: 2001, end: 5000, count: Math.round(samplesArg * 0.17) },
      { start: 5001, end: 10000, count: Math.round(samplesArg * 0.17) },
      { start: 10001, end: 50000, count: Math.round(samplesArg * 0.17) },
      { start: 50001, end: 500000, count: Math.round(samplesArg * 0.15) },
    ];

    if (!args.includes('--skip-probe')) {
      console.log('PHASE 1: Fast probe 1..50000 to discover existing IDs...');
      // Brute-force HEAD is unreliable (returns 200 for 404).
      // Instead: fast GET with body check for existence (check title presence)
      const probeMax = 50000;
      const probeConcurrency = 20;
      const foundIds: Set<number> = new Set();
      let probed = 0;

      for (let start = 1; start <= probeMax; start += probeConcurrency) {
        const batch: number[] = [];
        for (let i = start; i < start + probeConcurrency && i <= probeMax; i++) batch.push(i);
        const results = await Promise.all(batch.map(async id => {
          try {
            const url = `${LVN_BASE}/a-b/a-b-${id}-d1.html`;
            const resp = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'follow' });
            if (resp.status !== 200) return null;
            const text = await resp.text();
            // Quick check: page has h1 or doc-title?
            if (text.includes('<h1') || text.includes('class="doc-title"') || text.includes('property="og:title"')) return id;
            return null;
          } catch { return null; }
        }));
        for (const id of results) if (id !== null) foundIds.add(id);
        probed += batch.length;
        if (probed % 1000 === 0 || probed >= probeMax) {
          console.log(`  Probe: ${probed}/${probeMax} — ${foundIds.size} found`);
        }
      }

      console.log(`  Probe complete: ${foundIds.size} existing IDs found (1..${probeMax})`);
      const existingPool = Array.from(foundIds).sort((a, b) => a - b);
      fs.writeFileSync(path.join(outDir, '_existing-ids.json'), JSON.stringify(existingPool, null, 2), 'utf-8');

      // Sample from each stratum
      ids = [];
      for (const s of kBaseStrata) {
        const pool = existingPool.filter(id => id >= s.start && id <= s.end);
        // Shuffle and take sample
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const taken = pool.slice(0, s.count);
        ids.push(...taken);
        console.log(`  ${s.start.toLocaleString()}–${s.end.toLocaleString()}: ${pool.length} existing, sampled ${taken.length}`);
      }
      ids.sort((a, b) => a - b);
      console.log(`Total samples for LLM: ${ids.length}`);
    } else {
      // Use existing probe data
      const existingPath = path.join(outDir, '_existing-ids.json');
      if (fs.existsSync(existingPath)) {
        const existingPool: number[] = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
        ids = [];
        for (const s of kBaseStrata) {
          const pool = existingPool.filter(id => id >= s.start && id <= s.end);
          const sample = pool.sort(() => Math.random() - 0.5).slice(0, s.count);
          ids.push(...sample);
          console.log(`  ${s.start.toLocaleString()}–${s.end.toLocaleString()}: ${pool.length} existing, sampled ${sample.length}`);
        }
        ids.sort((a, b) => a - b);
        console.log(`Total samples: ${ids.length}`);
      } else {
        console.log('No probe data found at _existing-ids.json. Run without --skip-probe first.');
        process.exit(1);
      }
    }
  } else {
    ids = Array.from({ length: maxId }, (_, i) => i + 1);
  }
  let success = 0;
  let notFound = 0;
  let errors = 0;
  const startTime = Date.now();

  // Process in batches
  for (let start = 0; start < ids.length; start += concurrency) {
    const batch = ids.slice(start, start + concurrency);
    const batchResults = await Promise.all(batch.map(id => scanId(id)));

    for (const r of batchResults) {
      results.push(r);
      if (r.status === 200 && r.title) {
        success++;
        process.stdout.write('.');
      } else if (r.status === 404) {
        notFound++;
        process.stdout.write('×');
      } else {
        errors++;
        process.stdout.write('!');
      }
    }

    if ((start + concurrency) % 500 < concurrency || (start + concurrency) >= ids.length) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const pct = Math.round((start + concurrency) / ids.length * 100);
      const rate = start + concurrency > 0 ? Math.round(((start + concurrency) / elapsed) * 60) : 0;
      console.log(`  [${Math.min(start + concurrency, ids.length)}/${ids.length}] ${pct}% — ${success} OK / ${notFound} 404 / ${errors} ERR — ${rate} req/min`);
    }

    // Small delay between batches
    if (start + concurrency < ids.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  console.log('');
  console.log('=== KẾT THÚC ===');
  console.log(`Thời gian: ${mins}m${secs}s`);
  console.log(`Thành công: ${success}`);
  console.log(`Không tìm thấy (404): ${notFound}`);
  console.log(`Lỗi: ${errors}`);
  console.log(`Tổng: ${results.length}`);

  // Save scan summary
  const summaryPath = path.join(outDir, '_scan-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    scanTime: new Date().toISOString(),
    maxId,
    success,
    notFound,
    errors,
    total: results.length,
    durationSec: elapsed,
  }, null, 2), 'utf-8');
  console.log(`\nSummary saved to: ${summaryPath}`);

  // Generate INDEX.md
  const indexLines: string[] = [];
  indexLines.push('# LuatVietNam Scan Results');
  indexLines.push('');
  indexLines.push(`- Scan: ${new Date().toISOString()}`);
  indexLines.push(`- IDs: 1..${maxId}`);
  indexLines.push(`- Success: ${success}, 404: ${notFound}, Errors: ${errors}`);
  indexLines.push('');
  indexLines.push('## Documents found');
  indexLines.push('');
  indexLines.push('| # | Doc Number | Title | URL |');
  indexLines.push('|---|-----------|-------|-----|');
  let idx = 0;
  for (const r of results) {
    if (r.title) {
      idx++;
      let docNum = 'unknown';
      try {
        const metaStr = fs.readFileSync(path.join(outDir, `${String(r.id)}_${r.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40)}`, 'document.md'), 'utf-8');
        const m = metaStr.match(/\*\*documentNumber:\*\* (.+)/);
        if (m) docNum = m[1];
      } catch { /* use fallback */ }
      indexLines.push(`| ${idx} | ${docNum} | ${r.title} | ${r.url} |`);
    }
  }
  const indexPath = path.join(outDir, 'INDEX.md');
  fs.writeFileSync(indexPath, indexLines.join('\n'), 'utf-8');
  console.log(`INDEX.md saved to: ${indexPath}`);
}

main().catch(console.error);
