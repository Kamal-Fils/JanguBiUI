import { chromium } from 'playwright';
const BASE = 'http://localhost:3000';
const OUT = '/tmp/qa';

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.setDefaultTimeout(15000);

await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
await page.fill('input[type="email"]', 'aminata.fall@jangubidev.sn');
await page.fill('input[type="password"]', 'Jangu2024!');
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2500);
await page.evaluate(() => localStorage.setItem('theme', 'dark'));

// Identify the bottom-right fixed element (desktop)
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
const corner = await page.evaluate(() => {
  const el = document.elementFromPoint(window.innerWidth - 25, window.innerHeight - 25);
  const describe = (n) =>
    n
      ? {
          tag: n.tagName,
          id: n.id,
          cls: n.className?.toString?.().slice(0, 120),
          role: n.getAttribute?.('role'),
          aria: n.getAttribute?.('aria-label'),
          html: n.outerHTML?.slice(0, 200),
        }
      : null;
  let cur = el,
    chain = [];
  for (let i = 0; i < 4 && cur; i++) {
    chain.push(describe(cur));
    cur = cur.parentElement;
  }
  return chain;
});
console.log('BOTTOM-RIGHT CORNER CHAIN:\n', JSON.stringify(corner, null, 2));

// Re-capture mobile pages with a longer settle so data loads
await page.setViewportSize({ width: 390, height: 844 });
for (const [name, route] of [
  ['home', '/app'],
  ['documents', '/app/documents'],
  ['transfert', '/app/transfert'],
  ['actus', '/app/actus'],
]) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/probe-mobile-dark-${name}.png`, fullPage: false });
}
console.log('probe done');
await browser.close();
