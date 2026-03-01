import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const url = process.argv[2] || 'http://localhost:3000';
const dir = './temporary screenshots';
await mkdir(dir, { recursive: true });

const devices = [
  { name: 'iphone-se',           width: 375,  height: 667  },
  { name: 'iphone-14',           width: 390,  height: 844  },
  { name: 'iphone-14-pro-max',   width: 430,  height: 932  },
  { name: 'ipad-mini',           width: 768,  height: 1024 },
  { name: 'ipad-pro-11',         width: 834,  height: 1194 },
  { name: 'desktop-1440',        width: 1440, height: 900  },
];

const browser = await chromium.launch({ headless: true });

for (const device of devices) {
  const context = await browser.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });

  // Scroll through to trigger intersection observers / lazy loads
  await page.evaluate(async () => {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const distance = 300;
    const scrollHeight = document.body.scrollHeight;
    for (let i = 0; i < scrollHeight; i += distance) {
      window.scrollBy(0, distance);
      await delay(100);
    }
    window.scrollTo(0, 0);
    await delay(500);
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    await delay(300);
  });

  const filename = `mobile-${device.name}-${device.width}x${device.height}.png`;
  await page.screenshot({ path: join(dir, filename), fullPage: true });
  console.log(`Saved: ${filename}`);
  await context.close();
}

await browser.close();
console.log('\nAll screenshots saved to ./temporary screenshots/');
