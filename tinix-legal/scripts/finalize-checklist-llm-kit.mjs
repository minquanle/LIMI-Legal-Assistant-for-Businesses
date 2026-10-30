import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../../outputs/LLM_CHECKLIST_KIT_20261012/',import.meta.url));
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8')),docs=new Map();
for(const batch of manifest.batches)for(const line of (await readFile(join(root,batch.path),'utf8')).trim().split('\n')){const d=JSON.parse(line);docs.set(d.documentId,{...d,fullDocumentFile:batch.path});}
const hints=(await readFile(join(root,'data/candidate-hints.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);
await mkdir(join(root,'starter'),{recursive:true});const starterBatches=[];
for(const group of ['tax','labor','insurance','accounting','company','hungyen']){
 let rows=[],chars=0,index=1;
 async function flush(){if(!rows.length)return;const path=`starter/${group}-${String(index++).padStart(2,'0')}.jsonl`,body=rows.join('\n')+'\n';await writeFile(join(root,path),body);starterBatches.push({path,group,candidates:rows.length,bytes:Buffer.byteLength(body),characters:[...body].length});rows=[];chars=0;}
 for(const hint of hints.filter(h=>h.groupCode===group)){const d=docs.get(hint.documentId),a=d?.articles.find(a=>a.provisionId===hint.provisionId);if(!a?.citationAllowed)continue;
  const row=JSON.stringify({candidateHint:hint,documentId:d.documentId,snapshotId:d.snapshotId,parseRunId:d.parseRunId,documentNumber:d.documentNumber,title:d.title,group:d.group,scope:d.scope,metadata:d.metadata,quality:d.quality,sources:d.sources,article:a,fullDocumentFile:d.fullDocumentFile,contextComplete:false,note:'Article text is complete, but other articles/exceptions/amendments may be needed. Read fullDocumentFile before asserting complete scope.'});
  const length=[...row].length;if(rows.length&&chars+length>50000)await flush();rows.push(row);chars+=length;
 }
 await flush();
}
manifest.starterBatches=starterBatches;
const files=[];
async function walk(dir,prefix=''){for(const e of await readdir(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory())await walk(join(dir,e.name),rel+'/');else if(e.isFile()&&rel!=='manifest.json'){const b=await readFile(join(dir,e.name));files.push({path:rel,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}}}
await walk(root);manifest.files=files;await writeFile(join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({documents:manifest.documents,articleNodes:manifest.articleNodes,fullLawBatches:manifest.batches.length,starterBatches:starterBatches.length,starterCandidates:starterBatches.reduce((n,b)=>n+b.candidates,0),files:files.length,totalBytes:files.reduce((n,f)=>n+f.bytes,0)}));
