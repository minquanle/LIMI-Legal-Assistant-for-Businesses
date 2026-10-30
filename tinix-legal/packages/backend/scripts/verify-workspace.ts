import assert from 'node:assert/strict';
import {PrismaClient} from '@prisma/client';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {createMvpApp} from '../src/mvp-app.js';
import {loadConfig} from '../src/modules/operations/config.js';
import {hash,token} from '../src/modules/workspace/security.js';
import {createStorage} from '../src/modules/operations/storage.js';
const config=loadConfig();if(new URL(config.databaseUrl).pathname!=='/limi_dev')throw Error('LOCAL_DEV_REQUIRED');
const admin=new PrismaClient({datasources:{db:{url:config.databaseUrl}}}),databaseName='limi_workspace_test_'+Date.now(),url=new URL(config.databaseUrl);url.pathname='/'+databaseName;
await admin.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
const db=new PrismaClient({datasources:{db:{url:url.toString()}}});let server:ReturnType<ReturnType<typeof createMvpApp>['app']['listen']>|undefined,nextServer:ReturnType<typeof spawn>|undefined;
const root=fileURLToPath(new URL('../../../../',import.meta.url));
async function run(executable:string,args:string[],cwd:string,env:NodeJS.ProcessEnv=process.env){const child=spawn(executable,args,{cwd,env,stdio:['ignore','pipe','pipe'],windowsHide:true});let output='';child.stdout?.on('data',x=>output+=x);child.stderr?.on('data',x=>output+=x);const [code]=await once(child,'exit');if(code!==0)throw Error(output);return output;}
let checks=0;
await writeFile(root+'outputs/B5-B7-verification.json',JSON.stringify({status:'running',checks:0})+'\n');
try{
  await run(process.execPath,[fileURLToPath(new URL('../../../node_modules/prisma/build/index.js',import.meta.url)),'migrate','deploy','--schema','prisma/schema.prisma'],fileURLToPath(new URL('../',import.meta.url)),{...process.env,DATABASE_URL:url.toString()});
  const app=createMvpApp({...config,databaseUrl:url.toString(),origins:['http://127.0.0.1:3001']},{database:db,storage:createStorage(config),check:async()=>({database:'up',redis:'up',storage:'up'}),close:async()=>{}}).app;
  server=app.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();if(!address||typeof address==='string')throw Error();const base=`http://127.0.0.1:${address.port}`;
  type Client={cookie?:string,csrf?:string};const owner:Client={},viewer:Client={},editor:Client={},other:Client={},reviewer:Client={};
  async function request(client:Client,path:string,method='GET',body?:unknown,expected=200,extra:Record<string,string>={}){
    const response=await fetch(base+'/api/v1'+path,{method,headers:{...(client.cookie?{cookie:client.cookie}:{}),...(method!=='GET'?{origin:'http://127.0.0.1:3001','content-type':'application/json','x-csrf-token':client.csrf??''}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});
    assert.equal(response.status,expected,`${method} ${path}: ${await response.clone().text()}`);checks++;
    const cookie=response.headers.get('set-cookie');if(cookie)client.cookie=cookie.split(';')[0];const data=await response.json() as any;if(data.csrfToken)client.csrf=data.csrfToken;return data;
  }
  const password='Workspace-test-'+token(),org=await db.workspaceOrganization.create({data:{name:'Isolated test organization'}}),org2=await db.workspaceOrganization.create({data:{name:'Other test organization'}});
  async function issue(address:string,orgId:string,role:'OWNER'|'EDITOR'|'VIEWER',kind='PILOT'){
    const raw=token();await db.workspaceAccessToken.create({data:{email:address,tokenHash:hash(raw),kind,organizationId:orgId,role,expiresAt:new Date(Date.now()+3600000)}});return raw;
  }
  async function activate(client:Client,address:string,orgId:string,role:'OWNER'|'EDITOR'|'VIEWER'){
    const raw=await issue(address,orgId,role);await request(client,'/auth/activate','POST',{token:raw,password,name:address});await request(client,'/auth/activate','POST',{token:raw,password,name:address},400);return raw;
  }
  const ownerToken=await activate(owner,'owner@test.local',org.id,'OWNER');await activate(viewer,'viewer@test.local',org.id,'VIEWER');await activate(editor,'editor@test.local',org.id,'EDITOR');await activate(other,'other@test.local',org2.id,'OWNER');
  await db.workspaceUser.create({data:{email:'reviewer@test.local',name:'Reviewer',platformReviewer:true}});const reviewToken=token();await db.workspaceAccessToken.create({data:{email:'reviewer@test.local',tokenHash:hash(reviewToken),kind:'RESET',expiresAt:new Date(Date.now()+3600000)}});
  await request(reviewer,'/auth/activate','POST',{token:reviewToken,password,name:'Reviewer'});
  await request({},'/companies','GET',undefined,401);const me=await request(owner,'/auth/me');assert.equal((await request(owner,'/auth/me')).csrfToken,me.csrfToken);
  const input={organizationId:org.id,profile:{name:'Test business',taxId:'0123456789',province:'Hưng Yên'},facts:{employees:'unknown',activity:null,channels:[],places:null,signals:null}};
  await request(owner,'/companies','POST',input,403,{'x-csrf-token':'bad'});await request(owner,'/companies','POST',input,403,{origin:'https://attacker.invalid'});
  await request(viewer,'/companies','POST',input,403);await request(other,'/companies','POST',input,404);await request(reviewer,'/companies','POST',input,404);
  const c=await request(owner,'/companies','POST',input,201);assert.equal(c.factsJson.employees.status,'UNKNOWN');assert.equal(c.factsJson.employees.value,null);assert.equal(c.factsJson.channels.status,'USER_CONFIRMED');assert.deepEqual(c.factsJson.channels.value,[]);
  await request(owner,'/companies','POST',input,409);assert.equal((await request(other,'/companies')).items.length,0);assert.equal((await request(reviewer,'/companies')).items.length,0);
  for(const suffix of ['','/profiles','/sites','/events'])await request(other,`/companies/${c.id}${suffix}`,'GET',undefined,404);
  const profile={expectedVersion:1,profile:c.profileJson,facts:{employees:'0',activity:null,channels:[],places:null,signals:null}};delete profile.profile.sourceProvenance;
  await request(viewer,`/companies/${c.id}/profile`,'PUT',profile,403);const changed=await request(editor,`/companies/${c.id}/profile`,'PUT',profile);assert.equal(changed.version,2);assert.equal(changed.factsJson.employees.value,'0');assert.equal(changed.factsJson.employees.status,'USER_CONFIRMED');
  await request(owner,`/companies/${c.id}/profile`,'PUT',profile,409);assert.equal((await request(owner,`/companies/${c.id}/profiles`)).items.length,2);assert.equal(changed.factsJson.activity.confirmedAt,null);
  const racing={...profile,expectedVersion:2};const race=await Promise.all([fetch(base+`/api/v1/companies/${c.id}/profile`,{method:'PUT',headers:{cookie:owner.cookie!,origin:'http://127.0.0.1:3001','x-csrf-token':owner.csrf!,'content-type':'application/json'},body:JSON.stringify(racing)}),fetch(base+`/api/v1/companies/${c.id}/profile`,{method:'PUT',headers:{cookie:editor.cookie!,origin:'http://127.0.0.1:3001','x-csrf-token':editor.csrf!,'content-type':'application/json'},body:JSON.stringify(racing)})]);assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);checks+=2;assert.deepEqual((await request(owner,`/companies/${c.id}`)).factsJson.employees,changed.factsJson.employees);
  const s=await request(editor,`/companies/${c.id}/sites`,'POST',{name:'Test office',kind:'office',address:'Test address',province:'Hưng Yên'},201);
  await request(viewer,`/companies/${c.id}/sites`,'POST',{name:'x',kind:'office',address:'x',province:'x'},403);
  await request(other,`/companies/${c.id}/sites/${s.id}`,'PUT',{name:'x',kind:'office',address:'x',province:'x',expectedVersion:1},404);
  await request(owner,`/companies/${c.id}/sites/${s.id}`,'PUT',{name:'Updated office',kind:'office',address:'Test',province:'Hưng Yên',expectedVersion:1});
  await request(owner,`/companies/${c.id}/sites/${s.id}`,'PUT',{name:'Stale',kind:'office',address:'Test',province:'Hưng Yên',expectedVersion:1},409);
  await request(editor,`/companies/${c.id}/events`,'POST',{type:'HIRED',occurredOn:'2026-10-12',note:'Test event'},201);await request(viewer,`/companies/${c.id}/events`,'POST',{type:'HIRED',occurredOn:'2026-10-12',note:'Denied'},403);
  assert.equal((await request(owner,`/companies/${c.id}/events`)).items.length,1);
  const invite=await request(owner,`/organizations/${org.id}/invites`,'POST',{email:'invited@test.local',role:'VIEWER'},201);await request(viewer,`/organizations/${org.id}/invites`,'POST',{email:'denied@test.local',role:'EDITOR'},403);
  const invited:Client={};await request(invited,'/auth/activate','POST',{token:invite.token,password,name:'Invited'});await request(invited,`/companies/${c.id}`);
  await request(other,`/organizations/${org.id}/members`,'GET',undefined,404);const rows=(await request(owner,`/organizations/${org.id}/members`)).items,vm=rows.find((r:any)=>r.user.email==='viewer@test.local');
  await request(editor,`/organizations/${org.id}/members/${vm.id}`,'PATCH',{role:'EDITOR'},403);await request(owner,`/organizations/${org.id}/members/${vm.id}`,'PATCH',{role:'EDITOR'});
  await request(viewer,`/companies/${c.id}/events`,'POST',{type:'OTHER',occurredOn:'2026-10-12',note:'Role upgrade'},201);
  const own=rows.find((r:any)=>r.role==='OWNER');await request(owner,`/organizations/${org.id}/members/${own.id}`,'PATCH',{role:'VIEWER'},409);
  const audits=await request(owner,`/organizations/${org.id}/audit`);assert.ok(!JSON.stringify(audits).includes(password));assert.ok(!JSON.stringify(audits).includes(invite.token));assert.ok(!JSON.stringify(audits).includes('Test address'));
  const session=await db.workspaceSession.findFirstOrThrow({where:{user:{email:'owner@test.local'},revokedAt:null}});assert.notEqual(session.tokenHash,owner.cookie!.split('=')[1]);assert.equal(session.tokenHash,hash(owner.cookie!.split('=')[1]));assert.ok((await db.workspaceUser.findUniqueOrThrow({where:{email:'owner@test.local'}})).passwordHash?.startsWith('scrypt:'));
  await assert.rejects(db.workspaceProfileVersion.updateMany({where:{companyId:c.id},data:{actorId:'tamper'}}));await assert.rejects(db.workspaceAudit.deleteMany({where:{organizationId:org.id}}));checks+=2;
  await db.workspaceSession.update({where:{id:session.id},data:{expiresAt:new Date(0)}});await request(owner,'/auth/me','GET',undefined,401);
  await db.workspaceLoginThrottle.deleteMany();await request(owner,'/auth/login','POST',{email:'owner@test.local',password});await request(owner,'/auth/logout','POST',{});await request(owner,'/auth/me','GET',undefined,401);
  const expired=token();await db.workspaceAccessToken.create({data:{email:'x@test.local',tokenHash:hash(expired),kind:'PILOT',expiresAt:new Date(0)}});await request({},'/auth/activate','POST',{token:expired,password,name:'x'},400);
  const reset=token();await db.workspaceAccessToken.create({data:{email:'editor@test.local',tokenHash:hash(reset),kind:'RESET',expiresAt:new Date(Date.now()+3600000)}});const resetClient:Client={};await request(resetClient,'/auth/activate','POST',{token:reset,password:password+'-new',name:'Editor reset'});await request(editor,'/auth/me','GET',undefined,401);await request(resetClient,'/auth/revoke-all','POST',{});await request(resetClient,'/auth/me','GET',undefined,401);
  // Local API tests use a mocked provider only to verify observation ownership/provenance and failure fallback.
  const originalFetch=globalThis.fetch;globalThis.fetch=(async(input:any,init:any)=>{if(String(input).startsWith('https://api.vietqr.io/'))return new Response(JSON.stringify({code:'00',data:{id:'0987654321',name:'Registry fixture',address:'Source address'}}),{headers:{'content-type':'application/json'}});return originalFetch(input,init);}) as typeof fetch;
  await db.workspaceLoginThrottle.deleteMany();await request(owner,'/auth/login','POST',{email:'owner@test.local',password});const observation=await request(owner,'/registry/0987654321');assert.equal(observation.provenance.verified,false);
  await request(other,'/companies','POST',{organizationId:org2.id,profile:{name:'Stolen observation',taxId:'0987654321'},facts:{},registryObservationId:observation.observationId},400);
  const registryCompany=await request(owner,'/companies','POST',{organizationId:org.id,profile:{name:'User-confirmed name',taxId:'0987654321'},facts:{},registryObservationId:observation.observationId},201);assert.equal(registryCompany.profileJson.name,'User-confirmed name');assert.equal(registryCompany.profileJson.sourceProvenance.observationId,observation.observationId);
  globalThis.fetch=(async(input:any,init:any)=>{if(String(input).startsWith('https://api.vietqr.io/'))throw Error('Provider unavailable');return originalFetch(input,init);}) as typeof fetch;
  const fallback=await request(owner,'/registry/0987654321','GET',undefined,503);assert.equal(fallback.manualFallback,true);globalThis.fetch=originalFetch;
  const existingInvite=await request(owner,`/organizations/${org.id}/invites`,'POST',{email:'other@test.local',role:'VIEWER'},201);
  await request({},'/auth/activate','POST',{token:existingInvite.token,password,name:'Wrong reset'},409);
  await request(other,'/auth/accept-invite','POST',{token:existingInvite.token});await request(other,'/auth/accept-invite','POST',{token:existingInvite.token},400);await request(other,`/companies/${c.id}`);
  // Prepare an isolated browser account; never seed sample companies into limi_dev.
  const browserToken=await issue('browser@test.local',org.id,'OWNER');await db.workspaceLoginThrottle.deleteMany();
  nextServer=spawn(process.execPath,[root+'limi-product/node_modules/next/dist/bin/next','start','-p','3001'],{cwd:root+'limi-product',env:{...process.env,LIMI_API_URL:base},stdio:'ignore',windowsHide:true});
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:3001/workspace')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready,'Next test host ready');
  const browserOutput=await run(process.execPath,[root+'tinix-legal/scripts/verify-workspace-browser.mjs'],root+'tinix-legal',{...process.env,WORKSPACE_TEST_PASSWORD:password,WORKSPACE_TEST_TOKEN:browserToken});
  assert.ok(browserOutput.includes('"status":"passed"'));
  // Production sessions use __Host cookie, HTTPS, HttpOnly and SameSite=Lax.
  const production=createMvpApp({...config,nodeEnv:'production',origins:['http://127.0.0.1:3001']},{database:db,check:async()=>({database:'up',redis:'up',storage:'up'}),close:async()=>{}}).app.listen(0,'127.0.0.1');await once(production,'listening');const pa=production.address();assert.ok(pa&&typeof pa!=='string');
  const secure=await fetch(`http://127.0.0.1:${(pa as any).port}/api/v1/auth/login`,{method:'POST',headers:{origin:'http://127.0.0.1:3001','content-type':'application/json'},body:JSON.stringify({email:'owner@test.local',password})});assert.equal(secure.status,200);assert.match(secure.headers.get('set-cookie')!,/__Host-limi_session=.*HttpOnly; Secure; SameSite=Lax/);await new Promise<void>(r=>production.close(()=>r()));checks++;
  for(let i=0;i<12;i++)await request({},'/auth/login','POST',{email:'locked@test.local',password:'wrong'},401);
  const report={status:'passed',checks,disposableDatabase:true,tenantIsolation:true,unknownVsZero:true,optimisticConcurrency:true,sessionHashExpiryRevocation:true,csrfOrigin:true,viewerAndReviewerIsolation:true,oneTimePilotInviteReset:true,auditRedactionAndImmutableHistory:true,registryProvenanceAndFallback:true,browser:true};
  await writeFile(root+'outputs/B5-B7-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));void ownerToken;
}finally{
  if(nextServer){nextServer.kill();await once(nextServer,'exit').catch(()=>{});}
  if(server){server.closeAllConnections();await new Promise<void>(resolve=>server!.close(()=>resolve()));}await db.$disconnect();await admin.$executeRawUnsafe(`DROP DATABASE "${databaseName}" WITH (FORCE)`);await admin.$disconnect();
}
