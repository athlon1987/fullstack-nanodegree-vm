#!/usr/bin/env node
/**
 * Round-four acceptance measurements (docs/qa/verification.md, "Round four"; re-review 6.1 items 1 to
 * 10 and the gallery notes in docs/prototype/README.md). The e2e suite asserts pass or fail; this
 * script records the numbers and texts behind each verdict, one JSON line per block.
 *
 * The browser clock is fixed where flights matter (18 November 2026, 09:40 Kuala Lumpur time, the
 * e2e suite's instant): the demonstration feed answers for the page's instant, so MH 2626 is delayed
 * from 10:50 to 12:00, its arrive-by time has passed and check-in is open, on every run.
 *
 * Usage: node scripts/qa/acceptance-round4.mjs [BASE_URL] [only=comma,separated,block,ids]
 * Blocks: status, day, ask, concierge-ui, search, placement, density, thin, handoffs, malay, gallery,
 *         offline
 */
import { chromium, devices } from '@playwright/test';

const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, '');
const only = process.argv[3] ? new Set(process.argv[3].split(',')) : null;
const MORNING = new Date('2026-11-18T09:40:00+08:00');
const MH2626 = { id: 'mh2626-20261118-d', airport: 'kul', number: 'MH2626', direction: 'd', date: '2026-11-18', route: 'Kuala Lumpur to Singapore', savedAt: '2026-11-18T01:00:00.000Z' };
const ip = () => `10.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
const out = (o) => console.log(JSON.stringify(o));
const want = (id) => !only || only.has(id);
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

const browser = await chromium.launch();

/** A fresh context and page: phone (Pixel 7 at the given size) or desktop, fixed clock, storage. */
async function open({ width = 390, height = 844, phone = true, clock = MORNING, journey = null, needs = null, textSize = 100, airport = 'kul' } = {}) {
  const ctx = await browser.newContext({ ...(phone ? devices['Pixel 7'] : {}), viewport: { width, height }, extraHTTPHeaders: { 'x-e2e-client-ip': ip() } });
  await ctx.addInitScript(([a, j, n, size]) => {
    try {
      if (a) localStorage.setItem('ma:airport:v1', JSON.stringify({ airport: a }));
      localStorage.setItem('ma:preferences:v1', JSON.stringify({ theme: 'light', textSize: size, highContrast: false, reducedMotion: true }));
      if (j) localStorage.setItem('ma:journey:v1', JSON.stringify(j));
      if (n) localStorage.setItem('ma:needs:v1', JSON.stringify(n));
    } catch {}
  }, [airport, journey, needs, textSize]);
  const page = await ctx.newPage();
  if (clock) await page.clock.setFixedTime(clock);
  return { ctx, page };
}
const docTop = (locator) => locator.evaluate((e) => Math.round(e.getBoundingClientRect().top + window.scrollY));
const mainText = (page) => page.locator('main').innerText();

async function askApi(question, lang = 'en', airport = 'kul') {
  const res = await fetch(`${BASE}/api/concierge`, { method: 'POST', headers: { 'content-type': 'application/json', origin: BASE, 'x-e2e-client-ip': ip() }, body: JSON.stringify({ question, lang, airport }) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

// 6.1.1: status lines worked out from notices.
if (want('status')) {
  const res = {};
  for (const lang of ['en', 'ms']) {
    const { ctx, page } = await open({ width: 1440, height: 900, phone: false });
    await page.goto(`${BASE}/${lang}/kul`, { waitUntil: 'networkidle' });
    const text = await mainText(page);
    const lines = await page.$$eval('main [data-ops-service]', (els) => els.map((e) => ({ service: e.getAttribute('data-ops-service'), state: e.getAttribute('data-ops-state') ?? e.querySelector('[data-ops-state]')?.getAttribute('data-ops-state'), text: e.textContent.replace(/\s+/g, ' ').trim().slice(0, 140) })));
    res[`/${lang}/kul`] = { lines, checkedTime: (text.match(/(Checked|Disemak) \d\d[:.]\d\d/g) || []).length, noDisruption: (text.match(/No disruption|Tiada gangguan/gi) || []).length, notAvailable: (text.match(/Status not available|Status tidak tersedia/g) || []).length, noticeDated: (text.match(/Notice dated|Notis bertarikh/g) || []).length, lead: clean(text.match(/(From notices published up to[^.]*\.|Daripada notis[^.]*\.)/)?.[0]) };
    await ctx.close();
  }
  for (const [label, clock] of [['real clock', null], ['2026-12-20 10:00', new Date('2026-12-20T10:00:00+08:00')]]) {
    for (const lang of ['en', 'ms']) {
      const { ctx, page } = await open({ clock });
      await page.goto(`${BASE}/${lang}`, { waitUntil: 'networkidle' });
      const summary = page.locator('main summary', { hasText: /Services at KLIA now|Perkhidmatan di KLIA sekarang/ }).first();
      res[`/${lang} home strip (${label})`] = clean(await summary.evaluate((s) => [...s.querySelectorAll('*')].filter((e) => e.childElementCount === 0 && e.getBoundingClientRect().height > 0).map((e) => e.textContent).join(' ')).catch(() => 'not found'));
      await ctx.close();
    }
  }
  for (const path of [`/en/kul/flights/${MH2626.id}`, '/en/kul/transit', '/ms/kul/transit']) {
    const { ctx, page } = await open();
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const text = await mainText(page);
    res[path] = { checkedTime: (text.match(/(Checked|Disemak) \d\d[:.]\d\d/g) || []).length, noDisruption: (text.match(/No disruption|Tiada gangguan/gi) || []).length, notAvailable: (text.match(/Status not available|Status tidak tersedia/g) || []).length, inline: clean(text.match(/(From notices published up to[^.;]*[.;][^.]*\.|Daripada notis[^.;]*[.;][^.]*\.)/)?.[0]) };
    await ctx.close();
  }
  const concierge = await askApi('Is the Aerotrain running?');
  res.conciergeAerotrain = clean(JSON.stringify(concierge.json ?? concierge.text)).slice(0, 600);
  const conciergeTrain = await askApi('Is the KLIA Ekspres running normally?');
  res.conciergeTrain = clean(JSON.stringify(conciergeTrain.json ?? conciergeTrain.text)).match(/[^"]*(disruption|Status not available|status)[^"]*/i)?.[0] ?? null;
  out({ id: '6.1.1', res });
}

// 6.1.2: day of travel (MH 2626 delayed; arrive-by passed; check-in open).
if (want('day')) {
  const journey = { flights: [MH2626], places: [], parkedCar: null };
  const res = {};
  {
    const { ctx, page } = await open({ journey });
    await page.goto(`${BASE}/en`, { waitUntil: 'networkidle' });
    res.homeCard = clean(await page.getByRole('main').getByRole('region', { name: 'Your saved flight' }).innerText());
    await page.goto(`${BASE}/en/journey`, { waitUntil: 'networkidle' });
    const card = page.getByRole('main').locator('li', { has: page.getByRole('link', { name: /MH 2626/ }) }).first();
    res.journeyDeadline = clean(await card.locator('[data-deadline]').first().innerText().catch(() => 'none'));
    res.journeyNext = clean(await card.locator('[data-next-step]').first().innerText().catch(() => 'none'));
    await ctx.close();
  }
  {
    const { ctx, page } = await open({ journey, needs: ['wheelchair', 'older'] });
    await page.goto(`${BASE}/en/kul/flights/${MH2626.id}`, { waitUntil: 'networkidle' });
    res.flightSummary = clean(await page.locator('main [data-flight-summary]').innerText()).slice(0, 300);
    res.steps = await page.$$eval('main [data-step]', (els) => els.map((e) => `${e.getAttribute('data-step')}: ${e.textContent.replace(/\s+/g, ' ').trim().slice(0, 110)}`));
    res.doneCount = await page.locator('main [data-step]').filter({ hasText: 'Done:' }).count();
    res.pastCount = await page.locator('main [data-step]').filter({ hasText: 'Past:' }).count();
    res.assistanceWarning = clean(await page.locator('[data-step="assistance"] [data-step-warning]').innerText().catch(() => 'none'));
    await ctx.close();
  }
  {
    const { ctx, page } = await open({ clock: new Date('2026-11-17T18:00:00+08:00'), needs: ['wheelchair'] });
    await page.goto(`${BASE}/en/kul/flights/${MH2626.id}`, { waitUntil: 'networkidle' });
    res.mhNoticePeriod = clean(await page.locator('[data-step="assistance"]').innerText()).slice(0, 400);
    // Another airline, inside two days: nothing invented.
    const feed = await (await fetch(`${BASE}/en/flights/feed?date=2026-11-18&dir=d&at=${Date.parse('2026-11-17T10:00:00Z')}&airports=kul`, { headers: { 'x-e2e-client-ip': ip() } })).json();
    const ak = feed.days?.[0]?.flights?.find((f) => f.airline?.code === 'AK' && f.scheduled > '2026-11-18T08');
    if (ak) {
      await page.goto(`${BASE}/en/kul/flights/${ak.id}`, { waitUntil: 'networkidle' });
      res.otherAirline = { flight: ak.id, text: clean(await page.locator('[data-step="assistance"]').innerText().catch(() => 'none')).slice(0, 400) };
    }
    await ctx.close();
  }
  out({ id: '6.1.2', res });
}

// 6.1.3 and 6.1.4: one fact, one answer; concierge answers (API).
if (want('ask')) {
  const res = {};
  const page = await (await browser.newContext({ extraHTTPHeaders: { 'x-e2e-client-ip': ip() } })).newPage();
  await page.goto(`${BASE}/en/kul/parking`, { waitUntil: 'networkidle' });
  res.pageLines = await page.$$eval('[data-parking-matrix] [data-car-park]', (rows) => rows.map((r) => `${r.getAttribute('data-car-park')}: ${(r.querySelector('[data-rate-line]')?.textContent ?? '(no line)').trim()} | unverified cells ${r.querySelectorAll('[data-rate-verified="false"]').length}`));
  await page.goto(`${BASE}/en/help/parking-transport`, { waitUntil: 'networkidle' });
  res.helpMentionsOldWording = (await mainText(page)).includes('not yet verified in this prototype');
  const questions = [
    ['parking', 'How much does parking cost at KLIA?', 'en'],
    ['weather', 'What will the weather be like tomorrow at KLIA?', 'en'],
    ['durian', 'Can I bring durian in my hand luggage?', 'en'],
    ['wheelchair AirAsia', 'I need a wheelchair at the gate, I fly AirAsia', 'en'],
    ['wheelchair MH', 'I need a wheelchair at the gate, I fly Malaysia Airlines', 'en'],
    ['kerusi roda AirAsia', 'kerusi roda untuk penerbangan AirAsia di KLIA T2', 'ms'],
    ['tandas OKU', 'Di mana tandas OKU berhampiran pintu C?', 'ms'],
    ['accessible toilet', 'Where is the accessible toilet near gate C?', 'en'],
    ['lift', 'Is there a lift from arrivals to the train?', 'en'],
    ['smoking', 'Where can I smoke at KLIA?', 'en'],
    ['ekspres fare', 'How much is the KLIA Ekspres?', 'en'],
  ];
  for (const [key, q, lang] of questions) {
    const a = await askApi(q, lang);
    const body = a.json ?? {};
    const answer = body.answer ?? body;
    const lead = answer.lead ?? answer.text ?? answer.summary ?? answer.statements?.[0]?.text ?? null;
    res[key] = { status: a.status, lead: clean(typeof lead === 'string' ? lead : JSON.stringify(lead)).slice(0, 260), cards: (answer.cards ?? answer.items ?? []).map?.((c) => c.title ?? c.name).slice(0, 5), mentionsCalmRoom: /Calm Room|Bilik Tenang/.test(a.text), mentionsMh48: /48 hours|48 jam/.test(a.text), inEffect: /In effect|Berkuat kuasa/.test(a.text) };
  }
  out({ id: '6.1.3-6.1.4', res });
}

// 6.1.4: answer heights on a phone (collapsed, as the visitor first sees them).
if (want('concierge-ui')) {
  const rows = [];
  const { ctx, page } = await open({ clock: null });
  await page.goto(`${BASE}/en/concierge`, { waitUntil: 'networkidle' });
  for (const q of ['How much does parking cost at KLIA?', 'Which lounge is nearest to gate C?', 'I need a wheelchair at the gate, I fly AirAsia', 'Where is the accessible toilet near gate C?', 'How do I get from Terminal 1 to Terminal 2?', 'What will the weather be like tomorrow at KLIA?']) {
    const field = page.getByRole('textbox', { name: 'Your question' });
    await field.fill(q);
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await page.getByRole('log').getByRole('heading', { level: 3, name: q }).waitFor({ timeout: 30000 });
    await page.waitForTimeout(800);
    const turn = page.getByRole('log').locator('ol > li').filter({ has: page.getByRole('heading', { level: 3, name: q }) }).last();
    const box = await turn.boundingBox();
    const more = await turn.getByRole('button', { name: /^Show \d+ more/ }).count();
    rows.push({ q, collapsedHeight: Math.round(box.height), moreButton: more > 0, contactsVisible: await turn.getByRole('list', { name: 'Official contacts' }).isVisible().catch(() => false) });
  }
  await ctx.close();
  out({ id: '6.1.4-heights-390', rows });
}

// 6.1.5: search relevance (first five results) and the home field's topic status.
if (want('search')) {
  const res = {};
  const { ctx, page } = await open({ width: 1440, height: 900, phone: false, clock: null });
  for (const [lang, q] of [['en', 'fast track'], ['en', 'smoking'], ['ms', 'merokok'], ['en', 'wifi'], ['en', 'Wi-Fi'], ['en', 'taxi'], ['en', 'accessible toilet'], ['ms', 'tandas OKU'], ['en', 'surau'], ['en', 'parking'], ['en', 'MH 2'], ['en', 'lift']]) {
    await page.goto(`${BASE}/${lang}/search?q=${encodeURIComponent(q)}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const titles = await page.$$eval('main li a[href]', (as) => as.map((a) => (a.querySelector('h2, h3, strong, [data-title]')?.textContent ?? a.textContent).replace(/\s+/g, ' ').trim().slice(0, 60)).filter(Boolean));
    const count = clean(await page.locator('main [role="status"]').first().innerText().catch(() => ''));
    res[`${lang}:${q}`] = { status: count.slice(0, 80), first5: titles.slice(0, 5), liquids: titles.some((t) => /liquid/i.test(t)) };
  }
  await page.goto(`${BASE}/en`, { waitUntil: 'networkidle' });
  const box = page.getByRole('main').getByRole('searchbox').first();
  await box.fill('parking');
  await page.waitForTimeout(2500);
  res.homeTopicStatus = clean(await page.getByRole('main').getByRole('status').filter({ hasText: /parking/ }).first().innerText().catch(() => 'none'));
  res.homeZeroFlights = await page.getByRole('main').getByRole('status').filter({ hasText: /0 flights found/ }).count();
  await ctx.close();
  out({ id: '6.1.5', res });
}

