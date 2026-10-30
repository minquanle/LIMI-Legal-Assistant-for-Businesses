import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import { prisma } from '../infrastructure/db.js';

/**
 * Imports the already-crawled dulieuphapluat.vn reference datasets (JSON
 * batch files, gzip-compressed) into the generic `reference_lookups` table.
 *
 * Usage (run from packages/backend, on the server where the crawler's
 * `data/` output actually lives):
 *   tsx src/scripts/import-reference-lookup.ts tax-registry
 *   tsx src/scripts/import-reference-lookup.ts admin-unit
 *   tsx src/scripts/import-reference-lookup.ts land-price
 *   tsx src/scripts/import-reference-lookup.ts all
 *
 * Re-runnable: each run wipes that dataset's existing rows first (simplest
 * way to stay correct as the source crawl keeps growing/changing), then
 * re-inserts from the current files on disk.
 */

const CRAWLER_DATA_DIR = path.resolve(process.cwd(), '..', 'crawler', 'data');

function readFiles(filePaths: string[]): any[] {
  const all: any[] = [];
  for (const filePath of filePaths) {
    const text = zlib.gunzipSync(fs.readFileSync(filePath)).toString('utf-8').normalize('NFC');
    const arr = JSON.parse(text);
    all.push(...arr.flatMap((item: unknown) => (Array.isArray(item) ? item : [item])));
  }
  return all;
}

function readBatchFiles(dirName: string): any[] {
  const dir = path.join(CRAWLER_DATA_DIR, dirName);
  if (!fs.existsSync(dir)) {
    console.warn(`[import-reference-lookup] Directory not found, skipping: ${dir}`);
    return [];
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json.gz'));
  const all: any[] = [];
  for (const file of files) {
    const buf = fs.readFileSync(path.join(dir, file));
    // Normalize to NFC before parsing, as a defensive measure against any
    // NFD-decomposed Vietnamese diacritics in JSON keys from some crawls.
    const text = zlib.gunzipSync(buf).toString('utf-8').normalize('NFC');
    const arr = JSON.parse(text);
    // Some datasets (verified on dulieuphapluat-don-vi-hanh-chinh) batch one
    // scraped page's whole record list as a single array element instead of
    // spreading it, so a "1000-record" batch file is actually an array of
    // ~1000 per-page arrays (size varying with how many wards that page
    // had) — every `record['Tên đơn vị']`-style lookup below silently saw
    // an array instead of an object and produced 0 rows. Flatten one level
    // defensively; datasets that are already a flat array of objects pass
    // through unchanged since Array.isArray(record) is false for them.
    all.push(...arr.flatMap((item: unknown) => (Array.isArray(item) ? item : [item])));
  }
  return all;
}

// Best-effort slug -> readable label (no diacritic restoration, e.g.
// "cao-bang" -> "Cao Bang" not "Cao Bằng"); good enough for a subtitle and
// still matches on user search since unaccent() strips diacritics anyway.
function deslug(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function provinceFromSourceUrl(sourceUrl: string | undefined): string {
  if (!sourceUrl) return '';
  const match = sourceUrl.match(/\/([a-z0-9-]+)\.html$/i);
  return match ? deslug(match[1]) : '';
}

interface Row {
  title: string;
  subtitle: string | null;
  searchText: string;
  data: unknown;
}

function transformTaxRegistry(records: any[]): Row[] {
  return records
    .filter((r) => r.taxCode && r.legalName)
    .map((r) => ({
      title: r.legalName,
      subtitle: r.taxCode,
      searchText: [r.legalName, r.taxCode, r.address, r.legalRepresentative].filter(Boolean).join(' '),
      data: r,
    }));
}

function transformAdminUnit(newUnitDirRecords: any[], oldDistrictUnits: any[]): Row[] {
  const rows: Row[] = [];

  // The "new" directory actually mixes two record shapes across its batch
  // files: current-ward records ("Tên đơn vị") and, separately, each ward's
  // list of the pre-2025 wards/communes that merged into it ("Đơn vị hành
  // chính cũ") — the latter is the most useful shape for "tra ngược" a
  // pre-merger name, more granular than the district-level oldDistrictUnits
  // dataset below.
  for (const r of newUnitDirRecords) {
    const newName = r['Tên đơn vị'];
    if (newName) {
      const province = provinceFromSourceUrl(r.sourceUrl);
      rows.push({
        title: newName,
        subtitle: province || null,
        searchText: [newName, province, r['Mã'], r['Hình thành từ']].filter(Boolean).join(' '),
        data: { ...r, kind: 'new', province },
      });
      continue;
    }

    const oldWardName = r['Đơn vị hành chính cũ'];
    if (oldWardName) {
      const newUnitSlug = provinceFromSourceUrl(r.sourceUrl); // sourceUrl here points at the *new* unit's own page
      rows.push({
        title: oldWardName,
        subtitle: r['Trước đây thuộc'] ? `${r['Trước đây thuộc']} (cũ)` : 'Đơn vị cũ',
        searchText: [oldWardName, r['Trước đây thuộc'], r['Mã cũ'], newUnitSlug].filter(Boolean).join(' '),
        data: { ...r, kind: 'old-ward' },
      });
    }
  }

  for (const r of oldDistrictUnits) {
    const name = r['Đơn vị cấp huyện cũ'];
    if (!name) continue;
    const province = provinceFromSourceUrl(r.sourceUrl);
    rows.push({
      title: name,
      subtitle: province ? `${province} (cũ)` : 'Đơn vị cũ',
      searchText: [name, province, r['Mã']].filter(Boolean).join(' '),
      data: { ...r, kind: 'old-district', province },
    });
  }
  return rows;
}

function firstPriceField(r: any): string | null {
  for (const key of ['VT1', 'VT2', 'VT3', 'VT4', 'VT5']) {
    if (r[key]) return `${key}: ${r[key]} đ/m²`;
  }
  return null;
}

function transformLandPrice(records: any[]): Row[] {
  return records
    .filter((r) => r['Đoạn'] || r['tableCaption'])
    .map((r) => {
      const title = r['tableCaption'] || r['Đoạn'] || 'Giá đất';
      const segment = r['Đoạn'] ? `${r['Đoạn']} - ${r['Loại đất'] || ''}` : '';
      return {
        title,
        subtitle: firstPriceField(r),
        searchText: [title, segment, r['Loại đất']].filter(Boolean).join(' '),
        data: r,
      };
    });
}

function externalKeyOf(data: unknown): string {
  return crypto.createHash('sha1').update(JSON.stringify(data)).digest('hex');
}

/** Incremental: add only rows whose source record isn't already present. */
async function appendDataset(datasetKey: string, rows: Row[]) {
  let imported = 0;
  const BATCH = 2000;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH).map((r) => ({
      datasetKey,
      title: r.title.slice(0, 500),
      subtitle: r.subtitle?.slice(0, 500) ?? null,
      searchText: r.searchText,
      data: r.data as any,
      externalKey: externalKeyOf(r.data),
    }));
    const res = await prisma.referenceLookup.createMany({ data: chunk, skipDuplicates: true });
    imported += res.count;
  }
  console.log(`[${datasetKey}] Appended ${imported} new rows (of ${rows.length} candidates).`);
  console.log(`IMPORTED=${imported}`);
}

