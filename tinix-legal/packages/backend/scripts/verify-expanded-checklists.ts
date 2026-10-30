import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {PrismaClient} from '@prisma/client';
import {loadConfig} from '../src/modules/operations/config.js';
import {evaluate,calculateDeadline,CHECKLIST_PROFILE_FACTS, type Context} from '@limi/compliance-core';
import {previewChecklist} from '../src/modules/compliance/pilot.js';
const db=new PrismaClient({datasources:{db:{url:loadConfig().databaseUrl}}});
let checks=0;
try{
 const batchKey=process.argv[4]||'expanded-20261012-v1',expected=Number(process.argv[5]||20);
 const rows=await db.checklistImportEntry.findMany({where:{batchKey},include:{version:{include:{citations:true}}},orderBy:{key:'asc'}});
 assert.equal(rows.length,expected);checks++;
 const positive:any={employeeCount:12,stage:'running',hasBonusScheme:'yes',hasOrdinaryHealthExamWorkers:'yes',hasSpecialHealthExamWorkers:'yes',hasHazardousWork:'yes',companyForm:'JSC',handlesConsumerTransactions:'yes',collectsConsumerData:'yes',usesConsumerContracts:'yes',socialInsuranceSubject:'yes',socialInsurancePaymentMethod:'monthly',socialInsuranceMonthlyExemption:'no',socialInsuranceContributionPeriodEndDate:'2026-09-30',vatFilingRequired:'yes',vatFilingFrequency:'monthly',vatMonthlyPeriodEndDate:'2026-09-30',vatQuarterPeriodEndDate:'2026-09-30',operationsStartedDate:'2026-09-01',salaryPaymentDate:'2026-09-30',lastSpecialHealthExamDate:'2026-04-30',accountingBooksOpeningDate:'2026-01-01',accountingFiscalYearEndDate:'2026-12-31',companyRegistrationDate:'2026-01-01'};
 for(const f of CHECKLIST_PROFILE_FACTS)if(!(f.key in positive))positive[f.key]=f.kind==='date'?'2026-09-30':f.options[0][0];
 positive.isMicroEnterprise='no';
 const tests=[];
 for(const row of rows){
  const v=row.version!,c=v.contentJson as any;assert.equal(v.status,'DRAFT');assert.equal(c.scope,'COMPANY');assert.ok(v.citations.every(x=>x.quote.length>20&&!x.ocrVerified));checks+=3;
  const values={...positive};if(JSON.stringify(c.rule).includes('LLC_MULTI'))values.companyForm='LLC_MULTI';if(c.deadline.periodEndFact==='vatQuarterPeriodEndDate')values.vatFilingFrequency='quarterly';
  const context:Context={facts:Object.fromEntries(Object.entries(values).map(([k,value])=>[k,{value,status:'USER_CONFIRMED'}])),dates:{}};
  assert.equal(evaluate(c.rule,context).decision,'APPLY');assert.equal(evaluate(c.rule,{facts:{},dates:{}}).decision,'NEEDS_INFORMATION');checks+=2;
  const deadline=calculateDeadline(c.deadline,'2026-10-13',context);if(c.deadline.kind==='REVIEW_PERIOD'){assert.equal(deadline.dueDate,null);assert.equal(deadline.periodKey,'2026');assert.equal(calculateDeadline(c.deadline,'2027-01-01',context).periodKey,'2027');checks+=3;}
  else if(c.deadline.kind!=='NONE'){assert.ok(deadline.dueDate);assert.ok(calculateDeadline(c.deadline,'2026-10-13',{facts:{},dates:{}}).missingTrigger);checks+=2;}
  const leaf=c.rule.all?.[0]||c.rule;if(leaf.fact!=='stage'){
   const negative={...context,facts:{...context.facts,[leaf.fact]:{value:leaf.fact==='employeeCount'?0:leaf.fact==='companyForm'?'OTHER':leaf.value==='no'?'yes':leaf.value==='monthly'?'quarterly':'no',status:'USER_CONFIRMED' as const}}};
   assert.equal(evaluate(c.rule,negative).decision,'NOT_APPLY');checks++;
  }
  tests.push({title:c.title,decision:'APPLY',missingProfile:'NEEDS_INFORMATION',dueDate:deadline.dueDate,periodKey:deadline.periodKey});
 }
 const tax=rows.find(r=>(r.version!.contentJson as any).deadline.periodEndFact==='vatMonthlyPeriodEndDate'||(r.version!.contentJson as any).deadline.kind==='REVIEW_PERIOD')!,company=await db.workspaceCompany.findFirstOrThrow();
 const mock:any={workspaceCompany:{findUniqueOrThrow:async()=>({...company,factsJson:Object.fromEntries(Object.entries(positive).map(([k,value])=>[k,{value,status:'USER_CONFIRMED'}]))})},checklistImportEntry:{findMany:async()=>[tax],count:async()=>0},pilotChecklistProgress:{findMany:async()=>[]}};
 const first=(await previewChecklist(mock,company.id,'2026-10-12')).items[0];
 mock.pilotChecklistProgress.findMany=async()=>[{versionId:tax.versionId,basisHash:first.basisHash,revision:1,status:'DONE',stepsJson:[0,1,2,3],note:'Old cycle'}];
 assert.equal((await previewChecklist(mock,company.id,'2026-10-12')).items[0].progress.status,'DONE');checks++;
 const original=mock.workspaceCompany.findUniqueOrThrow;mock.workspaceCompany.findUniqueOrThrow=async()=>{const c=await original();c.factsJson.vatMonthlyPeriodEndDate.value='2026-10-31';return c;};
 const annual=(tax.version!.contentJson as any).deadline.kind==='REVIEW_PERIOD';
 const next=(await previewChecklist(mock,company.id,annual?'2027-01-01':'2026-10-12')).items[0];assert.notEqual(next.basisHash,first.basisHash);assert.equal(next.progress.stale,true);assert.equal(next.progress.status,'TODO');assert.deepEqual(next.progress.steps,[]);checks+=4;
 const notes=(await readFile(process.argv[2]+'/review-notes.jsonl','utf8')).split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x));
 for(const row of rows){const note=notes.find(n=>n.title===(row.version!.contentJson as any).title);assert.ok(note);for(const citation of row.version!.citations){assert.equal(note.sourceQuotes.find((q:any)=>q.provisionId===citation.provisionId)?.quote,citation.quote);checks++;}}
 const report={status:'passed',checks,readOnly:true,batchKey,actualImportedDrafts:rows.length,sourceQuotesMatchDatabase:true,positiveMissingNegativeProfiles:true,explicitReportingPeriods:true,oldCycleProgressReset:true,officialPublicationPerformed:false,tests};
 await writeFile(process.argv[3],JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await db.$disconnect();}
