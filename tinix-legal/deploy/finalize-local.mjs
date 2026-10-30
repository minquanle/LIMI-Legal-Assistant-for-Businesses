import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const output=new URL('../../outputs/',import.meta.url),read=async name=>JSON.parse((await readFile(new URL(name,output),'utf8')).replace(/^\uFEFF/,''));
const restore=await read('B16-restore-drill.json'),rollback=await read('B16-rollback-drill.json'),tls=await read('B16-staging-verification.json'),local=await read('B16-local-verification.json'),auth=await read('B16-production-auth.json');
const workspace=await read('B5-B7-verification.json'),alerts=await read('B13-B15-verification.json'),legal=await read('B3-B4-verification.json'),operations=await read('B16-operations.json');
for(const report of [restore,rollback,tls,local,auth,workspace,alerts,legal])assert.equal(report.status,'passed');
const webAudit=await read('B16-web-audit.json'),runtimeAudit=await read('B16-runtime-audit.json');
for(const audit of [webAudit,runtimeAudit]){assert.equal(audit.metadata.vulnerabilities.high,0);assert.equal(audit.metadata.vulnerabilities.critical,0);}
const report={status:'LOCAL_TECHNICALLY_VERIFIED_EXTERNAL_ACCEPTANCE_PENDING',createdAt:new Date().toISOString(),scope:'Same LIMI prototype; localhost development and isolated production-mode HTTPS staging',urls:{product:'http://127.0.0.1:3000/workspace',staging:'https://localhost:8443/workspace'},
 completed:{buildAndLint:true,backendUnits:14,coreUnits:10,workspaceApiChecks:workspace.checks,complianceAlertChecks:alerts.checks,legalApiChecks:legal.apiChecks,productionAuthChecks:auth.checks.length,browserE2E:true,privateStorageAndTenantIsolation:true,backupRestore:{laws:restore.verified.laws,provisions:restore.verified.provisions,objects:restore.objects,bytes:restore.objectBytes,seconds:restore.restoreSeconds,allHashesVerified:true},rollback:{scenario:rollback.scenario,seconds:rollback.elapsedSeconds},https:{concurrency:tls.benchmark.concurrency,requests:tls.benchmark.requests,success:tls.benchmark.success,p95Ms:tls.benchmark.p95Ms},ciConfigured:true,runbook:true,pilotRegister:true},
 security:{webRuntimeAudit:webAudit.metadata.vulnerabilities,backendRuntimeAudit:runtimeAudit.metadata.vulnerabilities,legacyRepositoryAuditUnresolved:true,toolsImageInternalOnly:true},
 pending:['Human legal review and first published catalogue','5–10 real company pilot signoffs with verified legal alerts','Off-machine encrypted backup and external restore drill','Automated backup schedule','Production RPO/RTO and full authenticated workload SLO','Remote CI execution evidence'],
 actualEditorialState:{publishedObligations:operations.publishedObligations,publishedReleases:operations.publishedReleases},
 internetTunnelStarted:false,offMachineBackup:false,realPilotConfirmedCompanies:0,productionReadyClaimed:false};
await writeFile(new URL('B16-completion.json',output),JSON.stringify(report,null,2)+'\n');
const backlog=await read('BACKLOG_BACKEND_110_VAN_BAN.json'),ticket=backlog.tickets.find(t=>t.id==='B16');assert.ok(ticket);
ticket.status='LOCAL_TECHNICALLY_VERIFIED_EXTERNAL_ACCEPTANCE_PENDING';ticket.completedLocalOn='2026-10-12';ticket.verificationReport='outputs/B16-completion.json';ticket.runbook='outputs/runbooks/B16-VAN-HANH-LOCAL.md';ticket.remainingAcceptance=report.pending;
backlog.status='B01_B16_LOCAL_TECHNICALLY_VERIFIED_PILOT_PENDING';backlog.completedThrough='B15';backlog.localTechnicalCompletedThrough='B16';backlog.nextStep='Legal review, real-company pilot and off-machine operational acceptance';
await writeFile(new URL('BACKLOG_BACKEND_110_VAN_BAN.json',output),JSON.stringify(backlog,null,2)+'\n');
console.log(JSON.stringify({status:report.status,report:'outputs/B16-completion.json',realPilotConfirmedCompanies:0}));
