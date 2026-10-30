import { prisma } from '../infrastructure/db.js';

export class WatchlistService {
  static async addToWatchlist(userId: string, documentId: string) {
    const existing = await prisma.userWatchlist.findFirst({
      where: { userId, documentId }
    });
    if (existing) return existing;

    return await prisma.userWatchlist.create({
      data: { userId, documentId }
    });
  }

  static async removeFromWatchlist(userId: string, documentId: string) {
    return await prisma.userWatchlist.deleteMany({
      where: { userId, documentId }
    });
  }

  static async getWatchlist(userId: string) {
    return await prisma.userWatchlist.findMany({
      where: { userId },
      include: {
        document: {
          select: { id: true, title: true, documentNumber: true, validityStatus: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
