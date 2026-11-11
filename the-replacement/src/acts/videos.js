// Shots: a3_08_video, a7_07_video
// Phone inserts whose screen plays a VIDEO. The phone is ui.js phone() (same device, hand and framing as
// src/acts/ui_phone.js); inside drawScreen the app chrome is drawn in logical screen units and the video is a
// little scene made with a set + the rig, mapped from the set's picture-space crop into the video rectangle.
//
//   a3_08_video  social post in the rain. Teacher announces (a3_award) and hands the star trophy across the
//                lectern; Maya walks on and takes it by ~3.2; applause 3.4 = clap + confetti; trophy 4.4 V1 steps
//                in, they lift it together, she jumps with her free arm up to the end. Likes tick up from 214.
//   a7_07_video  message thread in golden light; tap the video bubble; play 0.6 it opens full screen (0.3 s).
//                The original Adam in his car at night: wipe 1.4 heel of hand to the eyes; a7_video1; long pause,
//                head down, a tear; a7_video2; reaches toward the lens; end 9.8 freeze, dim, replay + "0:09".
import { TAU, clamp, lerp, ease, key, wobble, rgba, mixHex, rr, fillRR, linGrad, radGrad, text, measure, FONT, PW, PH } from '../engine.js';
import { LOOK, C } from '../style.js';
import { drawFigure, POSE, mixPose, walkPhase } from '../rig.js';
import { trophy } from '../props.js';
import { stage } from '../sets/school.js';
import { carInterior } from '../sets/street.js';
import { talk, breath, ramp } from '../stage.js';
import * as U from '../ui.js';

const { UI } = U;
const rimOf = (L) => ({ color: L.key, from: L.from, amount: L.amount });
const P = (x, y) => ({ x, y });
const lerpP = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });

/** Draw `draw` (picture-space set + rig code) so that picture rect `crop` cover-fills screen rect `rect`. */
function inVideo(ctx, rect, crop, draw, radius = 0) {
  ctx.save();
  if (radius > 0.5) rr(ctx, rect.x, rect.y, rect.w, rect.h, radius); else { ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); }
  ctx.clip();
  const s = Math.max(rect.w / crop.w, rect.h / crop.h);
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2); ctx.scale(s, s); ctx.translate(-(crop.x + crop.w / 2), -(crop.y + crop.h / 2));
  draw(ctx);
  ctx.restore();
}

function heart(ctx, x, y, s, color) {
  ctx.save(); ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.5, y - s * 0.1, x - s * 0.7, y - s * 1.1, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.5, y - s * 0.1, x, y + s * 0.9);
  ctx.fill(); ctx.restore();
}
function star5(ctx, x, y, R, color) {
  ctx.save(); ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.45 : R; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
// the wife's round warm avatar (same drawing as the call screen in a3_07)
function avatar(ctx, x, y, r) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  ctx.fillStyle = linGrad(ctx, x, y - r, x, y + r, [[0, '#d49650'], [1, '#7a4a22']]); ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = radGrad(ctx, x + r * 0.2, y - r * 0.3, 0, r, [[0, rgba('#ffe2b0', 0.35)], [1, 'rgba(255,226,176,0)']]); ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.translate(x, y); ctx.scale(r, r);
  ctx.fillStyle = '#1b0f08';
  ctx.beginPath(); ctx.ellipse(0.02, 0.78, 0.7, 0.45, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-0.12, 0.1); ctx.lineTo(0.16, 0.1); ctx.lineTo(0.2, 0.5); ctx.lineTo(-0.2, 0.5); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0.04, -0.2, 0.27, 0.33, -0.08, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0.27, -0.2); ctx.quadraticCurveTo(0.36, -0.14, 0.3, -0.07); ctx.lineTo(0.27, -0.06); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0.24, -0.02); ctx.quadraticCurveTo(0.27, 0.08, 0.14, 0.14); ctx.lineTo(0.1, 0.1); ctx.fill();
  ctx.beginPath(); ctx.arc(-0.2, -0.5, 0.15, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-0.08, -0.25, 0.26, 0.34, 0.15, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = rgba('#ffd08a', 0.6); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, r + 1.5, 0, TAU); ctx.stroke();
}

