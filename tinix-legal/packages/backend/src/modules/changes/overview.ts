import {heldAlertIds} from './quality-hold.js';
import type {PrismaClient} from '@prisma/client';
import {citationIndex,matchCandidate,workflowStatus} from './review-assist.js';
import {REMOVED_GROUPS} from '../compliance/pilot.js';

// Số liệu tổng quan cho người duyệt. Chỉ trả số đếm tổng hợp và dữ liệu nền tảng (luật, nghĩa vụ, nguồn),
// không trả hồ sơ, công việc hay bằng chứng của bất kỳ doanh nghiệp nào.
const DAY=86400000;
const vnDate=(d:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
// Review decisions only; bulk operator imports (CHECKLIST_*) would drown them out.
const PLATFORM_ACTIONS=/^(OBLIGATION_|LAW_CHANGE_|CATALOGUE_)/;

export async function reviewerOverview(db:PrismaClient,now=new Date()){
 const since14=new Date(now.getTime()-14*DAY),since30=new Date(now.getTime()-30*DAY),since24h=new Date(now.getTime()-DAY);
 const [versions,index,release,releaseCount,pending,candidateStatus,candidateStageRows,recentCandidates,events30,eventsTotal,alerts30,impactsPending,impactsFailed,companies,watchTotal,watchEnabled,domains,observations,audits,blocked,delivered,deliveryPending,deliveryFailed]=await Promise.all([
  db.obligationVersion.findMany({orderBy:[{obligationId:'asc'},{version:'desc'}],select:{id:true,obligationId:true,version:true,status:true,contentJson:true,updatedAt:true,publishedAt:true}}),
  citationIndex(db),
  db.catalogueRelease.findFirst({where:{sealedAt:{not:null}},orderBy:[{publishedAt:'desc'},{id:'desc'}],select:{id:true,name:true,publishedAt:true,_count:{select:{items:true}}}}),
  db.catalogueRelease.count({where:{sealedAt:{not:null}}}),
  db.lawChangeCandidate.findMany({where:{status:'PENDING'},select:{id:true,title:true,kind:true,stage:true,workflowJson:true,diffJson:true,createdAt:true}}),
  db.lawChangeCandidate.groupBy({by:['status'],_count:true}),
  db.lawChangeCandidate.groupBy({by:['stage'],where:{status:'PENDING'},_count:true}),
  db.lawChangeCandidate.findMany({where:{createdAt:{gte:since14}},select:{createdAt:true}}),
  db.approvedLawChange.count({where:{createdAt:{gte:since30}}}),
  db.approvedLawChange.count(),
  db.workspaceAlert.count({where:{kind:'LAW_CHANGE',createdAt:{gte:since30}}}),
  db.changeCompanyImpact.count({where:{completedAt:null,errorCode:null}}),
  db.changeCompanyImpact.count({where:{completedAt:null,errorCode:{not:null}}}),
  db.workspaceCompany.count(),
  db.sourceWatch.count(),
  db.sourceWatch.count({where:{enabled:true}}),
  db.crawlDomainState.findMany({select:{domain:true,lastSuccessAt:true,lastError:true},orderBy:{domain:'asc'}}),
  db.watchObservation.groupBy({by:['result'],where:{observedAt:{gte:since24h}},_count:true}),
  db.workspaceAudit.findMany({where:{organizationId:null,OR:['OBLIGATION_','LAW_CHANGE_','CATALOGUE_'].map(p=>({action:{startsWith:p}}))},orderBy:{createdAt:'desc'},take:120,select:{action:true,actorId:true,targetId:true,createdAt:true}}),
  db.checklistImportEntry.count({where:{versionId:null}}),
  db.alertOutbox.findMany({where:{deliveredAt:{gte:since30}},select:{alertId:true,deliveredAt:true}}),
  db.alertOutbox.count({where:{deliveredAt:null,errorCode:null}}),
  db.alertOutbox.count({where:{deliveredAt:null,errorCode:{not:null}}}),
 ]);
 // Latest version per obligation, without groups taken out of the product.
 const latest=new Map<string,typeof versions[number]>();for(const v of versions)if(!latest.has(v.obligationId))latest.set(v.obligationId,v);
 const current=[...latest.values()].filter(v=>!REMOVED_GROUPS.includes((v.contentJson as any)?.group));
 const statusCount=(s:string)=>current.filter(v=>v.status===s).length;
 const groups=new Map<string,{group:string,draft:number,inReview:number,published:number,retired:number}>();
 for(const v of current){const g=(v.contentJson as any)?.group??'other',row=groups.get(g)??{group:g,draft:0,inReview:0,published:0,retired:0};
  // A published obligation with an open new draft still counts as published for coverage.
  const published=versions.some(x=>x.obligationId===v.obligationId&&x.status==='PUBLISHED');
  if(published)row.published++;else if(v.status==='IN_REVIEW')row.inReview++;else if(v.status==='DRAFT')row.draft++;else if(v.status==='RETIRED')row.retired++;
  groups.set(g,row);}
 const held=new Set(await heldAlertIds(db));
 const deliveredAlerts=await db.workspaceAlert.findMany({where:{id:{in:delivered.map(d=>d.alertId)}},select:{id:true,kind:true}});
 const deliveredCount=(k:string[])=>deliveredAlerts.filter(d=>k.includes(d.kind)&&!held.has(d.id)).length;
 // Chart series: daily windows in Vietnam time, published obligations by deadline type and by review basis.
 const days14=Array.from({length:14},(_,i)=>vnDate(new Date(now.getTime()-(13-i)*DAY)));
 const deliveredAt=new Map(delivered.map(d=>[d.alertId,d.deliveredAt]));
 const alertsPerDay=days14.map(date=>({date,law:0,reminder:0}));
 for(const a of deliveredAlerts){if(held.has(a.id))continue;const at=deliveredAt.get(a.id);if(!at)continue;const row=alertsPerDay.find(r=>r.date===vnDate(at));if(row)a.kind==='REMINDER'?row.reminder++:row.law++;}
 const approvals=await db.workspaceAudit.findMany({where:{action:{in:['OBLIGATION_APPROVE','OBLIGATION_AUTO_APPROVED']},createdAt:{gte:since14}},select:{action:true,createdAt:true}});
 const approvalsPerDay=days14.map(date=>({date,expert:0,auto:0}));
 for(const a of approvals){const row=approvalsPerDay.find(r=>r.date===vnDate(a.createdAt));if(row)a.action==='OBLIGATION_AUTO_APPROVED'?row.auto++:row.expert++;}
 const publishedLatest=new Map<string,typeof versions[number]>();for(const v of versions)if(v.status==='PUBLISHED'&&!publishedLatest.has(v.obligationId)&&!REMOVED_GROUPS.includes((v.contentJson as any)?.group))publishedLatest.set(v.obligationId,v);
 const kindOf=(k:string)=>['MONTHLY','QUARTERLY','ANNUAL','FISCAL_YEAR_END_OFFSET','PERIOD_END'].includes(k)?'periodic':['FIXED','OFFSET','DATE_OFFSET'].includes(k)?'once':k==='REVIEW_PERIOD'?'review':'none';
 const deadlineKinds={periodic:0,once:0,review:0,none:0};for(const v of publishedLatest.values())deadlineKinds[kindOf((v.contentJson as any)?.deadline?.kind) as keyof typeof deadlineKinds]++;
 const autoReviewed=new Set((await db.workspaceAudit.findMany({where:{action:'OBLIGATION_AUTO_APPROVED',targetId:{in:[...publishedLatest.values()].map(v=>v.id)}},select:{targetId:true}})).map(a=>a.targetId));
 const reviewBasis={expert:[...publishedLatest.values()].filter(v=>!autoReviewed.has(v.id)).length,auto:autoReviewed.size};
 const relevant=pending.filter(c=>matchCandidate(index,c).length);
 let readyToNotify=0;for(const c of pending.filter(x=>x.stage==='OBLIGATION_UPDATE'))if((await workflowStatus(db,c,index))?.ready)readyToNotify++;
 const byKind:Record<string,number>={};for(const c of pending)byKind[c.kind]=(byKind[c.kind]??0)+1;
 const days=Array.from({length:14},(_,i)=>vnDate(new Date(now.getTime()-(13-i)*DAY))),perDay=new Map(days.map(d=>[d,0]));
 for(const c of recentCandidates){const d=vnDate(c.createdAt);if(perDay.has(d))perDay.set(d,perDay.get(d)!+1);}
 const oldestPending=pending.reduce<Date|null>((m,c)=>!m||c.createdAt<m?c.createdAt:m,null);
 const platform=audits.filter(a=>PLATFORM_ACTIONS.test(a.action)).slice(0,120);
 const actors=new Map((await db.workspaceUser.findMany({where:{id:{in:[...new Set(platform.map(a=>a.actorId))]}},select:{id:true,name:true}})).map(u=>[u.id,u.name]));
 const obs=Object.fromEntries(observations.map(o=>[o.result,o._count])) as Record<string,number>,obsTotal=Object.values(obs).reduce((a,b)=>a+b,0);
 const count=(rows:{_count:number}[],pick:(r:any)=>boolean)=>rows.filter(pick).reduce((a,r)=>a+r._count,0);
 const [feedbackCounts,feedbackCategories,feedbackRecent,feedbackReplies]=await Promise.all([
  db.workspaceFeedback.groupBy({by:['status'],_count:true}),
  db.workspaceFeedback.groupBy({by:['category'],_count:true}),
  db.workspaceFeedback.findMany({where:{createdAt:{gte:since14}},select:{createdAt:true}}),
  db.workspaceFeedbackMessage.findMany({where:{actorRole:'REVIEWER',createdAt:{gte:since14}},select:{createdAt:true}})
 ]);
 const feedback=Object.fromEntries(feedbackCounts.map(x=>[x.status,x._count]));
 const feedbackPerDay=days14.map(date=>({date,received:0,replies:0}));
 for(const r of feedbackRecent){const row=feedbackPerDay.find(d=>d.date===vnDate(r.createdAt));if(row)row.received++;}
 for(const r of feedbackReplies){const row=feedbackPerDay.find(d=>d.date===vnDate(r.createdAt));if(row)row.replies++;}
 return {
  generatedAt:now.toISOString(),
  feedback,
  feedbackInsights:{byCategory:Object.fromEntries(feedbackCategories.map(x=>[x.category,x._count])),perDay:feedbackPerDay},
  obligations:{total:current.length,draft:statusCount('DRAFT'),inReview:statusCount('IN_REVIEW'),published:current.filter(v=>versions.some(x=>x.obligationId===v.obligationId&&x.status==='PUBLISHED')).length,retired:statusCount('RETIRED'),blockedImports:blocked,
   groups:[...groups.values()].sort((a,b)=>(b.draft+b.inReview+b.published)-(a.draft+a.inReview+a.published)),
   // Minimal fields so the page can rank drafts with the same priority rule as the review room.
   deadlineKinds,reviewBasis,approvalsPerDay,queue:current.filter(v=>['DRAFT','IN_REVIEW'].includes(v.status)).map(v=>{const c=v.contentJson as any;return {id:v.id,status:v.status,title:c?.title,group:c?.group,rule:c?.rule,deadline:c?.deadline,updatedAt:v.updatedAt};})},
  catalogue:{releases:releaseCount,latest:release?{id:release.id,name:release.name,publishedAt:release.publishedAt,items:release._count.items}:null,companiesUsing:companies},
  changes:{pending:pending.length,approved:count(candidateStatus,r=>r.status==='APPROVED'),rejected:count(candidateStatus,r=>r.status==='REJECTED'),
   stages:{NEW:count(candidateStageRows,r=>r.stage==='NEW'),OBLIGATION_UPDATE:count(candidateStageRows,r=>r.stage==='OBLIGATION_UPDATE'),NEEDS_IMPORT:count(candidateStageRows,r=>r.stage==='NEEDS_IMPORT')},
   relevant:relevant.length,relevantItems:relevant.slice(0,5).map(c=>({id:c.id,title:c.title,obligations:matchCandidate(index,c).map(m=>m.title)})),
   readyToNotify,byKind,newLast7Days:[...perDay.entries()].slice(-7).reduce((a,[,n])=>a+n,0),perDay:[...perDay.entries()].map(([date,n])=>({date,count:n})),
   oldestPendingAt:oldestPending?.toISOString()??null},
  alerts:{events30,eventsTotal,alerts30:deliveredCount(['LAW_CHANGE','VERIFY_SCOPE']),reminders30:deliveredCount(['REMINDER']),held30:deliveredAlerts.filter(d=>held.has(d.id)).length,deliveryPending,deliveryFailed,impactsPending,impactsFailed,perDay:alertsPerDay},
  sources:{watchTotal,watchEnabled,observations24h:{total:obsTotal,failed:obs.FAILED??0,ok:obsTotal-(obs.FAILED??0)},domains:domains.map(d=>({domain:d.domain,lastSuccessAt:d.lastSuccessAt,ok:!d.lastError,lastError:d.lastError}))},
  activity:platform.map(a=>({action:a.action,actor:actors.get(a.actorId)??(a.actorId.startsWith('local-')||a.actorId.startsWith('engine:')||a.actorId.startsWith('scheduler')?'Hệ thống':'Không rõ'),at:a.createdAt}))
 };
}
