import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const total = await p.canonicalDocument.count();

  const stringFields: [string, string?][] = [
    ['documentNumber', ''],
    ['normalizedNumber', ''],
    ['title', ''],
    ['issuingBody', ''],
    ['issuingBodyCode', ''],
    ['signer', ''],
    ['preciseValidityStatus', ''],
    ['field', ''],
    ['gazetteNumber', ''],
    ['trichYeu', ''],
    ['author', ''],
    ['fullText', ''],
    ['issuingBody', 'nan'],
    ['fullText', 'nan'],
  ];

  // String fields (not '' and not 'nan')
  for (const [f, notVal] of stringFields) {
    const where: any = {};
    if (notVal) {
      where[f] = notVal;
    } else {
      where[f] = { not: '' };
    }
    const count = await p.canonicalDocument.count({ where });
    const label = notVal ? `${f} = '${notVal}'` : `${f} != ''`;
    console.log(`${label.padEnd(40)} ${String(count).padStart(8)} / ${total} (${(count/total*100).toFixed(1)}%)`);
  }

  // Date fields
  const dateFields = ['promulgationDate', 'effectiveDate', 'expiryDate', 'gazetteDate', 'lastUpdatedAt'];
  for (const f of dateFields) {
    const count = await p.canonicalDocument.count({ where: { [f]: { not: null } } });
    console.log(`${(f+' != null').padEnd(40)} ${String(count).padStart(8)} / ${total} (${(count/total*100).toFixed(1)}%)`);
  }

  // Boolean fields
  for (const f of ['isConsolidated', 'isTranslation']) {
    const count = await p.canonicalDocument.count({ where: { [f]: true } });
    console.log(`${(f+' = true').padEnd(40)} ${String(count).padStart(8)} / ${total} (${(count/total*100).toFixed(1)}%)`);
  }

  // Invalid values detection
  console.log('\n🔍 Sample values for dirty data detection:');
  const sample = await p.canonicalDocument.findFirst({
    select: {
      issuingBodyCode: true, normalizedNumber: true,
      preciseValidityStatus: true, field: true, trichYeu: true,
      issuingBody: true, signer: true, gazetteNumber: true,
      author: true,
    }
  });
  console.log(JSON.stringify(sample, null, 2));

  // Check for "nan" in issuingBody
  const nanBody = await p.canonicalDocument.count({ where: { issuingBody: 'nan' } });
  console.log(`\nissuingBody = 'nan': ${nanBody}`);

  const nanFullText = await p.canonicalDocument.count({ where: { fullText: 'nan' } });
  console.log(`fullText = 'nan': ${nanFullText}`);

  // Check for "nan" in other fields
  for (const f of ['field', 'trichYeu', 'issuingBodyCode', 'signer', 'author']) {
    try {
      const c = await p.canonicalDocument.count({ where: { [f]: 'nan' } });
      if (c > 0) console.log(`${f} = 'nan': ${c}`);
    } catch {}
  }

  // Check for null in field (it's a String field)
  // These fields are String with @default(""), not nullable
  // null checks not applicable for non-nullable String fields
  // const nullField = await p.canonicalDocument.count({ where: { field: null } });
  // console.log(`field = null: ${nullField}`);
  // const nullTrichYeu = await p.canonicalDocument.count({ where: { trichYeu: null } });
  // console.log(`trichYeu = null: ${nullTrichYeu}`);

  await p.$disconnect();
}
main();
