import {type PrismaClient,type Prisma} from '@prisma/client';
import {Queue,Worker} from 'bullmq';
import {Redis} from 'ioredis';
import {ENGINE_VERSION,evaluate,calculateDeadline,localDate,APPROVED_WORKING_CALENDAR,type Context} from '@limi/compliance-core';
import type {MvpConfig} from '../operations/config.js';
import {contentSchema,json} from './contracts.js';
import {HttpError} from '../workspace/access.js';
import {canonicalJson,sha256} from '../legal/record-adapter.js';
import {storedScope} from './scope-verification.js';
type Tx=Prisma.TransactionClient;
export async function enqueueEvaluation(tx:Tx,companyId:string,actorId:string,asOfDate=localDate(),releaseId?:string){
 const company=await tx.workspaceCompany.findUniqueOrThrow({where:{id:companyId}}),profile=await tx.workspaceProfileVersion.findUniqueOrThrow({where:{companyId_version:{companyId,version:company.version}}});
 const release=await tx.catalogueRelease.findFirst({where:{sealedAt:{not:null},...(releaseId?{id:releaseId}:{}),publishedAt:{lte:new Date(asOfDate+'T16:59:59.999Z')}},orderBy:[{publishedAt:'desc'},{id:'desc'}]});if(!release)throw new HttpError(409,'NO_PUBLISHED_CATALOGUE');
 const [sites,events]=await Promise.all([tx.workspaceSite.findMany({where:{companyId},orderBy:{id:'asc'}}),tx.workspaceCompanyEvent.findMany({where:{companyId,occurredOn:{lte:new Date(asOfDate)}},orderBy:{id:'asc'}})]);
 // The approved working calendar is pinned with the input: approving a new year yields a new evaluation, never a silent change.
 const context=json({profile:profile.profileJson,facts:profile.factsJson,sites:sites.map(s=>({id:s.id,kind:s.kind,province:s.province,version:s.version})),events:events.map(e=>({id:e.id,type:e.type,occurredOn:e.occurredOn.toISOString().slice(0,10)})),calendar:APPROVED_WORKING_CALENDAR});
 const inputHash=sha256(canonicalJson(context)),key={companyId,profileVersionId:profile.id,releaseId:release.id,asOfDate:new Date(asOfDate),engineVersion:ENGINE_VERSION,inputHash};
 let row=await tx.complianceEvaluation.findUnique({where:{evaluation_business_key:key}});
 if(!row)row=await tx.complianceEvaluation.create({data:{...key,contextJson:context}});
 if(row.status!=='COMPLETED')await tx.complianceOutbox.upsert({where:{evaluationId:row.id},create:{evaluationId:row.id},update:{}});
 return row;
}
// Called inside the same transaction as a profile/site/event change. With no catalogue,
// onboarding remains available; a subsequent approval will enqueue the first evaluation.
export async function enqueueCompanyRefresh(tx:Tx,companyId:string,actorId:string){
 await tx.$queryRaw`SELECT id FROM "WorkspaceCompany" WHERE id=${companyId} FOR UPDATE`;
 const release=await tx.catalogueRelease.findFirst({where:{sealedAt:{not:null},publishedAt:{lte:new Date(localDate()+'T16:59:59.999Z')}},orderBy:[{publishedAt:'desc'},{id:'desc'}]});
 return release?enqueueEvaluation(tx,companyId,actorId,undefined,release.id):null;
}
function baseContext(input:any):Context{const facts:any={...input.facts,province:{value:input.profile.province||null,status:input.profile.province?'USER_CONFIRMED':'UNKNOWN'}};return {facts,dates:{founded:input.profile.founded||undefined},calendar:input.calendar};}
export const CALENDAR_UNAVAILABLE_NOTE=' Hạn có thể được lùi nếu trùng ngày nghỉ, nhưng lịch nghỉ của năm này chưa được duyệt nên đang hiển thị ngày theo quy định (sớm hơn, an toàn hơn).';
const PERIODIC_KINDS=['MONTHLY','QUARTERLY','ANNUAL','FISCAL_YEAR_END_OFFSET','REVIEW_PERIOD'];
// Once per Vietnam calendar day, re-evaluates companies already on the official checklist so the next
// monthly/quarterly/yearly task appears by itself. Idempotent: the evaluation business key absorbs repeats.
let lastPeriodicRefresh='';
export async function refreshPeriodicEvaluations(db:PrismaClient,today=localDate()){
 if(lastPeriodicRefresh===today)return 0;
 const release=await db.catalogueRelease.findFirst({where:{sealedAt:{not:null},publishedAt:{lte:new Date(today+'T16:59:59.999Z')}},orderBy:[{publishedAt:'desc'},{id:'desc'}],include:{items:{include:{version:{select:{contentJson:true}}}}}});
 if(!release||!release.items.some(i=>PERIODIC_KINDS.includes((i.version.contentJson as any)?.deadline?.kind))){lastPeriodicRefresh=today;return 0;}
 const companies=await db.complianceEvaluation.findMany({where:{status:'COMPLETED'},distinct:['companyId'],select:{companyId:true}});
 for(const {companyId} of companies)await db.$transaction(tx=>enqueueEvaluation(tx,companyId,'scheduler:periodic',today));
 lastPeriodicRefresh=today;return companies.length;
}
export async function processEvaluation(db:PrismaClient,id:string){
 // A row lock plus one transaction keeps task creation/history atomic across retries/workers.
 await db.$transaction(async tx=>{
   const header=await tx.complianceEvaluation.findUnique({where:{id},select:{companyId:true,status:true}});if(!header||header.status==='COMPLETED')return;
   // Evaluators share the catalogue lock; approvals/withdrawals take it exclusively.
   // Company-before-evaluation matches profile saves and prevents FK/queue lock inversion.
   await tx.$queryRaw`SELECT pg_advisory_xact_lock_shared(hashtextextended('limi-approved-catalogue',0))::text`;
   await tx.$queryRaw`SELECT id FROM "WorkspaceCompany" WHERE id=${header.companyId} FOR UPDATE`;
   await tx.$queryRaw`SELECT id FROM "ComplianceEvaluation" WHERE id=${id} FOR UPDATE`;
   const job=await tx.complianceEvaluation.findUnique({where:{id},include:{release:{include:{items:{include:{version:{include:{citations:true}}}}}},company:true}});if(!job||job.status==='COMPLETED')return;
   if(job.engineVersion!==ENGINE_VERSION)throw Error('ENGINE_VERSION_UNAVAILABLE');const input=job.contextJson as any,asOf=job.asOfDate.toISOString().slice(0,10);
   // Historical inputs remain readable but must not overwrite the current task projection.
   const currentCompany=await tx.workspaceCompany.findUniqueOrThrow({where:{id:job.companyId}});
   const currentProfile=await tx.workspaceProfileVersion.findUniqueOrThrow({where:{companyId_version:{companyId:job.companyId,version:currentCompany.version}}});
   const currentRelease=await tx.catalogueRelease.findFirst({where:{sealedAt:{not:null}},orderBy:[{publishedAt:'desc'},{id:'desc'}]});
   const laterJob=await tx.complianceEvaluation.findFirst({where:{companyId:job.companyId,createdAt:{gt:job.createdAt},profileVersionId:currentProfile.id,releaseId:currentRelease?.id},select:{id:true}});
   const project=job.profileVersionId===currentProfile.id&&job.releaseId===currentRelease?.id&&!laterJob;
   if(project){
    const roots=job.release.items.map(i=>i.version.obligationId);
    const removed=await tx.complianceTask.findMany({where:{companyId:job.companyId,obligationId:{notIn:roots},status:{notIn:['DONE','NOT_APPLICABLE']},applicability:{not:'NOT_APPLY'}}});
    for(const t of removed){
     await tx.complianceTask.update({where:{id:t.id},data:{applicability:'NOT_APPLY',missingFacts:[],explanation:'Nghĩa vụ đã ngừng phát hành trong bộ checklist hiện hành. Giữ tiến độ và lịch sử để đối chiếu.',revision:{increment:1}}});
     await tx.complianceTaskHistory.create({data:{taskId:t.id,actorId:'engine:'+ENGINE_VERSION,action:'OBLIGATION_WITHDRAWN',beforeJson:{applicability:t.applicability},afterJson:{applicability:'NOT_APPLY',releaseId:job.releaseId},note:'Đối chiếu bộ checklist hiện hành; không xóa công việc hoặc lịch sử.'}});
    }
   }
   for(const {version:v} of job.release.items){const content=contentSchema.parse(v.contentJson);
     const base=baseContext(input),scopes:{key:string,context:Context,empty?:boolean}[]=content.scope==='COMPANY'?[{key:'company',context:base}]:content.scope==='SITE'?input.sites.length?input.sites.map((s:any)=>({key:'site:'+s.id,context:{facts:{...base.facts,'site.kind':{value:s.kind,status:'USER_CONFIRMED'},'site.province':{value:s.province,status:'USER_CONFIRMED'}},dates:base.dates,calendar:base.calendar}})):[{key:'site:unconfirmed',context:base,empty:input.facts.places?.status!=='UNKNOWN'&&input.facts.places?.value?.length===0}]:input.events.length?input.events.map((e:any)=>({key:'event:'+e.id,context:{facts:{...base.facts,'event.type':{value:e.type,status:'USER_CONFIRMED'}},dates:{...base.dates,event:e.occurredOn},calendar:base.calendar}})):[{key:'event:none',context:base,empty:true}];
     for(const scope of scopes){let answer:{decision:string,missingFacts:string[],explanation:string};
       if(content.effectiveFrom>asOf||content.effectiveUntil&&content.effectiveUntil<asOf)answer={decision:'NOT_APPLY',missingFacts:[],explanation:'Phiên bản nghĩa vụ chưa hoặc không còn áp dụng tại ngày đánh giá.'};
       else if(scope.empty)answer={decision:'NOT_APPLY',missingFacts:[],explanation:'Không có địa điểm hoặc sự kiện tương ứng được ghi nhận trong hồ sơ.'};
       else {answer=evaluate(content.rule,scope.context);if(content.scope==='SITE'&&scope.key==='site:unconfirmed')answer={decision:'NEEDS_INFORMATION',missingFacts:['site.kind','site.province'],explanation:'Cần bổ sung địa điểm hoạt động để xác định phạm vi nghĩa vụ.'};}
       const deadline=calculateDeadline(content.deadline,asOf,scope.context);if(answer.decision==='APPLY'&&deadline.missingTrigger){answer={...answer,missingFacts:[...answer.missingFacts,'date:'+deadline.missingTrigger],explanation:answer.explanation+' Chưa có mốc tính hạn, cần bổ sung thông tin; không suy đoán ngày đến hạn.'};}
       if(answer.decision==='APPLY'&&'calendarStatus'in deadline&&deadline.calendarStatus==='UNAVAILABLE')answer={...answer,explanation:answer.explanation+CALENDAR_UNAVAILABLE_NOTE};
       const decision=await tx.complianceDecision.create({data:{evaluationId:id,versionId:v.id,scopeKey:scope.key,decision:answer.decision,missingFacts:answer.missingFacts,explanation:answer.explanation,dueDate:answer.decision==='APPLY'&&deadline.dueDate?new Date(deadline.dueDate):null,deadlineKind:deadline.dueDate?'LEGAL':deadline.missingTrigger?'UNKNOWN':'NONE',periodKey:deadline.periodKey}});
       if(!project)continue;
       const key={companyId:job.companyId,obligationId:v.obligationId,scopeKey:scope.key,periodKey:deadline.periodKey};let old=await tx.complianceTask.findUnique({where:{task_business_key:key}});
       // Resolving a previously unknown trigger identifies the same open task, not a
       // new work item. Preserve the user's work instead of leaving an orphan waiting
       // for a date already supplied. Subsequent real periods still get separate tasks.
       if(!old&&!deadline.missingTrigger&&answer.decision==='APPLY'){
        const provisional=await tx.complianceTask.findFirst({where:{companyId:job.companyId,obligationId:v.obligationId,scopeKey:scope.key,basisVersionId:v.id,status:{notIn:['DONE','NOT_APPLICABLE']},OR:[{periodKey:{startsWith:'unconfirmed:'}},{periodKey:{startsWith:'invalid:'}}]},orderBy:{createdAt:'asc'}});
        if(provisional){old=await tx.complianceTask.update({where:{id:provisional.id},data:{periodKey:deadline.periodKey,decisionId:decision.id}});await tx.complianceTaskHistory.create({data:{taskId:old.id,actorId:'engine:'+ENGINE_VERSION,action:'TRIGGER_CONFIRMED',beforeJson:{periodKey:provisional.periodKey,decisionId:provisional.decisionId},afterJson:{periodKey:deadline.periodKey,decisionId:decision.id},note:'Đã xác nhận mốc còn thiếu; giữ tiến độ, hạn nội bộ và bằng chứng.'}});}
       }
       if(answer.decision==='NOT_APPLY'){if(old&&!['DONE','NOT_APPLICABLE'].includes(old.status)){await tx.complianceTask.update({where:{id:old.id},data:{applicability:'NOT_APPLY',explanation:answer.explanation,revision:{increment:1}}});await tx.complianceTaskHistory.create({data:{taskId:old.id,actorId:'engine:'+ENGINE_VERSION,action:'NO_LONGER_APPLIES',beforeJson:{applicability:old.applicability},afterJson:{applicability:'NOT_APPLY'},note:'Giữ công việc và lịch sử cũ để đối chiếu.'}});}continue;}
       const data={basisVersionId:v.id,decisionId:decision.id,title:content.title,applicability:answer.decision,dueDate:decision.dueDate,dueDateKind:decision.deadlineKind,missingFacts:answer.missingFacts,explanation:answer.explanation};
       if(!old){const task=await tx.complianceTask.create({data:{...key,...data}});await tx.complianceTaskHistory.create({data:{taskId:task.id,actorId:'engine:'+ENGINE_VERSION,action:'CREATED',beforeJson:{},afterJson:json(data),note:'Tạo từ đánh giá '+id}});}
       else if(!['DONE','NOT_APPLICABLE'].includes(old.status)&&old.basisVersionId===v.id){await tx.complianceTask.update({where:{id:old.id},data:{...data,...(storedScope(old.reviewJson,v.id)?.action==='PROCESS'&&answer.decision==='NEEDS_INFORMATION'?{applicability:'APPLY',missingFacts:[],explanation:'Phạm vi đã được người dùng xác minh; giữ tiến độ xử lý.'}:{}),...(old.dueDateKind==='USER'?{dueDate:old.dueDate,dueDateKind:'USER'}:{}),revision:{increment:1}}});await tx.complianceTaskHistory.create({data:{taskId:old.id,actorId:'engine:'+ENGINE_VERSION,action:'REEVALUATED',beforeJson:json({decisionId:old.decisionId}),afterJson:json({decisionId:decision.id}),note:'Giữ tiến độ và hạn do người dùng đặt'}});}
       else if(old.basisVersionId!==v.id){await tx.complianceTaskHistory.create({data:{taskId:old.id,actorId:'engine:'+ENGINE_VERSION,action:'BASIS_REVIEW_REQUIRED',beforeJson:json({basisVersionId:old.basisVersionId,status:old.status}),afterJson:json({candidateBasisVersionId:v.id,decisionId:decision.id}),note:'Giữ nguyên căn cứ và kết quả hoàn thành cũ; cần xem lại khi thay đổi căn cứ.'}});}
     }
   }
   await tx.complianceEvaluation.update({where:{id},data:{status:'COMPLETED',completedAt:new Date(),errorCode:null}});
 },{timeout:60000});
}
const QUEUE='limi-compliance-evaluations';
export function startComplianceWorker(db:PrismaClient,config:MvpConfig,queueName=QUEUE){
 const connection=new Redis(config.redisUrl,{maxRetriesPerRequest:null}),workerConnection=connection.duplicate(),queue=new Queue(queueName,{connection:connection as any});connection.on('error',()=>{});workerConnection.on('error',()=>{});
 const worker=new Worker(queueName,async job=>{try{await processEvaluation(db,job.data.evaluationId);}catch(error){await db.complianceEvaluation.updateMany({where:{id:job.data.evaluationId,status:{not:'COMPLETED'}},data:{status:'FAILED',errorCode:'EVALUATION_FAILED'}});throw Error('EVALUATION_FAILED');}},{connection:workerConnection as any,concurrency:2});worker.on('error',()=>{});
 let stopped=false,running:Promise<void>|undefined;
 async function dispatch(){if(stopped||running)return;running=(async()=>{const rows=await db.complianceOutbox.findMany({where:{dispatchedAt:null},take:50,orderBy:{createdAt:'asc'}});for(const row of rows){const old=await queue.getJob(row.evaluationId);if(old&&await old.getState()==='failed')await old.remove();await queue.add('evaluate',{evaluationId:row.evaluationId},{jobId:row.evaluationId,attempts:5,backoff:{type:'exponential',delay:1000},removeOnComplete:{age:86400},removeOnFail:{age:604800}});await db.complianceOutbox.update({where:{id:row.id},data:{dispatchedAt:new Date()}});}})();try{await running;}catch{}finally{running=undefined;}}
 const timer=setInterval(()=>void dispatch(),1000);void dispatch();
 return {async close(){stopped=true;clearInterval(timer);await running?.catch(()=>{});await worker.close();await queue.close();connection.disconnect();workerConnection.disconnect();}};
}
