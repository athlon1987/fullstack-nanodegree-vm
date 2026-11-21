import { chromium, devices } from '@playwright/test';
const [BASE, path = '/en/kul/transport'] = process.argv.slice(2);
const browser = await chromium.launch();
for (let r = 0; r < 3; r++) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, userAgent: devices['Pixel 7'].userAgent, extraHTTPHeaders: { 'x-e2e-client-ip': `10.55.${r}.${Math.floor(Math.random() * 200)}` } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.__s = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__s.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).map((s) => { const n = s.node; const l = n && n.nodeType === 1 ? `${n.tagName.toLowerCase()}.${String(n.className).split(' ').slice(0, 3).join('.')} "${(n.textContent || '').trim().slice(0, 30)}"` : n ? `#text "${n.textContent.trim().slice(0, 30)}"` : '?'; return `${l} ${Math.round(s.previousRect.x)},${Math.round(s.previousRect.y)},${Math.round(s.previousRect.width)}x${Math.round(s.previousRect.height)} -> ${Math.round(s.currentRect.x)},${Math.round(s.currentRect.y)},${Math.round(s.currentRect.width)}x${Math.round(s.currentRect.height)}`; }) });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(BASE + path, { waitUntil: 'load' });
  await page.waitForTimeout(4000);
  const s = await page.evaluate(() => window.__s);
  console.log(JSON.stringify({ run: r, total: +s.reduce((a, e) => a + e.v, 0).toFixed(4), s }));
  await ctx.close();
}
await browser.close();
