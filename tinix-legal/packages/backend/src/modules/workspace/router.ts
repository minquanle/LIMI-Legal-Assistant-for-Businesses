import {Router,type Request,type Response,type NextFunction} from 'express';
import {Prisma,type PrismaClient,type WorkspaceRole} from '@prisma/client';
import {z} from 'zod';
import type {MvpConfig} from '../operations/config.js';
import {hash,token,passwordHash,passwordMatches,cookieValue} from './security.js';
import {email,password,companyInput,profileInput,siteSchema,eventSchema,confirmedFacts,taxId} from './contracts.js';
import {workspaceAccess,HttpError} from './access.js';
import {enqueueCompanyRefresh} from '../compliance/evaluation.js';
import {createLimiter} from './rate-limit.js';

type Tx=Prisma.TransactionClient;
const uuid=z.string().uuid();
const wrap=(fn:(req:Request,res:Response)=>Promise<void>)=>(req:Request,res:Response,next:NextFunction)=>{void fn(req,res).catch(next);};
export function createWorkspaceRouter(db:PrismaClient,config:MvpConfig){
  const router=Router(),cookieName=config.nodeEnv==='production'?'__Host-limi_session':'limi_session';
  const {audit,origin,session,mutation,member,company}=workspaceAccess(db,config);
  const loginFailures=createLimiter(10,15*60*1000),registerPerEmail=createLimiter(3,60*60*1000),registerTotal=createLimiter(60,60*60*1000);
  const setCookie=(res:Response,value:string,maxAge:number)=>res.cookie(cookieName,value,{httpOnly:true,secure:config.nodeEnv==='production',sameSite:'lax',path:'/',maxAge});
  async function createSession(res:Response,userId:string){
    const raw=token(),csrf=hash('csrf:'+raw),expiresAt=new Date(Date.now()+7*24*3600*1000);
    await db.workspaceSession.create({data:{userId,tokenHash:hash(raw),csrfHash:hash(csrf),expiresAt}});setCookie(res,raw,7*24*3600*1000);return {csrfToken:csrf,expiresAt};
  }
  router.post('/auth/login',wrap(async(req,res)=>{
    origin(req);const body=z.object({email,password:z.string().min(1).max(128)}).strict().parse(req.body);
    const key=body.email.toLowerCase();if(!loginFailures.take(key))throw new HttpError(429,'TOO_MANY_ATTEMPTS');
    const user=await db.workspaceUser.findUnique({where:{email:body.email}});
    if(!await passwordMatches(body.password,user?.passwordHash??null)||!user)throw new HttpError(401,'INVALID_CREDENTIALS');
    loginFailures.reset(key);
    await audit(db,user.id,'LOGIN');res.json(await createSession(res,user.id));
  }));
  router.post('/auth/register',wrap(async(req,res)=>{
    origin(req);
    const body=z.object({email,name:z.string().trim().min(1).max(120),password,confirmPassword:z.string().max(128)}).strict().parse(req.body);
    if(body.password!==body.confirmPassword)throw new HttpError(400,'PASSWORD_CONFIRMATION_MISMATCH');
    if(!registerPerEmail.take(body.email.toLowerCase())||!registerTotal.take('all'))throw new HttpError(429,'TOO_MANY_ATTEMPTS');
    const encoded=await passwordHash(body.password);
    let userId:string;
    try{userId=await db.$transaction(async tx=>{
      // Registration never claims an existing pilot/invited account or grants platform review.
      const user=await tx.workspaceUser.create({data:{email:body.email,name:body.name,passwordHash:encoded,platformReviewer:false}});
      const organization=await tx.workspaceOrganization.create({data:{name:'Không gian của '+body.name}});
      await tx.workspaceMembership.create({data:{userId:user.id,organizationId:organization.id,role:'OWNER'}});
      await audit(tx,user.id,'ACCOUNT_REGISTERED',user.id,organization.id);
      return user.id;
    });}catch(e){if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2002')throw new HttpError(409,'EMAIL_ALREADY_REGISTERED');throw e;}
    res.status(201).json(await createSession(res,userId));
  }));
  router.get('/auth/me',wrap(async(req,res)=>{
    const s=await session(req),csrf=hash('csrf:'+cookieValue(req.headers.cookie,cookieName));
    const memberships=await db.workspaceMembership.findMany({where:{userId:s.userId},select:{role:true,organization:{select:{id:true,name:true}}}});
    res.json({user:{id:s.userId,email:s.user.email,name:s.user.name,platformReviewer:s.user.platformReviewer},memberships,csrfToken:csrf,expiresAt:s.expiresAt});
  }));
  router.post('/auth/logout',wrap(async(req,res)=>{const s=await mutation(req);await db.$transaction(async tx=>{await tx.workspaceSession.update({where:{id:s.id},data:{revokedAt:new Date()}});await audit(tx,s.userId,'LOGOUT');});setCookie(res,'',0);res.json({ok:true});}));
  router.post('/auth/revoke-all',wrap(async(req,res)=>{const s=await mutation(req);await db.$transaction(async tx=>{await tx.workspaceSession.updateMany({where:{userId:s.userId,revokedAt:null},data:{revokedAt:new Date()}});await audit(tx,s.userId,'REVOKE_ALL');});setCookie(res,'',0);res.json({ok:true});}));
  router.post('/auth/activate',wrap(async(req,res)=>{
    origin(req);const body=z.object({token:z.string().min(20).max(100),password,name:z.string().trim().min(1).max(120)}).strict().parse(req.body);
    const encoded=await passwordHash(body.password);
    const userId=await db.$transaction(async tx=>{
      const t=await tx.workspaceAccessToken.findUnique({where:{tokenHash:hash(body.token)}});
      if(!t||t.usedAt||t.expiresAt<=new Date())throw new HttpError(400,'INVALID_OR_EXPIRED_TOKEN');
      const used=await tx.workspaceAccessToken.updateMany({where:{id:t.id,usedAt:null,expiresAt:{gt:new Date()}},data:{usedAt:new Date()}});if(used.count!==1)throw new HttpError(400,'INVALID_OR_EXPIRED_TOKEN');
      let user=await tx.workspaceUser.findUnique({where:{email:t.email}});
      if(t.kind==='INVITE'&&user?.passwordHash)throw new HttpError(409,'USE_EXISTING_ACCOUNT');
      if(!user)user=await tx.workspaceUser.create({data:{email:t.email,name:body.name,passwordHash:encoded}});
      else user=await tx.workspaceUser.update({where:{id:user.id},data:{passwordHash:encoded,name:body.name}});
      if(t.organizationId&&t.role)await tx.workspaceMembership.upsert({where:{userId_organizationId:{userId:user.id,organizationId:t.organizationId}},create:{userId:user.id,organizationId:t.organizationId,role:t.role},update:{}});
      await tx.workspaceSession.updateMany({where:{userId:user.id,revokedAt:null},data:{revokedAt:new Date()}});
      await audit(tx,user.id,t.kind==='RESET'?'PASSWORD_RESET':'ACCOUNT_ACTIVATED',t.id,t.organizationId??undefined);return user.id;
    });res.json(await createSession(res,userId));
  }));
  router.post('/auth/accept-invite',wrap(async(req,res)=>{const s=await mutation(req),body=z.object({token:z.string().min(20).max(100)}).strict().parse(req.body);
    await db.$transaction(async tx=>{const t=await tx.workspaceAccessToken.findUnique({where:{tokenHash:hash(body.token)}});
      if(!t||t.kind!=='INVITE'||t.email!==s.user.email||!t.organizationId||!t.role||t.usedAt||t.expiresAt<=new Date())throw new HttpError(400,'INVALID_OR_EXPIRED_TOKEN');
      const used=await tx.workspaceAccessToken.updateMany({where:{id:t.id,usedAt:null,expiresAt:{gt:new Date()}},data:{usedAt:new Date()}});if(used.count!==1)throw new HttpError(400,'INVALID_OR_EXPIRED_TOKEN');
      await tx.workspaceMembership.upsert({where:{userId_organizationId:{userId:s.userId,organizationId:t.organizationId}},create:{userId:s.userId,organizationId:t.organizationId,role:t.role},update:{}});await audit(tx,s.userId,'INVITE_ACCEPTED',t.id,t.organizationId);
    });res.json({ok:true});
  }));
  router.get('/organizations/:id/members',wrap(async(req,res)=>{const s=await session(req),id=uuid.parse(req.params.id);await member(db,s.userId,id);res.json({items:await db.workspaceMembership.findMany({where:{organizationId:id},select:{id:true,role:true,user:{select:{id:true,email:true,name:true}}}})});}));
  router.post('/organizations/:id/invites',wrap(async(req,res)=>{
    const s=await mutation(req),id=uuid.parse(req.params.id),body=z.object({email,role:z.enum(['EDITOR','VIEWER'])}).strict().parse(req.body),raw=token();
    await db.$transaction(async tx=>{await member(tx,s.userId,id,true,true);await tx.workspaceAccessToken.create({data:{tokenHash:hash(raw),kind:'INVITE',email:body.email,organizationId:id,role:body.role,expiresAt:new Date(Date.now()+48*3600*1000)}});await audit(tx,s.userId,'INVITE_CREATED',undefined,id);});res.status(201).json({token:raw,expiresInHours:48});
  }));
  router.patch('/organizations/:id/members/:memberId',wrap(async(req,res)=>{const s=await mutation(req),id=uuid.parse(req.params.id),mid=uuid.parse(req.params.memberId),body=z.object({role:z.enum(['EDITOR','VIEWER'])}).strict().parse(req.body);
    await db.$transaction(async tx=>{await member(tx,s.userId,id,true,true);const m=await tx.workspaceMembership.findFirst({where:{id:mid,organizationId:id}});if(!m)throw new HttpError(404,'MEMBER_NOT_FOUND');if(m.role==='OWNER')throw new HttpError(409,'OWNER_PROTECTED');await tx.workspaceMembership.update({where:{id:mid},data:body});await audit(tx,s.userId,'MEMBER_ROLE_CHANGED',mid,id);});res.json({ok:true});
  }));
  router.get('/organizations/:id/audit',wrap(async(req,res)=>{const s=await session(req),id=uuid.parse(req.params.id);await member(db,s.userId,id,false,true);res.json({items:await db.workspaceAudit.findMany({where:{organizationId:id},orderBy:{createdAt:'desc'},take:100})});}));
  router.get('/companies',wrap(async(req,res)=>{const s=await session(req);res.json({items:await db.workspaceCompany.findMany({where:{organization:{memberships:{some:{userId:s.userId}}}},select:{id:true,organizationId:true,taxId:true,version:true,profileJson:true},take:100,orderBy:{updatedAt:'desc'}})});}));
  router.post('/companies',wrap(async(req,res)=>{const s=await mutation(req),body=companyInput.parse(req.body),facts=confirmedFacts(body.facts,s.userId);
    const row=await db.$transaction(async tx=>{await member(tx,s.userId,body.organizationId,true);
      const observation=body.registryObservationId?await tx.workspaceRegistryObservation.findFirst({where:{id:body.registryObservationId,userId:s.userId,taxId:body.profile.taxId}}):null;
      if(body.registryObservationId&&!observation)throw new HttpError(400,'REGISTRY_OBSERVATION_NOT_FOUND');
      const profile={...body.profile,sourceProvenance:observation?{observationId:observation.id,source:observation.provenanceJson}:{provider:'USER_INPUT',verified:false}};
      const c=await tx.workspaceCompany.create({data:{organizationId:body.organizationId,taxId:body.profile.taxId,profileJson:profile,factsJson:facts}});
      await tx.workspaceProfileVersion.create({data:{companyId:c.id,version:1,profileJson:profile,factsJson:facts,actorId:s.userId}});await audit(tx,s.userId,'COMPANY_CREATED',c.id,c.organizationId);await enqueueCompanyRefresh(tx,c.id,s.userId);return c;});res.status(201).json(row);
  }));
  router.get('/companies/:id',wrap(async(req,res)=>{const s=await session(req),row=await company(db,s.userId,req.params.id as string);res.json(row);}));
  router.put('/companies/:id/profile',wrap(async(req,res)=>{const s=await mutation(req),body=profileInput.parse(req.body);
    const row=await db.$transaction(async tx=>{const c=await company(tx,s.userId,req.params.id as string,true);
      if(body.profile.taxId!==c.taxId)throw new HttpError(400,'TAX_ID_IMMUTABLE');
      const profile={...body.profile,sourceProvenance:(c.profileJson as any).sourceProvenance},facts=confirmedFacts(body.facts,s.userId,c.factsJson as Record<string,any>);
      const count=await tx.workspaceCompany.updateMany({where:{id:c.id,version:body.expectedVersion},data:{version:{increment:1},profileJson:profile,factsJson:facts}});if(count.count!==1)throw new HttpError(409,'PROFILE_VERSION_CONFLICT');
      await tx.workspaceProfileVersion.create({data:{companyId:c.id,version:body.expectedVersion+1,profileJson:profile,factsJson:facts,actorId:s.userId}});await audit(tx,s.userId,'PROFILE_UPDATED',c.id,c.organizationId);await enqueueCompanyRefresh(tx,c.id,s.userId);return tx.workspaceCompany.findUniqueOrThrow({where:{id:c.id}});});res.json(row);
  }));
  router.get('/companies/:id/profiles',wrap(async(req,res)=>{const s=await session(req),c=await company(db,s.userId,req.params.id as string);res.json({items:await db.workspaceProfileVersion.findMany({where:{companyId:c.id},orderBy:{version:'desc'},take:50})});}));
  router.get('/companies/:id/sites',wrap(async(req,res)=>{const s=await session(req),c=await company(db,s.userId,req.params.id as string);res.json({items:await db.workspaceSite.findMany({where:{companyId:c.id},orderBy:{createdAt:'asc'},take:100})});}));
  router.post('/companies/:id/sites',wrap(async(req,res)=>{const s=await mutation(req),body=siteSchema.parse(req.body);const row=await db.$transaction(async tx=>{const c=await company(tx,s.userId,req.params.id as string,true);const site=await tx.workspaceSite.create({data:{companyId:c.id,...body}});await audit(tx,s.userId,'SITE_CREATED',site.id,c.organizationId);await enqueueCompanyRefresh(tx,c.id,s.userId);return site;});res.status(201).json(row);}));
  router.put('/companies/:id/sites/:siteId',wrap(async(req,res)=>{const s=await mutation(req),body=siteSchema.extend({expectedVersion:z.number().int().positive()}).parse(req.body),sid=uuid.parse(req.params.siteId);
    const row=await db.$transaction(async tx=>{const c=await company(tx,s.userId,req.params.id as string,true),{expectedVersion,...data}=body;if(!await tx.workspaceSite.findFirst({where:{id:sid,companyId:c.id}}))throw new HttpError(404,'SITE_NOT_FOUND');const result=await tx.workspaceSite.updateMany({where:{id:sid,companyId:c.id,version:expectedVersion},data:{...data,version:{increment:1}}});if(result.count!==1)throw new HttpError(409,'SITE_VERSION_CONFLICT');await audit(tx,s.userId,'SITE_UPDATED',sid,c.organizationId);await enqueueCompanyRefresh(tx,c.id,s.userId);return tx.workspaceSite.findUniqueOrThrow({where:{id:sid}});});res.json(row);
  }));
  router.get('/companies/:id/events',wrap(async(req,res)=>{const s=await session(req),c=await company(db,s.userId,req.params.id as string);res.json({items:await db.workspaceCompanyEvent.findMany({where:{companyId:c.id},orderBy:{occurredOn:'desc'},take:100})});}));
  router.post('/companies/:id/events',wrap(async(req,res)=>{const s=await mutation(req),body=eventSchema.parse(req.body);const row=await db.$transaction(async tx=>{const c=await company(tx,s.userId,req.params.id as string,true);const event=await tx.workspaceCompanyEvent.create({data:{companyId:c.id,...body,occurredOn:new Date(body.occurredOn),actorId:s.userId}});await audit(tx,s.userId,'EVENT_RECORDED',event.id,c.organizationId);await enqueueCompanyRefresh(tx,c.id,s.userId);return event;});res.status(201).json(row);}));
  router.get('/registry/:taxId',wrap(async(req,res)=>{await session(req);const id=taxId.parse(req.params.taxId);
    try{const r=await fetch(`https://api.vietqr.io/v2/business/${encodeURIComponent(id)}`,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const p=await r.json() as any;
      if(p.code!=='00'||!p.data?.name||taxId.safeParse(p.data.id).data!==id)throw Error();const text=(v:unknown)=>typeof v==='string'?v.trim().slice(0,2000):'';
      const s=await session(req),profile={taxId:id,name:text(p.data.name),shortName:text(p.data.shortName),internationalName:text(p.data.internationalName),address:text(p.data.address),status:text(p.data.status)},provenance={provider:'VietQR / CASSO',url:'https://vietqr.io/danh-sach-api/tax-id-lookup/',retrievedAt:new Date().toISOString(),verified:false};
      const observation=await db.workspaceRegistryObservation.create({data:{userId:s.userId,taxId:id,profileJson:profile,provenanceJson:provenance}});res.json({profile,provenance,observationId:observation.id,manualFallback:true});
    }catch{res.status(503).json({error:'REGISTRY_UNAVAILABLE',manualFallback:true});}
  }));
  router.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{
    if(error instanceof z.ZodError){res.status(400).json({error:'INVALID_REQUEST',fields:error.issues.map(x=>x.path.join('.'))});return;}
    if(error instanceof HttpError){res.status(error.status).json({error:error.code});return;}
    if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002'){res.status(409).json({error:'ALREADY_EXISTS'});return;}
    res.status(500).json({error:'WORKSPACE_UNAVAILABLE'});
  });return router;
}
