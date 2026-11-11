// Shots: title_main, a7_09_eye, a7_10_wave, a7_12_run, a7_13_hug, end_card
// Each entry is (ctx, F) => void — see STYLE.md and src/engine.js.
import { camera, key, ease, clamp, lerp, glow, text, FONT, mixHex, PW, PH, CX } from '../engine.js';
import { LOOK, C } from '../style.js';
import { drawFigure, POSE, mixPose } from '../rig.js';
import { lunchbox, satchel, phoneSmall } from '../props.js';
import { homeStreet } from '../sets/street.js';
import { talk, breath, drift, ramp } from '../stage.js';

const HS = homeStreet.anchors;
const GOLD = LOOK.golden;
const SUN = { color: GOLD.key, from: 1, amount: 0.85 };
/** The hug, shared by a7_12 (end) and a7_13: Adam kneels upright-ish, Maya leans into him; heads side by side. */
const HUG_DX = 78;
const HUG_ADAM = { ...POSE.hugKneel, lean: 2, curl: 6, head: 22 };
const HUG_MAYA = { ...POSE.childHug, lean: 14, head: 20 };
/** Where the lunchbox's handle sits, pressed between their bodies (low, below the chests). */
const wedgeAt = (A, M) => ({ x: (A.chest.x + M.chest.x) / 2 + 4, y: Math.max(A.chest.y, M.chest.y) + 26 });
const BOX_LIGHT = { color: '#ffd08a', from: 1, amount: 0.7 };

/** Anchors of a figure without drawing it (degenerate transform → drawFigure returns before painting). */
function probe(ctx, who, pose, opts = {}) {
  ctx.save(); ctx.setTransform(0, 0, 0, 0, -1000, -1000);
  const a = drawFigure(ctx, who, pose, { ...opts, held: undefined, glint: 0, catch: 0, tear: 0 });
  ctx.restore();
  return a;
}
function black(ctx) { ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(-20, -20, PW + 40, PH + 40); ctx.restore(); }

/** The title lettering shared by title_main and end_card. split: {dx, dy, cyan alpha, cool 0..1}. */
const TITLE = { size: 76, weight: 300, family: FONT.sans, tracking: 34, align: 'center', baseline: 'middle' };
function titleText(ctx, y, alpha, split = null) {
  if (alpha <= 0) return;
  if (split && split.a > 0) text(ctx, 'THE REPLACEMENT', CX + split.dx, y + split.dy, { ...TITLE, color: C.cyan, alpha: alpha * split.a });
  const col = split ? mixHex('#e8eef5', '#d2ecf6', split.cool) : '#e8eef5';
  text(ctx, 'THE REPLACEMENT', CX, y, { ...TITLE, color: col, alpha });
}

/** Adam kneeling + Maya in his arms at the meeting point. Returns both anchor sets (Maya drawn first, then Adam). */
function hugPair(ctx, F, o) {
  const { ax, mx, adamPose, mayaPose, adamOpts, mayaOpts } = o;
  const A0 = probe(ctx, 'adam', { x: ax, y: 700, facing: 1, ...adamPose });
  const M0 = probe(ctx, 'maya', { x: mx, y: 700, facing: -1, ...mayaPose });
  // her arms round his neck; his arms round her back
  const mPose = { ...mayaPose,
    handF: mayaPose.handF || { x: A0.neck.x - 14, y: A0.neck.y + 6 },
    handB: mayaPose.handB || { x: A0.neck.x - 4, y: A0.neck.y - 2 } };
  const aPose = { ...adamPose,
    handF: adamPose.handF || { x: M0.chest.x + 24, y: M0.chest.y + 4 },
    handB: adamPose.handB || { x: M0.chest.x + 18, y: M0.chest.y - 14 } };
  const M = drawFigure(ctx, 'maya', { x: mx, y: 700, facing: -1, ...mPose }, mayaOpts);
  const A = drawFigure(ctx, 'adam', { x: ax, y: 700, facing: 1, ...aPose }, adamOpts);
  return { A, M };
}

