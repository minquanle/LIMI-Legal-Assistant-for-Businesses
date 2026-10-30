import { PlaywrightCrawler, Dataset } from 'crawlee';
import { config } from '../../config.js';
import logger from '../../utils/logger.js';
import { downloadFile } from '../../core/crawler-factory.js';
import { enqueueOrRecordFailure } from '../../queue/ingestion-queue.js';
import { assertCrawlAllowed } from '../../utils/robots.js';

const BASE_URL = 'https://vbpl.vn';
const LIST_URL_CENTRAL = `${BASE_URL}/van-ban/trung-uong`;
const LIST_URL_LOCAL = `${BASE_URL}/van-ban/dia-phuong`;

/**
 * VBPL.vn Crawler Module
 * 
 * Uses PlaywrightCrawler because VBPL.vn is a Next.js SPA that
 * renders content client-side via JavaScript.
 * 
 * Strategy:
 *  1. Visit the document list page (trung-uong / dia-phuong)
 *  2. Extract document links and metadata from the list
 *  3. Follow each document detail page
 *  4. Extract full metadata, content HTML, and download links
 */
export async function runVbplCrawler(options?: {
  maxPages?: number;
  startPage?: number;
}) {
  const maxPages = options?.maxPages ?? 5;
  const startPage = options?.startPage ?? 1;

  if (!(await assertCrawlAllowed(LIST_URL_CENTRAL, 'vbpl'))) return;

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

    async requestHandler({ request, page, enqueueLinks }) {
      const url = request.url;
      const label = request.label || 'LIST';

      logger.info(`Processing [${label}]: ${url}`);

      // Wait for page content to fully render
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
        logger.warn(`Network idle timeout for ${url}, continuing...`);
      });

      if (label === 'LIST') {
        await handleListPage(page, url);
      } else if (label === 'DETAIL') {
        await handleDetailPage(page, url);
      }
    },

    failedRequestHandler({ request }, error) {
      logger.error(`Request failed: ${request.url}`, { error: error.message });
    },
  });

  // Build initial URLs for the list pages
  const startUrls = [];
  for (let p = startPage; p <= startPage + maxPages - 1; p++) {
    startUrls.push({
      url: `${LIST_URL_CENTRAL}?page=${p}`,
      label: 'LIST',
    });
  }

  logger.info(`Starting VBPL.vn crawler with ${startUrls.length} list pages`);
  await crawler.run(startUrls);
  logger.info('VBPL.vn crawler finished');
}

async function handleListPage(page: any, url: string) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(5000);

  const captured = (page as any).capturedDocuments || [];
  logger.info(`Captured ${captured.length} documents from network for ${url}`);

  const uniqueUrls: string[] = [];
  for (const item of captured) {
    const slug = slugify(item.title);
    const docUrl = `${BASE_URL}/van-ban/chi-tiet/${slug}--${item.id}`;
    if (!uniqueUrls.includes(docUrl)) {
      uniqueUrls.push(docUrl);
    }
  }

  logger.info(`Found ${uniqueUrls.length} document links on ${url}`);

  // Save to dataset for downstream processing
  for (const docUrl of uniqueUrls) {
    await Dataset.pushData({
      type: 'DOCUMENT_LINK',
      source: 'vbpl.vn',
      url: docUrl,
      discoveredAt: new Date().toISOString(),
    });
  }
}

/**
 * Handle a document detail page — extract metadata, full content, and download links.
 */
async function handleDetailPage(page: any, url: string) {
  // Wait for main content area to render
  await page.waitForSelector('[class*="content"], [class*="detail"], article', {
    timeout: 15000,
  }).catch(() => {
    logger.warn(`Could not find content on detail page ${url}`);
  });

  // Extract the main document title
  const title = await page.$eval('h1, [class*="title"]', (el: HTMLElement) =>
    el.textContent?.trim() || ''
  ).catch(() => '');

  // Extract content HTML and full text using a robust selector mapping that finds the container with most text (to avoid empty wrapper elements)
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
        // innerText preserves newlines between block elements
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
  const fullText = contentData?.text || '';

  // Extract metadata from the attributes section
  const metadata = await extractMetadata(page);

  // Find download links (PDF, DOC)
  const downloadLinks = await page.$$eval(
    'a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[download]',
    (anchors: HTMLAnchorElement[]) =>
      anchors.map((a) => ({
        url: a.href,
        filename: a.download || a.textContent?.trim() || '',
      }))
  );

  const rawDoc = {
    type: 'RAW_DOCUMENT',
    source: 'vbpl.vn',
    url,
    title,
    metadata,
    contentHtml,
    fullText,
    downloadLinks,
    crawledAt: new Date().toISOString(),
  };

  await Dataset.pushData(rawDoc);
  await enqueueOrRecordFailure(rawDoc);

  logger.info(`Extracted document: ${title || url}`);
}

async function extractMetadata(page: any) {
  const metadata: Record<string, string> = {};

  try {
    // Try to click the "Thuộc tính" tab first
    const attrTab = await page.$('button:has-text("Thuộc tính"), [role="tab"]:has-text("Thuộc tính")');
    if (attrTab) {
      await attrTab.click();
      await page.waitForTimeout(2000);
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
      const key = row.label.toLowerCase();
      if (key.includes('số hiệu') || key.includes('số/ký hiệu')) {
        metadata.documentNumber = row.value;
      } else if (key.includes('loại văn bản')) {
        metadata.documentType = row.value;
      } else if (key.includes('cơ quan ban hành')) {
        metadata.issuingBody = row.value;
      } else if (key.includes('người ký')) {
        metadata.signer = row.value;
      } else if (key.includes('ngày ban hành')) {
        metadata.promulgationDate = row.value;
      } else if (key.includes('ngày có hiệu lực') || key.includes('ngày hiệu lực')) {
        metadata.effectiveDate = row.value;
      } else if (key.includes('tình trạng hiệu lực') || key.includes('trạng thái')) {
        metadata.validityStatus = row.value;
      } else if (key.includes('lĩnh vực') || key.includes('ngành')) {
        metadata.field = row.value;
      }
    }
  } catch (err) {
    logger.warn(`Failed to extract metadata: ${(err as Error).message}`);
  }

  return metadata;
}

// Run directly if executed as main
const isMain = process.argv[1]?.includes('vbpl');
if (isMain) {
  runVbplCrawler({ maxPages: 3 })
    .then(() => logger.info('VBPL crawl complete'))
    .catch((err) => logger.error('VBPL crawl failed', { error: err.message }));
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
