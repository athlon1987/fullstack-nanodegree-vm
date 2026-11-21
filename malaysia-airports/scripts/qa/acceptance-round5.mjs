#!/usr/bin/env node
/**
 * Round-five acceptance measurements (docs/qa/verification.md, "Round five"): the numbers behind
 * each claim in docs/qa/fixes/round5-speed.md, round5-flight.md and round5-polish.md, measured on a
 * production build. The e2e suite asserts pass or fail; this script records the numbers and texts,
 * one JSON line per block. Counting methods are round four's (scripts/qa/acceptance-round4.mjs):
 * A-14 type sizes are the distinct computed font sizes of visible elements in <main> with their own
 * text; Demo labels per view are counted one viewport at a time.
 *
 * Usage: node scripts/qa/acceptance-round5.mjs [BASE_URL] [only=comma,separated,block,ids]
 * Blocks: concierge, html, typesizes, flightpage, notfound404, board, density, parking, search,
 *         fare, maplabels, sections, axe
 */
import { chromium, devices } from '@playwright/test';
import { gzipSync } from 'node:zlib';

const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, '');
const only = process.argv[3] ? new Set(process.argv[3].split(',')) : null;
const MORNING = new Date('2026-11-18T09:40:00+08:00');
const NIGHT = new Date('2026-11-18T23:30:00+08:00');
const NOVEMBER = new Date('2026-11-21T10:00:00+08:00');
const MH2626 = { id: 'mh2626-20261118-d', airport: 'kul', number: 'MH2626', direction: 'd', date: '2026-11-18', route: 'Kuala Lumpur to Singapore', savedAt: '2026-11-18T01:00:00.000Z' };
const ip = () => `10.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
const out = (o) => console.log(JSON.stringify(o));
const want = (id) => !only || only.has(id);
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const get = (path, headers = {}) => fetch(BASE + path, { headers: { 'x-e2e-client-ip': ip(), ...headers }, redirect: 'manual' });
const kualaLumpurDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(d);

const browser = await chromium.launch();

async function open({ width = 390, height = 844, phone = true, clock = null, journey = null, textSize = 100, javaScriptEnabled = true, scale } = {}) {
  const ctx = await browser.newContext({ ...(phone ? devices['Pixel 7'] : {}), viewport: { width, height }, ...(scale ? { deviceScaleFactor: scale } : {}), javaScriptEnabled, extraHTTPHeaders: { 'x-e2e-client-ip': ip() } });
  await ctx.addInitScript(([j, size]) => {
    try {
      localStorage.setItem('ma:airport:v1', JSON.stringify({ airport: 'kul' }));
      localStorage.setItem('ma:preferences:v1', JSON.stringify({ theme: 'light', textSize: size, highContrast: false, reducedMotion: true }));
      if (j) localStorage.setItem('ma:journey:v1', JSON.stringify(j));
    } catch {}
  }, [journey, textSize]);
  const page = await ctx.newPage();
  if (clock) await page.clock.setFixedTime(clock);
  return { ctx, page };
}

/** A-14 counts, scrolling one viewport at a time (the flight package's e2e method, plus round four's tags). */
const densityInPage = async () => {
  const main = document.querySelector('main');
  const shown = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const sizes = [...new Set([...main.querySelectorAll('*')].filter((e) => shown(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => getComputedStyle(e).fontSize))].map((s) => parseFloat(s)).sort((a, b) => a - b);
  let maxDemo = 0;
  for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
    window.scrollTo(0, y);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const inView = [...main.querySelectorAll('[data-demo-marker], [data-demo-label]')].filter((e) => { const b = e.getBoundingClientRect(); return shown(e) && b.bottom > 0 && b.top < innerHeight; }).length;
    maxDemo = Math.max(maxDemo, inView);
  }
  window.scrollTo(0, 0);
  const timeline = document.querySelector('[data-step]')?.closest('section');
  return {
    provenanceTags: [...main.querySelectorAll('[data-provenance]')].filter(shown).length,
    demoLabels: [...main.querySelectorAll('[data-demo-marker], [data-demo-label]')].filter(shown).length,
    maxDemoPerView: maxDemo,
    sourceToggles: [...main.querySelectorAll('[data-source-marker]')].filter(shown).length,
    timelineSourceLists: timeline ? timeline.querySelectorAll('[data-source-marker]').length : null,
    filterChips: [...main.querySelectorAll('[aria-pressed], input[type="checkbox"]')].filter(shown).length,
    typeSizes: sizes.length,
    sizes,
  };
};

// Speed item 3 (B-09): the concierge's flights from the flight feed, in the browser and on the server.
if (want('concierge')) {
  const res = {};
  const date = kualaLumpurDate();
  const feed = await (await get(`/en/flights/feed?date=${date}&dir=d&airports=kul`)).json();
  const flight = feed.days[0].flights[Math.min(5, feed.days[0].flights.length - 1)];
  const number = flight.number.replace(/\s+/g, '');
  res.feedFlight = { number, id: flight.id, status: flight.status, scheduled: flight.scheduled, estimated: flight.estimated, gate: flight.gate ?? null, generatedAt: feed.days[0].generatedAt ?? feed.generatedAt ?? null };
  for (const [label, blocked, lang] of [['online en', false, 'en'], ['feed blocked en', true, 'en'], ['feed blocked ms', true, 'ms']]) {
    const { ctx, page } = await open({ width: 1440, height: 900, phone: false });
    const requests = [];
    const scripts = [];
    page.on('request', (r) => { if (r.url().includes('/flights/feed')) requests.push(new URL(r.url()).pathname + new URL(r.url()).search); });
    page.on('response', async (r) => { if (r.url().endsWith('.js')) { try { scripts.push(await r.text()); } catch {} } });
    if (blocked) await page.route('**/flights/feed**', (route) => route.abort('internetdisconnected'));
    await page.goto(`${BASE}/${lang}/concierge`, { waitUntil: 'networkidle' });
    const input = page.getByRole('textbox', { name: lang === 'en' ? 'Your question' : 'Soalan anda' });
    const question = lang === 'en' ? `Is ${number} delayed?` : `Apakah status ${number}?`;
    const log = page.getByRole('log');
    let answer = '';
    for (let attempt = 0; attempt < 5 && !answer; attempt++) {
      await input.fill(question);
      await input.press('Enter');
      await page.waitForTimeout(4000);
      const items = await log.locator(':scope > *').allInnerTexts();
      const last = items.filter((t) => !/^(You asked|Anda bertanya)/.test(t.trim())).pop() || '';
      if (/MH|AK|OD|[A-Z0-9]{2}\s?\d/.test(last) && last.length > 20) answer = clean(last);
    }
    const text = clean(await log.innerText());
    res[label] = {
      feedRequests: requests.filter((p) => !p.includes('?') || true).length,
      feedPaths: [...new Set(requests.map((p) => p.split('?')[0]))],
      demoLabel: /demonstration data|data demonstrasi/i.test(text),
      onDevice: /Answered on this device|Dijawab pada peranti ini/i.test(text),
      unavailable: /could not be loaded just now|tidak dapat dimuatkan sekarang/.test(text),
      notFoundWording: /could not find .* on the demonstration boards|tidak menemui .* pada papan demonstrasi/i.test(text),
      generatorInBrowser: scripts.some((s) => s.includes('"4-12"')),
      answer: text.slice(-420),
    };
    await ctx.close();
  }
  const api = await fetch(`${BASE}/api/concierge`, { method: 'POST', headers: { 'content-type': 'application/json', origin: BASE, 'sec-fetch-site': 'same-origin', 'x-e2e-client-ip': ip() }, body: JSON.stringify({ question: `Is ${number} delayed?`, lang: 'en', airport: 'kul' }) });
  const body = await api.json().catch(() => null);
  const card = body?.answer?.cards?.find((c) => c.type === 'flight');
  res.api = { status: api.status, demo: body?.answer?.demo ?? null, card: card ? { id: card.id, number: card.number, status: card.status, scheduled: card.scheduled, estimated: card.estimated, gate: card.gate ?? null } : null, sameAsFeed: card ? card.id === flight.id && card.status === flight.status && card.estimated === flight.estimated : false, text: clean(body?.answer?.text || '').slice(0, 300) };
  out({ id: 'speed-3 concierge flights', res });
}

// Speed item 4 (E-11): HTML size and the concierge copy outside the concierge page.
if (want('html')) {
  const rows = {};
  for (const p of ['/en', '/ms', '/en/kul', '/en/kul/transport', '/en/kul/flights', '/en/guides', '/en/guides/departing', '/en/help/baggage', '/en/concierge', '/en/journey', '/en/airports', '/en/kul/parking']) {
    const html = await (await get(p)).text();
    const rsc = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)].reduce((a, m) => a + m[1].length, 0);
    rows[p] = { rawKB: +(Buffer.byteLength(html) / 1024).toFixed(1), gzipKB: +(gzipSync(html).length / 1024).toFixed(1), rscKB: +(rsc / 1024).toFixed(0), conciergeModelSentence: html.includes('Anthropic’s Claude model'), iconUses: (html.match(/<use href="[^"]*icons\.[^"]*\.svg#/g) || []).length, iconGeometryInPayload: html.includes('\\"node\\":[[\\"path\\"') };
  }
  out({ id: 'speed-4 html', rows });
}

// Speed item 5 and flight item 4 (A-14): type sizes on the home and the overview.
if (want('typesizes')) {
  const rows = [];
  for (const p of ['/en', '/ms', '/en/kul']) {
    for (const [w, h, phone] of [[390, 844, true], [1440, 900, false]]) {
      const { ctx, page } = await open({ width: w, height: h, phone, clock: MORNING });
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const d = await page.evaluate(densityInPage);
      rows.push({ p, w, typeSizes: d.typeSizes, sizes: d.sizes.join(' '), maxDemoPerView: d.maxDemoPerView });
      await ctx.close();
    }
  }
  out({ id: 'A-14 type sizes', rows });
}

// Flight item 1: the flight page's h1 in the first flush, and 404s.
if (want('flightpage')) {
  const res = {};
  const today = kualaLumpurDate().replaceAll('-', '');
  const board = await (await get(`/api/flights?airport=kul&limit=1`)).json().catch(() => null);
  const current = board?.flights?.[0]?.id;
  for (const p of [`/en/kul/flights/${MH2626.id}`, `/ms/kul/flights/${MH2626.id}`, '/en/kul/flights/ak6336-20261121-d', current && `/en/kul/flights/${current}`, current && `/ms/kul/flights/${current}`].filter(Boolean)) {
    const r = await get(p);
    const html = await r.text();
    const h1 = html.search(/<h1[\s>]/);
    const firstHidden = html.search(/<div hidden id="S:/);
    res[p] = { status: r.status, bytes: html.length, gzipKB: +(gzipSync(html).length / 1024).toFixed(1), h1At: h1, firstHiddenAt: firstHidden, h1BeforeHidden: h1 >= 0 && (firstHidden < 0 || h1 < firstHidden), h1: clean(html.slice(h1, h1 + 300).replace(/<[^>]+>/g, ' ')).slice(0, 60), canonicalInHead: (html.slice(0, html.indexOf('</head>')).match(/rel="canonical"/g) || []).length, linkHeader: r.headers.get('link') };
  }
  res.notFound = {};
  for (const p of [`/en/bbn/flights/mh1-${today}-d`, `/ms/tod/flights/mh1-${today}-d`, `/en/kul/flights/zz9999-${today}-d`, `/en/zzz/flights/mh1-${today}-d`]) {
    const r = await get(p);
    const html = await r.text();
    res.notFound[p] = { status: r.status, text: /We could not find this flight|Kami tidak menemui penerbangan ini/.test(html) };
  }
  out({ id: 'flight-1 flight page', res });
}

// Polish item 1: catch-all 404s.
if (want('notfound404')) {
  const res = {};
  for (const p of ['/en/kul/zzz', '/en/nothing/here', '/en/a/b/c', '/ms/kul/zzz', '/ms/tiada/halaman']) {
    const rows = [];
    for (const attempt of [1, 2]) {
      const r = await get(p);
      const html = await r.text();
      rows.push({ attempt, status: r.status, nextError: html.includes('__next_error__'), title: (html.match(/<title>([^<]*)<\/title>/) || [])[1] || null, h1: (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, '').trim() || null, shell: html.includes('data-site-header'), skipLink: html.includes('href="#main"'), noindex: /<meta name="robots" content="noindex/.test(html), canonicalInHead: (html.slice(0, html.indexOf('</head>')).match(/rel="canonical"/g) || []).length, failedBoundary: html.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/g, '').includes('<!--$!-->') });
    }
    const { ctx, page } = await open({ width: 1440, height: 900, phone: false });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    res[p] = { rows, browserTitle: await page.title(), consoleErrors: errors };
    await ctx.close();
  }
  out({ id: 'polish-1 catch-all 404s', res });
}

// Flight item 2: the board at night (browser clock 23:30; the feed answers for that instant).
if (want('board')) {
  const res = {};
  const html = await (await get('/en/kul/flights')).text();
  res.serverHtml = { loadingBlock: /Loading the board/.test(html), emptyStateInHtml: /No departures between/.test(html) };
  for (const lang of ['en', 'ms']) {
    for (const [w, h, phone] of [[390, 844, true], [1440, 900, false]]) {
      const { ctx, page } = await open({ width: w, height: h, phone, clock: NIGHT });
      await page.addInitScript(() => {
        window.__shift = 0; window.__lcp = [];
        new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__shift += e.value; }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp.push({ t: Math.round(e.startTime), text: (e.element?.textContent || '').trim().slice(0, 50) }); }).observe({ type: 'largest-contentful-paint', buffered: true });
      });
      await page.goto(`${BASE}/${lang}/kul/flights`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const main = page.locator('main');
      const text = clean(await main.innerText());
      res[`${lang} ${w}`] = {
        emptyState: clean(text.match(/(No departures between[^.]*|Tiada penerbangan berlepas antara[^.]*)/)?.[0]),
        earlier: await main.getByRole('button', { name: /Show earlier flights|Tunjuk penerbangan lebih awal/ }).count(),
        later: await main.getByRole('button', { name: /Show later flights|Tunjuk penerbangan seterusnya/ }).count(),
        cls: +(await page.evaluate(() => window.__shift)).toFixed(4),
        lcp: await page.evaluate(() => window.__lcp.at(-1)),
      };
      await ctx.close();
    }
  }
  out({ id: 'flight-2 board at night', res });
}

// Flight item 4 (A-14): density on the flight page, My journey and the overview (MH 2626 saved, 09:40).
if (want('density')) {
  const rows = [];
  for (const [w, h, phone] of [[390, 844, true], [1440, 900, false]]) {
    for (const p of [`/en/kul/flights/${MH2626.id}`, '/en/journey', '/en/kul']) {
      const { ctx, page } = await open({ width: w, height: h, phone, clock: MORNING, journey: { flights: [MH2626], places: [], parkedCar: null } });
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      if (p !== '/en/kul') {
        await page.locator('[data-step="boarding"]').first().waitFor({ timeout: 20000 }).catch(() => {});
        await page.locator('section:has([data-step]) [data-section-sources]').first().waitFor({ timeout: 20000 }).catch(() => {});
      }
      await page.waitForTimeout(800);
      rows.push({ p, w, ...(await page.evaluate(densityInPage)), sizes: undefined });
      await ctx.close();
    }
  }
  out({ id: 'flight-4 density', rows });
}

// Polish item 3 (A-14): parking density (390 x 844), English and Malay.
if (want('parking')) {
  const rows = [];
  for (const lang of ['en', 'ms']) {
    for (const [w, h, phone] of [[390, 844, true], [1440, 900, false]]) {
      const { ctx, page } = await open({ width: w, height: h, phone });
      await page.goto(`${BASE}/${lang}/kul/parking`, { waitUntil: 'networkidle' });
      await page.locator('#car-park-kul-long-term-car-park').filter({ hasText: /bays? free|% full|ruang kosong|% penuh/ }).first().waitFor({ timeout: 15000 }).catch(() => {});
      const counts = await page.locator('main').evaluate((root) => {
        const shown = (e) => e.getBoundingClientRect().height > 0;
        const count = (sel, within = root) => [...within.querySelectorAll(sel)].filter(shown).length;
        const list = root.querySelector('section[aria-labelledby="car-parks-title"]');
        const sizes = new Set([...root.querySelectorAll('*')].filter((e) => shown(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => getComputedStyle(e).fontSize));
        return {
          sourceToggles: count('[data-source-marker]'), listToggles: count('[data-source-marker]', list), sectionLists: count('[data-section-sources]'),
          demoTagsOnCards: [...list.querySelectorAll('article [data-demo-label], article [data-provenance="demo"]')].filter(shown).length,
          demoMarkersInList: count('[data-demo-marker]', list), bannersInList: count('[data-demo-banner]', list),
          cardChips: [...list.querySelectorAll('article span.min-h-chip')].filter(shown).length,
          provenanceTags: count('[data-provenance]'), rateLines: count('[data-rate-line]'),
          simulatedLabels: [...list.querySelectorAll('article')].filter((a) => /Simulated space|Ruang simulasi/.test(a.textContent)).length,
          cards: list.querySelectorAll('article').length, typeSizes: sizes.size,
          screens: Math.round((document.documentElement.scrollHeight / innerHeight) * 10) / 10,
        };
      });
      rows.push({ lang, w, ...counts });
      await ctx.close();
    }
  }
  out({ id: 'polish-3 parking density', rows });
}

// Polish item 2: the search index.
if (want('search')) {
  const res = {};
  for (const lang of ['en', 'ms']) {
    const raw = await (await get(`/${lang}/search/index.json`)).text();
    const json = JSON.parse(raw);
    const docs = Array.isArray(json) ? json : json.documents || json.docs || Object.values(json).find(Array.isArray) || [];
    const bad = docs.filter((d) => JSON.stringify(d).includes('[object Object]')).map((d) => d.id);
    const airline = (id) => docs.find((d) => d.id === id);
    res[lang] = { documents: docs.length, objectObject: bad, mh: clean(airline('airline:kul:mh')?.summary).slice(0, 160), cx: clean(airline('airline:pen:cx')?.summary).slice(0, 160) };
  }
  out({ id: 'polish-2 search index', res });
}

// Polish item 4: the transport fare row (position at 100% and 125% text; shape with and without JavaScript).
if (want('fare')) {
  const res = {};
  for (const lang of ['en', 'ms']) {
    for (const [w, h, phone, size] of [[390, 844, true, 100], [390, 844, true, 125], [1440, 900, false, 125]]) {
      const { ctx, page } = await open({ width: w, height: h, phone, clock: NOVEMBER, textSize: size });
      await page.goto(`${BASE}/${lang}/kul/transport`, { waitUntil: 'networkidle' });
      const glance = page.locator('[data-transport-glance]');
      const fare = glance.getByText('RM 55', { exact: true }).first();
      await fare.waitFor({ timeout: 10000 }).catch(() => {});
      const box = await fare.boundingBox();
      const warning = page.getByRole('main').getByRole('note').filter({ hasText: lang === 'en' ? 'Book taxis only at the coupon counters' : 'Tempah teksi hanya di kaunter kupon' }).first();
      const wbox = await warning.boundingBox();
      res[`${lang} ${w} ${size}%`] = { fare: box ? `${Math.round(box.y)}-${Math.round(box.y + box.height)}` : null, warningTop: wbox ? Math.round(wbox.y) : null, fareAboveWarning: box && wbox ? box.y < wbox.y : null, onFirstScreen: box ? box.y + box.height < h : null };
      await ctx.close();
    }
    const shapes = [];
    for (const js of [false, true]) {
      const { ctx, page } = await open({ width: 1440, height: 900, phone: false, clock: js ? NOVEMBER : null, javaScriptEnabled: js });
      await page.goto(`${BASE}/${lang}/kul/transport`, { waitUntil: js ? 'networkidle' : 'load' });
      const glance = page.locator('[data-transport-glance]');
      shapes.push({ js, periods: await glance.locator('[data-glance-periods] > li').count(), firstRow: clean(await glance.locator('li').first().innerText()).slice(0, 140) });
      await ctx.close();
    }
    res[`${lang} shape`] = shapes;
  }
  out({ id: 'polish-4 fare row', res });
}

// Polish item 5: labels inside the /en/airports drawing.
if (want('maplabels')) {
  const rows = [];
  for (const [w, scale] of [[320, 1], [360, 1], [390, 1], [640, 1], [768, 1], [1024, 1], [1280, 1], [1440, 1], [1920, 1], [640, 2], [720, 2], [960, 2]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: scale, extraHTTPHeaders: { 'x-e2e-client-ip': ip() } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/en/airports`, { waitUntil: 'networkidle' });
    const r = await page.locator('main').evaluate((main) => {
      const outside = [];
      let labels = 0;
      let lgk = null;
      for (const drawing of main.querySelectorAll('svg[role="img"]')) {
        const frame = drawing.getBoundingClientRect();
        for (const label of drawing.querySelectorAll('text')) {
          labels++;
          const b = label.getBoundingClientRect();
          if (label.textContent === 'LGK') lgk = { leftGap: +(b.left - frame.left).toFixed(1) };
          if (b.left < frame.left - 0.5 || b.right > frame.right + 0.5 || b.top < frame.top - 0.5 || b.bottom > frame.bottom + 0.5) outside.push(label.textContent);
        }
      }
      return { labels, outside, lgk };
    });
    rows.push({ w, scale, ...r });
    await ctx.close();
  }
  out({ id: 'polish-5 map labels', rows });
}

