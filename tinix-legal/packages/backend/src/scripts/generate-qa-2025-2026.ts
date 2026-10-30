import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { QALLMService } from '../services/qa-llm-service.js';

const prisma = new PrismaClient();

const TARGET_QA_COUNT = parseInt(process.env.TARGET_COUNT || '1000', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '2', 10);

async function generateTargetQA() {
  console.log(`=====================================================`);
  console.log(`BẮT ĐẦU TIẾN TRÌNH SINH ${TARGET_QA_COUNT} CẶP CÂU HỎI TỪ VĂN BẢN 2025-2026`);
  console.log(`=====================================================`);

  const initialCount = await prisma.legalQAItem.count();
  console.log(`Số lượng Q&A hiện tại trong DB: ${initialCount}`);

  // Query high-priority 2025-2026 documents that don't have QA items yet
  const candidates = await prisma.canonicalDocument.findMany({
    where: {
      OR: [
        { promulgationDate: { gte: new Date('2025-01-01T00:00:00Z') } },
        { effectiveDate: { gte: new Date('2025-01-01T00:00:00Z') } },
        { documentNumber: { contains: '/2025/' } },
        { documentNumber: { contains: '/2026/' } }
      ],
      fullText: { not: '' },
      qaItems: { none: {} }
    },
    select: {
      id: true,
      documentNumber: true,
      title: true,
      documentType: true,
      promulgationDate: true
    },
    // Priority: LUAT, NGHI_DINH, THONG_TU, NGHI_QUYET, QUYET_DINH
    orderBy: [
      { promulgationDate: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 300 // fetch a good batch of candidate documents
  });

  console.log(`Đã tìm thấy ${candidates.length} văn bản 2025-2026 phù hợp làm ứng viên.`);

  let totalNewQA = 0;
  let processedDocs = 0;
  let failedDocs = 0;

  // Process in chunks with concurrency
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const chunk = candidates.slice(i, i + CONCURRENCY);

    const currentTotal = await prisma.legalQAItem.count();
    const newItemsGenerated = currentTotal - initialCount;

    if (newItemsGenerated >= TARGET_QA_COUNT) {
      console.log(`\n ĐÃ ĐẠT MỤC TIÊU ${TARGET_QA_COUNT} CÂU HỎI (Thực tế: ${newItemsGenerated})! Dừng tiến trình.`);
      break;
    }

    console.log(`\n[Batch ${Math.floor(i / CONCURRENCY) + 1}] Đang xử lý ${chunk.length} văn bản... (Tiến độ: ${newItemsGenerated}/${TARGET_QA_COUNT} câu)`);

    const results = await Promise.allSettled(
      chunk.map(async (doc) => {
        try {
          console.log(`⏳ Đang gửi LLM: [${doc.documentNumber}] ${doc.title.substring(0, 70)}...`);
          const count = await QALLMService.generateQA(doc.id);
          return { doc, count, success: true };
        } catch (err: any) {
          console.error(`Lỗi văn bản ${doc.documentNumber}:`, err.message);
          return { doc, count: 0, success: false };
        }
      })
    );

    for (const res of results) {
      if (res.status === 'fulfilled' && res.value.success) {
        totalNewQA += res.value.count;
        processedDocs++;
      } else {
        failedDocs++;
      }
    }

    // Rate-limiting pause between chunks to avoid flooding the server
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  const finalTotal = await prisma.legalQAItem.count();
  const topicsCount = await prisma.legalQATopic.count();

  console.log(`\n=====================================================`);
  console.log(`HOÀN THÀNH TIẾN TRÌNH:`);
  console.log(`- Tổng số văn bản đã xử lý: ${processedDocs}`);
  console.log(`- Số văn bản lỗi: ${failedDocs}`);
  console.log(`- Số câu hỏi sinh mới: ${totalNewQA}`);
  console.log(`- Tổng số câu hỏi hiện có trong DB: ${finalTotal}`);
  console.log(`- Tổng số chủ đề: ${topicsCount}`);
  console.log(`=====================================================`);

  await prisma.$disconnect();
}

generateTargetQA().catch((err) => {
  console.error('Fatal error in generateTargetQA:', err);
  process.exit(1);
});
