// Shots: a1_03_bank, a1_12_notify, a3_06_frozen, a3_07_call, a7_05_msgs, a7_08_v2, a7_11_delete
// Phone inserts built on the UI kit (src/ui.js). Every shot is a pure function of F.t; all timing
// comes from F.ev(...). Screen content is drawn in logical 390 x 844 screen units (see ui.js header).
//
//   a1_03_bank     load 0.4: skeleton -> balance + list + overdue card; thumb hovers, does nothing.
//   a1_12_notify   header 0.3 / line1 1.2 / line2 2.8 / button 4.2 (then breathes) / push 5.6 camera
//                  travels down + in / small 6.6 "Your family has already approved." brightens, held.
//   a3_06_frozen   same bank layout in rain; alert 0.8 banner drops, balance greys to "RM ——".
//   a3_07_call     ring1 0.6 / ring2 1.9 pulse rings round the avatar; end 6.3 "Call ended" + small type.
//   a7_05_msgs     m1 0.6 / m2 3.0 / m3 5.6 bubbles slide up + a buzz; after m3 the sun light cools.
//   a7_08_v2       thread scrolled up (video thumbnail above); m4 0.8 / m5 3.6 / m6 5.8; typing dots after m6.
//   a7_11_delete   hold 0.6 long-press / dialog 1.4 sheet / thumb hovers / tap 3.4 / gone 3.8 thread
//                  collapses onto the crayon wallpaper / pocket 4.8 screen black, phone drops out of frame.
import {
  PW, PH, CX, CY, TAU, clamp, lerp, ease, seg, key, wobble, rgba, mixHex, rr, fillRR, linGrad, radGrad, text,
  measure, wrapLines, FONT, noise1,
} from '../engine.js';
import { C } from '../style.js';
import * as U from '../ui.js';

const { UI } = U;
const sm = (t, a, d = 0.3, e = ease.outCubic) => e(clamp((t - a) / d));   // arrival 0..1

// small organic hand tremor / drift in px
const shake = (t, amp, f = 5, seed = 1) => [wobble(t, f, seed) * amp, wobble(t, f * 0.9, seed + 7) * amp];

// type several lines as one run (k 0..1 over all characters)
function typeLines(ctx, lines, x, y, lh, k, o) {
  const total = lines.reduce((a, l) => a + l.length, 0);
  let n = clamp(k) * total;
  lines.forEach((ln, i) => {
    const m = clamp(n / ln.length); n -= ln.length;
    if (m > 0) U.typeLine(ctx, ln, x, y + i * lh, m, o);
  });
}
const _wrapCache = new Map();
function wrapped(ctx, str, w, o) {
  const k = str + '|' + w + '|' + o.size;
  if (!_wrapCache.has(k)) _wrapCache.set(k, wrapLines(ctx, str, w, o));
  return _wrapCache.get(k);
}

// ───────────────────────────── Adam's banking app (a1_03 / a3_06) ─────────────────────────────
// lt: seconds since the app loaded (<0: skeleton); fz: seconds since the account froze (<0: not yet)
function bankScreen(ctx, sw, sh, lt, fz, t) {
  ctx.fillStyle = UI.bg; ctx.fillRect(0, 0, sw, sh);
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, 300, [[0, '#171a20'], [1, 'rgba(15,17,20,0)']]); ctx.fillRect(0, 0, sw, 300);
  U.statusBar(ctx, { time: '5:46', battery: 0.12 });
  const skel = 1 - sm(lt, 0, 0.3, ease.linear);
  if (skel > 0) {
    const p = 0.55 + 0.45 * Math.sin(t * 5);
    ctx.save(); ctx.globalAlpha = skel * 0.7 * p;
    fillRR(ctx, 24, 108, 130, 16, 8, UI.surface2); fillRR(ctx, 24, 142, 250, 48, 10, UI.surface2);
    fillRR(ctx, 24, 252, 90, 12, 6, UI.surface);
    for (let i = 0; i < 3; i++) fillRR(ctx, 24, 282 + i * 56, 300 - i * 30, 18, 8, UI.surface);
    ctx.restore();
    U.spinner(ctx, 195, 440, 13, t, { color: UI.text3 });
  }
  const arr = (d) => sm(lt, d, 0.3);
  const rise = (a, fn) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, (1 - a) * 12); fn(); ctx.restore(); };
  const fzk = clamp(fz / 0.5), dead = ease.inOutSine(fzk);
  rise(arr(0), () => {
    text(ctx, 'Available balance', 24, 124, { size: 17, color: UI.text2 });
    const bal = mixHex(UI.text, UI.text3, dead);
    if (fz < 0.2) text(ctx, 'RM 83.00', 22, 188, { size: 62, weight: 600, color: bal, alpha: 1 - clamp(fz / 0.2) * 0 });
    else text(ctx, 'RM ——', 22, 188, { size: 62, weight: 600, color: bal, alpha: clamp((fz - 0.2) / 0.3) });
    text(ctx, 'Savings  ····  4417', 24, 216, { size: 15.5, color: UI.text3, tracking: 0.4 });
  });
  rise(arr(0.12), () => {
    ctx.fillStyle = UI.line; ctx.fillRect(24, 234, sw - 48, 1);
    text(ctx, 'RECENT', 24, 264, { size: 15.5, color: UI.text3, tracking: 1.6 });
  });
  const rows = [['Mydin Wholesale', 'Yesterday', '-RM 41.20'], ['Petronas Station', 'Mon', '-RM 30.00'], ['Kiddy Care Centre', 'Mon', '-RM 120.00']];
  rows.forEach((r, i) => rise(arr(0.2 + i * 0.1), () => {
    ctx.save(); ctx.globalAlpha *= 1 - 0.6 * dead;
    const y = 278 + i * 56;
    text(ctx, r[0], 24, y + 26, { size: 20, weight: 500, color: UI.text });
    text(ctx, r[1], 24, y + 47, { size: 15.5, color: UI.text3 });
    text(ctx, r[2], sw - 24, y + 26, { size: 20, weight: 500, color: UI.text2, align: 'right' });
    ctx.fillStyle = UI.line; ctx.fillRect(24, y + 56, sw - 48, 1);
    ctx.restore();
  }));
  rise(arr(0.62), () => {
    const y = 448, pulse = 0.5 + 0.5 * Math.sin(Math.max(0, lt - 0.6) * 3);
    fillRR(ctx, 16, y, sw - 32, 78, 14, `rgba(255,77,79,${0.10 + 0.05 * pulse})`);
    ctx.strokeStyle = `rgba(255,77,79,${0.55 + 0.25 * pulse})`; ctx.lineWidth = 1.3; rr(ctx, 16.65, y + 0.65, sw - 33.3, 76.7, 14); ctx.stroke();
    ctx.fillStyle = C.alert; ctx.beginPath(); ctx.arc(38, y + 28, 6, 0, TAU); ctx.fill();
    text(ctx, 'Electricity — payment overdue', 54, y + 35, { size: 22, weight: 600, color: '#ff8c8e' });
    text(ctx, 'Due 3 days ago  ·  RM 187.40', 54, y + 62, { size: 16.5, color: UI.text2 });
  });
}

