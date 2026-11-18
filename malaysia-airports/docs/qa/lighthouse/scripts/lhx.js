#!/usr/bin/env node
/* lhx.js: extended Lighthouse runner (serial). Based on tools/lh.js, adds desktop preset, custom throttling and diagnostics.
 * node lhx.js <outDir> <runs> [--preset=desktop] [--profile=name,rttMs,downKbps,upKbps,cpu] key=url ...
 * --profile uses DevTools (applied) throttling with Lighthouse's own conventions: requestLatency = rtt*3.75, down/up *0.9. */
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const TOOLS = '/tmp/claude-0/-home-user-fullstack-nanodegree-vm/f7e24a8d-574f-5218-93c6-cd7bdeffca09/scratchpad/tools';
const CHROME = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const args = process.argv.slice(2); const outDir = args[0]; const runs = Number(args[1] || 1);
const opts = args.slice(2).filter(a => a.startsWith('--')); const targets = args.slice(2).filter(a => !a.startsWith('--'));
let preset = null, profile = null;
for (const o of opts) { if (o.startsWith('--preset=')) preset = o.slice(9); if (o.startsWith('--profile=')) { const [name, rtt, down, up, cpu] = o.slice(10).split(','); profile = { name, rtt: +rtt, down: +down, up: +up, cpu: +cpu }; } }
fs.mkdirSync(outDir, { recursive: true });
const median = a => { const s = a.filter(x => x != null && !Number.isNaN(x)).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const strip = u => (u || '').replace('http://localhost:3101', '');
const sc = c => c?.score != null ? Math.round(c.score * 100) : null;
function diag(j) {
  const a = j.audits, c = j.categories; const items = k => a[k]?.details?.items || [];
  const lcpI = a['lcp-breakdown-insight']?.details?.items || [];
  const lcpNode = lcpI.find(i => i.type === 'node'); const lcpTable = lcpI.find(i => i.type === 'table');
  const m = items('metrics')[0] || {};
  const fails = cat => c[cat] ? Object.values(a).filter(x => x.score === 0 && c[cat].auditRefs.some(r => r.id === x.id)).map(x => ({ id: x.id, n: x.details?.items?.length ?? null, sample: (x.details?.items || []).slice(0, 3).map(i => i.node?.selector || i.source?.snippet || i.url || '').filter(Boolean) })) : null;
  return {
    observed: { fcp: Math.round(m.observedFirstContentfulPaint), lcp: Math.round(m.observedLargestContentfulPaint), dcl: Math.round(m.observedDomContentLoaded), load: Math.round(m.observedLoad), cls: m.observedCumulativeLayoutShift },
    tti_ms: Math.round(a.interactive?.numericValue || 0), maxPotentialFid_ms: Math.round(a['max-potential-fid']?.numericValue || 0),
    lcpElement: lcpNode ? { selector: lcpNode.selector, label: lcpNode.nodeLabel, snippet: (lcpNode.snippet || '').slice(0, 160) } : null,
    lcpPhases: lcpTable ? Object.fromEntries(lcpTable.items.map(i => [i.subpart, Math.round(i.duration)])) : null,
    renderBlocking: (a['render-blocking-insight']?.details?.items || []).map(i => ({ url: strip(i.url), bytes: i.totalBytes, ms: Math.round(i.wastedMs || 0) })),
    layoutShifts: items('layout-shifts').slice(0, 5).map(i => ({ score: +(i.score || 0).toFixed(4), node: i.node?.selector, label: i.node?.nodeLabel, cause: (i.subItems?.items || []).map(s => s.cause || s.extra?.value || '').join('; ').slice(0, 160) })),
    longTasks: items('long-tasks').slice(0, 8).map(i => ({ url: strip(i.url), start: Math.round(i.startTime), dur: Math.round(i.duration) })),
    bootup: items('bootup-time').slice(0, 6).map(i => ({ url: strip(i.url), total: Math.round(i.total), scripting: Math.round(i.scripting), parse: Math.round(i.scriptParseCompile) })),
    mainThread: Object.fromEntries(items('mainthread-work-breakdown').map(i => [i.group, Math.round(i.duration)])),
    resources: Object.fromEntries(items('resource-summary').map(i => [i.resourceType, { n: i.requestCount, bytes: i.transferSize }])),
    topRequests: items('network-requests').slice().sort((x, y) => y.transferSize - x.transferSize).slice(0, 10).map(r => ({ url: strip(r.url).slice(0, 120), type: r.resourceType, transfer: r.transferSize, size: r.resourceSize })),
    fonts: items('network-requests').filter(r => r.resourceType === 'Font').map(r => ({ url: strip(r.url).replace('/_next/static/media/', ''), transfer: r.transferSize, start: Math.round(r.networkRequestTime) })),
    prefetchFetches: items('network-requests').filter(r => r.resourceType === 'Fetch' && /_rsc=/.test(r.url)).length,
    unusedJs: items('unused-javascript').map(i => ({ url: strip(i.url), total: i.totalBytes, wasted: i.wastedBytes })),
    domSize: (a['dom-size-insight']?.details?.items?.[0]?.items || []).map(i => ({ s: i.statistic, v: i.value?.value ?? i.value })).slice(0, 3),
    a11yFailures: fails('accessibility'), seoFailures: fails('seo'), bpFailures: fails('best-practices'),
  };
}
const all = {};
for (const t of targets) {
  const i = t.indexOf('='); const key = t.slice(0, i); const url = t.slice(i + 1);
  const rows = []; const diags = [];
  for (let r = 0; r < runs; r++) {
    const out = path.join(outDir, `${key}-run${r + 1}.full.json`);
    const flags = [path.join(TOOLS, 'node_modules/lighthouse/cli/index.js'), url, '--quiet', '--output=json', `--output-path=${out}`,
      '--only-categories=performance,accessibility,best-practices,seo', '--max-wait-for-load=45000',
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage'];
    if (preset) flags.push(`--preset=${preset}`);
    if (profile) flags.push('--throttling-method=devtools', `--throttling.rttMs=${profile.rtt}`, `--throttling.throughputKbps=${profile.down}`,
      `--throttling.requestLatencyMs=${profile.rtt * 3.75}`, `--throttling.downloadThroughputKbps=${Math.round(profile.down * 0.9)}`,
      `--throttling.uploadThroughputKbps=${Math.round(profile.up * 0.9)}`, `--throttling.cpuSlowdownMultiplier=${profile.cpu}`);
    const res = spawnSync('node', flags, { env: { ...process.env, CHROME_PATH: CHROME }, encoding: 'utf8', timeout: 240000 });
    try {
      const j = JSON.parse(fs.readFileSync(out, 'utf8')); const c = j.categories, a = j.audits;
      rows.push({ finalUrl: strip(j.finalDisplayedUrl), runtimeError: j.runtimeError ? j.runtimeError.code : null,
        performance: sc(c.performance), accessibility: sc(c.accessibility), bestPractices: sc(c['best-practices']), seo: sc(c.seo),
        fcp_ms: Math.round(a['first-contentful-paint']?.numericValue) || null, lcp_ms: Math.round(a['largest-contentful-paint']?.numericValue) || null,
        tbt_ms: a['total-blocking-time']?.numericValue != null ? Math.round(a['total-blocking-time'].numericValue) : null,
        cls: a['cumulative-layout-shift']?.numericValue != null ? Number(a['cumulative-layout-shift'].numericValue.toFixed(3)) : null,
        si_ms: Math.round(a['speed-index']?.numericValue) || null, totalBytes: Math.round(a['total-byte-weight']?.numericValue || 0) || null,
        requests: a['network-requests']?.details?.items?.length ?? null, benchmarkIndex: j.environment?.benchmarkIndex,
        throttling: j.configSettings.throttlingMethod + ' ' + JSON.stringify(j.configSettings.throttling), formFactor: j.configSettings.formFactor });
      diags.push(diag(j)); fs.unlinkSync(out);
    } catch (e) { rows.push({ error: (res.stderr || String(e)).split('\n').filter(Boolean).slice(-2).join(' | ').slice(0, 300) }); diags.push(null); }
  }
  const good = rows.map((r, k) => [r, k]).filter(([r]) => !r.error && !r.runtimeError);
  const med = good.length ? Object.fromEntries(['performance', 'accessibility', 'bestPractices', 'seo', 'fcp_ms', 'lcp_ms', 'tbt_ms', 'cls', 'si_ms', 'totalBytes', 'requests'].map(k => [k, median(good.map(([g]) => g[k]))])) : null;
  // diagnostics from the run whose performance score is the median
  let medRun = null; if (good.length) { const s = good.slice().sort((x, y) => x[0].performance - y[0].performance); medRun = s[Math.floor(s.length / 2)][1]; }
  const summary = { key, url, preset: preset || 'mobile (Lighthouse default)', profile, runs: rows.length, validRuns: good.length, measured: new Date().toISOString(),
    median: med, medianRunIndex: medRun, diagnostics: medRun != null ? diags[medRun] : null, rows,
    caveat: 'Lab measurement (Lighthouse 13.6, headless Chromium 1243) against next start on localhost in a shared 4-vCPU cloud container; other evaluators used the same CPU. Not field data.' };
  fs.writeFileSync(path.join(outDir, `${key}.json`), JSON.stringify(summary, null, 1));
  all[key] = med || { error: rows[0]?.error || rows[0]?.runtimeError };
  console.log(key, JSON.stringify(all[key]));
}
fs.writeFileSync(path.join(outDir, `_summary-${Date.now()}.json`), JSON.stringify(all, null, 1));
