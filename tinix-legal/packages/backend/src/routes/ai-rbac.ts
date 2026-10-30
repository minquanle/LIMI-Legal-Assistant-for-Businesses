/**
 * AI BYOK, OCR & RBAC Routes
 * /api/admin/ai-byok     – CRUD cấu hình AI Provider & BYOK
 * /api/admin/rbac        – Quản lý Ma trận Phân quyền Chức năng
 * /api/contracts/ocr     – Upload & Bóc tách Hợp đồng PDF bằng AI OCR
 */
import { Router, Request, Response } from 'express';
import { AIBYOKService } from '../services/ai-byok-service.js';
import { RBACService, ALL_FEATURES } from '../services/rbac-service.js';
import { ContractOCRService } from '../services/contract-ocr-service.js';
import { requireAdminAuth } from '../middleware/auth-guard.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// ADMIN AI BYOK CONFIG ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/** GET /api/admin/ai-byok – Danh sách AI Providers */
router.get('/admin/ai-byok', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const providers = await AIBYOKService.getAllProviders();
    return res.json(providers);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load AI BYOK configs' });
  }
});

/** POST /api/admin/ai-byok – Upsert Provider BYOK Key */
router.post('/admin/ai-byok', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const provider = await AIBYOKService.upsertProvider(req.body);
    return res.json(provider);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to upsert AI provider config' });
  }
});

/** DELETE /api/admin/ai-byok/:id – Xóa Provider */
router.delete('/admin/ai-byok/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    await AIBYOKService.deleteProvider(req.params['id'] as string);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete AI provider' });
  }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN RBAC FEATURE MATRIX ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/** GET /api/admin/rbac – Lấy danh sách Ma trận Phân quyền & Features List */
router.get('/admin/rbac', requireAdminAuth, async (_req: Request, res: Response) => {

  try {
    const roles = await RBACService.getAllRolePermissions();
    return res.json({ roles, features: ALL_FEATURES });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load RBAC permissions' });
  }
});

/** PUT /api/admin/rbac/:role – Cập nhật ma trận phân quyền cho vai trò */
router.put('/admin/rbac/:role', requireAdminAuth, async (req: Request, res: Response) => {

  try {
    const { permissions } = req.body;
    const updated = await RBACService.updateRolePermissions(req.params['role'] as string, permissions);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update role permissions' });
  }
});

// ─────────────────────────────────────────────────────────────────
// AI CONTRACT OCR PARSING ENDPOINT
// ─────────────────────────────────────────────────────────────────

/** POST /api/contracts/ocr – Bóc tách Hợp đồng PDF bằng AI OCR */
router.post('/contracts/ocr', async (req: Request, res: Response) => {
  try {
    const { contractText = '' } = req.body;
    const metadata = await ContractOCRService.parseContractText(contractText);
    return res.json(metadata);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to OCR parse contract' });
  }
});

/** POST /api/contracts/ocr/save – Bóc tách và Lưu thẳng vào DB */
router.post('/contracts/ocr/save', async (req: Request, res: Response) => {
  try {
    const { contractText = '' } = req.body;
    const contract = await ContractOCRService.uploadAndSaveContract(contractText);
    return res.status(201).json(contract);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save OCR contract' });
  }
});

// Note: GET /api/documents/:id/mindmap is implemented in routes/documents.ts
// (DocumentService.getMindmapGraph) — it uses both outgoing AND incoming
// guiding/amending relations and classifies node types correctly, unlike the
// duplicate that used to live here.

export default router;
