import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const r = await p.canonicalDocument.aggregate({ _count: { effectiveDate: true, promulgationDate: true, expiryDate: true } });
  console.log('effectiveDate:', r._count.effectiveDate);
  console.log('promulgationDate:', r._count.promulgationDate);
  console.log('expiryDate:', r._count.expiryDate);
  const ft = await p.canonicalDocument.count({ where: { fullText: { not: '' } } });
  console.log('fullText non-empty:', ft);
  const fp = await p.canonicalDocument.count({ where: { fullText: { not: '' }, promulgationDate: { not: null } } });
  console.log('fullText + date:', fp);
  const fn = await p.canonicalDocument.count({ where: { fullText: { not: '' }, promulgationDate: null } });
  console.log('fullText no date:', fn);
  await p.$disconnect();
}
main();
