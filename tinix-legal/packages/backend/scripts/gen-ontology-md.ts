import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', '..', 'data');

// ponytail: ví dụ gom từ 10 file data đã trích (chung mọi size)
const dataFiles = readdirSync(DATA_DIR).filter(f => /_2025_QH15\.json$/.test(f));
const nodeByName = new Map<string, string>();
const relExamples = new Map<string, string>();
for (const f of dataFiles) {
  const d = JSON.parse(readFileSync(join(DATA_DIR, f), 'utf-8'));
  for (const n of d.nodes || []) if (!nodeByName.has(n.type) && n.name && n.name.length > 2 && n.name.length < 80) nodeByName.set(n.type, n.name);
  const byId = new Map<string, any>();
  for (const n of d.nodes || []) byId.set(n.id, n);
  for (const r of d.relationships || []) if (!relExamples.has(r.relation)) {
    const s = byId.get(r.source), t = byId.get(r.target);
    const sn = s?.name || r.source, tn = t?.name || r.target;
    if (sn && tn) relExamples.set(r.relation, `${sn} → ${tn}`);
  }
}

const esc = (s: string) => (s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

function collect(groups: Record<string, any[]>, descs: Record<string, any>) {
  const out: { type: string; group: string; desc: string; example: string }[] = [];
  for (const [group, items] of Object.entries(groups)) for (const it of items) {
    const type = typeof it === 'string' ? it : it.type;
    const d = descs[type] || {};
    out.push({ type, group, desc: d.desc || '', example: (d.examples && d.examples[0]) || nodeByName.get(type) || '' });
  }
  return out;
}

function render(title: string, rows: { type: string; group: string; desc: string; example: string }[]) {
  let md = `## ${title}\n\n| STT | ${title === 'Entity' ? 'Thực thể' : 'Quan hệ'} | Mô tả | Ví dụ |\n|-----|${'------'.padEnd(8, '-')}|--------|--------|\n`;
  rows.forEach((r, i) => md += `| ${i + 1} | ${esc(r.type)} | ${esc(r.desc)} | ${esc(r.example || relExamples.get(r.type) || '')} |\n`);
  return md;
}

const SIZES = ['small', 'medium', 'large'] as const;
for (const size of SIZES) {
  const tpl = JSON.parse(readFileSync(join(__dirname, `legal-analysis-template.${size}.json`), 'utf-8'));
  const ed = tpl._entityDescriptions || {}, rd = tpl._relationshipDescriptions || {};
  const ents = collect(tpl._ontology.entityTypes, ed);
  const rels = collect(tpl._ontology.relationshipTypes, rd);
  const md =
`# Legal Knowledge Graph — Ontology v${tpl.ontology_version} (${size})\n\n` +
`Chuẩn trích xuất đồ thị tri thức pháp luật Việt Nam (Norm-centric). Sinh tự động từ \`legal-analysis-template.${size}.json\` và ví dụ thực tế từ 10 luật 2025-2026.\n\n` +
render('Entity', ents) + '\n' + render('Relationship', rels) + '\n';
  writeFileSync(join(__dirname, `legal-ontology-reference.${size}.md`), md);
  console.error(`OK ${size}: ${ents.length} entity + ${rels.length} relation → legal-ontology-reference.${size}.md`);
}
console.error(`Ví dụ từ data: ${nodeByName.size} entity, ${relExamples.size} relation`);