// ═════════════════════════════ a3_08_video ═════════════════════════════
const SA = stage.anchors, ST_L = rimOf(stage.lights.warmDay), ST_INK = LOOK.warmDay.ink;
const TH = 72;                                          // trophy height in the video (a touch over film size: it is the hero)
const VR3 = { x: 15, y: 136, w: 360, h: 450 };          // the 4:5 video in the post (screen units)
const CROP3 = { x: 640, y: 2, w: 640, h: 800 };         // picture-space crop (stage 'portrait'); the video cam pans the world under it

function stageScene(ctx, F, t) {
  // mum's phone camera: follows the action left → right, gentle push, a little hand tremor
  const cam = {
    x: key(t, [[0, 770], [1.6, 775], [3.1, 835, ease.inOutSine], [4.6, 935, ease.inOutSine], [10, 950, ease.inOutSine]]) + wobble(t, 0.7, 3) * 4,
    y: key(t, [[0, 410], [4.6, 404], [6, 392], [10, 392]]) + wobble(t, 0.6, 8) * 3,
    zoom: key(t, [[0, 1.0], [4.4, 1.03, ease.inOutSine], [10, 1.1, ease.inOutSine]]),
  };
  const ap = F.ev('applause'), tr = F.ev('trophy');
  const o = { look: 'warmDay', cam, t, clap: ramp(t, ap, 0.45), confetti: ramp(t, ap, 0.8), spot: 1 };

  // ── Maya: walks on from the right to the lectern (facing left), takes the trophy, turns to face V1 (right)
  const mx = key(t, [[0.15, 1480], [2.6, 842, ease.inOutSine], [3.8, 842], [4.5, 888, ease.inOutSine]]);
  const fx = key(t, [[3.85, -1], [4.15, 1]]), mf = fx < 0 ? -1 : 1;
  const walkW = 1 - ramp(t, 2.3, 0.4, ease.inOutSine);
  const stepW = Math.min(ramp(t, 3.8, 0.15), 1 - ramp(t, 4.35, 0.2));
  const mWalk = t < 3.3 ? POSE.walk(walkPhase(1480 - mx, 'maya', 1, 0.22), { stride: 0.22, swing: 30 }) : POSE.walk(walkPhase(mx - 842, 'maya', 1, 0.14), { stride: 0.14, swing: 8 });
  const jumpOn = ramp(t, tr + 1.35, 0.3);
  const hop = Math.abs(Math.sin(Math.max(0, t - tr - 1.35) * Math.PI / 0.46));
  const bounce = hop * 18 * jumpOn;

  // ── the trophy: on the lectern → teacher lifts and offers it → Maya draws it to her chest → lifted high
  const lift = ramp(t, tr + 0.55, 0.75, ease.inOutCubic);
  let T;
  if (t < 3.0) T = key(t, [[1.85, P(642, 474)], [2.55, P(772, 470)]]);
  else {
    const chest = P(mx + fx * 30, 488);
    const high = P(mx + 34, 352 - bounce * 0.55);
    T = lerpP(lerpP(P(772, 470), chest, ramp(t, 3.0, 0.5)), high, lift);
  }

  // ── teacher (behind the lectern, facing right): announces, picks up the trophy, offers it, then claps
  const tb = breath(t, 1);
  const teach = () => {
    const pick = key(t, [[1.6, 0], [1.88, 1], [3.0, 1], [3.35, 0]]);
    const rest = P(612, 476);
    const clapK = ramp(t, 3.45, 0.35), c = 0.5 + 0.5 * Math.sin(Math.max(0, t - 3.45) * TAU * 2.1);
    let hF = lerpP(rest, P(T.x - 3, T.y - 20), pick);
    hF = lerpP(hF, P(632 - c * 7, 386), clapK);
    const hB = lerpP(P(598, 478), P(612 + c * 6, 390), clapK);
    drawFigure(ctx, 'extraF', {
      x: SA.teacher.x, y: SA.teacher.y, facing: 1, ...POSE.stand,
      lean: key(t, [[1.7, 3], [2.4, 15], [3.05, 15], [3.6, 2]]), head: key(t, [[0, 2], [2.0, 8], [3.2, 8], [3.8, -4]]) + talk(F, 'a3_award') * 2,
      handF: hF, handB: hB,
    }, { ink: ST_INK, light: ST_L, talk: talk(F, 'a3_award'), breath: tb });
  };

  // ── V1: steps in from the right at `trophy`, beaming, takes the other side, lifts, free arm up
  const vx = key(t, [[tr - 0.45, 1300], [tr + 0.45, 1006, ease.inOutSine]]);
  const vWalkW = 1 - ramp(t, tr + 0.2, 0.35, ease.inOutSine);
  const vPose = mixPose(POSE.stand, POSE.walk(walkPhase(1300 - vx, 'v1', 1, 0.2), { stride: 0.2 }), vWalkW);

  stage.back(ctx, F, o);
  ctx.save(); ctx.translate(960, 402); ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.x, -cam.y);
  teach();
  ctx.restore();
  stage.mid(ctx, F, o);
  ctx.save(); ctx.translate(960, 402); ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.x, -cam.y);
  {
    // Maya
    const grabW = key(t, [[2.55, 0], [2.88, 1]]);
    const mPose = mixPose(mixPose(POSE.stand, mWalk, Math.max(walkW, stepW)), POSE.stand, 0);
    const restF = P(mx + mf * 8, 640 - 112);
    const handF = grabW > 0 ? lerpP(restF, P(T.x - mf * 2 + (lift > 0 ? -4 : 0), T.y - 12), grabW) : undefined;
    drawFigure(ctx, 'maya', {
      x: mx, y: 640 - bounce, facing: mf, ...mPose,
      head: key(t, [[0, -4], [2.4, -8], [3.4, 2], [tr + 0.4, -6], [tr + 1.1, -22], [9, -18]]),
      lean: (mPose.lean || 0) * Math.max(walkW, stepW) + key(t, [[2.5, 0], [2.9, 6], [3.5, 0]]) - jumpOn * 3,
      armB: key(t, [[tr + 1.0, [-6, 10]], [tr + 1.4, [166, 14]]]),
      ...(bounce > 0.5 ? { footF: [0.04, 0.02 * hop * jumpOn], footB: [-0.03, 0.02 * hop * jumpOn], footRotF: 18 * hop, footRotB: 18 * hop } : {}),
      handF,
    }, { ink: ST_INK, light: ST_L, breath: breath(t, 0.6, 2.4), wear: { starHeadband: true } });
    // V1
    if (vx < 1290) {
      const gripW = key(t, [[tr + 0.3, 0], [tr + 0.58, 1]]);
      const restV = P(vx - 4, 432);
      drawFigure(ctx, 'v1', {
        x: vx, y: 640, facing: -1, ...vPose,
        head: key(t, [[tr, 2], [tr + 0.5, -4], [tr + 1.1, -16]]), lean: (vPose.lean || 0) * vWalkW - 2,
        armB: key(t, [[tr + 1.0, [-4, 8]], [tr + 1.5, [158, 22]]]),
        handF: gripW > 0 ? lerpP(restV, P(T.x + 5, T.y - 30), gripW) : undefined,
      }, { ink: ST_INK, light: ST_L, breath: breath(t, 2), glint: 0.7, aura: 0.45 });
    }
    trophy(ctx, { x: T.x, y: T.y, size: TH, sparkle: 0.4 + 0.6 * ramp(t, ap, 0.6), t, light: { color: ST_L.color, from: 1, amount: 0.8 }, shadow: t < 1.85 ? 0.5 : 0 });
  }
  ctx.restore();
  stage.front(ctx, F, o);
}

