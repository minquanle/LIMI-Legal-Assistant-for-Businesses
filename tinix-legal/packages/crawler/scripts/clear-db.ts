/**
 * Clear all data from the database.
 * Usage: npx tsx scripts/clear-db.ts [--force]
 * 
 * Requires --force to actually delete. Dry-run otherwise.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const force = process.argv.includes('--force');

async function main() {
  if (!force) {
    console.log('DRY RUN: Use --force to actually delete');
    const counts = await Promise.all([
      prisma.documentRelation.count(),
      prisma.legalASTNode.count(),
      prisma.documentSource.count(),
      prisma.attachment.count(),
      prisma.canonicalDocument.count(),
      prisma.crawlLog.count(),
    ]);
    console.log('  DocumentRelation:', counts[0]);
    console.log('  LegalASTNode:    ', counts[1]);
    console.log('  DocumentSource:  ', counts[2]);
    console.log('  Attachment:      ', counts[3]);
    console.log('  CanonicalDocument:', counts[4]);
    console.log('  CrawlLog:        ', counts[5]);
    console.log('Total: ', counts.reduce((a, b) => a + b));
    return;
  }

  console.log('CLEARING ALL DATA...');
  await prisma.documentRelation.deleteMany();
  await prisma.legalASTNode.deleteMany();
  await prisma.documentSource.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.crawlLog.deleteMany();
  await prisma.canonicalDocument.deleteMany();
  console.log('All tables cleared.');
  
  const totals = await Promise.all([
    prisma.canonicalDocument.count(),
    prisma.documentSource.count(),
    prisma.legalASTNode.count(),
    prisma.documentRelation.count(),
  ]);
  console.log('Verification — all should be 0:', totals);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
