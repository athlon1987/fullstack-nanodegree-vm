#!/usr/bin/env node
// Render the film to video: N headless Chromium workers draw frames, ffmpeg encodes.
//
//   node tools/render.mjs --out build/film.mp4                     full film, 1080p, with audio if audio/out/mix.wav exists
//   node tools/render.mjs --from 60 --to 90 --scale 0.5 --out /tmp/p.mp4    fast half-res preview of a time range
//   node tools/render.mjs --act 3 --scale 0.5 --out /tmp/act3.mp4
//
// Options: --workers 3  --crf 18  --preset slow  --jpegq 0.95  --audio path.wav|none  --strict (fail on shot errors)
//          --keep (keep intermediate segments)  --subs 0
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { openStage, parseArgs, ROOT, fmtTime } from './lib.mjs';

const a = parseArgs(process.argv.slice(2));
const out = path.resolve(a.out || path.join(ROOT, 'build/film.mp4'));
const workers = +(a.workers || Math.max(1, Math.min(4, os.cpus().length - 1)));
const scale = +(a.scale || 1);
const jpegq = +(a.jpegq || 0.95);
const query = {};
if (a.subs !== undefined) query.subs = String(a.subs);

const probe = await openStage(query, { quiet: true });
const info = probe.info;
await probe.close();
if (info.errors.length) { console.error('film has load errors:\n' + info.errors.join('\n')); if (a.strict) process.exit(1); }

let from = +(a.from ?? 0), to = +(a.to ?? info.duration);
if (a.act !== undefined) {
  const ss = info.shots.filter((s) => String(s.act) === String(a.act));
  from = ss[0].start; to = ss[ss.length - 1].end;
}
const f0 = Math.round(from * info.fps), f1 = Math.min(info.frames, Math.round(to * info.fps));
const total = f1 - f0;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'replacement-render-'));
console.log(`rendering frames ${f0}..${f1} (${fmtTime(from)} → ${fmtTime(to)}, ${total} frames) with ${workers} workers → ${out}`);

let done = 0, lastLog = Date.now();
const t00 = Date.now();
const shotErrors = new Set();

async function runWorker(w) {
  const a0 = f0 + Math.floor((total * w) / workers), a1 = f0 + Math.floor((total * (w + 1)) / workers);
  const segFile = path.join(tmp, `seg${String(w).padStart(2, '0')}.mkv`);
  if (a1 <= a0) return null;
  const stage = await openStage(query, { quiet: true });
  if (a.strict) await stage.page.evaluate(() => FILM.setStrict(true));
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(info.fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'copy', segFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg segment encode failed ' + c)))));
  for (let f = a0; f < a1; f++) {
    const url = await stage.page.evaluate(({ f, q }) => FILM.jpeg(f, q), { f, q: jpegq });
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    done++;
    if (Date.now() - lastLog > 15000) {
      lastLog = Date.now();
      const el = (Date.now() - t00) / 1000;
      console.log(`  ${done}/${total} frames  ${(done / el).toFixed(1)} fps  eta ${Math.round((total - done) / (done / el))}s`);
    }
  }
  for (const e of await stage.page.evaluate(() => FILM.errors.slice())) shotErrors.add(e.split('\n')[0]);
  ff.stdin.end();
  await ffDone;
  await stage.close();
  return segFile;
}

const segs = (await Promise.all(Array.from({ length: workers }, (_, w) => runWorker(w)))).filter(Boolean);
console.log(`frames done in ${((Date.now() - t00) / 1000).toFixed(0)}s`);
if (shotErrors.size) {
  console.error(`${shotErrors.size} shot error(s) during render:\n  ` + [...shotErrors].join('\n  '));
  if (a.strict) process.exit(1);
}

const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
fs.mkdirSync(path.dirname(out), { recursive: true });

let audio = a.audio === 'none' ? null : a.audio ? path.resolve(a.audio) : path.join(ROOT, 'audio/out/mix.wav');
if (audio && !fs.existsSync(audio)) audio = null;
const vf = [`scale=${scale === 1 ? 'iw:ih' : `trunc(iw*${scale}/2)*2:trunc(ih*${scale}/2)*2`}:flags=lanczos:in_color_matrix=bt601:in_range=full:out_color_matrix=bt709:out_range=tv`, 'format=yuv420p'];
const args = ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list];
if (audio) args.push('-ss', String(f0 / info.fps), '-t', String(total / info.fps), '-i', audio);
args.push('-vf', vf.join(','), '-c:v', 'libx264', '-preset', String(a.preset || 'slow'), '-crf', String(a.crf || 18),
  '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  '-r', String(info.fps), '-g', String(info.fps * 2));
if (a.tune) args.push('-tune', String(a.tune));
if (audio) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
args.push('-movflags', '+faststart', out);
const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
if (r.status !== 0) { console.error('final encode failed'); process.exit(1); }
if (!a.keep) fs.rmSync(tmp, { recursive: true, force: true }); else console.log('segments kept in', tmp);
const sz = fs.statSync(out).size;
console.log(`wrote ${out}  ${(sz / 1e6).toFixed(1)} MB  (${audio ? 'with audio' : 'no audio'})  total ${((Date.now() - t00) / 1000).toFixed(0)}s`);
