import {notify} from './action-feedback.js?v=1';
import {captureView,restoreView} from './ui-continuity.js?v=3';
import {resolveWorkspaceView} from './workspace-navigation.js?v=4';
import { productEnabled, isReviewer, renderProductOverview, renderProductFeedback, renderProductDiscovery, getProductAlertCount, account, currentCompany, configureProduct, bootProduct, renderAccount, renderCompanies, renderProductHome, renderProductChanges,renderProductAdmin, renderProductProfile, mountProduct, saveProductProfile, lookupProductBusiness, captureUnknown, openProductAccount, renderNewOrganizationChoice, renderProductDetail } from './product-workspace.js?v=57';
import { renderRealLibrary, mountRealLibrary, configureRealLibrary, openLawSearch } from './real-library.js?v=4';
import { samples, labels, groups, alerts } from './data.js?v=12';
import { buildTasks, countTasks, compareTasksForAttention } from './rules.js?v=14';
import { legalDocuments, getTaskGuide } from './legal.js?v=13';
import { legalAnalyses, checklistTemplates, checklistTemplateById, templateMatch } from './mock-db.js?v=9';
import { lookupBusiness, normalizeTaxId, emptyBusiness, BUSINESS_SOURCE } from './business.js?v=6';
import { daysUntil, countdownLabel, alertPhase, alertMilestones } from './alert-time.js?v=2';

const paths = {
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  grid:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  list:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  building:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4M8 7h1M12 7h1M16 7h1M8 11h1M12 11h1M16 11h1"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',chevron:'<path d="m9 18 6-6-6-6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 4h.01"/>',
  rotate:'<path d="M3 11a9 9 0 1 0 3-6.7L3 7"/><path d="M3 3v4h4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  alert:'<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3h.01"/>',
  file:'<path d="M6 2h9l4 4v16H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v5h5M8 12h8M8 16h8"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',close:'<path d="M5 5l14 14M19 5 5 19"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z"/>',
  link:'<path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
  spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>'
};
const icon=(name,size=18)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmt=value=>{const bits=String(value).split('-');return bits.length===3?`${bits[2]}/${bits[1]}/${bits[0]}`:value};
const dateKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const monthKey=date=>dateKey(date).slice(0,7);
const listText=values=>values.length?values.map(value=>labels[value]||value).join(', '):'Chưa chọn';
const STORAGE_KEY='limi-workspace-v2';
const defaults={screen:'lookup',profile:null,complete:false,tab:'todo',statuses:{},naReasons:{},alertStates:{},taskSteps:{},stepNotes:{},evidenceNotes:{},dueDates:{},calendarMonth:monthKey(new Date()),selectedTask:null,pendingNa:null,pendingIgnore:null,pendingSnooze:null,editingDeadline:null,history:[],lookupError:'',lookupLoading:false,manualEntry:false,questionError:'',mobileMenu:false,legalFilter:'all',legalRelevantOnly:false,legalQuery:'',libraryTab:'alerts',alertFilter:'all',alertExpanded:{},checklistQuery:'',checklistSort:'attention',taskCategory:'all'};
function loadState(){
  if(productEnabled)return structuredClone(defaults);
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    return saved?.profile?{...structuredClone(defaults),...saved,lookupLoading:false,selectedTask:null,pendingNa:null,pendingIgnore:null,pendingSnooze:null,mobileMenu:false}:structuredClone(defaults);
  }catch(_){return structuredClone(defaults)}
}
function saveState(){
  if(productEnabled)return;
  if(!state.profile)return;
  try{
    const saved={...state,lookupLoading:false,selectedTask:null,pendingNa:null,pendingIgnore:null,pendingSnooze:null,mobileMenu:false};
    localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));
  }catch(_){}
}
let state=loadState();
// Chuyển dữ liệu của các lần demo trước: cảnh báo đã tạo việc từng mang trạng thái
// "Cần xác minh" nay phải nằm trong hàng "Cần xử lý". Không động đến việc đang làm/đã xong.
for(const alert of alerts){
  if(state.alertStates[alert.id]?.status==='applied'&&alert.task&&state.statuses[alert.task.id]==='verify'){
    state.statuses[alert.task.id]='todo';
  }
}
let lookupController;
let returnFocusSelector;
const initials=p=>(p?.shortName||p?.name||'DN').replace(/CÔNG TY|Công ty|TNHH|CỔ PHẦN|Cổ phần/g,'').trim().split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toUpperCase()||'DN';
const brand=()=>`<a href="#" class="brand official-brand" data-home aria-label="LIMI — về trang tổng quan"><img src="${window.LIMI_ASSET_BASE??'.'}/limi-logo.png?v=1" alt="LIMI — Legal Intelligence, Monitoring & Insights" width="1254" height="1254"></a>`;
const timeLabel=value=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'}):'Không được cung cấp';
const $=id=>document.getElementById(id);
const relevantAlerts=()=>!productEnabled&&state.profile?alerts.filter(alert=>alert.test(state.profile)):[];
const alertStatus=id=>{const item=state.alertStates[id];return item?.status==='snoozed'&&item.until&&daysUntil(item.until)<=0?'new':item?.status||'new'};
const appliedAlertIds=()=>Object.keys(state.alertStates).filter(id=>state.alertStates[id].status==='applied');
const newAlertCount=()=>productEnabled?getProductAlertCount():relevantAlerts().filter(alert=>alertStatus(alert.id)==='new').length;
const taskAttentionScore=task=>{
  if(['done','na'].includes(task.status))return 1000;
  const due=state.dueDates[task.id];
  const dueDays=due?daysUntil(due):null;
  const status={todo:0,doing:20,review:25,verify:45}[task.status]??60;
  const deadline=dueDays===null?0:dueDays<0?-120:dueDays<=7?-80:dueDays<=30?-30:0;
  const legal=task.legalDate?daysUntil(task.legalDate):null;
  const legalUrgency=legal===null?0:legal<0?-35:legal<=30?-25:0;
  return status+deadline+legalUrgency+(task.priority==='high'?-15:0)+(state.profile?.topics?.includes(task.category)?-1:0);
};
const tasks=()=>productEnabled?[]:buildTasks(state.profile,state.statuses,appliedAlertIds()).sort((a,b)=>taskAttentionScore(a)-taskAttentionScore(b)||compareTasksForAttention(a,b,state.profile?.topics||[]));
const counts=()=>countTasks(tasks());
const sourceById=id=>legalDocuments.find(doc=>doc.id===id);
const detailedGuide=guide=>guide.steps.some(step=>typeof step==='object');
const stepCount=task=>Object.values(state.taskSteps[task.id]||{}).filter(Boolean).length;
const issueCount=task=>Object.values(state.taskSteps[task.id]||{}).filter(value=>value==='issue').length;
const taskReady=(task,guide)=>stepCount(task)===guide.steps.length&&(!detailedGuide(guide)||(issueCount(task)===0&&guide.steps.every((_,index)=>state.taskSteps[task.id]?.[index]!=='na'||Boolean(state.stepNotes[task.id]?.[index]?.trim()))))&&Boolean((state.evidenceNotes[task.id]||'').trim());
const completionText=(task,guide)=>detailedGuide(guide)
  ? issueCount(task)>0?`${issueCount(task)} mục còn cần xử lý; chưa thể kết thúc rà soát.`:taskReady(task,guide)?'Đã tự đánh giá đủ mục và ghi vị trí bằng chứng. Đây không phải xác nhận tuân thủ pháp luật.':`Cần đánh giá đủ ${guide.steps.length} mục, giải thích mục không áp dụng và ghi vị trí bằng chứng.`
  :taskReady(task,guide)?'Đủ bước và ghi chú để xác nhận.':`Cần đánh dấu đủ ${guide.steps.length} bước và lưu ghi chú trước khi hoàn tất.`;
const imminentTasks=()=>tasks().filter(task=>!['done','na'].includes(task.status)&&state.dueDates[task.id]&&daysUntil(state.dueDates[task.id])<=7);
const severityMap={high:['Khẩn','red'],medium:['Trung bình','amber'],low:['Thấp','teal']};
const alertKindMeta={effective:{label:'ĐÃ CÓ HIỆU LỰC',tone:'effective'},opportunity:{label:'CƠ HỘI THUẾ',tone:'opportunity'},enforcement:{label:'XU HƯỚNG THỰC THI',tone:'enforcement'},upcoming:{label:'SẮP HIỆU LỰC',tone:'upcoming'}};
function alertAnchor(alert){return alert.deadlineDate||alert.effectiveDate||alert.observedAt||alert.issuedAt}
function alertPhaseLabel(alert){
  if(alert.kind==='enforcement')return 'Rủi ro kiểm tra tăng';
  if(alert.kind==='opportunity'){
    const left=daysUntil(alert.deadlineDate);
    return left>0?`Sắp có hiệu lực · còn ${left} ngày`:left===0?'Hạn hôm nay':`Đã qua hạn ${Math.abs(left)} ngày`;
  }
  const left=daysUntil(alert.effectiveDate);
  if(left>90)return 'Theo dõi sớm';
  if(left>0)return `Sắp có hiệu lực · còn ${left} ngày`;
  if(left===0)return 'Hiệu lực hôm nay';
  return `Đã có hiệu lực · ${left} ngày`;
}
function alertFilterBucket(alert){
  if(alert.kind==='enforcement')return 'risk';
  const date=alert.kind==='opportunity'?(alert.deadlineDate||alert.effectiveDate):(alert.effectiveDate||alert.deadlineDate);
  if(!date)return 'early';
  const left=daysUntil(date);
  if(left<=0)return 'effective';
  return left<=90?'upcoming':'early';
}
function alertMatchesFilter(alert,filter){
  if(filter==='all')return true;
  if(filter==='related')return alert.test(state.profile);
  if(filter==='risk')return alert.kind==='enforcement';
  if(filter==='effective'||filter==='upcoming'||filter==='early')return alertFilterBucket(alert)===filter;
  if(filter==='new')return alertStatus(alert.id)==='new';
  return alertStatus(alert.id)!=='new';
}
function alertLeadLine(alert){
  if(alert.kind==='enforcement')return `${alert.sourceCode} · cập nhật thực thi ${fmt(alert.observedAt)}`;
  if(alert.kind==='opportunity')return `${alert.sourceCode} · hạn đề nghị ${fmt(alert.deadlineDate)} · ${countdownLabel(alert.deadlineDate)}`;
  return `${alert.sourceCode} · hiệu lực ${fmt(alert.effectiveDate)} · ${countdownLabel(alert.effectiveDate)}`;
}
function timelineItems(alert){
  return alert.timeline||[
    {label:'Ban hành',date:alert.issuedAt},
    {label:'Đăng Công báo',date:alert.publishedAt},
    {label:'Hiệu lực',date:alert.effectiveDate,key:true,countdown:true},
    {label:'Gợi ý chuẩn bị trước',date:alert.prepareBy,note:'Mốc nội bộ, không phải hạn luật'},
  ];
}
function renderAlertTimeline(alert){
  return `<div class="alert-timeline">${timelineItems(alert).map(item=>`<div class="${item.key?'key-date':''}"><span>${esc(item.label)}</span><strong>${esc(item.value||fmt(item.date))}</strong>${item.countdown&&item.date?`<small>${esc(countdownLabel(item.date))}</small>`:item.note?`<small>${esc(item.note)}</small>`:''}</div>`).join('')}</div>`;
}
function renderAlertMilestones(alert){
  if(alert.kind==='enforcement')return `<div class="enforcement-note">${icon('alert',19)}<div><strong>Đây là tín hiệu thực thi, không phải ngày hiệu lực mới</strong><p>Ưu tiên theo mức độ lộ diện và khả năng chứng minh quyền sử dụng thay vì đếm ngược một hạn pháp lý giả.</p></div></div>`;
  if(alert.kind==='effective')return `<div class="effective-note">${icon('alert',19)}<div><strong>Quy định đã áp dụng từ ${fmt(alert.effectiveDate)}</strong><p>Hãy rà soát ngay.</p></div></div>`;
  const date=alertAnchor(alert),milestones=alertMilestones(date),next=milestones.find(item=>!item.passed);
  const title=alert.kind==='opportunity'?'Lộ trình đến hạn đề nghị':'Lộ trình trước ngày hiệu lực';
  return `<div class="alert-milestones"><div><strong>${title}</strong><span>${next?`Mốc kế tiếp ${fmt(next.date)}`:'Tất cả mốc đã qua'}</span></div><div class="milestone-track">${milestones.map(item=>`<span class="${item.passed?'passed':item===next?'next':''}"><b>${item.daysBefore?`D−${item.daysBefore}`:alert.kind==='opportunity'?'Hạn đề nghị':'Hiệu lực'}</b><small>${fmt(item.date)}</small></span>`).join('')}</div><p>${alert.kind==='opportunity'?'Mốc 02/11/2026 là hạn gửi đề nghị theo nghị định.':'Các mốc chuẩn bị là gợi ý quản trị trong demo.'}</p></div>`;
}
function note(message){state.history.unshift({message,at:new Date().toLocaleString('vi-VN')});state.history=state.history.slice(0,10)}
function toast(message,kind='success'){notify(message,kind);}
function setScreen(screen,{historyMode='push'}={}){if(productEnabled)screen=resolveWorkspaceView(screen,{authenticated:Boolean(account),reviewer:Boolean(account?.user.platformReviewer),canCreateCompany:Boolean(account?.memberships.some(m=>m.role!=='VIEWER'))});if(screen!=='laws'&&historyMode!=='none'){const url=new URL(location.href);url.search='';url.searchParams.set('view',screen);if(productEnabled&&currentCompany())url.searchParams.set('company',currentCompany().id);if(url.href!==location.href)history[historyMode==='replace'?'replaceState':'pushState'](null,'',url.pathname+url.search);}if(screen==='alerts')state.libraryTab='alerts';if(productEnabled&&!account&&!['laws','account'].includes(screen))screen='account';if(screen!=='lookup'&&lookupController){lookupController.abort();lookupController=null;state.lookupLoading=false}state.screen=screen;state.selectedTask=null;state.pendingNa=null;state.pendingIgnore=null;state.pendingSnooze=null;state.mobileMenu=false;render();window.scrollTo({top:0,behavior:'instant'});const title=document.querySelector('h1');if(title){title.tabIndex=-1;title.focus({preventScroll:true})}}

