import { PlaywrightCrawler } from 'crawlee';
import { handleDetailPage } from '../src/services/vbpl-daily-service.js';
import { PrismaClient } from '@prisma/client';
import logger from '../src/utils/logger.js';

const prisma = new PrismaClient();
const testUrl = "https://vbpl.vn/van-ban/chi-tiet/quyet-dinh-so-23-2026-qd-ubnd-ban-hanh-dinh-muc-kinh-te-ky-thuat-xay-dung-co-so-du-lieu-dat-dai-tren-dia-ban-tinh-da-k-la-k--187456";

async function main() {
  logger.info("🧹 Cleaning up existing document from DB to test crawl...");
  
  // 1. Delete existing document by exact ID
  const targetId = "a97af45a-bd57-49fb-9bcb-c2546f704751";
  const oldDoc = await prisma.canonicalDocument.findUnique({
    where: { id: targetId }
  });

  if (oldDoc) {
    logger.info(`Found old doc: ${oldDoc.documentNumber} (${oldDoc.id}). Deleting...`);
    await prisma.canonicalDocument.delete({ where: { id: oldDoc.id } });
    logger.info("Deleted successfully.");
  } else {
    // Try to delete by URL just in case
    const source = await prisma.documentSource.findFirst({
      where: { site: 'VBPL', url: testUrl }
    });
    if (source) {
      logger.info(`Found source link. Deleting associated doc: ${source.documentId}`);
      await prisma.canonicalDocument.delete({ where: { id: source.documentId } });
      logger.info("Deleted successfully.");
    }
  }

  // 2. Setup Playwright Crawler to scrape the target URL
  const crawler = new PlaywrightCrawler({
    maxConcurrency: 1,
    headless: true,
    launchContext: {
      launchOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
        ],
      },
    },
    async requestHandler({ request, page }) {
      logger.info(`Crawling target: ${request.url}`);
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await handleDetailPage(page, request.url, true, crawler);
    }
  });

  logger.info("🚀 Starting Crawler for single document...");
  await crawler.run([{ url: testUrl }]);
  logger.info("Crawler finished.");

  // 3. Verify Database
  const source = await prisma.documentSource.findFirst({
    where: { site: 'VBPL', url: testUrl },
    include: { document: { include: { sources: true } } }
  });
  const newDoc = source?.document;

  if (newDoc) {
    logger.info("======================================");
    logger.info("VERIFICATION SUCCESS:");
    logger.info(`ID: ${newDoc.id}`);
    logger.info(`Number: ${newDoc.documentNumber}`);
    logger.info(`Title: ${newDoc.title.substring(0, 100)}...`);
    logger.info(`Expiry Date: ${newDoc.expiryDate}`);
    logger.info(`Gazette Number: ${newDoc.gazetteNumber}`);
    logger.info(`Gazette Date: ${newDoc.gazetteDate}`);
    logger.info(`Precise Status: ${newDoc.preciseValidityStatus}`);
    logger.info(`Sources Count: ${newDoc.sources.length}`);
    if (newDoc.sources[0]) {
      logger.info(`Source site: ${newDoc.sources[0].site}`);
      logger.info(`Source url: ${newDoc.sources[0].url}`);
      logger.info(`Source rawHtml: ${newDoc.sources[0].rawHtml}`);
    }
    logger.info("======================================");
  } else {
    logger.error("VERIFICATION FAILED: New document not found in DB.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
