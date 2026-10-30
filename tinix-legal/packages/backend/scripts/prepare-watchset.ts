import {PrismaClient} from '@prisma/client';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadConfig} from '../src/modules/operations/config.js';
import {seedWatchset,observeWatch} from '../src/modules/changes/watch.js';
const config=loadConfig(),db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}});
try{await seedWatchset(db);const rows=await db.sourceWatch.findMany({where:{mode:'DISCOVERY'},orderBy:{url:'asc'}});for(const row of rows)await observeWatch(db,row.id);
const report={createdAt:new Date().toISOString(),watchCount:await db.sourceWatch.count(),domains:await db.crawlDomainState.findMany({select:{domain:true,lastSuccessAt:true,lastError:true,watermark:true}}),observations:await db.watchObservation.groupBy({by:['result'],_count:true}),pendingCandidates:await db.lawChangeCandidate.count({where:{status:'PENDING'}}),approvedEvents:await db.approvedLawChange.count(),laws:await db.canonicalDocument.count(),automaticLegalPublication:false};await writeFile(fileURLToPath(new URL('../../../../outputs/B14-live-watchset.json',import.meta.url)),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}finally{await db.$disconnect();}
