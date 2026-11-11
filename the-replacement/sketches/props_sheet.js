// Props test sheet. panel = Math.floor(F.t); see the list at the bottom of this file.
//   node tools/still.mjs --sketch /sketches/props_sheet.js --t 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5 --out build/review/props/
import { PW, PH, CX, CY, glow, text, linGrad, radGrad, rgba, mixHex, FONT, lightCone, rad, TAU } from '../src/engine.js';
import { C, LOOK } from '../src/style.js';
import * as PR from '../src/props.js';
import { dummy } from './_dummy.js';
import { drawHand } from '../src/rig.js';

export const duration = 8;
export const vig = 0.3;

const label = (ctx, str, x, y, o = {}) => text(ctx, str, x, y, { size: 19, family: FONT.mono, color: C.mist, align: 'center', alpha: 0.85, tracking: 1, ...o });
const title = (ctx, str) => text(ctx, str, 40, 44, { size: 20, family: FONT.mono, color: C.fog, tracking: 2, alpha: 0.9 });

// a warm lamplit table top
function lampTable(ctx, tableY, lampX = CX) {
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, PH, [[0, '#0b0806'], [1, '#17100a']]); ctx.fillRect(0, 0, PW, PH);
  glow(ctx, lampX, tableY - 330, 900, C.amber, 0.2);
  // table
  ctx.fillStyle = linGrad(ctx, 0, tableY, 0, PH, [[0, '#5a3a20'], [0.12, '#3a2414'], [1, '#150d07']]);
  ctx.fillRect(0, tableY, PW, PH - tableY);
  ctx.fillStyle = rgba('#ffd9a0', 0.25); ctx.fillRect(0, tableY, PW, 2);
  glow(ctx, lampX, tableY + 30, 760, C.honey, 0.5, 0.16);
}

function panel0(ctx) {
  const ty = 640;
  lampTable(ctx, ty);
  title(ctx, 'LUNCHBOX — closed · open 0.5 · open 1 + note 1   (warm lamplight)');
  const light = (ang) => ({ color: C.honey, angle: ang, amount: 0.75 });
  const tint = LOOK.lampNight.haze;
  PR.lunchbox(ctx, { x: 370, y: ty, size: 400, open: 0, lum: 0.9, tint, light: light(-55), shadow: 0.9 });
  PR.lunchbox(ctx, { x: 960, y: ty, size: 400, open: 0.5, note: 0.02, lum: 0.9, tint, light: light(-90), shadow: 0.9 });
  PR.lunchbox(ctx, { x: 1550, y: ty, size: 400, open: 1, note: 1, lum: 0.9, tint, light: light(-125), shadow: 0.9 });
  label(ctx, 'open 0', 370, ty + 70); label(ctx, 'open 0.5', 960, ty + 70); label(ctx, 'open 1 · note 1', 1550, ty + 70);
}

