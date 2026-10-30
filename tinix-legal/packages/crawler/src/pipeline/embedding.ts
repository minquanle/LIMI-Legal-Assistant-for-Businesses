import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from '../services/embedding-service.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Best-effort side effect: generate and upsert the pgvector embedding for a
 * document. Kept outside persistDocument's transaction for the same reason
 * as MinIO storage — it's an external model call, not something that should
 * hold a DB transaction open.
 */
export async function storeEmbedding(documentId: string, documentNumber: string, title: string, trichYeu: string): Promise<void> {
  const embedText = `${title} ${trichYeu || ''}`.trim();
  const vector = await EmbeddingService.generateEmbedding(embedText);
  const vectorStr = `[${vector.join(',')}]`;

  await prisma.$executeRawUnsafe(
    `INSERT INTO document_embeddings (id, "documentId", embedding, "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2::vector, NOW(), NOW())
     ON CONFLICT ("documentId")
     DO UPDATE SET embedding = EXCLUDED.embedding, "updatedAt" = NOW();`,
    documentId,
    vectorStr
  );
  logger.info(`Generated and stored vector embedding for doc ${documentNumber}`);
}
