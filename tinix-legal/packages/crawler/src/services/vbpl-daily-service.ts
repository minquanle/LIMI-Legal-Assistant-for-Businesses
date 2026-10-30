import { PlaywrightCrawler, Dataset } from 'crawlee';
import { config } from '../config.js';
import logger from '../utils/logger.js';
import { ingestDocument } from '../pipeline/ingestion.js';
import { assertCrawlAllowed } from '../utils/robots.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'https://vbpl.vn';

export interface VbplDailyOptions {
  maxPagesPerKeyword?: number;
  keywords?: string[];
  harvestFullTextRelations?: boolean;
}

/**
 * VBPL.vn Daily Incremental & Full-text Relation Crawler Service.
 * 
 * Performs daily automated sweeps across VBPL.vn using common legal search keywords.
 * Checks for existing documents in database to perform early exit on duplicates,
 * extracts full-text HTML, parses AST structure, and harvests Lược Đồ relation links.
 */
export async function runVbplDailyCrawl(options?: VbplDailyOptions) {
  const maxPages = options?.maxPagesPerKeyword ?? 2;
  const keywords = options?.keywords ?? config.commonLegalKeywords;
  const harvestRelations = options?.harvestFullTextRelations ?? true;

  if (!(await assertCrawlAllowed(BASE_URL, 'vbpl-daily'))) return;

  logger.info('═══════════════════════════════════════════════════');
  logger.info(`Starting VBPL.vn Daily Crawl (${keywords.length} keywords, max ${maxPages} pages/keyword)`);
  logger.info('═══════════════════════════════════════════════════');

  const visitedUrls = new Set<string>();

  const crawler = new PlaywrightCrawler({
    maxConcurrency: config.concurrency,
    maxRequestsPerMinute: config.maxRequestsPerMinute,
    maxRequestRetries: config.retryCount,
    navigationTimeoutSecs: config.navigationTimeoutSecs,
    requestHandlerTimeoutSecs: 120,
    headless: true,
    launchContext: {
      launchOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
        ],
        userAgent: config.userAgent,
      },
    },
    preNavigationHooks: [
      async ({ page }) => {
        (page as any).capturedDocuments = [];
        page.on('response', async (response) => {
          const url = response.url();
          const method = response.request().method();
          if (method === 'POST' && (url.includes('/van-ban/trung-uong') || url.includes('/van-ban/dia-phuong'))) {
            try {
              const buffer = await response.body();
              const text = decodeDoubleEncodedUtf8(buffer);
              
              const lines = text.split('\n');
              for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex !== -1) {
                  const dataStr = line.substring(colonIndex + 1).trim();
                  if (dataStr.startsWith('{') || dataStr.startsWith('[')) {
                    try {
                      const parsed = JSON.parse(dataStr);
                      const items = findItems(parsed);
                      if (items && Array.isArray(items)) {
                        for (const item of items) {
                          if (item && item.id && item.title) {
                            (page as any).capturedDocuments.push(item);
                          }
                        }
                      }
                    } catch (err) {}
                  }
                }
              }
            } catch (err) {}
          }
        });
      }
    ],

    async requestHandler({ request, page }) {
      const url = request.url;
      const label = request.label || 'LIST';

      if (visitedUrls.has(url)) return;
      visitedUrls.add(url);

      logger.info(`Daily Crawler processing [${label}]: ${url}`);

      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
        logger.warn(`Network idle timeout for ${url}, continuing...`);
      });

      if (label === 'SEARCH_LIST') {
        const docLinks = await handleSearchListPage(page, url);
        for (const docUrl of docLinks) {
          if (!visitedUrls.has(docUrl)) {
            await crawler.addRequests([{ url: docUrl, label: 'DETAIL' }]);
          }
        }
      } else if (label === 'DETAIL') {
        await handleDetailPage(page, url, harvestRelations, crawler);
      }
    },

    failedRequestHandler({ request }, error) {
      logger.error(`Request failed: ${request.url}`, { error: error.message });
    },
  });

  // Construct initial search URLs using common legal keywords
  const initialRequests = [];
  for (const kw of keywords) {
    const encodedKw = encodeURIComponent(kw);
    for (let p = 1; p <= maxPages; p++) {
      initialRequests.push({
        url: `${BASE_URL}/van-ban/trung-uong?keyword=${encodedKw}&page=${p}`,
        label: 'SEARCH_LIST',
      });
    }
  }

  await crawler.run(initialRequests);
  logger.info('VBPL.vn Daily Crawl finished successfully.');
}

async function handleSearchListPage(page: any, url: string): Promise<string[]> {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(5000);

  const captured = (page as any).capturedDocuments || [];
  logger.info(`Captured ${captured.length} documents from network for ${url}`);

  const links: string[] = [];
  for (const item of captured) {
    const slug = slugify(item.title);
    const docUrl = `${BASE_URL}/van-ban/chi-tiet/${slug}--${item.id}`;
    links.push(docUrl);
  }

  const unique = [...new Set(links)];
  logger.info(`Found ${unique.length} document links on search page ${url}`);
  return unique;
}