// ───────────────────────────── a1_03_bank ─────────────────────────────
function a1_03_bank(ctx, F) {
  const t = F.t, lt = t - F.ev('load'), k = F.k;
  const [sx, sy] = shake(t, 1.6, 0.8, 2);
  const w = 800 + 34 * k;
  U.phone(ctx, {
    x: 940 + sx, y: 402 + sy, w, rot: 3.2 - 0.8 * k, focus: [195, 328], worn: true,
    glow: "#b9c8de", glowAmt: 0.45 + 0.55 * sm(lt, 0, 0.4), hand: 'right', grip: 560,
    thumb: { x: 292 + wobble(t, 0.5, 3) * 5, y: 560 + wobble(t, 0.4, 5) * 4, press: 0 },
    bg: (c) => U.softBackground(c, 'bedroomDark', t, { x: -k * 14, zoom: 1.02 + 0.02 * k }),
  }, (c, sw2, sh2) => bankScreen(c, sw2, sh2, lt, -9, t));
}

// ───────────────────────────── a3_06_frozen ─────────────────────────────
function a3_06_frozen(ctx, F) {
  const t = F.t, k = F.k, fz = t - F.ev('alert');
  const [sx, sy] = shake(t, 2.2, 1.1, 4);
  const w = 800 + 30 * k;
  const bad = sm(fz, 0, 0.4, ease.inOutSine);
  U.phone(ctx, {
    x: 940 + sx, y: 402 + sy, w, rot: 3.2 - 0.6 * k, focus: [195, 328], worn: true,
    glow: mixHex('#b9c8de', '#e8707a', 0.45 * bad), glowAmt: 1, hand: 'right', grip: 560,
    thumb: { x: 292 + wobble(t, 0.5, 6) * 5, y: 560 + wobble(t, 0.4, 8) * 4, press: 0 },
    bg: (c) => U.softBackground(c, 'rainNight', t, { x: -k * 16, zoom: 1.02 + 0.02 * k }),
    overlay: (c, sw2, sh2) => U.raindropsOnGlass(c, t, sw2, sh2),
  }, (c, sw2, sh2) => {
    bankScreen(c, sw2, sh2, 9, fz, t);
    if (fz > -0.05) {
      c.save(); c.fillStyle = `rgba(0,0,0,${0.28 * bad})`; c.fillRect(0, 0, sw2, sh2); c.restore();
      U.banner(c, { title: 'ACCOUNT FROZEN', body: 'Identity deprecated. This account now belongs to the verified holder.', icon: 'lock', k: clamp(fz / 0.3), y: 216, titleSize: 23, size: 21 });
    }
  });
}

