#!/usr/bin/env node
// Render stills and contact sheets from the film (or from a sketch module).
//
//   node tools/still.mjs --t 12.5 --out /tmp/a.png                    one frame at global time 12.5s
//   node tools/still.mjs --t 3,9,14 --out /tmp/dir/                   several frames -> dir/t0003.00.png ...
//   node tools/still.mjs --shot a1_alarm --at 0.1,0.5,0.9 --out dir/  frames at fractions of a shot
//   node tools/still.mjs --sheet --act 1 --step 2 --out /tmp/act1.png contact sheet(s) of an act
//   node tools/still.mjs --sheet --from 60 --to 90 --step 1 --out x.png
//   node tools/still.mjs --sheet --shot a1_alarm --n 8 --out x.png    8 evenly spaced frames of one shot
//   node tools/still.mjs --sketch /sketches/rig_test.js --t 0,1,2 --out dir/   render a sketch module
//   node tools/still.mjs --list                                       print the shot list with timings
//
// Options: --scale 0.5 (downscale single stills)  --subs 0 (hide subtitles)  --grain 0
//          --cols 4 --thumb 480 (sheet layout)  --max 20 (thumbs per sheet file)
import fs from 'node:fs';
import path from 'node:path';
import { openStage, parseArgs, fmtTime } from './lib.mjs';

const a = parseArgs(process.argv.slice(2));
const query = {};
if (a.sketch) query.sketch = a.sketch;
if (a.subs !== undefined) query.subs = String(a.subs);
if (a.style) query.style = String(a.style);            // --style lit
if (a.grain !== undefined) query.grain = String(a.grain);

const stage = await openStage(query);
const { page, info } = stage;
const shotById = Object.fromEntries(info.shots.map((s) => [s.id, s]));

function fail(msg) { console.error(msg); process.exitCode = 1; }

try {
  if (a.list) {
    for (const s of info.shots) console.log(`${fmtTime(s.start).padStart(7)}  ${s.dur.toFixed(2).padStart(6)}s  act${s.act}  ${s.implemented ? ' ' : '·'} ${s.id}`);
    console.log(`total ${fmtTime(info.duration)} (${info.frames} frames)`);
  } else {
    // ── collect times ──
    let times = [];
    if (a.shot) {
      const s = shotById[a.shot];
      if (!s) throw new Error(`unknown shot ${a.shot}`);
      if (a.at !== undefined) times = String(a.at).split(',').map((f) => s.start + Math.min(0.999, +f) * s.dur);
      else { const n = +(a.n || 8); times = Array.from({ length: n }, (_, i) => s.start + ((i + 0.5) / n) * s.dur); }
    } else if (a.t !== undefined) {
      times = String(a.t).split(',').map(Number);
    } else if (a.sheet) {
      let from = +(a.from ?? 0), to = +(a.to ?? info.duration);
      if (a.act !== undefined) {
        const ss = info.shots.filter((s) => String(s.act) === String(a.act));
        if (!ss.length) throw new Error(`no shots in act ${a.act}`);
        from = ss[0].start; to = ss[ss.length - 1].end;
      }
      const step = +(a.step || 2);
      for (let t = from + step / 2; t < to; t += step) times.push(t);
    } else throw new Error('nothing to do: pass --t, --shot, --sheet or --list');

    const out = a.out || '/tmp/still.png';
    if (a.sheet) {
      const cols = +(a.cols || 4), tw = +(a.thumb || 480), th = Math.round((tw * 9) / 16), lab = 26, max = +(a.max || 20);
      const files = [];
      for (let p = 0; p * max < times.length; p++) {
        const chunk = times.slice(p * max, (p + 1) * max);
        const dataUrl = await page.evaluate(({ chunk, cols, tw, th, lab }) => {
          const rows = Math.ceil(chunk.length / cols);
          const cv = document.createElement('canvas'); cv.width = cols * tw; cv.height = rows * (th + lab);
          const c = cv.getContext('2d'); c.fillStyle = '#111'; c.fillRect(0, 0, cv.width, cv.height);
          const src = document.getElementById('stage');
          chunk.forEach((t, i) => {
            const id = FILM.render(t);
            const x = (i % cols) * tw, y = Math.floor(i / cols) * (th + lab);
            c.imageSmoothingQuality = 'high';
            c.drawImage(src, x, y + lab, tw, th);
            c.fillStyle = '#e8eef5'; c.font = '600 15px monospace'; c.textBaseline = 'middle';
            const s = FILM.shots.find((q) => q.id === id);
            c.fillText(`${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}  ${id}  +${(t - s.start).toFixed(2)}s`, x + 6, y + lab / 2);
            c.strokeStyle = '#333'; c.strokeRect(x + 0.5, y + lab + 0.5, tw - 1, th - 1);
          });
          return cv.toDataURL('image/png');
        }, { chunk, cols, tw, th, lab });
        const file = times.length > max ? out.replace(/(\.png)?$/, `_${p + 1}.png`) : out;
        fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
        fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
        files.push(file);
      }
      console.log('sheets:', files.join(' '));
    } else {
      const scale = +(a.scale || 1);
      const isDir = out.endsWith('/') || times.length > 1;
      if (isDir) fs.mkdirSync(out, { recursive: true }); else fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
      for (const t of times) {
        const res = await page.evaluate(({ t, scale }) => {
          const id = FILM.render(t);
          const src = document.getElementById('stage');
          if (scale === 1) return { id, url: src.toDataURL('image/png') };
          const cv = document.createElement('canvas'); cv.width = Math.round(src.width * scale); cv.height = Math.round(src.height * scale);
          const c = cv.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(src, 0, 0, cv.width, cv.height);
          return { id, url: cv.toDataURL('image/png') };
        }, { t, scale });
        const file = isDir ? path.join(out, `t${t.toFixed(2).padStart(7, '0')}_${res.id}.png`) : out;
        fs.writeFileSync(file, Buffer.from(res.url.split(',')[1], 'base64'));
        console.log(file);
      }
    }
  }
  const errs = await page.evaluate(() => FILM.errors.slice());
  if (errs.length) { fail(`\n${errs.length} film error(s):\n` + errs.map((e) => '  ' + e.split('\n').slice(0, 4).join('\n    ')).join('\n')); }
} catch (err) {
  fail(String(err && err.stack || err));
} finally {
  await stage.close();
}
