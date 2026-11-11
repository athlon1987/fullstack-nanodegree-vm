// Shots: a3_04_class, a4_04_sign, a5_04_scan, a6_05_restore
// System screens and HUDs. Every shot is a pure function of F.t; timing comes from F.ev(...).
//
//   a3_04_class    the clerk's dated government terminal, off-axis, with glass glare. stamp 3.0: the red
//                  "REDUNDANT BIOLOGICAL INSTANCE" stamp slams on (scale 1.38 -> 1 in 80 ms, speckled ink,
//                  slight rotation) + a one-frame screen shake that decays; "Services available: none."
//                  types on 0.55 s later. Block cursor blinks on the command line before that.
//   a4_04_sign     contract on a tablet in cold grey dawn. The stylus hand enters from the left, hovers,
//                  and between sign and signEnd writes "Adam" along an authored point-by-point path, the
//                  tip exactly at the end of the ink. drop: one water drop lands (refracting lens + ripple).
//                  confirm: SUBMIT lights (cyan) and breathes. The hand leaves between signEnd and drop.
//   a5_04_scan     V1's POV: lunchbox (props.lunchbox, ~520 px) on lamplit wood in the dark. lock: brackets
//                  snap on; data..dataEnd: five fields type on with leader lines + a fast meal-log column;
//                  query: last field + spinner; noresult: "NO RESULT." and only the cursor blinks.
//   a6_05_restore  V1's pristine phone (ui.phone) showing the operator console over the dark kitchen.
//                  press: thumb travels to INITIATE RESTORATION and presses (button depresses, light ring
//                  expands); check1/2/3 rows complete with ticks; countdown: amber line + bar draining to
//                  the end of the shot while the cyan dims ~10 %.
// No additions to src/ui.js were needed. Hands: rig.drawHand (a4) and the kit's hand() via phone() (a6).
import {
  PW, PH, CX, CY, TAU, clamp, lerp, ease, seg, key, wobble, noise1, hash, rng, rgba, mixHex, rr, fillRR, linGrad,
  radGrad, glow, text, measure, wrapLines, typeOn, cached, scratch, camera, FONT,
} from '../engine.js';
import { C, LOOK } from '../style.js';
import * as U from '../ui.js';
import { lunchbox } from '../props.js';
import { drawHand } from '../rig.js';

const { UI } = U;
const sm = (t, a, d = 0.25, e = ease.outCubic) => e(clamp((t - a) / d));
const pulse01 = (t, a, b) => clamp(Math.min((t - a) / 0.3, (b - t) / 0.3));

