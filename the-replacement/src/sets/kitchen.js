// ═══════════════════════════════════════════════════════════════════════════════════════════
// THE REPLACEMENT — set: KITCHEN  (the family's small apartment kitchen-dining room)
// Shots: a1_04 a1_05 a1_06 a1_11 a1_13 · a2_05–a2_09 · a5_02–a5_07 · a6_01–a6_06 · a7_03
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
//   import { kitchen } from '../sets/kitchen.js';
//   const o = { look: 'lampNight', cam, lampSway: 0.2 };        // one options object for all calls
//   kitchen.back(ctx, F, o);                                    // room, counter, window, doors
//   camera(ctx, cam, 1, () => { /* people BEHIND the table */ });
//   kitchen.mid(ctx, F, o);                                     // table top (re-drawn over them)
//   camera(ctx, cam, 1, () => { /* seated / standing people, props on the table */ });
//   kitchen.front(ctx, F, o);                                   // table edge+legs, chairs, lamp, air
//
//   Someone walking IN FRONT of the table and chairs: split front() in two —
//     kitchen.front(ctx, F, { ...o, part: 'furniture' });  → draw that figure →
//     kitchen.front(ctx, F, { ...o, part: 'air' });
//
// LOCATION   export const kitchen   — world 1920 wide, side-on like a stage. Feet stand on
//            y = 700 (kitchen.floorY); the back wall meets the floor at y = 672.
//
//   x:   92–296   FRONT DOOR (back wall, hinge on its left; swings in toward camera)
//       328–434   coat hooks (coat, scarf, child's jacket)
//       560–720   framed pictures (above seated head height) · 880–960 one more
//       635–965   DINING TABLE (centre x = 800), chairs at x = 565 and x = 1035
//       800       PENDANT LAMP over the table (shade rim at y = 288)
//      1112       wall clock (y = 188)
//      1165–1520  KITCHEN COUNTER: kettle 1190 · SINK/tap 1268 (cupboard doors below) ·
//                 clear worktop 1340 (lunchbox spot) · TOASTER 1426 · utensil crock 1494
//      1212–1482  WINDOW above the counter (y 204–418), plant on the sill
//      1528–1686  FRIDGE with a child's crayon drawings
//      1426       STEP STOOL in front of the counter, under the toaster
//      1718–1894  BEDROOMS DOORWAY (open, dark hall behind, Maya's star on the far door)
//
// LOOKS   (o.look, names from style.js LOOK)
//   greyMorning  flat, cold, cheerless daylight from the window. Brightest point: the window.
//   nightDark    lights off. Dim night window + a pale window-shaped patch of streetlight on the
//                wall behind the LEFT seat (that patch is what a seated Adam is read against).
//                Add the phone glow yourself.
//   warmDay      honey-gold, high-key, soft sun shafts. The happiest the room ever looks.
//   lampNight    black room; cone + pool of light from the pendant lamp on the table top and on
//                the wall behind both seats; nightlight glow in the hall at right.
//   golden       low gold sun raking down-left through the window, dust in the beams, a patch
//                of sun on the worktop at anchors.counterSun (put the lunchbox there).
//
// STATE VALUES  (all optional, plain numbers in o)
//   doorOpen     0..1   front door: 0 shut, 1 fully open (cold grey corridor light falls in). Default 0
//   lampOn       0..1   pendant lamp. Default 1 in lampNight, 0 in every other look
//   lampSway    -1..1   pendant swing (+1 = shade swung ~3° toward screen right). Default 0
//   toast        0..1   toaster: 0 = slices down (lever down), 1 = popped up. Default 0
//   toastBurnt   0..1   0 = golden toast, 1 = black. Default 0
//   toastCount   0|1|2  slices in the toaster (1 = the LEFT slice has been taken). Default 2
//   smoke        0..1   smoke from the toaster: 0.25 = a thread, 1 = thick. Default 0
//   stool        0|1    step stool in front of the counter under the toaster. Default 1
//   hallGlow     0..1   nightlight glow in the bedrooms hall. Default 1 in lampNight, else 0
//   cupboardOpen 0..1   the two doors under the sink swing open (pipework visible). Default 0
//   clock        hours  time on the wall clock, e.g. 6.25 = 6:15. Default per look
//   t            sec    time for ambient life (lamp shimmer, dust, smoke, car lights). Default F.t
//   cam          {x,y,zoom,rot}   camera (identity by default)
//   part         'all' | 'furniture' | 'air'   front() only, see above. Default 'all'
//
// ANCHORS  kitchen.anchors.<name> = {x, y} in WORLD px. y is where a thing rests: floor 700 for
//          feet, seat top, table top, worktop.
//   doorStand    {x:194,  y:700}  standing in the front-door frame (backlit when doorOpen = 1)
//   doorHandle   {x:272,  y:438}  the door handle (door shut)
//   entry        {x:380,  y:700}  one step inside the door
//   standL       {x:475,  y:700}  standing left of the table (clean wall behind)
//   seatL        {x:565,  y:590}  top of the LEFT chair seat (sitter faces right) — Adam
//   seatR        {x:1035, y:590}  top of the RIGHT chair seat (sitter faces left) — V1 / Maya
//   tableTop     {x:800,  y:515}  centre of the table top (props rest at y = 515)
//   tableL       {x:700,  y:515}  place setting in front of the left seat
//   tableR       {x:900,  y:515}  place setting in front of the right seat
//   behindTable  {x:800,  y:700}  standing behind the table (draw BEFORE mid(); legs get hidden)
//   lamp         {x:800,  y:288}  centre of the lamp-shade rim / the bulb (at lampSway 0)
//   standR       {x:1140, y:700}  standing right of the table (edge of the lamplight)
//   sink         {x:1268, y:700}  on the floor in front of the sink cupboard (V1 kneels here)
//   pipe         {x:1270, y:590}  the trap under the sink (visible when cupboardOpen > 0)
//   tap          {x:1247, y:428}  mouth of the tap
//   counterL     {x:1215, y:700}  standing at the counter, left end
//   counterSun   {x:1340, y:474}  clear worktop in the golden sun patch — the lunchbox goes here
//   counterStand {x:1330, y:700}  standing at the counter next to the toaster / stool
//   toaster      {x:1426, y:474}  toaster base centre (it is 84 wide, 50 tall)
//   toastSlot    {x:1426, y:424}  top of the toaster where the slices come out (L slice x-19, R x+19)
//   toasterLever {x:1380, y:440}  the lever knob (toast = 1 position; 16 px lower when down)
//   stoolTop     {x:1426, y:640}  top of the step stool (Maya's feet)
//   counterR     {x:1490, y:700}  standing at the counter, right end / by the fridge
//   fridge       {x:1607, y:700}  in front of the fridge
//   drawings     {x:1607, y:440}  the crayon drawings on the fridge door
//   hallDoor     {x:1806, y:700}  standing in the bedrooms doorway
//   window       {x:1347, y:311}  centre of the window
//
// LIGHT ON CHARACTERS  kitchen.lights[look] = {key, from, amount} is the rim for someone at the
//   table / left half of the room. kitchen.lightAt(look, x, o) gives the same for any world x
//   (in lampNight the light comes from the lamp, so the right seat gets from:-1; near the open
//   door or hall glow it is still the room's light — add those yourself if you want them).
//
// EXTRAS
//   kitchen.toastSlice(ctx, x, y, {burnt, look, scale, rot})  draws one slice (base centre at
//   x,y) in the set's colours, for a hand that pulls a slice out.
//
// Close framings this set is built for (all vector, crisp to zoom 5): the toaster and worktop
// (zoom 3–5 around x 1426,y 440), the table top (zoom 3–5 around x 800,y 490), profiles at the
// table (zoom 2–3 around y 400), the bedrooms doorway (zoom 1.8–2.6 around x 1806,y 520), the
// front door (zoom 1.5–2 around x 240,y 440).
// ═══════════════════════════════════════════════════════════════════════════════════════════

import {
  PW, PH, TAU, clamp, lerp, hash, rng, noise1, wobble, rgba, mixHex, rr, fillRR, linGrad, radGrad,
  glow, cached, scratch, camera, rad,
} from '../engine.js';
import { LOOK } from '../style.js';

// ───────────────────────────── geometry ─────────────────────────────
const FLOOR = 700;                 // feet line
const BASE = 672;                  // back wall meets the floor
const CEIL = 85;
const HOR = 330, VPX = 960;        // eye line / vanishing point of the fake floor perspective
const ROOM_L = -40, ROOM_R = 1960; // room corners
const DOOR = { x0: 92, x1: 296, top: 182 };
const TABLE = { x: 800, x0: 635, x1: 965, far: 503, near: 525, top: 515 };
const SEAT = { L: 565, R: 1035, y: 590 };
const LAMP = { x: 800, rim: 288 };
const CNT = { x0: 1165, x1: 1520, far: 464, near: 480 };
const WIN = { x0: 1212, x1: 1482, y0: 204, y1: 418 };
const WCX = (WIN.x0 + WIN.x1) / 2, WCY = (WIN.y0 + WIN.y1) / 2;
const TAPX = 1268;
const TOASTER = { x: 1426, base: 474, w: 84, h: 50 };
const FRIDGE = { x0: 1528, x1: 1686, top: 262, base: 690 };
const HALL = { x0: 1718, x1: 1894, top: 190 };
const STOOL = { x: 1426, top: 640 };

