import type {PrismaClient,Prisma} from '@prisma/client';
// Visibility is separate from immutable legal receipts and alert payloads.
export async function heldAlertIds(db:PrismaClient|Prisma.TransactionClient){
 const rows=await db.workspaceAudit.findMany({where:{action:{in:['LAW_CHANGE_ALERT_QUALITY_HOLD','LAW_CHANGE_ALERT_QUALITY_RELEASED']}},orderBy:[{createdAt:'desc'},{id:'desc'}],select:{targetId:true,action:true}});
 const latest=new Map<string,string>();for(const r of rows)if(r.targetId&&!latest.has(r.targetId))latest.set(r.targetId,r.action);
 return [...latest].filter(([,action])=>action==='LAW_CHANGE_ALERT_QUALITY_HOLD').map(([id])=>id);
}
