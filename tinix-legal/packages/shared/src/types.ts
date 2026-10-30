/**
 * Shared type definitions for Vietnam Legal Document System.
 * Used across crawler, backend, and frontend packages.
 */

// ─────────────────────────────────────────────────────────────────
// Document Types (Loại Văn bản)
// ─────────────────────────────────────────────────────────────────
export enum DocumentType {
  LUAT = 'LUAT',                         // Luật
  PHAP_LENH = 'PHAP_LENH',             // Pháp lệnh
  NGHI_DINH = 'NGHI_DINH',             // Nghị định
  NGHI_QUYET = 'NGHI_QUYET',           // Nghị quyết
  QUYET_DINH = 'QUYET_DINH',           // Quyết định
  THONG_TU = 'THONG_TU',               // Thông tư
  THONG_TU_LIEN_TICH = 'THONG_TU_LIEN_TICH', // Thông tư liên tịch
  CHI_THI = 'CHI_THI',                 // Chỉ thị
  CONG_VAN = 'CONG_VAN',               // Công văn
  THONG_BAO = 'THONG_BAO',             // Thông báo
  LENH = 'LENH',                       // Lệnh
  KHAC = 'KHAC',                       // Khác
}

// ─────────────────────────────────────────────────────────────────
// Validity Status (Trạng thái hiệu lực)
// ─────────────────────────────────────────────────────────────────
export enum ValidityStatus {
  CON_HIEU_LUC = 'CON_HIEU_LUC',                   // Còn hiệu lực
  HET_HIEU_LUC = 'HET_HIEU_LUC',                   // Hết hiệu lực
  HET_HIEU_LUC_MOT_PHAN = 'HET_HIEU_LUC_MOT_PHAN', // Hết hiệu lực một phần
  CHUA_CO_HIEU_LUC = 'CHUA_CO_HIEU_LUC',           // Chưa có hiệu lực
  NGUNG_HIEU_LUC = 'NGUNG_HIEU_LUC',               // Ngưng hiệu lực
  KHONG_XAC_DINH = 'KHONG_XAC_DINH',               // Không xác định
}

// ─────────────────────────────────────────────────────────────────
// Source Sites (Nguồn trang web)
// ─────────────────────────────────────────────────────────────────
export enum SourceSite {
  VBPL = 'vbpl.vn',
  THUVIENPHAPLUAT = 'thuvienphapluat.vn',
  LUATVIETNAM = 'luatvietnam.vn',
  PHAPDIEN = 'phapdien.moj.gov.vn',
  CHINHPHU = 'chinhphu.vn',
  VANBANPHAPLUAT = 'vanbanphapluat.gov.vn',
}

// ─────────────────────────────────────────────────────────────────
// Legal Relationship Types (Loại quan hệ pháp lý)
// ─────────────────────────────────────────────────────────────────
export enum RelationshipType {
  CAN_CU = 'CAN_CU',             // Căn cứ (based on)
  HUONG_DAN = 'HUONG_DAN',       // Hướng dẫn (guides)
  SUA_DOI = 'SUA_DOI',           // Sửa đổi, bổ sung (amends)
  THAY_THE = 'THAY_THE',         // Thay thế (replaces)
  BAI_BO = 'BAI_BO',             // Bãi bỏ (repeals)
  LIEN_QUAN = 'LIEN_QUAN',       // Liên quan (related)
}

// ─────────────────────────────────────────────────────────────────
// AST Node Types (Cấu trúc cây văn bản)
// ─────────────────────────────────────────────────────────────────
export enum ASTNodeType {
  PHAN = 'PHAN',       // Phần
  CHUONG = 'CHUONG',   // Chương
  MUC = 'MUC',         // Mục
  DIEU = 'DIEU',       // Điều
  KHOAN = 'KHOAN',     // Khoản
  DIEM = 'DIEM',       // Điểm
  PHU_LUC = 'PHU_LUC', // Phụ lục
}

// ─────────────────────────────────────────────────────────────────
// Core Data Interfaces
// ─────────────────────────────────────────────────────────────────

/** Metadata extracted from a legal document */
export interface DocumentMetadata {
  /** Số/Ký hiệu (e.g., 31/2024/QH15) */
  documentNumber: string;
  /** Normalized document number for matching */
  normalizedNumber: string;
  /** Loại văn bản */
  documentType: DocumentType;
  /** Tiêu đề */
  title: string;
  /** Cơ quan ban hành */
  issuingBody: string;
  /** Người ký */
  signer: string;
  /** Ngày ban hành */
  promulgationDate: string | null;
  /** Ngày có hiệu lực */
  effectiveDate: string | null;
  /** Trạng thái hiệu lực */
  validityStatus: ValidityStatus;
  /** Lĩnh vực */
  field: string;
}

/** A single AST node in the document tree */
export interface ASTNode {
  /** Unique node ID within the document */
  id: string;
  /** Node type (Phần, Chương, Mục, Điều, Khoản, Điểm) */
  type: ASTNodeType;
  /** Ordinal number (e.g., "1", "2a", "đ") */
  ordinal: string;
  /** Heading/title of this node */
  heading: string;
  /** Full text content of this node */
  content: string;
  /** Child nodes */
  children: ASTNode[];
}

/** Source provenance link */
export interface SourceLink {
  /** Source site identifier */
  site: SourceSite;
  /** URL on the source site */
  url: string;
  /** When this source was last crawled */
  lastCrawledAt: string;
  /** HTML content hash for change detection */
  contentHash: string;
}

/** Attachment file (PDF/DOC original) */
export interface AttachmentFile {
  /** Original filename */
  originalName: string;
  /** SHA-256 hash of the file */
  hash: string;
  /** Storage path (local or S3 key) */
  storagePath: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
}

/** Canonical Legal Document Record */
export interface CanonicalDocument {
  /** Internal UUID */
  id: string;
  /** Extracted structured metadata */
  metadata: DocumentMetadata;
  /** Structured AST tree of the document body */
  ast: ASTNode[];
  /** Full plain text of the document */
  fullText: string;
  /** All source provenance links */
  sources: SourceLink[];
  /** Attached original files */
  attachments: AttachmentFile[];
  /** Related document relationships */
  relationships: DocumentRelationship[];
  /** When the canonical record was first created */
  createdAt: string;
  /** When the canonical record was last updated */
  updatedAt: string;
}

/** Relationship link between two documents */
export interface DocumentRelationship {
  /** Type of relationship */
  type: RelationshipType;
  /** Target document number */
  targetDocumentNumber: string;
  /** Target document ID (if resolved) */
  targetDocumentId: string | null;
  /** Description of the relationship */
  description: string;
}

/** Raw crawled document before canonicalization */
export interface RawCrawledDocument {
  /** Source site */
  source: SourceSite;
  /** Original URL */
  url: string;
  /** Raw HTML content */
  rawHtml: string;
  /** Extracted metadata */
  metadata: DocumentMetadata;
  /** Extracted AST */
  ast: ASTNode[];
  /** Full text */
  fullText: string;
  /** Attachment URLs found on the page */
  attachmentUrls: string[];
  /** Related document references found */
  relatedDocRefs: DocumentRelationship[];
  /** Crawl timestamp */
  crawledAt: string;
}
