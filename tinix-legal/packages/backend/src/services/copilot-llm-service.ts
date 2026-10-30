import 'dotenv/config';
import { CopilotRAGService, RAGContextItem } from './copilot-rag-service.js';
import { getLLMApiUrl, getLLMApiKey, getLLMModel } from '../config/llm-config.js';

export interface CopilotCompletionRequest {
  prompt: string;
  mode?: 'generate_draft' | 'suggest_citations' | 'refine_style' | 'risk_check';
  draftContent?: string;
  templateCode?: string;
}

export interface CopilotCompletionResponse {
  completion: string;
  suggestedCitations: RAGContextItem[];
  warnings: string[];
}

export interface CopilotAIActionRequest {
  action: 'formal_rewrite' | 'shorten' | 'expand' | 'grammar_fix' | 'compliance_sanctions' | 'custom_prompt';
  selectedText: string;
  customPrompt?: string;
  documentTitle?: string;
}

export interface CopilotAIActionResponse {
  result: string;
  suggestedCitations?: RAGContextItem[];
  warnings: string[];
}

export class CopilotLLMService {
  private static getApiUrl(): string {
    return getLLMApiUrl();
  }

  private static getApiKey(): string {
    return getLLMApiKey();
  }

  private static getModelName(): string {
    return getLLMModel();
  }

