import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  // Check 8 most recent docs - what do they actually look like?
  const docs = await p.canonicalDocument.findMany({
    orderBy: { promulgationDate: 'desc' },
    take: 8,
    select: { id: true, title: true, documentNumber: true, promulgationDate: true, documentType: true, validityStatus: true, issuingBody: true, field: true }
  });
  for (const d of docs) {
    console.log(`ID: ${d.id.padEnd(14)} | num: ${(d.documentNumber || '').padEnd(18)} | date: ${d.promulgationDate ? d.promulgationDate.toISOString() : 'NULL'.padEnd(10)} | type: ${(d.documentType || '').padEnd(12)} | title: ${(d.title || '').slice(0, 60)}`);
  }

  // Also check: what's the last 8 by id only (docs with no promulgationDate)?
  const noDate = await p.canonicalDocument.findMany({
    where: { promulgationDate: null },
    orderBy: { id: 'desc' },
    take: 8,
    select: { id: true, title: true, documentNumber: true, documentType: true }
  });
  console.log('\n--- 8 newest by ID (no date docs) ---');
  for (const d of noDate) {
    console.log(`ID: ${d.id} | num: ${d.documentNumber} | type: ${d.documentType} | title: ${(d.title || '').slice(0, 60)}`);
  }

  await p.$disconnect();
}
main();
