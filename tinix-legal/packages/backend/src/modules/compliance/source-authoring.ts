import {randomUUID} from 'node:crypto';
import {Router} from 'express';
import {z} from 'zod';
import {type PrismaClient} from '@prisma/client';
import type {MvpConfig} from '../operations/config.js';
import {workspaceAccess,HttpError} from '../workspace/access.js';
import {getOrCreateSnapshot,getOrCreateParse,resolveDocumentSource,linkSnapshotSource} from '../legal/version-store.js';
import {provisionText} from '../legal/record-adapter.js';
import {officialUrl} from '../changes/source-adapters.js';

// Manual import only. No network request, schedule or automatic legal approval is performed.
export function sourceAuthoring(db:PrismaClient,config:MvpConfig){
 const r=Router(),a=workspaceAccess(db,config);
 r.get('/admin/legal-sources',(req,res,next)=>{void(async()=>{
  await a.reviewer(req);const documentId=z.string().uuid().optional().parse(req.query.documentId),page=z.coerce.number().int().min(0).max(10000).default(0).parse(req.query.page),q=z.string().max(150).default('').parse(req.query.q);
  if(!documentId){const where={selectedSnapshotId:{not:null},...(q?{OR:[{title:{contains:q,mode:'insensitive' as const}},{documentNumber:{contains:q,mode:'insensitive' as const}}]}:{})};res.json({items:await db.canonicalDocument.findMany({where,select:{id:true,title:true,documentNumber:true,groupCode:true},orderBy:{documentNumber:'asc'},skip:page*20,take:20}),total:await db.canonicalDocument.count({where}),page});return;}
  const doc=await db.canonicalDocument.findUnique({where:{id:documentId}});if(!doc?.selectedSnapshotId)throw new HttpError(404,'SOURCE_NOT_FOUND');
  const run=await db.parseRun.findFirst({where:{snapshotId:doc.selectedSnapshotId,sealedAt:{not:null}},orderBy:[{createdAt:'desc'},{id:'desc'}],include:{snapshot:true}});if(!run)throw new HttpError(409,'SOURCE_PARSE_REQUIRED');
  const where={parseRunId:run.id,quotedAmendmentCandidate:false,...(q?{heading:{contains:q,mode:'insensitive' as const}}:{})};
  const nodes=await db.parsedProvision.findMany({where,orderBy:{orderIndex:'asc'},skip:page*10,take:10});
  res.json({items:nodes.map(n=>({documentId:doc.id,snapshotId:run.snapshotId,parseRunId:run.id,provisionId:n.id,ocrVerified:false,quote:provisionText(run.snapshot.fullText,n.spanStart,n.spanEnd),snapshot:{document:{documentNumber:doc.documentNumber,title:doc.title}},provision:{heading:n.heading}})),total:await db.parsedProvision.count({where}),page,document:doc.title});
 })().catch(next);});
 r.post('/admin/legal-sources',(req,res,next)=>{void(async()=>{
  const user=await a.reviewer(req,true),input=z.object({documentNumber:z.string().trim().min(3).max(100),title:z.string().trim().min(10).max(500),issuingBody:z.string().trim().min(3).max(250),sourceUrl:z.string().url(),fullText:z.string().trim().min(50).max(300000),group:z.enum(['tax','accounting','labor','insurance','company','commerce','data','fire','environment','food'])}).strict().parse(req.body);
  try{officialUrl(input.sourceUrl);}catch{throw new HttpError(400,'SOURCE_NOT_ALLOWED');}
  const normalizedNumber=input.documentNumber.normalize('NFC').toUpperCase().replace(/\s+/g,'');
  const result=await db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${'manual-law:'+normalizedNumber},0))::text`;
   if(await tx.canonicalDocument.findFirst({where:{normalizedNumber}}))throw new HttpError(409,'SOURCE_ALREADY_EXISTS');
   const doc=await tx.canonicalDocument.create({data:{id:randomUUID(),documentNumber:input.documentNumber,normalizedNumber,title:input.title,documentType:'KHAC',issuingBody:input.issuingBody,groupCode:input.group,reviewStatus:'PENDING'}});
   const record={...input,url:input.sourceUrl,normalizedNumber,parseQuality:{requiresOcrTextReview:true,manualImport:true},sourceCollectedAt:new Date().toISOString()};
   const {snapshot}=await getOrCreateSnapshot(tx,doc.id,record);
   // Keep a single explicit unverified text span. A lawyer selects and checks the original text;
   // imported quotations are not silently interpreted as newly operative articles.
   const structure={offsetUnit:'UNICODE_CODE_POINT',sections:[],appendices:[],articles:[{id:'manual-text',nodeType:'TEXT',heading:'Toàn văn nhập thủ công · cần đối chiếu',span:{start:0,end:[...input.fullText].length},children:[]}]};
   await getOrCreateParse(tx,snapshot,structure,'manual-source-1',{requiresTextReview:true});
   const source=await resolveDocumentSource(tx,doc.id,input.sourceUrl);await linkSnapshotSource(tx,doc.id,snapshot.id,source.id,'CONTENT',{method:'MANUAL_TEXT',actorId:user.userId,collectedAt:record.sourceCollectedAt,verified:false});
   await tx.canonicalDocument.update({where:{id:doc.id},data:{selectedSnapshotId:snapshot.id}});await a.audit(tx,user.userId,'LEGAL_SOURCE_MANUALLY_IMPORTED',doc.id);return {id:doc.id};
  });res.status(201).json(result);
 })().catch(next);});return r;
}
