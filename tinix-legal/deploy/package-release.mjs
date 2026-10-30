import {mkdir,readdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {resolve,relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../../',import.meta.url)),id=process.argv[2]??`b16-${new Date().toISOString().replace(/[:.]/g,'-')}`;
if(!/^[a-zA-Z0-9_-]+$/.test(id))throw Error('Invalid release ID');
await mkdir(join(root,'outputs/releases'),{recursive:true});
const out=join(root,'outputs/releases',id);await mkdir(out,{recursive:false});
const entries=[],skip=new Set(['node_modules','.git','.next','dist-mvp','storage','data','logs','scratch','.agent','.agents','.skills','.claude','.gemini','localhost-root.crt','.rollback-drill.yml']);
async function walk(source,dest){await mkdir(dest,{recursive:true});for(const e of await readdir(source,{withFileTypes:true})){
 if(skip.has(e.name)||e.name.endsWith('.env')||e.name.startsWith('.env')||e.name.startsWith('.pilot-')||e.name.endsWith('.log')||e.name.endsWith('.tsbuildinfo')||e.name==='next-env.d.ts')continue;
 if(e.isSymbolicLink())continue;const from=join(source,e.name),to=join(dest,e.name);
 if(e.isDirectory()){if(e.name==='dist'&&!from.includes(join('Prototype','dist')))continue;await walk(from,to);}
 else if(e.isFile()){const bytes=await readFile(from);await copyFile(from,to);entries.push({path:relative(out,to).replaceAll('\\','/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
}}
for(const path of ['tinix-legal','limi-product','Prototype/dist','outputs/runbooks'])await walk(join(root,path),join(out,path));
await copyFile(join(root,'.dockerignore'),join(out,'.dockerignore'));
const ignore=await readFile(join(root,'.dockerignore'));entries.push({path:'.dockerignore',bytes:ignore.length,sha256:createHash('sha256').update(ignore).digest('hex')});
await writeFile(join(out,'release-manifest.json'),JSON.stringify({id,createdAt:new Date().toISOString(),files:entries,containsSecrets:false,containsDatabase:false},null,2)+'\n');
console.log(JSON.stringify({id,folder:out,files:entries.length,bytes:entries.reduce((n,e)=>n+e.bytes,0)}));
