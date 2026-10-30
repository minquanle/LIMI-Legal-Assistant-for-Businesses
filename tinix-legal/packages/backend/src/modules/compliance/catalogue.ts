import {type PrismaClient,type Prisma} from '@prisma/client';
import {contentSchema,draftSchema,json} from './contracts.js';
import {HttpError} from '../workspace/access.js';
import {canonicalJson,sha256} from '../legal/record-adapter.js';
import {provisionText} from '../legal/record-adapter.js';
import {randomUUID} from 'node:crypto';
type Tx=Prisma.TransactionClient;
export async function citations(tx:Tx,input:ReturnType<typeof draftSchema.parse>['citations']){
 const values=[];
 for(const c of input){const node=await tx.parsedProvision.findFirst({where:{id:c.provisionId,parseRunId:c.parseRunId,parseRun:{snapshotId:c.snapshotId,sealedAt:{not:null},snapshot:{documentId:c.documentId}}},include:{parseRun:{include:{snapshot:true}}}});
   if(!node||node.quotedAmendmentCandidate)throw new HttpError(400,'CITATION_SCOPE_OR_QUOTED_TEXT');
   values.push({...c,quote:provisionText(node.parseRun.snapshot.fullText,node.spanStart,node.spanEnd)});
 }return values;
}
export async function makeDraft(db:Tx,actorId:string,input:ReturnType<typeof draftSchema.parse>,obligationId?:string,key?:string){
 const cite=await citations(db,input.citations);let root=obligationId?await db.obligation.findUnique({where:{id:obligationId}}):null;
 if(obligationId&&!root)throw new HttpError(404,'OBLIGATION_NOT_FOUND');
 root??=await db.obligation.create({data:{key:key??'manual-'+randomUUID()}});
 const last=await db.obligationVersion.findFirst({where:{obligationId:root.id},orderBy:{version:'desc'}});
 const version=await db.obligationVersion.create({data:{obligationId:root.id,version:(last?.version??0)+1,authorId:actorId,contentJson:json(input.content),citations:{create:cite}}});return version;
}
export async function releaseCatalogue(db:Tx,actorId:string,name:string,versionIds:string[]){
 if(new Set(versionIds).size!==versionIds.length)throw new HttpError(400,'INVALID_RELEASE');
 for(const id of [...versionIds].sort())await db.$queryRaw`SELECT id FROM "ObligationVersion" WHERE id=${id} FOR UPDATE`;
 const versions=await db.obligationVersion.findMany({where:{id:{in:versionIds},status:'PUBLISHED'},include:{citations:true}});
 if(versions.length!==versionIds.length||new Set(versions.map(v=>v.obligationId)).size!==versions.length)throw new HttpError(400,'RELEASE_REQUIRES_PUBLISHED_VERSIONS');
 versions.forEach(v=>contentSchema.parse(v.contentJson));
 const manifest=versions.sort((a,b)=>a.id.localeCompare(b.id)).map(v=>({id:v.id,content:v.contentJson,citations:v.citations}));
 const row=await db.catalogueRelease.create({data:{actorId,name,manifestHash:sha256(canonicalJson(json(manifest))),items:{create:versions.map(v=>({versionId:v.id}))}}});
 return db.catalogueRelease.update({where:{id:row.id},data:{sealedAt:new Date()}});
}
// Serialize automatic catalogue snapshots so concurrent approvals cannot lose an item.
export async function publishApprovedCatalogue(tx:Tx,actorId:string){
 await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended('limi-approved-catalogue',0))::text`;
 const rows=await tx.obligationVersion.findMany({where:{status:{in:['PUBLISHED','RETIRED']}},orderBy:[{obligationId:'asc'},{version:'desc'}]});
 const latest=new Map<string,typeof rows[number]>();for(const row of rows)if(!latest.has(row.obligationId))latest.set(row.obligationId,row);
 // A retired latest publication is a tombstone; an older publication must never reappear.

 return releaseCatalogue(tx,actorId,'Checklist đã duyệt · '+new Date().toISOString(),[...latest.values()].filter(v=>v.status==='PUBLISHED').map(v=>v.id));
}
export async function rankCandidates(db:PrismaClient,limit=100){
 // A reproducible editorial shortlist, not an automatic legal conclusion.
 const documents=await db.canonicalDocument.findMany({where:{selectedSnapshotId:{not:null}},select:{id:true,selectedSnapshotId:true},orderBy:{id:'asc'}});
 const candidates:{key:string,documentId:string,snapshotId:string,parseRunId:string,provisionId:string,groupCode:string,score:number,title:string,excerpt:string,reasonJson:any}[]=[];
 // Read one snapshot at a time: never duplicate a full decree once per article in memory.
 for(const document of documents){const run=await db.parseRun.findFirst({where:{snapshotId:document.selectedSnapshotId!,sealedAt:{not:null}},orderBy:[{createdAt:'desc'},{id:'desc'}],include:{snapshot:{include:{document:true}},provisions:{where:{nodeType:'DIEU',quotedAmendmentCandidate:false},orderBy:{orderIndex:'asc'}}}});if(!run)continue;
 const s=run.snapshot,d=s.document,points=[...s.fullText];for(const n of run.provisions){const text=points.slice(n.spanStart,n.spanEnd).join(''),mandatory=/phải|có trách nhiệm|nghĩa vụ|không được/iu.test(text),business=/doanh nghiệp|người sử dụng lao động|người nộp thuế|tổ chức kinh doanh/iu.test(text),operational=/nộp|đăng ký|thông báo|lưu trữ|hợp đồng|hóa đơn|kê khai|bảo hiểm|tiền lương/iu.test(text),penalty=/xử phạt|phạt tiền/iu.test(text),ocr=Boolean((s.qualityJson as any)?.parseQuality?.requiresOcrTextReview),score=(business?35:0)+(mandatory?25:0)+(operational?25:0)+(['tax','labor','insurance','company'].includes(d.groupCode??'')?15:5)-(penalty?15:0)-(ocr?10:0);if(score<40)continue;
 candidates.push({key:n.id,documentId:d.id,snapshotId:s.id,parseRunId:run.id,provisionId:n.id,groupCode:d.groupCode??'company',score,title:`${d.documentNumber} · ${n.heading||'Điều '+n.ordinal}`,excerpt:text.slice(0,4000),reasonJson:json({business,mandatory,operational,penalty,ocr,formula:'35 business +25 mandatory +25 operational +15 priority group -15 penalties -10 OCR'})});
 }}candidates.sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
 // Round-robin groups prevents a large labor decree from occupying the entire shortlist.
 const buckets=new Map<string,typeof candidates>();for(const c of candidates){const bucket=buckets.get(c.groupCode)??[];bucket.push(c);buckets.set(c.groupCode,bucket);}
 const chosen:typeof candidates=[];while(chosen.length<limit&&[...buckets.values()].some(b=>b.length))for(const bucket of buckets.values()){if(chosen.length===limit)break;const c=bucket.shift();if(c)chosen.push(c);}
 for(const c of chosen)await db.legalCandidate.upsert({where:{key:c.key},create:c,update:{score:c.score,reasonJson:c.reasonJson}});return chosen.length;
}
