// Test sketch for src/sets/bedcorridor.js — panel = Math.floor(F.t). Render with
//   node tools/still.mjs --sketch /sketches/set_bedcorridor.js --sheet --from 0 --to 18 --step 1 --out build/review/set_bedcorridor/sheet.png
import { camera, text, FONT } from '../src/engine.js';
import { LOOK } from '../src/style.js';
import { bedroom, corridor, bedsideCloseup, alarmClock, clockPoint } from '../src/sets/bedcorridor.js';
import { drawFigure, drawHand, POSE } from '../src/rig.js';

const BA = bedroom.anchors, CA = corridor.anchors, EA = bedsideCloseup.anchors;
const M = { x: 960, y: 402, zoom: 1 };
// figure: [who, pose, opts]  — `in`: drawn before corridor.mid() (inside the flat)
const fig = (who, pose, extra = {}) => ({ who, pose, ...extra });

export const PANELS = [
  // ── bedroom ──
  { name: '00 bedroom predawn master (a1_02)', set: 'bed', o: { look: 'predawn' }, cam: M,
    figs: [fig('adam', { x: BA.sit.x, y: 700, ...POSE.sitBed })] },
  { name: '01 bedroom predawn a1_02 framing, hand on back', set: 'bed', o: { look: 'predawn' }, cam: { x: 930, y: 430, zoom: 1.3 },
    figs: [fig('adam', { x: BA.sit.x, y: 700, ...POSE.sitBed, armF: [-32, -78], head: 22 })] },
  { name: '02 bedroom profile CU zoom 2.3', set: 'bed', o: { look: 'predawn' }, cam: { x: 840, y: 420, zoom: 2.3 },
    figs: [fig('adam', { x: BA.sit.x, y: 700, ...POSE.sitBed })] },
  { name: '03 bedside table CU zoom 2.6, clock glitch', set: 'bed', o: { look: 'predawn', clockGlitch: 0.7 }, cam: { x: 1165, y: 520, zoom: 2.6 }, figs: [] },
  { name: '04 bedroom golden, standing + child at bed foot', set: 'bed', o: { look: 'golden' }, cam: M,
    figs: [fig('adam', { x: BA.stand.x, y: 700, ...POSE.stand, facing: -1 }), fig('maya', { x: BA.bedFoot.x, y: 700, ...POSE.stand })] },
  { name: '05 bedroom wifeAsleep 0, light 0.5, phone 0', set: 'bed', o: { look: 'predawn', wifeAsleep: 0, light: 0.5, phoneOnTable: 0 }, cam: M, figs: [] },
  { name: '06 bedroom.backdrop (a1_03 phone bg)', set: 'backdrop', o: { look: 'predawn' } },
  // ── bedside ECU ──
  { name: '07 ECU predawn 5:44 (a1_01)', set: 'ecu', o: { look: 'predawn' }, clock: { time: '5:44' }, cam: M },
  { name: '08 ECU predawn 5:45 glitch 0.9', set: 'ecu', o: { look: 'predawn' }, clock: { time: '5:45', glitch: 0.9 }, cam: { x: 960, y: 402, zoom: 1.04 } },
  { name: '09 ECU golden 5:45, hand on snooze (a7_02)', set: 'ecu', o: { look: 'golden' }, clock: { time: '5:45', press: 1 }, hand: 1, cam: M },
  { name: '10 ECU zoom 2.2 on the crack', set: 'ecu', o: { look: 'predawn' }, clock: { time: '5:45' }, cam: { x: 1000, y: 390, zoom: 2.2 } },
  // ── corridor ──
  { name: '11 corridor a2_10 end: shut, glow, family', set: 'cor', o: { underDoorGlow: 1, family: 1 }, cam: M,
    figs: [fig('adam', { x: CA.adam.x, y: 700, ...POSE.stand })] },
  { name: '12 corridor a2_10 framing: forehead on door', set: 'cor', o: { underDoorGlow: 1, family: 1 }, cam: { x: 1290, y: 400, zoom: 1.9 },
    figs: [fig('adam', { x: CA.lean.x, y: 700, ...POSE.foreheadOnDoor })] },
  { name: '13 corridor door half open (closing)', set: 'cor', o: { doorOpen: 0.45 }, cam: { x: 1160, y: 410, zoom: 1.25 },
    figs: [fig('adam', { x: CA.adam.x, y: 700, ...POSE.stand })] },
  { name: '14 corridor a5_01 evening, knocking', set: 'cor', o: { evening: 1, underDoorGlow: 1 }, cam: { x: 1160, y: 410, zoom: 1.25 },
    figs: [fig('adam', { x: CA.adam.x, y: 700, ...POSE.stand, armF: [62, 96] })] },
  { name: '15 corridor a5_01 evening, open, V1 in doorway', set: 'cor', o: { evening: 1, doorOpen: 1 }, cam: { x: 1160, y: 410, zoom: 1.25 },
    figs: [fig('v1', { x: CA.doorway.x, y: 702, ...POSE.stand, facing: -1 }, { in: 1 }), fig('adam', { x: CA.adam.x, y: 700, ...POSE.stand })] },
  { name: '16 corridor open two-shot zoom 1.9', set: 'cor', o: { evening: 1, doorOpen: 1 }, cam: { x: 1340, y: 400, zoom: 1.9 },
    figs: [fig('v1', { x: CA.inside.x, y: 704, ...POSE.stand, facing: -1 }, { in: 1 }), fig('adam', { x: CA.adam.x + 20, y: 700, ...POSE.stand })] },
  { name: '17 corridor empty base, tube flicker 1 (stutter)', set: 'cor', o: { tubeFlicker: 1 }, cam: M, t: 2.2, figs: [] },
  { name: '18 corridor zoom 2.6 glass + handle', set: 'cor', o: { family: 1, underDoorGlow: 1 }, cam: { x: 1380, y: 400, zoom: 2.6 }, figs: [] },
];
export const duration = PANELS.length;

