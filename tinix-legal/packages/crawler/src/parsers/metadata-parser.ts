import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';
import { normalizeIssuingBody } from './issuing-body-normalizer.js';

/**
 * Metadata fields extracted from a legal document HTML page.
 */
export interface ParsedMetadata {
  documentNumber: string;
  normalizedNumber: string;
  documentType: string;
  title: string;
  issuingBody: string;
  issuingBodyCode: string;
  signer: string;
  promulgationDate: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  validityStatus: string;
  field: string;
  preciseValidityStatus: string;
  gazetteNumber: string;
  gazetteDate: string | null;
  isConsolidated: boolean;
  isTranslation: boolean;
  trichYeu: string;
  author: string;
  lastUpdatedAt: string;
  keywords: Array<{ text: string; url: string }>;
  legalBasis: Array<{ law: string; number: string; url: string }>;
  relationships: ParsedRelationship[];
}

export interface ParsedRelationship {
  targetDocNumber: string;
  normalizedTargetNumber?: string;
  relationshipType: string;
  sourceNodeRef?: string;   // e.g. "Điều 15" or "Khoản 2 Điều 7" in source document
  targetNodeRef?: string;   // e.g. "Điều 3" in target document
}

/**
 * Map of Vietnamese document type strings to normalized enum values.
 */
const DOCUMENT_TYPE_MAP: Record<string, string> = {
  'luật': 'LUAT',
  'bộ luật': 'LUAT',
  'pháp lệnh': 'PHAP_LENH',
  'nghị định': 'NGHI_DINH',
  'nghị quyết': 'NGHI_QUYET',
  'quyết định': 'QUYET_DINH',
  'thông tư': 'THONG_TU',
  'thông tư liên tịch': 'THONG_TU_LIEN_TICH',
  'chỉ thị': 'CHI_THI',
  'công văn': 'CONG_VAN',
  'thông báo': 'THONG_BAO',
  'lệnh': 'LENH',
};

/**
 * Map of Vietnamese validity status strings to normalized enum values.
 */
const VALIDITY_STATUS_MAP: Record<string, string> = {
  'còn hiệu lực': 'CON_HIEU_LUC',
  'đang có hiệu lực': 'CON_HIEU_LUC',
  'có hiệu lực': 'CON_HIEU_LUC',
  'hết hiệu lực': 'HET_HIEU_LUC',
  'hết hiệu lực toàn bộ': 'HET_HIEU_LUC',
  'hết hiệu lực một phần': 'HET_HIEU_LUC_MOT_PHAN',
  'chưa có hiệu lực': 'CHUA_CO_HIEU_LUC',
  'chưa hiệu lực': 'CHUA_CO_HIEU_LUC',
  'ngưng hiệu lực': 'NGUNG_HIEU_LUC',
  'tạm ngưng hiệu lực': 'NGUNG_HIEU_LUC',
};

/**
 * Map of Vietnamese relationship type strings to normalized enum values.
 */
const RELATIONSHIP_TYPE_MAP: Record<string, string> = {
  'căn cứ': 'CAN_CU',
  'hướng dẫn': 'HUONG_DAN',
  'sửa đổi': 'SUA_DOI',
  'bổ sung': 'SUA_DOI', // usually SUA_DOI_BO_SUNG is mapped to SUA_DOI
  'thay thế': 'THAY_THE',
  'bãi bỏ': 'BAI_BO',
  'liên quan': 'LIEN_QUAN',
};

/**
 * Normalize a document number for deduplication matching.
 * - Trim whitespace
 * - Replace all hyphens/en-dashes/em-dashes with forward slashes
 * - Remove extra spaces
 * - Uppercase
 * 
 * Example: "31 / 2024/QH15" → "31/2024/QH15"
 * Example: "31-2024-QH15" → "31/2024/QH15"
 */
export function normalizeDocumentNumber(num: string): string {
  return num
    .trim()
    .replace(/[\s]+/g, '') // Remove all whitespace
    .replace(/[-–—]/g, '/') // Replace dashes with forward slashes
    .replace(/\/+/g, '/') // Collapse consecutive slashes
    .toUpperCase();
}

/**
 * Normalize document type string to enum value.
 */