// ═════════════════════════════════════════════ a3_04_class ═════════════════════════════════════════════
function bust(ctx, x, y, s, slouch, col) {
  // head-and-shoulders profile facing right, drawn in a 240 x 300 box
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col;
  ctx.beginPath();
  if (!slouch) {
    ctx.moveTo(16, 300); ctx.bezierCurveTo(20, 240, 52, 208, 100, 190); ctx.lineTo(104, 160);
    ctx.bezierCurveTo(86, 150, 72, 118, 76, 86); ctx.bezierCurveTo(80, 44, 110, 26, 138, 34);
    ctx.bezierCurveTo(160, 40, 168, 62, 168, 78); ctx.lineTo(182, 96); ctx.lineTo(168, 104);
    ctx.bezierCurveTo(170, 116, 166, 130, 156, 142); ctx.lineTo(146, 160); ctx.lineTo(148, 184);
    ctx.bezierCurveTo(196, 198, 226, 226, 232, 300);
  } else {
    ctx.moveTo(8, 300); ctx.bezierCurveTo(6, 248, 28, 214, 62, 206); ctx.bezierCurveTo(78, 206, 90, 198, 98, 190);
    ctx.lineTo(112, 176); ctx.bezierCurveTo(112, 168, 120, 160, 128, 154);
    ctx.bezierCurveTo(110, 142, 100, 120, 104, 98); ctx.bezierCurveTo(110, 66, 136, 56, 160, 66);
    ctx.bezierCurveTo(180, 74, 184, 92, 184, 104); ctx.lineTo(198, 122); ctx.lineTo(184, 128);
    ctx.bezierCurveTo(184, 142, 178, 154, 168, 162); ctx.lineTo(160, 178); ctx.lineTo(164, 198);
    ctx.bezierCurveTo(206, 210, 228, 244, 232, 300);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function terminalScreen(c, t, stampT) {
  const W = 1560, Hh = 680, since = t - stampT;
  const mono = FONT.mono;
  c.fillStyle = linGrad(c, 0, 0, 0, Hh, [[0, '#33443a'], [1, '#2a382f']]); c.fillRect(0, 0, W, Hh);
  c.fillStyle = '#16231b'; c.fillRect(0, 0, W, 64);
  c.fillStyle = '#4c6354'; c.fillRect(0, 64, W, 3);
  text(c, 'CIVIL REGISTRY  /  CITIZEN CLASSIFICATION', 28, 43, { size: 32, family: mono, weight: 600, color: '#cfe6cb' });
  text(c, 'SESSION 0417   14:22', W - 28, 43, { size: 28, family: mono, color: '#8fae92', align: 'right' });
  const panel = (px, py, pw, ph, head, orig) => {
    c.fillStyle = '#9db39a'; c.fillRect(px, py, pw, ph);
    c.fillStyle = '#e6f2e1'; c.fillRect(px, py, pw, 4); c.fillRect(px, py, 4, ph);
    c.fillStyle = '#3f5546'; c.fillRect(px, py + ph - 4, pw, 4); c.fillRect(px + pw - 4, py, 4, ph);
    c.fillStyle = '#4a6150'; c.fillRect(px + 8, py + 8, pw - 16, 44);
    text(c, head, px + 22, py + 40, { size: 28, family: mono, weight: 600, color: '#e2f0de' });
    c.fillStyle = '#c3d3bf'; c.fillRect(px + 26, py + 76, 250, 320);
    c.fillStyle = '#3f5546'; c.fillRect(px + 26, py + 76, 250, 3); c.fillRect(px + 26, py + 76, 3, 320);
    c.fillStyle = '#eef6ea'; c.fillRect(px + 26, py + 393, 250, 3); c.fillRect(px + 273, py + 76, 3, 320);
    bust(c, px + 31, py + 86, 1.0, orig, '#1d2a22');
  };
  panel(30, 92, 740, 470, 'RECORD 1 OF 2', false);
  panel(790, 92, 740, 470, 'RECORD 2 OF 2', true);
  const ink = '#16221b';
  text(c, 'ADAM', 330, 222, { size: 64, family: mono, weight: 700, color: ink });
  text(c, 'ACTIVE — VERIFIED', 330, 282, { size: 36, family: mono, weight: 700, color: '#1f5a30' });
  text(c, 'ID  840312-14-5127', 330, 344, { size: 28, family: mono, color: '#2c3d32' });
  text(c, 'REG.  2019-03-14', 330, 384, { size: 28, family: mono, color: '#2c3d32' });
  U.tick(c, 400, 470, 80, 1, { color: '#2a8a42', lw: 12 });
  text(c, 'ORIGINAL', 1090, 222, { size: 64, family: mono, weight: 700, color: ink });
  text(c, 'ID  840312-14-5127', 1090, 344, { size: 28, family: mono, color: '#2c3d32' });
  text(c, 'REG.  2019-03-14', 1090, 384, { size: 28, family: mono, color: '#2c3d32' });
  c.fillStyle = '#1d2c23'; c.fillRect(30, 590, W - 60, 72);
  c.fillStyle = '#4c6354'; c.fillRect(30, 590, W - 60, 3);
  if (since < 0.5) {
    const cmd = '> CLASSIFY RECORD 2 OF 2';
    text(c, cmd, 54, 640, { size: 36, family: mono, color: '#a9d4ad' });
    if ((t * 1.7) % 1 < 0.55) { c.fillStyle = '#c8f0c6'; c.fillRect(54 + measure(c, cmd, { size: 36, family: mono }) + 10, 610, 22, 34); }
  } else {
    const kk = (since - 0.55) / 0.9, str = 'Services available: none.', o = { size: 42, family: mono, weight: 600 };
    text(c, typeOn(str, kk), 54, 642, { ...o, color: '#e6f6e2' });
    if (kk < 1 || (t * 1.7) % 1 < 0.55) { c.fillStyle = '#c8f0c6'; c.fillRect(54 + measure(c, kk < 1 ? typeOn(str, kk) : str, o) + 8, 610, 24, 38); }
  }
  if (since >= 0) {
    const sc = lerp(1.38, 1, ease.outQuad(clamp(since / 0.08)));
    const { cv, ctx: s } = scratch('ui_sys_stamp', 800, 260);
    const col = '#d6312e';
    s.fillStyle = col; s.strokeStyle = col; s.lineWidth = 10; rr(s, 22, 24, 756, 212, 10); s.stroke();
    s.lineWidth = 3; rr(s, 38, 40, 724, 180, 6); s.stroke();
    s.textAlign = 'center'; s.textBaseline = 'alphabetic'; s.font = `700 56px ${mono}`;
    s.fillText('REDUNDANT', 400, 112); s.fillText('BIOLOGICAL INSTANCE', 400, 188);
    s.globalCompositeOperation = 'destination-out';
    const r = rng(77);
    for (let i = 0; i < 520; i++) { s.globalAlpha = 0.25 + r() * 0.65; s.beginPath(); s.arc(r() * 800, r() * 260, 0.8 + r() * r() * 5, 0, TAU); s.fill(); }
    for (let i = 0; i < 14; i++) { s.globalAlpha = 0.3 + r() * 0.3; s.fillRect(r() * 800, r() * 260, 30 + r() * 120, 2 + r() * 4); }
    s.globalCompositeOperation = 'source-over'; s.globalAlpha = 1;
    c.save();
    c.translate(1160, 410); c.rotate(-0.115); c.scale(sc, sc);
    c.globalAlpha = 0.96 * clamp(since / 0.03);
    c.shadowColor = 'rgba(214,49,46,.55)'; c.shadowBlur = 14;
    c.drawImage(cv, -400, -130);
    c.restore();
  }
}

function a3_04_class(ctx, F) {
  const t = F.t, st = F.ev('stamp'), since = t - st, k = t / F.T;
  ctx.fillStyle = '#080c0a'; ctx.fillRect(0, 0, PW, PH);
  ctx.fillStyle = radGrad(ctx, 900, 330, 80, 1300, [[0, '#26322b'], [1, '#050806']]); ctx.fillRect(0, 0, PW, PH);
  const shk = since >= 0 && since < 0.3 ? (since < 0.042 ? 1 : 0.22 * (1 - since / 0.3)) : 0;
  const sx = shk * 11 * (hash(Math.floor(since * 24)) > 0.5 ? 1 : -1), sy = shk * 6;
  camera(ctx, { x: 940 + wobble(t, 0.3, 2) * 4, y: 402, zoom: 1 + 0.045 * ease.inOutSine(k) }, 1, () => {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.transform(1, 0.012, -0.045, 1, 40, 0);   // seen off-axis
    ctx.fillStyle = linGrad(ctx, 0, 14, 0, 800, [[0, '#b7baaf'], [0.5, '#a3a69b'], [1, '#7d8077']]); rr(ctx, 90, 12, 1740, 800, 34); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(110, 14, 1700, 3);
    ctx.fillStyle = '#10130f'; rr(ctx, 150, 42, 1620, 706, 20); ctx.fill();
    ctx.fillStyle = '#05070a'; rr(ctx, 168, 56, 1584, 692, 14); ctx.fill();
    ctx.fillStyle = '#6fdc82'; ctx.beginPath(); ctx.arc(1720, 776, 5, 0, TAU); ctx.fill();
    glow(ctx, 1720, 776, 26, '#6fdc82', 0.5);
    ctx.save();
    rr(ctx, 180, 68, 1560, 668, 8); ctx.clip();
    ctx.translate(180, 68);
    terminalScreen(ctx, t, st);
    ctx.fillStyle = 'rgba(0,0,0,.14)';
    for (let y = 0; y < 668; y += 4) ctx.fillRect(0, y, 1560, 1.4);
    ctx.fillStyle = radGrad(ctx, 780, 330, 400, 1000, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.45)']]); ctx.fillRect(0, 0, 1560, 668);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = linGrad(ctx, 0, 0, 1560, 668, [[0, 'rgba(210,235,220,.17)'], [0.28, 'rgba(210,235,220,.05)'], [0.45, 'rgba(210,235,220,0)'], [1, 'rgba(210,235,220,0)']]);
    ctx.fillRect(0, 0, 1560, 668);
    ctx.beginPath(); ctx.moveTo(1050, 0); ctx.lineTo(1180, 0); ctx.lineTo(820, 668); ctx.lineTo(690, 668); ctx.closePath();
    ctx.fillStyle = 'rgba(200,230,215,.055)'; ctx.fill();
    ctx.restore();
    ctx.restore();
    glow(ctx, 960, 400, 900, '#9db39a', 0.07, 0.6);
    ctx.restore();
  });
  // glass partition: pale reflective band + frame edge on the left, a soft fluorescent streak
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = linGrad(ctx, 0, 0, 260, 0, [[0, 'rgba(190,215,200,.16)'], [1, 'rgba(190,215,200,0)']]); ctx.fillRect(0, 0, 260, PH);
  ctx.fillStyle = 'rgba(210,230,215,.12)'; ctx.fillRect(58, 0, 5, PH);
  ctx.fillStyle = linGrad(ctx, 0, 40, 0, 120, [[0, 'rgba(220,240,225,0)'], [0.5, 'rgba(220,240,225,.10)'], [1, 'rgba(220,240,225,0)']]); ctx.fillRect(0, 40, PW, 80);
  ctx.restore();
}

// ═════════════════════════════════════════════ a4_04_sign ═════════════════════════════════════════════
// Signature "Adam": authored control points (x, y) in a ~295 x 100 box, baseline y ~ 95, x-height ~ 58,
// ascenders ~ 3; Catmull-Rom smoothed per stroke. Stroke 1: A (two legs) a d a m, short exit flick.
// Pen lift, then stroke 2 crosses the A. No trailing loop. The pen-up travel is counted at LIFT_W of its
// length so the stylus hops back quickly; the ink is never drawn along it.
const SIG_STROKES = [
  [
    [0, 96], [9, 76], [20, 46], [31, 18], [39, 3], [46, 18], [54, 48], [61, 78], [66, 94], [76, 97],                          // A
    [92, 97], [106, 93], [112, 78], [113, 60], [102, 54], [89, 58], [82, 74], [86, 90], [97, 96], [108, 90], [113, 74], [115, 58],
    [115, 78], [118, 92], [128, 96],                                                                                            // a
    [142, 97], [150, 90], [154, 74], [153, 60], [141, 54], [128, 60], [123, 77], [128, 92], [140, 96], [150, 89], [154, 72], [157, 40],
    [160, 4], [159, 32], [157, 62], [158, 84], [164, 95], [176, 97],                                                            // d
    [190, 97], [198, 88], [200, 72], [199, 60], [187, 54], [174, 60], [168, 76], [172, 91], [184, 96], [194, 90], [199, 74], [201, 58],
    [201, 80], [204, 93], [213, 95],                                                                                            // a
    [217, 80], [220, 62], [228, 56], [235, 63], [236, 80], [236, 95], [237, 78], [241, 63], [248, 56], [255, 62], [257, 80], [257, 95],
    [258, 78], [262, 63], [269, 56], [276, 62], [278, 78], [279, 91], [285, 96], [293, 92],                                       // m
  ],
  [[9, 66], [22, 63], [38, 61], [52, 60], [56, 60]],                                                                            // A crossbar
];
const LIFT_W = 0.7;
const SIG = { x: 590, y: 400, s: 1.62 };
let _sig = null;
function sigPath() {
  if (_sig) return _sig;
  const out = [], ink = [];          // ink[i]: is the segment ending at point i drawn?
  SIG_STROKES.forEach((P, si) => {
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (let j = 0; j < 10; j++) {
        const u = j / 10, u2 = u * u, u3 = u2 * u;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
        const n = out.length;
        out.push([SIG.x + (f(p0[0], p1[0], p2[0], p3[0]) + (noise1(n * 0.35, 4) - 0.5) * 2.4) * SIG.s,
                  SIG.y + (f(p0[1], p1[1], p2[1], p3[1]) + (noise1(n * 0.31, 9) - 0.5) * 2.6) * SIG.s]);
        ink.push(!(si > 0 && i === 0 && j === 0));
      }
    }
    out.push([SIG.x + P[P.length - 1][0] * SIG.s, SIG.y + P[P.length - 1][1] * SIG.s]); ink.push(true);
  });
  ink[0] = false;
  const len = [0];
  for (let i = 1; i < out.length; i++) len.push(len[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]) * (ink[i] ? 1 : LIFT_W));
  return (_sig = { pts: out, ink, len, total: len[len.length - 1] });
}
function sigAt(p) {
  const S = sigPath(), d = clamp(p) * S.total;
  let i = 1; while (i < S.len.length - 1 && S.len[i] < d) i++;
  const a = S.len[i - 1], b = S.len[i], u = b > a ? (d - a) / (b - a) : 0;
  return { i, up: !S.ink[i], x: lerp(S.pts[i - 1][0], S.pts[i][0], u), y: lerp(S.pts[i - 1][1], S.pts[i][1], u) };
}

