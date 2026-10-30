import {notify} from './action-feedback.js?v=1';
// "Luật mới": reviewer settings for discovering newly issued documents on official sources.
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const INTERVALS=[[1,'1 giờ'],[3,'3 giờ'],[24,'1 ngày']];
const LIMITS=[10,20,50,100];
const statuses={PENDING:'Chờ duyệt',APPROVED:'Đã duyệt',REJECTED:'Đã bỏ qua'};
const errors={ROBOTS_DISALLOWED:'Nguồn không cho phép thu thập',ROBOTS_UNAVAILABLE:'Nguồn tạm không phản hồi',FETCH_FAILED:'Không tải được trang',BEFORE_EFFECTIVE_FROM:'Bỏ qua do hiệu lực sớm hơn ngày đã chọn'};
const messages={NO_SOURCE_SELECTED:'Chọn ít nhất một nguồn trước khi bật tự thu thập.',UNKNOWN_SOURCE:'Có nguồn không còn trong danh sách. Hãy tải lại trang.',DISCOVERY_DISABLED:'Hãy bật và lưu thiết lập trước khi quét.'};
let h,key='',data=null,draft=null,loading=false,busy=false,error='';
const time=x=>x?new Date(x).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
const fromSettings=s=>({enabled:s.enabled,sources:[...s.sources],intervalHours:s.intervalHours,maxPerRun:s.maxPerRun,effectiveFrom:s.effectiveFrom||''});
const dirty=()=>data&&JSON.stringify(draft)!==JSON.stringify(fromSettings(data.settings));
export function configureDiscovery(hooks){h=hooks;}
export function invalidateDiscovery(){key='';data=null;draft=null;}
async function load(){loading=true;error='';h.render();try{data=await h.api('/admin/law-discovery');draft=fromSettings(data.settings);}catch(e){error=e.message;}finally{loading=false;h.render();}}
export function mountDiscovery(){if(!h||h.screen()!=='discovery'){key='';return;}paintDiscovery();const next=h.account()?.user.id||'';if(next&&key!==next&&!loading){key=next;void load();}}
async function act(fn,done){if(busy)return;busy=true;error='';h.render();try{await fn();notify(done);}catch(e){error=messages[e.code]||e.message;notify(error,'error');}finally{busy=false;h.render();}}

function sourcesBlock(){const all=data.sources.length>0&&data.sources.every(s=>draft.sources.includes(s.url)),some=draft.sources.length>0&&!all;
 return `<fieldset class="discovery-field"><legend>Nguồn văn bản</legend>
 <label class="discovery-check discovery-all"><input type="checkbox" data-discovery-all ${all?'checked':''} ${some?'data-indeterminate="1"':''}><span><strong>Tất cả nguồn</strong><small>${data.sources.length} nguồn chính thức</small></span></label>
 <div class="discovery-sources">${data.sources.map(s=>`<label class="discovery-check"><input type="checkbox" data-discovery-source value="${esc(s.url)}" ${draft.sources.includes(s.url)?'checked':''}><span><strong>${esc(s.label)}</strong><small>${esc(s.domain)} · ${s.lastError?esc(errors[s.lastError]||'Lần quét gần nhất lỗi'):s.lastSuccessAt?'Quét lúc '+time(s.lastSuccessAt):'Chưa quét'}</small></span></label>`).join('')||'<p class="discovery-empty">Chưa có nguồn nào được cấu hình.</p>'}</div></fieldset>`;}
const segmented=(name,legend,hint,options,value)=>`<fieldset class="discovery-field"><legend>${legend}</legend><div class="discovery-segmented" role="radiogroup">${options.map(([v,l])=>`<label><input type="radio" name="${name}" value="${v}" ${Number(value)===v?'checked':''}><span>${l}</span></label>`).join('')}</div>${hint?`<small class="discovery-hint">${hint}</small>`:''}</fieldset>`;

