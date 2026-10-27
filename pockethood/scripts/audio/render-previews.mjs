// Renders soundtrack previews offline in headless Chromium and writes WAV + MP3 files.
//   node scripts/audio/render-previews.mjs [outDir] [--forms]
// Requires ffmpeg for MP3 encoding (WAVs are kept if it's missing).
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const out = resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'audio-previews');
const forms = process.argv.includes('--forms');
const only = (process.argv.find((a) => a.startsWith('--moods=')) ?? '').slice(8).split(',').filter(Boolean);
const quick = process.argv.includes('--quick'); // moods only: no tour or effects
const sfxOnly = process.argv.includes('--sfx-only');
mkdirSync(out, { recursive: true });
const server = await createServer({ server: { port: 5299, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (m) => m.type() === 'error' && console.error('[page]', m.text()));
await page.goto('http://localhost:5299/tools/audio/render.html');
await page.waitForFunction(() => document.title === 'ready', null, { timeout: 60_000 });

const save = async (name, r) => {
  const wav = join(out, `${name}.wav`);
  const parts = [];
  const CHUNK = 3 * 1024 * 1024;
  for (let i = 0; i < r.bytes; i += CHUNK) parts.push(Buffer.from(await page.evaluate(([a, b]) => window.pockethoodRender.slice(a, b), [i, CHUNK]), 'base64'));
  writeFileSync(wav, Buffer.concat(parts));
  try {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '128k', join(out, `${name}.mp3`)]);
  } catch {
    console.warn('ffmpeg unavailable: kept WAV only');
  }
  console.log('wrote', name);
};

const moods = await page.evaluate(() => window.pockethoodRender.moods);
for (const m of sfxOnly ? [] : moods.filter((m) => !only.length || only.includes(m))) {
  await save(`mood-${m}`, await page.evaluate((m) => window.pockethoodRender.mood(m), m));
  if (forms) await save(`form-${m}`, await page.evaluate((m) => window.pockethoodRender.form(m), m));
}
if (!quick) {
if (!sfxOnly) {
const tour = await page.evaluate(() => window.pockethoodRender.tour());
await save('tour', tour);
writeFileSync(join(out, 'tour-changes.json'), JSON.stringify(tour.changes, null, 1));
}
const sfx = ['click', 'collect', 'collect', 'collect', 'place', 'complete', 'unlock', 'reward', 'friendship', 'water', 'plant', 'levelup', 'pet_cat', 'pet_dog', 'error', 'whoosh', 'chime'];
await save('sfx', await page.evaluate((n) => window.pockethoodRender.sfx(n), sfx));
writeFileSync(join(out, 'sfx-order.json'), JSON.stringify(sfx));
}
await browser.close();
await server.close();
