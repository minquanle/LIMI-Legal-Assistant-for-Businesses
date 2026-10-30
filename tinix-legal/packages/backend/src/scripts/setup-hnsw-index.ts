import { prisma } from '../infrastructure/db.js';

async function main() {
  console.log('Ensuring pgvector extension and creating HNSW index...');
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS doc_embedding_hnsw_idx ON document_embeddings USING hnsw (embedding vector_cosine_ops);`
  );
  console.log('HNSW vector index setup successfully!');
}

main()
  .catch((err) => {
    console.error('Failed to setup HNSW index:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
