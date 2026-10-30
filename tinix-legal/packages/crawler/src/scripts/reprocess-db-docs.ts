import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Client as MinioClient } from 'minio';
import * as zlib from 'zlib';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ingestDocument } from '../pipeline/ingestion.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

const minioClient = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER || 'admin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'password123',
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HEARTBEAT_FILE = path.resolve(__dirname, '../../crawler-heartbeat.json');

const startedAt = new Date().toISOString();
let lastHeartbeatWriteTime = 0;

function updateHeartbeatState(processedCount: number, successCount: number, errorCount: number, total: number, customMessage?: string) {
  try {
    const data = {
      pid: process.pid,
      status: 'RUNNING',
      startedAt,
      processedCount,
      successCount,
      errorCount,
      message: customMessage || `Reprocessing DB: ${processedCount}/${total} (Success: ${successCount}, Failed: ${errorCount})`,
      lastHeartbeat: new Date().toISOString()
    };
    fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // ignore
  }
}

function throttleUpdateHeartbeatState(processedCount: number, successCount: number, errorCount: number, total: number) {
  const now = Date.now();
  if (now - lastHeartbeatWriteTime > 250 || processedCount === total) {
    updateHeartbeatState(processedCount, successCount, errorCount, total);
    lastHeartbeatWriteTime = now;
  }
}

function setHeartbeatStopped(message: string) {
  try {
    const data = {
      pid: process.pid,
      status: 'STOPPED',
      startedAt,
      processedCount: 0,
      successCount: 0,
      errorCount: 0,
      message,
      lastHeartbeat: new Date().toISOString()
    };
    fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // ignore
  }
}

// ----------------- HTML & MARKDOWN TABLE HELPERS -----------------

function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/style="[^"]*"/gi, '')
    .replace(/class="mso[^"]*"/gi, '')
    .replace(/<font[^>]*>/gi, '')
    .replace(/<\/font>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

function convertHtmlToMarkdownText(html: string): string {
  if (!html) return '';
  const $ = cheerio.load(html);
  
  $('table').each((_, table) => {
    const $table = $(table);
    const rows: string[][] = [];
    
    $table.find('tr').each((_, tr) => {
      const row: string[] = [];
      $(tr).find('td, th').each((_, cell) => {
        const cellText = $(cell).text().replace(/\r?\n|\r/g, ' ').replace(/\|/g, '\\|').trim();
        const colspan = parseInt($(cell).attr('colspan') || '1', 10);
        row.push(cellText);
        for (let i = 1; i < colspan; i++) {
          row.push(''); // Pad empty cells for colspan alignment
        }
      });
      if (row.length > 0) {
        rows.push(row);
      }
    });
    
    if (rows.length > 0) {
      const maxCols = Math.max(...rows.map(r => r.length));
      
      let markdownTable = '\n\n';
      const headerRow = rows[0];
      while (headerRow.length < maxCols) {
        headerRow.push('');
      }
      markdownTable += '| ' + headerRow.join(' | ') + ' |\n';
      markdownTable += '| ' + Array(maxCols).fill('---').join(' | ') + ' |\n';
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        while (row.length < maxCols) {
          row.push('');
        }
        markdownTable += '| ' + row.join(' | ') + ' |\n';
      }
      markdownTable += '\n';
      $table.replaceWith(markdownTable);
    }
  });
  
  return $('body').text();
}

function processAndRepairTable(lines: string[]): string[] {
  if (lines.length < 2) return lines;
  
  const rows = lines.map(line => {
    // split by | but ignore escaped \|
    const cells = line.split(/(?<!\\)\|/).map(c => c.trim());
    // remove the first and last elements because line starts/ends with |
    if (cells[0] === '') cells.shift();
    if (cells[cells.length - 1] === '') cells.pop();
    return cells;
  });
  
  const maxCols = Math.max(...rows.map(r => r.length));
  
  const repaired: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Check if separator row (second row containing only dashes/colons)
    const isSeparator = i === 1 && row.every(cell => /^[\s\-:|]+$/.test(cell));
    
    while (row.length < maxCols) {
      row.push(isSeparator ? '---' : '');
    }
    
    repaired.push('| ' + row.join(' | ') + ' |');
  }
  return repaired;
}

function repairMarkdownTables(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  let inTable = false;
  let tableLines: string[] = [];
  const repairedLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableLines.push(line);
    } else {
      if (inTable) {
        repairedLines.push(...processAndRepairTable(tableLines));
        tableLines = [];
        inTable = false;
      }
      repairedLines.push(line);
    }
  }
  if (inTable) {
    repairedLines.push(...processAndRepairTable(tableLines));
  }
  return repairedLines.join('\n');
}

