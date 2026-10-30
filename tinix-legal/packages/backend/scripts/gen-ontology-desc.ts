/**
 * Sinh mô tả tiếng Việt chi tiết cho mọi entityType + relationshipType trong
 * legal-analysis-template.json, dùng LLM Combo-1 (localhost:20128).
 * - Batch theo group, resume: bỏ qua type đã có mô tả.
 * - Kết quả ghi vào _entityDescriptions / _relationshipDescriptions (map type -> {desc, examples}).
 * Chạy: npx tsx scripts/gen-ontology-desc.ts
 * ponytail: batch 4-5 item/gọi, BATCH=3 song song, retry 503. Tăng nếu cần nhanh hơn.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TPL = join(__dirname, 'legal-analysis-template.json');
const LLM_URL = 'http://localhost:20128/v1/chat/completions';
const MODEL = 'Combo-1';
const BATCH = 3;
const EB = 5; // entity per call
const RB = 4; // relation per call

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function llm(jsonSchemaAsk: string): Promise<any | null> {
  for (let a = 0; a < 5; a++) {
    try {
      const res = await fetch(LLM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          // ponytail: proxy injects persona vào system → bắt buộc role:user
          messages: [{ role: 'user', content:
            `Trả về DUY NHẤT một JSON object (không markdown, không giải thích, không văn phong caveman).
Định dạng: {"TenType": {"desc":"định nghĩa ngắn 1-2 câu tiếng Việt, rõ nghĩa pháp lý","examples":["ví dụ thực tế 1","ví dụ 2"]}}
Chỉ JSON.
${jsonSchemaAsk}` }],
          temperature: 0.1,
          max_tokens: 3000,
        }),
      });
      if ((res.status === 503 || res.status === 502) && a < 4) { await sleep(2000 * (a + 1)); continue; }
      if (!res.ok) return null;
      const raw = await res.text();
      const bodyJson = raw.includes('data: [DONE]') ? raw.slice(0, raw.indexOf('data: [DONE]')) : raw;
      let content = '';
      try { const wr = JSON.parse(bodyJson); content = wr.choices?.[0]?.message?.content || ''; } catch { const s = bodyJson.indexOf('{'), e = bodyJson.lastIndexOf('}'); if (s >= 0 && e > s) content = bodyJson.slice(s, e + 1); }
      if (!content) return null;
      const s = content.indexOf('{'), e = content.lastIndexOf('}');
      if (s < 0 || e < 0) return null;
      return JSON.parse(content.slice(s, e + 1));
    } catch { if (a < 4) await sleep(2000 * (a + 1)); else return null; }
  }
  return null;
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

async function main() {
  const tpl = JSON.parse(readFileSync(TPL, 'utf-8'));
  tpl._entityDescriptions = tpl._entityDescriptions || {};
  tpl._relationshipDescriptions = tpl._relationshipDescriptions || {};
  const entDone = new Set(Object.keys(tpl._entityDescriptions));
  const relDone = new Set(Object.keys(tpl._relationshipDescriptions));

  // Entity groups
  const entGroups = tpl._ontology.entityTypes as Record<string, string[]>;
  const entQueue: { group: string; types: string[] }[] = [];
  for (const [group, types] of Object.entries(entGroups))
    for (const b of chunk(types, EB))
      entQueue.push({ group, types: b.filter(t => !entDone.has(t)) });

  // Relation groups
  const relGroups = tpl._ontology.relationshipTypes as Record<string, string[]>;
  const relQueue: { group: string; types: string[] }[] = [];
  for (const [group, types] of Object.entries(relGroups))
    for (const b of chunk(types, RB))
      relQueue.push({ group, types: b.filter(t => !relDone.has(t)) });

  console.error(`Entity batches: ${entQueue.length}, Relation batches: ${relQueue.length}`);

  async function runQueue(queue: { group: string; types: string[] }[], store: Record<string, any>, isRel: boolean) {
    let i = 0;
    while (i < queue.length) {
      const slice = queue.slice(i, i + BATCH);
      const results = await Promise.all(slice.map(item => {
        const ask = isRel
          ? `Nhóm quan hệ "${item.group}". Với mỗi quan hệ, cho định nghĩa và ví dụ câu luật thực tế (có chỉ rõ loại node nguồn và đích):\n${item.types.join(', ')}`
          : `Nhóm entity "${item.group}". Với mỗi loại thực thể, cho định nghĩa pháp lý và ví dụ:\n${item.types.join(', ')}`;
        return llm(ask);
      }));
      for (let k = 0; k < slice.length; k++) {
        const r = results[k];
        if (!r) { console.error(`  FAIL batch @${i + k} (${slice[k].group})`); continue; }
        for (const [t, v] of Object.entries(r)) {
          if (v && (v as any).desc) store[t] = v;
        }
      }
      i += BATCH;
      const cov = Object.keys(store).length;
      console.error(`  progress ${Math.min(i, queue.length)}/${queue.length} → đã có ${cov} mô tả`);
      writeFileSync(TPL, JSON.stringify(tpl, null, 2));
    }
  }

  await runQueue(entQueue, tpl._entityDescriptions, false);
  await runQueue(relQueue, tpl._relationshipDescriptions, true);

  const totalEnt = Object.values(entGroups).reduce((a, b) => a + b.length, 0);
  const totalRel = Object.values(relGroups).reduce((a, b) => a + b.length, 0);
  console.error(`DONE. Entity ${Object.keys(tpl._entityDescriptions).length}/${totalEnt}, Relation ${Object.keys(tpl._relationshipDescriptions).length}/${totalRel}`);
}
main();
