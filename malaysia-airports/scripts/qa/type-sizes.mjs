#!/usr/bin/env node
/**
 * A-14 "at most 8 type sizes on any page" (verification round 5): every sitemap page, plus My journey
 * and a flight page, with MH 2626 saved (so the home shows its saved-flight card) and the browser clock
 * at 18 November 09:40 (the e2e suite's instant). Counts the distinct computed font sizes of visible
 * elements in <main> that have their own text (round four's acceptance-round4.mjs method), on a
 * Pixel 7 at 390 x 844 (the A-14 width) and at 1440 x 900.
 *
 * Usage: node scripts/qa/type-sizes.mjs [BASE_URL] [OUT_JSON]
 * Prints the distribution per width and every page over 8; writes all counts to OUT_JSON if given.
 */
import { writeFileSync } from 'node:fs';
import { chromium, devices } from '@playwright/test';

const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, '');
const OUT = process.argv[3];
const MORNING = new Date('2026-11-18T09:40:00+08:00');
const MH2626 = { id: 'mh2626-20261118-d', airport: 'kul', number: 'MH2626', direction: 'd', date: '2026-11-18', route: 'Kuala Lumpur to Singapore', savedAt: '2026-11-18T01:00:00.000Z' };
const ip = () => `10.67.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;

const sitemap = await (await fetch(`${BASE}/sitemap.xml`, { headers: { 'x-e2e-client-ip': ip() } })).text();
const paths = [...new Set([...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname), '/en/journey', '/ms/journey', `/en/kul/flights/${MH2626.id}`, `/ms/kul/flights/${MH2626.id}`])];
const browser = await chromium.launch();
const results = {};
for (const [label, options] of [['390', { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } }], ['1440', { viewport: { width: 1440, height: 900 } }]]) {
  const context = await browser.newContext({ ...options, extraHTTPHeaders: { 'x-e2e-client-ip': ip() } });
  await context.addInitScript((journey) => {
    localStorage.setItem('ma:preferences:v1', JSON.stringify({ theme: 'light', textSize: 100, highContrast: false, reducedMotion: true }));
    localStorage.setItem('ma:journey:v1', JSON.stringify(journey));
  }, { flights: [MH2626], places: [], parkedCar: null });
  const page = await context.newPage();
  await page.clock.setFixedTime(MORNING);
  const rows = [];
  for (const path of paths) {
    await page.setExtraHTTPHeaders({ 'x-e2e-client-ip': ip() });
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(300);
      const sizes = await page.evaluate(() => {
        const main = document.querySelector('main');
        if (!main) return null;
        const shown = (e) => {
          const box = e.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && getComputedStyle(e).visibility !== 'hidden';
        };
        return [...new Set([...main.querySelectorAll('*')].filter((e) => shown(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => parseFloat(getComputedStyle(e).fontSize)))].sort((a, b) => a - b);
      });
      rows.push({ path, count: sizes ? sizes.length : null, sizes: sizes ? sizes.join(' ') : null });
    } catch (error) {
      rows.push({ path, error: error.message.split('\n')[0] });
    }
  }
  await context.close();
  results[label] = rows;
  const distribution = rows.reduce((acc, row) => ((acc[row.count] = (acc[row.count] || 0) + 1), acc), {});
  const over = rows.filter((row) => row.count > 8);
  console.log(`${label} px: ${rows.length} pages, distribution ${JSON.stringify(distribution)}, over 8: ${over.length}`);
  for (const row of over) console.log(`  ${row.path} ${row.count} (${row.sizes})`);
}
if (OUT) writeFileSync(OUT, JSON.stringify(results, null, 1));
await browser.close();
