import { normalizeDocumentNumber, normalizeDocumentType } from '../parsers/metadata-parser.js';
import { normalizeIssuingBody } from '../parsers/issuing-body-normalizer.js';

/** Candidate lookup key only; matching fields never prove identity. */
export interface CanonicalKey {
  normalizedNumber: string;
  documentType: string;
  issuingBodyCode: string;
}

/**
 * Raw document record from a single source.
 */
export interface SourceRecord {
  source: string;
  url: string;
  title: string;
  documentNumber: string;
  documentType: string;
  issuingBody: string;
  metadata: Record<string, string>;
  contentHtml: string;
  fullText: string;
  crawledAt: string;
}

/**
 * Result of the deduplication process.
 */
export interface DeduplicationResult {
  /** The canonical key */
  key: CanonicalKey;
  /** Whether this is a new document or a merge into existing */
  action: 'NEW' | 'MERGE' | 'SKIP';
  /** The merged/best record */
  bestRecord: SourceRecord;
  /** All source records for this canonical key */
  sourceRecords: SourceRecord[];
  /** Confidence score (0-1) for the match */
  confidence: number;
}

/**
 * Generate the canonical key for a document.
 */
export function generateCanonicalKey(docNumber: string, docType: string, issuingBody: string): CanonicalKey {
  return {
    normalizedNumber: normalizeDocumentNumber(docNumber),
    documentType: normalizeDocumentType(docType),
    issuingBodyCode: normalizeIssuingBody(issuingBody),
  };
}

/**
 * Check if two documents match by canonical key (exact match on normalized
 * number + type + issuing body — the same three fields the database's
 * candidate index uses).
 */
export function matchByCanonicalKey(a: CanonicalKey, b: CanonicalKey): boolean {
  return (
    a.normalizedNumber === b.normalizedNumber &&
    a.documentType === b.documentType &&
    a.issuingBodyCode === b.issuingBodyCode &&
    a.normalizedNumber.length > 0
  );
}

/**
 * Compute text similarity using Jaccard coefficient on character trigrams.
 * Used as fuzzy fallback when canonical keys don't match perfectly.
 * 
 * @param textA First text snippet (e.g., first 300 chars of document)
 * @param textB Second text snippet
 * @returns Similarity score 0-1
 */
export function computeTrigramSimilarity(textA: string, textB: string): number {
  const trigramsA = getCharTrigrams(textA.toLowerCase());
  const trigramsB = getCharTrigrams(textB.toLowerCase());

  if (trigramsA.size === 0 || trigramsB.size === 0) return 0;

  let intersection = 0;
  for (const trigram of trigramsA) {
    if (trigramsB.has(trigram)) intersection++;
  }

  const union = trigramsA.size + trigramsB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function getCharTrigrams(text: string): Set<string> {
  const trigrams = new Set<string>();
  const cleaned = text.replace(/\s+/g, ' ').trim();
  for (let i = 0; i < cleaned.length - 2; i++) {
    trigrams.add(cleaned.substring(i, i + 3));
  }
  return trigrams;
}

/** Preserve observations until identity-aware persistence. */
export function deduplicateBatch(records: SourceRecord[]): DeduplicationResult[] {
  // Keep every observation. Identity-aware persistence/import handles replay;
  // candidate keys and fuzzy similarity never authorize throwing away a record.
  return records.map(record => ({
    key: generateCanonicalKey(record.documentNumber, record.documentType, record.issuingBody),
    action: 'NEW', bestRecord: record, sourceRecords: [record], confidence: 0.5,
  }));
}
