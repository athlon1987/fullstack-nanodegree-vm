// Test sketch for src/sets/kitchen.js — panel = Math.floor(F.t). Render with
//   node tools/still.mjs --sketch /sketches/set_kitchen.js --t 0.5,1.5,... --out build/review/set_kitchen/
import { camera, text, FONT } from '../src/engine.js';
import { LOOK } from '../src/style.js';
import { kitchen } from '../src/sets/kitchen.js';
import { dummy } from './_dummy.js';

const A = kitchen.anchors;
const ADULT = 430, CHILD = 265;
// stand-ins: [anchor or {x,y}, opts]   kind: 'stand' | 'sit' | 'kneel'
const fig = (at, facing = 1, h = ADULT, kind = 'stand') => ({ at, facing, h, kind });
const M = { x: 960, y: 402, zoom: 1 };

export const PANELS = [
  // ── masters, one per look ──
  { name: '00 greyMorning master (a1_05/06)', o: { look: 'greyMorning' }, cam: M,
    figs: [fig(A.standL, 1), fig(A.seatR, -1, CHILD, 'sit'), fig(A.counterR, -1)] },
  { name: '01 nightDark master (a1_11)', o: { look: 'nightDark' }, cam: M, figs: [fig(A.seatL, 1, ADULT, 'sit')] },
  { name: '02 warmDay master (a2_06)', o: { look: 'warmDay', doorOpen: 1, cupboardOpen: 1, stool: 0 }, cam: M,
    figs: [fig(A.doorStand, 1), fig(A.sink, 1, ADULT, 'kneel'), fig({ x: 1375, y: 700 }, -1), fig({ x: 1180, y: 700 }, 1, CHILD)] },
  { name: '03 lampNight master (a5_02)', o: { look: 'lampNight' }, cam: M,
    figs: [fig(A.seatL, 1, ADULT, 'sit'), fig(A.seatR, -1, ADULT, 'sit')] },
  { name: '04 golden master (a7_03)', o: { look: 'golden', toast: 1 }, cam: M,
    figs: [fig(A.counterStand, 1), fig(A.stoolTop, -1, CHILD), fig({ x: 1700, y: 700 }, -1)] },

  // ── close framings ──
  { name: '05 toaster CU greyMorning, burnt + smoke (a1_04)', o: { look: 'greyMorning', toast: 1, toastBurnt: 1, smoke: 1 }, cam: { x: 1400, y: 420, zoom: 4.2 }, figs: [] },
  { name: '06 toaster CU greyMorning, before the pop: thread of smoke', o: { look: 'greyMorning', toast: 0, toastBurnt: 1, smoke: 0.25 }, cam: { x: 1400, y: 420, zoom: 4.2 }, figs: [] },
  { name: '07 toaster golden toast (a7_03)', o: { look: 'golden', toast: 1 }, cam: { x: 1390, y: 470, zoom: 2.4 },
    figs: [fig(A.stoolTop, -1, CHILD), fig({ x: 1290, y: 700 }, 1)] },
  { name: '08 table top CU lampNight (a5_03/05)', o: { look: 'lampNight' }, cam: { x: 800, y: 470, zoom: 4 }, figs: [fig(A.seatL, 1, ADULT, 'sit'), fig(A.seatR, -1, ADULT, 'sit')] },
  { name: '09 tight two-shot lampNight (a5_07)', o: { look: 'lampNight' }, cam: { x: 800, y: 430, zoom: 2.1 }, figs: [fig(A.seatL, 1, ADULT, 'sit'), fig(A.seatR, -1, ADULT, 'sit')] },
  { name: '10 profile CU V1 lampNight (a5_06)', o: { look: 'lampNight' }, cam: { x: 990, y: 410, zoom: 3 }, figs: [fig(A.seatL, 1, ADULT, 'sit'), fig(A.seatR, -1, ADULT, 'sit')] },
  { name: '11 hug CU lampNight (a6_03)', o: { look: 'lampNight' }, cam: { x: 600, y: 430, zoom: 2.8 }, figs: [fig(A.seatL, 1, ADULT, 'sit'), fig({ x: 650, y: 700 }, -1, CHILD)] },
  { name: '12 bedrooms doorway lampNight (a6_01)', o: { look: 'lampNight' }, cam: { x: 1700, y: 500, zoom: 2.2 }, figs: [fig(A.hallDoor, -1, CHILD)] },
  { name: '13 front door warmDay, open (a2_05)', o: { look: 'warmDay', doorOpen: 1 }, cam: { x: 420, y: 440, zoom: 1.7 }, figs: [fig(A.doorStand, 1)] },
  { name: '14 profile CU nightDark (a1_13)', o: { look: 'nightDark' }, cam: { x: 610, y: 410, zoom: 2.7 }, figs: [fig(A.seatL, 1, ADULT, 'sit')] },
  { name: '15 two-shot warmDay (a2_07/09)', o: { look: 'warmDay', doorOpen: 1 }, cam: { x: 780, y: 440, zoom: 1.9 }, figs: [fig({ x: 640, y: 700 }, 1), fig({ x: 930, y: 700 }, -1)], behind: [] , inFront: true },
  { name: '16 V1 at the edge of the lamplight (a6_04)', o: { look: 'lampNight' }, cam: { x: 1090, y: 420, zoom: 2 }, figs: [fig(A.standR, -1)] },
  { name: '17 lampNight wide: Maya walking (a6_02)', o: { look: 'lampNight' }, cam: { x: 1000, y: 410, zoom: 1.05 },
    figs: [fig(A.seatL, 1, ADULT, 'sit'), fig(A.standR, 1), fig(A.hallDoor, -1, CHILD), fig({ x: 1560, y: 700 }, -1, CHILD), fig({ x: 1320, y: 700 }, -1, CHILD)] },
  { name: '18 sink, cupboard open, warmDay (a2_06)', o: { look: 'warmDay', cupboardOpen: 1, stool: 0 }, cam: { x: 1290, y: 520, zoom: 2.3 }, figs: [] },

  // ── state values at both ends ──
  { name: '19 door 0.5 open, greyMorning', o: { look: 'greyMorning', doorOpen: 0.5 }, cam: { x: 420, y: 440, zoom: 1.7 }, figs: [] },
  { name: '20 door 0.2 / lamp on in greyMorning / stool 0', o: { look: 'greyMorning', doorOpen: 0.2, lampOn: 1, stool: 0 }, cam: M, figs: [] },
  { name: '21 lampNight lampOn 0, hallGlow 0', o: { look: 'lampNight', lampOn: 0, hallGlow: 0 }, cam: M, figs: [] },
  { name: '22 lampNight lampSway +1, hallGlow 1, door open', o: { look: 'lampNight', lampSway: 1, doorOpen: 1 }, cam: M, figs: [fig(A.doorStand, 1)] },
  { name: '23 lampNight lampSway -1, lampOn 0.5', o: { look: 'lampNight', lampSway: -1, lampOn: 0.5 }, cam: M, figs: [] },
  { name: '24 golden door open (exit, a7_03), toast down, 1 slice', o: { look: 'golden', doorOpen: 1, toast: 0.5, toastCount: 1 }, cam: M, figs: [fig(A.doorStand, -1), fig(A.counterStand, -1), fig(A.stoolTop, -1, CHILD)] },
  { name: '25 nightDark hallGlow 1, lampOn 1', o: { look: 'nightDark', hallGlow: 1, lampOn: 1 }, cam: M, figs: [] },
  { name: '26 warmDay smoke 0.6, cupboard 0.5', o: { look: 'warmDay', smoke: 0.6, cupboardOpen: 0.5, toast: 1, toastBurnt: 0.5 }, cam: { x: 1330, y: 470, zoom: 2 }, figs: [] },

  // ── camera robustness ──
  { name: '27 pan far left, rotated (overscan check)', o: { look: 'greyMorning' }, cam: { x: 250, y: 380, zoom: 1, rot: 0.03 }, figs: [] },
  { name: '28 pan far right, zoom 0.95 (overscan check)', o: { look: 'warmDay' }, cam: { x: 1750, y: 430, zoom: 0.95, rot: -0.03 }, figs: [] },
  { name: '29 greyMorning two at the table (a1_05)', o: { look: 'greyMorning' }, cam: { x: 800, y: 440, zoom: 1.8 }, figs: [fig({ x: 900, y: 700 }, 1), fig(A.seatR, -1, CHILD, 'sit')], behindFirst: 1 },
  { name: '30 golden wide, empty', o: { look: 'golden' }, cam: M, figs: [] },
  { name: '31 greyMorning wide, empty', o: { look: 'greyMorning' }, cam: M, figs: [] },
  { name: '32 warmDay wide, empty', o: { look: 'warmDay' }, cam: M, figs: [] },
  { name: '33 fridge drawings close', o: { look: 'greyMorning' }, cam: { x: 1600, y: 440, zoom: 3 }, figs: [] },
  { name: '34 pictures + coats close', o: { look: 'warmDay' }, cam: { x: 520, y: 330, zoom: 2.6 }, figs: [] },
];
export const duration = PANELS.length;

