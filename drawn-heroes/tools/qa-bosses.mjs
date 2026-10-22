// Visual QA: watch the AI pair fight through key moments of each stage and screenshot them.
import { chromium } from 'playwright';
const url = process.argv[2];
const out = process.argv[3];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url);
await page.waitForSelector('[data-act="new"]');
const all = [
  [0, 0, 120, 'meadow-start', 9000],
  [1, 2, 1700, 'canyon-roller', 9000],
  [2, 2, 1500, 'city-cars', 9000],
  [3, 0, 1300, 'factory-hazards', 8000],
  [4, 0, 300, 'tower-rain', 9000],
  [0, -1, -1, 'boss-bigscribbler', 9000],
  [1, -1, -1, 'boss-thornback', 9000],
  [2, -1, -1, 'boss-highlighter', 9000],
  [3, -1, -1, 'boss-golem', 9000],
  [4, -1, -1, 'boss-king', 9000],
];
const shots = process.env.BOSSES ? all.slice(5) : all;
for (const [stage, ev, x, name, wait] of shots) {
  await page.evaluate(([s, e, xx]) => window.__inkrush.demo(s, e, xx), [stage, ev, x]);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/b-${name}.png` });
}
console.log('errors:', JSON.stringify(errors));
await browser.close();
