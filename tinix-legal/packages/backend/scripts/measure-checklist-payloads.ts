import {PrismaClient} from '@prisma/client';
import {writeFile} from 'node:fs/promises';
import {loadConfig} from '../src/modules/operations/config.js';
import {hash,token} from '../src/modules/workspace/security.js';
const config=loadConfig();if(new URL(config.databaseUrl).pathname!=='/limi_dev')throw Error('LOCAL_DEV_REQUIRED');
const db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}}),sessions:string[]=[],measurements:any[]=[];
try{
 const reviewer=await db.workspaceUser.findFirstOrThrow({where:{platformReviewer:true}}),company=await db.workspaceCompany.findFirstOrThrow({include:{organization:{include:{memberships:true}}}});
 const owner=company.organization.memberships.find(m=>m.role==='OWNER');if(!owner)throw Error('OWNER_REQUIRED');
 for(const item of [{userId:reviewer.id,paths:['/admin/obligations','/admin/obligations?summary=1']},{userId:owner.userId,paths:[`/companies/${company.id}/tasks`,`/companies/${company.id}/tasks?summary=1`,`/companies/${company.id}/dashboard`]}]){
  const raw=token(),session=await db.workspaceSession.create({data:{userId:item.userId,tokenHash:hash(raw),csrfHash:hash(hash('csrf:'+raw)),expiresAt:new Date(Date.now()+60000)}});sessions.push(session.id);
  for(const path of item.paths){const begin=performance.now(),r=await fetch('http://127.0.0.1:4010/api/v1'+path,{headers:{cookie:'limi_session='+raw}}),body=await r.text();if(!r.ok)throw Error('Measurement request failed '+r.status);measurements.push({path,status:r.status,bytes:Buffer.byteLength(body),ms:Math.round(performance.now()-begin)});}
 }
 await writeFile(process.argv[2]??'payload-report.json',JSON.stringify({measuredAt:new Date().toISOString(),measurements},null,2));console.log(JSON.stringify(measurements));
}finally{await db.workspaceSession.deleteMany({where:{id:{in:sessions}}});await db.$disconnect();}
