/**
 * Domain layer: Repository interfaces.
 * These define the contract for data access without coupling to any specific ORM or DB.
 */

// ─── Document ───────────────────────────────────────────────────────
export interface DocumentSummary {
  id: string;
  documentNumber: string;
  normalizedNumber?: string;
  documentType: string;
  title: string;
  issuingBody: string;
  promulgationDate: Date | null;
  effectiveDate: Date | null;
  validityStatus: string;
  field: string;
}

export interface DocumentDetail extends DocumentSummary {
  signer: string;
  expiryDate: Date | null;
  gazetteNumber: string;
  gazetteDate: Date | null;
  isConsolidated: boolean;
  isTranslation: boolean;
  trichYeu: string;
  author: string;
  lastUpdatedAt: Date | null;
  fullText: string;
  ast: unknown;
  createdAt: Date;
  updatedAt: Date;
  sources: SourceRecord[];
  attachments: AttachmentRecord[];
  astNodes: AstNodeRecord[];
  outgoingRelations: RelationRecord[];
  incomingRelations: RelationRecord[];
}

export interface SourceRecord {
  id: string;
  site: string;
  url: string;
  lastCrawledAt: Date;
}

export interface AttachmentRecord {
  id: string;
  originalName: string;
  hash: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}

export interface AstNodeRecord {
  id: string;
  nodeType: string;
  ordinal: string;
  heading: string;
  content: string;
  path: string;
  depth: number;
  orderIndex: number;
  parentId: string | null;
}

export interface RelationRecord {
  id: string;
  relationType: string;
  targetDocNumber: string;
  description: string;
  document: { id: string; title: string; documentNumber: string } | null;
}

// ─── Search ──────────────────────────────────────────────────────────
export interface SearchParams {
  q?: string;
  documentType?: string;
  issuingBody?: string;
  validityStatus?: string;
  field?: string;
  exact?: string;
  scope?: string;
  yearFrom?: string;
  yearTo?: string;
  page?: number;
  limit?: number;
  hybrid?: string | boolean;
}

export interface VectorSearchResult {
  documentId: string;
  score: number;
}

export interface SearchResult {
  results: (DocumentSummary & { rrfScore?: number; vectorScore?: number })[];
  total: number;
  page: number;
  limit: number;
  query: string;
  processingTimeMs?: number;
  isHybrid?: boolean;
  /** True when the full-text index was unavailable and results came from a degraded Postgres fallback. */
  degraded?: boolean;
}

// ─── Facets ──────────────────────────────────────────────────────────
export interface FacetsResult {
  totalDocuments: number;
  documentTypes: { value: string; count: number }[];
  issuingBodies: { value: string; count: number }[];
  validityStatuses: { value: string; count: number }[];
  fields: { value: string; count: number }[];
  yearRange: { min: number | null; max: number | null };
}


// ─── Admin Stats ─────────────────────────────────────────────────────
export interface AdminStats {
  totalDocs: number;
  totalRelations: number;
  totalAstNodes: number;
  totalSources: number;
  docsWithoutRelationsCount: number;
  docsWithRelationsCount: number;
  docsWithoutFullTextCount: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  topIssuingBody: { name: string; count: number }[];
  relationBreakdown: { type: string; count: number }[];
}
