import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/db.js';
import { CopilotLLMService } from '../services/copilot-llm-service.js';
import { CitationScanner } from '../services/citation-scanner.js';
import { CopilotRAGService } from '../services/copilot-rag-service.js';
import { ContractAuditService } from '../services/contract-audit-service.js';
import { AutoRedliningEngine } from '../services/AutoRedliningEngine/index.js';
import { RiskAuditEngine } from '../services/RiskAuditEngine/index.js';

const router = Router();
const redliningEngine = new AutoRedliningEngine();
const riskAuditEngine = new RiskAuditEngine();

/** GET /api/copilot/templates */
router.get('/templates', async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.documentTemplate.findMany({
      orderBy: { title: 'asc' },
    });
    return res.json(templates);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/** GET /api/copilot/drafts */
router.get('/drafts', async (_req: Request, res: Response) => {
  try {
    const drafts = await prisma.draftDocument.findMany({
      include: { template: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    return res.json(drafts);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

/** GET /api/copilot/drafts/:id */
router.get('/drafts/:id', async (req: Request, res: Response) => {
  try {
    const draft = await prisma.draftDocument.findUnique({
      where: { id: req.params.id as string },
      include: { template: true, citations: true },
    });
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    return res.json(draft);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch draft' });
  }
});

/** POST /api/copilot/drafts */
router.post('/drafts', async (req: Request, res: Response) => {
  try {
    const { title, templateId, content } = req.body;
    let initialContent = content || '';

    if (templateId && !initialContent) {
      const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
      if (template) initialContent = template.templateBody;
    }

    const draft = await prisma.draftDocument.create({
      data: {
        title: title || 'Dự thảo mới',
        templateId: templateId || null,
        content: initialContent,
      },
    });

    return res.json(draft);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create draft' });
  }
});

/** PUT /api/copilot/drafts/:id */
router.put('/drafts/:id', async (req: Request, res: Response) => {
  try {
    const { title, content, status } = req.body;
    const draft = await prisma.draftDocument.update({
      where: { id: req.params.id as string },
      data: {
        title,
        content,
        status,
      },
    });
    return res.json(draft);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update draft' });
  }
});

/** POST /api/copilot/completion */
router.post('/completion', async (req: Request, res: Response) => {
  try {
    const { prompt, mode, draftContent, templateCode } = req.body;
    const result = await CopilotLLMService.complete({
      prompt: prompt || '',
      mode,
      draftContent,
      templateCode,
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Copilot completion failed' });
  }
});

/** POST /api/copilot/ai-action - Process contextual action on selected text */
router.post('/ai-action', async (req: Request, res: Response) => {
  try {
    const { action, selectedText, customPrompt, documentTitle } = req.body;
    if (!selectedText || !selectedText.trim()) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đoạn văn bản được chọn' });
    }

    const result = await CopilotLLMService.processAIAction({
      action: action || 'formal_rewrite',
      selectedText,
      customPrompt,
      documentTitle,
    });

    return res.json(result);
  } catch (err: any) {
    console.error('[Copilot Route] ai-action error:', err);
    return res.status(500).json({ error: err.message || 'Xử lý hành động AI thất bại' });
  }
});


/** POST /api/copilot/scan-validity */
router.post('/scan-validity', async (req: Request, res: Response) => {
  try {
    const { text = '' } = req.body;
    const citations = await CitationScanner.scanText(text);
    return res.json({ citations, totalScanned: citations.length });
  } catch (err) {
    return res.status(500).json({ error: 'Validity scanning failed' });
  }
});

/** POST /api/copilot/audit-contract */
router.post('/audit-contract', async (req: Request, res: Response) => {
  try {
    const { text = '' } = req.body;
    const risks = ContractAuditService.auditContract(text);
    return res.json({ risks, totalRisks: risks.length });
  } catch (err) {
    return res.status(500).json({ error: 'Contract audit failed' });
  }
});

/** POST /api/copilot/redline */
router.post('/redline', async (req: Request, res: Response) => {
  try {
    const { content = '' } = req.body;
    const redlines = await redliningEngine.scanContent(content);
    return res.json({ redlines, totalScanned: redlines.length });
  } catch (err) {
    return res.status(500).json({ error: 'Auto-redlining failed' });
  }
});

/** POST /api/copilot/risk-audits - Start new async audit */
router.post('/risk-audits', async (req: Request, res: Response) => {
  try {
    const { contractId, draftId, text = '' } = req.body;
    const audit = await riskAuditEngine.requestAudit(contractId, draftId, text);
    return res.json(audit);
  } catch (err) {
    // requestAudit() throws this specific message when the Redis-backed
    // queue is unreachable — surfaced as 503 so callers can distinguish
    // "try again shortly" from an actual application bug.
    if (err instanceof Error && err.message.includes('Dịch vụ thẩm định rủi ro tạm thời không khả dụng')) {
      return res.status(503).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Failed to trigger contract risk audit' });
  }
});

/** GET /api/copilot/risk-audits/:id - Fetch status and report */
router.get('/risk-audits/:id', async (req: Request, res: Response) => {
  try {
    const audit = await prisma.contractRiskAudit.findUnique({
      where: { id: req.params.id as string },
    });
    if (!audit) return res.status(404).json({ error: 'Audit record not found' });
    return res.json(audit);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch audit status' });
  }
});

export { router as copilotRouter };