export function normalizeDocumentType(typeStr: string): string {
  const lower = typeStr.toLowerCase().trim();
  for (const [key, value] of Object.entries(DOCUMENT_TYPE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return 'KHAC';
}

/**
 * Normalize validity status string to enum value.
 */
export function normalizeValidityStatus(statusStr: string): string {
  const trimmed = statusStr.trim();
  const validEnums = ['CON_HIEU_LUC', 'HET_HIEU_LUC', 'HET_HIEU_LUC_MOT_PHAN', 'CHUA_CO_HIEU_LUC', 'NGUNG_HIEU_LUC', 'KHONG_XAC_DINH'];
  if (validEnums.includes(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(VALIDITY_STATUS_MAP)) {
    if (lower.includes(key)) return value;
  }
  return 'KHONG_XAC_DINH';
}

/**
 * Normalize relationship type string to enum value.
 */
export function normalizeRelationshipType(relStr: string): string {
  const lower = relStr.toLowerCase().trim();
  for (const [key, value] of Object.entries(RELATIONSHIP_TYPE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return 'LIEN_QUAN';
}

/**
 * Parse a Vietnamese date string into ISO date.
 * Handles formats: "dd/mm/yyyy", "dd-mm-yyyy", "ngày dd tháng mm năm yyyy"
 */
export function parseVietnameseDate(dateStr: string): string | null {
  if (!dateStr) return null;

  const cleaned = dateStr.trim();

  // Format: dd/mm/yyyy or dd-mm-yyyy
  const slashMatch = cleaned.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Format: "ngày dd tháng mm năm yyyy"
  const vnMatch = cleaned.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i);
  if (vnMatch) {
    const [, day, month, year] = vnMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  logger.warn(`Could not parse date: "${dateStr}"`);
  return null;
}

/**
 * Extract metadata from a raw metadata object (key-value pairs).
 * Works with the output from all crawler modules.
 */
export function extractMetadataFromRaw(
  rawMeta: Record<string, string>,
  title: string
): ParsedMetadata {
  const docNum = rawMeta.documentNumber || '';
  const docType = rawMeta.documentType || '';

  // Parse raw relationships if they were extracted by crawler
  const rawRelationshipsStr = rawMeta.rawRelationships || '[]';
  let relationships: ParsedRelationship[] = [];
  try {
    const rawRels = JSON.parse(rawRelationshipsStr);
    if (Array.isArray(rawRels)) {
      relationships = rawRels.map((r: any) => ({
        targetDocNumber: r.targetDocNumber || '',
        normalizedTargetNumber: normalizeDocumentNumber(r.targetDocNumber || ''),
        relationshipType: normalizeRelationshipType(r.relationshipType || ''),
      })).filter(r => r.targetDocNumber !== '');
    }
  } catch (e) {
    logger.warn('Failed to parse rawRelationships JSON');
  }

  return {
    documentNumber: docNum,
    normalizedNumber: normalizeDocumentNumber(docNum),
    documentType: normalizeDocumentType(docType),
    title: title || '',
    issuingBody: rawMeta.issuingBody || '',
    issuingBodyCode: normalizeIssuingBody(rawMeta.issuingBody || ''),
    signer: rawMeta.signer || '',
    promulgationDate: parseVietnameseDate(rawMeta.promulgationDate || ''),
    effectiveDate: parseVietnameseDate(rawMeta.effectiveDate || ''),
    expiryDate: parseVietnameseDate(rawMeta.expiryDate || ''),
    validityStatus: normalizeValidityStatus(rawMeta.validityStatus || ''),
    preciseValidityStatus: rawMeta.preciseValidityStatus || '',
    field: rawMeta.field || '',
    gazetteNumber: rawMeta.gazetteNumber || '',
    gazetteDate: parseVietnameseDate(rawMeta.gazetteDate || ''),
    isConsolidated: rawMeta.isConsolidated === 'true',
    isTranslation: rawMeta.isTranslation === 'true',
    trichYeu: rawMeta.trichYeu || '',
    author: rawMeta.author || '',
    lastUpdatedAt: rawMeta.lastUpdatedAt || '',
    keywords: (() => {
      try { const k = JSON.parse(rawMeta.keywords || '[]'); return Array.isArray(k) ? k : []; } catch { return []; }
    })(),
    legalBasis: (() => {
      try { const l = JSON.parse(rawMeta.legalBasis || '[]'); return Array.isArray(l) ? l : []; } catch { return []; }
    })(),
    relationships,
  };
}

/**
 * Try to infer document type from the document number pattern.
 * Example: "123/2024/NĐ-CP" → NGHI_DINH (NĐ = Nghị định)
 */
export function inferDocumentTypeFromNumber(docNumber: string): string | null {
  const upper = docNumber.toUpperCase();
  if (upper.includes('/QH')) return 'LUAT';
  if (upper.includes('/NĐ-CP') || upper.includes('/ND-CP')) return 'NGHI_DINH';
  if (upper.includes('/NQ-') || upper.includes('/NQ/')) return 'NGHI_QUYET';
  if (upper.includes('/QĐ-') || upper.includes('/QD-')) return 'QUYET_DINH';
  if (upper.includes('/TT-') || upper.includes('/TT/')) return 'THONG_TU';
  if (upper.includes('/TTLT-')) return 'THONG_TU_LIEN_TICH';
  if (upper.includes('/CT-')) return 'CHI_THI';
  if (upper.includes('/PL-')) return 'PHAP_LENH';
  return null;
}
