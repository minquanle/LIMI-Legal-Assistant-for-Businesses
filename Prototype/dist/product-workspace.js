import {beginAction,endAction,notify,noteRequest} from './action-feedback.js?v=1';
import {captureFormDrafts,restoreFormDrafts} from './ui-continuity.js?v=3';
import {checklistFacts,factLabel} from './checklist-facts.js?v=7';
// Deprecated period facts stay in the registry for old versions but are no longer asked; saving keeps their stored values.
const formFacts=checklistFacts.filter(f=>!f.deprecated);
import {resolveWorkspaceView} from './workspace-navigation.js?v=4';
import {configureOverview,renderOverview,mountOverview,invalidateOverview} from './reviewer-overview.js?v=12';
import {configureDiscovery,renderDiscovery,mountDiscovery,invalidateDiscovery} from './law-discovery.js?v=1';
import {configureFeedback,renderFeedback,renderFeedbackOverlay,mountFeedback,invalidateFeedback,openTaskFeedback} from './feedback-workspace.js?v=2';
// The hosted product uses PostgreSQL through a same-origin, cookie-authenticated API.
// The standalone static prototype remains a separate demonstration.
import {emptyBusiness} from './business.js?v=6';
import {openComplianceTask,openReviewVersion,openReviewGroup,configureCompliance,renderCompliance,renderComplianceOverlay,mountCompliance,invalidateCompliance} from './compliance-workspace.js?v=36';
import {openChanges,alertUnreadCount,refreshAlertBadge,configureAlerts,renderAlertsProduct,renderAlertOverlay,mountAlerts,invalidateAlerts} from './alerts-workspace.js?v=14';
export const getProductAlertCount=()=>alertUnreadCount();
export const productEnabled=Boolean(window.LIMI_WORKSPACE_API);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let profileEdit=null,closeProfile=false,hooks,csrf='',current=null,companies=[],sites=[],events=[],versions=[],members=[],audit=[],loading=true,error='',busy=false,activation=false,registration=false,newOrganizationId='';
const eventLabels={FOUNDED:'Thành lập',HIRED:'Tuyển dụng',SITE_OPENED:'Mở địa điểm',WEBSITE_STARTED:'Bắt đầu dùng website',SUSPENDED:'Tạm ngừng',RESUMED:'Hoạt động trở lại',DISSOLUTION_STARTED:'Bắt đầu giải thể',OTHER:'Khác'};
const siteLabels={office:'Văn phòng',store:'Cửa hàng',warehouse:'Kho',factory:'Nhà xưởng'};
export let account=null;
export const currentCompany=()=>current;
export const canEdit=()=>Boolean(account?.memberships.some(m=>(!current||m.organization.id===current.organizationId)&&m.role!=='VIEWER'));
const messages={LOGIN_REQUIRED:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',INVALID_CREDENTIALS:'Email hoặc mật khẩu không đúng.',INVALID_OR_EXPIRED_TOKEN:'Mã kích hoạt không hợp lệ, đã dùng hoặc hết hạn.',ROLE_REJECTED:'Vai trò hiện tại chỉ được xem dữ liệu.',PROFILE_VERSION_CONFLICT:'Hồ sơ đã thay đổi ở phiên khác. Hãy tải lại bản mới trước khi lưu.',SITE_VERSION_CONFLICT:'Địa điểm đã thay đổi. Hãy tải lại bản mới.',ALREADY_EXISTS:'Doanh nghiệp hoặc tài khoản đã tồn tại trong không gian này.',USE_EXISTING_ACCOUNT:'Tài khoản đã có mật khẩu. Hãy đăng nhập và chấp nhận lời mời.',REGISTRY_UNAVAILABLE:'Nguồn tra cứu đang không khả dụng. Bạn có thể tự nhập hồ sơ.',CSRF_REJECTED:'Phiên thao tác không hợp lệ. Hãy tải lại trang.',TOO_MANY_ATTEMPTS:'Đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.'};
messages.EMAIL_ALREADY_REGISTERED='Email này đã có tài khoản. Hãy đăng nhập hoặc dùng mã đặt lại mật khẩu.';
messages.PASSWORD_CONFIRMATION_MISMATCH='Mật khẩu nhập lại chưa khớp. Hãy kiểm tra lại.';
messages.ORIGIN_REJECTED='Địa chỉ web chưa được máy chủ cho phép. Hãy kiểm tra cấu hình địa chỉ truy cập.';
messages.TOO_MANY_ATTEMPTS='Bạn đã thử quá nhiều lần. Vui lòng đợi khoảng 15 phút rồi thử lại.';
messages.INVALID_REQUEST='Thông tin gửi lên chưa hợp lệ. Kiểm tra các trường được yêu cầu trên trang này.';
async function api(path,method='GET',body){
  noteRequest(method);
  let response;try{response=await fetch(window.LIMI_WORKSPACE_API+path,{method,credentials:'same-origin',headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{}),...(method!=='GET'&&csrf?{'X-CSRF-Token':csrf}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});}catch{throw Error('Chưa kết nối được máy chủ. Hãy thử lại; dữ liệu chưa được lưu.');}
  let data;try{data=await response.json();}catch{throw Error('Máy chủ tạm thời chưa phản hồi đúng. Vui lòng thử lại; chưa xác nhận thao tác đã lưu.');}if(!response.ok){const e=Error(messages[data.error]||'Không thể thực hiện thao tác. Vui lòng thử lại.');e.status=response.status;e.code=data.error;e.fields=data.fields;throw e;}return data;
}
const field=(name,label,value='',type='text',required=false)=>`<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''} maxlength="2000"></label>`;
const button=(label,action)=>`<button type="button" class="secondary-button" data-product="${action}">${label}</button>`;
const errorBlock=()=>error?`<p class="form-error" role="alert">${esc(error)}</p>`:'';
export function configureProduct(value){hooks=value;configureDiscovery({icon:hooks.icon,pageTitle:hooks.pageTitle,api,account:()=>account,render:repaint,screen:()=>hooks.state().screen,openChanges:()=>{openChanges({});hooks.screen('changes');}});configureFeedback({icon:hooks.icon,pageTitle:hooks.pageTitle,api,account:()=>account,company:currentCompany,render:repaint,screen:()=>hooks.state().screen,go:view=>hooks.screen(view),openVersion:id=>{openReviewVersion(id);hooks.screen('admin');},openTask:id=>{openComplianceTask(id);hooks.screen('checklist');}});configureCompliance({icon:hooks.icon,pageTitle:hooks.pageTitle,api,csrf:()=>csrf,company:currentCompany,account:()=>account,canEdit,openFeedback:openTaskFeedback,refreshProfile:async()=>{const id=current.id;const [row,history]=await Promise.all([api('/companies/'+id),api('/companies/'+id+'/profiles')]);if(current?.id!==id)return;current=row;versions=history.items;hooks.loaded(legacyProfile(row),versions,true);},render:repaint,screen:()=>hooks.state().screen});configureAlerts({icon:hooks.icon,api,company:currentCompany,account:()=>account,canEdit,render:repaint,screen:()=>hooks.state().screen,openTask:id=>{openComplianceTask(id);hooks.screen('checklist');}});configureOverview({icon:hooks.icon,pageTitle:hooks.pageTitle,openGroup:(group,filter)=>{openReviewGroup(group,filter);hooks.screen('admin');},api,account:()=>account,render:repaint,screen:()=>hooks.state().screen,go:view=>hooks.screen(view),openVersion:id=>{openReviewVersion(id);hooks.screen('admin');},openChanges:options=>{openChanges(options);hooks.screen('changes');}});}
export const isReviewer=()=>Boolean(account?.user.platformReviewer);
export const renderProductOverview=()=>renderOverview();
export const renderProductFeedback=()=>renderFeedback();
export const renderProductDiscovery=()=>renderDiscovery();
export const renderProductChanges=()=>renderAlertsProduct('changes');
export const renderProductAdmin=()=>renderCompliance('admin');
function repaint(){hooks.render();}
async function perform(fn){if(busy)return;const formDrafts=captureFormDrafts();busy=true;error='';repaint();restoreFormDrafts(formDrafts);const action=beginAction();try{await fn();if(closeProfile)profileEdit=null;endAction(action);}catch(e){error=e.message;if(e.status===401){account=null;current=null;hooks.clear();hooks.screen('account');}}finally{closeProfile=false;busy=false;repaint();if(error){restoreFormDrafts(formDrafts);notify(error,'error');}}}
function writeUrl(id){const url=new URL(location.href);if(id)url.searchParams.set('company',id);else url.searchParams.delete('company');history.replaceState(null,'',url);}
function legacyProfile(row){const p=row.profileJson,f=row.factsJson;return {...emptyBusiness(),...p,...Object.fromEntries(Object.entries(f).map(([k,v])=>[k,v.value??(['stage','employees'].includes(k)?'unknown':[])])),_unknown:Object.fromEntries(Object.entries(f).map(([k,v])=>[k,v.status==='UNKNOWN'])),sourceKind:'manual',sourceName:'Bạn xác nhận',sourceUrl:'',companyId:row.id};}
async function loadCompany(id,screen='profile'){
  invalidateCompliance();invalidateAlerts();invalidateOverview();invalidateFeedback();invalidateDiscovery();
  const row=await api('/companies/'+encodeURIComponent(id));
  const [s,e,v]=await Promise.all([api(`/companies/${row.id}/sites`),api(`/companies/${row.id}/events`),api(`/companies/${row.id}/profiles`)]);
  current=row;sites=s.items;events=e.items;versions=v.items;writeUrl(row.id);await refreshAlertBadge().catch(()=>{});hooks.loaded(legacyProfile(row),versions);hooks.screen(screen);
}
async function refreshCompanies(){companies=(await api('/companies')).items;}
export async function bootProduct(){
  if(!productEnabled)return;
  try{account=await api('/auth/me');csrf=account.csrfToken;await refreshCompanies();const id=new URL(location.href).searchParams.get('company');
    const requested=new URL(location.href).searchParams.get('view');
    const view=resolveWorkspaceView(requested,{authenticated:true,reviewer:account.user.platformReviewer,canCreateCompany:canEdit()});
    if(id&&companies.some(c=>c.id===id))await loadCompany(id,view);
    else hooks.screen(view,{historyMode:'replace'});
  }catch(e){if(e.status!==401)error=e.message;if(hooks.state().screen!=='laws')hooks.screen('account');}finally{loading=false;repaint();}
}
export function renderAccount(){
  if(loading)return '<section class="form-panel product-panel"><h1>Đang kiểm tra phiên đăng nhập…</h1></section>';
  if(!account)return `<section class="form-panel product-panel auth-panel"><span class="eyebrow">LIMI · TÀI KHOẢN DOANH NGHIỆP</span><h1>${registration?'Tạo tài khoản doanh nghiệp':activation?'Kích hoạt tài khoản / đặt lại mật khẩu':'Đăng nhập'}</h1><p>${registration?'Tạo không gian riêng để quản lý hồ sơ, checklist và phản hồi của doanh nghiệp.':'Hồ sơ được lưu theo tài khoản trên máy chủ.'}</p>${!activation?`<div class="tab-bar auth-tabs" aria-label="Tài khoản"><button type="button" data-product="show-login" class="${!registration?'active':''}" aria-pressed="${!registration}">Đăng nhập</button><button type="button" data-product="show-register" class="${registration?'active':''}" aria-pressed="${registration}">Đăng ký</button></div>`:''}${errorBlock()}<form id="product-auth" class="product-form">${activation?field('token','Mã kích hoạt một lần','','password',true)+field('name','Tên của bạn','','text',true):(registration?field('name','Họ và tên','','text',true):'')+field('email','Email','','email',true)}<label>Mật khẩu<input name="password" type="password" required ${activation||registration?'minlength="12"':''} maxlength="128" autocomplete="${activation||registration?'new-password':'current-password'}"></label>${registration?'<label>Nhập lại mật khẩu<input name="confirmPassword" type="password" required minlength="12" maxlength="128" autocomplete="new-password"></label><p class="field-hint">Mật khẩu ít nhất 12 ký tự. Bản thử nghiệm chưa gửi email xác minh. Tài khoản mới có không gian doanh nghiệp riêng.</p>':activation?'<p class="field-hint">Ít nhất 12 ký tự. Mã pilot có hiệu lực 24 giờ; lời mời 48 giờ.</p>':''}<button class="primary-button" ${busy?'disabled':''}>${busy?'Đang xử lý…':registration?'Đăng ký và bắt đầu':activation?'Kích hoạt và đăng nhập':'Đăng nhập'}</button></form>${registration?'':button(activation?'Quay lại đăng nhập':'Tôi có mã kích hoạt / đặt lại mật khẩu','toggle-activation')}<p class="field-hint">Quên mật khẩu? Yêu cầu mã đặt lại từ người vận hành.</p>${button('Thử lại kết nối','retry')}</section>`;

  const org=account.memberships.find(m=>m.organization.id===(current?.organizationId||account.memberships[0]?.organization.id)),owner=org?.role==='OWNER';
  return `<section class="form-panel product-panel"><h1>Tài khoản và thành viên</h1><p>${esc(account.user.name)} · ${esc(account.user.email)}</p><p>${esc(org?.organization.name||'Chưa có không gian')} · Vai trò: <strong>${esc(org?.role||'Không có quyền doanh nghiệp')}</strong>${account.user.platformReviewer?' · Chuyên gia nền tảng (quyền riêng)':''}</p>${errorBlock()}<div class="panel-actions">${button('Chọn doanh nghiệp','companies')}${button('Đăng xuất','logout')}</div><h2>Thành viên</h2>${members.length?members.map(m=>`<div class="product-row"><span>${esc(m.user.email)} · ${esc(m.role)}</span>${owner&&m.role!=='OWNER'?`<button class="text-button" data-product-role="${m.id}" data-role="${m.role==='VIEWER'?'EDITOR':'VIEWER'}">Đổi sang ${m.role==='VIEWER'?'EDITOR':'VIEWER'}</button>`:''}</div>`).join(''):'<p>Chưa tải danh sách thành viên.</p>'}${owner?`<h2>Nhật ký không gian</h2>${audit.map(a=>`<p>${esc(new Date(a.createdAt).toLocaleString('vi-VN'))} · ${esc(a.action)}</p>`).join('')||'<p>Chưa có hoạt động.</p>'}`:''}</section>`;
}
export function renderCompanies(){
  if(loading)return '<p>Đang tải danh sách doanh nghiệp…</p>';
  if(!account)return renderAccount();
  return `<section class="form-panel product-panel"><h1>Doanh nghiệp của bạn</h1>${errorBlock()}${companies.length?companies.map(c=>`<div class="product-row"><div><strong>${esc(c.profileJson.name)}</strong><p>${esc(c.taxId)}</p></div><button class="primary-button" data-product-company="${c.id}" ${busy?'disabled':''}>Mở hồ sơ</button></div>`).join(''):account.memberships.some(m=>m.role!=='VIEWER')?'<p>Chưa có doanh nghiệp. Hãy thêm hồ sơ bằng mã số thuế hoặc tự nhập.</p>':'<p>Bạn chưa được cấp quyền truy cập doanh nghiệp. Quyền duyệt luật độc lập với quyền xem hồ sơ doanh nghiệp.</p>'}<div class="panel-actions">${account.memberships.some(m=>m.role!=='VIEWER')?button('Thêm doanh nghiệp','new-company'):''}${account.user.platformReviewer?button('Phòng duyệt nghĩa vụ','admin'):''}${button('Tài khoản và thành viên','account')}${button('Tải lại danh sách','refresh-companies')}</div></section>`;
}
export function renderNewOrganizationChoice(){const memberships=account?.memberships.filter(m=>m.role!=='VIEWER')||[];return productEnabled?`<label class="field-label">Không gian lưu doanh nghiệp<select id="product-new-organization">${memberships.map(m=>`<option value="${m.organization.id}" ${m.organization.id===newOrganizationId?'selected':''}>${esc(m.organization.name)}</option>`).join('')}</select></label>`:'';}
export async function openProductAccount(){await perform(async()=>{if(account)await loadMembers();hooks.screen('account');});}
export function renderProductHome(kind){
  if(!current)return `<section class="form-panel product-panel"><h1>${{dashboard:'Không gian doanh nghiệp',checklist:'Công việc tuân thủ',alerts:'Cảnh báo pháp luật'}[kind]}</h1><div class="info-callout"><p>Chưa chọn doanh nghiệp để xem ${kind==='checklist'?'công việc':kind==='alerts'?'cảnh báo':'tổng quan'}. Chỉ doanh nghiệp bạn được cấp quyền mới xuất hiện trong danh sách.</p></div><div class="panel-actions">${button('Chọn doanh nghiệp','companies')}${account?.user.platformReviewer?button('Phòng duyệt nghĩa vụ','admin'):''}</div></section>`;
  if(kind==='alerts')return renderAlertsProduct();
  if(kind==='dashboard'||kind==='checklist')return renderCompliance(kind);
  return `<section class="form-panel product-panel"><span class="eyebrow">${esc(current.profileJson.name)}</span><h1>${kind==='dashboard'?'Không gian doanh nghiệp':kind==='checklist'?'Công việc tuân thủ':'Cảnh báo pháp luật'}</h1><p>Hồ sơ phiên bản ${current.version} đã lưu. Có ${sites.length} địa điểm và ${events.length} sự kiện đã ghi nhận.</p><div class="info-callout"><p>${kind==='dashboard'?'Hồ sơ và dữ liệu hoạt động đã sẵn sàng cho bước đánh giá nghĩa vụ.':kind==='checklist'?'Chưa có checklist được chuyên gia duyệt và phát hành cho hồ sơ này.':'Chưa có cảnh báo pháp lý được duyệt cho doanh nghiệp này.'} Các mục mẫu của prototype không được đưa vào tài khoản thật.</p></div><div class="panel-actions">${button('Xem hồ sơ doanh nghiệp','profile')}<button class="secondary-button" data-nav="laws">Tra cứu 110 văn bản</button></div></section>`;
}
export function renderProductProfile(){
  if(!current)return '';
  const p=current.profileJson,editable=canEdit(),f=current.factsJson,confirmed=formFacts.filter(x=>f[x.key]&&f[x.key].status!=='UNKNOWN').length;
  // View first: each part opens its own form only after "Sửa".
  const head=(title,hint,action='')=>`<div class="profile-card-head"><div><h3>${title}</h3>${hint?`<p>${hint}</p>`:''}</div>${action}</div>`;
  const edit=(part,label='Sửa')=>editable&&profileEdit!==part?`<button type="button" class="secondary-button" data-product-profile="${part}">${label}</button>`:'';
  const cancel=`<button type="button" class="text-button" data-product-profile="cancel">Hủy</button>`;
  const dl=items=>`<dl class="profile-view">${items.map(([k,v])=>`<div><dt>${k}</dt><dd class="${v?'':'missing-value'}">${esc(v||'Chưa có thông tin')}</dd></div>`).join('')}</dl>`;
  const identity=profileEdit==='identity'?`<form id="product-identity" class="product-form"><fieldset>${field('name','Tên doanh nghiệp',p.name,'text',true)}${field('shortName','Tên viết tắt',p.shortName)}${field('internationalName','Tên quốc tế',p.internationalName)}${field('address','Địa chỉ',p.address)}${field('province','Tỉnh / thành phố',p.province)}${field('type','Loại hình',p.type)}${field('founded','Ngày thành lập',p.founded,'date')}${field('employeeCount','Số lao động chính xác (để trống nếu chưa xác nhận)',f.employeeCount?.value??'','number')}${field('registered','Ngành nghề đăng ký',p.registered)}${field('status','Tình trạng tự khai báo',p.status)}<div class="form-actions"><button class="primary-button" ${busy?'disabled':''}>Lưu thông tin nhận diện</button>${cancel}</div></fieldset></form>`:dl([['Tên doanh nghiệp',p.name],['Mã số thuế',p.taxId],['Tên quốc tế',p.internationalName],['Địa chỉ',p.address],['Tỉnh / thành phố',p.province],['Loại hình',p.type],['Ngày thành lập',p.founded?String(p.founded).slice(0,10).split('-').reverse().join('/'):''],['Số lao động',f.employeeCount?.value!=null?String(f.employeeCount.value):''],['Ngành nghề đăng ký',p.registered]]);
  const facts=profileEdit==='facts'?renderChecklistFacts(editable,cancel):`<div class="profile-facts-summary"><strong>${confirmed}/${formFacts.length}</strong><span>thông tin đã xác nhận. Để trống mục chưa chắc chắn; hệ thống sẽ hỏi khi cần.</span></div>`;
  const siteForm=`<form id="product-site" class="product-form"><input type="hidden" name="siteId"><input type="hidden" name="expectedVersion">${field('name','Tên địa điểm','','text',true)}<label>Loại<select name="kind"><option value="office">Văn phòng</option><option value="store">Cửa hàng</option><option value="warehouse">Kho</option><option value="factory">Nhà xưởng</option></select></label>${field('address','Địa chỉ','','text',true)}${field('province','Tỉnh / thành phố','','text',true)}<div class="form-actions"><button class="primary-button" ${busy?'disabled':''}>Lưu địa điểm</button>${cancel}</div></form>`;
  const eventForm=`<form id="product-event" class="product-form"><label>Sự kiện<select name="type">${Object.entries(eventLabels).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>${field('occurredOn','Ngày xảy ra','','date',true)}${field('note','Mô tả','','text',true)}<div class="form-actions"><button class="primary-button" ${busy?'disabled':''}>Ghi nhận sự kiện</button>${cancel}</div><p class="field-hint">Checklist tự đánh giá lại sau khi ghi nhận sự kiện.</p></form>`;
  return `<section class="product-profile">${errorBlock()}<p class="profile-intro">Phiên bản hồ sơ ${current.version} · ${editable?'Bạn có quyền sửa':'Chỉ xem'}. Lưu thay đổi sẽ tự cập nhật checklist; thông tin bạn xác nhận chưa phải kết quả thẩm định của chuyên gia. <button type="button" class="text-button" data-product="reload-company">Tải lại bản mới nhất</button></p>
  <section class="profile-card">${head('Thông tin nhận diện','',edit('identity'))}${identity}</section>
  <section class="profile-card">${head('Thông tin xác định checklist','Dùng để biết việc nào áp dụng cho doanh nghiệp.',edit('facts'))}${facts}</section>
  <section class="profile-card">${head('Địa điểm hoạt động','',edit('site','Thêm địa điểm'))}${sites.map(s=>`<div class="product-row"><span><strong>${esc(s.name)}</strong> · ${esc(siteLabels[s.kind]||s.kind)}<br>${esc(s.address)} · ${esc(s.province)}</span>${editable?`<button class="text-button" data-product-edit-site="${s.id}">Sửa</button>`:''}</div>`).join('')||'<p class="muted-copy">Chưa có địa điểm được ghi nhận.</p>'}${profileEdit==='site'?siteForm:''}</section>
  <section class="profile-card">${head('Sự kiện doanh nghiệp','Tuyển dụng, mở địa điểm, tạm ngừng… làm thay đổi công việc cần làm.',edit('event','Ghi nhận sự kiện'))}${profileEdit==='event'?eventForm:''}${events.map(e=>`<p><strong>${esc(e.occurredOn.slice(0,10).split('-').reverse().join('/'))} · ${esc(eventLabels[e.type]||e.type)}</strong><br>${esc(e.note)}</p>`).join('')||'<p class="muted-copy">Chưa có sự kiện.</p>'}</section>
  <details class="profile-card profile-history"><summary>Lịch sử phiên bản hồ sơ (${versions.length})</summary>${versions.map(v=>`<p>Phiên bản ${v.version} · ${esc(new Date(v.createdAt).toLocaleString('vi-VN'))}</p>`).join('')}</details></section>`;
}
const factsFromCurrent=()=>Object.fromEntries(Object.entries(current.factsJson).map(([k,v])=>[k,v.value??(['stage','employees'].includes(k)?'unknown':null)]));
function renderChecklistFacts(editable,cancel=''){return `<form id="product-checklist-facts" class="product-form"><fieldset ${!editable?'disabled':''}><p>Xác nhận theo thực tế. Không cần nhập ngày của từng kỳ tháng, quý hay năm: hệ thống tự tính. Để trống nếu chưa biết; hệ thống sẽ yêu cầu thêm thông tin.</p>${[...new Set(formFacts.map(f=>f.group))].map(group=>`<details><summary>${esc(group)}</summary>${formFacts.filter(f=>f.group===group).map(f=>{const value=current.factsJson[f.key]?.value;return `<label>${esc(f.label)}${f.kind==='date'?`<input name="${f.key}" type="date" value="${esc(value||'')}">`:`<select name="${f.key}"><option value="">Chưa xác nhận</option>${f.options.map(([key,label])=>`<option value="${key}" ${value===key?'selected':''}>${esc(label)}</option>`).join('')}</select>`}${f.help?`<span class="field-hint">${esc(f.help)}</span>`:''}${f.tier==='LEGAL_CONCLUSION'?`<span class="field-hint">Câu hỏi về diện áp dụng pháp luật. Nếu chưa chắc chắn, hãy để Chưa xác nhận; không cần tự kết luận.</span>`:''}</label>`;}).join('')}</details>`).join('')}<div class="form-actions"><button class="primary-button" ${busy?'disabled':''}>Lưu thông tin checklist</button>${cancel}</div></fieldset></form>`;}
function inputFromDraft(){const p=hooks.state().profile;return {profile:Object.fromEntries(['name','taxId','shortName','internationalName','address','province','type','founded','registered','status','topics'].map(k=>[k,p[k]??(k==='topics'?[]:'')])),facts:{...(current?factsFromCurrent():{}),...Object.fromEntries(['stage','employees','employeeCount','activity','channels','places','signals'].map(k=>[k,k==='employeeCount'?current?.factsJson.employeeCount?.value??null:['stage','employees'].includes(k)?p[k]||'unknown':p._unknown?.[k]===false?p[k]:null]))}};}
export async function saveProductProfile(){
  await perform(async()=>{if(!account||!canEdit())throw Error('Bạn cần đăng nhập với quyền sửa hồ sơ.');const payload=inputFromDraft();
    let row;if(current)row=await api(`/companies/${current.id}/profile`,'PUT',{...payload,expectedVersion:current.version});
    else {const organizationId=newOrganizationId||account.memberships.find(m=>m.role!=='VIEWER')?.organization.id;row=await api('/companies','POST',{...payload,organizationId,...(hooks.state().profile._registryObservationId?{registryObservationId:hooks.state().profile._registryObservationId}:{})});}
    await refreshCompanies();await loadCompany(row.id,'profile');hooks.toast('Hồ sơ đã được lưu trên máy chủ.');
  });
}
export async function lookupProductBusiness(taxId,options={}){
  const data=await api('/registry/'+encodeURIComponent(taxId));if(options.signal?.aborted)throw Error('Đã hủy tra cứu');
  return {...emptyBusiness(),...data.profile,sourceKind:'live',sourceName:data.provenance.provider,sourceUrl:data.provenance.url,retrievedAt:data.provenance.retrievedAt,_registryObservationId:data.observationId};
}
export function mountProduct(){
  if(!productEnabled)return;
  mountCompliance();mountAlerts();mountOverview();mountFeedback();mountDiscovery();
  const form=document.getElementById('questions-form');if(form&&!form.dataset.productMounted){form.dataset.productMounted='true';for(const key of ['activity','channels','places','signals']){
    const input=form.querySelector(`[name="${key}"]`);if(!input)continue;
    const container=input.closest('.choice-group')||input.parentElement.parentElement;
    const unknown=hooks.state().profile?._unknown?.[key]!==false;
    container.insertAdjacentHTML('beforeend',`<label class="product-unknown"><input type="checkbox" data-unknown-field="${key}" ${unknown?'checked':''}>Chưa xác nhận nhóm thông tin này (khác với không có)</label>`);
  }}
  if(!canEdit()&&current){document.querySelectorAll('[data-action="edit-answers"],[data-action="edit-topics"]').forEach(b=>b.disabled=true);}
  if(hooks.state().screen==='topics'&&error&&!document.querySelector('.product-save-error'))document.getElementById('topics-form')?.insertAdjacentHTML('afterbegin',`<p class="form-error product-save-error" role="alert">${esc(error)}</p>`);
  if(busy)document.querySelectorAll('#topics-form button[type="submit"]').forEach(b=>b.disabled=true);
  document.querySelectorAll('#product-auth button[type="submit"],.product-form button').forEach(b=>{if(busy)b.disabled=true;});
}
export function captureUnknown(form){const p=hooks.state().profile;p._unknown=Object.fromEntries([...form.querySelectorAll('[data-unknown-field]')].map(x=>[x.dataset.unknownField,x.checked]));}
export function newDraft(){current=null;sites=[];events=[];versions=[];newOrganizationId=account.memberships.find(m=>m.role!=='VIEWER')?.organization.id||'';writeUrl(null);hooks.clear();hooks.screen('lookup');}
async function loadMembers(){const org=current?.organizationId||account?.memberships[0]?.organization.id;if(!org)return;members=(await api(`/organizations/${org}/members`)).items;const m=account.memberships.find(m=>m.organization.id===org);audit=m.role==='OWNER'?(await api(`/organizations/${org}/audit`)).items:[];}
if(productEnabled){
  document.addEventListener('change',event=>{if(event.target.id==='product-new-organization')newOrganizationId=event.target.value;});
  document.addEventListener('change',event=>{const input=event.target;if(input.closest('#questions-form')&&['activity','channels','places','signals'].includes(input.name)&&input.checked){const unknown=document.querySelector(`[data-unknown-field="${input.name}"]`);if(unknown)unknown.checked=false;}if(input.dataset.unknownField&&input.checked)document.querySelectorAll(`#questions-form [name="${input.dataset.unknownField}"]`).forEach(x=>x.checked=false);});
  document.addEventListener('submit',event=>{const form=event.target;if(!form.id?.startsWith('product-'))return;event.preventDefault();const values=Object.fromEntries(new FormData(form));
    void perform(async()=>{
      if(form.id==='product-auth'){if(registration&&values.password!==values.confirmPassword)throw Error(messages.PASSWORD_CONFIRMATION_MISMATCH);const result=await api(registration?'/auth/register':activation?'/auth/activate':'/auth/login','POST',values);registration=false;activation=false;csrf=result.csrfToken;account=await api('/auth/me');csrf=account.csrfToken;await refreshCompanies();hooks.screen(account.user.platformReviewer?'overview':'companies');}
      if(form.id==='product-checklist-facts'){closeProfile=true;const {sourceProvenance,...profile}=current.profileJson;void sourceProvenance;const facts={...factsFromCurrent(),...Object.fromEntries(formFacts.map(f=>[f.key,values[f.key]||null]))};const row=await api(`/companies/${current.id}/profile`,'PUT',{profile,facts,expectedVersion:current.version});await loadCompany(row.id);hooks.toast('Đã lưu thông tin để xác định checklist.');}
      if(form.id==='product-identity'){closeProfile=true;const {sourceProvenance,...p}=current.profileJson;void sourceProvenance;const {employeeCount,...identity}=values;const row=await api(`/companies/${current.id}/profile`,'PUT',{profile:{...p,...identity},facts:{...factsFromCurrent(),employeeCount:employeeCount===''?null:Number(employeeCount)},expectedVersion:current.version});await loadCompany(row.id);hooks.toast('Đã lưu thông tin nhận diện.');}
      if(form.id==='product-site'){closeProfile=true;const {siteId,expectedVersion,...data}=values;await api(`/companies/${current.id}/sites${siteId?'/'+siteId:''}`,siteId?'PUT':'POST',{...data,...(siteId?{expectedVersion:Number(expectedVersion)}:{})});await loadCompany(current.id);hooks.toast('Đã lưu địa điểm.');}
      if(form.id==='product-event'){closeProfile=true;await api(`/companies/${current.id}/events`,'POST',values);await loadCompany(current.id);hooks.toast('Đã ghi nhận sự kiện.');}
    });
  });
  document.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;
    if(b.dataset.productProfile){profileEdit=b.dataset.productProfile==='cancel'?null:b.dataset.productProfile;error='';repaint();document.querySelector('.product-profile form')?.querySelector('input:not([type=hidden]),select')?.focus();return;}
    if(b.dataset.productEditSite){profileEdit='site';repaint();const site=sites.find(s=>s.id===b.dataset.productEditSite),form=document.getElementById('product-site');for(const k of ['name','kind','address','province'])form.elements[k].value=site[k];form.elements.siteId.value=site.id;form.elements.expectedVersion.value=site.version;form.scrollIntoView({block:'center'});return;}
    if(b.dataset.productCompany){void perform(()=>loadCompany(b.dataset.productCompany));return;}
    if(b.dataset.productRole){void perform(async()=>{const org=current?.organizationId||account.memberships[0].organization.id;await api(`/organizations/${org}/members/${b.dataset.productRole}`,'PATCH',{role:b.dataset.role});await loadMembers();});return;}
    const action=b.dataset.product;if(!action)return;
    if(['show-login','show-register','toggle-activation'].includes(action)){registration=action==='show-register';activation=action==='toggle-activation'?!activation:false;error='';repaint();return;}
    if(action==='new-company'){newDraft();return;}
    if(action==='admin'){hooks.screen('admin');return;}
    if(action==='profile'){hooks.screen('profile');return;}
    void perform(async()=>{
      if(action==='retry'){loading=false;await bootProduct();}
      if(action==='account'){await loadMembers();hooks.screen('account');}
      if(action==='companies'||action==='refresh-companies'){await refreshCompanies();hooks.screen('companies');}
      if(action==='reload-company')await loadCompany(current.id);
      if(action==='logout'){await api('/auth/logout','POST',{});invalidateFeedback();account=null;csrf='';current=null;companies=[];members=[];audit=[];writeUrl(null);hooks.clear();hooks.screen('account');}
    });
  });
}


export const renderProductDetail=()=>renderFeedbackOverlay()||renderComplianceOverlay()||renderAlertOverlay();
