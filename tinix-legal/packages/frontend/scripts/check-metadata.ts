import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.canonicalDocument.count();

  async function check(field: string, query: any) {
    const count = await prisma.canonicalDocument.count(query);
    const fallback = total - count;
    console.log(`  ${field.padEnd(30)} ${String(count).padStart(8)} (${(count/total*100).toFixed(1)}%)\t\t${fallback} trống`);
  }

  console.log(`Tổng: ${total}\n`);
  console.log('--- Metadata fields có dữ liệu ---');
  await check('signer != ""',       { where: { signer: { not: '' } } });
  await check('field != ""',        { where: { field: { not: '' } } });
  await check('trichYeu != ""',     { where: { trichYeu: { not: '' } } });
  await check('gazetteNumber != ""',{ where: { gazetteNumber: { not: '' } } });
  await check('gazetteDate != null',{ where: { gazetteDate: { not: null } } });
  await check('expiryDate != null', { where: { expiryDate: { not: null } } });
  await check('author != ""',       { where: { author: { not: '' } } });
  await check('lastUpdatedAt != null', { where: { lastUpdatedAt: { not: null } } });
  await check('issuingBodyCode != ""', { where: { issuingBodyCode: { not: '' } } });
  await check('preciseValidityStatus != ""', { where: { preciseValidityStatus: { not: '' } } });
  await check('isConsolidated = true', { where: { isConsolidated: true } });
  await check('isTranslation = true', { where: { isTranslation: true } });

  console.log('\n--- ExpiryDate sample ---');
  const withExpiry = await prisma.canonicalDocument.findFirst({
    where: { expiryDate: { not: null } },
    select: { id: true, expiryDate: true, documentNumber: true, title: true }
  });
  if (withExpiry) console.log(JSON.stringify(withExpiry));

  console.log('\n--- Gazette sample ---');
  const withGazette = await prisma.canonicalDocument.findFirst({
    where: { gazetteNumber: { not: '' } },
    select: { id: true, gazetteNumber: true, gazetteDate: true, documentNumber: true }
  });
  if (withGazette) console.log(JSON.stringify(withGazette));

  console.log('\n--- Signer sample ---');
  const withSigner = await prisma.canonicalDocument.findFirst({
    where: { signer: { not: '' } },
    select: { id: true, signer: true, documentNumber: true }
  });
  if (withSigner) console.log(JSON.stringify(withSigner));

  await prisma.$disconnect();
}
main();
