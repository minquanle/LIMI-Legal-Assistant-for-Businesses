import { ParsedMetadata } from '../parsers/metadata-parser.js';
import { RawScrapedDocument } from '../queue/types.js';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Minimum viable sanity check before a scraped document is allowed to reach
 * the database. Extraction (metadata-parser.ts) never validated its own
 * output — an empty documentNumber flowed straight through into
 * `normalizedNumber: ''`, which is indistinguishable from "not a real legal
 * document" once it's a DB row. This is deliberately minimal: it rejects
 * only the cases that make a row meaningless, not anything that could be a
 * legitimate edge case in real legal documents.
 */
export function validateRawDocument(rawDoc: RawScrapedDocument, metadata: ParsedMetadata): ValidationResult {
  if (!metadata.documentNumber || !metadata.documentNumber.trim()) {
    return { valid: false, reason: 'missing documentNumber' };
  }
  if (!metadata.normalizedNumber) {
    return { valid: false, reason: 'documentNumber failed to normalize' };
  }
  if (!rawDoc.title || !rawDoc.title.trim()) {
    return { valid: false, reason: 'missing title' };
  }
  if (!rawDoc.contentHtml?.trim() && !rawDoc.fullText?.trim()) {
    return { valid: false, reason: 'no content (contentHtml and fullText both empty)' };
  }
  return { valid: true };
}
