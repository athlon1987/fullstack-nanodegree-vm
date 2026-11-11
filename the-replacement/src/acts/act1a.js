// Shots: a1_01_alarm, a1_02_wake, a1_04_toast, a1_05_ask, a1_06_bill, a1_11_night, a1_13_react — and a7_02_alarm (the echo of a1_01)
// Each entry is (ctx, F) => void — see STYLE.md and src/engine.js.
import { camera, key, ease, clamp, lerp, mix, hash, noise1, glow, scratch, mixHex } from '../engine.js';
import { LOOK, C } from '../style.js';
import { drawFigure, POSE, mixPose, drawHand, walkPhase } from '../rig.js';
import { lunchbox, envelope, toast, phoneSmall, backpack, cerealBowl } from '../props.js';
import { kitchen } from '../sets/kitchen.js';
import { bedroom, bedsideCloseup, alarmClock, clockPoint } from '../sets/bedcorridor.js';
import { talk, breath, drift, ramp } from '../stage.js';

const K = kitchen.anchors;
const BS = bedsideCloseup.anchors;

/** A set light ({key|color, from, amount}) as the rig wants it ({color, from, amount}). */
const rimOf = (L, k = 1) => ({ color: L.color || L.key, from: L.from ?? 1, amount: (L.amount ?? 0.5) * k });
/** Anchors of a figure without drawing it anywhere visible (fast path, 2×2 scratch canvas). */
const probe = (who, pose) => drawFigure(scratch('act1a_probe', 2, 2).ctx, who, pose, {});
const P = (x, y) => ({ x, y });

// ── the alarm clock ECU, shared by a1_01 (broken, slapped) and a7_02 (golden, touched gently) ──
function alarmShot(ctx, F, look, hitEv, gentle) {
  const { t } = F, ink = LOOK[look].ink;
  const cam = drift(F, { x: 892, y: 384, zoom: 1.38 }, { x: 884, y: 394, zoom: 1.46 });
  const o = { look, cam };
  const flip = F.ev('flip'), hit = F.ev(hitEv);
  // the snooze bar: slapped down hard in 0.12 s / pressed gently over 0.45 s and held
  const press = gentle ? ramp(t, hit, 0.45, ease.inOutSine) : ramp(t, hit, 0.12, ease.outQuad);
  // the broken alarm: stutters between 0.3 and 1 from `flip` until the hand stops it
  const stutter = lerp(0.3, 1, 0.55 * noise1(t * 9, 4) + 0.45 * hash(Math.floor(t * 14) + 77));
  const stop = gentle ? ramp(t, hit + 0.12, 0.33, ease.linear) : clamp((t - hit) / 0.12);
  const glitch = t >= flip ? stutter * (1 - stop) : 0;
  const clk = { ...BS.clock, time: t < flip ? '5:44' : '5:45', glitch, t, look, press };

  // the hand: wrist position so the flat palm lies on the top of the snooze bar
  const S = 260, sp = clockPoint(clk, 'snooze');
  const rest = { x: sp.x - 0.34 * S, y: sp.y - 0.235 * S, rot: 3 };
  let hand = null;
  if (!gentle) {
    // a tired, heavy drop from up-left: travels across first, then falls
    const a = hit - 0.42, k = clamp((t - a) / 0.42);
    if (t >= a) {
      hand = {
        x: lerp(rest.x - 640, rest.x, ease.outQuad(k)),
        y: lerp(rest.y - 300, rest.y, ease.inQuad(k)),
        rot: lerp(-20, rest.rot, ease.outCubic(k)),
      };
      // after the slap the hand settles its weight a hair and stays there
      hand.y += 4 * ramp(t, hit + 0.12, 0.5, ease.inOutSine);
    }
  } else {
    // glides in, hovers a moment, then comes down softly and rests
    const a = hit - 1.15;
    if (t >= a) {
      const hover = { x: rest.x - 20, y: rest.y - 70, rot: -5 };
      const g = ramp(t, a, 1.0, ease.inOutSine), d = ramp(t, hit, 0.45, ease.inOutSine);
      hand = {
        x: lerp(lerp(rest.x - 700, hover.x, g), rest.x, d),
        y: lerp(lerp(rest.y - 200, hover.y, g), rest.y, d),
        rot: lerp(lerp(-14, hover.rot, g), rest.rot, d),
      };
    }
  }

  bedsideCloseup.back(ctx, F, o);
  camera(ctx, cam, 1, () => {
    alarmClock(ctx, clk);
    if (hand) drawHand(ctx, { x: hand.x, y: hand.y, size: S, rot: hand.rot, pose: 'flat', ink, cuff: mixHex(ink, LOOK[look].fill, 0.5), arm: 4 });
  });
  bedsideCloseup.front(ctx, F, o);
}