// ----------------- DATE FORMATTING HELPER -----------------
function formatDateToVn(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ----------------- HEURISTIC DETECTORS -----------------

function hasTocAnomalies(ast: any): boolean {
  if (!ast || !Array.isArray(ast) || ast.length === 0) return false;
  let hasDrop = false;
  
  function scan(nodes: any[]) {
    const dieus = nodes.filter(n => n.nodeType === 'DIEU');
    for (let i = 1; i < dieus.length; i++) {
      const prevOrd = parseInt(dieus[i - 1].ordinal);
      const currOrd = parseInt(dieus[i].ordinal);
      if (!isNaN(prevOrd) && !isNaN(currOrd) && currOrd < prevOrd) {
        hasDrop = true;
        return;
      }
    }
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        scan(node.children);
      }
    }
  }
  
  scan(ast);
  return hasDrop;
}

function hasAppendixErrors(title: string, fullText: string, ast: any): boolean {
  const textToSearch = (title || '') + '\n' + (fullText || '');
  const hasAppendixWord = /ph\u1ee5\s*l\u1ee5c/i.test(textToSearch);
  if (!hasAppendixWord) return false;
  if (!ast || !Array.isArray(ast) || ast.length === 0) return true;
  
  const hasAppendixInAst = (nodes: any[]): boolean => {
    for (const node of nodes) {
      if (/ph\u1ee5\s*l\u1ee5c/i.test(node.heading || '')) return true;
      if (node.children && hasAppendixInAst(node.children)) return true;
    }
    return false;
  };
  
  return !hasAppendixInAst(ast);
}

function hasTableErrors(fullText: string): boolean {
  if (!fullText) return false;
  const lines = fullText.split('\n');
  let inTable = false;
  let headerCols = -1;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cols = trimmed.split('|').length - 2;
      if (!inTable) {
        inTable = true;
        headerCols = cols;
      } else {
        const isSeparator = /^\|[\s\-:|]+\|$/.test(trimmed);
        if (!isSeparator && cols !== headerCols) {
          return true; // Table row has mismatched columns!
        }
      }
    } else {
      inTable = false;
      headerCols = -1;
    }
  }
  return false;
}

// ----------------- FETCHING HELPERS -----------------

async function getHtmlFromMinio(minioUrl: string): Promise<string> {
  const parsed = minioUrl.replace('minio://', '');
  const slashIdx = parsed.indexOf('/');
  const bucketName = parsed.substring(0, slashIdx);
  const objectPath = parsed.substring(slashIdx + 1);
  
  const stream = await minioClient.getObject(bucketName, objectPath);
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        let decompressed: Buffer;
        if (objectPath.endsWith('.br')) {
          decompressed = zlib.brotliDecompressSync(buffer);
        } else {
          decompressed = buffer;
        }
        resolve(decompressed.toString('utf8'));
      } catch (err) {
        reject(err);
      }
    });
    stream.on('error', reject);
  });
}

// (unused crawlFromNetwork removed)

// ----------------- MAIN PIPELINE -----------------

