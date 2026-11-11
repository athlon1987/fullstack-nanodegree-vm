// Test sketch for src/sets/school.js — panel = Math.floor(F.t).
//   node tools/still.mjs --sketch /sketches/set_school.js --sheet --from 0 --to 18 --step 1 --out build/review/set_school/sheet.png
import { camera, text, FONT } from '../src/engine.js';
import { LOOK } from '../src/style.js';
import { auditorium, stage, steps } from '../src/sets/school.js';
import { drawFigure, POSE } from '../src/rig.js';

const AA = auditorium.anchors, SA = stage.anchors, TA = steps.anchors;
const M = { x: 960, y: 402, zoom: 1 };
const lit = (set, look, amount) => ({ ...set.lights[look], color: set.lights[look].key, amount: amount ?? set.lights[look].amount });

const adamDoor = (k) => ({ who: 'adam', p: { x: AA.door.x, y: AA.door.y, s: AA.door.scale, facing: 1, ...POSE.stand, lean: 6 }, light: { color: '#d8cfbe', from: -1, amount: 0.55 * k } });
const mayaSit = { who: 'maya', p: { x: TA.mayaSit.x, y: TA.mayaSit.y, ...POSE.sitSteps, seat: 44, facing: -1 }, wear: { starHeadband: true, backpack: false } };
const adamKneel = (reach) => ({ who: 'adam', p: { x: TA.adamKneel.x, y: TA.adamKneel.y, ...POSE.kneelOne, footF: [0.205, -0.1023], ...(reach ? { armF: [80, 10], lean: 12 } : {}) } });

