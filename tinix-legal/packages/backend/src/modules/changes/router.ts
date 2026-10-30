import {heldAlertIds} from './quality-hold.js';
import {Router,type Request,type Response,type NextFunction} from 'express';
import {Prisma,type PrismaClient} from '@prisma/client';
import {z} from 'zod';
import {workspaceAccess,HttpError} from '../workspace/access.js';
import type {MvpConfig} from '../operations/config.js';
import {json,uuid,contentSchema} from '../compliance/contracts.js';
import {approvalSchema,approveChange} from './service.js';
import {officialUrl} from './source-adapters.js';
import {citationIndex,matchCandidate,suggestReview,workflowStatus} from './review-assist.js';
import {reviewerOverview} from './overview.js';
import {discoveryInput,discoveryStatus,discoverySources,applyDiscoverySettings,getDiscoverySettings} from './discovery.js';
import {recheckWatchset} from './watch.js';
import {makeDraft} from '../compliance/catalogue.js';
import {draftSchema} from '../compliance/contracts.js';
export function createChangesRouter(db:PrismaClient,config:MvpConfig){
 const r=Router(),a=workspaceAccess(db,config),wrap=(fn:(req:Request,res:Response)=>Promise<unknown>)=>(req:Request,res:Response,next:NextFunction)=>void fn(req,res).catch(next),id=(req:Request)=>uuid.parse(req.params.id);
 async function alert(req:Request,write=false){const s=await a.mutation(req),row=await db.workspaceAlert.findUnique({where:{id:id(req)}});if(!row)throw new HttpError(404,'ALERT_NOT_FOUND');await a.company(db,s.userId,row.companyId,write);return {s,row};}
 r.get('/companies/:id/alerts',wrap(async(req,res)=>{const s=await a.session(req),c=await a.company(db,s.userId,id(req)),page=z.coerce.number().int().min(0).max(10000).default(0).parse(req.query.page);
  const held=await heldAlertIds(db),qualityScope=held.length?Prisma.sql`AND a.id NOT IN (${Prisma.join(held)})`:Prisma.empty;
  const scope=Prisma.sql`FROM "WorkspaceAlert" a JOIN "AlertOutbox" o ON o."alertId"=a.id LEFT JOIN "ComplianceTask" t ON t.id=a."taskId" LEFT JOIN "AlertUserState" us ON us."alertId"=a.id AND us."userId"=${s.userId} WHERE a."companyId"=${c.id} AND o."deliveredAt" IS NOT NULL AND o."errorCode" IS NULL ${qualityScope} AND (a.kind<>'REMINDER' OR (t.status NOT IN ('DONE','NOT_APPLICABLE') AND t.applicability='APPLY'))`;
  const [metrics]=await db.$queryRaw<{total:number;unread:number}[]>(Prisma.sql`SELECT count(*)::integer AS total,(count(*) FILTER (WHERE us."readAt" IS NULL AND (us."snoozedUntil" IS NULL OR us."snoozedUntil"<=now())))::integer AS unread ${scope}`);
  if(req.query.countOnly==='true'){res.json(metrics);return;}
  const ids=await db.$queryRaw<{id:string}[]>(Prisma.sql`SELECT a.id ${scope} ORDER BY a."createdAt" DESC,a.id ASC LIMIT 50 OFFSET ${page*50}`),rows=await db.workspaceAlert.findMany({where:{id:{in:ids.map(x=>x.id)}},orderBy:[{createdAt:'desc'},{id:'asc'}]}),states=await db.alertUserState.findMany({where:{userId:s.userId,alertId:{in:rows.map(x=>x.id)}}});res.json({items:rows.map(x=>({...x,userState:states.find(s=>s.alertId===x.id)??null})),...metrics,page,reminderSetting:await db.companyReminderSetting.findUnique({where:{companyId:c.id}})??{enabled:true,preparationDays:7,timezone:'Asia/Ho_Chi_Minh'}});
 }));
 r.put('/companies/:id/reminders',wrap(async(req,res)=>{const s=await a.mutation(req),input=z.object({enabled:z.boolean(),preparationDays:z.number().int().min(0).max(90)}).strict().parse(req.body);res.json(await db.$transaction(async tx=>{const c=await a.company(tx,s.userId,id(req),true);const row=await tx.companyReminderSetting.upsert({where:{companyId:c.id},create:{companyId:c.id,...input},update:input});await a.audit(tx,s.userId,'REMINDERS_UPDATED',c.id,c.organizationId);return row;}));}));
 r.patch('/alerts/:id',wrap(async(req,res)=>{const {s,row}=await alert(req),input=z.object({read:z.boolean().optional(),snoozedUntil:z.string().datetime().nullable().optional()}).strict().refine(x=>Object.keys(x).length>0).parse(req.body);if(input.snoozedUntil&&(Date.parse(input.snoozedUntil)<Date.now()||Date.parse(input.snoozedUntil)>Date.now()+90*86400000))throw new HttpError(400,'INVALID_SNOOZE');const data={...(input.read!==undefined?{readAt:input.read?new Date():null}:{}),...(input.snoozedUntil!==undefined?{snoozedUntil:input.snoozedUntil?new Date(input.snoozedUntil):null}:{})};res.json(await db.alertUserState.upsert({where:{alertId_userId:{alertId:row.id,userId:s.userId}},create:{alertId:row.id,userId:s.userId,...data},update:data}));}));
 r.post('/alerts/:id/task',wrap(async(req,res)=>{const {s,row}=await alert(req,true);res.json(await db.$transaction(async tx=>{
  await a.company(tx,s.userId,row.companyId,true);
  if((await heldAlertIds(tx)).includes(row.id))throw new HttpError(409,'ALERT_QUALITY_HOLD');if(row.taskId)return tx.complianceTask.findUniqueOrThrow({where:{id:row.taskId}});if(!row.decisionId)throw new HttpError(409,'NO_TASK_DECISION');const d=await tx.complianceDecision.findUniqueOrThrow({where:{id:row.decisionId},include:{evaluation:true,version:true}});if(d.evaluation.companyId!==row.companyId||d.evaluation.status!=='COMPLETED'||d.decision==='NOT_APPLY')throw new HttpError(409,'INVALID_TASK_DECISION');
  const key={companyId:row.companyId,obligationId:d.version.obligationId,scopeKey:d.scopeKey,periodKey:d.periodKey};await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify(key)},0))::text`;const t=await tx.complianceTask.findUnique({where:{task_business_key:key}});if(t)return t;
  const task=await tx.complianceTask.create({data:{...key,basisVersionId:d.versionId,decisionId:d.id,title:contentSchema.parse(d.version.contentJson).title,applicability:d.decision,missingFacts:d.missingFacts as any,explanation:d.explanation,dueDate:d.dueDate,dueDateKind:d.deadlineKind}});await tx.complianceTaskHistory.create({data:{taskId:task.id,actorId:s.userId,action:'CREATED_FROM_ALERT',beforeJson:{},afterJson:{alertId:row.id},note:'Tạo từ cảnh báo có quyết định đã pin.'}});return task;
 }));}));
 r.get('/admin/overview',wrap(async(req,res)=>{await a.reviewer(req);res.json(await reviewerOverview(db));}));
 r.get('/admin/changes',wrap(async(req,res)=>{await a.reviewer(req);
  const page=z.coerce.number().int().min(0).max(10000).default(0).parse(req.query.page),pageSize=z.coerce.number().int().min(1).max(50).default(50).parse(req.query.pageSize),status=z.enum(['PENDING','APPROVED','REJECTED']).optional().parse(req.query.status),stage=z.enum(['NEW','OBLIGATION_UPDATE','NEEDS_IMPORT']).optional().parse(req.query.stage);
  const where={...(status?{status}:{}),...(stage?{stage,status:'PENDING'}:{})};
  const items=await db.lawChangeCandidate.findMany({where,orderBy:[{createdAt:'desc'},{id:'asc'}],take:pageSize,skip:page*pageSize}),observations=await db.watchObservation.findMany({where:{id:{in:items.flatMap(c=>c.observationId?[c.observationId]:[])}},select:{id:true,observedAt:true}}),times=new Map(observations.map(o=>[o.id,o.observedAt]));
  const counts={all:0,PENDING:0,APPROVED:0,REJECTED:0,NEW:0,OBLIGATION_UPDATE:0,NEEDS_IMPORT:0};for(const row of await db.lawChangeCandidate.groupBy({by:['status'],_count:true})){counts.all+=row._count;if(row.status in counts)counts[row.status as 'PENDING'|'APPROVED'|'REJECTED']=row._count;}
  for(const row of await db.lawChangeCandidate.groupBy({by:['stage'],where:{status:'PENDING'},_count:true}))if(row.stage in counts)counts[row.stage as 'NEW'|'OBLIGATION_UPDATE'|'NEEDS_IMPORT']=row._count;
  const index=await citationIndex(db);
  res.json({items:items.map(c=>({...c,collectedAt:c.observationId?times.get(c.observationId)??null:null,impact:matchCandidate(index,c).map(m=>({versionId:m.versionId,title:m.title}))})),total:await db.lawChangeCandidate.count({where}),counts,page,pageSize});
 }));
 r.get('/admin/changes/:id',wrap(async(req,res)=>{await a.reviewer(req);const c=await db.lawChangeCandidate.findUnique({where:{id:id(req)}});if(!c)throw new HttpError(404,'CHANGE_NOT_FOUND');const index=await citationIndex(db);res.json({...c,suggestion:c.status==='PENDING'?suggestReview(index,c):null,workflow:await workflowStatus(db,c,index),watch:c.watchId?await db.sourceWatch.findUnique({where:{id:c.watchId}}):null,observation:c.observationId?await db.watchObservation.findUnique({where:{id:c.observationId}}):null,previous:c.previousObservationId?await db.watchObservation.findUnique({where:{id:c.previousObservationId}}):null,event:await db.approvedLawChange.findUnique({where:{candidateId:c.id}})});}));
 r.post('/admin/changes',wrap(async(req,res)=>{const s=await a.reviewer(req,true),input=z.object({title:z.string().trim().min(10).max(500),sourceUrl:z.string().url(),note:z.string().trim().min(10).max(4000)}).strict().parse(req.body);officialUrl(input.sourceUrl);const row=await db.lawChangeCandidate.create({data:{key:'manual:'+crypto.randomUUID(),kind:'MANUAL',title:input.title,diffJson:json({sourceUrl:input.sourceUrl,note:input.note,proposedBy:s.userId,requiresSourceVerification:true})}});res.status(201).json(row);}));
 r.post('/admin/changes/:id/approve',wrap(async(req,res)=>{const s=await a.reviewer(req,true),input=approvalSchema.parse(req.body);const row=await db.$transaction(async tx=>{const event=await approveChange(tx,id(req),s.userId,input);await a.audit(tx,s.userId,'LAW_CHANGE_APPROVED',event.id);return event;},{timeout:60000});res.status(201).json(row);}));
 // Intermediate decision while PENDING: open new obligation drafts, mark "needs import", or move back to triage.
 r.post('/admin/changes/:id/route',wrap(async(req,res)=>{const s=await a.reviewer(req,true),input=z.object({expectedRevision:z.number().int().positive(),stage:z.enum(['NEW','OBLIGATION_UPDATE','NEEDS_IMPORT']),versionIds:z.array(uuid).max(50).default([]),note:z.string().trim().max(2000).default('')}).strict().parse(req.body);
  res.json(await db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT id FROM "LawChangeCandidate" WHERE id=${id(req)} FOR UPDATE`;
   const c=await tx.lawChangeCandidate.findUnique({where:{id:id(req)}});if(!c)throw new HttpError(404,'CHANGE_NOT_FOUND');if(c.status!=='PENDING'||c.revision!==input.expectedRevision)throw new HttpError(409,'REVISION_CONFLICT');
   let workflow:any={note:input.note,by:s.userId,at:new Date().toISOString()};
   if(input.stage==='OBLIGATION_UPDATE'){
    if(!input.versionIds.length)throw new HttpError(400,'SELECT_OBLIGATIONS');
    const versions=await tx.obligationVersion.findMany({where:{id:{in:input.versionIds},status:'PUBLISHED'},include:{citations:true}});if(versions.length!==new Set(input.versionIds).size)throw new HttpError(400,'PUBLISHED_ONLY');
    const draftVersionIds:string[]=[];
    for(const v of versions){
     // Reuse an open draft of the same obligation instead of stacking a second one.
     const open=await tx.obligationVersion.findFirst({where:{obligationId:v.obligationId,status:{in:['DRAFT','IN_REVIEW']}},orderBy:{version:'desc'}});
     if(open){draftVersionIds.push(open.id);continue;}
     const row=await makeDraft(tx,s.userId,draftSchema.parse({content:v.contentJson,citations:v.citations.map(({documentId,snapshotId,parseRunId,provisionId,ocrVerified})=>({documentId,snapshotId,parseRunId,provisionId,ocrVerified}))}),v.obligationId);
     await a.audit(tx,s.userId,'OBLIGATION_NEW_VERSION_FROM_CHANGE',row.id);draftVersionIds.push(row.id);
    }
    workflow={...workflow,obligationIds:versions.map(v=>v.obligationId),fromVersionIds:versions.map(v=>v.id),draftVersionIds};
   }
   const updated=await tx.lawChangeCandidate.updateMany({where:{id:c.id,status:'PENDING',revision:input.expectedRevision},data:{stage:input.stage,workflowJson:input.stage==='NEW'?Prisma.DbNull:json(workflow),revision:{increment:1}}});if(!updated.count)throw new HttpError(409,'REVISION_CONFLICT');
   await a.audit(tx,s.userId,'LAW_CHANGE_ROUTED_'+input.stage,c.id);
   return tx.lawChangeCandidate.findUniqueOrThrow({where:{id:c.id}});
  },{timeout:60000}));
 }));
 r.post('/admin/changes/:id/reject',wrap(async(req,res)=>{const s=await a.reviewer(req,true),input=z.object({expectedRevision:z.number().int().positive(),note:z.string().trim().min(10).max(2000)}).strict().parse(req.body);res.json(await db.$transaction(async tx=>{const result=await tx.lawChangeCandidate.updateMany({where:{id:id(req),status:'PENDING',revision:input.expectedRevision},data:{status:'REJECTED',revision:{increment:1},reviewerId:s.userId,reviewedAt:new Date(),reviewNote:input.note}});if(!result.count)throw new HttpError(409,'REVISION_CONFLICT');await a.audit(tx,s.userId,'LAW_CHANGE_REJECTED',id(req));return tx.lawChangeCandidate.findUniqueOrThrow({where:{id:id(req)}});}));}));
 // Luật mới: reviewer-controlled discovery of newly issued documents (off by default).
 r.get('/admin/law-discovery',wrap(async(req,res)=>{await a.reviewer(req);res.json(await discoveryStatus(db));}));
 r.put('/admin/law-discovery',wrap(async(req,res)=>{const s=await a.reviewer(req,true),input=discoveryInput.parse(req.body),allowed=new Set((await discoverySources(db)).map(w=>w.url));if(input.sources.some(u=>!allowed.has(u)))throw new HttpError(400,'UNKNOWN_SOURCE');if(input.enabled&&!input.sources.length)throw new HttpError(400,'NO_SOURCE_SELECTED');
  await db.$transaction(async tx=>{const data={enabled:input.enabled,sources:[...new Set(input.sources)],intervalHours:input.intervalHours,maxPerRun:input.maxPerRun,effectiveFrom:input.effectiveFrom?new Date(input.effectiveFrom+'T00:00:00Z'):null,updatedBy:s.userId};await tx.lawDiscoverySetting.upsert({where:{id:'default'},create:{id:'default',...data},update:data});await applyDiscoverySettings(tx,data);await a.audit(tx,s.userId,'LAW_DISCOVERY_UPDATED','default');});res.json(await discoveryStatus(db));}));
 r.post('/admin/law-discovery/run',wrap(async(req,res)=>{const s=await a.reviewer(req,true),settings=await getDiscoverySettings(db);if(!settings.enabled)throw new HttpError(409,'DISCOVERY_DISABLED');
  await db.$transaction(async tx=>{await tx.sourceWatch.updateMany({where:{mode:'DISCOVERY',enabled:true},data:{nextCheckAt:new Date()}});await tx.lawDiscoverySetting.update({where:{id:'default'},data:{lastRunAt:new Date()}});await a.audit(tx,s.userId,'LAW_DISCOVERY_RUN','default');});
  // Network fetches are slow and rate-limited per domain; run them after replying.
  void recheckWatchset(db).catch(()=>console.error(JSON.stringify({event:'law_discovery_failed'})));res.status(202).json(await discoveryStatus(db));}));
 r.get('/admin/watchset',wrap(async(req,res)=>{await a.reviewer(req);const page=z.coerce.number().int().min(0).max(10000).default(0).parse(req.query.page);res.json({items:await db.sourceWatch.findMany({orderBy:{url:'asc'},skip:page*50,take:50}),total:await db.sourceWatch.count(),domains:await db.crawlDomainState.findMany({select:{domain:true,lastSuccessAt:true,lastError:true,watermark:true,nextRequestAt:true}}),events:await db.approvedLawChange.findMany({orderBy:{createdAt:'desc'},take:20}),pendingImpacts:await db.changeCompanyImpact.count({where:{completedAt:null}}),failedImpacts:await db.changeCompanyImpact.count({where:{errorCode:{not:null},completedAt:null}}),failedImpactItems:await db.changeCompanyImpact.findMany({where:{errorCode:{not:null},completedAt:null},take:50,orderBy:{createdAt:'asc'},select:{id:true,eventId:true,errorCode:true,attempts:true,nextAttemptAt:true}})});}));
 r.post('/admin/watchset',wrap(async(req,res)=>{await a.reviewer(req,true);const input=z.object({url:z.string().url(),mode:z.enum(['DISCOVERY','DOCUMENT']),intervalHours:z.number().int().min(1).max(168).default(24)}).strict().parse(req.body),u=officialUrl(input.url);res.status(201).json(await db.sourceWatch.upsert({where:{url:u.toString()},create:{...input,url:u.toString(),domain:u.hostname},update:{}}));}));
 r.patch('/admin/watchset/:id',wrap(async(req,res)=>{await a.reviewer(req,true);const input=z.object({enabled:z.boolean().optional(),recheck:z.literal(true).optional()}).strict().parse(req.body);res.json(await db.sourceWatch.update({where:{id:id(req)},data:{...(input.enabled!==undefined?{enabled:input.enabled}:{}),...(input.recheck?{nextCheckAt:new Date()}: {})}}));}));
 r.post('/admin/change-impacts/:id/retry',wrap(async(req,res)=>{await a.reviewer(req,true);const row=await db.changeCompanyImpact.updateMany({where:{id:id(req),completedAt:null,errorCode:{not:null}},data:{attempts:0,errorCode:null,nextAttemptAt:new Date()}});if(!row.count)throw new HttpError(409,'FAILED_ONLY');res.json({retried:true});}));
 r.use((e:unknown,_req:Request,res:Response,_next:NextFunction)=>{if(e instanceof HttpError){res.status(e.status).json({error:e.code});return;}if(e instanceof z.ZodError){res.status(400).json({error:'INVALID_REQUEST',fields:e.issues.map(x=>x.path.join('.'))});return;}if(e instanceof Error&&e.message==='SOURCE_NOT_ALLOWED'){res.status(400).json({error:e.message});return;}res.status(503).json({error:'ALERTS_UNAVAILABLE'});});return r;
}
