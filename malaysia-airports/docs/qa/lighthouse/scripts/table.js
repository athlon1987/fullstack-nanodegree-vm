// table.js <dir> [order...]: markdown table of LH medians + per-run spread + resource split
const fs = require('fs'), path = require('path'); const dir = process.argv[2]; const order = process.argv.slice(3);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
const keys = order.length ? order : files.map(f => f.replace('.json', ''));
const kb = n => n == null ? 'n/a' : Math.round(n / 1024);
const s = ms => ms == null ? 'n/a' : (ms / 1000).toFixed(1) + ' s';
console.log('| Page | Runs | Perf (median; runs) | A11y | BP | SEO | FCP | LCP (median; runs) | TBT | CLS | SI | Transfer KB (JS / font / HTML / prefetch) | Requests | LCP element |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const k of keys) {
  const f = path.join(dir, k + '.json'); if (!fs.existsSync(f)) continue; const j = JSON.parse(fs.readFileSync(f, 'utf8')); const m = j.median; const d = j.diagnostics || {}; const r = d.resources || {};
  if (!m) { console.log(`| ${j.url.replace('http://localhost:3101', '')} | 0/${j.runs} | failed |`); continue; }
  const runsPerf = j.rows.filter(x => !x.error).map(x => x.performance).join('/'); const runsLcp = j.rows.filter(x => !x.error).map(x => (x.lcp_ms / 1000).toFixed(1)).join('/');
  console.log(`| ${j.url.replace('http://localhost:3101', '')} | ${j.validRuns}/${j.runs} | **${m.performance}** (${runsPerf}) | ${m.accessibility} | ${m.bestPractices} | ${m.seo} | ${s(m.fcp_ms)} | **${s(m.lcp_ms)}** (${runsLcp}) | ${m.tbt_ms} ms | ${m.cls} | ${s(m.si_ms)} | ${kb(m.totalBytes)} (${kb(r.script?.bytes)} / ${kb(r.font?.bytes)} / ${kb(r.document?.bytes)} / ${kb(r.other?.bytes)}) | ${m.requests} | ${(d.lcpElement?.selector || 'n/a').split(' > ').slice(-1)[0]} |`);
}
