import { Router, type Request, type Response, type NextFunction } from 'express';
import { ASTNodeType, DocumentType, LegalScope, ValidityStatus, type PrismaClient, type Prisma } from '@prisma/client';
import type { Client } from 'minio';
import { z } from 'zod';
import { publicProvenance } from './curated-record.mapper.js';
import { provisionText } from './record-adapter.js';
import { legalOpenApi } from './openapi.js';
const uuid=z.string().uuid(),page=z.coerce.number().int().min(1).max(10000).default(1),pageSize=z.coerce.number().int().min(1).max(100).default(20);
const paging=z.object({page,pageSize}).strict();
const lawQuery=z.object({page,pageSize,q:z.string().trim().min(1).max(200).optional(),group:z.string().regex(/^[a-z_]{1,40}$/).optional(),
  scope:z.nativeEnum(LegalScope).optional(),type:z.nativeEnum(DocumentType).optional(),validity:z.nativeEnum(ValidityStatus).optional()}).strict();
class HttpError extends Error {constructor(public status:number,public code:string){super(code);}}
const summarySelect={id:true,documentNumber:true,title:true,documentType:true,scope:true,groupCode:true,reviewStatus:true,selectedSnapshotId:true,
  importedIdentities:{select:{externalId:true,datasetKey:true}},selectedSnapshot:{select:{metadataJson:true,qualityJson:true,contentHash:true,createdAt:true}}} satisfies Prisma.CanonicalDocumentSelect;
type Summary=Prisma.CanonicalDocumentGetPayload<{select:typeof summarySelect}>;
const dto=(row:Summary)=>({id:row.id,externalIds:row.importedIdentities,documentNumber:row.documentNumber,title:row.title,type:row.documentType,scope:row.scope,group:row.groupCode,
  reviewStatus:row.reviewStatus,snapshotId:row.selectedSnapshotId,metadata:publicProvenance(row.selectedSnapshot?.metadataJson??{}),
  quality:publicProvenance(row.selectedSnapshot?.qualityJson??{}),contentHash:row.selectedSnapshot?.contentHash??null});
