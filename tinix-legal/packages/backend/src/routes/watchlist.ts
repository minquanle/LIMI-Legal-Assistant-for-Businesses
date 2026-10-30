import { Router, Request, Response } from 'express';
import { WatchlistService } from '../services/watchlist-service.js';

export const watchlistRouter = Router();

watchlistRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'demo-user';
    const list = await WatchlistService.getWatchlist(userId);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

watchlistRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { userId = 'demo-user', documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: 'Missing documentId' });
    const item = await WatchlistService.addToWatchlist(userId, documentId);
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

watchlistRouter.delete('/', async (req: Request, res: Response) => {
  try {
    const { userId = 'demo-user', documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: 'Missing documentId' });
    await WatchlistService.removeFromWatchlist(userId, documentId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});
