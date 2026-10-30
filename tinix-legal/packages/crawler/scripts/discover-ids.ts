/**
 * Lightweight discovery: probe IDs 1..50000, detect if page has real content.
 * Saves _existing-ids.json for subsequent LLM scan.
 * 
 * Usage: npx tsx scripts/discover-ids.ts [--max=50000] [--dir=../../data/luatvietnam]
 */

import * as fs from 'fs';
import * as path from 'path';

const LVN_BASE = 'https://luatvietnam.vn';
const args = process.argv.slice(2);
const maxId = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '50000', 10);
const outDir = path.resolve(args.find(a => a.startsWith('--dir='))?.split('=')[1] || 'F:/workspace/tinix-legal/data/luatvietnam');
const concurrency = 20;

fs.mkdirSync(outDir, { recursive: true });

console.log(`=== Discovery: IDs 1..${maxId} ===`);
console.log(`Concurrency: ${concurrency}`);
console.log(`Output: ${outDir}`);
console.log(`Start: ${new Date().toISOString()}\n`);

const found: Set<number> = new Set();
const startTime = Date.now();

async function main() {
  for (let batchStart = 1; batchStart <= maxId; batchStart += concurrency) {
    const batch: number[] = [];
    for (let i = batchStart; i < batchStart + concurrency && i <= maxId; i++) batch.push(i);

    const results = await Promise.all(batch.map(async (id) => {
      try {
        const url = `${LVN_BASE}/a-b/a-b-${id}-d1.html`;
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(10000),
          redirect: 'follow',
        });
        if (resp.status !== 200) return null;
        // Read just enough to detect content
        const text = await resp.text();
        // Real document pages have a title
        if (text.includes('og:title') || text.includes('<h1') || text.includes('class="doc-title"')) {
          return id;
        }
        return null;
      } catch {
        return null;
      }
    }));

    for (const id of results) {
      if (id !== null) found.add(id);
    }

    if (batchStart % 1000 === 1 || batchStart + concurrency > maxId) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const rate = Math.round((batchStart / elapsed) * 60);
      console.log(`  ${Math.min(batchStart + concurrency - 1, maxId)}/${maxId} — ${found.size} found — ${elapsed}s — ${rate} req/min`);
    }
  }

  const ids = Array.from(found).sort((a, b) => a - b);
  fs.writeFileSync(path.join(outDir, '_existing-ids.json'), JSON.stringify(ids, null, 2), 'utf-8');

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n=== Complete ===`);
  console.log(`Found: ${ids.length} IDs (1..${maxId})`);
  console.log(`Duration: ${elapsed}s (${Math.round(maxId / elapsed)} req/s)`);
  console.log(`Saved: _existing-ids.json`);
}

main().catch(console.error);
