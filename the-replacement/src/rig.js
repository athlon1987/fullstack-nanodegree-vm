// THE REPLACEMENT — character rig. Side-view (profile) silhouette puppets.
//
// ── QUICK START ────────────────────────────────────────────────────────────────────────────
//   import { drawFigure, POSE, mixPose, drawHand } from '../rig.js';
//   const a = drawFigure(ctx, 'adam', { x: 600, y: 700, facing: 1, ...POSE.stand },
//                        { light: { color: '#ffd08a', from: 1, amount: 0.9 }, talk: F.voice('a1_try') });
//   // a.handF, a.head, a.eye ... are WORLD coordinates you can attach props / other figures to.
//   Close-ups are just the camera: camera(ctx, {x: a.head.x, y: a.head.y, zoom: 3}, 1, ...).
//
// ── drawFigure(ctx, who, pose, opts) → anchors ─────────────────────────────────────────────
// who   'adam' | 'v1' | 'original' | 'wife' | 'maya' | 'manager' | 'guard' | 'clerk' | 'rep' | 'officer' | 'extraM' | 'extraF'
// pose  { x, y,          WORLD point on the floor under the hips (feet stand at y)
//         s: 1,          scale (1 = adult 430 px tall, Maya 285 px)
//         facing: 1,     1 faces screen right, -1 faces left
//         hip: 1,        pelvis height as a fraction of standing height (0.6 = deep crouch)
//         seat: null,    OR: height in px of the seat the figure sits on (chair 110, bench 110, bed 120, step 40...)
//         hipX: 0,       pelvis shift forward, in fractions of body height
//         lean: 0,       torso lean, degrees (+ = forward)
//         curl: 0,       rounding of the upper back / shoulders forward, degrees
//         neck: 0,       neck angle, degrees (+ = head carried forward)
//         head: 0,       head tilt, degrees (+ = chin down, - = looking up)
//         armF: [sh, el] front arm, degrees. sh: 0 hangs straight down, 90 = pointing forward, 180 = straight up, negative = back.
//                        el: elbow bend, 0 straight, + folds the forearm forward/up.
//         armB: [sh, el] back arm (the one behind the body)
//         handF / handB: {x, y}   WORLD target for that hand — overrides armF/armB with IK (use for hands on tables, shoulders, props)
//         legF / legB: [hip, knee]  FK leg, degrees. hip: 0 straight down, + forward. knee: 0 straight, + folds the shin back.
//         footF / footB: [dx, dy]   IK foot target relative to (x, y), in fractions of body height (default: planted on the floor).
//                                   legF/legB FK is used only when given; otherwise feet are planted by IK.
//         footRotF / footRotB: 0    foot pitch degrees (+ = toes down)
//         handRotF / handRotB: 0    extra wrist rotation degrees }
//       Each character has a built-in POSTURE added to lean/curl/neck (Adam slouches, V1 is plumb) so the same pose
//       reads differently on each. Pass posture: 0..1 in opts to scale it (V1 "softening" = posture borrowed from Adam: opts.slouch 0..1).
// opts  { ink: '#07090e',  silhouette colour (use LOOK[look].ink)
//         light: { color (or key), from: 1|-1, amount: 0..1 }   rim light on the edges facing the key light — a set's lights[look] object can be passed as is
//         aura: 0..1   cyan edge-glow (defaults to 0.5 for v1, 0 for everyone else)
//         glint: 0..1  pin-point cyan light at the eye (any character)
//         catch: 0..1  tiny WARM catch-light at the eye — only in tight close-ups (zoom > 2.5); never on wide shots
//         tear: 0..1   bright bead running from the eye down the cheek
//         talk: 0..1   jaw drop + nod — pass F.voice(cueId)
//         breath: -1..1 chest rise — pass Math.sin(t * 1.6)
//         slouch: 0..1 extra Adam-like slouch (use on V1 when he "softens")
//         posture: 0..1 scale of the built-in posture (default 1)
//         alpha: 1
//         wear: { backpack, starHeadband, pyjamas, noTie, bag }   accessories (Maya: backpack / starHeadband / pyjamas; Adam: bag)
//         held: { front(ctx, s), back(ctx, s) }   draw a prop in the front/back hand: origin at the grip, +x along the fingers,
//                 already rotated with the hand; 1 unit = 1 world px. (Mirrored when facing = -1.) }
// returns anchors in WORLD px: { head:{x,y,r}, eye, mouth, chin, cheek, top, neck, chest, hip, shoulder, handF, handB, elbowF, elbowB,
//                                kneeF, kneeB, footF, footB, lap, h (figure height in world px) }
//
// ── POSE ───────────────────────────────────────────────────────────────────────────────────
// Plain objects (spread them, tweak any field, blend with mixPose(a, b, k) or engine key()):
//   stand, sit (seat 110), sitForward (forearms on a table), sitHunched (bench, elbows on knees), sitBed, sitSteps (child on a step),
//   sleepSit, kneelOne, kneelWork, crouch, handOnBack, handsOnHead, point, reachOut, holdPhone, phoneUp, holdAtSide, holdToChest,
//   tapCard, present, leanBack (leaning on a counter laughing), armsOpen, headBowed, lookUp, hugKneel, hugSeated, childHug,
//   childArmsUp, wave, foreheadOnDoor, wipeEyes, highFive
// Generators: POSE.walk(phase, {stride, lift, swing}), POSE.run(phase), POSE.clap(phase).  phase 0..1 loops.
//   walkPhase(distancePx, who, s) → phase for a figure that has travelled distancePx (keeps feet from sliding).
//
// ── drawHand(ctx, {x, y, size, rot, flip, pose, ink, cuff, light}) ─────────────────────────
// A close-up hand + forearm for inserts. (x, y) is the wrist, the fingers point along +x before `rot` (degrees);
// size = hand length in px; flip mirrors vertically (thumb side); pose: 'flat' | 'open' | 'point' | 'grip' | 'pinch'; cuff: shirt-cuff colour or null.
import { clamp, lerp, TAU, mix, glow, rgba } from './engine.js';
import { C, LOOK } from './style.js';

const D = Math.PI / 180;
const dirUp = (a) => [Math.sin(a * D), -Math.cos(a * D)];
const dirDn = (a) => [Math.sin(a * D), Math.cos(a * D)];
const add = (p, d, l = 1) => [p[0] + d[0] * l, p[1] + d[1] * l];
const rot2 = (v, a) => { const c = Math.cos(a * D), s = Math.sin(a * D); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };

/** Two-bone IK. bend = -1 puts the joint on the forward side (knees), +1 on the back side (elbows). Returns [joint, end]. */
function ik(R, T, a, b, bend) {
  const dx = T[0] - R[0], dy = T[1] - R[1], d = Math.hypot(dx, dy) || 0.001;
  const dc = clamp(d, Math.abs(a - b) + 0.01, a + b - 0.01);
  const base = Math.atan2(dy, dx);
  const A = Math.acos(clamp((a * a + dc * dc - b * b) / (2 * a * dc), -1, 1));
  const J = [R[0] + Math.cos(base + bend * A) * a, R[1] + Math.sin(base + bend * A) * a];
  const ex = R[0] + (dx / d) * dc, ey = R[1] + (dy / d) * dc;
  return [J, [ex, ey]];
}

function limb(ctx, A, B, rA, rB) {
  const ang = Math.atan2(B[1] - A[1], B[0] - A[0]), nx = -Math.sin(ang), ny = Math.cos(ang);
  ctx.beginPath();
  ctx.moveTo(A[0] + nx * rA, A[1] + ny * rA);
  ctx.lineTo(B[0] + nx * rB, B[1] + ny * rB);
  ctx.arc(B[0], B[1], rB, ang + Math.PI / 2, ang - Math.PI / 2, true);
  ctx.lineTo(A[0] - nx * rA, A[1] - ny * rA);
  ctx.arc(A[0], A[1], rA, ang - Math.PI / 2, ang + Math.PI / 2, true);
  ctx.closePath(); ctx.fill();
}

