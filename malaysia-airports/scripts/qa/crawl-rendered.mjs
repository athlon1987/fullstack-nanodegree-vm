#!/usr/bin/env node
/**
 * Rendered link crawl: loads every sitemap page, plus the client-heavy pages the sitemap does not
 * list, in Chromium after hydration (desktop 1440 x 900, a saved flight, a saved place and a parked
 * car in local storage, a fixed browser clock), collects every same-origin <a href>, then checks each
 * target's status and each #fragment against the ids of the target page after hydration.
 *
 * It finds links that only exist once JavaScript has run (saved-flight cards, search results, board
 * rows, the journey page), which the static crawl cannot see.
 *
 * Usage:
 *   node scripts/qa/crawl-rendered.mjs [--base=http://localhost:3100] [--out=crawl-rendered.json]
 *        [--clock=now | --clock=2026-11-18T09:40:00+08:00] [--flight=auto | --flight=<flight id>]
 *
 * --clock fixes the browser clock (default: now). --flight is the saved flight and the flight page
 * crawled (default: auto, a Malaysia Airlines departure from KLIA taken from /api/flights). Flight
 * links depend on the clock, so totals vary a little between runs; broken links and missing anchors
 * must be 0. Needs the project's @playwright/test and its Chromium. Exit code 1 when anything is
 * broken or missing.
 */
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const arg = (name, fallback) => {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const BASE = arg('base', 'http://localhost:3100').replace(/\/$/, '');
const OUT = arg('out', 'crawl-rendered.json');
const CLOCK = arg('clock', 'now');
const FLIGHT = arg('flight', 'auto');
const CLIENT_HEADER = 'x-e2e-client-ip';
const ip = () => `10.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;

async function pickFlight() {
  if (FLIGHT !== 'auto') return FLIGHT;
  const res = await fetch(`${BASE}/api/flights?airport=kul&dir=d&limit=80`, { headers: { [CLIENT_HEADER]: ip() } });
  const { flights } = await res.json();
  return (flights.find((f) => f.airline?.code === 'MH') ?? flights[0]).id;
}

const flightId = await pickFlight();
const [, number, ymd] = /^([a-z]+\d+)-(\d{8})-[ad]$/.exec(flightId) ?? [];
const date = ymd ? `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6)}` : '';
const clock = CLOCK === 'now' ? new Date() : new Date(CLOCK);

const xml = await (await fetch(`${BASE}/sitemap.xml`, { headers: { [CLIENT_HEADER]: ip() } })).text();
const sitemapPages = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname))];
const extra = [
  '/en/journey', '/ms/journey', `/en/kul/flights/${flightId}`, `/ms/kul/flights/${flightId}`, '/en/kul/flights?dir=a',
  '/en/search?q=parking', '/ms/search?q=surau', `/en/kul/flights/zz9999-${ymd}-d`, '/en/offline',
];
const all = [...sitemapPages, ...extra];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { [CLIENT_HEADER]: ip() } });
const saved = {
  flights: [{ id: flightId, airport: 'kul', number: (number ?? '').toUpperCase(), direction: 'd', date, route: 'Kuala Lumpur', mode: 'departing', savedAt: clock.toISOString() }],
  places: [{ id: 'kul-t1-calm-room', type: 'facility', airport: 'kul', title: 'Calm Room', href: '/kul/facilities#kul-t1-calm-room', savedAt: clock.toISOString() }],
  parkedCar: { airport: 'kul', carParkId: 'kul-t1-preferred-parking', level: '2', savedAt: clock.toISOString() },
};
await ctx.addInitScript((value) => {
  try {
    if (!localStorage.getItem('ma:journey:v1')) localStorage.setItem('ma:journey:v1', value);
  } catch {}
}, JSON.stringify(saved));
await ctx.clock.setFixedTime(clock);

const links = new Map(); // href -> Set(pages that link to it)
let next = 0;
async function renderWorker() {
  const page = await ctx.newPage();
  while (next < all.length) {
    const path = all[next++];
    try {
      await page.goto(BASE + path, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(900);
      const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.href));
      for (const href of hrefs) {
        if (new URL(href).origin !== BASE) continue;
        if (!links.has(href)) links.set(href, new Set());
        links.get(href).add(path);
      }
    } catch (e) {
      console.log('load failed', path, String(e.message).slice(0, 120));
    }
  }
  await page.close();
}
await Promise.all([renderWorker(), renderWorker(), renderWorker(), renderWorker()]);

// Status of every target (fragment removed), redirects followed and reported.
const targets = [...new Set([...links.keys()].map((h) => h.split('#')[0]))];
const status = new Map();
let t = 0;
async function checkWorker() {
  while (t < targets.length) {
    const target = targets[t++];
    try {
      const r = await fetch(target, { redirect: 'follow', headers: { [CLIENT_HEADER]: ip() } });
      status.set(target, { status: r.status, redirected: r.redirected, final: r.url });
    } catch (e) {
      status.set(target, { status: `ERR ${e.message}` });
    }
  }
}
await Promise.all(Array.from({ length: 8 }, checkWorker));

// Fragments: open each target in the browser and look for the id after hydration.
const fragLinks = [...links.keys()].filter((h) => h.includes('#') && !h.endsWith('#') && !h.endsWith('#main'));
const byTarget = new Map();
for (const h of fragLinks) {
  const [target, frag] = h.split('#');
  if (!byTarget.has(target)) byTarget.set(target, new Set());
  byTarget.get(target).add(decodeURIComponent(frag));
}
const fragPage = await ctx.newPage();
const missingAnchors = [];
for (const [target, frags] of byTarget) {
  if (status.get(target)?.status !== 200) continue;
  await fragPage.goto(target, { waitUntil: 'load' });
  await fragPage.waitForTimeout(700);
  for (const frag of frags) {
    const found = await fragPage.evaluate((id) => Boolean(document.getElementById(id)), frag);
    if (!found) missingAnchors.push({ link: `${target}#${frag}`, from: [...(links.get(`${target}#${encodeURIComponent(frag)}`) ?? links.get(`${target}#${frag}`) ?? [])].slice(0, 3) });
  }
}
await browser.close();

const sourcesOf = (target) => [...links.entries()].filter(([h]) => h.split('#')[0] === target).flatMap(([, s]) => [...s]).slice(0, 4);
const broken = targets.filter((x) => status.get(x)?.status !== 200).map((x) => ({ link: x, ...status.get(x), from: sourcesOf(x) }));
const redirected = targets.filter((x) => status.get(x)?.redirected).map((x) => ({ link: x, final: status.get(x).final }));
const counts = { base: BASE, clock: clock.toISOString(), flight: flightId, pagesRendered: all.length, uniqueLinks: links.size, uniqueTargets: targets.length, fragmentLinks: fragLinks.length, broken: broken.length, missingAnchors: missingAnchors.length, redirected: redirected.length };
writeFileSync(OUT, JSON.stringify({ ...counts, broken, missingAnchors, redirected: redirected.slice(0, 20), targetsList: targets, linksList: [...links.keys()] }, null, 1));
console.log(JSON.stringify(counts, null, 1));
if (broken.length) console.log('BROKEN', JSON.stringify(broken.slice(0, 20), null, 1));
if (missingAnchors.length) console.log('MISSING', JSON.stringify(missingAnchors.slice(0, 30), null, 1));
if (redirected.length) console.log('REDIRECTED', JSON.stringify(redirected.slice(0, 10), null, 1));
process.exitCode = broken.length || missingAnchors.length ? 1 : 0;
