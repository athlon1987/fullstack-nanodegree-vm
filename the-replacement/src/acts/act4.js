// Shots: a4_01_dawn, a4_02_offer, a4_03_know, a4_05_last
// Each entry is (ctx, F) => void — see STYLE.md and src/engine.js.
//
// Act 4 — the offer. Grey dawn on the bench. Adam at seatL facing RIGHT, the representative at seatR
// facing LEFT. Her Program light (tablet, holographic cards, contract) is the only cyan in the frame.
import { camera, key, ease, clamp, lerp, rgba, rr, text, glow, scratch, FONT, TAU } from '../engine.js';
import { LOOK, C } from '../style.js';
import { drawFigure, POSE, mixPose } from '../rig.js';
import { lunchbox, tablet } from '../props.js';
import { bench } from '../sets/night.js';
import { emblem } from '../ui.js';
import { talk, breath, drift, ramp } from '../stage.js';

const B = bench.anchors;
const LOOKID = 'greyDawn';
const REP_H = 428;
const REP_SIT_HIP = (110 + 0.052 * REP_H) / ((0.245 + 0.25) * 0.996 * REP_H + 0.06 * REP_H); // seated pelvis as a fraction of standing

/** Anchors of a pose without drawing it (1x1 canvas → the rig returns before painting). */
const probe = (who, pose) => drawFigure(scratch('a4probe', 1, 1).ctx, who, pose);

/** drawFigure, plus `props(c)` drawn in WORLD coordinates between the body and the front arm (so a front hand lies over them). */
function figure(ctx, who, pose, opts, props) {
  const M = ctx.getTransform();
  return drawFigure(ctx, who, pose, props ? { ...opts, held: { front: (c) => { c.setTransform(M); props(c); } } } : opts);
}

/** The red lunchbox sitting in Adam's lap — lit enough to read red in the grey. */
function lapBox(c, lap, look = LOOKID) {
  return lunchbox(c, { x: lap.x + 4, y: lap.y + 1, size: 46, lum: 0.9, tint: LOOK[look].fill, light: { color: LOOK[look].key, from: 1, amount: 0.45 }, shadow: 0.3 });
}

/** Adam's hands resting on the box in his lap. */
const handsOnBox = (lap, sink = 0) => ({ handF: { x: lap.x + 17, y: lap.y - 24 + sink }, handB: { x: lap.x - 10, y: lap.y - 26 + sink } });

// ── Program holograms ──────────────────────────────────────────────────────────────────────────
const GLASS = '#07111a';

/** A slim translucent Program panel centred on (x, y), w × h world px; k = presence 0..1, fold = 0..1 (folds shut horizontally). */
function holoPanel(ctx, x, y, w, h, k, fold, draw) {
  const a = clamp(k) * (1 - clamp(fold));
  if (a <= 0.01) return;
  const sx = Math.max(0.02, 1 - ease.inOutCubic(clamp(fold)));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, 1);
  ctx.globalAlpha *= a;
  // soft cyan halo behind the glass
  glow(ctx, 0, 0, Math.max(w, h) * 0.75, C.cyan, 0.08);
  // dark glass
  rr(ctx, -w / 2, -h / 2, w, h, 9);
  ctx.fillStyle = rgba(GLASS, 0.62); ctx.fill();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, rgba(C.ice, 0.10)); g.addColorStop(0.35, rgba(C.ice, 0.02)); g.addColorStop(1, rgba(C.cyan, 0.06));
  ctx.fillStyle = g; ctx.fill();
  // cyan edge (glow) + ice hairline
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  rr(ctx, -w / 2, -h / 2, w, h, 9); ctx.strokeStyle = rgba(C.cyan, 0.22); ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
  rr(ctx, -w / 2, -h / 2, w, h, 9); ctx.strokeStyle = rgba(C.cyan, 0.9); ctx.lineWidth = 1.1; ctx.stroke();
  rr(ctx, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 6); ctx.strokeStyle = rgba(C.ice, 0.22); ctx.lineWidth = 0.6; ctx.stroke();
  draw(ctx, w, h);
  ctx.restore();
}

