import {describe,it,expect} from 'vitest';
import {candidateNumbers,matchCandidate,suggestReview,type CitationIndex} from './review-assist.js';

const index:CitationIndex={releaseId:'release-1',versions:[
 {versionId:'v-labor',obligationId:'o-labor',title:'Ban hành nội quy lao động',numbers:['45/2019/QH14','145/2020/NĐ-CP']},
 {versionId:'v-invoice',obligationId:'o-invoice',title:'Kiểm tra hóa đơn điện tử',numbers:['254/2026/NĐ-CP']},
]};

describe('change review assistance (metadata only)',()=>{
 it('collects document numbers from relations, metadata and title',()=>{
  const n=candidateNumbers({title:'Nghị định số 12/2026/NĐ-CP sửa đổi Nghị định 145/2020/NĐ-CP',diffJson:{relations:['45/2019/QH14 '],metadata:{'Số ký hiệu':'12/2026/NĐ-CP'}}});
  expect([...n].sort()).toEqual(['12/2026/NĐ-CP','145/2020/NĐ-CP','45/2019/QH14']);
 });
 it('suggests only obligations whose cited documents are referenced',()=>{
  const c={title:'Nghị định 12/2026/NĐ-CP sửa đổi Nghị định 145/2020/NĐ-CP',diffJson:{relations:['145/2020/NĐ-CP']}};
  expect(matchCandidate(index,c)).toEqual([{versionId:'v-labor',obligationId:'o-labor',title:'Ban hành nội quy lao động',documentNumbers:['145/2020/NĐ-CP']}]);
  expect(matchCandidate(index,{title:'Chỉ thị số 36/CT-TTg về thi hành án dân sự',diffJson:{relations:['36/CT-TTg']}})).toEqual([]);
 });
 it('prefills the approval form from facts, leaving reasons empty when nothing matches',()=>{
  const s=suggestReview(index,{title:'Sửa đổi Nghị định 254/2026/NĐ-CP',diffJson:{relations:['254/2026/NĐ-CP'],metadata:{'Loại văn bản':'Nghị định','Số ký hiệu':'30/2027/NĐ-CP','Cơ quan ban hành':'Chính phủ','Ngày ban hành':'01-02-2027','Ngày hiệu lực':'15-03-2027'}}});
  expect(s.versionIds).toEqual(['v-invoice']);expect(s.effectiveDate).toBe('2027-03-15');expect(s.basis).toBe('METADATA_ONLY');
  expect(s.whatChanged).toContain('Nghị định 30/2027/NĐ-CP');expect(s.why).toContain('254/2026/NĐ-CP');expect(s.action).toContain('Kiểm tra hóa đơn điện tử');
  const none=suggestReview(index,{title:'Thông báo số 523/TB-VPCP',diffJson:{}});
  expect(none).toMatchObject({versionIds:[],effectiveDate:null,why:'',action:''});
 });
 it('never invents an effective date from the issue date',()=>{
  expect(suggestReview(index,{title:'x',diffJson:{metadata:{'Ngày ban hành':'13-10-2026'}}}).effectiveDate).toBeNull();
 });
});
