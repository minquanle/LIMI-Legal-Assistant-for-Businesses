import { describe, it, expect } from 'vitest';

describe('Citation Scanner Document Number Regex', () => {
  const DOC_NUMBER_REGEX = /\b(\d{1,5}\/(?:\d{4}\/)?[A-Za-z0-9-–\u00C0-\u024F\u1EA0-\u1EFF]+)/gi;

  it('should detect document numbers correctly from text', () => {
    const text = 'Căn cứ Luật Đất đai số 31/2024/QH15 và Nghị định số 30/2020/NĐ-CP của Chính phủ.';
    const matches = Array.from(text.matchAll(DOC_NUMBER_REGEX)).map((m) => m[1]);

    expect(matches).toContain('31/2024/QH15');
    expect(matches).toContain('30/2020/NĐ-CP');
  });

  it('should handle document numbers with hyphens and department prefixes', () => {
    const text = 'Theo Quyết định số 123/QĐ-UBND ngày 10/10/2023';
    const matches = Array.from(text.matchAll(DOC_NUMBER_REGEX)).map((m) => m[1]);

    expect(matches).toContain('123/QĐ-UBND');
  });
});
