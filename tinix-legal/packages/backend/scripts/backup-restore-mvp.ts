import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {pipeline} from 'node:stream/promises';
import {PrismaClient} from '@prisma/client';
import {loadConfig} from '../src/modules/operations/config.js';
import {createStorage} from '../src/modules/operations/storage.js';
const config=loadConfig(),root=fileURLToPath(new URL('../../../../',import.meta.url));
const action=process.argv[2],folder=resolve(process.argv[3]??join(root,'outputs/private-backups',new Date().toISOString().replace(/[:.]/g,'-')));
const container=process.env.LIMI_BACKUP_PG_CONTAINER??'limi-dev-postgres-1';
if(!/^[a-zA-Z0-9_-]+$/.test(container))throw new Error('Invalid container');
const databaseName=new URL(config.databaseUrl).pathname.slice(1);
if(!/^[a-zA-Z0-9_-]+$/.test(databaseName))throw new Error('Invalid database name');
const db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}}),storage=createStorage(config);
async function digest(path:string){const h=createHash('sha256');let bytes=0;for await(const b of createReadStream(path)){h.update(b);bytes+=b.length;}return {sha256:h.digest('hex'),bytes};}
async function docker(args:string[],input?:string,output?:string){
 const child=spawn('docker',args,{windowsHide:true,stdio:['pipe','pipe','pipe']});
 const closed=new Promise<void>((ok,bad)=>{child.once('error',()=>bad(new Error('Docker unavailable')));child.once('exit',code=>code===0?ok():bad(new Error('Docker operation failed; check container status')));});
 child.stderr.resume();const transfers=[];
 if(input)transfers.push(pipeline(createReadStream(input),child.stdin));else child.stdin.end();
 if(output)transfers.push(pipeline(child.stdout,createWriteStream(output,{flags:'wx',mode:0o600})));else child.stdout.resume();
 await Promise.all([closed,...transfers]);
}
async function counts(client:PrismaClient){return {laws:await client.canonicalDocument.count(),snapshots:await client.documentSnapshot.count(),provisions:await client.parsedProvision.count(),assets:await client.objectAsset.count(),companies:await client.workspaceCompany.count(),tasks:await client.complianceTask.count(),alerts:await client.workspaceAlert.count(),migrations:await client.$queryRaw<Array<{migration_name:string}>>`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY migration_name`};}
try{
 if(action==='backup'){
  // Writers must be quiesced by the operator before calling this command.
  if(process.env.LIMI_WRITERS_PAUSED!=='true')throw new Error('Pause API/worker/scheduler and set LIMI_WRITERS_PAUSED=true');
  await mkdir(join(folder,'objects'),{recursive:true});
  const startedAt=new Date().toISOString(),expected=await counts(db);
  await docker(['exec',container,'sh','-c','exec pg_dump -U "$POSTGRES_USER" -d "$1" --format=custom --no-owner --no-acl','sh',databaseName],undefined,join(folder,'database.dump'));
  const objects:Array<{key:string;file:string;sha256:string;bytes:number}>=[];
  for await(const item of storage.listObjectsV2(config.bucket,'',true)){
   if(!item.name)continue;const file=`${objects.length.toString().padStart(6,'0')}.bin`,path=join(folder,'objects',file);
   await pipeline(await storage.getObject(config.bucket,item.name),createWriteStream(path,{flags:'wx',mode:0o600}));
   objects.push({key:item.name,file,...await digest(path)});
  }
  const assets=await db.objectAsset.findMany({where:{status:'AVAILABLE'}}),evidence=await db.complianceEvidence.findMany({where:{state:'AVAILABLE'}});
  for(const asset of [...assets,...evidence]){
   assert.equal(asset.bucket,config.bucket,'Unexpected bucket: backup must include every referenced bucket');
   const saved=objects.find(o=>o.key===asset.objectKey);assert.ok(saved,'Missing referenced object');
   assert.equal(saved.sha256,asset.checksum);assert.equal(BigInt(saved.bytes),BigInt(asset.sizeBytes));
  }
  assert.deepEqual(await counts(db),expected,'Writers changed data during backup');
  const manifest={version:1,startedAt,completedAt:new Date().toISOString(),writersPaused:true,bucket:config.bucket,database:await digest(join(folder,'database.dump')),expected,objects,objectBytes:objects.reduce((n,o)=>n+o.bytes,0),offMachine:false};
  await writeFile(join(folder,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
  await writeFile(join(root,'outputs/B16-backup.json'),JSON.stringify({status:'passed',folder,startedAt,completedAt:manifest.completedAt,databaseBytes:manifest.database.bytes,objects:objects.length,objectBytes:manifest.objectBytes,offMachine:false},null,2)+'\n');
  console.log(JSON.stringify({status:'passed',folder,objects:objects.length,objectBytes:manifest.objectBytes,offMachine:false}));
 }else if(action==='restore-drill'){
  const begin=performance.now(),manifest=JSON.parse(await readFile(join(folder,'manifest.json'),'utf8'));
  assert.equal(manifest.version,1);assert.deepEqual(await digest(join(folder,'database.dump')),manifest.database);
  const name=`limi_restore_${Date.now()}`,bucket=`limi-restore-${Date.now()}`;
  await docker(['exec',container,'sh','-c','exec createdb -U "$POSTGRES_USER" "$1"','sh',name]);
  await docker(['exec','-i',container,'sh','-c','exec pg_restore -U "$POSTGRES_USER" -d "$1" --exit-on-error --no-owner --no-acl','sh',name],join(folder,'database.dump'));
  await storage.makeBucket(bucket);
  for(const object of manifest.objects){
   assert.match(object.file,/^\d{6}\.bin$/);const path=join(folder,'objects',object.file);assert.deepEqual(await digest(path),{sha256:object.sha256,bytes:object.bytes});
   await storage.fPutObject(bucket,object.key,path,{'sha256':object.sha256});
   const hash=createHash('sha256');let bytes=0;for await(const b of await storage.getObject(bucket,object.key)){hash.update(b);bytes+=b.length;}
   assert.equal(hash.digest('hex'),object.sha256);assert.equal(bytes,object.bytes);
  }
  const url=new URL(config.databaseUrl);url.pathname='/'+name;const restored=new PrismaClient({datasources:{db:{url:url.toString()}}});
  try{
   assert.deepEqual(await counts(restored),manifest.expected);
   for(const snap of await restored.documentSnapshot.findMany())assert.equal(createHash('sha256').update(snap.fullText).digest('hex'),snap.contentHash);
   const references=[...await restored.objectAsset.findMany({where:{status:'AVAILABLE'}}),...await restored.complianceEvidence.findMany({where:{state:'AVAILABLE'}})];
   for(const a of references){const o=manifest.objects.find((o:any)=>o.key===a.objectKey);assert.ok(o);assert.equal(o.sha256,a.checksum);assert.equal(BigInt(o.bytes),BigInt(a.sizeBytes));}
   const report={status:'passed',createdAt:new Date().toISOString(),database:name,bucket,isolated:true,sourceDatabaseUnchanged:true,restoreSeconds:Number(((performance.now()-begin)/1000).toFixed(2)),checkpoint:manifest.startedAt,verified:manifest.expected,objects:manifest.objects.length,objectBytes:manifest.objectBytes,allObjectHashesVerified:true,allSnapshotHashesVerified:true,rpoPolicyConfirmed:false,rtoProductionConfirmed:false,offMachine:false,note:'Isolated database and bucket retained for inspection. No worker/scheduler starts against restored data.'};
   await writeFile(join(root,'outputs/B16-restore-drill.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
  }finally{await restored.$disconnect();}
 }else throw new Error('Usage: backup-restore-mvp.ts backup | restore-drill [folder]');
}finally{await db.$disconnect();}
