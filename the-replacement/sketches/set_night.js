// Review sketch for src/sets/night.js — panel = Math.floor(F.t); the fraction animates ambient time.
//   node tools/still.mjs --sketch /sketches/set_night.js --sheet --from 0 --to 16 --step 1 --out build/review/set_night/sheet.png
import { camera, text, FONT, CX, CY } from '../src/engine.js';
import { LOOK } from '../src/style.js';
import { bench, policeStop, policeLight } from '../src/sets/night.js';
import { drawFigure, POSE } from '../src/rig.js';

const BA = bench.anchors, PA = policeStop.anchors;
const L = (l) => ({ color: l.color || l.key, from: l.from, amount: l.amount });
const lunchbox = (ctx, x, y) => { ctx.fillStyle = '#d8432a'; ctx.beginPath(); ctx.roundRect(x - 26, y - 34, 52, 34, 5); ctx.fill(); ctx.fillStyle = '#8f2416'; ctx.fillRect(x - 26, y - 21, 52, 3); };

function benchShot(ctx, F, o, people) {
  bench.back(ctx, F, o);
  camera(ctx, o.cam, 1, () => people && people(o));
  bench.front(ctx, F, o);
}
const adamSeat = (o, pose = POSE.sitHunched, extra = {}) => drawFigure(ctx0, 'adam', { x: BA.seatL.x, y: 700, facing: 1, ...pose, seat: 110 },
  { ink: LOOK[o.look].ink, light: L(bench.lightAt(o.look, BA.seatL.x, o)), ...extra });
let ctx0 = null;

const PANELS = [];
const P = (name, fn) => PANELS.push({ name, fn });

// ── bench, rainNight ──
P('a3_05 wide rainNight lamp 1', (ctx, F, tt) => { const o = { look: 'rainNight', t: tt, cam: { x: 900, y: 380, zoom: 1.04 } };
  benchShot(ctx, F, o, () => { adamSeat(o, { ...POSE.sit, curl: 14, neck: 8, head: 10 }); lunchbox(ctx, BA.seatMid.x, BA.seatMid.y); }); });
P('a3_10 wide lamp 0 (folded)', (ctx, F, tt) => { const o = { look: 'rainNight', t: tt, lamp: 0, cam: { x: 900, y: 380, zoom: 1.06 } };
  benchShot(ctx, F, o, () => { adamSeat(o, { ...POSE.sitHunched, lean: 42, head: 30 }); lunchbox(ctx, BA.seatMid.x, BA.seatMid.y); }); });
P('a3_09 tight z2.5 rainNight', (ctx, F, tt) => { const o = { look: 'rainNight', t: tt, cam: { x: 700, y: 410, zoom: 2.5 } };
  benchShot(ctx, F, o, () => adamSeat(o, { ...POSE.sit, head: 14, neck: 6, curl: 10, armF: [40, 120] })); });
P('rainNight lamp 0.4 rain 0.3 + car 1480', (ctx, F, tt) => { const o = { look: 'rainNight', t: tt, lamp: 0.4, rain: 0.3, carX: 1480 };
  benchShot(ctx, F, o, () => adamSeat(o)); });
P('rainNight rain 0 lamp 1 empty', (ctx, F, tt) => { const o = { look: 'rainNight', t: tt, rain: 0 }; benchShot(ctx, F, o, null); });
// ── bench, greyDawn ──
P('a4_01 wide greyDawn car stopped, rep standing', (ctx, F, tt) => { const o = { look: 'greyDawn', t: tt, carX: 1480, cam: { x: 980, y: 400, zoom: 1.02 } };
  benchShot(ctx, F, o, () => { adamSeat(o, POSE.sleepSit); lunchbox(ctx, 712, 560);
    drawFigure(ctx, 'rep', { x: BA.standFront.x + 60, y: 700, facing: -1, ...POSE.holdToChest }, { ink: LOOK.greyDawn.ink, light: L(bench.lights.greyDawn) }); }); });
P('a4_02 two-shot z1.6', (ctx, F, tt) => { const o = { look: 'greyDawn', t: tt, carX: 1480, cam: { x: 801, y: 430, zoom: 1.6 } };
  benchShot(ctx, F, o, () => { adamSeat(o, POSE.sit);
    drawFigure(ctx, 'rep', { x: BA.seatR.x, y: 700, facing: -1, ...POSE.sit, seat: 110 }, { ink: LOOK.greyDawn.ink, light: { ...L(bench.lights.greyDawn), from: -1 } }); }); });
