// Mobile checks: touch layout, simultaneous move + attack, rotation, pause on blur.
import { chromium, devices } from 'playwright';
const url = process.argv[2];
const out = process.argv[3];
const browser = await chromium.launch();
const results = [];
const check = (name, ok, extra = '') => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

async function run(deviceName, landscape) {
  const d = devices[deviceName];
  const vp = landscape ? { width: d.viewport.height, height: d.viewport.width } : d.viewport;
  const ctx = await browser.newContext({ ...d, viewport: vp, screen: vp });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await page.waitForSelector('[data-act="new"]');
  const tag = `${deviceName.replace(/\W+/g, '_')}-${landscape ? 'land' : 'port'}`;
  await page.screenshot({ path: `${out}/m-${tag}-title.png` });
  await page.tap('[data-act="new"]');
  await page.tap('[data-act="solo"]');
  await page.tap('[data-act="pickScout"]');
  await page.tap('[data-act="skip"]');
  await page.waitForTimeout(400);
  await page.tap('.card-intro').catch(() => {});
  for (let i = 0; i < 12; i++) {
    const has = await page.$('.dialogue');
    if (!has) break;
    await page.tap('.dialogue .line');
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(300);
  const touchVisible = await page.$eval('#touch', (e) => !e.hidden);
  check(`${tag}: touch controls shown`, touchVisible);
  // every button inside the viewport
  const boxes = await page.$$eval('.tbtn', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return { n: e.className, l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width }; }));
  const W = vp.width, H = vp.height;
  const clipped = boxes.filter((b) => b.l < 0 || b.t < 0 || b.r > W || b.b > H);
  check(`${tag}: ${boxes.length} buttons on screen`, clipped.length === 0, clipped.map((c) => c.n).join(','));
  check(`${tag}: buttons big enough for thumbs`, boxes.every((b) => b.w >= 36), boxes.map((b) => Math.round(b.w)).join('/'));
  // simultaneous move + attack via raw multi-touch
  const cdp = await ctx.newCDPSession(page);
  const hit = boxes.find((b) => b.n.includes('light'));
  const hx = (hit.l + hit.r) / 2, hy = (hit.t + hit.b) / 2;
  const sx = W * 0.15, sy = H * 0.8;
  const x0 = await page.evaluate(() => window.__inkrush.world.heroes.find((h) => h.controller === 'p1').x);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy, id: 1 }] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx + i * 8, y: sy, id: 1 }] });
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(500);
  const xMoved = await page.evaluate(() => window.__inkrush.world.heroes.find((h) => h.controller === 'p1').x);
  let attacked = false;
  for (let k = 0; k < 8; k++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx + 80, y: sy, id: 1 }, { x: hx, y: hy, id: 2 }] });
    await page.waitForTimeout(60);
    const st = await page.evaluate(() => window.__inkrush.world.heroes.find((h) => h.controller === 'p1').state);
    if (st === 'attack') attacked = true;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: sx + 80, y: sy, id: 1 }] });
    await page.waitForTimeout(60);
  }
  // keep moving with only the stick
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx + 80, y: sy, id: 1 }] });
  await page.waitForTimeout(600);
  const x1 = await page.evaluate(() => window.__inkrush.world.heroes.find((h) => h.controller === 'p1').x);
  await page.screenshot({ path: `${out}/m-${tag}-play.png` });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  check(`${tag}: stick moves the hero`, xMoved > x0 + 40, `${x0.toFixed(0)} → ${xMoved.toFixed(0)} (after attacks ${x1.toFixed(0)})`);
  check(`${tag}: attack while holding the stick`, attacked);
  // page must not scroll
  const scroll = await page.evaluate(() => [window.scrollX, window.scrollY, document.documentElement.scrollWidth <= window.innerWidth + 1]);
  check(`${tag}: no page scroll`, scroll[0] === 0 && scroll[1] === 0 && scroll[2], JSON.stringify(scroll));
  // canvas inside viewport
  const cv = await page.$eval('#game', (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; });
  check(`${tag}: game view fits`, cv[0] >= -1 && cv[1] >= -1 && cv[2] <= W + 1 && cv[3] <= H + 1, cv.map(Math.round).join(','));
  // pause via button, resume
  await page.tap('.pause-btn');
  await page.waitForTimeout(150);
  check(`${tag}: pause button`, await page.evaluate(() => window.__inkrush.paused));
  await page.tap('[data-act="resume"]');
  await page.waitForTimeout(150);
  check(`${tag}: resume`, !(await page.evaluate(() => window.__inkrush.paused)));
  // backgrounding pauses safely
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(100);
  check(`${tag}: pauses when focus is lost`, await page.evaluate(() => window.__inkrush.paused));
  // rotate
  await page.setViewportSize({ width: vp.height, height: vp.width });
  await page.waitForTimeout(400);
  const cv2 = await page.$eval('#game', (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; });
  check(`${tag}: rotated layout fits`, cv2[2] <= vp.height + 1 && cv2[3] <= vp.width + 1, cv2.map(Math.round).join(','));
  await page.tap('[data-act="resume"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/m-${tag}-rotated.png` });
  check(`${tag}: no errors`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

if (!process.env.ONLY) await run('iPhone 13', true);
if (!process.env.ONLY) await run('iPhone 13', false);
await run('Pixel 7', true);
if (!process.env.ONLY) await run('iPad Mini', true);
console.log(results.join('\n'));
await browser.close();
