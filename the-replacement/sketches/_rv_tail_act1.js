// temporary robustness sweep (act1a/act1b): every shot from t = 0 to T + 1 s, every 1/24 s. Deleted after use.
import { shots as A } from '../src/acts/act1a.js';
import { shots as B } from '../src/acts/act1b.js';
import { SHOTS, CUES } from '../src/timeline.js';
export const duration = 1;
const IDS = ['a1_01_alarm', 'a1_02_wake', 'a1_04_toast', 'a1_05_ask', 'a1_06_bill', 'a1_07_boss', 'a1_08_car', 'a1_09_auditorium', 'a1_10_outside', 'a1_11_night', 'a1_13_react', 'a7_02_alarm'];
let report = null;
function sweep() {
  const errs = [];
  const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 804;
  const c = cv.getContext('2d');
  for (const id of IDS) {
    const shot = SHOTS.find((s) => s.id === id), fn = A[id] || B[id];
    for (let t = 0; t <= shot.dur + 1.001; t += 1 / 24) {
      const F = {
        t, T: shot.dur, k: Math.min(1, t / shot.dur), gt: t, shot, fps: 24, frame: Math.round(t * 24),
        ev(n) { const v = (shot.ev || {})[n]; if (v === undefined) throw new Error('no ev ' + n); return v; },
        since(n) { return t - this.ev(n); },
        cue(cid) { const q = CUES.find((x) => x.id === cid && x.shot === id); if (!q) return { at: 0, dur: 0, end: 0, since: -1e9, k: 0, active: false };
          return { at: q.at, dur: q.dur, end: q.at + q.dur, since: t - q.at, k: Math.max(0, Math.min(1, (t - q.at) / q.dur)), active: t >= q.at && t < q.at + q.dur, text: q.text }; },
        voice(cid) { const q = CUES.find((x) => x.id === cid && x.shot === id); return q && t >= q.at && t < q.at + q.dur ? 0.5 : 0; },
      };
      try { c.save(); fn(c, F); c.restore();
        if (c.globalAlpha !== 1 || c.getTransform().a !== 1) errs.push(`${id} @${t.toFixed(2)} state leak`);
      } catch (e) { errs.push(`${id} @${t.toFixed(2)}: ${e.message}`); c.setTransform(1, 0, 0, 1, 0, 0); break; }
    }
  }
  return errs;
}
export default function (ctx) {
  if (!report) report = sweep();
  if (report.length) throw new Error('TAIL SWEEP: ' + report.join(' | '));
  ctx.fillStyle = '#063'; ctx.fillRect(0, 0, 1920, 804);
}