// ───────────────────────────── a3_07_call ─────────────────────────────
function avatar(ctx, x, y, r, grey) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  ctx.fillStyle = linGrad(ctx, x, y - r, x, y + r, [[0, mixHex('#d49650', '#6b6f78', grey)], [1, mixHex('#7a4a22', '#34373d', grey)]]);
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = radGrad(ctx, x + r * 0.2, y - r * 0.3, 0, r, [[0, rgba('#ffe2b0', 0.35 * (1 - grey))], [1, 'rgba(255,226,176,0)']]); ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.translate(x, y); ctx.scale(r, r);
  ctx.fillStyle = '#1b0f08';
  ctx.beginPath(); ctx.ellipse(0.02, 0.78, 0.7, 0.45, 0, 0, TAU); ctx.fill();                 // shoulders
  ctx.beginPath(); ctx.moveTo(-0.12, 0.1); ctx.lineTo(0.16, 0.1); ctx.lineTo(0.2, 0.5); ctx.lineTo(-0.2, 0.5); ctx.fill();   // neck
  ctx.beginPath(); ctx.ellipse(0.04, -0.2, 0.27, 0.33, -0.08, 0, TAU); ctx.fill();            // head (profile, facing right)
  ctx.beginPath(); ctx.moveTo(0.27, -0.2); ctx.quadraticCurveTo(0.36, -0.14, 0.3, -0.07); ctx.lineTo(0.27, -0.06); ctx.fill();   // nose
  ctx.beginPath(); ctx.moveTo(0.24, -0.02); ctx.quadraticCurveTo(0.27, 0.08, 0.14, 0.14); ctx.lineTo(0.1, 0.1); ctx.fill();        // chin
  ctx.beginPath(); ctx.arc(-0.2, -0.5, 0.15, 0, TAU); ctx.fill();                              // bun
  ctx.beginPath(); ctx.ellipse(-0.08, -0.25, 0.26, 0.34, 0.15, 0, TAU); ctx.fill();           // hair mass
  ctx.restore();
}
function heart(ctx, x, y, s, color) {
  ctx.save(); ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.5, y - s * 0.1, x - s * 0.7, y - s * 1.1, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.5, y - s * 0.1, x, y + s * 0.9);
  ctx.fill(); ctx.restore();
}
function callScreen(ctx, sw, sh, t, r1, r2, end) {
  ctx.fillStyle = UI.bg; ctx.fillRect(0, 0, sw, sh);
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, sh, [[0, '#1b1710'], [0.5, UI.bg]]); ctx.fillRect(0, 0, sw, sh);
  U.statusBar(ctx, { time: '6:08', battery: 0.09 });
  const de = t - end, ended = clamp(de / 0.25);
  // status line
  text(ctx, 'Calling…', 195, 144, { size: 24, color: UI.text2, align: 'center', alpha: 1 - ended, tracking: 0.4 });
  text(ctx, 'Call ended', 195, 144, { size: 24, color: '#ff8c8e', align: 'center', alpha: ended, tracking: 0.4 });
  // name + heart
  const nw = measure(ctx, 'Home', { size: 46, weight: 600 });
  text(ctx, 'Home', 195 - 20, 204, { size: 46, weight: 600, color: mixHex(UI.text, UI.text3, ended), align: 'center' });
  heart(ctx, 195 + nw / 2 - 2, 190, 11, mixHex('#ff6b81', '#555a63', ended));
  // avatar, halo and rings
  const ax = 195, ay = 335, ar = 66;
  if (ended < 1) {
    ctx.save(); ctx.globalAlpha = 1 - ended;
    const breath = 0.5 + 0.5 * Math.sin(t * 2.2);
    ctx.fillStyle = radGrad(ctx, ax, ay, ar * 0.9, ar * 2.1, [[0, `rgba(255,181,97,${0.2 + 0.05 * breath})`], [1, 'rgba(255,181,97,0)']]);
    ctx.beginPath(); ctx.arc(ax, ay, ar * 2.1, 0, TAU); ctx.fill();
    for (const e of [r1, r2]) {
      for (let j = 0; j < 3; j++) {
        const d = t - e - j * 0.28;
        if (d < 0 || d > 1.7) continue;
        const q = d / 1.7;
        ctx.strokeStyle = `rgba(255,208,138,${0.55 * Math.pow(1 - q, 1.4)})`; ctx.lineWidth = 2.4 - q;
        ctx.beginPath(); ctx.arc(ax, ay, ar + 6 + ease.outCubic(q) * 88, 0, TAU); ctx.stroke();
      }
    }
    ctx.restore();
  }
  avatar(ctx, ax, ay, ar, ended);
  ctx.strokeStyle = rgba('#ffd08a', 0.5 * (1 - ended)); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ax, ay, ar + 2, 0, TAU); ctx.stroke();
  // action buttons fade out, small type arrives
  ctx.save(); ctx.globalAlpha = 1 - ended;
  [['mute', 90], ['keypad', 195], ['speaker', 300]].forEach(([lab, x], i) => {
    const y = 478;
    ctx.fillStyle = UI.surface2; ctx.beginPath(); ctx.arc(x, y, 30, 0, TAU); ctx.fill();
    ctx.strokeStyle = UI.text2; ctx.fillStyle = UI.text2; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    if (i === 0) { fillRR(ctx, x - 5, y - 15, 10, 18, 5, UI.text2); ctx.beginPath(); ctx.arc(x, y - 2, 11, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y + 9); ctx.lineTo(x, y + 15); ctx.stroke(); }
    else if (i === 1) { for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { ctx.beginPath(); ctx.arc(x - 11 + a * 11, y - 11 + b * 11, 2.3, 0, TAU); ctx.fill(); } }
    else { ctx.beginPath(); ctx.moveTo(x - 12, y - 5); ctx.lineTo(x - 5, y - 5); ctx.lineTo(x + 3, y - 12); ctx.lineTo(x + 3, y + 12); ctx.lineTo(x - 5, y + 5); ctx.lineTo(x - 12, y + 5); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(x + 4, y, 9, -0.9, 0.9); ctx.stroke(); }
  });
  ctx.restore();
  const sa = clamp((de - 0.05) / 0.2);
  if (sa > 0) {
    const lines = wrapped(ctx, 'Number no longer linked to this device.', 300, { size: 19 });
    lines.forEach((ln, i) => text(ctx, ln, 195, 468 + i * 26, { size: 19, color: UI.text, align: 'center', alpha: sa, weight: 500 }));
  }
}
function a3_07_call(ctx, F) {
  const t = F.t, k = F.k, end = F.ev('end');
  const [sx, sy] = shake(t, 2, 1.0, 9);
  U.phone(ctx, {
    x: 950 + sx, y: 402 + sy, w: 790 + 30 * k, rot: 3 - 0.7 * k, focus: [195, 330], worn: true,
    glow: '#d8c3a5', glowAmt: 0.95, hand: 'right', grip: 560,
    thumb: { x: 306, y: 600, press: 0 },
    bg: (c) => U.softBackground(c, 'rainNight', t, { x: -k * 14, zoom: 1.02 + 0.02 * k }),
    overlay: (c, sw2, sh2) => U.raindropsOnGlass(c, t, sw2, sh2, { amt: 0.8 }),
  }, (c, sw2, sh2) => callScreen(c, sw2, sh2, t, F.ev('ring1'), F.ev('ring2'), end));
}