// ───────────────────────────── colour helpers ─────────────────────────────
const hex3 = (h) => {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const toHex = (c) => '#' + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const mulHex = (a, b) => { const A = hex3(a), B = hex3(b); return toHex(A.map((v, i) => (v * B[i]) / 255)); };
const poly = (ctx, pts) => {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
};
const fillPoly = (ctx, pts, fill) => { poly(ctx, pts); ctx.fillStyle = fill; ctx.fill(); };
const stroke = (ctx, pts, w, col, cap = 'round') => {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = cap; ctx.lineJoin = 'round'; ctx.stroke();
};
/** bilinear point inside a quad [TL, TR, BR, BL] */
const qpt = (q, u, v) => {
  const tx = lerp(q[0][0], q[1][0], u), ty = lerp(q[0][1], q[1][1], u);
  const bx = lerp(q[3][0], q[2][0], u), by = lerp(q[3][1], q[2][1], u);
  return [lerp(tx, bx, v), lerp(ty, by, v)];
};
const subQuad = (q, u0, v0, u1, v1) => [qpt(q, u0, v0), qpt(q, u1, v0), qpt(q, u1, v1), qpt(q, u0, v1)];

/** A palette of surface tones for one lighting state. tone(k): 0 = ink, 1 = wall, 2 = key light. */
function makePal(L) {
  const tone = (k) => (k <= 1 ? mixHex(L.ink, L.wall, k) : mixHex(L.wall, L.key, Math.min(1, k - 1)));
  return {
    L, tone, ink: L.ink, key: L.key, wall: L.wall,
    ceil: tone(0.74), side: tone(0.5),
    skirt: tone(1.16), skirtHi: tone(1.4),
    floorFar: mixHex(L.floor, L.wall, 0.36), floorNear: mixHex(L.floor, L.ink, 0.42), board: mixHex(L.floor, L.ink, 0.6),
    casing: tone(1.24), casingShade: tone(0.7),
    door: tone(0.7), doorPanel: tone(0.6), doorHi: tone(0.9), handle: tone(1.6),
    woodTop: tone(1.2), wood: tone(0.44), woodDark: tone(0.28), woodEdge: tone(0.84),
    cntFace: tone(0.66), cntDoor: tone(0.72), cntLine: tone(0.42), cntTop: tone(1.34), cntEdge: tone(1.04), cntHandle: tone(1.28), kick: tone(0.2),
    tile: tone(1.12), grout: tone(0.93),
    winCase: tone(1.3), mullion: tone(0.42), sill: tone(1.42),
    fridge: tone(1.26), fridgeShade: tone(0.98), fridgeLine: tone(0.64), fridgeHandle: tone(0.5),
    metal: tone(0.62), metalHi: tone(1.7), metalDark: tone(0.3),
    picFrame: tone(0.36), picMat: tone(1.42), picA: tone(0.7), picB: tone(1.02), picC: tone(0.48),
    coatA: tone(0.33), coatB: tone(0.56), coatC: tone(0.82), rail: tone(0.5),
    shade: tone(0.3), cord: tone(0.22),
    plant: mixHex(tone(0.36), '#2c4636', 0.3), pot: tone(0.78),
  };
}

// ───────────────────────────── the five looks ─────────────────────────────
const SPECS = {
  greyMorning: {
    dark: false,
    lit: { wall: LOOK.greyMorning.wall, floor: LOOK.greyMorning.floor, key: LOOK.greyMorning.key, ink: LOOK.greyMorning.ink },
    amb: '#b4c0d2',
    wallStops: [[0, 0.78], [0.25, 0.9], [0.45, 0.98], [0.69, 1.1], [0.85, 1.0], [1, 0.84]],
    topShade: 0.3, botShade: 0.12,
    sky: ['#a9b7c9', '#eef2f7'], far: ['#bcc7d6', '#a4b2c5'], farWin: null,
    wallGlows: [[WCX, WCY, 440, '#cfdcee', 0.2, 1], [800, 420, 560, '#cfdcee', 0.05, 1]],
    winBloom: ['#dbe5f1', 0.12, 400], smokeCol: '#232a36',
    lampGain: 0.3, corridor: '#ffffff',
    defaults: { lampOn: 0, hallGlow: 0, clock: 6.4 },
    light: { key: LOOK.greyMorning.key, amount: 0.35 },
  },
  nightDark: {
    dark: true,
    lit: { wall: '#51688f', floor: '#2a3852', key: '#b6c6e2', ink: '#020306' },
    unlit: { wall: LOOK.nightDark.wall, floor: LOOK.nightDark.floor, key: LOOK.nightDark.key, ink: LOOK.nightDark.ink },
    amb: '#55698c',
    wallStops: [[0, 1], [1, 1]], topShade: 0.2, botShade: 0.1,
    sky: ['#070c18', '#1d2b47'], far: ['#0d1524', '#080e1a'], farWin: '#8fa6cc',
    wallGlows: [], winBloom: ['#5c79a8', 0.1, 330], smokeCol: '#0a0e16',
    maskBase: '#2a2d36', maskTint: '#dfe8ff',
    lampGain: 0.85, corridor: '#c4c9d0',
    defaults: { lampOn: 0, hallGlow: 0, clock: 23.3 },
    light: { key: LOOK.nightDark.key, amount: 0.22 },
  },
  warmDay: {
    dark: false,
    lit: { wall: LOOK.warmDay.wall, floor: LOOK.warmDay.floor, key: LOOK.warmDay.key, ink: LOOK.warmDay.ink },
    amb: '#ffe0b2',
    wallStops: [[0, 0.84], [0.3, 0.97], [0.5, 1.05], [0.69, 1.18], [0.86, 1.05], [1, 0.9]],
    topShade: 0.2, botShade: 0.08,
    sky: ['#ffe2ae', '#fff6e2'], far: ['#ffdca6', '#f6c98c'], farWin: null,
    wallGlows: [[WCX, WCY, 580, '#fff0cf', 0.36, 1], [840, 400, 780, '#ffe2b0', 0.15, 1]],
    winBloom: ['#fff0d0', 0.2, 460], smokeCol: '#3a2a1c',
    lampGain: 0.25, corridor: '#ffffff',
    defaults: { lampOn: 0, hallGlow: 0, clock: 8.7 },
    light: { key: LOOK.warmDay.key, amount: 0.6 },
  },
  lampNight: {
    dark: true,
    lit: { wall: '#a3713c', floor: '#5d3b1d', key: '#ffd9a0', ink: '#040302' },
    unlit: { wall: LOOK.lampNight.wall, floor: LOOK.lampNight.floor, key: LOOK.lampNight.key, ink: LOOK.lampNight.ink },
    amb: '#ffd9a0',
    wallStops: [[0, 1], [1, 1]], topShade: 0.2, botShade: 0.1,
    sky: ['#04070f', '#111b30'], far: ['#090f1b', '#05090f'], farWin: '#7f95ba',
    wallGlows: [], winBloom: null, smokeCol: '#0c0906',
    maskBase: '#22242a', maskTint: '#fff1dc',
    lampGain: 1, corridor: '#c4c9d0',
    defaults: { lampOn: 1, hallGlow: 1, clock: 21.6 },
    light: { key: LOOK.lampNight.key, amount: 0.75 },
  },
  golden: {
    dark: false,
    lit: { wall: LOOK.golden.wall, floor: LOOK.golden.floor, key: LOOK.golden.key, ink: LOOK.golden.ink },
    amb: '#ffdc9c',
    wallStops: [[0, 0.7], [0.3, 0.82], [0.5, 0.92], [0.69, 1.12], [0.86, 0.92], [1, 0.76]],
    topShade: 0.34, botShade: 0.14,
    sky: ['#ffd27c', '#fff7dc'], far: ['#ffd388', '#f2b966'], farWin: null,
    wallGlows: [[WCX, WCY, 500, '#fff0c4', 0.38, 1]],
    winBloom: ['#fff0c4', 0.26, 480], smokeCol: '#4a3018',
    lampGain: 0.25, corridor: '#ffffff',
    defaults: { lampOn: 0, hallGlow: 0, clock: 6.4 },
    light: { key: LOOK.golden.key, amount: 0.85 },
  },
};
const _specs = new Map();
function getSpec(look) {
  let s = _specs.get(look);
  if (!s) {
    const raw = SPECS[look];
    const P = makePal(raw.lit);
    s = { ...raw, name: look, P, Pd: raw.dark ? makePal(raw.unlit) : P };
    _specs.set(look, s);
  }
  return s;
}

function resolve(F, o = {}) {
  const look = SPECS[o.look] ? o.look : 'greyMorning';
  const sp = getSpec(look);
  const d = sp.defaults;
  const t = o.t ?? (F ? F.t : 0);
  const lampOn = clamp(o.lampOn ?? d.lampOn);
  return {
    look, sp, P: sp.P, Pd: sp.Pd, dark: sp.dark, cam: o.cam || null, t,
    doorOpen: clamp(o.doorOpen ?? 0),
    lampOn, lamp: lampOn * (1 + 0.012 * wobble(t, 7, 4) + 0.008 * wobble(t, 19, 6)),   // tiny tungsten shimmer
    lampSway: clamp(o.lampSway ?? 0, -1, 1),
    toast: clamp(o.toast ?? 0), toastBurnt: clamp(o.toastBurnt ?? 0), toastCount: o.toastCount ?? 2,
    smoke: clamp(o.smoke ?? 0),
    stool: (o.stool ?? 1) > 0.5 ? 1 : 0,
    hallGlow: clamp(o.hallGlow ?? d.hallGlow) * (1 + 0.03 * wobble(t, 0.6, 12)),
    cupboardOpen: clamp(o.cupboardOpen ?? 0),
    clock: o.clock ?? d.clock,
    part: o.part || 'all',
    lit: (h) => mulHex(h, sp.amb),
  };
}
const lampAngle = (S) => S.lampSway * rad(3.2);
const lampX = (S) => LAMP.x + Math.sin(lampAngle(S)) * 203;

// ───────────────────────────── room shell ─────────────────────────────
function drawShell(ctx, S, P) {
  const sp = S.sp;
  // ceiling, seen from below: darker toward the camera
  ctx.fillStyle = linGrad(ctx, 0, CEIL, 0, CEIL - 300, [[0, P.ceil], [1, mixHex(P.ceil, P.ink, 0.5)]]);
  ctx.fillRect(-3200, -2400, 8400, 2400 + CEIL);
  // back wall
  ctx.fillStyle = linGrad(ctx, ROOM_L, 0, ROOM_R, 0, sp.wallStops.map(([q, k]) => [q, P.tone(k)]));
  ctx.fillRect(ROOM_L - 1, CEIL, ROOM_R - ROOM_L + 2, BASE - CEIL);
  ctx.fillStyle = linGrad(ctx, 0, CEIL, 0, BASE, [[0, rgba(P.ink, sp.topShade)], [0.42, rgba(P.ink, 0)], [0.8, rgba(P.ink, 0)], [1, rgba(P.ink, sp.botShade)]]);
  ctx.fillRect(ROOM_L - 1, CEIL, ROOM_R - ROOM_L + 2, BASE - CEIL);
  // floor
  ctx.fillStyle = linGrad(ctx, 0, BASE, 0, 860, [[0, P.floorFar], [1, P.floorNear]]);
  ctx.fillRect(-3200, BASE, 8400, 1900);
  // floorboards converging on the vanishing point
  ctx.strokeStyle = rgba(P.board, 0.5); ctx.lineWidth = 1.3; ctx.beginPath();
  for (let i = -46; i <= 46; i++) {
    const x = VPX + i * 62 + 20;
    ctx.moveTo(x, BASE); ctx.lineTo(VPX + (x - VPX) * 3.4, HOR + (BASE - HOR) * 3.4);
  }
  // a few board ends
  for (let i = 0; i < 46; i++) {
    const col = Math.floor(hash(i * 7 + 3) * 60) - 30, k = 1.04 + hash(i * 13 + 5) * 0.5;
    const xa = VPX + col * 62 + 20, xb = xa + 62, y = HOR + (BASE - HOR) * k;
    ctx.moveTo(VPX + (xa - VPX) * k, y); ctx.lineTo(VPX + (xb - VPX) * k, y);
  }
  ctx.stroke();
  // side walls (the room's corners are just outside the wide master)
  for (const cx of [ROOM_L, ROOM_R]) {
    fillPoly(ctx, [[cx, CEIL], [VPX + (cx - VPX) * 4, HOR + (CEIL - HOR) * 4], [VPX + (cx - VPX) * 4, HOR + (BASE - HOR) * 4], [cx, BASE]], P.side);
  }
  // cornice shadow, skirting board
  ctx.fillStyle = rgba(P.ink, 0.22); ctx.fillRect(ROOM_L, CEIL, ROOM_R - ROOM_L, 4);
  ctx.fillStyle = P.skirt; ctx.fillRect(ROOM_L, BASE - 20, ROOM_R - ROOM_L, 20);
  ctx.fillStyle = P.skirtHi; ctx.fillRect(ROOM_L, BASE - 20, ROOM_R - ROOM_L, 2);
  ctx.fillStyle = linGrad(ctx, 0, BASE - 3, 0, BASE + 12, [[0, rgba(P.ink, 0.4)], [1, rgba(P.ink, 0)]]);
  ctx.fillRect(ROOM_L, BASE - 3, ROOM_R - ROOM_L, 15);
}

// ───────────────────────────── wall dressing ─────────────────────────────
function drawPictures(ctx, S, P) {
  const sh = S.dark ? 0 : -1;
  const frame = (x, y, w, h, art) => {
    ctx.fillStyle = rgba(P.ink, 0.2); ctx.fillRect(x + sh * 5, y + 5, w, h);
    ctx.fillStyle = P.picFrame; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = P.picMat; ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 11, y + 11, w - 22, h - 22); ctx.clip();
    art(x + 11, y + 11, w - 22, h - 22);
    ctx.restore();
    ctx.fillStyle = rgba(P.key, 0.1);     // glass sheen
    fillPoly(ctx, [[x + 5, y + 5], [x + w * 0.5, y + 5], [x + w * 0.18, y + h - 5], [x + 5, y + h - 5]], rgba(P.key, 0.09));
  };
  const bust = (cx, by, r) => {
    ctx.beginPath(); ctx.arc(cx, by - r * 2.9, r, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, by, r * 2.0, r * 1.9, 0, 0, TAU); ctx.fill();
  };
  // A — the family photo (two adults and a child)
  frame(560, 214, 72, 92, (x, y, w, h) => {
    ctx.fillStyle = P.picB; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = P.picA; bust(x + 15, y + h + 3, 8.5); bust(x + 36, y + h + 5, 7.8);
    ctx.fillStyle = P.picC; bust(x + 25.5, y + h + 8, 5.4);
  });
  // B — small landscape
  frame(646, 236, 76, 56, (x, y, w, h) => {
    ctx.fillStyle = P.picB; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = P.picMat; ctx.beginPath(); ctx.arc(x + w * 0.7, y + h * 0.36, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = P.picA; ctx.beginPath(); ctx.moveTo(x, y + h * 0.7); ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.35, x + w * 0.6, y + h * 0.68); ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.5, x + w, y + h * 0.66); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.fill();
    ctx.fillStyle = P.picC; ctx.beginPath(); ctx.moveTo(x, y + h * 0.86); ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.66, x + w, y + h * 0.9); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.fill();
  });
  // C — a star, framed
  frame(660, 170, 50, 52, (x, y, w, h) => {
    ctx.fillStyle = P.picB; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = P.picA; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 4.6 : 10.5; ctx.lineTo(x + w / 2 + Math.cos(a) * r, y + h / 2 + 1 + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
  });
  // D — boat on the sea, right of the lamp
  frame(880, 222, 82, 58, (x, y, w, h) => {
    ctx.fillStyle = P.picB; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = P.picA; ctx.fillRect(x, y + h * 0.62, w, h);
    ctx.fillStyle = P.picC; fillPoly(ctx, [[x + w * 0.4, y + h * 0.62], [x + w * 0.66, y + h * 0.62], [x + w * 0.6, y + h * 0.74], [x + w * 0.45, y + h * 0.74]], P.picC);
    fillPoly(ctx, [[x + w * 0.52, y + h * 0.16], [x + w * 0.52, y + h * 0.58], [x + w * 0.68, y + h * 0.58]], P.picMat);
  });
}

