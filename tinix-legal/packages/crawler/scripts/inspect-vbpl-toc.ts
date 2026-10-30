import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const testUrl = "https://vbpl.vn/van-ban/chi-tiet/luat-quan-ly-ngoai-thuong-so-05-2017-qh14--123028";
  
  console.log(`Navigating to Law: ${testUrl}`);
  await page.goto(testUrl, { waitUntil: 'networkidle' });
  
  const results = await page.evaluate(() => {
    const list: string[] = [];
    
    // Check if there is an elements with text "Mục lục"
    const els = Array.from(document.querySelectorAll('*')) as HTMLElement[];
    for (const el of els) {
      // Find element with text "Mục lục"
      if (el.children.length === 0 && el.innerText && el.innerText.trim() === 'Mục lục') {
        list.push(`Found text 'Mục lục' in tag ${el.tagName} - class: ${el.className} - parent tag: ${el.parentElement?.tagName}`);
      }
    }
    
    // Look for sidebars or trees
    const tree = document.querySelector('[class*="tree"], [id*="tree"], [class*="menu"], [class*="navigation"]');
    if (tree) {
      list.push(`Tree/Menu Element found: ${tree.tagName} - class: ${tree.className} - text: ${tree.textContent?.substring(0, 100).replace(/\s+/g, ' ')}`);
    }

    // List all anchors starting with "#"
    const anchors = Array.from(document.querySelectorAll('a[href^="#"]')) as HTMLAnchorElement[];
    list.push(`Found ${anchors.length} hash anchors.`);
    anchors.slice(0, 10).forEach(a => {
      list.push(`  href: ${a.getAttribute('href')} - text: ${a.innerText.trim()}`);
    });
    
    return list;
  });
  
  console.log(results.join('\n'));
  
  await browser.close();
}

run();
