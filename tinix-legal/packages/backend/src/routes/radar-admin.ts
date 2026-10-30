/**
 * Admin CRUD for the compliance radar's `ComplianceRadarAlert` rows.
 * /api/admin/radar-alerts — every route requires an admin secret (see
 * middleware/auth-guard.ts), matching the pattern used by /api/admin/ai-byok
 * and /api/admin/rbac in routes/ai-rbac.ts.
 */
import { Router, Request, Response } from 'express';
import { RadarService, INDUSTRIES } from '../services/radar-service.js';
import { requireAdminAuth, requirePermission } from '../middleware/auth-guard.js';

export const radarAdminRouter = Router();

// `requirePermission('RADAR_MANAGE')` is registered below on every write
// route, forward-compatible with a future non-SUPER_ADMIN role. Today it is
// a documented no-op: RBACService.checkPermission() unconditionally returns
// true for role 'SUPER_ADMIN' (rbac-service.ts), and requireAdminAuth above
// is the only way any request reaches req.userRole at all — it always sets
// exactly that role. So every write here is still gated solely by the admin
// secret, identical to before; this line changes nothing until the app has
// a real role other than SUPER_ADMIN.
const requireRadarManage = requirePermission('RADAR_MANAGE');

/** GET /api/admin/radar-alerts — full, unfiltered list for the admin table */
radarAdminRouter.get('/admin/radar-alerts', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const alerts = await RadarService.adminListAlerts();
    return res.json({ alerts, industries: INDUSTRIES });
  } catch (err) {
    console.error('[Radar Admin] Error listing alerts:', err);
    return res.status(500).json({ error: 'Failed to list radar alerts' });
  }
});

/** GET /api/admin/radar-alerts/:id — single alert for the edit form */
radarAdminRouter.get('/admin/radar-alerts/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const alert = await RadarService.adminGetAlert(req.params['id'] as string);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    return res.json(alert);
  } catch (err) {
    console.error('[Radar Admin] Error fetching alert:', err);
    return res.status(500).json({ error: 'Failed to fetch radar alert' });
  }
});

/** POST /api/admin/radar-alerts — create */
radarAdminRouter.post('/admin/radar-alerts', requireAdminAuth, requireRadarManage, async (req: Request, res: Response) => {
  try {
    const alert = await RadarService.adminCreateAlert(req.body);
    return res.status(201).json(alert);
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create radar alert' });
  }
});

/** PUT /api/admin/radar-alerts/:id — update */
radarAdminRouter.put('/admin/radar-alerts/:id', requireAdminAuth, requireRadarManage, async (req: Request, res: Response) => {
  try {
    const alert = await RadarService.adminUpdateAlert(req.params['id'] as string, req.body);
    return res.json(alert);
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update radar alert' });
  }
});

/** DELETE /api/admin/radar-alerts/:id — delete */
radarAdminRouter.delete('/admin/radar-alerts/:id', requireAdminAuth, requireRadarManage, async (req: Request, res: Response) => {
  try {
    await RadarService.adminDeleteAlert(req.params['id'] as string);
    return res.json({ success: true });
  } catch (err) {
    console.error('[Radar Admin] Error deleting alert:', err);
    return res.status(500).json({ error: 'Failed to delete radar alert' });
  }
});