/** Closed Catmull-Rom spline through pts. */
function blob(ctx, pts, tension = 0.5) {
  const n = pts.length;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const k = tension / 3 * 2;
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k / 2, p1[1] + (p2[1] - p0[1]) * k / 2, p2[0] - (p3[0] - p1[0]) * k / 2, p2[1] - (p3[1] - p1[1]) * k / 2, p2[0], p2[1]);
  }
  ctx.closePath(); ctx.fill();
}
function poly(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill(); }

// ── cast ──────────────────────────────────────────────────────────────────────────────────
const BASE = {
  h: 430, head: 0.128, neckL: 0.074, torso: 0.30, thigh: 0.245, shin: 0.25, uarm: 0.165, farm: 0.15, hand: 0.052,
  chestF: 0.07, chestB: 0.062, waistF: 0.058, waistB: 0.05, pelvF: 0.052, pelvB: 0.066, belly: 0, neckW: 0.03,
  armW: 0.03, legW: 0.04, posture: { lean: 0, curl: 0, neck: 0 }, aura: 0, face: 'm',
};
export const CAST = {
  adam: { ...BASE, belly: 0.022, posture: { lean: 3, curl: 15, neck: 13 }, tuft: 1, tail: 1, tie: 'loose' },
  v1: { ...BASE, belly: 0.01, posture: { lean: -1, curl: -2, neck: 0 }, aura: 0.5, tie: 'straight' },
  wife: { ...BASE, h: 404, face: 'f', chestF: 0.066, chestB: 0.055, waistF: 0.05, waistB: 0.046, pelvB: 0.07, armW: 0.025, legW: 0.034, neckW: 0.024, bun: 1, skirt: 0.78, posture: { lean: 1, curl: 5, neck: 4 } },
  maya: { ...BASE, h: 285, head: 0.178, neckL: 0.085, torso: 0.29, thigh: 0.215, shin: 0.225, uarm: 0.15, farm: 0.135, hand: 0.055, face: 'c',
    chestF: 0.062, chestB: 0.058, waistF: 0.062, waistB: 0.055, pelvF: 0.058, pelvB: 0.062, armW: 0.026, legW: 0.036, neckW: 0.028, bunches: 1, dress: 0.5 },
  manager: { ...BASE, h: 424, chestF: 0.088, chestB: 0.074, waistF: 0.085, waistB: 0.06, belly: 0.04, neckW: 0.042, armW: 0.032, legW: 0.046, jacket: 1, glasses: 1, posture: { lean: 2, curl: 6, neck: 6 } },
  guard: { ...BASE, h: 436, chestF: 0.078, belly: 0.02, cap: 1, belt: 1, posture: { lean: 0, curl: 3, neck: 3 } },
  clerk: { ...BASE, h: 418, chestF: 0.058, chestB: 0.056, waistF: 0.05, armW: 0.025, legW: 0.034, neckW: 0.024, glasses: 1, posture: { lean: 4, curl: 12, neck: 10 } },
  rep: { ...BASE, h: 428, face: 'f', chestF: 0.062, chestB: 0.052, waistF: 0.048, waistB: 0.044, armW: 0.024, legW: 0.032, neckW: 0.023, bob: 1, coat: 0.55, heels: 1, posture: { lean: -1, curl: -2, neck: -2 } },
  officer: { ...BASE, h: 440, chestF: 0.092, chestB: 0.08, waistF: 0.08, waistB: 0.066, armW: 0.032, legW: 0.046, neckW: 0.036, cap: 1, belt: 1, boots: 1 },
  extraM: { ...BASE, h: 426, jacket: 1, posture: { lean: 2, curl: 5, neck: 5 } },
  extraF: { ...BASE, h: 400, face: 'f', armW: 0.025, legW: 0.034, neckW: 0.024, bun: 1, coat: 0.5, posture: { lean: 1, curl: 4, neck: 3 } },
};
CAST.original = CAST.adam;

// ── "lit" style: coloured, shaded characters with faces (the default style is pure silhouette) ──────────────
// Switch globally with setRigStyle('lit') or film.html?style=lit, or per figure with opts.style = 'lit'.
// In lit style `ink` is used only to recognise the scene's lighting state (pass LOOK[look].ink as usual).
let _style = 'silhouette';
export const setRigStyle = (v) => { _style = v; };
const styleNow = (o) => o.style || globalThis.__RIG_STYLE || _style;
const PALS = {
  adam: { skin: '#c58a5f', skinShade: '#8f5c3a', hair: '#1c1512', top: '#bcc7d4', collar: '#d3dbe5', tie: '#44546e', legs: '#2c3342', shoe: '#17181c', line: '#2a1a12' },
  v1: { skin: '#c58a5f', skinShade: '#8f5c3a', hair: '#15100e', top: '#e6ebf2', collar: '#f6f8fb', tie: '#2e4a78', legs: '#232a38', shoe: '#111216', line: '#2a1a12' },
  wife: { skin: '#cf976c', skinShade: '#986846', hair: '#1a1210', top: '#a9b4c2', skirt: '#47505f', legs: '#b98560', shoe: '#1c1a1c', line: '#2a1a12' },
  maya: { skin: '#d39c72', skinShade: '#9e6d4a', hair: '#1a1210', top: '#33456e', sleeve: '#e9edf2', collar: '#e9edf2', dress: '#33456e', legs: '#d39c72', shoe: '#17181c', pack: '#b7964a', gold: '#e6bd4f', line: '#2a1a12', pyj: '#93a9cc' },
  manager: { skin: '#b97f56', skinShade: '#835636', hair: '#3b3734', top: '#2a303c', collar: '#dfe5ec', legs: '#252a35', shoe: '#121317', line: '#24160f' },
  guard: { skin: '#b97f56', skinShade: '#835636', hair: '#17110f', top: '#2a3b54', cap: '#1e2a3d', legs: '#1f2a3b', shoe: '#101114', line: '#24160f' },
  clerk: { skin: '#cf976c', skinShade: '#986846', hair: '#2a2420', top: '#737a69', legs: '#3a3e3b', shoe: '#18181a', line: '#2a1a12' },
  rep: { skin: '#dcaa84', skinShade: '#a47551', hair: '#0f0c0b', top: '#1d2129', coat: '#1d2129', legs: '#1a1d24', shoe: '#0d0e10', line: '#2a1a12' },
  officer: { skin: '#b97f56', skinShade: '#835636', hair: '#14100e', top: '#1d2535', cap: '#151b28', legs: '#1b2231', shoe: '#0e0f12', line: '#24160f' },
  extraM: { skin: '#c58a5f', skinShade: '#8f5c3a', hair: '#1c1512', top: '#4a5466', legs: '#2d3340', shoe: '#17181c', line: '#2a1a12' },
  extraF: { skin: '#cf976c', skinShade: '#986846', hair: '#1a1210', top: '#7d8796', coat: '#59616e', legs: '#b98560', shoe: '#1c1a1c', line: '#2a1a12' },
};
for (const [k, v] of Object.entries(PALS)) CAST[k].pal = v;
CAST.adam.stubble = 1;
// how much each lighting state swallows a figure: [ambient amount, ambient colour]
const AMB = { predawn: [0.5, '#0b1630'], greyMorning: [0.2, '#4a5a72'], officeDay: [0.08, '#7f90a6'], dusk: [0.4, '#1c1838'], blueHour: [0.48, '#0c183a'], nightDark: [0.64, '#050914'],
  warmDay: [0.1, '#9a5a28'], corridor: [0.4, '#0f1a20'], policeNight: [0.52, '#060a18'], gov: [0.18, '#4f6a56'], rainNight: [0.56, '#060b16'], greyDawn: [0.24, '#4c5868'], lampNight: [0.48, '#100904'], golden: [0.12, '#a05e22'] };
const INK2LOOK = Object.fromEntries(Object.entries(LOOK).map(([k, v]) => [v.ink.toLowerCase(), k]));
let _col = null;                                   // the palette being painted with (null = silhouette)
const tone = (ctx, name) => { if (_col) { const v = _col[name] ?? _col.top; ctx.fillStyle = v; ctx.strokeStyle = v; } };