function drawClock(ctx, S, P) {
  const x = 1112, y = 188, r = 27;
  ctx.fillStyle = rgba(P.ink, 0.2); ctx.beginPath(); ctx.arc(x + (S.dark ? 0 : -5), y + 5, r, 0, TAU); ctx.fill();
  ctx.fillStyle = P.picFrame; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = P.picMat; ctx.beginPath(); ctx.arc(x, y, r - 4.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = P.picFrame; ctx.lineCap = 'butt';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU, r0 = i % 3 ? r - 8.5 : r - 11;
    ctx.lineWidth = i % 3 ? 1 : 1.8; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * (r - 6), y + Math.sin(a) * (r - 6)); ctx.stroke();
  }
  const hA = ((S.clock % 12) / 12) * TAU - Math.PI / 2, mA = (S.clock % 1) * TAU - Math.PI / 2;
  stroke(ctx, [[x, y], [x + Math.cos(hA) * 10.5, y + Math.sin(hA) * 10.5]], 2.6, P.picFrame);
  stroke(ctx, [[x, y], [x + Math.cos(mA) * 16.5, y + Math.sin(mA) * 16.5]], 1.8, P.picFrame);
  ctx.fillStyle = P.picFrame; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
}

function drawCoats(ctx, S, P) {
  fillRR(ctx, 328, 284, 106, 9, 3, P.rail);
  ctx.fillStyle = rgba(P.key, 0.18); ctx.fillRect(330, 284, 102, 1.5);
  // adult coat
  ctx.beginPath(); ctx.moveTo(346, 291);
  ctx.bezierCurveTo(334, 295, 322, 304, 319, 320); ctx.lineTo(315, 468); ctx.lineTo(323, 486); ctx.lineTo(368, 486); ctx.lineTo(375, 466);
  ctx.lineTo(373, 320); ctx.bezierCurveTo(370, 304, 358, 295, 346, 291); ctx.closePath();
  ctx.fillStyle = P.coatA; ctx.fill();
  fillPoly(ctx, [[319, 322], [331, 318], [329, 440], [317, 436]], mixHex(P.coatA, P.ink, 0.3));   // sleeve
  stroke(ctx, [[346, 293], [344, 484]], 1.2, mixHex(P.coatA, P.ink, 0.45));
  fillPoly(ctx, [[346, 291], [338, 300], [346, 316], [354, 300]], mixHex(P.coatA, P.wall, 0.25));   // collar
  // scarf
  fillRR(ctx, 374, 290, 11, 126, 4, P.coatB);
  fillRR(ctx, 381, 290, 9, 96, 4, mixHex(P.coatB, P.ink, 0.25));
  // child's jacket with a hood
  ctx.beginPath(); ctx.moveTo(414, 291);
  ctx.bezierCurveTo(404, 295, 396, 301, 394, 314); ctx.lineTo(392, 392); ctx.lineTo(436, 392); ctx.lineTo(434, 314);
  ctx.bezierCurveTo(432, 301, 424, 295, 414, 291); ctx.closePath();
  ctx.fillStyle = P.coatC; ctx.fill();
  ctx.fillStyle = mixHex(P.coatC, P.ink, 0.22); ctx.beginPath(); ctx.ellipse(414, 305, 12, 13, 0, 0, TAU); ctx.fill();
  fillPoly(ctx, [[392, 318], [402, 316], [401, 380], [392, 378]], mixHex(P.coatC, P.ink, 0.2));
  stroke(ctx, [[414, 318], [414, 391]], 1.2, mixHex(P.coatC, P.ink, 0.35));
  // pegs
  ctx.fillStyle = P.woodEdge;
  for (const px of [346, 379, 414]) { ctx.beginPath(); ctx.arc(px, 289, 3.6, 0, TAU); ctx.fill(); }
}

// ───────────────────────────── front door ─────────────────────────────
function doorLeaf(ctx, S, P, th) {
  const w = DOOR.x1 - DOOR.x0, hx = DOOR.x0;
  const sn = Math.sin(th), cs = Math.cos(th);
  const fx = hx + w * cs - 64 * sn, sc = 1 + 0.1 * sn;
  const X = (u) => lerp(hx, fx, u);
  const Y = (u, v) => HOR + (lerp(DOOR.top, BASE, v) - HOR) * (1 + (sc - 1) * u);
  const quad = (u0, v0, u1, v1) => {
    ctx.beginPath(); ctx.moveTo(X(u0), Y(u0, v0)); ctx.lineTo(X(u1), Y(u1, v0)); ctx.lineTo(X(u1), Y(u1, v1)); ctx.lineTo(X(u0), Y(u0, v1)); ctx.closePath();
  };
  const dk = 0.42 * sn;
  const col = (c) => mixHex(c, P.ink, dk);
  quad(0, 0, 1, 1); ctx.fillStyle = col(P.door); ctx.fill();
  for (const [u0, v0, u1, v1] of [[0.14, 0.05, 0.86, 0.47], [0.14, 0.535, 0.86, 0.95]]) {
    quad(u0, v0, u1, v1); ctx.fillStyle = col(P.doorPanel); ctx.fill();
    quad(u0, v1 - 0.008, u1, v1); ctx.fillStyle = col(P.doorHi); ctx.fill();
    quad(u1 - 0.02, v0, u1, v1); ctx.fillStyle = col(P.doorHi); ctx.fill();
    quad(u0, v0, u1, v0 + 0.008); ctx.fillStyle = rgba(P.ink, 0.3); ctx.fill();
    quad(u0, v0, u0 + 0.02, v1); ctx.fillStyle = rgba(P.ink, 0.25); ctx.fill();
  }
  // handle + lock near the free edge
  const hxp = X(0.88), hyp = Y(0.88, 0.522);
  ctx.fillStyle = col(P.handle);
  fillRR(ctx, hxp - 4 * cs - 1, hyp - 13, Math.max(2, 8 * Math.abs(cs)), 30, 2, col(mixHex(P.handle, P.wall, 0.4)));
  fillRR(ctx, hxp - 22 * cs, hyp - 3, Math.max(3, 22 * Math.abs(cs)), 6, 3, col(P.handle));
  ctx.fillStyle = col(P.handle); ctx.beginPath(); ctx.arc(X(0.88), Y(0.88, 0.43), 3.4, 0, TAU); ctx.fill();
  // spyhole
  ctx.fillStyle = col(P.picFrame); ctx.beginPath(); ctx.ellipse(X(0.5), Y(0.5, 0.25), 3 * Math.max(0.2, Math.abs(cs)), 3, 0, 0, TAU); ctx.fill();
  if (th > 0.01) {
    // the door's free edge catches the corridor light
    quad(1, 0, 1 + 9 * sn / (fx - hx || 1), 1);
    ctx.fillStyle = mixHex(P.doorHi, '#c3d0db', 0.55 * sn); ctx.fill();
  }
}
function drawDoorCasing(ctx, S, P) {
  const { x0, x1, top } = DOOR;
  ctx.fillStyle = P.casing; ctx.fillRect(x0 - 13, top - 13, x1 - x0 + 26, BASE - top + 13);
  ctx.fillStyle = P.casingShade; ctx.fillRect(x0 - 3, top - 3, x1 - x0 + 6, BASE - top + 3);
  // doormat
  fillPoly(ctx, [[x0 + 14, BASE + 5], [x1 - 14, BASE + 5], [x1 + 2, BASE + 24], [x0 - 2, BASE + 24]], mixHex(P.floorNear, P.ink, 0.35));
}
/** Opening x-range that is uncovered by the door leaf, for the light that falls in. */
function doorGap(S) {
  const th = S.doorOpen * rad(86), w = DOOR.x1 - DOOR.x0;
  const fx = DOOR.x0 + w * Math.cos(th) - 64 * Math.sin(th);
  return { th, x0: clamp(fx, DOOR.x0, DOOR.x1), x1: DOOR.x1, k: clamp((DOOR.x1 - Math.max(fx, DOOR.x0)) / w) };
}
function drawCorridor(ctx, S) {
  const m = (h) => mulHex(h, S.sp.corridor);
  ctx.fillStyle = linGrad(ctx, 0, 170, 0, 452, [[0, m('#c9d3dc')], [1, m('#a9b6c1')]]);
  ctx.fillRect(-400, -200, 1400, 652);
  ctx.fillStyle = linGrad(ctx, 0, 452, 0, 640, [[0, m('#8796a3')], [1, m('#687783')]]);    // dado
  ctx.fillRect(-400, 452, 1400, 190);
  ctx.fillStyle = m('#b9c5cf'); ctx.fillRect(-400, 449, 1400, 4);
  ctx.fillStyle = m('#4d5a65'); ctx.fillRect(-400, 632, 1400, 12);
  ctx.fillStyle = linGrad(ctx, 0, 644, 0, 720, [[0, m('#5b6873')], [1, m('#2f3942')]]);
  ctx.fillRect(-400, 644, 1400, 300);
  glow(ctx, 194, 150, 300, m('#eef3f7'), 0.4);
  glow(ctx, 194, 668, 150, m('#cfd9e2'), 0.22, 0.2);
}
function drawDoorOpen(ctx, S) {
  const g = doorGap(S), P = S.Pd;
  // corridor seen through the opening
  camera(ctx, S.cam, 1, () => { ctx.beginPath(); ctx.rect(DOOR.x0, DOOR.top, DOOR.x1 - DOOR.x0, BASE - DOOR.top); });
  ctx.save(); ctx.clip();
  camera(ctx, S.cam, 0.92, () => drawCorridor(ctx, S));
  camera(ctx, S.cam, 1, () => {
    // threshold and the jamb's inner shadow
    ctx.fillStyle = 'rgba(20,26,32,0.5)'; ctx.fillRect(DOOR.x0, BASE - 5, DOOR.x1 - DOOR.x0, 5);
    ctx.fillStyle = linGrad(ctx, DOOR.x1 - 16, 0, DOOR.x1, 0, [[0, 'rgba(10,14,20,0)'], [1, 'rgba(10,14,20,0.45)']]);
    ctx.fillRect(DOOR.x1 - 16, DOOR.top, 16, BASE - DOOR.top);
    ctx.fillStyle = linGrad(ctx, 0, DOOR.top, 0, DOOR.top + 26, [[0, 'rgba(10,14,20,0.5)'], [1, 'rgba(10,14,20,0)']]);
    ctx.fillRect(DOOR.x0, DOOR.top, DOOR.x1 - DOOR.x0, 26);
  });
  ctx.restore();
  camera(ctx, S.cam, 1, () => {
    doorLeaf(ctx, S, P, g.th);
    // cold light falling in across the floor
    const a = g.k * (S.dark ? 0.34 : 0.3);
    if (a > 0.004) {
      const cv = cached('kit-doorspill', 360, 110, (c, w, h) => {
        c.filter = 'blur(7px)';
        c.fillStyle = linGrad(c, 0, 10, 0, h, [[0, 'rgba(196,208,220,1)'], [0.7, 'rgba(196,208,220,0.45)'], [1, 'rgba(196,208,220,0)']]);
        c.beginPath(); c.moveTo(70, 12); c.lineTo(172, 12); c.lineTo(300, h); c.lineTo(20, h); c.closePath(); c.fill();
      });
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
      const sx = lerp(DOOR.x1 - 40, DOOR.x0, g.k);
      ctx.drawImage(cv, sx - 140, BASE - 24, 720, 220);
      ctx.restore();
      // cool edge on the casing
      ctx.fillStyle = rgba('#c6d3de', 0.5 * g.k); ctx.fillRect(DOOR.x1, DOOR.top, 3, BASE - DOOR.top);
      ctx.fillRect(Math.max(g.x0, DOOR.x0), DOOR.top - 3, DOOR.x1 - Math.max(g.x0, DOOR.x0), 3);
    }
  });
}