async function main() {
  const concurrency = parseInt(process.argv[2] || '5', 10);
  console.log(`Starting DB re-processing crawler with concurrency: ${concurrency}`);
  
  // Update heartbeat status to let UI know we are running
  updateHeartbeatState(0, 0, 0, 0, 'Classifying document priorities in DB...');
  
  // 1. Fetch all documents in batches to prevent OOM
  console.log('Querying canonical documents from database in batches and classifying priority...');
  const queue: Array<{ id: string; documentNumber: string; priority: number; reason: string }> = [];
  const batchSize = 150;
  let skip = 0;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const batch = await prisma.canonicalDocument.findMany({
        select: {
          id: true,
          documentNumber: true,
          title: true,
          fullText: true,
          ast: true
        },
        skip,
        take: batchSize,
      });
      if (batch.length === 0) {
        hasMore = false;
      } else {
        // Classify immediate and discard fullText/ast from memory
        for (const doc of batch) {
          let priority = 2;
          let reason = 'Normal';
          
          if (!doc.ast || !Array.isArray(doc.ast) || doc.ast.length === 0) {
            if ((doc.fullText || '').length > 200) {
              priority = 1;
              reason = 'Empty AST/TOC';
            }
          } else if (hasTocAnomalies(doc.ast)) {
            priority = 1;
            reason = 'TOC sequence drop anomaly';
          } else if (hasAppendixErrors(doc.title, doc.fullText, doc.ast)) {
            priority = 1;
            reason = 'Missing Appendix in AST';
          } else if (hasTableErrors(doc.fullText)) {
            priority = 1;
            reason = 'Malformed Markdown table columns';
          }
          
          queue.push({
            id: doc.id,
            documentNumber: doc.documentNumber || '',
            priority,
            reason
          });
        }
        skip += batchSize;
        console.log(`Classified ${queue.length} documents...`);
        updateHeartbeatState(0, 0, 0, 0, `Classifying document priorities in DB... (${queue.length} classified)`);
      }
    } catch (err) {
      console.error(`Error loading batch at skip ${skip}: ${(err as Error).message}`);
      hasMore = false;
    }
  }
  
  // Sort queue: Priority 1 first, then Priority 2
  queue.sort((a, b) => a.priority - b.priority);
  
  const highPriorityCount = queue.filter(q => q.priority === 1).length;
  console.log(`\nQueue prioritized:`);
  console.log(`- High Priority (Errors / Needs Update): ${highPriorityCount}`);
  console.log(`- Normal Priority: ${queue.length - highPriorityCount}`);
  
  // 3. Process the queue with an async concurrency pool
  let processed = 0;
  let successCount = 0;
  let errorCount = 0;
  
  const startTime = Date.now();
  const pool = new Set<Promise<void>>();
  
  for (const item of queue) {
    if (pool.size >= concurrency) {
      await Promise.race(pool);
    }
    
    const task = (async () => {
      const { id, documentNumber, priority, reason } = item;
      const index = ++processed;
      console.log(`[${index}/${queue.length}] [Pri:${priority}] Processing ${documentNumber} (Reason: ${reason})...`);
      
      try {
        // Fetch full document record dynamically
        const doc = await prisma.canonicalDocument.findUnique({
          where: { id }
        });
        if (!doc) {
          throw new Error(`Document ${documentNumber} not found in DB`);
        }
        
        // Fetch raw HTML
        const source = await prisma.documentSource.findFirst({
          where: { documentId: id }
        });
        
        let html = '';
        if (source?.rawHtml?.startsWith('minio://')) {
          try {
            html = await getHtmlFromMinio(source.rawHtml);
          } catch (err) {
            console.warn(`MinIO fetch failed for ${documentNumber}, falling back to local fullText repair: ${(err as Error).message}`);
          }
        }
        
        let documentFullText = '';
        if (html) {
          const cleanHtml = sanitizeHtml(html);
          documentFullText = convertHtmlToMarkdownText(cleanHtml);
        } else {
          // Local fallback: use existing fullText and repair any malformed tables in it
          if (doc.fullText) {
            documentFullText = repairMarkdownTables(doc.fullText);
          }
        }
        
        if (!documentFullText) {
          throw new Error('No fullText available and no raw HTML could be retrieved');
        }
        
        // Fetch existing crawler-extracted relations
        const crawlerRels = await prisma.documentRelation.findMany({
          where: {
            sourceDocId: doc.id,
            description: { startsWith: 'Extracted relation ' }
          }
        });
        
        // Reconstruct rawDoc structure for ingestion pipeline
        const rawDoc = {
          id: doc.id,
          contentHtml: html || '', // Empty string skips S3 putObject in ingestDocument
          fullText: documentFullText,
          title: doc.title,
          source: source?.site || 'VBPL',
          url: source?.url || '',
          metadata: {
            documentNumber: doc.documentNumber || '',
            documentType: doc.documentType || '',
            issuingBody: doc.issuingBody || '',
            signer: doc.signer || '',
            promulgationDate: formatDateToVn(doc.promulgationDate),
            effectiveDate: formatDateToVn(doc.effectiveDate),
            expiryDate: formatDateToVn(doc.expiryDate),
            validityStatus: doc.validityStatus || '',
            preciseValidityStatus: doc.preciseValidityStatus || '',
            field: doc.field || '',
            gazetteNumber: doc.gazetteNumber || '',
            gazetteDate: formatDateToVn(doc.gazetteDate),
            isConsolidated: doc.isConsolidated ? 'true' : 'false',
            isTranslation: doc.isTranslation ? 'true' : 'false',
            trichYeu: doc.trichYeu || '',
            author: doc.author || '',
            lastUpdatedAt: doc.lastUpdatedAt ? doc.lastUpdatedAt.toISOString() : '',
            rawRelationships: JSON.stringify(crawlerRels.map(r => ({
              targetDocNumber: r.targetDocNumber,
              relationshipType: r.relationType
            })))
          }
        };
        
        // Run standard ingestion pipeline which converts HTML, parses TOC, updates DB
        await ingestDocument(rawDoc);
        successCount++;
        console.log(`[Success] Reprocessed ${documentNumber}`);
        throttleUpdateHeartbeatState(processed, successCount, errorCount, queue.length);
      } catch (err) {
        errorCount++;
        console.error(`[Error] Failed processing ${documentNumber}: ${(err as Error).message}`);
        throttleUpdateHeartbeatState(processed, successCount, errorCount, queue.length);
      }
    })();
    
    task.then(() => pool.delete(task));
    pool.add(task);
  }
  
  await Promise.all(pool);
  
  setHeartbeatStopped(`Reprocessing Complete: ${successCount}/${queue.length} success, ${errorCount} failed`);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n Reprocessing Complete!`);
  console.log(`- Total processed: ${queue.length}`);
  console.log(`- Success: ${successCount}`);
  console.log(`- Failed: ${errorCount}`);
  console.log(`- Elapsed time: ${elapsed}s`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