/** Stroke a path with the house glow: wide faint cyan + crisp ice core. */
function glowStroke(ctx, path, lw = 1.6) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  path(); ctx.strokeStyle = rgba(C.cyan, 0.25); ctx.lineWidth = lw * 3.2; ctx.stroke();
  ctx.restore();
  path(); ctx.strokeStyle = C.ice; ctx.lineWidth = lw; ctx.stroke();
}

const ICON = {
  key(ctx) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    glowStroke(ctx, () => {
      ctx.beginPath(); ctx.arc(-20, 0, 12, 0, TAU);
      ctx.moveTo(-8, 0); ctx.lineTo(28, 0); ctx.moveTo(18, 0); ctx.lineTo(18, 9); ctx.moveTo(25, 0); ctx.lineTo(25, 7);
      ctx.moveTo(-24, 0); ctx.arc(-20, 0, 4, Math.PI, Math.PI + TAU);
    });
  },
  coins(ctx) {
    glowStroke(ctx, () => {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const y = 14 - i * 8;
        ctx.moveTo(-16, y); ctx.lineTo(-16, y - 5);
        ctx.ellipse(-2, y - 5, 14, 4, 0, Math.PI, TAU); ctx.lineTo(12, y);
        ctx.ellipse(-2, y, 14, 4, 0, 0, Math.PI);
      }
      ctx.moveTo(26, 14); ctx.ellipse(20, 12, 4.5, 11, 0.35, 0, TAU);
    }, 1.4);
  },
  id(ctx) {
    ctx.lineJoin = 'round';
    glowStroke(ctx, () => {
      ctx.beginPath(); rr(ctx, -30, -19, 60, 38, 4);
      ctx.moveTo(-9, -6); ctx.arc(-15, -6, 6, 0, TAU);                              // the empty head
      ctx.moveTo(-26, 13); ctx.quadraticCurveTo(-15, -1, -4, 13);                    // shoulders
      ctx.moveTo(3, -8); ctx.lineTo(23, -8); ctx.moveTo(3, 0); ctx.lineTo(19, 0); ctx.moveTo(3, 8); ctx.lineTo(21, 8);
    }, 1.4);
  },
};

const CARDS = [
  { ev: 'card1', icon: 'key', label: ['APARTMENT'] },
  { ev: 'card2', icon: 'coins', label: ['MONTHLY', 'ALLOWANCE'] },
  { ev: 'card3', icon: 'id', label: ['NEW', 'IDENTITY'] },
];
const CARD_W = 136, CARD_H = 156, LABEL = 18.6;  // world px (≈ 225 × 260 and ≥ 30 px type at zoom ~1.65)

function card(ctx, x, y, k, fold, spec) {
  holoPanel(ctx, x, y, CARD_W, CARD_H, k, fold, (c, w, h) => {
    emblem(c, -w / 2 + 14, -h / 2 + 14, 5, { lw: 0.8, ticks: false, glow: 0.4 });
    c.fillStyle = rgba(C.cyan, 0.5); c.fillRect(-w / 2 + 26, -h / 2 + 13.5, w - 40, 0.7);
    c.save(); c.translate(0, -h * 0.14); ICON[spec.icon](c); c.restore();
    const n = spec.label.length, y0 = h * 0.22 - (n - 1) * LABEL * 0.6;
    spec.label.forEach((s, i) => text(c, s, 0, y0 + i * LABEL * 1.2, { size: LABEL, family: FONT.mono, weight: 600, color: C.ice, align: 'center', tracking: 1.2 }));
  });
}

