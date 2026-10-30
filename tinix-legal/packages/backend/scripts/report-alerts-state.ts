import {PrismaClient} from '@prisma/client';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadConfig} from '../src/modules/operations/config.js';
const config=loadConfig(),db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}});
try{
 const runtime=[];for(const port of [config.port,config.workerPort,config.schedulerPort]){const r=await fetch(`http://127.0.0.1:${port}/health/ready`,{signal:AbortSignal.timeout(5000)});runtime.push({port,httpStatus:r.status,...await r.json() as object});}
 const web=await fetch('http://127.0.0.1:3000/workspace?view=alerts'),anonymous=await fetch(`http://127.0.0.1:${config.port}/api/v1/admin/changes`);
 const state={createdAt:new Date().toISOString(),runtime,webStatus:web.status,anonymousAdminStatus:anonymous.status,laws:await db.canonicalDocument.count(),snapshots:await db.documentSnapshot.count(),sealedParses:await db.parseRun.count({where:{sealedAt:{not:null}}}),provisions:await db.parsedProvision.count(),publishedObligations:await db.obligationVersion.count({where:{status:'PUBLISHED'}}),publishedReleases:await db.catalogueRelease.count({where:{sealedAt:{not:null}}}),watchset:await db.sourceWatch.groupBy({by:['domain','mode'],_count:true}),domains:await db.crawlDomainState.findMany({select:{domain:true,lastSuccessAt:true,lastError:true,watermark:true}}),observations:await db.watchObservation.groupBy({by:['result'],_count:true}),changeCandidates:await db.lawChangeCandidate.groupBy({by:['kind','status'],_count:true}),approvedEvents:await db.approvedLawChange.count(),alerts:await db.workspaceAlert.count(),undeliveredAlerts:await db.alertOutbox.count({where:{deliveredAt:null}}),pendingImpacts:await db.changeCompanyImpact.count({where:{completedAt:null}}),humanApprovalPending:true,automaticPublication:false};
 const passed=runtime.every(r=>r.httpStatus===200)&&web.status===200&&anonymous.status===401&&state.laws===110&&state.snapshots===110&&state.sealedParses===110&&state.provisions===39487;
 const report={status:passed?'passed':'failed',...state};await writeFile(fileURLToPath(new URL('../../../../outputs/B13-B15-product-state.json',import.meta.url)),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!passed)process.exitCode=1;
 }finally{await db.$disconnect();}
