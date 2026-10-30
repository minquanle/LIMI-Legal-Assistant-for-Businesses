import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { loadConfig } from '../src/modules/operations/config.js';
import { createStorage } from '../src/modules/operations/storage.js';
import { importCurated } from '../src/modules/legal/curated-importer.js';
const args=process.argv.slice(2),values:Record<string,string>={};let dryRun=false;
for(let i=0;i<args.length;i++){if(args[i]==='--dry-run'){dryRun=true;continue;}
  if(!['--input','--dataset','--data-root','--resume','--limit','--report'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw new Error('INVALID_ARGUMENT');values[args[i].slice(2)]=args[++i];}
const root=fileURLToPath(new URL('../../../../',import.meta.url)),config=loadConfig();
const db=new PrismaClient({datasources:{db:{url:config.databaseUrl}},log:[]});
const lockUrl=new URL(config.databaseUrl);lockUrl.searchParams.set('connection_limit','1');
const lock=new PrismaClient({datasources:{db:{url:lockUrl.toString()}},log:[]});
try {const limit=values.limit===undefined?undefined:Number(values.limit);if(limit!==undefined&&(!Number.isSafeInteger(limit)||limit<1))throw new Error('INVALID_LIMIT');
  if(!dryRun){const acquired=await lock.$queryRaw<{locked:boolean}[]>`SELECT pg_try_advisory_lock(hashtextextended(${JSON.stringify(['curated-import',values.dataset??'limi-curated-20261009'])},0)) AS locked`;
    if(!acquired[0].locked)throw new Error('DATASET_IMPORT_ALREADY_RUNNING');}
  const result=await importCurated({input:resolve(values.input??`${root}/data/limi-laws-20261009/parsed/laws.jsonl`),dataset:values.dataset??'limi-curated-20261009',
    dataRoot:resolve(values['data-root']??`${root}/data`),report:resolve(values.report??`${root}/outputs/B3-${dryRun?'dry-run':'import'}-${Date.now()}.json`),bucket:config.bucket,dryRun,resume:values.resume,limit},db,createStorage(config));
  if(result.status!=='COMPLETED'&&limit===undefined)process.exitCode=1;
} finally{await db.$disconnect();await lock.$disconnect();}
