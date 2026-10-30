// Kết quả của mọi thao tác được báo ở góc phải màn hình, kèm tên nút người dùng vừa bấm.
// Chỉ báo "thành công" khi thao tác thực sự gửi thay đổi lên máy chủ (không báo khi chỉ mở/xem).
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s||'').replace(/\s+/g,' ').trim().slice(0,90);
let lastLabel='',mutations=0,notices=0,seq=0;

document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b)lastLabel=clean(b.getAttribute('aria-label')||b.textContent);},true);
document.addEventListener('submit',e=>{const s=e.submitter;lastLabel=clean(s?s.getAttribute('aria-label')||s.textContent:e.target.querySelector('h2,h3,legend')?.textContent);},true);

export function noteRequest(method){if(method&&method!=='GET')mutations++;}
export function beginAction(){const action={label:lastLabel,mutations,notices};lastLabel='';return action;}
// A specific message already shown by the action (e.g. "Đã lưu hồ sơ") replaces the generic one.
export function endAction(action){if(mutations>action.mutations&&notices===action.notices)notify(action.label?`Đã thực hiện: ${action.label}.`:'Đã lưu thay đổi.');}

function stack(){let el=document.getElementById('action-toasts');if(!el){el=document.createElement('div');el.id='action-toasts';el.setAttribute('aria-live','polite');document.body.append(el);}return el;}
export function notify(message,kind='success'){
 if(!message)return;notices++;const id='toast-'+(++seq),error=kind==='error',heading={success:'Thành công',error:'Chưa thực hiện được',info:'Thông báo'}[kind]||'Thông báo';
 const item=document.createElement('div');item.id=id;item.className=`action-toast ${kind}`;item.setAttribute('role',error?'alert':'status');
 item.innerHTML=`<span class="action-toast-icon" aria-hidden="true">${error?'!':kind==='info'?'i':'✓'}</span><div><strong>${heading}</strong><p>${esc(message)}</p></div><button type="button" class="action-toast-close" aria-label="Đóng thông báo">×</button>`;
 item.querySelector('button').addEventListener('click',()=>item.remove());
 const el=stack();el.append(item);while(el.children.length>4)el.firstElementChild.remove();
 setTimeout(()=>item.remove(),error?9000:5000);
}
