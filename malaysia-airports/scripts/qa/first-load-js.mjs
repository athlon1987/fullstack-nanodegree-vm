#!/usr/bin/env node
/**
 * First-load JavaScript per route, from a production build's manifests (no server needed).
 *
 * For each page route: the root main files from .next/build-manifest.json (the framework and shared
 * runtime, polyfills excluded because modern browsers skip them) plus the client chunks the route's
 * page and its layouts list in .next/server/app/**\/page_client-reference-manifest.js. Sizes are
 * gzip level 9 and brotli of the built files, in KB of 1,024 bytes. Also lists the largest chunks and
 * how many routes load each one in their first load.
 *
 * Usage: node scripts/qa/first-load-js.mjs [NEXT_DIR] [OUT_JSON]   (defaults: .next and first-load-js.json)
 * Budgets: brief E-03 (home 250 KB, content and guidance pages 170 KB gzip).
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';

const NEXT = process.argv[2] || '.next';
const OUT = process.argv[3] || 'first-load-js.json';
const bm = JSON.parse(readFileSync(path.join(NEXT, 'build-manifest.json'), 'utf8'));
const sizes = {};
const size = (file) => {
  if (!sizes[file]) {
    const b = readFileSync(path.join(NEXT, file));
    sizes[file] = { raw: b.length, gz: zlib.gzipSync(b, { level: 9 }).length, br: zlib.brotliCompressSync(b).length };
  }
  return sizes[file];
};
const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'page_client-reference-manifest.js') out.push(p);
  }
  return out;
};
const add = (t, s) => { t.raw += s.raw; t.gz += s.gz; t.br += s.br; };

const rootFiles = new Set(bm.rootMainFiles);
const rows = [];
for (const file of walk(path.join(NEXT, 'server/app'))) {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(file, 'utf8'), sandbox);
  const [key, manifest] = Object.entries(sandbox.__RSC_MANIFEST)[0];
  const route = key.replace(/\/page$/, '') || '/';
  const pageKey = `[project]/src/app${key}`;
  const files = new Set(manifest.entryJSFiles[pageKey] || []);
  let acc = '[project]/src/app';
  for (const seg of key.split('/').slice(1, -1)) {
    acc += `/${seg}`;
    (manifest.entryJSFiles[`${acc}/layout`] || []).forEach((f) => files.add(f));
  }
  const css = new Set();
  Object.entries(manifest.entryCSSFiles)
    .filter(([k]) => k === pageKey || k.endsWith('/layout'))
    .forEach(([, list]) => list.forEach((c) => css.add(c.path)));
  const shared = { raw: 0, gz: 0, br: 0 };
  const own = { raw: 0, gz: 0, br: 0 };
  const cssT = { raw: 0, gz: 0, br: 0 };
  for (const f of bm.rootMainFiles) add(shared, size(f));
  for (const f of files) if (!rootFiles.has(f)) add(own, size(f));
  for (const c of css) add(cssT, size(c));
  rows.push({ route, chunks: files.size + bm.rootMainFiles.length, shared_gz: shared.gz, route_gz: own.gz, total_gz: shared.gz + own.gz, total_br: shared.br + own.br, total_raw: shared.raw + own.raw, css_gz: cssT.gz, files: [...files] });
}
rows.sort((a, b) => b.total_gz - a.total_gz);
const kb = (n) => (n / 1024).toFixed(1);
console.log('route | chunks | framework+shared gz | route-specific gz | total gz | total br | total raw | css gz');
for (const r of rows) console.log([r.route, r.chunks, kb(r.shared_gz), kb(r.route_gz), kb(r.total_gz), kb(r.total_br), kb(r.total_raw), kb(r.css_gz)].join(' | '));
const pageRows = rows.filter((r) => !r.route.startsWith('/_'));
console.log(`\npage routes ${pageRows.length}; over 250 KB gzip: ${pageRows.filter((r) => r.total_gz > 250 * 1024).length}; over 170 KB: ${pageRows.filter((r) => r.total_gz > 170 * 1024).length}`);
console.log('\nLargest chunks (gzip KB, raw KB, first load of N routes):');
for (const [f, s] of Object.entries(sizes).sort((a, b) => b[1].gz - a[1].gz).slice(0, 15)) {
  console.log(f, kb(s.gz), kb(s.raw), rows.filter((r) => r.files.includes(f) || rootFiles.has(f)).length);
}
writeFileSync(OUT, JSON.stringify({ rootMainFiles: bm.rootMainFiles, rows: rows.map(({ files, ...r }) => ({ ...r, routeFiles: files.length })), routeFiles: Object.fromEntries(rows.map((r) => [r.route, r.files])), chunks: sizes }, null, 1));
