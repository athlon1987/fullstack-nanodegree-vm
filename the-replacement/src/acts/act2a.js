// Shots: a2_01_gate, a2_02_glass, a2_03_reverse, a2_04_run
// Each entry is (ctx, F) => void — see STYLE.md and src/engine.js.
import { camera, key, ease, clamp, lerp, TAU } from '../engine.js';
import { LOOK } from '../style.js';
import { drawFigure, POSE, mixPose, walkPhase } from '../rig.js';
import { lunchbox, accessCard } from '../props.js';
import { lobby, meetingGlass } from '../sets/office.js';
import { cityRun } from '../sets/street.js';
import { talk, breath, drift, ramp } from '../stage.js';

const LB = lobby.anchors, MG = meetingGlass.anchors, CR = cityRun.anchors;
const rim = (L, k = 1) => ({ color: L.key, from: L.from, amount: L.amount * k });

// Anchors of a pose without drawing it (a 2×2 probe canvas makes drawFigure return before painting).
let _probe = null;
function probe(who, pose) {
  if (!_probe) { const cv = document.createElement('canvas'); cv.width = 2; cv.height = 2; _probe = cv.getContext('2d'); }
  return drawFigure(_probe, who, pose, {});
}

// The red lunchbox hanging from a fist by its handle: undo the hand's rotation so it always hangs plumb.
function hangingLunchbox(swing, lum, tint, light) {
  return (c) => {
    const m = c.getTransform(), sc = Math.hypot(m.a, m.b);
    c.save(); c.setTransform(sc, 0, 0, sc, m.e, m.f);
    lunchbox(c, { x: 0, y: -2, size: 46, anchor: 'handle', wobble: swing, lum, tint, light });
    c.restore();
  };
}

// Run cycle: one cycle ≈ 2.2 body heights travelled.
const runPhase = (dist, h = 430) => dist / (2.2 * h);

