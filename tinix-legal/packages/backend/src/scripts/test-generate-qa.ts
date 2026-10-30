import { PrismaClient } from '@prisma/client';
import { QALLMService } from '../services/qa-llm-service.js';

const prisma = new PrismaClient();

async function runSample() {
  try {
    const doc = await prisma.canonicalDocument.findFirst({
      where: { fullText: { not: '' } },
      select: { id: true, documentNumber: true, title: true }
    });

    if (!doc) {
      console.log('No document with fullText found.');
      return;
    }

    console.log(`Found sample doc: [${doc.documentNumber}] ${doc.title}`);
    console.log('Generating Q&A via LLM...');
    const count = await QALLMService.generateQA(doc.id);
    console.log(`Generated ${count} Q&A items.`);

    const items = await prisma.legalQAItem.findMany({
      where: { documentId: doc.id },
      include: { topic: true }
    });
    console.log('Items sample:', JSON.stringify(items, null, 2));
  } catch (e: any) {
    console.error('Error generating sample QA:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

runSample();