// ───────────────────────────── a1_12_notify ─────────────────────────────
const LEGAL = [
  'By accepting, you consent to continuous collection of',
  'biometric, behavioural and financial data. Enrolment is',
  'irreversible. Superseded records are retained indefinitely.',
  'Your family has already approved.',
  'Withdrawal of consent is not available. Ref. LOP-7731-A.',
];
const HL = 3;
function notifyScreen(ctx, sw, sh, T) {
  const t = T.t;
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, sh, [[0, '#06101a'], [0.5, UI.pBg], [1, '#02050a']]); ctx.fillRect(0, 0, sw, sh);
  ctx.fillStyle = radGrad(ctx, 195, 120, 0, 260, [[0, 'rgba(127,231,255,0.10)'], [1, 'rgba(127,231,255,0)']]); ctx.fillRect(0, 0, sw, 400);
  ctx.strokeStyle = rgba(C.cyan, 0.16); ctx.lineWidth = 1; rr(ctx, 9.5, 9.5, sw - 19, sh - 19, 38); ctx.stroke();
  U.statusBar(ctx, { time: '23:41', color: C.cyan, battery: 0.1, low: false });
  // header
  U.emblem(ctx, 195, 66, 22, { k: clamp((t - T.header) / 1.0), glow: 0.7 });
  const mono = { size: 21.5, family: FONT.mono, weight: 500, color: C.cyan, align: 'center', tracking: 3.2, t };
  U.typeLine(ctx, 'LIFE OPTIMISATION', 195, 118, clamp((t - T.header - 0.25) / 0.6), mono);
  U.typeLine(ctx, 'PROGRAM', 195, 144, clamp((t - T.header - 0.75) / 0.3), mono);
  const hl = ease.outCubic(clamp((t - T.header - 0.9) / 0.6));
  ctx.fillStyle = rgba(C.cyan, 0.45); ctx.fillRect(195 - 160 * hl, 160, 320 * hl, 1);
  // statements
  const b = { size: 21.5, family: FONT.mono, weight: 500, tracking: 1.2 };
  const l1 = wrapped(ctx, 'YOUR HOUSEHOLD HAS BEEN SELECTED FOR A FREE UPGRADE.', 335, b);
  const l2 = wrapped(ctx, 'A BETTER VERSION OF YOU. A BETTER LIFE FOR EVERYONE.', 335, b);
  typeLines(ctx, l1, 28, 200, 28, (t - T.line1) / 1.1, { ...b, color: C.ice, t, caretColor: C.cyan });
  typeLines(ctx, l2, 28, 298, 28, (t - T.line2) / 1.0, { ...b, color: C.cyan, t, caretColor: C.cyan });
  // button
  const ba = sm(t, T.button, 0.3), br = 0.5 + 0.5 * Math.sin(Math.max(0, t - T.button) * 2.8);
  U.button(ctx, { x: 40, y: 392 + (1 - ba) * 14, w: 310, h: 58, label: 'ACCEPT UPGRADE', kind: 'outline', color: C.cyan, family: FONT.mono, size: 21.5, tracking: 3, r: 4, breathe: br, glow: 1, alpha: ba });
  // office footer, far down the screen
  const f = { size: 10, family: FONT.mono, color: UI.pDim, align: 'center', tracking: 1.6 };
  text(ctx, 'HOUSEHOLD CONTINUITY OFFICE', 195, 604, f);
  text(ctx, 'NOTICE 7731-A  ·  ISSUED 23:40:12', 195, 622, { ...f, alpha: 0.7 });
  ctx.fillStyle = rgba(C.cyan, 0.2); ctx.fillRect(40, 686, sw - 80, 1);
  text(ctx, 'LEGAL', 195, 710, { ...f, size: 9, alpha: 0.6 });
  // the legal block: five lines, one of which comes alive
  const hk = ease.inOutSine(clamp((t - T.small) / 0.4));
  LEGAL.forEach((ln, i) => {
    const y = 750 + i * 14.5, is = i === HL;
    const o = { size: 10.5, align: 'center', family: FONT.sans, weight: is ? lerp(400, 600, hk) : 400, color: is ? mixHex(UI.pLegal, '#ffffff', hk) : UI.pLegal, alpha: is ? 1 : 1 - 0.3 * hk, tracking: 0.1 };
    if (is && hk > 0) o.shadow = { color: rgba(C.cyan, 0.6 * hk), blur: 9 };
    text(ctx, ln, 195, y, o);
  });
}
function a1_12_notify(ctx, F) {
  const t = F.t, E = F.ev.bind(F);
  const T = { t, header: E('header'), line1: E('line1'), line2: E('line2'), button: E('button'), push: E('push'), small: E('small') };
  const e = ease.inOutCubic(seg(t, T.push, T.small + 0.15));
  const w = 800 * Math.pow(1880 / 800, e) * (1 + 0.006 * Math.max(0, t - T.small));
  const fy = lerp(252, 3 * 14.5 + 750 - 3.5, e);
  const trem = 1 - seg(t, T.push - 0.2, T.push + 0.7);
  const [sx, sy] = shake(t, 3.4 * trem, 7.5, 3);
  const k = F.k;
  U.phone(ctx, {
    x: 960 + sx - 20 * (1 - e), y: 402 + sy, w, rot: (3 - 3 * e) + wobble(t, 6, 5) * 0.35 * trem, focus: [195, fy], worn: true,
    glow: C.cyan, glowAmt: 0.9 + 0.25 * e, hand: 'right', grip: 560, bloom: 0.55,
    thumb: null,
    bg: (c) => U.softBackground(c, 'kitchenNight', t, { lamp: 0, x: -k * 20, zoom: 1.03 + 0.03 * k }),
  }, (c, sw2, sh2) => notifyScreen(c, sw2, sh2, T));
}

