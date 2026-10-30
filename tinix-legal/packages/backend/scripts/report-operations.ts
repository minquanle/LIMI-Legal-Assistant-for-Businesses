import {PrismaClient} from '@prisma/client';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadConfig} from '../src/modules/operations/config.js';
import {createDependencies} from '../src/modules/operations/dependencies.js';
const config=loadConfig(),dependencies=createDependencies(config),db=dependencies.database!,root=new URL('../../../../outputs/',import.meta.url);
try{
 const now=new Date(),backup=await readFile(new URL('B16-backup.json',root),'utf8').then(JSON.parse).catch(()=>null);
 const report={createdAt:now.toISOString(),dependencies:await dependencies.check(),release:process.env.LIMI_RELEASE??'local-development',
  oldestUndeliveredAlert:await db.alertOutbox.findFirst({where:{deliveredAt:null},orderBy:{createdAt:'asc'},select:{createdAt:true}}),
  undeliveredAlerts:await db.alertOutbox.count({where:{deliveredAt:null}}),
  pendingImpacts:await db.changeCompanyImpact.count({where:{completedAt:null}}),
  crawlFailures:await db.crawlDomainState.findMany({where:{lastError:{not:null}},select:{domain:true,lastSuccessAt:true,lastError:true}}),
  pendingEditorialReview:await db.lawChangeCandidate.count({where:{status:'PENDING'}}),
  publishedObligations:await db.obligationVersion.count({where:{status:'PUBLISHED'}}),
  publishedReleases:await db.catalogueRelease.count({where:{sealedAt:{not:null}}}),
  backup:backup?{completedAt:backup.completedAt,ageHours:(now.getTime()-Date.parse(backup.completedAt))/3600000,offMachine:backup.offMachine}:null,
  pilotReadiness:'HUMAN_REVIEW_AND_REAL_COMPANY_ACCEPTANCE_REQUIRED'};
 await writeFile(new URL('B16-operations.json',root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await dependencies.close();}
