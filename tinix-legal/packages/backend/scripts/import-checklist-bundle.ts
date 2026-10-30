import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {PrismaClient} from '@prisma/client';
import {loadConfig} from '../src/modules/operations/config.js';
import {draftSchema,json} from '../src/modules/compliance/contracts.js';
import {makeDraft} from '../src/modules/compliance/catalogue.js';
import {canonicalJson,sha256,provisionText} from '../src/modules/legal/record-adapter.js';
const folder=resolve(process.argv[2]||''),authorEmail=process.argv[3],reportPath=process.argv[4];
if(!authorEmail||!reportPath)throw Error('Usage: import-checklist-bundle.ts <folder> <reviewer email> <report>');
const readLines=async(name:string)=>(await readFile(join(folder,name),'utf8')).split(/\r?\n/).filter(x=>x.trim()).map(x=>JSON.parse(x));
const [drafts,notes,blocked]=await Promise.all(['draft-obligations.jsonl','review-notes.jsonl','blocked-obligations.jsonl'].map(readLines));
if(!drafts.length||notes.length!==drafts.length)throw Error('Invalid bundle');
const batchKey=process.argv[5]||'corrected-20261012';
if(!/^[a-z0-9-]{5,80}$/.test(batchKey))throw Error('Invalid batch key');
const db=new PrismaClient({datasources:{db:{url:loadConfig().databaseUrl}}});
try{
 const author=await db.workspaceUser.findUnique({where:{email:authorEmail}});if(!author?.platformReviewer)throw Error('Existing reviewer required');
 const result=await db.$transaction(async tx=>{
  const imported=[];for(let i=0;i<drafts.length;i++){
   const input=draftSchema.parse(drafts[i]);if(input.content.scope!=='COMPANY'||notes[i].title!==input.content.title)throw Error('Unsupported scope or mismatched note');
   const key=batchKey+'-draft-'+(i+1),payloadHash=sha256(canonicalJson({input,notes:notes[i]})),old=await tx.checklistImportEntry.findUnique({where:{key}});
   if(old){if(old.payloadHash!==payloadHash)throw Error('Bundle changed; create a new reviewed batch');imported.push({key,versionId:old.versionId,created:false});continue;}
   const version=await makeDraft(tx,author.id,input,undefined,key);
   await tx.checklistImportEntry.create({data:{key,batchKey,payloadHash,versionId:version.id,previewEnabled:true,notesJson:json(notes[i])}});
   await tx.workspaceAudit.create({data:{actorId:author.id,action:'CHECKLIST_BUNDLE_DRAFT_IMPORTED',targetId:version.id}});
   imported.push({key,versionId:version.id,created:true});
  }
  for(let i=0;i<blocked.length;i++){
   const b=blocked[i];if(!b.title||!b.reason||!Array.isArray(b.sourceReferences))throw Error('Invalid blocked item');
   const references=[];
   for(const ref of b.sourceReferences){const node=await tx.parsedProvision.findUnique({where:{id:ref.provisionId},include:{parseRun:{include:{snapshot:true}}}});if(!node)throw Error('Blocked reference missing');references.push({...ref,documentId:node.parseRun.snapshot.documentId,snapshotId:node.parseRun.snapshotId,parseRunId:node.parseRunId,quote:provisionText(node.parseRun.snapshot.fullText,node.spanStart,node.spanEnd)});}
   const key=batchKey+'-blocked-'+(i+1),payloadHash=sha256(canonicalJson(b)),old=await tx.checklistImportEntry.findUnique({where:{key}});
   if(old&&old.payloadHash!==payloadHash)throw Error('Blocked bundle changed');
   const enriched=json({...b,sourceReferences:references});
   if(!old)await tx.checklistImportEntry.create({data:{key,batchKey,payloadHash,notesJson:{},blockedJson:enriched}});
   else if((old.blockedJson as any)?.sourceReferences?.some((ref:any)=>!ref.documentId))await tx.checklistImportEntry.update({where:{id:old.id},data:{blockedJson:enriched}});
  }
  return {batchKey,drafts:imported,blocked:blocked.length,officialPublicationPerformed:false};
 },{timeout:60000});
 await writeFile(reportPath,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await db.$disconnect();}
