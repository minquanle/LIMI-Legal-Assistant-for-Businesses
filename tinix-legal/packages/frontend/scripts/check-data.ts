import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Sample documents
  const docs = await prisma.canonicalDocument.findMany({ take: 5, orderBy: { promulgationDate: 'desc' } });
  for (const d of docs) {
    console.log('---');
    console.log('id:', d.id);
    console.log('title:', JSON.stringify(d.title?.substring(0, 100)));
    console.log('documentNumber:', JSON.stringify(d.documentNumber));
    console.log('issuingBody:', JSON.stringify(d.issuingBody));
    console.log('validityStatus:', d.validityStatus);
    console.log('documentType:', d.documentType);
    console.log('fullText length:', d.fullText?.length);
    console.log('promulgationDate:', d.promulgationDate);
    console.log('ast node count:', await prisma.legalASTNode.count({ where: { documentId: d.id } }));
  }

  // Count NaN-like values
  const nanBodies = await prisma.canonicalDocument.count({ where: { issuingBody: { equals: 'nan' } } });
  const nanFullText = await prisma.canonicalDocument.count({ where: { fullText: { equals: 'nan' } } });
  const emptyFullText = await prisma.canonicalDocument.count({ where: { fullText: '' } });
  const emptyBodies = await prisma.canonicalDocument.count({ where: { issuingBody: '' } });
  console.log('\n--- STATS ---');
  console.log(`issuingBody == 'nan': ${nanBodies}`);
  console.log(`issuingBody == '': ${emptyBodies}`);
  console.log(`fullText == 'nan': ${nanFullText}`);
  console.log(`fullText == '': ${emptyFullText}`);
  console.log(`total docs: ${await prisma.canonicalDocument.count()}`);
  console.log(`total AST nodes: ${await prisma.legalASTNode.count()}`);
  
  // Check a doc with fullText
  const hasText = await prisma.canonicalDocument.findFirst({ where: { fullText: { not: '' } }, select: { id: true, title: true, fullText: true } });
  if (hasText) {
    console.log('\nDoc WITH fullText:', hasText.id, JSON.stringify(hasText.title?.substring(0, 80)), 'text length:', hasText.fullText.length);
  }

  // Documents with AST nodes
  const hasAst = await prisma.legalASTNode.findFirst({ include: { document: { select: { id: true, title: true } } } });
  if (hasAst) {
    console.log('\nFirst AST node doc:', hasAst.document.id, JSON.stringify(hasAst.document.title?.substring(0, 80)));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