// profile outline in head units (head height = 1): origin under the chin, +x = face forward, -y = up
const FACE = [
  [0.0, 0.1], [0.11, 0.05], [0.25, 0.02], [0.345, -0.03], [0.372, -0.1], [0.352, -0.16], [0.386, -0.205], [0.371, -0.238], [0.399, -0.275],
  [0.386, -0.318], [0.44, -0.338], [0.497, -0.378], [0.45, -0.45], [0.4, -0.525], [0.413, -0.59], [0.4, -0.7], [0.355, -0.83],
  [0.24, -0.94], [0.05, -1.0], [-0.18, -0.985], [-0.36, -0.88], [-0.455, -0.7], [-0.46, -0.5], [-0.38, -0.32], [-0.28, -0.2], [-0.26, 0.1],
];
const PIVOT = [-0.08, -0.25];
function facePts(kind, talk) {
  return FACE.map(([x, y], i) => {
    if (kind === 'f') { if (i >= 9 && i <= 12) x = lerp(0.37, x, 0.8); if (i === 14) x -= 0.012; if (i === 6 || i === 8) x += 0.006; if (i >= 3 && i <= 4) x -= 0.014; }
    if (kind === 'c') { // child: bigger cranium, small soft nose and chin, round forehead
      if (i >= 9 && i <= 12) x = lerp(0.36, x, 0.62); if (i >= 2 && i <= 5) x -= 0.03; if (i === 14 || i === 15) x += 0.012;
      if (i >= 17 && i <= 23) { x = -0.03 + (x + 0.03) * 1.07; y = -0.55 + (y + 0.55) * 1.05; }
    }
    if (talk && i >= 1 && i <= 6) { y += talk * (i === 6 ? 0.018 : 0.036); x -= talk * 0.008; }
    return [x, y];
  });
}

// ── poses ─────────────────────────────────────────────────────────────────────────────────
const P0 = { hip: 1, hipX: 0, lean: 0, curl: 0, neck: 0, head: 0, armF: [4, 6], armB: [-4, 6], footF: [0.035, 0], footB: [-0.03, 0], footRotF: 0, footRotB: 0, handRotF: 0, handRotB: 0 };
export const POSE = {
  stand: { ...P0 },
  sit: { ...P0, seat: 110, lean: 2, armF: [18, 42], armB: [10, 40], footF: [0.25, 0], footB: [0.2, 0] },
  sitForward: { ...P0, seat: 110, lean: 17, curl: 8, head: 4, armF: [50, 62], armB: [44, 66], footF: [0.24, 0], footB: [0.17, 0] },
  sitHunched: { ...P0, seat: 110, lean: 30, curl: 16, neck: 8, head: 16, armF: [40, 55], armB: [34, 58], footF: [0.23, 0], footB: [0.17, 0] },
  sitBed: { ...P0, seat: 120, lean: 12, curl: 12, head: 10, armF: [12, 20], armB: [8, 22], footF: [0.22, 0], footB: [0.17, 0] },
  sitSteps: { ...P0, seat: 40, lean: 20, curl: 12, head: 14, armF: [44, 70], armB: [40, 72], footF: [0.3, 0.02], footB: [0.25, 0.02] },
  sleepSit: { ...P0, seat: 110, lean: -6, curl: 16, neck: 12, head: 34, armF: [14, 34], armB: [10, 34], footF: [0.3, 0], footB: [0.22, 0] },
  kneelOne: { ...P0, hip: 0.56, lean: 6, armF: [22, 30], armB: [8, 20], footF: [0.24, 0], legB: [-12, 96], footRotB: 70 },
  kneelWork: { ...P0, hip: 0.53, lean: 38, curl: 10, head: -8, armF: [70, 20], armB: [58, 30], legF: [58, 118], legB: [40, 126], footRotF: 70, footRotB: 70 },
  crouch: { ...P0, hip: 0.55, lean: 28, head: -12, armF: [60, 40], armB: [40, 50], footF: [0.1, 0], footB: [-0.04, 0] },
  handOnBack: { ...P0, armF: [-32, -78], handRotF: 40 },
  handsOnHead: { ...P0, head: -8, lean: -4, armF: [150, 118], armB: [146, 122] },
  point: { ...P0, lean: 12, neck: 6, armF: [86, 4], armB: [-26, 28], footF: [0.11, 0], footB: [-0.08, 0] },
  reachOut: { ...P0, lean: 8, armF: [62, 14] },
  holdPhone: { ...P0, head: 24, neck: 6, armF: [28, 96], handRotF: -20 },
  phoneUp: { ...P0, head: 8, armF: [58, 118] },
  holdAtSide: { ...P0, armF: [6, 4] },
  holdToChest: { ...P0, armF: [20, 128], armB: [14, 120] },
  tapCard: { ...P0, lean: 5, armF: [48, 40] },
  present: { ...P0, lean: -2, armF: [-40, -40], armB: [110, 20] },
  leanBack: { ...P0, lean: -16, curl: -6, head: -22, hipX: -0.02, armF: [-24, -36], armB: [-30, -30], footF: [0.1, 0], footB: [0.02, 0] },
  armsOpen: { ...P0, lean: 6, head: 6, armF: [48, 24], armB: [36, 30] },
  headBowed: { ...P0, curl: 10, neck: 12, head: 30 },
  lookUp: { ...P0, head: -24, neck: -6 },
  hugKneel: { ...P0, hip: 0.5, lean: 12, curl: 12, head: 14, armF: [58, 78], armB: [50, 84], legF: [40, 118], legB: [26, 122], footRotF: 70, footRotB: 70 },
  hugSeated: { ...P0, seat: 110, lean: 14, curl: 12, head: 16, armF: [52, 80], armB: [46, 86], footF: [0.24, 0], footB: [0.17, 0] },
  childHug: { ...P0, lean: 10, head: -6, armF: [124, 26], armB: [116, 30], footRotF: 14, footRotB: 14 },
  childArmsUp: { ...P0, head: -14, lean: -3, armF: [168, 8], armB: [160, 10] },
  wave: { ...P0, head: -8, armF: [160, 24] },
  foreheadOnDoor: { ...P0, lean: 9, curl: 10, neck: 14, head: 22, armF: [10, 8], armB: [2, 6], footF: [-0.02, 0], footB: [-0.1, 0] },
  wipeEyes: { ...P0, head: 18, curl: 8, armF: [44, 148] },
  highFive: { ...P0, armF: [128, 20] },
  /** Walk cycle. phase 0..1. */
  walk(phase, o = {}) {
    const { stride = 0.2, lift = 0.05, swing = 26 } = o;
    const foot = (ph) => {
      const u = ((ph % 1) + 1) % 1;
      if (u < 0.5) return { p: [lerp(stride, -stride, u / 0.5) + 0.005, 0], r: lerp(-8, 14, u / 0.5) };
      const v = (u - 0.5) / 0.5;
      return { p: [lerp(-stride, stride, v * v * (3 - 2 * v)) + 0.005, -Math.sin(v * Math.PI) * lift], r: lerp(34, -14, v) };
    };
    const f = foot(phase), b = foot(phase + 0.5), a = Math.sin(phase * TAU);
    // hips are lowest when both feet are down (legs spread) and highest as the body passes over the standing leg
    const hLow = Math.min(0.975, (Math.sqrt(Math.max(0.01, 0.244 - stride * stride)) + 0.06) / 0.553 - 0.006), hHigh = 0.985;
    return { ...P0, hip: hHigh - (hHigh - hLow) * (0.5 + 0.5 * Math.cos(phase * TAU * 2)), lean: 4, armF: [a * swing, 14 + Math.max(0, a) * 16], armB: [-a * swing, 14 + Math.max(0, -a) * 16],
      footF: f.p, footB: b.p, footRotF: f.r, footRotB: b.r, head: 2 };
  },
  /** Run cycle. phase 0..1. */
  run(phase) {
    const stride = 0.34;
    const foot = (ph) => {
      const u = ((ph % 1) + 1) % 1;
      if (u < 0.35) return { p: [lerp(stride * 0.75, -stride, u / 0.35), 0], r: lerp(-6, 30, u / 0.35) };
      const v = (u - 0.35) / 0.65;
      return { p: [lerp(-stride, stride * 0.75, v * v * (3 - 2 * v)), -0.05 - Math.sin(v * Math.PI) * 0.2], r: lerp(64, -10, v) };
    };
    const f = foot(phase), b = foot(phase + 0.5), a = Math.sin(phase * TAU);
    return { ...P0, hip: 0.93 + 0.04 * Math.abs(Math.sin(phase * TAU)), lean: 17, neck: 4, head: -4, armF: [a * 52 + 8, 84], armB: [-a * 52 + 8, 84], footF: f.p, footB: b.p, footRotF: f.r, footRotB: b.r };
  },
  clap(phase) { const k = 0.5 + 0.5 * Math.sin(phase * TAU); return { ...P0, armF: [52 - k * 6, 96 + k * 10], armB: [46 + k * 8, 92 - k * 8] }; },
};
export const mixPose = (a, b, k) => mix(a, b, k);
/** Walk phase for a figure that has travelled dist px (stride 0.2 → one cycle covers 0.8 body heights). */
export const walkPhase = (dist, who = 'adam', s = 1, stride = 0.2) => dist / (4 * stride * CAST[who].h * s);

