/* inp.js: INP proxy. Pixel 7 emulation (touch), CDP CPU throttling 4x for the whole session,
 * Event Timing (type 'event', durationThreshold 16, buffered) + long-animation-frame attribution.
 * node inp.js <runs> [scenarioName ...]   -> writes inp-results.json */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:3101';
const INIT = `(() => {
  const sel = n => { if (!n || !n.tagName) return null; let s = n.tagName.toLowerCase(); if (n.id) s += '#' + n.id; const a = n.getAttribute && (n.getAttribute('aria-label') || n.getAttribute('name') || n.getAttribute('value')); if (a) s += '[' + String(a).slice(0, 40) + ']'; return s; };
  window.__ev = []; window.__loaf = []; window.__ls = []; window.__hydr = null;
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__ev.push({ name: e.name, id: e.interactionId, start: e.startTime, dur: e.duration, inDelay: e.processingStart - e.startTime, proc: e.processingEnd - e.processingStart, pres: e.startTime + e.duration - e.processingEnd, target: sel(e.target) }); }).observe({ type: 'event', durationThreshold: 16, buffered: true });
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__loaf.push({ start: e.startTime, dur: e.duration, block: e.blockingDuration, scripts: (e.scripts || []).map(s => ({ src: (s.sourceURL || '').replace(location.origin, ''), fn: s.sourceFunctionName, inv: s.invoker, dur: Math.round(s.duration) })).sort((a, b) => b.dur - a.dur).slice(0, 3) }); }).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) {}
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__ls.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), src: e.sources.map(s => sel(s.node) + (s.node && s.node.className && typeof s.node.className === 'string' ? '.' + s.node.className.split(' ').slice(0, 3).join('.') : '')) }); }).observe({ type: 'layout-shift', buffered: true });
})();`;

const tapText = (p, re) => p.locator('button, [role=button], a, label').filter({ hasText: re }).first();
const SCEN = {
  home: { url: '/en', steps: [
    ['type in home flight search ("MH184")', async p => { await p.locator('#flight-search-input').tap(); await p.keyboard.type('MH184', { delay: 180 }); }],
    ['switch journey mode to Arriving', async p => { await p.locator('label:has(input[type=radio][value=arriving])').first().tap(); }],
    ['switch journey mode to Transiting', async p => { await p.locator('label:has(input[type=radio][value=transiting])').first().tap(); }],
    ['switch Departures/Arrivals to Arrivals', async p => { await p.locator('label:has(input[type=radio][value=a])').first().tap(); }],
    ['open airport switcher', async p => { await p.locator('button').filter({ hasText: /Choose airport|Choose an airport|Showing/ }).first().tap(); }],
    ['close airport switcher (Escape)', async p => { await p.keyboard.press('Escape'); }],
  ] },
  kul: { url: '/en/kul', steps: [
    ['open airport switcher', async p => { await p.locator('button').filter({ hasText: /KLIA|Choose airport|Showing/ }).first().tap(); }],
    ['type in switcher search ("pen")', async p => { await p.keyboard.type('pen', { delay: 180 }); }],
    ['close airport switcher (Escape)', async p => { await p.keyboard.press('Escape'); }],
  ] },
  board: { url: '/en/kul/flights', steps: [
    ['type in board filter ("MH")', async p => { await p.locator('main input[type=search]').first().tap(); await p.keyboard.type('MH', { delay: 180 }); }],
    ['clear board filter', async p => { await p.locator('main button[aria-label=Clear]').first().tap(); }],
    ['toggle a board filter chip', async p => { await p.locator('main button[aria-pressed]').first().tap(); }],
    ['switch to Arrivals tab', async p => { await p.locator('main [role=tab]').nth(1).tap(); }],
  ] },
  map: { url: '/en/kul/map', steps: [
    ['toggle map category filter #1', async p => { await p.locator('main button[aria-pressed]').first().tap(); }],
    ['toggle map category filter #2', async p => { await p.locator('main button[aria-pressed]').nth(1).tap(); }],
    ['switch map level to L3', async p => { await p.locator('label:has(input[type=radio][value=L3])').first().tap(); }],
    ['type in map search ("toilet")', async p => { await p.locator('main input[type=search]').first().tap(); await p.keyboard.type('toilet', { delay: 180 }); }],
  ] },
  journey: { url: '/en/journey', steps: [
    ['type in journey flight search ("MH1")', async p => { await p.locator('main input[type=search]').first().tap(); await p.keyboard.type('MH1', { delay: 180 }); }],
    ['switch Departures/Arrivals to Arrivals', async p => { await p.locator('main label:has(input[type=radio][value=a])').first().tap(); }],
    ['open "Note where you parked"', async p => { await p.locator('main button').filter({ hasText: /Note where you parked/ }).first().tap(); }],
  ] },
  concierge: { url: '/en/concierge', steps: [
    ['accept concierge consent ("Agree and start")', async p => { await p.locator('main button').filter({ hasText: /Agree and start/ }).first().tap(); }],
    ['type concierge question', async p => { const f = p.getByLabel('Your question').first(); await f.tap(); await p.keyboard.type('Where is the prayer room?', { delay: 120 }); }],
    ['submit concierge question (Enter)', async p => { await p.keyboard.press('Enter'); await p.waitForTimeout(2500); }],
  ] },
};

