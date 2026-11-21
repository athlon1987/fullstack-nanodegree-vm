#!/usr/bin/env node
/**
 * Layout shift on the home pages (A-10, E-02): loads /en and /ms in Chromium on a 390 x 844 phone, the
 * Pixel 7 profile (412 x 839) and a 1440 x 900 desktop, records every layout-shift entry without
 * recent input for 3.5 s after load, and prints the CLS of each load. With "verbose" it prints the
 * shifted nodes and their old and new positions.
 *
 * Usage: node scripts/qa/layout-shift.mjs [BASE_URL] [runs=3] [verbose]
 * Environment: CPU=4 slows the CPU 4x; with it, NET=1 adds a slow network (150 ms, 1.6 Mbit/s down).
 * Target: 0.1 or less (the brief); the home has measured 0 since round three.
 */
import { chromium, devices } from '@playwright/test';

const [baseArg, runsArg, verbose] = process.argv.slice(2);
const BASE = (baseArg || 'http://localhost:3100').replace(/\/$/, '');
const RUNS = Number(runsArg || 3);
const ip = () => `10.78.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

const cases = [];
for (const path of ['/en', '/ms']) {
  cases.push(['phone 390x844', { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } }, path]);
  cases.push(['Pixel 7 412x839', { ...devices['Pixel 7'] }, path]);
  cases.push(['desktop 1440x900', { viewport: { width: 1440, height: 900 } }, path]);
}

const browser = await chromium.launch();
let worst = 0;
for (const [name, opts, path] of cases) {
  const totals = [];
  let detail = null;
  for (let r = 0; r < RUNS; r++) {
    const ctx = await browser.newContext({ ...opts, extraHTTPHeaders: { 'x-e2e-client-ip': ip() } });
    const page = await ctx.newPage();
    if (process.env.CPU) {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU) });
      if (process.env.NET) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
    }
    await page.addInitScript(() => {
      window.__shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.hadRecentInput) continue;
          window.__shifts.push({
            v: +e.value.toFixed(4),
            t: Math.round(e.startTime),
            src: (e.sources || []).map((s) => {
              const n = s.node;
              const label = n && n.nodeType === 1
                ? `${n.tagName.toLowerCase()}${typeof n.className === 'string' && n.className ? `.${n.className.split(' ').slice(0, 4).join('.')}` : ''} "${(n.textContent || '').trim().slice(0, 40)}"`
                : n ? `#text "${n.textContent.trim().slice(0, 40)}"` : '?';
              return `${label} y,h ${JSON.stringify([s.previousRect.y, s.previousRect.height])}->${JSON.stringify([s.currentRect.y, s.currentRect.height])}`;
            }),
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(BASE + path, { waitUntil: 'load' });
    await page.waitForTimeout(3500);
    const shifts = await page.evaluate(() => window.__shifts);
    const cls = +shifts.reduce((a, e) => a + e.v, 0).toFixed(4);
    totals.push(cls);
    worst = Math.max(worst, cls);
    if (!detail || shifts.length) detail = shifts;
    await ctx.close();
  }
  console.log(`${path} ${name}: CLS ${totals.join(' / ')}`);
  if (verbose) console.log(JSON.stringify(detail, null, 1));
}
await browser.close();
console.log(`worst CLS ${worst}`);
