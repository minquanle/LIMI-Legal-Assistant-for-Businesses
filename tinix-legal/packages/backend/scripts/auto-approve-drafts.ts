import {PrismaClient} from '@prisma/client';
import {writeFile} from 'node:fs/promises';
import {loadConfig} from '../src/modules/operations/config.js';
import {contentSchema,json} from '../src/modules/compliance/contracts.js';
import {publishApprovedCatalogue} from '../src/modules/compliance/catalogue.js';
import {enqueueEvaluation} from '../src/modules/compliance/evaluation.js';
import {REMOVED_GROUPS} from '../src/modules/compliance/pilot.js';
// @ts-ignore Static prototype JavaScript has no declaration file.
import {draftPriority} from '../../../../Prototype/dist/reviewer-controls.js';

// Operator bulk approval requested by the product owner. Every approval is recorded as automatic and
// NOT expert-reviewed, so it can be found and retired later. Citations needing OCR review are skipped,
// never marked as verified. Default is a dry run; pass --apply to write.
const args=process.argv.slice(2),apply=args.includes('--apply'),count=Number(args[args.indexOf('--count')+1]||80),report=args.find(a=>a.endsWith('.json'));
if(!report)throw Error('Usage: auto-approve-drafts.ts <report.json> [--count 80] [--apply]');
const config=loadConfig();if(new URL(config.databaseUrl).pathname!=='/limi_dev')throw Error('LOCAL_DEV_REQUIRED');
export const AUTO_NOTE='Tự duyệt hàng loạt theo yêu cầu vận hành ngày 22/10/2026. CHƯA được chuyên gia thẩm định nội dung.';
const CHECKS={action:true,scope:true,exceptions:true,effectiveDates:true,deadline:true,citations:true};
const db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}});
try{
 const reviewer=await db.workspaceUser.findFirst({where:{platformReviewer:true},orderBy:{createdAt:'asc'}});if(!reviewer)throw Error('REVIEWER_REQUIRED');
 const versions=await db.obligationVersion.findMany({orderBy:[{obligationId:'asc'},{version:'desc'}],include:{citations:{include:{snapshot:{select:{qualityJson:true}}}}}});
 const latest=new Map<string,typeof versions[number]>();for(const v of versions)if(!latest.has(v.obligationId))latest.set(v.obligationId,v);
 const published=new Set(versions.filter(v=>v.status==='PUBLISHED').map(v=>v.obligationId));
 const skipped:{id:string,title:string,reason:string}[]=[],eligible:any[]=[];
 for(const v of latest.values()){
  if(!['DRAFT','IN_REVIEW'].includes(v.status)||published.has(v.obligationId))continue;
  const c=v.contentJson as any,title=c?.title??v.id;
  if(REMOVED_GROUPS.includes(c?.group)){skipped.push({id:v.id,title,reason:'Nhóm đã bỏ khỏi sản phẩm'});continue;}
  if(!contentSchema.safeParse(c).success){skipped.push({id:v.id,title,reason:'Nội dung không hợp lệ theo schema'});continue;}
  if(!v.citations.length){skipped.push({id:v.id,title,reason:'Chưa có căn cứ'});continue;}
  if(v.citations.some(x=>(x.snapshot.qualityJson as any)?.parseQuality?.requiresOcrTextReview&&!x.ocrVerified)){skipped.push({id:v.id,title,reason:'Căn cứ OCR chưa được đối chiếu'});continue;}
  eligible.push({v,title,group:c.group,priority:draftPriority(c).score});
 }
 eligible.sort((a,b)=>b.priority-a.priority||a.title.localeCompare(b.title,'vi'));
 const chosen=eligible.slice(0,count);
 let releaseId:string|null=null,companies=0;
 if(apply&&chosen.length)await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended('limi-approved-catalogue',0))::text`;
  for(const {v} of chosen){
   let row=await tx.obligationVersion.findUniqueOrThrow({where:{id:v.id}});
   if(row.status==='DRAFT'){row=await tx.obligationVersion.update({where:{id:v.id},data:{status:'IN_REVIEW',revision:{increment:1}}});await tx.workspaceAudit.create({data:{actorId:reviewer.id,action:'OBLIGATION_SUBMITTED',targetId:v.id}});}
   await tx.obligationReview.create({data:{versionId:v.id,reviewerId:reviewer.id,decision:'APPROVE',checksJson:json(CHECKS),note:AUTO_NOTE}});
   await tx.obligationVersion.update({where:{id:v.id},data:{status:'PUBLISHED',publishedAt:new Date(),revision:{increment:1}}});
   await tx.workspaceAudit.create({data:{actorId:reviewer.id,action:'OBLIGATION_AUTO_APPROVED',targetId:v.id}});
  }
  const release=await publishApprovedCatalogue(tx,reviewer.id);
  if(release){releaseId=release.id;const list=await tx.workspaceCompany.findMany({select:{id:true}});companies=list.length;for(const c of list)await enqueueEvaluation(tx,c.id,reviewer.id,undefined,release.id);await tx.workspaceAudit.create({data:{actorId:reviewer.id,action:'CATALOGUE_AUTO_PUBLISHED',targetId:release.id}});}
 },{timeout:300000});
 const byGroup:Record<string,number>={};for(const x of chosen)byGroup[x.group]=(byGroup[x.group]??0)+1;
 const out={applied:apply,requested:count,eligible:eligible.length,approved:chosen.length,byGroup,withDeadline:chosen.filter(x=>!['NONE','REVIEW_PERIOD'].includes((x.v.contentJson as any).deadline?.kind)).length,releaseId,companiesQueued:companies,note:AUTO_NOTE,skippedCount:skipped.length,skippedReasons:skipped.reduce((m:any,s)=>(m[s.reason]=(m[s.reason]??0)+1,m),{}),items:chosen.map(x=>({versionId:x.v.id,title:x.title,group:x.group,priority:x.priority})),skipped};
 await writeFile(report,JSON.stringify(out,null,2));
 const {items,skipped:_s,...summary}=out;console.log(JSON.stringify(summary));
}finally{await db.$disconnect();}
