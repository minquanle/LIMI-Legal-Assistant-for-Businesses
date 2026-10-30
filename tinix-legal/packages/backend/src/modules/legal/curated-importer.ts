import { basename } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { PrismaClient, type Prisma, type ImportOutcome, type ImportFormat } from '@prisma/client';
import type { Client } from 'minio';
import {z} from 'zod';
import { curatedRecordSchema } from './curated-record.schema.js';
import { mapCanonical, publicProvenance } from './curated-record.mapper.js';
import { readRecords, hashFile } from './import-input.js';
import { canonicalJson, sha256, snapshotHashes, prepareParse } from './record-adapter.js';
import { resolveImportedIdentity, getOrCreateSnapshot, getOrCreateParse, resolveDocumentSource, linkSnapshotSource } from './version-store.js';
import { prepareFileAsset, storeBytes, type PreparedAsset } from './asset-store.js';
export const IMPORTER_VERSION='limi-curated-importer-1.0';
export interface ImportOptions {input:string;dataset:string;dataRoot:string;bucket:string;dryRun?:boolean;resume?:string;limit?:number;report:string;}
const safeError=(e:unknown)=>e instanceof z.ZodError?'SCHEMA_VALIDATION_FAILED':e instanceof Error&&/^[A-Z_]+(:[A-Za-z]+)?$/.test(e.message)?e.message:'INVALID_RECORD_OR_DATABASE_ERROR';
export async function importCurated(o:ImportOptions,db:PrismaClient,storage:Client) {
  const started=Date.now(),fileHash=await hashFile(o.input);let runId:string|undefined,checkpoint=-1,processed=0;
  const counters:Record<string,number>={},errors:{index:number;externalId:string|null;errorCode:string}[]=[];
  if(!o.dryRun) {
    const format:ImportFormat=o.input.endsWith('.jsonl.gz')?'JSONL_GZIP':o.input.endsWith('.json.gz')?'JSON_GZIP':o.input.endsWith('.jsonl')?'JSONL':'JSON';
    const file=await db.importFile.upsert({where:{datasetKey_fileHash:{datasetKey:o.dataset,fileHash}},create:{datasetKey:o.dataset,fileHash,format,originalName:basename(o.input)},update:{}});
    if(o.resume){const run=await db.importRun.findUniqueOrThrow({where:{id:o.resume}});
      if(run.fileId!==file.id||run.importerVersion!==IMPORTER_VERSION||run.mode!=='IMPORT')throw new Error('RESUME_INPUT_MISMATCH');
      runId=run.id;checkpoint=run.lastCommittedRecordIndex;Object.assign(counters,run.countersJson);
      await db.importRun.update({where:{id:runId},data:{status:'RUNNING',finishedAt:null,errorCode:null}});
    }else {runId=(await db.importRun.create({data:{fileId:file.id,importerVersion:IMPORTER_VERSION,status:'RUNNING',startedAt:new Date()}})).id;}
  }
  let reachedEnd=true,fatal:string|undefined;
  try {
    for await(const entry of readRecords(o.input)) {
      if(entry.index<=checkpoint)continue;
      if(o.limit!==undefined&&processed>=o.limit){reachedEnd=false;break;}
      let externalId:string|null=null;
      try {
        if(entry.error)throw new Error(entry.error);
        if(entry.value&&typeof entry.value==='object'&&'id' in entry.value&&typeof entry.value.id==='string')externalId=entry.value.id;
        const record=curatedRecordSchema.parse(entry.value);externalId=record.id;
        snapshotHashes(record);prepareParse(record.fullText,record.structuredContent);
        const assets:PreparedAsset[]=[],warnings:string[]=[];
        const files=[...record.originalFiles.map(f=>({file:f,role:(f.kind==='SOURCE_PAGE'?'SOURCE_PAGE':'ORIGINAL_FILE') as PreparedAsset['role']})),
          ...record.contentSources.map(file=>({file,role:'ORIGINAL_FILE' as const})),
          ...(record.formAttachments??[]).map(file=>({file,role:'FORM' as const}))];
        const seen=new Set<string>();
        for(const {file,role} of files) {
          if(!file.localPath){warnings.push('REMOTE_SOURCE_WITHOUT_LOCAL_FILE');continue;}
          const key=`${role}:${file.localPath}`;if(seen.has(key))continue;seen.add(key);
          try{const asset=await prepareFileAsset(o.dryRun?undefined:db,o.dryRun?undefined:storage,o.bucket,o.dataRoot,file,role);if(asset)assets.push(asset);}
          catch(e){if(role==='FORM'||safeError(e)==='ASSET_HASH_MISMATCH'||safeError(e)==='ASSET_PATH_OUTSIDE_DATA_ROOT')throw e;warnings.push('OPTIONAL_FILE_UNAVAILABLE');}
        }
        if(o.dryRun){counters.VALID=(counters.VALID??0)+1;checkpoint=entry.index;processed++;continue;}
        const raw=await storeBytes(db,storage,o.bucket,Buffer.from(canonicalJson(record)),'application/json');
        assets.push({id:raw.id,role:'RAW_RECORD',provenance:{externalId:record.id,fileHash}});
        const committedCounters=await db.$transaction(async tx=>{
          // Serializes two imports of the same dataset identity across file formats.
          const identity=await resolveImportedIdentity(tx,o.dataset,record.id,mapCanonical(record));
          const version=await getOrCreateSnapshot(tx,identity.document.id,record);
          const parse=await getOrCreateParse(tx,version.snapshot,record.structuredContent,record.parserVersion,record.parseQuality);
          const docId=identity.document.id,snapshotId=version.snapshot.id;
          const sourceEntries=[{url:record.url,role:'METADATA' as const,provenance:{url:record.url,source:record.source??null}},
            ...record.contentSources.filter(s=>s.url).map(s=>({url:s.url!,role:'CONTENT' as const,provenance:publicProvenance(s)}))];
          for(const s of sourceEntries){const source=await resolveDocumentSource(tx,docId,s.url);const link=await linkSnapshotSource(tx,docId,snapshotId,source.id,s.role,s.provenance);
            if(version.created)await tx.sourceObservation.create({data:{documentId:docId,sourceId:source.id,snapshotId,result:'IMPORTED_LOCAL_CORPUS',provenanceJson:{snapshotSourceId:link.id,fileHash}}});}
          for(const asset of assets)await tx.snapshotAsset.upsert({where:{snapshotId_assetId_role:{snapshotId,assetId:asset.id,role:asset.role}},
            create:{snapshotId,assetId:asset.id,role:asset.role,provenanceJson:asset.provenance,extractedText:asset.text??null,extractedTextHash:asset.text===undefined?null:sha256(asset.text)},update:{}});
          if(version.created)for(const rel of record.relationships)await tx.documentRelation.create({data:{sourceDocId:docId,sourceSnapshotId:snapshotId,
            targetDocNumber:rel.targetDocNumber,relationType:rel.relationshipType,
            origin:'SOURCE_METADATA',resolveStatus:'UNRESOLVED',reviewStatus:'PENDING',provenanceJson:publicProvenance({relation:rel,relationshipsRaw:record.relationshipsRaw??[]})}});
          const mapped=mapCanonical(record);const {id:_id,...cache}=mapped;
          await tx.canonicalDocument.update({where:{id:docId},data:{...cache,selectedSnapshotId:snapshotId}});
          const outcome:ImportOutcome=identity.created?'INSERTED':version.created?'NEW_VERSION':parse.created?'NEW_PARSE':'UNCHANGED';
          const next={...counters,[outcome]:(counters[outcome]??0)+1};
          await tx.importRecordResult.create({data:{runId:runId!,recordIndex:entry.index,externalId:record.id,recordHash:sha256(canonicalJson(record)),outcome,documentId:docId,snapshotId,
            provenanceJson:{warnings,assetIds:assets.map(a=>a.id)}}});
          await tx.importRun.update({where:{id:runId},data:{lastCommittedRecordIndex:entry.index,countersJson:next}});
          return next;
        },{timeout:120000});
        Object.assign(counters,committedCounters);
      }catch(e) {
        const errorCode=safeError(e);errors.push({index:entry.index,externalId,errorCode});counters.REJECTED=(counters.REJECTED??0)+1;
        if(!o.dryRun)await db.$transaction(async tx=>{await tx.importRecordResult.create({data:{runId:runId!,recordIndex:entry.index,externalId,outcome:'REJECTED',errorCode,
          provenanceJson:e instanceof z.ZodError?{issues:e.issues.map(issue=>({path:issue.path.map(String),code:issue.code}))}:{}}});
          await tx.importRun.update({where:{id:runId},data:{lastCommittedRecordIndex:entry.index,countersJson:counters}});});
      }
      checkpoint=entry.index;processed++;
      if(processed%10===0)console.log(JSON.stringify({event:'import_progress',runId,checkpoint,counters}));
    }
  }catch(e){fatal=safeError(e);}
  const assetFailures=o.dryRun?0:await db.objectAsset.count({where:{snapshotLinks:{some:{snapshot:{document:{importedIdentities:{some:{datasetKey:o.dataset}}}}}},status:{not:'AVAILABLE'}}});
  const status=fatal?'FAILED':!reachedEnd?'PARTIAL':(counters.REJECTED??0)>0||assetFailures>0?'PARTIAL':'COMPLETED';
  if(runId)await db.importRun.update({where:{id:runId},data:{status,finishedAt:new Date(),errorCode:fatal??null}});
  const sizes=o.dryRun?null:await db.$queryRaw<{bytes:bigint}[]>`SELECT pg_database_size(current_database()) AS bytes`;
  const report={status,dryRun:!!o.dryRun,runId,dataset:o.dataset,fileHash,checkpoint,counters,errors,assetFailures,fatal,
    elapsedMs:Date.now()-started,peakRssBytes:process.resourceUsage().maxRSS*1024,databaseBytes:sizes?.[0].bytes.toString()};
  await writeFile(o.report,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));return report;
}