/**
 * Handle document detail page — extract metadata, content, and harvest Lược đồ relations.
 */
export async function handleDetailPage(page: any, url: string, harvestRelations: boolean, crawler: any) {
  // 1. Quick URL-based early exit check
  const existingSource = await prisma.documentSource.findFirst({
    where: { site: 'VBPL', url },
    include: { document: true }
  });
  if (existingSource?.document && existingSource.document.fullText && existingSource.document.fullText.length > 200) {
    logger.info(`[Early Exit] Document URL ${url} already exists in DB. Skipping.`);
    return;
  }

  // 2. Extract title (always visible on load)
  const title = await page.$eval('h1, [class*="title"], .doc-title', (el: HTMLElement) =>
    el.textContent?.trim() || ''
  ).catch(() => '');

  // 3. Extract content HTML and full text BEFORE clicking any other tabs (which hides the text)
  const contentData = await page.evaluate(() => {
    const selectors = [
      '#divToanVan',
      '.preview-content',
      '.fullText',
      '.toanvan',
      'article',
      '[class*="content"]',
      '.content'
    ];
    
    let bestElement = null;
    let maxLen = 0;
    
    for (const selector of selectors) {
      const els = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
      for (const el of els) {
        const text = el.innerText || '';
        if (text.trim().length > maxLen) {
          maxLen = text.trim().length;
          bestElement = el;
        }
      }
    }
    
    if (bestElement) {
      return {
        html: bestElement.innerHTML || '',
        text: bestElement.innerText || ''
      };
    }
    return null;
  }).catch(() => null);

  const contentHtml = contentData?.html || '';
  const fullTextPlain = contentData?.text || '';

  // 4. Extract metadata attributes by clicking "Thuộc tính" tab
  const metadata = await extractMetadata(page);

  // 5. Secondary early exit check by documentNumber
  if (metadata.documentNumber) {
    const normNumber = metadata.documentNumber.replace(/\s+/g, '').toUpperCase();
    const existing = await prisma.canonicalDocument.findFirst({
      where: { normalizedNumber: normNumber }
    });
    if (existing && existing.fullText && existing.fullText.length > 200) {
      logger.info(`[Early Exit] Document ${metadata.documentNumber} already exists in DB with full text. Skipping.`);
      return;
    }
  }

  // 6. Extract Lược đồ relationships if enabled
  const relations: Array<{ targetDocNumber: string; relationType: string; targetUrl?: string }> = [];

  if (harvestRelations) {
    try {
      const luocDoTab = await page.$('a:has-text("Lược đồ"), button:has-text("Lược đồ"), [role="tab"]:has-text("Lược đồ")');
      if (luocDoTab) {
        await luocDoTab.click();
        await page.waitForTimeout(2000);

        const relationItems = await page.$$eval(
          'table tr, [class*="luocDo"] a, [class*="relation"] a',
          (els: HTMLElement[]) => {
            return els.map(el => ({
              text: el.textContent?.trim() || '',
              url: (el as HTMLAnchorElement).href || ''
            }));
          }
        );

        for (const item of relationItems) {
          if (!item.text) continue;
          let relType = 'LIEN_QUAN';
          if (item.text.includes('Căn cứ')) relType = 'CAN_CU';
          else if (item.text.includes('Sửa đổi') || item.text.includes('Bổ sung')) relType = 'SUA_DOI';
          else if (item.text.includes('Thay thế')) relType = 'THAY_THE';
          else if (item.text.includes('Bãi bỏ')) relType = 'BAI_BO';
          else if (item.text.includes('Hướng dẫn')) relType = 'HUONG_DAN';

          const docNumMatch = item.text.match(/Số\s*\:\s*([^\s,;]+|\S+\/\S+)/i) || item.text.match(/(\d+[\d\/\-A-Z]+)/i);
          const targetDocNumber = docNumMatch ? docNumMatch[1] : item.text.substring(0, 50);

          relations.push({
            targetDocNumber,
            relationType: relType,
            targetUrl: item.url.includes('/van-ban/chi-tiet/') ? item.url : undefined
          });

          // Enqueue related doc for full-text crawl if url present
          if (item.url && item.url.includes('/van-ban/chi-tiet/')) {
            await crawler.addRequests([{ url: item.url, label: 'DETAIL' }]);
          }
        }
      }
    } catch (err) {
      logger.warn(`Could not harvest Lược đồ relations for ${url}: ${(err as Error).message}`);
    }
  }

  const rawDoc = {
    source: 'vbpl.vn',
    url,
    title,
    metadata: {
      ...metadata,
      relationships: relations
    },
    contentHtml,
    fullText: fullTextPlain || contentHtml,
  };

  // Ingest into database
  try {
    await ingestDocument(rawDoc);
    logger.info(`Successfully ingested VBPL doc: ${metadata.documentNumber || title}`);
  } catch (err) {
    logger.error(`Failed to ingest document ${url}: ${(err as Error).message}`);
  }
}