function drawFigs(ctx, cam, figs, look, light) {
  camera(ctx, cam, 1, () => figs.forEach((f) => {
    const L = f.light || light;
    drawFigure(ctx, f.who, f.pose, { ink: LOOK[look].ink, light: { color: L.key, from: L.from, amount: L.amount }, breath: 0 });
  }));
}

export default function draw(ctx, F) {
  const i = Math.min(PANELS.length - 1, Math.max(0, Math.floor(F.t)));
  const p = PANELS[i];
  const t = p.t ?? 3 + (F.t - i) * 4;
  const o = { ...p.o, cam: p.cam, t };
  if (p.set === 'bed') {
    bedroom.back(ctx, F, o);
    drawFigs(ctx, p.cam, p.figs, o.look, bedroom.lights[o.look]);
    bedroom.front(ctx, F, o);
  } else if (p.set === 'backdrop') {
    bedroom.backdrop(ctx, F, o);
  } else if (p.set === 'ecu') {
    bedsideCloseup.back(ctx, F, o);
    const co = { ...EA.clock, ...p.clock, t, look: o.look };
    camera(ctx, p.cam, 1, () => {
      alarmClock(ctx, co);
      if (p.hand) {
        const s = clockPoint(co, 'snooze');
        drawHand(ctx, { x: s.x - 330, y: s.y - 40, size: 260, rot: 8, pose: 'flat', ink: LOOK[o.look].ink, light: { color: bedsideCloseup.lights[o.look].key, from: 1, amount: 0.9 } });
      }
    });
    bedsideCloseup.front(ctx, F, o);
  } else {
    const look = 'corridor';
    o.look = look;
    corridor.back(ctx, F, o);
    const L = corridor.light(o, t);
    drawFigs(ctx, p.cam, p.figs.filter((f) => f.in), look, { key: '#ffd08a', from: 1, amount: 0.9 });
    corridor.mid(ctx, F, o);
    drawFigs(ctx, p.cam, p.figs.filter((f) => !f.in), look, L);
    corridor.front(ctx, F, o);
  }
  text(ctx, p.name, 24, 30, { size: 17, family: FONT.mono, color: '#ffffff', alpha: 0.55, shadow: { color: '#000', blur: 4 } });
}
