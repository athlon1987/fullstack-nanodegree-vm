// Shots: a7_01_week, a7_02_alarm, a7_03_morning, a7_04_walk, a7_06_stop
// Each entry is (ctx, F) => void — see STYLE.md and src/engine.js.
// (a7_02_alarm is implemented by the act1a animator.)
import { camera, key, ease, clamp, lerp, text, FONT } from '../engine.js';
import { LOOK, C } from '../style.js';
import { drawFigure, POSE, mixPose, walkPhase } from '../rig.js';
import { lunchbox, satchel, phoneSmall } from '../props.js';
import { kitchen } from '../sets/kitchen.js';
import { homeStreet } from '../sets/street.js';
import { breath, drift, ramp } from '../stage.js';

const K = kitchen.anchors, HS = homeStreet.anchors;
/** Set light {key, from, amount} → rig light {color, from, amount}. */
const rim = (L, k = 1) => ({ color: L.key || L.color, from: L.from, amount: L.amount * k });

/** A prop hanging plumb from a fist (undoes the hand's rotation, keeps scale and mirroring). */
function hanging(draw) {
  return (c) => {
    const m = c.getTransform(), sc = Math.hypot(m.a, m.b), fl = Math.sign(m.a * m.d - m.b * m.c) || 1;
    c.save(); c.setTransform(sc * fl, 0, 0, sc, m.e, m.f);
    draw(c);
    c.restore();
  };
}
const bagInHand = (lum, light, swing = 0) => hanging((c) => satchel(c, { x: 0, y: 0, size: 98, anchor: 'handle', rot: swing, lum, tint: LOOK.golden.fill, light }));
const phoneInHand = (alpha, light) => (c) => phoneSmall(c, { x: 0, y: 0, size: 37, rot: 8, glow: C.ice, turn: 0.2, bloom: 0.35, alpha, lum: 0.6, light });

// Adam's lighter walk: still his walk (rounded shoulders, head ahead), just a little lift in it.
const lightWalk = (dist) => POSE.walk(walkPhase(dist, 'adam'), { lift: 0.06, swing: 30 });

