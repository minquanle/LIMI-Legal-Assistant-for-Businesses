import {describe,expect,it} from 'vitest';
import {foldVietnamese,queryTerms,rankLaws} from './law-search.js';

const laws=[
  {id:'a',documentNumber:'109/2025/QH15',title:'Luật Thuế thu nhập cá nhân',promulgationDate:'2025-12-10'},
  {id:'b',documentNumber:'12/2025/TT-BNV',title:'Quy định chi tiết một số điều của Luật Bảo hiểm xã hội về bảo hiểm xã hội bắt buộc',promulgationDate:'2025-06-30'},
  {id:'c',documentNumber:'04/2017/QH14',title:'Luật Hỗ trợ doanh nghiệp nhỏ và vừa',promulgationDate:'2017-06-12'},
  {id:'d',documentNumber:'10/2020/TT-BLĐTBXH',title:'Nội dung hợp đồng lao động',promulgationDate:'2020-11-12'},
  {id:'e',documentNumber:'105/2025/NĐ-CP',title:'Quy định chi tiết Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ',promulgationDate:null},
];
const ids=(q?:string)=>rankLaws(laws,q).map(x=>x.id);

describe('foldVietnamese',()=>{
  it('removes diacritics, đ and punctuation but keeps number separators',()=>{
    expect(foldVietnamese('Luật Thuế, Đất đai!')).toBe('luat thue dat dai');
    expect(foldVietnamese('10/2020/TT-BLĐTBXH')).toBe('10/2020/tt-bldtbxh');
  });
});

describe('rankLaws',()=>{
  it('finds documents without diacritics',()=>expect(ids('thue thu nhap')).toEqual(['a']));
  it('expands abbreviations',()=>{expect(ids('BHXH')).toEqual(['b']);expect(ids('tncn')).toEqual(['a']);expect(ids('PCCC')).toEqual(['e']);expect(ids('dnnvv')).toEqual(['c']);});
  it('matches word starts, not arbitrary substrings',()=>{expect(ids('ho')).toEqual(['b','d','c','e']);expect(ids('nhap')).toEqual(['a']);expect(ids('hap')).toEqual([]);});
  it('matches document numbers with or without diacritics',()=>{expect(ids('10/2020/TT-BLĐTBXH')).toEqual(['d']);expect(ids('105/2025/nd-cp')).toEqual(['e']);expect(ids('13/2023/NĐ-CP')).toEqual([]);});
  it('lists newest issue date first when there is no query, undated last',()=>expect(ids()).toEqual(['a','b','d','c','e']));
  it('ranks a full title phrase above scattered words',()=>{
    const rows=[{id:'x',documentNumber:'1/2020/NĐ-CP',title:'Hợp đồng và lao động trong doanh nghiệp',promulgationDate:'2024-01-01'},{id:'y',documentNumber:'2/2020/NĐ-CP',title:'Mẫu hợp đồng lao động',promulgationDate:'2020-01-01'}];
    expect(rankLaws(rows,'hợp đồng lao động').map(x=>x.id)).toEqual(['y','x']);
  });
  it('keeps unknown words as plain terms',()=>expect(queryTerms('BHXH bắt buộc')).toEqual(['bao hiem xa hoi','bat','buoc']));
});
