import { Router, Request, Response } from 'express';
import { TrendAnalyticsService } from '../services/trend-analytics-service.js';

export const analyticsRouter = Router();

analyticsRouter.get('/trends', async (req: Request, res: Response) => {
  try {
    const data = await TrendAnalyticsService.getDocumentTrends(req.query);
    return res.json(data);
  } catch (err) {
    console.error('Failed to fetch analytics trends:', err);
    return res.status(500).json({ error: 'Failed to fetch trends' });
  }
});
