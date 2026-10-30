/**
 * Deep Analytics, OCR & Addendum Tree Routes
 * /api/admin/ai-analytics – Dashboard thống kê chi phí & token BYOK
 * /api/contracts/deep-ocr  – Bóc tách bảng biểu & điều khoản phạt PDF OCR
 * /api/contracts/:id/addendums – Quản lý cây Phụ lục Hợp đồng
 */
import { Router, Request, Response } from 'express';
import { AITokenAnalyticsService } from '../services/ai-token-analytics-service.js';
import { DeepOCRService } from '../services/deep-ocr-service.js';
import { ContractAddendumService } from '../services/contract-addendum-service.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// ADMIN AI TOKEN ANALYTICS ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/** GET /api/admin/ai-analytics/summary – Báo cáo tổng quan Token & Chi phí USD/VND */
router.get('/admin/ai-analytics/summary', async (_req: Request, res: Response) => {
  try {
    const summary = await AITokenAnalyticsService.getAnalyticsSummary();
    return res.json(summary);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch AI analytics summary' });
  }
});

/** GET /api/admin/ai-analytics/by-provider – Chi phí theo Provider */
router.get('/admin/ai-analytics/by-provider', async (_req: Request, res: Response) => {
  try {
    const data = await AITokenAnalyticsService.getCostByProvider();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch cost by provider' });
  }
});

/** GET /api/admin/ai-analytics/by-task – Chi phí theo Nhiệm vụ */
router.get('/admin/ai-analytics/by-task', async (_req: Request, res: Response) => {
  try {
    const data = await AITokenAnalyticsService.getCostByTask();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch cost by task' });
  }
});

// ─────────────────────────────────────────────────────────────────
// DEEP PDF OCR TABLE & RISK EXTRACTION ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/** POST /api/contracts/deep-ocr/tables – Bóc tách bảng biểu đơn giá / mốc nghiệm thu */
router.post('/contracts/deep-ocr/tables', async (req: Request, res: Response) => {
  try {
    const { contractText = '' } = req.body;
    const tables = await DeepOCRService.extractTablesFromText(contractText);
    return res.json(tables);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to extract tables' });
  }
});

/** POST /api/contracts/deep-ocr/risks – Quét điều khoản rủi ro ẩn */
router.post('/contracts/deep-ocr/risks', async (req: Request, res: Response) => {
  try {
    const { contractText = '' } = req.body;
    const risks = await DeepOCRService.extractRiskClauses(contractText);
    return res.json(risks);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to extract risk clauses' });
  }
});

// ─────────────────────────────────────────────────────────────────
// CONTRACT ADDENDUM HIERARCHY TREE ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/** GET /api/contracts/:id/addendums – Lấy danh sách cây phụ lục của hợp đồng */
router.get('/contracts/:id/addendums', async (req: Request, res: Response) => {
  try {
    const contractId = req.params['id'] as string;
    const addendums = await ContractAddendumService.getAddendumsByContractId(contractId);
    return res.json(addendums);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch contract addendums' });
  }
});

/** POST /api/contracts/:id/addendums – Tạo mới phụ lục hợp đồng */
router.post('/contracts/:id/addendums', async (req: Request, res: Response) => {
  try {
    const contractId = req.params['id'] as string;
    const addendum = await ContractAddendumService.createAddendum({
      contractId,
      ...req.body,
    });
    return res.status(201).json(addendum);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create contract addendum' });
  }
});

/** GET /api/contracts/:id/addendums/compare – So sánh 2 phiên bản phụ lục */
router.get('/contracts/:id/addendums/compare', async (req: Request, res: Response) => {
  try {
    const { v1Id = '', v2Id = '' } = req.query;
    const diff = await ContractAddendumService.compareVersions(v1Id as string, v2Id as string);
    return res.json(diff);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compare contract versions' });
  }
});

export default router;