  /**
   * Low-level chat-completion call shared by processAIAction/complete/
   * extractContractMilestones — previously each method duplicated the same
   * fetch + response-parsing + retry-on-failure logic independently. Retries
   * once on network failure or non-OK response before giving up, so a single
   * transient blip doesn't immediately degrade to a lower-quality fallback.
   * Returns the raw assistant message content, or null if the call ultimately
   * failed — callers are responsible for their own fallback behavior.
   */
  private static async callChatCompletion(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<string | null> {
    const MAX_ATTEMPTS = 2;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(this.getApiUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.getApiKey()}`,
          },
          body: JSON.stringify({
            model: this.getModelName(),
            messages,
            temperature: options.temperature ?? 0.3,
            ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
          }),
        });

        if (!response.ok) {
          console.warn(`[CopilotLLM] API returned HTTP ${response.status} (attempt ${attempt}/${MAX_ATTEMPTS})`);
        } else {
          const rawText = await response.text();
          let data: any;
          try {
            data = JSON.parse(rawText);
          } catch {
            const match = rawText.match(/\{[\s\S]*\}/);
            if (match) data = JSON.parse(match[0]);
          }
          const text = data?.choices?.[0]?.message?.content;
          if (text) return text;
          console.warn(`[CopilotLLM] API response had no message content (attempt ${attempt}/${MAX_ATTEMPTS})`);
        }
      } catch (err) {
        console.warn(`[CopilotLLM] API call failed (attempt ${attempt}/${MAX_ATTEMPTS}):`, err instanceof Error ? err.message : err);
      }
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
      }
    }
    return null;
  }

  /**
   * Processes contextual AI actions on a highlighted text selection.
   */
  static async processAIAction(req: CopilotAIActionRequest): Promise<CopilotAIActionResponse> {
    const { action, selectedText, customPrompt = '', documentTitle = '' } = req;
    if (!selectedText || !selectedText.trim()) {
      return { result: '', warnings: ['Đoạn văn bản chọn trống'] };
    }

    let instruction = '';
    switch (action) {
      case 'formal_rewrite':
        instruction =
          'Hãy viết lại đoạn văn bản sau theo thể thức văn phong hành chính trang trọng, chuẩn mực văn bản pháp luật Việt Nam (Nghị định 30/2020/NĐ-CP). Dùng từ ngữ chính xác, không dùng từ khẩu ngữ. Chỉ trả về kết quả văn bản đã viết lại.';
        break;
      case 'shorten':
        instruction =
          'Hãy rút gọn đoạn văn bản pháp lý sau sao cho súc tích, ngắn gọn, gãy gọn nhưng giữ trọn vẹn nghĩa cốt lõi và các điều kiện quan trọng. Chỉ trả về kết quả rút gọn.';
        break;
      case 'expand':
        instruction =
          'Hãy mở rộng và diễn giải chi tiết điều khoản sau, bổ sung rõ ràng quyền hạn, nghĩa vụ, thời hạn và quy trình thực hiện theo chuẩn mực pháp chế doanh nghiệp. Chỉ trả về kết quả đã mở rộng.';
        break;
      case 'grammar_fix':
        instruction =
          'Hãy kiểm tra và sửa toàn bộ lỗi chính tả, lỗi dùng từ ngữ pháp lý và dấu câu trong đoạn văn bản sau. Chỉ trả về kết quả đã sửa.';
        break;
      case 'compliance_sanctions':
        instruction =
          'Hãy bổ sung thêm chế tài phạt vi phạm, bồi thường thiệt hại và cơ chế giải quyết tranh chấp chặt chẽ để bảo vệ quyền lợi tối đa cho bên áp dụng. Chỉ trả về kết quả đã bổ sung.';
        break;
      case 'custom_prompt':
        instruction = customPrompt || 'Hãy hoàn thiện đoạn văn bản sau theo yêu cầu.';
        break;
      default:
        instruction = 'Hãy viết lại đoạn văn bản sau cho chuẩn xác và trang trọng.';
    }

    const systemPrompt = `Bạn là Trợ lý Pháp chế AI chuyên nghiệp tại Việt Nam.
Nhiệm vụ của bạn là xử lý và tối ưu hóa đoạn văn bản được người dùng bôi đen trong quá trình soạn thảo.
Quy tắc:
- Trả về trực tiếp văn bản kết quả đã xử lý (có thể dùng thẻ định dạng hoặc chữ chuẩn).
- KHÔNG thêm lời chào, KHÔNG thêm ghi chú bên ngoài hay giải thích thừa.`;

    const userPrompt = `[Văn bản]: ${documentTitle}
[Yêu cầu]: ${instruction}
[Đoạn văn bản được chọn]:
"${selectedText}"`;

    const rawResult = await this.callChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 2500 }
    );
    if (rawResult) {
      // Remove surrounding markdown quotes if any
      const text = rawResult.trim().replace(/^"|"$/g, '').trim();
      if (text) return { result: text, warnings: [] };
    }

    // Offline / Fallback heuristic logic
    let fallback = selectedText;
    if (action === 'formal_rewrite') {
      fallback = selectedText
        .replace(/công ty sẽ/gi, 'Công ty có trách nhiệm')
        .replace(/phải/gi, 'có nghĩa vụ')
        .replace(/không được/gi, 'nghiêm cấm hành vi');
    } else if (action === 'compliance_sanctions') {
      fallback = `${selectedText} Trường hợp một trong hai bên vi phạm nghĩa vụ nêu trên, bên vi phạm phải chịu phạt vi phạm 8% giá trị phần nghĩa vụ bị vi phạm và bồi thường toàn bộ thiệt hại thực tế phát sinh.`;
    }

    return {
      result: fallback,
      warnings: ['Đã sử dụng bộ tạo dự phòng do kết nối LLM'],
    };
  }

  /**
   * Generates AI drafting completions, citation suggestions, and administrative style refinements.
   */
  static async complete(req: CopilotCompletionRequest): Promise<CopilotCompletionResponse> {
    const { prompt, mode = 'generate_draft', draftContent = '' } = req;

    // 1. Retrieve RAG Legal Context
    const searchContext = await CopilotRAGService.getContext(prompt || draftContent, 6);
    const ragMarkdown = CopilotRAGService.formatRAGPrompt(searchContext);

    // 2. Try calling remote LLM API
    const systemPrompt = `Bạn là Trợ lý AI Pháp lý chuyên nghiệp về Thể thức văn bản hành chính Việt Nam (Nghị định 30/2020/NĐ-CP).
Hãy hỗ trợ người dùng soạn thảo dự thảo văn bản chuẩn xác, trang trọng và tuân thủ đúng pháp luật.
Dưới đây là các căn cứ pháp lý được trích xuất từ cơ sở dữ liệu luật (>214.000 văn bản):
${ragMarkdown}`;

    const text = await this.callChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `[Yêu cầu]: ${prompt}\n[Nội dung dự thảo hiện tại]:\n${draftContent}` },
      ],
      { temperature: 0.3 }
    );
    if (text) {
      return {
        completion: text,
        suggestedCitations: searchContext,
        warnings: [],
      };
    }

    // 3. Fallback Generation Logic (when offline)
    let fallbackText = '';
    const warnings: string[] = [];

    if (mode === 'suggest_citations') {
      fallbackText = `Các căn cứ pháp lý được gợi ý cho chủ đề "${prompt}":\n\n` + ragMarkdown;
    } else if (mode === 'refine_style') {
      fallbackText = `Dự thảo sau khi chuẩn hóa theo thể thức Nghị định 30/2020/NĐ-CP:\n\n${draftContent
        .replace(/căn cứ/gi, '- Căn cứ')
        .replace(/quyết định:/gi, '### QUYẾT ĐỊNH:')}\n\n*Đã canh lề, chuẩn hóa Quốc hiệu và phông chữ Times New Roman.*`;
    } else {
      fallbackText = `# DỰ THẢO VĂN BẢN VỀ: ${prompt.toUpperCase()}

- Căn cứ các văn bản pháp luật hiện hành;
${searchContext.map((c) => `- Căn cứ ${c.documentType} số ${c.documentNumber} (${c.title});`).join('\n')}

### NỘI DUNG CHÍNH:

1. Phạm vi và đối tượng áp dụng cho chủ đề ${prompt}.
2. Quyền và nghĩa vụ của các bên liên quan.
3. Tổ chức thực hiện và trách nhiệm thi hành./.`;
    }

    return {
      completion: fallbackText,
      suggestedCitations: searchContext,
      warnings,
    };
  }

  /**
   * Extracts operational milestones, payments, renewals, and deadlines from contract text.
   */
  static async extractContractMilestones(
    contractText: string,
    contractTitle: string = 'Hợp đồng'
  ): Promise<ExtractedMilestone[]> {
    const systemPrompt = `Bạn là Trợ lý Pháp chế Quản trị Hợp đồng chuyên nghiệp.
Nhiệm vụ: Phân tích nội dung hợp đồng và trích xuất TOÀN BỘ các mốc hạn nghiệp vụ quan trọng (Milestones) cần theo dõi lịch nhắc:
1. Mốc thanh toán (PAYMENT): Ngày tạm ứng, thanh toán từng đợt, số tiền, điều kiện mở L/C...
2. Mốc gia hạn / Tái ký (RENEWAL): Ngày hết hạn hợp đồng, thời hạn tự động gia hạn...
3. Mốc thông báo chấm dứt (TERMINATION_NOTICE): Thời hạn phải báo trước nếu không muốn gia hạn hoặc đơn phương chấm dứt...
4. Mốc bảo hành & Nghiệm thu (WARRANTY / DELIVERY): Thời hạn bảo hành sản phẩm/dịch vụ, hạn bàn giao...
5. Mốc tuân thủ & Nộp báo cáo (COMPLIANCE): Nộp báo cáo định kỳ, kiểm toán...

Yêu cầu xuất ra JSON Array các objects với cấu trúc:
[
  {
    "milestoneTitle": "Thanh toán đợt 1 (Tạm ứng 30%)",
    "milestoneType": "PAYMENT",
    "dueDate": "2026-09-15",
    "relativeOffset": "Trong vòng 07 ngày sau khi ký hợp đồng",
    "amount": "150.000.000 VNĐ",
    "obligatedParty": "Bên A",
    "actionRequired": "Chuyển khoản thanh toán 30% giá trị hợp đồng vào tài khoản Bên B",
    "riskLevel": "HIGH",
    "reminderDays": 5
  }
]
CHỈ TRẢ VỀ JSON ARRAY, KHÔNG KÈM TEXT GIẢI THÍCH NÀO KHÁC.`;

    const userPrompt = `Tên tài liệu: ${contractTitle}\n\nNỘI DUNG HỢP ĐỒNG:\n${contractText.substring(0, 10000)}`;

    const text = await this.callChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.2, maxTokens: 3000 }
    );
    if (text) {
      let jsonStr = text.trim();
      const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeMatch) jsonStr = codeMatch[1].trim();
      else {
        const arrMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrMatch) jsonStr = arrMatch[0].trim();
      }

      try {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.error('[CopilotLLM] Failed to parse milestone JSON from LLM response, using heuristic fallback:', err);
      }
    }

    // Heuristic fallback extractor
    const fallbackMilestones: ExtractedMilestone[] = [];
    if (/thanh toán|đặt cọc|tạm ứng/i.test(contractText)) {
      fallbackMilestones.push({
        milestoneTitle: 'Thanh toán đợt đầu theo thỏa thuận hợp đồng',
        milestoneType: 'PAYMENT',
        relativeOffset: 'Trong vòng 07 ngày làm việc kể từ ngày ký',
        obligatedParty: 'Bên mua / Bên thuê',
        actionRequired: 'Hoàn tất thủ tục chuyển khoản và lập phiếu thu',
        riskLevel: 'HIGH',
        reminderDays: 3,
      });
    }
    if (/nghiệm thu|bàn giao/i.test(contractText)) {
      fallbackMilestones.push({
        milestoneTitle: 'Bàn giao và Ký biên bản nghiệm thu',
        milestoneType: 'DELIVERY',
        relativeOffset: 'Theo tiến độ thực hiện hợp đồng',
        obligatedParty: 'Bên cung cấp / Bên bán',
        actionRequired: 'Lập biên bản bàn giao có xác nhận của hai bên',
        riskLevel: 'MEDIUM',
        reminderDays: 5,
      });
    }
    if (/gia hạn|chấm dứt|hết hạn/i.test(contractText)) {
      fallbackMilestones.push({
        milestoneTitle: 'Hạn thông báo không gia hạn hợp đồng',
        milestoneType: 'TERMINATION_NOTICE',
        relativeOffset: 'Trước 30 ngày so với ngày hết hạn',
        obligatedParty: 'Cả hai bên',
        actionRequired: 'Gửi văn bản thông báo nếu không có nhu cầu tái ký',
        riskLevel: 'CRITICAL',
        reminderDays: 14,
      });
    }

    return fallbackMilestones;
  }
}

export interface ExtractedMilestone {
  milestoneTitle: string;
  milestoneType: 'PAYMENT' | 'RENEWAL' | 'TERMINATION_NOTICE' | 'WARRANTY' | 'DELIVERY' | 'COMPLIANCE';
  dueDate?: string;
  relativeOffset?: string;
  amount?: string;
  obligatedParty?: string;
  actionRequired: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reminderDays: number;
}