function form(){return `<form id="law-discovery-form" class="discovery-panel">
 <label class="discovery-switch"><input type="checkbox" name="enabled" ${draft.enabled?'checked':''}><span class="discovery-switch-track" aria-hidden="true"></span><span><strong>Tự thu thập văn bản mới</strong><small>${draft.enabled?'Hệ thống sẽ tự quét các nguồn đã chọn theo định kỳ.':'Đang tắt — hệ thống không gửi yêu cầu nào tới nguồn.'}</small></span></label>
 ${sourcesBlock()}
 ${segmented('intervalHours','Định kỳ quét','Mỗi nguồn được quét lại sau khoảng thời gian này. Hệ thống luôn giãn cách 30 giây giữa hai lần truy cập cùng một trang.',INTERVALS,draft.intervalHours)}
 ${segmented('maxPerRun','Số lượng tối đa mỗi lần quét','Số văn bản mới tối đa lấy từ mỗi nguồn trong một lần quét; phần còn lại được lấy ở lần sau.',LIMITS.map(n=>[n,n+' văn bản']),draft.maxPerRun)}
 <fieldset class="discovery-field"><legend>Có hiệu lực từ ngày</legend><div class="discovery-date"><input type="date" name="effectiveFrom" value="${esc(draft.effectiveFrom)}">${draft.effectiveFrom?'<button type="button" class="text-action" data-discovery="clear-date">Bỏ lọc ngày</button>':''}</div><small class="discovery-hint">${draft.effectiveFrom?'Chỉ đưa vào hàng chờ văn bản có hiệu lực từ ngày này. Văn bản chưa rõ ngày hiệu lực vẫn được giữ để người duyệt kiểm tra.':'Để trống: lấy mọi văn bản mới, không lọc theo ngày hiệu lực.'}</small></fieldset>
 ${error?`<p class="form-error" role="alert">${esc(error)}</p>`:''}
 <div class="discovery-actions"><button type="submit" class="primary-button" ${busy||!dirty()?'disabled':''}>${h.icon('check',16)} ${busy?'Đang lưu…':'Lưu thiết lập'}</button><button type="button" class="secondary-button" data-discovery="run" ${busy||!data.settings.enabled||dirty()?'disabled':''} title="${data.settings.enabled?'':'Bật và lưu thiết lập trước'}">${h.icon('rotate',16)} Quét ngay</button>${dirty()?'<span class="discovery-unsaved">Có thay đổi chưa lưu</span>':''}</div>
</form>`;}

function rail(){const st=data.stats,cards=[['Văn bản mới 24 giờ',st.new24h],['Văn bản mới 7 ngày',st.new7d],['Bỏ qua do ngày hiệu lực (7 ngày)',st.skippedByDate7d]];
 return `<aside class="discovery-rail">
 <section class="discovery-panel"><h2>Tình trạng</h2><dl class="discovery-facts"><div><dt>Trạng thái</dt><dd><span class="discovery-pill ${data.settings.enabled?'on':''}">${data.settings.enabled?'Đang bật':'Đang tắt'}</span></dd></div><div><dt>Quét gần nhất</dt><dd>${time(st.lastRunAt)}</dd></div><div><dt>Lần quét tiếp theo</dt><dd>${data.settings.enabled?time(st.nextRunAt):'—'}</dd></div><div><dt>Cập nhật thiết lập</dt><dd>${time(data.settings.updatedAt)}</dd></div></dl>
 <div class="discovery-stats">${cards.map(([l,n])=>`<div><strong>${n}</strong><span>${l}</span></div>`).join('')}</div></section>
 <section class="discovery-panel"><div class="discovery-rail-head"><h2>Văn bản mới tìm thấy</h2><button type="button" class="text-action" data-discovery="changes">Duyệt ${h.icon('arrow',14)}</button></div>
 ${data.recent.length?`<ul class="discovery-recent">${data.recent.map(r=>`<li><strong>${esc(r.title)}</strong><span>${[r.number,r.issued?'Ban hành '+r.issued:null].filter(Boolean).map(esc).join(' · ')||'Chưa đọc được số hiệu'}</span><small><em class="discovery-status ${esc(r.status.toLowerCase())}">${esc(statuses[r.status]||r.status)}</em> Tìm thấy ${time(r.createdAt)}</small></li>`).join('')}</ul>`:'<p class="discovery-empty">Chưa có văn bản mới nào. Khi bật thu thập, văn bản tìm được sẽ hiện ở đây và trong mục Duyệt thay đổi luật.</p>'}</section>
 </aside>`;}

