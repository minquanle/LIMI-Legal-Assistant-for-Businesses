import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
export async function verifyFeedbackCases({db,req,owner,viewer,other,reviewer,company,base,password,root,run}:any){
 let checks=0;const task=await db.complianceTask.findFirstOrThrow({where:{companyId:company.id,scopeKey:'company'},orderBy:{createdAt:'asc'},include:{evidence:true}}),before=JSON.stringify(task);
 const path='/companies/'+company.id+'/feedback',input={requestId:randomUUID(),taskId:task.id,category:'NOT_RELEVANT',body:'Công việc này có vẻ không phù hợp. Nhờ LIMI kiểm tra giúp.'};
 await req({},path,'GET',undefined,401);await req(other,path,'GET',undefined,404);await req(owner,'/admin/feedback','GET',undefined,403);await req(owner,path,'POST',input,403,{'x-csrf-token':'invalid'});checks+=4;
 await req(owner,path,'POST',{...input,taskId:randomUUID()},404);await req(owner,path,'POST',{...input,category:'INVALID'},400);await req(owner,path,'POST',{...input,status:'RESOLVED'},400);checks+=3;
 const report=await req(owner,path,'POST',input,201),replay=await req(owner,path,'POST',input,201);assert.equal(replay.id,report.id);assert.equal(await db.workspaceFeedbackMessage.count({where:{feedbackId:report.id}}),1);checks+=2;
 await req(owner,path,'POST',{...input,body:'Changed payload with same request ID'},409);await req(other,'/feedback/'+report.id,'GET',undefined,404);await req(other,'/feedback/'+report.id+'/messages','POST',{requestId:randomUUID(),expectedRevision:1,body:'Not authorized'},404);checks+=3;
 await req(owner,path,'POST',{...input,title:'A different title with the same request ID'},409);checks++;
 const visible=await req(reviewer,'/admin/feedback/'+report.id);assert.equal(visible.status,'OPEN');assert.equal(visible.contextJson.basisVersionId,task.basisVersionId);assert.equal(visible.contextJson.taskTitle,task.title);assert.equal(visible.messages[0].body,input.body);assert.equal('profileJson'in visible,false);checks+=5;
 await req(reviewer,'/tasks/'+task.id,'GET',undefined,404);checks++;
 const reply={requestId:randomUUID(),expectedRevision:1,status:'IN_REVIEW',body:'LIMI đã tiếp nhận và đang kiểm tra phạm vi áp dụng.'};
 await req(owner,'/admin/feedback/'+report.id+'/messages','POST',reply,403);await req(reviewer,'/admin/feedback/'+report.id+'/messages','POST',{...reply,body:''},400);checks+=2;
 const reviewed=await req(reviewer,'/admin/feedback/'+report.id+'/messages','POST',reply);assert.equal(reviewed.status,'IN_REVIEW');assert.equal(reviewed.revision,2);await req(reviewer,'/admin/feedback/'+report.id+'/messages','POST',reply);assert.equal(await db.workspaceFeedbackMessage.count({where:{feedbackId:report.id}}),2);checks+=3;
 const read=await req(viewer,'/feedback/'+report.id);assert.equal(read.messages.at(-1).actorRole,'REVIEWER');assert.equal(read.messages.at(-1).body,reply.body);checks+=2;
 await req(owner,'/feedback/'+report.id+'/messages','POST',{requestId:randomUUID(),expectedRevision:1,body:'Stale reply'},409);await req(owner,'/feedback/'+report.id+'/messages','POST',{requestId:randomUUID(),expectedRevision:2,status:'RESOLVED',body:'Cannot set reviewer status'},400);checks+=2;
 const done=await req(reviewer,'/admin/feedback/'+report.id+'/messages','POST',{requestId:randomUUID(),expectedRevision:2,status:'RESOLVED',body:'Đã kiểm tra và hướng dẫn doanh nghiệp xử lý.'});assert.equal(done.revision,3);checks++;
 const reopen=await req(viewer,'/feedback/'+report.id+'/messages','POST',{requestId:randomUUID(),expectedRevision:3,body:'Tôi có thông tin bổ sung, nhờ kiểm tra lại.'});assert.equal(reopen.status,'OPEN');checks++;
 assert.equal(JSON.stringify(await db.complianceTask.findUniqueOrThrow({where:{id:task.id},include:{evidence:true}})),before);checks++;
 await assert.rejects(db.workspaceFeedback.update({where:{id:report.id},data:{contextJson:{tampered:true}}}));
 const message=await db.workspaceFeedbackMessage.findFirstOrThrow({where:{feedbackId:report.id}});await assert.rejects(db.workspaceFeedbackMessage.update({where:{id:message.id},data:{body:'tampered'}}));checks+=2;
 // Read-only company users may report a problem; this does not grant task-edit rights.
 const readonly=await req(viewer,path,'POST',{requestId:randomUUID(),category:'TECHNICAL',body:'Không bấm được một nút trong màn hình công việc.'},201);assert.ok(readonly.id);checks++;
 for(let i=0;i<11;i++)await req(owner,path,'POST',{requestId:randomUUID(),category:'OTHER',title:'Pagination feedback '+i,body:'Góp ý kiểm thử phân trang '+i},201);
 const first=await req(owner,path),second=await req(owner,path+'?page=1');assert.equal(first.items.length,10);assert.equal(second.items.length,first.total-10);assert.equal(new Set([...first.items,...second.items].map(x=>x.id)).size,first.total);assert.equal(first.items[0].companyName,company.profileJson.name);assert.equal('company'in first.items[0],false);checks+=5;
 const filtered=await req(owner,path+'?category=TECHNICAL&q=n%C3%BAt');assert.equal(filtered.total,1);assert.equal(filtered.items[0].id,readonly.id);checks+=2;
 for(let i=0;i<51;i++)await db.workspaceFeedbackMessage.create({data:{feedbackId:report.id,authorId:task.companyId===company.id?(await db.workspaceFeedback.findUniqueOrThrow({where:{id:report.id}})).creatorId:'',requestId:randomUUID(),actorRole:'COMPANY',body:'Older conversation fixture '+i,statusAfter:'OPEN'}});
 const recent=await req(owner,'/feedback/'+report.id),older=await req(owner,'/feedback/'+report.id+'?before='+recent.olderCursor);assert.equal(recent.messages.length,50);assert.ok(older.messages.length>0);assert.equal(new Set([...recent.messages,...older.messages].map(x=>x.id)).size,55);checks+=3;
 const overview=await req(reviewer,'/admin/overview');assert.equal(overview.feedbackInsights.byCategory.NOT_RELEVANT,1);assert.equal(overview.feedbackInsights.byCategory.TECHNICAL,1);assert.equal(overview.feedbackInsights.byCategory.OTHER,11);assert.equal(overview.feedbackInsights.perDay.reduce((a:any,d:any)=>a+d.received,0),13);assert.equal(overview.feedbackInsights.perDay.reduce((a:any,d:any)=>a+d.replies,0),2);assert.equal(overview.feedbackInsights.perDay.length,14);assert.equal(JSON.stringify(overview.feedbackInsights).includes(input.body),false);checks+=7;
 if(process.argv.includes('--feedback-browser')){
  const next=spawn(process.execPath,[root+'limi-product/node_modules/next/dist/bin/next','start','-p','3002'],{cwd:root+'limi-product',env:{...process.env,LIMI_API_URL:base},stdio:'ignore',windowsHide:true});
  try{
   let ready=false;for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:3002/workspace')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}assert.ok(ready);
   const output=await run(process.execPath,[root+'tinix-legal/scripts/verify-feedback-browser.mjs'],root+'tinix-legal',{...process.env,COMPLIANCE_TEST_PASSWORD:password,COMPLIANCE_TEST_COMPANY_ID:company.id,COMPLIANCE_TEST_TASK_TITLE:task.title,COMPLIANCE_TEST_TASK_ID:task.id});assert.ok(output.includes('"status":"passed"'));checks++;
  }finally{if(next.exitCode===null&&next.signalCode===null){next.kill();await once(next,'exit').catch(()=>{});}}
 }
 return checks;
}
