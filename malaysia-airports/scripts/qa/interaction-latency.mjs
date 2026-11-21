#!/usr/bin/env node
/**
 * Interaction latency (a lab stand-in for INP): loads a page on the Pixel 7 profile, waits for it to
 * settle, slows the CPU 4x through the DevTools protocol, performs one scripted interaction and reads
 * the Event Timing entries. Per run it reports the worst interaction's duration (input delay plus
 * processing plus presentation, as INP measures it); the target is 200 ms or less.
 *
 * Interactions:
 *   boardTypeMH     type "MH" into the KLIA board's search field, then delete it
 *   boardDirection  switch the KLIA board from Departures to Arrivals
 *   homeMode        on /en, choose Arriving, then Departing in the journey-mode switcher
 *   homeSwitcher    on /en, open the airport switcher in the header, then close it
 *   kulSwitcher     on /en/kul, open the airport switcher in the header, then close it
 *
 * Usage: node scripts/qa/interaction-latency.mjs [BASE_URL] [runs=3] [only=comma,separated,names]
 * Each run uses a fresh context with service workers blocked and reduced motion on.
 */
import { chromium, devices } from '@playwright/test';

const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, '');
const RUNS = Number(process.argv[3] || 3);
const only = process.argv[4] ? new Set(process.argv[4].split(',')) : null;
const ip = () => `10.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

const scenarios = {
  boardTypeMH: ['/en/kul/flights', async (page) => {
    const box = page.getByRole('main').getByRole('searchbox').first();
    await box.click();
    await page.keyboard.type('MH', { delay: 250 });
    await page.waitForTimeout(500);
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
  }],
  boardDirection: ['/en/kul/flights', async (page) => {
    await page.getByRole('main').getByRole('tab', { name: /Arrivals/ }).first().click()
      .catch(() => page.getByRole('main').getByRole('link', { name: /Arrivals/ }).first().click());
  }],
  homeMode: ['/en', async (page) => {
    await page.getByRole('radio', { name: /Arriving/ }).first().click({ force: true });
    await page.waitForTimeout(400);
    await page.getByRole('radio', { name: /Departing/ }).first().click({ force: true });
  }],
  homeSwitcher: ['/en', async (page) => {
    await page.getByRole('banner').getByRole('button', { name: /airport/i }).first().click();
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
  }],
  kulSwitcher: ['/en/kul', async (page) => {
    await page.getByRole('banner').getByRole('button', { name: /^KUL/ }).first().click();
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
  }],
};

const browser = await chromium.launch();
async function measure(path, act) {
  const runs = [];
  const detail = [];
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({ ...devices['Pixel 7'], extraHTTPHeaders: { 'x-e2e-client-ip': ip() }, serviceWorkers: 'block' });
    await ctx.addInitScript((airport) => {
      try {
        if (airport) localStorage.setItem('ma:airport:v1', JSON.stringify({ airport }));
        localStorage.setItem('ma:preferences:v1', JSON.stringify({ theme: 'light', textSize: 100, highContrast: false, reducedMotion: true }));
      } catch {}
    }, path === '/en' ? null : 'kul');
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await page.addInitScript(() => {
      window.__ev = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.interactionId) window.__ev.push({ id: e.interactionId, d: e.duration, n: e.name, inD: Math.round(e.processingStart - e.startTime), proc: Math.round(e.processingEnd - e.processingStart) });
        }
      }).observe({ type: 'event', durationThreshold: 16, buffered: true });
    });
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await act(page);
    await page.waitForTimeout(1200);
    const events = await page.evaluate(() => window.__ev);
    const worst = {};
    for (const e of events) if (!worst[e.id] || e.d > worst[e.id].d) worst[e.id] = e;
    const list = Object.values(worst);
    runs.push(Math.max(0, ...list.map((e) => e.d)));
    detail.push(list.map((e) => `${e.n}:${e.d}(${e.inD}/${e.proc})`).join(' '));
    await ctx.close();
  }
  return { path, runs, median: median(runs), detail };
}

for (const [name, [path, act]] of Object.entries(scenarios)) {
  if (only && !only.has(name)) continue;
  try {
    console.log(name, JSON.stringify(await measure(path, act)));
  } catch (e) {
    console.log(name, 'failed:', String(e.message).split('\n')[0]);
  }
}
await browser.close();
