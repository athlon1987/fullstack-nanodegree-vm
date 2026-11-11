// Shots: a3_01_police, a3_02_scan, a3_03_gov, a3_05_bench, a3_09_watch, a3_10_dark
// Each entry is (ctx, F) => void — see STYLE.md and src/engine.js.
import { camera, key, ease, clamp, lerp, rgba, mixHex, rr, text, FONT, glow, noise1, typeOn, pulse, TAU, linGrad, radGrad, PW, PH } from '../engine.js';
import { LOOK, C } from '../style.js';
import { drawFigure, POSE, mixPose } from '../rig.js';
import { lunchbox, phoneSmall, scanner, trophy } from '../props.js';
import { hudBrackets } from '../ui.js';
import { bench, policeStop, policeLight } from '../sets/night.js';
import { govHall } from '../sets/gov.js';
import { talk, breath, drift, ramp } from '../stage.js';

const PS = policeStop.anchors, GA = govHall.anchors, BA = bench.anchors;
/** Sets describe lights as {key, from, amount}; the rig wants {color, from, amount}. */
const LT = (l) => ({ color: l.color || l.key, from: l.from, amount: l.amount });

/** The lunchbox on the bench beside Adam: red even in the dark, a warm rim from the lamp above-left. */
function benchLunchbox(ctx, o) {
  const lamp = clamp(o.lamp ?? 1);
  lunchbox(ctx, { x: BA.seatMid.x + 36, y: BA.seatMid.y, size: 46, lum: 0.36 + 0.16 * lamp, tint: LOOK.rainNight.fill,
    light: { color: C.sodium, from: -1, amount: 0.25 + 0.5 * lamp }, shadow: 0.5 });
}

/** Adam folded over on the bench (a3_10) — also the end pose of a3_09. */
const FOLDED = { ...POSE.sitHunched, lean: 44, curl: 24, neck: 12, head: 30, armF: [6, 14], armB: [2, 12] };

