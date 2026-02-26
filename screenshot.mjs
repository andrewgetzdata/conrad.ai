import puppeteer from 'puppeteer';
import { readdir, mkdir } from 'fs/promises';
import { join } from 'path';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const dir = './temporary screenshots';

await mkdir(dir, { recursive: true });

// Find next screenshot number
const files = await readdir(dir).catch(() => []);
const nums = files
  .filter(f => f.startsWith('screenshot-') && f.endsWith('.png'))
  .map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0', 10));
const next = nums.length ? Math.max(...nums) + 1 : 1;

const filename = label
  ? `screenshot-${next}-${label}.png`
  : `screenshot-${next}.png`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

// Scroll through the page to trigger intersection observers / lazy loads
await page.evaluate(async () => {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const distance = 300;
  const scrollHeight = document.body.scrollHeight;
  for (let i = 0; i < scrollHeight; i += distance) {
    window.scrollBy(0, distance);
    await delay(100);
  }
  // Scroll back up slowly too, in case anything was missed
  for (let i = scrollHeight; i > 0; i -= distance) {
    window.scrollBy(0, -distance);
    await delay(50);
  }
  window.scrollTo(0, 0);
  await delay(500);
  // Force-reveal any remaining fade-up elements
  document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
  await delay(300);
});

await page.screenshot({ path: join(dir, filename), fullPage: true });
await browser.close();

console.log(`Saved: ${join(dir, filename)}`);
