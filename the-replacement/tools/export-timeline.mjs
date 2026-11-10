#!/usr/bin/env node
// Dump the timeline (absolute times for every shot, event and dialogue cue) to build/timeline.json
// so the Python audio pipeline can sync to it. Also validates the timeline.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, fmtTime } from './lib.mjs';
import { SHOTS, CUES, validate } from '../src/timeline.js';
import { buildTimeline, FPS } from '../src/engine.js';

const problems = validate();
const tl = buildTimeline(SHOTS, CUES);
const out = {
  fps: FPS, duration: tl.duration,
  shots: tl.shots.map((s) => ({ id: s.id, act: s.act, mod: s.mod, set: s.set, start: +s.start.toFixed(4), end: +s.end.toFixed(4), dur: s.dur, desc: s.desc,
    in: s.in || null, out: s.out || null, xin: s.xin || 0,
    events: Object.fromEntries(Object.entries(s.ev || {}).map(([k, v]) => [k, { local: v, t: +(s.start + v).toFixed(4) }])) })),
  cues: tl.cues.map((c) => ({ id: c.id, who: c.who, text: c.text, shot: c.shot, t0: +c.t0.toFixed(4), t1: +c.t1.toFixed(4), dur: c.dur })),
  acts: [...new Set(tl.shots.map((s) => s.act))].map((a) => { const ss = tl.shots.filter((s) => s.act === a); return { act: a, start: ss[0].start, end: ss[ss.length - 1].end }; }),
};
fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'build/timeline.json'), JSON.stringify(out, null, 1));
if (process.argv.includes('--print')) {
  for (const s of out.shots) {
    console.log(`${fmtTime(s.start).padStart(7)} ${String(s.dur).padStart(5)}s  ${s.id.padEnd(18)} [${s.mod}]  ${s.set}`);
    for (const [k, v] of Object.entries(s.events)) console.log(`${' '.repeat(16)}· ev ${k} @ ${fmtTime(v.t)} (+${v.local}s)`);
    for (const c of out.cues.filter((q) => q.shot === s.id)) console.log(`${' '.repeat(16)}» ${c.who}: "${c.text}" @ ${fmtTime(c.t0)}–${fmtTime(c.t1)}`);
  }
}
console.log(`timeline: ${out.shots.length} shots, ${out.cues.length} cues, ${fmtTime(out.duration)} (${Math.round(out.duration * FPS)} frames) → build/timeline.json`);
for (const a of out.acts) console.log(`  act ${a.act}: ${fmtTime(a.start)} – ${fmtTime(a.end)}`);
if (problems.length) { console.error('PROBLEMS:\n  ' + problems.join('\n  ')); process.exit(1); }
