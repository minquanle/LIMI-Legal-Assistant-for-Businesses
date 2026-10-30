import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={addEventListener(){}};
const {configureOverview,mountOverview,renderOverview}=await import('../dist/reviewer-overview.js');

const days=Array.from({length:14},(_,i)=>({date:`2026-10-${String(9+i).padStart(2,'0')}`,count:i===3?12:0}));
const fixture={generatedAt:'2026-10-22T06:00:00Z',
 obligations:{total:20,draft:12,inReview:2,published:6,retired:0,blockedImports:3,deadlineKinds:{periodic:2,once:1,review:1,none:2},reviewBasis:{expert:4,auto:2},approvalsPerDay:days.map((d,i)=>({date:d.date,expert:i===5?2:0,auto:i===13?2:0})),groups:[{group:'tax',draft:4,inReview:1,published:5,retired:0},{group:'labor',draft:8,inReview:1,published:1,retired:0},{group:'hungyen',draft:3,inReview:0,published:0,retired:0}],
  queue:[{id:'v1',status:'DRAFT',title:'Nộp tờ khai thuế GTGT theo tháng',group:'tax',rule:{fact:'stage',op:'exists'},deadline:{kind:'MONTHLY',monthsAfterEnd:1,day:20}},{id:'v2',status:'IN_REVIEW',title:'Nội quy lao động',group:'labor',rule:{fact:'employeeCount',op:'gt',value:9},deadline:{kind:'NONE'}}]},
 catalogue:{releases:3,latest:{id:'r',name:'x',publishedAt:'2026-10-22T05:00:00Z',items:6},companiesUsing:4},
 changes:{pending:30,approved:5,rejected:2,stages:{NEW:27,OBLIGATION_UPDATE:2,NEEDS_IMPORT:1},relevant:1,relevantItems:[{id:'c1',title:'Nghị định sửa đổi hóa đơn',obligations:['Kiểm tra hóa đơn']}],readyToNotify:1,byKind:{NEW_DOCUMENT:20,RELATION:10},newLast7Days:0,perDay:days,oldestPendingAt:'2026-10-12T00:00:00Z'},
 alerts:{events30:5,eventsTotal:5,alerts30:9,reminders30:3,deliveryPending:0,deliveryFailed:0,impactsPending:0,impactsFailed:2,perDay:days.map((d,i)=>({date:d.date,law:i===10?3:0,reminder:i===12?1:0}))},
 sources:{watchTotal:475,watchEnabled:0,observations24h:{total:0,failed:0,ok:0},domains:[{domain:'congbao.chinhphu.vn',ok:true,lastSuccessAt:'2026-10-14T02:00:00Z'},{domain:'datafiles.chinhphu.vn',ok:false,lastError:'ROBOTS_UNAVAILABLE'}]},
 activity:[{action:'OBLIGATION_APPROVE',actor:'Chuyên gia A',at:'2026-10-22T05:00:00Z'}]};

test('overview shares the company workspace theme and focuses on actionable queues',async()=>{
 let renders=0;fixture.feedback={OPEN:3,IN_REVIEW:1};configureOverview({pageTitle:(tag,title)=>'<header><h1>'+title+'</h1></header>',icon:n=>'<svg data-i="'+n+'"></svg>',api:async path=>{assert.equal(path,'/admin/overview');return fixture;},account:()=>({user:{id:'u',name:'Chuyên gia A'}}),render:()=>{renders++;},screen:()=>'overview'});
 mountOverview();await new Promise(r=>setTimeout(r,0));const html=renderOverview();assert.ok(renders>=1);
 for(const label of ['Nghĩa vụ chờ duyệt','Đã phát hành cho doanh nghiệp','Thay đổi luật chờ xử lý','Phản hồi cần xử lý','Thông báo luật đã đến doanh nghiệp'])assert.ok(html.includes(label),label);
 assert.ok(html.includes('dashboard-lower')&&html.includes('task-card')&&html.includes('section-heading'));
 assert.ok(html.indexOf('3 phản hồi mới từ doanh nghiệp')<html.indexOf('data-id="v2"'));assert.ok(html.indexOf('data-id="v2"')<html.indexOf('data-id="v1"'));
 assert.ok(!html.includes('Hưng Yên')&&!html.includes('hungyen'));assert.ok(html.includes('data-ov="group" data-group="tax"'));
 assert.ok(html.includes('Tự duyệt, chưa thẩm định')&&html.includes('Thay đổi đã duyệt'));
 assert.ok(!html.includes('ov-donut')&&!html.includes('ov-cols')&&!html.includes('ov-spark')&&!html.includes('<script'));
});
