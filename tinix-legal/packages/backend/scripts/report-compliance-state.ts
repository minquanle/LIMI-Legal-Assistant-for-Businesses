import {PrismaClient} from '@prisma/client';
import {loadConfig} from '../src/modules/operations/config.js';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const config=loadConfig(),db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}});
try{
 const [documents,snapshots,parseRuns,provisions,candidates,groups,versions,releases,reviewer]=await Promise.all([
 db.canonicalDocument.count({where:{selectedSnapshotId:{not:null}}}),db.documentSnapshot.count(),db.parseRun.count({where:{sealedAt:{not:null}}}),db.parsedProvision.count(),db.legalCandidate.count(),db.legalCandidate.groupBy({by:['groupCode'],_count:true}),db.obligationVersion.groupBy({by:['status'],_count:true}),db.catalogueRelease.count({where:{sealedAt:{not:null}}}),db.workspaceUser.findUnique({where:{email:'lmquan39205@gmail.com'},select:{platformReviewer:true}})]);
 const health=await Promise.all([4010,4011,4012].map(async port=>{const r=await fetch(`http://127.0.0.1:${port}/health/ready`,{signal:AbortSignal.timeout(5000)});return {port,status:r.status,...await r.json() as any};}));
 const web=await fetch('http://127.0.0.1:3000/workspace'),html=await web.text(),gateway=await fetch('http://127.0.0.1:3000/api/workspace/admin/candidates'),module=await fetch('http://127.0.0.1:3000/prototype/compliance-workspace.js?v=1');
 const report={date:'2026-10-12',status:health.every(h=>h.status==='ready')&&web.ok&&gateway.status===401&&module.ok?'passed':'failed',documents,snapshots,parseRuns,provisions,candidates,candidateGroups:groups,obligationVersions:versions,publishedCatalogueReleases:releases,reviewerGranted:Boolean(reviewer?.platformReviewer),humanLegalApprovalPending:releases===0,health,web:{status:web.status,sharedPrototype:html.includes('LIMI_WORKSPACE_API')&&html.includes('compliance-workspace.css'),anonymousAdminStatus:gateway.status,moduleStatus:module.status}};
 await writeFile(fileURLToPath(new URL('../../../../outputs/B8-B12-product-state.json',import.meta.url)),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;
}finally{await db.$disconnect();}
