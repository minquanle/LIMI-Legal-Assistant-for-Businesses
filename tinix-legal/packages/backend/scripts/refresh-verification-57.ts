import {PrismaClient} from '@prisma/client';
import {loadConfig} from '../src/modules/operations/config.js';
import {enqueueCompanyRefresh,processEvaluation} from '../src/modules/compliance/evaluation.js';
import {verificationPlan} from '../src/modules/compliance/verification-questions.js';
import {ENGINE_VERSION} from '@limi/compliance-core';
import {writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PrismaClient({datasources:{db:{url:loadConfig().databaseUrl}}});
const dir='../../../outputs/LIMI_VERIFICATION_57_20261026/';
try{
 const original=JSON.parse(await readFile(dir+'before.json','utf8'));const results=[];
 for(const before of original){
  const company=await db.workspaceCompany.findUniqueOrThrow({where:{id:before.companyId}});
  const tasks=await db.complianceTask.findMany({where:{companyId:company.id},include:{evidence:true}});
  const versions=await db.obligationVersion.findMany({where:{id:{in:tasks.map(t=>t.basisVersionId)}},select:{id:true,contentJson:true,status:true}});
  const plan=before.rows.map((r:any)=>({id:r.id,title:r.title,...verificationPlan(r,company.factsJson as any,company.profileJson,r.missing)}));
  if(!process.argv.includes('--apply')){results.push({companyId:company.id,readOnly:true,totalReviewed:plan.length,covered:plan.filter((p:any)=>p.questions.length||p.knownFacts.length).length,questions:[...new Set(plan.flatMap((p:any)=>p.questions.map((q:any)=>q.fact)))]});continue;}
  await writeFile(dir+'tasks-before-refresh.json',JSON.stringify({company,tasks,versions},null,2));
  const evaluation=await db.$transaction(tx=>enqueueCompanyRefresh(tx,company.id,'local-operator:verification-57-refresh'));
  assert.ok(evaluation);await processEvaluation(db,evaluation.id);
  const after=await db.complianceTask.findMany({where:{companyId:company.id},include:{evidence:true}});
  for(const t of tasks){const next=after.find(x=>x.id===t.id)!;assert.ok(next);for(const key of ['status','stepsJson','reviewJson','assigneeId','basisVersionId','evidence'] as const)assert.deepEqual(next[key],t[key]);if(t.dueDateKind==='USER'){assert.equal(next.dueDate?.toISOString(),t.dueDate?.toISOString());assert.equal(next.dueDateKind,'USER');}}
  assert.deepEqual((await db.workspaceCompany.findUniqueOrThrow({where:{id:company.id}})).factsJson,company.factsJson);
  assert.deepEqual(await db.obligationVersion.findMany({where:{id:{in:tasks.map(t=>t.basisVersionId)}},select:{id:true,contentJson:true,status:true}}),versions);
  const reviewed=before.rows.map((r:any)=>{const next=after.find(t=>t.id===r.id)!;const v=versions.find(v=>v.id===next.basisVersionId)!;return {id:r.id,title:r.title,before:'NEEDS_INFORMATION',after:next.applicability,...verificationPlan(v.contentJson as any,company.factsJson as any,company.profileJson,next.missingFacts as string[])};});
  results.push({companyId:company.id,evaluationId:evaluation.id,engineVersion:ENGINE_VERSION,totalReviewed:reviewed.length,beforePending:before.rows.length,afterPending:reviewed.filter((r:any)=>r.after==='NEEDS_INFORMATION').length,resolved:reviewed.filter((r:any)=>r.after!=='NEEDS_INFORMATION').map((r:any)=>({id:r.id,title:r.title,after:r.after})),preservedProgressAndEvidence:true,profileAnswersUnchanged:true,publishedVersionsUnchanged:true,reviewed});
 }
 const report={applied:process.argv.includes('--apply'),results};await writeFile(dir+(report.applied?'after.json':'plan.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:results.map(({reviewed,...x}:any)=>x)}));
}finally{await db.$disconnect();}