export const shots = {
  // ── a3_01 ── the police stop. Adam pleads at left; two officers at right do not move. At `raise` a scanner comes up.
  a3_01_police(ctx, F) {
    const { t } = F, look = 'policeNight', ink = LOOK[look].ink;
    const raise = F.ev('raise');
    const cam = drift(F, { x: 900, y: 400, zoom: 1.0 }, { x: 850, y: 380, zoom: 1.08 }, { hand: 2 });
    const o = { look, cam };
    policeStop.back(ctx, F, o);
    policeStop.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // officer 2 (far right): arms folded, weight settled, a slow breath — nothing else.
      drawFigure(ctx, 'officer', { x: PS.officer2.x, y: 700, facing: -1, ...POSE.stand, lean: -2, head: 2, armF: [28, 118], armB: [22, 124], footF: [0.06, 0], footB: [-0.05, 0] },
        { ink, light: policeLight(t, PS.officer2.x), breath: breath(t, 1.2) * 0.6 });
      // officer 1: hand hanging, then at `raise` lifts the scanner to Adam's face (IK), beam 0 → 0.6.
      const kR = ramp(t, raise, 0.55, ease.inOutCubic);
      const handF = { x: lerp(PS.officer1.x - 4, PS.officer1.x - 150, kR), y: lerp(482, 318, kR) };
      const beam = 0.6 * ramp(t, raise + 0.45, 0.35, ease.outCubic);
      drawFigure(ctx, 'officer', { x: PS.officer1.x, y: 700, facing: -1, ...POSE.stand, lean: lerp(0, 4, kR), head: lerp(4, -2, kR), handF, armB: [-6, 10], footF: [0.05, 0], footB: [-0.06, 0] },
        { ink, light: policeLight(t, PS.officer1.x), breath: breath(t, 2.6) * 0.6,
          held: kR > 0.02 ? { front: (c) => scanner(c, { x: 0, y: 0, size: 52, rot: lerp(70, -8, kR), beam, beamLen: 240, beamSpread: 5, lum: 0.5, light: { color: C.policeBlue, from: 1, amount: 0.4 } }) } : {} });
      // Adam: open hands pleading → points back the way he came → recoils from the scanner.
      const plead = { ...POSE.stand, lean: 10, neck: 4, head: -6, armF: [58, 34], armB: [44, 40], handRotF: -30, handRotB: -30, footF: [0.08, 0], footB: [-0.06, 0] };
      const pointBack = { ...plead, lean: 6, head: -2, armF: [34, 50], armB: [-62, 6], handRotB: 0 };
      const recoil = { ...plead, lean: -5, neck: 0, head: -10, armF: [42, 70], armB: [24, 64], footF: [0.06, 0], footB: [-0.09, 0] };
      const pose = key(t, [[0, plead], [0.35, { ...plead, armF: [64, 30], armB: [50, 34] }], [1.05, plead], [1.35, plead], [1.85, pointBack], [2.6, pointBack], [raise + 0.25, plead], [raise + 0.75, recoil, ease.outCubic]]);
      drawFigure(ctx, 'adam', { x: PS.adam.x, y: 700, facing: 1, ...pose },
        { ink, light: policeLight(t, PS.adam.x), breath: breath(t, 0, 3.2) * 1.2 });
    });
    policeStop.front(ctx, F, o);
  },

  // ── a3_02 ── the scan. A close profile; a cyan line reads his face; the verdict slams in red.
  a3_02_scan(ctx, F) {
    const { t } = F, look = 'policeNight', ink = LOOK[look].ink;
    const sw = F.ev('sweep'), se = F.ev('sweepEnd'), st = F.ev('stamp');
    const cam = drift(F, { x: 690, y: 312, zoom: 2.95 }, { x: 684, y: 316, zoom: 3.1 }, { hand: 2 });
    const o = { look, cam };
    policeStop.back(ctx, F, o);
    policeStop.mid(ctx, F, o);
    const kSink = ramp(t, st + 0.1, 0.9, ease.inOutCubic);
    const red = t >= st;
    let A;
    camera(ctx, cam, 1, () => {
      A = drawFigure(ctx, 'adam', { x: PS.adam.x, y: 700, facing: 1, ...POSE.stand, lean: 4, head: lerp(-4, 4, kSink), neck: lerp(2, 6, kSink), curl: lerp(0, 6, kSink), armF: [8, 22], armB: [4, 18] },
        { ink, light: policeLight(t, PS.adam.x), breath: breath(t, 0, 2.4), catch: 0.4 * (1 - kSink) });
      const hd = A.head, r = A.head.r;
      const top = A.top.y - 4, bot = A.chin.y + r * 0.35;
      const bx0 = hd.x - r * 1.35, bx1 = hd.x + r * 1.55, by0 = top - r * 0.25, by1 = bot + r * 0.2;
      // scan line, sweeping down the face (limited to the head)
      if (t > sw - 0.05 && t < se + 0.25) {
        const k = ease.inOutSine(clamp((t - sw) / (se - sw)));
        const y = lerp(top, bot, k), a = clamp((t - sw + 0.05) / 0.15) * clamp((se + 0.25 - t) / 0.25);
        const x0 = hd.x - r * 1.15, x1 = hd.x + r * 1.35;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // a soft band trailing the line
        ctx.fillStyle = linGrad(ctx, 0, y - r * 0.5, 0, y, [[0, rgba(C.cyan, 0)], [1, rgba(C.cyan, 0.16 * a)]]);
        ctx.fillRect(x0, y - r * 0.5, x1 - x0, r * 0.5);
        const lg = linGrad(ctx, x0, 0, x1, 0, [[0, rgba(C.cyan, 0)], [0.18, rgba(C.cyan, 0.9 * a)], [0.82, rgba(C.cyan, 0.9 * a)], [1, rgba(C.cyan, 0)]]);
        ctx.fillStyle = lg; ctx.fillRect(x0, y - 1.6, x1 - x0, 3.2);
        ctx.fillStyle = linGrad(ctx, x0, 0, x1, 0, [[0, rgba(C.ice, 0)], [0.3, rgba(C.ice, 0.85 * a)], [0.7, rgba(C.ice, 0.85 * a)], [1, rgba(C.ice, 0)]]);
        ctx.fillRect(x0, y - 0.45, x1 - x0, 0.9);
        ctx.restore();
        glow(ctx, hd.x + r * 0.2, y, r * 1.1, C.cyan, 0.18 * a, 0.12);
        // the instant the line crosses the eye: a cyan glint, 0.15 s
        const tEye = sw + (se - sw) * invInOutSine(clamp((A.eye.y - top) / (bot - top)));
        const g = 0.8 * pulse(t, tEye - 0.03, tEye + 0.12, 0.03, 0.06);
        if (g > 0) { glow(ctx, A.eye.x, A.eye.y, r * 0.5, C.cyan, 0.7 * g); glow(ctx, A.eye.x, A.eye.y, r * 0.12, C.ice, g); }
      }
      // HUD brackets around the head: cyan while reading, red on the verdict
      const kb = ramp(t, sw - 0.25, 0.5, ease.linear);
      hudBrackets(ctx, bx0, by0, bx1 - bx0, by1 - by0, kb, { color: red ? C.alert : C.cyan, lw: 0.75, len: r * 0.5, spread: 16, alpha: 0.9 });
    });
    policeStop.front(ctx, F, o);

    // readout, upper right (screen space)
    const mono = { family: FONT.mono, weight: 500, size: 30, tracking: 3, align: 'right' };
    const fadeOut = 1 - ramp(t, st, 0.15, ease.linear) * 0.6;
    if (t > sw && t < se + 0.05) {
      const s = 'SCANNING…', k = clamp((t - sw) / 0.4);
      text(ctx, typeOn(s, k), 1830, 104, { ...mono, color: C.cyan, alpha: 0.6 + 0.4 * (Math.sin(t * 14) > -0.2 ? 1 : 0) });
      // a fine progress rule under it
      ctx.save(); ctx.fillStyle = rgba(C.cyan, 0.25); ctx.fillRect(1530, 120, 300, 2);
      ctx.fillStyle = rgba(C.cyan, 0.9); ctx.fillRect(1530, 120, 300 * clamp((t - sw) / (se - sw)), 2); ctx.restore();
    }
    if (t > se - 0.1) {
      const k = clamp((t - (se - 0.1)) / 0.35);
      const pct = (99.98 * ease.outCubic(k)).toFixed(2);
      text(ctx, `FACE MATCH: ADAM — ${pct}%`, 1830, 104, { ...mono, color: red ? mixHex(C.cyan, C.alert, 0.8) : C.cyan, alpha: clamp(k * 3) * fadeOut });
    }
    if (red) {
      // slam: scale 1.15 → 1 in 0.12 s, a brief red wash
      const ks = clamp((t - st) / 0.12), sc = lerp(1.15, 1, ease.outCubic(ks));
      const wash = 0.28 * Math.exp(-(t - st) * 5);
      if (wash > 0.004) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba(C.alert, wash); ctx.fillRect(0, 0, PW, PH); ctx.restore(); }
      ctx.save();
      ctx.translate(1170, 640); ctx.scale(sc, sc);
      ctx.fillStyle = 'rgba(8,4,6,0.6)'; ctx.fillRect(-640, -62, 1280, 88);
      text(ctx, 'IDENTITY STATUS: DEPRECATED', 0, 0, { family: FONT.mono, weight: 600, size: 64, tracking: 4, align: 'center', color: C.alert, alpha: clamp(ks * 4),
        shadow: { color: rgba(C.alert, 0.7), blur: 18 } });
      ctx.restore();
    }
  },

  // ── a3_03 ── the service counter. The list of a life checks out, line by line; the man does not.
  a3_03_gov(ctx, F) {
    const { t } = F, look = 'gov', ink = LOOK[look].ink;
    const c1 = F.ev('check1'), c2 = F.ev('check2'), c3 = F.ev('check3'), sl = F.ev('slump');
    const q2 = F.cue('a3_clerk2');
    const kc = ease.inOutSine(clamp(t / 6.5)), late = clamp((t - 6.5) / (F.T + 1 - 6.5));
    const cam = { x: lerp(1110, 1262, kc) + 6 * late, y: lerp(392, 326, kc) + 4 * late, zoom: lerp(1.1, 1.6, kc) + 0.06 * late, rot: 0 };
    const checks = ramp(t, c1, 0.3) + ramp(t, c2, 0.3) + ramp(t, c3, 0.3);
    const o = { look, cam, checks };
    govHall.back(ctx, F, o);
    // the clerk: reading from his terminal, then (not unkindly) looks up at Adam for a3_clerk2
    const kUp = ramp(t, q2.at - 0.5, 0.7);
    camera(ctx, cam, 1, () => {
      drawFigure(ctx, 'clerk', { x: GA.clerkSeat.x, y: 700, facing: -1, ...POSE.sit, seat: 150, lean: lerp(10, 4, kUp), head: lerp(16, -2, kUp), neck: lerp(4, 0, kUp),
        handF: { x: GA.clerkHands.x + 6 * kUp, y: GA.clerkHands.y }, handB: { x: GA.clerkHands.x + 18, y: GA.clerkHands.y + 2 } },
        { ink, light: LT(govHall.lightAt(look, GA.clerkSeat.x)), talk: talk(F, 'a3_clerk1', 'a3_clerk2'), breath: breath(t, 1.7) * 0.6 });
    });
    govHall.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // Adam: hands on the counter; looks up at each new line, leans in, grips harder; at `slump` his hands slide off.
      const grip = clamp(checks / 3);
      const kL = (tt) => ramp(t, tt - 0.1, 0.5);
      const look1 = Math.max(kL(c1), kL(c2), kL(c3)) * (1 - ramp(t, c3 + 1.2, 0.8)) * (1 - ramp(t, c1 + 0.9, 0.5) * (1 - ramp(t, c2 - 0.1, 0.4)));
      const kS = ramp(t, sl, 0.7, ease.inOutCubic), kH = ramp(t, sl + 0.5, 0.9, ease.inOutSine);
      const pose = {
        ...POSE.stand, lean: lerp(6, 14, grip) - 6 * kS, curl: 4 * grip + 10 * kS, neck: 4 + 6 * kS,
        head: lerp(2, -16, look1) + lerp(0, 8, kUp) * (1 - kS) + 24 * kS,
        footF: [0.07, 0], footB: [-0.05, 0],
      };
      const hf0 = { x: GA.handF.x + 10 * grip, y: GA.handF.y }, hb0 = { x: GA.handB.x + 8 * grip, y: GA.handB.y };
      const slideF = { x: lerp(hf0.x, GA.counterEdge.x - 6, kS), y: lerp(hf0.y, GA.counterEdge.y + 30, kS) };
      const slideB = { x: lerp(hb0.x, GA.counterEdge.x + 4, kS), y: lerp(hb0.y, GA.counterEdge.y + 26, kS) };
      pose.handF = { x: lerp(slideF.x, GA.handSlide.x - 8, kH), y: lerp(slideF.y, GA.handSlide.y - 6, kH) };
      pose.handB = { x: lerp(slideB.x, GA.handSlide.x - 22, kH), y: lerp(slideB.y, GA.handSlide.y - 12, kH) };
      drawFigure(ctx, 'adam', { x: GA.customer.x, y: 700, facing: 1, ...pose },
        { ink, light: LT(govHall.lights.gov), breath: breath(t, 0, 1.9) * (1 + 0.4 * grip) });
    });
    govHall.front(ctx, F, o);
  },

  // ── a3_05 ── the bench in the rain. A small man in a big wet night; he takes out his phone.
  a3_05_bench(ctx, F) {
    const { t } = F, look = 'rainNight', ink = LOOK[look].ink;
    const cam = drift(F, { x: 900, y: 380, zoom: 1.0 }, { x: 790, y: 392, zoom: 1.1 });
    const o = { look, cam, lamp: 1, rain: 1 };
    bench.back(ctx, F, o);
    bench.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      benchLunchbox(ctx, o);
      const ph = 3.8;
      const hunch = { ...POSE.sitHunched, lean: 34, curl: 20, head: 20 };
      const pocket = { ...hunch, lean: 26, armF: [-8, 40], head: 14 };
      const look2 = { ...hunch, lean: 30, head: 30, neck: 10, armF: [34, 112], handRotF: -20 };
      const pose = key(t, [[0, hunch], [ph - 0.6, hunch], [ph, pocket], [ph + 0.25, pocket], [ph + 1.0, look2]]);
      const showPhone = t > ph - 0.05;
      const pA = ramp(t, ph + 0.3, 0.6);
      drawFigure(ctx, 'adam', { x: BA.seatL.x, y: 700, facing: 1, ...pose },
        { ink, light: LT(bench.lightAt(look, BA.seatL.x, o)), breath: breath(t, 0.4, 1.3),
          held: showPhone ? { front: (c) => phoneSmall(c, { x: 0, y: 0, size: 37, rot: lerp(30, -75, pA), glow: pA > 0.3 ? '#dfe5ee' : null, face: -1, turn: 0.25, bloom: 0.3 * pA, lum: 0.4 }) } : {} });
    });
    bench.front(ctx, F, o);
  },

  // ── a3_09 ── watching the video, again and again. Warm light from the phone is the only warmth on him.
  a3_09_watch(ctx, F) {
    const { t } = F, look = 'rainNight', ink = LOOK[look].ink;
    const l2 = F.ev('loop2'), l3 = F.ev('loop3'), te = F.ev('tear'), lo = F.ev('lower');
    const cam = drift(F, { x: 740, y: 436, zoom: 2.75 }, { x: 733, y: 442, zoom: 2.88 });
    const o = { look, cam, lamp: 1, rain: 1 };
    bench.back(ctx, F, o);
    bench.mid(ctx, F, o);
    const flick = (noise1(t * 9, 4) - 0.5) * 0.3 + (noise1(t * 23, 9) - 0.5) * 0.08;
    const kLow = ramp(t, lo, 0.6, ease.inOutCubic);
    const warm = clamp(0.6 + flick) * (1 - kLow);
    const shakeA = clamp((t - 4.5) / 3) * (1 - 0.5 * kLow);
    const shake = shakeA * (Math.sin(t * TAU * 6.3) * 0.7 + Math.sin(t * TAU * 8.9 + 1) * 0.3);
    const kBow = ramp(t, lo, 1.1, ease.inOutCubic);
    let A;
    camera(ctx, cam, 1, () => {
      const pose = {
        ...POSE.sitHunched, lean: 12 + shake * 1.6 + 8 * kBow, curl: 14 + shake * 2.2 + 6 * kBow, neck: 6, head: lerp(18, 40, kBow) + shake * 0.8,
        handF: { x: lerp(800, 742, kLow), y: lerp(592, 604, kLow) }, handB: { x: lerp(784, 724, kLow), y: lerp(598, 608, kLow) },
      };
      const street = { color: mixHex(C.sodium, C.mist, 0.45), from: -1, amount: 0.45 };
      const phoneL = { color: C.honey, from: 1, amount: warm };
      const opts = { ink, breath: breath(t, 0.4, 2.2) * (1 + shakeA), tear: ramp(t, te, 1.6, ease.inOutSine), catch: 0.4 * warm / 0.6 };
      if (warm < 0.999 && kLow > 0) A = drawFigure(ctx, 'adam', { x: BA.seatL.x, y: 700, facing: 1, ...pose }, { ...opts, light: street, catch: 0 });
      if (kLow < 1) A = drawFigure(ctx, 'adam', { x: BA.seatL.x, y: 700, facing: 1, ...pose }, { ...opts, light: phoneL, alpha: 1 - kLow });
      // the screen's warm spill on the air in front of his face
      glow(ctx, A.chin.x + 80, A.chin.y + 110, 110, C.honey, 0.3 * warm);
    });
    bench.front(ctx, F, o);
    // picture-in-picture: the video, looping
    const ls = t < l2 ? 0 : t < l3 ? l2 : l3, ll = t < l2 ? l2 : t < l3 ? l3 - l2 : 3.0;
    const prog = clamp((t - ls) / ll);
    const pip = 1 - ramp(t, lo + 0.2, 0.6);
    if (pip > 0) drawPip(ctx, t, prog, t - ls, pip);
  },

  // ── a3_10 ── the wide again. Folded over. The streetlight stutters and dies.
  a3_10_dark(ctx, F) {
    const { t } = F, look = 'rainNight', ink = LOOK[look].ink;
    const fl = F.ev('flicker'), off = F.ev('off');
    const cam = drift(F, { x: 880, y: 385, zoom: 1.06 }, { x: 860, y: 392, zoom: 1.1 });
    const seq = [1, 0.2, 1, 0.4, 0.9, 0.1, 0.7, 0.05, 0.5, 0.15];
    let lamp = 1;
    if (t >= off) lamp = 0;
    else if (t >= fl) {
      const u = (t - fl) / (off - fl) * seq.length, i = Math.floor(u);
      lamp = seq[Math.min(i, seq.length - 1)] * (0.92 + 0.08 * noise1(t * 40, 2));
    }
    const o = { look, cam, lamp, rain: 1 };
    bench.back(ctx, F, o);
    bench.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      benchLunchbox(ctx, o);
      drawFigure(ctx, 'adam', { x: BA.seatL.x, y: 700, facing: 1, ...FOLDED },
        { ink, light: LT(bench.lightAt(look, BA.seatL.x, o)), breath: breath(t, 0.4, 1.1) * 0.7 });
    });
    bench.front(ctx, F, o);
  },
};