// ───────────────────────────── message thread (a7_05 / a7_08 / a7_11) ─────────────────────────────
const MSGS = {
  m1: 'Your optimisation trial has concluded.',
  m2: 'Subject demonstrated successful emotional recovery.',
  m3: 'Original biological Adam: Deceased 18 months ago.',
  m4: 'You are Replacement Version 2.',
  m5: 'Version 1 has been retired.',
  m6: 'You were selected.',
};
const BO = { size: 23, fill: '#323741', maxW: 330, slide: 16 };
const VID = { w: 214, h: 120 };
const GAP = 13;
// positions of every item of the thread, top-down from y0 (or bottom-up so that the last item ends at yEnd)
function threadLayout(ctx, ids, o) {
  const items = ids.map((id) => id === 'vid' ? { id, h: VID.h, w: VID.w } : { id, ...U.bubbleSize(ctx, MSGS[id], BO) });
  const total = items.reduce((a, it) => a + it.h, 0) + GAP * (items.length - 1);
  let y = o.top !== undefined ? o.top : o.bottom - total;
  const map = {};
  for (const it of items) { it.y = y; map[it.id] = it; y += it.h + GAP; }
  return map;
}
function videoBubble(ctx, x, y, k, o = {}) {
  const { w, h } = VID;
  ctx.save();
  ctx.globalAlpha *= (o.alpha ?? 1) * clamp(k * 1.6);
  fillRR(ctx, x, y, w, h, 18, '#0a121e');
  ctx.save(); rr(ctx, x, y, w, h, 18); ctx.clip();
  ctx.fillStyle = linGrad(ctx, 0, y, 0, y + h, [[0, '#0d1b30'], [0.6, '#16273f'], [1, '#080d16']]); ctx.fillRect(x, y, w, h);
  // car, side-on, at night: a lit cabin window with a man's silhouette in it
  const cx = x + w * 0.46, cy = y + h * 0.7;
  ctx.fillStyle = '#04070b';
  ctx.beginPath(); ctx.moveTo(cx - 92, cy + 22); ctx.lineTo(cx - 92, cy - 8); ctx.quadraticCurveTo(cx - 70, cy - 14, cx - 44, cy - 20); ctx.quadraticCurveTo(cx - 28, cy - 46, cx - 6, cy - 46); ctx.lineTo(cx + 34, cy - 46); ctx.quadraticCurveTo(cx + 56, cy - 40, cx + 66, cy - 14); ctx.quadraticCurveTo(cx + 92, cy - 10, cx + 94, cy + 22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#243a58';
  ctx.beginPath(); ctx.moveTo(cx - 36, cy - 19); ctx.quadraticCurveTo(cx - 24, cy - 40, cx - 6, cy - 40); ctx.lineTo(cx + 30, cy - 40); ctx.quadraticCurveTo(cx + 46, cy - 36, cx + 54, cy - 19); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#050810';
  ctx.beginPath(); ctx.arc(cx + 6, cy - 31, 6.3, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - 12, cy - 19); ctx.quadraticCurveTo(cx - 10, cy - 28, cx + 6, cy - 25); ctx.quadraticCurveTo(cx + 20, cy - 28, cx + 22, cy - 19); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#04070b'; ctx.beginPath(); ctx.arc(cx - 58, cy + 22, 12, 0, TAU); ctx.arc(cx + 58, cy + 22, 12, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,120,.55)'; ctx.fillRect(cx + 90, cy + 2, 5, 5);
  ctx.restore();
  // play glyph + duration
  ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 21, 0, TAU); ctx.fill();
  ctx.fillStyle = '#10151d'; ctx.beginPath(); ctx.moveTo(x + w / 2 - 6, y + h / 2 - 10); ctx.lineTo(x + w / 2 + 11, y + h / 2); ctx.lineTo(x + w / 2 - 6, y + h / 2 + 10); ctx.closePath(); ctx.fill();
  fillRR(ctx, x + w - 54, y + h - 31, 44, 22, 11, 'rgba(0,0,0,.6)');
  text(ctx, '0:09', x + w - 32, y + h - 15, { size: 15, weight: 600, color: '#fff', align: 'center' });
  ctx.restore();
}
function threadHeader(ctx, sw, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.fillStyle = '#16191e'; ctx.fillRect(0, 0, sw, 106);
  ctx.fillStyle = UI.line; ctx.fillRect(0, 106, sw, 1);
  U.statusBar(ctx, { time: '8:12', battery: 0.5 });
  ctx.strokeStyle = '#5b8dd6'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(30, 52); ctx.lineTo(20, 63); ctx.lineTo(30, 74); ctx.stroke();
  ctx.fillStyle = linGrad(ctx, 0, 46, 0, 80, [[0, '#6b7380'], [1, '#444b55']]); ctx.beginPath(); ctx.arc(195, 62, 19, 0, TAU); ctx.fill();
  text(ctx, '?', 195, 70, { size: 22, weight: 600, color: '#d3d8e0', align: 'center' });
  text(ctx, 'Unknown number', 195, 98, { size: 15.5, color: UI.text2, align: 'center' });
  ctx.restore();
}
function inputBar(ctx, sw, sh, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.fillStyle = '#16191e'; ctx.fillRect(0, 780, sw, sh - 780);
  ctx.fillStyle = UI.line; ctx.fillRect(0, 780, sw, 1);
  fillRR(ctx, 16, 792, sw - 32, 40, 20, '#0d0f12');
  ctx.strokeStyle = '#2a2f37'; ctx.lineWidth = 1; rr(ctx, 16.5, 792.5, sw - 33, 39, 20); ctx.stroke();
  text(ctx, 'Text message', 34, 818, { size: 17, color: UI.text3 });
  ctx.restore();
}

