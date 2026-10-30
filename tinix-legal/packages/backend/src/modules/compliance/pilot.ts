import type {Prisma,PrismaClient} from '@prisma/client';
import {evaluate,calculateDeadline,localDate,ENGINE_VERSION,APPROVED_WORKING_CALENDAR,rankMissingFacts} from '@limi/compliance-core';
import {CALENDAR_UNAVAILABLE_NOTE} from './evaluation.js';
import {contentSchema,json} from './contracts.js';
import {validateReview} from './review-progress.js';
import {canonicalJson,sha256} from '../legal/record-adapter.js';
import {HttpError} from '../workspace/access.js';
import {scopeInput,scopeRecord,storedScope,withoutScope} from './scope-verification.js';

type Db=PrismaClient|Prisma.TransactionClient;
// Groups taken out of the product. Their drafts stay in the database (and in the schema) but are not offered to companies.
export const REMOVED_GROUPS:string[]=['hungyen'];

// An explicitly imported, company-scoped pilot set; never a catalogue release.
export async function previewChecklist(db:Db,companyId:string,asOfDate=localDate()){
 const c=await db.workspaceCompany.findUniqueOrThrow({where:{id:companyId}}),profile=c.profileJson as any;
 const facts={...c.factsJson as any,province:{value:profile.province||null,status:profile.province?'USER_CONFIRMED':'UNKNOWN'}};
 const context={facts,dates:{founded:profile.founded||undefined},calendar:APPROVED_WORKING_CALENDAR};
 const rows=await db.checklistImportEntry.findMany({where:{previewEnabled:true,version:{status:{in:['DRAFT','IN_REVIEW']}}},include:{version:{include:{citations:{include:{snapshot:{select:{document:{select:{documentNumber:true,title:true}}}},provision:{select:{heading:true,ordinal:true,nodeType:true}}}}}}},orderBy:{key:'asc'}});
 const saved=await db.pilotChecklistProgress.findMany({where:{companyId}});
 const items=rows.flatMap(row=>{
  const v=row.version!;const content=contentSchema.parse(v.contentJson);if(content.scope!=='COMPANY'||REMOVED_GROUPS.includes(content.group))return [];
  const deadline=calculateDeadline(content.deadline,asOfDate,context);
  const basisHash=sha256(canonicalJson({content,citations:v.citations.map(x=>({documentId:x.documentId,snapshotId:x.snapshotId,parseRunId:x.parseRunId,provisionId:x.provisionId,quote:x.quote})),revision:v.revision,...(deadline.periodKey!=='once'?{periodKey:deadline.periodKey,dueDate:deadline.dueDate}: {})}));
  // Every recurring period gets its own basis: completing Q3 must not mark Q4 as done.
  let answer:{decision:string,missingFacts:string[],explanation:string}=content.effectiveFrom>asOfDate||content.effectiveUntil&&content.effectiveUntil<asOfDate?{decision:'NOT_APPLY',missingFacts:[],explanation:'Bản nháp nằm ngoài khoảng ngày áp dụng đã khai báo.'}:evaluate(content.rule,context);
  if(answer.decision==='APPLY'&&deadline.missingTrigger){answer={...answer,decision:'NEEDS_INFORMATION',missingFacts:[...answer.missingFacts,'date:'+deadline.missingTrigger],explanation:'Điều kiện phạm vi đã khớp nhưng cần xác nhận mốc tính hạn trong hồ sơ.'};}
  if(answer.decision==='APPLY'&&'calendarStatus'in deadline&&deadline.calendarStatus==='UNAVAILABLE')answer={...answer,explanation:answer.explanation+CALENDAR_UNAVAILABLE_NOTE};
  const old=saved.find(p=>p.versionId===v.id),stale=Boolean(old&&old.basisHash!==basisHash);
  const engineDecision=answer.decision,scope=!stale&&storedScope(old?.reviewJson,basisHash);
  if(scope&&(engineDecision==='NEEDS_INFORMATION'||scope.action!=='PROCESS'))answer={...answer,decision:scope.action==='IGNORE'?'NOT_APPLY':'APPLY',missingFacts:[],explanation:'Phạm vi do người dùng xác minh; kết luận tự động được giữ riêng để đối chiếu.'};
  const reviewNotes=Object.fromEntries(Object.entries(row.notesJson as Record<string,unknown>).filter(([name])=>name!=='sourceQuotes'));
  return [{versionId:v.id,revision:v.revision,content,citations:v.citations,basisHash,engineDecision,periodKey:deadline.periodKey,...answer,dueDate:answer.decision==='APPLY'?deadline.dueDate:null,progress:{revision:old?.revision??0,status:!stale&&old?.status||'TODO',steps:!stale&&old?.stepsJson||[],note:!stale&&old?.note||'',review:!stale&&old?.reviewJson||{},stale},reviewNotes}];
 });
 // Ranked from the engine's own decisions (not the user's later scope overrides) so answering a question genuinely unblocks items.
 const questions=rankMissingFacts(items.map(i=>({decision:i.engineDecision,missingFacts:i.missingFacts}))).slice(0,5);
 return {mode:'PILOT_DRAFT',asOfDate,profileVersion:c.version,engineVersion:ENGINE_VERSION,items,questions,blockedCount:await db.checklistImportEntry.count({where:{versionId:null}}),notice:'Checklist chạy thử từ dữ liệu luật thật, chưa được chuyên gia duyệt. Tiến độ thử không phải xác nhận tuân thủ và không tạo công việc/cảnh báo chính thức.'};
}
export async function savePilotProgress(tx:Prisma.TransactionClient,companyId:string,versionId:string,input:{expectedRevision:number,basisHash:string,asOfDate:string,status:string,steps:number[],note:string,review?:unknown}){
 await tx.$queryRaw`SELECT id FROM "WorkspaceCompany" WHERE id=${companyId} FOR UPDATE`;
 const preview=await previewChecklist(tx,companyId,input.asOfDate),item=preview.items.find(x=>x.versionId===versionId);
 if(!item)throw new HttpError(404,'PILOT_ITEM_NOT_FOUND');
 if(item.basisHash!==input.basisHash)throw new HttpError(409,'PILOT_BASIS_CHANGED');
 if(item.progress.revision!==input.expectedRevision)throw new HttpError(409,'REVISION_CONFLICT');
 if(input.steps.some(i=>i>=item.content.steps.length)||new Set(input.steps).size!==input.steps.length)throw new HttpError(400,'INVALID_STEPS');
 if(item.decision!=='APPLY'&&input.status!=='NOT_APPLICABLE')throw new HttpError(409,'NEEDS_INFORMATION');
 if(input.status==='DONE'&&input.steps.length!==item.content.steps.length)throw new HttpError(409,'STEPS_REQUIRED');
 const review=input.review!==undefined||item.content.guide||['DONE','NOT_APPLICABLE'].includes(input.status)?validateReview(input.review??withoutScope(item.progress.review),item.content.steps.length,input.status):undefined;
 const steps=review?review.steps.filter(s=>s.result!=='issue').map(s=>s.index):input.steps;
 const data={basisHash:item.basisHash,status:input.status,stepsJson:json(steps),...(review?{reviewJson:json({...review,...(storedScope(item.progress.review,item.basisHash)?{scopeVerification:storedScope(item.progress.review,item.basisHash)}:{})})}:{}),note:input.note};
 return tx.pilotChecklistProgress.upsert({where:{companyId_versionId:{companyId,versionId}},create:{companyId,versionId,...data},update:{...data,revision:{increment:1}}});
}

