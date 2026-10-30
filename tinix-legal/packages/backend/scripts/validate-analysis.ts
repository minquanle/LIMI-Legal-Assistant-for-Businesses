/**
 * Validate 1 file kết quả phân tích luật theo legal-analysis-template.json.
 * Dùng: npx tsx scripts/validate-analysis.ts <ket-qua.json>
 * Check: node id unique, type/relation thuộc vocab ontology, edge source/target tồn tại,
 *        confidence 0..1, source_ref.document không rỗng.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tpl = JSON.parse(readFileSync(join(__dirname, 'legal-analysis-template.json'), 'utf-8'));
const ENTITY = new Set<string>(Object.values(tpl._ontology.entityTypes).flat() as string[]);
const REL = new Set<string>(Object.values(tpl._ontology.relationshipTypes).flat() as string[]);
const LAYER = new Set<string>(tpl._ontology.layers);

export function validate(doc: any): string[] {
  const errs: string[] = [];
  const nodes = doc.nodes || [], rels = doc.relationships || [];
  const ids = new Set<string>();

  for (const n of nodes) {
    if (!n.id) errs.push('node thiếu id');
    else if (ids.has(n.id)) errs.push(`node id trùng: ${n.id}`);
    else ids.add(n.id);
    if (!ENTITY.has(n.type)) errs.push(`node ${n.id}: type ngoài ontology: ${n.type}`);
    if (n.layer && !LAYER.has(n.layer)) errs.push(`node ${n.id}: layer sai: ${n.layer}`);
    if (typeof n.confidence !== 'number' || n.confidence < 0 || n.confidence > 1) errs.push(`node ${n.id}: confidence sai`);
    if (!n.source_ref?.document) errs.push(`node ${n.id}: thiếu source_ref.document`);
    if (!n.stable_id) errs.push(`node ${n.id}: thiếu stable_id (governance)`);
    if (!n.provenance?.extraction_method) errs.push(`node ${n.id}: thiếu provenance.extraction_method`);
    if (n.type === 'LegalReference' && !n.target_document) errs.push(`node ${n.id}: LegalReference thiếu target_document`);
    if (String(n.type).includes('Statement') && !n.text) errs.push(`node ${n.id}: Statement thiếu text (nguyên văn)`);
  }
  for (const r of rels) {
    if (!REL.has(r.relation)) errs.push(`edge ${r.id}: relation ngoài ontology: ${r.relation}`);
    if (!ids.has(r.source)) errs.push(`edge ${r.id}: source không tồn tại: ${r.source}`);
    if (!ids.has(r.target)) errs.push(`edge ${r.id}: target không tồn tại: ${r.target}`);
    if (typeof r.confidence !== 'number' || r.confidence < 0 || r.confidence > 1) errs.push(`edge ${r.id}: confidence sai`);
    if (!r.source_ref?.document) errs.push(`edge ${r.id}: thiếu source_ref.document`);
    if (!r.stable_id) errs.push(`edge ${r.id}: thiếu stable_id (governance)`);
    if (r.attributes?.negated !== undefined && typeof r.attributes.negated !== 'boolean') errs.push(`edge ${r.id}: negated phải boolean`);
  }
  return errs;
}

// self-check: _example trong template PHẢI hợp lệ
function demo() {
  const errs = validate(tpl._example);
  if (errs.length) { console.error('SELF-CHECK FAIL:', errs); process.exit(1); }
  console.error('SELF-CHECK OK: _example hợp lệ');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const f = process.argv[2];
  if (!f) { demo(); }
  else {
    const errs = validate(JSON.parse(readFileSync(f, 'utf-8')));
    if (errs.length) { console.error(`${errs.length} lỗi:`); errs.forEach(e => console.error('  -', e)); process.exit(1); }
    console.log('OK: hợp lệ theo ontology v' + tpl.ontology_version);
  }
}