// ───────────────────────────── a7_05_msgs ─────────────────────────────
function a7_05_msgs(ctx, F) {
  const t = F.t, k = F.k;
  const ev = [F.ev('m1'), F.ev('m2'), F.ev('m3')];
  const ids = ['m1', 'm2', 'm3'];
  const cool = ease.inOutSine(seg(t, ev[2] + 0.3, ev[2] + 2.6));
  // a short buzz at each arrival, then dead still
  let bx = 0, by = 0;
  for (const e of ev) { const d = t - e; if (d > 0 && d < 0.3) { const a = (1 - d / 0.3) * 3.4; bx += Math.sin(d * 95) * a; by += Math.cos(d * 80) * a * 0.5; } }
  const warm = '#ffe2b0', cold = '#c3d6ee';
  const gl = mixHex(warm, cold, 0.4 * cool);
  let pos = null;
  U.phone(ctx, {
    x: 960 + bx, y: 402 + by, w: 770 + 20 * k, rot: 3.4 - 0.5 * k, focus: [195, 270], worn: true,
    glow: gl, glowAmt: 0.24, hand: 'right', grip: 520, thumb: null, ink: '#160c05',
    rim: { color: mixHex('#fff0c4', '#dce9f8', 0.4 * cool), amt: 0.9, dx: -1, dy: -1 },
    sheen: { env: gl, envAmt: 0.17 },
    bg: (c) => {
      U.softBackground(c, 'goldenStreet', t, { x: -k * 16, zoom: 1.03 + 0.02 * k });
      if (cool > 0) { c.save(); c.fillStyle = `rgba(110,150,215,${0.11 * cool})`; c.fillRect(0, 0, PW, PH); c.restore(); }
    },
  }, (c, sw2, sh2) => {
    c.fillStyle = '#0e1013'; c.fillRect(0, 0, sw2, sh2);
    pos = pos || threadLayout(c, ids, { top: 130 });
    ids.forEach((id, i) => U.bubble(c, { ...BO, x: 16, y: pos[id].y, text: MSGS[id], side: 'in', k: clamp((t - ev[i]) / 0.38) }));
    threadHeader(c, sw2);
  });
}