export const shots = {
  // ── a7_01 ── black card: "A week later."
  a7_01_week(ctx, F) {
    const { t, T } = F;
    ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1920, 804); ctx.restore();
    const a = ramp(t, 0, 0.6, ease.inOutSine) * (1 - ramp(t, T - 0.6, 0.6, ease.inOutSine));
    text(ctx, 'A week later.', 960, 402, { size: 64, family: FONT.serif, italic: true, weight: 500, color: C.cream, align: 'center', baseline: 'middle', alpha: a });
  },

  // ── a7_03 ── golden kitchen: toast, high-five, the kiss, he leaves — the lunchbox stays behind in the sun.
  a7_03_morning(ctx, F) {
    const { t } = F, look = 'golden', ink = LOOK[look].ink;
    const pop = F.ev('pop'), five = F.ev('five'), kiss = F.ev('kiss'), exit = F.ev('exit');
    const cam = drift(F, { x: 1150, y: 400, zoom: 1.1 }, { x: 1235, y: 410, zoom: 1.18 });
    const o = {
      look, cam, stool: 1, toastBurnt: 0, smoke: 0, toastCount: 2,
      toast: key(t, [[0, 0], [pop, 0], [pop + 0.14, 1, ease.outCubic]]),
      doorOpen: key(t, [[0, 0], [6.3, 0], [7.3, 1, ease.inOutSine]]),
    };
    const L = (x) => rim(kitchen.lightAt(look, x, o));
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);

    // ---- Adam: at the counter's left end (x 1215) facing right, then leaves left at `exit`.
    const turnT = kiss + 0.75;                       // he turns for the door
    const grab = exit;                               // hand closes on the satchel handle
    const BAG = { x: 862, y: K.tableTop.y };         // satchel standing on the table
    const bagHandle = { x: BAG.x, y: BAG.y - 70 };
    const ax = key(t, [[0, 1195], [turnT + 0.1, 1195], [grab, 905, ease.inCubic], [grab + 3, 905 - 3 * 400, ease.linear]]);
    const walking = t > turnT;
    const highMeet = { x: 1346, y: 346 };            // where the two palms meet
    camera(ctx, cam, 1, () => {
      // the satchel, on the table until he takes it
      if (t < grab) satchel(ctx, { x: BAG.x, y: BAG.y, size: 98, lum: 0.85, tint: LOOK[look].fill, light: L(BAG.x), shadow: 0.5 });
      // THE LUNCHBOX — in the patch of sun, untouched all shot
      lunchbox(ctx, { x: K.counterSun.x, y: K.counterSun.y, size: 46, lum: 1, light: { color: LOOK[look].key, from: 1, amount: 0.9, wash: 0.25 }, shadow: 0.6 });
    });
    kitchen.front(ctx, F, { ...o, part: 'furniture' });

    camera(ctx, cam, 1, () => {
      // ---- Maya on the step stool, facing left toward her dad.
      const mBase = { ...POSE.stand, lean: 10, head: 22, handF: { x: 1386, y: 470 }, armB: [8, 30] };
      const mPop = { ...POSE.stand, lean: -4, head: -6, armF: [40, 60], armB: [10, 30] };
      const mFive = { ...POSE.highFive, lean: 14, head: -18, armB: [6, 20] };
      const mAfter = { ...POSE.stand, lean: 8, head: 16, armF: [30, 50], armB: [6, 24] };
      let mp = key(t, [[0, mBase], [pop, mBase], [pop + 0.45, mPop], [five - 0.45, mPop], [five - 0.05, mFive], [five + 0.35, mFive], [five + 1.0, mAfter], [20, mAfter]]);
      const fiveK = ramp(t, five - 0.5, 0.45) * (1 - ramp(t, five + 0.3, 0.55));
      if (fiveK > 0.001) mp = { ...mp, handF: { x: lerp(1392, highMeet.x + 6, fiveK), y: lerp(470, highMeet.y, fiveK) } };
      else if (t < pop + 0.2) mp = { ...mp, handF: { x: 1386, y: 470 } };
      else delete mp.handF;
      drawFigure(ctx, 'maya', { x: K.stoolTop.x + 6, y: K.stoolTop.y, facing: -1, ...mp },
        { ink, light: L(1426), breath: breath(t, 1.2, 2.0) });

      // ---- Adam
      const aBase = { ...POSE.stand, lean: 6, head: 14, armB: [4, 10] };
      const aPop = { ...POSE.stand, lean: -3, head: 2, armB: [4, 10] };
      const aFive = { ...POSE.stand, lean: 4, head: 4, armB: [2, 10] };
      const aKiss = { ...POSE.stand, lean: 13, neck: 4, head: 16, armB: [4, 10] };
      let ap = key(t, [[0, aBase], [pop, aBase], [pop + 0.5, aPop], [five - 0.5, aPop], [five, aFive], [kiss - 0.7, aFive], [kiss - 0.05, aKiss], [kiss + 0.3, aKiss], [kiss + 0.75, aFive], [20, aFive]]);
      // his front hand: resting on the worktop → up to the high-five → down at his side
      const aFiveK = ramp(t, five - 0.55, 0.5) * (1 - ramp(t, five + 0.3, 0.6));
      const restK = 1 - ramp(t, five - 0.9, 0.4);
      let handF = null;
      if (aFiveK > 0.001) handF = { x: lerp(1248, highMeet.x - 6, aFiveK), y: lerp(472, highMeet.y, aFiveK) };
      else if (restK > 0.001) handF = { x: 1248, y: 472 };
      let facing = 1, x = ax;
      if (walking) {
        facing = -1;
        const d = 1195 - ax;
        const w = lightWalk(d + 40);
        const into = ramp(t, turnT, 0.35);
        ap = { ...mixPose({ ...aFive, head: 0 }, w, into), head: 2 };
        // reach for the satchel, close on it, and carry it
        const reach = ramp(t, grab - 0.45, 0.45);
        const carry = ramp(t, grab, 0.45);
        const carryPt = { x: x - 10, y: 700 - 430 * 0.475 };
        if (t < grab) handF = reach > 0.001 ? { x: lerp(x - 20, bagHandle.x, reach), y: lerp(560, bagHandle.y, reach) } : null;
        else handF = { x: lerp(bagHandle.x + (x - 905), carryPt.x, carry), y: lerp(bagHandle.y, carryPt.y, carry) };
        if (reach > 0.001 && t < grab + 0.5) ap = { ...ap, lean: ap.lean + 6 * reach * (1 - carry) };
      }
      const a = drawFigure(ctx, 'adam', { x, y: 700, facing, ...ap, ...(handF ? { handF } : {}) }, {
        ink, light: L(x), breath: walking ? 0 : breath(t, 0.4), posture: 0.75,
        held: t >= grab ? { front: bagInHand(0.85, L(x), Math.sin((t - grab) * 7) * 6 * (1 - ramp(t, grab, 1.2))) } : undefined,
      });

      // ---- His wife: in from the bedrooms doorway, reaches them by `kiss`, touches his arm.
      const wStart = K.hallDoor.x + 40, wEnd = 1292, wGo = 1.9, wArrive = kiss - 0.35;
      const wx = key(t, [[0, wStart], [wGo, wStart], [wArrive, wEnd, ease.inOutSine]]);
      const wd = wStart - wx;
      const wWalk = POSE.walk(walkPhase(wd, 'wife'), { swing: 20 });
      const settle = ramp(t, wArrive - 0.35, 0.4);
      const wKiss = { ...POSE.stand, lean: 7, head: -10, neck: -2, armB: [4, 8] };
      let wp = mixPose(mixPose(POSE.stand, wWalk, ramp(t, wGo - 0.1, 0.3) * (1 - settle)), wKiss, ramp(t, kiss - 0.6, 0.5) * (1 - ramp(t, kiss + 1.2, 0.6)));
      const touch = ramp(t, kiss - 0.1, 0.4) * (1 - ramp(t, turnT - 0.25, 0.35));
      if (touch > 0.001 && !walking) wp = { ...wp, handF: { x: lerp(wx - 28, a.elbowF.x + 4, touch), y: lerp(510, a.elbowF.y + 8, touch) } };
      if (t > wGo - 0.1) drawFigure(ctx, 'wife', { x: wx, y: 700, facing: -1, ...wp }, { ink, light: L(wx), breath: breath(t, 2.2), alpha: ramp(t, wGo - 0.1, 0.6, ease.inOutSine) });
    });
    kitchen.front(ctx, F, { ...o, part: 'air' });
  },

  // ── a7_04 ── he walks to work, LEFT, with a lift in his step; the phone buzzes; he slows, stops, takes it out.
  a7_04_walk(ctx, F) {
    const { t } = F, look = 'golden', ink = LOOK[look].ink;
    const buzz = F.ev('buzz');
    const x0 = 1720, v = (x0 - HS.stop.x) / (buzz + 0.5);  // constant pace, then a 1 s slow-down to a stop at `stop`
    const tau = clamp(t - buzz, 0, 1);
    const ax = x0 - v * Math.min(t, buzz) - v * (tau - tau * tau / 2);
    const dist = x0 - ax;
    const cam0 = drift(F, { x: 0, y: 402, zoom: 1.0 }, { x: 0, y: 398, zoom: 1.05 });
    const cam = { ...cam0, x: ax - 150 + cam0.x };
    const o = { look, cam, flare: 1, busX: null };
    homeStreet.back(ctx, F, o);
    homeStreet.mid(ctx, F, o);
    homeStreet.castShadow(ctx, o, ax, 430);
    const L = rim(homeStreet.lights.golden);
    // poses
    const stop = ramp(t, buzz, 1.0, ease.outSine);
    const w = lightWalk(dist);
    const pocket = { ...POSE.stand, head: 8, armF: [-14, 26], handRotF: 10, armB: [4, 8] };
    const look1 = { ...POSE.holdPhone, armB: [3, 8], head: 24 };
    let p = mixPose(w, { ...POSE.stand, armB: [3, 8] }, stop);
    p = mixPose(p, pocket, ramp(t, buzz + 0.2, 0.45) * (1 - ramp(t, buzz + 0.75, 0.5)));
    p = mixPose(p, look1, ramp(t, buzz + 0.75, 0.55));
    // when walking, the bag hand swings less (it carries weight)
    if (stop < 1) p = { ...p, armB: [p.armB[0] * 0.45, p.armB[1]] };
    const hasPhone = t > buzz + 0.62;
    camera(ctx, cam, 1, () => {
      drawFigure(ctx, 'adam', { x: ax, y: 700, facing: -1, ...p }, {
        ink, light: L, posture: 0.7, breath: breath(t, 0.3) * stop,
        held: {
          back: bagInHand(0.85, L, (1 - stop) * Math.sin(walkPhase(dist, 'adam') * Math.PI * 2 - 1) * 5),
          ...(hasPhone ? { front: phoneInHand(ramp(t, buzz + 0.62, 0.15), L) } : {}),
        },
      });
    });
    homeStreet.front(ctx, F, o);
  },

  // ── a7_06 ── wide: he has stopped dead over the phone; the morning flows past him.
  a7_06_stop(ctx, F) {
    const { t } = F, look = 'golden', ink = LOOK[look].ink;
    const cam = drift(F, { x: 1150, y: 402, zoom: 1.0 }, { x: 1150, y: 396, zoom: 1.07 });
    const o = { look, cam, flare: 1, busX: lerp(4000, -800, clamp(t / 3.6)), busDir: -1 };
    const L = rim(homeStreet.lights.golden);
    const ax = HS.stop.x;
    // passers-by: who, depth (<1 behind him, >1 in front), start x, speed (px/s, signed), phase offset
    const PEDS = [
      { who: 'extraM', d: 0.9, x: -120, v: 160, ph: 0.1 },
      { who: 'extraF', d: 0.95, x: 1500, v: -120, ph: 0.55 },
      { who: 'extraF', d: 0.92, x: 300, v: 130, ph: 0.3 },
      { who: 'extraM', d: 1.07, x: 2180, v: -190, ph: 0.8 },
      { who: 'extraF', d: 1.1, x: 600, v: 180, ph: 0.42 },
      { who: 'extraM', d: 1.04, x: 1500, v: -255, ph: 0.65 },
    ];
    const drawPed = (P) => {
      const s = P.d, px = P.x + P.v * t;
      const gy = 430 + 270 * P.d;
      const pose = { ...POSE.walk(walkPhase(Math.abs(P.v) * t, P.who, s) + P.ph, { swing: 22 }), head: 3 };
      camera(ctx, cam, P.d, () => drawFigure(ctx, P.who, { x: px, y: gy, s, facing: Math.sign(P.v), ...pose }, { ink, light: L, breath: 0 }));
    };
    homeStreet.back(ctx, F, o);
    homeStreet.mid(ctx, F, o);
    PEDS.filter((P) => P.d < 1).forEach(drawPed);
    homeStreet.castShadow(ctx, o, ax, 430);
    camera(ctx, cam, 1, () => {
      drawFigure(ctx, 'adam', { x: ax, y: 700, facing: -1, ...POSE.holdPhone, head: 26, armB: [3, 8] }, {
        ink, light: L, posture: 0.7, breath: 0,
        held: { back: bagInHand(0.85, L, 0), front: phoneInHand(1, L) },
      });
    });
    PEDS.filter((P) => P.d >= 1).forEach(drawPed);
    homeStreet.front(ctx, F, o);
  },
};