// ── the night kitchen staging, shared by a1_11 and a1_13 ──
const NIGHT = { phone: P(716, 512), box: P(800, 515), env: P(884, 513) };
function adamNightPose(t, F, react) {
  const base = { x: K.seatL.x, y: 700, facing: 1, ...POSE.sitForward, lean: 21, curl: 14, neck: 6, head: 26 };
  if (!react) {
    // at `buzz` the head comes up a little toward the phone, then holds
    const b = F.ev('buzz');
    base.head = 26 - 8 * ramp(t, b + 0.25, 0.7);
    base.neck = 6 + 3 * ramp(t, b + 0.25, 0.7);
  } else {
    // the last of a laugh: two small shakes of the shoulders, then it drains away and stills
    const env = 1 - ramp(t, 0.15, 0.85, ease.inOutSine);
    const shake = Math.max(0, Math.sin(clamp(t / 0.9) * Math.PI * 2)) * env;
    base.curl += -3 * shake; base.lean += -2 * shake; base.head = 18 - 3 * shake;
    base.head += 6 * ramp(t, 0.7, 1.1, ease.inOutSine);
    base.neck += 2 * ramp(t, 0.7, 1.1, ease.inOutSine);
  }
  base.handF = P(684, 508); base.handB = P(660, 510);
  return base;
}
function nightShot(ctx, F, react) {
  const { t } = F, look = 'nightDark', ink = LOOK[look].ink;
  const pose = adamNightPose(t, F, react);
  const lit = react ? 1 : ramp(t, F.ev('buzz'), 0.35, ease.outCubic);
  let cam;
  if (react) {
    const a = probe('adam', pose), h = a.head;
    cam = drift(F, { x: h.x + 22, y: h.y + 26, zoom: 3.2 }, { x: h.x + 20, y: h.y + 30, zoom: 3.36 });
  } else {
    cam = drift(F, { x: 712, y: 452, zoom: 1.75 }, { x: 716, y: 458, zoom: 1.86 });
  }
  const o = { look, cam };
  const vib = !react && t > F.ev('buzz') && t < F.ev('buzz') + 0.45 ? Math.sin(t * 190) * 1.2 : 0;
  const base = kitchen.lights.nightDark;
  const light = { color: mixHex(base.key, C.cyan, lit), from: 1, amount: lerp(base.amount, 0.9, lit) };
  kitchen.back(ctx, F, o);
  kitchen.mid(ctx, F, o);
  camera(ctx, cam, 1, () => {
    const ph = NIGHT.phone;
    // the cold light the phone throws: across the table top and up into his face
    if (lit > 0) {
      glow(ctx, ph.x + 4, ph.y - 6, 230, C.cyanDeep, 0.38 * lit, 0.55);
      glow(ctx, ph.x - 20, ph.y - 110, 170, C.cyan, 0.14 * lit);
    }
    envelope(ctx, { x: NIGHT.env.x, y: NIGHT.env.y, size: 54, stamp: 1, squash: 0.24, lum: 0.22, tint: LOOK[look].fill, light: [{ color: base.key, from: 1, amount: 0.25 }, { color: C.cyan, from: -1, amount: 0.6 * lit }] });
    lunchbox(ctx, { x: NIGHT.box.x, y: NIGHT.box.y, size: 46, lum: 0.42, tint: LOOK[look].fill, shadow: 0.6,
      light: [{ color: base.key, from: 1, amount: 0.3 }, { color: C.cyan, from: -1, amount: 0.95 * lit, wash: 0.35 * lit }] });
    drawFigure(ctx, 'adam', pose, { ink, light, breath: react ? breath(t, 1) * (1 - ramp(t, 0.9, 0.9)) * 0.6 : breath(t, 1) });
    phoneSmall(ctx, { x: ph.x + vib, y: ph.y - 2, size: 37, rot: -90, face: 1, turn: 0.3, glow: lit > 0 ? C.cyan : null, bloom: 0.9 * lit, lum: 0.4 });
    if (lit > 0) glow(ctx, ph.x, ph.y - 4, 26, C.ice, 0.5 * lit, 0.4);
  });
  kitchen.front(ctx, F, o);
}