// ───────────────────────────── counter, sink cupboard ─────────────────────────────
function drawCounter(ctx, S, P) {
  const { x0, x1, far, near } = CNT;
  // tiles
  ctx.fillStyle = P.tile; ctx.fillRect(x0, 392, x1 - x0, far - 392);
  ctx.strokeStyle = P.grout; ctx.lineWidth = 1.2; ctx.lineCap = 'butt'; ctx.beginPath();
  for (let r = 0; r < 3; r++) {
    const y = 392 + r * 24;
    ctx.moveTo(x0, y); ctx.lineTo(x1, y);
    for (let x = x0 + (r % 2 ? 12 : 24); x < x1; x += 24) { ctx.moveTo(x, y); ctx.lineTo(x, y + 24); }
  }
  ctx.stroke();
  ctx.fillStyle = P.tone(1.3); ctx.fillRect(x0, 388, x1 - x0, 4);
  ctx.fillStyle = linGrad(ctx, 0, far - 12, 0, far, [[0, rgba(P.ink, 0)], [1, rgba(P.ink, 0.22)]]); ctx.fillRect(x0, far - 12, x1 - x0, 12);
  // worktop
  poly(ctx, [[x0 + 3, far], [x1, far], [x1, near], [x0 - 5, near]]);
  ctx.fillStyle = linGrad(ctx, 0, far, 0, near, [[0, P.tone(1.16)], [1, P.cntTop]]); ctx.fill();
  ctx.fillStyle = P.cntEdge; ctx.fillRect(x0 - 5, near, x1 - x0 + 5, 8);
  ctx.fillStyle = rgba(P.key, 0.4); ctx.fillRect(x0 - 5, near, x1 - x0 + 5, 1.5);
  // carcass
  ctx.fillStyle = linGrad(ctx, 0, near + 8, 0, 676, [[0, P.tone(0.7)], [1, P.tone(0.56)]]);
  ctx.fillRect(x0, near + 8, x1 - x0, 676 - near - 8);
  ctx.fillStyle = P.kick; ctx.fillRect(x0 + 8, 676, x1 - x0 - 8, 14);
  // fronts
  const front = (x, y, w, h, handle) => {
    ctx.fillStyle = P.cntLine; ctx.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
    ctx.fillStyle = linGrad(ctx, 0, y, 0, y + h, [[0, P.cntDoor], [1, P.tone(0.62)]]); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = rgba(P.key, 0.1); ctx.fillRect(x, y, w, 1.5);
    if (handle === 'h') fillRR(ctx, x + w / 2 - 15, y + 9, 30, 4.5, 2, P.cntHandle);
    else if (handle === 'l') fillRR(ctx, x + 8, y + 14, 4.5, 34, 2, P.cntHandle);
    else if (handle === 'r') fillRR(ctx, x + w - 12.5, y + 14, 4.5, 34, 2, P.cntHandle);
  };
  front(1172, 494, 30, 176, 'r');
  front(1336, 494, 87, 42, 'h'); front(1427, 494, 87, 42, 'h');
  front(1336, 542, 87, 128, 'r'); front(1427, 542, 87, 128, 'l');
  // the sink cupboard
  const c = S.cupboardOpen;
  if (c < 0.02) { front(1209, 494, 58.5, 176, 'r'); front(1270.5, 494, 58.5, 176, 'l'); }
  else {
    // inside: darkness, the trap, a couple of bottles
    ctx.fillStyle = P.tone(0.12); ctx.fillRect(1207.5, 492.5, 123, 179);
    ctx.fillStyle = P.tone(0.2); ctx.fillRect(1216, 500, 106, 150);
    ctx.fillStyle = P.tone(0.3); fillRR(ctx, 1222, 612, 16, 38, 3, P.tone(0.34)); fillRR(ctx, 1226, 602, 8, 12, 2, P.tone(0.34));
    fillRR(ctx, 1241, 624, 13, 26, 3, P.tone(0.28));
    ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
    const pipe = (w, col) => {
      ctx.beginPath(); ctx.moveTo(1270, 500); ctx.lineTo(1270, 578); ctx.arc(1284, 578, 14, Math.PI, 0, true); ctx.lineTo(1298, 556); ctx.arcTo(1298, 546, 1310, 546, 9); ctx.lineTo(1322, 546);
      ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
    };
    pipe(10, P.tone(0.46)); pipe(3, P.tone(0.8));
    fillRR(ctx, 1263, 528, 14, 7, 2, P.tone(0.6)); fillRR(ctx, 1291, 562, 14, 7, 2, P.tone(0.6));
    // the two doors, swung toward camera
    const th = c * rad(80), sn = Math.sin(th), cs = Math.cos(th);
    for (const [hx, dir] of [[1209, 1], [1329, -1]]) {
      const fx = hx + dir * (58.5 * cs + 26 * sn), s = 1 + 0.05 * sn;
      const ya = HOR + (494 - HOR) * s, yb = HOR + (670 - HOR) * s;
      fillPoly(ctx, [[hx, 494], [fx, ya], [fx, yb], [hx, 670]], mixHex(P.cntDoor, P.ink, 0.25 * sn));
      fillPoly(ctx, [[fx, ya], [fx + dir * 3 * sn, ya], [fx + dir * 3 * sn, yb], [fx, yb]], P.tone(0.9));
    }
  }
}

// ───────────────────────────── fridge ─────────────────────────────
function crayon(ctx, pts, col, w, seed = 0) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const jx = (hash(seed * 31 + i * 7) - 0.5) * 0.9, jy = (hash(seed * 17 + i * 11) - 0.5) * 0.9;
    if (i) ctx.lineTo(x + jx, y + jy); else ctx.moveTo(x + jx, y + jy);
  });
  ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
function drawFridge(ctx, S, P) {
  const { x0, x1, top, base } = FRIDGE, lit = S.lit;
  // cereal boxes on top
  fillPoly(ctx, [[1566, 226], [1596, 226], [1596, top], [1566, top]], P.tone(0.6));
  ctx.fillStyle = P.tone(0.86); ctx.fillRect(1570, 232, 22, 12);
  fillPoly(ctx, [[1600, 236], [1640, 236], [1640, top], [1600, top]], P.tone(0.48));
  ctx.fillStyle = P.tone(0.7); ctx.beginPath(); ctx.arc(1620, 249, 6, 0, TAU); ctx.fill();
  // body
  rr(ctx, x0, top, x1 - x0, base - top, 9);
  ctx.fillStyle = linGrad(ctx, x0, 0, x1, 0, [[0, P.tone(1.36)], [0.1, P.fridge], [0.75, P.fridge], [1, P.fridgeShade]]); ctx.fill();
  ctx.fillStyle = linGrad(ctx, 0, top, 0, base, [[0, rgba(P.key, 0.1)], [0.4, rgba(P.key, 0)], [1, rgba(P.ink, 0.14)]]);
  rr(ctx, x0, top, x1 - x0, base - top, 9); ctx.fill();
  ctx.fillStyle = P.fridgeLine; ctx.fillRect(x0, 392, x1 - x0, 3.5);
  ctx.fillStyle = P.tone(0.4); ctx.fillRect(x0 + 3, 676, x1 - x0 - 6, 11);
  fillRR(ctx, x0 + 12, 300, 7, 76, 3.5, P.fridgeHandle); fillRR(ctx, x0 + 12, 414, 7, 112, 3.5, P.fridgeHandle);
  ctx.fillStyle = rgba(P.key, 0.25); ctx.fillRect(x0 + 12, 302, 1.6, 72); ctx.fillRect(x0 + 12, 416, 1.6, 108);
  // the drawings
  const paper = lit('#efe6d3'), pencil = lit('#4a4a55'), sun = lit('#e9b04a'), blue = lit('#6f86a8'), green = lit('#7d9a78');
  const sheet = (cx, cy, w, h, rot, magnet, draw) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.fillStyle = rgba(P.ink, 0.18); ctx.fillRect(-w / 2 + 1.5, -h / 2 + 2, w, h);
    ctx.fillStyle = paper; ctx.fillRect(-w / 2, -h / 2, w, h);
    draw();
    ctx.fillStyle = magnet; ctx.beginPath(); ctx.arc(0, -h / 2 + 4, 3.2, 0, TAU); ctx.fill();
    ctx.restore();
  };
  // three figures holding hands under a sun
  sheet(1612, 452, 62, 48, -0.06, lit('#5f7a66'), () => {
    const fig = (x, s, sd) => {
      ctx.strokeStyle = pencil; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, 4 - 13 * s, 3.2 * s, 0, TAU); ctx.stroke();
      crayon(ctx, [[x, 4 - 9.8 * s], [x, 4 - 2 * s]], pencil, 1.5, sd);
      crayon(ctx, [[x - 3 * s, 15], [x, 4 - 2 * s], [x + 3 * s, 15]], pencil, 1.5, sd + 1);
    };
    fig(-16, 1.15, 1); fig(14, 1.05, 4); fig(-1, 0.72, 7);
    crayon(ctx, [[-16, -3.5], [-8, 0], [-1, -1.5], [6, 0], [14, -3]], pencil, 1.4, 9);
    crayon(ctx, [[-27, 16.5], [-10, 15.5], [8, 16.5], [27, 15.5]], green, 2.2, 11);
    ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(21, -14, 4.6, 0, TAU); ctx.fill();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; crayon(ctx, [[21 + Math.cos(a) * 6.4, -14 + Math.sin(a) * 6.4], [21 + Math.cos(a) * 9, -14 + Math.sin(a) * 9]], sun, 1.2, 20 + i); }
  });
  // a big scribbled star
  sheet(1578, 322, 42, 46, 0.07, lit('#8fa3bd'), () => {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 6.4 : 15; pts.push([Math.cos(a) * r, 3 + Math.sin(a) * r]); }
    ctx.fillStyle = rgba(sun, 0.55); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.fill();
    crayon(ctx, pts, sun, 2, 31);
  });
  // a cat
  sheet(1640, 548, 46, 38, 0.04, lit('#c9a15a'), () => {
    ctx.strokeStyle = blue; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(2, 6, 11, 7.5, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(-9, -3, 6, 0, TAU); ctx.stroke();
    crayon(ctx, [[-14, -7], [-13, -12.5], [-10, -8.5]], blue, 1.5, 41); crayon(ctx, [[-8, -8.5], [-5, -12.5], [-4, -7]], blue, 1.5, 43);
    crayon(ctx, [[12, 4], [18, -2], [16, -9]], blue, 1.6, 45);
    crayon(ctx, [[-4, 13], [-4, 16]], blue, 1.5, 47); crayon(ctx, [[7, 13], [7, 16]], blue, 1.5, 49);
  });
}

// ───────────────────────────── bedrooms doorway ─────────────────────────────
function drawHallCasing(ctx, S, P) {
  const { x0, x1, top } = HALL;
  ctx.fillStyle = P.casing; ctx.fillRect(x0 - 12, top - 12, x1 - x0 + 24, BASE - top + 12);
  ctx.fillStyle = P.tone(0.2); ctx.fillRect(x0, top, x1 - x0, BASE - top);
}
function drawHallInside(ctx, S) {
  const P = S.Pd, g = S.hallGlow, warm = '#ffc98a';
  const base = S.dark ? 0.16 : 0.3;
  const T = (k) => (S.dark ? mixHex(P.ink, P.wall, clamp(k * 1.6)) : P.tone(k * base / 0.3));
  // far wall of the hall, with the door to Maya's room
  ctx.fillStyle = linGrad(ctx, 0, 190, 0, 640, [[0, T(0.2)], [1, T(0.34)]]); ctx.fillRect(1400, -200, 900, 846);
  ctx.fillStyle = T(0.26); ctx.fillRect(1742, 222, 124, 424);
  ctx.fillStyle = T(0.36); ctx.fillRect(1750, 230, 108, 416);
  ctx.fillStyle = T(0.3); ctx.fillRect(1764, 250, 80, 150); ctx.fillRect(1764, 424, 80, 196);
  ctx.fillStyle = T(0.7); ctx.beginPath(); ctx.arc(1760, 442, 3.5, 0, TAU); ctx.fill();
  // a paper star stuck on her door
  ctx.fillStyle = S.dark ? mixHex(T(0.5), warm, 0.25 * g) : S.lit('#e9c98a'); ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + 0.12 + (i * Math.PI) / 5, r = i % 2 ? 6 : 14; ctx.lineTo(1806 + Math.cos(a) * r, 322 + Math.sin(a) * r); }
  ctx.closePath(); ctx.fill();
  // hall floor + skirting
  ctx.fillStyle = T(0.2); ctx.fillRect(1400, 634, 900, 12);
  ctx.fillStyle = linGrad(ctx, 0, 646, 0, 700, [[0, T(0.22)], [1, T(0.12)]]); ctx.fillRect(1400, 646, 900, 300);
  if (g > 0.003) {
    // the nightlight: low on the right, plugged into the wall
    glow(ctx, 1872, 596, 520, warm, 0.42 * g);
    glow(ctx, 1860, 610, 250, '#ffd9a8', 0.5 * g);
    glow(ctx, 1840, 668, 260, warm, 0.32 * g, 0.22);
    fillRR(ctx, 1864, 588, 13, 17, 5, mixHex('#5a3c1e', '#fff1d6', clamp(g * 1.2)));
    glow(ctx, 1870, 596, 26, '#fff1d6', 0.9 * g);
  }
}
function drawHall(ctx, S) {
  camera(ctx, S.cam, 1, () => { ctx.beginPath(); ctx.rect(HALL.x0, HALL.top, HALL.x1 - HALL.x0, BASE - HALL.top); });
  ctx.save(); ctx.clip();
  camera(ctx, S.cam, 0.9, () => drawHallInside(ctx, S));
  camera(ctx, S.cam, 1, () => {
    const P = S.Pd;
    ctx.fillStyle = linGrad(ctx, HALL.x0, 0, HALL.x0 + 18, 0, [[0, rgba(P.ink, 0.5)], [1, rgba(P.ink, 0)]]); ctx.fillRect(HALL.x0, HALL.top, 18, BASE - HALL.top);
    ctx.fillStyle = linGrad(ctx, 0, HALL.top, 0, HALL.top + 30, [[0, rgba(P.ink, 0.55)], [1, rgba(P.ink, 0)]]); ctx.fillRect(HALL.x0, HALL.top, HALL.x1 - HALL.x0, 30);
  });
  ctx.restore();
  if (S.hallGlow > 0.003) {
    camera(ctx, S.cam, 1, () => {
      // warm edge on the casing and a soft spill on the kitchen floor
      ctx.fillStyle = rgba('#ffc98a', 0.3 * S.hallGlow);
      ctx.fillRect(HALL.x0 - 3, HALL.top, 3, BASE - HALL.top); ctx.fillRect(HALL.x1, 430, 3, BASE - 430);
      glow(ctx, 1806, 706, 260, '#ffc98a', 0.2 * S.hallGlow, 0.2);
    });
  }
}

