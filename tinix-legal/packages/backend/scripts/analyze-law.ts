/**
 * Trích xuất Legal Knowledge Graph (ontology v2.0) từ văn bản luật qua LLM Combo-1.
 * Combo-1 (tencent/hy3:free) yếu → KHÔNG sinh được nested graph JSON.
 * → Model trả FLAT list {norms:[...]}, script buildGraph() biến thành nodes/relationships chuẩn template.
 * - Input: TỪNG ĐIỀU (regex tách từ fullText) → extract flat → buildGraph → gộp.
 * - Output {document,nodes,relationships} → <repo>/data/<docNumber>.json.
 *
 * Dùng:
 *   npx tsx scripts/analyze-law.ts <docNumber|docId>
 *   npx tsx scripts/analyze-law.ts --type LUAT --limit 3
 *   npx tsx scripts/analyze-law.ts 144/2025/QH15 --size small --batch 6 --temp 0.1
 * ponytail: BATCH = parallel degree (per-điều call). --size chọn template (small/medium/large).
 *   Tốc độ: batch cao + small template → ít type, model dễ map, nhanh. Độ chính xác: temp 0.1 + retry + TYPE_MAP.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const p = new PrismaClient();
function flag(name: string, dflt: string): string {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : dflt;
}
const SIZES: Record<string, string> = { small: 'legal-analysis-template.small.json', medium: 'legal-analysis-template.medium.json', large: 'legal-analysis-template.json' };
const TPL_FILE = SIZES[flag('size', 'large')] || SIZES.large;
const TPL = JSON.parse(readFileSync(join(__dirname, TPL_FILE), 'utf-8'));
const LLM_URL = 'http://localhost:20128/v1/chat/completions';
const MODEL = flag('model', 'Combo-1');
const MAX_TOKENS = MODEL.toLowerCase().includes('deepseek') || MODEL.toLowerCase().includes('reasoning') ? 6000 : 3000;
const BATCH = parseInt(flag('batch', '4'));
const TEMP = parseFloat(flag('temp', '0.1'));
const RETRY = parseInt(flag('retry', '3'));
const DATA_DIR = join(__dirname, '..', '..', '..', 'data');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const sanitize = (n: string) => n.replace(/[\\/:*?"<>|]/g, '_');

async function extractFlat(doc: any, article: any): Promise<any | null> {
  const prompt =
`Phân tích MỘT ĐIỀU luật Việt Nam, trích xuất các quy phạm. Trả DUY NHẤT JSON (không markdown):
{"norms":[{"normType":"Obligation|Right|Permission|Prohibition|Condition|Exception|Rule|Fact|Sanction|Competence","subject":"ai/đối tượng chịu","action":"hành động","object":"đối tượng tác động","condition":"điều kiện","deadline":"thời hạn","authority":"cơ quan có thẩm quyền","consequence":"hậu quả/chế tài","statements":["câu nguyên văn 1","câu 2"],"references":["Điều X luật Y"]}]}
Nếu điều không có quy phạm thì norms=[]. Đừng thêm text ngoài JSON.
- Rule = quy tắc logic "nếu... thì..."; Fact = sự kiện/khẳng định pháp lý; Sanction = chế tài/xử phạt; Competence = thẩm quyền cơ quan.

VĂN BẢN: ${doc.title} (${doc.documentNumber})
ĐIỀU ${article.ordinal}:
${article.content.slice(0, 2000)}`;

  for (let a = 0; a < 5; a++) {
    try {
      const res = await fetch(LLM_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt }], temperature: TEMP, max_tokens: MAX_TOKENS }),
      });
      if ((res.status === 503 || res.status === 502) && a < RETRY - 1) { await sleep(2000 * (a + 1)); continue; }
      if (!res.ok) return null;
      const raw = await res.text();
      // ponytail: response có SSE trailer "data: [DONE]" → cắt trước parse
      const bodyJson = raw.includes('data: [DONE]') ? raw.slice(0, raw.indexOf('data: [DONE]')) : raw;
      let content = '';
      try {
        const wr = JSON.parse(bodyJson);
        content = wr.choices?.[0]?.message?.content || wr.choices?.[0]?.message?.reasoning_content || '';
      } catch { const s = bodyJson.indexOf('{'), e = bodyJson.lastIndexOf('}'); if (s >= 0 && e > s) content = bodyJson.slice(s, e + 1); }
      if (!content) return null;
      const cs = content.indexOf('{'), ce = content.lastIndexOf('}');
      if (cs < 0 || ce < 0) return null;
      const parsed = JSON.parse(content.slice(cs, ce + 1));
      if (!Array.isArray(parsed.norms)) return null;
      return parsed;
    } catch { if (a < RETRY - 1) await sleep(2000 * (a + 1)); else return null; }
  }
  return null;
}

// flat norms → graph chuẩn template (Norm-centric)
let GID = 0; const nid = (p: string) => `${p}_${(GID++).toString(36)}`;
let RID = 0; const rid = () => `REL_${(RID++).toString(36)}`;
function buildGraph(doc: any, article: any, flat: any): { nodes: any[]; relationships: any[] } {
  const entTypes = new Set<string>();
  for (const g in TPL._ontology.entityTypes) for (const it of (TPL._ontology.entityTypes as any)[g]) entTypes.add(typeof it === 'string' ? it : it.type);
  const nodes: any[] = []; const relationships: any[] = [];
  const src = { document: doc.documentNumber, article: `Điều ${article.ordinal}`, clause: '', point: '' };
  const prov = { extraction_method: 'LLM' };
  const mkNode = (id: string, type: string, stable: string, layer: string, name: string, conf = 0.9) => ({ id, stable_id: stable, type, layer, name, aliases: [], description: '', language: 'vi', embedding_id: null, parent: null, status: 'active', version: '1', hash: '', source_ref: src, provenance: { ...prov, confidence: conf }, confidence: conf, created_by: 'LLM', created_time: new Date().toISOString(), updated_time: new Date().toISOString(), ontology_version: TPL.ontology_version });
  const link = (rel: string, sourceId: string, targetId: string) => relationships.push({ id: rid(), stable_id: `Rel:${rel}`, source: sourceId, relation: rel, target: targetId, attributes: {}, source_ref: src, provenance: { ...prov, hash: '' }, confidence: 0.9, version: '1', status: 'active', created_by: 'LLM' });

  flat.norms.forEach((n: any) => {
    const rawType = (n.normType || 'Norm').toString();
    // ponytail: model thỉnh thoảng trả type ngoài ontology (Definition/Clause...) → map về gần nhất
    const TYPE_MAP: Record<string, string> = { Definition: 'InterpretationRule', Clause: 'Norm', Section: 'Norm', Article: 'Norm', Provision: 'Norm', Rule: 'Norm' };
    const normType = TYPE_MAP[rawType] || (entTypes.has(rawType) ? rawType : 'Norm');
    const normId = nid('NORM');
    nodes.push(mkNode(normId, normType, `Norm:${normType}`, 'Norm', (n.subject ? `${n.subject}: ` : '') + (n.action || normType || 'Quy phạm')));

    if (n.subject) { const id = nid('SUBJ'); nodes.push(mkNode(id, 'NaturalPerson', 'Semantic:NaturalPerson', 'Semantic', n.subject)); link('HAS_SUBJECT', normId, id); }
    if (n.action) { const id = nid('ACT'); nodes.push(mkNode(id, 'Action', 'Semantic_Action:Action', 'Semantic', n.action)); link('HAS_ACTION', normId, id); }
    if (n.object) { const id = nid('OBJ'); nodes.push(mkNode(id, 'Property', 'Semantic:Property', 'Semantic', n.object)); link('HAS_OBJECT', normId, id); }
    if (n.condition) { const id = nid('COND'); nodes.push(mkNode(id, 'Condition', 'Norm:Condition', 'Norm', n.condition)); link('HAS_CONDITION', normId, id); }
    if (n.deadline) { const id = nid('DL'); nodes.push(mkNode(id, 'Deadline', 'Norm:Deadline', 'Norm', n.deadline)); link('HAS_DEADLINE', normId, id); }
    if (n.authority) { const id = nid('AUTH'); nodes.push(mkNode(id, 'GovernmentAgency', 'Semantic:GovernmentAgency', 'Semantic', n.authority)); link('HAS_AUTHORITY', normId, id); }
    if (n.consequence) { const id = nid('CONS'); nodes.push(mkNode(id, 'Liability', 'Norm:Liability', 'Norm', n.consequence)); link('HAS_CONSEQUENCE', normId, id); }

    (n.statements || []).forEach((st: string) => {
      const id = nid('STMT');
      nodes.push({ ...mkNode(id, 'ObligationStatement', 'Statement:ObligationStatement', 'Norm', 'Câu'), statement_type: (n.normType || 'obligation').toLowerCase(), text: st, norm_refs: [normId] });
      relationships.push({ id: rid(), stable_id: 'Rel:HAS_STATEMENT', source: normId, relation: 'HAS_STATEMENT', target: id, attributes: {}, source_ref: src, provenance: { ...prov, hash: '' }, confidence: 0.95, version: '1', status: 'active', created_by: 'LLM' });
    });
    (n.references || []).forEach((rf: string) => {
      const id = nid('REF');
      const m = rf.match(/Điều\s+(\S+)/i);
      nodes.push({ ...mkNode(id, 'LegalReference', 'Reference:LegalReference', 'Reference', rf), target_document: doc.documentNumber, target_article: m ? `Điều ${m[1]}` : '', target_clause: '', target_point: '' });
      link('HAS_REFERENCE', normId, id);
    });
  });
  return { nodes, relationships };
}

function parseArgs(argv: string[]) {
  const flags: Record<string, string | boolean> = {}; const pos: string[] = [];
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) { const k = argv[i].slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; flags[k] = v; } else pos.push(argv[i]);
  return { flags, pos };
}

async function main() {
  const { flags, pos } = parseArgs(process.argv.slice(2));
  mkdirSync(DATA_DIR, { recursive: true });
  let docs;
  if (pos.length > 0) docs = await p.canonicalDocument.findMany({ where: { OR: [{ id: pos[0] }, { documentNumber: pos[0] }] }, select: { id: true, documentNumber: true, title: true, documentType: true, promulgationDate: true, effectiveDate: true, validityStatus: true, fullText: true }, take: 1 });
  else { const where: any = {}; if (flags.type) where.documentType = flags.type as string; docs = await p.canonicalDocument.findMany({ where, select: { id: true, documentNumber: true, title: true, documentType: true, promulgationDate: true, effectiveDate: true, validityStatus: true, fullText: true }, take: flags.limit ? parseInt(flags.limit as string) : 3, orderBy: { promulgationDate: 'desc' } }); }
  if (docs.length === 0) { console.error('Không tìm thấy.'); await p.$disconnect(); return; }
  console.error(`Trích xuất ${docs.length} văn bản → ${DATA_DIR}`);

  for (const d of docs) {
    const text = d.fullText || '';
    const re = /Điều\s+(\d+[a-zA-ZđĐ]?)\.?/g; let m: RegExpExecArray | null;
    const idx: { index: number; ordinal: string }[] = [];
    while ((m = re.exec(text))) idx.push({ index: m.index, ordinal: m[1] });
    const arts: { ordinal: string; content: string }[] = [];
    for (let i = 0; i < idx.length; i++) {
      const content = text.slice(idx[i].index, i + 1 < idx.length ? idx[i + 1].index : text.length).trim();
      if (content.length > 20) arts.push({ ordinal: idx[i].ordinal, content });
    }
    if (arts.length === 0) arts.push({ ordinal: 'FULL', content: text.slice(0, 20000) });
    console.error(`  ${d.documentNumber}: ${arts.length} điều (regex)`);
    const nodes: any[] = []; const relationships: any[] = [];
    for (let i = 0; i < arts.length; i += BATCH) {
      const slice = arts.slice(i, i + BATCH);
      const res = await Promise.all(slice.map(a => extractFlat(d, a)));
      for (let k = 0; k < slice.length; k++) {
        const f = res[k]; if (!f) { console.error(`    FAIL điều ${slice[k].ordinal}`); continue; }
        const g = buildGraph(d, slice[k], f);
        nodes.push(...g.nodes); relationships.push(...g.relationships);
      }
      console.error(`    ${Math.min(i + BATCH, arts.length)}/${arts.length} điều → ${nodes.length} nodes`);
    }
    if (nodes.length === 0) { console.error(`  EMPTY ${d.documentNumber}`); continue; }
    const out = { document: { id: d.id, documentNumber: d.documentNumber, title: d.title, documentType: d.documentType, promulgationDate: String(d.promulgationDate || ''), effectiveDate: String(d.effectiveDate || ''), validityStatus: d.validityStatus || '' }, nodes, relationships };
    writeFileSync(join(DATA_DIR, `${sanitize(d.documentNumber)}.json`), JSON.stringify(out, null, 2), 'utf-8');
    console.error(`  OK ${d.documentNumber}: ${nodes.length} nodes, ${relationships.length} edges`);
  }
  await p.$disconnect();
}
main();
