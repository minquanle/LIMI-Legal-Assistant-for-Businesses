import { prisma } from '../infrastructure/db.js';
import type { AdminStats } from '../domain/types.js';

/**
 * Application layer: Admin use cases.
 */
export class AdminService {
  static async getStats(): Promise<AdminStats> {
    const [
      totalDocs,
      totalRelations,
      totalAstNodes,
      totalSources,
      docsWithoutRelationsCount,
      docsWithoutFullTextCount,
      byTypeRaw,
      byStatusRaw,
      topIssuingRaw,
      relationBreakdownRaw,
    ] = await Promise.all([
      prisma.canonicalDocument.count(),
      prisma.documentRelation.count(),
      prisma.legalASTNode.count(),
      prisma.documentSource.count(),
      prisma.canonicalDocument.count({
        where: { outgoingRelations: { none: {} }, incomingRelations: { none: {} } },
      }),
      prisma.canonicalDocument.count({ where: { fullText: '' } }),
      prisma.canonicalDocument.groupBy({ by: ['documentType'], _count: { id: true } }),
      prisma.canonicalDocument.groupBy({ by: ['validityStatus'], _count: { id: true } }),
      prisma.canonicalDocument.groupBy({
        by: ['issuingBody'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 6,
      }),
      prisma.documentRelation.groupBy({ by: ['relationType'], _count: { id: true } }),
    ]);

    return {
      totalDocs,
      totalRelations,
      totalAstNodes,
      totalSources,
      docsWithoutRelationsCount,
      docsWithRelationsCount: totalDocs - docsWithoutRelationsCount,
      docsWithoutFullTextCount,
      byType: byTypeRaw.map((d: any) => ({ type: d.documentType, count: d._count.id })),
      byStatus: byStatusRaw.map((d: any) => ({ status: d.validityStatus, count: d._count.id })),
      topIssuingBody: topIssuingRaw.map((d: any) => ({
        name: d.issuingBody || 'Chưa xác định',
        count: d._count.id,
      })),
      relationBreakdown: relationBreakdownRaw.map((d: any) => ({
        type: d.relationType,
        count: d._count.id,
      })),
    };
  }

  static async getQualityReport() {
    const [missingEffectiveDate, unmappedRelationsCount, unmappedRelations, docsWithoutAstCount, docsWithoutRelationsSample] =
      await Promise.all([
        prisma.canonicalDocument.findMany({
          where: { effectiveDate: null },
          select: { id: true, documentNumber: true, title: true, promulgationDate: true },
          take: 20,
        }),
        prisma.documentRelation.count({ where: { targetDocId: null } }),
        prisma.documentRelation.findMany({
          where: { targetDocId: null },
          select: { id: true, sourceDocId: true, targetDocNumber: true, relationType: true },
          take: 20,
        }),
        prisma.canonicalDocument.count({ where: { astNodes: { none: {} } } }),
        prisma.canonicalDocument.findMany({
          where: { outgoingRelations: { none: {} }, incomingRelations: { none: {} } },
          select: { id: true, documentNumber: true, title: true, issuingBody: true },
          take: 15,
        }),
      ]);

    return {
      missingEffectiveDateCount: missingEffectiveDate.length,
      missingEffectiveDateSample: missingEffectiveDate,
      unmappedRelationsCount,
      unmappedRelationsSample: unmappedRelations,
      docsWithoutAstCount,
      docsWithoutRelationsSample,
    };
  }

  static async relinkRelations(): Promise<number> {
    const unmapped = await prisma.documentRelation.findMany({
      where: { targetDocId: null },
      take: 100,
    });
    if (unmapped.length === 0) return 0;

    // Batch-resolve all candidate targets in one query instead of one
    // findFirst per relation, then apply the updates in a single transaction
    // instead of interleaving 100 sequential read+write round trips.
    const normTargets = [...new Set(unmapped.map((r) => r.targetDocNumber.replace(/\s+/g, '').toUpperCase()))];
    const matches = await prisma.canonicalDocument.findMany({
      where: { normalizedNumber: { in: normTargets } },
      select: { id: true, normalizedNumber: true },
    });
    const matchByNormNumber = new Map(matches.map((m) => [m.normalizedNumber, m.id]));

    const updates = unmapped
      .map((rel) => {
        const normTarget = rel.targetDocNumber.replace(/\s+/g, '').toUpperCase();
        const targetId = matchByNormNumber.get(normTarget);
        return targetId
          ? prisma.documentRelation.update({ where: { id: rel.id }, data: { targetDocId: targetId } })
          : null;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    if (updates.length === 0) return 0;
    await prisma.$transaction(updates);
    return updates.length;
  }

  static async getCrawlLogs(take = 30) {
    return prisma.crawlLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
