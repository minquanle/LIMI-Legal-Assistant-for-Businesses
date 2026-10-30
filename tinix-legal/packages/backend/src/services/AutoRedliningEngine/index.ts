/**
 * AutoRedliningEngine - Tự động phát hiện lỗi logic hợp đồng
 */
import { CopilotLLMService } from '../copilot-llm-service.js';

export interface RedlineSuggestion {
  id: string;
  originalText: string;
  suggestedText: string;
  reason: string;
  from: number;
  to: number;
}

export class AutoRedliningEngine {
  /**
   * Quét nội dung và trả về các điểm bất hợp lý bằng LLM
   * @param content Nội dung cần quét (plain text)
   * @returns Danh sách RedlineSuggestion
   */
  async scanContent(content: string): Promise<RedlineSuggestion[]> {
    if (!content || content.trim().length < 20) {
      return [];
    }

    try {
      const prompt = `Phân tích đoạn văn bản hợp đồng/hành chính sau đây và tìm các từ/cụm từ bất hợp lý, mâu thuẫn hoặc rủi ro pháp lý.
Trả về danh sách định dạng JSON array với các object chứa:
- "originalText": từ/cụm từ gốc trong văn bản
- "suggestedText": cụm từ sửa đổi đề xuất
- "reason": lý do tại sao cần sửa

Văn bản:
"""
${content}
"""

CHỈ TRẢ VỀ DUY NHẤT CHUỖI JSON ARRAY (ví dụ: [{"originalText": "...", "suggestedText": "...", "reason": "..."}]), KHÔNG KÈM TEXT GIẢI THÍCH NÀO KHÁC.`;

      const response = await CopilotLLMService.complete({
        prompt,
        mode: 'risk_check',
        draftContent: content,
      });

      let parsed: any[] = [];
      try {
        const jsonMatch = response.completion.match(/\[.*\]/s);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('[AutoRedliningEngine] Failed to parse LLM response JSON', e);
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        // Dynamic fallback logic check for standard contractual risks if LLM offline
        const suggestions: RedlineSuggestion[] = [];
        
        // Example rule 1: Chậm thanh toán quá 180 ngày -> Gợi ý 30 ngày
        const matchLate = content.match(/thanh toán chậm quá (\d+)\s*ngày/i);
        if (matchLate) {
          const days = parseInt(matchLate[1], 10);
          if (days > 60) {
            const index = content.indexOf(matchLate[0]);
            suggestions.push({
              id: `redline-${Date.now()}-1`,
              originalText: matchLate[0],
              suggestedText: 'thanh toán chậm quá 30 ngày',
              reason: `Thời hạn phạt chậm thanh toán ${days} ngày là quá dài so me thông lệ doanh nghiệp (tối đa 30 ngày).`,
              from: index + 1,
              to: index + 1 + matchLate[0].length,
            });
          }
        }

        // Example rule 2: Chấm dứt báo trước 5 ngày -> Gợi ý 30 ngày
        const matchNotice = content.match(/báo trước (\d+)\s*ngày/i);
        if (matchNotice) {
          const days = parseInt(matchNotice[1], 10);
          if (days < 30) {
            const index = content.indexOf(matchNotice[0]);
            suggestions.push({
              id: `redline-${Date.now()}-2`,
              originalText: matchNotice[0],
              suggestedText: 'báo trước 30 ngày',
              reason: `Thời gian báo trước ${days} ngày quá ngắn, không đủ chuẩn bị thanh lý hợp đồng.`,
              from: index + 1,
              to: index + 1 + matchNotice[0].length,
            });
          }
        }

        return suggestions;
      }

      // Map parsed LLM suggestions to document positions
      const results: RedlineSuggestion[] = [];
      parsed.forEach((item: any, idx: number) => {
        if (item.originalText && item.suggestedText) {
          const fromPos = content.indexOf(item.originalText);
          const from = fromPos !== -1 ? fromPos + 1 : 1;
          const to = fromPos !== -1 ? from + item.originalText.length : 1 + item.originalText.length;

          results.push({
            id: `redline-llm-${Date.now()}-${idx}`,
            originalText: item.originalText,
            suggestedText: item.suggestedText,
            reason: item.reason || 'Cảnh báo rủi ro pháp lý theo quy chuẩn AI',
            from,
            to,
          });
        }
      });

      return results;
    } catch (err) {
      console.error('[AutoRedliningEngine] Error during LLM scan:', err);
      return [];
    }
  }
}
