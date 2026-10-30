/**
 * Shared job payload contract between crawler producers (crawlers/*) and the
 * ingestion consumer (queue/ingestion-worker.ts). Kept intentionally loose —
 * mirrors the shape each site module has always produced — but named so both
 * sides agree on it instead of passing around untyped `any`.
 */
export interface RawScrapedDocument {
  id?: string;
  source: string;
  url: string;
  title: string;
  metadata: Record<string, any>;
  contentHtml?: string;
  fullText?: string;
  downloadLinks?: Array<{ url: string; filename: string }>;
  crawledAt?: string;
}

export const INGESTION_QUEUE_NAME = 'CrawlIngestionQueue';
export const INGESTION_JOB_NAME = 'ingestDocument';