export const shots = {
  // ── a2_01 ── lobby: Adam walks in, taps twice — DENIED, DENIED; the camera eases to the guard and his monitor.
  a2_01_gate(ctx, F) {
    const { t } = F, look = 'officeDay', ink = LOOK[look].ink;
    const b1 = F.ev('beep1'), b2 = F.ev('beep2'), g = F.cue('a2_guard');
    const move = ramp(t, 3.25, 1.45, ease.inOutCubic);
    const base = drift(F, { x: 1000, y: 402, zoom: 1.0 }, { x: 1010, y: 398, zoom: 1.04 });
    const cam = { x: lerp(base.x, 1555, move), y: lerp(base.y, 345, move), zoom: lerp(base.zoom, 2.25, move) + move * 0.04 * clamp((t - 4.7) / 2.3), rot: 0 };
    const reader = (t >= b1 && t < b1 + 0.5) || (t >= b2 && t < b2 + 0.5) ? 1 : 0;
    const o = { look, cam, reader, monitor: ramp(t, 3.5, 0.5), shafts: 1 };
    const L = rim(lobby.lights[look]);
    const lbLight = { color: L.color, from: -1, amount: 0.6 };

    // ── Adam: walk in at ~360 px/s, decelerate onto the gate mark by 1.25 s.
    const v = 360, tw = 0.8, td = 0.45, D = v * tw + v * td / 2;
    const dist = t < tw ? v * t : t < tw + td ? v * tw + v * (t - tw) - (v / (2 * td)) * (t - tw) ** 2 : D;
    const ax = LB.gateStand.x - D + dist;
    const stopK = ramp(t, 0.85, 0.5, ease.inOutSine);
    const walk = POSE.walk(walkPhase(dist, 'adam'), { swing: 18 });
    const standPose = { ...POSE.tapCard, lean: 4, armB: [-14, 8] };
    let pose = mixPose(walk, standPose, stopK);
    // front hand: IK from the walking hand to the reader and back (card), keyed on the beeps
    const fkHand = probe('adam', { x: ax, y: 700, facing: 1, ...pose }).handF;
    const R = { x: LB.reader.x - 4, y: LB.reader.y - 4 }, look1 = { x: 556, y: 438 }, look2 = { x: 548, y: 418 }, rest = { x: 540, y: 470 };
    const handK = key(t, [[0, 0], [0.75, 0], [1.2, 1]]);
    const tgt = key(t, [
      [0, rest], [b1 - 0.3, { x: R.x - 30, y: R.y - 6 }], [b1, R], [b1 + 0.35, R],
      [b1 + 0.85, look1], [b2 - 0.35, look1, ease.inOutSine], [b2, R], [b2 + 0.35, R],
      [b2 + 1.0, look2], [7, { x: 546, y: 422 }, ease.inOutSine],
    ]);
    pose.handF = { x: lerp(fkHand.x, tgt.x, handK), y: lerp(fkHand.y, tgt.y, handK) };
    // head: watches the reader, frowns down at the card, cocks it, then lifts toward the guard's voice
    pose.head = key(t, [[0, 2], [1.0, 2], [b1 - 0.15, 12], [b1 + 0.5, 12], [b1 + 0.95, 24], [b2 - 0.4, 24], [b2 - 0.05, 12], [b2 + 0.5, 12], [b2 + 1.0, 28], [g.at - 0.3, 28], [g.at + 0.3, 0], [7, 2]]);
    pose.neck = key(t, [[0, 0], [b2 + 0.6, 0], [b2 + 1.1, 6], [g.at - 0.3, 6], [g.at + 0.3, 2]]);
    pose.lean = pose.lean + key(t, [[0, 0], [b1, 3], [b1 + 0.6, 0], [b2, 3], [b2 + 0.6, 0]]);
    const lbSwing = (1 - stopK) * Math.sin(walkPhase(dist, 'adam') * TAU - 0.9) * 0.6 + stopK * Math.sin(Math.max(0, t - 1.0) * 3.2) * 0.25 * Math.exp(-Math.max(0, t - 1.0) * 1.6);
    const adamPose = { x: ax, y: 700, facing: 1, ...pose };
    const adamOpts = {
      ink, light: L, breath: breath(t), aura: 0,
      held: {
        front: (c) => accessCard(c, { x: 3, y: 0, size: 21, rot: 90, lum: 0.9, light: lbLight }),
        back: hangingLunchbox(lbSwing, 0.95, LOOK[look].fill, lbLight),
      },
    };

    // ── guard: idle, a glance at the beeps, down to the monitor, up to Adam, a thumb jerked over his shoulder.
    const gHead = key(t, [[0, 6], [b1 + 0.1, 6], [b1 + 0.5, 0], [b2 + 0.8, 0], [3.5, 0], [3.95, 24], [g.at - 0.45, 24], [g.at - 0.05, -2], [7, -2]]);
    const thumb = key(t, [[0, 0], [g.at + 0.15, 0], [g.at + 0.6, 1], [g.at + 0.75, 1.12, ease.inOutSine], [g.at + 1.0, 1], [6.2, 1], [6.8, 0]]);
    const guardPose = {
      x: LB.guardStand.x, y: 700, facing: -1, ...POSE.stand, head: gHead, neck: 4 + gHead * 0.15,
      armF: [lerp(10, 58, thumb), lerp(30, 150, Math.min(thumb, 1))], handRotF: -40 * thumb, armB: [-6, 20],
    };
    const guardOpts = { ink, light: rim({ key: L.color, from: -1, amount: 0.5 }), talk: talk(F, 'a2_guard'), breath: breath(t, 1.7) };

    lobby.back(ctx, F, o);
    lobby.reflect(ctx, F, o, (c) => { drawFigure(c, 'adam', adamPose, { ...adamOpts, light: null }); });
    camera(ctx, cam, 1, () => {
      drawFigure(ctx, 'guard', guardPose, guardOpts);
      drawFigure(ctx, 'adam', adamPose, adamOpts);
    });
    lobby.front(ctx, F, o);
  },

  // ── a2_02 ── over Adam's shoulder through the glass: V1 presents, the room applauds, V1 looks straight at us.
  a2_02_glass(ctx, F) {
    const { t } = F, look = 'officeDay', ink = LOOK[look].ink;
    const ap = F.ev('applause'), gl = F.ev('glance');
    const cam = drift(F, { x: 900, y: 390, zoom: 1.0 }, { x: 1010, y: 376, zoom: 1.14 });
    const o = { look, cam, chart: ramp(t, 0.3, 4.0, ease.inOutSine), view: 'through' };
    const RL = rim(meetingGlass.roomLight);
    const S = 0.82;

    meetingGlass.back(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // attendees: listen (small nods), then applaud from `applause` with different clap phases
      const seats = [['manager', MG.seat1, 0.0, 0.2], ['extraF', MG.seat2, 1.3, 0.55], ['extraM', MG.seat3, 2.1, 0.35], ['extraM', MG.seat5, 0.7, 0.8], ['extraF', MG.seat6, 1.8, 0.1]];
      seats.forEach(([who, st, ph, delay], i) => {
        const clapK = ramp(t, ap + delay * 0.4, 0.35);
        const clap = POSE.clap((t - ap) * 3.6 + ph * 0.37);
        const nod = Math.max(0, Math.sin(t * 0.9 + ph * 2.3)) ** 6 * 8;
        const pose = { x: st.x, y: 640, s: S, facing: 1, ...POSE.sit, seat: 90, lean: 4 + (i % 2) * 3, head: 4 + nod - clapK * 4 };
        if (clapK > 0) { pose.armF = mixPose(POSE.sit.armF, clap.armF, clapK); pose.armB = mixPose(POSE.sit.armB, clap.armB, clapK); }
        drawFigure(ctx, who, pose, { ink, light: RL, breath: breath(t, ph * 2) });
      });
      // V1: plumb, presenting to the table (facing left), gesturing back at the climbing line with easy confidence.
      const turnScreen = ramp(t, ap + 0.9, 0.5);              // after the applause he turns to admire the screen…
      // fractional facing: a ~5-frame turn to the screen, and a quick turn back toward the glass on `glance`
      const fK = key(t, [[0, 0], [ap + 0.95, 0], [ap + 1.2, 1, ease.inOutSine], [gl - 0.12, 1], [gl + 0.1, 0, ease.inOutSine]]);
      const facing = lerp(-1, 1, fK);
      const gestK = 1 - ramp(t, ap - 0.2, 0.6);
      const sw = Math.sin(t * 1.35);
      let v1 = { ...POSE.present, lean: -2 };
      v1.armF = [lerp(4, -40 - 14 * sw, gestK), lerp(10, -40 + 18 * sw, gestK)];
      v1.armB = [lerp(-4, 110 + 12 * Math.sin(t * 1.1 + 1), gestK), lerp(10, 20 + 18 * Math.sin(t * 0.8), gestK)];
      v1.head = key(t, [[0, 6], [ap, 6], [ap + 0.4, 14], [ap + 0.9, 4], [gl - 0.05, 2], [gl + 0.12, -6, ease.outCubic], [gl + 0.45, -2, ease.inOutSine], [9.6, -2]]);
      if (fK > 0) { v1.armF = mixPose(v1.armF, [lerp(-10, 8, turnScreen), 10], fK); v1.armB = mixPose(v1.armB, [-6, 14], fK); v1.head = lerp(v1.head, -4, fK); }
      drawFigure(ctx, 'v1', { x: MG.presenter.x, y: MG.presenter.y, s: S, facing, ...v1 },
        { ink, light: RL, aura: 0.45, glint: ramp(t, gl, 0.45), talk: t < ap ? 0.12 * Math.max(0, Math.sin(t * 5.3)) : 0, breath: breath(t, 2) * 0.4 });
    });
    meetingGlass.mid(ctx, F, { ...o, part: 'table' });
    // Adam's faint reflection on the glass, overlapping the man in the room
    const adamOTS = { ...POSE.stand, curl: 10, lean: 6, neck: 6, head: 10, armF: [6, 8], armB: [-4, 8] };
    camera(ctx, cam, 1, () => {
      drawFigure(ctx, 'adam', { x: MG.presenter.x - 40, y: 700, s: 0.95, facing: -1, ...adamOTS }, { ink: '#141b27', alpha: 0.15, aura: 0, breath: breath(t, 0.5) });
    });
    meetingGlass.mid(ctx, F, { ...o, part: 'glass' });
    // Adam in the corridor: a big dark back and shoulder at the left edge, no rim light
    camera(ctx, cam, 1.25, () => {
      drawFigure(ctx, 'adam', { x: MG.adamOTS.x - 20, y: MG.adamOTS.y, s: 2.2, facing: 1, ...adamOTS }, { ink: '#06080c', light: null, aura: 0, breath: breath(t, 0.5) });
    });
    meetingGlass.front(ctx, F, o);
  },

  // ── a2_03 ── reverse: Adam's profile at the glass, breath fogging it; he backs off a step, turns, bolts left.
  a2_03_reverse(ctx, F) {
    const { t } = F, look = 'officeDay', ink = LOOK[look].ink;
    const cam = drift(F, { x: 945, y: 318, zoom: 3.0 }, { x: 925, y: 322, zoom: 3.12 }, { hand: 1.2 });
    const rate = 3.6, br = breath(t, 0, rate);
    const fogLive = 0.8 * (0.5 + 0.5 * Math.sin(t * rate - 0.9)) ** 1.5;
    const fogK = 1 - ramp(t, 2.0, 1.1, ease.inOutSine);
    const o = { look, cam, view: 'edge', fog: fogLive * fogK + 0.35 * (1 - fogK) * Math.exp(-(t - 2.0) * 1.2) * (t > 2 ? 1 : 0) };
    const L = rim(meetingGlass.lights[look]);
    meetingGlass.back(ctx, F, o);
    camera(ctx, cam, 1, () => {
      const A = MG.adamGlass, back = ramp(t, 2.0, 0.55, ease.inOutCubic), turnT = 2.6;
      let pose, x;
      const facing = lerp(1, -1, ramp(t, turnT - 0.12, 0.2, ease.inOutSine));   // a 5-frame turn, not a snap
      if (t < turnT) {
        x = A.x - 70 * back;
        const stepK = clamp((t - 2.0) / 0.55);
        pose = { ...POSE.stand, lean: 3 - 5 * back, neck: 4 - 2 * back, head: -8 + 6 * back + Math.sin(t * rate) * 1.2,
          armF: [6 + 8 * back, 14], armB: [-4 - 10 * back, 12],
          footF: [0.035 - 0.16 * Math.sin(stepK * Math.PI) * (1 - stepK) - 0.16 * stepK * 0, -0.04 * Math.sin(stepK * Math.PI)],
        };
      } else {
        const rt = t - turnT, d = 0.5 * 1500 * Math.min(rt, 0.4) ** 2 + (rt > 0.4 ? 600 * (rt - 0.4) : 0);
        x = A.x - 70 - d;
        const startK = ramp(rt, 0, 0.18, ease.outQuad);
        pose = mixPose({ ...POSE.stand, lean: 6, head: -2 }, POSE.run(runPhase(d) + 0.15), startK);
      }
      drawFigure(ctx, 'adam', { x, y: 700, facing, ...pose }, { ink, light: L, breath: br, aura: 0 });
    });
    meetingGlass.front(ctx, F, o);
  },

  // ── a2_04 ── side tracking shot: Adam runs flat out toward home, screen RIGHT; the city streams past.
  a2_04_run(ctx, F) {
    const { t } = F, look = 'greyMorning', ink = LOOK[look].ink;
    const v = 1250, ax = CR.start.x + v * t;   // a sprint (~5 m/s): the run cycle, locked to distance, lands at ~1.3 strides/s
    const base = drift(F, { x: 0, y: 396, zoom: 1.0 }, { x: 0, y: 392, zoom: 1.05 }, { hand: 1.5, seed: 4 });
    const cam = { ...base, x: ax + 320 / base.zoom + base.x };
    const o = { look, cam, peds: 1, fg: 1, traffic: 1 };
    const L = rim(cityRun.lights[look]);
    cityRun.back(ctx, F, o);
    cityRun.mid(ctx, F, o);
    // passers-by on the pavement just behind his line, walking slowly the other way; they do not look at him
    const d = 0.8, gy = 430 + 270 * d;
    camera(ctx, cam, d, () => {
      [['extraM', 944, 0.0], ['extraF', 1580, 0.4], ['extraM', 2274, 0.75], ['extraF', 2950, 0.2], ['extraM', 3560, 0.55], ['extraF', 4240, 0.9], ['extraM', 4900, 0.3]].forEach(([who, w0, ph], i) => {
        const pd = 110 * t, px = w0 - pd;
        drawFigure(ctx, who, { x: px, y: gy, s: d, facing: -1, ...POSE.walk(walkPhase(pd, who, d) + ph), head: 6 },
          { ink: '#2a3446', light: rim({ key: L.color, from: 1, amount: 0.25 }), breath: breath(t, i) });
      });
    });
    camera(ctx, cam, 1, () => {
      const ph = runPhase(v * t);
      const pose = { ...POSE.run(ph), head: -2, neck: 8, curl: 4 };
      const swing = Math.sin(ph * TAU + 2.2) * 0.9;
      drawFigure(ctx, 'adam', { x: ax, y: 700, facing: 1, ...pose }, {
        ink, light: L, aura: 0, breath: 0,
        held: { front: hangingLunchbox(swing, 0.9, LOOK[look].fill, { color: '#cfdcee', from: 1, amount: 0.5 }) },
      });
    });
    // the out-of-focus foreground streaks past faster than parallax alone would carry it, so posts and
    // railings only flick across him (a post used to cover him completely for ~0.5 s)
    cityRun.front(ctx, F, { ...o, cam: { ...cam, x: cam.x + 600 * t } });
  },
};