export function renderDiscovery(){if(!h?.account())return '';
 const head=h.pageTitle('NGUỒN VĂN BẢN MỚI','Luật mới','Thiết lập việc tự thu thập văn bản mới ban hành (luật, nghị định, quyết định, thông tư…) từ nguồn chính thức. Văn bản tìm được chờ người duyệt xác nhận trước khi ảnh hưởng tới doanh nghiệp.',data?`<span class="discovery-pill large ${data.settings.enabled?'on':''}">${data.settings.enabled?'Đang thu thập':'Đang tạm dừng'}</span>`:'');
 if(!data)return `${head}<section class="discovery-panel">${loading?'<p>Đang tải thiết lập…</p>':`<p class="form-error">${esc(error||'Chưa tải được thiết lập.')}</p><button type="button" class="secondary-button" data-discovery="reload">Thử lại</button>`}</section>`;
 return `<div class="discovery-workspace">${head}<div class="discovery-layout">${form()}${rail()}</div></div>`;}
// Checkbox indeterminate is a DOM property, not an attribute; set it after each paint.
export function paintDiscovery(){document.querySelectorAll('[data-discovery-all]').forEach(b=>{b.indeterminate=b.dataset.indeterminate==='1';});}

document.addEventListener('change',e=>{if(!draft||!e.target.closest('#law-discovery-form'))return;const t=e.target;
 if(t.matches('[data-discovery-all]'))draft.sources=t.checked?data.sources.map(s=>s.url):[];
 else if(t.matches('[data-discovery-source]'))draft.sources=t.checked?[...new Set([...draft.sources,t.value])]:draft.sources.filter(u=>u!==t.value);
 else if(t.name==='enabled'){draft.enabled=t.checked;if(t.checked&&!draft.sources.length)draft.sources=data.sources.map(s=>s.url);}
 else if(t.name==='intervalHours'||t.name==='maxPerRun')draft[t.name]=Number(t.value);
 else if(t.name==='effectiveFrom')draft.effectiveFrom=t.value;
 else return;h.render();});
document.addEventListener('click',e=>{const b=e.target.closest('[data-discovery]');if(!b||!h)return;const a=b.dataset.discovery;
 if(a==='reload'){void load();return;}if(a==='changes'){h.openChanges();return;}if(a==='clear-date'&&draft){draft.effectiveFrom='';h.render();return;}
 if(a==='run')void act(async()=>{data=await h.api('/admin/law-discovery/run','POST',{});draft=fromSettings(data.settings);},'Đã bắt đầu quét. Văn bản mới sẽ xuất hiện sau vài phút.');});
document.addEventListener('submit',e=>{if(e.target.id!=='law-discovery-form')return;e.preventDefault();if(!draft)return;
 if(draft.enabled&&!draft.sources.length){error=messages.NO_SOURCE_SELECTED;notify(error,'error');h.render();return;}
 void act(async()=>{data=await h.api('/admin/law-discovery','PUT',{...draft,effectiveFrom:draft.effectiveFrom||null});draft=fromSettings(data.settings);},draft.enabled?'Đã lưu thiết lập và bật tự thu thập.':'Đã lưu thiết lập. Tự thu thập đang tắt.');});
