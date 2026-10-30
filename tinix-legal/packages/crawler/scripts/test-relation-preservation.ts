import { PrismaClient } from '@prisma/client';
import { ingestDocument } from '../src/pipeline/ingestion.js';

const prisma = new PrismaClient();

// Target doc ID for Quyết định 23
const docId = 'd889cb4d-f66f-493f-84f2-0bbe41144fad';

async function run() {
  console.log("=== RELATION PRESERVATION TEST ===");
  
  const doc = await prisma.canonicalDocument.findUnique({
    where: { id: docId },
    include: { outgoingRelations: true }
  });
  
  if (!doc) {
    console.error("Test document not found in DB! Run test-crawl-single.ts first.");
    process.exit(1);
  }
  
  console.log(`Found doc: ${doc.documentNumber}`);
  console.log(`Current relations count: ${doc.outgoingRelations.length}`);
  
  // 1. Create a mock LLM relation and a mock crawler relation
  console.log("Creating mock relationships...");
  
  // LLM relation (description does NOT start with 'Extracted relation ')
  const llmRel = await prisma.documentRelation.create({
    data: {
      sourceDocId: doc.id,
      targetDocNumber: '999/2026/QĐ-LLM',
      relationType: 'CAN_CU',
      description: 'Extracted by DeepMind LLM model v1',
    }
  });
  
  // Standard crawler relation (starts with 'Extracted relation ')
  const crawlerRel = await prisma.documentRelation.create({
    data: {
      sourceDocId: doc.id,
      targetDocNumber: '888/2026/QĐ-CRAWLER',
      relationType: 'CAN_CU',
      description: 'Extracted relation CAN_CU to 888/2026/QĐ-CRAWLER',
    }
  });
  
  console.log(`Mock relations created:`);
  console.log(`  LLM Relation: ID ${llmRel.id} - ${llmRel.targetDocNumber}`);
  console.log(`  Crawler Relation: ID ${crawlerRel.id} - ${crawlerRel.targetDocNumber}`);
  
  // 2. Mock a raw crawled document payload to re-ingest
  const rawPayload = {
    url: 'https://vbpl.vn/van-ban/chi-tiet/quyet-dinh-so-23-2026-qd-ubnd-ban-hanh-dinh-muc-kinh-te-ky-thuat-xay-dung-co-so-du-lieu-dat-dai-tren-dia-ban-tinh-da-k-la-k--187456',
    title: doc.title,
    fullText: doc.fullText,
    contentHtml: '<h3>Demo content</h3><table><tr><td>Header 1</td></tr><tr><td>Data 1</td></tr></table>',
    metadata: {
      documentNumber: doc.documentNumber,
      documentType: 'Quyết định',
      issuingBody: '',
      validityStatus: doc.preciseValidityStatus,
      preciseValidityStatus: doc.preciseValidityStatus,
      rawRelationships: JSON.stringify([
        { targetDocNumber: '72/2025/QH15', relationshipType: 'căn cứ' }
      ])
    }
  };
  
  console.log("\nRe-ingesting document (simulating update via crawl)...");
  await ingestDocument(rawPayload);
  
  // 3. Verify relations in DB after ingestion
  console.log("\nChecking database relationships after ingestion...");
  const updatedRelations = await prisma.documentRelation.findMany({
    where: { sourceDocId: doc.id }
  });
  
  console.log(`Total relations after ingestion: ${updatedRelations.length}`);
  
  // Check if LLM relation is still present
  const hasLlmRel = updatedRelations.some(r => r.targetDocNumber === '999/2026/QĐ-LLM' && r.description === 'Extracted by DeepMind LLM model v1');
  // Check if standard crawler relation was deleted (since it was not in the new payload)
  const hasCrawlerRel = updatedRelations.some(r => r.targetDocNumber === '888/2026/QĐ-CRAWLER');
  // Check if the new payload relation exists
  const hasNewRel = updatedRelations.some(r => r.targetDocNumber === '72/2025/QH15');
  
  console.log(`Verification status:`);
  console.log(`  LLM Relation preserved? ${hasLlmRel ? '✅ YES' : '❌ NO'}`);
  console.log(`  Old Crawler Relation deleted? ${!hasCrawlerRel ? '✅ YES' : '❌ NO (Failed)'}`);
  console.log(`  New Ingested Relation created? ${hasNewRel ? '✅ YES' : '❌ NO'}`);
  
  // Clean up mock LLM relation for clean DB state
  await prisma.documentRelation.deleteMany({
    where: {
      sourceDocId: doc.id,
      targetDocNumber: { in: ['999/2026/QĐ-LLM', '888/2026/QĐ-CRAWLER'] }
    }
  });
  console.log("\nMock relationships cleaned up.");
  
  if (hasLlmRel && !hasCrawlerRel && hasNewRel) {
    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.log("\n❌ TEST FAILED!");
    process.exit(1);
  }
}

run();
