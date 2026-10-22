// Smoke test: open the built game, go through the menus, play a little, screenshot.
import { chromium } from 'playwright';
const url = process.argv[2];
const out = process.argv[3];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url);
await page.waitForSelector('[data-act="new"]', { timeout: 15000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/01-title.png` });
await page.click('[data-act="new"]');
await page.click('[data-act="solo"]');
await page.screenshot({ path: `${out}/02-heroselect.png` });
await page.click('[data-act="pickMomo"]');
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/03-story.png` });
await page.click('[data-act="skip"]');
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/04-stagecard.png` });
await page.waitForTimeout(2000);
await page.screenshot({ path: `${out}/05-dialogue.png` });
for (let i = 0; i < 6; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(120); }
await page.keyboard.down('KeyD');
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/06-walk.png` });
for (let i = 0; i < 30; i++) { await page.keyboard.press('KeyJ'); await page.waitForTimeout(90); }
await page.screenshot({ path: `${out}/07-fight.png` });
await page.keyboard.up('KeyD');
for (let i = 0; i < 40; i++) { await page.keyboard.press(i % 5 === 4 ? 'KeyK' : 'KeyJ'); await page.waitForTimeout(100); }
await page.screenshot({ path: `${out}/08-fight2.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/09-pause.png` });
console.log('errors:', JSON.stringify(errors, null, 1));
await browser.close();