const asyncRoute=(fn:(req:Request,res:Response)=>Promise<void>)=>(req:Request,res:Response,next:NextFunction)=>{void fn(req,res).catch(next);};
export function createLegalRouter(db:PrismaClient,storage:Client) {
  const router=Router();
  router.get('/openapi.json',(_req,res)=>{res.json(legalOpenApi);});
  async function document(id:string) {
    const value=await db.canonicalDocument.findFirst({where:{OR:[{id}, {importedIdentities:{some:{externalId:id,datasetKey:'limi-curated-20261009'}}}],selectedSnapshotId:{not:null}},select:summarySelect});
    if(!value)throw new HttpError(404,'LAW_NOT_FOUND');return value;
  }
  async function snapshot(id:string,requested?:string){const doc=await document(id),snapshotId=requested??doc.selectedSnapshotId!;
    const value=await db.documentSnapshot.findFirst({where:{id:snapshotId,documentId:doc.id}});if(!value)throw new HttpError(404,'SNAPSHOT_NOT_FOUND');return {doc,snapshot:value};}
  const list=asyncRoute(async(req,res)=>{const q=lawQuery.parse(req.query),where:Prisma.CanonicalDocumentWhereInput={selectedSnapshotId:{not:null},
    ...(q.group?{groupCode:q.group}:{}),...(q.scope?{scope:q.scope}:{}),...(q.type?{documentType:q.type}:{}),...(q.validity?{validityStatus:q.validity}:{}),
    ...(q.q?{OR:[{documentNumber:{contains:q.q,mode:'insensitive'}},{normalizedNumber:{contains:q.q,mode:'insensitive'}},{title:{contains:q.q,mode:'insensitive'}}]}:{})};
    const [total,rows]=await db.$transaction([db.canonicalDocument.count({where}),db.canonicalDocument.findMany({where,select:summarySelect,orderBy:[{documentNumber:'asc'},{id:'asc'}],skip:(q.page-1)*q.pageSize,take:q.pageSize})]);
    res.json({items:rows.map(dto),total,page:q.page,pageSize:q.pageSize});});
  router.get('/laws',list);router.get('/laws/search',list);router.get('/search',list);
  router.get('/laws/:id',asyncRoute(async(req,res)=>{const q=z.object({snapshotId:uuid.optional()}).strict().parse(req.query),{doc,snapshot:s}=await snapshot(req.params.id as string,q.snapshotId);
    const sources=await db.snapshotSource.findMany({where:{snapshotId:s.id},select:{id:true,role:true,provenanceJson:true,source:{select:{id:true,url:true,domain:true,sourceKind:true,site:true}}}});
    const relations=await db.documentRelation.findMany({where:{sourceSnapshotId:s.id},select:{id:true,targetDocNumber:true,relationType:true,resolveStatus:true,reviewStatus:true}});
    res.json({...dto(doc),snapshotId:s.id,metadata:publicProvenance(s.metadataJson),quality:publicProvenance(s.qualityJson),contentHash:s.contentHash,
      sources:sources.map(source=>({...source,provenanceJson:publicProvenance(source.provenanceJson)})),relations});}));
  router.get('/laws/:id/snapshots',asyncRoute(async(req,res)=>{const q=paging.parse(req.query),doc=await document(req.params.id as string),where={documentId:doc.id};
    const [total,items]=await db.$transaction([db.documentSnapshot.count({where}),db.documentSnapshot.findMany({where,select:{id:true,contentHash:true,metadataHash:true,metadataJson:true,qualityJson:true,reason:true,createdAt:true},orderBy:[{createdAt:'desc'},{id:'asc'}],skip:(q.page-1)*q.pageSize,take:q.pageSize})]);res.json({items:items.map(publicProvenance),total,page:q.page,pageSize:q.pageSize});}));
  router.get('/laws/:id/content',asyncRoute(async(req,res)=>{const q=z.object({snapshotId:uuid.optional()}).strict().parse(req.query),{doc,snapshot:s}=await snapshot(req.params.id as string,q.snapshotId);
    res.json({documentId:doc.id,snapshotId:s.id,contentHash:s.contentHash,offsetUnit:'UNICODE_CODE_POINT',fullText:s.fullText,quality:publicProvenance(s.qualityJson)});}));
  async function parseFor(snapshotId:string,requested?:string) {
    const run=await db.parseRun.findFirst({where:{snapshotId,sealedAt:{not:null},...(requested?{id:requested}:{})},orderBy:[{createdAt:'desc'},{id:'asc'}],select:{id:true,parserVersion:true,structureHash:true,offsetUnit:true}});
    if(!run)throw new HttpError(404,'PARSE_NOT_FOUND');return run;
  }
  const provisionQuery=z.object({page,pageSize,snapshotId:uuid.optional(),parseRunId:uuid.optional(),parentId:uuid.optional(),roots:z.enum(['true','false']).optional(),nodeType:z.nativeEnum(ASTNodeType).optional()}).strict();
  router.get('/laws/:id/provisions',asyncRoute(async(req,res)=>{const q=provisionQuery.parse(req.query),{doc,snapshot:s}=await snapshot(req.params.id as string,q.snapshotId),run=await parseFor(s.id,q.parseRunId);
    if(q.parentId&&!await db.parsedProvision.findFirst({where:{id:q.parentId,parseRunId:run.id},select:{id:true}}))throw new HttpError(404,'PARENT_NOT_FOUND');
    const where={parseRunId:run.id,...(q.parentId?{parentId:q.parentId}:q.roots==='true'?{parentId:null}:{}),...(q.nodeType?{nodeType:q.nodeType}:{})};
    const [total,items]=await db.$transaction([db.parsedProvision.count({where}),db.parsedProvision.findMany({where,orderBy:{orderIndex:'asc'},skip:(q.page-1)*q.pageSize,take:q.pageSize})]);
    res.json({documentId:doc.id,snapshotId:s.id,parseRun:run,items:items.map(n=>({...n,contextJson:publicProvenance(n.contextJson),citation:`/api/v1/laws/${doc.id}/provisions/${n.id}?snapshotId=${s.id}&parseRunId=${run.id}`})),total,page:q.page,pageSize:q.pageSize});}));
  router.get('/laws/:id/provisions/:provisionId',asyncRoute(async(req,res)=>{const q=z.object({snapshotId:uuid,parseRunId:uuid}).strict().parse(req.query),{doc,snapshot:s}=await snapshot(req.params.id as string,q.snapshotId);
    const run=await parseFor(s.id,q.parseRunId),id=uuid.parse(req.params.provisionId),node=await db.parsedProvision.findFirst({where:{id,parseRunId:run.id}});
    if(!node)throw new HttpError(404,'PROVISION_NOT_FOUND');res.json({documentId:doc.id,snapshotId:s.id,parseRun:run,...node,contextJson:publicProvenance(node.contextJson),text:provisionText(s.fullText,node.spanStart,node.spanEnd)});}));
  router.get('/laws/:id/attachments',asyncRoute(async(req,res)=>{const q=z.object({page,pageSize,snapshotId:uuid.optional()}).strict().parse(req.query),{snapshot:s}=await snapshot(req.params.id as string,q.snapshotId);
    const where={snapshotId:s.id,role:{not:'RAW_RECORD' as const}};
    const [total,rows]=await db.$transaction([db.snapshotAsset.count({where}),db.snapshotAsset.findMany({where,include:{asset:true},orderBy:{id:'asc'},skip:(q.page-1)*q.pageSize,take:q.pageSize})]);
    res.json({items:rows.map(a=>({id:a.id,role:a.role,provenance:publicProvenance(a.provenanceJson),checksum:a.asset.checksum,sizeBytes:a.asset.sizeBytes.toString(),mimeType:a.asset.mimeType,status:a.asset.status,hasExtractedText:a.extractedText!==null,
      downloadUrl:`/api/v1/laws/${req.params.id}/attachments/${a.id}/download?snapshotId=${s.id}`,textUrl:a.extractedText===null?null:`/api/v1/laws/${req.params.id}/attachments/${a.id}/text?snapshotId=${s.id}`})),total,page:q.page,pageSize:q.pageSize});}));
  async function attachment(req:Request){const q=z.object({snapshotId:uuid}).strict().parse(req.query),{snapshot:s}=await snapshot(req.params.id as string,q.snapshotId),id=uuid.parse(req.params.attachmentId);
    const link=await db.snapshotAsset.findFirst({where:{id,snapshotId:s.id,role:{not:'RAW_RECORD'}},include:{asset:true}});if(!link)throw new HttpError(404,'ATTACHMENT_NOT_FOUND');return link;}
  router.get('/laws/:id/attachments/:attachmentId/text',asyncRoute(async(req,res)=>{const a=await attachment(req);if(a.extractedText===null)throw new HttpError(404,'TEXT_NOT_AVAILABLE');res.json({id:a.id,text:a.extractedText,textHash:a.extractedTextHash});}));
  router.get('/laws/:id/attachments/:attachmentId/download',asyncRoute(async(req,res)=>{const a=await attachment(req);if(a.asset.status!=='AVAILABLE')throw new HttpError(503,'ASSET_NOT_AVAILABLE');
    const stream=await storage.getObject(a.asset.bucket,a.asset.objectKey),p=a.provenanceJson as {filename?:string};
    res.setHeader('Content-Type',a.asset.mimeType);res.setHeader('Content-Length',a.asset.sizeBytes.toString());
    res.setHeader('Content-Disposition',`attachment; filename="legal-document"; filename*=UTF-8''${encodeURIComponent(p.filename??'legal-document')}`);
    stream.on('error',()=>res.destroy());res.on('close',()=>{if(!res.writableEnded)stream.destroy();});stream.pipe(res);}));
  router.use((error:unknown,_req:Request,res:Response,next:NextFunction)=>{if(error instanceof z.ZodError){res.status(400).json({error:'INVALID_REQUEST'});return;}
    if(error instanceof HttpError){res.status(error.status).json({error:error.code});return;}next(error);});
  return router;
}
