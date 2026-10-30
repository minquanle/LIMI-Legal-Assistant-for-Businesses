import { sourceSiteForDomain, type LegalSourceSite } from '@tinix-legal/shared/dist/source-identity.js';
export type SourceSiteName = LegalSourceSite;

/**
 * Map a free-form source string (as produced by each crawler module, e.g.
 * "vbpl.vn", "thuvienphapluat.vn") to the SourceSite enum used by CrawlLog /
 * DocumentSource. Centralized here so both the ingestion pipeline and the
 * top-level crawl-cycle error logging (src/index.ts) agree on the mapping.
 */
export function mapSourceSite(sourceStr: string): SourceSiteName {
  try { return sourceSiteForDomain(new URL(sourceStr.includes('://') ? sourceStr : `https://${sourceStr}`).hostname); }
  catch { return 'OTHER'; }
}
