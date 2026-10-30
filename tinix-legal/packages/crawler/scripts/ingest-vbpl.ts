/**
 * Step 3: Ingest JSONL → PostgreSQL via Prisma (batch mode).
 *
 * Usage: npx tsx scripts/ingest-vbpl.ts [--shard=N] [--dry-run] [--clear-first]
 */
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { parseLegalText, flattenAST } from '@tinix-legal/shared';

const DATA_DIR = 'F:/workspace/tinix-legal/data/vbpl';
const TRANSFORM_DIR = path.join(DATA_DIR, 'transform');
const prisma = new PrismaClient();

interface IngestDoc {
  _id: string; _shard: number; _needs_llm: boolean;
  documentNumber: string; normalizedNumber: string; documentType: string;
  title: string; issuingBody: string; issuingBodyCode: string;
  signer: string; promulgationDate: string | null; effectiveDate: string | null;
  expiryDate: string | null; field: string; trichYeu: string; fullText: string;
  ast: string; source: { site: string; url: string; contentHash: string; lastCrawledAt: string };
  astNodes: any[]; relations: any[]; year: number | null; scope: string;
}

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s.replace('Z', '').replace('T', ' '));
  return isNaN(d.getTime()) ? null : d;
}

async function ingestBatch(docs: IngestDoc[], dryRun: boolean): Promise<{ ok: number; err: number; skip: number }> {
  if (dryRun || docs.length === 0) {
    const skip = docs.filter(d => d._needs_llm && !d.fullText).length;
    return { ok: docs.length - skip, err: 0, skip };
  }

  // Phase 1: createMany docs
  const batchData: any[] = [];
  for (const doc of docs) {
    if (doc._needs_llm && !doc.fullText) continue; // skip empty
    try {
      batchData.push({
        documentNumber: (doc.documentNumber || 'vbpl-' + doc._id).slice(0, 200),
        normalizedNumber: doc.normalizedNumber.slice(0, 200),
        documentType: doc.documentType as any,
        title: doc.title.slice(0, 1000),
        issuingBody: doc.issuingBody.slice(0, 500),
        issuingBodyCode: doc.issuingBodyCode.slice(0, 50),
        signer: (doc.signer || '').slice(0, 200),
        promulgationDate: parseDate(doc.promulgationDate),
        effectiveDate: parseDate(doc.effectiveDate),
        expiryDate: parseDate(doc.expiryDate),
        field: doc.field.slice(0, 200),
        trichYeu: (doc.trichYeu || '').slice(0, 2000),
        fullText: doc.fullText || '',
        ast: JSON.parse(doc.ast || '[]'),
        validityStatus: 'KHONG_XAC_DINH' as const,
      });
    } catch { /* skip bad rows */ }
  }

  if (batchData.length === 0) return { ok: 0, err: docs.length, skip: 0 };

  try {
    await prisma.canonicalDocument.createMany({ data: batchData, skipDuplicates: true });
  } catch (e: any) {
    // fallback: one-by-one
    let ok = 0, err = 0;
    for (const d of batchData) {
      try { await prisma.canonicalDocument.create({ data: d }); ok++; } catch { err++; }
    }
    return { ok, err, skip: docs.length - batchData.length };
  }

  // Phase 2: find inserted docs and insert sources + AST nodes
  const numbers = batchData.map((d: any) => d.normalizedNumber);
  const existing = await prisma.canonicalDocument.findMany({
    where: { normalizedNumber: { in: numbers } },
    select: { id: true, normalizedNumber: true },
  });
  const docMap = new Map(existing.map(d => [d.normalizedNumber, d.id]));

  // Sources (batch upsert parent and child is tricky, do sequential but only with found IDs)
  let sourceCount = 0, astCount = 0;
  for (const doc of docs) {
    const docId = docMap.get(doc.normalizedNumber.slice(0, 200));
    if (!docId) continue;

    // Source
    try {
      await prisma.documentSource.upsert({
        where: { source_url_unique: { site: doc.source.site as any, url: doc.source.url.slice(0, 1000) } },
        update: { contentHash: doc.source.contentHash, lastCrawledAt: parseDate(doc.source.lastCrawledAt) || new Date() },
        create: {
          documentId: docId, site: doc.source.site as any, url: doc.source.url.slice(0, 1000),
          contentHash: doc.source.contentHash, lastCrawledAt: parseDate(doc.source.lastCrawledAt) || new Date(),
        },
      });
      sourceCount++;
    } catch {}

    // AST nodes (using new shared parser)
    if (doc.fullText) {
      try {
        const parsedDoc = parseLegalText(doc.fullText);
        if (parsedDoc.isParsed && parsedDoc.astNodes.length > 0) {
          await prisma.legalASTNode.deleteMany({ where: { documentId: docId } });
          const flattened = flattenAST(parsedDoc.astNodes);
          const records = flattened.map((n: any, i: number) => ({
            documentId: docId,
            nodeType: (n.nodeType || 'TEXT') as any,
            ordinal: String(n.ordinal || ''),
            heading: (n.heading || '').slice(0, 500),
            content: (n.content || '').slice(0, 5000),
            path: n.path || `node-${i}`,
            depth: n.depth ?? 0,
            orderIndex: n.orderIndex ?? i,
          }));
          if (records.length > 0) await prisma.legalASTNode.createMany({ data: records });
          astCount++;
        }
      } catch (err) {
        // Skip parse errors
      }
    }
  }

  return { ok: batchData.length, err: 0, skip: docs.length - batchData.length };
}