function postScreen(ctx, F, t, sw, sh) {
  ctx.fillStyle = UI.bg; ctx.fillRect(0, 0, sw, sh);
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, 200, [[0, '#1d1812'], [1, 'rgba(15,17,20,0)']]); ctx.fillRect(0, 0, sw, 200);
  U.statusBar(ctx, { time: '6:11', battery: 0.08 });
  // header: avatar, caption + drawn star, time, more
  avatar(ctx, 42, 96, 24);
  const cap = 'So proud of our Maya';
  const cw = measure(ctx, cap, { size: 24, weight: 600 });
  text(ctx, cap, 76, 94, { size: 24, weight: 600, color: UI.text });
  star5(ctx, 76 + cw + 15, 86, 11, '#f5c542');
  text(ctx, '2 h  ·  Family', 76, 119, { size: 15.5, color: UI.text3 });
  for (let i = 0; i < 3; i++) { ctx.fillStyle = UI.text3; ctx.beginPath(); ctx.arc(352 + i * 7, 78, 2.2, 0, TAU); ctx.fill(); }
  // the video
  fillRR(ctx, VR3.x, VR3.y, VR3.w, VR3.h, 12, '#120a04');
  ctx.save(); rr(ctx, VR3.x, VR3.y, VR3.w, VR3.h, 12); ctx.clip();
  inVideo(ctx, VR3, CROP3, () => stageScene(ctx, F, t));
  ctx.restore();
  // like counter (corner of the video)
  const n = 214 + Math.floor(1.6 * Math.max(0, t) + 34 * ramp(t, 3.4, 3.2, ease.linear) + 61 * ramp(t, 4.4, 4.8, ease.inOutSine));
  const lbl = String(n), lw2 = measure(ctx, lbl, { size: 19, weight: 600 });
  const px = VR3.x + VR3.w - 22 - lw2 - 34, py = VR3.y + VR3.h - 48;
  fillRR(ctx, px, py, lw2 + 46, 34, 17, 'rgba(10,6,3,0.55)');
  const beat = 1 + 0.08 * Math.max(0, Math.sin(t * 9)) * ramp(t, 3.4, 0.5);
  heart(ctx, px + 17, py + 17, 7.2 * beat, '#ff6b81');
  text(ctx, lbl, px + 31, py + 24, { size: 19, weight: 600, color: '#fff' });
  // progress bar under the video
  const prog = clamp((t + 0.9) / 10.6);
  fillRR(ctx, VR3.x, VR3.y + VR3.h + 7, VR3.w, 4, 2, UI.surface2);
  fillRR(ctx, VR3.x, VR3.y + VR3.h + 7, VR3.w * prog, 4, 2, '#ffd08a');
  ctx.fillStyle = '#ffe2b0'; ctx.beginPath(); ctx.arc(VR3.x + VR3.w * prog, VR3.y + VR3.h + 9, 5.5, 0, TAU); ctx.fill();
}

