import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const OUT = '/tmp/qa';
mkdirSync(OUT, { recursive: true });

const EMAIL = process.env.QA_EMAIL || 'aminata.fall@jangubidev.sn';
const PASSWORD = 'Jangu2024!';
const TAG = process.env.QA_TAG || 'fidele';

// fidèle-accessible refonte surfaces
const ROUTES = (process.env.QA_ROUTES
  ? JSON.parse(process.env.QA_ROUTES)
  : [
      ['home', '/app'],
      ['actus', '/app/actus'],
      ['spirituel', '/app/spirituel'],
      ['liturgie', '/app/spirituel/liturgie'],
      ['documents', '/app/documents'],
      ['intentions', '/app/intentions'],
      ['transfert', '/app/transfert'],
      ['messages', '/app/messages'],
      ['profil', '/app/profil'],
    ]);

const BPS = [
  ['mobile', 390, 844],
  ['desktop', 1440, 900],
];
const THEMES = ['light', 'dark'];

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.setDefaultTimeout(15000);

// --- login ---
await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASSWORD);
await Promise.all([
  page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 20000 }).catch(() => {}),
  page.click('button[type="submit"]'),
]);
await page.waitForTimeout(2000);
const after = page.url();
console.log(`[${TAG}] post-login url: ${after}`);
if (after.includes('/auth/')) {
  console.log(`[${TAG}] LOGIN FAILED — capturing login page only`);
}

const results = [];
for (const [bpName, w, h] of BPS) {
  await page.setViewportSize({ width: w, height: h });
  for (const theme of THEMES) {
    await page.evaluate((t) => localStorage.setItem('theme', t), theme);
    for (const [name, route] of ROUTES) {
      const file = `${OUT}/${TAG}-${bpName}-${theme}-${name}.png`;
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1600);
        await page.screenshot({ path: file, fullPage: true });
        results.push(file);
      } catch (e) {
        console.log(`  FAIL ${name} ${bpName} ${theme}: ${e.message}`);
      }
    }
  }
}
console.log(`[${TAG}] captured ${results.length} screenshots`);
await browser.close();
