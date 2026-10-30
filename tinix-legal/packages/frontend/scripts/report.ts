import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check stats for docs that would now display properly
  const withRealText = await prisma.canonicalDocument.count({ where: { fullText: { gt: 'nan' } } });
  const withSlugTitle = await prisma.canonicalDocument.count({
    where: { title: { startsWith: 'nghi-' } }
  });
  const withGoodBody = await prisma.canonicalDocument.count({
    where: { AND: [{ issuingBody: { not: 'nan' } }, { issuingBody: { not: '' } }] }
  });
  const total = await prisma.canonicalDocument.count();
  const astDocs = await prisma.legalASTNode.groupBy({ by: ['documentId'] });

  const nanBody = await prisma.canonicalDocument.count({ where: { issuingBody: 'nan' } });
  const nanFt = await prisma.canonicalDocument.count({ where: { fullText: 'nan' } });
  const unknownStatus = await prisma.canonicalDocument.count({ where: { validityStatus: 'KHONG_XAC_DINH' } });
  const nullDate = await prisma.canonicalDocument.count({ where: { promulgationDate: null } });

  console.log(JSON.stringify({
    total,
    withRealText,
    withGoodBody,
    withAst: astDocs.length,
    withSlugTitle,
    nanBody,
    nanFt,
    unknownStatus,
    nullDate,
  }));
  await prisma.$disconnect();
}
main();
