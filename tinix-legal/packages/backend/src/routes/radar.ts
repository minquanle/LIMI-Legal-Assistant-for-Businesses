import { Router, Request, Response } from 'express';
import { RadarService, INDUSTRIES } from '../services/radar-service.js';
import { prisma } from '../infrastructure/db.js';

export const radarRouter = Router();

/**
 * GET /api/radar/industries — List all 10 industries with metadata and counts
 */
radarRouter.get('/industries', async (_req: Request, res: Response) => {
  try {
    await RadarService.ensureSeeded();

    const counts = await (prisma as any).complianceRadarAlert.groupBy({
      by: ['industry'],
      _count: { id: true },
    });

    const countMap = new Map(counts.map((c: any) => [c.industry, c._count.id]));

    const result = INDUSTRIES.map((ind) => ({
      ...ind,
      alertCount: countMap.get(ind.id) || 0,
    }));

    return res.json(result);
  } catch (err) {
    console.error('[Radar Route] Error fetching industries:', err);
    return res.status(500).json({ error: 'Failed to fetch industries' });
  }
});

const DEFAULT_ALERT_LIMIT = 50;
const MAX_ALERT_LIMIT = 200;

/**
 * Parses a positive-integer query param, falling back when absent or invalid.
 */
function parsePositiveInt(raw: unknown, fallback: number, max: number): number {
  const parsed = parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
}

/**
 * GET /api/radar/alerts — Fetch compliance alerts
 * Query params: industry, severity, search, limit, offset
 */
radarRouter.get('/alerts', async (req: Request, res: Response) => {
  try {
    const industry = req.query.industry as string | undefined;
    const severity = req.query.severity as string | undefined;
    const search = req.query.search as string | undefined;
    const limit = parsePositiveInt(req.query.limit, DEFAULT_ALERT_LIMIT, MAX_ALERT_LIMIT);
    const offset = parsePositiveInt(req.query.offset, 0, Number.MAX_SAFE_INTEGER);

    const { alerts, total } = await RadarService.getAlerts({ industry, severity, search, limit, offset });
    return res.json({ alerts, count: alerts.length, total, limit, offset });
  } catch (err) {
    console.error('[Radar Route] Error fetching alerts:', err);
    return res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * POST /api/radar/alerts/:id/audit — Interactive compliance gap assessment.
 * An optional `userId` in the body (the frontend's self-generated client id —
 * see radar-phap-ly's `getRadarClientId()`) persists the score to history;
 * omitting it still scores, it just isn't recorded anywhere.
 */
radarRouter.post('/alerts/:id/audit', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { answers = {}, userId } = req.body;

    const result = await RadarService.evaluateGapAudit(id, answers, userId);
    if (!result) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.json(result);
  } catch (err) {
    console.error('[Radar Route] Error assessing gap audit:', err);
    return res.status(500).json({ error: 'Failed to evaluate gap audit' });
  }
});

/**
 * GET /api/radar/alerts/:id/audit/history?userId= — Score history for one
 * user's self-audits of this alert, for the readiness-trend chart.
 */
radarRouter.get('/alerts/:id/audit/history', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.query.userId as string | undefined;
    if (!userId) return res.json({ history: [] });

    const history = await RadarService.getAuditHistory(id, userId);
    return res.json({ history });
  } catch (err) {
    console.error('[Radar Route] Error fetching audit history:', err);
    return res.status(500).json({ error: 'Failed to fetch audit history' });
  }
});

/**
 * GET /api/radar/checklist?userId= — All completed checklist items for a
 * user across every alert, replacing the old client-only localStorage state.
 */
radarRouter.get('/checklist', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    if (!userId) return res.json({ progress: {} });

    const progress = await RadarService.getChecklistProgress(userId);
    return res.json({ progress });
  } catch (err) {
    console.error('[Radar Route] Error fetching checklist progress:', err);
    return res.status(500).json({ error: 'Failed to fetch checklist progress' });
  }
});

/**
 * POST /api/radar/alerts/:id/checklist/:actionIndex — Toggle one checklist
 * item's completion for a user. Body: { userId, completed }.
 */
radarRouter.post('/alerts/:id/checklist/:actionIndex', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const actionIndex = parseInt(req.params.actionIndex as string, 10);
    const { userId, completed } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!Number.isInteger(actionIndex) || actionIndex < 0) {
      return res.status(400).json({ error: 'Invalid actionIndex' });
    }

    await RadarService.setChecklistItemCompleted(id, actionIndex, userId, Boolean(completed));
    return res.json({ success: true });
  } catch (err) {
    console.error('[Radar Route] Error updating checklist progress:', err);
    return res.status(500).json({ error: 'Failed to update checklist progress' });
  }
});

/**
 * Industry deadline-reminder subscriptions (`userId` = the same self-declared
 * client id used for audit history and checklist progress above).
 */
radarRouter.get('/subscriptions', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    if (!userId) return res.json({ industries: [] });

    const industries = await RadarService.getSubscribedIndustries(userId);
    return res.json({ industries });
  } catch (err) {
    console.error('[Radar Route] Error fetching subscriptions:', err);
    return res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

radarRouter.post('/subscriptions', async (req: Request, res: Response) => {
  try {
    const { userId, industry } = req.body;
    if (!userId || !industry) return res.status(400).json({ error: 'userId and industry are required' });

    await RadarService.subscribeToIndustry(userId, industry);
    return res.status(201).json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to subscribe' });
  }
});

radarRouter.delete('/subscriptions/:industry', async (req: Request, res: Response) => {
  try {
    const industry = req.params.industry as string;
    const userId = req.query.userId as string | undefined;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    await RadarService.unsubscribeFromIndustry(userId, industry);
    return res.json({ success: true });
  } catch (err) {
    console.error('[Radar Route] Error unsubscribing:', err);
    return res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * GET /api/radar/export-checklist — Export action plan to CSV/Excel
 */
radarRouter.get('/export-checklist', async (req: Request, res: Response) => {
  try {
    const industry = req.query.industry as string | undefined;
    const severity = req.query.severity as string | undefined;
    const search = req.query.search as string | undefined;

    const csvContent = await RadarService.generateChecklistCSV(industry, severity, search);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ke-hoach-tuan-thu-tinix-radar.csv"');
    return res.send(csvContent);
  } catch (err) {
    console.error('[Radar Route] Error exporting checklist:', err);
    return res.status(500).json({ error: 'Failed to export checklist' });
  }
});

/**
 * GET /api/radar/stats — Overview metrics for compliance dashboard
 */
radarRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    await RadarService.ensureSeeded();

    const [totalAlerts, criticalAlerts, upcomingDeadlines] = await Promise.all([
      (prisma as any).complianceRadarAlert.count(),
      (prisma as any).complianceRadarAlert.count({ where: { severity: 'CRITICAL' } }),
      (prisma as any).complianceRadarAlert.count({
        where: { deadlineDate: { gte: new Date() } },
      }),
    ]);

    return res.json({
      totalAlerts,
      criticalAlerts,
      upcomingDeadlines,
      totalIndustries: INDUSTRIES.length,
      lastSync: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Radar Route] Error fetching stats:', err);
    return res.status(500).json({ error: 'Failed to fetch radar stats' });
  }
});