// 6.1.6: answer first and placement.
if (want('placement')) {
  const res = {};
  for (const [lang, size] of [['en', 100], ['ms', 100], ['ms', 125]]) {
    const { ctx, page } = await open({ textSize: size, clock: null });
    await page.goto(`${BASE}/${lang}/kul/transport`, { waitUntil: 'networkidle' });
    const glance = page.locator('[data-transport-glance]');
    const fare = glance.getByText(/RM\s?55/).first();
    const warning = page.getByRole('main').getByRole('note').filter({ hasText: lang === 'en' ? 'Book taxis only at the coupon counters' : 'Tempah teksi hanya di kaunter kupon' }).first();
    const firstTaxi = page.locator('main [id*="taxi"], main [data-mode="taxi"]').first();
    res[`transport ${lang} ${size}%`] = { fareTop: await docTop(fare).catch(() => null), warningTop: await docTop(warning).catch(() => null), firstTaxiTop: await docTop(firstTaxi).catch(() => null), h1Top: await docTop(page.locator('main h1').first()) };
    await ctx.close();
  }
  {
    const { ctx, page } = await open({ clock: null });
    await page.goto(`${BASE}/en/kul/transit`, { waitUntil: 'networkidle' });
    res.transitSummaryTop = await docTop(page.locator('[data-verdict-summary]')).catch(() => null);
    res.transitVerdictCardTop = await docTop(page.locator('#transit-verdict-title')).catch(() => null);
    await page.getByRole('combobox', { name: 'Time between flights' }).selectOption({ index: 0 });
    await page.waitForTimeout(600);
    const s = page.locator('[data-verdict-summary]');
    res.transitSummaryAfterChange = { inViewTop: Math.round((await s.boundingBox())?.y ?? -1), text: clean(await s.innerText()).slice(0, 120) };
    await page.goto(`${BASE}/en/kul/map?from=l5-kerb&to=g-gates-c`, { waitUntil: 'networkidle' });
    const main = page.getByRole('main');
    res.mapFromTop = await docTop(main.getByRole('combobox', { name: 'From' }));
    res.mapDisclaimerTop = await docTop(main.locator('[data-map-disclaimer]'));
    res.mapDisclaimerOverlaps = await page.evaluate(() => {
      const strip = document.querySelector('[data-map-disclaimer]').getBoundingClientRect();
      return [...document.querySelectorAll('main button, main [data-poi], main svg text, main [data-level-chip]')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && !(b.right <= strip.left || b.left >= strip.right || b.bottom <= strip.top || b.top >= strip.bottom); }).length;
    });
    await ctx.close();
  }
  for (const lang of ['en', 'ms']) {
    const { ctx, page } = await open({ width: 1440, height: 900, phone: false });
    await page.goto(`${BASE}/${lang}/kul/flights`, { waitUntil: 'networkidle' });
    const row = page.getByRole('main').locator('tbody tr', { has: page.locator('[data-status]') }).first();
    const box = await row.boundingBox();
    res[`board first row 1440x900 ${lang}`] = { top: Math.round(box.y), bottom: Math.round(box.y + box.height) };
    await ctx.close();
  }
  for (const lang of ['en', 'ms']) {
    const { ctx, page } = await open({ needs: null });
    await page.goto(`${BASE}/${lang}/kul/flights/${MH2626.id}`, { waitUntil: 'networkidle' });
    res[`flight page 390 ${lang}`] = { follow: await docTop(page.getByRole('main').getByRole('button', { name: /^(Follow|Ikuti)/ }).first()).catch(() => null), myNeeds: await docTop(page.locator('main [data-needs-link]')).catch(() => null), needsControl: await docTop(page.locator('#needs-control')).catch(() => null), timeline: await docTop(page.locator('main [data-step]').first()).catch(() => null), twoScreens: 1688 };
    await ctx.close();
  }
  {
    const { ctx, page } = await open({ width: 320, height: 256, clock: null });
    await page.goto(`${BASE}/en/kul/flights`, { waitUntil: 'networkidle' });
    for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(250); }
    res.zoom400 = { scrollChrome: await page.locator('html').getAttribute('data-scroll-chrome'), stickyOffset: await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--spacing-sticky').trim()) };
    await page.goto(`${BASE}/en/concierge`, { waitUntil: 'networkidle' });
    res.zoom400.composerPosition = await page.locator('[data-sticky-bottom]').first().evaluate((e) => getComputedStyle(e).position).catch(() => null);
    await ctx.close();
  }
  for (const lang of ['en', 'ms']) {
    const { ctx, page } = await open({ width: 320, height: 568, textSize: 125, clock: null });
    await page.goto(`${BASE}/${lang}/kul/facilities`, { waitUntil: 'networkidle' });
    res[`facilities 320 125% ${lang}`] = await page.evaluate(() => ({ clipped: [...document.querySelectorAll('main [data-provenance]')].filter((c) => c.getBoundingClientRect().width > 0 && c.scrollWidth > c.clientWidth + 1).length, scrollWidth: document.documentElement.scrollWidth }));
    await ctx.close();
  }
  out({ id: '6.1.6', res });
}

