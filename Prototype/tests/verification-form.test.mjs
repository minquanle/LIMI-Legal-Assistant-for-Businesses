import test from 'node:test';import assert from 'node:assert/strict';
import {renderVerificationForm} from '../dist/verification-form.js';
const esc=x=>String(x).replaceAll('<','&lt;').replaceAll('"','&quot;');
test('one question at a time, existing facts and shared answer count',()=>{
 const html=renderVerificationForm({knownFacts:[{label:'Quy mô lao động',text:'10–49 nhân viên'}],questions:[{fact:'hasOvertime',label:'Có làm thêm giờ không?',help:'',options:[['yes','Có'],['no','Không']],affectedCount:2},{fact:'hasNightWork',label:'Không được hỏi đồng thời'}]},{esc});
 assert.match(html,/10–49 nhân viên/);assert.match(html,/2 việc/);assert.match(html,/value="yes"/);assert.match(html,/value="no"/);assert.match(html,/Chưa rõ/);assert.doesNotMatch(html,/Không được hỏi đồng thời|data-review-result/);
});
test('specialist confirmation is explicit, values escaped, read-only cannot submit',()=>{
 const html=renderVerificationForm({questions:[{fact:'case',label:'<x>',specialist:true,options:[['other','<option>']]}]},{esc,disabled:true});
 assert.match(html,/fieldset disabled/);assert.match(html,/không tự đoán/);assert.match(html,/&lt;option>/);assert.doesNotMatch(html,/<x>/);
});
