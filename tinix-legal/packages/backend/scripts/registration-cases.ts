import assert from 'node:assert/strict';
import {passwordMatches} from '../src/modules/workspace/security.js';
export async function verifyRegistrationCases({db,req,password,owner,company}:any){
 let checks=0;const client:any={},input={name:'Người dùng đăng ký thử',email:' NEW-SIGNUP@COMPLIANCE.TEST ',password,confirmPassword:password};
 const before=await db.workspaceOrganization.count();
 await req({},'/auth/register','POST',input,403,{origin:'https://untrusted.invalid'});
 await req({},'/auth/register','POST',{...input,password:'short',confirmPassword:'short'},400);
 await req({},'/auth/register','POST',{...input,confirmPassword:password+'x'},400);
 await req({},'/auth/register','POST',{...input,platformReviewer:true},400);
 await req({},'/auth/register','POST',{...input,role:'OWNER',organizationId:company.organizationId},400);
 assert.equal(await db.workspaceOrganization.count(),before);checks++;
 await req(client,'/auth/register','POST',input,201);
 const me=await req(client,'/auth/me');assert.equal(me.user.email,'new-signup@compliance.test');assert.equal(me.user.platformReviewer,false);assert.equal(me.memberships.length,1);assert.equal(me.memberships[0].role,'OWNER');assert.notEqual(me.memberships[0].organization.id,company.organizationId);checks+=5;
 const stored=await db.workspaceUser.findUniqueOrThrow({where:{email:me.user.email}});assert.notEqual(stored.passwordHash,password);assert.ok(await passwordMatches(password,stored.passwordHash));checks+=2;
 await req(client,'/admin/overview','GET',undefined,403);await req(client,'/companies/'+company.id,'GET',undefined,404);await req(client,'/auth/logout','POST',{});
 await req(client,'/auth/me','GET',undefined,401);await req(client,'/auth/login','POST',{email:me.user.email,password});assert.equal((await req(client,'/auth/me')).user.id,me.user.id);checks++;
 const orgs=await db.workspaceOrganization.count();await req({},'/auth/register','POST',input,409);assert.equal(await db.workspaceOrganization.count(),orgs);checks++;
 const existing=await req(owner,'/auth/me');await req({},'/auth/register','POST',{...input,email:existing.user.email},409);assert.equal((await req(owner,'/auth/me')).user.id,existing.user.id);checks++;
 const concurrent={...input,email:'race-signup@compliance.test'};
 const statuses=await Promise.all([201,409].map(async()=>{try{await req({},'/auth/register','POST',concurrent,201);return 201;}catch(e){if(String(e).includes('409'))return 409;throw e;}}));assert.deepEqual(statuses.sort(),[201,409]);assert.equal(await db.workspaceUser.count({where:{email:concurrent.email}}),1);assert.equal(await db.workspaceOrganization.count(),orgs+1);checks+=3;
 return checks;
}
