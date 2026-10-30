import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { QALLMService } from '../services/qa-llm-service.js';

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(70));
  console.log('BẮT ĐẦU TIẾN TRÌNH SINH Q&A TÌNH HUỐNG THỰC TẾ (SCENARIO-BASED)');
  console.log('='.repeat(70));

  // 1. Fetch prominent 2025-2026 legal documents (Decrees, Circulars, Laws)
  const targetDocs = await prisma.$queryRaw<Array<{ id: string; documentNumber: string; title: string; fullTextLength: number }>>`
    SELECT id, "documentNumber", title, LENGTH("fullText") as "fullTextLength"
    FROM "canonical_documents"
    WHERE ("documentNumber" ILIKE '%/2025/%' OR "documentNumber" ILIKE '%/2026/%' OR "promulgationDate" >= '2025-01-01')
      AND "fullText" IS NOT NULL
      AND LENGTH("fullText") > 1200
    ORDER BY "fullTextLength" DESC
    LIMIT 30;
  `;


  console.log(`Tìm thấy ${targetDocs.length} văn bản trọng tâm 2025-2026 để sinh tình huống thực tế.`);

  let totalNewScenarios = 0;
  for (let i = 0; i < targetDocs.length; i++) {
    const doc = targetDocs[i];
    console.log(`\n[${i + 1}/${targetDocs.length}] Đang sinh tình huống cho: ${doc.documentNumber} - ${doc.title.slice(0, 70)}...`);

    const count = await QALLMService.generateQA(doc.id);
    totalNewScenarios += count;
    console.log(`Đã sinh ${count} tình huống thực tế.`);

    // Rate limit cooldown 1s
    await new Promise((r) => setTimeout(r, 1000));
  }

  // 2. Count statistics by Persona
  const personaStats = await prisma.legalQAItem.groupBy({
    by: ['persona'],
    _count: { id: true },
  });

  console.log('\n' + '='.repeat(70));
  console.log(`HOÀN THÀNH: Đã sinh thêm ${totalNewScenarios} tình huống pháp lý thực tế!`);
  console.log('Phân bổ theo Nhóm Đối tượng (Persona):');
  personaStats.forEach((p) => {
    console.log(`- [${p.persona}]: ${p._count.id} câu hỏi tình huống`);
  });
  console.log('='.repeat(70));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