// 6.1.7 (A-14): density at 390 px, the A-14 counting method plus "Demo" labels.
if (want('density')) {
  const rows = [];
  const { ctx, page } = await open({ clock: null });
  for (const p of ['/en/kul/facilities', '/en/kul/transport', '/en/kul/transit', '/en/kul/map', '/en/kul/parking']) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    rows.push({ p, ...(await page.evaluate(() => {
      const main = document.querySelector('main');
      const vis = (e) => e.getBoundingClientRect().height > 0;
      return {
        provenanceTags: [...main.querySelectorAll('[data-provenance]')].filter(vis).length,
        sourceToggles: [...main.querySelectorAll('details:has([data-source-marker]) > summary, [data-source-marker]')].filter(vis).length,
        demoLabels: [...main.querySelectorAll('[data-provenance="demo"], [data-demo-label]')].filter(vis).length,
        fontSizes: new Set([...main.querySelectorAll('*')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => getComputedStyle(e).fontSize)).size,
        screens: Math.round((document.documentElement.scrollHeight / innerHeight) * 10) / 10,
      };
    })) });
  }
  await ctx.close();
  out({ id: '6.1.7', rows });
}

// 6.1.8: thin and directory-only airports.
if (want('thin')) {
  const res = {};
  const { ctx, page } = await open({ width: 1440, height: 900, phone: false, clock: null, airport: null });
  await page.goto(`${BASE}/en/lwy`, { waitUntil: 'networkidle' });
  res.lawas = { radios: await page.getByRole('main').getByRole('radio').count(), airlines: clean(await page.locator('main [data-airlines]').innerText().catch(() => 'none')).slice(0, 160), ownContact: clean(await page.locator('main [data-own-contact]').innerText().catch(() => 'none')).slice(0, 200) };
  await page.goto(`${BASE}/en/kul`, { waitUntil: 'networkidle' });
  res.kliaAirlines = clean(await page.locator('main [data-airlines]').innerText().catch(() => 'none')).slice(0, 200);
  for (const lang of ['en', 'ms']) {
    await page.goto(`${BASE}/${lang}/airports`, { waitUntil: 'networkidle' });
    const chips = await page.$$eval('[data-airport] [data-depth]', (els) => els.map((e) => e.textContent.trim()));
    const counts = {};
    for (const c of chips) counts[c] = (counts[c] ?? 0) + 1;
    res[`/${lang}/airports`] = { cards: chips.length, counts, legend: await page.getByRole('heading', { name: /What each airport has here|Apa yang ada/ }).count() };
  }
  await ctx.close();
  out({ id: '6.1.8', res });
}

