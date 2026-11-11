// Shots: a6_01_doorway, a6_02_walk, a6_03_hug, a6_04_v1, a6_06_shutdown
// Each entry is (ctx, F) => void — see STYLE.md and src/engine.js.
import { camera, key, ease, clamp, lerp, mixHex, glow } from '../engine.js';
import { LOOK, C } from '../style.js';
import { drawFigure, POSE, mixPose, walkPhase } from '../rig.js';
import { lunchbox, softToy, phoneSmall } from '../props.js';
import { kitchen } from '../sets/kitchen.js';
import { talk, breath, drift, ramp } from '../stage.js';

const K = kitchen.anchors;
const LOOKN = 'lampNight';
const INK = LOOK[LOOKN].ink;
const HALL = '#ffc27a';                     // nightlight in the bedrooms hall, behind Maya

/** kitchen.lightAt → the rig's light format ({color, from, amount}). */
const lamp = (x, o, k = 1) => { const l = kitchen.lightAt(LOOKN, x, o); return { color: l.key, from: l.from, amount: l.amount * k }; };

/** The open lunchbox, still on the table from act 5 (between the two place settings, nearer Adam). */
function tableLunchbox(ctx, o) {
  lunchbox(ctx, { x: 782, y: 515, size: 46, open: 1, lum: 0.85, tint: LOOK[LOOKN].fill,
    light: { color: LOOK[LOOKN].key, from: 'above', amount: 0.9 }, shadow: 0.6 });
}

/** Soft toy hanging from a hand drawn by the rig (held prop: +x runs along the fingers, so rot -90 hangs it down). */
const toyHeld = (sway) => ({ back: (c) => softToy(c, { x: 0, y: 0, size: 72, rot: -90, sway, lum: 0.35, tint: LOOK[LOOKN].fill,
  light: { color: HALL, from: 1, amount: 0.5 } }) });
/** Same toy hanging in world space from a known point. */
const toyWorld = (ctx, x, y, sway, lum = 0.4) => softToy(ctx, { x, y, size: 72, sway, lum, tint: LOOK[LOOKN].fill,
  light: { color: LOOK[LOOKN].key, from: 1, amount: 0.6 } });

/** Maya's walk: speed profile integrated numerically (pure), from xs at t0 to xe at t1, easing in and out. */
function walkX(t, t0, t1, xs, xe, accel = 0.6, decel = 0.9) {
  const prof = (u) => Math.min(1, ease.inOutSine(clamp((u - t0) / accel)), ease.inOutSine(clamp((t1 - u) / decel)));
  const N = 80, area = (a, b) => { let s = 0; const h = (b - a) / N; for (let i = 0; i < N; i++) s += prof(a + (i + 0.5) * h) * h; return s; };
  const total = area(t0, t1), done = t <= t0 ? 0 : area(t0, Math.min(t, t1));
  return { x: lerp(xs, xe, done / total), dist: Math.abs(xe - xs) * done / total, speed: prof(t) };
}

