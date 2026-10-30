import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { PrismaClient } from '@prisma/client';
import type { Client } from 'minio';
import { loadConfig } from '../src/modules/operations/config.js';
import { createStorage } from '../src/modules/operations/storage.js';
import { importCurated } from '../src/modules/legal/curated-importer.js';
import { sha256 } from '../src/modules/legal/record-adapter.js';
const config=loadConfig(),url=new URL(config.databaseUrl);if(!['localhost','127.0.0.1'].includes(url.hostname)||url.port!=='5433'||url.pathname!=='/limi_dev')throw new Error('LOCAL_DEV_REQUIRED');
const name=`limi_b3_test_${randomUUID().replaceAll('-','').slice(0,12)}`,temporary=await mkdtemp(join(tmpdir(),'limi-b3-'));
const admin=new PrismaClient({datasources:{db:{url:config.databaseUrl}}});const testUrl=new URL(config.databaseUrl);testUrl.pathname=`/${name}`;
const db=new PrismaClient({datasources:{db:{url:testUrl.toString()}}}),storage=createStorage(config);let created=false;
try {
  await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);created=true;
  await new Promise<void>((resolve,reject)=>{const child=spawn(process.execPath,[fileURLToPath(new URL('../../../node_modules/prisma/build/index.js',import.meta.url)),'migrate','deploy','--schema',fileURLToPath(new URL('../prisma/schema.prisma',import.meta.url))],{env:{...process.env,DATABASE_URL:testUrl.toString()},windowsHide:true,stdio:'ignore'});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error('TEST_MIGRATION_FAILED')));});
  const text=`😀 Điều 1 ${name}`,formText=`Biểu mẫu ${name}`,formFile=join(temporary,'fixture.doc');await writeFile(formFile,formText);
  const record={id:name,documentNumber:'fixture-1',normalizedNumber:'fixture-1',documentType:'LUAT',title:'Test only',issuingBody:null,signer:null,validityStatus:'KHONG_XAC_DINH',effectiveDate:null,
    fullText:text,fullTextSha256:sha256(text),scope:'VIET_NAM',group:'tax',parserVersion:'fixture-1',legalReview:'PENDING',readyForAutomaticChecklist:false,
    parseQuality:{requiresOcrTextReview:true},structuredContent:{offsetUnit:'UNICODE_CODE_POINT',sections:[],appendices:[],articles:[{id:'article-1',nodeType:'DIEU',ordinal:'1',span:{start:0,end:Array.from(text).length}}]},
    url:`https://vbpl.vn/Pages/x.aspx?ItemID=${name}`,originalFiles:[],contentSources:[],sourceParts:[],relationships:[],
    formAttachments:[{filename:'fixture.doc',localPath:formFile,sha256:sha256(formText),text:formText,url:'https://vbpl.vn/form'}]};
  const path=join(temporary,'records.jsonl'),options={input:path,dataset:name,dataRoot:temporary,bucket:config.bucket,report:join(temporary,'report.json')};
  await writeFile(path,[JSON.stringify(record),'INVALID JSON',JSON.stringify({...record,id:`${name}-2`,url:record.url+'-2'})].join('\n')+'\n');
  const dry=await importCurated({...options,dryRun:true},db,storage);assert.equal(dry.counters.VALID,2);assert.equal(dry.errors[0].index,1);assert.equal(await db.canonicalDocument.count(),0);
  const partial=await importCurated({...options,limit:1},db,storage);assert.equal(partial.checkpoint,0);assert.equal(partial.status,'PARTIAL');
  // A process killed after a committed record leaves RUNNING; resume must handle it.
  await db.importRun.update({where:{id:partial.runId},data:{status:'RUNNING'}});
  const resumed=await importCurated({...options,resume:partial.runId},db,storage);assert.equal(resumed.checkpoint,2);assert.equal(resumed.counters.INSERTED,2);assert.equal(resumed.counters.REJECTED,1);
  assert.equal(await db.importRecordResult.count({where:{runId:partial.runId}}),3);assert.equal(await db.documentSnapshot.count(),2);
  const mismatch=join(temporary,'mismatch.jsonl');await writeFile(mismatch,JSON.stringify(record));await assert.rejects(()=>importCurated({...options,input:mismatch,resume:partial.runId},db,storage),/RESUME_INPUT_MISMATCH/);
  const versioned={...record,title:'Corrected metadata',parserVersion:'fixture-2'};
  await writeFile(mismatch,JSON.stringify(versioned));const changed=await importCurated({...options,input:mismatch},db,storage);assert.equal(changed.counters.NEW_VERSION,1);
  const snapshot=await db.documentSnapshot.findFirstOrThrow({where:{reason:'METADATA_CORRECTION'}});assert.equal((snapshot.metadataJson as any).signer,null);
  await writeFile(mismatch,JSON.stringify({...versioned,parserVersion:'fixture-3'}));const parsed=await importCurated({...options,input:mismatch},db,storage);assert.equal(parsed.counters.NEW_PARSE,1);assert.equal(await db.documentSnapshot.count(),3);
  const gz=join(temporary,'batch.json.gz');await writeFile(gz,gzipSync(JSON.stringify([{...versioned,parserVersion:'fixture-3'}])));
  assert.equal((await importCurated({...options,input:gz},db,storage)).counters.UNCHANGED,1);
  const retryFile=join(temporary,'retry.jsonl');const retryRecord={...record,id:`${name}-retry`,url:record.url+'-retry',formAttachments:[{...record.formAttachments[0],text:formText}]};await writeFile(retryFile,JSON.stringify(retryRecord));
  const unavailable={putObject:async()=>{throw new Error('SIMULATED_STORAGE_FAILURE');}} as unknown as Client;
  const failed=await importCurated({...options,input:retryFile},db,unavailable);assert.ok(failed.assetFailures>0);assert.equal(failed.status,'PARTIAL');assert.equal(failed.counters.INSERTED,1);
  const retried=await importCurated({...options,input:retryFile},db,storage);assert.equal(retried.assetFailures,0);assert.equal(retried.counters.UNCHANGED,1);
  const result={status:'passed',dryRunNoWrites:true,invalidJsonRecordIndexesPreserved:true,partialAndStaleRunningResume:true,checkpointAtomic:true,resumeMismatchRejected:true,
    metadataVersionPreserved:true,parserVersionSeparated:true,gzipCrossFormat:true,assetFailureAndRetry:true,fixturesIsolated:true};
  await writeFile(fileURLToPath(new URL('../../../../outputs/B3-recovery-verification.json',import.meta.url)),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{
  if(created){const assets=await db.objectAsset.findMany({select:{bucket:true,objectKey:true}});for(const asset of assets)await storage.removeObject(asset.bucket,asset.objectKey);}
  await db.$disconnect();if(created){assert.match(name,/^limi_b3_test_[0-9a-f]{12}$/);await admin.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);}await admin.$disconnect();
  // Exact mkdtemp path, verified inside OS temporary directory.
  assert.ok(temporary.startsWith(join(tmpdir(),'limi-b3-')));await rm(temporary,{recursive:true,force:true});
}
