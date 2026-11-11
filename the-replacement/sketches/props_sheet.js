// Props test sheet. panel = Math.floor(F.t); see the list at the bottom of this file.
//   node tools/still.mjs --sketch /sketches/props_sheet.js --t 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5 --out build/review/props/
import { PW, PH, CX, CY, glow, text, linGrad, radGrad, rgba, mixHex, FONT, lightCone, rad, TAU } from '../src/engine.js';
import { C, LOOK } from '../src/style.js';
import * as PR from '../src/props.js';
import { dummy } from './_dummy.js';

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

const PANELS = [panel0, panel1];

export default function draw(ctx, F) {
  const p = Math.min(PANELS.length - 1, Math.floor(F.t));
  ctx.fillStyle = '#0a0d14'; ctx.fillRect(0, 0, PW, PH);
  PANELS[p](ctx, F);
}