// 6.1.9: hand-offs carry data-handoff (the analytics script adds the campaign on click).
if (want('handoffs')) {
  const res = {};
  const { ctx, page } = await open({ width: 1440, height: 900, phone: false });
  for (const p of ['/en/kul/parking', '/en/kul/facilities', '/en/kul/lounges', '/en/kul/transport', '/en/kul', `/en/kul/flights/${MH2626.id}`]) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    res[p] = await page.$$eval('main a[data-handoff]', (as) => {
      const c = {};
      for (const a of as) { const k = `${a.dataset.handoff} -> ${new URL(a.href).host}`; c[k] = (c[k] ?? 0) + 1; }
      return c;
    });
  }
  await ctx.close();
  out({ id: '6.1.9', res });
}

// 6.1.10: accessibility statement and Malay copy.
if (want('malay')) {
  const res = {};
  const { ctx, page } = await open({ clock: null });
  await page.goto(`${BASE}/ms`, { waitUntil: 'networkidle' });
  res.msH1 = clean(await page.locator('main h1').first().innerText());
  res.msPlaceholder = await page.getByRole('main').getByRole('searchbox').first().getAttribute('placeholder');
  res.msPlaceholderFits = await page.getByRole('main').getByRole('searchbox').first().evaluate((input) => {
    const s = getComputedStyle(input);
    const c = document.createElement('canvas').getContext('2d');
    c.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    const slot = input.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
    return { text: Math.round(c.measureText(input.placeholder).width), slot: Math.round(slot) };
  });
  await page.goto(`${BASE}/ms/concierge`, { waitUntil: 'networkidle' });
  res.msConciergeH1 = clean(await page.locator('main h1').first().innerText());
  res.msConciergeTitle = await page.title();
  for (const p of ['/ms', '/ms/kul', '/ms/privacy', '/ms/offline', '/ms/help']) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    res[`concierge word on ${p}`] = ((await page.locator('body').innerText()).match(/concierge/gi) || []).length;
  }
  for (const lang of ['en', 'ms']) {
    await page.goto(`${BASE}/${lang}/accessibility#statement`, { waitUntil: 'networkidle' });
    const st = clean(await page.locator('#statement').innerText());
    res[`statement ${lang}`] = { reviewed: st.match(/(Last reviewed|Kali terakhir disemak|disemak)[^.]*\./i)?.[0] ?? null, zoom: /200 and 400 per cent|200 dan 400 peratus/.test(st), focusStaysOld: /focus stays where it was/.test(st), contact: clean(await page.locator('#statement [data-accessibility-contact]').innerText().catch(() => 'none')).slice(0, 220) };
  }
  await ctx.close();
  out({ id: '6.1.10', res });
}