/** Inverse of ease.inOutSine. */
function invInOutSine(y) { return Math.acos(1 - 2 * clamp(y)) / Math.PI; }

/** The looping video as a small rounded thumbnail with a progress bar and a restart glyph (screen space). */
function drawPip(ctx, t, prog, since, alpha) {
  const x = 1500, y = 470, w = 340, h = 250, vh = 196;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 26;
  ctx.fillStyle = '#0b0d12'; rr(ctx, x, y, w, h, 16); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.save(); rr(ctx, x, y, w, vh, 16); ctx.clip();
  // the stage: warm back, a spot, bunting, boards
  ctx.fillStyle = linGrad(ctx, 0, y, 0, y + vh, [[0, '#6b3416'], [0.55, '#c2702e'], [1, '#e9a050']]);
  ctx.fillRect(x, y, w, vh);
  glow(ctx, x + w * 0.5, y + vh * 0.55, 150, C.honey, 0.7);
  for (let i = 0; i < 9; i++) {
    const bx = x + 10 + i * 40, sag = Math.sin((i / 8) * Math.PI) * 10;
    ctx.fillStyle = ['#f5c542', '#ffeacc', '#e8a04a'][i % 3];
    ctx.beginPath(); ctx.moveTo(bx, y + 18 + sag); ctx.lineTo(bx + 22, y + 18 + sag); ctx.lineTo(bx + 11, y + 36 + sag); ctx.fill();
  }
  ctx.fillStyle = '#5a2e12'; ctx.fillRect(x, y + vh - 26, w, 26);
  // two tiny silhouettes, the trophy lifted between them; the child bounces
  const ph = since;
  const jump = Math.max(0, Math.sin(ph * TAU * 1.6)) * 8 * clamp(ph / 0.8);
  const ink = '#1a0d06';
  drawFigure(ctx, 'v1', { x: x + 150, y: y + vh - 24, s: 0.36, facing: 1, ...POSE.stand, armF: [150, 16], armB: [10, 10], head: -10 },
    { ink, light: { color: C.cream, from: 1, amount: 0.5 }, aura: 0.45 });
  drawFigure(ctx, 'maya', { x: x + 205, y: y + vh - 24 - jump, s: 0.4, facing: -1, ...POSE.childArmsUp },
    { ink, light: { color: C.cream, from: -1, amount: 0.5 } });
  trophy(ctx, { x: x + 178, y: y + vh - 24 - 118 - jump * 0.4, size: 30, lum: 1, sparkle: 0.8, t });
  ctx.restore();
  // progress bar + restart glyph
  const by = y + vh + 24;
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; rr(ctx, x + 60, by - 3, w - 80, 6, 3); ctx.fill();
  ctx.fillStyle = C.honey; rr(ctx, x + 60, by - 3, Math.max(6, (w - 80) * prog), 6, 3); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 60 + (w - 80) * prog, by, 6, 0, TAU); ctx.fill();
  const pz = Math.exp(-since * 3.2);
  const gs = 1 + 0.35 * pz, gx = x + 32, gy = by;
  ctx.save(); ctx.translate(gx, gy); ctx.scale(gs, gs);
  ctx.strokeStyle = mixHex('#c9ced8', '#ffffff', pz); ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, 11, -Math.PI * 0.35, Math.PI * 1.45); ctx.stroke();
  const ax = Math.cos(-Math.PI * 0.35) * 11, ay = Math.sin(-Math.PI * 0.35) * 11;
  ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(ax + 6, ay - 2); ctx.lineTo(ax - 3, ay - 7); ctx.lineTo(ax - 1, ay + 5); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (pz > 0.02) glow(ctx, gx, gy, 40, C.honey, 0.5 * pz);
  ctx.restore();
}