P('a4_03 closer z2.1', (ctx, F, tt) => { const o = { look: 'greyDawn', t: tt, carX: 1480, cam: { x: 801, y: 410, zoom: 2.1 } };
  benchShot(ctx, F, o, () => { adamSeat(o, { ...POSE.sit, head: -4 });
    drawFigure(ctx, 'rep', { x: BA.seatR.x, y: 700, facing: -1, ...POSE.sit, seat: 110 }, { ink: LOOK.greyDawn.ink, light: { ...L(bench.lights.greyDawn), from: -1 } }); }); });
P('greyDawn mist 0, no car', (ctx, F, tt) => { const o = { look: 'greyDawn', t: tt, mist: 0 }; benchShot(ctx, F, o, () => adamSeat(o, POSE.sit)); });
P('greyDawn mist 1, car arriving 2100', (ctx, F, tt) => { const o = { look: 'greyDawn', t: tt, mist: 1, carX: 2100 }; benchShot(ctx, F, o, () => adamSeat(o, POSE.sleepSit)); });
// ── policeStop ──
const policeShot = (ctx, F, o, cu) => {
  policeStop.back(ctx, F, o);
  const ink = LOOK.policeNight.ink, ph = o.phase ?? o.t;
  camera(ctx, o.cam, 1, () => {
    drawFigure(ctx, 'adam', { x: PA.adam.x, y: 700, facing: 1, ...POSE.point, armF: [70, 30] }, { ink, light: L(policeLight(ph, PA.adam.x)) });
    if (!cu) {
      drawFigure(ctx, 'officer', { x: PA.officer1.x, y: 700, facing: -1, ...POSE.stand }, { ink, light: { ...L(policeLight(ph, PA.officer1.x)), from: 1 } });
      drawFigure(ctx, 'officer', { x: PA.officer2.x, y: 700, facing: -1, ...POSE.stand, armF: [8, 20] }, { ink, light: L(policeLight(ph, PA.officer2.x)) });
    }
  });
  policeStop.front(ctx, F, o);
};
P('a3_01 master RED phase', (ctx, F, tt) => policeShot(ctx, F, { t: tt, phase: 0.2, cam: { x: 900, y: 400, zoom: 1.02 } }));
P('a3_01 master BLUE phase', (ctx, F, tt) => policeShot(ctx, F, { t: tt, phase: 0.62, cam: { x: 900, y: 400, zoom: 1.02 } }));
P('a3_02 face CU red', (ctx, F, tt) => policeShot(ctx, F, { t: tt, phase: 0.3, cam: { x: 640, y: 300, zoom: 2.6 } }, true));
P('a3_02 face CU blue', (ctx, F, tt) => policeShot(ctx, F, { t: tt, phase: 0.8, cam: { x: 640, y: 300, zoom: 2.6 } }, true));
P('police between pulses, police 0.3, steam 0', (ctx, F, tt) => policeShot(ctx, F, { t: tt, phase: 0.0, police: 0.3, steam: 0 }));
P('police overscan pan/zoom-out + rain', (ctx, F, tt) => policeShot(ctx, F, { t: tt, rain: 1, cam: { x: 1250, y: 380, zoom: 0.95, rot: 0.02 } }));
P('bench overscan pan left zoom 0.95 rainNight', (ctx, F, tt) => { const o = { look: 'rainNight', t: tt, cam: { x: 450, y: 420, zoom: 0.95, rot: -0.02 } }; benchShot(ctx, F, o, () => adamSeat(o)); });

export const duration = PANELS.length;
export default function draw(ctx, F) {
  ctx0 = ctx;
  const i = Math.min(PANELS.length - 1, Math.max(0, Math.floor(F.t)));
  const tt = 3 + (F.t - i) * 6;
  PANELS[i].fn(ctx, F, tt);
  text(ctx, `${i}  ${PANELS[i].name}`, 24, 30, { size: 18, family: FONT.mono, color: '#ffffff', alpha: 0.6, shadow: { color: '#000', blur: 4 } });
}