function shell(content){
  const onboarding=['lookup','confirm','questions','topics'].includes(state.screen)||(!productEnabled||!account)&&['account','companies'].includes(state.screen);
  if(onboarding)return `<div class="setup-shell"><header class="setup-header">${brand()}<div class="setup-header-right"><button class="text-button" data-nav="laws">Tra cứu văn bản</button><button class="text-button" data-nav="account">${productEnabled?account?.user.name||'Đăng nhập':'Bản trải nghiệm'}</button>${state.complete?'<button class="text-button" data-nav="dashboard">Về không gian làm việc</button>':'<span class="setup-caption">Không gian tuân thủ cho doanh nghiệp</span>'}</div></header><main id="main-content" class="setup-main">${content}</main><footer class="setup-footer"><span>© 2026 LIMI</span><span>Legal Intelligence, Monitoring & Insights</span></footer></div>`;
  // Reviewers never use company pages: their workspace is overview, review rooms, the law library and the account.
  const reviewer=productEnabled&&isReviewer();
  const nav=reviewer?[['overview','grid','Tổng quan'],['admin','file','Duyệt nghĩa vụ'],['changes','bell','Duyệt thay đổi luật'],['discovery','spark','Luật mới'],['feedback','help','Phản hồi doanh nghiệp'],['laws','list','Thư viện luật'],['account','user','Tài khoản']]:[['dashboard','grid','Hôm nay'],['checklist','list','Công việc'],['alerts','bell','Cảnh báo'],['laws','file','Thư viện luật'],['profile','building','Doanh nghiệp'],...(productEnabled?[['feedback','help','Phản hồi']]:[]),...(productEnabled?[['account','user','Tài khoản'],...(account?.user.platformReviewer?[['admin','file','Duyệt nghĩa vụ'],['changes','bell','Duyệt thay đổi luật']]:[])]:[])];
  const crumb=({feedback:reviewer?'Phản hồi doanh nghiệp':'Phản hồi',overview:'Tổng quan',discovery:'Luật mới',changes:'Duyệt thay đổi luật',admin:'Duyệt nghĩa vụ',dashboard:'Hôm nay',checklist:'Công việc tuân thủ',alerts:'Cảnh báo pháp luật',profile:'Hồ sơ doanh nghiệp',account:'Tài khoản',companies:'Doanh nghiệp',laws:'Thư viện pháp luật'})[state.screen];
  const p=state.profile||{name:"Chưa chọn doanh nghiệp",shortName:"",taxId:""};
  return `<div class="app-shell">${state.mobileMenu?'<button class="nav-scrim" data-action="menu" aria-label="Đóng menu"></button>':''}<aside class="sidebar ${state.mobileMenu?'open':''}">${brand()}<div class="workspace-label">KHÔNG GIAN LÀM VIỆC</div><nav class="side-nav" aria-label="Điều hướng chính">${nav.map(([id,glyph,label])=>`<button type="button" class="nav-link ${state.screen===id?'current':''}" data-nav="${id}" ${state.screen===id?'aria-current="page"':''}>${icon(glyph,20)}<span>${label}</span>${id==='alerts'&&newAlertCount()>0?`<span class="nav-badge" aria-label="${newAlertCount()} cảnh báo cần chú ý">${newAlertCount()}</span>`:''}</button>`).join('')}</nav><div class="sidebar-bottom">${reviewer?'':`<button class="switch-company" data-action="reset">${icon('rotate',17)} Đổi doanh nghiệp</button>`}<span class="sidebar-edition">${reviewer?'Không gian quản lí<br>Tiếp nhận phản hồi doanh nghiệp':productEnabled?'Dữ liệu lưu theo tài khoản<br>Phân quyền theo doanh nghiệp':'Kho luật: dữ liệu thật<br>Hồ sơ/công việc: lưu trên trình duyệt'}</span></div></aside><main class="main-area" id="main-content"><header class="topbar"><div class="breadcrumb"><button class="mobile-menu" data-action="menu" aria-label="Mở menu" aria-expanded="${state.mobileMenu}">${icon('menu',21)}</button><strong>${crumb}</strong></div><div class="top-actions">${reviewer?`<button class="reviewer-chip" data-nav="account" title="Tài khoản chuyên gia"><span class="company-monogram">${esc(initials({name:account?.user.name||'CG'}))}</span><span><strong>${esc(account?.user.name||'Chuyên gia')}</strong><small>Chuyên gia duyệt</small></span></button>`:`<button class="workspace-chip" data-nav="profile" title="Mở hồ sơ doanh nghiệp"><span class="company-monogram">${esc(initials(p))}</span><span><strong>${esc(p.shortName||p.name)}</strong><small>${esc(p.taxId)}</small></span></button><button class="icon-button notification-button" data-nav="alerts" aria-label="Xem cảnh báo">${icon('bell',20)}${newAlertCount()?'<i></i>':''}</button>`}</div></header><div class="content-wrap">${state.screen!=='laws'&&!reviewer?(productEnabled?'<div class="disclaimer-banner real-workspace-note"><span>Công việc, tiến độ và phản hồi được lưu theo tài khoản của doanh nghiệp.</span></div>':'<div class="disclaimer-banner real-workspace-note"><span>Hồ sơ, công việc và cảnh báo thuộc bản trải nghiệm, lưu trên trình duyệt. Thư viện luật đã kết nối dữ liệu thật.</span></div>'):''}${content}</div></main></div>`;
}
const steps=['Chọn doanh nghiệp','Xác nhận hồ sơ','Hoạt động thực tế','Theo dõi thêm'];
function onboard(content,active){return `<nav class="setup-progress" aria-label="Tiến trình thiết lập"><ol>${steps.map((step,index)=>`<li class="${index===active?'current':index<active?'completed':''}" ${index===active?'aria-current="step"':''}><span>${index<active?icon('check',16):index+1}</span><strong>${step}</strong></li>`).join('')}</ol></nav><div class="onboard-layout ${active===0?'lookup-layout':'focused-layout'}"><section class="form-panel">${content}</section>${active===0?`<aside class="lookup-guide"><div class="guide-icon">${icon('spark',25)}</div><span class="eyebrow">BẮT ĐẦU TỪ DOANH NGHIỆP CỦA BẠN</span><h2>Đúng thông tin.<br>Đúng việc cần làm.</h2><p>Hồ sơ là điểm khởi đầu để chọn lọc những vấn đề pháp lý liên quan.</p><div class="guide-flow"><div><span>01</span><section><strong>Tra cứu thông tin cơ bản</strong><p>Tên, địa chỉ và tình trạng thuế từ nguồn công khai.</p></section></div><div><span>02</span><section><strong>Bổ sung hoạt động thực tế</strong><p>Nhân sự, kênh bán hàng và lĩnh vực bạn quan tâm.</p></section></div><div><span>03</span><section><strong>Có một nơi để theo dõi</strong><p>Checklist, nguồn luật và cảnh báo trong cùng không gian.</p></section></div></div><div class="guide-source">${icon('globe',18)} <span>Tra cứu trực tiếp qua VietQR / CASSO</span></div></aside>`:''}</div>`}
const panelHead=(number,glyph,title,intro)=>`<div class="panel-top"><span class="panel-icon">${icon(glyph,23)}</span><span class="step-count">THIẾT LẬP · ${String(number).padStart(2,'0')} / 04</span></div><h1>${title}</h1><p class="panel-intro">${intro}</p>`;
function renderLookup(){
  const cards=Object.values(samples).map(item=>`<button class="sample-card" data-sample="${item.taxId}" ${state.lookupLoading?'disabled':''}><span class="sample-avatar">${esc(initials(item))}</span><span class="sample-copy"><strong>${esc(item.name)}</strong><small>Hồ sơ giả định · ${esc(item.province)}</small></span>${icon('arrow',18)}</button>`).join('');
  return onboard(`${panelHead(1,'building','Kết nối doanh nghiệp của bạn','Nhập mã số thuế để lấy thông tin doanh nghiệp và bắt đầu thiết lập hồ sơ.')}${renderNewOrganizationChoice()}<form id="lookup-form" aria-busy="${state.lookupLoading}"><label class="field-label" for="business-code">Mã số thuế doanh nghiệp</label><div class="lookup-row"><span class="input-icon">${icon('search',20)}</span><input id="business-code" name="taxId" autocomplete="off" inputmode="numeric" maxlength="18" aria-describedby="lookup-hint${state.lookupError?' lookup-error':''}" aria-invalid="${Boolean(state.lookupError)}" placeholder="Ví dụ: 0316794479" value="${esc(state.lastTax||'')}" ${state.lookupLoading?'disabled':''}><button class="primary-button" type="submit" ${state.lookupLoading?'disabled':''}>${state.lookupLoading?'<span class="spinner"></span> Đang tra cứu':'Tra cứu '+icon('arrow',18)}</button></div><p class="field-hint" id="lookup-hint">10 số cho doanh nghiệp · 13 số cho đơn vị phụ thuộc</p>${state.lookupError?`<div class="form-error" id="lookup-error" role="alert">${icon('alert',18)}<span>${esc(state.lookupError)}</span></div>`:''}${state.lookupLoading?'<p class="lookup-status" role="status">Đang lấy thông tin từ nguồn tra cứu…</p>':''}</form><div class="lookup-includes"><span>KẾT QUẢ TRA CỨU CÓ THỂ GỒM</span><div>${['Tên doanh nghiệp','Địa chỉ đăng ký','Tình trạng thuế','Tên quốc tế / viết tắt'].map(t=>`<span>${icon('check',14)}${t}</span>`).join('')}</div></div><p class="source-caption">Mã số thuế sẽ được gửi đến <a href="${BUSINESS_SOURCE.url}" target="_blank" rel="noopener noreferrer">VietQR / CASSO ${icon('link',12)}</a> để tra cứu. Các trường thiếu sẽ được để trống.</p><button type="button" class="text-action manual-toggle" data-action="toggle-manual" aria-expanded="${state.manualEntry}" ${state.lookupLoading?'disabled':''}>${icon('file',16)} ${state.manualEntry?'Đóng biểu mẫu tự nhập':'Không tra cứu được? Tự nhập hồ sơ'}</button>${state.manualEntry?`<form id="manual-form" class="manual-form"><label for="manual-tax">Mã số thuế<input id="manual-tax" name="taxId" required inputmode="numeric" value="${esc(normalizeTaxId(state.lastTax)||'')}" placeholder="10 hoặc 13 số"></label><label for="manual-name">Tên doanh nghiệp<input id="manual-name" name="name" required maxlength="250" autocomplete="organization"></label><label for="manual-address">Địa chỉ đăng ký<input id="manual-address" name="address" maxlength="500" autocomplete="street-address"></label><p class="field-hint">Hồ sơ được ghi nhận là thông tin tự nhập, chưa đối chiếu nguồn.</p><button class="secondary-button" type="submit">Tiếp tục với thông tin tự nhập ${icon('arrow',16)}</button></form>`:''}${productEnabled?'':`<details class="demo-options"><summary>Khám phá bằng hồ sơ mẫu <span>Không cần mã số thuế</span>${icon('chevron',15)}</summary><div class="sample-list">${cards}</div></details>`}`,0);
}
function renderConfirm(){
  const p=state.profile, live=p.sourceKind==='live', manual=p.sourceKind==='manual';
  const entries=live||manual?[['Tên doanh nghiệp',p.name],['Mã số thuế',p.taxId],['Tên quốc tế',p.internationalName],['Tên viết tắt',p.shortName],['Địa chỉ đăng ký',p.address],['Tình trạng thuế',p.status]]:[['Tên doanh nghiệp',p.name],['Mã hồ sơ mẫu',p.taxId],['Loại hình',p.type],['Ngày thành lập',fmt(p.founded)],['Tình trạng',p.status],['Tỉnh/thành',p.province],['Ngành đăng ký',p.registered]];
  return onboard(`${panelHead(2,'check','Đây là doanh nghiệp của bạn?','Kiểm tra thông tin trước khi thiết lập nội dung theo dõi.')}<div class="source-status ${live?'live':''}">${icon(live?'globe':'file',17)}<span>${live?'Đã nhận dữ liệu tra cứu trực tiếp':manual?'Thông tin do bạn tự nhập':'Bạn đang sử dụng hồ sơ giả định'}</span></div><dl class="confirm-summary">${entries.map(([key,value])=>`<div><dt>${key}</dt><dd class="${value?'':'missing-value'}">${esc(value||'Nguồn chưa cung cấp')}</dd></div>`).join('')}</dl>${live?`<div class="source-receipt"><span>Nguồn: <a href="${p.sourceUrl}" target="_blank" rel="noopener noreferrer">${esc(p.sourceName)} ↗</a></span><span>Tra cứu lúc ${timeLabel(p.retrievedAt)}</span>${p.sourceUpdatedAt?`<span>Nguồn cập nhật: ${timeLabel(p.sourceUpdatedAt)}</span>`:''}</div><details class="data-limit"><summary>Những thông tin chưa được nguồn cung cấp ${icon('chevron',15)}</summary><p>Ngày thành lập, loại hình pháp lý, người đại diện, vốn điều lệ và ngành nghề đăng ký chưa được nguồn tra cứu này cung cấp. Bạn có thể đối chiếu tại <a href="https://dangkykinhdoanh.gov.vn/" target="_blank" rel="noopener noreferrer">Cổng thông tin quốc gia về đăng ký doanh nghiệp ↗</a>. Tình trạng thuế không thay thế kết luận về tình trạng pháp lý.</p></details>`:''}<div class="info-callout">${icon('help',20)}<div><strong>Tiếp theo: hoạt động thực tế</strong><p>Nhân sự, kênh bán hàng và tình huống kinh doanh cần bạn xác nhận để tạo checklist phù hợp.</p></div></div><div class="panel-actions"><button class="text-button" data-back="lookup">← Tra cứu lại</button><button class="primary-button" data-next="questions">Đúng doanh nghiệp của tôi ${icon('arrow',17)}</button></div>`,1);
}
function choiceGroup(name,values,selected,type='checkbox'){
  return `<div class="choice-grid">${values.map(value=>`<label class="choice-tile"><input type="${type}" name="${name}" value="${value}" ${type==='radio'?selected===value?'checked':'':selected.includes(value)?'checked':''}><span class="choice-indicator">${icon('check',13)}</span><span>${esc(labels[value]||value)}</span></label>`).join('')}</div>`;
}
function question(number,title,help,content){
  return `<div class="question-block"><div class="question-heading"><span>${number}</span><div><h3>${title}</h3>${help?`<p>${help}</p>`:''}</div></div>${content}</div>`;
}
function renderQuestions(){
  const p=state.profile;
  const basics=question(1,'Doanh nghiệp đang ở giai đoạn nào?','Dùng để phân biệt việc sau thành lập, vận hành thường xuyên và thay đổi doanh nghiệp.',choiceGroup('stage',groups.stage,p.stage,'radio'))+question(2,'Hiện có bao nhiêu người lao động?','Nếu chưa chắc, chọn “Chưa xác nhận”; LIMI sẽ tạo việc xác minh thay vì tự suy đoán.',choiceGroup('employees',groups.employees,p.employees,'radio'));
  const operations=question(3,'Doanh nghiệp thực sự đang bán hoặc cung cấp gì?','Chọn hoạt động đang diễn ra, không chỉ ngành ghi trên đăng ký.',choiceGroup('activity',groups.activity,p.activity))+question(4,'Khách hàng mua qua đâu?','Chọn các kênh đang vận hành.',choiceGroup('channels',groups.channels,p.channels))+question(5,'Doanh nghiệp đang dùng những địa điểm nào?','Chỉ chọn địa điểm thuộc hoạt động hiện tại.',choiceGroup('places',groups.places,p.places));
  const signals=question(6,'Có tình huống nào dưới đây không?','Chỉ chọn khi đã biết chắc. Để trống được hiểu là “chưa xác nhận”, không phải “không có”.',choiceGroup('signals',groups.signals,p.signals));
  const sections=`<details class="question-section" open><summary><span>01</span><strong>Thông tin cơ bản</strong><small>Giai đoạn và nhân sự</small>${icon('chevron',16)}</summary><div>${basics}</div></details><details class="question-section"><summary><span>02</span><strong>Cách doanh nghiệp vận hành</strong><small>Hoạt động, kênh bán và địa điểm</small>${icon('chevron',16)}</summary><div>${operations}</div></details><details class="question-section"><summary><span>03</span><strong>Tình huống cần theo dõi</strong><small>Thuế, dữ liệu, bản quyền và giao dịch</small>${icon('chevron',16)}</summary><div>${signals}</div></details>`;
  return onboard(`${panelHead(3,'list','Cho LIMI biết doanh nghiệp đang vận hành thế nào','Bạn không cần hiểu thuật ngữ pháp lý. Hãy trả lời theo hoạt động thực tế; có thể chọn “Chưa xác nhận” và cập nhật sau.')}<form id="questions-form" class="questions-form progressive-questions">${sections}${state.questionError?`<p class="form-error" role="alert">${esc(state.questionError)}</p>`:''}<div class="panel-actions"><button class="text-button" type="button" data-back="confirm">← Quay lại</button><button class="primary-button" type="submit">Tiếp tục ${icon('arrow',17)}</button></div></form>`,2);
}
function renderTopics(){
  const p=state.profile;
  return onboard(`${panelHead(4,'bell','Bạn muốn theo dõi thêm chủ đề nào?','Đây chỉ là sở thích hiển thị. LIMI vẫn ưu tiên nghĩa vụ bắt buộc theo hồ sơ, rủi ro và thời hạn.')}<form id="topics-form">${question(1,'Chủ đề muốn theo dõi thêm','Có thể chọn nhiều nhóm hoặc để trống. Lựa chọn này không loại bỏ cảnh báo bắt buộc.',choiceGroup('topics',groups.topics,p.topics))}<div class="info-callout success">${icon('shield',20)}<div><strong>Thời hạn và rủi ro luôn được ưu tiên trước</strong><p>Chủ đề bạn chọn chỉ được dùng khi các công việc có mức độ khẩn cấp tương đương.</p></div></div><div class="panel-actions"><button class="text-button" type="button" data-back="questions">← Quay lại</button><button class="primary-button" type="submit">${state.complete?'Lưu thay đổi':'Mở không gian làm việc'} ${icon('arrow',17)}</button></div></form>`,3);
}
function pageTitle(kicker,title,desc,action=''){
  return `<div class="page-heading"><div><div class="eyebrow">${kicker}<span class="tiny-rule"></span></div><h1>${title}</h1>${desc?`<p>${desc}</p>`:''}</div>${action}</div>`;
}
function statusBadge(status){
  const map={todo:['Cần xử lý','red'],verify:['Cần xác minh','amber'],doing:['Đang thực hiện','blue'],review:['Chờ xác nhận','blue'],done:['Đã hoàn thành','teal'],na:['Không áp dụng','gray']};
  return `<span class="status-badge ${map[status][1]}"><span class="status-dot"></span>${map[status][0]}</span>`;
}
function taskCard(task){
  const guide=getTaskGuide(task),count=stepCount(task),due=state.dueDates[task.id];
  const next=task.status==='verify'?guide.question:task.status==='done'?guide.done:task.status==='na'?(state.naReasons[task.id]||'Đã ghi nhận lý do không áp dụng.'):guide.next;
  return `<article class="task-card"><div class="task-card-main"><div class="task-card-overline"><span>${esc(labels[task.category])}</span>${guide.basis.length?'<span class="law-backed">Có căn cứ pháp lý</span>':''}${task.priority==='high'?'<span class="priority-label">Ưu tiên cao</span>':''}</div><h3>${esc(task.title)}</h3><p>${esc(next)}</p><div class="task-card-meta">${statusBadge(task.status)}<span>${icon('user',14)} ${esc(task.owner)}</span>${due?(()=>{const over=!['done','na'].includes(task.status)&&daysUntil(due)<0;const soon=!['done','na'].includes(task.status)&&daysUntil(due)>=0&&daysUntil(due)<=7;return `<span class="due-meta ${over?'overdue':soon?'soon':''}">${icon('calendar',14)} Nhắc trong LIMI ${fmt(due)}${over?' · quá hạn':''}</span>`})():''}${count?`<span>${icon('check',14)} ${count}/${guide.steps.length} mục</span>`:''}</div></div><button class="task-open" data-detail="${task.id}" aria-label="Xem chi tiết ${esc(task.title)}">${icon('arrow',19)}</button></article>`;
}
function eventButtons(){
  const p=state.profile;
  return `<button data-event="hire" ${p.employees==='100+'?'disabled':''}>${icon('plus',17)} ${p.employees==='unknown'?'Xác nhận quy mô nhân sự':p.employees==='0'?'Tuyển nhân viên đầu tiên':p.employees==='100+'?'Đã từ 100 nhân viên':'Tăng quy mô nhân sự'}</button><button data-event="warehouse" ${p.places.includes('warehouse')?'disabled':''}>${icon('plus',17)} ${p.places.includes('warehouse')?'Đã có kho hàng':'Mở thêm kho hàng'}</button><button data-event="website" ${p.channels.includes('website')?'disabled':''}>${icon('plus',17)} ${p.channels.includes('website')?'Đã có website':'Bắt đầu bán trên website'}</button>`;
}
function calendarEvents(){
  const items=[];
  const add=(date,label,title,tone,alertId='',taskId='',related=false)=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||'')))return;
    items.push({date,label,title,tone,alertId,taskId,related});
  };
  for(const alert of alerts){
    const related=Boolean(state.profile&&alert.test(state.profile));
    const title=`${alert.sourceCode} · ${alert.title}`;
    add(alert.issuedAt,'Ban hành',title,'source',alert.id,'',related);
    add(alert.publishedAt,'Đăng Công báo',title,'source',alert.id,'',related);
    add(alert.effectiveDate,'Có hiệu lực',title,'effective',alert.id,'',related);
    add(alert.deadlineDate,'Hạn pháp lý',title,'deadline',alert.id,'',related);
    add(alert.observedAt,'Cập nhật thực thi',title,'risk',alert.id,'',related);
    add(alert.prepareBy,'Mốc chuẩn bị',title,'prepare',alert.id,'',related);
    add(alert.validUntil,'Kết thúc thời gian áp dụng',title,'deadline',alert.id,'',related);
    const snooze=state.alertStates[alert.id];
    if(snooze?.status==='snoozed')add(snooze.until,'Nhắc lại cảnh báo',title,'reminder',alert.id,'',related);
  }
  for(const [taskId,date] of Object.entries(state.dueDates)){
    const task=tasks().find(item=>item.id===taskId);
    if(task)add(date,'Nhắc việc',task.title,'reminder','',taskId,true);
  }
  return items.sort((a,b)=>a.date.localeCompare(b.date)||a.label.localeCompare(b.label,'vi'));
}
function calendarCursorDate(){
  const match=/^(\d{4})-(\d{2})$/.exec(state.calendarMonth||'');
  return match?new Date(Number(match[1]),Number(match[2])-1,1):new Date(new Date().getFullYear(),new Date().getMonth(),1);
}
function calendarEventButton(item,compact=false){
  const action=item.alertId?`data-calendar-alert="${item.alertId}"`:`data-calendar-task="${item.taskId}"`;
  return `<button class="calendar-event tone-${item.tone} ${item.related?'related':'general'} ${compact?'compact':''}" ${action} title="${esc(`${item.label}: ${item.title}`)}"><small>${esc(item.label)}</small><span>${esc(item.title)}</span></button>`;
}
function renderComplianceCalendar(){
  const cursor=calendarCursorDate(),year=cursor.getFullYear(),month=cursor.getMonth();
  const monthStart=new Date(year,month,1),offset=(monthStart.getDay()+6)%7;
  const gridStart=new Date(year,month,1-offset),today=dateKey(new Date()),events=calendarEvents();
  const cells=Array.from({length:42},(_,index)=>{
    const day=new Date(gridStart);day.setDate(gridStart.getDate()+index);
    const key=dateKey(day),dayEvents=events.filter(item=>item.date===key),inMonth=day.getMonth()===month;
    return `<div class="calendar-day ${inMonth?'':'outside'} ${key===today?'today':''}"><div class="calendar-date"><span>${day.getDate()}</span>${key===today?'<small>Hôm nay</small>':''}</div><div class="calendar-day-events">${dayEvents.map(item=>calendarEventButton(item)).join('')}</div></div>`;
  }).join('');
  const upcoming=events.filter(item=>item.date>=today).slice(0,8);
  const monthEvents=events.filter(item=>item.date.slice(0,7)===monthKey(cursor));
  const monthLabel=cursor.toLocaleDateString('vi-VN',{month:'long',year:'numeric'});
  const upcomingList=upcoming.length?upcoming.map(item=>{const bits=item.date.split('-');return `<div class="upcoming-row"><time datetime="${item.date}"><strong>${bits[2]}</strong><span>Thg ${bits[1]}</span></time>${calendarEventButton(item,true)}</div>`}).join(''):'<p class="calendar-empty">Chưa có mốc sắp tới.</p>';
  return `<section class="compliance-calendar" aria-labelledby="calendar-title"><header class="calendar-header"><div><span class="rail-kicker">LỊCH TUÂN THỦ</span><h2 id="calendar-title">Mốc pháp lý và công việc</h2><p>Mặc định hiển thị tháng hiện tại; các mốc khớp hồ sơ được nhấn rõ hơn.</p></div><div class="calendar-controls"><button class="calendar-nav prev" data-calendar-move="-1" aria-label="Tháng trước">${icon('chevron',17)}</button><button class="calendar-today" data-calendar-today>Tháng hiện tại</button><button class="calendar-nav" data-calendar-move="1" aria-label="Tháng sau">${icon('chevron',17)}</button></div></header><div class="calendar-summary"><strong>${esc(monthLabel)}</strong><span>${monthEvents.length} sự kiện trong tháng</span><div class="calendar-legend"><span><i class="effective"></i>Hiệu lực</span><span><i class="deadline"></i>Hạn pháp lý</span><span><i class="risk"></i>Thực thi</span><span><i class="reminder"></i>Nhắc việc</span></div></div><div class="calendar-layout"><div class="calendar-grid-wrap"><div class="calendar-grid"><div class="calendar-weekdays">${['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'].map(day=>`<span>${day}</span>`).join('')}</div><div class="calendar-days">${cells}</div></div></div><aside class="upcoming-events"><div class="upcoming-heading"><div><span class="rail-kicker">SẮP TỚI</span><h3>Các mốc gần nhất</h3></div><span>${upcoming.length}</span></div>${upcomingList}</aside></div></section>`;
}
function renderDemoTodayQueue(){
 const buckets={overdue:[],soon:[],doing:[]};for(const task of tasks()){if(['done','na'].includes(task.status))continue;const dates=[state.dueDates[task.id],task.legalDate].filter(Boolean),days=dates.length?Math.min(...dates.map(d=>daysUntil(d))):Infinity;if(days<0)buckets.overdue.push(task);else if(days<=7)buckets.soon.push(task);else if(['doing','review'].includes(task.status))buckets.doing.push(task);}
 const count=Object.values(buckets).reduce((n,x)=>n+x.length,0);return [['overdue','Quá hạn'],['soon','Đến hạn hôm nay / trong 7 ngày tới'],['doing','Đang thực hiện']].map(([key,label])=>buckets[key].length?`<section data-today-group="${key}"><h3>${label} (${buckets[key].length})</h3><div class="task-list">${buckets[key].map(taskCard).join('')}</div></section>`:'').join('')||'<div class="empty-state"><h3>Chưa có việc cần chú ý hôm nay</h3><p>Xem toàn bộ checklist trong mục Công việc.</p></div>';
}
function renderDashboard(){
  const c=counts(),active=tasks().filter(task=>state.tab==='done'?['done','na'].includes(task.status):state.tab==='verify'?task.status==='verify':['todo','verify','doing','review'].includes(task.status)).slice(0,5),newCount=newAlertCount();
  const date=new Date().toLocaleDateString('vi-VN',{day:'2-digit',month:'long',year:'numeric'});
  const heading=pageTitle('ƯU TIÊN HÔM NAY','Việc doanh nghiệp cần chú ý','',`<span class="today-label">${icon('calendar',17)}${date}</span>`);
  const inProgress=c.doing+c.review,activeProcessing=c.todo+inProgress;
  const metrics=[['todo','Đang xử lý',activeProcessing,'alert','red',`Đang thực hiện: ${String(inProgress).padStart(2,'0')} công việc`],['verify','Cần xác minh',c.verify,'help','amber','Thông tin còn thiếu trước khi kết luận'],['done','Đã hoàn tất',c.done+c.na,'check','teal','Đã kết thúc hoặc ghi nhận không áp dụng']];
  const stats=`<div class="metric-grid">${metrics.map(([tab,label,count,glyph,tone,hint],index)=>{const pct=c.total?Math.min(100,Math.round(count/c.total*100)):0;const bars=[34+index*8,58-index*5,46+index*11,78-index*7];return `<button class="metric-card metric-${tone}" data-open-tab="${tab}" aria-label="${label}: ${count} trên ${c.total} công việc"><span class="metric-top"><span>${label}</span><span class="summary-icon ${tone}">${icon(glyph,18)}</span></span><span class="metric-visual"><span class="metric-gauge" style="--gauge:${pct}%"><span><b>${count.toString().padStart(2,'0')}<i>/${c.total.toString().padStart(2,'0')}</i></b><small>${pct}%</small></span></span><span class="metric-mini-chart" aria-hidden="true">${bars.map(height=>`<i style="height:${height}%"></i>`).join('')}</span></span><span class="metric-hint">${hint}</span></button>`}).join('')}</div>`;
  const due=imminentTasks();
  const reminder=due.length?`<button class="reminder-banner" data-jump-task="${due[0].id}">${icon('calendar',20)}<span><strong>${due.length} việc đến ngày nhắc nội bộ</strong><small>${esc(due[0].title)}</small></span>${icon('arrow',18)}</button>`:'';
  const leadAlert=relevantAlerts().find(alert=>alertStatus(alert.id)==='new');
  const banner=newCount?`<button class="alert-banner ${esc(alertKindMeta[leadAlert.kind]?.tone||'upcoming')}" data-nav="alerts"><span class="alert-banner-icon">${icon(leadAlert.kind==='opportunity'?'calendar':'bell',20)}</span><span class="alert-banner-text"><strong>${newCount} cảnh báo có thể liên quan đến doanh nghiệp</strong><small>${esc(alertLeadLine(leadAlert))}</small></span><span class="alert-banner-cta">Xem cảnh báo ${icon('arrow',17)}</span></button>`:'';
  const progress=c.total?Math.round((c.done+c.na)/c.total*100):0;
  const right=`<aside class="right-rail"><section class="progress-card"><div class="section-heading"><h3>Tiến độ công việc</h3>${icon('list',19)}</div><div class="progress-visual"><div class="progress-value"><strong>${c.done+c.na}<small> / ${c.total}</small></strong><span>việc đã kết thúc</span></div><div class="progress-donut" style="--progress:${progress}%" role="progressbar" aria-label="Tiến độ công việc" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><span><strong>${progress}%</strong><small>${c.done+c.na}/${c.total}</small></span></div></div><p>Đây là tiến độ xử lý, không phải điểm đánh giá tuân thủ.</p></section><section class="event-panel"><div class="section-heading"><div><span class="rail-kicker">DOANH NGHIỆP THAY ĐỔI?</span><h3>Cập nhật hồ sơ nhanh</h3></div>${icon('rotate',19)}</div><p>Một thay đổi vận hành có thể làm phát sinh checklist mới.</p><div class="event-actions">${eventButtons()}</div></section><div class="session-note saved">${icon('check',17)}<span>Tiến độ được lưu trên trình duyệt này.</span></div></aside>`;
  const lower=`<div class="dashboard-lower"><section><div class="section-heading"><div><h2>Hàng đợi ưu tiên</h2><p>Việc quá hạn, đến hạn trong 7 ngày tới và đang thực hiện.</p></div><button class="text-action" data-nav="checklist">Xem tất cả công việc ${icon('arrow',16)}</button></div>${renderDemoTodayQueue()}</section>${right}</div>`;
  return heading+stats+reminder+banner+renderComplianceCalendar()+lower;
}
function renderChecklist(){
  const c=counts();
  const activeProcessing=c.todo+c.doing+c.review;
  const tabs=[['all','Tất cả',c.total],['verify','Cần xác minh',c.verify],['todo','Cần xử lý',c.todo],['doing','Đang thực hiện',c.doing+c.review],['done','Đã xử lý',c.done+c.na]];
  const query=state.checklistQuery.trim().toLocaleLowerCase('vi');
  const categories=[...new Set(tasks().map(task=>task.category))];
  let filtered=tasks().filter(task=>(state.tab==='all'||(state.tab==='done'?['done','na'].includes(task.status):state.tab==='doing'?['doing','review'].includes(task.status):task.status===state.tab))&&(state.taskCategory==='all'||task.category===state.taskCategory)&&(!query||`${task.title} ${task.owner} ${labels[task.category]}`.toLocaleLowerCase('vi').includes(query)));
  if(state.checklistSort==='title')filtered.sort((a,b)=>a.title.localeCompare(b.title,'vi'));
  if(state.checklistSort==='category')filtered.sort((a,b)=>(labels[a.category]||a.category).localeCompare(labels[b.category]||b.category,'vi'));
  const controls=`<form id="checklist-search-form" class="list-controls"><label class="search-control">${icon('search',17)}<input name="query" value="${esc(state.checklistQuery)}" placeholder="Tìm công việc, người phụ trách…" aria-label="Tìm công việc"></label><label>Nhóm<select name="category"><option value="all">Tất cả</option>${categories.map(cat=>`<option value="${cat}" ${state.taskCategory===cat?'selected':''}>${esc(labels[cat]||cat)}</option>`).join('')}</select></label><label>Sắp xếp<select name="sort"><option value="attention" ${state.checklistSort==='attention'?'selected':''}>Ưu tiên hành động</option><option value="category" ${state.checklistSort==='category'?'selected':''}>Theo nhóm</option><option value="title" ${state.checklistSort==='title'?'selected':''}>Theo tên</option></select></label><button class="secondary-button" type="submit">Áp dụng</button></form>`;
  return `${pageTitle('CÔNG VIỆC CỦA DOANH NGHIỆP','Công việc tuân thủ','Toàn bộ checklist, việc cần xác minh, cần xử lý và đã xử lý của doanh nghiệp.',`<button class="secondary-button" data-nav="profile">${icon('building',17)} Điều chỉnh hồ sơ</button>`)}<div class="disclaimer-banner">${icon('help',18)}<span>Mục Công việc lưu toàn bộ checklist; các cảnh báo pháp luật được quản lý riêng trong mục Cảnh báo.</span></div><div class="tab-bar" role="tablist" aria-label="Lọc công việc">${tabs.map(([key,label,count])=>`<button role="tab" aria-selected="${state.tab===key}" class="${state.tab===key?'active':''}" data-tab="${key}">${label}<span>${count}</span></button>`).join('')}</div>${controls}<div class="task-list checklist-list">${filtered.length?filtered.map(taskCard).join(''):'<div class="empty-state">'+icon('search',28)+'<h3>Không tìm thấy công việc phù hợp</h3><p>Vào Hôm nay để chọn việc bắt đầu xử lý, hoặc đổi nhóm và từ khóa tìm kiếm.</p></div>'}</div>`;
}
function alertActions(alert,applies,status){
  const id=alert.id;
  if(status==='applied')return `<div class="alert-card-actions"><span class="alert-state-pill teal">${icon('check',15)} Đã tạo công việc</span><button class="text-button" data-alert-restore="${id}">${icon('rotate',15)} Xóa công việc này</button></div>`;
  if(status==='snoozed')return `<div class="alert-card-actions"><span class="alert-state-pill amber">${icon('calendar',15)} Nhắc lại trong LIMI ngày ${fmt(state.alertStates[id]?.until)}</span><button class="text-button" data-alert-restore="${id}">${icon('rotate',15)} Khôi phục</button></div>`;
  if(status==='ignored')return `<div class="alert-card-actions"><span class="alert-state-pill gray">Đã bỏ qua</span><button class="text-button" data-alert-restore="${id}">${icon('rotate',15)} Khôi phục</button></div>`;
  return `<div class="alert-card-actions"><button class="primary-button" data-alert-apply="${id}">Tạo công việc ${icon('arrow',17)}</button><button class="secondary-button" data-alert-snooze="${id}">${icon('calendar',16)} Chọn ngày nhắc lại</button><button class="ghost-danger" data-alert-ignore="${id}">Bỏ qua</button></div>`;
}
function alertProfileNote(alert,applies){
  const field=labels[alert.category]||alert.category||'Chưa phân loại';
  return `<p class="alert-profile-note ${applies?'is-related':'needs-review'}"><strong>${applies?'Liên quan đến':'Lĩnh vực theo dõi'}:</strong> ${esc(field)} <span>·</span> ${esc(applies?(alert.matchLabel||'Đã khớp tín hiệu trong hồ sơ'):'Chưa khớp đủ tín hiệu hồ sơ; checklist sẽ bắt đầu bằng bước xác minh phạm vi.')}</p>`;
}
function alertTopicLabel(alert){
  const field=labels[alert.category]||alert.category||'Chưa phân loại';
  return state.profile?.topics?.includes(alert.category)?`Quan tâm: ${field}`:`Không tick: ${field}`;
}
function alertCard(alert){
  const id=alert.id;
  const applies=alert.test(state.profile);
  const status=alertStatus(alert.id);
  const reason=state.alertStates[alert.id]?.reason;
  const kind=alertKindMeta[alert.kind]||alertKindMeta.upcoming;
  const expanded=Boolean(state.alertExpanded[alert.id]);
  const keyDate=alert.deadlineDate||alert.effectiveDate||alert.observedAt||alert.issuedAt;
  const change=`<div class="alert-change"><span>${alert.kind==='enforcement'?'VÌ SAO RỦI RO ĐANG TĂNG':alert.kind==='effective'?'ĐIỂM PHẢI KIỂM TRA NGAY':'ĐIỂM CẦN BIẾT'}</span><ul>${alert.changes.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></div>`;
  const prep=`<div class="alert-prep"><span>CHUẨN BỊ NHƯ THẾ NÀO?</span><ol>${alert.prepareSteps.map(item=>`<li>${esc(item)}</li>`).join('')}</ol></div>`;
  const milestone=renderAlertMilestones(alert);
  const guidance=alert.kind==='enforcement'?`<div class="enforcement-columns"><div class="enforcement-left">${milestone}${prep}</div>${change}</div>`:`${milestone}${change}${prep}`;
  const detail=`${renderAlertTimeline(alert)}${guidance}<div class="recommendation"><h3>Gợi ý từ LIMI</h3><p>${esc(applies?alert.recommendation.yes:alert.recommendation.no)}</p></div><div class="alert-sources"><a href="${esc(alert.sourceUrl)}" target="_blank" rel="noopener noreferrer">${icon('link',15)} Văn bản nguồn ↗</a><a href="${esc(alert.explainerUrl)}" target="_blank" rel="noopener noreferrer">${icon('link',15)} Giải thích từ Cổng Chính phủ ↗</a>${alert.resultUrl?`<a href="${esc(alert.resultUrl)}" target="_blank" rel="noopener noreferrer">${icon('link',15)} Số liệu thực thi ↗</a>`:''}</div>`;
  return `<article class="alert-card real-alert compact kind-${kind.tone} phase-${alertFilterBucket(alert)} ${applies?'':'muted'} ${status!=='new'?'resolved':''}" id="alert-${id}"><div class="alert-card-head"><span class="alert-impact-chip ${applies?'on':'off'}">${applies?'Có ảnh hưởng DN':'Không ảnh hưởng DN'}</span><span class="alert-topic-chip ${state.profile?.topics?.includes(alert.category)?'on':'off'}">${esc(alertTopicLabel(alert))}</span><span class="alert-phase ${kind.tone}">${esc(alertPhaseLabel(alert))}</span></div><h3>${esc(alert.title)}</h3><p class="alert-card-summary">${esc(alert.summary)}</p><div class="alert-snapshot"><div><span>MỐC QUAN TRỌNG</span><strong>${fmt(keyDate)}</strong><small>${esc(alertLeadLine(alert))}</small></div><div><span>TÁC ĐỘNG VỚI HỒ SƠ</span><p>${esc(applies?alert.impact.yes:alert.impact.no)}</p></div></div>${expanded?`<div class="alert-detail">${detail}</div>`:''}<button class="alert-expand" data-alert-toggle="${id}" aria-expanded="${expanded}">${expanded?'Thu gọn':'Xem tác động, lộ trình và căn cứ'} ${icon('chevron',15)}</button>${status==='ignored'&&reason?`<p class="alert-reason">${icon('help',14)} Lý do bỏ qua: ${esc(reason)}</p>`:''}${alertActions(alert,applies,status)}</article>`;
}
function freshTag(dateStr){
  const d=daysUntil(dateStr);
  return d>0?`<span class="fresh-tag soon">Sắp hiệu lực · còn ${d} ngày</span>`:d>=-180?`<span class="fresh-tag">Mới hiệu lực</span>`:'';
}
function legalCard(doc){
  const related=doc.relatedTaskIds.map(id=>tasks().find(task=>task.id===id)).find(Boolean);
  const signal=alerts.some(alert=>alert.sourceCode===doc.code&&alert.test(state.profile));
  return `<article class="legal-card ${doc.status==='superseded'?'historical-source':''}"><div class="legal-card-top"><span class="legal-type">${esc(doc.type)} · ${esc(doc.code)}</span><span class="relev-chip ${doc.status==='superseded'?'off':related||signal?'on':'off'}">${doc.status==='superseded'?'ĐÃ HẾT HIỆU LỰC · THAM CHIẾU':related||signal?'Có tín hiệu trong hồ sơ':'Chưa có tín hiệu hồ sơ'}</span></div><h3>${esc(doc.title)}</h3><p>${esc(doc.focus)}</p><div class="legal-card-meta"><span>Ban hành ${fmt(doc.issued)}</span><span>${doc.status==='superseded'?'Hiệu lực ban đầu':'Hiệu lực từ'} ${fmt(doc.effective)} ${doc.status==='superseded'?'':freshTag(doc.effective)}</span><span>${esc(doc.issuer)}</span></div><div class="legal-card-bottom"><span>${esc(doc.relationship)}</span><div><a class="legal-link" href="${esc(doc.url)}" target="_blank" rel="noopener noreferrer">Xem toàn văn nguồn chính thức ↗</a>${related?`<button class="text-action" data-jump-task="${related.id}">Xem việc liên quan ${icon('arrow',15)}</button>`:''}</div></div></article>`;
}
function renderAlerts(){
  if(state.libraryTab==='library')return renderRealLibrary();
  const secondary=`<div class="resource-nav"><button data-library-tab="alerts" class="${state.libraryTab==='alerts'?'active':''}">${icon('bell',16)} Cảnh báo</button><button data-library-tab="library" class="${state.libraryTab==='library'?'active':''}">${icon('file',16)} Tra cứu văn bản</button></div>`;
  const heading=pageTitle('CẢNH BÁO PHÁP LUẬT',state.libraryTab==='library'?'Tra cứu văn bản tham chiếu':'Thay đổi có thể ảnh hưởng doanh nghiệp',state.libraryTab==='library'?'Nguồn chính thức để kiểm chứng căn cứ và hiệu lực.':'Mỗi cảnh báo cho biết lý do khớp hồ sơ, mốc thời gian và việc tiếp theo.',secondary);
  const legalCats=[...new Set(legalDocuments.map(doc=>doc.category))];
  const legalRelated=doc=>doc.relatedTaskIds.some(id=>tasks().find(task=>task.id===id))||alerts.some(alert=>alert.sourceCode===doc.code&&alert.test(state.profile));
  const legalQuery=state.legalQuery.trim().toLocaleLowerCase('vi');
  const filteredDocs=legalDocuments.filter(doc=>(state.legalFilter==='all'||doc.category===state.legalFilter)&&(!state.legalRelevantOnly||legalRelated(doc))&&(!legalQuery||`${doc.code} ${doc.title} ${doc.focus}`.toLocaleLowerCase('vi').includes(legalQuery)));
  const filterBar=`<form id="legal-search-form" class="library-search"><label class="search-control">${icon('search',17)}<input name="query" value="${esc(state.legalQuery)}" placeholder="Tìm số hiệu hoặc nội dung văn bản…" aria-label="Tìm văn bản"></label><button class="secondary-button" type="submit">Tìm</button></form><div class="legal-filter"><div class="legal-filter-tabs"><button class="legal-chip ${state.legalFilter==='all'?'active':''}" data-legal-filter="all">Tất cả</button>${legalCats.map(cat=>`<button class="legal-chip ${state.legalFilter===cat?'active':''}" data-legal-filter="${cat}">${esc(labels[cat]||cat)}</button>`).join('')}</div><button class="legal-toggle ${state.legalRelevantOnly?'on':''}" data-action="toggle-legal-relevant" aria-pressed="${state.legalRelevantOnly}">${icon('check',14)} Chỉ văn bản liên quan hồ sơ</button></div>`;
  const legalBody=filteredDocs.length?`<div class="legal-grid">${filteredDocs.map(legalCard).join('')}</div>`:`<div class="empty-state">Không có văn bản khớp bộ lọc hiện tại.</div>`;
  const checkedDate=new Date().toLocaleDateString('vi-VN');
  const legal=`<section class="legal-library"><div class="section-heading"><div><h2>Thư viện văn bản tham chiếu</h2><p>${legalDocuments.length} văn bản có liên kết đến nguồn chính thức</p></div></div><div class="legal-library-note">${icon('globe',18)}<span>Nguồn hiển thị được kiểm tra gần nhất ngày ${checkedDate}. Văn bản hết hiệu lực chỉ được giữ để đối chiếu lịch sử, không sinh công việc hiện hành.</span></div>${filterBar}${legalBody}</section>`;
  const rel=relevantAlerts();
  const count=status=>rel.filter(alert=>alertStatus(alert.id)===status).length;
  const summary=`<div class="alert-overview"><span>${icon('bell',18)}</span><p><strong>${count('new')} cảnh báo cần xem</strong> · ${count('applied')} đã tạo công việc · ${rel.length} cảnh báo khớp hồ sơ</p></div>`;
  const rank=alert=>(alert.test(state.profile)?0:100)+({high:0,medium:10,low:20}[alert.severity])+(alert.kind==='effective'?-5:0);
  const filteredAlerts=[...alerts].filter(alert=>alertMatchesFilter(alert,state.alertFilter));
  const list=filteredAlerts.sort((a,b)=>rank(a)-rank(b)).map(alertCard).join('');
  const filters=`<div class="alert-filter" role="group" aria-label="Lọc cảnh báo">${[['all','Tất cả'],['related','Ảnh hưởng doanh nghiệp'],['effective','Đã có hiệu lực'],['upcoming','Sắp có hiệu lực'],['early','Theo dõi sớm'],['risk','Rủi ro kiểm tra tăng'],['new','Chưa xử lý'],['resolved','Đã xử lý / hoãn']].map(([key,label])=>`<button class="legal-chip ${state.alertFilter===key?'active':''}" data-alert-filter="${key}" aria-pressed="${state.alertFilter===key}">${label}</button>`).join('')}</div>`;
  return `${heading}${state.libraryTab==='library'?legal:`<div class="disclaimer-banner real-alert-note">${icon('help',18)}<span><strong>Tình huống cảnh báo trong bản trải nghiệm.</strong> Phần ghép hồ sơ và checklist là nội dung demo hỗ trợ rà soát, chưa thay thế tư vấn pháp lý.</span></div>${summary}${filters}<div class="alert-list">${list||'<div class="empty-state"><h3>Không có cảnh báo khớp bộ lọc</h3><p>Chọn “Tất cả” để xem các cảnh báo còn lại.</p></div>'}</div>`}`;
}
function renderPipeline(){
  const matched=checklistTemplates.filter(template=>templateMatch(state.profile,template)==='match');
  const current=legalAnalyses.filter(analysis=>analysis.status==='current');
  const analysisCards=legalAnalyses.map((analysis,index)=>{
    const doc=sourceById(analysis.sourceId);
    const linked=analysis.templateIds.map(checklistTemplateById).filter(Boolean);
    const findings=analysis.findings.map(item=>`<li><strong>${esc(item.clause)}</strong><span>${esc(item.importantPoint)}</span><small>Đối tượng: ${item.affectedGroups.map(esc).join(', ')} · Khi: ${esc(item.conditionLabel)}</small></li>`).join('');
    return `<article class="pipeline-source ${analysis.status==='superseded'?'historical-source':''}"><div class="pipeline-source-top"><span class="pipeline-index">${String(index+1).padStart(2,'0')}</span><span class="pipeline-doc-code">${esc(doc.code)}</span><span class="pipeline-topic">${analysis.status==='superseded'?'Đã hết hiệu lực':esc(labels[analysis.topic])}</span></div><h3>${esc(doc.title)}</h3><p class="pipeline-clause">${esc(analysis.clause)}</p><div class="pipeline-extract"><span>${analysis.status==='superseded'?'KIỂM TRA HIỆU LỰC':'TÁCH ĐIỀU/KHOẢN QUAN TRỌNG'}</span><p>${esc(analysis.importantPoint)}</p></div><details class="pipeline-findings"><summary>Xem ${analysis.findings.length} ý đã tách và điều kiện áp dụng ${icon('chevron',15)}</summary><ol>${findings}</ol></details><div class="pipeline-audience"><strong>Nhóm chịu ảnh hưởng</strong><p>${analysis.affectedGroups.map(esc).join(' · ')}</p><small>Điều kiện đối chiếu: ${esc(analysis.conditionLabel)}</small></div><div class="pipeline-source-bottom"><span>${linked.length?`Chuyển thành → ${linked.map(template=>esc(template.title)).join(' · ')}`:'Không tạo việc hiện hành từ nguồn này'}</span><a href="${esc(doc.url)}" target="_blank" rel="noopener noreferrer">Văn bản gốc ${icon('link',15)}</a></div></article>`;
  }).join('');
  const templateCards=checklistTemplates.map(template=>{
    const match=templateMatch(state.profile,template);
    const linkedAlert=alerts.find(alert=>alert.task?.id===template.id);
    const applied=alertStatus(linkedAlert?.id||template.id)==='applied';
    const stateLabel=match==='match'?(template.manualApply?(applied?'Đã tạo công việc':'Khớp hồ sơ · chờ người dùng tạo việc'):'Đã có trong công việc'):match==='no-match'?'Không áp dụng theo hồ sơ':'Cần xác nhận hồ sơ';
    const sources=template.sourceIds.map(id=>sourceById(id)?.code).filter(Boolean).join(' + ');
    const templateAction=match==='match'?(template.manualApply&&!applied?`<button class="text-action" data-library-tab="alerts">Mở cảnh báo để áp dụng ${icon('arrow',16)}</button>`:`<button class="text-action" data-jump-task="${template.id}">Mở trong checklist ${icon('arrow',16)}</button>`):`<button class="text-action" data-nav="profile">${match==='no-match'?'Xem hồ sơ':'Bổ sung hồ sơ'} ${icon('arrow',16)}</button>`;
    return `<article class="pipeline-template"><div class="pipeline-template-head"><span class="pipeline-topic">${esc(labels[template.category])}</span><span class="pipeline-match ${match}">${stateLabel}</span></div><h3>${esc(template.title)}</h3><p class="pipeline-template-reason">${esc(template.guide.question)}</p><div class="pipeline-template-meta"><span>${icon('user',15)} ${esc(template.owner)}</span><span>${icon('file',15)} ${esc(sources)}</span></div><details><summary>Xem ${template.guide.steps.length} mục kiểm tra chi tiết ${icon('chevron',15)}</summary><ol>${template.guide.steps.map(item=>`<li><strong>${esc(item.title)}</strong>${item.when?`<small>Áp dụng: ${esc(item.when)}</small>`:''}<small>${item.refs.map(ref=>`${esc(sourceById(ref.sourceId)?.code)} · ${esc(ref.clause)}`).join(' · ')}</small></li>`).join('')}</ol><p><strong>Bằng chứng:</strong> ${esc(template.guide.proof)}</p></details>${templateAction}</article>`;
  }).join('');
  return `<section class="pipeline-page"><div class="disclaimer-banner">${icon('help',18)}<span><strong>Phạm vi demo có kiểm chứng nguồn.</strong> Các điều/khoản chọn lọc được biên soạn thủ công từ văn bản chính thức; đây là mô phỏng đầu ra hai bước AI, không phải AI đang chạy hay bản thẩm định pháp lý. Chưa bao phủ toàn bộ nghĩa vụ trong các văn bản. Hai nghị định hóa đơn cũ được giữ để cho thấy kiểm soát hiệu lực, không tạo việc hiện hành.</span></div><div class="pipeline-intro"><div><span class="rail-kicker">LUỒNG XỬ LÝ TRƯỚC KHI NGƯỜI DÙNG VÀO</span><h2>Từ điều khoản thật đến việc có thể kiểm tra</h2><p>Mỗi ý lưu căn cứ, đối tượng, điều kiện áp dụng và bước kiểm tra kèm bằng chứng. Khi doanh nghiệp truy cập, hệ thống chỉ lọc mẫu đã biên soạn — không gọi AI mỗi lần.</p></div><div class="pipeline-counts"><div><strong>${current.length}</strong><span>nguồn đang áp dụng</span></div><div><strong>${current.reduce((sum,item)=>sum+item.findings.length,0)}</strong><span>ý đã tách</span></div><div><strong>${checklistTemplates.reduce((sum,item)=>sum+item.guide.steps.length,0)}</strong><span>mục kiểm tra</span></div></div></div><div class="pipeline-flow"><span><b>01</b> Nguồn & hiệu lực</span>${icon('arrow',18)}<span><b>02</b> Ý quan trọng · nhóm · điều kiện</span>${icon('arrow',18)}<span><b>03</b> Checklist + bằng chứng</span>${icon('arrow',18)}<span><b>04</b> Khớp hồ sơ DN</span></div><div class="pipeline-columns"><section><div class="section-heading"><div><h2>Điều khoản đã phân tích</h2><p>${current.length} nguồn hiện hành · 2 nguồn lịch sử đối chiếu</p></div></div><div class="pipeline-source-list">${analysisCards}</div></section><section><div class="section-heading"><div><h2>Checklist đã lưu</h2><p>${checklistTemplates.length} mẫu, độ dài theo nội dung quy định</p></div></div><div class="pipeline-template-list">${templateCards}</div></section></div></section>`;
}
function renderProfile(){
  const p=state.profile;
  const factText=(key)=>productEnabled?(p._unknown?.[key]?'Chưa xác nhận':p[key].length?listText(p[key]):'Xác nhận không có'):listText(p[key]);
  const facts=[['Giai đoạn',labels[p.stage]],['Quy mô lao động',labels[p.employees]],['Hoạt động',factText('activity')],['Kênh bán',factText('channels')],['Địa điểm',factText('places')],['Tình huống',factText('signals'),p.signals],['Theo dõi thêm',listText(p.topics),p.topics]];
  const info=(items)=>`<dl class="info-grid">${items.map(([key,value,chipValues])=>`<div><dt>${key}</dt><dd class="${value?'':'missing-value'}">${chipValues?.length?`<span class="profile-chip-list">${chipValues.map(item=>`<span>${esc(labels[item]||item)}</span>`).join('')}</span>`:esc(value||'Chưa có thông tin')}</dd></div>`).join('')}</dl>`;
  const real=p.sourceKind==='live',manual=p.sourceKind==='manual';
  const fields=real||manual?[['Mã số thuế',p.taxId],['Tên quốc tế',p.internationalName],['Tên viết tắt',p.shortName],['Tình trạng thuế',p.status],['Địa chỉ đăng ký',p.address]]:[['Mã hồ sơ mẫu',p.taxId],['Loại hình',p.type],['Ngày thành lập',fmt(p.founded)],['Tình trạng',p.status],['Ngành đăng ký',p.registered],['Tỉnh/thành',p.province]];
  const main=`<section class="profile-main"><div class="profile-identity"><div class="profile-avatar">${esc(initials(p))}</div><div><span class="eyebrow">${real?'DOANH NGHIỆP ĐÃ TRA CỨU':manual?'DOANH NGHIỆP TỰ NHẬP':'DOANH NGHIỆP MẪU'}</span><h2>${esc(p.name)}</h2><p>${esc(p.shortName||p.taxId)}</p></div></div>${productEnabled?'':`<div class="profile-section"><div class="section-heading"><h3>Thông tin nhận diện</h3><span class="source-pill">${real?'Từ nguồn tra cứu':manual?'Tự khai báo':'Dữ liệu giả định'}</span></div>${info(fields)}${real?`<div class="source-receipt"><span>Nguồn: <a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.sourceName)} ↗</a></span><span>Tra cứu: ${timeLabel(p.retrievedAt)}</span></div><p class="field-hint">Nguồn chưa cung cấp ngày thành lập, người đại diện, vốn điều lệ, loại hình và ngành nghề đăng ký.</p>`:''}</div>`}<div class="profile-section"><div class="section-heading"><h3>Hoạt động thực tế</h3><span class="source-pill neutral">${productEnabled?'Theo trạng thái xác nhận':'Bạn xác nhận'}</span></div>${info(facts)}<div class="profile-buttons"><button class="secondary-button" data-action="edit-answers">Sửa hoạt động</button><button class="secondary-button" data-action="edit-topics">Sửa nhóm quan tâm</button></div></div></section>`;
  const history=state.history.length?`<div class="history-list">${state.history.map(entry=>`<div><span class="history-dot"></span><section><strong>${esc(entry.message)}</strong><small>${esc(entry.at)}</small></section></div>`).join('')}</div>`:'<p class="muted-copy">Chưa có cập nhật nào.</p>';
  return `${pageTitle('THÔNG TIN DOANH NGHIỆP','Hồ sơ doanh nghiệp','Cơ sở để xác định phạm vi công việc và cảnh báo phù hợp.',`<button class="secondary-button" data-nav="checklist">Xem công việc ${icon('arrow',17)}</button>`)}<div class="profile-grid">${main}<aside class="profile-side"><div class="history-panel"><span class="rail-kicker">NHẬT KÝ GẦN ĐÂY</span><h3>Thay đổi đã lưu</h3>${history}</div><div class="session-note saved">${icon('check',18)}<span>${productEnabled?'Hồ sơ được lưu theo tài khoản của bạn. Đổi doanh nghiệp không xóa dữ liệu.':'Hồ sơ và tiến độ được lưu trên trình duyệt này. Dùng “Đổi doanh nghiệp” để xóa và bắt đầu lại.'}</span></div></aside></div>`;
}
function renderDetail(){
  const task=tasks().find(item=>item.id===state.selectedTask);
  if(!task)return '';
  const guide=getTaskGuide(task), checked=state.taskSteps[task.id]||{}, evidence=state.evidenceNotes[task.id]||'';
  const summaryOnly=task.status==='verify';
  const detailed=!summaryOnly&&detailedGuide(guide);
  const basis=guide.basis.length?guide.basis.map(id=>sourceById(id)).filter(Boolean).map(doc=>`<div class="basis-item"><strong>${esc(doc.code)} · ${esc(doc.title)}</strong><small>${esc(doc.focus)}</small><button class="text-action" data-find-law="${esc(doc.code)}">Tra trong kho luật</button><a href="${esc(doc.url)}" target="_blank" rel="noopener noreferrer">Mở toàn văn chính thức ↗</a>${doc.companionUrl?`<a href="${esc(doc.companionUrl)}" target="_blank" rel="noopener noreferrer">Xem bản hợp nhất 2026 ↗</a>`:''}</div>`).join(''):`<div class="source-box">${esc(task.source)}<br>Chưa có căn cứ cụ thể được thẩm định cho mục này.</div>`;
  const progress=stepCount(task);
  const complete=taskReady(task,guide);
  const choices=summaryOnly?[]:[['doing','Đang xử lý'],['na','Không áp dụng']];
  const reviewCards=detailed?guide.steps.map((item,index)=>{
    const result=checked[index]||'';
    const refs=item.refs.map(ref=>{const doc=sourceById(ref.sourceId);return doc?`<a href="${esc(doc.url)}" target="_blank" rel="noopener noreferrer">${esc(doc.code)} · ${esc(ref.clause)} ↗</a>`:''}).join('');
    const checks=item.checks?.length?`<div class="review-checks"><strong>Cần đối chiếu lần lượt</strong><ul>${item.checks.map(check=>`<li>${esc(check)}</li>`).join('')}</ul></div>`:'';
    return `<article class="review-step ${result}"><div class="review-step-head"><span class="step-number-mini">${String(index+1).padStart(2,'0')}</span><h4>${esc(item.title)}</h4></div>${item.when?`<div class="review-when">CHỈ KHI · ${esc(item.when)}</div>`:''}<p>${esc(item.detail)}</p>${checks}<div class="review-evidence"><strong>Bằng chứng cần đối chiếu</strong><span>${esc(item.evidence)}</span></div><div class="review-refs">${refs}</div><div class="review-actions" role="group" aria-label="Kết quả mục ${index+1}">${[['pass','Đạt'],['issue','Cần xử lý'],['na','Không áp dụng']].map(([value,label])=>`<button type="button" class="${result===value?'selected '+value:''}" data-step-result="${value}" data-step-task="${task.id}" data-step-index="${index}" aria-pressed="${result===value}">${esc(label)}</button>`).join('')}</div>${result?`<label class="review-note">${result==='na'?'Lý do không áp dụng (bắt buộc)':result==='issue'?'Điểm thiếu / việc cần xử lý':'Ghi chú bằng chứng (tùy chọn)'}<textarea rows="2" data-step-note="${task.id}" data-step-index="${index}" placeholder="${result==='na'?'Nêu điều kiện không phát sinh...':result==='issue'?'Nêu điểm chưa đạt và người xử lý...':'Mã hồ sơ hoặc nơi lưu nội bộ...'}">${esc(state.stepNotes[task.id]?.[index]||'')}</textarea></label>`:''}</article>`;
  }):[];
  const checklist=detailed?Array.from({length:Math.ceil(reviewCards.length/4)},(_,groupIndex)=>{const start=groupIndex*4,end=Math.min(start+4,reviewCards.length);return `<details class="review-group" ${groupIndex===0?'open':''}><summary><span>Nhóm ${groupIndex+1}</span><strong>Mục ${start+1}–${end}</strong><small>${[...Array(end-start)].filter((_,offset)=>checked[start+offset]).length}/${end-start} đã đánh giá</small>${icon('chevron',16)}</summary><div>${reviewCards.slice(start,end).join('')}</div></details>`}).join(''):guide.steps.map((item,index)=>`<label class="step-line"><input type="checkbox" data-step-task="${task.id}" data-step-index="${index}" ${checked[index]?'checked':''}><span class="step-number-mini">${index+1}</span><span>${esc(item)}</span></label>`).join('');
  const verifyBody=summaryOnly?`<div class="verification-brief"><div class="verification-brief-head"><span class="verification-icon">${icon('help',19)}</span><div><strong>Đây là bước xác minh phạm vi</strong><p>Chưa cần đánh từng checklist. Hãy đọc tóm tắt, chuẩn bị thông tin cần thiết rồi quyết định có đưa việc này vào hàng xử lý hay không.</p></div></div><div class="verification-facts"><div><span>VẤN ĐỀ CẦN LÀM RÕ</span><strong>${esc(guide.question)}</strong></div><div><span>THÔNG TIN CẦN CÓ</span><strong>${esc(guide.proof)}</strong></div><div><span>NGƯỜI PHỤ TRÁCH GỢI Ý</span><strong>${esc(task.owner)}</strong></div><div><span>THỜI ĐIỂM RÀ SOÁT</span><strong>${esc(guide.timing)}</strong></div></div></div><div class="sheet-section"><h3>Căn cứ tham khảo</h3><div class="basis-list">${basis}</div><p class="detail-hint">Các trích dẫn liên kết tới nguồn chính thức. Đây là bản tóm tắt để quyết định có xử lý, chưa phải kết luận tuân thủ.</p></div>`:`<div class="sheet-section"><h3>1. Trạng thái công việc</h3><p>Chọn trạng thái của quá trình rà soát — đây không phải câu trả lời cho câu hỏi nghiệp vụ phía trên.</p><div class="answer-grid">${choices.map(([value,label])=>`<button class="answer-option ${task.status===value?'selected':''}" data-answer="${value}" data-id="${task.id}" aria-pressed="${task.status===value}">${esc(label)}</button>`).join('')}</div></div><div class="sheet-section"><div class="detail-section-row"><h3>2. ${detailed?'Các điểm cần kiểm tra':'Các bước xử lý'}</h3><span>${progress}/${guide.steps.length} ${detailed?'mục đã đánh giá':'bước'}</span></div>${detailed?`<p class="review-guidance">Đánh giá từng tiêu chí theo bằng chứng. “Không áp dụng” ở đây chỉ dành cho một tiêu chí; nút cuối trang dành cho toàn bộ công việc.</p>`:''}<div class="step-checklist ${detailed?'detailed':''}">${checklist}</div></div><div class="sheet-section"><h3>3. Ghi chú bằng chứng và điều kiện kết thúc</h3><p><strong>Nên lưu nội bộ:</strong> ${esc(guide.proof)}</p><p><strong>Kết thúc rà soát khi:</strong> ${esc(guide.done)}</p><form id="evidence-form" data-task="${task.id}" class="evidence-form"><label for="evidence-note">Ghi chú vị trí lưu hoặc mã hồ sơ</label><textarea id="evidence-note" name="evidence" rows="3" data-evi-task="${task.id}" placeholder="Ví dụ: đã đối chiếu ngày..., tài liệu lưu tại thư mục nội bộ...">${esc(evidence)}</textarea><button type="submit" class="secondary-button">Lưu ghi chú</button></form><p class="detail-hint">LIMI demo chỉ lưu ghi chú, không tải lên hoặc lưu trữ chứng từ thật.</p></div><div class="sheet-section"><h3>4. Người phụ trách và nhắc việc</h3><p><strong>Gợi ý:</strong> ${esc(task.owner)}</p><p>${esc(guide.timing)}</p><label class="date-field" for="due-date">Nhắc trong LIMI vào ngày <input id="due-date" type="date" data-due-task="${task.id}" value="${esc(state.dueDates[task.id]||'')}"></label><p class="detail-hint">Mốc này được lưu trên trình duyệt và hiển thị trong LIMI; không gửi email hay thông báo hệ thống.</p></div><div class="sheet-section"><h3>5. Nguồn văn bản và mức tin cậy</h3><div class="basis-list">${basis}</div><p class="detail-hint">Các trích dẫn liên kết tới nguồn chính thức. Diễn giải/checklist được biên soạn cho demo và chưa thay thế thẩm định pháp lý.</p></div>${task.status==='na'&&state.naReasons[task.id]?`<div class="sheet-section"><h3>Lý do toàn bộ công việc không áp dụng</h3><p>${esc(state.naReasons[task.id])}</p></div>`:''}`;
  const verifyFooter=summaryOnly?`<div class="completion-note">Chọn “Cần xử lý” để mở checklist đầy đủ. Nếu đã xác minh và không cần làm thêm, chọn “Đã hoàn thành”; nếu không thuộc phạm vi, chọn “Bỏ qua”.</div><button class="primary-button" data-verify-action="todo" data-id="${task.id}">Cần xử lý ${icon('arrow',17)}</button><button class="secondary-button verify-complete" data-verify-action="done" data-id="${task.id}">${icon('check',17)} Đã hoàn thành</button><button class="ghost-danger" data-verify-action="ignore" data-id="${task.id}">Bỏ qua</button>`:`<div class="completion-note">${completionText(task,guide)}</div><button class="primary-button" data-status="done" data-id="${task.id}" ${complete?'':'disabled'}>${detailed?'Kết thúc rà soát':'Xác nhận hoàn tất'}</button><button class="ghost-danger" data-status="na" data-id="${task.id}">Không áp dụng toàn bộ</button>`;
  return `<div class="overlay-backdrop"><aside class="detail-sheet" role="dialog" aria-modal="true" aria-label="Chi tiết công việc"><div class="sheet-top">${statusBadge(task.status)}<button class="close-button" data-action="close-detail" aria-label="Đóng">${icon('close',20)}</button></div><div class="sheet-content"><span class="rail-kicker">${esc(labels[task.category])} ${task.priority==='high'?'· ƯU TIÊN CAO':''}</span><h2>${esc(task.title)}</h2><div class="detail-intro"><strong>${summaryOnly?'Tóm tắt để xác minh':'Câu hỏi cần làm rõ'}</strong><p>${esc(guide.question)}</p></div>${verifyBody}</div><div class="sheet-footer detail-footer">${verifyFooter}</div></aside></div>`;
}
function renderNaDialog(){
  if(!state.pendingNa)return '';
  const task=tasks().find(item=>item.id===state.pendingNa);
  const skipping=task?.status==='verify';
  return `<div class="overlay-backdrop centered"><div class="reason-dialog" role="dialog" aria-modal="true" aria-labelledby="reason-title"><button class="close-button" data-action="cancel-na" aria-label="Đóng">${icon('close',20)}</button><div class="dialog-icon">${icon('help',22)}</div><h2 id="reason-title">${skipping?'Vì sao bỏ qua mục này?':'Vì sao công việc này không áp dụng?'}</h2><p>${esc(task?.title||'')}</p><form id="na-form"><label for="na-reason">${skipping?'Lý do bỏ qua':'Lý do ngắn'}</label><textarea id="na-reason" name="reason" rows="4" required placeholder="${skipping?'Ví dụ: không thuộc phạm vi hoạt động của doanh nghiệp...':'Ví dụ: doanh nghiệp không còn hoạt động này...'}"></textarea><div class="dialog-actions"><button type="button" class="secondary-button" data-action="cancel-na">Hủy</button><button class="primary-button" type="submit">${skipping?'Bỏ qua mục này':'Lưu trạng thái'}</button></div></form></div></div>`;
}
function renderIgnoreDialog(){
  if(!state.pendingIgnore)return '';
  const alert=alerts.find(item=>item.id===state.pendingIgnore);
  return `<div class="overlay-backdrop centered"><div class="reason-dialog" role="dialog" aria-modal="true" aria-labelledby="ignore-title"><button class="close-button" data-action="cancel-ignore" aria-label="Đóng">${icon('close',20)}</button><div class="dialog-icon">${icon('bell',22)}</div><h2 id="ignore-title">Vì sao bỏ qua cảnh báo này?</h2><p>${esc(alert?.title||'')}</p><form id="ignore-form"><label for="ignore-reason">Lý do ngắn</label><textarea id="ignore-reason" name="reason" rows="4" required placeholder="Ví dụ: không liên quan đến hoạt động hiện tại của doanh nghiệp..."></textarea><div class="dialog-actions"><button type="button" class="secondary-button" data-action="cancel-ignore">Hủy</button><button class="primary-button" type="submit">Bỏ qua cảnh báo</button></div></form></div></div>`;
}
function renderSnoozeDialog(){
  if(!state.pendingSnooze)return '';
  const alert=alerts.find(item=>item.id===state.pendingSnooze);
  const suggested=new Date();suggested.setDate(suggested.getDate()+7);
  const value=suggested.toISOString().slice(0,10);
  return `<div class="overlay-backdrop centered"><div class="reason-dialog" role="dialog" aria-modal="true" aria-labelledby="snooze-title"><button class="close-button" data-action="cancel-snooze" aria-label="Đóng">${icon('close',20)}</button><div class="dialog-icon">${icon('calendar',22)}</div><h2 id="snooze-title">Khi nào LIMI nhắc lại?</h2><p>${esc(alert?.title||'')}</p><form id="snooze-form"><label for="snooze-date">Ngày hiển thị lại cảnh báo</label><input id="snooze-date" name="until" type="date" min="${new Date().toISOString().slice(0,10)}" value="${value}" required><p class="field-hint">Cảnh báo được ẩn đến ngày này trên trình duyệt hiện tại. LIMI demo không gửi email hoặc thông báo hệ thống.</p><div class="dialog-actions"><button type="button" class="secondary-button" data-action="cancel-snooze">Hủy</button><button class="primary-button" type="submit">Lưu ngày nhắc</button></div></form></div></div>`;
}
function renderDeadlineControls(){
  const sheet=document.querySelector('.detail-sheet'),id=state.selectedTask;
  if(!sheet||!id)return;
  const task=tasks().find(item=>item.id===id);if(!task||task.status!=='doing')return;
  const due=state.dueDates[id],top=sheet.querySelector('.sheet-top'),close=top?.querySelector('.close-button');
  if(top&&close&&due){
    const chip=document.createElement('button');
    chip.type='button';chip.className='deadline-chip';chip.dataset.editDeadline=id;
    chip.setAttribute('aria-label',`Đổi hạn làm việc ${fmt(due)}`);
    chip.innerHTML=`${icon('calendar',15)} Hạn làm việc · ${fmt(due)}`;close.before(chip);
  }
  const answers=sheet.querySelector('.answer-grid');
  if(answers&&(!due||state.editingDeadline===id)){
    const prompt=document.createElement('form');
    prompt.id='deadline-form';prompt.dataset.task=id;prompt.className='deadline-prompt';
    prompt.innerHTML=`<strong>${due?'Đổi hạn làm việc':'Chọn hạn làm việc'}</strong><label for="deadline-date">Ngày hoàn thành<input id="deadline-date" name="deadline" type="date" min="${dateKey(new Date())}" value="${esc(due||'')}" required></label><button class="primary-button" type="submit">${due?'Cập nhật':'Lưu hạn làm việc'}</button>`;
    answers.after(prompt);
  }
}
function focusSelector(element){if(!element||element===document.body)return null;if(element.id)return '#'+CSS.escape(element.id);const attrs=[...element.attributes].filter(a=>a.name.startsWith('data-'));return attrs.length?element.tagName.toLowerCase()+attrs.map(a=>`[${a.name}="${CSS.escape(a.value)}"]`).join(''):null}
function render(){
  const preservedView=productEnabled?captureView():null;
  const views={feedback:renderProductFeedback,discovery:renderProductDiscovery,overview:renderProductOverview,changes:renderProductChanges,admin:renderProductAdmin,account:renderAccount,companies:renderCompanies,laws:renderRealLibrary,lookup:renderLookup,confirm:renderConfirm,questions:renderQuestions,topics:renderTopics,dashboard:()=>productEnabled?renderProductHome('dashboard'):renderDashboard(),checklist:()=>productEnabled?renderProductHome('checklist'):renderChecklist(),alerts:()=>productEnabled?renderProductHome('alerts'):renderAlerts(),profile:()=>productEnabled&&!currentCompany()?renderCompanies():renderProfile()+(productEnabled?renderProductProfile():'')};
  const wasModal=Boolean($('overlay').querySelector('[role="dialog"]')),focused=focusSelector(document.activeElement);
  $('app').innerHTML=shell((views[state.screen]||renderLookup)());$('overlay').innerHTML=state.pendingNa?renderNaDialog():state.pendingIgnore?renderIgnoreDialog():state.pendingSnooze?renderSnoozeDialog():productEnabled?renderProductDetail():renderDetail();renderDeadlineControls();
  const dialog=$('overlay').querySelector('[role="dialog"]');
  document.body.style.overflow=dialog||state.mobileMenu?'hidden':'';
  $('app').inert=Boolean(dialog);
  if(dialog&&!wasModal){returnFocusSelector=focused;dialog.querySelector('textarea,button,input')?.focus({preventScroll:true})}
  else if(wasModal&&!dialog&&returnFocusSelector){document.querySelector(returnFocusSelector)?.focus({preventScroll:true});returnFocusSelector=null}
  else if(focused){document.querySelector(focused)?.focus({preventScroll:true})}
  mountRealLibrary();
  mountProduct();
  saveState();
  if(preservedView)restoreView(preservedView);
}
function rerenderSheet(){
  const content=document.querySelector('.sheet-content'),top=content?.scrollTop||0;
  const activeSelector=focusSelector(document.activeElement);
  const activeTop=document.activeElement?.closest('[data-step-result]')&&content?document.activeElement.getBoundingClientRect().top-content.getBoundingClientRect().top:null;
  const groups=[...document.querySelectorAll('.review-group')],openGroups=groups.map((group,index)=>group.open?index:-1).filter(index=>index>=0);
  render();
  if(groups.length){document.querySelectorAll('.review-group').forEach((group,index)=>{group.open=openGroups.includes(index)})}
  const nextContent=document.querySelector('.sheet-content'),nextActive=activeSelector?document.querySelector(activeSelector):null;
  if(nextContent){
    nextContent.scrollTop=top;
    if(nextActive&&activeTop!==null){nextContent.scrollTop+=nextActive.getBoundingClientRect().top-nextContent.getBoundingClientRect().top-activeTop}
  }
  nextActive?.focus({preventScroll:true});
}
function updateCompletionUI(){
  const sheet=document.querySelector('.detail-sheet');if(!sheet)return;
  const task=tasks().find(item=>item.id===state.selectedTask);if(!task)return;
  const guide=getTaskGuide(task);
  const complete=taskReady(task,guide);
  const btn=sheet.querySelector('[data-status="done"]');if(btn)btn.disabled=!complete;
  const note=sheet.querySelector('.completion-note');if(note)note.textContent=completionText(task,guide);
}
function selectBusiness(id){if(samples[id])acceptBusiness({...structuredClone(samples[id]),sourceKind:'sample'})}

