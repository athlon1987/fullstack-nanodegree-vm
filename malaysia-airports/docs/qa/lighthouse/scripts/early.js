/* early.js: interaction during hydration. 4x CPU; tap at DOMContentLoaded + delay; Event Timing records the wait. */
const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const res = [];
  for (const [path, sel] of [['/en', 'label:has(input[type=radio][value=arriving])'], ['/en/kul/flights', 'main [role=tab] >> nth=1']]) for (const delay of [0, 300, 600]) for (let r = 0; r < 2; r++) {
    const ctx = await b.newContext({ ...devices['Pixel 7'] }); const p = await ctx.newPage();
    await p.addInitScript(() => { window.__ev = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.interactionId) window.__ev.push([e.name, Math.round(e.duration), Math.round(e.processingStart - e.startTime), Math.round(e.startTime)]); }).observe({ type: 'event', durationThreshold: 16, buffered: true }); });
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.goto('http://localhost:3101' + path, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(delay);
    const t = Date.now(); try { await p.locator(sel).first().tap({ timeout: 10000, force: true }); } catch (e) {}
    await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);
    const ev = await p.evaluate(() => window.__ev); const worst = ev.sort((a, b) => b[1] - a[1])[0];
    res.push({ path, delay, worst }); console.log(path, 'tap at DCL+' + delay + 'ms', 'worst', JSON.stringify(worst), 'checked?', await p.locator(sel.split(' >> ')[0]).first().evaluate(e => e.querySelector?.('input')?.checked ?? e.getAttribute('aria-selected')).catch(() => '?'));
    await ctx.close(); }
  require('fs').writeFileSync(__dirname + '/early-results.json', JSON.stringify(res, null, 1)); await b.close(); })();
