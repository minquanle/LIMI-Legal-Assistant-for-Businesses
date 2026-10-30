import type {Prisma} from '@prisma/client';
import {z} from 'zod';
import {factsSchema,confirmedFacts} from '../workspace/contracts.js';
import {HttpError} from '../workspace/access.js';
import {enqueueCompanyRefresh} from './evaluation.js';
import {verificationPlan} from './verification-questions.js';
import {json} from './contracts.js';

export const verificationAnswersInput=z.object({expectedRevision:z.number().int().positive(),expectedProfileVersion:z.number().int().positive(),answers:z.record(z.unknown()).refine(x=>Object.keys(x).length>=1&&Object.keys(x).length<=10)}).strict();
export async function saveVerificationAnswers(tx:Prisma.TransactionClient,taskId:string,actorId:string,input:z.infer<typeof verificationAnswersInput>){
 const header=await tx.complianceTask.findUniqueOrThrow({where:{id:taskId}});
 // Same lock order as evaluation/profile updates: company, then task.
 await tx.$queryRaw`SELECT id FROM "WorkspaceCompany" WHERE id=${header.companyId} FOR UPDATE`;
 await tx.$queryRaw`SELECT id FROM "ComplianceTask" WHERE id=${taskId} FOR UPDATE`;
 const task=await tx.complianceTask.findUniqueOrThrow({where:{id:taskId},include:{basis:true}}),company=await tx.workspaceCompany.findUniqueOrThrow({where:{id:task.companyId}});
 if(task.revision!==input.expectedRevision)throw new HttpError(409,'REVISION_CONFLICT');
 if(company.version!==input.expectedProfileVersion)throw new HttpError(409,'PROFILE_VERSION_CONFLICT');
 if(['DONE','NOT_APPLICABLE'].includes(task.status)||task.applicability==='NOT_APPLY')throw new HttpError(409,'VERIFICATION_NOT_REQUIRED');
 const old=company.factsJson as any,plan=verificationPlan(task.basis.contentJson as any,old,company.profileJson,task.missingFacts as string[]),allowed=new Set(plan.questions.map(q=>q.fact));
 if(Object.keys(input.answers).some(k=>!allowed.has(k)))throw new HttpError(400,'UNEXPECTED_VERIFICATION_FACT');
 // Validate the merged profile so defaults cannot clear other answers, and keep provenance
 // for every unchanged field. No obligation content or scope override is written here.
 const values=Object.fromEntries(Object.entries(old).map(([k,v])=>[k,(v as any).value]));
 const normalized=factsSchema.parse({...values,...input.answers}),facts=confirmedFacts(normalized,actorId,old);
 const version=company.version+1;
 await tx.workspaceCompany.update({where:{id:company.id},data:{factsJson:json(facts),version}});
 await tx.workspaceProfileVersion.create({data:{companyId:company.id,version,profileJson:company.profileJson as Prisma.InputJsonValue,factsJson:json(facts),actorId}});
 await tx.workspaceAudit.create({data:{actorId,organizationId:company.organizationId,action:'CHECKLIST_FACTS_ANSWERED',targetId:task.id}});
 const evaluation=await enqueueCompanyRefresh(tx,company.id,actorId);
 return {evaluationId:evaluation?.id??null,profileVersion:version};
}
