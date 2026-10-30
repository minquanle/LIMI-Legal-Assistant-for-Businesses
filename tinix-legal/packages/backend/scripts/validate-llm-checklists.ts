import {CHECKLIST_PROFILE_FACTS} from '@limi/compliance-core';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PrismaClient} from '@prisma/client';
import {loadConfig} from '../src/modules/operations/config.js';
import {draftSchema} from '../src/modules/compliance/contracts.js';
import {citations} from '../src/modules/compliance/catalogue.js';
const root=fileURLToPath(new URL('../../../../',import.meta.url)),input=resolve(process.argv[2]??'');
if(!process.argv[2])throw Error('Usage: validate-llm-checklists.ts <draft-obligations.jsonl> [report.json]');
const registry=JSON.parse(await readFile(join(root,'outputs/LLM_CHECKLIST_KIT_20261012/04_FACT_REGISTRY.json'),'utf8'));
for(const f of CHECKLIST_PROFILE_FACTS)if(f.kind==='enum')registry[f.key]={values:f.options.map(o=>o[0])};
const db=new PrismaClient({datasources:{db:{url:loadConfig().databaseUrl}}}),errors:Array<{line:number;reason:string}>=[],seen=new Set<string>();let records=0;
function enumCheck(rule:any):void{if(rule.all||rule.any){for(const r of rule.all??rule.any)enumCheck(r);return;}if(rule.not){enumCheck(rule.not);return;}const values=registry[rule.fact]?.values;if(values&&rule.op!=='exists'){for(const value of Array.isArray(rule.value)?rule.value:[rule.value])if(!values.includes(value))throw Error(`Unknown fact enum value for ${rule.fact}`);}}
try{
 const lines=(await readFile(input,'utf8')).replace(/^\uFEFF/,'').split(/\r?\n/);
 for(let i=0;i<lines.length;i++){if(!lines[i].trim())continue;records++;
  try{const payload=draftSchema.parse(JSON.parse(lines[i]));if(payload.citations.some(c=>c.ocrVerified))throw Error('LLM may not certify OCR verification');enumCheck(payload.content.rule);if(payload.content.scope==='COMPANY'&&JSON.stringify(payload.content.rule).match(/"fact":"(?:site\.|event\.)/))throw Error('Site/event fact used in company scope');
   const key=JSON.stringify(payload);if(seen.has(key))throw Error('Duplicate payload');seen.add(key);await citations(db,payload.citations);
  }catch(error){const e=error as any;errors.push({line:i+1,reason:e.issues?e.issues.map((x:any)=>x.path.join('.')+': '+x.message).join('; '):e.code??e.message??'Validation failed'});}
 }
 if(!records)errors.push({line:0,reason:'No JSONL records'});
 const report={status:errors.length?'failed':'passed',input,records,validRecords:records-errors.filter(e=>e.line>0).length,errors,checked:['actual backend draftSchema','allowed fact enums','citation UUID chain and sealed parse','quoted-amendment citation exclusion','LLM cannot assert OCR review','exact duplicates'],readOnly:true,legalAccuracyConfirmed:false,publicationPerformed:false};
 await writeFile(resolve(process.argv[3]??join(root,'outputs/LLM-checklist-validation.json')),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(errors.length)process.exitCode=1;
}finally{await db.$disconnect();}
