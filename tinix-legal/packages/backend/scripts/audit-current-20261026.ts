import {PrismaClient} from '@prisma/client';
import {writeFile} from 'node:fs/promises';
import {loadConfig} from '../src/modules/operations/config.js';
import {heldAlertIds} from '../src/modules/changes/quality-hold.js';
const db=new PrismaClient({datasources:{db:{url:loadConfig().databaseUrl}}});
try{
 const [laws,versions,reviews,tasks,release,evals,changes,held,watch,companies,applied]=await Promise.all([
 db.canonicalDocument.count(),db.obligationVersion.findMany({select:{id:true,obligationId:true,status:true,contentJson:true,revision:true}}),
 db.obligationReview.findMany({where:{decision:'APPROVE'},select:{versionId:true,note:true}}),
 db.complianceTask.findMany({select:{id:true,basisVersionId:true,status:true,applicability:true,missingFacts:true,dueDate:true,dueDateKind:true,title:true,companyId:true,updatedAt:true}}),
 db.catalogueRelease.findFirst({where:{sealedAt:{not:null}},orderBy:[{publishedAt:'desc'},{id:'desc'}],include:{items:true}}),
 db.complianceEvaluation.groupBy({by:['status'],_count:true}),db.lawChangeCandidate.groupBy({by:['status'],_count:true}),heldAlertIds(db),db.sourceWatch.count({where:{enabled:true}}),db.workspaceCompany.count(),db.$queryRaw<any[]>`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY migration_name`]);
 const autoIds=new Set(reviews.filter(r=>r.note.includes('Tự duyệt hàng loạt')).map(r=>r.versionId)),published=versions.filter(v=>v.status==='PUBLISHED'),deadlines:Record<string,number>={};
 for(const v of published){const kind=(v.contentJson as any).deadline.kind;deadlines[kind]=(deadlines[kind]??0)+1;}
 const autoTasks=tasks.filter(t=>autoIds.has(t.basisVersionId));
 const completeProfiles=await db.workspaceCompany.findMany({select:{id:true,version:true}});
 const freshness=[];for(const c of completeProfiles){const profile=await db.workspaceProfileVersion.findUniqueOrThrow({where:{companyId_version:{companyId:c.id,version:c.version}}});const latest=await db.complianceEvaluation.findFirst({where:{companyId:c.id},orderBy:{createdAt:'desc'},select:{id:true,profileVersionId:true,releaseId:true,status:true,createdAt:true}});freshness.push({companyId:c.id,profileVersion:c.version,latestEvaluation:latest,profileCurrent:latest?.profileVersionId===profile.id,releaseCurrent:latest?.releaseId===release?.id});}
 const o={auditDate:'2026-10-26',laws,companies,versions:versions.length,roots:new Set(versions.map(v=>v.obligationId)).size,statuses:versions.reduce((m:any,v)=>(m[v.status]=(m[v.status]??0)+1,m),{}),publishedRoots:new Set(published.map(v=>v.obligationId)).size,autoPublishedVersions:published.filter(v=>autoIds.has(v.id)).length,deadlines,release:release?{id:release.id,items:release.items.length,publishedAt:release.publishedAt}:null,tasks:tasks.length,taskStates:tasks.reduce((m:any,t)=>(m[t.status+'/'+t.applicability]=(m[t.status+'/'+t.applicability]??0)+1,m),{}),tasksFromAutoApproved:autoTasks.length,autoTaskSample:autoTasks.slice(0,3).map(t=>({id:t.id,title:t.title,basisVersionId:t.basisVersionId})),evals,changes,qualityHeldAlerts:held.length,enabledWatches:watch,freshness,migrations:applied.map(m=>m.migration_name),unlinkedGuideVersions:published.filter(v=>(v.contentJson as any).guide?.steps?.some((s:any)=>!s.provisionIds?.length)).length};
 await writeFile('C:/Rnd_To_Startup 2026/outputs/LIMI_REAUDIT_20261026/database.json',JSON.stringify(o,null,2));console.log(JSON.stringify(o));
}finally{await db.$disconnect();}