// ───────────────────────────── window ─────────────────────────────
function drawExterior(ctx, S) {
  const sp = S.sp;
  ctx.fillStyle = linGrad(ctx, 0, 190, 0, 430, [[0, sp.sky[0]], [1, sp.sky[1]]]);
  ctx.fillRect(-1400, -1200, 5600, 3200);
  if (S.look === 'golden') { glow(ctx, 1520, 372, 300, '#fffdf0', 0.95); glow(ctx, 1520, 372, 90, '#ffffff', 1); }
  if (S.look === 'warmDay') glow(ctx, 1380, 250, 380, '#ffffff', 0.6);
  if (S.look === 'greyMorning') glow(ctx, 1340, 250, 360, '#ffffff', 0.35);
  const cv = cached('kit-ext-' + S.look, 1800, 300, (c, w, h) => {
    const r = rng(77);
    c.filter = 'blur(1px)';
    for (let row = 0; row < 2; row++) {
      let x = -20;
      c.fillStyle = sp.far[row];
      while (x < w) {
        const bw = 26 + r() * 46, top = (row ? 78 : 44) + r() * 34;
        c.fillStyle = sp.far[row]; c.fillRect(x, top, bw, h);
        if (r() < 0.4) c.fillRect(x + bw * 0.3, top - 7, bw * 0.3, 8);
        // windows
        const wc = sp.farWin;
        for (let wy = top + 7; wy < h; wy += 9) for (let wx = x + 5; wx < x + bw - 6; wx += 8) {
          const q = r();
          if (wc) { if (q < 0.07) { c.fillStyle = rgba(wc, 0.35 + r() * 0.5); c.fillRect(wx, wy, 3.5, 4.5); } }
          else if (q < 0.5) { c.fillStyle = rgba(sp.sky[1], 0.16); c.fillRect(wx, wy, 3.5, 4.5); }
        }
        x += bw + (r() < 0.3 ? 8 + r() * 20 : 1);
      }
    }
  });
  ctx.drawImage(cv, -700, 250, 3600, 600);
  if (sp.dark) {
    // the streetlight outside
    ctx.fillStyle = sp.far[1]; ctx.fillRect(1447, 352, 4, 400); ctx.fillRect(1418, 349, 33, 4);
    glow(ctx, 1420, 356, S.look === 'nightDark' ? 120 : 80, '#9fb6dd', S.look === 'nightDark' ? 0.75 : 0.4);
    glow(ctx, 1420, 356, 16, '#eaf1ff', S.look === 'nightDark' ? 1 : 0.7);
  }
}
function drawWindowCasing(ctx, S, P) {
  ctx.fillStyle = rgba(P.ink, 0.16); ctx.fillRect(WIN.x0 - 16, WIN.y0 - 8, WIN.x1 - WIN.x0 + 26, WIN.y1 - WIN.y0 + 24);
  ctx.fillStyle = P.winCase; ctx.fillRect(WIN.x0 - 11, WIN.y0 - 11, WIN.x1 - WIN.x0 + 22, WIN.y1 - WIN.y0 + 14);
}
function drawWindow(ctx, S) {
  const P = S.Pd, { x0, x1, y0, y1 } = WIN, sp = S.sp;
  camera(ctx, S.cam, 1, () => { ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); });
  ctx.save(); ctx.clip();
  camera(ctx, S.cam, 0.3, () => drawExterior(ctx, S));
  camera(ctx, S.cam, 1, () => {
    // glass: a faint diagonal sheen, and at night the reflection of the lamp
    fillPoly(ctx, [[x0 + 30, y0], [x0 + 110, y0], [x0 + 10, y1], [x0 - 70, y1]], rgba('#ffffff', sp.dark ? 0.025 : 0.1));
    fillPoly(ctx, [[x0 + 130, y0], [x0 + 150, y0], [x0 + 50, y1], [x0 + 30, y1]], rgba('#ffffff', sp.dark ? 0.02 : 0.08));
    if (S.lamp > 0.01 && sp.dark) { glow(ctx, 1262, 300, 34, '#ffc98a', 0.3 * S.lamp); glow(ctx, 1262, 300, 7, '#ffe6c0', 0.5 * S.lamp); }
    // roller blind, a third down
    const blind = sp.dark ? P.tone(0.8) : mixHex(sp.sky[1], P.wall, 0.42);
    ctx.fillStyle = blind; ctx.fillRect(x0, y0, x1 - x0, 34);
    ctx.fillStyle = sp.dark ? P.tone(0.5) : mixHex(blind, P.ink, 0.3); ctx.fillRect(x0, y0 + 31, x1 - x0, 4);
    stroke(ctx, [[x0 + 200, y0 + 35], [x0 + 200, y0 + 58]], 1, P.mullion); ctx.fillStyle = P.mullion; ctx.beginPath(); ctx.arc(x0 + 200, y0 + 61, 3, 0, TAU); ctx.fill();
    // sash bars and inner frame
    ctx.fillStyle = P.mullion;
    ctx.fillRect(WCX - 4, y0, 8, y1 - y0); ctx.fillRect(x0, WCY - 4, x1 - x0, 8);
    ctx.fillRect(x0, y0, x1 - x0, 7); ctx.fillRect(x0, y1 - 8, x1 - x0, 8); ctx.fillRect(x0, y0, 8, y1 - y0); ctx.fillRect(x1 - 8, y0, 8, y1 - y0);
    // light wrapping the bars
    if (!sp.dark) { ctx.fillStyle = rgba(sp.sky[1], 0.35); ctx.fillRect(WCX - 4, y0 + 35, 1.5, y1 - y0 - 43); ctx.fillRect(WCX + 2.5, y0 + 35, 1.5, y1 - y0 - 43); ctx.fillRect(x0 + 8, WCY - 4, x1 - x0 - 16, 1.5); }
  });
  ctx.restore();
  camera(ctx, S.cam, 1, () => {
    // sill
    ctx.fillStyle = P.sill; ctx.fillRect(x0 - 18, y1, x1 - x0 + 36, 7);
    ctx.fillStyle = mixHex(P.sill, P.ink, 0.4); ctx.fillRect(x0 - 16, y1 + 7, x1 - x0 + 32, 3);
    if (!sp.dark) { ctx.fillStyle = rgba(sp.sky[1], 0.6); ctx.fillRect(x0 - 18, y1, x1 - x0 + 36, 1.5); }
  });
}