export const shots = {
  // ── title ── black; the title, then a cleaner cyan copy slides out from behind it and settles back in register.
  title_main(ctx, F) {
    const { t, T } = F;
    black(ctx);
    const on = F.ev('on'), sp = F.ev('split');
    const alpha = ramp(t, on, 0.5, ease.inOutSine) * (1 - ramp(t, T - 0.6, 0.6, ease.inOutSine));
    const out = ramp(t, sp, 0.25, ease.outCubic), back = ramp(t, sp + 0.25, 0.5, ease.inOutCubic);
    const k = out * (1 - back);
    titleText(ctx, 402, alpha, { dx: 10 * k, dy: 4 * k, a: t >= sp ? 0.8 : 0, cool: back * 0.35 });
  },

  // ── a7_09 ── extreme close profile: the cyan glint kindles in Adam's eye; his daughter's voice; he turns to the sun.
  a7_09_eye(ctx, F) {
    const { t } = F;
    const look = 'golden', ink = GOLD.ink;
    const g0 = F.ev('glint'), g1 = F.ev('glintEnd'), lk = F.ev('look'), lunch = F.cue('a7_lunch');
    const flipT = lk + 0.08, turned = t >= flipT;
    const S = HS.stop;
    const cam = drift(F, { x: S.x - 44, y: 300, zoom: 3.9 }, { x: S.x - 22, y: 294, zoom: 4.2 });
    const o = { look, cam, blur: 1, fgLeaves: 0, flare: 1 };
    homeStreet.back(ctx, F, o);
    homeStreet.mid(ctx, F, o);
    // glint: kindles g0→g1, holds; begins to fade when her voice starts; gone within 0.2 s of the look
    let glint = key(t, [[g0, 0], [g1, 1, ease.inOutSine]]);
    glint *= 1 - 0.15 * ramp(t, lunch.at, lk - lunch.at, ease.inOutSine);
    glint *= 1 - ramp(t, lk, 0.2, ease.outCubic);
    // head: bowed over the phone; lifts a little at her voice; turns (flip) toward screen right and settles
    const hear = ramp(t, lunch.at + 0.05, 0.35, ease.outCubic);
    let pose;
    if (!turned) {
      pose = { ...POSE.holdPhone, head: 14 - hear * 8, neck: 4 - hear * 3 };
    } else {
      const s = ramp(t, flipT, 0.7, ease.outCubic);
      const d = ramp(t, flipT + 0.1, 0.9, ease.inOutSine);   // the phone hand sinks to his side
      pose = { ...POSE.holdPhone, armF: [lerp(28, 6, d), lerp(96, 12, d)], head: lerp(6, -5, s), neck: lerp(1, -2, s), lean: lerp(0, -2, s) };
    }
    // the turn: facing sweeps -1 → 1 over ~5 frames (the figure narrows through profile-to-profile), not a one-frame flip
    const facing = lerp(-1, 1, ramp(t, lk - 0.06, 0.22, ease.inOutSine));
    const cold = { color: '#dfefff', from: -1, amount: 0.9 };
    const warm = { color: GOLD.key, from: 1, amount: lerp(0.55, 0.9, ramp(t, flipT, 0.5)) };
    const light = turned ? warm : cold;
    camera(ctx, cam, 1, () => {
      const phoneOn = turned ? 1 - ramp(t, flipT, 0.4) : 1;
      // the phone's cool spill on his face from below-left (not cyan: plain screen white)
      if (!turned) glow(ctx, S.x - 70, 340, 70, '#dfefff', 0.16);
      else glow(ctx, S.x + 70, 270, 90, GOLD.key, 0.14 * ramp(t, flipT, 0.6));
      const A = drawFigure(ctx, 'adam', { x: S.x, y: 700, facing, ...pose }, {
        ink, light, glint, breath: breath(t, 0.6, 1.4), catch: turned ? 0.4 * ramp(t, flipT + 0.2, 0.5) : 0,
        held: { front: (c) => phoneSmall(c, { x: 0, y: 0, size: 37, rot: -80, glow: '#dfefff', turn: 0.3, bloom: 0.5 * phoneOn }) },
      });
      // the twist: a wider soft cyan bloom round the glint so it is unmistakable even at a glance
      const haloK = globalThis.__RIG_STYLE === 'lit' ? 0.4 : 1;   // on a lit face a big halo blows out; keep it a precise cyan point
      if (glint > 0.001) { glow(ctx, A.eye.x, A.eye.y, 34 * (haloK < 1 ? 0.6 : 1), C.cyan, 0.32 * glint * haloK); glow(ctx, A.eye.x, A.eye.y, 12, C.cyan, 0.5 * glint * haloK); }
    });
    homeStreet.front(ctx, F, o);
  },

  // ── a7_10 ── his POV: Maya bouncing on her toes, the red lunchbox overhead; his wife small in the doorway behind.
  a7_10_wave(ctx, F) {
    const { t } = F;
    const look = 'golden', ink = GOLD.ink;
    const cam = drift(F, { x: 3205, y: 432, zoom: 1.44 }, { x: 3222, y: 436, zoom: 1.53 });
    const o = { look, cam, flare: 1 };
    homeStreet.back(ctx, F, o);
    // wife in the doorway, a hand shading her eyes
    const Wf = HS.wife;
    camera(ctx, cam, Wf.depth, () => {
      const wp = { x: Wf.x, y: Wf.y, s: Wf.scale, facing: -1, ...POSE.stand, head: -4 };
      const wa = probe(ctx, 'wife', wp);
      const r = wa.head.r;
      drawFigure(ctx, 'wife', { ...wp, handF: { x: wa.head.x - r * 0.95, y: wa.head.y - r * 0.32 }, handRotF: 20 },
        { ink, light: { color: GOLD.key, from: 1, amount: 0.45 }, breath: breath(t, 2.1) });
    });
    homeStreet.mid(ctx, F, o);
    const mx = HS.maya.x;
    homeStreet.castShadow(ctx, o, mx, 285);
    camera(ctx, cam, 1, () => {
      const hz = 2.4, b = 6 * (0.5 - 0.5 * Math.cos(t * hz * Math.PI * 2));     // up on her toes and down
      const sway = Math.sin(t * Math.PI * 2 * 1.2);                               // waving it side to side
      const bx = mx - 10 + sway * 24, by = 368 - b + Math.abs(sway) * 4, rot = sway * 9;
      const rd = (rot * Math.PI) / 180, cs = Math.cos(rd), sn = Math.sin(rd);
      const side = (dx, dy) => ({ x: bx + dx * cs - dy * sn, y: by + dx * sn + dy * cs });
      drawFigure(ctx, 'maya', {
        x: mx, y: 700 - b, facing: -1, ...POSE.childArmsUp, head: -12 + sway * 2, lean: -3 - sway * 2,
        footRotF: b * 2.2, footRotB: b * 2.2,
        handF: side(-25, -14), handB: side(24, -16),
      }, { ink, light: SUN, breath: breath(t, 1, 2.2), wear: { backpack: 1 } });
      lunchbox(ctx, { x: bx, y: by, size: 46, rot, lum: 1, light: BOX_LIGHT, tint: GOLD.fill });
    });
    homeStreet.front(ctx, F, o);
  },

  // ── a7_12 ── wide track: he runs right across the zebra, she runs left; at `catch` he drops to his knees and catches her.
  a7_12_run(ctx, F) {
    const { t } = F;
    const look = 'golden', ink = GOLD.ink;
    const ct = F.ev('catch'), meet = HS.meet.x, mEnd = meet + HUG_DX;
    // Adam: from the stop anchor, accelerating, steady, then a short knee-slide into the meeting point
    // (segment lengths chosen so the speed is continuous: inQuad end speed = linear speed = outQuad start speed ≈ 443 px/s)
    const aV = (meet - HS.stop.x) / (0.25 + (ct - 0.85) + 0.275);
    const ax = key(t, [[0, HS.stop.x], [0.5, HS.stop.x + 0.25 * aV, ease.inQuad], [ct - 0.35, meet - 0.275 * aV, ease.linear], [ct + 0.2, meet, ease.outQuad]]);
    // Maya: still waving until she sees him coming, then runs left to him
    const m0 = 1.0;
    const mV = (HS.maya.x - mEnd) / (0.2 + (ct - 0.2 - m0 - 0.4) + 0.175);       // same continuity for her (≈ 275 px/s)
    const mx = key(t, [[m0, HS.maya.x], [m0 + 0.4, HS.maya.x - 0.2 * mV, ease.inQuad], [ct - 0.2, mEnd + 0.175 * mV, ease.linear], [ct + 0.15, mEnd, ease.outQuad]]);
    const camX = key(t, [[0, 2150], [ct, meet + 70, ease.inOutSine], [F.T + 1, meet + 74, ease.linear]]);
    const cz = key(t, [[0, 0.85], [ct + 0.4, 0.9, ease.inOutSine], [F.T + 1, 0.94, ease.linear]]);
    const cam = { x: camX, y: key(t, [[0, 380], [ct + 0.4, 410], [F.T + 1, 414]]), zoom: cz };
    const o = { look, cam, flare: 1 };
    homeStreet.back(ctx, F, o);
    homeStreet.mid(ctx, F, o);
    const kK = ramp(t, ct - 0.4, 0.55, ease.inOutSine);          // run → kneel: one move, he sinks as he arrives
    const kH = ramp(t, ct - 0.3, 0.5, ease.inOutCubic);          // her run → hug, arms up round his neck
    homeStreet.castShadow(ctx, o, ax, lerp(430, 250, kK));
    homeStreet.castShadow(ctx, o, mx, 285);
    camera(ctx, cam, 1, () => {
      // his satchel, abandoned where he stood
      satchel(ctx, { x: HS.stop.x - 46, y: 700, size: 98, rot: -6, light: { color: GOLD.key, from: 1, amount: 0.6 }, tint: GOLD.fill, shadow: 0.6 });
      // run cadence: ~1.3 strides/s for him, ~1.6 for her (a little foot slide is accepted; locked-to-distance read as slow motion)
      // in the last strides his arms stop pumping and open toward her (no arm flung overhead into the catch)
      const aRun = mixPose(POSE.run((ax - HS.stop.x) / 340 + 0.1), { armF: [70, 30], armB: [62, 36] }, ramp(t, ct - 0.75, 0.4, ease.inOutSine));
      const mStand = { ...POSE.childArmsUp, head: -12 };
      const mRunning = POSE.run((HS.maya.x - mx) / 172 + 0.6);
      const mRunK = ramp(t, m0, 0.35);
      let mPose = mixPose(mStand, { ...mRunning, armF: [mRunning.armF[0] * 0.5 + 30, 40] }, mRunK);
      // The kneel as IK foot targets: HUG_ADAM's FK legs would otherwise leak into the run through mixPose (a run pose has
      // no legF/legB, so mix() kept the kneeling legs for the whole run and he floated along in a kneel).
      const KN = probe(ctx, 'adam', { x: 0, y: 700, facing: 1, ...HUG_ADAM });
      // (feet lifted a touch and toes less pointed so the toes rest on the pavement instead of sinking into it)
      const kneelIK = { ...HUG_ADAM, footRotF: 38, footRotB: 38,
        footF: [KN.footF.x / KN.h, Math.min(0, (KN.footF.y - 700) / KN.h) - 0.035], footB: [KN.footB.x / KN.h, Math.min(0, (KN.footB.y - 700) / KN.h) - 0.035] };
      delete kneelIK.legF; delete kneelIK.legB;
      const aPose = mixPose(aRun, kneelIK, kK);
      const mPoseRun = mPose;                                       // (her carrying hand, without the reach for his neck)
      if (kH > 0) mPose = mixPose(mPose, HUG_MAYA, kH);
      const A0 = probe(ctx, 'adam', { x: ax, y: 700, facing: 1, ...aPose });
      const M0 = probe(ctx, 'maya', { x: mx, y: 700, facing: -1, ...mPose });
      if (kH > 0) {
        const nf = { x: A0.neck.x - 14, y: A0.neck.y + 6 }, nb = { x: A0.neck.x - 4, y: A0.neck.y - 2 };
        mPose.handF = { x: lerp(M0.handF.x, nf.x, kH), y: lerp(M0.handF.y, nf.y, kH) };
        mPose.handB = { x: lerp(M0.handB.x, nb.x, kH), y: lerp(M0.handB.y, nb.y, kH) };
      }
      const kArms = ramp(t, ct - 0.25, 0.5, ease.inOutCubic);
      if (kArms > 0) {
        aPose.handF = { x: lerp(A0.handF.x, M0.chest.x + 24, kArms), y: lerp(A0.handF.y, M0.chest.y + 4, kArms) };
        aPose.handB = { x: lerp(A0.handB.x, M0.chest.x + 18, kArms), y: lerp(A0.handB.y, M0.chest.y - 14, kArms) };
      }
      const M = drawFigure(ctx, 'maya', { x: mx, y: 700, facing: -1, ...mPose }, { ink, light: SUN, breath: breath(t, 1, 2.6), wear: { backpack: 1 } });
      const A = drawFigure(ctx, 'adam', { x: ax, y: 700, facing: 1, ...aPose }, { ink, light: SUN, breath: breath(t, 0, 2.6) });
      // the lunchbox: overhead in her hands, then swinging from her hand as she runs, then pressed between them
      const runK = mRunK * (1 - kH);
      const hand = { x: (M.handF.x + M.handB.x) / 2, y: Math.min(M.handF.y, M.handB.y) };
      const wedge = wedgeAt(A, M);
      const kW = ramp(t, ct - 0.3, 0.5, ease.inOutCubic);           // in step with her arms going up round his neck
      const carry = kW > 0 ? probe(ctx, 'maya', { x: mx, y: 700, facing: -1, ...mPoseRun }).handF : M.handF;
      if (mRunK < 1 && kW <= 0) {
        lunchbox(ctx, { x: lerp(hand.x, M.handF.x, mRunK), y: lerp(hand.y + 14, M.handF.y, mRunK), size: 46, anchor: mRunK > 0.5 ? 'handle' : undefined, handleUp: mRunK, lum: 1, light: BOX_LIGHT, tint: GOLD.fill });
      } else {
        const p = { x: lerp(carry.x, wedge.x, kW), y: lerp(carry.y, wedge.y, kW) };
        lunchbox(ctx, { x: p.x, y: p.y, size: 46, anchor: 'handle', handleUp: 1, wobble: Math.sin(t * 7) * 0.5 * runK, lum: 1, light: BOX_LIGHT, tint: GOLD.fill });
      }
    });
    homeStreet.front(ctx, F, o);
  },

  // ── a7_13 ── close on the hug in daylight: the mirror of a6_03. No cyan anywhere.
  a7_13_hug(ctx, F) {
    const { t } = F;
    const look = 'golden', ink = GOLD.ink;
    const ax = HS.meet.x, mx = HS.meet.x + HUG_DX;
    const love = F.cue('a7_love'), know = F.cue('a7_know');
    const adamPose = { ...HUG_ADAM, head: HUG_ADAM.head + 4 * ramp(t, love.end + 0.3, 1.2, ease.inOutSine) };
    const mayaPose = { ...HUG_MAYA };
    const A0 = probe(ctx, 'adam', { x: ax, y: 700, facing: 1, ...adamPose });
    const M0 = probe(ctx, 'maya', { x: mx, y: 700, facing: -1, ...mayaPose });
    const cx = (A0.head.x + M0.head.x) / 2, cy = (A0.head.y + M0.head.y) / 2 + 34;
    const cam = drift(F, { x: cx, y: cy, zoom: 2.6 }, { x: cx, y: cy + 4, zoom: 2.9 });
    const o = { look, cam, blur: 1, flare: 1 };
    homeStreet.back(ctx, F, o);
    homeStreet.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // he holds on: a slow squeeze after he speaks
      const sq = ramp(t, love.end, 0.8, ease.inOutSine);
      const { A, M } = hugPair(ctx, F, {
        ax, mx,
        adamPose: { ...adamPose, lean: adamPose.lean + sq * 3, curl: adamPose.curl + sq * 2 },
        mayaPose: { ...mayaPose, head: mayaPose.head - talk(F, 'a7_know') * 3 },
        adamOpts: { ink, light: SUN, talk: talk(F, 'a7_love'), breath: breath(t, 0, 1.4), catch: 0.4 },
        mayaOpts: { ink, light: { color: GOLD.key, from: 1, amount: 0.8 }, talk: talk(F, 'a7_know') * 0.6, breath: breath(t, 1.3, 1.7), wear: { backpack: 1 } },
      });
      const wedge = wedgeAt(A, M);
      lunchbox(ctx, { x: wedge.x, y: wedge.y, size: 46, anchor: 'handle', handleUp: 1, lum: 1, light: BOX_LIGHT, tint: GOLD.fill });
    });
    homeStreet.front(ctx, F, o);
  },

  // ── end card ── the two lines, then the title and credits; fade to black.
  end_card(ctx, F) {
    const { t, T } = F;
    black(ctx);
    const out = 1 - ramp(t, F.ev('out'), T - F.ev('out'), ease.inOutSine);
    const lo = 1 - ramp(t, F.ev('linesOut'), 0.8, ease.inOutSine);
    const L = { size: 54, family: FONT.serif, italic: true, weight: 400, color: C.cream, align: 'center', baseline: 'middle' };
    text(ctx, 'The world found a better version of him.', CX, 350, { ...L, alpha: ramp(t, F.ev('line1'), 0.8, ease.inOutSine) * lo * out });
    text(ctx, 'But his family didn’t need a better man.', CX, 430, { ...L, alpha: ramp(t, F.ev('line2'), 0.8, ease.inOutSine) * lo * out });
    titleText(ctx, 400, ramp(t, F.ev('title'), 0.8, ease.inOutSine) * out);
    text(ctx, 'Animation, score, sound and voices generated in code  ·  Voices: Kokoro TTS (Apache-2.0)', CX, 470,
      { size: 22, weight: 400, family: FONT.sans, color: '#8fa3bd', align: 'center', baseline: 'middle', alpha: ramp(t, F.ev('credits'), 0.8, ease.inOutSine) * out });
  },
};
