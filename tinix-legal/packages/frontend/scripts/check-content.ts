import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  // Lấy doc từ recent trên home page để check
  const recent = await p.canonicalDocument.findFirst({
    where: { promulgationDate: { not: null } },
    orderBy: { promulgationDate: 'desc' },
    select: { id: true, fullText: true },
  });
  if (!recent) { console.log('no doc found'); await p.$disconnect(); return; }
  console.log(`Doc ID: ${recent.id}`);
  console.log(`fullText length: ${(recent.fullText || '').length}`);
  console.log(`fullText === 'nan': ${recent.fullText === 'nan'}`);
  console.log(`fullText trime mpty: ${(recent.fullText || '').trim() === ''}`);

  // Count AST nodes
  const astCount = await p.canonicalDocument.findUnique({
    where: { id: recent.id },
    select: { _count: { select: { astNodes: true } } }
  });
  if (astCount) console.log(`AST count: ${(astCount as any)._count?.astNodes}`);

  // Sample DOCUMENT with fullText only vs AST only
  const withText = await p.canonicalDocument.count({ where: { fullText: { not: '' }, NOT: { fullText: 'nan' }, astNodes: { none: {} } } });
  console.log(`\nDocs with only fullText (no AST): ${withText}`);

  const withAst = await p.canonicalDocument.count({ where: { astNodes: { some: {} }, fullText: 'nan' } });
  console.log(`Docs with AST + fullText=nan: ${withAst}`);

  await p.$disconnect();
}
main();