// ───────────────────────────── things on the worktop ─────────────────────────────
function toastPath(ctx, w, h) {
  const a = w / 2;
  ctx.beginPath();
  ctx.moveTo(-a + 2, 0); ctx.lineTo(-a + 2, -h * 0.6);
  ctx.bezierCurveTo(-a - 2.5, -h * 0.68, -a - 1.5, -h, -a + 7, -h);
  ctx.lineTo(a - 7, -h);
  ctx.bezierCurveTo(a + 1.5, -h, a + 2.5, -h * 0.68, a - 2, -h * 0.6);
  ctx.lineTo(a - 2, 0); ctx.closePath();
}
/** One slice of toast, base centre at (x, y). burnt 0..1; amb = light colour multiplied in. */
function drawSlice(ctx, x, y, burnt, amb, scale = 1, rot = 0) {
  const w = 31, h = 36, L = (c) => mulHex(c, amb);
  const face = L(mixHex(mixHex('#f0c57c', '#d9933c', 0.45), '#17110d', burnt));
  const mid = L(mixHex('#c9802e', '#0b0807', burnt));
  const crust = L(mixHex('#96581c', '#050404', burnt));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  toastPath(ctx, w, h);
  ctx.fillStyle = radGrad(ctx, 0, -h * 0.5, 2, h * 0.62, [[0, mid], [0.75, face], [1, face]]); ctx.fill();
  ctx.lineWidth = 2.6; ctx.strokeStyle = crust; ctx.lineJoin = 'round'; ctx.stroke();
  if (burnt > 0.3) {
    ctx.fillStyle = rgba(L('#3a2c22'), 0.5 * burnt);
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc((hash(i * 3 + 1) - 0.5) * 20, -5 - hash(i * 5 + 2) * 26, 0.8 + hash(i) * 1.1, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}
function drawToaster(ctx, S, P) {
  const { x, base, w, h } = TOASTER, top = base - h, sp = S.sp;
  const amb = sp.dark ? mulHex(sp.amb, S.look === 'lampNight' ? '#3a3a3a' : '#9a9a9a') : sp.amb;
  // cord trailing off toward the fridge
  ctx.beginPath(); ctx.moveTo(x + w / 2 - 2, base - 8); ctx.bezierCurveTo(x + w / 2 + 14, base - 6, x + w / 2 + 6, base + 1, x + w / 2 + 30, base - 1); ctx.lineTo(CNT.x1, base - 2);
  ctx.lineWidth = 2; ctx.strokeStyle = P.tone(0.3); ctx.stroke();
  // slices (the body hides their lower part)
  const rise = 4 + S.toast * 21;
  ctx.save(); ctx.beginPath(); ctx.rect(x - w, top - 60, w * 2, 60 + 3); ctx.clip();
  if (S.toastCount >= 2) drawSlice(ctx, x - 19, top + 36 - rise, S.toastBurnt, amb);
  if (S.toastCount >= 1) drawSlice(ctx, x + 19, top + 36 - rise, S.toastBurnt, amb);
  ctx.restore();
  // feet
  ctx.fillStyle = P.tone(0.22); ctx.fillRect(x - w / 2 + 8, base - 3, 12, 3); ctx.fillRect(x + w / 2 - 20, base - 3, 12, 3);
  // body
  ctx.beginPath();
  ctx.moveTo(x - w / 2, base - 4); ctx.lineTo(x - w / 2, top + 13); ctx.quadraticCurveTo(x - w / 2, top, x - w / 2 + 13, top);
  ctx.lineTo(x + w / 2 - 13, top); ctx.quadraticCurveTo(x + w / 2, top, x + w / 2, top + 13); ctx.lineTo(x + w / 2, base - 4); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, 0, top, 0, base, [[0, P.tone(1.02)], [0.18, P.tone(0.8)], [0.55, P.metal], [1, P.tone(0.46)]]); ctx.fill();
  // slots, seen a little from above
  ctx.fillStyle = P.tone(0.14); fillRR(ctx, x - 36, top - 1.5, 34, 4.5, 2, P.tone(0.14)); fillRR(ctx, x + 2, top - 1.5, 34, 4.5, 2, P.tone(0.14));
  // dark base band, window reflection, top highlight
  ctx.fillStyle = P.tone(0.3); ctx.fillRect(x - w / 2, base - 11, w, 7);
  if (!sp.dark) {
    fillRR(ctx, x - 6, top + 9, 26, 15, 3, rgba(P.key, 0.3));
    ctx.fillStyle = rgba(P.key, 0.3); ctx.fillRect(x + 6, top + 9, 1.5, 15); ctx.fillRect(x - 6, top + 16, 26, 1.5);
  }
  ctx.fillStyle = rgba(P.key, sp.dark ? 0.2 : 0.55); ctx.fillRect(x - w / 2 + 12, top, w - 24, 1.6);
  // browning dial
  ctx.fillStyle = P.tone(0.34); ctx.beginPath(); ctx.arc(x + 29, top + 27, 5.5, 0, TAU); ctx.fill();
  stroke(ctx, [[x + 29, top + 27], [x + 31.6, top + 23.6]], 1.4, P.tone(1.2));
  // lever in its slot on the left end
  fillRR(ctx, x - w / 2 + 5, top + 12, 4, 28, 2, P.tone(0.2));
  const ly = top + 14 + (1 - S.toast) * 16;
  fillRR(ctx, x - w / 2 - 5, ly, 16, 7, 3, P.tone(0.24));
  ctx.fillStyle = rgba(P.key, sp.dark ? 0.12 : 0.3); ctx.fillRect(x - w / 2 - 3, ly + 0.8, 12, 1.2);
}
function drawWorktopThings(ctx, S, P) {
  const y = CNT.near - 6;       // things stand a little back from the front edge
  const sp = S.sp, rim = rgba(P.key, sp.dark ? 0.22 : 0.5);
  // plant on the sill
  const px = 1236, py = WIN.y1;
  ctx.strokeStyle = P.plant; ctx.fillStyle = P.plant;
  const leaf = (a, len, wd) => {
    ctx.save(); ctx.translate(px, py - 14); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(wd, -len * 0.5, 0, -len); ctx.quadraticCurveTo(-wd, -len * 0.5, 0, 0); ctx.fill();
    ctx.restore();
  };
  leaf(-0.75, 30, 7); leaf(-0.3, 40, 8); leaf(0.12, 44, 8); leaf(0.52, 36, 7.5); leaf(0.95, 26, 6.5);
  fillPoly(ctx, [[px - 11, py - 16], [px + 11, py - 16], [px + 8, py], [px - 8, py]], P.pot);
  ctx.fillStyle = mixHex(P.pot, P.ink, 0.3); ctx.fillRect(px - 12, py - 18, 24, 4);
  // kettle
  const kx = 1192;
  ctx.fillStyle = P.metal;
  ctx.beginPath(); ctx.moveTo(kx - 17, y); ctx.quadraticCurveTo(kx - 19, y - 24, kx - 9, y - 30); ctx.lineTo(kx + 9, y - 30); ctx.quadraticCurveTo(kx + 19, y - 24, kx + 17, y); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, kx - 18, 0, kx + 18, 0, [[0, P.tone(0.5)], [0.6, P.metal], [1, P.tone(0.86)]]); ctx.fill();
  fillPoly(ctx, [[kx - 15, y - 20], [kx - 27, y - 27], [kx - 26, y - 30], [kx - 13, y - 26]], P.tone(0.5));
  ctx.beginPath(); ctx.moveTo(kx - 9, y - 30); ctx.bezierCurveTo(kx - 10, y - 46, kx + 14, y - 46, kx + 13, y - 28); ctx.lineWidth = 3.4; ctx.strokeStyle = P.tone(0.3); ctx.lineCap = 'round'; ctx.stroke();
  fillRR(ctx, kx - 4, y - 34, 8, 5, 2, P.tone(0.3));
  ctx.fillStyle = rim; ctx.fillRect(kx + 13.5, y - 22, 1.5, 18);
  // tap
  const tx = TAPX, by = CNT.far + 3;
  const neck = (wd, col) => {
    ctx.beginPath(); ctx.moveTo(tx, by); ctx.lineTo(tx, 416); ctx.bezierCurveTo(tx, 394, tx - 21, 394, tx - 21, 414); ctx.lineTo(tx - 21, 427);
    ctx.lineWidth = wd; ctx.strokeStyle = col; ctx.lineCap = 'butt'; ctx.lineJoin = 'round'; ctx.stroke();
  };
  neck(7.5, P.tone(0.34));
  ctx.save(); ctx.translate(1.6, 0); neck(1.6, rim); ctx.restore();
  fillRR(ctx, tx - 8, by - 6, 16, 8, 2.5, P.tone(0.34));
  fillRR(ctx, tx + 6, by - 20, 15, 5, 2.5, P.tone(0.34));        // lever
  fillRR(ctx, tx - 25, 425, 8, 4, 1.5, P.tone(0.3));
  // utensil crock by the fridge
  const cx = 1494;
  stroke(ctx, [[cx - 5, y - 26], [cx - 9, y - 58]], 2.4, P.tone(0.34)); ctx.fillStyle = P.tone(0.34); ctx.beginPath(); ctx.ellipse(cx - 10, y - 63, 5, 8, -0.14, 0, TAU); ctx.fill();
  stroke(ctx, [[cx + 1, y - 26], [cx + 2, y - 66]], 2.2, P.tone(0.42)); fillRR(ctx, cx - 3.5, y - 80, 11, 16, 2, P.tone(0.42));
  stroke(ctx, [[cx + 6, y - 26], [cx + 12, y - 54]], 2, P.tone(0.3));
  fillPoly(ctx, [[cx - 11, y - 28], [cx + 11, y - 28], [cx + 9, y], [cx - 9, y]], P.tone(0.74));
  ctx.fillStyle = P.tone(0.56); ctx.fillRect(cx - 11, y - 28, 22, 3.5);
  drawToaster(ctx, S, P);
}

// ───────────────────────────── stool ─────────────────────────────
function drawStool(ctx, S, P) {
  const x = STOOL.x, top = STOOL.top;
  fillPoly(ctx, [[x - 24, top + 6], [x - 16, top + 6], [x - 44, 696], [x - 52, 696]], P.woodDark);
  fillPoly(ctx, [[x + 16, top + 6], [x + 24, top + 6], [x + 30, 696], [x + 22, 696]], P.woodDark);
  fillPoly(ctx, [[x - 30, top + 6], [x - 21, top + 6], [x - 51, FLOOR], [x - 60, FLOOR]], P.wood);
  fillPoly(ctx, [[x + 21, top + 6], [x + 30, top + 6], [x + 37, FLOOR], [x + 28, FLOOR]], P.wood);
  ctx.fillStyle = P.wood; ctx.fillRect(x - 42, 684, 76, 5);
  // lower step
  fillRR(ctx, x - 62, 668, 44, 7, 2, P.woodEdge);
  ctx.fillStyle = P.woodTop; ctx.fillRect(x - 61, 668, 42, 1.8);
  // top step
  fillRR(ctx, x - 38, top, 76, 8, 2.5, P.woodEdge);
  ctx.fillStyle = P.woodTop; ctx.fillRect(x - 37, top, 74, 2);
}

