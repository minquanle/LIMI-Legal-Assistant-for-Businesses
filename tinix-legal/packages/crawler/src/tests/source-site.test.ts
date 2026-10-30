import { describe, it, expect } from 'vitest';
import { mapSourceSite } from '../utils/source-site.js';

describe('mapSourceSite', () => {
  it('maps each known source string to its SourceSite enum value', () => {
    expect(mapSourceSite('vbpl.vn')).toBe('VBPL');
    expect(mapSourceSite('luatvietnam.vn')).toBe('LUATVIETNAM');
    expect(mapSourceSite('thuvienphapluat.vn')).toBe('THUVIENPHAPLUAT');
    expect(mapSourceSite('chinhphu.vn')).toBe('CHINHPHU');
    expect(mapSourceSite('phapdien.moj.gov.vn')).toBe('PHAPDIEN');
    expect(mapSourceSite('vanbanphapluat.gov.vn')).toBe('VANBANPHAPLUAT');
  });

  it('falls back to VBPL for an unrecognized source', () => {
    expect(mapSourceSite('some-unknown-site.vn')).toBe('OTHER');
    expect(mapSourceSite('')).toBe('OTHER');
    expect(mapSourceSite('congbao.hungyen.gov.vn')).toBe('HUNG_YEN');
    expect(mapSourceSite('dulieuphapluat.vn')).toBe('DULIEUPHAPLUAT');
    expect(mapSourceSite('vbpl.vn.evil.example')).toBe('OTHER');
  });
});