const _priv = new Map();
function privateCanvas(tag, w, h) {
  const key = `${tag}${w}x${h}`;
  let e = _priv.get(key);
  if (!e) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; e = { cv, ctx: cv.getContext('2d', { willReadFrequently: true }) }; _priv.set(key, e); }
  return e;
}

// ── figure ────────────────────────────────────────────────────────────────────────────────
function build(c, p0, o) {
  const pst = c.posture, pk = o.posture ?? 1, sl = o.slouch || 0;
  const p = { ...P0, ...p0 };
  const H = c.h, hh = c.head * H;
  const lean = p.lean + pst.lean * pk + sl * 4, curl = p.curl + pst.curl * pk + sl * 16, neckA = p.neck + pst.neck * pk + sl * 12;
  const L = { thigh: c.thigh * H, shin: c.shin * H, uarm: c.uarm * H, farm: c.farm * H, hand: c.hand * H, torso: c.torso * H };
  const ankleH = 0.04 * H, standHip = (L.thigh + L.shin) * 0.996 + ankleH + 0.02 * H;
  const br = (o.breath || 0) * 0.004 * H;
  const P = [p.hipX * H, p.seat != null ? -(p.seat + 0.052 * H) : -standHip * p.hip];
  const M = add(P, dirUp(lean), L.torso * 0.5);
  const a2 = lean + curl;
  const S = add(M, dirUp(a2), L.torso * 0.5);
  const headAng = lean * 0.5 + curl * 0.35 + neckA * 0.7 + p.head - (o.talk || 0) * 2;
  const Hp = add(S, dirUp(a2 * 0.6 + neckA), c.neckL * H);                  // head pivot
  const hpt = (u, v) => add(Hp, rot2([(u - PIVOT[0]) * hh, (v - PIVOT[1]) * hh], headAng));
  // legs
  const leg = (fk, ft, off) => {
    const R = [P[0] + off * H, P[1] + 0.02 * H];
    if (fk) { const K = add(R, dirDn(fk[0]), L.thigh), A = add(K, dirDn(fk[0] - fk[1]), L.shin); return { R, K, A }; }
    const T = [ft[0] * H, ft[1] * H - ankleH];
    const [K, A] = ik(R, T, L.thigh, L.shin, -1);
    return { R, K, A };
  };
  const lF = leg(p.legF, p.footF, 0.008), lB = leg(p.legB, p.footB, -0.008);
  // arms
  const arm = (fk, target, rotExtra) => {
    const R = add(S, dirUp(a2), -0.012 * H);
    let E, W;
    if (target) { [E, W] = ik(R, target, L.uarm, L.farm, 1); }
    else { E = add(R, dirDn(fk[0]), L.uarm); W = add(E, dirDn(fk[0] + fk[1]), L.farm); }
    const fa = Math.atan2(W[1] - E[1], W[0] - E[0]) / D + (rotExtra || 0);
    const Hd = add(W, [Math.cos(fa * D), Math.sin(fa * D)], L.hand * 0.55);
    return { R, E, W, Hd, ang: fa };
  };
  const loc = (t) => (t ? [(t.x - p.x) / ((p.s || 1) * (p.facing || 1)), (t.y - p.y) / (p.s || 1)] : null);
  const aF = arm(p.armF, loc(p.handF), p.handRotF), aB = arm(p.armB, loc(p.handB), p.handRotB);
  return { p, c, H, hh, L, P, M, S, Hp, hpt, lean, a2, headAng, lF, lB, aF, aB, br, ankleH };
}

