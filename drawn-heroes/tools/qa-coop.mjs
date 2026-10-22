// Two players on one keyboard: each player's keys move only their hero.
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(process.argv[2]);
await page.waitForSelector('[data-act="new"]');
await page.click('[data-act="new"]');
await page.click('[data-act="coop"]');
await page.click('[data-act="skip"]');
await page.waitForTimeout(2600);
for (let i = 0; i < 6; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(100); }
const pos = () => page.evaluate(() => window.__inkrush.world.heroes.map((h) => [h.heroId, h.controller, Math.round(h.x), Math.round(h.z)]));
const a = await pos();
await page.keyboard.down('KeyD');
await page.waitForTimeout(700);
await page.keyboard.up('KeyD');
const b = await pos();
await page.keyboard.down('ArrowDown');
await page.waitForTimeout(700);
await page.keyboard.up('ArrowDown');
const c = await pos();
console.log(JSON.stringify({ a, b, c }));
const ok1 = b[0][2] > a[0][2] + 30 && Math.abs(b[1][2] - a[1][2]) < 5;
const ok2 = c[1][3] > b[1][3] + 20 && Math.abs(c[0][3] - b[0][3]) < 5;
console.log(ok1 ? 'PASS P1 keys move only Momo' : 'FAIL P1', ok2 ? 'PASS P2 keys move only Scout' : 'FAIL P2', 'errors', errors.length);
await browser.close();
