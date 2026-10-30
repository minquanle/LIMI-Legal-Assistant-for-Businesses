import type {Request} from 'express';
import type {Prisma,PrismaClient} from '@prisma/client';
import {z} from 'zod';
import type {MvpConfig} from '../operations/config.js';
import {hash,cookieValue} from './security.js';
export class HttpError extends Error{constructor(public status:number,public code:string){super(code);}}
export function workspaceAccess(db:PrismaClient,config:MvpConfig){
 const cookieName=config.nodeEnv==='production'?'__Host-limi_session':'limi_session';
 function origin(req:Request){if(!req.headers.origin||!config.origins.includes(req.headers.origin))throw new HttpError(403,'ORIGIN_REJECTED');}
 async function session(req:Request){const raw=cookieValue(req.headers.cookie,cookieName);if(!raw||raw.length>100)throw new HttpError(401,'LOGIN_REQUIRED');const s=await db.workspaceSession.findUnique({where:{tokenHash:hash(raw)},include:{user:true}});if(!s||s.revokedAt||s.expiresAt<=new Date())throw new HttpError(401,'LOGIN_REQUIRED');return s;}
 async function mutation(req:Request){origin(req);const s=await session(req),csrf=req.headers['x-csrf-token'];if(typeof csrf!=='string'||hash(csrf)!==s.csrfHash)throw new HttpError(403,'CSRF_REJECTED');return s;}
 async function member(tx:Prisma.TransactionClient,userId:string,organizationId:string,write=false,owner=false){const m=await tx.workspaceMembership.findUnique({where:{userId_organizationId:{userId,organizationId}}});if(!m)throw new HttpError(404,'WORKSPACE_NOT_FOUND');if(write&&m.role==='VIEWER'||owner&&m.role!=='OWNER')throw new HttpError(403,'ROLE_REJECTED');return m;}
 async function company(tx:Prisma.TransactionClient,userId:string,id:string,write=false){const row=await tx.workspaceCompany.findFirst({where:{id:z.string().uuid().parse(id),organization:{memberships:{some:{userId}}}}});if(!row)throw new HttpError(404,'COMPANY_NOT_FOUND');await member(tx,userId,row.organizationId,write);return row;}
 const audit=(tx:Prisma.TransactionClient,actorId:string,action:string,targetId?:string,organizationId?:string)=>tx.workspaceAudit.create({data:{actorId,action,targetId,organizationId}});
 async function reviewer(req:Request,write=false){const s=await (write?mutation(req):session(req));if(!s.user.platformReviewer)throw new HttpError(403,'REVIEWER_REQUIRED');return s;}
 return {cookieName,origin,session,mutation,member,company,audit,reviewer};
}
