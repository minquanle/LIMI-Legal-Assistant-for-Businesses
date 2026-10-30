import test from 'node:test';
import assert from 'node:assert/strict';
import {checklistGuide,cleanGuide,stepChecks,renderGuide,BOILERPLATE_CHECK} from '../dist/checklist-guide.js';

const content={title:'Kiểm tra thử',group:'labor',action:'Hành động kiểm thử',exceptions:'Không',evidenceInstructions:'Lưu hồ sơ nội bộ.',steps:['Trang bị phương tiện; đối chiếu danh mục.']};

test('generated guides contain one check per clause and no boilerplate tick item',()=>{
 assert.deepEqual(stepChecks('Trang bị phương tiện; đối chiếu danh mục.'),['Trang bị phương tiện.','Đối chiếu danh mục.']);
 assert.deepEqual(checklistGuide(content).steps[0].checks,['Trang bị phương tiện.','Đối chiếu danh mục.']);
});

test('stored guides are cleaned for display without changing the stored object',()=>{
 const stored={question:'Câu hỏi?',proof:'Lưu hồ sơ nội bộ.',done:'Xong.',owner:'Nhân sự',timing:'Hằng năm',steps:[{detail:'Đối chiếu mức; không tự đổi khoản tiền.',when:'',checks:['Đối chiếu mức','không tự đổi khoản tiền.',BOILERPLATE_CHECK],evidence:'Lưu hồ sơ nội bộ.',provisionIds:[]},{detail:'Chỉ có câu mẫu.',when:'',checks:[BOILERPLATE_CHECK],evidence:'Bảng lương có chữ ký.',provisionIds:[]}]};
 const before=JSON.stringify(stored);
 const shown=cleanGuide(stored);
 assert.deepEqual(shown.steps[0].checks,['Đối chiếu mức.','Không tự đổi khoản tiền.']);
 assert.deepEqual(shown.steps[1].checks,['Chỉ có câu mẫu.']);
 assert.equal(JSON.stringify(stored),before);
 assert.deepEqual(checklistGuide({...content,guide:stored}).steps[0].checks,shown.steps[0].checks);
});

test('step evidence is shown only when it says more than the checklist-level proof',()=>{
 const guide={question:'Câu hỏi?',proof:'Lưu hồ sơ nội bộ.',done:'Xong.',owner:'Nhân sự',timing:'Hằng năm',steps:[{detail:'Bước một.',when:'',checks:['Bước một.'],evidence:'Lưu hồ sơ nội bộ.',provisionIds:[]},{detail:'Bước hai.',when:'',checks:['Bước hai.'],evidence:'Bảng lương có chữ ký.',provisionIds:[]}]};
 const html=renderGuide({...content,steps:['Bước một.','Bước hai.'],guide},[],{esc:x=>String(x),icon:()=>'',cite:()=>''});
 assert.equal(html.split('Bằng chứng cần đối chiếu').length-1,1);
 assert.ok(html.includes('Bảng lương có chữ ký.'));
});
test('published guides drop draft-stage wording and repeated evidence text',()=>{
 const proof='Chuẩn bị biên bản tương ứng. Bản nháp không tự yêu cầu nộp tài liệu cho cơ quan nhà nước.';
 const g=checklistGuide({title:'T',steps:['A'],evidenceInstructions:proof,guide:{question:'Q',proof,done:'D',owner:'O',timing:'X',steps:[{detail:'A',when:'',checks:['A'],evidence:proof,provisionIds:[]}]}});
 assert.equal(g.proof,'Chuẩn bị biên bản tương ứng.');assert.equal(g.steps[0].evidence,'');
 assert.ok(!JSON.stringify(checklistGuide({title:'T',group:'tax',steps:['A'],evidenceInstructions:proof})).includes('Bản nháp'));
});
