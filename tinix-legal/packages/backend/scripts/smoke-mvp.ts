import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { loadConfig } from '../src/modules/operations/config.js';
import { createStorage } from '../src/modules/operations/storage.js';
import { createDependencies } from '../src/modules/operations/dependencies.js';
const config = loadConfig();
const children: ReturnType<typeof spawn>[] = [];
const database = new PrismaClient({datasources:{db:{url:config.databaseUrl}}});
const redis = new Redis(config.redisUrl, {lazyConnect:true,maxRetriesPerRequest:0,retryStrategy:()=>null});
redis.on('error',()=>{});
const storage = createStorage(config);
const prefix = `b1-smoke/${randomUUID()}`;
const key = `${prefix}/roundtrip.txt`;
let uploaded = false;
try {
  // Read-only DB check: B1 must not create schema, import laws or seed demo data.
  const tablesBefore = await database.$queryRaw<Array<{tablename:string}>>`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
  await redis.connect();
  const keysBefore = await redis.keys('bull:*');
  const body = Buffer.from('LIMI B1 private storage roundtrip');
  await storage.putObject(config.bucket, key, body); uploaded = true;
  const stream = await storage.getObject(config.bucket,key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  assert.deepEqual(Buffer.concat(chunks),body);
  const storageBase = `${config.minioSsl?'https':'http'}://${config.minioEndpoint}:${config.minioPort}`;
  const anonymous = await fetch(`${storageBase}/${config.bucket}/${key}`,{signal:AbortSignal.timeout(config.healthTimeoutMs)});
  assert.equal(anonymous.status,403,'Evidence must not allow anonymous downloads');
  await anonymous.body?.cancel();
  for (const [role,port] of [['api',config.port],['worker',config.workerPort],['scheduler',config.schedulerPort]] as const) {
    const child = spawn(process.execPath,[fileURLToPath(new URL(`../dist-mvp/mvp-${role}.js`,import.meta.url))],{stdio:['ignore','pipe','pipe'],windowsHide:true});
    children.push(child);
    const messages: string[] = [];
    child.stdout?.on('data', chunk=>messages.push(String(chunk)));
    child.stderr?.on('data', chunk=>messages.push(String(chunk)));
    const base = `http://${config.host}:${port}`;
    let ready = false;
    for (let attempt=0;attempt<30;attempt++) {
      if (child.exitCode !== null) throw new Error(`${role} exited before ready`);
      try {
        const response = await fetch(`${base}/health/ready`,{signal:AbortSignal.timeout(config.healthTimeoutMs+1000)});
        const payload = await response.json() as {role:string;checks:Record<string,string>};
        if (response.status===200) { assert.equal(payload.role,role); assert.deepEqual(payload.checks,{database:'up',redis:'up',storage:'up'}); ready=true; break; }
      } catch (error) { if (error instanceof assert.AssertionError) throw error; }
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    assert.equal(ready,true,`${role} did not become ready`);
    assert.equal((await fetch(`${base}/health/live`)).status,200);
    assert.equal((await fetch(`${base}/api/admin/crawl-jobs`)).status,404);
    assert.ok(messages.join('').includes('"businessJobsEnabled":false'));
  }
  assert.deepEqual(await database.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`,tablesBefore);
  assert.deepEqual((await redis.keys('bull:*')).sort(),keysBefore.sort());
  for (const dependency of ['database','redis','storage'] as const) {
    const wrongDatabase = new URL(config.databaseUrl); wrongDatabase.password=randomUUID();
    const broken = createDependencies({...config,
      ...(dependency==='database'?{databaseUrl:wrongDatabase.toString()}:{}),
      ...(dependency==='redis'?{redisUrl:'redis://127.0.0.1:1'}:{}),
      ...(dependency==='storage'?{minioSecretKey:randomUUID()}:{}),
    });
    try {
      const checks = await broken.check();
      assert.equal(checks[dependency],'down',`${dependency} must detect invalid connection or credentials`);
      for (const other of ['database','redis','storage'] as const) if (other!==dependency) assert.equal(checks[other],'up');
    } finally { await broken.close(); }
  }
  console.log(JSON.stringify({status:'passed',roles:3,database:'SELECT 1 and unchanged schema',redis:'no legacy BullMQ queues created',storage:'roundtrip and anonymous 403',negativeDependencyChecks:3}));
} catch { console.error('B1 smoke failed; check running dependencies, private bucket and available health ports.'); process.exitCode=1; }
finally {
  for (const child of children) {
    if (child.exitCode===null) {
      const exited=once(child,'exit'); child.kill('SIGTERM');
      await Promise.race([exited,new Promise(resolve=>setTimeout(resolve,5000))]);
      if (child.exitCode===null) child.kill('SIGKILL');
    }
  }
  if (uploaded) await storage.removeObject(config.bucket,key).catch(()=>{process.exitCode=1;});
  redis.disconnect(); await database.$disconnect();
}
