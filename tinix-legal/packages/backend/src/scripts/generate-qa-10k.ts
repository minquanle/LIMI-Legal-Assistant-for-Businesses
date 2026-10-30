import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { QALLMService } from '../services/qa-llm-service.js';

const prisma = new PrismaClient();

const TARGET_NEW_QA = parseInt(process.env.TARGET_COUNT || '10000', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '6', 10); // 6 concurrent LLM requests for optimal throughput

async function generateBulkQA() {
  console.log(`======================================================================`);
  console.log(`BẮT ĐẦU TIẾN TRÌNH SINH ${TARGET_NEW_QA.toLocaleString()} CẶP CÂU HỎI & TRẢ LỜI MỚI`);
  console.log(`Mức độ xử lý song song (Concurrency): ${CONCURRENCY} luồng`);
  console.log(`======================================================================`);

  const initialCount = await prisma.legalQAItem.count();
  const targetTotal = initialCount + TARGET_NEW_QA;
  console.log(`Số lượng Q&A hiện tại trong DB: ${initialCount.toLocaleString()} câu`);
  console.log(`Mục tiêu sau khi hoàn thành: ${targetTotal.toLocaleString()} câu`);

  // Query documents with actual content (LENGTH(fullText) > 500) that don't have QA items yet
  interface CandidateDoc {
    id: string;
    documentNumber: string;
    title: string;
    documentType: string;
    promulgationDate: Date | null;
  }

  const candidateDocs = await prisma.$queryRaw<CandidateDoc[]>`
    SELECT id, "documentNumber", "title", "documentType", "promulgationDate"
    FROM canonical_documents
    WHERE LENGTH("fullText") > 500
      AND id NOT IN (SELECT DISTINCT "documentId" FROM legal_qa_items)
    ORDER BY "promulgationDate" DESC NULLS LAST, "createdAt" DESC
    LIMIT 2500;
  `;

  console.log(`Đã tìm thấy ${candidateDocs.length.toLocaleString()} văn bản có nội dung đầy đủ (độ dài > 500 ký tự).`);

  let totalNewQA = 0;
  let processedDocs = 0;
  let skippedOrFailed = 0;
  const startTime = Date.now();

  for (let i = 0; i < candidateDocs.length; i += CONCURRENCY) {
    const chunk = candidateDocs.slice(i, i + CONCURRENCY);

    // Check if we reached the target
    const currentTotal = await prisma.legalQAItem.count();
    const currentNew = currentTotal - initialCount;

    if (currentNew >= TARGET_NEW_QA) {
      console.log(`\n ĐÃ ĐẠT MỤC TIÊU +${TARGET_NEW_QA.toLocaleString()} CÂU HỎI MỚI (Đạt: ${currentNew.toLocaleString()})!`);
      break;
    }

    const percent = Math.min(100, ((currentNew / TARGET_NEW_QA) * 100)).toFixed(1);
    const elapsedMinutes = ((Date.now() - startTime) / 60000).toFixed(1);
    console.log(`\n[Batch ${Math.floor(i / CONCURRENCY) + 1}/${Math.ceil(candidateDocs.length / CONCURRENCY)}]  Tiến độ: ${currentNew.toLocaleString()}/${TARGET_NEW_QA.toLocaleString()} (${percent}%) | Đã chạy: ${elapsedMinutes} phút`);

    const results = await Promise.allSettled(
      chunk.map(async (doc) => {
        try {
          const count = await QALLMService.generateQA(doc.id);
          if (count > 0) {
            console.log(`[${doc.documentNumber}] +${count} câu hỏi (${doc.title.substring(0, 50)}...)`);
          }
          return { doc, count, success: count > 0 };
        } catch (err: any) {
          console.error(`Lỗi [${doc.documentNumber}]: ${err.message}`);
          return { doc, count: 0, success: false };
        }
      })
    );

    for (const res of results) {
      if (res.status === 'fulfilled' && res.value.success) {
        totalNewQA += res.value.count;
        processedDocs++;
      } else {
        skippedOrFailed++;
      }
    }

    // Small delay between batches to protect LLM server throughput
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  const finalTotal = await prisma.legalQAItem.count();
  const totalTopics = await prisma.legalQATopic.count();
  const totalMinutes = ((Date.now() - startTime) / 60000).toFixed(1);

  console.log(`\n======================================================================`);
  console.log(`HOÀN THÀNH TIẾN TRÌNH SINH 10.000 CÂU HỎI:`);
  console.log(`⏱️ Thời gian thực thi: ${totalMinutes} phút`);
  console.log(`Số văn bản đã xử lý thành công: ${processedDocs.toLocaleString()}`);
  console.log(`Số câu hỏi sinh mới: ${totalNewQA.toLocaleString()} câu`);
  console.log(`Tổng số câu hỏi trong DB: ${finalTotal.toLocaleString()} câu`);
  console.log(`️ Tổng số chủ đề phân nhóm: ${totalTopics.toLocaleString()} chủ đề`);
  console.log(`======================================================================`);

  await prisma.$disconnect();
}

generateBulkQA().catch((err) => {
  console.error('Fatal error in generateBulkQA:', err);
  process.exit(1);
});
