// Review sketch for src/sets/street.js.  panel = Math.floor(F.t); the fractional part animates ambient time.
//   node tools/still.mjs --sketch /sketches/set_street.js --t 0,1,2 --out build/review/set_street/
import { camera, CX, CY, text, FONT } from '../src/engine.js';
import * as S from '../src/sets/street.js';
import { dummy } from './_dummy.js';

const INK = { dusk: '#07070f', greyMorning: '#0a0d14', golden: '#160c05', rainNight: '#020408' };

function run(ctx, F, set, o, people) {
  set.back(ctx, F, o);
  if (people && people.bg) people.bg();
  if (set.mid) set.mid(ctx, F, o);
  if (people && people.fg) camera(ctx, o.cam, 1, () => people.fg());
  set.front(ctx, F, o);
}
const lunchbox = (ctx, x, y) => { ctx.fillStyle = '#d8432a'; ctx.beginPath(); ctx.roundRect(x - 27, y - 36, 54, 36, 6); ctx.fill(); ctx.fillStyle = '#8f2416'; ctx.fillRect(x - 27, y - 22, 54, 3); };

const PANELS = [];
const P = (name, fn) => PANELS.push({ name, fn });

// ───────── roadside ─────────
if (S.roadside) {
  const R = S.roadside, A = R.anchors, ink = INK.dusk;
  const people = (ctx, o, tt, which = 'adam') => ({
    fg: () => {
      dummy(ctx, A[which].x, A[which].y, { h: 430, facing: 1, color: ink });
      const p = R.carPose(o, tt);
      ctx.save(); ctx.translate(p.px, p.py); ctx.rotate(p.rot); ctx.translate(-p.px + p.dx, -p.py + p.dy); lunchbox(ctx, A.roof.x, A.roof.y); ctx.restore();
    },
  });
  P('roadside master (smoke 1)', (ctx, F, tt) => { const o = { look: 'dusk', t: tt, cam: { x: CX, y: CY, zoom: 1 }, smoke: 1, shake: 0 }; run(ctx, F, R, o, people(ctx, o, tt)); });
  P('roadside close on roof (zoom 2)', (ctx, F, tt) => { const o = { look: 'dusk', t: tt, cam: { x: 860, y: 420, zoom: 2 }, smoke: 1 }; run(ctx, F, R, o, people(ctx, o, tt)); });
  P('roadside smoke 0, lamps 0', (ctx, F, tt) => { const o = { look: 'dusk', t: tt, cam: { x: CX, y: CY, zoom: 1 }, smoke: 0, lamps: 0 }; run(ctx, F, R, o, people(ctx, o, tt, 'adamClear')); });
  P('roadside shake 1 + hazard, pan right', (ctx, F, tt) => { const o = { look: 'dusk', t: tt, cam: { x: 1320, y: CY, zoom: 1.1 }, smoke: 1, shake: 1, hazard: 1 }; run(ctx, F, R, o, people(ctx, o, tt, 'adamClear')); });
  P('roadside empty set', (ctx, F, tt) => { const o = { look: 'dusk', t: tt, smoke: 1 }; run(ctx, F, R, o, null); });
}

// ───────── cityRun ─────────
if (S.cityRun) {
  const R = S.cityRun, ink = INK.greyMorning;
  const runner = (ctx, x) => ({ fg: () => { dummy(ctx, x, 700, { h: 430, facing: 1, color: ink }); } });
  for (const x of [400, 1500, 2500, 3300, 4300, 5300, 6400]) {
    P(`cityRun track x=${x}`, (ctx, F, tt) => { const o = { look: 'greyMorning', t: tt, cam: { x: x + 140, y: CY, zoom: 1 } }; run(ctx, F, R, o, runner(ctx, x)); });
  }
  P('cityRun wide zoom 0.85', (ctx, F, tt) => { const o = { look: 'greyMorning', t: tt, cam: { x: 2000, y: 352, zoom: 0.85 } }; run(ctx, F, R, o, runner(ctx, 1860)); });
  P('cityRun zoom 2 on runner', (ctx, F, tt) => { const o = { look: 'greyMorning', t: tt, cam: { x: 2460, y: 470, zoom: 2 } }; run(ctx, F, R, o, runner(ctx, 2400)); });
  P('cityRun fg 0, peds 0, traffic 0', (ctx, F, tt) => { const o = { look: 'greyMorning', t: tt, cam: { x: 3000, y: CY, zoom: 1 }, fg: 0, peds: 0, traffic: 0 }; run(ctx, F, R, o, runner(ctx, 2860)); });
}

export const duration = Math.max(1, PANELS.length);
export const panels = PANELS.map((p) => p.name);

export default function draw(ctx, F) {
  const i = Math.min(PANELS.length - 1, Math.floor(F.t));
  const frac = F.t - Math.floor(F.t);
  const tt = 2.6 + frac * 10;
  if (!PANELS.length) return;
  PANELS[i].fn(ctx, F, tt);
  text(ctx, `${i}  ${PANELS[i].name}`, 24, 30, { size: 18, family: FONT.mono, color: '#ffffff', alpha: 0.55, shadow: { color: '#000', blur: 4 } });
}