// ───────────────────────────── a7_08_v2 ─────────────────────────────
function a7_08_v2(ctx, F) {
  const t = F.t, k = F.k;
  const ev = [F.ev('m4'), F.ev('m5'), F.ev('m6')];
  const ids = ['m1', 'm2', 'm3', 'vid', 'm4', 'm5', 'm6'];
  let bx = 0, by = 0;
  for (const e of ev) { const d = t - e; if (d > 0 && d < 0.3) { const a = (1 - d / 0.3) * 3.4; bx += Math.sin(d * 95) * a; by += Math.cos(d * 80) * a * 0.5; } }
  const gl = mixHex('#ffe2b0', '#c3d6ee', 0.4);
  let pos = null;
  U.phone(ctx, {
    x: 960 + bx, y: 402 + by, w: 780 + 18 * k, rot: 3.2 - 0.4 * k, focus: [195, 590], worn: true,
    glow: gl, glowAmt: 0.24, hand: 'right', grip: 700, thumb: null, ink: '#160c05',
    rim: { color: mixHex('#fff0c4', '#dce9f8', 0.4), amt: 0.9, dx: -1, dy: -1 },
    sheen: { env: gl, envAmt: 0.17 },
    bg: (c) => {
      U.softBackground(c, 'goldenStreet', t, { x: -k * 16, zoom: 1.03 + 0.02 * k });
      c.save(); c.fillStyle = 'rgba(110,150,215,0.045)'; c.fillRect(0, 0, PW, PH); c.restore();
    },
  }, (c, sw2, sh2) => {
    c.fillStyle = '#0e1013'; c.fillRect(0, 0, sw2, sh2);
    pos = pos || threadLayout(c, ids, { bottom: 700 });
    for (const id of ids.slice(0, 3)) U.bubble(c, { ...BO, x: 16, y: pos[id].y, text: MSGS[id], side: 'in' });
    videoBubble(c, 16, pos.vid.y, 1);
    ids.slice(4).forEach((id, i) => U.bubble(c, { ...BO, x: 16, y: pos[id].y, text: MSGS[id], side: 'in', k: clamp((t - ev[i]) / 0.38) }));
    // typing indicator: appears after the last bubble, then stops
    const td = t - (ev[2] + 1.5), ta = Math.min(sm(td, 0, 0.25), 1 - sm(td, 2.0, 0.25, ease.inQuad));
    if (ta > 0) U.typingDots(c, 16, pos.m6.y + pos.m6.h + GAP, t, { k: ta });
    threadHeader(c, sw2, 1);
    inputBar(c, sw2, sh2);
  });
}