function contract(ctx, x, y, k) {
  const w = 188, h = 224;
  holoPanel(ctx, x, y, w, h, k, 0, (c) => {
    emblem(c, 0, -h / 2 + 22, 8, { lw: 0.9, ticks: true, glow: 0.5 });
    text(c, 'RELINQUISHMENT', 0, -h / 2 + 58, { size: 18.5, family: FONT.mono, weight: 600, color: C.ice, align: 'center', tracking: 0.8 });
    text(c, 'OF PRIOR LIFE', 0, -h / 2 + 80, { size: 18.5, family: FONT.mono, weight: 600, color: C.ice, align: 'center', tracking: 0.8 });
    c.fillStyle = rgba(C.cyan, 0.55); c.fillRect(-w / 2 + 18, -h / 2 + 92, w - 36, 0.8);
    c.fillStyle = rgba('#8b9aa6', 0.55);
    const lens = [0.92, 0.84, 0.95, 0.7, 0.9, 0.5];
    lens.forEach((L, i) => c.fillRect(-w / 2 + 18, -h / 2 + 105 + i * 10, (w - 36) * L, 2.4));
    // the glowing signature line
    const sy = h / 2 - 30;
    c.save(); c.globalCompositeOperation = 'lighter';
    glow(c, 0, sy, 70, C.cyan, 0.22, 0.25);
    c.fillStyle = rgba(C.cyan, 0.35); c.fillRect(-w / 2 + 20, sy - 2, w - 40, 4);
    c.restore();
    c.fillStyle = C.ice; c.fillRect(-w / 2 + 20, sy - 0.6, w - 40, 1.2);
    text(c, '×', -w / 2 + 22, sy - 6, { size: 12, family: FONT.mono, color: C.cyan });
    text(c, 'SIGNATURE', 0, sy + 16, { size: 8, family: FONT.mono, color: rgba(C.ice, 0.6), align: 'center', tracking: 2 });
  });
}

/** Cold tablet light thrown up from (x, y). */
function tabletSpill(ctx, x, y, amt = 1) {
  glow(ctx, x, y - 10, 130, C.ice, 0.16 * amt, 0.9);
  glow(ctx, x, y - 4, 40, C.ice, 0.3 * amt, 0.6);
}

// ── the representative seated at seatR (facing left), very upright ──────────────────────────────
const repSit = (o = {}) => ({ x: B.seatR.x, y: 700, facing: -1, ...POSE.sit, lean: -3, curl: -2, neck: -2, head: 6, ...o });
/** Where her tablet lies on her thigh, and her hands on it. */
function repTablet(pose) {
  const A = probe('rep', pose);
  const tab = { x: lerp(A.lap.x, A.kneeF.x, 0.45), y: A.lap.y - 2 };
  return { A, tab, hands: { handF: { x: tab.x - 24, y: tab.y - 3 }, handB: { x: tab.x + 14, y: tab.y - 4 } } };
}
const tabletFlat = (c, tab, glowAmt = 1) => tablet(c, { x: tab.x, y: tab.y, size: 62, rot: -90, face: 1, turn: 0.28, bloom: 0.8 * glowAmt, lum: 0.7, tint: LOOK[LOOKID].fill });

