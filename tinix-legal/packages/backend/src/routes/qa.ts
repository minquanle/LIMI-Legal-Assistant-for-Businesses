import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/db.js';
import { QALLMService } from '../services/qa-llm-service.js';
import { CopilotRAGService } from '../services/copilot-rag-service.js';
import { getLLMApiUrl, getLLMApiKey, getLLMModel } from '../config/llm-config.js';
import { requireAdminAuth } from '../middleware/auth-guard.js';

export const qaRouter = Router();

// In-memory per-IP vote dedup guard: prevents the same client from voting on
// the same item repeatedly (e.g. via page refresh, which resets client-side
// button state). Not a substitute for a real per-user vote table — resets on
// restart and doesn't dedupe across multiple backend instances — but closes
// the trivial refresh-and-revote gap without a schema migration.
const recentVotes = new Map<string, number>();
const VOTE_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of recentVotes.entries()) {
    if (now - ts > VOTE_DEDUP_WINDOW_MS) recentVotes.delete(key);
  }
}, 60 * 60 * 1000);

/**
 * GET /api/qa/admin/pending — List AI-generated Q&A items awaiting admin review
 * before they're visible to the public (status=DRAFT). Admin-only.
 */
qaRouter.get('/admin/pending', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [items, total] = await Promise.all([
      prisma.legalQAItem.findMany({
        where: { status: 'DRAFT' },
        include: {
          topic: { select: { id: true, name: true, slug: true } },
          document: { select: { id: true, documentNumber: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.legalQAItem.count({ where: { status: 'DRAFT' } }),
    ]);

    return res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[QA Route] Error fetching pending items:', err);
    return res.status(500).json({ error: 'Failed to fetch pending items' });
  }
});

/**
 * POST /api/qa/items/:id/publish — Approve a DRAFT item, making it publicly
 * visible and counted on its topic. Admin-only.
 */
qaRouter.post('/items/:id/publish', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const item = await prisma.legalQAItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Q&A item not found' });
    if (item.status === 'PUBLISHED') return res.json(item);

    const [updated] = await prisma.$transaction([
      prisma.legalQAItem.update({ where: { id }, data: { status: 'PUBLISHED' } }),
      prisma.legalQATopic.update({ where: { id: item.topicId }, data: { qaCount: { increment: 1 } } }),
    ]);
    return res.json(updated);
  } catch (err) {
    console.error('[QA Route] Error publishing item:', err);
    return res.status(500).json({ error: 'Failed to publish item' });
  }
});

/**
 * POST /api/qa/items/:id/reject — Reject a DRAFT item (hides it; kept for audit
 * rather than deleted). Admin-only.
 */
qaRouter.post('/items/:id/reject', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const item = await prisma.legalQAItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Q&A item not found' });

    const wasPublished = item.status === 'PUBLISHED';
    const ops: any[] = [prisma.legalQAItem.update({ where: { id }, data: { status: 'HIDDEN' } })];
    if (wasPublished) {
      ops.push(prisma.legalQATopic.update({ where: { id: item.topicId }, data: { qaCount: { decrement: 1 } } }));
    }
    const [updated] = await prisma.$transaction(ops);
    return res.json(updated);
  } catch (err) {
    console.error('[QA Route] Error rejecting item:', err);
    return res.status(500).json({ error: 'Failed to reject item' });
  }
});

/**
 * GET /api/qa/topics — List all Q&A topics with counts
 */
