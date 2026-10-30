import { chromium } from 'playwright';
import * as fs from 'fs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  
  const url = 'https://vbpl.vn/van-ban/chi-tiet/quyet-dinh-so-20-2026-qd-ubnd-quy-dinh-ve-mien-giam-gia-dich-vu-su-dung-pha-dong-bai-cai-vieng--187519';
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  
  // Click the Thuộc tính tab
  const attrTab = await page.$('a:has-text("Thuộc tính"), button:has-text("Thuộc tính"), [role="tab"]:has-text("Thuộc tính")');
  if (attrTab) {
    console.log('Clicking "Thuộc tính" tab...');
    await attrTab.click();
    await page.waitForTimeout(2000);
  } else {
    console.log('Could not find "Thuộc tính" tab!');
  }
  
  // Get all panels/content
  const panels = await page.$$('.ant-tabs-tabpane');
  console.log(`Found ${panels.length} panels`);
  
  for (let i = 0; i < panels.length; i++) {
    const isActive = await panels[i].evaluate(el => el.classList.contains('ant-tabs-tabpane-active'));
    const id = await panels[i].evaluate(el => el.id);
    console.log(`Panel ${i}: id="${id}" active=${isActive}`);
    if (isActive) {
      const html = await panels[i].evaluate(el => el.innerHTML);
      console.log(`Active panel HTML length: ${html.length}`);
      fs.writeFileSync('f:/workspace/tinix-legal/packages/crawler/src/parsers/metadata-panel.html', html, 'utf8');
      
      // Let's print table structures
      const tablesCount = await panels[i].$$eval('table', els => els.length);
      console.log(`Tables in active panel: ${tablesCount}`);
      
      const rows = await panels[i].$$eval('table tr', trs => {
        return trs.map((tr, idx) => {
          const cells = Array.from(tr.querySelectorAll('td, th'));
          return `${idx}: [${cells.map(c => c.textContent?.trim()).join(' | ')}]`;
        });
      });
      console.log('Rows found:');
      rows.forEach(r => console.log(`  ${r}`));
    }
  }
  
  await browser.close();
}

main().catch(console.error);
