import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/modules/operations/config.js';
const config=loadConfig();
const cli=fileURLToPath(new URL('../../../node_modules/prisma/build/index.js',import.meta.url));
const schema=fileURLToPath(new URL('../prisma/schema.prisma',import.meta.url));
const child=spawn(process.execPath,[cli,'migrate','deploy','--schema',schema],{
  env:{...process.env,DATABASE_URL:config.databaseUrl},stdio:'inherit',windowsHide:true});
child.once('error',()=>{console.error('Cannot start Prisma migration');process.exitCode=1;});
child.once('exit',code=>{process.exitCode=code??1;});