export const PANELS = [
  { name: '00 auditorium master, door shut', set: auditorium, look: 'nightDark', o: { doorOpen: 0 }, cam: M, figs: [] },
  { name: '01 auditorium door open + Adam + shadow', set: auditorium, look: 'nightDark', o: { doorOpen: 1, shadow: 1 }, cam: M, figs: [adamDoor(1)] },
  { name: '02 auditorium door 0.35', set: auditorium, look: 'nightDark', o: { doorOpen: 0.35 }, cam: M, figs: [] },
  { name: '03 auditorium end of push 1.08', set: auditorium, look: 'nightDark', o: { doorOpen: 1, shadow: 1 }, cam: { x: 1060, y: 300, zoom: 1.08 }, figs: [adamDoor(1)] },
  { name: '04 auditorium stage CU 2.2', set: auditorium, look: 'nightDark', o: { doorOpen: 1 }, cam: { x: 1060, y: 240, zoom: 2.2 }, figs: [] },
  { name: '05 auditorium doorway CU 2.2', set: auditorium, look: 'nightDark', o: { doorOpen: 1, shadow: 1 }, cam: { x: 190, y: 420, zoom: 2.2 }, figs: [adamDoor(1)] },
  { name: '06 auditorium aisle stars CU 2.5', set: auditorium, look: 'nightDark', o: { doorOpen: 1, shadow: 1 }, cam: { x: 1060, y: 560, zoom: 2.5 }, figs: [] },
  { name: '07 auditorium work 0, door 1', set: auditorium, look: 'nightDark', o: { doorOpen: 1, work: 0 }, cam: M, figs: [adamDoor(1)] },
  { name: '08 stage master', set: stage, look: 'warmDay', o: {}, cam: M,
    behind: [{ who: 'extraF', p: { x: SA.teacher.x, y: SA.teacher.y, facing: 1, ...POSE.stand } }],
    figs: [{ who: 'maya', p: { x: SA.maya.x, y: SA.maya.y, facing: -1, ...POSE.stand } }, { who: 'v1', p: { x: SA.v1.x, y: SA.v1.y, facing: -1, ...POSE.stand } }] },
  { name: '09 stage clap 1 confetti 1 (square crop zoom)', set: stage, look: 'warmDay', o: { clap: 1, confetti: 1 }, cam: { x: 910, y: 422, zoom: 1.6 },
    behind: [{ who: 'extraF', p: { x: SA.teacher.x, y: SA.teacher.y, facing: 1, ...POSE.stand } }],
    figs: [{ who: 'maya', p: { x: SA.maya.x, y: SA.maya.y, facing: -1, ...POSE.childArmsUp } }, { who: 'v1', p: { x: SA.v1.x, y: SA.v1.y, facing: -1, ...POSE.stand } }] },
  { name: '10 stage portrait crop region (zoom 2.4)', set: stage, look: 'warmDay', o: { clap: 0.6, confetti: 0.4, spot: 1 }, cam: { x: 970, y: 404, zoom: 2.4 },
    figs: [{ who: 'maya', p: { x: SA.maya.x, y: SA.maya.y, facing: 1, ...POSE.stand } }, { who: 'v1', p: { x: SA.v1.x, y: SA.v1.y, facing: -1, ...POSE.stand } }] },
  { name: '11 steps master', set: steps, look: 'blueHour', o: {}, cam: M, figs: [mayaSit, adamKneel(false)] },
  { name: '12 steps two-shot 1.85, reach', set: steps, look: 'blueHour', o: {}, cam: { x: 1120, y: 430, zoom: 1.85 }, figs: [mayaSit, adamKneel(true)] },
  { name: '13 steps Maya CU 2.8', set: steps, look: 'blueHour', o: {}, cam: { x: 1215, y: 410, zoom: 2.8 }, figs: [mayaSit, adamKneel(true)] },
  { name: '14 steps Adam CU 2.8', set: steps, look: 'blueHour', o: {}, cam: { x: 1035, y: 410, zoom: 2.8 }, figs: [mayaSit, adamKneel(true)] },
  { name: '15 steps arrive: Adam at adamStop, Maya sits', set: steps, look: 'blueHour', o: {}, cam: M, figs: [mayaSit, { who: 'adam', p: { x: TA.adamStop.x, y: 700, facing: 1, ...POSE.stand } }] },
  { name: '16 steps walk off: Maya at ground, lamp 0', set: steps, look: 'blueHour', o: { lamp: 0 }, cam: M,
    figs: [{ who: 'maya', p: { x: 600, y: 700, facing: -1, ...POSE.walk(0.3) }, wear: { starHeadband: true, backpack: true } }, adamKneel(true)] },
  { name: '17 steps pan left + rot (overscan)', set: steps, look: 'blueHour', o: {}, cam: { x: 500, y: 380, zoom: 1.05, rot: 0.03 }, figs: [] },
  { name: '18 steps empty steps 1.4', set: steps, look: 'blueHour', o: {}, cam: { x: 1100, y: 430, zoom: 1.4 }, figs: [adamKneel(true)] },
];
export const duration = PANELS.length;

function drawFigs(ctx, list, set, look) {
  for (const f of list || []) {
    const L = set.lightAt ? set.lightAt(look, f.p.x) : set.lights[look];
    drawFigure(ctx, f.who, f.p, { ink: LOOK[look].ink, light: f.light || { color: L.key, from: L.from, amount: L.amount }, wear: f.wear, breath: 0 });
  }
}

export default function draw(ctx, F) {
  const i = Math.min(PANELS.length - 1, Math.max(0, Math.floor(F.t)));
  const p = PANELS[i];
  const o = { look: p.look, ...p.o, cam: p.cam, t: 3 + (F.t - i) * 4 };
  p.set.back(ctx, F, o);
  camera(ctx, p.cam, 1, () => drawFigs(ctx, p.behind, p.set, p.look));
  p.set.mid(ctx, F, o);
  camera(ctx, p.cam, 1, () => drawFigs(ctx, p.figs, p.set, p.look));
  p.set.front(ctx, F, o);
  text(ctx, p.name, 24, 30, { size: 17, family: FONT.mono, color: '#ffffff', alpha: 0.55, shadow: { color: '#000', blur: 4 } });
}