function contractPage(c, t, p, conf, confirm) {
  const serif = FONT.serif;
  c.fillStyle = linGrad(c, 0, 0, 0, 850, [[0, '#f6f8fb'], [1, '#e9eef4']]); c.fillRect(190, 20, 1540, 850);
  text(c, 'LIFE OPTIMISATION PROGRAM  ·  FORM R-7', 280, 78, { size: 28, family: FONT.mono, color: '#5d7b88', tracking: 3 });
  U.emblem(c, 1640, 62, 22, { color: '#2a8fae', glow: 0, alpha: 0.9, ticks: false });
  c.fillStyle = '#c3ccd6'; c.fillRect(280, 100, 1360, 2);
  text(c, 'RELINQUISHMENT OF PRIOR LIFE', 280, 186, { size: 78, family: serif, weight: 600, color: '#0f1a2a', tracking: 1.5 });
  const body = 'I, the original instance, surrender all claim to my name, my home, my employment and my family.';
  const bo = { size: 46, family: serif, weight: 500 };
  wrapLines(c, body, 1330, bo).forEach((ln, i) => text(c, ln, 280, 262 + i * 56, { ...bo, color: '#1b2638' }));
  c.fillStyle = '#8392a4'; c.fillRect(580, 546, 700, 2);
  text(c, '×', 540, 540, { size: 44, family: FONT.sans, color: '#8392a4' });
  text(c, 'SIGNATURE OF ORIGINAL INSTANCE', 580, 586, { size: 28, family: FONT.mono, color: '#5d6b7c', tracking: 1.5 });
  if (p > 0) {
    const S = sigPath(), e = sigAt(p), n = e.i;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#0d1d3d';
    for (let pass = 0; pass < 2; pass++) {
      c.lineWidth = pass ? 3.4 : 6.5; c.globalAlpha = pass ? 0.95 : 0.16;
      c.beginPath(); c.moveTo(S.pts[0][0], S.pts[0][1]);
      for (let i = 1; i < n; i++) (S.ink[i] ? c.lineTo(S.pts[i][0], S.pts[i][1]) : c.moveTo(S.pts[i][0], S.pts[i][1]));
      if (e.up) c.moveTo(e.x, e.y); else c.lineTo(e.x, e.y);
      c.stroke();
    }
    c.restore();
  }
  const w = 340, h = 84, bx = 1300, by = 668, lit = conf;
  if (lit <= 0) {
    fillRR(c, bx, by, w, h, 14, '#d5dce5');
    text(c, 'SUBMIT', bx + w / 2, by + 56, { size: 40, family: FONT.mono, weight: 600, color: '#9aa7b6', align: 'center', tracking: 4 });
  } else {
    const br = 0.5 + 0.5 * Math.sin((t - confirm) * 3.2);
    for (const [g, a] of [[34, 0.07], [20, 0.12], [9, 0.2]]) { rr(c, bx - g, by - g, w + g * 2, h + g * 2, 14 + g); c.fillStyle = rgba(C.cyan, a * lit * (0.65 + 0.35 * br)); c.fill(); }
    fillRR(c, bx, by, w, h, 14, mixHex('#d5dce5', '#25c3ea', lit));
    fillRR(c, bx, by, w, h, 14, linGrad(c, 0, by, 0, by + h, [[0, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']]));
    text(c, 'SUBMIT', bx + w / 2, by + 56, { size: 40, family: FONT.mono, weight: 700, color: mixHex('#9aa7b6', '#032332', lit), align: 'center', tracking: 4 });
  }
}

function a4_04_sign(ctx, F) {
  const t = F.t, k = t / F.T;
  const sign = F.ev('sign'), signEnd = F.ev('signEnd'), drop = F.ev('drop'), confirm = F.ev('confirm');
  const p = seg(t, sign, signEnd, (u) => u * 0.78 + ease.inOutSine(u) * 0.22);
  const conf = sm(t, confirm, 0.3, ease.outCubic);
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, PH, [[0, '#8794a6'], [1, '#4b5666']]); ctx.fillRect(0, 0, PW, PH);
  ctx.drawImage(cached('ui_sys_sign_bg', PW, PH, (c) => {
    const r = rng(12);
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) { const x = r() * PW, y = r() * PH, rd = 30 + r() * 90; c.fillStyle = radGrad(c, x, y, 0, rd, [[0, `rgba(215,225,238,${0.05 + r() * 0.1})`], [1, 'rgba(215,225,238,0)']]); c.beginPath(); c.arc(x, y, rd, 0, TAU); c.fill(); }
  }), 0, 0);
  const drift = ease.inOutSine(k);
  camera(ctx, { x: 960 - 10 * drift, y: 402 + 6 * drift, zoom: 1 + 0.05 * drift, rot: 0.012 }, 1, () => {
    ctx.fillStyle = '#05070a'; rr(ctx, 120, -60, 1680, 960, 44); ctx.fill();
    ctx.strokeStyle = 'rgba(210,225,245,.25)'; ctx.lineWidth = 2; rr(ctx, 121, -59, 1678, 958, 44); ctx.stroke();
    glow(ctx, 960, 360, 1200, '#e6f1ff', 0.10, 0.55);
    ctx.save(); rr(ctx, 190, 20, 1540, 850, 18); ctx.clip();
    const page = (c) => contractPage(c, t, p, conf, confirm);
    page(ctx);
    const dt = t - drop, DX = 1215, DY = 462, R = 54;   // on the glass beside (right of) the signature, clear of the ink
    if (dt > -0.12) {
      if (dt < 0) {
        const u = (dt + 0.12) / 0.12;
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(DX, DY - 220 * (1 - u * u), 5, 9 + 14 * u, 0, 0, TAU); ctx.fill();
      } else {
        const g = ease.outCubic(clamp(dt / 0.14));
        const r = R * (0.2 + 0.8 * g) * (1 - 0.04 * ease.outCubic(clamp((dt - 0.14) / 1)));
        for (let i = 0; i < 3; i++) {
          const u = clamp((dt - i * 0.18) / 0.95);
          if (u > 0 && u < 1) {
            const rr2 = r + 10 + 120 * ease.outCubic(u);
            ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - u)})`; ctx.lineWidth = 2.2 * (1 - u) + 0.6; ctx.beginPath(); ctx.arc(DX, DY, rr2, 0, TAU); ctx.stroke();
            ctx.strokeStyle = `rgba(30,50,80,${0.18 * (1 - u)})`; ctx.beginPath(); ctx.arc(DX, DY, rr2 + 3, 0, TAU); ctx.stroke();
          }
        }
        ctx.save(); ctx.beginPath(); ctx.arc(DX, DY, r, 0, TAU); ctx.clip();
        ctx.translate(DX, DY); ctx.scale(1.4, 1.4); ctx.translate(-DX, -DY); page(ctx);
        ctx.restore();
        ctx.save();
        ctx.fillStyle = radGrad(ctx, DX, DY, r * 0.6, r, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(40,60,90,.35)']]); ctx.beginPath(); ctx.arc(DX, DY, r, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(40,60,90,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(DX, DY, r, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(DX, DY, r * 0.8, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(DX, DY, r * 0.8, Math.PI * 0.1, Math.PI * 0.35); ctx.stroke();
        ctx.restore();
      }
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = linGrad(ctx, 190, 20, 1100, 870, [[0, 'rgba(255,255,255,.10)'], [0.4, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(190, 20, 1540, 850);
    ctx.restore();
    ctx.restore();

    // stylus + hand
    const S0 = sigAt(0), cur = sigAt(p), fin = sigAt(1);
    const lift = sm(t, signEnd, 0.4, ease.inOutSine);
    const SP = sigPath(), li = SP.ink.indexOf(false, 1);                // the pen lift before the A's crossbar
    const upU = li > 0 && t > sign && t < signEnd ? clamp((p * SP.total - SP.len[li - 1]) / (SP.len[li] - SP.len[li - 1])) : 0;
    const hover = (1 - sm(t, sign - 0.35, 0.35, ease.inOutSine)) * 26 + lift * 34 + Math.sin(upU * Math.PI) * 24;
    let tx, ty;
    const enter = seg(t, 0.2, sign - 0.3, ease.inOutCubic), leave = seg(t, signEnd + 0.5, drop + 0.5, ease.inOutCubic);
    if (t < sign) { tx = lerp(-300, S0.x, enter); ty = lerp(S0.y + 110, S0.y, enter); }
    else if (t <= signEnd) { tx = cur.x; ty = cur.y; }
    else { tx = lerp(fin.x, -420, leave); ty = lerp(fin.y, fin.y + 160, leave); }
    const tr = t > sign && t < signEnd ? 0 : 1;
    tx += wobble(t, 1.3, 3) * 3 * tr; ty += wobble(t, 1.1, 5) * 2.5 * tr;
    const ang = 46 * Math.PI / 180, L = 150, back = [-Math.cos(ang), -Math.sin(ang)];
    const hx = tx - hover * 0.35, hy = ty - hover;
    const S = 280, rot = 12, PPx = 0.8 * S, PPy = -0.2 * S;
    const px = hx + back[0] * L, py = hy + back[1] * L, ra = rot * Math.PI / 180;
    const wx = px - (PPx * Math.cos(ra) - PPy * Math.sin(ra)), wy = py - (PPx * Math.sin(ra) + PPy * Math.cos(ra));
    if (hover > 1) { ctx.save(); ctx.fillStyle = 'rgba(10,20,40,.16)'; ctx.beginPath(); ctx.ellipse(tx + hover * 0.2, ty + 6, 6 + hover * 0.3, 3, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.save(); ctx.globalAlpha = 0.14; ctx.translate(14 + hover * 0.5, 22 + hover * 0.6);
    drawHand(ctx, { x: wx, y: wy, size: S, rot, pose: 'pinch', ink: '#0a1224', cuff: null });
    ctx.restore();
    drawHand(ctx, { x: wx, y: wy, size: S, rot, pose: 'pinch', ink: '#05070b', cuff: '#161c27' });
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#1c2029'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(hx + back[0] * 22, hy + back[1] * 22); ctx.lineTo(hx + back[0] * L * 1.25, hy + back[1] * L * 1.25); ctx.stroke();
    ctx.strokeStyle = '#d5dde8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + back[0] * 26, hy + back[1] * 26); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,210,235,.55)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx + back[0] * 40 + 3, hy + back[1] * 40 - 3); ctx.lineTo(hx + back[0] * L * 1.2 + 3, hy + back[1] * L * 1.2 - 3); ctx.stroke();
    ctx.restore();
  });
}

// ═════════════════════════════════════════════ a5_04_scan ═════════════════════════════════════════════
const MEALS = [
  ['nasi lemak', 640], ['roti canai', 301], ['egg sandwich', 310], ['nasi goreng', 520], ['mee goreng', 480], ['kaya toast', 280],
  ['curry puff', 245], ['chicken rice', 607], ['bihun soup', 360], ['fried bee hoon', 410], ['apple slices', 52], ['nasi ayam', 590],
  ['popiah', 190], ['karipap', 230], ['sardine bun', 330], ['mee hoon', 390], ['lontong', 350], ['tuna onigiri', 280], ['kuih lapis', 160],
  ['roti jala', 220], ['nasi kerabu', 560], ['otak-otak', 120], ['banana fritter', 280], ['laksa', 432], ['mihun sup', 340], ['pau kacang', 210],
  ['putu piring', 180], ['cucur udang', 190], ['pulut kuning', 330], ['spaghetti', 450], ['egg+toast', 260], ['tempe goreng', 210],
  ['rendang rice', 640], ['sayur lodeh', 150], ['nasi minyak', 580], ['bubur ayam', 300],
];
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function logDate(n) {
  let m = 2, y = 19, day = 14 + Math.floor(n * 7 / 5);
  while (day > MDAYS[m]) { day -= MDAYS[m]; m++; if (m > 11) { m = 0; y++; } }
  return `${String(day).padStart(2, '0')} ${MON[m]} ${y}`;
}
const logRow = (n) => { const e = MEALS[(n * 7 + 3) % MEALS.length]; return `${logDate(n)} ${e[0]} · ${e[1]}`; };

const tableBg = () => cached('ui_sys_scan_table', PW, PH, (c) => {
  c.fillStyle = '#000'; c.fillRect(0, 0, PW, PH);
  const r = rng(31);
  let y = 175;
  c.save(); c.beginPath(); c.rect(0, 175, PW, PH); c.clip();
  while (y < PH) {
    const h = 34 + (y - 175) * 0.09;
    c.fillStyle = mixHex('#5a3a20', '#7a4f2b', r()); c.fillRect(0, y, PW, h);
    c.fillStyle = 'rgba(20,10,4,.65)'; c.fillRect(0, y + h - 2, PW, 2);
    for (let g = 0; g < 14; g++) { c.strokeStyle = `rgba(30,14,6,${0.08 + r() * 0.16})`; c.lineWidth = 1; const gy = y + 3 + r() * (h - 6), gx = r() * PW; c.beginPath(); c.moveTo(gx, gy); c.bezierCurveTo(gx + 150, gy + (r() - 0.5) * 6, gx + 350, gy + (r() - 0.5) * 6, gx + 600 + r() * 600, gy); c.stroke(); }
    y += h;
  }
  c.restore();
  c.save(); c.translate(690, 620); c.scale(1, 0.62);
  c.fillStyle = radGrad(c, 0, 0, 120, 1000, [[0, 'rgba(0,0,0,0)'], [0.35, 'rgba(0,0,0,.45)'], [0.7, 'rgba(0,0,0,.9)'], [1, 'rgba(0,0,0,1)']]);
  c.fillRect(-1400, -1000, 2800, 2000);
  c.restore();
  c.fillStyle = linGrad(c, 0, 175, 0, 330, [[0, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(0, 175, PW, 160);
});

function leader(ctx, pts, k, col, dot) {
  if (k <= 0) return;
  ctx.save(); ctx.strokeStyle = rgba(col, 0.75); ctx.lineWidth = 1.5;
  let total = 0; const seglen = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seglen.push(d); total += d; }
  let rem = total * clamp(k), last = pts[0];
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && rem > 0; i++) { const d = seglen[i - 1], u = Math.min(1, rem / d); last = [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]; ctx.lineTo(last[0], last[1]); rem -= d; }
  ctx.stroke();
  if (k >= 1 && dot) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(last[0], last[1], 4.5, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba(col, 0.6); ctx.beginPath(); ctx.arc(last[0], last[1], 9, 0, TAU); ctx.stroke(); }
  ctx.restore();
}

function a5_04_scan(ctx, F) {
  const t = F.t, k = t / F.T;
  const lock = F.ev('lock'), data = F.ev('data'), dataEnd = F.ev('dataEnd'), query = F.ev('query'), nores = F.ev('noresult');
  const cyan = C.cyan, mono = FONT.mono;
  const LBX = 690, LBY = 650, LBS = 520;
  camera(ctx, { x: CX + wobble(t, 0.2, 1) * 3, y: CY, zoom: 1 + 0.04 * ease.inOutSine(k) }, 1, () => {
    ctx.drawImage(tableBg(), 0, 0);
    glow(ctx, 690, 120, 700, '#ffc274', 0.10, 0.4);
    glow(ctx, 690, 640, 620, '#ffb561', 0.10, 0.5);
    const a = lunchbox(ctx, { x: LBX, y: LBY, size: LBS, lum: 0.95, tint: LOOK.lampNight.fill, light: { color: C.honey, from: 'above', amount: 0.85 }, shadow: 0.8 });
    ctx.save(); ctx.fillStyle = radGrad(ctx, CX, CY, 300, 1100, [[0, 'rgba(6,24,34,0)'], [1, 'rgba(2,10,16,.55)']]); ctx.fillRect(0, 0, PW, PH); ctx.restore();

    const bx = LBX - LBS / 2 - 18, by = LBY - LBS * 0.61 - 34, bw = LBS + 36, bh = LBS * 0.61 + 52;
    U.hudBrackets(ctx, bx, by, bw, bh, seg(t, lock, lock + 0.28, ease.linear), { color: cyan, len: 54, lw: 2.4, spread: 90 });
    if (t > data && t < dataEnd + 0.2) {
      const u = ((t - data) / 1.1) % 1, sy = by + bh * u;
      ctx.save(); ctx.globalAlpha = 0.45 * pulse01(t, data, dataEnd + 0.2); ctx.strokeStyle = cyan; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bx, sy); ctx.lineTo(bx + bw, sy); ctx.stroke(); ctx.restore();
    }
    if (t > lock) {
      text(ctx, 'V1 // OPTICAL', 64, 50, { size: 22, family: mono, color: cyan, alpha: 0.7 * sm(t, lock, 0.3), tracking: 4 });
      text(ctx, 'LOCK  ACQUIRED', 64, 76, { size: 22, family: mono, color: UI.pDim, alpha: 0.8 * sm(t, lock, 0.3), tracking: 2 });
    }
    const F1 = (str, x, y, t0, size, col = C.ice, weight = 500) => {
      U.typeLine(ctx, str, x, y, seg(t, t0, t0 + 0.55, ease.linear), { size, family: mono, weight, color: col, t, caret: 'block', caretColor: cyan });
    };
    const dur = dataEnd - data, tt = (i) => data + (dur - 0.7) * (i / 4);
    F1('OBJECT: LUNCHBOX — ENAMELLED STEEL', 70, 140, tt(0), 40, '#eafaff', 600);
    leader(ctx, [[70, 152], [500, 152], [a.top.x - 120, a.top.y - 10]], seg(t, tt(0) + 0.4, tt(0) + 0.9), cyan, true);
    F1('PURCHASED: 14 MAR 2019 · RM 12.90', 70, 196, tt(1), 30);
    leader(ctx, [[70, 208], [380, 208], [LBX - 200, LBY - 100]], seg(t, tt(1) + 0.4, tt(1) + 0.9), cyan, true);
    F1('MANUFACTURER: KILANG LOGAM SEJATI SDN BHD', 70, 244, tt(2), 30);
    leader(ctx, [[70, 256], [LBX - LBS / 2 - 40, 256], [LBX - LBS / 2 - 40, LBY + 18], [LBX - LBS / 2 + 60, LBY + 18]], seg(t, tt(2) + 0.4, tt(2) + 1.0), cyan, true);
    F1('MEALS PACKED: 1,186', 1000, 360, tt(3), 40, '#eafaff', 600);
    leader(ctx, [[1000, 374], [LBX + LBS / 2 + 14, 374], [LBX + LBS / 2 - 40, LBY - 150]], seg(t, tt(3) + 0.35, tt(3) + 0.85), cyan, true);
    F1('TOTAL: 612,840 kcal', 1000, 440, tt(4), 40, '#eafaff', 600);
    leader(ctx, [[1000, 454], [LBX + LBS / 2 + 70, 454], [LBX + LBS / 2 - 10, LBY - 50]], seg(t, tt(4) + 0.35, tt(4) + 0.85), cyan, true);

    // meal log column
    const lx = 1500, lw = 380, ly0 = 148, ly1 = 700, rowH = 36;
    const lg = sm(t, data - 0.1, 0.4) * (1 - 0.72 * sm(t, dataEnd + 0.4, 0.5, ease.inOutSine));
    if (lg > 0) {
      ctx.save();
      ctx.strokeStyle = rgba(cyan, 0.5 * lg); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(lx - 14, ly0 - 6); ctx.lineTo(lx - 14, ly1); ctx.stroke();
      const cnt = Math.round(1186 * ease.outCubic(seg(t, data, dataEnd)));
      text(ctx, 'MEAL LOG  ' + String(cnt).replace(/\B(?=(\d{3})+(?!\d))/g, ','), lx, ly0 - 20, { size: 26, family: mono, color: cyan, alpha: lg, tracking: 2 });
      ctx.beginPath(); ctx.rect(lx - 4, ly0, lw + 100, ly1 - ly0); ctx.clip();
      const pos = seg(t, data, dataEnd + 0.5, (u) => 1 - Math.pow(1 - u, 1.8)) * (dataEnd - data + 0.5) * 900 * 0.9;
      const base = Math.floor(pos / rowH), frac = pos - base * rowH;
      const nrows = Math.ceil((ly1 - ly0) / rowH);
      for (let i = -1; i < nrows + 1; i++) {
        const y = ly1 - i * rowH + frac - 10, n = base + i + 40;
        const edge = clamp(Math.min((y - ly0) / 90, (ly1 - y) / 70));
        text(ctx, logRow(n), lx, y, { size: 22, family: mono, color: '#9fdcee', alpha: lg * edge * (0.55 + 0.4 * hash(n)) });
      }
      ctx.restore();
    }
    if (t >= query) {
      const qk = seg(t, query, query + 0.7), qs = 'QUERY: WHY SHE KEEPS THIS';
      U.typeLine(ctx, qs, 1000, 560, qk, { size: 32, family: mono, weight: 600, color: '#eafaff', t, caret: t < nores ? 'block' : false, caretColor: cyan });
      if (t < nores) U.spinner(ctx, 1000 + qs.length * 19.2 + 44, 548, 14, t, { color: cyan, lw: 3 });
      leader(ctx, [[1000, 576], [1000 + qs.length * 19.2, 546]], seg(t, query + 0.3, query + 0.8), cyan, false);
    }
    if (t >= nores) {
      const s = 56;
      text(ctx, 'NO RESULT.', 1000, 650, { size: s, family: mono, weight: 700, color: '#ffffff', alpha: sm(t, nores, 0.12, ease.linear), shadow: { color: rgba(cyan, 0.7), blur: 18 } });
      if ((t * 1.6) % 1 < 0.58) { ctx.fillStyle = '#ffffff'; ctx.fillRect(1000 + 10 * s * 0.6 + 10, 650 - s * 0.78, s * 0.5, s * 0.92); }
    }
  });
}

// ═════════════════════════════════════════════ a6_05_restore ═════════════════════════════════════════════
function consoleScreen(c, sw, sh, t, F) {
  const press = F.ev('press'), ch = [F.ev('check1'), F.ev('check2'), F.ev('check3')], cd = F.ev('countdown');
  const mono = FONT.mono, cyan = C.cyan;
  const dim = 1 - 0.1 * seg(t, cd, F.T, ease.linear);
  c.fillStyle = UI.pBg; c.fillRect(0, 0, sw, sh);
  c.fillStyle = radGrad(c, 195, 330, 20, 460, [[0, 'rgba(14,60,78,.45)'], [1, 'rgba(3,7,11,0)']]); c.fillRect(0, 0, sw, sh);
  U.statusBar(c, { time: '23:41', battery: 0.64 });
  c.save();
  U.emblem(c, 44, 180, 17, { color: cyan, glow: 0.4, ticks: false });
  text(c, 'LIFE OPTIMISATION', 78, 177, { size: 15, family: mono, weight: 500, color: UI.pText, tracking: 1.6 });
  text(c, 'OPERATOR CONSOLE', 78, 197, { size: 14, family: mono, color: UI.pDim, tracking: 1.6 });
  c.fillStyle = rgba(cyan, 0.35); c.fillRect(20, 210, 350, 1);
  const bp = sm(t, press - 0.12, 0.12, ease.inOutSine) * (1 - sm(t, press + 0.12, 0.25, ease.outCubic));
  const done = t > press, br = 0.5 + 0.5 * Math.sin(t * 2.6);
  U.button(c, { x: 20, y: 224, w: 350, h: 72, label: 'INITIATE RESTORATION', kind: 'outline', color: cyan, size: 19.5, weight: 700, family: mono, tracking: 1, r: 8, press: bp, breathe: done ? 1 : 0.35 + 0.65 * br, glow: 1 });
  if (done) { c.save(); c.globalAlpha = 0.18 * (1 - sm(t, press, 1.1, ease.outCubic)); c.fillStyle = cyan; rr(c, 20, 224, 350, 72, 8); c.fill(); c.restore(); }
  const rk = (t - press) / 1.1;
  if (rk > 0 && rk < 1) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const r0 = 40 + 330 * ease.outCubic(rk), al = 0.8 * Math.pow(1 - rk, 1.5);
    c.strokeStyle = rgba(cyan, al * 0.35); c.lineWidth = 16; c.beginPath(); c.ellipse(195, 260, r0, r0 * 0.55, 0, 0, TAU); c.stroke();
    c.strokeStyle = rgba('#d6f4ff', al); c.lineWidth = 2.2; c.stroke();
    c.restore();
  }
  if (t < press) text(c, 'AWAITING OPERATOR', 20, 336, { size: 14.5, family: mono, color: UI.pDim, tracking: 2, alpha: 0.6 + 0.4 * br });
  ['IDENTITY: ADAM — REINSTATED', 'BANK ACCOUNT — RESTORED', 'EMPLOYMENT RECORD — CORRECTED'].forEach((s, i) => {
    const y = 336 + i * 36, t0 = ch[i] - 1.05, u = seg(t, t0, t0 + 0.65, ease.linear), tk = seg(t, ch[i], ch[i] + 0.3, ease.linear);
    if (u <= 0) return;
    U.typeLine(c, s, 18, y, u, { size: 19, family: mono, color: tk > 0 ? UI.pText : cyan, t, caret: tk > 0 ? false : 'block', caretColor: cyan });
    if (tk <= 0) U.spinner(c, 368, y - 7, 8, t, { color: cyan, lw: 2.2 });
    else { U.tick(c, 368, y - 7, 18, tk, { color: C.ok, lw: 2.6 }); if (tk < 1) glow(c, 368, y - 7, 26, C.ok, 0.4 * (1 - tk)); }
  });
  if (t >= cd) {
    const a = sm(t, cd, 0.25), u = seg(t, cd, F.T, ease.linear), col = '#ffb23d';
    c.fillStyle = rgba(col, 0.1 * a); c.fillRect(0, 432, sw, 62);
    text(c, 'REPLACEMENT UNIT — SHUTDOWN', 18, 460, { size: 19, family: mono, weight: 600, color: col, alpha: a });
    c.save(); c.globalAlpha = a;
    c.strokeStyle = rgba(col, 0.55); c.lineWidth = 1.2; rr(c, 18.5, 472.5, 353, 14, 3); c.stroke();
    const w = 349 * (1 - u); c.fillStyle = col; if (w > 1) { rr(c, 20.5, 474.5, w, 10, 2); c.fill(); }
    glow(c, 20.5 + w, 479.5, 24, col, 0.5);
    c.restore();
  }
  c.restore();
  if (dim < 1) { c.fillStyle = `rgba(0,0,0,${(1 - dim) * 0.9})`; c.fillRect(0, 0, sw, sh); }
}

function a6_05_restore(ctx, F) {
  const t = F.t, k = t / F.T, press = F.ev('press'), cd = F.ev('countdown');
  const BTN = [292, 260];
  const tpos = key(t, [[0, [392, 520]], [press - 0.9, [350, 400]], [press - 0.12, BTN, ease.inOutCubic], [press + 0.5, BTN, ease.linear], [press + 1.4, [392, 500], ease.inOutCubic], [F.T, [400, 540], ease.inOutSine]]);
  const pr = sm(t, press - 0.12, 0.12, ease.inOutSine) * (1 - sm(t, press + 0.12, 0.3, ease.outCubic));
  const dimK = seg(t, cd, F.T, ease.linear);
  U.phone(ctx, {
    x: 930 + wobble(t, 0.5, 2) * 4 - 14 * k, y: 402 + wobble(t, 0.4, 6) * 3, w: 870 + 24 * k, rot: -3.2 + 1.1 * k, focus: [195, 352], worn: false,
    glow: C.cyan, glowAmt: 1 - 0.12 * dimK, hand: 'right', grip: 560, bloom: 0.55,
    thumb: { x: tpos[0] + wobble(t, 0.7, 4) * 3, y: tpos[1] + wobble(t, 0.6, 8) * 2.5, press: pr },
    rim: { color: C.cyan, amt: 0.35, dx: -1, dy: -0.4 },
    bg: (c) => U.softBackground(c, 'kitchenNight', t, { x: -k * 14, zoom: 1.04 + 0.02 * k, lamp: 0.5, dim: 0.2 }),
  }, (c, sw2, sh2) => consoleScreen(c, sw2, sh2, t, F));
}

export const shots = { a3_04_class, a4_04_sign, a5_04_scan, a6_05_restore };
