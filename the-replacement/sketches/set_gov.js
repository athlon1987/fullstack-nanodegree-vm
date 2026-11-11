// Test sketch for src/sets/gov.js — panel = Math.floor(F.t). Render with
//   node tools/still.mjs --sketch /sketches/set_gov.js --sheet --from 0 --to 11 --step 1 --out build/review/set_gov/sheet.png
import { camera, text, FONT } from '../src/engine.js';
import { LOOK } from '../src/style.js';
import { govHall } from '../src/sets/gov.js';
import { drawFigure, POSE } from '../src/rig.js';

const A = govHall.anchors;
const M = { x: 960, y: 402, zoom: 1 };
const TWO = { x: 1290, y: 300, zoom: 1.8 };
const ADAM = { at: 'counter' }, SLUMP = { at: 'slump' }, CLERK = { at: 'clerk' }, MAYA = { at: 'maya' }, QUEUE = { at: 'queue' };

export const PANELS = [
  { name: '00 master, checks 0', o: { checks: 0 }, cam: M, figs: [ADAM, CLERK] },
  { name: '01 master push end, checks 3', o: { checks: 3 }, cam: { x: 1110, y: 380, zoom: 1.07 }, figs: [ADAM, CLERK] },
  { name: '02 two-shot z1.8, checks 1.5', o: { checks: 1.5 }, cam: TWO, figs: [ADAM, CLERK] },
  { name: '03 two-shot z1.8, checks 3', o: { checks: 3 }, cam: TWO, figs: [ADAM, CLERK] },
  { name: '04 hands CU z2.6, slump', o: { checks: 3 }, cam: { x: 1195, y: 420, zoom: 2.6 }, figs: [SLUMP, CLERK] },
  { name: '05 display CU z2.4, checks 2.5', o: { checks: 2.5 }, cam: { x: 1365, y: 185, zoom: 2.4 }, figs: [ADAM, CLERK] },
  { name: '06 clerk CU z2.4', o: { checks: 3 }, cam: { x: 1440, y: 360, zoom: 2.4 }, figs: [ADAM, CLERK] },
  { name: '07 ticket insert z2.6', o: {}, cam: { x: 605, y: 180, zoom: 2.6 }, figs: [] },
  { name: '08 empty hall, waiting 0, terminal 0, flicker 0', o: { waiting: 0, terminal: 0, flicker: 0 }, cam: M, figs: [] },
  { name: '09 scale: queue adult + child, slump', o: { checks: 3 }, cam: M, figs: [QUEUE, MAYA, SLUMP, CLERK] },
  { name: '10 overscan pan left rot', o: { checks: 1 }, cam: { x: 300, y: 380, zoom: 1, rot: 0.03 }, figs: [] },
  { name: '11 overscan pan right z0.95', o: { checks: 2 }, cam: { x: 1700, y: 420, zoom: 0.95, rot: -0.03 }, figs: [CLERK] },
];
export const duration = PANELS.length;

const lt = (l) => ({ color: l.key, from: l.from, amount: l.amount });
function fig(ctx, f, look, t) {
  const ink = LOOK[look].ink, br = Math.sin(t * 1.6);
  if (f.at === 'counter') drawFigure(ctx, 'adam', { x: A.customer.x, y: 700, facing: 1, ...POSE.stand, lean: 6, handF: A.handF, handB: A.handB }, { ink, light: lt(govHall.lights.gov), breath: br });
  if (f.at === 'slump') drawFigure(ctx, 'adam', { x: A.customer.x, y: 700, facing: 1, ...POSE.headBowed, handF: { x: 1115, y: 540 }, handB: { x: 1100, y: 530 } }, { ink, light: lt(govHall.lights.gov) });
  if (f.at === 'clerk') drawFigure(ctx, 'clerk', { x: 1500, y: 700, facing: -1, ...POSE.sit, seat: 150, lean: 8, handF: A.clerkHands, handB: { x: 1430, y: 428 } }, { ink, light: lt(govHall.lightAt('gov', 1500)), breath: br });
  if (f.at === 'queue') drawFigure(ctx, 'extraF', { x: A.queue.x, y: 700, facing: 1, ...POSE.stand }, { ink, light: lt(govHall.lightAt('gov', 860)) });
  if (f.at === 'maya') drawFigure(ctx, 'maya', { x: 760, y: 700, facing: 1, ...POSE.stand }, { ink, light: lt(govHall.lightAt('gov', 760)) });
}

export default function draw(ctx, F) {
  const i = Math.min(PANELS.length - 1, Math.max(0, Math.floor(F.t)));
  const p = PANELS[i];
  const o = { look: 'gov', ...p.o, cam: p.cam, t: 3 + (F.t - i) * 4 };
  govHall.back(ctx, F, o);
  camera(ctx, p.cam, 1, () => p.figs.filter((f) => f.at === 'clerk').forEach((f) => fig(ctx, f, 'gov', o.t)));
  govHall.mid(ctx, F, o);
  camera(ctx, p.cam, 1, () => p.figs.filter((f) => f.at !== 'clerk').forEach((f) => fig(ctx, f, 'gov', o.t)));
  govHall.front(ctx, F, o);
  text(ctx, p.name, 24, 30, { size: 17, family: FONT.mono, color: '#ffffff', alpha: 0.6, shadow: { color: '#000', blur: 4 } });
}
