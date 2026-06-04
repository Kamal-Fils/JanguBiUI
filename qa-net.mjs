import { chromium } from 'playwright';
const BASE = 'http://localhost:3000';
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
page.setDefaultTimeout(15000);

const hits = [];
page.on('response', async (res) => {
  const u = res.url();
  if (u.includes('/v1/users/') || u.includes('/users/')) {
    let body = '';
    try { body = (await res.text()).slice(0, 400); } catch {}
    hits.push({ url: u, status: res.status(), body });
  }
});

await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
await page.fill('input[type="email"]', 'admin@jangubidev.sn');
await page.fill('input[type="password"]', 'Jangu2024!');
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.goto(`${BASE}/app/admin/users`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

console.log(JSON.stringify(hits, null, 2));
await browser.close();
