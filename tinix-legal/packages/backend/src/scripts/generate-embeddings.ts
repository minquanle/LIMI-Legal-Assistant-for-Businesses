import { prisma } from '../infrastructure/db.js';
import { EmbeddingService } from '../services/embedding-service.js';

async function main() {
  console.log('Starting batch embedding generation...');

  // Find all documents without embeddings
  const documents = await prisma.canonicalDocument.findMany({
    where: {
      embedding: null,
    },
    select: {
      id: true,
      documentNumber: true,
      title: true,
      trichYeu: true,
    },
    take: 1000, // Batch limit
  });

  console.log(`Found ${documents.length} documents requiring embeddings.`);

  let successCount = 0;
  for (const doc of documents) {
    try {
      const embedText = `${doc.title} ${doc.trichYeu || ''}`.trim();
      const vector = await EmbeddingService.generateEmbedding(embedText);
      const vectorStr = `[${vector.join(',')}]`;

      await prisma.$executeRawUnsafe(
        `INSERT INTO document_embeddings (id, "documentId", embedding, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2::vector, NOW(), NOW())
         ON CONFLICT ("documentId")
         DO UPDATE SET embedding = EXCLUDED.embedding, "updatedAt" = NOW();`,
        doc.id,
        vectorStr
      );
      successCount++;
      if (successCount % 50 === 0) {
        console.log(`Processed ${successCount}/${documents.length} embeddings...`);
      }
    } catch (err) {
      console.error(`Failed embedding for ${doc.documentNumber}:`, err);
    }
  }

  console.log(`Completed batch embedding generation: ${successCount} documents updated.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
