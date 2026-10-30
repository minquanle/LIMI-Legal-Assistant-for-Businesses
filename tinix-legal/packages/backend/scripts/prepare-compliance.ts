import {PrismaClient} from '@prisma/client';
import {loadConfig} from '../src/modules/operations/config.js';
import {rankCandidates} from '../src/modules/compliance/catalogue.js';
import {email} from '../src/modules/workspace/contracts.js';
import {token,hash} from '../src/modules/workspace/security.js';
import {writeFile} from 'node:fs/promises';
const args=process.argv.slice(2),get=(key:string)=>args[args.indexOf(key)+1],config=loadConfig(),db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}});
try{
 const candidates=await rankCandidates(db,100);
 if(args.includes('--reviewer')){const target=email.parse(get('--reviewer')),output=get('--output');if(!output)throw Error('--output required');const raw=token();
 await db.$transaction(async tx=>{let user=await tx.workspaceUser.findUnique({where:{email:target}});if(user){await tx.workspaceUser.update({where:{id:user.id},data:{platformReviewer:true}});}else user=await tx.workspaceUser.create({data:{email:target,name:target.split('@')[0],platformReviewer:true}});
 if(!user.passwordHash){await tx.workspaceAccessToken.updateMany({where:{userId:user.id,usedAt:null,kind:'PILOT'},data:{usedAt:new Date()}});await tx.workspaceAccessToken.create({data:{email:target,userId:user.id,kind:'PILOT',tokenHash:hash(raw),expiresAt:new Date(Date.now()+86400000)}});await writeFile(output,JSON.stringify({email:target,activationToken:raw,activationPage:'http://127.0.0.1:3000/workspace?view=account',expiresInHours:24},null,2),{flag:'wx',mode:0o600});}
 await tx.workspaceAudit.create({data:{actorId:'pilot-operator',action:'PLATFORM_REVIEWER_GRANTED',targetId:user.id}});});}
 console.log(JSON.stringify({candidates,published:await db.obligationVersion.count({where:{status:'PUBLISHED'}}),releases:await db.catalogueRelease.count({where:{sealedAt:{not:null}}}),message:'Editorial candidates only; no automatic approvals or sample obligations.'}));
}finally{await db.$disconnect();}