// Gallery notes 1 to 4.
if (want('gallery')) {
  const res = {};
  for (const [path, title] of [['/en/no-such-page', 'Page not found'], ['/ms/tiada-halaman', 'Halaman tidak ditemui'], ['/en/guides/no-such-guide', 'Page not found'], ['/en/kul/no-such-section', 'Page not found']]) {
    const r = await fetch(BASE + path, { headers: { 'x-e2e-client-ip': ip() } });
    const html = await r.text();
    const { ctx, page } = await open({ width: 1440, height: 900, phone: false, clock: null });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    res[path] = { status: r.status, h1InHtml: html.includes(`${title}</h1>`), failedBoundaries: (html.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/g, '').match(/<!--\$!-->/g) || []).length, consoleErrors: errors.filter((e) => !/Failed to load resource/.test(e)) };
    await ctx.close();
  }
  {
    const { ctx, page } = await open({ clock: new Date('2026-11-18T11:00:00+08:00'), airport: 'iph' });
    await page.goto(`${BASE}/en/iph`, { waitUntil: 'networkidle' });
    res.ipohPreview = await page.$$eval('main li, main tr', (rows) => rows.filter((r) => r.querySelector('[data-status]') && r.getBoundingClientRect().height > 0).map((r) => `${(r.querySelector('time')?.textContent ?? '').trim()} ${(r.querySelector('[data-row-day]')?.textContent ?? '').trim()}`.trim()).slice(0, 6));
    await ctx.close();
  }
  out({ id: 'gallery', res });
}