function panel1(ctx) {
  ctx.fillStyle = '#0a0d14'; ctx.fillRect(0, 0, PW, PH);
  title(ctx, 'LUNCHBOX — lighting states');
  const w = PW / 5, fy = 600, S = 250;
  const cell = (i, bg, fn, name) => {
    ctx.save(); ctx.beginPath(); ctx.rect(i * w, 70, w, PH - 70); ctx.clip();
    bg(i * w, w); fn(i * w + w / 2);
    ctx.restore();
    label(ctx, name, i * w + w / 2, PH - 78);
  };
  // 1 neutral, full light
  cell(0, (x, ww) => { ctx.fillStyle = linGrad(ctx, 0, 70, 0, PH, [[0, '#8794a6'], [0.72, '#aab4c2'], [0.722, '#59657a'], [1, '#3a4456']]); ctx.fillRect(x, 0, ww, PH); },
    (cx) => PR.lunchbox(ctx, { x: cx, y: fy, size: S, lum: 1, shadow: 0.6 }), 'lum 1 · neutral');
  // 2 cold blue dim
  cell(1, (x, ww) => { ctx.fillStyle = linGrad(ctx, 0, 70, 0, PH, [[0, '#070c18'], [0.72, '#111c33'], [0.722, '#0a1222'], [1, '#050912']]); ctx.fillRect(x, 0, ww, PH); glow(ctx, x + ww * 0.1, 300, 420, '#5c79a8', 0.25); },
    (cx) => PR.lunchbox(ctx, { x: cx, y: fy, size: S, lum: 0.25, tint: C.navy, light: { color: LOOK.nightDark.key, from: -1, amount: 0.55 }, shadow: 0.5 }), 'lum 0.25 · tint navy');
  // 3 cyan phone glow from below-left
  cell(2, (x, ww) => { ctx.fillStyle = linGrad(ctx, 0, 70, 0, PH, [[0, '#04070e'], [0.72, '#0a121f'], [0.722, '#0b1622'], [1, '#04080f']]); ctx.fillRect(x, 0, ww, PH); },
    (cx) => {
      glow(ctx, cx - 150, fy + 6, 330, C.cyan, 0.5, 0.5);
      PR.lunchbox(ctx, { x: cx + 20, y: fy, size: S, lum: 0.22, tint: C.navy, light: [{ color: C.cyan, angle: 165, amount: 0.9 }, { color: LOOK.nightDark.key, from: 1, amount: 0.25 }], shadow: 0.4 });
      PR.phoneSmall && PR.phoneSmall(ctx, { x: cx - 150, y: fy - 3, size: 90, rot: 90, glow: C.cyan, face: -1 });
    }, 'phone glow (cyan, low)');
  // 4 golden morning
  cell(3, (x, ww) => { ctx.fillStyle = linGrad(ctx, 0, 70, 0, PH, [[0, '#ffc76b'], [0.72, '#ffe6b8'], [0.722, '#a8642e'], [1, '#6b3f1c']]); ctx.fillRect(x, 0, ww, PH); glow(ctx, x + ww, 250, 520, '#fff0c4', 0.6); },
    (cx) => PR.lunchbox(ctx, { x: cx, y: fy, size: S, lum: 1, tint: LOOK.golden.haze, light: { color: LOOK.golden.key, from: 1, amount: 0.9 }, shadow: 0.6 }), 'golden morning');
  // 5 tiny, in the hand of a stand-in figure
  cell(4, (x, ww) => { ctx.fillStyle = linGrad(ctx, 0, 70, 0, PH, [[0, '#8a9bb3'], [0.86, '#c3cedd'], [0.862, '#3a4658'], [1, '#2b3648']]); ctx.fillRect(x, 0, ww, PH); },
    (cx) => {
      const floor = 690, u = 430 / 7;
      dummy(ctx, cx - 40, floor, { h: 430, facing: 1 });
      PR.lunchbox(ctx, { x: cx - 40 + u * 0.01, y: floor - u * 4.0 + 4, size: 46, anchor: 'handle', rot: 4, lum: 0.9, tint: LOOK.greyMorning.fill, light: { color: LOOK.greyMorning.key, from: 1, amount: 0.6 } });
      PR.lunchbox(ctx, { x: cx + 110, y: floor, size: 46, lum: 0.9, tint: LOOK.greyMorning.fill, light: { color: LOOK.greyMorning.key, from: 1, amount: 0.6 }, shadow: 0.5 });
    }, 'size 46 · in the hand / on the floor');
}

