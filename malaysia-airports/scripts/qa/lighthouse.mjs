#!/usr/bin/env node
/**
 * Lighthouse harness: runs Lighthouse serially, N times per URL, and writes one compact summary per
 * page (the median of each metric over the valid runs, plus every run) instead of the full reports.
 *
 * Default settings are Lighthouse's mobile defaults (Moto G Power class, simulated slow 4G, 4x CPU
 * slowdown), categories performance, accessibility, best practices and SEO, headless Chromium.
 *
 * Usage:
 *   node scripts/qa/lighthouse.mjs <outDir> <runs> [options] <key=url> [<key=url> ...]
 * Options:
 *   --preset=desktop                 Lighthouse's desktop preset instead of mobile
 *   --profile=name,rttMs,downKbps,upKbps,cpu
 *                                    applied (DevTools) throttling, for example the congested airport
 *                                    Wi-Fi profile airport-wifi,250,1500,500,4 (Lighthouse's own
 *                                    conventions: request latency = rtt x 3.75, throughput x 0.9)
 *   --diagnostics                    also keep LCP element and phases, long tasks, script boot-up,
 *                                    render-blocking requests, fonts and the largest requests from
 *                                    the median run
 * Environment:
 *   LIGHTHOUSE_CLI  path to lighthouse/cli/index.js (Lighthouse is not a project dependency: install
 *                   it in a separate folder, see scripts/qa/README.md). Without it the script tries
 *                   to resolve "lighthouse" from the current folder.
 *   CHROME_PATH     Chrome or Chromium to run; defaults to Playwright's Chromium.
 *
 * Results are lab measurements: indicative only, not field data. TBT in particular moves by tens of
 * milliseconds between runs on a shared machine, which is why the median of 3 or more runs is used.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const args = process.argv.slice(2);
const [outDir, runsArg] = args;
const runs = Number(runsArg || 1);
const options = args.slice(2).filter((a) => a.startsWith('--'));
const targets = args.slice(2).filter((a) => !a.startsWith('--'));
if (!outDir || !targets.length) {
  console.error('usage: node scripts/qa/lighthouse.mjs <outDir> <runs> [--preset=desktop] [--profile=...] [--diagnostics] key=url ...');
  process.exit(2);
}
let preset = null;
let profile = null;
const diagnostics = options.includes('--diagnostics');
for (const o of options) {
  if (o.startsWith('--preset=')) preset = o.slice(9);
  if (o.startsWith('--profile=')) {
    const [name, rtt, down, up, cpu] = o.slice(10).split(',');
    profile = { name, rtt: +rtt, down: +down, up: +up, cpu: +cpu };
  }
}

function lighthouseCli() {
  if (process.env.LIGHTHOUSE_CLI) return path.resolve(process.env.LIGHTHOUSE_CLI);
  try {
    return createRequire(path.join(process.cwd(), 'noop.js')).resolve('lighthouse/cli/index.js');
  } catch {
    console.error('Lighthouse not found. Install it outside the project (see scripts/qa/README.md) and set LIGHTHOUSE_CLI.');
    process.exit(2);
  }
}
async function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const { chromium } = await import('@playwright/test');
  return chromium.executablePath();
}

const CLI = lighthouseCli();
const CHROME = await chromePath();
mkdirSync(outDir, { recursive: true });
const median = (a) => {
  const s = a.filter((x) => x != null && !Number.isNaN(x)).sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};
const score = (c) => (c?.score != null ? Math.round(c.score * 100) : null);
const strip = (u) => {
  try {
    const url = new URL(u);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' ? url.pathname + url.search : u;
  } catch {
    return u || '';
  }
};

function diag(j) {
  const a = j.audits;
  const items = (k) => a[k]?.details?.items || [];
  const lcpItems = a['lcp-breakdown-insight']?.details?.items || [];
  const lcpNode = lcpItems.find((i) => i.type === 'node');
  const lcpTable = lcpItems.find((i) => i.type === 'table');
  const m = items('metrics')[0] || {};
  return {
    observed: { fcp: Math.round(m.observedFirstContentfulPaint), lcp: Math.round(m.observedLargestContentfulPaint), dcl: Math.round(m.observedDomContentLoaded), load: Math.round(m.observedLoad) },
    lcpElement: lcpNode ? { selector: lcpNode.selector, label: lcpNode.nodeLabel } : null,
    lcpPhases: lcpTable ? Object.fromEntries(lcpTable.items.map((i) => [i.subpart, Math.round(i.duration)])) : null,
    renderBlocking: (a['render-blocking-insight']?.details?.items || []).map((i) => ({ url: strip(i.url), bytes: i.totalBytes, ms: Math.round(i.wastedMs || 0) })),
    longTasks: items('long-tasks').slice(0, 8).map((i) => ({ url: strip(i.url), start: Math.round(i.startTime), dur: Math.round(i.duration) })),
    bootup: items('bootup-time').slice(0, 6).map((i) => ({ url: strip(i.url), total: Math.round(i.total), scripting: Math.round(i.scripting) })),
    mainThread: Object.fromEntries(items('mainthread-work-breakdown').map((i) => [i.group, Math.round(i.duration)])),
    resources: Object.fromEntries(items('resource-summary').map((i) => [i.resourceType, { n: i.requestCount, bytes: i.transferSize }])),
    topRequests: items('network-requests').slice().sort((x, y) => y.transferSize - x.transferSize).slice(0, 10).map((r) => ({ url: strip(r.url).slice(0, 120), type: r.resourceType, transfer: r.transferSize })),
    fonts: items('network-requests').filter((r) => r.resourceType === 'Font').map((r) => ({ url: strip(r.url), transfer: r.transferSize })),
  };
}

const all = {};
for (const target of targets) {
  const eq = target.indexOf('=');
  const key = target.slice(0, eq);
  const url = target.slice(eq + 1);
  const rows = [];
  const diags = [];
  for (let r = 0; r < runs; r++) {
    const out = path.join(outDir, `${key}-run${r + 1}.full.json`);
    const flags = [CLI, url, '--quiet', '--output=json', `--output-path=${out}`,
      '--only-categories=performance,accessibility,best-practices,seo', '--max-wait-for-load=45000',
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage',
      // Its own client address per run, as every other script sends (README): against a server that
      // trusts x-e2e-client-ip, requests without it share one "unidentified" rate-limit bucket.
      `--extra-headers=${JSON.stringify({ 'x-e2e-client-ip': `10.${71 + (r % 50)}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}` })}`];
    if (preset) flags.push(`--preset=${preset}`);
    if (profile) {
      flags.push('--throttling-method=devtools', `--throttling.rttMs=${profile.rtt}`, `--throttling.throughputKbps=${profile.down}`,
        `--throttling.requestLatencyMs=${profile.rtt * 3.75}`, `--throttling.downloadThroughputKbps=${Math.round(profile.down * 0.9)}`,
        `--throttling.uploadThroughputKbps=${Math.round(profile.up * 0.9)}`, `--throttling.cpuSlowdownMultiplier=${profile.cpu}`);
    }
    const res = spawnSync(process.execPath, flags, { env: { ...process.env, CHROME_PATH: CHROME }, encoding: 'utf8', timeout: 240000 });
    try {
      const j = JSON.parse(readFileSync(out, 'utf8'));
      const c = j.categories;
      const a = j.audits;
      rows.push({
        finalUrl: strip(j.finalDisplayedUrl), runtimeError: j.runtimeError ? j.runtimeError.code : null,
        performance: score(c.performance), accessibility: score(c.accessibility), bestPractices: score(c['best-practices']), seo: score(c.seo),
        fcp_ms: Math.round(a['first-contentful-paint']?.numericValue) || null,
        lcp_ms: Math.round(a['largest-contentful-paint']?.numericValue) || null,
        tbt_ms: a['total-blocking-time']?.numericValue != null ? Math.round(a['total-blocking-time'].numericValue) : null,
        cls: a['cumulative-layout-shift']?.numericValue != null ? Number(a['cumulative-layout-shift'].numericValue.toFixed(3)) : null,
        si_ms: Math.round(a['speed-index']?.numericValue) || null,
        totalBytes: Math.round(a['total-byte-weight']?.numericValue || 0) || null,
        requests: a['network-requests']?.details?.items?.length ?? null,
        benchmarkIndex: j.environment?.benchmarkIndex ?? null,
        a11yFailures: c.accessibility ? Object.values(a).filter((x) => x.score === 0 && c.accessibility.auditRefs.some((ref) => ref.id === x.id)).map((x) => x.id) : null,
      });
      diags.push(diagnostics ? diag(j) : null);
      unlinkSync(out);
    } catch (e) {
      rows.push({ error: (res.stderr || String(e)).split('\n').filter(Boolean).slice(-2).join(' | ').slice(0, 300) });
      diags.push(null);
    }
  }
  const good = rows.map((row, k) => [row, k]).filter(([row]) => !row.error && !row.runtimeError);
  const keys = ['performance', 'accessibility', 'bestPractices', 'seo', 'fcp_ms', 'lcp_ms', 'tbt_ms', 'cls', 'si_ms', 'totalBytes', 'requests'];
  const med = good.length ? Object.fromEntries(keys.map((k) => [k, median(good.map(([g]) => g[k]))])) : null;
  let medianRun = null;
  if (good.length) {
    const sorted = good.slice().sort((x, y) => x[0].performance - y[0].performance);
    medianRun = sorted[Math.floor(sorted.length / 2)][1];
  }
  const summary = {
    key, url, preset: preset || 'mobile (Lighthouse default)', profile, runs: rows.length, validRuns: good.length,
    measured: new Date().toISOString(), median: med, a11yFailures: good[0]?.[0].a11yFailures ?? null, rows,
    ...(diagnostics ? { medianRunIndex: medianRun, diagnostics: medianRun != null ? diags[medianRun] : null } : {}),
    caveat: 'Lab measurement: Lighthouse with simulated (or, with --profile, applied) throttling against a local next start. Indicative only; not field data.',
  };
  writeFileSync(path.join(outDir, `${key}.json`), JSON.stringify(summary, null, 1));
  all[key] = med || { error: rows[0]?.error || rows[0]?.runtimeError };
  console.log(key, JSON.stringify(all[key]));
}
writeFileSync(path.join(outDir, `_summary-${Date.now()}.json`), JSON.stringify(all, null, 1));
