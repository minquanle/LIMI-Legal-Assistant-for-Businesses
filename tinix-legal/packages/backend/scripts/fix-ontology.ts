import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const TPL = join(__dirname, 'legal-analysis-template.json');
const t = JSON.parse(readFileSync(TPL, 'utf-8'));

// 1) dedupe relation names (giữ lần đầu, xóa lần sau)
const rt = t._ontology.relationshipTypes;
const seen = new Set<string>();
for (const g of Object.keys(rt)) {
  const kept: string[] = [];
  for (const n of rt[g]) { if (!seen.has(n)) { seen.add(n); kept.push(n); } }
  rt[g] = kept;
}

// 2) thêm entity types phù hợp VN luật (theo LegalRuleML: tách Norm/Rule/Fact)
const et = t._ontology.entityTypes;
const add = (group: string, type: string) => { if (!et[group].includes(type)) et[group].push(type); };
add('Semantic_Action', 'Action');        // hành vi pháp lý (sửa lỗi Register)
add('Norm', 'Rule');                      // quy tắc logic (NẾU...THÌ...), tách khỏi Norm công bố
add('Semantic_Concept', 'Fact');          // sự kiện/khẳng định pháp lý
add('Norm', 'Sanction');                  // chế tài/xử phạt (node riêng, VN luật nào cũng có)
add('Semantic_Subject', 'Competence');    // thẩm quyền (cực phổ biến VN: "cơ quan có thẩm quyền")
add('Semantic_Concept', 'LegalTransaction'); // giao dịch/hợp đồng

// 3) thêm relation cốt lõi LegalRuleML còn thiếu
const addRel = (group: string, rel: string) => { if (!rt[group].includes(rel)) rt[group].push(rel); };
addRel('Norm', 'HAS_RULE');               // Norm -> Rule (tách Norm/Rule)
addRel('Norm', 'HAS_ANTECEDENT');         // Rule: điều kiện (NẾU)
addRel('Norm', 'HAS_CONSEQUENT');         // Rule: hệ quả (THÌ)
addRel('CrossDocument', 'IS_VERSION_OF'); // chuỗi phiên bản văn bản

// 4) điền NARROWER_THAN (trống)
const rd = t._relationshipDescriptions || {};
if (!rd.NARROWER_THAN) rd.NARROWER_THAN = { desc: 'Quan hệ chỉ node nguồn là thể hiện cụ thể, hẹp hơn node đích bao quát. Ngược của BROADER_THAN.', examples: ['Chó là narrower than Động vật'] };
t._relationshipDescriptions = rd;

writeFileSync(TPL, JSON.stringify(t, null, 2));
console.error('OK: dedupe + thêm entity/relation. Rel unique:', new Set(Object.values(rt).flat()).size);
