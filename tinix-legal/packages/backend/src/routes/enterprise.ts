/**
 * Enterprise routes
 * /api/admin/enterprise-config  – CRUD cấu hình động quy trình duyệt & cảnh báo
 * /api/enterprise/workflows      – Quản lý luồng trình ký dự thảo
 * /api/enterprise/contracts      – Quản lý vòng đời hợp đồng
 */
import { Router, Request, Response } from 'express';
import { EnterpriseWorkflowService } from '../services/enterprise-workflow-service.js';
import { ContractLifecycleService } from '../services/contract-lifecycle-service.js';
import { prisma } from '../infrastructure/db.js';
import { requireAdminAuth } from '../middleware/auth-guard.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// ADMIN CONFIG ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/** GET /api/admin/enterprise-config */
router.get('/admin/enterprise-config', async (_req: Request, res: Response) => {
  try {
    const config = await EnterpriseWorkflowService.getDefaultConfig();
    return res.json(config);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load enterprise config' });
  }
});

/** PUT /api/admin/enterprise-config – Cập nhật cấu hình quy trình duyệt & mốc cảnh báo */
router.put('/admin/enterprise-config', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const config = await EnterpriseWorkflowService.getDefaultConfig();
    const { workflowSteps, alertThresholds, riskRules, orgName } = req.body;

    if (workflowSteps !== undefined && !Array.isArray(workflowSteps)) {
      return res.status(400).json({ error: 'workflowSteps must be an array' });
    }
    if (alertThresholds !== undefined && !Array.isArray(alertThresholds)) {
      return res.status(400).json({ error: 'alertThresholds must be an array' });
    }
    if (riskRules !== undefined && (typeof riskRules !== 'object' || riskRules === null || Array.isArray(riskRules))) {
      return res.status(400).json({ error: 'riskRules must be an object' });
    }

    const updated = await prisma.enterpriseConfig.update({
      where: { id: config.id },
      data: {
        ...(orgName && { orgName }),
        ...(workflowSteps && { workflowSteps }),
        ...(alertThresholds && { alertThresholds }),
        ...(riskRules && { riskRules }),
      },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update enterprise config' });
  }
});

// ─────────────────────────────────────────────────────────────────
// ENTERPRISE WORKFLOW ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/** GET /api/enterprise/workflows/:draftId – Lấy tiến trình duyệt của một dự thảo */
router.get('/enterprise/workflows/:draftId', async (req: Request, res: Response) => {
  try {
    const progress = await EnterpriseWorkflowService.getWorkflowProgress(req.params['draftId'] as string);
    return res.json(progress);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get workflow progress' });
  }
});

/** POST /api/enterprise/workflows/:draftId/advance – Chuyển sang bước duyệt tiếp theo */
router.post('/enterprise/workflows/:draftId/advance', async (req: Request, res: Response) => {
  try {
    const { actorName = 'Người dùng', actorRole = 'USER', comment = '' } = req.body;
    const updated = await EnterpriseWorkflowService.advanceDraft({
      draftId: req.params['draftId'] as string,
      actorName,
      actorRole,
      comment,
    });
    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to advance draft';
    return res.status(400).json({ error: message });
  }
});

/** POST /api/enterprise/workflows/:draftId/reject – Từ chối / Trả lại dự thảo */
router.post('/enterprise/workflows/:draftId/reject', async (req: Request, res: Response) => {
  try {
    const { actorName = 'Người dùng', actorRole = 'USER', comment = 'Không đạt yêu cầu' } = req.body;
    const updated = await EnterpriseWorkflowService.rejectDraft({
      draftId: req.params['draftId'] as string,
      actorName,
      actorRole,
      comment,
    });
    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reject draft';
    return res.status(400).json({ error: message });
  }
});

// ─────────────────────────────────────────────────────────────────
// CONTRACT LIFECYCLE ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/** GET /api/enterprise/contracts – Danh sách hợp đồng kèm cảnh báo */
router.get('/enterprise/contracts', async (_req: Request, res: Response) => {
  try {
    const contracts = await ContractLifecycleService.getAllContracts();
    const summary = await ContractLifecycleService.getSummary();
    return res.json({ contracts, summary });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

/** POST /api/enterprise/contracts – Tạo hợp đồng mới */
router.post('/enterprise/contracts', async (req: Request, res: Response) => {
  try {
    const contract = await ContractLifecycleService.createContract(req.body);
    return res.status(201).json(contract);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create contract' });
  }
});

/** PUT /api/enterprise/contracts/:id – Cập nhật hợp đồng */
router.put('/enterprise/contracts/:id', async (req: Request, res: Response) => {
  try {
    const contract = await ContractLifecycleService.updateContract(req.params['id'] as string, req.body);
    return res.json(contract);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update contract' });
  }
});

export default router;