function a3_08_video(ctx, F) {
  const t = F.t, k = F.k;
  const sx = wobble(t, 1.0, 11) * 2, sy = wobble(t, 0.9, 13) * 2;
  const kk = ease.inOutSine(clamp(t / (F.T + 1)));
  U.phone(ctx, {
    x: 950 + sx, y: 402 + sy, w: lerp(610, 655, kk), rot: lerp(3, 2.3, kk), focus: [195, lerp(318, 342, kk)], worn: true,
    glow: '#ffcf96', glowAmt: 1.1, hand: 'right', grip: 540,
    thumb: { x: 318, y: 640, press: 0 },
    bg: (c) => U.softBackground(c, 'rainNight', t, { x: -k * 14, zoom: 1.02 + 0.02 * k }),
    overlay: (c, sw2, sh2) => U.raindropsOnGlass(c, t, sw2, sh2, { amt: 0.8, seed: 11 }),
  }, (c, sw2, sh2) => postScreen(c, F, t, sw2, sh2));
}

// ═════════════════════════════ a7_07_video ═════════════════════════════
const CA = carInterior.anchors, CAR_L = rimOf(carInterior.lights.rainNight), CAR_INK = LOOK.rainNight.ink;
const VR7 = { x: 0, y: 178, w: 390, h: 487 };           // the opened video, 4:5, full width
const MSG = {
  m1: 'Your optimisation trial has concluded.',
  m2: 'Subject demonstrated successful emotional recovery.',
  m3: 'Original biological Adam: Deceased 18 months ago.',
};
const BO = { size: 23, fill: '#323741', maxW: 330, slide: 16 };
const VID = { w: 214, h: 120 }, GAP = 13;

