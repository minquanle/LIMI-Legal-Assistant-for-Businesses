import assert from 'node:assert/strict';
import {PrismaClient} from '@prisma/client';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {loadConfig} from '../src/modules/operations/config.js';
import {createMvpApp} from '../src/mvp-app.js';
import {createStorage} from '../src/modules/operations/storage.js';
import {token,hash} from '../src/modules/workspace/security.js';
const config=loadConfig();if(new URL(config.databaseUrl).pathname!=='/limi_dev')throw Error('Local isolated verification only');
const name='limi_prod_auth_'+Date.now(),url=new URL(config.databaseUrl);url.pathname='/'+name;
const admin=new PrismaClient({datasources:{db:{url:config.databaseUrl}}});await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
const db=new PrismaClient({datasources:{db:{url:url.toString()}}});let server:ReturnType<ReturnType<typeof createMvpApp>['app']['listen']>|undefined;
const checks:string[]=[];
try{
 const child=spawn(process.execPath,[fileURLToPath(new URL('../../../node_modules/prisma/build/index.js',import.meta.url)),'migrate','deploy','--schema','prisma/schema.prisma'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,DATABASE_URL:url.toString()},stdio:['ignore','pipe','pipe'],windowsHide:true});child.stdout.resume();child.stderr.resume();assert.equal((await once(child,'exit'))[0],0);
 const prod={...config,nodeEnv:'production',databaseUrl:url.toString(),origins:['https://localhost:8443']};
 const app=createMvpApp(prod,{database:db,storage:createStorage(config),check:async()=>({database:'up',redis:'up',storage:'up'}),close:async()=>{}}).app;
 server=app.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();if(!address||typeof address==='string')throw Error('No listener');const base=`http://127.0.0.1:${address.port}/api/v1`;
 const org=await db.workspaceOrganization.create({data:{name:'Disposable production cookie test'}}),raw=token(),password='B16-'+token();
 await db.workspaceAccessToken.create({data:{email:'cookie@test.local',tokenHash:hash(raw),kind:'PILOT',organizationId:org.id,role:'OWNER',expiresAt:new Date(Date.now()+60000)}});
 const response=await fetch(base+'/auth/activate',{method:'POST',headers:{origin:prod.origins[0],'content-type':'application/json'},body:JSON.stringify({token:raw,password,name:'Disposable test'})});assert.equal(response.status,200);checks.push('production activation');
 const cookie=response.headers.get('set-cookie')!;for(const pattern of [/^__Host-limi_session=/,/; Secure/i,/; HttpOnly/i,/; Path=\//i,/; SameSite=Lax/i]){assert.match(cookie,pattern);checks.push(pattern.source);}assert.ok(!/; Domain=/i.test(cookie));checks.push('host-only session');
 const body=await response.json() as {csrfToken:string},sessionCookie=cookie.split(';')[0];
 const me=await fetch(base+'/auth/me',{headers:{cookie:sessionCookie}});assert.equal(me.status,200);checks.push('production session lookup');
 assert.equal((await fetch(base+'/auth/me',{headers:{cookie:sessionCookie.replace('__Host-limi_session','limi_session')}})).status,401);checks.push('development cookie rejected');
 assert.equal((await fetch(base+'/auth/logout',{method:'POST',headers:{cookie:sessionCookie,origin:'http://localhost:8443','x-csrf-token':body.csrfToken}})).status,403);checks.push('HTTP origin rejected');
 assert.equal((await fetch(base+'/auth/logout',{method:'POST',headers:{cookie:sessionCookie,origin:prod.origins[0],'x-csrf-token':'wrong'}})).status,403);checks.push('CSRF rejected');
 assert.equal((await fetch(base+'/auth/logout',{method:'POST',headers:{cookie:sessionCookie,origin:prod.origins[0],'x-csrf-token':body.csrfToken}})).status,200);checks.push('secure-origin logout');
 assert.equal((await fetch(base+'/auth/me',{headers:{cookie:sessionCookie}})).status,401);checks.push('revoked session rejected');
 await writeFile(fileURLToPath(new URL('../../../../outputs/B16-production-auth.json',import.meta.url)),JSON.stringify({status:'passed',checks,disposableDatabase:true,scope:'Backend production cookie/Origin/CSRF semantics. TLS transport verified separately on staging.'},null,2)+'\n');console.log(JSON.stringify({status:'passed',checks:checks.length,disposableDatabase:true}));
}finally{
 if(server)await new Promise<void>(resolve=>{server!.closeIdleConnections();server!.close(()=>resolve());});await db.$disconnect();await admin.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);await admin.$disconnect();
}
