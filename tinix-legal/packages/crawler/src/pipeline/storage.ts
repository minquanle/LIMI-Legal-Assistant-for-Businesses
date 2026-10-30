import { PrismaClient } from '@prisma/client';
import { Client } from 'minio';
import * as zlib from 'zlib';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';
import { mapSourceSite } from '../utils/source-site.js';
import { config } from '../config.js';
import { normalizeSourceUrl } from '@tinix-legal/shared/dist/source-identity.js';

const prisma = new PrismaClient();

const minioClient = new Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

const BUCKET_NAME = 'raw-html';

/**
 * Convert HTML tables to Markdown format while keeping other text intact.
 */
export function convertHtmlToMarkdownText(html: string): string {
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
          row.push('');
        }
      });
      if (row.length > 0) rows.push(row);
    });

    if (rows.length > 0) {
      const maxCols = Math.max(...rows.map((r) => r.length));
      let markdownTable = '\n\n';
      const headerRow = rows[0];
      while (headerRow.length < maxCols) headerRow.push('');
      markdownTable += '| ' + headerRow.join(' | ') + ' |\n';
      markdownTable += '| ' + Array(maxCols).fill('---').join(' | ') + ' |\n';
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        while (row.length < maxCols) row.push('');
        markdownTable += '| ' + row.join(' | ') + ' |\n';
      }
      markdownTable += '\n';
      $table.replaceWith(markdownTable);
    }
  });

  return $('body').text();
}

/**
 * Sanitize HTML content to remove Word inline styles, font tags, and garbage markup.
 */
export function sanitizeHtml(html: string): string {
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

/**
 * Best-effort side effect: compress + upload the raw HTML to MinIO and link
 * it via DocumentSource. Failure here must not fail the whole ingestion —
 * the canonical document record is already durable at this point (written by
 * persistDocument's transaction); losing the raw-HTML backup is degraded
 * service, not data loss of the parsed document itself.
 */
export async function storeDocumentHtml(
  documentId: string,
  documentNumber: string,
  source: string,
  url: string,
  contentHtml: string
): Promise<void> {
  const identity = normalizeSourceUrl(url);
  const siteEnum = identity.site;
  const sourceRecord = await prisma.documentSource.findUnique({where:{source_normalized_url:{domain:identity.domain,normalizedUrl:identity.normalizedUrl}}});
  if (!sourceRecord || sourceRecord.documentId!==documentId) throw new Error('SOURCE_DOCUMENT_CONFLICT');
  const compressedHtml = zlib.brotliCompressSync(Buffer.from(contentHtml, 'utf8'));
  const minioPath = `${siteEnum.toLowerCase()}/${documentId}.html.br`;

  const bucketExists = await minioClient.bucketExists(BUCKET_NAME).catch(() => false);
  if (!bucketExists) {
    await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
  }

  await minioClient.putObject(BUCKET_NAME, minioPath, compressedHtml);
  const minioUrl = `minio://${BUCKET_NAME}/${minioPath}`;

  await prisma.documentSource.update({
    where: { id:sourceRecord.id },
    data: { rawHtml: minioUrl, lastCrawledAt: new Date() },
  });

  logger.info(`Successfully stored HTML and linked DocumentSource for doc ${documentNumber}`);
}
