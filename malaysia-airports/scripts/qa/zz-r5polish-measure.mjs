// Round five polish measurements. Run from malaysia-airports: node <this> BASE [blocks]
// Blocks: 404, search, density, cls, fare, map
import { chromium, devices } from '@playwright/test';

const BASE = (process.argv[2] || 'http://localhost:3253').replace(/\/$/, '');
const only = process.argv[3] ? new Set(process.argv[3].split(',')) : null;
const want = (id) => !only || only.has(id);
const ip = () => `10.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
const out = (o) => console.log(JSON.stringify(o));
const browser = await chromium.launch();

async function open({ width = 390, height = 844, phone = true, textSize = 100, theme = 'light', scale } = {}) {
  const ctx = await browser.newContext({ ...(phone ? devices['Pixel 7'] : {}), viewport: { width, height }, ...(scale ? { deviceScaleFactor: scale } : {}), extraHTTPHeaders: { 'x-e2e-client-ip': ip() } });
  await ctx.addInitScript(([size, th]) => {
    try {
      localStorage.setItem('ma:airport:v1', JSON.stringify({ airport: 'kul' }));
      localStorage.setItem('ma:preferences:v1', JSON.stringify({ theme: th, textSize: size, highContrast: false, reducedMotion: true }));
    } catch {}
  }, [textSize, theme]);
  const page = await ctx.newPage();
  return { ctx, page };
}

if (want('404')) {
  const rows = [];
  for (const p of ['/en/kul/zzz', '/en/nothing/here', '/en/a/b/c', '/ms/kul/zzz', '/ms/tiada/halaman', '/en/no-such-page', '/en/not-found']) {
    for (const attempt of [1, 2]) {
      const res = await fetch(BASE + p, { headers: { 'x-e2e-client-ip': ip() } });
      const html = await res.text();
      const head = html.slice(0, html.indexOf('</head>'));
      rows.push({
        p,
        attempt,
        status: res.status,
        title: (head.match(/<title>([^<]*)<\/title>/) || [])[1] || null,
        nextError: html.includes('__next_error__'),
        h1: (html.match(/<h1[^>]*>([^<]*)<\/h1>/) || [])[1] || null,
        shell: html.includes('id="main"') || html.includes('<main'),
        skip: /href="#main"/.test(html),
        canonical: (head.match(/<link rel="canonical" href="([^"]+)"/g) || []).length,
        robots: (head.match(/<meta name="robots" content="([^"]+)"/) || [])[1] || null,
      });
    }
  }
  out({ id: '404-server', rows });
  const browserRows = [];
  for (const p of ['/en/kul/zzz', '/ms/nothing/here']) {
    const { ctx, page } = await open({ width: 1440, height: 900, phone: false });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
    page.on('pageerror', (e) => errors.push(`pageerror ${String(e).slice(0, 160)}`));
    const res = await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    browserRows.push({ p, status: res.status(), title: await page.title(), h1: await page.locator('main h1').first().innerText().catch(() => null), h1Count: await page.locator('h1').count(), errors });
    await ctx.close();
  }
  out({ id: '404-browser', browserRows });
}

if (want('search')) {
  const res = {};
  for (const lang of ['en', 'ms']) {
    const r = await fetch(`${BASE}/${lang}/search/index.json`, { headers: { 'x-e2e-client-ip': ip() } });
    const text = await r.text();
    const json = JSON.parse(text);
    const docs = Array.isArray(json) ? json : json.documents || json.docs || [];
    res[lang] = { status: r.status, objectObject: (text.match(/\[object Object\]/g) || []).length, ids: docs.filter((d) => JSON.stringify(d).includes('[object Object]')).map((d) => d.id) };
  }
  out({ id: 'search', res });
}

async function densityOf(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main');
    const vis = (e) => e.getBoundingClientRect().height > 0;
    const sizes = new Set([...main.querySelectorAll('*')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => getComputedStyle(e).fontSize));
    return {
      provenanceTags: [...main.querySelectorAll('[data-provenance]')].filter(vis).length,
      sourceToggles: [...main.querySelectorAll('details:has([data-source-marker]) > summary, [data-source-marker]')].filter(vis).length,
      demoLabels: [...main.querySelectorAll('[data-provenance="demo"], [data-demo-label]')].filter(vis).length,
      demoBanners: [...main.querySelectorAll('[data-demo-banner]')].filter(vis).length,
      chips: [...main.querySelectorAll('span.min-h-chip.rounded-sm, [data-provenance]')].filter(vis).length,
      fontSizes: sizes.size,
      sizes: [...sizes].sort((a, b) => parseFloat(a) - parseFloat(b)).join(' '),
      screens: Math.round((document.documentElement.scrollHeight / innerHeight) * 10) / 10,
      rateLines: [...main.querySelectorAll('[data-rate-line]')].filter(vis).map((e) => e.textContent.trim()).length,
    };
  });
}

if (want('density')) {
  const rows = [];
  for (const [lang, width, height, phone] of [['en', 390, 844, true], ['ms', 390, 844, true], ['en', 1440, 900, false]]) {
    const { ctx, page } = await open({ width, height, phone });
    await page.goto(`${BASE}/${lang}/kul/parking`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    rows.push({ lang, width, ...(await densityOf(page)) });
    await ctx.close();
  }
  out({ id: 'density-parking', rows });
}

const shiftScript = () => {
  window.__shifts = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__shifts.push({
        v: +e.value.toFixed(4),
        t: Math.round(e.startTime),
        src: (e.sources || []).map((s) => {
          const n = s.node;
          const label = n && n.nodeType === 1 ? `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${n.dataset && Object.keys(n.dataset).length ? '[' + Object.keys(n.dataset).join(',') + ']' : ''} "${(n.textContent || '').trim().slice(0, 40)}"` : n ? `#text "${n.textContent.trim().slice(0, 40)}"` : '?';
          return `${label} y,h ${Math.round(s.previousRect.y)},${Math.round(s.previousRect.height)}->${Math.round(s.currentRect.y)},${Math.round(s.currentRect.height)}`;
        }),
      });
    }
  }).observe({ type: 'layout-shift', buffered: true });
};

