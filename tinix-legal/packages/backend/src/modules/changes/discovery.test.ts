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
