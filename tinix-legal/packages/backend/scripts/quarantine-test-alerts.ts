import {PrismaClient} from '@prisma/client';
import {writeFile} from 'node:fs/promises';
import {loadConfig} from '../src/modules/operations/config.js';
import {heldAlertIds} from '../src/modules/changes/quality-hold.js';
import {readableReviewText} from '../src/modules/changes/text-quality.js';
const config=loadConfig();if(new URL(config.databaseUrl).pathname!=='/limi_dev')throw Error('LOCAL_DEV_REQUIRED');
const db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}}),apply=process.argv.includes('--apply'),out=process.argv.find(x=>x.endsWith('.json'));
if(!out)throw Error('Provide a JSON report path; --apply is optional.');
try{
 const held=new Set(await heldAlertIds(db));
 const events=await db.approvedLawChange.findMany();const invalid=events.filter(e=>![e.whatChanged,e.why,e.action].every(readableReviewText));
 const alerts=await db.workspaceAlert.findMany({where:{eventId:{in:invalid.map(e=>e.id)}}});
 // Preserve exact previous payloads in the report before making a reversible visibility change.
 await writeFile(out,JSON.stringify({applied:false,plannedApply:apply,reason:'Mechanical text quality check; legal content requires fresh human review',events:invalid.map(e=>({id:e.id,whatChanged:e.whatChanged,why:e.why,action:e.action})),alerts},null,2));
 if(apply)await db.$transaction(async tx=>{for(const row of alerts){if(held.has(row.id))continue;await tx.workspaceAudit.create({data:{actorId:'local-quality-operator',action:'LAW_CHANGE_ALERT_QUALITY_HOLD',targetId:row.id}});}});
 await writeFile(out,JSON.stringify({applied:apply,visibilityOnly:true,immutableReceiptsUnchanged:true,events:invalid.map(e=>({id:e.id,whatChanged:e.whatChanged,why:e.why,action:e.action})),alerts},null,2));
 console.log(JSON.stringify({applied:apply,events:invalid.length,alerts:alerts.length,deleted:0}));
}finally{await db.$disconnect();}