function acceptBusiness(profile){
  state={...structuredClone(defaults),profile,lastTax:profile.sourceKind==='sample'?'':profile.taxId};
  setScreen('confirm');
}
async function startLookup(){
  if(state.lookupLoading)return;
  const entered=$('business-code')?.value||'';
  state.lastTax=entered;state.lookupError='';
  if(!normalizeTaxId(entered)){state.lookupError='Nhập mã số thuế gồm 10 số hoặc 13 số, ví dụ 0316794479 hoặc 0316794479-001.';render();$('business-code')?.focus();return}
  state.lookupLoading=true;render();
  const controller=new AbortController();lookupController=controller;
  const timeout=setTimeout(()=>controller.abort('timeout'),15000);
  try{
    const profile=await (productEnabled?lookupProductBusiness:lookupBusiness)(entered,{signal:controller.signal});
    if(lookupController===controller)acceptBusiness(profile);
  }catch(error){
    if(lookupController!==controller)return;
    state.lookupLoading=false;
    state.lookupError=controller.signal.aborted?'Nguồn tra cứu phản hồi chậm. Bạn có thể thử lại hoặc tự nhập hồ sơ.':error instanceof TypeError?'Chưa kết nối được nguồn tra cứu. Kiểm tra kết nối mạng rồi thử lại, hoặc tự nhập hồ sơ.':error.message;
    render();$('business-code')?.focus();
  }finally{clearTimeout(timeout);if(lookupController===controller)lookupController=null}
}

