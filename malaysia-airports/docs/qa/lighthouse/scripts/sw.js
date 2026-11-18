/* sw.js: what a first visit to /en downloads: page load vs service worker install (precache) vs RSC prefetch. */
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Pixel 7'] }); const p = await ctx.newPage();
  const reqs = []; let phase = 'load';
  ctx.on('requestfinished', async rq => { try { const s = await rq.sizes(); const resp = await rq.response(); const h = resp ? await resp.allHeaders() : {}; reqs.push({ phase, url: rq.url().replace('http://localhost:3101', ''), sw: !!rq.serviceWorker(), type: rq.resourceType(), body: s.responseBodySize, hdr: s.responseHeadersSize, enc: h['content-encoding'] || '', rsc: /_rsc=/.test(rq.url()) || h['content-type']?.includes('text/x-component') }); } catch (e) {} });
  await p.goto('http://localhost:3101/en', { waitUntil: 'load' }); phase = 'after-load';
  const t0 = Date.now();
  const state = await p.evaluate(async () => { const reg = await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 30000))]); return reg ? reg.active?.state : 'no-sw'; });
  await p.waitForTimeout(4000);
  const caches = await p.evaluate(async () => { const out = {}; for (const n of await caches.keys()) { const c = await caches.open(n); const ks = await c.keys(); let bytes = 0; const kinds = {}; for (const k of ks) { const r = await c.match(k); const sz = (await r.clone().arrayBuffer()).byteLength; bytes += sz; const kind = /woff2/.test(k.url) ? 'font' : /\.js/.test(k.url) ? 'js' : /\.css/.test(k.url) ? 'css' : 'page/other'; kinds[kind] = (kinds[kind] || { n: 0, bytes: 0 }); kinds[kind].n++; kinds[kind].bytes += sz; } out[n] = { entries: ks.length, bytes, kinds, sample: ks.slice(0, 6).map(k => k.url.replace(location.origin, '')) }; } return out; });
  const sum = f => reqs.filter(f).reduce((s, r) => s + (r.body || 0) + (r.hdr || 0), 0);
  const summary = {
    swState: state, waitedMs: Date.now() - t0,
    pageLoad: { n: reqs.filter(r => r.phase === 'load' && !r.sw).length, bytes: sum(r => r.phase === 'load' && !r.sw) },
    rscPrefetch: { n: reqs.filter(r => r.rsc && !r.sw).length, bytes: sum(r => r.rsc && !r.sw) },
    swInstall: { n: reqs.filter(r => r.sw).length, bytes: sum(r => r.sw), docs: reqs.filter(r => r.sw && !/\.(js|css|woff2|svg|png|ico|json|webmanifest)/.test(r.url)).map(r => r.url + ' ' + r.body) },
    afterLoadNonSw: { n: reqs.filter(r => r.phase !== 'load' && !r.sw).length, bytes: sum(r => r.phase !== 'load' && !r.sw) },
    total: { n: reqs.length, bytes: sum(() => true) }, caches,
  };
  console.log(JSON.stringify(summary, null, 1));
  require('fs').writeFileSync(__dirname + '/sw-results.json', JSON.stringify({ summary, reqs }, null, 1));
  await b.close();
})();
