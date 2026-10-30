import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/notification-service.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'demo-user';
    const unreadOnly = req.query.unread === 'true';
    let data;
    if (unreadOnly) {
      data = await NotificationService.getUnread(userId);
    } else {
      data = await NotificationService.getAll(userId);
    }
    return res.json(data);
  } catch (err) {
    console.error('[Notifications Route] Failed to fetch notifications:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

notificationsRouter.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = await NotificationService.markAsRead(id);
    return res.json(data);
  } catch (err) {
    console.error('[Notifications Route] Failed to mark as read:', err);
    return res.status(500).json({ error: 'Failed to mark as read' });
  }
});


notificationsRouter.post('/read-all', async (req: Request, res: Response) => {
  try {
    const { userId = 'demo-user' } = req.body;
    const data = await NotificationService.markAllRead(userId);
    return res.json(data);
  } catch (err) {
    console.error('[Notifications Route] Failed to mark all as read:', err);
    return res.status(500).json({ error: 'Failed to mark all as read' });
  }
});
