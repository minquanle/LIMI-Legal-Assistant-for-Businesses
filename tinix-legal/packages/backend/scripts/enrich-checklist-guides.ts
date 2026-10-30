import {PrismaClient} from '@prisma/client';
import {mkdir,writeFile} from 'node:fs/promises';
import {loadConfig} from '../src/modules/operations/config.js';
import {draftSchema,json} from '../src/modules/compliance/contracts.js';
// Reuse the same editorial adapter rendered by the product. It adds presentation
// fields from existing text, never invents per-step source links or legal deadlines.
// @ts-ignore Static prototype JavaScript has no declaration file.
import {checklistGuide} from '../../../../Prototype/dist/checklist-guide.js';
const db=new PrismaClient({datasources:{db:{url:loadConfig().databaseUrl}}}),out=process.argv[2];
try{
 const rows=await db.checklistImportEntry.findMany({where:{version:{status:'DRAFT'}},include:{version:{include:{citations:true}}}});let updated=0;
 for(const row of rows){const v=row.version!,content=v.contentJson as any;if(content.guide)continue;
  content.guide=checklistGuide(content);const input=draftSchema.parse({content,citations:v.citations.map(({documentId,snapshotId,parseRunId,provisionId,ocrVerified})=>({documentId,snapshotId,parseRunId,provisionId,ocrVerified}))});
  await db.$transaction(async tx=>{const result=await tx.obligationVersion.updateMany({where:{id:v.id,status:'DRAFT',revision:v.revision},data:{contentJson:json(input.content),revision:{increment:1}}});if(result.count!==1)throw Error('DRAFT_CHANGED');await tx.workspaceAudit.create({data:{actorId:'local-checklist-operator',action:'CHECKLIST_PRESENTATION_ENRICHED',targetId:v.id}});});updated++;
 }
 const all=await db.checklistImportEntry.findMany({where:{versionId:{not:null}},include:{version:{include:{citations:true}}}});
 await mkdir(out,{recursive:true});await writeFile(out+'/draft-obligations.jsonl',all.map(r=>JSON.stringify({content:r.version!.contentJson,citations:r.version!.citations.map(({documentId,snapshotId,parseRunId,provisionId,ocrVerified})=>({documentId,snapshotId,parseRunId,provisionId,ocrVerified}))})).join('\n')+'\n');
 const report={updated,total:all.length,guideReady:all.filter(r=>(r.version!.contentJson as any).guide).length,status:'DRAFT',legalTextUnchanged:true,stepCitationsAutomaticallyInvented:0,officialPublicationPerformed:false};await writeFile(out+'/enrichment-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await db.$disconnect();}
