import * as fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('f:/workspace/tinix-legal/packages/crawler/src/parsers/metadata-panel.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== CELL HTML STRUCTURE ===');
$('table tr').each((i, tr) => {
  console.log(`Row ${i}:`);
  $(tr).find('td, th').each((j, td) => {
    console.log(`  Cell ${j}: HTML="${$(td).html()?.replace(/\n/g, '\\n')}"`);
    console.log(`  Cell ${j}: textContent="${$(td).text().trim()}"`);
  });
});
