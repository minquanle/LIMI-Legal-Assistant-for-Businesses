import { prisma } from '../infrastructure/db.js';
import { getLLMApiUrl, getLLMApiKey, getLLMModel } from '../config/llm-config.js';

interface QAGeneratedItem {
  question: string;
  situation?: string;
  answer: string;
  persona?: string;
  practicalTip?: string;
  topic: string;
  legalBasis: string;
  tags: string[];
}

import 'dotenv/config';

/**
 * Service to call LLM API and generate Q&A pairs from legal documents.
 * Uses tinix-combo-1 model via OpenAI-compatible endpoint with Scenario & Persona prompts.
 */
export class QALLMService {
  private static getApiUrl(): string {
    return getLLMApiUrl();
  }

  private static getApiKey(): string {
    return getLLMApiKey();
  }

  private static getModel(): string {
    return getLLMModel();
  }

  /**
   * Generate scenario-based Q&A pairs for a single document via LLM.
   */
  static async generateQA(documentId: string): Promise<number> {
    const doc = await prisma.canonicalDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        documentNumber: true,
        documentType: true,
        field: true,
        fullText: true,
        trichYeu: true,
      },
    });

    if (!doc) throw new Error(`Document ${documentId} not found`);
    if (!doc.fullText || doc.fullText.length < 100) {
      console.log(`[QA-LLM] Skipping ${doc.documentNumber}: fullText too short (${doc.fullText?.length ?? 0} chars)`);
      return 0;
    }

    // Truncate fullText to avoid exceeding token limits (~12k chars ≈ 4k tokens)
    const truncatedText = doc.fullText.substring(0, 12000);

    const systemPrompt = `Bạn là Chuyên gia Tư vấn Pháp lý và Luật sư giàu kinh nghiệm tại Việt Nam.
Nhiệm vụ: Đọc văn bản quy phạm pháp luật và tạo ra 4-8 CẶP HỎI - ĐÁP THEO TÌNH HUỐNG THỰC TẾ (Scenario-Based Practical Legal Q&A) sát với đời sống thực tế của Doanh nghiệp và Người dân.

Quy tắc bắt buộc khi đặt câu hỏi & trả lời:
1. ĐẶT CÂU HỎI THEO TÌNH HUỐNG CỤ THỂ (SITUATION):
   - Đóng vai vào hoàn cảnh thực tế của người hỏi với tình huống, số liệu, sự việc rõ ràng thay vì hỏi lý thuyết trừu tượng.
   - Trường 'situation': 1-2 câu bối cảnh vụ việc/hoàn cảnh phát sinh.
   - Trường 'question': Câu hỏi giải quyết vướng mắc thực tế.
2. PHÂN VAI ĐỐI TƯỢNG (PERSONA):
   - Phân loại vào 1 trong các nhóm: "Doanh nghiệp & HR", "Người dân & Đất đai", "Kế toán & Thuế", "Hợp đồng & Đầu tư", "Cán bộ & Thủ tục công".
3. HƯỚNG DẪN GIẢI QUYẾT & LỜI KHUYÊN THỰC TIỄN (PRACTICAL TIP):
   - Trường 'answer': Trả lời chi tiết, dễ hiểu, nêu rõ các bước xử lý thực tế và quyền hạn, nghĩa vụ.
   - Trường 'practicalTip': 1-2 câu lời khuyên bỏ túi thực tế để tránh rủi ro pháp lý.
   - Trường 'legalBasis': Nêu rõ Điều, Khoản và Tên/Số hiệu văn bản luật.

Format JSON (CHỈ TRẢ VỀ JSON ARRAY, KHÔNG KÈM TEXT NÀO KHÁC):
[
  {
    "persona": "Doanh nghiệp & HR",
    "situation": "Công ty TNHH tuyển dụng nhân viên thử việc 2 tháng nhưng muốn ký lại thử việc thêm 1 tháng nữa do chưa đánh giá xong.",
    "question": "Công ty có được phép ký tiếp hợp đồng thử việc lần 2 với cùng một vị trí công việc không, nếu vi phạm bị phạt bao nhiêu?",
    "answer": "Theo quy định tại Điều 25 Bộ luật Lao động 2019:\n1. Mỗi vị trí công việc chỉ được thử việc 01 lần duy nhất...\n2. Mức phạt: Người sử dụng lao động yêu cầu thử việc quá 01 lần sẽ bị phạt tiền từ 2.000.000 đến 5.000.000 đồng...",
    "practicalTip": "Doanh nghiệp nên thiết lập quy trình đánh giá kết quả thử việc trước ngày kết thúc hợp đồng thử việc ít nhất 07 ngày.",
    "topic": "Hợp đồng Lao động & Thử việc",
    "legalBasis": "Điều 25 Bộ luật Lao động 2019",
    "tags": ["thử việc", "lao động", "xử phạt"]
  }
]`;


    const userPrompt = `Văn bản: ${doc.title}
Số hiệu: ${doc.documentNumber}
Loại: ${doc.documentType}
Lĩnh vực: ${doc.field || 'Chưa phân loại'}
Trích yếu: ${doc.trichYeu || ''}

NỘI DUNG:
${truncatedText}`;

    try {
      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiKey()}`,
        },
        body: JSON.stringify({
          model: this.getModel(),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.4,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[QA-LLM] API error ${response.status}: ${errText}`);
        return 0;
      }

      const rawText = await response.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        // Try parsing first valid JSON object if trailing text exists
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0]);
        } else {
          console.error('[QA-LLM] Failed to parse HTTP response as JSON:', rawText.substring(0, 300));
          return 0;
        }
      }

      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        console.error('[QA-LLM] Empty response from LLM');
        return 0;
      }

      // Extract JSON array from LLM response (handling markdown code fences or conversational text)
      let jsonStr = content.trim();
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      } else {
        const arrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrayMatch) {
          jsonStr = arrayMatch[0].trim();
        }
      }

      let qaItems: QAGeneratedItem[];
      try {
        qaItems = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.error('[QA-LLM] Failed to parse LLM JSON:', jsonStr.substring(0, 200));
        return 0;
      }

      if (!Array.isArray(qaItems) || qaItems.length === 0) {
        console.log('[QA-LLM] No Q&A items generated');
        return 0;
      }

      // Save Q&A items to database
      let savedCount = 0;
      for (const item of qaItems) {
        if (!item.question || !item.answer) continue;

        // Find or create topic. upsert is atomic at the DB level, unlike a
        // separate findUnique+create pair — two concurrent generation runs
        // resolving to the same new topic name can no longer race each other
        // into a unique-constraint failure that silently drops the item.
        const topicName = item.topic || doc.field || 'Pháp luật chung';
        const topicSlug = this.slugify(topicName);

        const topic = await prisma.legalQATopic.upsert({
          where: { slug: topicSlug },
          update: {},
          create: {
            name: topicName,
            slug: topicSlug,
            description: `Hỏi đáp về ${topicName}`,
            icon: this.getTopicIcon(topicName),
          },
        });

        const itemSlugBase = this.slugify(item.question) || 'cau-hoi';
        const itemSlug = `${itemSlugBase}-${Math.random().toString(36).slice(2, 8)}`;

        await prisma.legalQAItem.create({
          data: {
            documentId: doc.id,
            topicId: topic.id,
            slug: itemSlug,
            question: item.question,
            situation: item.situation || null,
            persona: item.persona || 'Chung',
            practicalTip: item.practicalTip || null,
            answer: item.answer,
            legalBasis: item.legalBasis || '',
            tags: item.tags || [],
            // AI-generated content is reviewed by an admin before it goes
            // live — see qa.ts's /admin/pending, /:id/publish, /:id/reject.
            // topic.qaCount is incremented on publish, not here, so the count
            // shown on the public topics list reflects only published items.
            status: 'DRAFT',
          },
        });

        savedCount++;
      }

      console.log(`[QA-LLM] Generated ${savedCount} Q&A items for ${doc.documentNumber}`);
      return savedCount;
    } catch (err) {
      console.error('[QA-LLM] Error generating Q&A:', err);
      return 0;
    }
  }

  /**
   * Process all documents that don't have Q&A items yet.
   * Rate-limited: 2s delay between each LLM call.
   */
  static async processUnprocessedDocuments(batchSize: number = 10): Promise<number> {
    const docs = await prisma.canonicalDocument.findMany({
      where: {
        qaItems: { none: {} },
        fullText: { not: '' },
      },
      select: { id: true, documentNumber: true },
      take: batchSize,
      orderBy: { createdAt: 'desc' },
    });

    if (docs.length === 0) {
      console.log('[QA-LLM] No unprocessed documents found');
      return 0;
    }

    console.log(`[QA-LLM] Processing ${docs.length} documents...`);
    let totalGenerated = 0;

    for (const doc of docs) {
      try {
        const count = await this.generateQA(doc.id);
        totalGenerated += count;
        // Rate limit: 2s between calls
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        console.error(`[QA-LLM] Failed for ${doc.documentNumber}:`, err);
      }
    }

    console.log(`[QA-LLM] Batch complete: ${totalGenerated} Q&A items from ${docs.length} docs`);
    return totalGenerated;
  }

  /** Convert Vietnamese text to URL slug */
  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);
  }

  /**
   * Map a topic name to a semantic icon slug resolved by the frontend's
   * topic-icons resolver. Slugs (not emoji) keep the taxonomy renderable as
   * real SVG icons and accessible to screen readers.
   */
  private static getTopicIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('đất đai') || lower.includes('bất động sản')) return 'home';
    if (lower.includes('lao động') || lower.includes('nhân sự')) return 'hard-hat';
    if (lower.includes('thuế') || lower.includes('tài chính')) return 'dollar-sign';
    if (lower.includes('hôn nhân') || lower.includes('gia đình')) return 'heart';
    if (lower.includes('doanh nghiệp') || lower.includes('thương mại')) return 'building-2';
    if (lower.includes('hình sự') || lower.includes('tố tụng')) return 'scale';
    if (lower.includes('dân sự')) return 'scroll-text';
    if (lower.includes('giáo dục') || lower.includes('đào tạo')) return 'graduation-cap';
    if (lower.includes('y tế') || lower.includes('sức khỏe')) return 'pill';
    if (lower.includes('môi trường')) return 'globe';
    if (lower.includes('xây dựng') || lower.includes('quy hoạch')) return 'hard-hat';
    if (lower.includes('giao thông') || lower.includes('vận tải')) return 'truck';
    if (lower.includes('bảo hiểm')) return 'shield-check';
    if (lower.includes('đầu tư')) return 'credit-card';
    if (lower.includes('sở hữu trí tuệ')) return 'lightbulb';
    return 'file-text';
  }
}
