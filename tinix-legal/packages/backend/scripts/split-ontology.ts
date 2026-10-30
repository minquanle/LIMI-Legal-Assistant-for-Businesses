import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const TPL = join(__dirname, 'legal-analysis-template.json');
const t = JSON.parse(readFileSync(TPL, 'utf-8'));

// ponytail: split bằng whitelist thủ công (ontology VN đã ổn định). Đổi khi thêm entity/rel mới.
const SMALL = {
  entity: new Set(['LawDocument','Decree','Circular','Resolution','Law','LegalDocument',
    'Obligation','Right','Permission','Prohibition','Condition','Exception','Norm',
    'NaturalPerson','Organization','GovernmentAgency','StateAgency',
    'Action','Property','Deadline','Sanction','Competence','Fact','LegalReference','Statement']),
  rel: new Set(['HAS_SUBJECT','HAS_ACTION','HAS_OBJECT','HAS_CONDITION','HAS_EXCEPTION',
    'HAS_DEADLINE','HAS_AUTHORITY','HAS_CONSEQUENCE','HAS_SCOPE','HAS_REFERENCE',
    'AMENDS','REPEALS','REPLACES','IMPLEMENTS','GUIDES','INTERPRETS','CITES','REFERES_TO',
    'HAS_PART','HAS_ARTICLE','HAS_CLAUSE','HAS_POINT','PART_OF','NEXT','PREVIOUS',
    'HAS_STATEMENT','HAS_DEFINITION','CREATED_BY','ISSUES'])
};
const MEDIUM = {
  entity: new Set([...SMALL.entity, 'Rule','LegalTransaction','Liability','Fine','Penalty','License','Permit',
    'Procedure','Step','Task','Workflow','Event','LegalEvent','TimePoint','TimeInterval','Duration',
    'Amount','Rate','Limit','Threshold','Area','Percentage','Formula','Calculation','Variable',
    'AdministrativeArea','Location','Industry','Sector','Certificate','Record','Contract','Application',
    'LegalTerm','Definition','Concept','Role','LegalPosition','Requirement','Eligibility']),
  rel: new Set([...SMALL.rel, 'HAS_RULE','HAS_ANTECEDENT','HAS_CONSEQUENT','HAS_REQUIREMENT','HAS_ELIGIBILITY',
    'HAS_VALIDITY','HAS_FORMULA','HAS_RATE','HAS_LIMIT','HAS_THRESHOLD','HAS_AMOUNT','HAS_PERCENTAGE','HAS_AREA',
    'HAS_REFERENCE_NODE','REFERENCES_ARTICLE','REFERENCES_CLAUSE','POINTS_TO',
    'STARTS','ENDS','NEXT_STEP','PREVIOUS_STEP','BELONGS_TO_PROCEDURE','REQUIRES','GENERATES','VALIDATES','HAS_STATE','TRANSITIONS_TO',
    'AUTHORIZES','SUPERVISES','INSPECTS','AUDITS','REGULATES','ENFORCES','REVOKES','CERTIFIES',
    'VIOLATES','PENALIZED_BY','FINED_BY','SUSPENDED_BY','CONFISCATED_BY',
    'BEFORE','AFTER','WITHIN','UNTIL','SINCE','DURING','VALID_FROM','VALID_TO','EFFECTIVE_FROM','EXPIRES_ON',
    'LOCATED_IN','HAS_JURISDICTION','UNDER_AUTHORITY_OF','APPLIES_IN_REGION','BELONGS_TO_INDUSTRY','REGULATES_INDUSTRY',
    'DEFINES','HAS_TERM','HAS_BODY','COMPLIES_WITH','NON_COMPLIANT_WITH','SATISFIES','FAILS',
    'INSTANCE_OF','SUBCLASS_OF','IS_A','HAS_ROLE','RELATED_TO','SAME_AS','ALIAS_OF','SYNONYM_OF','ABBREVIATION_OF',
    'CAUSES','TRIGGERS','PRECEDES','FOLLOWS','RESULTS_IN','BASED_ON','DENIES','UPHOLDS','ANNULS'])
};

function subset(tpl: any, ent: Set<string>, rel: Set<string>) {
  const out = JSON.parse(JSON.stringify(tpl));
  const et = out._ontology.entityTypes, rt = out._ontology.relationshipTypes;
  for (const g of Object.keys(et)) et[g] = et[g].filter((n: string) => ent.has(n));
  for (const g of Object.keys(rt)) rt[g] = rt[g].filter((n: string) => rel.has(n));
  // giữ mô tả chỉ cho type còn lại
  const ed = out._entityDescriptions, rd = out._relationshipDescriptions;
  for (const k of Object.keys(ed)) if (!ent.has(k)) delete ed[k];
  for (const k of Object.keys(rd)) if (!rel.has(k)) delete rd[k];
  out._meta = { split: true, entity_count: [...ent].length, relationship_count: [...rel].length };
  return out;
}

const sizes: [string, Set<string>, Set<string>][] = [
  ['small', SMALL.entity, SMALL.rel],
  ['medium', MEDIUM.entity, MEDIUM.rel],
];
for (const [name, e, r] of sizes) {
  const s = subset(t, e, r);
  writeFileSync(join(__dirname, `legal-analysis-template.${name}.json`), JSON.stringify(s, null, 2));
  console.error(`OK ${name}: ${[...e].length} entity, ${[...r].length} rel`);
}
// large = nguyên bản (copy)
writeFileSync(join(__dirname, 'legal-analysis-template.large.json'), JSON.stringify(t, null, 2));
console.error(`OK large: ${Object.values(t._ontology.entityTypes).flat().length} entity, ${Object.values(t._ontology.relationshipTypes).flat().length} rel`);
