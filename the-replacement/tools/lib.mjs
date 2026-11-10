// Shared helpers for the film tools: a static file server and a Chromium page on the render stage.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.mp4': 'video/mp4',
};

export function startServer(root = ROOT) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      let p = path.normalize(path.join(root, decodeURIComponent(u.pathname)));
      if (!p.startsWith(root)) { res.writeHead(403); res.end(); return; }
      fs.stat(p, (err, st) => {
        if (err || !st.isFile()) { res.writeHead(404); res.end('not found'); return; }
        const type = MIME[path.extname(p)] || 'application/octet-stream';
        const range = req.headers.range && /bytes=(\d+)-(\d*)/.exec(req.headers.range);
        if (range) {
          const a = +range[1], b = range[2] ? +range[2] : st.size - 1;
          res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1, 'Cache-Control': 'no-store' });
          fs.createReadStream(p, { start: a, end: b }).pipe(res);
        } else {
          res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
          fs.createReadStream(p).pipe(res);
        }
      });
    });
    server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() }));
  });
}

function loadPlaywright() {
  for (const name of ['playwright', 'playwright-core']) {
    try { return require(name); } catch (e) { /* try next */ }
  }
  for (const dir of ['/opt/node22/lib/node_modules', '/usr/lib/node_modules', '/usr/local/lib/node_modules']) {
    for (const name of ['playwright', 'playwright-core']) {
      try { return require(path.join(dir, name)); } catch (e) { /* try next */ }
    }
  }
  throw new Error('playwright not found (npm i -g playwright && npx playwright install chromium)');
}

/**
 * Open the render stage. query: object of URL params (e.g. {sketch:'/sketches/x.js'}).
 * Returns {browser, page, info, close}. Page console errors are echoed to stderr.
 */
export async function openStage(query = {}, { quiet = false } = {}) {
  const { chromium } = loadPlaywright();
  const server = await startServer();
  const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-dev-shm-usage', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => { errors.push(String(e)); if (!quiet) console.error('[pageerror]', e.message); });
  page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); if (!quiet) console.error('[console.error]', m.text().slice(0, 1200)); } });
  const qs = new URLSearchParams({ v: String(process.hrtime.bigint()), ...query }).toString();
  await page.goto(`${server.url}/film.html?${qs}`);
  await page.waitForFunction(() => window.FILM_READY || window.FILM_ERROR, null, { timeout: 60000 });
  const bootErr = await page.evaluate(() => window.FILM_ERROR || null);
  if (bootErr) { await browser.close(); server.close(); throw new Error('film failed to boot: ' + bootErr); }
  const info = await page.evaluate(() => ({ duration: FILM.duration, frames: FILM.frames, fps: FILM.FPS, shots: FILM.shots, cues: FILM.cues, errors: FILM.errors.slice() }));
  return { browser, page, info, errors, server, close: async () => { await browser.close(); server.close(); } };
}

export function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const s = argv[i];
    if (s.startsWith('--')) {
      const k = s.slice(2);
      const v = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      a[k] = v;
    } else a._.push(s);
  }
  return a;
}

export const fmtTime = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