// the attachment bubble, as it appears in a7_08 (kept identical for continuity)
function videoBubble(ctx, x, y, alpha = 1) {
  const { w, h } = VID;
  ctx.save();
  ctx.globalAlpha *= alpha;
  fillRR(ctx, x, y, w, h, 18, '#0a121e');
  ctx.save(); rr(ctx, x, y, w, h, 18); ctx.clip();
  ctx.fillStyle = linGrad(ctx, 0, y, 0, y + h, [[0, '#0d1b30'], [0.6, '#16273f'], [1, '#080d16']]); ctx.fillRect(x, y, w, h);
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
  ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 21, 0, TAU); ctx.fill();
  ctx.fillStyle = '#10151d'; ctx.beginPath(); ctx.moveTo(x + w / 2 - 6, y + h / 2 - 10); ctx.lineTo(x + w / 2 + 11, y + h / 2); ctx.lineTo(x + w / 2 - 6, y + h / 2 + 10); ctx.closePath(); ctx.fill();
  fillRR(ctx, x + w - 54, y + h - 31, 44, 22, 11, 'rgba(0,0,0,.6)');
  text(ctx, '0:09', x + w - 32, y + h - 15, { size: 15, weight: 600, color: '#fff', align: 'center' });
  ctx.restore();
}

let _layout = null;
function threadLayout(ctx) {
  if (_layout) return _layout;
  const items = ['m1', 'm2', 'm3'].map((id) => ({ id, ...U.bubbleSize(ctx, MSG[id], BO) }));
  items.push({ id: 'vid', ...VID });
  let y = 604 - (items.reduce((a, it) => a + it.h, 0) + GAP * (items.length - 1));
  const map = {};
  for (const it of items) { it.y = y; map[it.id] = it; y += it.h + GAP; }
  return (_layout = map);
}