// Flight item 5: desktop layout shift on the section pages, inside <main> and in all.
if (want('sections')) {
  const rows = [];
  for (const p of ['/en/kul/parking', '/en/kul/facilities', '/en/kul/lounges', '/en/kul/shop-dine', '/en/kul/map', '/en/kul/transit', '/en/pen/parking', '/en/kul/transport', '/ms/kul/transport', '/en/kul/flights', `/en/kul/flights/${MH2626.id}`]) {
    const vals = [];
    for (let run = 0; run < 3; run++) {
      const { ctx, page } = await open({ width: 1440, height: 900, phone: false, clock: p.includes('flights') ? MORNING : NOVEMBER });
      await page.addInitScript(() => {
        window.__all = 0; window.__main = 0;
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) {
            if (e.hadRecentInput) continue;
            window.__all += e.value;
            if ((e.sources || []).some((s) => s.node instanceof Element && s.node.closest('main'))) window.__main += e.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(BASE + p, { waitUntil: 'load' });
      await page.waitForTimeout(3500);
      vals.push(await page.evaluate(() => ({ all: +window.__all.toFixed(4), main: +window.__main.toFixed(4) })));
      await ctx.close();
    }
    rows.push({ p, all: vals.map((v) => v.all).join(' / '), main: vals.map((v) => v.main).join(' / ') });
  }
  out({ id: 'flight-5 desktop shift', rows });
}

// Axe (the e2e suite's tags) on the states round five added that no spec scans: the night board, the
// flight page before the feed answers, the catch-all 404s, the concierge's "could not be loaded"
// answer, the reworked parking and transport rows, the map, the header tooltip, in light and dark.
if (want('axe')) {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
  const rows = [];
  const scan = async (label, page) => {
    const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    rows.push({ label, violations: r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`) });
  };
  for (const theme of ['light', 'dark']) {
    for (const [w, h, phone] of [[390, 844, true], [1440, 900, false]]) {
      const tag = `${theme} ${w}`;
      const setTheme = async (page) => page.addInitScript((t) => localStorage.setItem('ma:preferences:v1', JSON.stringify({ theme: t, textSize: 100, highContrast: false, reducedMotion: true })), theme);
      // Night board, en and ms.
      for (const lang of ['en', 'ms']) {
        const { ctx, page } = await open({ width: w, height: h, phone, clock: NIGHT });
        await setTheme(page);
        await page.goto(`${BASE}/${lang}/kul/flights`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await scan(`${tag} night board ${lang}`, page);
        await ctx.close();
      }
      // Flight page while the feed is held back, then filled.
      {
        const { ctx, page } = await open({ width: w, height: h, phone, clock: MORNING });
        await setTheme(page);
        let release;
        const held = new Promise((r) => { release = r; });
        await page.route(/\/flights\/feed(\?|$)/, async (route) => { await held; await route.continue(); });
        await page.goto(`${BASE}/en/kul/flights/${MH2626.id}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
        await scan(`${tag} flight page pending`, page);
        release();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(800);
        await scan(`${tag} flight page filled`, page);
        await ctx.close();
      }
      for (const p of ['/en/kul/zzz', '/ms/tiada/halaman', '/en/kul/parking', '/ms/kul/parking', '/en/kul/transport', '/ms/kul/transport', '/en/airports', '/en', '/ms', '/en/kul', '/en/journey']) {
        const { ctx, page } = await open({ width: w, height: h, phone, clock: p.endsWith('transport') ? NOVEMBER : null, journey: p === '/en/journey' ? { flights: [MH2626], places: [], parkedCar: null } : null });
        await setTheme(page);
        await page.goto(BASE + p, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await scan(`${tag} ${p}`, page);
        await ctx.close();
      }
      // Concierge answer with the feed unreachable.
      {
        const { ctx, page } = await open({ width: w, height: h, phone });
        await setTheme(page);
        await page.route('**/flights/feed**', (route) => route.abort('internetdisconnected'));
        await page.goto(`${BASE}/en/concierge`, { waitUntil: 'networkidle' });
        const input = page.getByRole('textbox', { name: 'Your question' });
        await input.fill('Is MH2626 on time?');
        await input.press('Enter');
        await page.getByRole('log').getByText(/could not be loaded just now/).first().waitFor({ timeout: 20000 }).catch(() => {});
        await scan(`${tag} concierge flight unavailable`, page);
        await ctx.close();
      }
      // Header tooltip open (desktop only: no tooltips on touch).
      if (!phone) {
        const { ctx, page } = await open({ width: w, height: h, phone });
        await setTheme(page);
        await page.goto(`${BASE}/en/guides`, { waitUntil: 'networkidle' });
        const trigger = page.getByRole('banner').locator('button[aria-describedby], button').filter({ visible: true }).first();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.waitForTimeout(600);
        const open_ = await page.locator('[role="tooltip"]').count();
        await scan(`${tag} header tooltip (${open_} open)`, page);
        void trigger;
        await ctx.close();
      }
    }
  }
  out({ id: 'axe round five states', scans: rows.length, withViolations: rows.filter((r) => r.violations.length), rows: rows.map((r) => `${r.label}: ${r.violations.length}`) });
}

await browser.close();
