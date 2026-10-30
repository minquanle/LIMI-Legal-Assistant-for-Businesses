import {readableReviewText} from './text-quality.js';
import {type PrismaClient,type Prisma} from '@prisma/client';
import {z} from 'zod';
import {contentSchema,json,uuid} from '../compliance/contracts.js';
import {enqueueEvaluation,processEvaluation} from '../compliance/evaluation.js';
import {createAlert} from '../alerts/service.js';
import {HttpError} from '../workspace/access.js';
export const approvalSchema=z.object({expectedRevision:z.number().int().positive(),releaseId:uuid.optional(),effectiveDate:z.string().date(),versionIds:z.array(uuid).min(1).max(100),whatChanged:z.string().trim().min(10).max(4000).refine(readableReviewText,'REVIEW_TEXT_REQUIRED'),why:z.string().trim().min(10).max(4000).refine(readableReviewText,'REVIEW_TEXT_REQUIRED'),action:z.string().trim().min(10).max(4000).refine(readableReviewText,'REVIEW_TEXT_REQUIRED'),note:z.string().trim().min(10).max(2000),sourceVerified:z.literal(true)}).strict();
export async function approveChange(tx:Prisma.TransactionClient,candidateId:string,actorId:string,input:z.infer<typeof approvalSchema>){
 await tx.$queryRaw`SELECT id FROM "LawChangeCandidate" WHERE id=${candidateId} FOR UPDATE`;
 const c=await tx.lawChangeCandidate.findUnique({where:{id:candidateId}});if(!c)throw new HttpError(404,'CHANGE_NOT_FOUND');if(c.status!=='PENDING'||c.revision!==input.expectedRevision)throw new HttpError(409,'REVISION_CONFLICT');
 if(c.kind==='PARSER_CHANGE')throw new HttpError(409,'PARSER_CHANGE_NOT_LEGAL');
 const release=await tx.catalogueRelease.findFirst({where:{sealedAt:{not:null},...(input.releaseId?{id:input.releaseId}:{} )},orderBy:[{publishedAt:'desc'},{id:'desc'}],include:{items:{include:{version:{include:{citations:true}}}}}});if(!release?.sealedAt)throw new HttpError(400,'INVALID_RELEASE');
 const ids=[...new Set(input.versionIds)];const versions=release.items.filter(i=>ids.includes(i.versionId)).map(i=>i.version);if(versions.length!==ids.length||versions.some(v=>v.status!=='PUBLISHED'||!v.citations.length))throw new HttpError(400,'INVALID_IMPACT_VERSIONS');
 if(versions.some(v=>{const x=contentSchema.parse(v.contentJson);return x.effectiveFrom>input.effectiveDate||x.effectiveUntil&&x.effectiveUntil<input.effectiveDate;}))throw new HttpError(400,'INVALID_EFFECTIVE_DATE');
 if(release.publishedAt>new Date(input.effectiveDate+'T16:59:59.999Z'))throw new HttpError(400,'RELEASE_AFTER_EFFECTIVE_DATE');
 const event=await tx.approvedLawChange.create({data:{candidateId,releaseId:release.id,effectiveDate:new Date(input.effectiveDate),whatChanged:input.whatChanged,why:input.why,action:input.action,versionIds:ids,citationsJson:json(versions.flatMap(v=>v.citations)),reviewerId:actorId}});
 await tx.lawChangeCandidate.update({where:{id:c.id},data:{status:'APPROVED',revision:{increment:1},reviewerId:actorId,reviewedAt:new Date(),reviewNote:input.note}});
 // Atomic, bounded pages: interruption cannot leave an approved event without its workset.
 let cursor:string|undefined;for(;;){const companies=await tx.workspaceCompany.findMany({orderBy:{id:'asc'},take:200,...(cursor?{cursor:{id:cursor},skip:1}:{})});if(!companies.length)break;await tx.changeCompanyImpact.createMany({data:companies.map(x=>({eventId:event.id,companyId:x.id}))});cursor=companies.at(-1)!.id;}
 return event;
}
export async function processChangeImpact(db:PrismaClient,id:string){
 let evaluationId:string|undefined;
 await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "ChangeCompanyImpact" WHERE id=${id} FOR UPDATE`;
  const impact=await tx.changeCompanyImpact.findUniqueOrThrow({where:{id}});if(impact.completedAt)return;
  const event=await tx.approvedLawChange.findUniqueOrThrow({where:{id:impact.eventId}});
  if(impact.evaluationId){evaluationId=impact.evaluationId;return;}
  await tx.$queryRaw`SELECT id FROM "WorkspaceCompany" WHERE id=${impact.companyId} FOR UPDATE`;
  const e=await enqueueEvaluation(tx,impact.companyId,event.reviewerId,event.effectiveDate.toISOString().slice(0,10),event.releaseId);evaluationId=e.id;
  await tx.changeCompanyImpact.update({where:{id},data:{evaluationId:e.id}});
 });if(!evaluationId)return;
 await processEvaluation(db,evaluationId);
 await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "ChangeCompanyImpact" WHERE id=${id} FOR UPDATE`;
  const impact=await tx.changeCompanyImpact.findUniqueOrThrow({where:{id}});if(impact.completedAt)return;
  const event=await tx.approvedLawChange.findUniqueOrThrow({where:{id:impact.eventId}}),evaluation=await tx.complianceEvaluation.findUniqueOrThrow({where:{id:impact.evaluationId!},include:{profile:{select:{version:true}},release:{select:{name:true}}}});
  const decisions=await tx.complianceDecision.findMany({where:{evaluationId:evaluation.id,versionId:{in:event.versionIds as string[]},decision:{not:'NOT_APPLY'}},include:{version:true}});
  for(const d of decisions){const t=await tx.complianceTask.findUnique({where:{task_business_key:{companyId:impact.companyId,obligationId:d.version.obligationId,scopeKey:d.scopeKey,periodKey:d.periodKey}}});
   await createAlert(tx,{companyId:impact.companyId,key:JSON.stringify(['change',event.id,impact.companyId,d.versionId,d.scopeKey]),kind:d.decision==='NEEDS_INFORMATION'?'VERIFY_SCOPE':'LAW_CHANGE',title:d.decision==='NEEDS_INFORMATION'?'Xác minh phạm vi: '+contentSchema.parse(d.version.contentJson).title:'Thay đổi pháp luật: '+contentSchema.parse(d.version.contentJson).title,eventId:event.id,decisionId:d.id,taskId:t?.id,payloadJson:json({whatChanged:event.whatChanged,why:event.why,action:event.action,effectiveDate:event.effectiveDate.toISOString().slice(0,10),releaseId:event.releaseId,releaseName:evaluation.release.name,profileVersion:evaluation.profile.version,versionId:d.versionId,profileVersionId:evaluation.profileVersionId,evaluationId:evaluation.id,evaluationDate:evaluation.asOfDate.toISOString().slice(0,10),engineVersion:evaluation.engineVersion,applicability:d.decision,missingFacts:d.missingFacts,explanation:d.explanation,citations:(event.citationsJson as any[]).filter(c=>c.versionId===d.versionId),taskBasisUnchanged:t?.basisVersionId!==d.versionId,completedTaskPreserved:t?.status==='DONE'})});
  }
  await tx.changeCompanyImpact.update({where:{id},data:{completedAt:new Date(),errorCode:null}});
 },{timeout:60000});
}
export async function dispatchChanges(db:PrismaClient){
 const rows=await db.changeCompanyImpact.findMany({where:{completedAt:null,nextAttemptAt:{lte:new Date()},attempts:{lt:10}},orderBy:{createdAt:'asc'},take:10});
 for(const row of rows)try{await processChangeImpact(db,row.id);}catch{await db.changeCompanyImpact.updateMany({where:{id:row.id,completedAt:null},data:{attempts:{increment:1},errorCode:'CHANGE_EVALUATION_FAILED',nextAttemptAt:new Date(Date.now()+Math.min(3600000,1000*2**row.attempts))}});}
}