// The original Adam in the car. tt = shot time, frozen at `end`.
function carScene(ctx, F, tt) {
  const play = F.ev('play'), wipe = F.ev('wipe');
  const c1 = F.cue('a7_video1'), c2 = F.cue('a7_video2');
  const reachT = c2.end + 0.25;
  const cam = {
    x: key(tt, [[play, 935], [c1.end, 930], [c2.at - 0.3, 922], [reachT, 922], [reachT + 1.2, 948]]),
    y: key(tt, [[play, 452], [c1.end, 440], [c2.at - 0.3, 428], [reachT, 430], [reachT + 1.2, 440]]),
    zoom: key(tt, [[play, 1.75], [c1.end, 1.9, ease.inOutSine], [c2.at - 0.3, 2.3, ease.inOutSine], [reachT, 2.32], [reachT + 1.2, 2.05, ease.inOutSine]]),
  };
  const o = { look: 'rainNight', cam, t: tt, rain: 1, lamp: 1, dash: 1, mist: 0.45 };
  carInterior.back(ctx, F, o);
  ctx.save(); ctx.translate(960, 402); ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.x, -cam.y);
  {
    // head: low and exhausted → wipe → up to the lens → a7_video1 → down and away (pause) → up → a7_video2 → reach
    const down = c1.end + 0.35, up2 = c2.at - 0.55;
    const head = key(tt, [[0, 27], [wipe, 27], [wipe + 0.3, 20], [wipe + 0.95, 20], [c1.at - 0.05, 5, ease.inOutSine],
      [down, 5], [down + 0.9, 33, ease.inOutSine], [up2, 31], [up2 + 0.5, 5, ease.inOutSine], [reachT, 6], [reachT + 0.8, 1]]);
    const neck = key(tt, [[0, 8], [c1.at - 0.05, 2], [down, 2], [down + 0.9, 9], [up2, 9], [up2 + 0.5, 2]]);
    const lean = key(tt, [[0, 4], [c1.at, 2], [down + 0.9, 7], [up2 + 0.5, 3], [reachT, 3], [reachT + 0.8, 15]]);
    // front hand: lap → heel of the hand across the eyes → lap → reach toward the lens
    const lap = P(938, 556), eye = P(957 + Math.sin(Math.max(0, tt - wipe - 0.3) * 8) * 5, 431);
    const toEye = key(tt, [[wipe, 0], [wipe + 0.3, 1], [wipe + 0.75, 1], [wipe + 1.05, 0]]);
    const toLens = key(tt, [[reachT, 0], [reachT + 0.9, 1, ease.inOutSine]]);
    const handF = lerpP(lerpP(lap, eye, toEye), P(1072, 452), toLens);
    drawFigure(ctx, 'original', {
      ...CA.driver, facing: 1, ...POSE.sit, curl: 10, neck, head, lean,
      handF, handRotF: toEye * -40, handB: P(CA.wheelGrip.x, CA.wheelGrip.y + 8),
    }, {
      ink: CAR_INK, light: CAR_L, talk: talk(F, 'a7_video1', 'a7_video2'), breath: breath(tt, 0, 1.3) * 1.3,
      tear: key(tt, [[down + 0.3, 0], [up2 - 0.1, 0.5]]),
    });
  }
  ctx.restore();
  carInterior.front(ctx, F, o);
}