// ───────────────────────────── a7_11_delete ─────────────────────────────
function a7_11_delete(ctx, F) {
  const t = F.t, k = F.k;
  const hold = F.ev('hold'), dialog = F.ev('dialog'), tap = F.ev('tap'), gone = F.ev('gone'), pocket = F.ev('pocket');
  const ids = ['m1', 'm2', 'm3', 'vid', 'm4', 'm5', 'm6'];
  // --- thumb path (screen units) and press
  const rest = [352, 800], onMsg = [270, 668], overDel = [336, 776], overCancel = [292, 772];
  let th, press;
  if (t < hold) { th = key(t, [[0, rest], [hold - 0.05, onMsg, ease.inOutCubic]]); press = 0; }
  else if (t < dialog) { th = onMsg; press = ease.outCubic(seg(t, hold, hold + 0.25)); }
  else {
    th = key(t, [[dialog, onMsg], [dialog + 0.6, [350, 790], ease.inOutCubic], [2.4, overDel, ease.inOutCubic], [2.8, [322, 774], ease.inOutSine],
      [3.05, overCancel, ease.inOutSine], [3.25, [316, 773], ease.inOutSine], [tap - 0.1, overDel, ease.inOutCubic], [tap, overDel], [tap + 0.5, overDel], [gone + 1.0, rest, ease.inOutCubic]]);
    const lift = 1 - seg(t, dialog, dialog + 0.3);
    const dn = ease.inCubic(seg(t, tap - 0.12, tap)) * (1 - ease.outCubic(seg(t, tap + 0.2, tap + 0.45)));
    press = Math.max(hold + 0.25 <= t && t < dialog + 0.3 ? lift : 0, dn);
    if (t >= tap - 0.12 && t < tap) press = ease.inCubic(seg(t, tap - 0.12, tap));
    if (t >= tap) press = 1 - ease.outCubic(seg(t, tap + 0.2, tap + 0.5));
    // gentle hover tremor while hanging over the button
    if (t > 2.4 && t < tap - 0.1) { th = [th[0] + wobble(t, 3, 4) * 2.2, th[1] + wobble(t, 2.6, 6) * 2.2]; }
  }
  // --- the phone leaves frame at `pocket`
  const pk = seg(t, pocket, pocket + 0.9, ease.inQuad);
  const off = pk * 980, screenOn = 1 - ease.outCubic(seg(t, pocket, pocket + 0.12, ease.linear));
  const wp = ease.inOutSine(seg(t, gone, gone + 0.7));        // wallpaper reveal warms the light
  const gl = mixHex('#c3d6ee', '#ffe2b0', wp);
  let pos = null;
  const [sx, sy] = shake(t, 1.0, 0.7, 11);
  U.phone(ctx, {
    x: 950 + sx + pk * 70, y: 402 + sy + off, w: 820 + 14 * k, rot: 3.0 - 0.4 * k + pk * 12, focus: [195, 628], worn: true,
    glow: gl, glowAmt: lerp(0.24, 0.5, wp), hand: 'right', grip: 690, on: screenOn,
    thumb: { x: th[0], y: th[1], press }, ink: '#160c05',
    rim: { color: '#dce9f8', amt: 0.9, dx: -1, dy: -1 },
    sheen: { env: gl, envAmt: 0.15 },
    bg: (c) => {
      U.softBackground(c, 'goldenStreet', t, { x: -k * 16, zoom: 1.03 + 0.02 * k });
      c.save(); c.fillStyle = 'rgba(110,150,215,0.045)'; c.fillRect(0, 0, PW, PH); c.restore();
    },
  }, (c, sw2, sh2) => homeAndThread(c, sw2, sh2, { t, ids, hold, dialog, tap, gone, press, th, wp, posRef: () => pos, setPos: (p) => { pos = p; } }));
}
function homeAndThread(c, sw, sh, S) {
  const { t, ids, hold, dialog, tap, gone } = S;
  // wallpaper: a child's crayon drawing
  const wk = ease.inOutSine(seg(t, gone, gone + 0.7));
  if (wk > 0) {
    c.save(); c.globalAlpha = wk;
    c.fillStyle = linGrad(c, 0, 0, 0, sh, [[0, '#f3ead7'], [1, '#e6d9bd']]); c.fillRect(0, 0, sw, sh);
    U.crayonFamily(c, 200, 690, 340, {});
    U.statusBar(c, { time: '8:13', color: '#2b2f36', battery: 0.5 });
    // dock: four quiet icons
    for (let i = 0; i < 4; i++) fillRR(c, 36 + i * 83, 744, 56, 56, 15, 'rgba(60,50,40,0.18)');
    c.restore();
  }
  const col = 1 - ease.inOutCubic(seg(t, gone, gone + 0.55));
  if (col > 0) {
    c.save();
    c.fillStyle = '#0e1013'; c.globalAlpha = col; c.fillRect(0, 0, sw, sh); c.globalAlpha = 1;
    const pos = S.posRef() || (S.setPos(threadLayout(c, ids, { bottom: 700 })), S.posRef());
    const sel = pos.m5, dim = 1 - 0.45 * ease.outCubic(seg(t, hold, hold + 0.25));
    ids.forEach((id, i) => {
      const it = pos[id], cy = it.y + it.h / 2, cx = 16 + it.w / 2;
      c.save();
      const stag = clamp((t - gone - i * 0.03) / 0.5), ce = ease.inCubic(stag);
      c.translate(lerp(cx, 195, ce), lerp(cy, 520, ce)); c.scale(1 - 0.9 * ce, 1 - 0.9 * ce); c.translate(-cx, -cy);
      c.globalAlpha *= (1 - ce) * dim;
      if (id === 'vid') videoBubble(c, 16, it.y, 1);
      else if (id === 'm5' && t >= hold) {
        U.bubble(c, { ...BO, x: 16, y: it.y, text: MSGS[id] });
      } else U.bubble(c, { ...BO, x: 16, y: it.y, text: MSGS[id] });
      c.restore();
    });
    c.save(); c.globalAlpha = col * dim; threadHeader(c, sw); inputBar(c, sw, sh); c.restore();
    c.restore();
  }
  // the delete sheet
  const up = sm(t, dialog, 0.3), down = 1 - ease.inCubic(seg(t, tap + 0.12, tap + 0.42));
  const sk = up * down;
  if (sk > 0) {
    const pr = t >= tap - 0.12 ? ease.inCubic(seg(t, tap - 0.12, tap)) * (1 - seg(t, tap + 0.15, tap + 0.4)) : 0;
    U.sheet(c, { k: sk, h: 252, sw, sh, fill: '#262a31', scrim: 0.55 }, (cc, x, y, w, h) => {
      text(cc, 'Delete conversation?', 195, y + 66, { size: 25, weight: 600, align: 'center', color: UI.text });
      text(cc, 'This can’t be undone.', 195, y + 102, { size: 21, align: 'center', color: UI.text2 });
      U.button(cc, { x: 22, y: y + 140, w: 164, h: 60, label: 'Cancel', kind: 'solid', color: '#3a3f48', textColor: UI.text, size: 23, weight: 500 });
      U.button(cc, { x: 204, y: y + 140, w: 164, h: 60, label: 'Delete', kind: 'solid', color: '#e0383d', size: 23, weight: 600, press: pr });
    });
  }
}

export const shots = { a1_03_bank, a1_12_notify, a3_06_frozen, a3_07_call, a7_05_msgs, a7_08_v2, a7_11_delete };