function paintLeg(ctx, g, l, rot) {
  const { c, H } = g, w = c.legW * H;
  tone(ctx, 'legs');
  limb(ctx, l.R, l.K, w * 1.08, w * 0.8);
  limb(ctx, l.K, l.A, w * 0.8, w * (c.boots ? 0.7 : 0.52));
  tone(ctx, 'shoe');
  ctx.save(); ctx.translate(l.A[0], l.A[1]); ctx.rotate((rot || 0) * D);
  const f = H * 0.001;
  ctx.beginPath();
  if (c.heels) { ctx.moveTo(-18 * f, 4 * f); ctx.lineTo(-20 * f, 40 * f); ctx.lineTo(-13 * f, 40 * f); ctx.lineTo(-6 * f, 22 * f); ctx.quadraticCurveTo(30 * f, 30 * f, 62 * f, 40 * f); ctx.lineTo(84 * f, 40 * f); ctx.quadraticCurveTo(70 * f, 10 * f, 22 * f, -8 * f); }
  else { ctx.moveTo(-24 * f, -4 * f); ctx.quadraticCurveTo(-30 * f, 38 * f, -22 * f, 40 * f); ctx.lineTo(86 * f, 40 * f); ctx.quadraticCurveTo(92 * f, 22 * f, 62 * f, 12 * f); ctx.quadraticCurveTo(36 * f, 4 * f, 24 * f, -10 * f); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function paintArm(ctx, g, a) {
  const { c, H } = g, w = c.armW * H;
  tone(ctx, 'sleeve');
  limb(ctx, a.R, a.E, w * 1.12, w * 0.86);
  limb(ctx, a.E, a.W, w * 0.86, w * 0.56);
  tone(ctx, 'skin');
  ctx.save(); ctx.translate(a.W[0], a.W[1]); ctx.rotate(a.ang * D);
  const hl = g.L.hand;
  ctx.beginPath(); ctx.ellipse(hl * 0.46, 0, hl * 0.56, hl * 0.3, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hl * 0.34, -hl * 0.3, hl * 0.3, hl * 0.13, -0.5, 0, TAU); ctx.fill();  // thumb
  ctx.restore();
}
function paintTorsoHead(ctx, g, o) {
  const { c, H, hh, P, M, S, lean, a2, hpt } = g;
  const n1 = [Math.cos(lean * D), Math.sin(lean * D)], n2 = [Math.cos(a2 * D), Math.sin(a2 * D)];
  const up1 = dirUp(lean), up2 = dirUp(a2);
  const bel = c.belly, br = g.br;
  const pts = [
    add(add(P, n1, -c.pelvB * H), up1, -0.045 * H), add(P, n1, -c.pelvB * H * 1.04), add(add(P, up1, 0.07 * H), n1, -c.waistB * H * 1.02),
    add(M, n1, -c.waistB * H), add(add(M, up2, 0.085 * H), n2, -c.chestB * H - br * 0.4), add(add(S, up2, -0.03 * H), n2, -c.chestB * H * 1.02 - br * 0.3),
    add(add(S, up2, 0.035 * H), n2, -c.chestB * H * 0.62), add(add(S, up2, 0.058 * H), n2, -0.012 * H), add(add(S, up2, 0.04 * H), n2, c.chestF * H * 0.5),
    add(add(S, up2, -0.035 * H), n2, c.chestF * H + br), add(add(M, up2, 0.06 * H), n2, (c.chestF * 0.98 + bel * 0.3) * H + br * 0.6),
    add(M, n1, (c.waistF + bel) * H), add(add(P, up1, 0.045 * H), n1, (c.pelvF + bel * 0.9) * H), add(add(P, n1, c.pelvF * H * 0.92), up1, -0.02 * H), add(P, up1, -0.06 * H),
  ];
  tone(ctx, 'top');
  blob(ctx, pts, 0.5);
  if (_col && c.tie === 'straight') { const k = add(add(S, up2, 0.012 * H), n2, c.chestF * H * 0.62), e2 = add(M, n1, (c.waistF + bel) * H * 0.7); tone(ctx, 'tie'); poly(ctx, [[k[0] - 0.006 * H, k[1]], [k[0] + 0.007 * H, k[1]], [e2[0] + 0.012 * H, e2[1] - 0.02 * H], [e2[0], e2[1]], [e2[0] - 0.01 * H, e2[1] - 0.02 * H]]); }
  if (_col && !c.skirt && !c.dress && !c.coat && !(o.wear && o.wear.pyjamas)) {
    // trousers come up to the waist (Adam's untucked shirt hangs lower at the back: his shirt-tail is drawn later)
    const top = c.tail ? 0.012 : 0.05, w = 1.04;
    tone(ctx, 'legs');
    blob(ctx, [add(add(P, n1, -c.pelvB * H * w), up1, top * H), add(add(P, n1, -c.pelvB * H * 1.06), up1, -0.02 * H), add(add(P, n1, -c.pelvB * H * 0.98), up1, -0.05 * H), add(P, up1, -0.066 * H),
      add(add(P, n1, c.pelvF * H * 0.94), up1, -0.026 * H), add(add(P, n1, (c.pelvF + bel * 0.9) * H * w), up1, top * H)], 0.4);
    if (!c.tail) { tone(ctx, 'shoe'); poly(ctx, [add(add(P, n1, -c.pelvB * H * w), up1, (top + 0.014) * H), add(add(P, n1, (c.pelvF + bel * 0.9) * H * w), up1, (top + 0.014) * H), add(add(P, n1, (c.pelvF + bel * 0.9) * H * w), up1, top * H), add(add(P, n1, -c.pelvB * H * w), up1, top * H)]); }
  }
  if (_col && _col.collar) { tone(ctx, 'collar'); poly(ctx, [add(add(S, up2, 0.058 * H), n2, -0.01 * H), add(add(S, up2, 0.062 * H), n2, c.chestF * H * 0.42), add(add(S, up2, 0.012 * H), n2, c.chestF * H * 0.8), add(add(S, up2, 0.03 * H), n2, c.chestF * H * 0.3)]); }
  tone(ctx, 'skin');
  // neck
  limb(ctx, add(S, up2, 0.03 * H), hpt(-0.1, -0.22), c.neckW * H * 1.25, c.neckW * H * 0.98);
  // head
  ctx.save();
  const face = facePts(c.face, o.talk || 0).map(([u, v]) => hpt(u, v));
  blob(ctx, face, 0.42);
  if (_col) paintFace(ctx, g, o, c);
  tone(ctx, 'hair');
  const hp = (list) => list.map(([u, v]) => hpt(u, v));
  const pyj = o.wear && o.wear.pyjamas;
  if (c.face !== 'c') blob(ctx, hp([[0.34, -0.86], [0.2, -0.985], [0.02, -1.04], [-0.22, -1.02], [-0.42, -0.9], [-0.5, -0.68], [-0.49, -0.46], [-0.4, -0.3], [-0.3, -0.42], [-0.1, -0.6], [0.2, -0.78]]), 0.5); // hair mass
  if (_col && !c.cap) {   // lit style: bring the hairline down over the temple so the hair does not read as a cap
    if (c.face === 'm') blob(ctx, hp([[-0.12, -0.6], [0.2, -0.78], [0.31, -0.85], [0.275, -0.72], [0.13, -0.64], [0.065, -0.5], [0.005, -0.44], [-0.02, -0.56]]), 0.5);
    else blob(ctx, hp([[-0.3, -0.42], [-0.1, -0.6], [0.2, -0.78], [0.31, -0.85], [0.265, -0.7], [0.1, -0.6], [0.02, -0.44], [-0.06, -0.33], [-0.22, -0.29]]), 0.5);
  }
  if (c.tuft) poly(ctx, hp([[-0.2, -1.0], [-0.21, -1.1], [-0.12, -1.035], [-0.07, -1.125], [-0.02, -1.03], [0.06, -1.085], [0.08, -1.0]]));
  if (c.bun) { const b = hpt(-0.5, -0.36); ctx.beginPath(); ctx.arc(b[0], b[1], hh * 0.17, 0, TAU); ctx.fill(); }
  if (c.bob) blob(ctx, hp([[0.3, -0.9], [0.05, -1.05], [-0.3, -1.0], [-0.52, -0.75], [-0.55, -0.4], [-0.5, -0.06], [-0.2, -0.02], [0.04, -0.1], [-0.02, -0.4], [0.16, -0.7]]), 0.42);
  if (c.face === 'c') {
    blob(ctx, hp([[0.38, -0.8], [0.24, -1.0], [0.0, -1.07], [-0.26, -1.04], [-0.47, -0.9], [-0.55, -0.66], [-0.52, -0.42], [-0.4, -0.28], [-0.3, -0.42], [-0.08, -0.62], [0.26, -0.74]]), 0.5);
    if (pyj) blob(ctx, hp([[-0.3, -0.9], [-0.56, -0.6], [-0.6, -0.2], [-0.52, 0.14], [-0.3, 0.2], [-0.24, -0.1], [-0.3, -0.4]]), 0.5); // loose hair
    else { blob(ctx, hp([[-0.44, -0.7], [-0.62, -0.74], [-0.78, -0.6], [-0.84, -0.36], [-0.76, -0.2], [-0.66, -0.34], [-0.6, -0.5], [-0.48, -0.52]]), 0.5); } // bunch
    if (o.wear && o.wear.starHeadband) {
      tone(ctx, 'gold');
      const sc = hpt(0.1, -1.2); ctx.beginPath();
      for (let i = 0; i < 10; i++) { const r = (i % 2 ? 0.11 : 0.25) * hh, a = -Math.PI / 2 + (i * Math.PI) / 5 + g.headAng * D; ctx[i ? 'lineTo' : 'moveTo'](sc[0] + Math.cos(a) * r, sc[1] + Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); poly(ctx, hp([[0.08, -1.02], [0.14, -1.02], [0.14, -1.14], [0.08, -1.14]]));
    }
  }
  if (c.cap) { tone(ctx, 'cap'); poly(ctx, hp([[0.42, -0.74], [0.68, -0.69], [0.68, -0.655], [0.4, -0.68], [-0.5, -0.66], [-0.5, -0.8], [-0.4, -1.03], [0.0, -1.12], [0.36, -1.04]])); }
  ctx.restore();
  // clothing that changes the outline
  tone(ctx, 'top');
  if (c.tail) poly(ctx, [add(P, n1, -c.pelvB * H * 0.9), add(add(P, n1, -c.pelvB * H * 1.32), up1, -0.075 * H), add(add(P, n1, -c.pelvB * H * 0.5), up1, -0.085 * H), add(P, up1, -0.05 * H)]);
  if (c.jacket) poly(ctx, [add(add(P, n1, -c.pelvB * H * 1.08), up1, 0.02 * H), add(add(P, n1, -c.pelvB * H * 1.1), up1, -0.085 * H), add(add(P, n1, (c.pelvF + bel) * H * 1.05), up1, -0.085 * H), add(add(P, n1, (c.pelvF + bel) * H * 1.02), up1, 0.03 * H)]);
  if (c.belt) { tone(ctx, 'shoe'); const b = add(add(P, n1, -c.pelvB * H * 1.15), up1, 0.03 * H); ctx.fillRect(b[0] - 0.012 * H, b[1] - 0.03 * H, 0.03 * H, 0.06 * H); }
  if (c.tie === 'loose' && !(o.wear && o.wear.noTie)) {
    tone(ctx, 'tie');
    const k = add(add(S, up2, 0.012 * H), n2, c.chestF * H * 0.78), sw = (o.tieSwing || 0) * D;
    const tip = [k[0] + Math.sin(sw) * 0.15 * H + 0.008 * H, k[1] + Math.cos(sw) * 0.15 * H];
    poly(ctx, [[k[0] - 0.005 * H, k[1]], [k[0] + 0.006 * H, k[1]], [tip[0] + 0.01 * H, tip[1] - 0.026 * H], [tip[0], tip[1]], [tip[0] - 0.01 * H, tip[1] - 0.026 * H]]);
  }
  if (o.wear && o.wear.backpack) tone(ctx, 'pack');
  if (o.wear && o.wear.backpack) blob(ctx, [add(add(S, up2, 0.0), n2, -c.chestB * H * 0.9), add(add(S, up2, -0.02 * H), n2, -c.chestB * H * 2.5), add(add(M, up2, 0.0), n2, -c.chestB * H * 2.7), add(add(P, up1, 0.06 * H), n1, -c.pelvB * H * 2.1), add(add(P, up1, 0.05 * H), n1, -c.pelvB * H * 0.9)], 0.5);
}
/** Lit style only: ear, brow, eye, nostril, mouth, stubble — small, restrained, in profile. */
function paintFace(ctx, g, o, c) {
  const { hpt, hh } = g, P = _col;
  const line = (pts, w, col) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w * hh; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([u, v], i) => { const q = hpt(u, v); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); ctx.restore(); };
  const oval = (u, v, rx, ry, col) => { const q = hpt(u, v); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(q[0], q[1], rx * hh, ry * hh, g.headAng * D, 0, TAU); ctx.fill(); };
  if (c.stubble) { ctx.save(); ctx.globalAlpha = 0.17; ctx.fillStyle = P.hair; blob(ctx, [[0.335, -0.02], [0.372, -0.12], [0.355, -0.3], [0.2, -0.33], [0.03, -0.24], [-0.02, -0.04], [0.2, 0.03]].map(([u, v]) => hpt(u, v)), 0.5); ctx.restore(); }
  if (!c.bob && !(o.wear && o.wear.pyjamas)) { oval(-0.075, -0.5, 0.062, 0.1, P.skinShade); line([[-0.095, -0.555], [-0.05, -0.505], [-0.085, -0.45]], 0.018, P.line); }
  const sad = o.sad || 0, closed = o.eyeClosed || 0, tk = o.talk || 0;
  // soft shadow under the jaw and in the eye socket gives the head some form
  ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = P.skinShade;
  blob(ctx, [[0.26, 0.02], [0.34, -0.03], [0.2, -0.1], [0.02, -0.16], [-0.12, -0.2], [-0.2, -0.06], [0.0, 0.08]].map(([u, v]) => hpt(u, v)), 0.5);
  blob(ctx, [[0.25, -0.6], [0.38, -0.59], [0.37, -0.5], [0.3, -0.47], [0.24, -0.51]].map(([u, v]) => hpt(u, v)), 0.5);
  ctx.restore();
  line([[0.238, -0.606 - 0.016 * sad], [0.305, -0.626], [0.378, -0.609 + 0.014 * sad]], c.face === 'm' ? 0.027 : 0.018, P.hair);
  if (closed > 0.55) line([[0.27, -0.534], [0.348, -0.53]], 0.016, P.line);
  else {
    const open = 1 - closed;
    oval(0.314, -0.537, 0.037, 0.017 * open + 0.004, '#e9e1d8'); oval(0.33, -0.537, 0.017, 0.017 * open + 0.003, '#20150f');
    line([[0.266, -0.545], [0.312, -0.558 - 0.004 * open], [0.354, -0.546]], 0.015, P.line);
  }
  oval(0.426, -0.349, 0.011, 0.008, P.line);
  // lips: a touch of colour, then the line between them (or the open mouth)
  ctx.save(); ctx.globalAlpha = 0.3; oval(0.372, -0.24, 0.03, 0.03, '#8a3f37'); ctx.restore();
  if (tk > 0.14) oval(0.346, -0.228 + 0.012 * tk, 0.03, 0.008 + 0.028 * tk, '#35120f');
  else line([[0.388, -0.24 - 0.006 * sad], [0.338, -0.233], [0.3, -0.239 + 0.008 * sad]], 0.012, P.line);
  ctx.fillStyle = P.skin;
}
function paintSkirt(ctx, g, len, flare) {
  const { H, P, lF, lB, c } = g;
  const along = (l, f) => { const tl = g.L.thigh, tot = tl + g.L.shin, d = f * tot; return d <= tl ? add(l.R, [(l.K[0] - l.R[0]) / tl, (l.K[1] - l.R[1]) / tl], d) : add(l.K, [(l.A[0] - l.K[0]) / g.L.shin, (l.A[1] - l.K[1]) / g.L.shin], d - tl); };
  const w = H * flare;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'butt'; ctx.strokeStyle = ctx.fillStyle;
  for (const l of [lB, lF]) {
    const e = along(l, len), k = len > c.thigh / (c.thigh + c.shin) ? l.K : e;
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(l.R[0], l.R[1] - 0.02 * H); ctx.lineTo(k[0], k[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
  }
  const eF = along(lF, len), eB = along(lB, len);
  poly(ctx, [[P[0] - c.pelvB * H, P[1]], [P[0] + c.pelvF * H, P[1]], [Math.max(eF[0], eB[0]) + w * 0.5, Math.max(eF[1], eB[1])], [Math.min(eF[0], eB[0]) - w * 0.5, Math.max(eF[1], eB[1])]]);
  ctx.restore();
}

/** See the header. */
export function drawFigure(ctx, who, pose, opts = {}) {
  const c = typeof who === 'string' ? CAST[who] : who;
  if (!c) throw new Error(`rig: unknown character "${who}"`);
  const o = opts, p = { x: 0, y: 0, s: 1, facing: 1, ...pose };
  const g = build(c, p, o);
  const { H } = g, s = p.s, fx = p.facing;
  const ink = o.ink || C.ink, aura = o.aura ?? c.aura;
  const m = ctx.getTransform(), zs = Math.hypot(m.a, m.b);
  const cw = ctx.canvas.width, ch = ctx.canvas.height;
  // device-space bounding box around a set of local points
  const boxOf = (pts, marginH) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const q of pts) { const X = p.x + fx * s * q[0], Y = p.y + s * q[1]; const dx = m.a * X + m.c * Y + m.e, dy = m.b * X + m.d * Y + m.f; x0 = Math.min(x0, dx); x1 = Math.max(x1, dx); y0 = Math.min(y0, dy); y1 = Math.max(y1, dy); }
    const pad = marginH * H * s * zs + 14;
    const bx = Math.max(0, Math.floor(x0 - pad)), by = Math.max(0, Math.floor(y0 - pad));
    return { bx, by, bw: Math.min(cw, Math.ceil(x1 + pad)) - bx, bh: Math.min(ch, Math.ceil(y1 + pad)) - by };
  };
  const bodyBox = boxOf([g.P, g.M, g.S, g.Hp, g.hpt(0, -1.25), g.hpt(0.6, -0.4), g.hpt(-0.9, -0.3), g.aB.E, g.aB.Hd, g.aF.E, g.aF.Hd, g.lF.K, g.lF.A, g.lB.K, g.lB.A, [g.lF.A[0], g.lF.A[1] + g.ankleH], [g.lB.A[0], g.lB.A[1] + g.ankleH]], 0.11);
  const armBox = boxOf([g.aF.R, g.aF.E, g.aF.Hd], 0.07);
  const { bx, by, bw, bh } = bodyBox;
  const toWorld = (q) => ({ x: p.x + fx * s * q[0], y: p.y + s * q[1] });
  const anchors = {
    head: { ...toWorld(g.hpt(0, -0.5)), r: g.hh * s * 0.5 }, eye: toWorld(g.hpt(0.3, -0.535)), mouth: toWorld(g.hpt(0.34, -0.24)), chin: toWorld(g.hpt(0.3, -0.04)),
    cheek: toWorld(g.hpt(0.2, -0.3)), top: toWorld(g.hpt(0, -1.02)), neck: toWorld(g.Hp), chest: toWorld(g.M), shoulder: toWorld(g.S), hip: toWorld(g.P),
    handF: toWorld(g.aF.Hd), handB: toWorld(g.aB.Hd), elbowF: toWorld(g.aF.E), elbowB: toWorld(g.aB.E), kneeF: toWorld(g.lF.K), kneeB: toWorld(g.lB.K),
    footF: toWorld([g.lF.A[0], g.lF.A[1] + g.ankleH]), footB: toWorld([g.lB.A[0], g.lB.A[1] + g.ankleH]), lap: toWorld([(g.lF.K[0] + g.P[0]) / 2, Math.min(g.lF.K[1], g.P[1]) - 0.04 * H]), h: H * s,
  };
  if (bw <= 2 || bh <= 2) return anchors;
  const held = (fn, a) => { if (!fn) return; ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s * fx, s); ctx.translate(a.Hd[0], a.Hd[1]); ctx.rotate(a.ang * D); fn(ctx, s); ctx.restore(); };
  const rimW = clamp(0.0036 * H * s * zs, 1, 6.5);
  const cvA = privateCanvas('A', cw, ch), cvB = privateCanvas('B', cw, ch), cvC = privateCanvas('C', cw, ch);

  const litStyle = styleNow(o) === 'lit' && !!c.pal;
  const pal = litStyle ? (() => { const q = { ...c.pal }; q.sleeve = q.sleeve || q.top; if (o.wear && o.wear.pyjamas && q.pyj) { q.top = q.sleeve = q.legs = q.pyj; } return q; })() : null;
  const lookName = INK2LOOK[String(ink).toLowerCase()], amb = AMB[lookName] || [0.3, '#101622'];
  const lookKey = (lookName && LOOK[lookName].key) || C.cream;
  if (litStyle) {                                   // soft contact shadow on the floor
    const r = 0.2 * H * s; ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.16);
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, r); sg.addColorStop(0, 'rgba(0,0,0,0.34)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  const passLit = (paint, box, withAura) => {
    const { bx, by, bw, bh } = box;
    if (bw <= 2 || bh <= 2) return;
    const L0 = o.light, L = { from: 1, amount: 0.5, ...(L0 || {}) }; L.color = L.color || L.key || lookKey;
    const alpha = o.alpha ?? 1, from = L.from || 1, amt = clamp(L.amount ?? 0.5);
    const A = cvA.cv, a = cvA.ctx, B = cvB.cv, b = cvB.ctx;
    a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1; a.clearRect(bx, by, bw, bh);
    a.setTransform(m); a.translate(p.x, p.y); a.scale(s * fx, s);
    _col = pal; a.fillStyle = pal.top; a.strokeStyle = pal.top;
    try { paint(a); } finally { _col = null; }
    a.setTransform(1, 0, 0, 1, 0, 0);
    // B = everything EXCEPT the figure, in a flat colour; slid back over the figure it paints the edges on one side
    const slide = (color, steps, dx, dy) => {
      b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
      b.fillStyle = color; b.clearRect(bx, by, bw, bh); b.fillRect(bx, by, bw, bh);
      b.globalCompositeOperation = 'destination-out'; b.drawImage(A, bx, by, bw, bh, bx, by, bw, bh);
      a.globalCompositeOperation = 'source-atop';
      for (const [k, al] of steps) { a.globalAlpha = clamp(al); a.drawImage(B, bx, by, bw, bh, bx + dx * k, by + dy * k, bw, bh); }
      a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1;
    };
    // keep the figure's own alpha so blend modes that paint outside it can be trimmed back
    const Cc = cvC.cv, cc = cvC.ctx;
    cc.setTransform(1, 0, 0, 1, 0, 0); cc.globalCompositeOperation = 'source-over'; cc.globalAlpha = 1; cc.clearRect(bx, by, bw, bh); cc.drawImage(A, bx, by, bw, bh, bx, by, bw, bh);
    const trim = () => { a.globalCompositeOperation = 'destination-in'; a.globalAlpha = 1; a.drawImage(Cc, bx, by, bw, bh, bx, by, bw, bh); a.globalCompositeOperation = 'source-over'; };
    const wS = clamp(0.011 * H * s * zs, 2, 28);
    // the key light tints the whole figure a little
    a.globalCompositeOperation = 'source-atop'; a.globalAlpha = 0.12; a.fillStyle = L.color; a.fillRect(bx, by, bw, bh);
    // form shadow on the side away from the light: several soft steps so it reads as a gradient, not a band
    slide('#06080f', [[0.5, 0.2], [1.1, 0.2], [1.9, 0.18], [2.9, 0.15], [4.2, 0.11], [6, 0.07]], from * wS, -wS * 0.3);
    // the room's darkness swallows the figure
    a.globalCompositeOperation = 'source-atop'; a.globalAlpha = amb[0]; a.fillStyle = amb[1]; a.fillRect(bx, by, bw, bh);
    a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1;
    // light on the side that faces the key. 'overlay' brightens skin and cloth but leaves black hair and dark fabric dark.
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
    b.fillStyle = L.color; b.clearRect(bx, by, bw, bh); b.fillRect(bx, by, bw, bh);
    b.globalCompositeOperation = 'destination-out'; b.drawImage(Cc, bx, by, bw, bh, bx, by, bw, bh);
    a.globalCompositeOperation = 'overlay';
    for (const [k, al] of [[1.2, 0.5], [2.6, 0.42], [5, 0.34], [9, 0.26], [15, 0.18]]) { a.globalAlpha = clamp(al * (0.45 + 0.75 * amt) * (0.35 + 1.1 * amb[0])); a.drawImage(B, bx, by, bw, bh, bx - from * rimW * k, by + rimW * k * 0.32, bw, bh); }   // bright rooms need far less added light
    trim();
    // a thin hard rim where the light grazes the edge
    a.globalCompositeOperation = 'source-atop'; a.globalAlpha = clamp(0.5 * amt + 0.25 * amb[0]);
    a.drawImage(B, bx, by, bw, bh, bx - from * rimW * 0.8, by + rimW * 0.26, bw, bh);
    a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha *= alpha;
    if (withAura && aura > 0) { ctx.shadowColor = rgba(C.cyan, 0.5 * aura); ctx.shadowBlur = clamp(0.03 * H * s * zs, 4, 30); }
    ctx.drawImage(A, bx, by, bw, bh, bx, by, bw, bh);
    ctx.restore();
  };
  const pass = (paint, box, withAura) => {
    if (litStyle) return passLit(paint, box, withAura);
    const { bx, by, bw, bh } = box;
    if (bw <= 2 || bh <= 2) return;
    const L0 = o.light, L = L0 && { ...L0, color: L0.color || L0.key || C.cream }, lit = L && L.amount > 0, alpha = o.alpha ?? 1;   // sets describe lights as {key, from, amount}; both spellings work
    if (!lit && !(withAura && aura > 0) && alpha >= 1) {            // fast path: plain silhouette straight onto the frame
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s * fx, s); ctx.fillStyle = ink; ctx.strokeStyle = ink; paint(ctx); ctx.restore();
      return;
    }
    const A = cvA.cv, a = cvA.ctx, B = cvB.cv, b = cvB.ctx;
    a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1; a.clearRect(bx, by, bw, bh);
    a.setTransform(m); a.translate(p.x, p.y); a.scale(s * fx, s); a.fillStyle = ink; a.strokeStyle = ink;
    paint(a);
    a.setTransform(1, 0, 0, 1, 0, 0);
    if (lit) {
      // B = key-light colour everywhere EXCEPT the figure; sliding it back over the figure paints the edges that face the light
      b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
      b.fillStyle = L.color; b.clearRect(bx, by, bw, bh); b.fillRect(bx, by, bw, bh);
      b.globalCompositeOperation = 'destination-out'; b.drawImage(A, bx, by, bw, bh, bx, by, bw, bh);
      a.globalCompositeOperation = 'source-atop';
      for (const [k, al] of [[1, 1], [2.1, 0.46], [3.4, 0.2]]) {
        a.globalAlpha = clamp(L.amount * al);
        a.drawImage(B, bx, by, bw, bh, bx - (L.from || 1) * rimW * k, by + rimW * k * 0.32, bw, bh);
      }
      a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1;
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha *= alpha;
    if (withAura && aura > 0) { ctx.shadowColor = rgba(C.cyan, 0.55 * aura); ctx.shadowBlur = clamp(0.03 * H * s * zs, 4, 30); }
    ctx.drawImage(A, bx, by, bw, bh, bx, by, bw, bh);
    ctx.restore();
  };

  held(o.held && o.held.back, g.aB);
  pass((a) => {
    paintArm(a, g, g.aB); paintLeg(a, g, g.lB, p.footRotB);
    paintTorsoHead(a, g, o);
    paintLeg(a, g, g.lF, p.footRotF);
    const pyj = o.wear && o.wear.pyjamas;
    if (c.skirt) { tone(a, 'skirt'); paintSkirt(a, g, c.skirt, 0.115); }
    if (c.dress && !pyj) { tone(a, 'dress'); paintSkirt(a, g, c.dress, 0.16); }
    if (c.coat) { tone(a, 'coat'); paintSkirt(a, g, c.coat, 0.1); }
  }, bodyBox, true);
  held(o.held && o.held.front, g.aF);
  pass((a) => paintArm(a, g, g.aF), armBox, false);

  // eye lights and tear (world space)
  const eye = anchors.eye, er = Math.max(1.2, g.hh * s * 0.028);
  // cyan glint: a hard bright core with a bloom (only ever the Program's light). catch: a tiny warm speck, no bloom.
  if (o.glint > 0) { const k = clamp(o.glint); glow(ctx, eye.x, eye.y, er * (litStyle ? 4 : 6), C.cyan, (litStyle ? 0.6 : 0.85) * k); ctx.save(); ctx.globalAlpha *= k; ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.arc(eye.x, eye.y, er * 1.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#f2ffff'; ctx.beginPath(); ctx.arc(eye.x, eye.y, er * 0.9, 0, TAU); ctx.fill(); ctx.restore(); }
  if (o.catch > 0) { ctx.save(); ctx.globalAlpha *= clamp(o.catch) * 0.75; ctx.fillStyle = (o.light && (o.light.color || o.light.key)) || C.honey; ctx.beginPath(); ctx.arc(eye.x, eye.y, er * 0.62, 0, TAU); ctx.fill(); ctx.restore(); }
  if (c.glasses && o.light && o.light.amount > 0.2) { const q = toWorld(g.hpt(0.4, -0.56)), q2 = toWorld(g.hpt(0.36, -0.47)); ctx.save(); ctx.strokeStyle = rgba(o.light.color || o.light.key || C.cream, 0.7 * o.light.amount); ctx.lineWidth = er * 0.9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q2.x, q2.y); ctx.stroke(); ctx.restore(); }
  if (o.tear > 0) {
    const t = clamp(o.tear), q = toWorld(g.hpt(lerp(0.29, 0.24, t), lerp(-0.5, -0.13, t * t * 0.6 + t * 0.4)));
    const col = (o.light && (o.light.color || o.light.key)) || C.cream, tr = er * 1.25;
    glow(ctx, q.x, q.y, tr * 3.2, col, 0.5); ctx.save(); ctx.fillStyle = '#fff'; ctx.globalAlpha *= 0.95; ctx.beginPath(); ctx.ellipse(q.x, q.y, tr * 0.8, tr * 1.15, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  return anchors;
}

// ── close-up hand ─────────────────────────────────────────────────────────────────────────
/** See the header. */
export function drawHand(ctx, o = {}) {
  const { x = 0, y = 0, size = 200, rot = 0, flip = false, pose = 'flat', ink = C.ink, cuff = '#1c2533', arm = 3.2 } = o;
  const S = size;
  const CURL = { flat: [4, 2, 2, 4], open: [10, 4, 2, 8], point: [0, 105, 112, 118], grip: [62, 68, 72, 78], pinch: [48, 30, 22, 18] }[pose] || [4, 2, 2, 4];
  const SPREAD = pose === 'open' ? 9 : 3;
  const lit = styleNow(o) === 'lit';
  const skinG = () => { const gq = ctx.createLinearGradient(0, -S * 0.32, 0, S * 0.32); gq.addColorStop(0, o.skin || '#cf9468'); gq.addColorStop(1, '#8f5c3a'); return gq; };
  const sleeveG = () => { const gq = ctx.createLinearGradient(0, -S * 0.3, 0, S * 0.3); gq.addColorStop(0, o.sleeve || '#c9d2dd'); gq.addColorStop(1, '#7f8997'); return gq; };
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot * D); if (flip) ctx.scale(1, -1);
  ctx.fillStyle = lit ? sleeveG() : ink;
  // forearm + cuff
  ctx.beginPath(); ctx.moveTo(-S * arm, -S * 0.24); ctx.lineTo(-S * 0.12, -S * 0.2); ctx.lineTo(-S * 0.12, S * 0.2); ctx.lineTo(-S * arm, S * 0.27); ctx.closePath(); ctx.fill();
  if (cuff) { ctx.fillStyle = lit ? '#e3e9f0' : cuff; ctx.beginPath(); ctx.roundRect(-S * 0.3, -S * 0.235, S * 0.2, S * 0.47, S * 0.03); ctx.fill(); }
  ctx.fillStyle = lit ? skinG() : ink;
  // palm
  blob(ctx, [[-S * 0.14, -S * 0.19], [S * 0.1, -S * 0.24], [S * 0.42, -S * 0.235], [S * 0.5, -S * 0.1], [S * 0.5, S * 0.14], [S * 0.42, S * 0.24], [S * 0.1, S * 0.23], [-S * 0.14, S * 0.19]], 0.5);
  // fingers (index at -y ... little at +y)
  const fl = [0.44, 0.48, 0.45, 0.36], fy = [-0.175, -0.06, 0.06, 0.17];
  for (let i = 0; i < 4; i++) {
    const base = [S * 0.46, S * fy[i]], a0 = (i - 1.5) * SPREAD - CURL[i] * 0.55, a1 = a0 - CURL[i] * 0.9;
    const cs = Math.cos(CURL[i] * D * 0.5);                       // foreshortening as the finger curls toward the palm
    const mid = add(base, [Math.cos(a0 * D), Math.sin(a0 * D)], S * fl[i] * 0.52 * Math.max(0.35, cs));
    const tip = add(mid, [Math.cos(a1 * D), Math.sin(a1 * D)], S * fl[i] * 0.48 * Math.max(0.3, cs * cs));
    limb(ctx, base, mid, S * 0.062, S * 0.055); limb(ctx, mid, tip, S * 0.055, S * 0.044);
  }
  // thumb
  const tb = [S * 0.06, -S * 0.2], ta = pose === 'pinch' ? -18 : pose === 'grip' ? -30 : pose === 'point' ? -22 : -52;
  const tm = add(tb, [Math.cos(ta * D), Math.sin(ta * D)], S * 0.24), tt = add(tm, [Math.cos((ta + (pose === 'flat' || pose === 'open' ? 30 : 46)) * D), Math.sin((ta + (pose === 'flat' || pose === 'open' ? 30 : 46)) * D)], S * 0.2);
  limb(ctx, tb, tm, S * 0.085, S * 0.066); limb(ctx, tm, tt, S * 0.066, S * 0.05);
  ctx.restore();
}
