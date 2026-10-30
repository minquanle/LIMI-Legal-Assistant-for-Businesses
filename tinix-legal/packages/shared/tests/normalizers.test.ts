import { describe, it, expect } from 'vitest';
import { normalizeIssuingBody } from '../../crawler/src/parsers/issuing-body-normalizer';
import { normalizeDocumentNumber } from '../../crawler/src/parsers/metadata-parser';

describe('Metadata Normalizers', () => {
  describe('normalizeIssuingBody', () => {
    it('should normalize issuing bodies correctly, stripping location prefixes', () => {
      // Basic normalization
      expect(normalizeIssuingBody('Ủy ban nhân dân')).toBe('ubnd');
      expect(normalizeIssuingBody('Bộ Công Thương')).toBe('bo_cong_thuong');
      
      // Standardizing location prefixes (Tỉnh, Thành phố)
      expect(normalizeIssuingBody('UBND Thành phố Hải Phòng')).toBe('ubnd_hai_phong');
      expect(normalizeIssuingBody('UBND Tỉnh Hải Dương')).toBe('ubnd_hai_duong');
      expect(normalizeIssuingBody('UBND TP. Hà Nội')).toBe('ubnd_ha_noi');
      
      // Standalone equivalents
      expect(normalizeIssuingBody('Uỷ ban nhân dân TP Hải Phòng')).toBe('ubnd_hai_phong');
      
      // No location prefix stripping if it forms the location name itself
      // e.g. "Hà Nam" is fine, but what about "Tỉnh" in "Tỉnh ủy"
      expect(normalizeIssuingBody('Sở Tài chính Tỉnh Khánh Hòa')).toBe('so_tai_chinh_khanh_hoa');
    });

    it('should prevent duplication of Hải Phòng UBND names', () => {
      const name1 = normalizeIssuingBody('UBND Thành phố Hải Phòng');
      const name2 = normalizeIssuingBody('UBND Hải Phòng');
      expect(name1).toBe(name2);
    });
  });

  describe('normalizeDocumentNumber', () => {
    it('should normalize document numbers by removing spaces and standardizing dashes', () => {
      expect(normalizeDocumentNumber('31 / 2024 / QH15')).toBe('31/2024/QH15');
      expect(normalizeDocumentNumber('31-2024-QH15')).toBe('31/2024/QH15');
      expect(normalizeDocumentNumber('31 – 2024 – QH15')).toBe('31/2024/QH15');
      expect(normalizeDocumentNumber('20/2026/QĐ-UBND')).toBe('20/2026/QĐ/UBND');
    });
  });
});