function playerScreen(ctx, F, t, sw, sh) {
  const play = F.ev('play'), end = F.ev('end');
  const e = ease.inOutCubic(clamp((t - play) / 0.3));
  const L = threadLayout(ctx);
  // the thread underneath
  ctx.fillStyle = '#0e1013'; ctx.fillRect(0, 0, sw, sh);
  if (e < 1) {
    ctx.save(); ctx.globalAlpha = 1 - e;
    for (const id of ['m1', 'm2', 'm3']) U.bubble(ctx, { ...BO, x: 16, y: L[id].y, text: MSG[id], side: 'in' });
    U.statusBar(ctx, { time: '8:13', battery: 0.5 });
    ctx.restore();
  }
  // the player
  if (e > 0) { ctx.fillStyle = `rgba(0,0,0,${e})`; ctx.fillRect(0, 0, sw, sh); }
  const b = { x: 16, y: L.vid.y, w: VID.w, h: VID.h };
  const R = { x: lerp(b.x, VR7.x, e), y: lerp(b.y, VR7.y, e), w: lerp(b.w, VR7.w, e), h: lerp(b.h, VR7.h, e) };
  if (e > 0) {
    const tt = Math.min(t, end);
    inVideo(ctx, R, carInterior.anchors.crop45, () => carScene(ctx, F, tt), lerp(18, 0, e));
  }
  if (e < 1) {
    ctx.save(); ctx.translate(R.x, R.y); ctx.scale(R.w / VID.w, R.h / VID.h); ctx.translate(-16, -L.vid.y);
    videoBubble(ctx, 16, L.vid.y, 1 - e);
    ctx.restore();
  }
  if (e <= 0) return;
  // freeze at `end`: dim 20 %, replay arrow + duration
  const fz = ramp(t, end, 0.3);
  if (fz > 0) { ctx.fillStyle = `rgba(0,0,0,${0.2 * fz})`; ctx.fillRect(VR7.x, VR7.y, VR7.w, VR7.h); }
  // overlays (part of the recording)
  const oa = clamp((e - 0.5) / 0.5);
  ctx.save(); ctx.globalAlpha = oa;
  const blink = t >= end ? 1 : (Math.sin((t - play) * Math.PI * 1.6) > -0.2 ? 1 : 0.25);
  ctx.fillStyle = rgba(C.alert, blink); ctx.beginPath(); ctx.arc(VR7.x + 24, VR7.y + 28, 6.5, 0, TAU); ctx.fill();
  const sh2 = { color: 'rgba(0,0,0,.7)', blur: 4 };
  text(ctx, 'REC', VR7.x + 37, VR7.y + 35, { size: 19, weight: 600, family: FONT.mono, color: '#f2f2f2', tracking: 1.5, shadow: sh2 });
  text(ctx, '18 months ago', VR7.x + VR7.w - 16, VR7.y + 35, { size: 18, weight: 500, family: FONT.mono, color: '#f2f2f2', align: 'right', tracking: 0.5, shadow: sh2 });
  // scrub bar along the bottom of the video
  const prog = clamp((Math.min(t, end) - play) / (end - play));
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(VR7.x + 16, VR7.y + VR7.h - 16, VR7.w - 32, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(VR7.x + 16, VR7.y + VR7.h - 16, (VR7.w - 32) * prog, 3);
  ctx.restore();
  if (fz > 0) {
    const cx = VR7.x + VR7.w * 0.3, cy = VR7.y + VR7.h * 0.7, a = ramp(t, end + 0.15, 0.35);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(cx, cy, 36, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, 17, -Math.PI * 0.35, Math.PI * 1.45); ctx.stroke();
    const ax = cx + Math.cos(-Math.PI * 0.35) * 17, ay = cy + Math.sin(-Math.PI * 0.35) * 17;
    ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.moveTo(ax + 9, ay - 4); ctx.lineTo(ax - 3, ay - 10); ctx.lineTo(ax - 1, ay + 5); ctx.closePath(); ctx.fill();
    text(ctx, '0:09', cx, cy + 66, { size: 20, weight: 600, family: FONT.mono, color: '#f4f4f4', align: 'center', tracking: 1, shadow: { color: 'rgba(0,0,0,.8)', blur: 6 } });
    ctx.restore();
  }
}

function a7_07_video(ctx, F) {
  const t = F.t, k = F.k, kk = ease.inOutSine(clamp(t / (F.T + 1)));
  const gl = mixHex('#ffe2b0', '#c3d6ee', 0.4);
  const tap = F.ev('play') - 0.12;
  const thumb = key(t, [[0, { x: 330, y: 760, press: 0 }], [tap - 0.3, { x: 128, y: 560, press: 0 }], [tap - 0.05, { x: 124, y: 556, press: 1 }],
    [tap + 0.1, { x: 124, y: 556, press: 0 }], [tap + 0.7, { x: 372, y: 770, press: 0 }]]);
  U.phone(ctx, {
    x: 960 + wobble(t, 0.8, 21) * 1.6, y: 402 + wobble(t, 0.7, 23) * 1.6, w: lerp(700, 740, kk), rot: lerp(3.1, 2.6, kk), focus: [195, 422], worn: true,
    glow: gl, glowAmt: 0.3, hand: 'right', grip: 640, thumb, ink: '#160c05',
    rim: { color: mixHex('#fff0c4', '#dce9f8', 0.4), amt: 0.9, dx: -1, dy: -1 },
    sheen: { env: gl, envAmt: 0.17 },
    bg: (c) => {
      U.softBackground(c, 'goldenStreet', t, { x: -k * 16, zoom: 1.03 + 0.02 * k });
      c.save(); c.fillStyle = 'rgba(110,150,215,0.07)'; c.fillRect(0, 0, PW, PH); c.restore();
    },
  }, (c, sw2, sh2) => playerScreen(c, F, t, sw2, sh2));
}

export const shots = { a3_08_video, a7_07_video };