qaRouter.get('/topics', async (_req: Request, res: Response) => {
  try {
    const topics = await prisma.legalQATopic.findMany({
      where: { qaCount: { gt: 0 } },
      orderBy: { qaCount: 'desc' },
    });
    return res.json(topics);
  } catch (err) {
    console.error('[QA Route] Error fetching topics:', err);
    return res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

/**
 * GET /api/qa/personas — List all persona categories with counts
 */
qaRouter.get('/personas', async (_req: Request, res: Response) => {
  try {
    const personas = await prisma.legalQAItem.groupBy({
      by: ['persona'],
      where: { status: 'PUBLISHED' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    return res.json(personas.map((p) => ({ persona: p.persona, count: p._count.id })));
  } catch (err) {
    console.error('[QA Route] Error fetching personas:', err);
    return res.status(500).json({ error: 'Failed to fetch personas' });
  }
});

/**
 * GET /api/qa/items — List Q&A items with pagination, topic filter, persona filter, and search
 * Query params: page, limit, topicId, persona, search, status
 */
/**
 * GET /api/qa/topics/:slug — Get topic details by slug with items
 */
qaRouter.get('/topics/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const topic = await prisma.legalQATopic.findUnique({
      where: { slug },
      include: {
        _count: { select: { qaItems: true } },
      },
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [items, total] = await Promise.all([
      prisma.legalQAItem.findMany({
        where: { topicId: topic.id, status: 'PUBLISHED' },
        include: {
          document: { select: { id: true, documentNumber: true, title: true, documentType: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.legalQAItem.count({ where: { topicId: topic.id, status: 'PUBLISHED' } }),
    ]);

    return res.json({
      topic,
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[QA Route] Error fetching topic by slug:', err);
    return res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

/**
 * GET /api/qa/items — List Q&A items with pagination, topic, persona, search, and sorting
 * Query params: page, limit, topicId, persona, search, sort (newest, popular, highest_voted), status
 */
qaRouter.get('/items', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const topicId = req.query.topicId as string | undefined;
    const persona = req.query.persona as string | undefined;
    const search = req.query.search as string | undefined;
    const sort = (req.query.sort as string) || 'newest';
    const status = (req.query.status as string) || 'PUBLISHED';

    const andConditions: any[] = [{ status }];
    if (topicId) andConditions.push({ topicId });
    if (persona && persona !== 'ALL' && persona !== 'Tất cả') {
      andConditions.push({
        OR: [
          { persona: { contains: persona, mode: 'insensitive' } },
          { persona: 'Chung' },
        ],
      });
    }
    if (search) {
      andConditions.push({
        OR: [
          { question: { contains: search, mode: 'insensitive' } },
          { answer: { contains: search, mode: 'insensitive' } },
          { situation: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where: any = { AND: andConditions };


    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') orderBy = { viewCount: 'desc' };
    if (sort === 'highest_voted') orderBy = { helpfulCount: 'desc' };

    const [items, total] = await Promise.all([
      prisma.legalQAItem.findMany({
        where,
        include: {
          topic: { select: { id: true, name: true, slug: true, icon: true } },
          document: { select: { id: true, documentNumber: true, title: true, documentType: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.legalQAItem.count({ where }),
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[QA Route] Error fetching items:', err);
    return res.status(500).json({ error: 'Failed to fetch Q&A items' });
  }
});

/**
 * GET /api/qa/items/:id — Get single Q&A item detail by ID or Slug (increments viewCount)
 */
qaRouter.get('/items/:id', async (req: Request, res: Response) => {
  try {
    const idOrSlug = req.params.id as string;
    let item = await prisma.legalQAItem.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        topic: { select: { id: true, name: true, slug: true, icon: true } },
        document: { select: { id: true, documentNumber: true, title: true, documentType: true, issuingBody: true, promulgationDate: true, effectiveDate: true } },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Q&A item not found' });
    }

    // Increment viewCount asynchronously
    await prisma.legalQAItem.update({
      where: { id: item.id },
      data: { viewCount: { increment: 1 } },
    });

    // Related questions in same topic
    const relatedItems = await prisma.legalQAItem.findMany({
      where: {
        topicId: item.topicId,
        id: { not: item.id },
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        slug: true,
        question: true,
        persona: true,
        viewCount: true,
        helpfulCount: true,
      },
      take: 4,
      orderBy: { viewCount: 'desc' },
    });

    return res.json({ item, relatedItems });
  } catch (err) {
    console.error('[QA Route] Error fetching item detail:', err);
    return res.status(500).json({ error: 'Failed to fetch Q&A item' });
  }
});

/**
 * POST /api/qa/items/:id/vote — Upvote or downvote an answer
 */
qaRouter.post('/items/:id/vote', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { type } = req.body; // 'helpful' | 'unhelpful'

    if (type !== 'helpful' && type !== 'unhelpful') {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const dedupKey = `${clientIp}:${id}`;
    if (recentVotes.has(dedupKey)) {
      return res.status(429).json({ error: 'Bạn đã đánh giá câu trả lời này rồi.' });
    }
    recentVotes.set(dedupKey, Date.now());

    const updated = await prisma.legalQAItem.update({
      where: { id },
      data: {
        [type === 'helpful' ? 'helpfulCount' : 'unhelpfulCount']: { increment: 1 },
      },
      select: { id: true, helpfulCount: true, unhelpfulCount: true },
    });

    return res.json(updated);
  } catch (err) {
    console.error('[QA Route] Error voting item:', err);
    return res.status(500).json({ error: 'Failed to vote' });
  }
});

/**
 * POST /api/qa/ask-live — On-demand live legal question answering via RAG & LLM
 */
qaRouter.post('/ask-live', async (req: Request, res: Response) => {
  try {
    const { question, persona } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }
    if (question.length > 2000) {
      return res.status(400).json({ error: 'question must be at most 2000 characters' });
    }

    // 1. Retrieve matching statutory context via Hybrid RAG
    const ragContext = await CopilotRAGService.getContext(question, 4);
    const ragMarkdown = CopilotRAGService.formatRAGPrompt(ragContext);

    // 2. Call LLM to generate structured scenario answer
    const systemPrompt = `Bạn là Luật sư Tư vấn Pháp lý và Chuyên gia Tranh tụng hàng đầu Việt Nam.
Nhiệm vụ: Giải đáp thắc mắc pháp lý của người dùng một cách chính xác, thực tế và dễ hiểu nhất.

Yêu cầu xuất ra JSON Object (KHÔNG CÓ TEXT NÀO KHÁC NGOÀI JSON):
{
  "situation": "Tóm tắt bối cảnh tình huống thực tế của câu hỏi (1-2 câu)",
  "tldrSummary": "Tóm tắt kết luận trong 30 giây (1-2 câu ngắn gọn trả lời thẳng vào trọng tâm: Có/Không, Phạt bao nhiêu, Được phép/Không được phép)",
  "answer": "Hướng dẫn giải quyết chi tiết theo từng bước (Bước 1, Bước 2...), phân tích quyền lợi và nghĩa vụ...",
  "practicalTip": "Lời khuyên bỏ túi thực tế để phòng ngừa rủi ro (1-2 câu)",
  "legalBasis": "Căn cứ Điều, Khoản của các văn bản pháp luật áp dụng",
  "suggestedTemplates": ["Mẫu hợp đồng / đơn từ liên quan (nếu có)"]
}`;

    const userPrompt = `Câu hỏi của người dùng: "${question}"
Đối tượng hỏi: ${persona || 'Chung'}

CĂN CỨ PHÁP LÝ TÌM ĐƯỢC TỪ HỆ THỐNG:
${ragMarkdown}`;

    const llmRes = await fetch(
      getLLMApiUrl(),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getLLMApiKey()}`,
        },
        body: JSON.stringify({
          model: getLLMModel(),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      }
    );

    let parsedResult: any = null;
    if (llmRes.ok) {
      const raw = await llmRes.text();
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) data = JSON.parse(m[0]);
      }
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        let jsonStr = text.trim();
        const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeMatch) jsonStr = codeMatch[1].trim();
        else {
          const objMatch = text.match(/\{[\s\S]*\}/);
          if (objMatch) jsonStr = objMatch[0].trim();
        }
        parsedResult = JSON.parse(jsonStr);
      }
    }

    if (!parsedResult) {
      parsedResult = {
        situation: `Tình huống thắc mắc về: ${question}`,
        tldrSummary: 'Cần đối chiếu với quy định chuyên ngành để xác định quyền và nghĩa vụ cụ thể.',
        answer: `Căn cứ các văn bản pháp luật hiện hành:\n1. Người có quyền lợi liên quan cần thực hiện đúng quy định về hồ sơ, trình tự thủ tục.\n2. Trong trường hợp có tranh chấp, các bên có thể hòa giải hoặc khởi kiện tại Tòa án có thẩm quyền.`,
        practicalTip: 'Nên lưu trữ đầy đủ tài liệu, chứng từ bằng văn bản trước khi thực hiện giao dịch.',
        legalBasis: ragContext.map((c) => `${c.documentType} số ${c.documentNumber}`).join(', ') || 'Quy định pháp luật hiện hành',
        suggestedTemplates: [],
      };
    }

    return res.json({
      question,
      ...parsedResult,
      citations: ragContext,
    });
  } catch (err) {
    console.error('[QA Route] Error in ask-live:', err);
    return res.status(500).json({ error: 'Failed to generate live answer' });
  }
});


/**
 * POST /api/qa/generate/:documentId — Trigger Q&A generation for a specific document
 */
qaRouter.post('/generate/:documentId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const documentId = req.params.documentId as string;

    // Check if already has Q&A
    const existingCount = await prisma.legalQAItem.count({
      where: { documentId },
    });

    if (existingCount > 0) {
      return res.json({
        message: `Document already has ${existingCount} Q&A items`,
        generated: 0,
        existing: existingCount,
      });
    }

    const generated = await QALLMService.generateQA(documentId);
    return res.json({
      message: `Generated ${generated} Q&A items`,
      generated,
    });
  } catch (err: any) {
    console.error('[QA Route] Error generating Q&A:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate Q&A' });
  }
});

/**
 * POST /api/qa/generate-batch — Trigger batch Q&A generation for unprocessed documents
 */
qaRouter.post('/generate-batch', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const batchSize = Math.min(20, Math.max(1, parseInt(req.body.batchSize) || 10));
    const generated = await QALLMService.processUnprocessedDocuments(batchSize);
    return res.json({
      message: `Batch processing complete: ${generated} Q&A items generated`,
      generated,
    });
  } catch (err: any) {
    console.error('[QA Route] Error in batch generation:', err);
    return res.status(500).json({ error: err.message || 'Failed to run batch generation' });
  }
});