function panel2(ctx) {
  const ty = 640; lampTable(ctx, ty);
  title(ctx, 'NOTE — unfold 0 · 0.33 · 0.66 · 1');
  const light = { color: C.honey, angle: -70, amount: 0.5 }, tint = LOOK.lampNight.haze;
  [0, 0.33, 0.66, 1].forEach((u, i) => {
    const x = 250 + i * 470;
    PR.note(ctx, { x, y: 430, size: 360, unfold: u, lum: 0.92, tint, light, rot: [-4, 3, -2, 1][i] });
    label(ctx, 'unfold ' + u, x, 700);
  });
}
function panel3(ctx) {
  lampTable(ctx, 760, CX);
  ctx.fillStyle = '#120c08'; ctx.fillRect(0, 0, PW, PH);
  glow(ctx, CX, 380, 1100, C.amber, 0.42); glow(ctx, CX, 400, 520, C.honey, 0.25);
  PR.note(ctx, { x: CX, y: 395, size: 900, unfold: 1, lum: 0.95, tint: LOOK.lampNight.haze, light: { color: C.honey, angle: -80, amount: 0.4 }, rot: -1 });
  drawHand(ctx, { x: 545, y: 215, size: 42, rot: 35, pose: 'pinch', ink: '#0a0604', arm: 1.4 });
  drawHand(ctx, { x: 1385, y: 640, size: 42, rot: -145, pose: 'pinch', ink: '#0a0604', arm: 1.4 });
}
const GROUND = (ctx) => { ctx.fillStyle = linGrad(ctx, 0, 0, 0, PH, [[0, '#5d6f88'], [1, '#46566e']]); ctx.fillRect(0, 0, PW, PH); };
function grid(ctx, items, cols, y0, rowH) {
  GROUND(ctx);
  const cw = PW / cols;
  items.forEach(([name, fn], i) => { const cx = (i % cols + 0.5) * cw, cy = y0 + Math.floor(i / cols) * rowH; fn(cx, cy); label(ctx, name, cx, cy + 128, { size: 17 }); });
}
const key = { color: '#e9f0fa', from: -1, amount: 0.5 };
const base = { lum: 0.95, light: key, shadow: 0.5 };
function panel4(ctx) {
  title(ctx, 'SUPPORTING PROPS 1');
  grid(ctx, [
    ['phoneSmall glow', (x, y) => PR.phoneSmall(ctx, { ...base, x, y: y + 40, size: 190, glow: C.cyan, turn: 0.5 })],
    ['phoneSmall dark', (x, y) => PR.phoneSmall(ctx, { ...base, x, y: y + 40, size: 190, turn: 0.5 })],
    ['tablet', (x, y) => PR.tablet(ctx, { ...base, x, y, size: 220, turn: 0.4 })],
    ['envelope', (x, y) => PR.envelope(ctx, { ...base, x, y, size: 300 })],
    ['toast 0 · 0.5 · 1', (x, y) => { [0, 0.5, 1].forEach((b, i) => PR.toast(ctx, { ...base, x: x - 120 + i * 120, y: y + 80, size: 100, burnt: b })); }],
    ['trophy', (x, y) => PR.trophy(ctx, { ...base, x, y: y + 90, size: 200, sparkle: 1, t: 1 })],
    ['wrench', (x, y) => PR.wrench(ctx, { ...base, x, y, size: 330, rot: -20 })],
    ['cloth', (x, y) => PR.cloth(ctx, { ...base, x, y: y - 90, size: 190, sway: 0.3 })],
    ['accessCard', (x, y) => PR.accessCard(ctx, { ...base, x, y: y + 20, size: 170, strap: 0.6 })],
    ['stylus', (x, y) => PR.stylus(ctx, { ...base, x, y, size: 330 })],
    ['scanner beam .6', (x, y) => PR.scanner(ctx, { ...base, x: x - 100, y, size: 230, beam: 0.6, beamLen: 200 })],
    ['paperStar', (x, y) => { PR.paperStar(ctx, { ...base, x: x - 50, y, size: 130, seed: 1 }); PR.paperStar(ctx, { ...base, x: x + 70, y: y + 20, size: 90, seed: 2 }); }],
  ], 4, 155, 235);
}
function panel5(ctx) {
  title(ctx, 'SUPPORTING PROPS 2');
  grid(ctx, [
    ['backpack', (x, y) => PR.backpack(ctx, { ...base, x, y: y + 100, size: 250 })],
    ['backpack slump .8', (x, y) => PR.backpack(ctx, { ...base, x, y: y + 100, size: 250, slump: 0.8 })],
    ['softToy', (x, y) => PR.softToy(ctx, { ...base, x, y: y - 100, size: 280, sway: 0.4 })],
    ['cerealBowl', (x, y) => PR.cerealBowl(ctx, { ...base, x, y: y + 70, size: 260 })],
    ['mug (steam)', (x, y) => PR.mug(ctx, { ...base, x, y: y + 80, size: 170, steam: 1, t: 2 })],
    ['satchel', (x, y) => PR.satchel(ctx, { ...base, x, y: y + 90, size: 280 })],
    ['stepStool', (x, y) => PR.stepStool(ctx, { ...base, x, y: y + 110, size: 250 })],
    ['crayonFamily', (x, y) => PR.crayonFamily(ctx, { ...base, x, y, size: 330 })],
  ], 4, 170, 300);
}
function panel6(ctx) {
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, PH, [[0, '#8a9bb3'], [0.86, '#c3cedd'], [0.862, '#3a4658'], [1, '#2b3648']]); ctx.fillRect(0, 0, PW, PH);
  title(ctx, 'PROPS IN THE HAND (real sizes) beside a 430 px figure');
  const floor = 690, u = 430 / 7, lt = { color: C.paleSky, from: 1, amount: 0.6 }, b = { lum: 0.9, light: lt, tint: LOOK.greyMorning.fill };
  const hy = floor - u * 3.9;
  const figs = [
    (x) => PR.phoneSmall(ctx, { ...b, x: x + u * 0.12, y: hy + 6, size: 37, glow: C.cyan, turn: 0.3 }),
    (x) => PR.tablet(ctx, { ...b, x: x + u * 0.14, y: hy - 6, size: 62, turn: 0.3 }),
    (x) => PR.envelope(ctx, { ...b, x: x + u * 0.2, y: hy + 12, size: 54, rot: -10 }),
    (x) => PR.toast(ctx, { ...b, x: x + u * 0.2, y: hy + 22, size: 27 }),
    (x) => PR.satchel(ctx, { ...b, x: x + u * 0.05, y: hy + 4, size: 98, anchor: 'handle' }),
    (x) => PR.softToy(ctx, { ...b, x: x + u * 0.05, y: hy, size: 72, sway: 0.3 }),
    (x) => PR.scanner(ctx, { ...b, x: x + u * 0.18, y: hy + 4, size: 50, beam: 0.6 }),
    (x) => PR.cloth(ctx, { ...b, x: x + u * 0.05, y: hy, size: 70, sway: 0.4 }),
  ];
  figs.forEach((f, i) => { const x = 110 + i * 235; dummy(ctx, x, floor, { h: 430, facing: 1 }); f(x); });
  const smalls = [(x) => PR.mug(ctx, { ...b, x, y: floor, size: 23, shadow: 0.4 }), (x) => PR.wrench(ctx, { ...b, x, y: floor - 6, size: 58, rot: -8 }), (x) => PR.accessCard(ctx, { ...b, x, y: floor - 11, size: 21 }), (x) => PR.trophy(ctx, { ...b, x, y: floor, size: 56, shadow: 0.4 }), (x) => PR.cerealBowl(ctx, { ...b, x, y: floor, size: 38, shadow: 0.4 }), (x) => PR.stepStool(ctx, { ...b, x, y: floor, size: 62, shadow: 0.4 }), (x) => PR.backpack(ctx, { ...b, x, y: floor, size: 80, shadow: 0.4 }), (x) => { PR.note(ctx, { ...b, x: x - 22, y: floor - 12, size: 34 }); PR.paperStar(ctx, { ...b, x: x + 20, y: floor - 15, size: 30 }); }];
  smalls.forEach((f, i) => f(110 + i * 235 + 117));
  [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) => label(ctx, ['phone', 'tablet', 'envelope', 'toast', 'satchel', 'softToy', 'scanner', 'cloth'][i], 110 + i * 235, floor + 40, { size: 15 }));
  [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) => label(ctx, ['mug', 'wrench', 'card', 'trophy', 'bowl', 'stool', 'backpack', 'note+star'][i], 110 + i * 235 + 117, floor + 70, { size: 15 }));
}
function panel7(ctx) {
  ctx.fillStyle = '#3b2f26'; ctx.fillRect(0, 0, PW, PH); glow(ctx, CX, CY, 1100, C.honey, 0.25);
  title(ctx, 'crayonFamily — large');
  PR.crayonFamily(ctx, { x: CX, y: CY + 10, size: 1000, lum: 0.95, light: { color: C.honey, angle: -60, amount: 0.3 } });
}

const PANELS = [panel0, panel1, panel2, panel3, panel4, panel5, panel6, panel7];

export default function draw(ctx, F) {
  const p = Math.min(PANELS.length - 1, Math.floor(F.t));
  ctx.fillStyle = '#0a0d14'; ctx.fillRect(0, 0, PW, PH);
  PANELS[p](ctx, F);
}