if (want('cls')) {
  const paths = (process.env.CLS_PATHS || '/en/kul/transport,/ms/kul/transport').split(',');
  for (const p of paths) {
    for (const [name, opts] of [['desktop 1440x900', { width: 1440, height: 900, phone: false }], ['phone 390x844', { width: 390, height: 844, phone: true }]]) {
      const totals = [];
      let detail = null;
      for (let r = 0; r < 3; r++) {
        const { ctx, page } = await open(opts);
        if (process.env.CPU) {
          const cdp = await ctx.newCDPSession(page);
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU) });
        }
        await page.addInitScript(shiftScript);
        await page.goto(BASE + p, { waitUntil: 'load' });
        await page.waitForTimeout(3500);
        const shifts = await page.evaluate(() => window.__shifts);
        totals.push(+shifts.reduce((a, e) => a + e.v, 0).toFixed(4));
        if (shifts.length) detail = shifts;
        await ctx.close();
      }
      out({ id: 'cls', p, name, totals, detail: process.env.VERBOSE ? detail : detail?.map((d) => ({ v: d.v, t: d.t, n: d.src.length, first: d.src.slice(0, 3) })) });
    }
  }
}

if (want('fare')) {
  const res = {};
  for (const [lang, size, width, height] of [['en', 100, 1440, 900], ['en', 125, 1440, 900], ['ms', 100, 1440, 900], ['ms', 125, 1440, 900], ['en', 100, 390, 844], ['en', 125, 390, 844], ['ms', 100, 390, 844], ['ms', 125, 390, 844]]) {
    const { ctx, page } = await open({ width, height, phone: width < 640, textSize: size });
    await page.goto(`${BASE}/${lang}/kul/transport`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const glance = page.locator('[data-transport-glance]');
    const fare = glance.locator('li').first().locator(':scope > div.shrink-0, :scope > [data-glance-figure]').first();
    const warning = page.locator('main [role="note"]').filter({ hasText: lang === 'en' ? 'Book taxis only' : 'Tempah teksi' }).first();
    const wbox = await warning.boundingBox().catch(() => null);
    const box = await fare.boundingBox().catch(() => null);
    const gbox = await glance.boundingBox().catch(() => null);
    const h1 = await page.locator('main h1').first().boundingBox();
    res[`${lang} ${size}% ${width}`] = { fareTop: box ? Math.round(box.y) : null, fareBottom: box ? Math.round(box.y + box.height) : null, glanceTop: gbox ? Math.round(gbox.y) : null, glanceBottom: gbox ? Math.round(gbox.y + gbox.height) : null, h1Top: Math.round(h1.y), h1Height: Math.round(h1.height), warningTop: wbox ? Math.round(wbox.y) : null, fareText: box ? (await fare.innerText()).slice(0, 40) : null };
    await ctx.close();
  }
  out({ id: 'fare', res });
}

if (want('map')) {
  const rows = [];
  const cases = [];
  for (const w of [320, 360, 390, 640, 768, 1024, 1280, 1440, 1920]) cases.push({ width: w, height: 900, scale: 1, label: `${w}` });
  // 200% browser zoom: half the CSS width at twice the device pixels.
  for (const w of [1280, 1440, 1920]) cases.push({ width: w / 2, height: 450, scale: 2, label: `${w}@200%` });
  for (const c of cases) {
    const { ctx, page } = await open({ width: c.width, height: c.height, phone: c.width < 640, scale: c.scale });
    await page.goto(`${BASE}/en/airports`, { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => {
      const svgs = [...document.querySelectorAll('main svg[role="img"]')].filter((s) => s.querySelector('text'));
      const clipped = [];
      let labels = 0;
      for (const svg of svgs) {
        const sb = svg.getBoundingClientRect();
        for (const t of svg.querySelectorAll('text')) {
          labels += 1;
          const b = t.getBoundingClientRect();
          if (b.left < sb.left - 0.5 || b.right > sb.right + 0.5 || b.top < sb.top - 0.5 || b.bottom > sb.bottom + 0.5) clipped.push(`${t.textContent} ${Math.round(b.left - sb.left)}..${Math.round(sb.right - b.right)} h${Math.round(b.height)}`);
        }
      }
      const doc = document.documentElement;
      return { svgs: svgs.length, labels, clipped, hscroll: doc.scrollWidth > doc.clientWidth };
    });
    rows.push({ case: c.label, ...r });
    await ctx.close();
  }
  out({ id: 'map-labels', rows });
}

await browser.close();
