/* cpuprof.js: CDP CPU profile of a page load (4x CPU throttle), self time aggregated by script URL,
 * plus the long tasks and time to hydration proxy. node cpuprof.js path... */
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const out = {};
  for (const path of process.argv.slice(2)) {
    const ctx = await b.newContext({ ...devices['Pixel 7'] }); const p = await ctx.newPage();
    await p.addInitScript(() => { window.__lt = []; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); });
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
    await p.goto('http://localhost:3101' + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(2000);
    const { profile } = await cdp.send('Profiler.stop');
    const lt = await p.evaluate(() => window.__lt);
    // self time per node
    const dt = {}; const ids = profile.samples; const deltas = profile.timeDeltas; for (let i = 0; i < ids.length; i++) dt[ids[i]] = (dt[ids[i]] || 0) + (deltas[i] || 0);
    const byUrl = {}, byFn = {}; let total = 0;
    for (const n of profile.nodes) { const t = (dt[n.id] || 0) / 1000; if (!t) continue; const cf = n.callFrame; const u = (cf.url || '(' + cf.functionName + ')').replace('http://localhost:3101', ''); if (['(idle)', '(program)'].includes(u)) continue; total += t; byUrl[u] = (byUrl[u] || 0) + t; const fk = u + ' :: ' + (cf.functionName || '(anon)') + ':' + cf.lineNumber + ':' + cf.columnNumber; byFn[fk] = (byFn[fk] || 0) + t; }
    const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => [k.slice(0, 110), Math.round(v)]);
    out[path] = { busyMs: Math.round(total), byUrl: top(byUrl), byFn: top(byFn), longTasks: lt, longTaskTotal: lt.reduce((s, x) => s + x[1], 0), tbtProxy: lt.reduce((s, x) => s + Math.max(0, x[1] - 50), 0) };
    console.log('==', path, 'busy(ms, 4x)', out[path].busyMs, 'longtasks', JSON.stringify(lt), 'TBT-proxy', out[path].tbtProxy);
    console.log('  byUrl', JSON.stringify(out[path].byUrl));
    console.log('  byFn', JSON.stringify(out[path].byFn.slice(0, 6)));
    await ctx.close();
  }
  require('fs').writeFileSync(__dirname + '/cpuprof-results.json', JSON.stringify(out, null, 1)); await b.close();
})();
