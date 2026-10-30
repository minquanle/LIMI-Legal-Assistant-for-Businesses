import assert from 'node:assert/strict';
import {processEvaluation} from '../src/modules/compliance/evaluation.js';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
export async function verifyAnswerCases({db,req,owner,viewer,other,company,published,base,password,root,run}:any){
 let checks=0;
 const one=await published('Inline answers shared fixture A',{fact:'hasOvertime',op:'eq',value:'yes'});
 const two=await published('Inline answers shared fixture B',{all:[{fact:'employeeCount',op:'gt',value:0},{fact:'hasOvertime',op:'eq',value:'yes'}]});
 const latest=await db.complianceEvaluation.findFirstOrThrow({where:{companyId:company.id},orderBy:{createdAt:'desc'}});await processEvaluation(db,latest.id);
 const ta=await db.complianceTask.findFirstOrThrow({where:{companyId:company.id,obligationId:one.obligationId}}),tb=await db.complianceTask.findFirstOrThrow({where:{companyId:company.id,obligationId:two.obligationId}});
 const detail=await req(owner,'/tasks/'+ta.id),before=await req(owner,'/companies/'+company.id);
 assert.equal(detail.verification.questions[0].fact,'hasOvertime');assert.ok(detail.verification.questions[0].affectedCount>=2);checks+=2;
 const path='/tasks/'+ta.id+'/answers',input={expectedRevision:detail.revision,expectedProfileVersion:detail.verification.profileVersion,answers:{hasOvertime:'yes'}};
 await req({},path,'POST',input,401);await req(viewer,path,'POST',input,403);await req(other,path,'POST',input,404);await req(owner,path,'POST',input,403,{'x-csrf-token':'invalid'});
 await req(owner,path,'POST',{...input,answers:{hasOvertime:'invalid'}},400);await req(owner,path,'POST',{...input,answers:{hasOvertime:'yes',vatFilingRequired:'yes'}},400);checks+=6;
 const originalSteps=[0],originalReview={steps:[{index:0,result:'pass',note:'Checked fixture'}],evidenceNote:'Internal fixture folder'};
 await db.complianceTask.update({where:{id:tb.id},data:{status:'DOING',dueDate:new Date('2026-12-15'),dueDateKind:'USER',stepsJson:originalSteps,reviewJson:originalReview}});
 const saved=await req(owner,path,'POST',input);assert.equal(saved.evaluationPending,false);assert.equal(saved.task.applicability,'APPLY');checks+=2;
 const second=await req(owner,'/tasks/'+tb.id);assert.equal(second.applicability,'APPLY');assert.equal(second.status,'DOING');assert.equal(second.dueDate.slice(0,10),'2026-12-15');assert.deepEqual(second.stepsJson,originalSteps);assert.deepEqual(second.reviewJson,originalReview);checks+=5;
 const after=await req(owner,'/companies/'+company.id);for(const k of ['employees','stage','employeeCount'])assert.deepEqual(after.factsJson[k],before.factsJson[k]);assert.equal(after.version,before.version+1);assert.equal(after.factsJson.hasOvertime.value,'yes');checks+=5;
 await req(owner,path,'POST',input,409);
 const fresh=await req(owner,'/tasks/'+ta.id);await req(owner,path,'POST',{...input,expectedRevision:fresh.revision,expectedProfileVersion:before.version},409);checks+=2;
 // A negative answer must remove every related pending item, rather than forcing APPLY.
 const no=await published('Inline negative fixture',{fact:'hasNightWork',op:'eq',value:'yes'});
 await processEvaluation(db,(await db.complianceEvaluation.findFirstOrThrow({where:{companyId:company.id},orderBy:{createdAt:'desc'}})).id);
 const nt=await db.complianceTask.findFirstOrThrow({where:{companyId:company.id,obligationId:no.obligationId}}),nd=await req(owner,'/tasks/'+nt.id);
 const unknown=await req(owner,'/tasks/'+nt.id+'/answers','POST',{expectedRevision:nd.revision,expectedProfileVersion:nd.verification.profileVersion,answers:{hasNightWork:null}});
 assert.equal(unknown.task.applicability,'NEEDS_INFORMATION');checks++;
 const nd2=await req(owner,'/tasks/'+nt.id);
 const negative=await req(owner,'/tasks/'+nt.id+'/answers','POST',{expectedRevision:nd2.revision,expectedProfileVersion:nd2.verification.profileVersion,answers:{hasNightWork:'no'}});
 assert.equal(negative.task.applicability,'NOT_APPLY');assert.equal((await req(owner,'/companies/'+company.id)).factsJson.hasNightWork.value,'no');checks+=2;
 // A closed task is never reopened as a side effect of shared fact updates.
 await db.complianceTask.update({where:{id:ta.id},data:{status:'DONE'}});
 const changed=await published('Inline recovery fixture',{fact:'hasEmployeeRecoveryApplications',op:'eq',value:'yes'});
 await processEvaluation(db,(await db.complianceEvaluation.findFirstOrThrow({where:{companyId:company.id},orderBy:{createdAt:'desc'}})).id);
 const rt=await db.complianceTask.findFirstOrThrow({where:{companyId:company.id,obligationId:changed.obligationId}}),rd=await req(owner,'/tasks/'+rt.id);
 await req(owner,'/tasks/'+rt.id+'/answers','POST',{expectedRevision:rd.revision,expectedProfileVersion:rd.verification.profileVersion,answers:{hasEmployeeRecoveryApplications:'yes'}});
 assert.equal((await req(owner,'/tasks/'+ta.id)).status,'DONE');checks++;
 const dated=await published('Inline date preserves existing work fixture',{fact:'employeeCount',op:'gt',value:0},'2020-01-01',{kind:'DATE_OFFSET',triggerFact:'operationsStartedDate',days:10});
 await processEvaluation(db,(await db.complianceEvaluation.findFirstOrThrow({where:{companyId:company.id},orderBy:{createdAt:'desc'}})).id);
 const dt=await db.complianceTask.findFirstOrThrow({where:{companyId:company.id,obligationId:dated.obligationId}});
 await db.complianceTask.update({where:{id:dt.id},data:{status:'DOING',dueDateKind:'USER',dueDate:new Date('2026-12-15'),stepsJson:originalSteps,reviewJson:originalReview}});
 const dd=await req(owner,'/tasks/'+dt.id);
 const dateSaved=await req(owner,'/tasks/'+dt.id+'/answers','POST',{expectedRevision:dd.revision,expectedProfileVersion:dd.verification.profileVersion,answers:{operationsStartedDate:'2026-10-01'}});
 if(dateSaved.evaluationPending)await processEvaluation(db,dateSaved.evaluationId);
 assert.equal(dateSaved.task.id,dt.id);assert.equal(dateSaved.task.status,'DOING');assert.equal(dateSaved.task.dueDateKind,'USER');assert.deepEqual(dateSaved.task.stepsJson,originalSteps);assert.deepEqual(dateSaved.task.reviewJson,originalReview);assert.deepEqual(dateSaved.task.missingFacts,[]);assert.equal(await db.complianceTask.count({where:{companyId:company.id,obligationId:dated.obligationId}}),1);checks+=7;
 if(process.argv.includes('--verification-browser')){
  const current=await req(owner,'/companies/'+company.id);const {sourceProvenance,...profile}=current.profileJson;
  await req(owner,'/companies/'+company.id+'/profile','PUT',{expectedVersion:current.version,profile,facts:{...Object.fromEntries(Object.entries(current.factsJson).map(([k,v])=>[k,(v as any).value])),employeeCount:null,employees:'10-49'}});
  const a=await published('Inline browser bonus fixture',{all:[{fact:'employeeCount',op:'gt',value:0},{fact:'hasBonusScheme',op:'eq',value:'yes'}]});
  await published('Inline browser shared bonus fixture',{fact:'hasBonusScheme',op:'eq',value:'yes'});
  await published('Inline browser negative fixture',{fact:'hasAccountingStaffChange',op:'eq',value:'yes'});
  await processEvaluation(db,(await db.complianceEvaluation.findFirstOrThrow({where:{companyId:company.id},orderBy:{createdAt:'desc'}})).id);
  const next=spawn(process.execPath,[root+'limi-product/node_modules/next/dist/bin/next','start','-p','3002'],{cwd:root+'limi-product',env:{...process.env,LIMI_API_URL:base},stdio:'ignore',windowsHide:true});
  try{
   let ready=false;for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:3002/workspace')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}assert.ok(ready);
   const out=await run(process.execPath,[root+'tinix-legal/scripts/verify-verification-browser.mjs'],root+'tinix-legal',{...process.env,COMPLIANCE_TEST_PASSWORD:password,COMPLIANCE_TEST_COMPANY_ID:company.id});assert.ok(out.includes('"status":"passed"'));checks++;
  }finally{next.kill();await once(next,'exit').catch(()=>{});}
 }
 return checks;
}
