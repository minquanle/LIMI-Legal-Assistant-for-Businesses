import { createMvpApp } from '../../mvp-app.js';
import { loadConfig, type Role } from './config.js';
import { createDependencies } from './dependencies.js';
import {startComplianceWorker,refreshPeriodicEvaluations} from '../compliance/evaluation.js';
import {cleanupEvidence} from '../compliance/evidence.js';
import {generateReminders,dispatchAlerts} from '../alerts/service.js';
import {dispatchChanges} from '../changes/service.js';
import {runLawDiscovery} from '../changes/discovery.js';

export async function startRuntime(role: Role) {
  const config = loadConfig();
  const dependencies = createDependencies(config);
  const { app, drain } = createMvpApp(config, dependencies, role);
  let jobs:ReturnType<typeof startComplianceWorker>|undefined;
  let cleanup:NodeJS.Timeout|undefined;
  let background:NodeJS.Timeout|undefined,pending:Promise<void>|undefined;
  const asWorker=role==='worker'||role==='api'&&config.embedJobs,asScheduler=role==='scheduler'||role==='api'&&config.embedJobs;
  let lastSchedule=0;
  async function tick(){if(stopping||pending||!dependencies.database)return;pending=(async()=>{if(asWorker){await dispatchChanges(dependencies.database!);await dispatchAlerts(dependencies.database!);}if(asScheduler&&(role==='scheduler'||Date.now()-lastSchedule>=60000)){lastSchedule=Date.now();await refreshPeriodicEvaluations(dependencies.database!);await generateReminders(dependencies.database!);await runLawDiscovery(dependencies.database!).catch(()=>console.error(JSON.stringify({event:'law_discovery_failed'})));}})();try{await pending;}catch{console.error(JSON.stringify({event:'business_tick_failed',role}));}finally{pending=undefined;}}
  const port = role === 'api' ? config.port : role === 'worker' ? config.workerPort : config.schedulerPort;
  const server = app.listen(port, config.host);
  let stopping = false;
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    drain();
    const deadline = setTimeout(() => { console.error(JSON.stringify({ event: 'shutdown_timeout', role })); process.exit(1); }, 10000);
    server.closeIdleConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    if(cleanup)clearInterval(cleanup);
    if(background)clearInterval(background);
    await pending?.catch(()=>{});
    await jobs?.close();
    await dependencies.close();
    clearTimeout(deadline);
  };
  await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); }).catch(async error => {
    await dependencies.close(); throw error;
  });
  if(asWorker&&dependencies.database)jobs=startComplianceWorker(dependencies.database,config);
  if(asScheduler&&dependencies.database&&dependencies.storage)cleanup=setInterval(()=>void cleanupEvidence(dependencies.database!,dependencies.storage!,config.bucket).catch(()=>{}),3600000);
  if(asWorker||asScheduler){background=setInterval(()=>void tick(),asWorker?2000:60000);void tick();}
  console.log(JSON.stringify({ event: 'started', role, host: config.host, port,
    businessJobsEnabled: Boolean(jobs||cleanup) }));
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { void shutdown().catch(() => { process.exitCode = 1; }); });
  return { shutdown };
}
export function reportStartupFailure(error: unknown) {
  // Environment errors contain field names only, never connection strings or credentials.
  const message = error instanceof Error && /^(Invalid|Cannot read|MVP ports)/.test(error.message) ? error.message : 'MVP startup failed';
  console.error(JSON.stringify({ event: 'startup_failed', message }));
  process.exitCode = 1;
}
