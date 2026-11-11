// Shots: a2_05_door, a2_06_home, a2_07_who, a2_08_wife, a2_09_iam, a2_10_shut
// Each entry is (ctx, F) => void — see STYLE.md and src/engine.js.
import { camera, key, ease, clamp, lerp } from '../engine.js';
import { LOOK, C } from '../style.js';
import { drawFigure, POSE, mixPose, walkPhase } from '../rig.js';
import { lunchbox, wrench, cloth } from '../props.js';
import { kitchen } from '../sets/kitchen.js';
import { corridor } from '../sets/bedcorridor.js';
import { talk, breath, drift, ramp } from '../stage.js';

const K = kitchen.anchors;
const CA = corridor.anchors;
const WARM = 'warmDay';

/** Set lights are {key, from, amount}; the rig wants {color, from, amount}. */
const rim = (l, k = 1) => ({ color: l.key ?? l.color, from: l.from, amount: (l.amount ?? 0.5) * k });
const kLight = (x, o, k = 1) => rim(kitchen.lightAt(WARM, x, o), k);

/** Draw a hanging prop at the grip of a hand, kept upright in world space (lunchbox, cloth). */
const upright = (draw) => (c) => {
  const m = c.getTransform(), sc = Math.hypot(m.a, m.b);
  c.save(); c.setTransform(sc, 0, 0, sc, m.e, m.f); draw(c); c.restore();
};
/** Adam's red lunchbox hanging from his hand by its handle. */
const box = (lum, light, sway = 0, tint) => upright((c) => lunchbox(c, { x: 0, y: -2, size: 46, anchor: 'handle', handleUp: 1, wobble: sway, lum, light, tint }));

