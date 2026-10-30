import {readdir,copyFile,mkdir,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const source=fileURLToPath(new URL('../../Prototype/dist/',import.meta.url)),destination=fileURLToPath(new URL('../public/prototype/',import.meta.url));
// Hosted builds may only see this folder; they use the committed public/prototype copy.
try{await access(source);}catch{console.log('Prototype/dist not available; using committed public/prototype.');process.exit(0);}
await mkdir(destination,{recursive:true});let count=0;
for(const entry of await readdir(source,{withFileTypes:true})){if(!entry.isFile()||!/[.](html|css|js|svg|png)$/i.test(entry.name))continue;await copyFile(source+entry.name,destination+entry.name);count++;}
console.log(`Synced ${count} prototype assets. Source: Prototype/dist.`);
