/* cls.js: layout shifts with sources, LCP entries and font load timing. node cls.js <runs> path... */
const { chromium, devices } = require('playwright');
const INIT = `(() => {
  const d = n => { if (!n || !n.tagName) return String(n && n.nodeName); let s = n.tagName.toLowerCase(); if (n.id) s += '#' + n.id; if (typeof n.className === 'string' && n.className) s += '.' + n.className.trim().split(/\\s+/).slice(0, 4).join('.'); return s + ' "' + (n.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 50) + '"'; };
  window.__ls = []; window.__lcp = [];
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__ls.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), recent: e.hadRecentInput, src: e.sources.map(s => ({ node: d(s.node), prev: [s.previousRect.y, s.previousRect.height].map(Math.round), cur: [s.currentRect.y, s.currentRect.height].map(Math.round) })) }); }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp.push({ t: Math.round(e.startTime), size: e.size, el: d(e.element) }); }).observe({ type: 'largest-contentful-paint', buffered: true });
})();`;
(async () => {
  const runs = Number(process.argv[2] || 2); const paths = process.argv.slice(3);
  const b = await chromium.launch(); const res = {};
  for (const vp of ['mobile', 'desktop']) for (const path of paths) {
    const key = vp + ' ' + path; res[key] = [];
    for (let r = 0; r < runs; r++) {
      const ctx = await b.newContext(vp === 'mobile' ? { ...devices['Pixel 7'] } : { viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); await p.addInitScript(INIT);
      await p.goto('http://localhost:3101' + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
      const r1 = await p.evaluate(() => ({ ls: window.__ls, lcp: window.__lcp, fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0), fonts: performance.getEntriesByType('resource').filter(e => /woff2/.test(e.name)).map(e => e.name.split('/').pop().slice(0, 24) + '@' + Math.round(e.responseEnd)), scripts: performance.getEntriesByType('resource').filter(e => /\.js/.test(e.name)).length, cls: window.__ls.filter(x => !x.recent).reduce((s, x) => s + x.v, 0) }));
      res[key].push(r1); await ctx.close();
    }
    const c = res[key].map(x => +x.cls.toFixed(3)); const l = res[key].map(x => x.lcp.at(-1)?.t);
    console.log(key.padEnd(30), 'CLS', c.join('/'), 'FCP', res[key].map(x => x.fcp).join('/'), 'LCP', l.join('/'), '| LCP el:', res[key][0].lcp.at(-1)?.el?.slice(0, 90));
    for (const s of res[key][0].ls.filter(x => x.v > 0.001).slice(0, 4)) console.log('   shift', s.t + 'ms', s.v, JSON.stringify(s.src).slice(0, 400));
    console.log('   fonts', res[key][0].fonts.join(', '));
  }
  require('fs').writeFileSync(__dirname + '/cls-results.json', JSON.stringify(res, null, 1)); await b.close();
})();
