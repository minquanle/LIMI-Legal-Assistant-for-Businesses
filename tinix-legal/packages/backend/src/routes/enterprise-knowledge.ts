/**
 * Enterprise Knowledge REST Routes
 * /api/admin/enterprise-knowledge-configs – CRUD cấu hình quy trình tri thức
 * /api/enterprise/workflow-executions      – Quản lý và thực thi các vụ việc nghiệp vụ
 */
import { Router, Request, Response } from 'express';
import { EnterpriseKnowledgeWorkflowService } from '../services/enterprise-knowledge-workflow-service.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// ADMIN KNOWLEDGE CONFIG ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/** GET /api/admin/enterprise-knowledge-configs – Lấy danh sách quy trình tri thức */
router.get('/admin/enterprise-knowledge-configs', async (_req: Request, res: Response) => {
  try {
    const configs = await EnterpriseKnowledgeWorkflowService.getAllConfigs();
    return res.json(configs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load knowledge workflow configs' });
  }
});

/** POST /api/admin/enterprise-knowledge-configs – Tạo hoặc Cập nhật quy trình */
router.post('/admin/enterprise-knowledge-configs', async (req: Request, res: Response) => {
  try {
    const config = await EnterpriseKnowledgeWorkflowService.upsertConfig(req.body);
    return res.json(config);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to upsert knowledge workflow config' });
  }
});

/** DELETE /api/admin/enterprise-knowledge-configs/:id – Xóa quy trình */
router.delete('/admin/enterprise-knowledge-configs/:id', async (req: Request, res: Response) => {
  try {
    await EnterpriseKnowledgeWorkflowService.deleteConfig(req.params['id'] as string);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete knowledge workflow config' });
  }
});

// ─────────────────────────────────────────────────────────────────
// WORKFLOW EXECUTIONS ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/** GET /api/enterprise/workflow-executions – Danh sách vụ việc thực thi */
router.get('/enterprise/workflow-executions', async (_req: Request, res: Response) => {
  try {
    const executions = await EnterpriseKnowledgeWorkflowService.getAllExecutions();
    return res.json(executions);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch workflow executions' });
  }
});

/** GET /api/enterprise/workflow-executions/:id – Chi tiết vụ việc */
router.get('/enterprise/workflow-executions/:id', async (req: Request, res: Response) => {
  try {
    const execution = await EnterpriseKnowledgeWorkflowService.getExecutionById(req.params['id'] as string);
    if (!execution) return res.status(404).json({ error: 'Execution not found' });
    return res.json(execution);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch workflow execution' });
  }
});

/** POST /api/enterprise/workflow-executions – Tạo vụ việc mới */
router.post('/enterprise/workflow-executions', async (req: Request, res: Response) => {
  try {
    const { workflowConfigId, title } = req.body;
    const execution = await EnterpriseKnowledgeWorkflowService.createExecution({ workflowConfigId, title });
    return res.status(201).json(execution);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create workflow execution' });
  }
});

/** POST /api/enterprise/workflow-executions/:id/advance – Chuyển bước & Đánh giá tuân thủ */
router.post('/enterprise/workflow-executions/:id/advance', async (req: Request, res: Response) => {
  try {
    const { notes } = req.body;
    const updated = await EnterpriseKnowledgeWorkflowService.advanceExecutionStep(
      req.params['id'] as string,
      notes,
    );
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to advance execution step' });
  }
});

/** POST /api/enterprise/workflow-executions/:id/evaluate – Đánh giá Checklist tự động */
router.post('/enterprise/workflow-executions/:id/evaluate', async (req: Request, res: Response) => {
  try {
    const { notes = '' } = req.body;
    const updated = await EnterpriseKnowledgeWorkflowService.evaluateChecklist(
      req.params['id'] as string,
      notes,
    );
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to evaluate checklist' });
  }
});

/** POST /api/enterprise/workflow-executions/:id/ask – Hỏi đáp AI Legal Copilot */
router.post('/enterprise/workflow-executions/:id/ask', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const answer = await EnterpriseKnowledgeWorkflowService.askWorkflowCopilot(
      req.params['id'] as string,
      query,
    );
    return res.json(answer);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get AI copilot response' });
  }
});

export default router;
