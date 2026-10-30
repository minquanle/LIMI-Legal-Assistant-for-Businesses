import { describe, it, expect } from 'vitest';
import { generateCanonicalKey, matchByCanonicalKey, computeTrigramSimilarity, deduplicateBatch, SourceRecord } from '../dedup/dedup-engine.js';

describe('generateCanonicalKey', () => {
  it('includes issuingBodyCode for candidate lookup', () => {
    const key = generateCanonicalKey('31/2024/QH15', 'Luật', 'Quốc hội');
    expect(key).toHaveProperty('normalizedNumber');
    expect(key).toHaveProperty('documentType');
    expect(key).toHaveProperty('issuingBodyCode');
    expect(key.issuingBodyCode.length).toBeGreaterThan(0);
  });
});

describe('matchByCanonicalKey', () => {
  it('does not match two documents with the same number+type but different issuing bodies', () => {
    const a = generateCanonicalKey('01/2024/QĐ-UBND', 'Quyết định', 'UBND Tỉnh Hải Dương');
    const b = generateCanonicalKey('01/2024/QĐ-UBND', 'Quyết định', 'UBND Tỉnh Khánh Hòa');
    // Before the fix, this pair would have incorrectly matched (key only
    // compared normalizedNumber + documentType) even though they are two
    // genuinely different documents from two different localities.
    expect(matchByCanonicalKey(a, b)).toBe(false);
  });

  it('matches two records of the same document from different sources', () => {
    const a = generateCanonicalKey('31/2024/QH15', 'Luật', 'Quốc hội');
    const b = generateCanonicalKey('31-2024-QH15', 'luật', 'Quốc Hội');
    expect(matchByCanonicalKey(a, b)).toBe(true);
  });
});

describe('computeTrigramSimilarity', () => {
  it('returns 1 for identical text and 0 for empty input', () => {
    expect(computeTrigramSimilarity('abc def', 'abc def')).toBeCloseTo(1);
    expect(computeTrigramSimilarity('', 'abc')).toBe(0);
  });
});

function record(overrides: Partial<SourceRecord>): SourceRecord {
  return {
    source: 'vbpl.vn',
    url: 'https://vbpl.vn/1',
    title: 'Luật Bảo hiểm xã hội',
    documentNumber: '31/2024/QH15',
    documentType: 'Luật',
    issuingBody: 'Quốc hội',
    metadata: {},
    contentHtml: '<p>nội dung</p>',
    fullText: 'nội dung',
    crawledAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('deduplicateBatch', () => {
  it('preserves same-key records from different sources until identity is verified', () => {
    const results = deduplicateBatch([
      record({ source: 'vbpl.vn', url: 'https://vbpl.vn/1' }),
      record({ source: 'chinhphu.vn', url: 'https://chinhphu.vn/1' }),
    ]);
    expect(results).toHaveLength(2);
    expect(results.every(result=>result.action==='NEW')).toBe(true);
    expect(results.map(result=>result.bestRecord.source)).toEqual(['vbpl.vn','chinhphu.vn']);
  });

  it('keeps records from different issuing bodies as separate canonical docs', () => {
    const results = deduplicateBatch([
      record({ issuingBody: 'UBND Tỉnh Hải Dương' }),
      record({ issuingBody: 'UBND Tỉnh Khánh Hòa' }),
    ]);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.action === 'NEW')).toBe(true);
  });
});
