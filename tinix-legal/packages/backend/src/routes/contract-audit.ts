import { Router, Request, Response } from 'express';
import { PlaybookGeneratorService } from '../services/playbook-service.js';
import { prisma } from '../infrastructure/db.js';

export const contractAuditRouter = Router();

// Lấy thông tin audit
contractAuditRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const audit = await prisma.contractRiskAudit.findUnique({
      where: { id },
      include: { contract: true }
    });

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    return res.json(audit);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch audit' });
  }
});

// Tạo playbook
contractAuditRouter.post('/:id/playbook', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const audit = await PlaybookGeneratorService.generatePlaybook(id);
    return res.json(audit);
  } catch (err: any) {
    console.error('[ContractAudit] Failed to generate playbook:', err);
    if (err?.message === 'Audit not found') {
      return res.status(404).json({ error: 'Audit not found' });
    }
    return res.status(500).json({ error: 'Failed to generate playbook' });
  }
});