async function clearDB(): Promise<void> {
  console.log('Clearing existing data...');
  await prisma.documentRelation.deleteMany();
  await prisma.legalASTNode.deleteMany();
  await prisma.documentSource.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.canonicalDocument.deleteMany();
  console.log('  All tables cleared.');
}

async function main() {
  const args = process.argv.slice(2);
  const shardArg = args.find(a => a.startsWith('--shard='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');
  const clearFirst = args.includes('--clear-first');

  const shards = shardArg ? [parseInt(shardArg)] : Array.from({ length: 32 }, (_, i) => i);

  if (clearFirst && !dryRun) await clearDB();

  let totalOk = 0, totalErr = 0, totalSkip = 0;

  for (const shardIdx of shards) {
    const padded = path.join(TRANSFORM_DIR, `documents-${String(shardIdx).padStart(5, '0')}.jsonl`);
    const short = path.join(TRANSFORM_DIR, `documents-${shardIdx}.jsonl`);
    const jsonlPath = fs.existsSync(padded) ? padded : (fs.existsSync(short) ? short : null);
    if (!jsonlPath) { console.log(`  [${shardIdx}/32] No JSONL, skip`); continue; }

    const lines = fs.readFileSync(jsonlPath, 'utf-8').split('\n').filter(Boolean);
    console.log(`  [${shardIdx}/32] ${lines.length} docs...`);

    const docs: IngestDoc[] = lines.map(l => JSON.parse(l));

    // Process in sub-batches of 500 to avoid OOM
    const BATCH = 500;
    let shardOk = 0, shardErr = 0, shardSkip = 0;

    for (let i = 0; i < docs.length; i += BATCH) {
      const batch = docs.slice(i, i + BATCH);
      const r = await ingestBatch(batch, dryRun);
      shardOk += r.ok; shardErr += r.err; shardSkip += r.skip;
      const label = dryRun ? 'DRY-RUN' : 'INGEST';
      console.log(`    [${label}] ${Math.min(i + BATCH, docs.length)}/${docs.length} — ${shardOk} OK, ${shardErr} ERR, ${shardSkip} SKIP`);
    }

    totalOk += shardOk; totalErr += shardErr; totalSkip += shardSkip;
  }

  console.log(`\n=== ${dryRun ? 'DRY RUN' : 'INGESTION'} Complete ===`);
  console.log(`Ingested: ${totalOk}\nErrors: ${totalErr}\nSkipped: ${totalSkip}`);

  if (!dryRun) {
    const total = await prisma.canonicalDocument.count();
    console.log(`Total documents in DB: ${total}`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
