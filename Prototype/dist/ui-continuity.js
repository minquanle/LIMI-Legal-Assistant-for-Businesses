const focusKey=element=>{
 if(!element||element===document.body)return null;
 if(element.id)return '#'+CSS.escape(element.id);
 if(element.name&&element.closest('form')?.id)return '#'+CSS.escape(element.closest('form').id)+' [name="'+CSS.escape(element.name)+'"]';
 const attrs=[...element.attributes].filter(a=>a.name.startsWith('data-'));
 return attrs.length?element.tagName.toLowerCase()+attrs.map(a=>`[${a.name}="${CSS.escape(a.value)}"]`).join(''):null;
};
const pageKey=()=>location.pathname+location.search+'|'+(document.querySelector('#main-content h1')?.textContent||'');
const sheetKey=()=>document.querySelector('.detail-sheet h2')?.textContent||'';
export function captureView(){
 const seen=new Map();return {page:pageKey(),sheet:sheetKey(),x:window.scrollX,y:window.scrollY,top:document.querySelector('.sheet-content')?.scrollTop||0,focus:focusKey(document.activeElement),selection:[document.activeElement?.selectionStart,document.activeElement?.selectionEnd],details:[...document.querySelectorAll('#app details,#overlay details')].map(d=>{const key=(d.closest('form')?.id||d.closest('#overlay')&&'overlay'||'app')+'|'+(d.querySelector(':scope > summary')?.textContent||'');const index=seen.get(key)||0;seen.set(key,index+1);return {key,index,open:d.open};})};
}
export function restoreView(view){
 if(view.page!==pageKey())return;
 const sameSheet=view.sheet===sheetKey(),seen=new Map();
 for(const d of document.querySelectorAll('#app details,#overlay details')){
  if(d.closest('#overlay')&&!sameSheet)continue;
  const key=(d.closest('form')?.id||d.closest('#overlay')&&'overlay'||'app')+'|'+(d.querySelector(':scope > summary')?.textContent||'');const index=seen.get(key)||0;seen.set(key,index+1);const old=view.details.find(x=>x.key===key&&x.index===index);if(old)d.open=old.open;
 }
 if(sameSheet){const sheet=document.querySelector('.sheet-content');if(sheet)sheet.scrollTop=view.top;const focus=view.focus&&document.querySelector(view.focus);focus?.focus({preventScroll:true});if(focus&&view.selection.every(x=>typeof x==='number')&&focus.setSelectionRange){try{focus.setSelectionRange(...view.selection);}catch{}}}
 window.scrollTo({left:view.x,top:view.y,behavior:'instant'});
}
export function captureFormDrafts(){return {page:pageKey(),forms:[...document.querySelectorAll('#app form,#overlay form')].filter(f=>f.id).map(f=>({id:f.id,fields:[...f.elements].filter(e=>e.name&&!['hidden','submit','button','password'].includes(e.type)).map(e=>({name:e.name,type:e.type,value:e.value,selectedValues:e.type==='select-multiple'?[...e.selectedOptions].map(o=>o.value):null,checked:e.checked,element:e.type==='file'&&e.files?.length?e:null}))}))};}
export function restoreFormDrafts(draft){if(draft.page!==pageKey())return;for(const f of draft.forms){const form=document.getElementById(f.id);if(!form)continue;const used=new Map();for(const field of f.fields){const candidates=[...form.elements].filter(e=>e.name===field.name&&e.type===field.type),index=used.get(field.name)||0;used.set(field.name,index+1);const input=candidates[index];if(!input)continue;if(field.type==='file'){if(field.element)input.replaceWith(field.element);}else if(['checkbox','radio'].includes(field.type))input.checked=field.checked;else if(field.type==='select-multiple'){for(const option of input.options)option.selected=field.selectedValues.includes(option.value);}else input.value=field.value;}}}
