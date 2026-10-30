import test from 'node:test';
import assert from 'node:assert/strict';
import {renderVerificationSummary} from '../dist/checklist-guide.js';

test('verification presents scope information without assessment or completion controls',()=>{
 const html=renderVerificationSummary({title:'Kiểm tra kênh bán',group:'commerce',steps:['Đối chiếu hồ sơ'],evidenceInstructions:'Thông tin về kênh bán'},[{title:'Nguồn luật'}],{
  missingFacts:['Kênh bán hàng'],explanation:'Chưa xác định phạm vi áp dụng',
  esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),icon:()=>'',cite:c=>`<div class="basis-item">${c.title}</div>`
 });
 assert.match(html,/Tóm tắt để xác minh/);
 assert.match(html,/Kênh bán hàng/);
 assert.match(html,/Nguồn luật/);
 assert.doesNotMatch(html,/review-step|data-review-result|textarea|data-review-finish/);
});
