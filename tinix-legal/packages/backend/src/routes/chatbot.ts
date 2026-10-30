import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/db.js';
import { ChatbotService } from '../services/chatbot-service.js';

export const chatbotRouter = Router();

chatbotRouter.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'system';
    const sessions = await prisma.conversationSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
    return res.json(sessions);
  } catch (err) {
    console.error('[Chatbot Route] Failed to fetch sessions:', err);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

chatbotRouter.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { userId = 'system', title = 'Cuộc hội thoại mới' } = req.body;
    const session = await prisma.conversationSession.create({
      data: { userId, title }
    });
    return res.json(session);
  } catch (err) {
    console.error('[Chatbot Route] Failed to create session:', err);
    return res.status(500).json({ error: 'Failed to create session' });
  }
});

chatbotRouter.get('/sessions/:id/messages', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id as string;
    const messages = await prisma.conversationMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });
    return res.json(messages);
  } catch (err) {
    console.error('[Chatbot Route] Failed to fetch messages:', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

chatbotRouter.post('/sessions/:id/messages', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id as string;
    const { content, userId = 'system' } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }
    if (content.length > 4000) {
      return res.status(400).json({ error: 'content must be at most 4000 characters' });
    }
    const message = await ChatbotService.chat(sessionId, content, userId);
    return res.json(message);
  } catch (err) {
    console.error('[Chatbot Route] Failed to send message:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