export async function verifyPilotScope(tx:Prisma.TransactionClient,companyId:string,versionId:string,actorId:string,input:ReturnType<typeof scopeInput.parse>&{basisHash:string,asOfDate:string}){
 await tx.$queryRaw`SELECT id FROM "WorkspaceCompany" WHERE id=${companyId} FOR UPDATE`;
 const preview=await previewChecklist(tx,companyId,input.asOfDate),item=preview.items.find(x=>x.versionId===versionId);
 if(!item)throw new HttpError(404,'PILOT_ITEM_NOT_FOUND');
 if(item.basisHash!==input.basisHash)throw new HttpError(409,'PILOT_BASIS_CHANGED');
 if(item.progress.revision!==input.expectedRevision)throw new HttpError(409,'REVISION_CONFLICT');
 if(item.engineDecision!=='NEEDS_INFORMATION'&&!storedScope(item.progress.review,item.basisHash))throw new HttpError(409,'VERIFICATION_NOT_REQUIRED');
 const record=scopeRecord(input,actorId,item.basisHash,item.engineDecision),data={basisHash:item.basisHash,status:input.action==='PROCESS'?'TODO':input.action==='COMPLETE'?'DONE':'NOT_APPLICABLE',stepsJson:json(item.progress.steps),reviewJson:json({...item.progress.review as any,scopeVerification:record}),note:input.reason};
 return tx.pilotChecklistProgress.upsert({where:{companyId_versionId:{companyId,versionId}},create:{companyId,versionId,...data},update:{...data,revision:{increment:1}}});
}
