import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {PrismaClient} from '@prisma/client';
import {loadConfig} from '../src/modules/operations/config.js';
import {previewChecklist} from '../src/modules/compliance/pilot.js';
const config=loadConfig();if(new URL(config.databaseUrl).pathname!=='/limi_dev')throw Error('Local development only');
const db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}});
try{
 const entries=await db.checklistImportEntry.findMany({where:{batchKey:{in:['corrected-20261012','expanded-20261012-v1','plus50-20261013-v1','remaining-20261013-v1']}},include:{version:{include:{citations:true}}}});
 const expected=188;
 assert.equal(entries.filter(x=>x.version).length,expected);assert.equal(entries.filter(x=>x.blockedJson).length,19);
 for(const e of entries.filter(x=>x.version)){assert.equal(e.version!.status,'DRAFT');assert.ok(e.version!.citations.every(c=>c.quote.length>20));}
 assert.ok(entries.filter(x=>x.blockedJson).every(e=>(e.blockedJson as any).sourceReferences.every((ref:any)=>ref.documentId&&ref.snapshotId&&ref.parseRunId&&ref.quote)));
 const companies=await db.workspaceCompany.findMany({select:{id:true}}),previews=[];
 for(const c of companies){const p=await previewChecklist(db,c.id);assert.equal(p.items.length,expected);previews.push({companyId:c.id,profileVersion:p.profileVersion,items:p.items.map(x=>({title:x.content.title,decision:x.decision,missingFacts:x.missingFacts})),blockedCount:p.blockedCount});}
 const report={status:'passed',readOnly:true,importedDrafts:expected,historicalBlocked:19,officialReleases:await db.catalogueRelease.count({where:{sealedAt:{not:null}}}),previews};
 await writeFile(process.argv[2],JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await db.$disconnect();}
