import { describe, it, expect } from 'vitest';
import { validateRawDocument } from '../pipeline/validate.js';
import { extractMetadataFromRaw } from '../parsers/metadata-parser.js';

function makeMetadata(overrides: Record<string, string> = {}) {
  return extractMetadataFromRaw(
    {
      documentNumber: '31/2024/QH15',
      documentType: 'Luật',
      issuingBody: 'Quốc hội',
      ...overrides,
    },
    'Luật Bảo hiểm xã hội'
  );
}

describe('validateRawDocument', () => {
  it('accepts a document with documentNumber, title, and content', () => {
    const result = validateRawDocument(
      { source: 'vbpl.vn', url: 'https://vbpl.vn/x', title: 'Luật Bảo hiểm xã hội', metadata: {}, contentHtml: '<p>nội dung</p>' },
      makeMetadata()
    );
    expect(result.valid).toBe(true);
  });

  it('rejects when documentNumber is missing — the P0 bug this fixes: empty documentNumber used to flow straight into a DB row', () => {
    const result = validateRawDocument(
      { source: 'vbpl.vn', url: 'https://vbpl.vn/x', title: 'Some title', metadata: {}, contentHtml: '<p>nội dung</p>' },
      makeMetadata({ documentNumber: '' })
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/documentNumber/);
  });

  it('rejects when title is missing', () => {
    const result = validateRawDocument(
      { source: 'vbpl.vn', url: 'https://vbpl.vn/x', title: '', metadata: {}, contentHtml: '<p>nội dung</p>' },
      makeMetadata()
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/title/);
  });

  it('rejects when both contentHtml and fullText are empty', () => {
    const result = validateRawDocument(
      { source: 'vbpl.vn', url: 'https://vbpl.vn/x', title: 'Some title', metadata: {}, contentHtml: '', fullText: '  ' },
      makeMetadata()
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/content/);
  });

  it('accepts when fullText is present even without contentHtml (Cheerio-based crawlers path)', () => {
    const result = validateRawDocument(
      { source: 'chinhphu.vn', url: 'https://chinhphu.vn/x', title: 'Some title', metadata: {}, fullText: 'nội dung văn bản' },
      makeMetadata()
    );
    expect(result.valid).toBe(true);
  });
});
