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
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/app/documents`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('text=/Soumis|vérification|Infos|baptême/', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(800);

const report = await page.evaluate(() => {
  const vw = window.innerWidth;
  const offenders = [];
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 && r.width > 50) {
      offenders.push({
        tag: el.tagName,
        cls: (el.className?.toString?.() || '').slice(0, 90),
        right: Math.round(r.right),
        width: Math.round(r.width),
        text: (el.textContent || '').trim().slice(0, 40),
      });
    }
  });
  // sort by right desc, dedup-ish
  offenders.sort((a, b) => b.right - a.right);
  // find a document card to print its html
  const card = document.querySelector('a[href*="/app/documents/"]');
  return {
    vw,
    docScrollWidth: document.documentElement.scrollWidth,
    offenders: offenders.slice(0, 8),
    cardHtml: card ? card.outerHTML.slice(0, 600) : 'NO CARD',
  };
});
console.log(JSON.stringify(report, null, 2));
await browser.close();
