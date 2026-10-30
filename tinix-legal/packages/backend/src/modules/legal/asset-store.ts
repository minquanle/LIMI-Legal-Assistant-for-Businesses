import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { relative, isAbsolute, extname, basename } from 'node:path';
import type { PrismaClient, SnapshotAssetRole } from '@prisma/client';
import type { Client } from 'minio';
import { hashFile } from './import-input.js';
import { publicProvenance } from './curated-record.mapper.js';
export interface PreparedAsset {id:string;role:SnapshotAssetRole;provenance:ReturnType<typeof publicProvenance>;text?:string;}
export const mimeFor=(name:string)=>({'.pdf':'application/pdf','.doc':'application/msword','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.html':'text/html','.rar':'application/vnd.rar','.json':'application/json'}[extname(name).toLowerCase()]??'application/octet-stream');
export async function storeBytes(db:PrismaClient,storage:Client,bucket:string,bytes:Buffer,mimeType:string) {
  const {sha256}=await import('./record-adapter.js');const checksum=sha256(bytes),objectKey=`legal/sha256/${checksum}`;
  const asset=await db.objectAsset.upsert({where:{bucket_objectKey:{bucket,objectKey}},create:{bucket,objectKey,checksum,sizeBytes:BigInt(bytes.length),mimeType},update:{}});
  if(asset.status!=='AVAILABLE')try{await storage.putObject(bucket,objectKey,bytes,bytes.length,{'Content-Type':mimeType,'X-Amz-Meta-Sha256':checksum});return await db.objectAsset.update({where:{id:asset.id},data:{status:'AVAILABLE',errorCode:null}});}
  catch{ return db.objectAsset.update({where:{id:asset.id},data:{status:'FAILED',errorCode:'UPLOAD_FAILED'}}); }
  return asset;
}
export async function prepareFileAsset(db:PrismaClient|undefined,storage:Client|undefined,bucket:string,root:string,file:Record<string,unknown>,role:SnapshotAssetRole):Promise<PreparedAsset|undefined> {
  if(typeof file.localPath!=='string')return undefined;
  const resolved=await realpath(file.localPath),allowed=await realpath(root),rel=relative(allowed,resolved);
  if(isAbsolute(rel)||rel==='..'||rel.startsWith(`..\\`)||rel.startsWith('../'))throw new Error('ASSET_PATH_OUTSIDE_DATA_ROOT');
  const info=await stat(resolved);if(!info.isFile())throw new Error('ASSET_NOT_FILE');
  const checksum=await hashFile(resolved);if(file.sha256&&file.sha256!==checksum)throw new Error('ASSET_HASH_MISMATCH');
  if(!db||!storage)return undefined;
  const objectKey=`legal/sha256/${checksum}`,mimeType=mimeFor(resolved);
  let asset=await db.objectAsset.upsert({where:{bucket_objectKey:{bucket,objectKey}},create:{bucket,objectKey,checksum,sizeBytes:info.size,mimeType},update:{}});
  if(asset.sizeBytes!==BigInt(info.size))throw new Error('ASSET_IDENTITY_CONFLICT');
  if(asset.status!=='AVAILABLE')try{await storage.putObject(bucket,objectKey,createReadStream(resolved),info.size,{'Content-Type':mimeType,'X-Amz-Meta-Sha256':checksum});asset=await db.objectAsset.update({where:{id:asset.id},data:{status:'AVAILABLE',errorCode:null}});}
  catch{asset=await db.objectAsset.update({where:{id:asset.id},data:{status:'FAILED',errorCode:'UPLOAD_FAILED'}});}
  const {text,...provenance}=file;
  return {id:asset.id,role,provenance:publicProvenance({...provenance,filename:file.filename??basename(resolved)}),...(typeof text==='string'?{text}:{})};
}