// ───────────────────────────── table, chairs, lamp ─────────────────────────────
function lampGain(S) { return clamp(S.lamp * S.sp.lampGain); }
function drawTableTop(ctx, S, withBackLegs) {
  const { x0, x1, far, near } = TABLE, B = S.Pd, on = lampGain(S), lx = lampX(S), sp = S.sp;
  if (withBackLegs) {
    const lc = mixHex(B.woodDark, '#3a2412', on * 0.5);
    fillPoly(ctx, [[x0 + 40, near], [x0 + 50, near], [x0 + 48, 694], [x0 + 42, 694]], lc);
    fillPoly(ctx, [[x1 - 50, near], [x1 - 40, near], [x1 - 42, 694], [x1 - 48, 694]], lc);
  }
  const stops = [];
  for (let i = 0; i <= 8; i++) {
    const q = i / 8, x = lerp(x0, x1, q), d = Math.abs(x - lx) / 170;
    const g = clamp(1.06 - 0.62 * Math.pow(d, 1.25));
    const base = sp.dark ? B.woodTop : B.tone(1.08 + 0.3 * q);
    stops.push([q, mixHex(mixHex(base, '#f2b566', clamp(on * 1.3) * (0.55 + 0.45 * g)), '#fff0cf', on * g * g * 0.8)]);
  }
  poly(ctx, [[x0 + 12, far], [x1 - 12, far], [x1, near], [x0, near]]);
  ctx.fillStyle = linGrad(ctx, x0, 0, x1, 0, stops); ctx.fill();
  // grain
  ctx.save(); poly(ctx, [[x0 + 12, far], [x1 - 12, far], [x1, near], [x0, near]]); ctx.clip();
  ctx.strokeStyle = rgba(B.ink, sp.dark && on < 0.2 ? 0.25 : 0.11); ctx.lineWidth = 0.8;
  for (let i = 0; i < 7; i++) {
    const y = far + 2.5 + i * 3 + hash(i * 9) * 1.2, xa = x0 + hash(i * 3 + 1) * 120, xb = x1 - hash(i * 5 + 2) * 120;
    ctx.beginPath(); ctx.moveTo(xa, y); ctx.bezierCurveTo(lerp(xa, xb, 0.3), y + 1.2, lerp(xa, xb, 0.7), y - 1.2, xb, y + 0.5); ctx.stroke();
  }
  // far edge falls into shadow a little
  ctx.fillStyle = linGrad(ctx, 0, far, 0, far + 7, [[0, rgba(B.ink, 0.22)], [1, rgba(B.ink, 0)]]); ctx.fillRect(x0, far, x1 - x0, 7);
  if (S.look === 'golden') {
    // the low sun catches the right end of the table
    fillPoly(ctx, [[x1 - 150, far], [x1 - 12, far], [x1, near], [x1 - 190, near]], rgba('#fff3cf', 0.5));
  }
  ctx.restore();
}
function drawTableFront(ctx, S) {
  const { x0, x1, near } = TABLE, B = S.Pd, on = lampGain(S), sp = S.sp, lx = lampX(S);
  const dayDir = 1;
  // apron
  ctx.fillStyle = linGrad(ctx, x0, 0, x1, 0, [[0, mixHex(B.wood, '#2a190c', on * 0.6)], [0.5, mixHex(B.wood, '#4a2e16', on * 0.7)], [1, mixHex(B.wood, '#2a190c', on * 0.6)]]);
  ctx.fillRect(x0 + 18, near + 8, x1 - x0 - 36, 19);
  ctx.fillStyle = rgba(B.ink, 0.35); ctx.fillRect(x0 + 18, near + 8, x1 - x0 - 36, 5);
  // legs
  const leg = mixHex(B.wood, '#1c1109', on * 0.7), hi = sp.dark ? rgba('#ffc27a', 0.4 * on) : rgba(B.key, 0.28);
  for (const [xa, dir] of [[x0 + 20, 1], [x1 - 20, -1]]) {
    fillPoly(ctx, [[xa, near + 8], [xa + dir * 15, near + 8], [xa + dir * 12.5, 706], [xa + dir * 3.5, 706]], leg);
    // lit inner edge (toward the lamp at night, toward the window by day)
    const inner = sp.dark ? dir : dayDir;
    const ex = inner === dir ? xa + dir * 15 : xa;
    const ex2 = inner === dir ? xa + dir * 12.5 : xa + dir * 3.5;
    stroke(ctx, [[ex - inner * 0.8, near + 28], [ex2 - inner * 0.8, 704]], 1.4, hi, 'butt');
  }
  // front edge of the top
  const stops = [];
  for (let i = 0; i <= 6; i++) {
    const q = i / 6, x = lerp(x0, x1, q), g = clamp(1 - Math.abs(x - lx) / 230);
    stops.push([q, mixHex(sp.dark ? B.woodEdge : B.tone(0.74 + 0.2 * q), '#b87a3a', on * (0.35 + 0.65 * g))]);
  }
  ctx.fillStyle = linGrad(ctx, x0, 0, x1, 0, stops); ctx.fillRect(x0, near, x1 - x0, 9);
  ctx.fillStyle = sp.dark ? rgba('#ffe2b0', 0.55 * on) : rgba(B.key, 0.45); ctx.fillRect(x0, near, x1 - x0, 1.4);
  ctx.fillStyle = rgba(B.ink, 0.3); ctx.fillRect(x0, near + 7.5, x1 - x0, 1.5);
}
function drawChair(ctx, S, cx, dir) {
  const B = S.Pd, on = lampGain(S), sp = S.sp;
  const body = mixHex(B.wood, '#170e07', on * 0.75), dark = mixHex(B.woodDark, '#0d0804', on * 0.75);
  const lightLocal = sp.dark ? 1 : dir;             // local +x = toward the table
  const hi = sp.dark ? rgba('#ffc27a', 0.5 * on) : rgba(B.key, 0.3);
  const top = sp.dark ? mixHex(B.woodEdge, '#a86c30', on) : B.woodTop;
  ctx.save(); ctx.translate(cx, 0); ctx.scale(dir, 1);
  // far-side legs
  fillPoly(ctx, [[-49, 698], [-42, 698], [-37, 598], [-44, 598]], dark);
  fillPoly(ctx, [[36, 598], [43, 598], [45, 699], [39, 699]], dark);
  // stretcher
  fillPoly(ctx, [[-50, 654], [50, 658], [50, 663], [-50, 659]], body);
  // back post + back leg in one piece
  fillPoly(ctx, [[-57, 704], [-48, 704], [-42, 596], [-49, 480], [-58, 480], [-51, 596]], body);
  fillRR(ctx, -62, 471, 15, 13, 4, body);
  // front leg
  fillPoly(ctx, [[43, 598], [52, 598], [54, 706], [46, 706]], body);
  // seat
  fillPoly(ctx, [[-46, SEAT.y - 4], [45, SEAT.y - 4], [50, SEAT.y], [-50, SEAT.y]], top);
  fillRR(ctx, -51, SEAT.y, 102, 9, 3, body);
  // rim light on the edges that face the light
  if (lightLocal > 0) {
    stroke(ctx, [[-42.6, 594], [-49.6, 482]], 1.4, hi, 'butt'); stroke(ctx, [[52.6, 600], [54.6, 704]], 1.4, hi, 'butt');
    stroke(ctx, [[-47.4, 704], [-41.6, 600]], 1.2, hi, 'butt');
  } else {
    stroke(ctx, [[-51.6, 594], [-58.6, 482]], 1.4, hi, 'butt'); stroke(ctx, [[43.4, 600], [46.4, 704]], 1.4, hi, 'butt');
  }
  ctx.restore();
}
function drawLamp(ctx, S) {
  const B = S.Pd, on = S.lamp, sp = S.sp;
  ctx.save(); ctx.translate(LAMP.x, CEIL); ctx.rotate(-lampAngle(S));
  // ceiling rose, cord, cap
  ctx.fillStyle = B.shade; ctx.beginPath(); ctx.ellipse(0, 1, 13, 5, 0, 0, Math.PI); ctx.fill();
  stroke(ctx, [[0, 4], [0, 140]], 2.2, B.cord, 'butt');
  fillRR(ctx, -6.5, 137, 13, 13, 3, B.shade);
  // shade
  const shadePath = () => { ctx.beginPath(); ctx.moveTo(-12, 148); ctx.bezierCurveTo(-36, 152, -58, 176, -62, 203); ctx.lineTo(62, 203); ctx.bezierCurveTo(58, 176, 36, 152, 12, 148); ctx.closePath(); };
  shadePath();
  const dayHi = sp.dark ? B.shade : B.tone(0.5);
  ctx.fillStyle = linGrad(ctx, -62, 0, 62, 0, [[0, B.shade], [0.7, B.shade], [1, dayHi]]); ctx.fill();
  if (on > 0.01) {
    // the enamel glows a little near the rim
    shadePath(); ctx.fillStyle = linGrad(ctx, 0, 160, 0, 203, [[0, rgba('#7a4418', 0)], [1, rgba('#b06a28', 0.55 * on)]]); ctx.fill();
    // lit inside of the shade and the bulb
    ctx.fillStyle = mixHex('#3a2410', '#fff3d6', on); ctx.beginPath(); ctx.ellipse(0, 203, 60, 4.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = mixHex('#5a3a18', '#ffffff', on); ctx.beginPath(); ctx.ellipse(0, 205, 9, 6.5, 0, 0, TAU); ctx.fill();
  } else {
    ctx.fillStyle = B.tone(0.18); ctx.beginPath(); ctx.ellipse(0, 203, 60, 4.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = B.tone(0.5); ctx.beginPath(); ctx.ellipse(0, 205, 8, 5.5, 0, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = rgba(sp.dark ? '#ffd9a0' : B.key, sp.dark ? 0.6 * on : 0.3); ctx.fillRect(-61, 201.6, 122, 1.4);
  ctx.restore();
}
/** The lamp's light in the air: bloom, cone, the pool on the table. Drawn over the figures. */
function drawLampAir(ctx, S, strength = 1) {
  const on = S.lamp * strength; if (on < 0.01) return;
  const a = lampAngle(S), lx = lampX(S), ly = CEIL + Math.cos(a) * 205;
  const k = S.dark ? 1 : 0.45;
  // cone of haze from the rim down to the table
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [spread, al] of [[250, 0.05], [200, 0.045], [150, 0.04]]) {
    ctx.fillStyle = linGrad(ctx, 0, ly, 0, TABLE.near + 30, [[0, rgba('#ffcf8a', al * on * k * 2)], [1, rgba('#ffcf8a', 0)]]);
    poly(ctx, [[lx - 56, ly], [lx + 56, ly], [lx + spread, TABLE.near + 30], [lx - spread, TABLE.near + 30]]); ctx.fill();
  }
  ctx.restore();
  glow(ctx, lx, ly + 2, 190, '#ffb561', 0.32 * on * k);
  glow(ctx, lx, ly + 3, 62, '#ffe2b0', 0.7 * on * k);
  glow(ctx, lx, ly + 3, 20, '#ffffff', 0.9 * on);
  // glow lifting off the bright table top
  glow(ctx, lx, TABLE.top - 2, 230, '#ffc27a', 0.2 * on * k, 0.16);
}

// ───────────────────────────── light: day looks ─────────────────────────────
function softPatch(key, w, h, blur, draw) {
  return cached(key, w, h, (c) => { c.filter = `blur(${blur}px)`; draw(c); c.filter = 'none'; });
}
/** Window light lying on the floor (a soft four-pane quad). q = [TL,TR,BR,BL] in world px. */
function floorPatch(ctx, name, q, color, alpha, blur = 5) {
  if (alpha <= 0) return;
  const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]);
  const bx = Math.min(...xs) - 40, by = Math.min(...ys) - 30, bw = Math.max(...xs) - bx + 40, bh = Math.max(...ys) - by + 30;
  const cv = softPatch('kit-fp-' + name, bw / 2, bh / 2, blur, (c) => {
    c.scale(0.5, 0.5); c.translate(-bx, -by); c.fillStyle = color;
    for (const [u0, v0, u1, v1] of [[0, 0, 0.485, 0.47], [0.515, 0, 1, 0.47], [0, 0.53, 0.485, 1], [0.515, 0.53, 1, 1]]) fillPoly(c, subQuad(q, u0, v0, u1, v1), color);
  });
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha; ctx.drawImage(cv, bx, by, bw, bh); ctx.restore();
}
const BEAM = {
  golden: { D: [-800, 410], spread: 26, blur: 4, color: '#ffe6a8' },
  warmDay: { D: [-560, 440], spread: 60, blur: 11, color: '#fff0d0' },
};
const PANES = [[1220, 240, 1343, 307], [1351, 240, 1474, 307], [1220, 315, 1343, 410], [1351, 315, 1474, 410]];
const BEAM_BOX = { x: 280, y: 190, w: 1240, h: 680 };
function drawBeams(ctx, S, alpha) {
  const b = BEAM[S.look]; if (!b || alpha <= 0) return;
  const cv = softPatch('kit-beam-' + S.look, BEAM_BOX.w / 2, BEAM_BOX.h / 2, b.blur, (c) => {
    c.scale(0.5, 0.5); c.translate(-BEAM_BOX.x, -BEAM_BOX.y);
    const [dx, dy] = b.D, len = Math.hypot(dx, dy), nx = dy / len, ny = -dx / len;     // normal pointing down-right
    for (const [px0, py0, px1, py1] of PANES) {
      const cxp = (px0 + px1) / 2, cyp = (py0 + py1) / 2;
      c.fillStyle = linGrad(c, cxp, cyp, cxp + dx, cyp + dy, [[0, rgba(b.color, 0.95)], [0.12, rgba(b.color, 0.6)], [0.55, rgba(b.color, 0.26)], [1, rgba(b.color, 0)]]);
      fillPoly(c, [[px0, py0], [px1, py1], [px1 + dx + nx * b.spread, py1 + dy + ny * b.spread], [px0 + dx - nx * b.spread, py0 + dy - ny * b.spread]], c.fillStyle);
    }
  });
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha;
  ctx.drawImage(cv, BEAM_BOX.x, BEAM_BOX.y, BEAM_BOX.w, BEAM_BOX.h);
  ctx.restore();
}
function drawDust(ctx, S) {
  const b = BEAM[S.look], t = S.t;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (b) {
    const n = S.look === 'golden' ? 90 : 34, [dx, dy] = b.D;
    for (let i = 0; i < n; i++) {
      const p = PANES[i % 4], u = 0.04 + hash(i * 7 + 1) * 0.8, v = hash(i * 13 + 2);
      const sx = lerp(p[0], p[2], v), sy = lerp(p[1], p[3], v);
      const x = sx + dx * u + wobble(t * 0.07 + i, 1, i) * 26 + t * (hash(i * 5) - 0.5) * 3;
      const y = sy + dy * u + wobble(t * 0.06 + i * 2, 1, i + 50) * 18 + t * (0.6 + hash(i * 3) * 1.2);
      const tw = 0.35 + 0.65 * noise1(t * 0.5 + i * 3.1, i);
      const al = (1 - u) * tw * (S.look === 'golden' ? 0.75 : 0.4);
      const r = 0.7 + hash(i * 11 + 4) * 1.3;
      ctx.fillStyle = rgba('#fff3cf', al); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  }
  if (S.look === 'lampNight' && S.lamp > 0.05) {
    const lx = lampX(S);
    for (let i = 0; i < 22; i++) {
      const u = hash(i * 7 + 3), v = hash(i * 13 + 5) * 2 - 1;
      const y = LAMP.rim + 14 + u * 200 + wobble(t * 0.05 + i, 1, i + 9) * 14 - ((t * (1.5 + hash(i) * 2)) % 30);
      const x = lx + v * (50 + u * 130) + wobble(t * 0.06 + i * 3, 1, i) * 18;
      const al = 0.4 * S.lamp * (0.3 + 0.7 * noise1(t * 0.4 + i * 2.7, i + 2)) * (1 - u * 0.6);
      ctx.fillStyle = rgba('#ffd9a0', al); ctx.beginPath(); ctx.arc(x, y, 0.7 + hash(i * 3 + 1), 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}
function drawDayLight(ctx, S) {
  const P = S.P, look = S.look;
  // contact shadows under the furniture
  const shadow = (x, y, rx, ry, a) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    ctx.fillStyle = radGrad(ctx, 0, 0, 0, rx, [[0, rgba(P.ink, a)], [0.6, rgba(P.ink, a * 0.5)], [1, rgba(P.ink, 0)]]);
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore();
  };
  const sa = look === 'greyMorning' ? 0.3 : 0.36;
  ctx.fillStyle = linGrad(ctx, 0, 686, 0, 716, [[0, rgba(P.ink, sa * 1.2)], [1, rgba(P.ink, 0)]]);
  ctx.fillRect(CNT.x0, 686, FRIDGE.x1 - CNT.x0, 30);
  shadow(TABLE.x - 30, 706, 250, 18, sa); shadow(SEAT.L - 20, 706, 90, 10, sa); shadow(SEAT.R - 20, 706, 90, 10, sa);
  if (S.stool) shadow(STOOL.x - 30, 703, 70, 8, sa);
  // window light on the floor
  if (look === 'greyMorning') floorPatch(ctx, 'grey', [[1190, 704], [1450, 704], [1500, 800], [1130, 800]], '#cfdcee', 0.1, 9);
  if (look === 'warmDay') floorPatch(ctx, 'warm', [[1010, 706], [1290, 706], [1180, 800], [820, 800]], '#fff0cf', 0.3, 5);
  if (look === 'golden') floorPatch(ctx, 'gold', [[700, 704], [1030, 704], [760, 806], [330, 806]], '#fff0c4', 0.42, 4);
}
function drawCounterSun(ctx, S) {
  // the patch of sun on the worktop (the lunchbox sits in it)
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  fillPoly(ctx, [[1310, CNT.far], [1404, CNT.far], [1376, CNT.near], [1276, CNT.near]], rgba('#fff3cf', 0.6));
  fillPoly(ctx, [[1276, CNT.near], [1376, CNT.near], [1373, CNT.near + 8], [1273, CNT.near + 8]], rgba('#fff3cf', 0.4));
  ctx.fillStyle = linGrad(ctx, 0, CNT.near + 8, 0, CNT.near + 120, [[0, rgba('#ffd890', 0.22)], [1, rgba('#ffd890', 0)]]);
  fillPoly(ctx, [[1273, CNT.near + 8], [1373, CNT.near + 8], [1340, CNT.near + 120], [1240, CNT.near + 120]], ctx.fillStyle);
  fillPoly(ctx, [[1318, 428], [1410, 428], [1404, CNT.far], [1310, CNT.far]], rgba('#fff3cf', 0.28));
  ctx.restore();
}

// ───────────────────────────── light: dark looks (multiplied light map) ─────────────────────────────
const NIGHT_PATCH = [[398, 300], [700, 320], [668, 590], [366, 570]];
function nightPatchImage() {
  return softPatch('kit-nightpatch', 230, 190, 3.5, (c) => {
    c.scale(0.5, 0.5); c.translate(-320, -260); c.fillStyle = '#ffffff';
    for (const [u0, v0, u1, v1] of [[0, 0, 0.478, 0.6], [0.522, 0, 1, 0.6], [0, 0.65, 0.478, 1], [0.522, 0.65, 1, 1]]) fillPoly(c, subQuad(NIGHT_PATCH, u0, v0, u1, v1), '#ffffff');
  });
}
function pool(m, x, y, r, squash, tint, k, stops = [[0, 1], [0.3, 0.62], [0.62, 0.24], [1, 0]]) {
  if (k <= 0.002) return;
  m.save(); m.translate(x, y); m.scale(1, squash);
  m.fillStyle = radGrad(m, 0, 0, 0, r, stops.map(([q, v]) => [q, rgba(tint, v * k)]));
  m.beginPath(); m.arc(0, 0, r, 0, TAU); m.fill(); m.restore();
}
function applyLightMap(ctx, S) {
  const sp = S.sp, { cv, ctx: m } = scratch('kitchen-lightmap', PW / 2, PH / 2);
  m.save(); m.scale(0.5, 0.5);
  m.fillStyle = sp.maskBase; m.fillRect(0, 0, PW, PH);
  camera(m, S.cam, 1, () => {
    m.globalCompositeOperation = 'lighter';
    const on = S.lamp * (S.look === 'lampNight' ? 1 : 0.8), lx = lampX(S);
    if (on > 0.002) {
      // the lamp: wall behind the table, the floor around it
      pool(m, lx, 452, 640, 0.6, '#fff0dc', 0.86 * on, [[0, 1], [0.22, 0.8], [0.45, 0.44], [0.7, 0.17], [1, 0]]);
      pool(m, lx, 730, 600, 0.2, '#ffe9cf', 0.5 * on);
      pool(m, lx, 500, 1100, 0.5, '#ffd9b0', 0.08 * on);
    }
    if (S.look === 'nightDark') {
      // streetlight through the unseen window on our side of the room → a pale sash-window patch on the wall
      const img = nightPatchImage();
      m.globalAlpha = 0.5; m.drawImage(img, 320, 260, 460, 380); m.globalAlpha = 1;
      pool(m, 560, 420, 330, 0.9, sp.maskTint, 0.1);
      // a passing car, now and then: a second fainter patch slides across
      const ph = ((S.t + 4) % 13) / 3.2;
      if (ph < 1) { m.globalAlpha = 0.2 * Math.sin(ph * Math.PI); m.drawImage(img, 320 + lerp(240, -200, ph), 250, 460, 380); m.globalAlpha = 1; }
      // spill from the real window on the worktop and the floor below it
      pool(m, WCX, 452, 300, 0.7, sp.maskTint, 0.3);
      pool(m, WCX - 40, 730, 300, 0.22, sp.maskTint, 0.22);
    } else {
      pool(m, WCX, 440, 240, 0.7, '#cfdcff', 0.09);
    }
    if (S.hallGlow > 0.002) {
      pool(m, 1806, 716, 300, 0.26, '#ffd0a0', 0.5 * S.hallGlow);
      pool(m, 1806, 470, 240, 1.2, '#ffd0a0', 0.1 * S.hallGlow);
    }
    // shadows inside the pool: under the table, and above the lamp where the shade cuts the light off
    m.globalCompositeOperation = 'source-over';
    if (on > 0.002) {
      pool(m, lx, 708, 230, 0.1, '#000000', 0.55 * on);
      m.fillStyle = linGrad(m, 0, CEIL - 40, 0, 330, [[0, 'rgba(0,0,0,0.8)'], [0.55, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]);
      m.globalAlpha = 0.85 * clamp(on); m.fillRect(lx - 1500, -600, 3000, 930); m.globalAlpha = 1;
    }
  });
  m.restore();
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(cv, 0, 0, PW, PH); ctx.restore();
}

// ───────────────────────────── smoke ─────────────────────────────
function drawSmoke(ctx, S) {
  const s = S.smoke; if (s <= 0.004) return;
  const t = S.t, x0 = TOASTER.x, y0 = TOASTER.base - TOASTER.h - 4, n = 34;
  const col = S.sp.smokeCol, H = 250 + 110 * s;
  for (let i = 0; i < n; i++) {
    const src = i % 2 ? 19 : -19;
    const p = (((t * (0.16 + 0.05 * hash(i * 3)) + i / n + hash(i * 17) * 0.3) % 1) + 1) % 1;
    const y = y0 - p * H;
    const sway = wobble(t * 0.25 + p * 2.2, 1, 3) * (8 + 70 * p) * (0.5 + 0.5 * s) + wobble(p * 5 + i, 1, i) * 10 * p;
    const x = x0 + src * (1 - p * 0.8) + sway + p * p * 46;
    const r = (3.2 + p * (20 + 46 * s)) * (0.8 + 0.4 * hash(i * 5 + 1));
    const a = clamp(p * 9) * Math.pow(1 - p, 1.35) * (0.2 + 0.5 * s) * (0.7 + 0.3 * hash(i * 9));
    ctx.fillStyle = radGrad(ctx, x, y, 0, r, [[0, rgba(col, a)], [0.55, rgba(col, a * 0.55)], [1, rgba(col, 0)]]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
}

// ═════════════════════════════════════ the set ═════════════════════════════════════
export const kitchen = {
  W: 1920,
  floorY: FLOOR,

  anchors: {
    doorStand: { x: 194, y: 700 }, doorHandle: { x: 272, y: 438 }, entry: { x: 380, y: 700 },
    standL: { x: 475, y: 700 },
    seatL: { x: SEAT.L, y: SEAT.y }, seatR: { x: SEAT.R, y: SEAT.y },
    tableTop: { x: TABLE.x, y: TABLE.top }, tableL: { x: 700, y: TABLE.top }, tableR: { x: 900, y: TABLE.top },
    behindTable: { x: 800, y: 700 },
    lamp: { x: LAMP.x, y: LAMP.rim },
    standR: { x: 1140, y: 700 },
    sink: { x: TAPX, y: 700 }, pipe: { x: 1270, y: 590 }, tap: { x: 1247, y: 428 },
    counterL: { x: 1215, y: 700 }, counterSun: { x: 1340, y: 474 }, counterStand: { x: 1330, y: 700 },
    toaster: { x: TOASTER.x, y: TOASTER.base }, toastSlot: { x: TOASTER.x, y: TOASTER.base - TOASTER.h }, toasterLever: { x: 1380, y: 440 },
    stoolTop: { x: STOOL.x, y: STOOL.top },
    counterR: { x: 1490, y: 700 },
    fridge: { x: 1607, y: 700 }, drawings: { x: 1607, y: 440 },
    hallDoor: { x: 1806, y: 700 },
    window: { x: WCX, y: WCY },
  },

  lights: {
    greyMorning: { key: SPECS.greyMorning.light.key, from: 1, amount: 0.35 },
    nightDark: { key: SPECS.nightDark.light.key, from: 1, amount: 0.22 },
    warmDay: { key: SPECS.warmDay.light.key, from: 1, amount: 0.6 },
    lampNight: { key: SPECS.lampNight.light.key, from: 1, amount: 0.75 },
    golden: { key: SPECS.golden.light.key, from: 1, amount: 0.85 },
  },

  /** Rim light for a figure standing at world x: {key, from (1 = lit from screen right), amount}. */
  lightAt(look, x, o = {}) {
    const sp = SPECS[look] || SPECS.greyMorning;
    if (look === 'lampNight') {
      const on = clamp(o.lampOn ?? 1), d = Math.abs(x - LAMP.x);
      return { key: sp.light.key, from: x <= LAMP.x ? 1 : -1, amount: sp.light.amount * on * clamp(1.15 - d / 700, 0.12, 1) };
    }
    const d = Math.abs(x - WCX);
    return { key: sp.light.key, from: x <= WCX ? 1 : -1, amount: sp.light.amount * clamp(1.1 - d / 1900, 0.45, 1) };
  },

  /** One slice of toast in this set's colours (base centre at x, y). */
  toastSlice(ctx, x, y, o = {}) {
    const sp = getSpec(SPECS[o.look] ? o.look : 'greyMorning');
    const amb = sp.dark ? mulHex(sp.amb, o.look === 'lampNight' ? '#3a3a3a' : '#9a9a9a') : sp.amb;
    drawSlice(ctx, x, y, clamp(o.burnt ?? 0), amb, o.scale ?? 1, o.rot ?? 0);
  },

  // ───────── everything behind the characters ─────────
  back(ctx, F, o = {}) {
    const S = resolve(F, o), P = S.P;
    ctx.save();
    ctx.fillStyle = P.ceil; ctx.fillRect(0, 0, PW, PH);
    camera(ctx, S.cam, 1, () => {
      drawShell(ctx, S, P);
      for (const g of S.sp.wallGlows) glow(ctx, g[0], g[1], g[2], g[3], g[4], g[5]);
      if (!S.dark) drawBeams(ctx, S, S.look === 'golden' ? 0.5 : 0.3);
      drawPictures(ctx, S, P); drawClock(ctx, S, P); drawCoats(ctx, S, P);
      drawDoorCasing(ctx, S, P); doorLeaf(ctx, S, P, 0);
      drawWindowCasing(ctx, S, P);
      drawCounter(ctx, S, P);
      drawFridge(ctx, S, P);
      drawHallCasing(ctx, S, P);
      if (!S.dark) drawDayLight(ctx, S);
      if (S.stool) drawStool(ctx, S, P);
    });
    if (S.dark) applyLightMap(ctx, S);
    // things that give light, and things seen against them
    drawWindow(ctx, S);
    camera(ctx, S.cam, 1, () => {
      if (S.look === 'golden') drawCounterSun(ctx, S);
      drawWorktopThings(ctx, S, S.Pd);
    });
    drawHall(ctx, S);
    if (S.doorOpen > 0.002) drawDoorOpen(ctx, S);
    camera(ctx, S.cam, 1, () => drawTableTop(ctx, S, true));
    ctx.restore();
  },

  // ───────── between people behind the table and people at it ─────────
  mid(ctx, F, o = {}) {
    const S = resolve(F, o);
    ctx.save();
    camera(ctx, S.cam, 1, () => drawTableTop(ctx, S, true));
    ctx.restore();
  },

  // ───────── everything in front of the characters ─────────
  front(ctx, F, o = {}) {
    const S = resolve(F, o), sp = S.sp;
    ctx.save();
    if (S.part !== 'air') {
      camera(ctx, S.cam, 1, () => {
        drawChair(ctx, S, SEAT.L, 1); drawChair(ctx, S, SEAT.R, -1);
        drawTableFront(ctx, S);
        drawLamp(ctx, S);
      });
    }
    if (S.part !== 'furniture') {
      camera(ctx, S.cam, 1, () => {
        drawSmoke(ctx, S);
        if (!S.dark) drawBeams(ctx, S, S.look === 'golden' ? 0.22 : 0.1);
        drawDust(ctx, S);
        drawLampAir(ctx, S);
        if (sp.winBloom) glow(ctx, WCX, WCY, sp.winBloom[2], sp.winBloom[0], sp.winBloom[1]);
        if (S.doorOpen > 0.002) { const g = doorGap(S); glow(ctx, lerp(DOOR.x1, 194, g.k), 430, 300, '#c6d3de', 0.13 * g.k); }
        if (S.hallGlow > 0.002) glow(ctx, 1810, 560, 240, '#ffc98a', 0.1 * S.hallGlow);
      });
    }
    ctx.restore();
  },
};
