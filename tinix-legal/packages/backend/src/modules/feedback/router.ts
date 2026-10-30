import {Router,type Request,type Response,type NextFunction} from 'express';
import {Prisma,type PrismaClient} from '@prisma/client';
import {z} from 'zod';
import type {MvpConfig} from '../operations/config.js';
import {workspaceAccess,HttpError} from '../workspace/access.js';
import {feedbackCreate,feedbackReply,feedbackReview,feedbackQuery} from './contracts.js';

const uuid=z.string().uuid(),PAGE=10;
const categoryTitles:Record<string,string>={NOT_RELEVANT:'Công việc không phù hợp',UNCLEAR:'Cần giải thích thêm',CONTENT:'Nội dung cần kiểm tra',DEADLINE:'Thời hạn cần kiểm tra',TECHNICAL:'Lỗi thao tác',OTHER:'Góp ý khác'};
export function createFeedbackRouter(db:PrismaClient,config:MvpConfig){
 const r=Router(),{session,mutation,reviewer,company,audit}=workspaceAccess(db,config);
 const wrap=(fn:(req:Request,res:Response)=>Promise<unknown>)=>(req:Request,res:Response,next:NextFunction)=>void fn(req,res).catch(next);
 const reportId=(req:Request)=>uuid.parse(req.params.id);
 async function authorized(req:Request,write=false,admin=false){
  const s=await (admin?reviewer(req,write):write?mutation(req):session(req));
  const row=await db.workspaceFeedback.findUnique({where:{id:reportId(req)}});if(!row)throw new HttpError(404,'FEEDBACK_NOT_FOUND');
  if(!admin)await company(db,s.userId,row.companyId);
  return {s,row};
 }
 async function list(req:Request,res:Response,admin=false){
  let companyId:string|undefined;if(admin)await reviewer(req);else{const s=await session(req);companyId=(await company(db,s.userId,uuid.parse(req.params.id))).id;}
  const input=feedbackQuery.parse(req.query),scope={...(companyId?{companyId}:{})};
  const where:Prisma.WorkspaceFeedbackWhereInput={...scope,...(input.status!=='all'?{status:input.status}:{}),...(input.category!=='all'?{category:input.category}:{}),...(input.q?{OR:[{title:{contains:input.q,mode:'insensitive'}},{messages:{some:{body:{contains:input.q,mode:'insensitive'}}}}]}:{})};
  const [items,total,counts]=await Promise.all([
   db.workspaceFeedback.findMany({where,orderBy:[{updatedAt:'desc'},{id:'desc'}],skip:input.page*PAGE,take:PAGE,include:{creator:{select:{name:true}},company:{select:{profileJson:true}},messages:{orderBy:[{createdAt:'asc'},{id:'asc'}],take:1,select:{body:true}},_count:{select:{messages:true}}}}),
   db.workspaceFeedback.count({where}),db.workspaceFeedback.groupBy({by:['status'],where:scope,_count:true})
  ]);
  res.json({items:items.map(({company,creator,messages,_count,...x})=>({...x,companyName:(company.profileJson as any)?.name??'Doanh nghiệp',authorName:creator.name,preview:messages[0]?.body.slice(0,180)??'',messageCount:_count.messages})),total,page:input.page,pageSize:PAGE,counts:Object.fromEntries(counts.map(x=>[x.status,x._count]))});
 }
 r.get('/companies/:id/feedback',wrap((req,res)=>list(req,res)));
 r.get('/admin/feedback',wrap((req,res)=>list(req,res,true)));
 r.post('/companies/:id/feedback',wrap(async(req,res)=>{
  const s=await mutation(req),input=feedbackCreate.parse(req.body),companyId=uuid.parse(req.params.id);
  const row=await db.$transaction(async tx=>{
   const c=await company(tx,s.userId,companyId);await tx.$queryRaw`SELECT id FROM "WorkspaceCompany" WHERE id=${c.id} FOR UPDATE`;
   const existing=await tx.workspaceFeedback.findUnique({where:{companyId_requestId:{companyId,requestId:input.requestId}},include:{messages:{orderBy:[{createdAt:'asc'},{id:'asc'}],take:1}}});
   if(existing){if(existing.creatorId!==s.userId||existing.category!==input.category||existing.taskId!==(input.taskId??null)||existing.title!==(input.title??categoryTitles[input.category])||existing.messages[0]?.body!==input.body)throw new HttpError(409,'REQUEST_ID_REUSED');return existing;}
   const task=input.taskId?await tx.complianceTask.findFirst({where:{id:input.taskId,companyId},include:{basis:{select:{contentJson:true}}}}):null;
   if(input.taskId&&!task)throw new HttpError(404,'TASK_NOT_FOUND');
   const context=task?{taskTitle:task.title,basisVersionId:task.basisVersionId,group:(task.basis.contentJson as any).group,periodKey:task.periodKey,taskRevision:task.revision,taskStatus:task.status,applicability:task.applicability,dueDate:task.dueDate?.toISOString().slice(0,10)??null,dueDateKind:task.dueDateKind}:{};
   const row=await tx.workspaceFeedback.create({data:{companyId,creatorId:s.userId,requestId:input.requestId,taskId:task?.id,category:input.category,title:input.title??categoryTitles[input.category],contextJson:context,messages:{create:{authorId:s.userId,requestId:input.requestId,actorRole:'COMPANY',body:input.body,statusAfter:'OPEN'}}}});
   await audit(tx,s.userId,'FEEDBACK_CREATED',row.id,c.organizationId);return row;
  });res.status(201).json({id:row.id,status:row.status,revision:row.revision});
 }));
 async function detail(req:Request,res:Response,admin=false){
  const {row}=await authorized(req,false,admin),before=z.string().uuid().optional().parse(req.query.before);
  const cursor=before?await db.workspaceFeedbackMessage.findFirst({where:{id:before,feedbackId:row.id},select:{id:true,createdAt:true}}):null;
  if(before&&!cursor)throw new HttpError(400,'INVALID_CURSOR');
  const [messages,creator,c]=await Promise.all([
   db.workspaceFeedbackMessage.findMany({where:{feedbackId:row.id,...(cursor?{OR:[{createdAt:{lt:cursor.createdAt}},{createdAt:cursor.createdAt,id:{lt:cursor.id}}]}:{})},include:{author:{select:{name:true}}},orderBy:[{createdAt:'desc'},{id:'desc'}],take:51}),
   db.workspaceUser.findUniqueOrThrow({where:{id:row.creatorId},select:{name:true}}),db.workspaceCompany.findUniqueOrThrow({where:{id:row.companyId},select:{profileJson:true}})
  ]);
  res.json({...row,companyName:(c.profileJson as any).name,authorName:creator.name,messages:messages.slice(0,50).reverse().map(({author,...m})=>({...m,authorName:author.name})),olderCursor:messages.length>50?messages[49].id:null});
 }
 r.get('/feedback/:id',wrap((req,res)=>detail(req,res)));
 r.get('/admin/feedback/:id',wrap((req,res)=>detail(req,res,true)));
 async function reply(req:Request,res:Response,admin=false){
  const {s,row}=await authorized(req,true,admin),input=(admin?feedbackReview:feedbackReply).parse(req.body);
  const result=await db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT id FROM "WorkspaceFeedback" WHERE id=${row.id} FOR UPDATE`;
   if(!admin)await company(tx,s.userId,row.companyId);
   const current=await tx.workspaceFeedback.findUniqueOrThrow({where:{id:row.id}}),old=await tx.workspaceFeedbackMessage.findUnique({where:{feedbackId_requestId:{feedbackId:row.id,requestId:input.requestId}}});
   if(old){if(old.authorId!==s.userId||old.body!==input.body||old.actorRole!==(admin?'REVIEWER':'COMPANY')||admin&&old.statusAfter!==(input as z.infer<typeof feedbackReview>).status)throw new HttpError(409,'REQUEST_ID_REUSED');return current;}
   if(current.revision!==input.expectedRevision)throw new HttpError(409,'REVISION_CONFLICT');
   const status=admin?(input as z.infer<typeof feedbackReview>).status:['RESOLVED','DECLINED'].includes(current.status)?'OPEN':current.status;
   await tx.workspaceFeedbackMessage.create({data:{feedbackId:row.id,authorId:s.userId,requestId:input.requestId,actorRole:admin?'REVIEWER':'COMPANY',body:input.body,statusAfter:status}});
   const updated=await tx.workspaceFeedback.update({where:{id:row.id},data:{status,revision:{increment:1}}});
   const c=await tx.workspaceCompany.findUniqueOrThrow({where:{id:row.companyId},select:{organizationId:true}});await audit(tx,s.userId,admin?'FEEDBACK_REVIEWED':'FEEDBACK_REPLIED',row.id,c.organizationId);return updated;
  });res.json({id:result.id,status:result.status,revision:result.revision});
 }
 r.post('/feedback/:id/messages',wrap((req,res)=>reply(req,res)));
 r.post('/admin/feedback/:id/messages',wrap((req,res)=>reply(req,res,true)));
 r.use((e:unknown,_req:Request,res:Response,_next:NextFunction)=>{if(res.headersSent)return;if(e instanceof HttpError){res.status(e.status).json({error:e.code});return;}if(e instanceof z.ZodError){res.status(400).json({error:'INVALID_REQUEST'});return;}res.status(503).json({error:'FEEDBACK_UNAVAILABLE'});});
 return r;
}
