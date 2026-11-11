// Review sketch for src/sets/street.js.  panel = Math.floor(F.t); the fractional part animates ambient time.
//   node tools/still.mjs --sketch /sketches/set_street.js --t 0,1,2 --out build/review/set_street/
import { camera, CX, CY, text, FONT } from '../src/engine.js';
import * as S from '../src/sets/street.js';
import { dummy } from './_dummy.js';
import { drawFigure, POSE } from '../src/rig.js';

const INK = { dusk: '#07070f', greyMorning: '#0a0d14', golden: '#160c05', rainNight: '#020408' };

const go0 = (ctx, F, set, o) => { set.back(ctx, F, o); set.front(ctx, F, o); };
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


// ───────── homeStreet ─────────
if (S.homeStreet) {
  const R = S.homeStreet, A = R.anchors, ink = INK.golden, Lg = R.lights.golden;
  const light = { color: Lg.key, from: Lg.from, amount: Lg.amount };
  const fig = (ctx, who, x, pose, extra = {}) => drawFigure(ctx, who, { x, y: 700, ...pose }, { ink, light, ...extra });
  const box = (ctx, a) => { const x = (a.handF.x + a.handB.x) / 2, y = Math.min(a.handF.y, a.handB.y) - 4; lunchbox(ctx, x, y); };
  const go = (ctx, F, o, fg, bg) => {
    R.back(ctx, F, o);
    if (bg) bg();
    R.mid(ctx, F, o);
    camera(ctx, o.cam, 1, () => fg && fg());
    R.front(ctx, F, o);
  };
  const shadowed = (ctx, o, list) => { for (const [x, h] of list) R.castShadow(ctx, o, x, h); };
  P('home a7_04 walk (cam 1450)', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: 1450, y: CY, zoom: 1 } }; R.back(ctx, F, o); shadowed(ctx, o, [[1560, 430], [700, 400]]);
    camera(ctx, o.cam, 1, () => { fig(ctx, 'adam', 1560, { facing: -1, ...POSE.walk(0.3) }); fig(ctx, 'extraF', 700, { facing: 1, ...POSE.walk(0.7) }); }); R.front(ctx, F, o); });
  P('home a7_06 stop, bus (cam 1150)', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: 1150, y: CY, zoom: 1 }, busX: 1500 }; R.back(ctx, F, o); shadowed(ctx, o, [[A.stop.x, 430], [A.ped2.x, 426], [A.ped1.x + 400, 400]]);
    camera(ctx, o.cam, 1, () => { fig(ctx, 'adam', A.stop.x, { facing: -1, ...POSE.holdPhone }); fig(ctx, 'extraM', A.ped2.x, { facing: -1, ...POSE.walk(0.2) }); fig(ctx, 'extraF', A.ped1.x + 400, { facing: 1, ...POSE.walk(0.6) }); }); R.front(ctx, F, o); });
  P('home a7_10 Maya + wife (cam 3260 z1.15)', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: 3260, y: 400, zoom: 1.15 } };
    R.back(ctx, F, o); camera(ctx, o.cam, A.wife.depth, () => drawFigure(ctx, 'wife', { x: A.wife.x, y: A.wife.y, s: A.wife.scale, facing: -1, ...POSE.stand, armF: [150, 120] }, { ink, light }));
    shadowed(ctx, o, [[A.maya.x, 285]]); camera(ctx, o.cam, 1, () => { const a = fig(ctx, 'maya', A.maya.x, { facing: -1, ...POSE.childArmsUp }); box(ctx, a); }); R.front(ctx, F, o); });
  P('home a7_12 run wide (cam 2250 z0.85)', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: 2250, y: 380, zoom: 0.85 } }; R.back(ctx, F, o); shadowed(ctx, o, [[1950, 430], [2750, 285]]);
    camera(ctx, o.cam, 1, () => { fig(ctx, 'adam', 1950, { facing: 1, ...POSE.run(0.2) }); const a = fig(ctx, 'maya', 2750, { facing: -1, ...POSE.run(0.6) }); }); R.front(ctx, F, o); });
  P('home a7_13 hug close (z2.4)', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: A.meet.x + 40, y: 480, zoom: 2.4 } }; R.back(ctx, F, o);
    camera(ctx, o.cam, 1, () => { fig(ctx, 'adam', A.meet.x, { facing: 1, ...POSE.hugKneel }); fig(ctx, 'maya', A.meet.x + 120, { facing: -1, ...POSE.childHug }); }); R.front(ctx, F, o); });
  P('home a7_09 eye blur 1 (z3)', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: A.stop.x - 30, y: 300, zoom: 3 }, blur: 1 }; R.back(ctx, F, o);
    camera(ctx, o.cam, 1, () => fig(ctx, 'adam', A.stop.x, { facing: -1, ...POSE.holdPhone }, { catch: 0.5 })); R.front(ctx, F, o); });
  P('home a7_09 eye blur 0 (z3)', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: A.stop.x - 30, y: 300, zoom: 3 }, blur: 0 }; R.back(ctx, F, o);
    camera(ctx, o.cam, 1, () => fig(ctx, 'adam', A.stop.x, { facing: -1, ...POSE.holdPhone })); R.front(ctx, F, o); });
  P('home hug blur 1 (z2.4)', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: A.meet.x + 40, y: 480, zoom: 2.4 }, blur: 1 }; R.back(ctx, F, o);
    camera(ctx, o.cam, 1, () => { fig(ctx, 'adam', A.meet.x, { facing: 1, ...POSE.hugKneel }); fig(ctx, 'maya', A.meet.x + 120, { facing: -1, ...POSE.childHug }); }); R.front(ctx, F, o); });
  P('home left: terrace/cafe (cam 0)', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: 0, y: CY, zoom: 1 } }; R.back(ctx, F, o); shadowed(ctx, o, [[A.ped1.x, 426]]);
    camera(ctx, o.cam, 1, () => fig(ctx, 'extraM', A.ped1.x, { facing: -1, ...POSE.walk(0.4) })); R.front(ctx, F, o); });
  P('home birds zoom 2.5', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: 1150, y: 130, zoom: 2.5 } }; go(ctx, F, o); });
  P('home crossing zoom 2 (beacon)', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: 1800, y: 480, zoom: 2 } }; go(ctx, F, o); });
  P('home flare 0, leaves 0, traffic 0, no bus (cam 3300)', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: 3300, y: 400, zoom: 1.15 }, flare: 0, fgLeaves: 0, traffic: 0 }; go(ctx, F, o); });
  P('home very wide z0.6 bus 2400', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: 2000, y: 300, zoom: 0.6 }, busX: 2400 }; go(ctx, F, o); });
}

