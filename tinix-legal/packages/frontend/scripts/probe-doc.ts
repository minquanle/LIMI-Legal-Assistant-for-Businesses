import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const recent = await p.canonicalDocument.findFirst({
    where: { promulgationDate: { not: null } },
    orderBy: { promulgationDate: 'desc' },
    select: { id: true, fullText: true, documentNumber: true },
  });
  if (!recent) { console.log('no doc'); return; }
  console.log(`=== DOCUMENT: ${recent.documentNumber} (${recent.id}) ===`);
  const ft = recent.fullText || '';
  console.log(`fullText length: ${ft.length}`);
  console.log(`fullText first 120: ${JSON.stringify(ft.slice(0, 120))}`);

  const nodes = await p.legalASTNode.findMany({
    where: { documentId: recent.id },
    orderBy: { orderIndex: 'asc' },
    select: { nodeType: true, ordinal: true, heading: true, content: true },
    take: 10,
  });
  console.log(`\nAST nodes: ${nodes.length}`);
  for (const n of nodes) {
    const cLen = (n.content || '').length;
    console.log(`  ${n.nodeType.padEnd(8)} ord:${JSON.stringify(n.ordinal).padEnd(10)} hd:${JSON.stringify((n.heading||'').slice(0,50)).padEnd(55)} content:${cLen}ch`);
  }
  await p.$disconnect();
}
main();