/**
 * Extract metadata key-values from attributes section.
 */
async function extractMetadata(page: any) {
  const metadata: Record<string, any> = {};

  try {
    const attrTab = await page.$('a:has-text("Thuộc tính"), button:has-text("Thuộc tính"), [role="tab"]:has-text("Thuộc tính")');
    if (attrTab) {
      await attrTab.click();
      await page.waitForTimeout(1500);
    }

    const rows = await page.evaluate(() => {
      const list: Array<{ label: string; value: string }> = [];
      
      // Try Ant Design Descriptions pattern first
      const antLabels = Array.from(document.querySelectorAll('.ant-descriptions-item-label')) as HTMLElement[];
      const antContents = Array.from(document.querySelectorAll('.ant-descriptions-item-content')) as HTMLElement[];
      
      if (antLabels.length > 0 && antLabels.length === antContents.length) {
        for (let i = 0; i < antLabels.length; i++) {
          list.push({
            label: antLabels[i].innerText?.trim() || '',
            value: antContents[i].innerText?.trim() || '',
          });
        }
      } else {
        // Fallback to traditional table structure
        const trs = Array.from(document.querySelectorAll('table tr')) as HTMLTableRowElement[];
        for (const tr of trs) {
          const cells = Array.from(tr.querySelectorAll('td, th')) as HTMLElement[];
          if (cells.length >= 2) {
            list.push({
              label: cells[0].innerText?.trim() || '',
              value: cells[1].innerText?.trim() || '',
            });
          }
        }
      }
      return list;
    });

    for (const row of rows) {
      const k = row.label.toLowerCase();
      if (k.includes('số hiệu') || k.includes('số/ký hiệu')) metadata.documentNumber = row.value;
      else if (k.includes('loại văn bản')) metadata.documentType = row.value;
      else if (k.includes('cơ quan ban hành')) metadata.issuingBody = row.value;
      else if (k.includes('người ký')) metadata.signer = row.value;
      else if (k.includes('ngày ban hành')) metadata.promulgationDate = row.value;
      else if (k.includes('ngày có hiệu lực') || k.includes('ngày hiệu lực')) metadata.effectiveDate = row.value;
      else if (k.includes('ngày hết hiệu lực')) metadata.expiryDate = row.value;
      else if (k.includes('số công báo')) metadata.gazetteNumber = row.value;
      else if (k.includes('ngày đăng công báo')) metadata.gazetteDate = row.value;
      else if (k.includes('tình trạng hiệu lực') || k.includes('trạng thái hiệu lực')) {
        metadata.validityStatus = row.value;
        // Sometimes detail is appended, check for detailed status
        if (row.value.includes('Hết hiệu lực') || row.value.includes('Còn hiệu lực')) {
          metadata.preciseValidityStatus = row.value;
        }
      }
      else if (k.includes('lĩnh vực') || k.includes('ngành')) metadata.field = row.value;
      else if (k.includes('trích yếu')) metadata.trichYeu = row.value;
    }
  } catch (err) {
    logger.warn(`Failed metadata extraction: ${(err as Error).message}`);
  }

  return metadata;
}

const cp1252Map: { [key: number]: number } = {
  8364: 0x80, // €
  8218: 0x82, // ‚
  402:  0x83, // ƒ
  8222: 0x84, // „
  8230: 0x85, // …
  8224: 0x86, // †
  8225: 0x87, // ‡
  710:  0x88, // ˆ
  8240: 0x89, // ‰
  352:  0x8A, // Š
  8249: 0x8B, // ‹
  338:  0x8C, // Œ
  381:  0x8E, // Ž
  8216: 0x91, // ‘
  8217: 0x92, // ’
  8220: 0x93, // “
  8221: 0x94, // ”
  8226: 0x95, // •
  8211: 0x96, // –
  8212: 0x97, // —
  732:  0x98, // ˜
  8482: 0x99, // ™
  353:  0x9A, // š
  8250: 0x9B, // ›
  339:  0x9C, // œ
  382:  0x9E, // ž
  376:  0x9F, // Ÿ
};

function decodeDoubleEncodedUtf8(buffer: Buffer): string {
  const str = buffer.toString('utf8');
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (cp1252Map[code] !== undefined) {
      bytes[i] = cp1252Map[code];
    } else if (code < 256) {
      bytes[i] = code;
    } else {
      bytes[i] = 63; // '?'
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

function findItems(obj: any): any[] | null {
  if (!obj) return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const res = findItems(item);
      if (res) return res;
    }
  } else if (typeof obj === 'object') {
    if (obj.items && Array.isArray(obj.items)) {
      if (obj.items.length === 0 || (obj.items[0] && obj.items[0].id && obj.items[0].title)) {
        return obj.items;
      }
    }
    for (const key of Object.keys(obj)) {
      const res = findItems(obj[key]);
      if (res) return res;
    }
  }
  return null;
}

function slugify(text: string): string {
  const from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ";
  const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydD";
  
  let str = text.toString();
  for (let i = 0; i < from.length; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }
  
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
