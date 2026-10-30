import {type PrismaClient,type Prisma} from '@prisma/client';
import {localDate} from '@limi/compliance-core';
import {json} from '../compliance/contracts.js';
type Tx=Prisma.TransactionClient;
export async function createAlert(tx:Tx,input:{companyId:string;key:string;kind:string;title:string;payloadJson:Prisma.InputJsonValue;taskId?:string;decisionId?:string;eventId?:string}){
 // Advisory lock makes upsert+outbox safe even when independent workers race.
 await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.key},0))::text`;
 const alert=await tx.workspaceAlert.upsert({where:{key:input.key},create:input,update:{}});
 await tx.alertOutbox.upsert({where:{alertId:alert.id},create:{alertId:alert.id},update:{}});
 return alert;
}
export async function generateReminders(db:PrismaClient,now=new Date()){
 const today=localDate(now),date=new Date(today),rows=await db.complianceTask.findMany({where:{status:{notIn:['DONE','NOT_APPLICABLE']},applicability:'APPLY',dueDate:{not:null}},select:{id:true},orderBy:{id:'asc'}});
 for(const row of rows)await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "ComplianceTask" WHERE id=${row.id} FOR UPDATE`;
  const t=await tx.complianceTask.findUniqueOrThrow({where:{id:row.id}});if(['DONE','NOT_APPLICABLE'].includes(t.status)||t.applicability!=='APPLY')return;
  const setting=await tx.companyReminderSetting.findUnique({where:{companyId:t.companyId}});if(setting?.enabled===false)return;
  // The engine decision preserves the legal date even if the user sets another task date.
  const d=await tx.complianceDecision.findUniqueOrThrow({where:{id:t.decisionId}}),legal=d.dueDate,prep=setting?.preparationDays??7;
  const deadlines=[...(legal?[{kind:'LEGAL',date:legal}]:[]),...(t.dueDateKind==='USER'&&t.dueDate?[{kind:'USER',date:t.dueDate}]:[])];
  for(const deadline of deadlines){const days=Math.round((deadline.date.getTime()-date.getTime())/86400000);
   const stage=days===0?'DUE':days>0&&days<=prep?'PREPARE':days<0?'OVERDUE:'+Math.floor((-days-1)/7):null;if(!stage)continue;
   const due=deadline.date.toISOString().slice(0,10);
   await createAlert(tx,{companyId:t.companyId,taskId:t.id,decisionId:d.id,key:JSON.stringify(['reminder',t.id,t.basisVersionId,deadline.kind,due,stage]),kind:'REMINDER',title:stage==='PREPARE'?'Chuẩn bị: '+t.title:stage==='DUE'?'Đến hạn: '+t.title:'Quá hạn: '+t.title,payloadJson:json({stage,timezone:'Asia/Ho_Chi_Minh',reminderDate:today,deadlineKind:deadline.kind,deadline:due,legalDeadline:legal?.toISOString().slice(0,10)??null,userDeadline:t.dueDateKind==='USER'?t.dueDate?.toISOString().slice(0,10):null,basisVersionId:t.basisVersionId,action:'Mở công việc để kiểm tra tiến độ và thực hiện.',explanation:deadline.kind==='LEGAL'?'Ngày tính theo quy tắc nghĩa vụ đã duyệt.':'Ngày do doanh nghiệp tự đặt, không thay thế hạn pháp lý.'})});
  }
 });
}
export async function dispatchAlerts(db:PrismaClient,now=new Date()){
 const rows=await db.alertOutbox.findMany({where:{deliveredAt:null,nextAttemptAt:{lte:now},attempts:{lt:10}},orderBy:{createdAt:'asc'},take:50});
 for(const row of rows){try{await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "AlertOutbox" WHERE id=${row.id} FOR UPDATE`;
  const item=await tx.alertOutbox.findUniqueOrThrow({where:{id:row.id}});if(item.deliveredAt||item.nextAttemptAt>now)return;
  const a=await tx.workspaceAlert.findUniqueOrThrow({where:{id:item.alertId}});
  const task=a.taskId?await tx.complianceTask.findUnique({where:{id:a.taskId}}):null;
  const setting=a.kind==='REMINDER'?await tx.companyReminderSetting.findUnique({where:{companyId:a.companyId}}):null,payload=a.payloadJson as any;
  const decision=task?await tx.complianceDecision.findUnique({where:{id:task.decisionId}}):null;
  const actual=payload.deadlineKind==='LEGAL'?decision?.dueDate:task?.dueDateKind==='USER'?task.dueDate:null;
  const result=a.kind==='REMINDER'&&(!task||['DONE','NOT_APPLICABLE'].includes(task.status)||task.applicability!=='APPLY'||setting?.enabled===false||task.basisVersionId!==payload.basisVersionId||actual?.toISOString().slice(0,10)!==payload.deadline)?'SUPPRESSED':'DELIVERED';
  // IN_APP is the only implemented channel. No email/SMS transport or external send.
  await tx.alertDeliveryAttempt.create({data:{outboxId:item.id,attempt:item.attempts+1,result}});
  await tx.alertOutbox.update({where:{id:item.id},data:{attempts:{increment:1},deliveredAt:now,errorCode:result==='SUPPRESSED'?'TASK_INACTIVE':null}});
 });}catch{await db.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM "AlertOutbox" WHERE id=${row.id} FOR UPDATE`;const item=await tx.alertOutbox.findUniqueOrThrow({where:{id:row.id}});if(item.deliveredAt)return;await tx.alertDeliveryAttempt.create({data:{outboxId:item.id,attempt:item.attempts+1,result:'FAILED'}});await tx.alertOutbox.update({where:{id:item.id},data:{attempts:{increment:1},errorCode:'DELIVERY_FAILED',nextAttemptAt:new Date(now.getTime()+Math.min(3600000,1000*2**item.attempts))}});});}}
}
