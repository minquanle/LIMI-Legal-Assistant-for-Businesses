import {PrismaClient} from '@prisma/client';
import {loadConfig} from '../src/modules/operations/config.js';
import {hash,token} from '../src/modules/workspace/security.js';
import {email} from '../src/modules/workspace/contracts.js';
import {writeFile} from 'node:fs/promises';
const args=process.argv.slice(2),get=(key:string)=>args[args.indexOf(key)+1];
if(!args.includes('--email')||!args.includes('--output'))throw Error('Use --email <email> --organization <name> --output <private-file> [--reset]');
const target=email.parse(get('--email')),raw=token(),config=loadConfig(),db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}});
try{
  await db.$transaction(async tx=>{
    const reset=args.includes('--reset');let user=await tx.workspaceUser.findUnique({where:{email:target}});
    if(reset&&!user)throw Error('Account not found');if(!reset&&user)throw Error('Account exists: use --reset');
    if(!user)user=await tx.workspaceUser.create({data:{email:target,name:target.split('@')[0]}});
    let organizationId:string|undefined;
    if(!reset){if(!args.includes('--organization'))throw Error('--organization required');const org=await tx.workspaceOrganization.create({data:{name:get('--organization')}});organizationId=org.id;await tx.workspaceMembership.create({data:{userId:user.id,organizationId,role:'OWNER'}});}
    await tx.workspaceAccessToken.updateMany({where:{userId:user.id,usedAt:null,kind:{in:['PILOT','RESET']}},data:{usedAt:new Date()}});
    await tx.workspaceAccessToken.create({data:{email:target,userId:user.id,organizationId,role:organizationId?'OWNER':undefined,tokenHash:hash(raw),kind:reset?'RESET':'PILOT',expiresAt:new Date(Date.now()+24*3600*1000)}});
    await tx.workspaceAudit.create({data:{actorId:'pilot-operator',organizationId,action:reset?'RESET_ISSUED':'PILOT_ISSUED',targetId:user.id}});
    await writeFile(get('--output'),JSON.stringify({email:target,activationToken:raw,activationPage:'http://127.0.0.1:3000/workspace?view=account',expiresInHours:24},null,2),{flag:'wx',mode:0o600});
  });
  // Token is deliberately excluded from terminal output and audit. Never overwrite a credential file.
  console.log('One-time activation saved to the requested private file.');
}finally{await db.$disconnect();}
