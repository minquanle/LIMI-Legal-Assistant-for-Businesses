import { prisma } from '../infrastructure/db.js';

async function main() {
  console.log('Ensuring pg_trgm/unaccent extensions and creating reference_lookups indexes...');
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS reference_lookups_search_trgm_idx ON reference_lookups USING gin ("searchText" gin_trgm_ops);`
  );
  console.log('reference_lookups indexes set up successfully!');
}

main()
  .catch((err) => {
    console.error('Failed to setup reference_lookups indexes:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
