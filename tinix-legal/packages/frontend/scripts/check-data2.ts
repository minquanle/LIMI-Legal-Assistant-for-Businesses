import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Count docs with promulgationDate
  const withDate = await prisma.canonicalDocument.count({ where: { promulgationDate: { not: null } } });
  console.log(`Docs with promulgationDate: ${withDate}`);
  
  // Count docs with fullText > 3 chars
  const withRealText = await prisma.canonicalDocument.count({ where: { fullText: { gt: 'nan' } } });
  console.log(`Docs with fullText > 'nan': ${withRealText}`);
  
  // Docs with fullText == 'nan'
  const isNan = await prisma.canonicalDocument.count({ where: { fullText: { equals: 'nan' } } });
  console.log(`Docs with fullText == 'nan': ${isNan}`);
  
  // Check the first 5 docs that have non-null dates for their title format
  const datedDocs = await prisma.canonicalDocument.findMany({ 
    where: { promulgationDate: { not: null } },
    take: 3,
    orderBy: { promulgationDate: 'desc' },
    select: { id: true, title: true, documentNumber: true, issuingBody: true, promulgationDate: true, fullText: true }
  });
  for (const d of datedDocs) {
    console.log('\n--- DATED DOC ---');
    console.log('title:', JSON.stringify(d.title?.substring(0, 120)));
    console.log('docNum:', d.documentNumber);
    console.log('body:', d.issuingBody);
    console.log('date:', d.promulgationDate);
    console.log('ftLen:', d.fullText?.length);
  }
  
  // Check if fullText is actually readable in some docs
  const textDocs = await prisma.canonicalDocument.findMany({
    where: { fullText: { gt: 'nan' } },
    take: 2,
    select: { id: true, title: true, fullText: true }
  });
  for (const d of textDocs) {
    console.log('\n--- FULL TEXT SAMPLE ---');
    console.log('id:', d.id);
    console.log('title:', d.title?.substring(0, 80));
    console.log('fullText (first 200 chars):', d.fullText?.substring(0, 200));
    console.log('fullText length:', d.fullText?.length);
  }
  
  // Check AST content for a doc
  const docWithAst = await prisma.legalASTNode.findFirst({
    where: { content: { not: '' } },
    select: { documentId: true, nodeType: true, heading: true, content: true, path: true }
  });
  if (docWithAst) {
    console.log('\n--- AST SAMPLE ---');
    console.log('docId:', docWithAst.documentId);
    console.log('type:', docWithAst.nodeType);
    console.log('heading:', JSON.stringify(docWithAst.heading?.substring(0, 100)));
    console.log('content:', JSON.stringify(docWithAst.content?.substring(0, 200)));
    console.log('path:', docWithAst.path);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
