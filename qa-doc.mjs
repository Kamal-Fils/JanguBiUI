import { chromium } from 'playwright';
const BASE = 'http://localhost:3000';
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
page.setDefaultTimeout(15000);
await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
await page.fill('input[type="email"]', 'aminata.fall@jangubidev.sn');
await page.fill('input[type="password"]', 'Jangu2024!');
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2000);
await page.evaluate(() => localStorage.setItem('theme', 'dark'));
for (const [w, h, tag] of [[390, 844, 'mobile'], [1440, 900, 'desktop']]) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`${BASE}/app/documents`, { waitUntil: 'domcontentloaded' });
  // wait until the real cards render (not skeleton): look for a status badge text
  await page.waitForSelector('text=/Soumis|En vérification|Infos requises|Validé|Document/', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: `/tmp/qa/doc2-${tag}.png`, fullPage: false });
}
console.log('done');
await browser.close();
