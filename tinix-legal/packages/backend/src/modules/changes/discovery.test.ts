import {describe,expect,it} from 'vitest';
import {discoveryInput,parseVnDate,passesEffectiveFrom} from './discovery.js';
describe('law discovery settings',()=>{
 it('reads Vietnamese dates and rejects anything else',()=>{expect(parseVnDate('01/7/2026')).toBe('2026-07-01');expect(parseVnDate('15-12-2025')).toBe('2025-12-15');expect(parseVnDate('Đang cập nhật')).toBeNull();expect(parseVnDate('32/13/2026')).toBeNull();});
 it('filters by effective date, falls back to issue date only when safe, and keeps unknown dates',()=>{
  expect(passesEffectiveFrom({'Ngày hiệu lực':'01/01/2026'},'2026-07-01').keep).toBe(false);
  expect(passesEffectiveFrom({'Ngày hiệu lực':'01/07/2026'},'2026-07-01').keep).toBe(true);
  expect(passesEffectiveFrom({'Ngày ban hành':'02/07/2026'},'2026-07-01')).toMatchObject({keep:true,basis:'issued'});
  // Issued earlier but effective date unknown: it may still take effect later, so it is kept.
  expect(passesEffectiveFrom({'Ngày ban hành':'01/01/2026'},'2026-07-01')).toMatchObject({keep:true,basis:'unknown'});
  expect(passesEffectiveFrom({},'2026-07-01').keep).toBe(true);
  expect(passesEffectiveFrom({'Ngày hiệu lực':'01/01/2020'},null).keep).toBe(true);
 });
 it('accepts only the offered intervals and limits',()=>{
  const ok={enabled:true,sources:['https://vbpl.vn/TW/Pages/vbpq-van-ban-moi.aspx'],intervalHours:3,maxPerRun:20,effectiveFrom:'2026-07-01'};
  expect(discoveryInput.parse(ok)).toEqual(ok);
  for(const bad of [{intervalHours:6},{maxPerRun:500},{effectiveFrom:'01/07/2026'},{extra:true}])expect(()=>discoveryInput.parse({...ok,...bad})).toThrow();
 });
});
import {documentNumberFromTitle,staleSince} from './discovery.js';
import {watchOrder} from './watch.js';
describe('discovery status helpers',()=>{
 it('reads the document number from an official title',()=>{
  expect(documentNumberFromTitle('Thông tư số 56/2026/TT-NHNN sửa đổi, bổ sung một số điều của Thông tư số 34/2025/TT-NHNN')).toBe('56/2026/TT-NHNN');
  expect(documentNumberFromTitle('Quyết định số 2034/QĐ-TTg Ban hành Kế hoạch')).toBe('2034/QĐ-TTg');
  expect(documentNumberFromTitle('Văn bản hợp nhất số 138/2026/VBHN-TT-BXD hợp nhất Thông tư')).toBe('138/2026/VBHN-TT-BXD');
  expect(documentNumberFromTitle('Nghị định 397/2026/NĐ-CP sửa đổi')).toBe('397/2026/NĐ-CP');
  expect(documentNumberFromTitle('Thông báo kết luận của Thủ tướng')).toBeNull();
 });
 it('flags a source not scanned for more than twice its interval plus a day',()=>{
  const now=new Date('2026-11-04T12:00:00Z');
  expect(staleSince(new Date('2026-11-02T10:00:00Z'),1,now)).toBe(true);
  expect(staleSince(new Date('2026-11-04T10:00:00Z'),1,now)).toBe(false);
  expect(staleSince(new Date('2026-11-02T10:00:00Z'),24,now)).toBe(false);
  expect(staleSince(null,24,now)).toBe(true);
 });
 it('puts discovery pages before document pages without duplicates',()=>{
  expect(watchOrder([{id:'d1'}],[{id:'x'},{id:'d1'},{id:'y'}]).map(w=>w.id)).toEqual(['d1','x','y']);
 });
});
