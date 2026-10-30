import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { createMvpApp } from '../src/mvp-app.js';
import { loadConfig } from '../src/modules/operations/config.js';
import { createDependencies } from '../src/modules/operations/dependencies.js';
import { readRecords } from '../src/modules/legal/import-input.js';
import { provisionText,sha256 } from '../src/modules/legal/record-adapter.js';
const config=loadConfig();if(new URL(config.databaseUrl).pathname!=='/limi_dev')throw new Error('LOCAL_DEV_REQUIRED');
const dependencies=createDependencies(config),db=dependencies.database!,storage=dependencies.storage!;
const {app}=createMvpApp(config,dependencies),server=app.listen(0,'127.0.0.1');await once(server,'listening');
const address=server.address();if(!address||typeof address==='string')throw new Error('NO_TEST_LISTENER');const base=`http://127.0.0.1:${address.port}/api/v1`;
let checks=0;const json=async(path:string)=>{const response=await fetch(base+path);assert.equal(response.status,200,path);const value=await response.json();
  assert.ok(!/localPath|objectKey|MINIO_SECRET|C:\\\\Rnd/i.test(JSON.stringify(value)),`Private fields in ${path}`);checks++;return value;};
try {
  const input=fileURLToPath(new URL('../../../../data/limi-laws-20261009/parsed/laws.jsonl',import.meta.url));
  let corpus=0,ocr=0,forms=0;const examples:string[]=[];
  for await(const {value} of readRecords(input)){
    const record=value as Record<string,any>;const identity=await db.importedDocumentIdentity.findUniqueOrThrow({where:{imported_identity:{datasetKey:'limi-curated-20261009',externalId:record.id}},include:{document:{include:{selectedSnapshot:true}}}});
    const s=identity.document.selectedSnapshot!;assert.equal(s.contentHash,record.fullTextSha256);assert.equal(s.fullText,record.fullText);assert.equal(s.metadataJson&& (s.metadataJson as any).signer,record.signer??null);
    assert.equal((s.qualityJson as any).legalReview,'PENDING');if(record.parseQuality.requiresOcrTextReview){ocr++;assert.equal((s.qualityJson as any).parseQuality.requiresOcrTextReview,true);}
    const links=await db.snapshotAsset.findMany({where:{snapshotId:s.id,role:'FORM'},include:{asset:true}});assert.equal(links.length,record.formAttachments?.length??0);
    for(const f of record.formAttachments??[]){const link=links.find(l=>l.asset.checksum===f.sha256);assert.ok(link);assert.equal(link.extractedText,f.text);assert.equal(link.extractedTextHash,sha256(f.text));forms++;}
    if(['LIMI-SEED-041','LIMI-SEED-060','LIMI-SEED-108'].includes(record.id))examples.push(record.id);
    corpus++;
  }
  assert.equal(corpus,110);assert.equal(ocr,35);assert.equal(forms,54);assert.equal(await db.documentSnapshot.count(),110);assert.equal(await db.parseRun.count(),110);assert.equal(await db.parsedProvision.count(),39487);
  const list=await json('/laws');assert.equal(list.total,110);assert.equal(list.items.length,20);assert.ok(!JSON.stringify(list).includes('fullText'));assert.ok(!JSON.stringify(list).includes('structureJson'));
  assert.equal((await json('/laws?scope=HUNG_YEN')).total,6);
  assert.ok((await json('/laws/search?q=10%2F2020%2FTT')).items.length>0);assert.ok((await json('/laws?group=tax')).total>0);assert.ok((await json('/search?q=thu%E1%BA%BF')).total>0);
  assert.equal(examples.length,3);const inspected=[];
  for(const id of examples){const d=await json(`/laws/${id}`),c=await json(`/laws/${id}/content`);assert.equal(sha256(c.fullText),c.contentHash);assert.ok(d.sources.length>0);
    const p=await json(`/laws/${id}/provisions?pageSize=100`);const n=p.items[0];const cited=await json(`/laws/${id}/provisions/${n.id}?snapshotId=${c.snapshotId}&parseRunId=${p.parseRun.id}`);
    assert.equal(cited.text,provisionText(c.fullText,n.spanStart,n.spanEnd));assert.equal(cited.externalNodeId,n.externalNodeId);assert.equal(cited.parseRun.id,p.parseRun.id);
    const versions=await json(`/laws/${id}/snapshots`);assert.equal(versions.total,1);assert.equal(typeof versions.items[0].createdAt,'string');
    inspected.push({id,number:d.documentNumber,requiresOcrReview:d.quality.parseQuality.requiresOcrTextReview===true});}
  const formDoc=await json('/laws/LIMI-SEED-003'),attachments=await json('/laws/LIMI-SEED-003/attachments?pageSize=100');const form=attachments.items.find((a:any)=>a.role==='FORM');assert.ok(form);
  const text=await json(form.textUrl.replace('/api/v1',''));assert.equal(sha256(text.text),text.textHash);
  const file=await fetch(base+form.downloadUrl.replace('/api/v1',''));assert.equal(file.status,200);assert.equal(sha256(Buffer.from(await file.arrayBuffer())),form.checksum);assert.ok(file.headers.get('content-disposition')?.startsWith('attachment;'));checks++;
  const other=list.items.find((l:any)=>l.id!==formDoc.id)!;
  assert.equal((await fetch(`${base}/laws/${other.id}/content?snapshotId=${formDoc.snapshotId}`)).status,404);
  assert.equal((await fetch(`${base}/laws/${other.id}/attachments/${form.id}/download?snapshotId=${other.snapshotId}`)).status,404);
  for(const path of ['/laws?pageSize=101','/laws?page=0','/laws?scope=WRONG','/laws?q=','/laws/unknown/content','/laws/LIMI-SEED-003/content?snapshotId=bad'])assert.ok([400,404].includes((await fetch(base+path)).status),path);
  const raw=await db.snapshotAsset.findFirstOrThrow({where:{snapshotId:formDoc.snapshotId,role:'RAW_RECORD'}});assert.equal((await fetch(`${base}/laws/LIMI-SEED-003/attachments/${raw.id}/download?snapshotId=${formDoc.snapshotId}`)).status,404);
  const spec=await json('/openapi.json');assert.equal(spec.openapi,'3.1.0');assert.ok(spec.paths['/laws/{id}/content']);
  const assets=await db.objectAsset.findMany({select:{id:true,bucket:true,objectKey:true,checksum:true,sizeBytes:true,status:true}});
  for(const a of assets){assert.equal(a.status,'AVAILABLE');const stat=await storage.statObject(a.bucket,a.objectKey);assert.equal(BigInt(stat.size),a.sizeBytes);assert.equal(stat.metaData.sha256,a.checksum);}
  const tables=await db.$queryRaw`SELECT relname, pg_total_relation_size(relid)::text AS bytes FROM pg_catalog.pg_statio_user_tables WHERE relname IN ('canonical_documents','document_snapshots','parsed_provisions','parse_runs','snapshot_assets','object_assets') ORDER BY relname`;
  const report={status:'passed',corpus,ocrReviewFlags:ocr,forms,parsedNodes:39487,documentSnapshots:110,parseRuns:110,assets:assets.length,assetBytes:assets.reduce((n,a)=>n+a.sizeBytes,0n).toString(),apiChecks:checks,examples:inspected,negativeOwnershipAndValidationChecks:true,privateFieldsHidden:true,meilisearchRequired:false,tables};
  await writeFile(fileURLToPath(new URL('../../../../outputs/B3-B4-verification.json',import.meta.url)),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await new Promise<void>(resolve=>{server.closeIdleConnections();server.close(()=>resolve());});await dependencies.close();}