export const shots = {
  // ── a4_01 ── dawn. Adam asleep upright on the bench; the car glides in; she walks to him and stands over him.
  a4_01_dawn(ctx, F) {
    const { t } = F, look = LOOKID, ink = LOOK[look].ink;
    const cam = drift(F, { x: 980, y: 400, zoom: 1.03 }, { x: 930, y: 408, zoom: 1.08 });
    const tCar = F.ev('car'), tSteps = F.ev('steps'), rep1 = F.cue('a4_rep1');
    const carX = lerp(2700, B.carStop.x, ease.outCubic(clamp((t - tCar) / 1.2)));
    const o = { look, cam, carX };
    bench.back(ctx, F, o);
    bench.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // Adam (left, faces right): asleep sitting up; wakes ~3.0 and his head lifts to her.
      const wake = ramp(t, 2.95, 1.1, ease.inOutSine);
      const look2 = ramp(t, 3.4, 0.9, ease.inOutSine);                  // lifts further to her face as she speaks
      const aPose = { x: B.seatL.x, y: 700, facing: 1, ...mixPose(POSE.sleepSit, POSE.sit, wake) };
      aPose.head = lerp(34, 4, wake) - look2 * 16;
      aPose.neck = lerp(12, 2, wake);
      aPose.curl = lerp(16, 8, wake);
      const lap = probe('adam', aPose).lap;
      Object.assign(aPose, handsOnBox(lap, (1 - wake) * 2));
      figure(ctx, 'adam', aPose, { ink, light: bench.lightAt(look, B.seatL.x, o), breath: breath(t, 0.3, lerp(1.1, 1.6, wake)) }, (c) => lapBox(c, lap));

    });
    // she stands in front of the bench: draw her after the seat's front edge
    bench.front(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // The representative: out of the car's kerbside door at `steps`, walks to him at full size on the pavement
      // (y 700) at a brisk, even pace, decelerates over her last half-step and stops over him.
      if (t >= tSteps - 0.05) {
        const STRIDE = 0.22, CYC = 4 * STRIDE * REP_H;             // one walk cycle covers CYC px
        const L = 1.25 * CYC;                                       // ends on phase .25: both feet under her
        const TW = 1.3, DEC = 0.45, v0 = L / (TW - DEC / 2);        // ≈ 430 px/s ≈ 1.75 m/s
        const tw = clamp(t - tSteps, 0, TW);
        const tc = TW - DEC;
        const dist = tw <= tc ? v0 * tw : v0 * tc + v0 * (DEC - Math.pow(TW - tw, 2) / DEC) / 2;
        const x = 868 + L - dist;
        const ph = Math.max(0, dist) / CYC;                          // phase from distance: the feet do not slide
        const stop = ramp(t, tSteps + TW - 0.2, 0.35, ease.inOutSine);
        const w = POSE.walk(ph, { stride: STRIDE, swing: 14 });
        const pose = { x, y: 700, s: 1, facing: -1, ...mixPose(w, POSE.stand, stop) };
        pose.armF = POSE.holdToChest.armF; pose.armB = [w.armB[0] * (1 - stop) * 0.6 + stop * 4, 14 * (1 - stop) + 8 * stop];
        pose.lean = lerp(3, -1, stop); pose.head = lerp(2, 16, ramp(t, tSteps + TW - 0.2, 0.8));
        pose.curl = -1;
        const R = probe('rep', pose);
        const alpha = clamp((t - tSteps) / 0.25);
        figure(ctx, 'rep', pose, { ink, light: bench.lightAt(look, x, o), talk: talk(F, 'a4_rep1'), breath: breath(t, 1.7) * stop, alpha }, (c) => {
          c.save(); c.globalAlpha *= alpha;
          tablet(c, { x: R.handF.x - 4, y: R.handF.y + 16, size: 62, rot: -6, face: -1, turn: 0.22, bloom: 0.6, lum: 0.7, tint: LOOK[look].fill });
          c.restore();
        });
      }
      void rep1;
    });
  },

  // ── a4_02 ── the offer: three holographic cards rise from her tablet; they fold away; the contract rises.
  a4_02_offer(ctx, F) {
    const { t } = F, look = LOOKID, ink = LOOK[look].ink;
    const cam = drift(F, { x: 801, y: 386, zoom: 1.62 }, { x: 801, y: 390, zoom: 1.72 });
    const o = { look, cam, carX: B.carStop.x };
    const rep3 = F.cue('a4_rep3'), tCon = F.ev('contract');
    bench.back(ctx, F, o);
    bench.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // the representative (right): bolt upright, tablet flat on her knee, hands on it
      const rPose = repSit({ head: key(t, [[0, 8], [0.6, 4], [tCon, 4], [tCon + 0.8, 10]]) });
      const { tab, hands } = repTablet(rPose);
      Object.assign(rPose, hands);
      // which hologram is "live" (Adam's eyes follow them)
      const kC = CARDS.map((cd) => ramp(t, F.ev(cd.ev), 0.8, ease.outCubic));
      const fold = ramp(t, rep3.at, 0.4);
      const kDoc = ramp(t, tCon, 1.0, ease.outCubic);

      // Adam (left): hands on the lunchbox; he looks at the cards, never at her
      const aHead = key(t, [[0, 14], [F.ev('card1') + 0.1, 14], [F.ev('card1') + 0.9, -14], [F.ev('card2') + 0.1, -14], [F.ev('card2') + 0.8, -17],
        [F.ev('card3') + 0.1, -17], [F.ev('card3') + 0.8, -12], [rep3.at, -12], [rep3.at + 0.6, 2], [tCon + 0.1, 2], [tCon + 1.0, -8], [12, -8]]);
      const aPose = { x: B.seatL.x, y: 700, facing: 1, ...POSE.sit, lean: 7, curl: 6, head: aHead, neck: 3 };
      const lap = probe('adam', aPose).lap;
      Object.assign(aPose, handsOnBox(lap));
      figure(ctx, 'adam', aPose, { ink, light: bench.lightAt(look, B.seatL.x, o), breath: breath(t, 0.3) }, (c) => lapBox(c, lap));

      figure(ctx, 'rep', rPose, { ink, light: bench.lightAt(look, B.seatR.x, o), talk: talk(F, 'a4_rep2', 'a4_rep3'), breath: breath(t, 2.1) * 0.6 }, (c) => tabletFlat(c, tab));
      tabletSpill(ctx, tab.x, tab.y, 1 + 0.4 * Math.max(...kC) * (1 - fold) + 0.4 * kDoc);

      // the cards: rise one at a time from the tablet into a row above and between them
      const slots = [{ x: 658, y: 266 }, { x: 806, y: 254 }, { x: 954, y: 266 }];
      CARDS.forEach((cd, i) => {
        const k = kC[i];
        if (k <= 0) return;
        const bob = Math.sin(t * 1.1 + i * 2) * 2.5 * k;
        const x = lerp(tab.x, slots[i].x, k), y = lerp(tab.y - 20, slots[i].y, k) + bob + fold * 30;
        // projection beam from the tablet
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.06 * k * (1 - fold);
        ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.moveTo(tab.x - 6, tab.y - 4); ctx.lineTo(tab.x + 6, tab.y - 4);
        ctx.lineTo(x + CARD_W * 0.4, y + CARD_H * 0.5); ctx.lineTo(x - CARD_W * 0.4, y + CARD_H * 0.5); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.translate(x, y); ctx.scale(lerp(0.3, 1, k), lerp(0.3, 1, k));
        card(ctx, 0, 0, clamp(k * 1.4), fold, cd);
        ctx.restore();
      });
      // the contract: one taller panel rising between them
      if (kDoc > 0) {
        const x = lerp(tab.x, 815, kDoc), y = lerp(tab.y - 30, 288, kDoc) + Math.sin(t * 0.9) * 2 * kDoc;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.06 * kDoc;
        ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.moveTo(tab.x - 6, tab.y - 4); ctx.lineTo(tab.x + 6, tab.y - 4);
        ctx.lineTo(x + 76, y + 112); ctx.lineTo(x - 76, y + 112); ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(x, y); ctx.scale(lerp(0.3, 1, kDoc), lerp(0.3, 1, kDoc));
        contract(ctx, 0, 0, clamp(kDoc * 1.4));
        ctx.restore();
      }
    });
    bench.front(ctx, F, o);
  },

  // ── a4_03 ── "Does she know?" Closer two-shot; she looks away, comes back: "She knows he's better." Hold on Adam.
  a4_03_know(ctx, F) {
    const { t } = F, look = LOOKID, ink = LOOK[look].ink;
    const know = F.cue('a4_know'), who = F.cue('a4_who'), dau = F.cue('a4_daughter'), better = F.cue('a4_better');
    const tAway = F.ev('away'), tBack = F.ev('back');
    const push = ramp(t, better.end + 0.3, F.T - better.end + 0.7, ease.inOutSine);
    const base = drift(F, { x: 801, y: 400, zoom: 2.28 }, { x: 801, y: 404, zoom: 2.36 });
    const cam = { ...base, x: lerp(base.x, 712, push), y: lerp(base.y, 398, push), zoom: base.zoom + push * 0.3 };
    const o = { look, cam, carX: B.carStop.x };
    bench.back(ctx, F, o);
    bench.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // Adam: head down for "Does she know?"; turns to her fully on "My daughter"; then only breath.
      const turn = ramp(t, dau.at - 0.35, 0.9, ease.inOutSine);
      const aPose = { x: B.seatL.x, y: 700, facing: 1, ...POSE.sit,
        lean: lerp(12, 5, turn), curl: lerp(12, 6, turn), neck: lerp(9, 2, turn),
        head: key(t, [[0, 26], [know.at - 0.2, 26], [know.end, 28], [dau.at - 0.35, 28], [dau.at + 0.55, -6, ease.inOutSine], [dau.end, -4], [30, -4]]) };
      const lap = probe('adam', aPose).lap;
      Object.assign(aPose, handsOnBox(lap));
      figure(ctx, 'adam', aPose, { ink, light: bench.lightAt(look, B.seatL.x, o), talk: talk(F, 'a4_know', 'a4_daughter'), breath: breath(t, 0.3, 1.4) }, (c) => lapBox(c, lap));

      // the representative: up at the contract → turns her head down to him on "Who?" → away (up, leaning back) → back, almost gently.
      const rHead = key(t, [[0, -8], [who.at - 0.25, -8], [who.at + 0.3, 9], [tAway, 9], [tAway + 0.8, -15, ease.inOutSine], [tBack, -15], [tBack + 0.6, 7, ease.inOutSine],
        [better.at + 0.2, 10], [30, 10]]);
      const rLean = key(t, [[0, -3], [who.at - 0.2, -3], [who.at + 0.4, -1], [tAway, -1], [tAway + 0.9, -7, ease.inOutSine], [tBack, -7], [tBack + 0.7, 0, ease.inOutSine], [better.at + 0.3, 1], [30, 1]]);
      const rPose = repSit({ head: rHead, lean: rLean });
      const { tab, hands } = repTablet(rPose);
      Object.assign(rPose, hands);
      figure(ctx, 'rep', rPose, { ink, light: bench.lightAt(look, B.seatR.x, o), talk: talk(F, 'a4_who', 'a4_better'), breath: breath(t, 2.1) * 0.6 }, (c) => tabletFlat(c, tab, 0.7));
      tabletSpill(ctx, tab.x, tab.y, 0.7);
    });
    bench.front(ctx, F, o);
  },

  // ── a4_05 ── she holds out her hand for the tablet; he draws it to his chest; "Can I see her, one last time?"; the nod; she rises.
  a4_05_last(ctx, F) {
    const { t } = F, look = LOOKID, ink = LOOK[look].ink;
    const cam = drift(F, { x: 800, y: 422, zoom: 1.7 }, { x: 788, y: 430, zoom: 1.84 });
    const o = { look, cam, carX: B.carStop.x };
    const tHold = F.ev('hold'), tNod = F.ev('nod'), tRise = F.ev('rise'), last = F.cue('a4_last');
    let repLater = null;
    bench.back(ctx, F, o);
    bench.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // ── Adam
      const pull = ramp(t, tHold, 0.75, ease.inOutCubic);
      const lift = ramp(t, last.at - 0.3, 0.8, ease.inOutSine);
      const down = ramp(t, tRise + 0.5, 1.1, ease.inOutSine);
      const close = ramp(t, tRise + 1.0, 0.9, ease.inOutCubic);
      const aPose = { x: B.seatL.x, y: 700, facing: 1, ...POSE.sit,
        lean: 8 - pull * 2 + down * 6, curl: 6 + pull * 8 + down * 4, neck: 4 + down * 4,
        head: 16 + pull * 6 - lift * 26 + down * 30 };
      const A0 = probe('adam', aPose), lap = A0.lap;
      // the tablet: held out over his knees → clutched flat against his chest
      const tabOut = { x: lap.x + 52, y: lap.y - 46, rot: 60 }, tabIn = { x: A0.chest.x + 30, y: A0.chest.y - 4, rot: 12 };
      const tb = { x: lerp(tabOut.x, tabIn.x, pull), y: lerp(tabOut.y, tabIn.y, pull), rot: lerp(tabOut.rot, tabIn.rot, pull) };
      const boxHand = { x: lap.x + 16, y: lap.y - 25 };
      aPose.handB = { x: tb.x + 2, y: tb.y + 16 };
      const fOnTab = { x: tb.x + 3, y: tb.y - 4 };
      aPose.handF = { x: lerp(fOnTab.x, boxHand.x, close), y: lerp(fOnTab.y, boxHand.y, close) - Math.sin(close * Math.PI) * 10 };
      figure(ctx, 'adam', aPose, { ink, light: bench.lightAt(look, B.seatL.x, o), talk: talk(F, 'a4_last'), breath: breath(t, 0.3, 1.3) }, (c) => {
        lapBox(c, lap);
        tablet(c, { x: tb.x, y: tb.y, size: 62, rot: tb.rot, face: -1, turn: lerp(0.3, 0.04, pull), bloom: lerp(0.7, 0.08, pull), lum: lerp(0.7, 0.35, pull), tint: LOOK[look].fill });
      });
      glow(ctx, tb.x, tb.y, 50, C.ice, lerp(0.14, 0.02, pull));

      // ── the representative: hand out for the tablet; waits; withdraws; studies him; the nod; rises.
      const reach = key(t, [[0, 0.15], [0.9, 1, ease.inOutSine], [tHold + 0.3, 1], [last.end + 0.6, 1], [last.end + 1.6, 0, ease.inOutSine]]);
      const up = ramp(t, tRise, 1.3, ease.inOutSine);
      const nod = ramp(t, tNod, 0.28, ease.inOutSine) - ramp(t, tNod + 0.36, 0.5, ease.inOutSine);
      const fwd = up * 0.2;                                           // pelvis travels forward over her feet as she rises
      const rPose = {
        x: B.seatR.x - fwd * REP_H, y: 700, facing: -1, ...POSE.sit, seat: undefined, hip: lerp(REP_SIT_HIP, 1, up),
        footF: [0.25 - fwd, 0], footB: [0.2 - fwd - 0.03 * up, 0],
        lean: key(t, [[0, -3], [tRise, -3], [tRise + 0.5, 22, ease.inOutSine], [tRise + 1.3, -1, ease.inOutSine], [30, -1]]),
        curl: -2, neck: -2,
        head: 6 + lerp(0, 4, ramp(t, last.end, 1.0)) + nod * 6 - ramp(t, tRise, 0.6) * 4 + ramp(t, tRise + 0.6, 0.8) * 8,
      };
      const R0 = probe('rep', rPose);
      const knee = { x: lerp(R0.lap.x, R0.kneeF.x, 0.5), y: R0.lap.y - 3 };
      const handOut = { x: tabOut.x + 32 - pull * 4, y: tabOut.y + 6 };
      const handRest = up > 0 ? null : knee;
      if (up <= 0) {
        rPose.handF = { x: lerp(knee.x, handOut.x, reach), y: lerp(knee.y, handOut.y, reach) - Math.sin(reach * Math.PI) * 8 };
        rPose.handB = { x: knee.x + 16, y: knee.y - 2 };
      } else {
        // standing: arms come down to her sides
        const k = ease.inOutSine(up);
        const sitF = { x: knee.x, y: knee.y }, sitB = { x: knee.x + 16, y: knee.y - 2 };
        const sideF = { x: R0.hip.x - 6, y: R0.hip.y + 92 }, sideB = { x: R0.hip.x + 8, y: R0.hip.y + 90 };
        rPose.handF = { x: lerp(sitF.x, sideF.x, k), y: lerp(sitF.y, sideF.y, k) };
        rPose.handB = { x: lerp(sitB.x, sideB.x, k), y: lerp(sitB.y, sideB.y, k) };
      }
      void handRest;
      const drawRep = (alpha = 1) => figure(ctx, 'rep', rPose, { ink, light: bench.lightAt(look, rPose.x, o), breath: breath(t, 2.1) * 0.6, alpha });
      // As she rises her legs come out from behind the seat's front edge: draw her behind it, then fade in a copy
      // in front of it over ~0.4 s (instead of switching layers in one frame, which popped the seat-edge line).
      const front = clamp((up - 0.12) / 0.3);
      if (front < 1) drawRep();
      if (front > 0) repLater = () => drawRep(front);
    });
    bench.front(ctx, F, o);
    if (repLater) camera(ctx, cam, 1, repLater);      // risen: she now stands in front of the seat's front edge
  },
};