export const shots = {
  // ── The door opens: Adam in the frame, panting; he sees them and freezes. ──
  a2_05_door(ctx, F) {
    const { t } = F, ink = LOOK[WARM].ink;
    const tOpen = F.ev('open');
    const cam = drift(F, { x: 470, y: 452, zoom: 1.74 }, { x: 452, y: 446, zoom: 1.86 });
    const doorOpen = ramp(t, tOpen, 0.25, ease.outCubic);
    const o = { look: WARM, cam, doorOpen, cupboardOpen: 1 };
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      if (doorOpen <= 0.001) return;
      // panting after the run (fast, deep), then the look to screen right and a frozen, held breath
      const see = ramp(t, tOpen + 0.55, 0.7);
      const pant = (1 - see * 0.8) * breath(t, 0, 1.6 * 3);
      const pose = mixPose(
        { ...POSE.stand, lean: 13, curl: 6, head: 16, neck: 4, armB: [-8, 12], footF: [0.07, 0], footB: [-0.05, 0] },
        { ...POSE.stand, lean: 2, curl: 0, head: -7, neck: 2, armB: [-2, 8], footF: [0.06, 0], footB: [-0.04, 0] }, see);
      ctx.save();
      // revealed by the opening door (it swings in from its free right edge)
      if (doorOpen < 1) { ctx.beginPath(); ctx.rect(lerp(300, 60, doorOpen), -200, 2400, 1400); ctx.clip(); }
      drawFigure(ctx, 'adam', { x: K.doorStand.x + 6, y: 700, facing: 1, ...pose, lean: pose.lean + pant * 2.2, head: pose.head + pant * 2 }, {
        ink, light: kLight(K.doorStand.x, o, 1.1), breath: pant,
        held: { front: box(0.95, { color: LOOK[WARM].key, from: 1, amount: 0.8 }, 0.5 * Math.sin(t * 2.4) * (1 - see)) },
      });
      ctx.restore();
    });
    kitchen.front(ctx, F, o);
  },

  // ── The wide master: the family is happy without him. ──
  a2_06_home(ctx, F) {
    const { t } = F, ink = LOOK[WARM].ink;
    const tStand = F.ev('stand'), tLook = F.ev('look');
    const cam = drift(F, { x: 960, y: 402, zoom: 1.0 }, { x: 975, y: 410, zoom: 1.06 });
    const o = { look: WARM, cam, doorOpen: 1, cupboardOpen: 1, stool: 0 };
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // Adam: rigid in the doorway, a dark shape; lunchbox hanging.
      drawFigure(ctx, 'adam', { x: K.doorStand.x + 6, y: 700, facing: 1, ...POSE.stand, lean: 2, head: -5, armF: [2, 4], armB: [-3, 6] }, {
        ink, light: kLight(K.doorStand.x, o, 0.9), breath: breath(t, 0, 2.6) * 0.6,
        held: { front: box(0.95, { color: LOOK[WARM].key, from: 1, amount: 0.8 }) },
      });

      // V1: kneeling at the open sink cupboard working the wrench → rises, wipes his hands → turns to Adam.
      const vx = K.sink.x - 52;
      const up = ramp(t, tStand, 0.9);
      const wipe = clamp((t - tStand - 0.7) / 0.2) * (1 - ramp(t, tLook - 0.15, 0.3));
      const turned = t >= tLook + 0.12;
      const turnK = ramp(t, tLook, 0.4);
      const work = Math.sin(t * 4.2) * (1 - up);
      const kneel = { ...POSE.kneelWork };
      const standP = { ...POSE.stand, head: 4, lean: 1 };
      let pose = mixPose(kneel, standP, up);
      const vf = turned ? -1 : 1;
      // hands: on the pipe while working; together at the waist rubbing the cloth once up
      const pipe = { x: K.pipe.x + 4 + work * 6, y: K.pipe.y + 6 - Math.abs(work) * 4 };
      const waist = { x: vx + vf * 34, y: 552 };
      const rub = Math.sin((t - tStand) * 9) * 7 * wipe;
      const handF = up < 0.5 ? { x: lerp(pipe.x, waist.x, up * 2), y: lerp(pipe.y, waist.y, up * 2) } : { x: waist.x + rub, y: waist.y - 4 };
      const handB = up < 0.5 ? { x: lerp(pipe.x - 18, waist.x - vf * 8, up * 2), y: lerp(pipe.y + 10, waist.y + 4, up * 2) } : { x: waist.x - vf * 8 - rub, y: waist.y + 6 };
      const relax = turnK; // after the turn the hands drop to his sides, cloth hanging
      const v1Pose = { x: vx, y: 700, facing: vf, ...pose, head: lerp(pose.head, turned ? 6 : 4, turnK),
        ...(relax < 1 ? { handF: { x: lerp(handF.x, vx + vf * 18, relax), y: lerp(handF.y, 600, relax) }, handB: { x: lerp(handB.x, vx - vf * 6, relax), y: lerp(handB.y, 602, relax) } } : { armF: [8, 10], armB: [-4, 8] }) };
      const heldV1 = t < tStand + 0.45
        ? { front: (c) => wrench(c, { x: 0, y: 0, size: 58, rot: -10, lum: 0.8, light: { color: LOOK[WARM].key, from: 1, amount: 0.6 } }) }
        : { front: upright((c) => cloth(c, { x: 0, y: 0, size: 64, sway: Math.sin(t * 3) * 0.3, lum: 0.85, light: { color: LOOK[WARM].key, from: 1, amount: 0.5 } })) };
      drawFigure(ctx, 'v1', v1Pose, {
        ink, light: kLight(vx, o), breath: breath(t, 2) * 0.4, aura: 0.45, glint: 0.6, held: heldV1, talk: talk(F, 'a2_early'),
      });

      // Wife: leaning back on the counter, laughing (head rocks back) → the laugh dies; she turns to the door after him.
      const wx = vx - 150;
      const laugh = 1 - ramp(t, tLook - 0.2, 0.6);
      const wTurn = t >= tLook + 0.55;
      const rock = (Math.sin(t * 7.5) * 0.5 + 0.5) * laugh;
      const wPose = mixPose({ ...POSE.leanBack, armF: [-20, -30], armB: [-26, -34] }, { ...POSE.stand, head: 6, lean: 2, armF: [10, 40], armB: [-2, 10] }, ramp(t, tLook + 0.3, 0.6));
      drawFigure(ctx, 'wife', { x: wx, y: 700, facing: wTurn ? -1 : 1, ...wPose, head: wPose.head - rock * 10, lean: wPose.lean - rock * 4 }, {
        ink, light: kLight(wx, o), breath: breath(t, 1) * (0.5 + laugh * 0.5), talk: rock * 0.5,
      });

      // Maya: crouched on his other side handing a tool up → stands and looks to the door after them.
      const mx = vx + 128;
      const mTurn = t >= tLook + 0.8;
      const mUp = ramp(t, tLook + 0.6, 0.7);
      const offer = 1 - ramp(t, tStand, 0.5);
      const reach = Math.sin(t * 1.3) * 3;
      const mPose = mixPose({ ...POSE.crouch, head: -16, lean: 18 }, { ...POSE.stand, head: 2 }, mUp);
      drawFigure(ctx, 'maya', { x: mx, y: 700, facing: mTurn ? -1 : -1, ...mPose,
        ...(offer > 0.02 ? { handF: { x: lerp(mx - 22, mx - 58, offer), y: lerp(640, 556 + reach, offer) } } : { armF: [6, 12] }) }, {
        ink, light: kLight(mx, o), breath: breath(t, 3, 2.2) * 0.6,
        held: offer > 0.02 ? { front: (c) => wrench(c, { x: 0, y: 0, size: 40, rot: 0, lum: 0.8, light: { color: LOOK[WARM].key, from: 1, amount: 0.6 } }) } : undefined,
      });
    });
    kitchen.front(ctx, F, o);
  },

  // ── "Who the hell are you?" Two identical silhouettes; Maya hides behind the copy. ──
  a2_07_who(ctx, F) {
    const { t } = F, ink = LOOK[WARM].ink;
    const tHide = F.ev('hide'), who = F.cue('a2_who');
    const cam = drift(F, { x: 800, y: 438, zoom: 1.86 }, { x: 812, y: 440, zoom: 1.96 }, { hand: 2 });
    const o = { look: WARM, cam, cupboardOpen: 1, stool: 0 };
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    kitchen.front(ctx, F, { ...o, part: 'furniture' });
    camera(ctx, cam, 1, () => {
      const v1x = 980;
      // Wife, further right, a hand at her mouth.
      const wx = 1210;
      const mouthUp = ramp(t, who.at + 0.1, 0.6);
      drawFigure(ctx, 'wife', { x: wx, y: 700, facing: -1, ...POSE.stand, lean: -2, head: 4, curl: 4,
        handF: { x: lerp(wx - 16, wx - 30, mouthUp), y: lerp(560, 346, mouthUp) } }, { ink, light: kLight(wx, o, 0.9), breath: breath(t, 1.3) });

      // Maya: runs from the right to behind V1's legs and clutches his knee (drawn before V1 → behind him).
      const run = clamp((t - tHide) / 0.95);
      const runE = ease.inOutSine(run);
      const mx = lerp(1250, v1x + 34, runE);
      const kneeF = { x: v1x - 6, y: 594 };
      const runPose = POSE.run((1250 - mx) / (2.2 * 285));
      const clutch = { ...POSE.stand, lean: 12, curl: 6, head: -4, neck: 2, armB: [40, 70], footF: [0.04, 0], footB: [-0.05, 0] };
      const mBlend = ramp(t, tHide + 0.7, 0.4);
      const mPose = t < tHide ? { ...POSE.stand, head: 4, armF: [4, 20] } : mixPose(runPose, clutch, mBlend);
      drawFigure(ctx, 'maya', { x: mx, y: 700, facing: -1, ...mPose, ...(mBlend > 0 ? { handF: { x: lerp(mx - 40, kneeF.x, mBlend), y: lerp(560, kneeF.y, mBlend) } } : {}) }, {
        ink, light: kLight(mx, o, 0.8), breath: breath(t, 3, 2.4) * 0.5,
      });

      // V1: upright and perfectly still, facing Adam. Does not flinch.
      drawFigure(ctx, 'v1', { x: v1x, y: 700, facing: -1, ...POSE.stand, armF: [3, 6], armB: [-3, 6] }, {
        ink, light: kLight(v1x, o), breath: breath(t, 2) * 0.35, aura: 0.45, glint: 0.6,
      });

      // Adam: steps in and throws his arm out on the line, chest heaving; the arm sinks afterwards.
      const step = ramp(t, who.at - 0.6, 0.75);
      const ax = lerp(560, 640, step);
      const walking = t > who.at - 0.6 && t < who.at + 0.15;
      const base = walking ? mixPose(POSE.walk(walkPhase(ax - 560, 'adam')), POSE.stand, ramp(t, who.at - 0.1, 0.25)) : POSE.stand;
      const throwK = ramp(t, who.at - 0.05, 0.3, ease.outCubic) * (1 - ramp(t, who.end + 1.6, 1.2));
      const pose = mixPose({ ...base, lean: 6, head: 4, armB: [-6, 10] }, { ...POSE.point, head: -4, armB: [-14, 14] }, throwK);
      const heave = breath(t, 0, 4.2);
      drawFigure(ctx, 'adam', { x: ax, y: 700, facing: 1, ...pose, lean: pose.lean + heave * 1.5 }, {
        ink, light: kLight(ax, o, 1.1), breath: heave, talk: talk(F, 'a2_who'),
        held: { back: box(0.95, { color: LOOK[WARM].key, from: 1, amount: 0.8 }, Math.sin(t * 3) * 0.3 * (1 - step)) },
      });
    });
    kitchen.front(ctx, F, { ...o, part: 'air' });
  },

  // ── The wife: "Adam, please." Embarrassed; then she turns away. ──
  a2_08_wife(ctx, F) {
    const { t } = F, ink = LOOK[WARM].ink;
    const line = F.cue('a2_please');
    const cam = drift(F, { x: 1150, y: 410, zoom: 2.36 }, { x: 1158, y: 414, zoom: 2.5 });
    const o = { look: WARM, cam, cupboardOpen: 1, stool: 0 };
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      const wx = 1180;
      const away = ramp(t, line.end + 0.25, 0.9);
      const turned = t >= line.end + 0.6;
      // Maya pressed against her side (behind her, right), head to her hip
      drawFigure(ctx, 'maya', { x: wx + 58, y: 700, facing: -1, ...POSE.stand, lean: 10, curl: 6, head: 12 + away * 4, armF: [52, 60], armB: [44, 70] }, {
        ink, light: kLight(wx + 58, o, 0.8), breath: breath(t, 3, 2.2) * 0.5,
      });
      // she: hand out low, palm down, head down; talks; then her head turns down and away
      const outK = ramp(t, line.at - 0.5, 0.6) * (1 - ramp(t, line.end + 0.4, 0.9));
      const lift = Math.sin(t * 2.2) * 2 * outK;
      const pose = mixPose({ ...POSE.stand, head: 14, lean: 3, curl: 6 }, { ...POSE.stand, head: 18, neck: 6, lean: 5, curl: 8 }, outK);
      drawFigure(ctx, 'wife', { x: wx, y: 700, facing: turned ? 1 : -1, ...pose, head: lerp(pose.head, 30, away), neck: lerp(pose.neck, 8, away),
        handF: { x: lerp(wx - 6 * (turned ? -1 : 1), wx - 82, outK), y: lerp(574, 520 + lift, outK) }, handRotF: -12 * outK, armB: [-2, 10] }, {
        ink, light: kLight(wx, o, 1.1), breath: breath(t, 1), talk: talk(F, 'a2_please'),
      });
    });
    kitchen.front(ctx, F, o);
  },

  // ── "I'm you. Without the limitations." The mirror; the glint; the hand on the shoulder. ──
  a2_09_iam(ctx, F) {
    const { t } = F, ink = LOOK[WARM].ink;
    const tGlint = F.ev('glint'), tHand = F.ev('hand'), line = F.cue('a2_iam');
    const cam = drift(F, { x: 1062, y: 330, zoom: 2.6 }, { x: 1056, y: 334, zoom: 3.0 });
    const o = { look: WARM, cam, cupboardOpen: 1, stool: 0 };
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // Adam (left, facing right): heaving, head sinks after the line; yields toward screen left at the touch.
      const sink = ramp(t, line.end + 0.2, 1.2);
      const yieldK = ramp(t, tHand + 0.7, 1.6);
      const ax = 900 - yieldK * 26;
      const heave = breath(t, 0, lerp(3.4, 2.0, sink));
      const a = drawFigure(ctx, 'adam', { x: ax, y: 700, facing: 1, ...POSE.stand, head: lerp(-2, 20, sink) + yieldK * 4, neck: sink * 6, curl: sink * 6,
        lean: lerp(4, 1, yieldK) + heave * 1.2, hipX: -yieldK * 0.012, armB: [-4, 8] }, {
        ink, light: kLight(ax, o, 1.1), breath: heave * (1 - sink * 0.5), catch: 0.4,
        held: { back: box(0.95, { color: LOOK[WARM].key, from: 1, amount: 0.8 }) },
      });
      // V1 (right, facing left): calm, kind; glint rises to 1; lays his hand on Adam's shoulder.
      const vx = 1222;
      const handK = ramp(t, tHand, 0.85);
      const rest = { x: vx - 22, y: 600 };
      const sh = { x: a.shoulder.x + 6, y: a.shoulder.y - 4 };
      const glint = lerp(0.6, 1, ramp(t, tGlint, 0.35));
      drawFigure(ctx, 'v1', { x: vx, y: 700, facing: -1, ...POSE.stand, head: 2 + handK * 4, lean: handK * 3,
        handF: { x: lerp(rest.x, sh.x, handK), y: lerp(rest.y, sh.y, handK) - Math.sin(handK * Math.PI) * 18 }, armB: [-3, 6] }, {
        ink, light: kLight(vx, o), breath: breath(t, 2) * 0.35, aura: 0.45, glint, talk: talk(F, 'a2_iam'),
      });
    });
    kitchen.front(ctx, F, o);
  },

  // ── Shut out: the door closes on the warm light; three warm shapes behind the glass; forehead to the door. ──
  a2_10_shut(ctx, F) {
    const { t } = F, look = 'corridor', ink = LOOK[look].ink;
    const tClose = F.ev('close'), tLock = F.ev('lock');
    const cam = drift(F, { x: 1262, y: 404, zoom: 1.5 }, { x: 1170, y: 410, zoom: 1.25 });
    const doorOpen = 0.6 * (1 - ramp(t, tClose, 0.35, ease.inQuad));
    const lit = ramp(t, tLock, 1.0, ease.inOutSine);
    const o = { look, cam, doorOpen, underDoorGlow: lit, family: lit, tubeFlicker: 0.5 };
    corridor.back(ctx, F, o);
    corridor.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // flat hand rises to the door after the lock, then he leans his forehead on it
      const handUp = ramp(t, tLock + 0.3, 0.7);
      const lean = ramp(t, 3.6, 1.1, ease.inOutSine);
      const ax = lerp(CA.adam.x, CA.lean.x, lean);
      const stepping = lean > 0 && lean < 1;
      const feet = stepping ? mixPose(POSE.walk(walkPhase(ax - CA.adam.x, 'adam') * 0.5), POSE.stand, Math.abs(lean - 0.5) * 2) : POSE.stand;
      const base = mixPose({ ...feet, head: 6, lean: 2, armB: [-3, 8] }, { ...POSE.foreheadOnDoor, armB: [2, 6] }, lean);
      const doorHand = { x: lerp(CA.knock.x - 6, CA.knock.x - 2, lean), y: lerp(CA.knock.y + 6, CA.knock.y + 22, lean) };
      const handRest = { x: ax + 26, y: 590 };
      const sob = breath(t, 0, 1.4);
      drawFigure(ctx, 'adam', { x: ax, y: 700, facing: 1, ...base, head: base.head + sob * 0.8 * lean,
        handF: { x: lerp(handRest.x, doorHand.x, handUp), y: lerp(handRest.y, doorHand.y, handUp) - Math.sin(handUp * Math.PI) * 30 } }, {
        ink, light: rim(corridor.light(o, t)), breath: sob,
        held: { back: box(0.9, [{ color: '#b8d6dc', from: -1, amount: 0.6 }, { color: C.amber, from: 1, amount: 0.5 * Math.max(doorOpen / 0.6, lit) }], 0, LOOK[look].fill) },
      });
    });
    corridor.front(ctx, F, o);
  },
};
