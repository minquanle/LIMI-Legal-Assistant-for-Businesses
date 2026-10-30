import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentDocs() {
  try {
    const total2025Plus = await prisma.canonicalDocument.count({
      where: {
        OR: [
          { promulgationDate: { gte: new Date('2025-01-01T00:00:00Z') } },
          { effectiveDate: { gte: new Date('2025-01-01T00:00:00Z') } },
          { documentNumber: { contains: '/2025/' } },
          { documentNumber: { contains: '/2026/' } }
        ],
        fullText: { not: '' }
      }
    });

    console.log(`Documents 2025-2026 with fullText: ${total2025Plus}`);

    const sample = await prisma.canonicalDocument.findMany({
      where: {
        OR: [
          { promulgationDate: { gte: new Date('2025-01-01T00:00:00Z') } },
          { effectiveDate: { gte: new Date('2025-01-01T00:00:00Z') } },
          { documentNumber: { contains: '/2025/' } },
          { documentNumber: { contains: '/2026/' } }
        ],
        fullText: { not: '' }
      },
      select: {
        id: true,
        documentNumber: true,
        title: true,
        documentType: true,
        promulgationDate: true
      },
      orderBy: { promulgationDate: 'desc' },
      take: 10
    });

    console.log('Sample docs:', JSON.stringify(sample, null, 2));
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentDocs();
