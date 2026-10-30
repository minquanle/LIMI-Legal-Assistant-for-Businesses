import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const total = await p.canonicalDocument.count();
  const vbpl = await p.canonicalDocument.count({ where: { documentNumber: { startsWith: 'vbpl-' } } });
  const real = total - vbpl;
  console.log(`Total: ${total}`);
  console.log(`vbpl-XXXXX: ${vbpl} (${(vbpl/total*100).toFixed(1)}%)`);
  console.log(`Real doc num: ${real} (${(real/total*100).toFixed(1)}%)`);
  
  const sample = await p.canonicalDocument.findFirst({ where: { NOT: { documentNumber: { startsWith: 'vbpl-' } } }, select: { documentNumber: true } });
  console.log(`Sample real: ${sample?.documentNumber}`);

  // Also check normalizedNumber - is it better?
  const sample2 = await p.canonicalDocument.findFirst({
    where: { documentNumber: { startsWith: 'vbpl-' } },
    select: { documentNumber: true, normalizedNumber: true }
  });
  console.log(`Sample vbpl: docNum=${sample2?.documentNumber}, normNum=${sample2?.normalizedNumber}`);
  
  await p.$disconnect();
}
main();
