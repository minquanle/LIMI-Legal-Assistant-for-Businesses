import { prisma } from '../infrastructure/db.js';

export class NotificationService {
  static async createNotification(data: { userId: string, type: string, title: string, body: string, documentId?: string }) {
    return await prisma.userNotification.create({ data });
  }

  static async getUnread(userId: string) {
    return await prisma.userNotification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getAll(userId: string, limit: number = 20) {
    return await prisma.userNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  static async markAsRead(id: string) {
    return await prisma.userNotification.update({
      where: { id },
      data: { read: true }
    });
  }

  static async markAllRead(userId: string) {
    return await prisma.userNotification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
  }
}