(async () => {
  const runs = Number(process.argv[2] || 3); const only = process.argv.slice(3);
  const b = await chromium.launch(); const out = {};
  for (const [name, sc] of Object.entries(SCEN)) {
    if (only.length && !only.includes(name)) continue;
    out[name] = { url: sc.url, runs: [] };
    for (let r = 0; r < runs; r++) {
      const ctx = await b.newContext({ ...devices['Pixel 7'] }); const p = await ctx.newPage();
      await p.addInitScript(INIT);
      const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const t0 = Date.now(); await p.goto(BASE + sc.url, { waitUntil: 'networkidle', timeout: 90000 }); const loadMs = Date.now() - t0;
      await p.waitForTimeout(1500);
      const steps = [];
      for (const [label, fn] of sc.steps) {
        const before = await p.evaluate(() => window.__ev.length);
        let err = null; try { await fn(p); } catch (e) { err = String(e.message).split('\n')[0].slice(0, 160); }
        await p.waitForTimeout(800);
        const evs = await p.evaluate(n => window.__ev.slice(n), before);
        const byId = {}; for (const e of evs) if (e.id) { if (!byId[e.id] || e.dur > byId[e.id].dur) byId[e.id] = e; }
        const inter = Object.values(byId).sort((a, b) => b.dur - a.dur);
        steps.push({ label, err, interactions: inter.length, worst: inter[0] ? { dur: inter[0].dur, name: inter[0].name, target: inter[0].target, inDelay: Math.round(inter[0].inDelay), proc: Math.round(inter[0].proc), pres: Math.round(inter[0].pres), start: Math.round(inter[0].start) } : null, all: inter.map(e => e.dur) });
      }
      const loaf = await p.evaluate(() => window.__loaf); const ls = await p.evaluate(() => window.__ls);
      const worst = steps.filter(s => s.worst).sort((a, b) => b.worst.dur - a.worst.dur)[0];
      const longFramesDuringInteractions = loaf.filter(l => worst && l.start >= worst.worst.start - 50 && l.start <= worst.worst.start + worst.worst.dur + 50);
      out[name].runs.push({ loadMs, steps, worst: worst ? { label: worst.label, ...worst.worst } : null, loafAtWorst: longFramesDuringInteractions.slice(0, 3), cls: +ls.reduce((s, x) => s + x.v, 0).toFixed(4), layoutShifts: ls.slice(0, 6), loafCount: loaf.length, loafBlockingTotal: Math.round(loaf.reduce((s, l) => s + (l.block || 0), 0)) });
      console.log(name, r + 1, 'worst', worst ? `${worst.worst.dur}ms ${worst.label} (${worst.worst.name} on ${worst.worst.target})` : 'none', 'steps:', steps.map(s => `${s.label}=${s.worst ? s.worst.dur : '-'}${s.err ? ' ERR ' + s.err : ''}`).join(' | '));
      await ctx.close();
    }
    const ws = out[name].runs.map(r => r.worst ? r.worst.dur : 0).sort((a, b) => a - b); out[name].medianWorst = ws[Math.floor(ws.length / 2)]; out[name].maxWorst = ws[ws.length - 1];
  }
  await b.close();
  const f = __dirname + '/inp-results' + (only.length ? '-' + only.join('-') : '') + '.json';
  fs.writeFileSync(f, JSON.stringify({ measured: new Date().toISOString(), method: 'Playwright Chromium (headless shell), Pixel 7 emulation, CDP Emulation.setCPUThrottlingRate 4, no network throttling, localhost next start; Event Timing type=event durationThreshold=16 buffered; interactions grouped by interactionId, worst per page reported', out }, null, 1));
  console.log('wrote', f);
})();
