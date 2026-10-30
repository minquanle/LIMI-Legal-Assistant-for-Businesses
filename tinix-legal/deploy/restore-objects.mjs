import {Client} from 'minio';
import {createReadStream} from 'node:fs';
import {readFile as read} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
if(process.env.LIMI_RESTORE_NEW_ENVIRONMENT!=='true')throw Error('Only restore into a new isolated staging environment');
const root=resolve(process.argv[2]),manifest=JSON.parse(await read(join(root,'manifest.json'),'utf8'));
const storage=new Client({endPoint:process.env.MINIO_ENDPOINT,port:Number(process.env.MINIO_PORT),useSSL:false,accessKey:process.env.MINIO_ACCESS_KEY,secretKey:process.env.MINIO_SECRET_KEY});
const bucket=process.env.MINIO_BUCKET;
assert.equal(manifest.bucket,bucket);
if(!await storage.bucketExists(bucket))await storage.makeBucket(bucket);
for await(const item of storage.listObjectsV2(bucket,'',true))if(item.name)throw Error('Refusing to overwrite non-empty bucket');
for(const o of manifest.objects){
 assert.match(o.file,/^\d{6}\.bin$/);const path=join(root,'objects',o.file),hash=createHash('sha256');let size=0;
 for await(const b of createReadStream(path)){hash.update(b);size+=b.length;}assert.equal(hash.digest('hex'),o.sha256);assert.equal(size,o.bytes);
 await storage.fPutObject(bucket,o.key,path,{sha256:o.sha256});
 const verify=createHash('sha256');for await(const b of await storage.getObject(bucket,o.key))verify.update(b);assert.equal(verify.digest('hex'),o.sha256);
}
console.log(JSON.stringify({status:'passed',objects:manifest.objects.length,bytes:manifest.objectBytes}));
