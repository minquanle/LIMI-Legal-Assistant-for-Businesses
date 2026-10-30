import { SearchService } from '../application/search-service.js';

export interface RAGContextItem {
  id: string;
  documentNumber: string;
  documentType: string;
  title: string;
  issuingBody: string;
  validityStatus: string;
  snippet: string;
}

export class CopilotRAGService {
  /**
   * Retrieves top legal documents matching prompt context using Hybrid Search (BM25 + pgvector).
   */
  static async getContext(query: string, limit: number = 6): Promise<RAGContextItem[]> {
    if (!query || !query.trim()) return [];

    try {
      const searchRes = await SearchService.search({
        q: query,
        hybrid: true,
        limit,
      });

      return (searchRes.results || []).map((doc: any) => ({
        id: doc.id,
        documentNumber: doc.documentNumber,
        documentType: doc.documentType,
        title: doc.title,
        issuingBody: doc.issuingBody,
        validityStatus: doc.validityStatus,
        snippet: doc.astMatch?.contentSnippet || doc._formatted?.fullText || doc.trichYeu || doc.title,
      }));
    } catch (err) {
      console.error('Copilot RAG Context Retrieval failed:', err);
      return [];
    }
  }

  /**
   * Formats RAG context into Markdown text for LLM Prompt inclusion.
   */
  static formatRAGPrompt(items: RAGContextItem[]): string {
    if (!items || items.length === 0) {
      return 'Không tìm thấy căn cứ pháp lý liên quan trực tiếp trong cơ sở dữ liệu.';
    }

    return items
      .map(
        (item, idx) =>
          `[${idx + 1}] ${item.documentType} số ${item.documentNumber} do ${item.issuingBody} ban hành (Trạng thái: ${item.validityStatus})\nTiêu đề: ${item.title}\nTrích đoạn: "${item.snippet}"\n`
      )
      .join('\n---\n');
  }
}