function drawFig(ctx, f, look) {
  const color = LOOK[look].ink, p = f.at, k = f.h / ADULT;
  if (f.kind === 'sit') dummy(ctx, p.x, p.y + 110 * k, { h: f.h, facing: f.facing, color, sit: true });
  else if (f.kind === 'kneel') dummy(ctx, p.x, p.y + 62, { h: f.h, facing: f.facing, color, sit: true });
  else dummy(ctx, p.x, p.y, { h: f.h, facing: f.facing, color });
}

export default function draw(ctx, F) {
  const i = Math.min(PANELS.length - 1, Math.max(0, Math.floor(F.t)));
  const p = PANELS[i];
  const o = { ...p.o, cam: p.cam, t: 3 + (F.t - i) * 4 };
  kitchen.back(ctx, F, o);
  const figs = p.figs || [];
  const nBehind = p.behindFirst || 0;
  camera(ctx, p.cam, 1, () => figs.slice(0, nBehind).forEach((f) => drawFig(ctx, f, o.look)));
  kitchen.mid(ctx, F, o);
  if (p.inFront) {
    kitchen.front(ctx, F, { ...o, part: 'furniture' });
    camera(ctx, p.cam, 1, () => figs.slice(nBehind).forEach((f) => drawFig(ctx, f, o.look)));
    kitchen.front(ctx, F, { ...o, part: 'air' });
  } else {
    camera(ctx, p.cam, 1, () => figs.slice(nBehind).forEach((f) => drawFig(ctx, f, o.look)));
    kitchen.front(ctx, F, o);
  }
  text(ctx, p.name, 24, 30, { size: 17, family: FONT.mono, color: '#ffffff', alpha: 0.55, shadow: { color: '#000', blur: 4 } });
}
