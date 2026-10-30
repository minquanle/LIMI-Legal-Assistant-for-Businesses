import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const docCount = await prisma.canonicalDocument.count();
    console.log(`TOTAL_DOCUMENTS: ${docCount}`);
    
    const qaCount = await prisma.legalQAItem.count();
    console.log(`TOTAL_QA_ITEMS: ${qaCount}`);
    
    const topicCount = await prisma.legalQATopic.count();
    console.log(`TOTAL_TOPICS: ${topicCount}`);

    const topics = await prisma.legalQATopic.findMany({
      select: { name: true, qaCount: true },
      orderBy: { qaCount: 'desc' },
      take: 10
    });
    console.log('TOPICS:', JSON.stringify(topics, null, 2));
  } catch (e: any) {
    console.error('DB_ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
