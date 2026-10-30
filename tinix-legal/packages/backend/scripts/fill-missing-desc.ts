import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const TPL = join(__dirname, 'legal-analysis-template.json');
const LLM_URL = 'http://localhost:20128/v1/chat/completions';
const MODEL = 'Combo-1';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function llm(ask: string): Promise<any | null> {
  for (let a = 0; a < 8; a++) {
    try {
      const res = await fetch(LLM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: `Trả DUY NHẤT JSON {"TenType":{"desc":"định nghĩa 1-2 câu tiếng Việt","examples":["ví dụ 1","ví dụ 2"]}}. Chỉ JSON.\n${ask}` }], temperature: 0.1, max_tokens: 3000 }) });
      if ((res.status === 503 || res.status === 502) && a < 7) { await sleep(2000 * (a + 1)); continue; }
      if (!res.ok) return null;
      const raw = await res.text();
      const bj = raw.includes('data: [DONE]') ? raw.slice(0, raw.indexOf('data: [DONE]')) : raw;
      let content = '';
      try { const wr = JSON.parse(bj); content = wr.choices?.[0]?.message?.content || ''; } catch { const s = bj.indexOf('{'), e = bj.lastIndexOf('}'); if (s >= 0 && e > s) content = bj.slice(s, e + 1); }
      if (!content) return null;
      const s = content.indexOf('{'), e = content.lastIndexOf('}');
      if (s < 0 || e < 0) return null;
      return JSON.parse(content.slice(s, e + 1));
    } catch { if (a < 7) await sleep(2000 * (a + 1)); else return null; }
  }
  return null;
}

async function main() {
  const tpl = JSON.parse(readFileSync(TPL, 'utf-8'));
  const ent = tpl._ontology.entityTypes, rel = tpl._ontology.relationshipTypes;
  const etypes: string[] = []; for (const g in ent) for (const it of ent[g]) etypes.push(typeof it === 'string' ? it : it.type);
  const rtypes: string[] = []; for (const g in rel) for (const it of rel[g]) rtypes.push(typeof it === 'string' ? it : it.type);
  const ed = tpl._entityDescriptions || {}, rd = tpl._relationshipDescriptions || {};
  const entMissing = etypes.filter(t => !ed[t]);
  const relMissing = rtypes.filter(t => !rd[t]);
  console.error('Thiếu entity:', entMissing.join(', '));
  console.error('Thiếu relation:', relMissing.join(', '));
  for (const t of entMissing) { const r = await llm(`Loại entity: ${t}`); if (r && r[t] && r[t].desc) { ed[t] = r[t]; console.error('OK entity', t); } else console.error('FAIL entity', t); }
  for (const t of relMissing) { const r = await llm(`Loại quan hệ: ${t} (chỉ rõ node nguồn/đích)`); if (r && r[t] && r[t].desc) { rd[t] = r[t]; console.error('OK relation', t); } else console.error('FAIL relation', t); }
  tpl._entityDescriptions = ed; tpl._relationshipDescriptions = rd;
  writeFileSync(TPL, JSON.stringify(tpl, null, 2));
  console.error(`DONE entity ${Object.keys(ed).length}/${etypes.length}, relation ${Object.keys(rd).length}/${rtypes.length}`);
}
main();