function checked(form,name){return [...form.querySelectorAll(`[name="${name}"]:checked`)].map(input=>input.value)}
function updateBusiness(form){
  const p=state.profile;
  p.stage=checked(form,'stage')[0]||'unknown';p.activity=checked(form,'activity');
  p.employees=checked(form,'employees')[0]||'unknown';p.channels=checked(form,'channels');
  p.places=checked(form,'places');p.signals=checked(form,'signals');
}
function handleEvent(type){
  if(!state.profile)return;
  const p=state.profile;let message='';
  if(type==='hire'&&p.employees==='unknown'){setScreen('questions');toast('Hãy xác nhận quy mô lao động trước khi cập nhật tăng nhân sự.','error');return}
  if(type==='hire'&&p.employees!=='100+'){
    p.employees=p.employees==='0'?'1-9':p.employees==='1-9'?'10-49':p.employees==='10-49'?'50-99':'100+';
    message=`Cập nhật quy mô lao động: ${p.employees}`;
  }
  if(type==='warehouse'&&!p.places.includes('warehouse')){p.places.push('warehouse');message='Doanh nghiệp mở thêm kho'}
  if(type==='website'&&!p.channels.includes('website')){p.channels.push('website');message='Doanh nghiệp bắt đầu dùng website'}
  if(!message)return;
  note(message);render();toast(`Checklist được tính lại: ${message}`);
}
function setAlertStatus(id,status,reason='',until=''){
  const alert=alerts.find(item=>item.id===id);if(!alert)return;
  if(status==='applied'&&alert.task){
    // Cảnh báo đã được người dùng chọn để hành động thì đi thẳng vào hàng Cần xử lý.
    // Không yêu cầu thêm một bước xác minh vì cảnh báo đã được khớp với hồ sơ.
    state.statuses[alert.task.id]='todo';
    if(alert.prepareBy&&!state.dueDates[alert.task.id])state.dueDates[alert.task.id]=alert.prepareBy;
  }
  if(status==='new')delete state.alertStates[id];else state.alertStates[id]={status,reason,until};
  const msg={applied:'Đã tạo công việc từ cảnh báo',snoozed:`Đã đặt nhắc lại ngày ${fmt(until)}`,ignored:'Đã bỏ qua cảnh báo',new:'Đã khôi phục cảnh báo'}[status];
  note(`${msg}: ${alert.title}`);state.pendingIgnore=null;state.pendingSnooze=null;render();toast(msg+'.');
}
function updateStatus(id,value,reason=''){
  const task=tasks().find(item=>item.id===id);if(!task)return;
  if(value==='done'){
    const guide=getTaskGuide(task);
    if(!taskReady(task,guide)){toast('Hãy đánh giá đủ mục, xử lý điểm thiếu và lưu ghi chú bằng chứng trước.','error');return}
  }
  state.statuses[id]=value;
  if(value!=='doing')state.editingDeadline=null;
  if(value==='na')state.naReasons[id]=reason;else delete state.naReasons[id];
  const stateText={done:'đã thực hiện',na:'không áp dụng',verify:'cần xác minh',todo:'cần xử lý',doing:'đang thực hiện',review:'chờ xác nhận'};
  note(`${task.title}: ${stateText[value]}`);
  state.pendingNa=null;if(state.screen==='checklist')state.tab='all';
  if(value==='na')state.selectedTask=null;else state.selectedTask=id;
  rerenderSheet();toast('Đã cập nhật trạng thái công việc.');
}
document.addEventListener('click',event=>{
  if(event.target.closest('[data-home]')){event.preventDefault();if(state.complete)setScreen('dashboard');return}
  if(event.target.classList.contains('overlay-backdrop')){state.selectedTask=null;state.pendingNa=null;state.pendingIgnore=null;state.pendingSnooze=null;render();return}
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.sample)selectBusiness(button.dataset.sample);
  else if(button.dataset.action==='toggle-manual'){state.lastTax=$('business-code')?.value||state.lastTax;state.manualEntry=!state.manualEntry;render();if(state.manualEntry)$('manual-tax')?.focus()}
  else if(button.dataset.back)setScreen(button.dataset.back);
  else if(button.dataset.next)setScreen(button.dataset.next);
  else if(button.dataset.nav){if(button.dataset.nav==='laws')openLawSearch();else if(productEnabled&&button.dataset.nav==='account')void openProductAccount();else setScreen(productEnabled?button.dataset.nav:state.complete||button.dataset.nav==='lookup'?button.dataset.nav:'lookup');}
  else if(button.dataset.tab){state.tab=button.dataset.tab;render()}
  else if(button.dataset.openTab){state.tab=button.dataset.openTab;setScreen('checklist')}
  else if(button.dataset.libraryTab){if(button.dataset.libraryTab==='library')openLawSearch();else {state.libraryTab='alerts';setScreen('alerts');}}
  else if(button.dataset.alertFilter){state.alertFilter=button.dataset.alertFilter;render()}
  else if(button.dataset.calendarMove){const cursor=calendarCursorDate();cursor.setMonth(cursor.getMonth()+Number(button.dataset.calendarMove));state.calendarMonth=monthKey(cursor);render()}
  else if(button.hasAttribute('data-calendar-today')){state.calendarMonth=monthKey(new Date());render()}
  else if(button.dataset.calendarAlert){state.libraryTab='alerts';state.alertFilter='all';state.alertExpanded[button.dataset.calendarAlert]=true;setScreen('alerts');setTimeout(()=>document.getElementById(`alert-${button.dataset.calendarAlert}`)?.scrollIntoView({block:'start'}),0)}
  else if(button.dataset.calendarTask){state.screen='checklist';state.tab='all';state.selectedTask=button.dataset.calendarTask;render()}
  else if(button.dataset.alertToggle){state.alertExpanded[button.dataset.alertToggle]=!state.alertExpanded[button.dataset.alertToggle];render();document.getElementById(`alert-${button.dataset.alertToggle}`)?.scrollIntoView({block:'nearest'})}
  else if(button.dataset.legalFilter){state.legalFilter=button.dataset.legalFilter;render()}
  else if(button.dataset.action==='toggle-legal-relevant'){state.legalRelevantOnly=!state.legalRelevantOnly;render()}
  else if(button.dataset.detail){state.selectedTask=button.dataset.detail;render()}
  else if(button.dataset.jumpTask){state.screen='checklist';state.tab='all';state.selectedTask=button.dataset.jumpTask;render()}
  else if(button.dataset.editDeadline){state.editingDeadline=button.dataset.editDeadline;rerenderSheet();setTimeout(()=>$('deadline-date')?.focus(),0)}
  else if(button.dataset.answer){
    if(button.dataset.answer==='na'){state.pendingNa=button.dataset.id;state.selectedTask=null;render();setTimeout(()=>$('na-reason')?.focus(),0)}
    else updateStatus(button.dataset.id,button.dataset.answer);
  }
  else if(button.dataset.verifyAction){
    const id=button.dataset.id;
    if(button.dataset.verifyAction==='todo'){
      state.statuses[id]='todo';state.tab='todo';state.selectedTask=null;
      const task=tasks().find(item=>item.id===id);note(`${task?.title||'Công việc'}: đã chọn cần xử lý`);render();toast('Đã chuyển sang Cần xử lý. Checklist đầy đủ đã sẵn sàng.');
    }else if(button.dataset.verifyAction==='done'){
      state.statuses[id]='done';state.tab='done';state.selectedTask=null;
      const task=tasks().find(item=>item.id===id);note(`${task?.title||'Công việc'}: đã hoàn thành sau bước xác minh`);render();toast('Đã ghi nhận công việc hoàn thành.');
    }else if(button.dataset.verifyAction==='ignore'){
      state.pendingNa=id;state.selectedTask=null;render();setTimeout(()=>$('na-reason')?.focus(),0);
    }
  }
  else if(button.dataset.stepResult){
    const id=button.dataset.stepTask,index=button.dataset.stepIndex,result=button.dataset.stepResult;
    state.taskSteps[id]??={};state.taskSteps[id][index]=result;
    if(result==='issue')state.statuses[id]='todo';
    else if(state.statuses[id]==='verify')state.statuses[id]='doing';
    rerenderSheet();
  }
  else if(button.dataset.status){
    if(button.dataset.status==='na'){state.pendingNa=button.dataset.id;state.selectedTask=null;render();setTimeout(()=>$('na-reason')?.focus(),0)}
    else{const evi=$('evidence-note');if(evi&&evi.dataset.eviTask===button.dataset.id)state.evidenceNotes[button.dataset.id]=evi.value;updateStatus(button.dataset.id,button.dataset.status);}
  }
  else if(button.dataset.event)handleEvent(button.dataset.event);
  else if(button.dataset.alertApply)setAlertStatus(button.dataset.alertApply,'applied');
  else if(button.dataset.alertSnooze){state.pendingSnooze=button.dataset.alertSnooze;render();setTimeout(()=>$('snooze-date')?.focus(),0)}
  else if(button.dataset.alertRestore)setAlertStatus(button.dataset.alertRestore,'new');
  else if(button.dataset.alertIgnore){state.pendingIgnore=button.dataset.alertIgnore;render();setTimeout(()=>$('ignore-reason')?.focus(),0)}
  else if(button.dataset.action==='cancel-ignore'){state.pendingIgnore=null;render()}
  else if(button.dataset.action==='cancel-snooze'){state.pendingSnooze=null;render()}
  else if(button.dataset.action==='close-detail'){state.selectedTask=null;render()}
  else if(button.dataset.action==='cancel-na'){state.pendingNa=null;render()}
  else if(button.dataset.action==='edit-answers')setScreen('questions');
  else if(button.dataset.action==='edit-topics')setScreen('topics');
  else if(button.dataset.action==='menu'){state.mobileMenu=!state.mobileMenu;render()}
  else if(button.dataset.action==='help')toast('Thông tin và tiến độ được lưu trên trình duyệt này.','info');
  else if(button.dataset.action==='reset'&&productEnabled){setScreen('companies')}
  else if(button.dataset.action==='reset'){if(confirm('Đổi doanh nghiệp sẽ xóa hồ sơ và tiến độ đã lưu trên trình duyệt này. Tiếp tục?')){lookupController?.abort();lookupController=null;localStorage.removeItem(STORAGE_KEY);state=structuredClone(defaults);setScreen('lookup')}}
});
document.addEventListener('submit',event=>{
  if(event.target.id==='deadline-form'){
    event.preventDefault();const id=event.target.dataset.task,value=String(new FormData(event.target).get('deadline')||'');
    if(!value)return;
    state.dueDates[id]=value;state.editingDeadline=null;
    note(`${tasks().find(task=>task.id===id)?.title||'Công việc'}: đặt hạn làm việc ${fmt(value)}`);
    rerenderSheet();toast('Đã lưu hạn làm việc.');
  }
  if(event.target.id==='lookup-form'){event.preventDefault();startLookup()}
  if(event.target.id==='manual-form'){
    event.preventDefault();const values=new FormData(event.target);const taxId=normalizeTaxId(values.get('taxId'));
    if(!taxId){const field=$('manual-tax');field.setCustomValidity('Nhập mã số thuế gồm 10 số hoặc 13 số.');field.reportValidity();return}
    const name=String(values.get('name')||'').trim();if(!name){const field=$('manual-name');field.setCustomValidity('Vui lòng nhập tên doanh nghiệp.');field.reportValidity();return}
    acceptBusiness({...emptyBusiness(),taxId,name,address:String(values.get('address')||'').trim()});
  }
  if(event.target.id==='questions-form'){event.preventDefault();updateBusiness(event.target);if(productEnabled)captureUnknown(event.target);state.questionError='';note('Đã cập nhật thông tin hoạt động');setScreen('topics')}
  if(event.target.id==='topics-form'){event.preventDefault();state.profile.topics=checked(event.target,'topics');if(productEnabled){void saveProductProfile();return;}state.complete=true;note('Đã cập nhật chủ đề theo dõi thêm');state.tab=tasks().some(task=>task.status==='todo')?'todo':'verify';setScreen('dashboard')}
  if(event.target.id==='na-form'){event.preventDefault();const reason=new FormData(event.target).get('reason')?.trim();if(reason)updateStatus(state.pendingNa,'na',reason)}
  if(event.target.id==='ignore-form'){event.preventDefault();const reason=new FormData(event.target).get('reason')?.trim();if(reason)setAlertStatus(state.pendingIgnore,'ignored',reason)}
  if(event.target.id==='snooze-form'){event.preventDefault();const until=new FormData(event.target).get('until');if(until)setAlertStatus(state.pendingSnooze,'snoozed','',String(until))}
  if(event.target.id==='checklist-search-form'){event.preventDefault();const values=new FormData(event.target);state.checklistQuery=String(values.get('query')||'');state.taskCategory=String(values.get('category')||'all');state.checklistSort=String(values.get('sort')||'attention');render()}
  if(event.target.id==='legal-search-form'){event.preventDefault();state.legalQuery=String(new FormData(event.target).get('query')||'');render()}
  if(event.target.id==='evidence-form'){event.preventDefault();const id=event.target.dataset.task;const value=new FormData(event.target).get('evidence')?.trim()||'';state.evidenceNotes[id]=value;note(`${tasks().find(task=>task.id===id)?.title||'Công việc'}: cập nhật ghi chú bằng chứng`);rerenderSheet();toast('Đã lưu ghi chú trên trình duyệt.');}
});
document.addEventListener('input',event=>{
  const target=event.target;
  if(target.id==='manual-tax'||target.id==='manual-name')target.setCustomValidity('');
  if(target.id==='evidence-note'&&target.dataset.eviTask){state.evidenceNotes[target.dataset.eviTask]=target.value;updateCompletionUI()}
  if(target.dataset.stepNote){state.stepNotes[target.dataset.stepNote]??={};state.stepNotes[target.dataset.stepNote][target.dataset.stepIndex]=target.value;updateCompletionUI()}
});
document.addEventListener('change',event=>{
  const target=event.target;
  if(target.matches('[data-step-task]')){
    const id=target.dataset.stepTask,index=target.dataset.stepIndex;
    state.taskSteps[id]??={};state.taskSteps[id][index]=target.checked;
    if(target.checked&&state.statuses[id]==='todo')state.statuses[id]='doing';
    rerenderSheet();
  }
  if(target.matches('[data-due-task]')){
    const id=target.dataset.dueTask;
    if(target.value)state.dueDates[id]=target.value;else delete state.dueDates[id];
    note(`${tasks().find(task=>task.id===id)?.title||'Công việc'}: ${target.value?'đặt ngày nhắc nội bộ '+fmt(target.value):'bỏ ngày nhắc nội bộ'}`);
    rerenderSheet();toast('Đã cập nhật ngày nhắc nội bộ.');
  }
});
document.addEventListener('keydown',event=>{
  const dialog=$('overlay').querySelector('[role="dialog"]');
  if(event.key==='Tab'&&dialog){const items=[...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]')].filter(e=>e.getClientRects().length&&!e.matches(':disabled'));const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}
  if(event.key==='Escape'&&(state.selectedTask||state.pendingNa||state.pendingIgnore||state.pendingSnooze)){state.selectedTask=null;state.pendingNa=null;state.pendingIgnore=null;state.pendingSnooze=null;render()}
  if(event.key==='Escape'&&state.mobileMenu){state.mobileMenu=false;render()}
});
function registerWebMcp(){
  const context=document.modelContext;if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch(_){}};
  register({name:'read_demo_summary',title:'Xem tóm tắt hồ sơ mẫu',description:'Đọc doanh nghiệp mẫu và số việc checklist hiện tại; không thay đổi trang.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(){return {screen:state.screen,business:state.profile?.name||null,counts:state.profile?counts():null}}});
  register({name:'select_demo_business',title:'Bắt đầu với doanh nghiệp mẫu',description:'Chọn một trong hai doanh nghiệp giả định và mở bước xác nhận hồ sơ.',inputSchema:{type:'object',properties:{demoId:{type:'string',enum:['DEMO-001','DEMO-002']}},required:['demoId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!samples[input?.demoId])throw Error('Mã doanh nghiệp mẫu không hợp lệ');selectBusiness(input.demoId);return {screen:state.screen,business:state.profile.name}}});
  register({name:'apply_demo_business_change',title:'Áp dụng thay đổi doanh nghiệp mẫu',description:'Thêm nhân sự, kho hoặc website vào hồ sơ mẫu và cập nhật checklist.',inputSchema:{type:'object',properties:{change:{type:'string',enum:['hire','warehouse','website']}},required:['change'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!state.complete)throw Error('Hãy hoàn tất hồ sơ mẫu trước');if(!['hire','warehouse','website'].includes(input?.change))throw Error('Thay đổi không hợp lệ');handleEvent(input.change);return {business:state.profile.name,counts:counts()}}});
  register({name:'apply_law_alert',title:'Đưa cảnh báo vào checklist',description:'Tạo checklist chi tiết từ bất kỳ cảnh báo nào; nếu chưa khớp hồ sơ, checklist sẽ mở đầu bằng bước xác minh phạm vi áp dụng.',inputSchema:{type:'object',properties:{alertId:{type:'string',enum:['wage-sanctions-2026','tax-extension-2026','copyright-enforcement-2026','publishing-law-2027','notary-law-2027']}},required:['alertId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){const alert=alerts.find(item=>item.id===input?.alertId);if(!state.complete)throw Error('Hãy hoàn tất hồ sơ mẫu trước');if(!alert)throw Error('Không tìm thấy cảnh báo');if(alertStatus(alert.id)==='applied')throw Error('Cảnh báo đã được áp dụng');setAlertStatus(alert.id,'applied');return {applied:true,matched:alert.test(state.profile),alert:alert.title,checklist:alert.task?.title,counts:counts()}}});
}
configureRealLibrary(()=>render(),()=>setScreen('laws'));
const requestedView=new URLSearchParams(location.search).get('view');
if(requestedView==='laws')state.screen='laws';
else if(requestedView&&['lookup','dashboard','checklist','alerts','profile'].includes(requestedView))state.screen=state.complete||requestedView==='lookup'?requestedView:'lookup';
if(state.screen==='alerts'&&state.libraryTab==='library')state.screen='laws';
window.addEventListener('popstate',()=>{const view=new URLSearchParams(location.search).get('view');if(view!=='laws'){if(productEnabled)setScreen(view,{historyMode:'none'});else {state.screen=state.complete&&['dashboard','checklist','alerts','profile'].includes(view)?view:'lookup';render();}}});
configureProduct({icon,pageTitle,state:()=>state,render,screen:setScreen,toast,clear:()=>{state=structuredClone(defaults)},loaded:(profile,versions,keepView=false)=>{state={...(keepView?state:structuredClone(defaults)),profile,complete:true,history:versions.slice(0,10).map(v=>({message:`Hồ sơ phiên bản ${v.version}`,at:new Date(v.createdAt).toLocaleString('vi-VN')}))}}});
if(productEnabled&&state.screen!=='laws')state.screen='account';
if(!productEnabled)registerWebMcp();
render();
void bootProduct();

