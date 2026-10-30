import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const output=fileURLToPath(new URL('../../outputs/B4-browser/',import.meta.url));await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3000/library');await page.getByText('110 văn bản · Trang 1',{exact:true}).waitFor();assert.ok(page.url().includes('/workspace?'));
  await page.screenshot({path:output+'library-desktop.png',fullPage:true});await page.getByLabel('Phạm vi').selectOption('HUNG_YEN');await page.getByRole('button',{name:'Tìm văn bản'}).click();
  await page.waitForURL('**scope=HUNG_YEN**');await page.getByText('6 văn bản · Trang 1',{exact:true}).waitFor();
  await page.goto('http://127.0.0.1:3000/library/LIMI-SEED-060');await page.getByText(/Nội dung được nhận dạng bằng OCR/).waitFor();
  await page.screenshot({path:output+'tt12-ocr-desktop.png',fullPage:false});await page.getByRole('link',{name:/^Điều /}).first().click();await page.getByRole('heading',{name:'Trích dẫn đã chọn'}).waitFor();
  await page.goBack();await page.getByRole('heading',{name:'Toàn văn',exact:true}).waitFor();await page.goForward();await page.getByRole('heading',{name:'Trích dẫn đã chọn'}).waitFor();
  await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:3000/library');await page.getByText('110 văn bản · Trang 1',{exact:true}).waitFor();await page.screenshot({path:output+'library-mobile.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
  await page.goto('http://127.0.0.1:3000/library/LIMI-SEED-003');const href=await page.locator('a[href*="/attachments/"]').first().getAttribute('href');
  const file=await page.request.get(`http://127.0.0.1:3000${href}`);assert.equal(file.status(),200);assert.ok(file.headers()['content-disposition']?.startsWith('attachment;'));
  // Hosted workspace now authenticates real companies (B5–B7). Legacy sample
  // navigation is verified only on the separate static demo, never in a real account.
  await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:3000/prototype/index.html');await page.locator('details summary').click();await page.locator('[data-sample="DEMO-001"]').click();
  await page.locator('[data-next="questions"]').click();await page.locator('#questions-form button[type="submit"]').click();await page.locator('#topics-form button[type="submit"]').click();
  await page.locator('.sidebar').waitFor();await page.screenshot({path:output+'prototype-dashboard.png',fullPage:true});
  await page.locator('.side-nav [data-nav="laws"]').click();await page.getByText('110 văn bản · Trang 1',{exact:true}).waitFor();
  await page.locator('.side-nav [data-nav="profile"]').click();assert.ok((await page.locator('main').innerText()).includes('Hồ sơ doanh nghiệp'));
  await page.locator('.side-nav [data-nav="checklist"]').click();await page.locator('[data-detail]').first().click();await page.getByRole('dialog').waitFor();
  const basis=page.locator('[data-find-law]').first();if(await basis.count()){await basis.click();await page.locator('.real-list-summary').waitFor();assert.ok(page.url().includes('q='));}else await page.keyboard.press('Escape');
  await page.locator('.side-nav [data-nav="alerts"]').click();await page.locator('[data-library-tab="library"]').click();await page.getByText('110 văn bản · Trang 1',{exact:true}).waitFor();
  await page.reload();await page.getByText('110 văn bản · Trang 1',{exact:true}).waitFor();assert.ok((await page.locator('.workspace-chip').innerText()).includes('An Phát'));
  await page.getByRole('link',{name:'Trang sau →'}).click();await page.getByText('110 văn bản · Trang 2',{exact:true}).waitFor();
  await page.route('**/api/legal/**',route=>route.abort());await page.reload();await page.getByRole('button',{name:'Thử lại',exact:true}).waitFor();
  await page.unroute('**/api/legal/**');await page.getByRole('button',{name:'Thử lại',exact:true}).click();await page.getByText('110 văn bản · Trang 2',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);const report={status:'passed',unifiedPrototypeShell:true,originalOnboarding:true,profileAndChecklistNavigation:true,taskBasisLibrarySearch:true,legacyLibraryEntryIntegrated:true,profileRetainedAfterReload:true,library:true,pagination:true,networkFailureRetry:true,backForwardCitation:true,hungYenFilter:true,ocrWarning:true,stableCitationNavigation:true,privateDownloadProxy:true,mobileNoOverflow:true,browserErrors:errors};
  await writeFile(fileURLToPath(new URL('../../outputs/B4-browser-verification.json',import.meta.url)),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
