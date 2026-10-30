import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {setDefaultCACertificates,getCACertificates} from 'node:tls';
import {cpus,totalmem} from 'node:os';
const base=process.env.LIMI_VERIFY_URL??'http://127.0.0.1:3000';
if(process.env.LIMI_CA_FILE)setDefaultCACertificates([...getCACertificates('default'),await readFile(process.env.LIMI_CA_FILE,'utf8')]);
for(let attempt=0;attempt<25;attempt++){
 try{const r=await fetch(base+'/workspace?view=account',{signal:AbortSignal.timeout(2000)});await r.arrayBuffer();if(r.status===200)break;}catch{}
 await new Promise(resolve=>setTimeout(resolve,200));
}
const startedAt=new Date().toISOString(),checks=[];
for(const [path,status] of [['/workspace?view=account',200],['/api/workspace/admin/changes',401],['/api/workspace/auth/me',401],['/api/workspace/admin/not-allowed',404]]){
 const r=await fetch(base+path);assert.equal(r.status,status,path);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal(r.headers.get('x-frame-options'),'DENY');checks.push({path,status:r.status});
}
const samples=[],errors=[];let cursor=0;
const paths=['/api/legal/laws?pageSize=20','/api/legal/laws/LIMI-SEED-041/content','/workspace?view=laws'];
const begin=performance.now();
await Promise.all(Array.from({length:10},async()=>{for(let i=0;i<20;i++){
 const path=paths[cursor++%paths.length],t=performance.now();try{const r=await fetch(base+path,{signal:AbortSignal.timeout(15000)});await r.arrayBuffer();if(r.status!==200)errors.push({path,status:r.status});else samples.push(performance.now()-t);}catch{errors.push({path,status:0});}
}}));
samples.sort((a,b)=>a-b);const percentile=p=>Number((samples[Math.min(samples.length-1,Math.floor(samples.length*p))]??0).toFixed(2));
const report={status:errors.length?'failed':'passed',startedAt,url:base,machine:{cpu:cpus()[0]?.model,logicalCpus:cpus().length,ramGiB:Number((totalmem()/1024**3).toFixed(1)),node:process.version},checks,benchmark:{scope:'Local read-only web/library; does not measure authenticated evaluations or production capacity',concurrency:10,requests:200,success:samples.length,errors,durationSeconds:Number(((performance.now()-begin)/1000).toFixed(2)),p50Ms:percentile(.5),p95Ms:percentile(.95),p99Ms:percentile(.99)},productionSloConfirmed:false};
await writeFile(new URL(base.startsWith('https:')?'../../outputs/B16-staging-verification.json':'../../outputs/B16-local-verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(errors.length)process.exitCode=1;
