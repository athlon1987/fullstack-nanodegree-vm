/* reveal.js: when do the streamed Suspense segments (hidden S:n divs) get revealed, versus first paint and layout shifts? */
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const path of ['/en/kul', '/en', '/en/concierge']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
    await p.addInitScript(() => { window.__log = []; const t = () => Math.round(performance.now());
      new MutationObserver(ms => { for (const m of ms) for (const n of m.removedNodes) if (n.nodeType === 1 && n.id && /^S:/.test(n.id)) window.__log.push([t(), 'reveal ' + n.id + ' (' + (n.innerHTML.length / 1024).toFixed(0) + ' KB html)']); for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.matches && n.matches('[aria-busy=true]')) window.__log.push([t(), 'loading fallback inserted']); }).observe(document, { childList: true, subtree: true });
      new PerformanceObserver(l => { for (const e of l.getEntries()) window.__log.push([Math.round(e.startTime), e.entryType === 'paint' ? e.name : 'layout-shift ' + e.value.toFixed(3) + ' ' + e.sources.map(s => s.node && s.node.tagName).join(',')]); }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(l => { for (const e of l.getEntries()) window.__log.push([Math.round(e.startTime), e.name]); }).observe({ type: 'paint', buffered: true });
      document.addEventListener('DOMContentLoaded', () => window.__log.push([t(), 'DOMContentLoaded; loading fallback in DOM: ' + !!document.querySelector('[aria-busy=true]')]));
    });
    await p.goto('http://localhost:3101' + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const log = await p.evaluate(() => window.__log.sort((a, b) => a[0] - b[0]));
    console.log('==', path, log.map(x => x[0] + 'ms ' + x[1]).join(' | '));
    await ctx.close(); }
  // screenshot of the first paint on desktop /en/kul with 4x CPU
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await p.goto('http://localhost:3101/en/kul', { waitUntil: 'commit' });
  await p.waitForFunction(() => performance.getEntriesByName('first-contentful-paint').length > 0, null, { polling: 10 });
  await p.screenshot({ path: __dirname + '/fcp-desktop-kul.jpg', type: 'jpeg', quality: 50 });
  console.log('screenshot at', await p.evaluate(() => Math.round(performance.now())), 'ms; S-divs still hidden:', await p.evaluate(() => [...document.querySelectorAll('div[hidden][id^="S:"]')].map(d => d.id).join(',')));
  await b.close(); })();
