// UI kit bench: the phone + hand over each soft background, and a board of kit components.
import { PW, PH, CX, CY, text, FONT, fillRR } from '../src/engine.js';
import { C } from '../src/style.js';
import * as U from '../src/ui.js';

export const duration = 18;

function demoScreen(ctx, sw, sh, t, prog) {
  ctx.fillStyle = prog ? U.UI.pBg : U.UI.bg; ctx.fillRect(0, 0, sw, sh);
  U.statusBar(ctx, { time: '5:46', battery: 0.12, color: prog ? C.cyan : U.UI.text });
  if (prog) {
    U.emblem(ctx, 195, 300, 34, { k: 1 });
    text(ctx, 'LIFE OPTIMISATION', 195, 380, { size: 21.5, family: FONT.mono, color: C.cyan, align: 'center', tracking: 3 });
    U.button(ctx, { x: 40, y: 520, w: 310, h: 58, label: 'ACCEPT UPGRADE', kind: 'outline', color: C.cyan, family: FONT.mono, tracking: 3, breathe: 0.5 + 0.5 * Math.sin(t * 4), glow: 1 });
  } else {
    text(ctx, 'Available balance', 24, 150, { size: 16.5, color: U.UI.text2 });
    text(ctx, 'RM 83.00', 22, 214, { size: 60, weight: 600, color: U.UI.text });
    U.bubble(ctx, { x: 16, y: 300, text: 'Your optimisation trial has concluded.' });
    U.bubble(ctx, { x: 16, y: 400, text: 'Subject demonstrated successful emotional recovery.' });
    U.bubble(ctx, { x: 374, y: 520, side: 'out', text: 'Who is this?' });
    U.typingDots(ctx, 16, 590, t);
    U.banner(ctx, { title: 'ACCOUNT FROZEN', body: 'Identity deprecated. This account now belongs to the verified holder.', icon: 'lock', k: 1, y: 640 });
  }
}

export default function draw(ctx, F) {
  const t = F.t;
  const page = Math.floor(t);
  const kinds = ['bedroomDark', 'rainNight', 'goldenStreet', 'kitchenNight', 'kitchenNight'];
  if (page < 15) {
    const bi = page % 5, kind = kinds[bi], mode = Math.floor(page / 5);
    U.softBackground(ctx, kind, t, { lamp: bi === 4 ? 0 : 1, lunchbox: bi === 4 });
    if (mode === 2) return;
    const lower = mode === 1;
    U.phone(ctx, {
      x: 960, y: 402, w: 800, rot: 3.5, focus: lower ? [195, 640] : [195, 210], worn: bi !== 3,
      glow: bi === 3 || bi === 4 ? C.cyan : bi === 2 ? '#ffe9c4' : '#b9c8de', glowAmt: bi === 2 ? 0.2 : 1,
      hand: bi === 1 ? 'left' : 'right', grip: lower ? 640 : 470,
      thumb: bi === 3 ? null : { x: lower ? (bi === 1 ? 120 : 270) : 300, y: lower ? 760 : 380, press: lower ? 1 : 0 },
      ink: bi === 2 ? '#160c05' : '#05070b', rim: bi === 2 ? { color: '#fff0c4', amt: 0.9, dx: -1, dy: -1 } : null,
      sheen: bi === 2 ? { env: '#ffe2b0', envAmt: 0.16 } : {},
      overlay: bi === 1 ? (c, sw, sh) => U.raindropsOnGlass(c, t, sw, sh) : null,
    }, (c, sw, sh) => demoScreen(c, sw, sh, t, bi >= 3));
  } else {
    ctx.fillStyle = '#05080c'; ctx.fillRect(0, 0, PW, PH);
    const q = t - 15;
    U.emblem(ctx, 200, 200, 110, { k: Math.min(1, q / 1.2) });
    U.emblem(ctx, 470, 130, 40, {});
    U.hudBrackets(ctx, 380, 260, 240, 160, q / 0.4, {});
    U.tick(ctx, 720, 120, 60, q / 0.5, {});
    U.tick(ctx, 840, 120, 80, q / 0.8, { ring: true, color: C.cyan });
    U.spinner(ctx, 960, 120, 26, t, { color: C.cyan });
    U.typeLine(ctx, 'QUERY: WHY SHE KEEPS THIS', 700, 240, q / 1.2, { size: 34, family: FONT.mono, color: C.cyan, t, tracking: 2, hold: true });
    U.button(ctx, { x: 700, y: 290, w: 300, h: 64, label: 'Delete', color: C.alert, size: 28 });
    U.button(ctx, { x: 1020, y: 290, w: 300, h: 64, label: 'Cancel', kind: 'ghost', color: '#ffffff', size: 28, press: 1 });
    ctx.fillStyle = '#efe6d3'; ctx.fillRect(1380, 60, 480, 420);
    U.crayonFamily(ctx, 1620, 440, 440, {});
    ctx.save(); ctx.translate(120, 430); ctx.scale(1.4, 1.4);
    U.sheet(ctx, { k: 1, h: 190, sw: 390, sh: 250 }, (c, x, y, w) => { text(c, 'Delete conversation?', 24, y + 52, { size: 22, weight: 600 }); });
    ctx.restore();
  }
}
