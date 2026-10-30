import {readFile} from 'node:fs/promises';
import {resolve,join,isAbsolute,sep} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(process.argv[2]??''),manifest=JSON.parse(await readFile(join(root,'release-manifest.json'),'utf8'));
for(const f of manifest.files){assert.ok(!f.path.split(/[\\/]/).includes('..')&&!isAbsolute(f.path)&&!f.path.includes(':'));const path=resolve(root,f.path);assert.ok(path.startsWith(root+sep));const b=await readFile(path);assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
console.log(JSON.stringify({status:'passed',release:manifest.id,files:manifest.files.length}));
