import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {PrismaClient} from '@prisma/client';
import {evaluate,calculateDeadline,CHECKLIST_PROFILE_FACTS,type Rule,type Context} from '@limi/compliance-core';
import {loadConfig} from '../src/modules/operations/config.js';
import {checklistCoverage} from '../src/modules/compliance/coverage.js';
const db=new PrismaClient({datasources:{db:{url:loadConfig().databaseUrl}}});let checks=0;
const root=process.argv[2],reportFile=process.argv[3];
function contextFor(rule:Rule,match:boolean,ctx:Context={facts:{},dates:{founded:'2026-09-01',event:'2026-09-01'}}):Context{
 if('not'in rule)return contextFor(rule.not,!match,ctx);
 if('all'in rule||'any'in rule){for(const r of ('all'in rule?rule.all:rule.any))contextFor(r,match,ctx);return ctx;}
 const definition=CHECKLIST_PROFILE_FACTS.find(f=>f.key===rule.fact);
 let value:any;
 if(rule.op==='eq')value=match?rule.value:definition?.options?.find(o=>o[0]!==rule.value)?.[0]??(rule.value==='yes'?'no':'OTHER');
 else if(rule.op==='in')value=match?(rule.value as any[])[0]:definition?.options?.find(o=>!(rule.value as any[]).includes(o[0]))?.[0]??'OTHER';
 else if(rule.op==='has')value=match?[rule.value]:[];
 else if(rule.op==='exists'){if(!match)return ctx;value=definition?.options?.[0][0]??'yes';}
 else {const n=Number(rule.value);value=rule.op==='gt'?(match?n+1:n):rule.op==='gte'?(match?n:Math.max(0,n-1)):rule.op==='lt'?(match?Math.max(0,n-1):n):(match?n:n+1);}
 ctx.facts[rule.fact]={value,status:'USER_CONFIRMED'};return ctx;
}
try{
 const rows=await db.checklistImportEntry.findMany({where:{versionId:{not:null}},include:{version:{include:{citations:true}}}});
 assert.equal(rows.length,188);checks++;
 const notes=(await readFile(root+'/review-notes.jsonl','utf8')).split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x));
 const titles=new Set<string>(),tests=[];
 for(const row of rows){
  const v=row.version!,c=v.contentJson as any;assert.ok(['DRAFT','IN_REVIEW','PUBLISHED','RETIRED'].includes(v.status));assert.ok(!titles.has(c.title));titles.add(c.title);checks+=2;
  const positive=contextFor(c.rule,true),negative=contextFor(c.rule,false);
  assert.equal(evaluate(c.rule,positive).decision,'APPLY',c.title);
  assert.equal(evaluate(c.rule,{facts:{},dates:{}}).decision,'NEEDS_INFORMATION',c.title);
  assert.equal(evaluate(c.rule,negative).decision,'NOT_APPLY',c.title);checks+=3;
  for(const f of CHECKLIST_PROFILE_FACTS)if(f.kind==='date')positive.facts[f.key]={value:'2026-09-30',status:'USER_CONFIRMED'};
  const d=calculateDeadline(c.deadline,'2026-10-13',positive);
  if(c.deadline.kind==='NONE'){assert.equal(d.dueDate,null);checks++;}
  else if(c.deadline.kind==='REVIEW_PERIOD'){assert.equal(d.periodKey,'2026');assert.equal(calculateDeadline(c.deadline,'2027-01-01',positive).periodKey,'2027');checks+=2;}
  else {assert.ok(d.dueDate);if(['DATE_OFFSET','PERIOD_END','OFFSET'].includes(c.deadline.kind)){assert.ok(calculateDeadline(c.deadline,'2026-10-13',{facts:{},dates:{}}).missingTrigger);checks++;}checks++;}
  for(const citation of v.citations){
   const node=await db.parsedProvision.findUniqueOrThrow({where:{id:citation.provisionId!},include:{parseRun:{include:{snapshot:true}}}});
   assert.equal(node.parseRunId,citation.parseRunId);assert.equal(node.parseRun.snapshotId,citation.snapshotId);assert.equal(node.parseRun.snapshot.documentId,citation.documentId);
   assert.ok(node.parseRun.sealedAt);assert.equal([...node.parseRun.snapshot.fullText].slice(node.spanStart,node.spanEnd).join(''),citation.quote);assert.equal(typeof citation.ocrVerified,'boolean');checks+=6;
   if(row.batchKey==='remaining-20261013-v1'){const n=notes.find(n=>n.title===c.title);assert.equal(n.sourceQuotes.find((q:any)=>q.provisionId===citation.provisionId)?.quote,citation.quote);checks++;}
  }
  if(c.group==='hungyen'&&row.batchKey==='remaining-20261013-v1'){
   positive.facts.province={value:'Hà Nội',status:'USER_CONFIRMED'};assert.equal(evaluate(c.rule,positive).decision,'NOT_APPLY');checks++;
  }
  tests.push({title:c.title,group:c.group,positive:'APPLY',missing:'NEEDS_INFORMATION',negative:'NOT_APPLY',dueDate:d.dueDate});
 }
 const coverage=await checklistCoverage(db);assert.equal(coverage.availableDocuments,110);assert.equal(coverage.importedChecklists,188);assert.equal(coverage.documents.filter(d=>d.status==='CITED_BY_DRAFTS').length,77);assert.equal(coverage.exhaustiveLegalCoverage,false);checks+=4;
 const privacy:Context={facts:{firstPersonalDataProcessingDate:{value:'2026-08-14',status:'USER_CONFIRMED'}},dates:{}};
 assert.equal(calculateDeadline({kind:'DATE_OFFSET',triggerFact:'firstPersonalDataProcessingDate',days:60},'2026-10-13',privacy).dueDate,'2026-10-13');checks++;
 const archive:Context={facts:{accountingFiscalYearEndDate:{value:'2024-02-29',status:'USER_CONFIRMED'}},dates:{}};
 assert.equal(calculateDeadline({kind:'DATE_OFFSET',triggerFact:'accountingFiscalYearEndDate',months:12},'2026-10-13',archive).dueDate,'2025-02-28');checks++;
 const report={status:'passed',checks,readOnly:true,importedDrafts:188,newDrafts:rows.filter(r=>r.batchKey==='remaining-20261013-v1').length,sourceDocuments:coverage.availableDocuments,directlyCitedDocuments:77,exactQuotesAndPinnedChains:true,positiveMissingNegativeProfiles:true,localProvinceIsolation:true,deadlineBoundaryChecks:true,publishedVersions:rows.filter(r=>r.version!.status==='PUBLISHED').length,publicationPerformedByThisVerification:false,tests};
 await writeFile(reportFile,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,tests:undefined}));
}finally{await db.$disconnect();}
