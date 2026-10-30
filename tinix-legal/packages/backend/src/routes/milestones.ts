import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/db.js';
import { CopilotLLMService } from '../services/copilot-llm-service.js';
import { requireAdminAuth } from '../middleware/auth-guard.js';

export const milestonesRouter = Router();

/**
 * POST /api/milestones/extract — AI extraction of milestones from contract text
 */
milestonesRouter.post('/extract', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { contractText, contractTitle } = req.body;
    if (!contractText || typeof contractText !== 'string') {
      return res.status(400).json({ error: 'contractText is required' });
    }

    const milestones = await CopilotLLMService.extractContractMilestones(
      contractText,
      contractTitle || 'Hợp đồng'
    );

    return res.json({ milestones });
  } catch (err) {
    console.error('[Milestones Route] Extraction error:', err);
    return res.status(500).json({ error: 'Failed to extract milestones' });
  }
});

/**
 * GET /api/milestones — List milestones with filters
 */
milestonesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { type, completed, search } = req.query;

    const where: any = {};
    if (type && type !== 'ALL') {
      where.milestoneType = type as string;
    }
    if (completed !== undefined) {
      where.isCompleted = completed === 'true';
    }
    if (search) {
      where.OR = [
        { contractTitle: { contains: search as string, mode: 'insensitive' } },
        { milestoneTitle: { contains: search as string, mode: 'insensitive' } },
        { actionRequired: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const milestones = await (prisma as any).contractMilestone.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return res.json({ milestones });
  } catch (err) {
    console.error('[Milestones Route] List error:', err);
    return res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

/**
 * POST /api/milestones — Create single or batch milestones
 */
const VALID_RISK_LEVELS = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

/** Validates and normalizes one milestone payload; throws a descriptive Error if invalid. */
function normalizeMilestoneInput(item: any) {
  const milestoneTitle = typeof item.milestoneTitle === 'string' ? item.milestoneTitle.trim() : '';
  if (!milestoneTitle) {
    throw new Error('milestoneTitle is required');
  }

  let dueDate: Date | null = null;
  if (item.dueDate) {
    const parsed = new Date(item.dueDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid dueDate: ${item.dueDate}`);
    }
    dueDate = parsed;
  }

  const reminderDays = item.reminderDays !== undefined ? Number(item.reminderDays) : 7;
  if (!Number.isFinite(reminderDays) || reminderDays < 0 || reminderDays > 365) {
    throw new Error('reminderDays must be a number between 0 and 365');
  }

  const riskLevel = VALID_RISK_LEVELS.has(item.riskLevel) ? item.riskLevel : 'MEDIUM';

  return {
    contractTitle: (item.contractTitle && String(item.contractTitle).trim()) || 'Hợp đồng chưa đặt tên',
    milestoneTitle,
    milestoneType: item.milestoneType || 'COMPLIANCE',
    dueDate,
    relativeOffset: item.relativeOffset || null,
    amount: item.amount || null,
    obligatedParty: item.obligatedParty || null,
    actionRequired: item.actionRequired || '',
    riskLevel,
    reminderDays,
    notes: item.notes || '',
  };
}

milestonesRouter.post('/', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { items, ...singleItem } = req.body;

    if (Array.isArray(items)) {
      let normalizedItems: ReturnType<typeof normalizeMilestoneInput>[];
      try {
        normalizedItems = items.map(normalizeMilestoneInput);
      } catch (validationErr: any) {
        return res.status(400).json({ error: validationErr.message });
      }

      const created = await Promise.all(
        normalizedItems.map((data) => (prisma as any).contractMilestone.create({ data }))
      );
      return res.status(201).json({ created, count: created.length });
    }

    let data: ReturnType<typeof normalizeMilestoneInput>;
    try {
      data = normalizeMilestoneInput(singleItem);
    } catch (validationErr: any) {
      return res.status(400).json({ error: validationErr.message });
    }

    const created = await (prisma as any).contractMilestone.create({ data });

    return res.status(201).json(created);
  } catch (err) {
    console.error('[Milestones Route] Create error:', err);
    return res.status(500).json({ error: 'Failed to create milestone' });
  }
});

/**
 * PATCH /api/milestones/:id — Update status or details
 */
milestonesRouter.patch('/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isCompleted, notes, dueDate } = req.body;

    const data: any = {};
    if (isCompleted !== undefined) {
      data.isCompleted = Boolean(isCompleted);
      data.completedAt = isCompleted ? new Date() : null;
    }
    if (notes !== undefined) data.notes = notes;
    if (dueDate !== undefined) {
      if (dueDate) {
        const parsed = new Date(dueDate);
        if (Number.isNaN(parsed.getTime())) {
          return res.status(400).json({ error: `Invalid dueDate: ${dueDate}` });
        }
        data.dueDate = parsed;
      } else {
        data.dueDate = null;
      }
    }

    const updated = await (prisma as any).contractMilestone.update({
      where: { id },
      data,
    });

    return res.json(updated);
  } catch (err) {
    console.error('[Milestones Route] Update error:', err);
    return res.status(500).json({ error: 'Failed to update milestone' });
  }
});

/**
 * DELETE /api/milestones/:id — Remove milestone
 */
milestonesRouter.delete('/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await (prisma as any).contractMilestone.delete({
      where: { id },
    });
    return res.json({ success: true, id });
  } catch (err) {
    console.error('[Milestones Route] Delete error:', err);
    return res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

/**
 * GET /api/milestones/export-ical — Generate RFC 5545 .ics Calendar file
 */
milestonesRouter.get('/export-ical', async (_req: Request, res: Response) => {
  try {
    const milestones = await (prisma as any).contractMilestone.findMany({
      where: { isCompleted: false, dueDate: { not: null } },
      orderBy: { dueDate: 'asc' },
    });

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tinix Legal//Contract Milestone Calendar//VI',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Lịch Mốc Hạn Hợp Đồng - Tinix Legal',
      'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
    ];

    // Format a Date as a bare calendar date (YYYYMMDD) using its UTC components,
    // since dueDate is stored as a date-only value (midnight UTC) — reading local
    // components could shift the day depending on server timezone.
    const toDateOnly = (d: Date): string => {
      const y = d.getUTCFullYear();
      const m2 = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}${m2}${day}`;
    };
    const addDays = (d: Date, days: number): Date => new Date(d.getTime() + days * 86400000);

    for (const m of milestones) {
      if (!m.dueDate) continue;
      const d = new Date(m.dueDate);
      // All-day event: DTSTART is the due date, DTEND is exclusive (next day) per RFC 5545.
      const dtStart = toDateOnly(d);
      const dtEnd = toDateOnly(addDays(d, 1));
      const uid = `milestone-${m.id}@tinixlegal.vn`;

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:[${m.milestoneType}] ${m.milestoneTitle} - ${m.contractTitle}`,
        `DESCRIPTION:${m.actionRequired}\\nBên chịu trách nhiệm: ${m.obligatedParty || 'N/A'}\\nMức độ rủi ro: ${m.riskLevel}\\nSố tiền: ${m.amount || 'N/A'}`,
        'BEGIN:VALARM',
        `TRIGGER:-P${m.reminderDays || 7}D`,
        'ACTION:DISPLAY',
        `DESCRIPTION:Nhắc hạn: ${m.milestoneTitle}`,
        'END:VALARM',
        'END:VEVENT'
      );
    }

    icsContent.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="lich-nhac-han-hop-dong.ics"');
    return res.send(icsContent.join('\r\n'));
  } catch (err) {
    console.error('[Milestones Route] Export iCal error:', err);
    return res.status(500).json({ error: 'Failed to export calendar' });
  }
});
