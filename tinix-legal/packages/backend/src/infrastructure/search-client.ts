import { MeiliSearch } from 'meilisearch';

/**
 * Centralized MeiliSearch client singleton.
 */
export const meili = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY || '',
});

export const LEGAL_DOCS_INDEX = 'legal_documents';
export const LEGAL_AST_INDEX = 'legal_ast_nodes';