async function importDataset(datasetKey: string, rows: Row[]) {
  console.log(`[${datasetKey}] Wiping existing rows...`);
  await prisma.referenceLookup.deleteMany({ where: { datasetKey } });

  console.log(`[${datasetKey}] Inserting ${rows.length} rows...`);
  const BATCH = 2000;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH).map((r) => ({
      datasetKey,
      title: r.title.slice(0, 500),
      subtitle: r.subtitle?.slice(0, 500) ?? null,
      searchText: r.searchText,
      data: r.data as any,
      externalKey: externalKeyOf(r.data),
    }));
    await prisma.referenceLookup.createMany({ data: chunk, skipDuplicates: true });
    if ((i / BATCH) % 20 === 0) {
      console.log(`[${datasetKey}] ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    }
  }
  console.log(`[${datasetKey}] Done.`);
}

async function main() {
  const target = process.argv[2] || 'all';

  // --append <comma-separated batch files>: add only new rows from those files (used by the update jobs).
  if (process.argv[3] === '--append') {
    const files = (process.argv[4] || '').split(',').filter(Boolean);
    const records = readFiles(files);
    if (target === 'tax-registry') return appendDataset(target, transformTaxRegistry(records));
    if (target === 'admin-unit') {
      const districts = records.filter((r) => r['Đơn vị cấp huyện cũ']);
      return appendDataset(target, transformAdminUnit(records.filter((r) => !r['Đơn vị cấp huyện cũ']), districts));
    }
    if (target === 'land-price') return appendDataset(target, transformLandPrice(records));
    throw new Error(`Unknown dataset: ${target}`);
  }

  if (target === 'tax-registry' || target === 'all') {
    const records = readBatchFiles('dulieuphapluat-doanh-nghiep');
    await importDataset('tax-registry', transformTaxRegistry(records));
  }

  if (target === 'admin-unit' || target === 'all') {
    const newUnits = readBatchFiles('dulieuphapluat-don-vi-hanh-chinh');
    const oldUnits = readBatchFiles('dulieuphapluat-don-vi-hanh-chinh-cu');
    await importDataset('admin-unit', transformAdminUnit(newUnits, oldUnits));
  }

  if (target === 'land-price' || target === 'all') {
    const street = readBatchFiles('dulieuphapluat-gia-dat-duong');
    const provincial = readBatchFiles('dulieuphapluat-gia-dat');
    await importDataset('land-price', transformLandPrice([...street, ...provincial]));
  }
}

main()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
