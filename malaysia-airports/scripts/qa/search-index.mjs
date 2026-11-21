#!/usr/bin/env node
/**
 * Search-index link check: every document in /en/search/index.json and /ms/search/index.json must
 * point at a page that answers 200 (no redirect), and its #fragment, if any, must be an id in that
 * page's server HTML.
 *
 * Usage: node scripts/qa/search-index.mjs [BASE_URL]   (default http://localhost:3100)
 * Exit code 1 when a document is broken or its anchor is missing.
 */
const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, '');
const CLIENT_HEADER = 'x-e2e-client-ip';
const ip = () => `10.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;

const docs = [];
for (const lang of ['en', 'ms']) {
  const res = await fetch(`${BASE}/${lang}/search/index.json`, { headers: { [CLIENT_HEADER]: ip() } });
  const json = await res.json();
  const list = Array.isArray(json) ? json : json.documents ?? json.docs ?? Object.values(json).find(Array.isArray) ?? [];
  for (const d of list) docs.push({ lang, href: d.href ?? d.url ?? d.path });
}

const pages = new Map();
const broken = [];
const missing = [];
for (const d of docs) {
  if (!d.href) {
    broken.push({ ...d, why: 'no href' });
    continue;
  }
  const local = d.href.startsWith('/') && !/^\/(en|ms)(\/|$)/.test(d.href) ? `/${d.lang}${d.href}` : d.href;
  const url = new URL(local, BASE);
  const frag = decodeURIComponent(url.hash.slice(1));
  url.hash = '';
  if (!pages.has(url.href)) {
    const r = await fetch(url.href, { redirect: 'manual', headers: { [CLIENT_HEADER]: ip() } });
    pages.set(url.href, { status: r.status, html: r.status === 200 ? await r.text() : '' });
  }
  const page = pages.get(url.href);
  if (page.status !== 200) broken.push({ href: d.href, status: page.status });
  else if (frag && !page.html.includes(`id="${frag}"`)) missing.push(d.href);
}

console.log(JSON.stringify({
  documents: docs.length,
  pages: pages.size,
  anchors: docs.filter((d) => d.href && d.href.includes('#')).length,
  broken,
  missingCount: missing.length,
  missing: missing.slice(0, 30),
}, null, 1));
process.exitCode = broken.length || missing.length ? 1 : 0;
