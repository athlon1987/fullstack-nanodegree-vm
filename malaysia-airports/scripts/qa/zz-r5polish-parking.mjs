import { chromium, devices } from '@playwright/test';
const BASE = process.argv[2];
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, extraHTTPHeaders: { 'x-e2e-client-ip': '10.77.1.' + Math.floor(Math.random() * 200) } });
const page = await ctx.newPage();
await page.goto(BASE + '/en/kul/parking', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const r = await page.evaluate(() => {
  const main = document.querySelector('main');
  const vis = (e) => e.getBoundingClientRect().height > 0;
  const where = (e) => { const s = e.closest('section'); return s ? (s.getAttribute('aria-labelledby') || s.dataset.parkingMatrix || '?') : '?'; };
  return {
    tags: [...main.querySelectorAll('[data-provenance]')].filter(vis).map((e) => `${where(e)}: ${e.dataset.provenance} "${e.textContent.trim()}"`),
    toggles: [...main.querySelectorAll('[data-source-marker]')].filter(vis).map((e) => `${where(e)}: "${e.textContent.trim()}"`),
    chips: [...main.querySelectorAll('span.min-h-chip.rounded-sm')].filter(vis).map((e) => `${where(e)}: "${e.textContent.trim().slice(0, 40)}"`),
    banners: [...main.querySelectorAll('[data-demo-banner],[data-provenance-default]')].filter(vis).map((e) => `${where(e)}: "${e.textContent.trim().slice(0, 80)}"`),
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
