import { PrismaClient } from '@prisma/client';
import { parseLegalText, flattenAST } from '@tinix-legal/shared';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const docIdArg = args.find(a => a.startsWith('--docId='))?.split('=')[1];
  
  console.log('Starting AST re-parsing...');
  
  let docs;
  if (docIdArg) {
    docs = await prisma.canonicalDocument.findMany({
      where: { id: docIdArg },
      select: { id: true, fullText: true, normalizedNumber: true }
    });
  } else {
    docs = await prisma.canonicalDocument.findMany({
      select: { id: true, fullText: true, normalizedNumber: true }
    });
  }

  console.log(`Found ${docs.length} documents to process.`);

  let successCount = 0;
  let skipCount = 0;
  let errCount = 0;

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (i % 100 === 0 && i > 0) {
      console.log(`Processed ${i}/${docs.length}...`);
    }

    if (!doc.fullText) {
      skipCount++;
      continue;
    }

    try {
      const parsedDoc = parseLegalText(doc.fullText);
      if (parsedDoc.isParsed && parsedDoc.astNodes.length > 0) {
        // Delete old AST nodes
        await prisma.legalASTNode.deleteMany({ where: { documentId: doc.id } });
        
        // Flatten and insert new ones
        const flattened = flattenAST(parsedDoc.astNodes);
        const records = flattened.map((n: any, idx: number) => ({
          documentId: doc.id,
          nodeType: (n.nodeType || 'TEXT') as any,
          ordinal: String(n.ordinal || ''),
          heading: (n.heading || '').slice(0, 500),
          content: (n.content || '').slice(0, 5000),
          path: n.path || `node-${idx}`,
          depth: n.depth ?? 0,
          orderIndex: n.orderIndex ?? idx,
        }));
        
        if (records.length > 0) {
          await prisma.legalASTNode.createMany({ data: records });
        }
        successCount++;
      } else {
        skipCount++;
      }
    } catch (err) {
      console.error(`Error processing doc ${doc.normalizedNumber}:`, err);
      errCount++;
    }
  }

  console.log(`Finished processing. Success: ${successCount}, Skipped: ${skipCount}, Errors: ${errCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
