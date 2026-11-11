#!/usr/bin/env node
// Measure how long frames take to draw (including JPEG encode, as in the real render).
//   node tools/bench.mjs --shot a1_05_ask            average over 12 frames spread through the shot
//   node tools/bench.mjs --sketch /sketches/x.js --t 0.5,1.5,2.5
//   node tools/bench.mjs --all                       every implemented shot, slowest first
import { openStage, parseArgs } from './lib.mjs';
const a = parseArgs(process.argv.slice(2));
const stage = await openStage({ ...(a.sketch ? { sketch: a.sketch } : {}), ...(a.style ? { style: String(a.style) } : {}) }, { quiet: true });
const { page, info } = stage;
async function timeAt(times) {
  return page.evaluate((times) => {
    const c = document.getElementById('stage');
    FILM.render(times[0]); c.toDataURL('image/jpeg', 0.95);           // warm caches
    const out = [];
    for (const t of times) { const t0 = performance.now(); FILM.render(t); c.toDataURL('image/jpeg', 0.95); out.push(performance.now() - t0); }
    return out;
  }, times);
}
const spread = (s, n = 12) => Array.from({ length: n }, (_, i) => s.start + ((i + 0.5) / n) * s.dur);
if (a.t !== undefined) {
  const times = String(a.t).split(',').map(Number);
  const ms = await timeAt(times);
  times.forEach((t, i) => console.log(`t=${t}s  ${ms[i].toFixed(0)} ms`));
} else {
  const shots = a.all ? info.shots.filter((s) => s.implemented) : info.shots.filter((s) => s.id === (a.shot || 'sketch'));
  if (!shots.length) { console.error('no such shot'); process.exitCode = 1; }
  const rows = [];
  for (const s of shots) { const ms = await timeAt(spread(s)); rows.push({ id: s.id, avg: ms.reduce((x, y) => x + y, 0) / ms.length, max: Math.max(...ms) }); }
  rows.sort((x, y) => y.avg - x.avg);
  for (const r of rows) console.log(`${r.id.padEnd(20)} avg ${r.avg.toFixed(0).padStart(4)} ms   max ${r.max.toFixed(0).padStart(4)} ms${r.avg > 220 ? '   ← too slow (keep shots under ~200 ms including the 50 ms encode)' : ''}`);
}
await stage.close();
