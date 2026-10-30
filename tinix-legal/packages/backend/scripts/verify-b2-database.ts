import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { PrismaClient, type Prisma } from '@prisma/client';
import { loadConfig } from '../src/modules/operations/config.js';
import { sha256, snapshotHashes, prepareParse } from '../src/modules/legal/record-adapter.js';
import { resolveImportedIdentity, getOrCreateSnapshot, getOrCreateParse, resolveDocumentSource, linkSnapshotSource } from '../src/modules/legal/version-store.js';

const config=loadConfig(),url=new URL(config.databaseUrl);
if (!['127.0.0.1','localhost'].includes(url.hostname)||url.port!=='5433'||url.pathname!=='/limi_dev') throw new Error('TEST_REQUIRES_LOCAL_LIMI_DEV');
const root=fileURLToPath(new URL('../../../',import.meta.url));
const schema=fileURLToPath(new URL('../prisma/schema.prisma',import.meta.url));
const cli=fileURLToPath(new URL('../../../node_modules/prisma/build/index.js',import.meta.url));
const suffix=randomUUID().replaceAll('-','').slice(0,12);
const names=['empty','legacy','restore'].map(kind=>`limi_b2_${kind}_${suffix}`);
const created:string[]=[],clients:PrismaClient[]=[];
const admin=new PrismaClient({datasources:{db:{url:config.databaseUrl}},log:[]});
const databaseUrl=(name:string)=>{const u=new URL(config.databaseUrl);u.pathname=`/${name}`;return u.toString();};
const db=(name:string)=>{const c=new PrismaClient({datasources:{db:{url:databaseUrl(name)}},log:[]});clients.push(c);return c;};
async function command(binary:string,args:string[],input?:string,env=process.env) {
  return new Promise<string>((resolve,reject)=>{
    const child=spawn(binary,args,{cwd:root,env,windowsHide:true,stdio:['pipe','pipe','pipe']});
    let stdout='',stderr='';child.stdout.on('data',c=>stdout+=String(c));child.stderr.on('data',c=>stderr+=String(c));
    child.once('error',reject);child.once('exit',code=>code===0?resolve(stdout):reject(new Error(`TEST_COMMAND_FAILED:${stderr.replaceAll(url.password,'[redacted]')}`)));
    child.stdin.end(input);
  });
}
const migrate=(name:string,args:string[])=>command(process.execPath,[cli,...args,'--schema',schema],undefined,{...process.env,DATABASE_URL:databaseUrl(name)});
const dockerArgs=(name:string,tool:string)=>['compose','--env-file','.limi.env','-f','compose.limi.yml','exec','-T','postgres',tool,'-U',decodeURIComponent(url.username),'-d',name];
const psql=(name:string,input:string)=>command('docker',[...dockerArgs(name,'psql'),'-v','ON_ERROR_STOP=1'],input);
let rejectedChecks=0;
async function rejects(tx:Prisma.TransactionClient,label:string,operation:()=>Promise<unknown>) {
  await tx.$executeRawUnsafe('SAVEPOINT b2_rejection');let failed=false;
  try {await operation();} catch {failed=true;}
  await tx.$executeRawUnsafe('ROLLBACK TO SAVEPOINT b2_rejection');await tx.$executeRawUnsafe('RELEASE SAVEPOINT b2_rejection');
  assert.ok(failed,`Database allowed ${label}`);rejectedChecks++;
}
const rollback=new Error('ROLLBACK_B2_FIXTURES');
try {
  await command(process.execPath,[cli,'migrate','diff','--from-schema-datasource',schema,'--to-schema-datamodel',schema,'--exit-code'],undefined,{...process.env,DATABASE_URL:config.databaseUrl});
  let records=0,nodes=0,quoted=0;
  const input=fileURLToPath(new URL('../../../../data/limi-laws-20261009/parsed/laws.jsonl',import.meta.url));
  for (const line of (await readFile(input,'utf8')).trim().split('\n')) {
    const r=JSON.parse(line);snapshotHashes(r);const p=prepareParse(r.fullText,r.structuredContent);
    records++;nodes+=p.provisions.length;quoted+=p.provisions.filter(n=>n.quotedAmendmentCandidate).length;
  }
  assert.equal(records,110);assert.ok(quoted>0);
  for (const name of names) {assert.match(name,/^limi_b2_(empty|legacy|restore)_[0-9a-f]{12}$/);await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);created.push(name);}
  await migrate(names[0],['migrate','deploy']);await migrate(names[0],['migrate','deploy']);
  const fresh=db(names[0]);assert.equal(await fresh.canonicalDocument.count(),0);assert.equal(await fresh.documentSnapshot.count(),0);
  await psql(names[1],await readFile(fileURLToPath(new URL('../prisma/migrations/202610120001_legacy_baseline/migration.sql',import.meta.url)),'utf8'));
  const legacy=db(names[1]);
  await legacy.$executeRaw`INSERT INTO canonical_documents (id,"documentNumber","normalizedNumber","documentType",title,"issuingBody","issuingBodyCode","fullText",ast,"updatedAt")
    VALUES ('b2-sentinel','01/2024/QĐ-UBND','01/2024/QĐ-UBND','QUYET_DINH','Văn bản cũ','UBND Hưng Yên','HY','Giữ nguyên nội dung cũ 😀','[{"id":"old-article"}]'::jsonb,NOW())`;
  await legacy.$executeRaw`INSERT INTO document_sources (id,"documentId",site,url,"updatedAt") VALUES ('b2-old-source','b2-sentinel','VBPL','https://vbpl.vn/Pages/x.aspx?ItemID=765',NOW())`;
  await legacy.$executeRaw`INSERT INTO legal_ast_nodes (id,"documentId","nodeType",ordinal,path,depth,"orderIndex",content) VALUES ('b2-old-node','b2-sentinel','DIEU','1','dieu-1',0,0,'Nội dung cũ')`;
  const before=await legacy.$queryRaw`SELECT id,"fullText",ast,"effectiveDate",signer FROM canonical_documents ORDER BY id`;
  const dump=await command('docker',[...dockerArgs(names[1],'pg_dump'),'--no-owner','--no-acl']);
  await psql(names[2],dump);
  await migrate(names[2],['migrate','resolve','--applied','202610120001_legacy_baseline']);await migrate(names[2],['migrate','deploy']);
  const upgraded=db(names[2]);
  assert.deepEqual(await upgraded.$queryRaw`SELECT id,"fullText",ast,"effectiveDate",signer FROM canonical_documents ORDER BY id`,before);
  assert.equal(await upgraded.legalASTNode.count(),1);assert.equal(await upgraded.documentSource.count(),1);assert.equal(await upgraded.documentSnapshot.count(),0);
  const record={documentNumber:'same-number',documentType:'QUYET_DINH',signer:null,effectiveDate:null,validityStatus:'KHONG_XAC_DINH',fullText:'😀abc',legalReview:'PENDING'};
  const structure={offsetUnit:'UNICODE_CODE_POINT',sections:[],appendices:[],articles:[
    {id:'main-1',nodeType:'DIEU',ordinal:'1',span:{start:0,end:2}},
    {id:'quoted-1',nodeType:'DIEU',ordinal:'1',quotedAmendmentCandidate:true,span:{start:2,end:4},children:[{id:'clause-1',nodeType:'KHOAN',span:{start:2,end:3}}]}
  ]};
  await upgraded.$transaction(async tx=>{
    const create={documentNumber:'same-number',normalizedNumber:'same-number',documentType:'QUYET_DINH' as const,title:'Fixture',issuingBody:'Same issuer',issuingBodyCode:'SAME'};
    const a=await resolveImportedIdentity(tx,'b2-test','external-a',create),b=await resolveImportedIdentity(tx,'b2-test','external-b',create);
    assert.notEqual(a.document.id,b.document.id);assert.equal((await resolveImportedIdentity(tx,'b2-test','external-a',create)).document.id,a.document.id);
    const s=(await getOrCreateSnapshot(tx,a.document.id,record)).snapshot,bs=(await getOrCreateSnapshot(tx,b.document.id,record)).snapshot;
    const replay=await getOrCreateSnapshot(tx,a.document.id,{...record,parsedAt:'2026-10-12T00:00:00Z',localPath:'D:/moved'});
    assert.equal(s.id,replay.snapshot.id);assert.equal(replay.created,false);assert.equal((s.metadataJson as {signer:null}).signer,null);
    await tx.canonicalDocument.update({where:{id:a.document.id},data:{selectedSnapshotId:s.id}});
    const p=(await getOrCreateParse(tx,s,structure,'parser-1')).parseRun;
    assert.equal((await getOrCreateParse(tx,s,structure,'parser-1')).parseRun.id,p.id);
    assert.notEqual((await getOrCreateParse(tx,s,structure,'parser-2')).parseRun.id,p.id);assert.equal(await tx.documentSnapshot.count(),2);
    const stored=await tx.parsedProvision.findMany({where:{parseRunId:p.id},orderBy:{orderIndex:'asc'}});
    assert.equal(stored.filter(n=>n.nodeType==='DIEU'&&n.ordinal==='1').length,2);assert.equal(stored[1].externalNodeId,'quoted-1');
    assert.equal(stored[2].parentId,stored[1].id);assert.equal(stored[2].quotedAmendmentCandidate,true);
    const src=await resolveDocumentSource(tx,a.document.id,'https://congbao.hungyen.gov.vn/a?docid=1&utm_source=test');assert.equal(src.site,'HUNG_YEN');
    assert.equal((await resolveDocumentSource(tx,a.document.id,'https://congbao.hungyen.gov.vn/a?docid=1')).id,src.id);
    const bsrc=await resolveDocumentSource(tx,b.document.id,'https://congbao.hungyen.gov.vn/a?docid=2');
    const link=await linkSnapshotSource(tx,a.document.id,s.id,src.id,'METADATA',{originalUrl:src.url});
    assert.equal((await linkSnapshotSource(tx,a.document.id,s.id,src.id,'METADATA',{originalUrl:src.url})).id,link.id);
    await rejects(tx,'snapshot update',()=>tx.documentSnapshot.update({where:{id:s.id},data:{fullText:'overwritten'}}));
    await rejects(tx,'snapshot delete',()=>tx.documentSnapshot.delete({where:{id:s.id}}));
    await rejects(tx,'false content hash',()=>tx.documentSnapshot.create({data:{documentId:a.document.id,contentHash:'0'.repeat(64),metadataHash:'1'.repeat(64),fullText:'wrong',metadataJson:{}}}));
    await rejects(tx,'identity duplicate',()=>tx.importedDocumentIdentity.create({data:{datasetKey:'b2-test',externalId:'external-a',documentId:b.document.id}}));
    await rejects(tx,'cross-document selected snapshot',()=>tx.canonicalDocument.update({where:{id:a.document.id},data:{selectedSnapshotId:bs.id}}));
    await rejects(tx,'cross-document source',()=>tx.snapshotSource.create({data:{documentId:a.document.id,snapshotId:s.id,sourceId:bsrc.id,role:'CONTENT',provenanceHash:'a'.repeat(64),provenanceJson:{}}}));
    await rejects(tx,'provision edit',()=>tx.parsedProvision.update({where:{id:stored[0].id},data:{quotedAmendmentCandidate:true}}));
    await rejects(tx,'sealed parse append',()=>tx.parsedProvision.create({data:{parseRunId:p.id,externalNodeId:'late',nodeType:'DIEU',spanStart:0,spanEnd:1,orderIndex:10,depth:0}}));
    await rejects(tx,'sealed parse edit',()=>tx.parseRun.update({where:{id:p.id},data:{parserVersion:'edited'}}));
    await rejects(tx,'source owner change',()=>tx.documentSource.update({where:{id:src.id},data:{documentId:b.document.id}}));
    await rejects(tx,'document history deletion',()=>tx.canonicalDocument.delete({where:{id:a.document.id}}));
    const open=await tx.parseRun.create({data:{snapshotId:s.id,parserVersion:'open',structureHash:sha256('open'),structureJson:{}}});
    await rejects(tx,'invalid span',()=>tx.parsedProvision.create({data:{parseRunId:open.id,externalNodeId:'outside',nodeType:'DIEU',spanStart:0,spanEnd:100,orderIndex:0,depth:0}}));
    await rejects(tx,'cross-parse parent',()=>tx.parsedProvision.create({data:{parseRunId:open.id,parentId:stored[0].id,externalNodeId:'cross-parent',nodeType:'KHOAN',spanStart:0,spanEnd:1,orderIndex:0,depth:1}}));
    await tx.parseRun.update({where:{id:open.id},data:{sealedAt:new Date()}});
    const file=await tx.importFile.create({data:{datasetKey:'b2-test',fileHash:sha256('file'),format:'JSONL',originalName:'fixture.jsonl'}});
    const run=await tx.importRun.create({data:{fileId:file.id,importerVersion:'test'}});
    await tx.importRecordResult.create({data:{runId:run.id,recordIndex:0,outcome:'INSERTED',documentId:a.document.id,snapshotId:s.id}});
    await rejects(tx,'duplicate result',()=>tx.importRecordResult.create({data:{runId:run.id,recordIndex:0,outcome:'UNCHANGED'}}));
    await rejects(tx,'rejection without reason',()=>tx.importRecordResult.create({data:{runId:run.id,recordIndex:1,outcome:'REJECTED'}}));
    await tx.importRun.update({where:{id:run.id},data:{lastCommittedRecordIndex:0}});
    await rejects(tx,'checkpoint reversal',()=>tx.importRun.update({where:{id:run.id},data:{lastCommittedRecordIndex:-1}}));
    await rejects(tx,'approval without evidence',()=>tx.legalReviewDecision.create({data:{snapshotId:s.id,kind:'LEGAL',verdict:'APPROVED',reviewerRef:'test-only',asOfDate:new Date('2026-10-12'),evidenceJson:{}}}));
    throw rollback;
  },{timeout:60000}).catch(error=>{if(error!==rollback)throw error;});
  assert.equal(await upgraded.canonicalDocument.count(),1);assert.equal(await upgraded.documentSnapshot.count(),0);
  console.log(JSON.stringify({status:'passed',dataset:{records,nodes,quoted},schemaDrift:false,freshMigration:true,migrationReplay:true,legacyDumpRestoreUpgrade:true,
    legacyRowsPreserved:true,historyChecksRejected:rejectedChecks,fixturesRolledBack:true}));
} finally {
  await Promise.all(clients.map(c=>c.$disconnect()));
  for(const name of created.reverse()) {
    if(!names.includes(name)||!/^limi_b2_(empty|legacy|restore)_[0-9a-f]{12}$/.test(name))throw new Error('UNSAFE_TEST_DATABASE_CLEANUP');
    await admin.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
  }
  await admin.$disconnect();
}