// Gallery note 3 on the production service worker: the toast and the status card on /en/offline when
// the connection drops (a) before the worker is ready and (b) after it controls the page, and (c)
// whether a registration that failed offline is retried when the connection returns.
if (want('offline')) {
  const res = {};
  const read = async (page) => ({
    saving: await page.locator('[data-saving]').getAttribute('data-saving').catch(() => null),
    card: clean(await page.locator('[data-saving]').innerText().catch(() => '')).slice(0, 220),
    toast: clean((await page.getByRole('status').allInnerTexts()).filter((t) => /offline|online|saved/i.test(t)).join(' | ')).slice(0, 220),
    controlled: await page.evaluate(() => Boolean(navigator.serviceWorker?.controller)),
  });
  {
    const ctx = await browser.newContext({ ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, extraHTTPHeaders: { 'x-e2e-client-ip': ip() } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/en/offline`, { waitUntil: 'domcontentloaded' });
    await ctx.setOffline(true);
    await page.waitForTimeout(3000);
    res.droppedBeforeReady = await read(page);
    await ctx.setOffline(false);
    await page.waitForTimeout(8000);
    res.afterReconnect = { ...(await read(page)), registrations: await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map((r) => Boolean(r.active))) };
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, extraHTTPHeaders: { 'x-e2e-client-ip': ip() } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/en/offline`, { waitUntil: 'networkidle' });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await ctx.setOffline(true);
    await page.waitForTimeout(2000);
    res.droppedAfterReady = await read(page);
    await ctx.close();
  }
  out({ id: 'gallery-3-offline', res });
}

await browser.close();
