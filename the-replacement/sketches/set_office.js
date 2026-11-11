// Test sketch for src/sets/office.js — panel = Math.floor(F.t). Render with
//   node tools/still.mjs --sketch /sketches/set_office.js --sheet --from 0 --to 13 --step 1 --out build/review/set_office/sheet.png
import { camera, text, FONT } from '../src/engine.js';
import { LOOK } from '../src/style.js';
import { managerOffice, lobby, meetingGlass } from '../src/sets/office.js';
import { drawFigure, POSE } from '../src/rig.js';

const ink = LOOK.officeDay.ink;
const MO = managerOffice.anchors, LB = lobby.anchors, MG = meetingGlass.anchors;
const M = { x: 960, y: 402, zoom: 1 };
let info = '';

function office(ctx, F, o) {
  managerOffice.back(ctx, F, o);
  const L = managerOffice.lights.officeDay, light = { color: L.key, from: L.from, amount: L.amount };
  camera(ctx, o.cam, 1, () => {
    drawFigure(ctx, 'manager', { x: MO.managerStand.x, y: 700, facing: -1, ...POSE.stand, handF: o.tap ? MO.deskTap : undefined }, { ink, light });
    drawFigure(ctx, 'adam', { x: MO.visitorSeat.x, y: 700, ...POSE.sit, seat: 90, head: o.bow ? 22 : 4 }, { ink, light });
  });
  managerOffice.front(ctx, F, o);
}
function lobbyShot(ctx, F, o) {
  lobby.back(ctx, F, o);
  const L = lobby.lights.officeDay, light = { color: L.key, from: L.from, amount: L.amount };
  const adam = (c) => drawFigure(c, 'adam', { x: LB.gateStand.x, y: 700, ...POSE.tapCard, handF: LB.reader }, { ink, light });
  const guard = (c) => drawFigure(c, 'guard', { x: LB.guardStand.x, y: 700, facing: -1, ...POSE.stand }, { ink, light });
  lobby.reflect(ctx, F, o, (c) => { adam(c); });
  camera(ctx, o.cam, 1, () => { adam(ctx); guard(ctx); });
  lobby.front(ctx, F, o);
}
function throughShot(ctx, F, o) {
  meetingGlass.back(ctx, F, o);
  const R = meetingGlass.roomLight, rl = { color: R.key, from: R.from, amount: R.amount };
  const s = meetingGlass.roomScale;
  camera(ctx, o.cam, 1, () => {
    ['seat1', 'seat2', 'seat3', 'seat4', 'seat5'].forEach((n, i) =>
      drawFigure(ctx, i % 2 ? 'manager' : 'extraM', { x: MG[n].x, y: 640, s, ...POSE.sit, seat: 90 }, { ink, light: rl }));
    drawFigure(ctx, 'v1', { x: MG.presenter.x, y: 640, s, facing: -1, ...POSE.present }, { ink, light: { ...rl, from: 1 }, glint: o.glint || 0 });
  });
  meetingGlass.mid(ctx, F, { ...o, part: 'table' });
  camera(ctx, o.cam, 1, () => { ctx.save(); ctx.globalAlpha = 0.12; drawFigure(ctx, 'adam', { x: MG.adamReflect.x, y: 700, s: 0.9, ...POSE.stand }, { ink: '#3a4658' }); ctx.restore(); });
  meetingGlass.mid(ctx, F, { ...o, part: 'glass' });
  const L = meetingGlass.lights.officeDay;
  camera(ctx, o.cam, 1.25, () => drawFigure(ctx, 'adam', { x: MG.adamOTS.x, y: MG.adamOTS.y, s: 2.1, curl: 10, ...POSE.stand }, { ink, light: { color: L.key, from: L.from, amount: L.amount } }));
  meetingGlass.front(ctx, F, o);
}
function edgeShot(ctx, F, o) {
  meetingGlass.back(ctx, F, o);
  const L = meetingGlass.lights.officeDay;
  camera(ctx, o.cam, 1, () => {
    const a = drawFigure(ctx, 'adam', { x: o.ax ?? MG.adamGlass.x, y: 700, ...POSE.stand, head: 6 }, { ink, light: { color: L.key, from: L.from, amount: L.amount } });
    info = `mouth ${a.mouth.x.toFixed(0)},${a.mouth.y.toFixed(0)}`;
  });
  meetingGlass.front(ctx, F, o);
}

export const PANELS = [
  ['00 managerOffice master (a1_07)', office, { cam: M }],
  ['01 manager + chart z1.9', office, { cam: { x: 1480, y: 320, zoom: 1.9 }, tap: 1 }],
  ['02 Adam in low chair z2.2', office, { cam: { x: 700, y: 440, zoom: 2.2 }, bow: 1 }],
  ['03 chart 0.4, blinds 0', office, { cam: M, chart: 0.4, blinds: 0 }],
  ['04 lobby master reader 0 monitor 0 (a2_01)', lobbyShot, { cam: M, reader: 0, monitor: 0 }],
  ['05 lobby reader 1 monitor 1', lobbyShot, { cam: M, reader: 1, monitor: 1 }],
  ['06 reader insert z2.4', lobbyShot, { cam: { x: 630, y: 500, zoom: 2.4 }, reader: 1 }],
  ['07 guard monitor z2.3', lobbyShot, { cam: { x: 1560, y: 340, zoom: 2.3 }, monitor: 1 }],
  ['08 meetingGlass through (a2_02)', throughShot, { cam: { x: 900, y: 390, zoom: 1 } }],
  ['09 through push z1.12, chart 0.5', throughShot, { cam: { x: 1000, y: 380, zoom: 1.12 }, chart: 0.5 }],
  ['10 presenter glance CU z2.4', throughShot, { cam: { x: 1180, y: 330, zoom: 2.4 }, glint: 1 }],
  ['11 edge view (a2_03) fog 0 wide', edgeShot, { view: 'edge', cam: { x: 900, y: 380, zoom: 1.0 }, fog: 0 }],
  ['12 edge view fog 1 z2.2', edgeShot, { view: 'edge', cam: { x: 960, y: 330, zoom: 2.2 }, fog: 1 }],
  ['13 edge view fog 0.5 z1.4', edgeShot, { view: 'edge', cam: { x: 900, y: 380, zoom: 1.4 }, fog: 0.5 }],
  ['14 bench: through view, set only', (ctx, F, o) => { meetingGlass.back(ctx, F, o); meetingGlass.mid(ctx, F, o); meetingGlass.front(ctx, F, o); }, { cam: M }],
  ['15 bench: lobby, set only', (ctx, F, o) => { lobby.back(ctx, F, o); lobby.front(ctx, F, o); }, { cam: M, reader: 1 }],
  ['16 bench: office, set only', (ctx, F, o) => { managerOffice.back(ctx, F, o); managerOffice.front(ctx, F, o); }, { cam: M }],
  ['17 bench: edge, set only', (ctx, F, o) => { meetingGlass.back(ctx, F, o); meetingGlass.front(ctx, F, o); }, { cam: M, view: 'edge', fog: 1 }],
];
export const duration = PANELS.length;

export default function draw(ctx, F) {
  const i = Math.min(PANELS.length - 1, Math.max(0, Math.floor(F.t)));
  const [name, fn, o] = PANELS[i];
  info = '';
  fn(ctx, F, { look: 'officeDay', t: 3 + (F.t - i) * 4, ...o });
  text(ctx, name + '  ' + info, 24, 30, { size: 17, family: FONT.mono, color: '#ffffff', alpha: 0.6, shadow: { color: '#000', blur: 4 } });
}