export const shots = {
  // ── The film's first image: the cracked alarm clock, 5:44 → 5:45, glitching; a tired hand slaps it quiet.
  a1_01_alarm(ctx, F) { alarmShot(ctx, F, 'predawn', 'slap', false); },

  // ── A week later, the same frame in gold; the hand comes down gently and rests.
  a7_02_alarm(ctx, F) { alarmShot(ctx, F, 'golden', 'tap', true); },

  // ── Wide bedroom: Adam rises to sit on the bed edge; at `back` a hand to his lower back, head dips.
  a1_02_wake(ctx, F) {
    const { t } = F, look = 'predawn', ink = LOOK[look].ink;
    const cam = drift(F, { x: 930, y: 430, zoom: 1.3 }, { x: 934, y: 434, zoom: 1.37 });
    const o = { look, cam };
    const x = bedroom.anchors.sit.x, sitT = F.ev('sit'), back = F.ev('back');
    // folded over his knees → pushes himself up to sitting over the first second
    const folded = { ...POSE.sitBed, lean: 52, curl: 24, neck: 12, head: 34 };
    const up = ramp(t, sitT - 0.25, 1.0, ease.inOutSine);
    let pose = mixPose(folded, POSE.sitBed, up);
    // at `back`: the ache — back arches a touch, head dips (wince), then a slow breath out
    const ache = ramp(t, back, 0.55);
    pose = { ...pose, lean: pose.lean - 4 * ache, head: pose.head + 16 * ache, neck: pose.neck + 5 * ache, curl: pose.curl + 3 * ache };
    // hands: pushing on the mattress → resting on the thighs → front hand to the small of the back
    const pr = probe('adam', { x, y: 700, facing: 1, ...pose });
    const bed = P(x + 34, 584), thigh = P(pr.kneeF.x - 28, pr.kneeF.y - 8), small = P(pr.hip.x - 26, pr.hip.y - 44);
    const reach = ramp(t, back - 0.05, 0.55);
    const handF = reach > 0
      ? P(lerp(thigh.x, small.x, reach), lerp(thigh.y, small.y, reach) - Math.sin(reach * Math.PI) * 24)
      : P(lerp(bed.x, thigh.x, ramp(t, sitT + 0.55, 0.5)), lerp(bed.y, thigh.y, ramp(t, sitT + 0.55, 0.5)));
    const handB = P(lerp(x - 22, pr.kneeB.x - 40, ramp(t, sitT + 0.6, 0.5)), lerp(583, pr.kneeB.y - 6, ramp(t, sitT + 0.6, 0.5)));
    bedroom.back(ctx, F, o);
    camera(ctx, cam, 1, () => {
      drawFigure(ctx, 'adam', { x, y: 700, facing: 1, ...pose, handF, handB, handRotF: 40 * reach },
        { ink, light: rimOf(bedroom.lights.predawn), breath: breath(t, 0.5) * (1 + 0.6 * ache) });
    });
    bedroom.front(ctx, F, o);
  },

  // ── Close on the toaster: smoke, the burnt toast pops; Adam's hand plucks out the left slice and juggles it.
  a1_04_toast(ctx, F) {
    const { t } = F, look = 'greyMorning', ink = LOOK[look].ink;
    const cam = drift(F, { x: 1408, y: 428, zoom: 2.8 }, { x: 1402, y: 432, zoom: 2.96 });
    const pop = F.ev('pop'), grab = 2.0;
    const o = {
      look, cam, toastBurnt: 1,
      smoke: lerp(0.3, 1, ramp(t, pop, 1.0, ease.inOutSine)),
      toast: ramp(t, pop, 0.1, ease.outCubic),
      toastCount: t < grab ? 2 : 1,
    };
    // the left slice's top edge while it sits popped in the toaster (base centre at y 435, 36 tall)
    const top0 = P(K.toastSlot.x - 19, K.toastSlot.y + 36 - (4 + o.toast * 21) - 36 + 3);
    // the pinch point of the fingers: reach in → pinch → lift → juggle (small quick hops) → drift off left
    const reach = ramp(t, 1.45, grab - 1.45, ease.inOutSine);
    const lift = ramp(t, grab + 0.05, 0.3, ease.outCubic);
    const jug = t > grab + 0.3 ? Math.abs(Math.sin((t - grab - 0.3) * Math.PI * 4.6)) * (1 - ramp(t, grab + 1.0, 0.6)) : 0;
    const away = ramp(t, grab + 0.55, 1.4, ease.inOutSine);
    const grip = P(
      lerp(lerp(top0.x - 240, top0.x, reach), top0.x - 16, lift) - 150 * away,
      lerp(lerp(top0.y + 30, top0.y, reach), top0.y - 64, lift) - 11 * jug + 20 * away,
    );
    const S = 46, rot = 8 - 6 * lift - 5 * jug;
    const r = (rot * Math.PI) / 180, off = P(0.84 * S, -0.06 * S);
    const wrist = P(grip.x - (off.x * Math.cos(r) - off.y * Math.sin(r)), grip.y - (off.x * Math.sin(r) + off.y * Math.cos(r)));
    const tilt = t < grab ? 0 : 8 * Math.sin((t - grab) * 9) * (jug > 0 ? 1 : 0.3) * (1 - away * 0.7);
    const h = 30, tr = (tilt * Math.PI) / 180;
    kitchen.back(ctx, F, o);
    camera(ctx, cam, 1, () => {
      if (t >= grab) toast(ctx, { x: grip.x - h * Math.sin(tr), y: grip.y + h * Math.cos(tr), size: 30, burnt: 1, rot: tilt, lum: 0.8, light: rimOf(kitchen.lights.greyMorning) });
      if (t >= 1.4) drawHand(ctx, { x: wrist.x, y: wrist.y, size: S, rot, pose: 'pinch', ink, cuff: '#2a3344' });
    });
    kitchen.front(ctx, F, o);
  },

  // ── Maya asks; Adam glances at his watch, a hand on her head as he answers — already leaving. She sinks.
  a1_05_ask(ctx, F) {
    const { t } = F, look = 'greyMorning', ink = LOOK[look].ink;
    const cam = drift(F, { x: 770, y: 440, zoom: 1.5 }, { x: 790, y: 446, zoom: 1.6 });
    const o = { look, cam };
    const ask = F.cue('a1_ask'), tr = F.cue('a1_try');
    // ── Maya: eyes on her bowl → looks up hopefully to ask → after his answer head and shoulders sink
    const lookUp = ramp(t, ask.at - 0.3, 0.55), sink = ramp(t, tr.end + 0.05, 0.9, ease.inOutSine);
    const pat = ramp(t, tr.at + 0.15, 0.25) * (1 - ramp(t, tr.end - 0.25, 0.35));
    const maya = {
      x: K.seatR.x, y: 700, facing: -1, ...POSE.sit,
      lean: 4 + 4 * lookUp + 6 * sink, curl: 2 + 12 * sink, neck: 2 * sink,
      head: lerp(lerp(12, -14, lookUp), 20, sink) + 5 * pat,
      handF: P(943 + 4 * sink, 497 + 3 * sink), armB: [10, 40],
    };
    // ── Adam: walks in from standL with the burnt toast, stops at her side behind the table
    const x0 = K.standL.x, x1 = 905;
    const leave = ramp(t, tr.end + 0.1, 0.9, ease.inOutSine);
    const ax = key(t, [[0.15, x0], [1.75, x1, ease.inOutSine]]) - 34 * leave;
    const moving = Math.min(ramp(t, 0.05, 0.3), 1 - ramp(t, 1.45, 0.35)) + 0.7 * Math.min(ramp(t, tr.end, 0.2), 1 - ramp(t, tr.end + 0.75, 0.3));
    const stride = (ax - x0) + 68 * leave;
    let ap = mixPose(POSE.stand, POSE.walk(walkPhase(Math.abs(stride), 'adam')), clamp(moving));
    const glance = ramp(t, ask.end - 0.1, 0.35) * (1 - ramp(t, tr.at - 0.3, 0.3));
    const away = ramp(t, tr.at + 0.1, 0.6); // the lean away — his weight already on the way out
    ap = { ...ap, head: ap.head + 6 + 22 * glance - 4 * lookUp * (1 - glance) - 8 * away, neck: ap.neck + 4 * glance, lean: ap.lean - 6 * away + 2 * glance, hipX: -0.025 * away, armB: [26, 74] };
    // probe Maya + Adam (no front hand) to aim the front hand: side → wristwatch → her crown → side
    const mA = probe('maya', maya), aA = probe('adam', { x: ax, y: 700, facing: 1, ...ap });
    const side = P(aA.shoulder.x + 6, aA.shoulder.y + 150), watch = P(aA.chest.x + 34, aA.chest.y + 18);
    const crown = P(mA.top.x + 4, mA.top.y + 2);
    const w = ramp(t, ask.end - 0.15, 0.35) * (1 - ramp(t, tr.at - 0.3, 0.3));
    const onHead = ramp(t, tr.at - 0.2, 0.45) * (1 - ramp(t, tr.end - 0.15, 0.4));
    let hf = P(lerp(side.x, watch.x, w), lerp(side.y, watch.y, w));
    hf = P(lerp(hf.x, crown.x, onHead), lerp(hf.y, crown.y, onHead));
    const adam = { x: ax, y: 700, facing: 1, ...ap, handF: hf, handRotF: 30 * onHead - 50 * w };
    kitchen.back(ctx, F, o);
    camera(ctx, cam, 1, () => {
      drawFigure(ctx, 'maya', maya, { ink, light: rimOf(kitchen.lightAt(look, maya.x, o)), talk: talk(F, 'a1_ask'), breath: breath(t, 2) * (1 + sink * 0.5) });
      drawFigure(ctx, 'adam', adam, {
        ink, light: rimOf(kitchen.lightAt(look, ax, o)), talk: talk(F, 'a1_try'), breath: breath(t, 0.7),
        held: { back: (c) => toast(c, { x: 6, y: 9, size: 27, burnt: 1, rot: -100, lum: 0.75 }) },
      });
    });
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      lunchbox(ctx, { x: K.tableL.x, y: K.tableL.y, size: 46, shadow: 0.5, light: rimOf(kitchen.lights.greyMorning) });
      cerealBowl(ctx, { x: K.tableR.x, y: K.tableR.y, size: 38, fill: 0.8, spoon: 1, shadow: 0.4, lum: 0.85 });
      backpack(ctx, { x: 1112, y: 700, size: 80, slump: 0.6, flip: -1, lum: 0.55, shadow: 0.6 });
    });
    kitchen.front(ctx, F, o);
  },

  // ── The bill. Open close on OVERDUE, ease out to the room; she lays it down; Adam takes the lunchbox and leaves.
  a1_06_bill(ctx, F) {
    const { t } = F, look = 'greyMorning', ink = LOOK[look].ink;
    const tableT = F.ev('table'), grab = F.ev('grab');
    // ── the wife: holds the envelope up → one small step to the table → lays it down → straightens
    const stepK = ramp(t, tableT - 1.0, 0.65, ease.inOutSine);
    const wx = lerp(K.standR.x, 1072, stepK);
    const reachW = ramp(t, tableT - 0.55, 0.55), backW = ramp(t, tableT + 0.2, 0.7);
    const bend = reachW * (1 - backW);
    let wp = mixPose(POSE.stand, POSE.walk(walkPhase(K.standR.x - wx, 'wife')), Math.min(ramp(t, tableT - 1.05, 0.15), 1 - ramp(t, tableT - 0.45, 0.2)));
    wp = { ...wp, lean: wp.lean + 24 * bend, curl: 6 * bend, head: 8 + 14 * bend - 4 * ramp(t, grab, 0.4) * backW, armB: [-2, 8] };
    const wA = probe('wife', { x: wx, y: 700, facing: -1, ...wp });
    const holdPt = P(wA.chest.x - 36, wA.chest.y - 16);
    const laid = P(930, 512);
    const k1 = reachW, k2 = backW;
    let whf = P(lerp(holdPt.x, laid.x + 20, k1), lerp(holdPt.y, laid.y - 2, k1));
    whf = P(lerp(whf.x, wA.shoulder.x - 4, k2), lerp(whf.y, wA.shoulder.y + 140, k2));
    const wife = { x: wx, y: 700, facing: -1, ...wp, handF: whf };
    const envPos = t < tableT ? P(whf.x - 17, whf.y - 3 + 4 * reachW) : laid;
    const envSq = t < tableT ? lerp(1, 0.3, ramp(t, tableT - 0.3, 0.3)) : 0.24;
    // ── camera: begins close on the envelope (OVERDUE legible), eases out to the room by 1.4 s
    const wide = drift(F, { x: 700, y: 432, zoom: 1.12 }, { x: 690, y: 436, zoom: 1.18 });
    const out = ramp(t, 0.45, 0.95, ease.inOutCubic);
    const env0 = P(holdPt.x - 11, holdPt.y - 2);
    const cam = { x: lerp(env0.x, wide.x, out), y: lerp(env0.y, wide.y, out), zoom: Math.exp(lerp(Math.log(4.4), Math.log(wide.zoom), out)), rot: 0 };
    // ── Adam: standL → one step to the table → takes the lunchbox by the handle → turns and walks out left
    const boxAt = P(668, K.tableL.y);
    const stepA = ramp(t, grab - 0.65, 0.5, ease.inOutSine);
    const turn = t >= grab + 0.35;
    const walkD = Math.max(0, t - (grab + 0.35));
    const wdist = walkD < 0.4 ? 0.5 * 760 * walkD * walkD : 0.5 * 760 * 0.16 + 304 * (walkD - 0.4);
    const ax = lerp(K.standL.x, 540, stepA) - wdist;
    const reachA = ramp(t, grab - 0.35, 0.35) * (1 - ramp(t, grab + 0.05, 0.3));
    const glance = ramp(t, tableT - 0.2, 0.4);
    let ap;
    if (!turn) {
      ap = mixPose(POSE.stand, POSE.walk(walkPhase(ax - K.standL.x, 'adam')), Math.min(ramp(t, grab - 0.7, 0.12), 1 - ramp(t, grab - 0.25, 0.15)));
      ap = { ...ap, lean: ap.lean + 22 * reachA, curl: 6 * reachA, head: 6 + 10 * glance + 10 * reachA, armB: [-6, 10] };
    } else {
      ap = mixPose(POSE.stand, POSE.walk(walkPhase(wdist, 'adam')), ramp(t, grab + 0.35, 0.25));
      ap = { ...ap, head: ap.head + 10 * (1 - ramp(t, grab + 0.4, 0.5)) };
    }
    const lifted = t >= grab;
    const aPre = probe('adam', { x: ax, y: 700, facing: turn ? -1 : 1, ...ap });
    const hang = P(aPre.shoulder.x + (turn ? -10 : 18), aPre.shoulder.y + 150);
    const o = { look, cam, doorOpen: ramp(t, grab + 0.5, 1.0, ease.inOutSine) };
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // the lunchbox on the table until `grab`
      let handle = null;
      if (!lifted) {
        const a = lunchbox(ctx, { x: boxAt.x, y: boxAt.y, size: 46, shadow: 0.5, handleUp: ramp(t, grab - 0.2, 0.2), light: rimOf(kitchen.lights.greyMorning) });
        handle = a.handle;
      }
      if (t >= tableT) envelope(ctx, { x: laid.x, y: laid.y, size: 54, stamp: 1, squash: 0.24, lum: 0.85 });
      if (t < tableT) envelope(ctx, { x: envPos.x, y: envPos.y, size: 54, stamp: 1, squash: envSq, rot: -3 * (1 - reachW), lum: 0.95, light: rimOf(kitchen.lights.greyMorning) });
      drawFigure(ctx, 'wife', wife, { ink, light: rimOf(kitchen.lightAt(look, wx, o)), talk: talk(F, 'a1_bill'), breath: breath(t, 1.3) });
      // Adam's front hand: at his side → to the handle → carrying (box hangs from it, swinging)
      const hf = lifted ? P(lerp(handle ? handle.x : boxAt.x, hang.x, ramp(t, grab, 0.35)), lerp(boxAt.y - 34, hang.y, ramp(t, grab, 0.35)))
        : P(lerp(aPre.shoulder.x + 8, handle.x, reachA), lerp(aPre.shoulder.y + 150, handle.y, reachA));
      const A = drawFigure(ctx, 'adam', { x: ax, y: 700, facing: turn ? -1 : 1, ...ap, handF: hf }, { ink, light: rimOf(kitchen.lightAt(look, ax, o)), breath: breath(t, 0.4) });
      if (lifted) {
        const sw = Math.sin((t - grab) * 7) * 0.6 * (1 - ramp(t, grab + 1.4, 0.8)) + (turn ? 0.25 : 0);
        lunchbox(ctx, { x: A.handF.x, y: A.handF.y + 2, size: 46, anchor: 'handle', handleUp: 1, wobble: sw, light: rimOf(kitchen.lights.greyMorning) });
      }
    });
    kitchen.front(ctx, F, o);
  },

  // ── Night. Adam alone at the dark table; at `buzz` the phone lights cold cyan across him and the lunchbox.
  a1_11_night(ctx, F) { nightShot(ctx, F, false); },

  // ── Tight on Adam's profile in the cyan glow: the last of a laugh drains away into stillness.
  a1_13_react(ctx, F) { nightShot(ctx, F, true); },
};