export const shots = {
  // Close on Maya in the hall doorway; pull out wide; at `turn` both men turn their heads to her, identically.
  a6_01_doorway(ctx, F) {
    const { t } = F, turn = F.ev('turn');
    const cam = key(t, [
      [0, { x: 1730, y: 488, zoom: 2.6 }],
      [1.0, { x: 1724, y: 486, zoom: 2.64 }],
      [turn, { x: 1100, y: 432, zoom: 1.25 }, ease.inOutCubic],
      [F.T + 1, { x: 1100, y: 434, zoom: 1.3 }, ease.inOutSine],
    ]);
    const o = { look: LOOKN, cam, hallGlow: 1, lampSway: Math.sin(t * 0.5) * 0.05 };
    const kT = ramp(t, turn, 0.75, ease.inOutCubic);           // the shared turn — same curve for both men
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // Adam (left, faces right): forearms on the table as act 5 left him; lifts and turns his head to the door.
      drawFigure(ctx, 'adam', {
        x: K.seatL.x, y: 700, facing: 1, ...POSE.sitForward,
        head: lerp(2, -9, kT), lean: lerp(15, 7, kT), neck: lerp(0, -5, kT),
        handF: { x: lerp(690, 676, kT), y: 506 }, handB: { x: lerp(668, 656, kT), y: 508 },
      }, { ink: INK, light: lamp(K.seatL.x, o), breath: breath(t) });
      // V1 (right, faces left): turns round to her — facing flips at the midpoint while the head passes through neutral.
      const fl = kT < 0.5 ? -1 : 1, mid = Math.sin(Math.PI * kT);
      const hx = kT < 0.5 ? lerp(946, 1030, kT * 2) : lerp(1030, 1100, kT * 2 - 1);
      const hy = kT < 0.5 ? lerp(506, 560, kT * 2) : 560;
      drawFigure(ctx, 'v1', {
        x: K.seatR.x, y: 700, facing: fl, ...POSE.sit, lean: lerp(3, 1, kT) - mid * 2, head: lerp(0, -4, kT) - mid * 3,
        footF: kT < 0.5 ? [0.25, 0] : [lerp(0.06, 0.12, kT * 2 - 1), 0], footB: kT < 0.5 ? [0.2, 0] : [0.04, 0],
        handF: { x: hx, y: hy }, handB: { x: hx + (kT < 0.5 ? 12 : -10), y: hy + 1 },
      }, { ink: INK, light: lamp(K.seatR.x, o), breath: breath(t, 2) * 0.4, glint: 0.75, aura: 0.45 });
      tableLunchbox(ctx, o);
      // Maya in the doorway (faces left), lit from behind by the hall nightlight, toy hanging from her back hand.
      const settle = ramp(t, 3.3, 1.0, ease.inOutSine);
      drawFigure(ctx, 'maya', {
        x: K.hallDoor.x, y: 700, facing: -1, ...POSE.stand, head: 5 + settle * 4 - talk(F, 'a6_daddy') * 4, lean: 2,
        armF: [6, 10], armB: [-2, 12],
      }, { ink: INK, light: { color: HALL, from: 1, amount: 0.65 }, talk: talk(F, 'a6_daddy'), breath: breath(t, 1, 2.0),
        wear: { pyjamas: 1 }, held: toyHeld(Math.sin(t * 0.9) * 0.3) });
    });
    kitchen.front(ctx, F, o);
  },

  // Wide master: she walks right past V1's open arms, the length of the table, and into Adam's arms.
  a6_02_walk(ctx, F) {
    const { t } = F, start = F.ev('start'), pass = F.ev('pass'), hug = F.ev('hug');
    const cam = drift(F, { x: 1240, y: 430, zoom: 1.15 }, { x: 880, y: 436, zoom: 1.2 });
    const o = { look: LOOKN, cam, hallGlow: 1, lampSway: Math.sin(t * 0.5) * 0.05 };
    const STOP = 684;                                          // where she stops, in front of Adam
    const w = walkX(t, start, hug, K.hallDoor.x, STOP);
    const stopK = ramp(t, hug - 0.35, 0.6, ease.inOutCubic);
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    let adamA;
    camera(ctx, cam, 1, () => {
      // Adam: watches her, sees where she is going and lowers his head; swivels out from the table; head up at `hug`.
      const down = ramp(t, start + 0.5, 1.6, ease.inOutSine);
      const swivel = ramp(t, pass + 0.6, 1.5, ease.inOutCubic);
      const up = ramp(t, hug - 0.1, 0.6, ease.inOutCubic);
      const sw = mixPose(POSE.sitForward, POSE.hugSeated, swivel);
      adamA = drawFigure(ctx, 'adam', {
        x: K.seatL.x, y: 700, facing: 1, ...sw,
        head: lerp(-8, 24, down) - up * 26, lean: lerp(7, 14, down) - swivel * 4 - up * 4, neck: lerp(-4, 4, down) - up * 4,
        handF: { x: lerp(676, 640, swivel), y: lerp(506, 588, swivel) }, handB: { x: lerp(656, 622, swivel), y: lerp(508, 590, swivel) },
      }, { ink: INK, light: lamp(K.seatL.x, o), breath: breath(t) });
      // V1 standing right of the table, facing her; arms open; close on nothing at `pass`; turns to watch her ~0.5 s later.
      const open = key(t, [[0, 0.35], [start, 0.4], [pass - 0.4, 0.85, ease.inOutSine]]);
      const close = ramp(t, pass, 0.45, ease.inOutCubic), drop = ramp(t, pass + 0.6, 1.2, ease.inOutSine);
      const turnK = ramp(t, pass + 0.5, 0.7, ease.inOutCubic), fl = turnK < 0.5 ? 1 : -1, mid = Math.sin(Math.PI * turnK);
      let p = mixPose(POSE.stand, POSE.armsOpen, open);
      p = mixPose(p, { ...p, armF: [36, 84], armB: [30, 88] }, close);
      p = mixPose(p, { ...POSE.stand, head: 10, armF: [6, 10], armB: [-2, 10] }, drop);
      drawFigure(ctx, 'v1', { x: 1180, y: 700, facing: fl, ...p, head: p.head - mid * 3 },
        { ink: INK, light: lamp(1180, o), breath: breath(t, 2) * 0.4, glint: 0.7, aura: 0.45 });
      tableLunchbox(ctx, o);
    });
    // Maya walks along the FRONT of the table.
    kitchen.front(ctx, F, { ...o, part: 'furniture' });
    camera(ctx, cam, 1, () => {
      const ph = walkPhase(w.dist, 'maya', 1, 0.16);
      const walkP = mixPose(POSE.stand, POSE.walk(ph, { stride: 0.16, swing: 20 }), clamp(w.speed * 1.4));
      const neck = adamA.neck, hugK = ramp(t, hug - 0.25, 0.5, ease.inOutCubic);
      const p = mixPose(walkP, POSE.childHug, stopK);
      const pose = { x: w.x, y: 700, facing: -1, ...p, head: lerp(p.head, -10, stopK) };
      if (hugK > 0) {
        pose.handF = { x: lerp(w.x - 40, neck.x - 10, hugK), y: lerp(520, neck.y + 2, hugK) };
        pose.handB = { x: lerp(w.x - 36, neck.x - 22, hugK), y: lerp(522, neck.y - 4, hugK) };
      }
      const held = hugK < 0.5 ? toyHeld(Math.sin(t * 2.6) * 0.5 * w.speed + Math.sin(t * 0.9) * 0.2) : null;
      drawFigure(ctx, 'maya', pose, { ink: INK, light: lamp(w.x, o), breath: breath(t, 1, 2.0), wear: { pyjamas: 1 }, held });
      if (hugK >= 0.5) toyWorld(ctx, neck.x - 22, neck.y - 4, Math.sin(t * 1.3) * 0.4 * (1 - ramp(t, hug, 1.2)));
    });
    kitchen.front(ctx, F, { ...o, part: 'air' });
  },

  // Close on the hug in profile: her face in his shoulder; his arms come up; a6_how; she looks at him; he pulls her in; a tear.
  a6_03_hug(ctx, F) {
    const { t } = F, arms = F.ev('arms'), tight = F.ev('tight');
    const cam = drift(F, { x: 640, y: 432, zoom: 2.5 }, { x: 636, y: 424, zoom: 2.7 });
    const o = { look: LOOKN, cam, hallGlow: 1, lampSway: Math.sin(t * 0.5) * 0.05 };
    const how = F.cue('a6_how'), bec = F.cue('a6_because');
    const back = ramp(t, bec.at - 0.2, 0.9, ease.inOutSine) * (1 - ramp(t, tight - 0.3, 0.9, ease.inOutSine));
    const armsK = ramp(t, arms, 1.2, ease.inOutCubic), tightK = ramp(t, tight, 1.0, ease.inOutCubic);
    const lift = ramp(t, how.at - 0.15, 0.6, ease.inOutSine);
    const MX = 664 + back * 14;                                   // Maya's floor x (she leans back toward +x)
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    let adamA;
    camera(ctx, cam, 1, () => {
      tableLunchbox(ctx, o);
      // the toy hangs from her far hand, behind his neck
      toyWorld(ctx, 574 + back * 6, 448 + back * 2, Math.sin(t * 0.7) * 0.15, 0.3);
      // Adam (seated, faces right): arms hang, then close round her back; head lifts on a6_how; tightens at `tight`.
      const bx = MX + 3 - tightK * 5;
      adamA = drawFigure(ctx, 'adam', {
        x: K.seatL.x, y: 700, facing: 1, ...POSE.hugSeated,
        head: -2 - lift * 6 + back * 4 + tightK * 8, lean: -2 + back * 2 + tightK * 3, curl: 0, neck: -8 - lift * 2 + tightK * 3,
        handF: { x: lerp(600, bx, armsK), y: lerp(612, 498 + tightK * 4, armsK) },
        handB: { x: lerp(590, bx + 4, armsK), y: lerp(612, 480, armsK) },
      }, { ink: INK, light: lamp(K.seatL.x, o, 1.15), talk: talk(F, 'a6_how'), breath: breath(t), catch: 0.4,
        tear: ramp(t, tight, 1.5, ease.inOutSine) });
    });
    kitchen.front(ctx, F, { ...o, part: 'furniture' });
    camera(ctx, cam, 1, () => {
      // Maya (faces left), standing between his knees, arms round his neck.
      const neck = adamA.neck;
      drawFigure(ctx, 'maya', {
        x: MX, y: 700, facing: -1, ...POSE.childHug, lean: lerp(18, 4, back) + tightK * 2, head: lerp(16, -10, back) + tightK * 4,
        handF: { x: neck.x - 8 + back * 4, y: neck.y + 2 }, handB: { x: neck.x - 20 + back * 6, y: neck.y - 4 + back * 2 },
      }, { ink: INK, light: lamp(MX, o, 1.1), talk: talk(F, 'a6_knew', 'a6_because'), breath: breath(t, 1, 2.0), catch: 0.4, wear: { pyjamas: 1 } });
    });
    kitchen.front(ctx, F, { ...o, part: 'air' });
  },

  // Medium on V1 alone at the edge of the lamplight: he softens, a6_right, then the phone lights him cyan from below.
  a6_04_v1(ctx, F) {
    const { t } = F, soften = F.ev('soften'), phone = F.ev('phone');
    const cam = drift(F, { x: 1150, y: 432, zoom: 2.1 }, { x: 1156, y: 424, zoom: 2.22 });
    const o = { look: LOOKN, cam, hallGlow: 1, lampSway: Math.sin(t * 0.5) * 0.05 };
    const sl = ramp(t, soften, 1.2, ease.inOutSine);
    const reach = ramp(t, phone, 0.4, ease.inOutCubic), lift = ramp(t, phone + 0.45, 0.65, ease.inOutCubic);
    const lit = ramp(t, phone + 0.55, 0.5, ease.inOutSine);
    const X = 1180;
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      tableLunchbox(ctx, o);
      // the hug, as a6_03 ended it, at the far left edge of the frame
      const MX = 668;
      const a = drawFigure(ctx, 'adam', { x: K.seatL.x, y: 700, facing: 1, ...POSE.hugSeated, head: 22, lean: 17, neck: 3,
        handF: { x: MX + 10, y: 524 }, handB: { x: MX + 16, y: 500 } }, { ink: INK, light: lamp(K.seatL.x, o), breath: breath(t) });
      drawFigure(ctx, 'maya', { x: MX, y: 700, facing: -1, ...POSE.childHug, lean: 12, head: -2,
        handF: { x: a.neck.x - 8, y: a.neck.y + 2 }, handB: { x: a.neck.x - 20, y: a.neck.y - 4 } },
      { ink: INK, light: lamp(MX, o), breath: breath(t, 1, 2.0), wear: { pyjamas: 1 } });
      // V1 (faces left)
      const lampL = lamp(X, o, 1.6);
      const light = { color: mixHex(lampL.color, C.cyan, lit), from: -1, amount: lerp(lampL.amount, 0.8, lit) };
      const pocket = { x: X - 8, y: 548 }, held = { x: X - 46, y: 470 };
      const hand = { x: lerp(lerp(X - 20, pocket.x, reach), held.x, lift), y: lerp(lerp(560, pocket.y, reach), held.y, lift) };
      const look = mixPose({ ...POSE.stand, head: 6 }, POSE.holdPhone, lift);
      const pose = { x: X, y: 700, facing: -1, ...look, head: look.head + sl * 9 * (1 - lift), armB: [-2, 10] };
      if (reach > 0) pose.handF = hand;
      const showPhone = t >= phone + 0.38;
      const v = drawFigure(ctx, 'v1', pose, {
        ink: INK, light, breath: breath(t, 2) * 0.5, glint: 0.5, aura: 0.45, slouch: sl * 0.7, talk: talk(F, 'a6_right'),
        held: showPhone ? { front: (c) => phoneSmall(c, { x: 0, y: 0, size: 37, rot: lerp(70, 10, lift), glow: lit > 0.02 ? C.cyan : null,
          bloom: lit * 0.6, face: 1, turn: 0.25, lum: 0.5 }) } : null,
      });
      // the phone's light on his face and chest, from below
      if (lit > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        glow(ctx, v.handF.x - 4, v.handF.y - 10, 70, C.cyan, 0.22 * lit);
        ctx.restore();
      }
    });
    kitchen.front(ctx, F, o);
  },

  // Two-shot: Adam and Maya left, V1 right; V1's cyan drains; he sits, bows his head, the glint goes out, he is still.
  a6_06_shutdown(ctx, F) {
    const { t } = F, sit = F.ev('sit'), close = F.ev('close'), dark = F.ev('dark');
    const cam = drift(F, { x: 860, y: 438, zoom: 1.35 }, { x: 860, y: 444, zoom: 1.46 });
    const o = { look: LOOKN, cam, hallGlow: 1, lampSway: Math.sin(t * 0.55) * 0.15 };
    const wait = F.cue('a6_wait'), done = F.cue('a6_done');
    const step = ramp(t, wait.at - 0.1, 1.0, ease.inOutSine), handOut = ramp(t, wait.at + 0.1, 0.9, ease.inOutCubic);
    const handBack = ramp(t, done.end + 0.2, 1.4, ease.inOutSine);
    const sitK = ramp(t, sit, 1.7, ease.inOutCubic), bow = ramp(t, close, dark - close, ease.inOutSine);
    const still = 1 - ramp(t, close - 0.5, dark - close + 0.5, ease.inOutSine);
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      tableLunchbox(ctx, o);
      // V1: standing beside the right chair, facing them; smiles (head tilt) on a6_done; sits; bows; goes out.
      const smile = ramp(t, done.at - 0.2, 0.7, ease.inOutSine);
      const VX = lerp(1078, K.seatR.x, sitK);
      const seatedHip = 0.557;                                   // hip fraction equal to seat 110 for a 430 px adult
      const kneeF = { x: 944, y: 578 }, kneeB = { x: 956, y: 580 };
      const p = {
        ...POSE.stand, x: VX, y: 700, facing: -1,
        hip: lerp(1, seatedHip, sitK), lean: lerp(0, 4, sitK) + Math.sin(Math.PI * sitK) * 18 + bow * 6,
        head: 3 + smile * 7 * (1 - bow) + bow * 23, neck: bow * 8, curl: bow * 6,
        footF: [lerp(0.035, 0.25, sitK), 0], footB: [lerp(-0.03, 0.2, sitK), 0],
        handF: { x: lerp(VX - 14, kneeF.x, sitK), y: lerp(556, kneeF.y, sitK) },
        handB: { x: lerp(VX - 4, kneeB.x, sitK), y: lerp(558, kneeB.y, sitK) },
      };
      if (sitK >= 1) { delete p.hip; p.seat = 110; }
      const glint = 0.6 * (1 - ramp(t, close - 0.3, 0.3, ease.inOutSine)) * (t < close ? 1 : 0);
      drawFigure(ctx, 'v1', p, {
        ink: INK, light: lamp(VX, o), breath: breath(t, 2) * 0.4 * still, talk: talk(F, 'a6_done'),
        glint, aura: 0.45 * (1 - clamp(t / dark)), slouch: 0.4 * (1 - sitK * 0.3),
      });
    });
    kitchen.front(ctx, F, { ...o, part: 'furniture' });
    camera(ctx, cam, 1, () => {
      // Adam steps toward him (+50), hand out; Maya half behind his leg, holding his back hand, follows a little.
      const AX = 640 + step * 50, MX = 602 + ramp(t, wait.at + 0.25, 1.0, ease.inOutSine) * 32;
      const grip = { x: AX - 26, y: 520 };
      const aPh = walkPhase(step * 50, 'adam', 1, 0.12);
      const aw = Math.sin(Math.PI * step);
      const ap = mixPose(POSE.stand, POSE.walk(aPh, { stride: 0.12 }), aw);
      const out = handOut * (1 - handBack);
      const mp = mixPose(POSE.stand, POSE.walk(walkPhase((MX - 602), 'maya', 1, 0.1), { stride: 0.1 }), Math.sin(Math.PI * clamp((MX - 602) / 32)));
      drawFigure(ctx, 'maya', { x: MX, y: 700, facing: 1, ...mp, head: -8, lean: 2, armB: [0, 10], handF: { x: grip.x + 2, y: grip.y + 4 } },
        { ink: INK, light: lamp(MX, o, 0.9), breath: breath(t, 1, 2.0), wear: { pyjamas: 1 } });
      drawFigure(ctx, 'adam', {
        x: AX, y: 700, facing: 1, ...ap, lean: lerp(ap.lean, 8, out), head: -2 + out * 2,
        armF: [lerp(4, 82, out), lerp(8, 12, out)], handB: grip,
      }, { ink: INK, light: lamp(AX, o), breath: breath(t), talk: talk(F, 'a6_wait') });
    });
    kitchen.front(ctx, F, { ...o, part: 'air' });
  },
};