// ───────── carInterior ─────────
if (S.carInterior) {
  const R = S.carInterior, A = R.anchors, ink = INK.rainNight, Ln = R.lights.rainNight;
  const light = { color: Ln.key, from: Ln.from, amount: Ln.amount };
  const driver = (ctx, pose = {}) => drawFigure(ctx, 'original', { x: A.driver.x, y: A.driver.y, facing: 1, ...POSE.sit, seat: A.driver.seat, curl: 10, neck: 6, handF: A.wheelGrip, handB: { x: 975, y: 480 }, ...pose }, { ink, light });
  const go = (ctx, F, o, pose) => { R.back(ctx, F, o); camera(ctx, o.cam, 1, () => { const a = driver(ctx, pose); if (pose && pose.mark) { ctx.fillStyle = '#0f0'; ctx.fillRect(a.head.x - 2, a.head.y - 2, 4, 4); text(ctx, `head ${a.head.x.toFixed(0)},${a.head.y.toFixed(0)} hip ${a.hip.x.toFixed(0)},${a.hip.y.toFixed(0)}`, a.head.x, a.head.y - 120, { size: 14, color: '#0f0' }); } }); R.front(ctx, F, o); };
  const crop = (ctx, F, c, tt, pose) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1920, 804); ctx.save(); ctx.beginPath(); ctx.rect(c.x, c.y, c.w, c.h); ctx.clip(); go(ctx, F, { look: 'rainNight', t: tt, cam: c.cam }, pose); ctx.restore(); };
  P('car master (identity)', (ctx, F, tt) => go(ctx, F, { look: 'rainNight', t: tt }, { mark: 1 }));
  P('car crop 4:5', (ctx, F, tt) => crop(ctx, F, A.crop45, tt));
  P('car crop 9:16', (ctx, F, tt) => crop(ctx, F, A.crop916, tt, { handF: undefined, curl: 14, neck: 10, head: 18, armF: [44, 148] }));
  P('car close z2.5 on face (wipe)', (ctx, F, tt) => go(ctx, F, { look: 'rainNight', t: tt, cam: { x: 930, y: 420, zoom: 2.6 } }, { handF: undefined, armF: [44, 148], head: 18 }));
  P('car rain 0 lamp 0 dash 0', (ctx, F, tt) => go(ctx, F, { look: 'rainNight', t: tt, rain: 0, lamp: 0, dash: 0, mist: 0 }));
  P('home back+front only, cam 1150 (bench)', (ctx, F, tt) => { const o = { look: 'golden', t: tt, cam: { x: 1150, y: CY, zoom: 1 } }; go0(ctx, F, S.homeStreet, o); });
  P('car sweep (t=9.3)', (ctx, F, tt) => go(ctx, F, { look: 'rainNight', t: 9.3, cam: A.crop45.cam }));
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
