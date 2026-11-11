// ═══════════════════════════════════════════════════════════════════════════════════════════
// THE REPLACEMENT — set module "school": three locations.  Read this header; you should not need
// the code below.
// Shots: a1_09_auditorium (auditorium) · a1_10_outside (steps) · a3_08_video (stage, inside the phone)
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
//   import { auditorium, stage, steps } from '../sets/school.js';
//   const o = { look: 'nightDark', cam, doorOpen: k };     // one options object for every call
//   set.back(ctx, F, o);                                   // everything behind the people
//   camera(ctx, cam, 1, () => { /* people standing BEHIND mid() things */ });
//   set.mid(ctx, F, o);                                    // stage: the lectern (hides the teacher's legs)
//   camera(ctx, cam, 1, () => { /* main characters, WORLD coordinates */ });
//   set.front(ctx, F, o);                                  // foreground furniture, haze, bloom, confetti
//
// o = { look, cam: {x,y,zoom,rot} (identity by default), t (seconds, ambient life only; default F.t), ...state }
// Each location supports exactly ONE look (any other look name falls back to it). State values are plain
// numbers and every one is optional.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// 1. auditorium — shot a1_09 — look 'nightDark'
//    The school hall after the concert, seen from the back of the room in one-point perspective
//    (vanishing point (1060, 300)). Ten rows of EMPTY folding chairs (centre aisle, side aisles) recede to a
//    small raised stage; over the proscenium a sagging hand-painted banner "ANNUAL SCHOOL CONCERT"; one bare
//    work light on a tripod (stage right of centre) throws long chair shadows back toward camera; a piano
//    under a dust sheet (stage left), a few choir chairs whose shadows loom on the back cloth; paper stars
//    and a dropped programme on the aisle floor. Back-left, in the LEFT WALL, a door with a wired-glass light.
//    Closed: a thread of corridor light under it. doorOpen swings the leaf inward and throws a long slab of
//    warm-grey corridor light across the floor, the side aisle and the chair backs, out to the centre aisle.
//    W 1920 (perspective room; everything outside the picture is painted to ±250 px of overscan).
//    floorY 532 = the floor under the doorway (perspective — see at()).
//    state   doorOpen  0..1  (default 0)  door leaf: 0 shut (light line under it), 1 open ~95°, full slab of light
//            work      0..1  (default 1)  the work light (bulb, its pools, the long shadows)
//            shadow    0..1  (default 0)  Adam's long shadow stretched down the light slab (set it to doorOpen
//                                         while he stands in anchors.door; it is drawn BY THE SET, on the floor)
//            splitZ    m     (default 6.7) chair rows nearer than this depth are drawn in front() (they hide the
//                                         legs of someone in the doorway); farther rows in back()
//    anchors (perspective: each carries {x, y, scale} — draw a character at (x,y) with s: scale, depth 1)
//            door      {x:133, y:532, scale:0.57}  Adam standing in the doorway (feet), facing RIGHT into the hall.
//                                                   He is ~245 px tall, black against the bright corridor.
//            doorStep  {x:208, y:556, scale:0.60}  one step inside the door (into the side aisle)
//            aisle     {x:1060, y:420, scale:0.40}  centre of the centre aisle, mid-hall (Z 9)
//            stage     {x:1060, y:330, scale:0.26}  centre of the stage floor (Z 15), for a far figure
//            bulb      {x:1192, y:240}             the work-light bulb (its brightest point)
//            banner    {x:1060, y:165}             centre of the banner lettering
//            corridor  {x:150, y:400}              middle of the bright door opening (doorOpen 1)
//    helper  auditorium.at(X, Z) → {x, y, scale} for any floor point (X metres right of the centre aisle,
//            Z metres from camera; door X -7, Z 6.0–7.2; chairs Z 4.3–12.0; stage front Z 13).
//    light   nightDark: key '#d8cfbe' (corridor) from -1 (behind him, screen left), amount 0.55 × doorOpen —
//            pass amount: 0.55 * doorOpen for Adam in the door.
//    framing master = identity; slow push to {x:1060, y:300, zoom:1.08} over the shot (on the empty stage).
//            The banner reads at zoom ≥ 1 (cap height ≈ 34 px at zoom 1). Close: stage {x:1060, y:240, zoom:2.2};
//            doorway {x:190, y:420, zoom:2.2}; aisle stars {x:1060, y:560, zoom:2.5}.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// 2. stage — shot a3_08 (the video inside the phone) — look 'warmDay'
//    The same stage on awards night, seen frontally from the audience: honey back cloth with paper stars,
//    swags of paper bunting (muted golds, creams, dusty peach — no red), a banner "STAR PUPIL AWARDS",
//    two warm beams from the top corners crossing on centre stage, a soft spot pool behind Maya, footlight
//    glow on the stage lip, a draped table of small gold trophies at right, a wooden lectern at left
//    (drawn in mid()), and along the bottom a row of audience heads as dark shapes with warm rims.
//    W 1920, floorY 640 (stage floor = feet line; the stage lip face is 640–712; heads sit 700–804+).
//    Painted from y -320 to 960 so a tall crop works.
//    state   clap      0..1  (default 0)  raised clapping hands in the audience (0 none; 1 eight pairs, clapping)
//            confetti  0..1  (default 0)  falling paper confetti + sparkle twinkles over the stage
//            spot      0..1  (default 1)  the centre spotlight pool behind Maya / V1
//    anchors maya      {x:960,  y:640}  Maya centre stage (feet), faces the audience/left as needed
//            v1        {x:1110, y:640}  V1 beside her, facing LEFT toward her
//            teacher   {x:585,  y:640}  the teacher behind the lectern (facing right); draw BEFORE mid()
//            lectern   {x:620,  y:478}  top of the lectern (sloped desk), for a hand / a card
//            enter     {x:1720, y:640}  off the right of the crop: where Maya walks on from
//            trophies  {x:1450, y:532}  top of the trophy table (props rest here)
//    light   warmDay: key '#ffe2b0' from 1, amount 0.75 (the beams come from both sides — fine either way)
//    CROP    the video is shown ~560 px wide inside the phone. Recommended crop rectangles of the world:
//              square    {x:480, y:40,  w:860, h:764}   lectern, Maya, V1, banner, heads  (aspect 1.13)
//              portrait  {x:650, y:4,   w:640, h:800}   Maya + V1 + banner + heads (4:5); pan left for the teacher
//            Render it with camera {x: cx, y: cy, zoom: 1} into a clipped region and scale, or use
//            zoom = 1920 / w on the picture. Everything in the crops is vector (sharp at any scale).
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// 3. steps — shot a1_10 — look 'blueHour'
//    The school's front steps at blue hour, side-on. Deep blue sky with the first stars and a cold horizon
//    glow; a far terrace street with two lit windows; the playground chain-link fence; a bare tree; a bike
//    rack; the school name board ("OAKFIELD PRIMARY SCHOOL"). From x 1150 the stone façade: four steps rise
//    to the right to a landing (top y 524) and tall double doors (x 1520–1800). One iron wall LAMP (x 1440,
//    y 190) beside the doors is the ONLY warm light: a pool on the wall behind Maya and on the top steps.
//    W 1920, floorY 700 (ground/pavement in front of the steps).
//    STEPS   riser 44 px (18 cm), tread 68 px. Step tops (the y feet stand on):
//              ground  y 700   x < 1030
//              step 1  y 656   x 1030–1098
//              step 2  y 612   x 1098–1166
//              step 3  y 568   x 1166–1234
//              landing y 524   x 1234 → (doors)
//    state   lamp      0..1  (default 1)  the wall lamp (0 = off: the whole frame goes cold)
//    anchors mayaSit   {x:1264, y:568}  Maya SITTING on the landing edge facing LEFT, feet on step 3:
//                                         drawFigure(ctx,'maya',{x:1264, y:568, ...POSE.sitSteps, seat:44, facing:-1})
//                                         → head ≈ (1210, 403), in the middle of the lamp pool
//            backpack  {x:1330, y:524}  her backpack on the landing beside her (base centre)
//            mayaStand {x:1200, y:568}  Maya standing up on step 3 (from mayaSit: rise + shift hips left 64)
//            mayaDown  [{x:1132,y:612}, {x:1064,y:656}, {x:990,y:700}]  foot-plants walking down steps 2, 1, ground
//            mayaExit  {x:-160, y:700}  off screen left (she walks past Adam, behind him)
//            adamKneel {x:975,  y:700}  Adam kneeling on one knee facing RIGHT, rear knee on the ground, front
//                                         foot on step 1: {x:975, y:700, ...POSE.kneelOne, footF:[0.205,-0.1023]}
//                                         → head ≈ (1035, 404): level with Maya's. His reach (armF ≈[80,10])
//                                         ends ≈ 70 px short of her shoulder — the hand reaches TOWARD her.
//            adamEnter {x:-180, y:700}  off screen left (he walks in along y 700)
//            adamStop  {x:860,  y:700}  where he slows before kneeling
//            lamp      {x:1440, y:190}  the lamp's glass
//    light   blueHour: key '#ffb561' from 1 (the lamp is to their right), amount 0.75 at Maya.
//            steps.lightAt('blueHour', x, o) → rim for any x (≈0.42 at Adam's kneel; cold sky rim far left).
//    framing master {x:1030, y:402, zoom:1} → slow push to {x:1110, y:420, zoom:1.08}.
//            two-shot {x:1120, y:430, zoom:1.85}; Maya CU {x:1215, y:410, zoom:2.8}; Adam CU {x:1035, y:410,
//            zoom:2.8}; the empty steps after she has gone {x:1100, y:430, zoom:1.4}.
//
// Depths used (for parallax): sky 0.1, stars 0.12, far street 0.4, fence 0.55, tree 0.7, sign / bike rack
// 0.9–0.95, subject plane 1, foreground post 1.35. Auditorium and stage are drawn at depth 1 (the
// auditorium's depth is in its perspective), with haze at 1.12.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import {
  PW, PH, TAU, clamp, lerp, hash, rng, noise1, wobble, rgba, mixHex, rr, linGrad, radGrad,
  glow, fog, camera, cached, FONT,
} from '../engine.js';
import { LOOK } from '../style.js';

// ───────────────────────────── shared helpers ─────────────────────────────
const poly = (ctx, pts) => {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
};
const fillPoly = (ctx, pts, fill) => { poly(ctx, pts); ctx.fillStyle = fill; ctx.fill(); };
const line = (ctx, a, b, w, col) => {
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
  ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke();
};
const starPath = (ctx, x, y, r, rot = 0, sy = 1, inner = 0.45) => {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5, rr2 = i % 2 ? r * inner : r;
    const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2 * sy;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
};
const inPoly = (p, pts) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const tOf = (F, o) => o.t ?? (F ? F.t : 0);

/** Letters painted along a curve: yAt(x) gives the baseline, letters rotate with the slope. */
function curvedText(ctx, str, cx, yAt, o) {
  const { size, family, weight = 700, color, tracking = 0, jitter = 0, seed = 1 } = o;
  ctx.save();
  ctx.font = `${weight} ${size}px ${family}`;
  try { ctx.letterSpacing = '0px'; } catch (e) { /* */ }
  const ws = [...str].map((ch) => ctx.measureText(ch).width + tracking);
  const total = ws.reduce((a, b) => a + b, 0) - tracking;
  let x = cx - total / 2;
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  [...str].forEach((ch, i) => {
    const mx = x + (ws[i] - tracking) / 2;
    const y = yAt(mx), slope = (yAt(mx + 4) - yAt(mx - 4)) / 8;
    const r = rng(seed * 97 + i);
    ctx.save();
    ctx.translate(mx, y + (r() - 0.5) * jitter * size * 0.12);
    ctx.rotate(Math.atan(slope) + (r() - 0.5) * jitter * 0.09);
    const sc = 1 + (r() - 0.5) * jitter * 0.1;
    ctx.scale(sc, sc);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    x += ws[i];
  });
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// 1. AUDITORIUM
// ═══════════════════════════════════════════════════════════════════════════════════════════
const AU = { VPX: 1060, HOR: 300, EYE: 1.7, F: 900, WL: -7, WR: 7.2, CEIL: 6.6, STZ: 13, STY: 0.85, BACKZ: 17, PRX: 5, PRY: 5.0 };
const pj = (X, Y, Z) => [AU.VPX + (X * AU.F) / Z, AU.HOR + ((AU.EYE - Y) * AU.F) / Z];
const sOf = (Z) => AU.F / Z;
const ADOOR = { z0: 6.0, z1: 7.2, h: 2.1 };
const WORK = { X: 2.2, Y: 2.75, Z: 15.2 };
const DLIGHT = { X: -10.5, Y: 2.9, Z: 5.4 };   // the corridor light source, behind the door
const CORR = '#d8cfbe';                         // warm-grey corridor light
const BULB = '#eef0f2';
const AUP = {
  wall: '#0a111d', wallFar: '#0d1524', ceil: '#05080e', floor: '#090e17', floorLit: '#4a5468',
  cloth: '#161e2d', clothLit: '#6d7890', velvet: '#0c1220', velvetHi: '#26324a', prosc: '#0b1220',
  chair: '#04060b', chairRim: '#8c97ab', sheet: '#5d6573', sheetLit: '#b9c0cb', stageFace: '#070b13',
  bannerCloth: '#8a8578', bannerLit: '#c9c2b0', paint: '#18202f',
};

// chairs: rows (Z) × seats (X), with a little post-concert disorder
const ROWS = Array.from({ length: 10 }, (_, i) => 4.3 + i * 0.86);
const SEATS_X = [];
for (let i = 0; i < 9; i++) { SEATS_X.push(-1.05 - i * 0.55); SEATS_X.push(1.05 + i * 0.55); }
const CHAIRS = [];
ROWS.forEach((Z, ri) => SEATS_X.forEach((X, ci) => {
  const h = hash(ri * 131 + ci * 7 + 3), h2 = hash(ri * 17 + ci * 53 + 9);
  if (h > 0.965) return;                                     // a gap where a chair was taken away
  CHAIRS.push({ X: X + (h2 - 0.5) * 0.12, Z: Z + (h - 0.5) * 0.16, rot: (hash(ri * 7 + ci * 311) - 0.5) * (h2 > 0.82 ? 0.9 : 0.22) });
}));
CHAIRS.sort((a, b) => b.Z - a.Z);
const STAGE_CHAIRS = [{ X: -1.2, Z: 16.2, rot: 0.1 }, { X: -0.55, Z: 16.25, rot: -0.05 }, { X: 0.1, Z: 16.2, rot: 0.08 }, { X: 0.9, Z: 16.0, rot: 0.35 }];
// paper stars [X, Z, size(m), rot] and the programme
const FLOOR_STARS = [[-0.3, 5.5, 0.16, 0.4], [0.42, 6.9, 0.13, 1.4], [0.05, 8.3, 0.12, 2.2], [-0.45, 9.6, 0.11, 0.9],
  [0.3, 10.9, 0.1, 2.9], [2.45, 7.35, 0.12, 0.2], [-3.6, 6.2, 0.13, 1.1], [-6.2, 7.9, 0.13, 2.6], [1.6, 14.1, 0.14, 0.5], [-1.9, 14.6, 0.12, 1.9]];
const PROG = { X: 0.22, Z: 6.1, w: 0.21, d: 0.3, rot: 0.55 };

function auState(F, o) {
  const t = tOf(F, o);
  const work = clamp(o.work ?? 1) * (1 + 0.025 * wobble(t, 9, 3) + 0.012 * wobble(t, 31, 8));
  const door = clamp(o.doorOpen ?? 0);
  const ang = door * 1.66;                                   // ~95°
  const gap = clamp(Math.sin(Math.min(ang, Math.PI / 2)) * 1.08);
  return { t, work, door, ang, gap, shadow: clamp(o.shadow ?? 0), splitZ: o.splitZ ?? 6.7, cam: o.cam };
}

/** the floor polygon (XZ) lit through the door; null when shut */
function slabXZ(S) {
  if (S.gap < 0.005) return null;
  const za = ADOOR.z0, zb = ADOOR.z0 + (ADOOR.z1 - ADOOR.z0) * S.gap;
  const k = DLIGHT.Y / (DLIGHT.Y - ADOOR.h);
  const tip = (z) => [DLIGHT.X + (AU.WL - DLIGHT.X) * k, DLIGHT.Z + (z - DLIGHT.Z) * k];
  return [[AU.WL, za], tip(za), tip(zb), [AU.WL, zb]];
}
const shadowTip = (L, X, Y, Z, floorY = 0) => {
  let k = (L.Y - floorY) / (L.Y - Y);
  if (Z < L.Z) k = Math.min(k, (L.Z - 1.4) / (L.Z - Z));      // never past the camera
  return [L.X + (X - L.X) * k, L.Z + (Z - L.Z) * k];
};
const pf = (p, Y = 0) => pj(p[0], Y, p[1]);  // project an XZ floor point

function chairPts(c) {
  const ca = Math.cos(c.rot), sa = Math.sin(c.rot), cz = 0.2;
  const P = (x, z, Y) => { const zz = z - cz; return pj(c.X + x * ca - zz * sa, Y, c.Z + cz + x * sa + zz * ca); };
  const W = (x, z) => [c.X + x * ca - (z - cz) * sa, c.Z + cz + x * sa + (z - cz) * ca];
  return { P, W };
}

const addQuad = (ctx, q) => { ctx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]); ctx.closePath(); };
const addSeg = (ctx, a, b) => { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); };

/** Draw a set of chairs (sorted far → near), batched per row: one fill, one leg stroke, one rim stroke. */
function drawChairs(ctx, list, S, slab, slabK) {
  const col = AUP.chair;
  ctx.lineCap = 'round';
  let i = 0;
  while (i < list.length) {
    const row = Math.round((list[i].Z - 4.3) / 0.86);
    let j = i;
    while (j < list.length && Math.round((list[j].Z - 4.3) / 0.86) === row) j++;
    const group = list.slice(i, j); i = j;
    const s = sOf(group[0].Z), lw = Math.max(1, 0.024 * s);
    const parts = group.map((c) => {
      const { P, W } = chairPts(c);
      return { c, P, W, back: [P(-0.215, 0, 0.53), P(0.215, 0, 0.53), P(0.215, 0, 0.87), P(-0.215, 0, 0.87)], seat: [P(-0.21, 0.02, 0.45), P(0.21, 0.02, 0.45), P(0.21, 0.42, 0.45), P(-0.21, 0.42, 0.45)] };
    });
    ctx.beginPath();
    for (const q of parts) { addSeg(ctx, q.P(-0.19, 0.4, 0), q.P(-0.19, 0.4, 0.45)); addSeg(ctx, q.P(0.19, 0.4, 0), q.P(0.19, 0.4, 0.45)); addSeg(ctx, q.P(-0.2, 0, 0), q.P(-0.2, 0, 0.86)); addSeg(ctx, q.P(0.2, 0, 0), q.P(0.2, 0, 0.86)); }
    ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke();
    ctx.beginPath();
    for (const q of parts) { addQuad(ctx, q.seat); addQuad(ctx, q.back); }
    ctx.fillStyle = col; ctx.fill();
    // rim from the work light ahead of them (top edge of the backrest)
    const dist = clamp(1 - (WORK.Z - group[0].Z) / 11);
    const rimA = S.work * (0.05 + 0.3 * dist * dist);
    if (rimA > 0.01) {
      ctx.beginPath(); for (const q of parts) addSeg(ctx, q.back[3], q.back[2]);
      ctx.lineWidth = Math.max(0.8, lw * 0.6); ctx.strokeStyle = rgba(AUP.chairRim, rimA); ctx.stroke();
    }
    // corridor light on the left faces / top when inside the slab
    if (slab) {
      for (const q of parts) {
        const base = q.W(0, 0);
        if (!(inPoly(base, slab) || inPoly(q.W(0, 0.4), slab))) continue;
        const a = slabK(base) * 0.85;
        if (a <= 0.01) continue;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        line(ctx, q.back[3], q.back[2], Math.max(1, lw * 0.7), rgba(CORR, a * 0.5));
        line(ctx, q.P(-0.2, 0, 0.05), q.P(-0.2, 0, 0.86), Math.max(0.8, lw * 0.5), rgba(CORR, a * 0.4));
        fillPoly(ctx, q.back, rgba(CORR, a * 0.06));
        fillPoly(ctx, q.seat, rgba(CORR, a * 0.1));
        ctx.restore();
      }
    }
  }
}

/** Floor shadows of many chairs from point light L, as one path (overlaps do not double up). */
function chairShadows(ctx, list, L, alpha) {
  ctx.beginPath();
  for (const c of list) {
    const { W } = chairPts(c);
    const a = W(-0.2, 0), b = W(0.2, 0);
    const sa = shadowTip(L, a[0], 0.87, a[1]), sb = shadowTip(L, b[0], 0.87, b[1]);
    const fa = W(-0.21, 0.42), fb = W(0.21, 0.42);
    const ssa = shadowTip(L, fa[0], 0.45, fa[1]), ssb = shadowTip(L, fb[0], 0.45, fb[1]);
    addQuad(ctx, [pf(a), pf(b), pf(sb), pf(sa)]);
    addQuad(ctx, [pf(fa), pf(fb), pf(ssb), pf(ssa)]);
  }
  ctx.fillStyle = `rgba(2,4,8,${alpha})`; ctx.fill('nonzero');
}

function auRoom(ctx, S) {
  const { WL, WR, CEIL, STZ } = AU;
  ctx.fillStyle = AUP.ceil; ctx.fillRect(-400, -400, PW + 800, PH + 800);
  // floor
  const fl = [pj(WL, 0, 2.2), pj(WR, 0, 2.2), pj(WR, 0, STZ), pj(WL, 0, STZ)];
  ctx.fillStyle = linGrad(ctx, 0, pj(0, 0, STZ)[1], 0, PH + 200, [[0, '#0c121d'], [1, AUP.floor]]);
  poly(ctx, fl); ctx.fill();
  // boards (receding to the vanishing point) + a few cross joints
  ctx.save(); poly(ctx, fl); ctx.clip();
  for (let X = WL; X <= WR; X += 0.42) line(ctx, pj(X, 0, 2.2), pj(X, 0, STZ), 1, 'rgba(0,0,0,0.35)');
  for (let Z = 3; Z < STZ; Z += 1.25) line(ctx, pj(WL, 0, Z), pj(WR, 0, Z), 1, 'rgba(0,0,0,0.22)');
  ctx.restore();
  // ceiling slab and the side walls
  fillPoly(ctx, [pj(WL, CEIL, 2.2), pj(WR, CEIL, 2.2), pj(WR, CEIL, STZ), pj(WL, CEIL, STZ)], '#06090f');
  const lw = [pj(WL, 0, 2.2), pj(WL, 0, STZ), pj(WL, CEIL, STZ), pj(WL, CEIL, 2.2)];
  fillPoly(ctx, lw, linGrad(ctx, pj(WL, 0, 3)[0], 0, pj(WL, 0, STZ)[0], 0, [[0, '#070c15'], [1, AUP.wall]]));
  const rw = [pj(WR, 0, 2.2), pj(WR, 0, STZ), pj(WR, CEIL, STZ), pj(WR, CEIL, 2.2)];
  fillPoly(ctx, rw, linGrad(ctx, pj(WR, 0, STZ)[0], 0, PW + 200, 0, [[0, '#121b2b'], [1, '#070c15']]));
  // dado rail + skirting on both walls
  for (const X of [WL, WR]) {
    line(ctx, pj(X, 1.1, 2.2), pj(X, 1.1, STZ), 2, 'rgba(70,86,112,0.25)');
    fillPoly(ctx, [pj(X, 0, 2.2), pj(X, 0, STZ), pj(X, 0.14, STZ), pj(X, 0.14, 2.2)], '#05080d');
  }
  // tall night windows high in both walls (dim blue, a cold sliver of sky)
  for (const [X, z0, z1] of [[WL, 8.4, 9.6], [WL, 10.6, 11.8], [WR, 8.0, 9.2], [WR, 10.4, 11.6]]) {
    const q = [pj(X, 2.7, z0), pj(X, 2.7, z1), pj(X, 5.3, z1), pj(X, 5.3, z0)];
    fillPoly(ctx, q, '#0f1a2e');
    const inner = [pj(X, 2.8, z0 + 0.06), pj(X, 2.8, z1 - 0.06), pj(X, 5.2, z1 - 0.06), pj(X, 5.2, z0 + 0.06)];
    fillPoly(ctx, inner, linGrad(ctx, 0, inner[2][1], 0, inner[0][1], [[0, '#1b2b4a'], [1, '#2a3e63']]));
    const zm = (z0 + z1) / 2;
    line(ctx, pj(X, 2.8, zm), pj(X, 5.2, zm), Math.max(1.5, sOf(zm) * 0.05), '#0a1220');
    for (const Y of [3.6, 4.4]) line(ctx, pj(X, Y, z0 + 0.06), pj(X, Y, z1 - 0.06), Math.max(1.5, sOf(zm) * 0.04), '#0a1220');
  }
  // radiators under the windows on the left wall
  for (const [z0, z1] of [[8.5, 9.5], [10.7, 11.7]]) {
    fillPoly(ctx, [pj(WL, 0.2, z0), pj(WL, 0.2, z1), pj(WL, 0.8, z1), pj(WL, 0.8, z0)], '#0c1320');
    for (let z = z0 + 0.08; z < z1; z += 0.11) line(ctx, pj(WL, 0.24, z), pj(WL, 0.76, z), 1, 'rgba(0,0,0,0.5)');
  }
  // a dark notice board on the left wall near the door
  fillPoly(ctx, [pj(WL, 1.3, 4.0), pj(WL, 1.3, 5.3), pj(WL, 2.2, 5.3), pj(WL, 2.2, 4.0)], '#0d1522');
  for (let i = 0; i < 6; i++) {
    const z = 4.1 + hash(i + 40) * 1.0, y = 1.4 + hash(i + 50) * 0.6;
    fillPoly(ctx, [pj(WL, y, z), pj(WL, y, z + 0.17), pj(WL, y + 0.22, z + 0.17), pj(WL, y + 0.22, z)], rgba('#55627a', 0.35));
  }
  // dead pendant lights hanging from the ceiling
  for (const [X, Z] of [[-3.5, 6], [3.5, 6], [-3.5, 10], [3.5, 10]]) {
    const top = pj(X, CEIL, Z), b = pj(X, 4.9, Z), s = sOf(Z);
    line(ctx, top, b, 1, '#03050a');
    ctx.fillStyle = '#04070c'; ctx.beginPath(); ctx.ellipse(b[0], b[1] + s * 0.08, s * 0.32, s * 0.11, 0, Math.PI, TAU); ctx.fill();
  }
}

function auDoor(ctx, S) {
  const { WL } = AU, { z0, z1, h } = ADOOR;
  const P = (Y, Z) => pj(WL, Y, Z);
  // architrave
  fillPoly(ctx, [P(0, z0 - 0.12), P(0, z1 + 0.12), P(h + 0.14, z1 + 0.12), P(h + 0.14, z0 - 0.12)], '#111a29');
  const hole = [P(0, z0), P(0, z1), P(h, z1), P(h, z0)];
  // the corridor beyond: bright warm grey, a far wall, a ceiling tube, a noticeboard
  const k = S.gap;
  fillPoly(ctx, hole, '#020407');
  if (k > 0.002) {
    ctx.save(); poly(ctx, hole); ctx.clip();
    const [x0, y0] = P(h, z0), [x1, y1] = P(0, z1);
    ctx.fillStyle = linGrad(ctx, 0, Math.min(y0, P(h, z1)[1]), 0, Math.max(y1, P(0, z0)[1]), [[0, mixHex('#8d877b', CORR, 0.4)], [0.35, CORR], [0.75, '#c2b9a8'], [1, '#8f887c']]);
    ctx.fillRect(Math.min(x0, x1) - 10, Math.min(y0, y1) - 40, Math.abs(x1 - x0) + 40, 400);
    // far corridor wall stripe (dado), a noticeboard, door frame opposite
    const cy0 = P(1.0, z1)[1];
    ctx.fillStyle = 'rgba(120,112,98,0.35)'; ctx.fillRect(Math.min(x0, x1) - 10, cy0, 300, 3);
    ctx.fillStyle = 'rgba(90,84,74,0.35)'; ctx.fillRect(P(0, z0 + 0.5)[0], P(1.75, z0 + 0.5)[1], 26, 30);
    glow(ctx, P(2.0, (z0 + z1) / 2)[0], P(2.0, z0)[1], 90, '#fff8ea', 0.25);
    ctx.restore();
  }
  // the leaf (hinged at the far jamb z1, swinging into the hall)
  const ang = S.ang, Wd = z1 - z0;
  const fx = WL + Math.sin(ang) * Wd, fz = z1 - Math.cos(ang) * Wd;
  const leaf = [pj(WL, 0, z1), pj(fx, 0, fz), pj(fx, h, fz), pj(WL, h, z1)];
  const lit = 0.05 + 0.1 * k * clamp(Math.sin(ang));
  fillPoly(ctx, leaf, mixHex('#0d1422', '#4a4842', lit));
  // its small wired-glass window
  const gl = (u, v) => { const X = lerp(WL, fx, u), Z = lerp(z1, fz, u); return pj(X, v, Z); };
  const win = [gl(0.3, 1.3), gl(0.72, 1.3), gl(0.72, 1.85), gl(0.3, 1.85)];
  fillPoly(ctx, win, k > 0.6 ? 'rgba(40,40,40,0.9)' : mixHex('#6d685f', CORR, 0.45 * (1 - k)));
  if (k < 0.6) glow(ctx, (win[0][0] + win[2][0]) / 2, (win[0][1] + win[2][1]) / 2, 40, CORR, 0.12 * (1 - k));
  // push plate / handle
  const hp = gl(0.86, 1.0); ctx.fillStyle = 'rgba(150,150,150,0.35)'; ctx.fillRect(hp[0] - 2, hp[1] - 8, 4, 16);
  // light line under a shut (or barely open) door
  if (k < 0.3) {
    const a = 1 - k / 0.3, u0 = P(0, z0), u1 = P(0, z1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    line(ctx, u0, u1, 2, rgba(CORR, 0.55 * a));
    glow(ctx, (u0[0] + u1[0]) / 2 + 12, (u0[1] + u1[1]) / 2 + 4, 70, CORR, 0.18 * a, 0.25);
    ctx.restore();
  }
}

function auStage(ctx, S) {
  const { STZ, STY, BACKZ, PRX, PRY, WL, WR, CEIL } = AU;
  const w = S.work;
  // back cloth
  const bc = [pj(-PRX, STY, BACKZ), pj(PRX, STY, BACKZ), pj(PRX, PRY + 0.5, BACKZ), pj(-PRX, PRY + 0.5, BACKZ)];
  fillPoly(ctx, bc, AUP.cloth);
  const wl = pj(WORK.X, WORK.Y, BACKZ);
  ctx.save(); poly(ctx, bc); ctx.clip();
  glow(ctx, wl[0] - 10, wl[1] + 15, 260, AUP.clothLit, 0.55 * w, 0.8);
  // folds in the cloth
  for (let X = -PRX; X < PRX; X += 0.38) {
    const a = pj(X, STY, BACKZ), b = pj(X, PRY + 0.5, BACKZ);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(a[0], b[1], 5, a[1] - b[1]);
  }
  // the choir chairs' long shadows thrown up the back cloth
  ctx.fillStyle = `rgba(3,5,9,${0.7 * w})`;
  for (const c of STAGE_CHAIRS) {
    const { W } = chairPts(c);
    const proj = (x, z, Y) => {
      const p = W(x, z), k = (BACKZ - WORK.Z) / (p[1] - WORK.Z);
      return pj(WORK.X + (p[0] - WORK.X) * k, WORK.Y + (Y + STY - WORK.Y) * k, BACKZ);
    };
    poly(ctx, [proj(-0.215, 0, 0.53), proj(0.215, 0, 0.53), proj(0.215, 0, 0.87), proj(-0.215, 0, 0.87)]); ctx.fill();
    for (const x of [-0.2, 0.2]) { const a = proj(x, 0, 0.02), b = proj(x, 0, 0.87); line(ctx, a, b, 4, `rgba(3,5,9,${0.7 * w})`); }
    poly(ctx, [proj(-0.21, 0.05, 0.45), proj(0.21, 0.05, 0.45), proj(0.21, 0.42, 0.45), proj(-0.21, 0.42, 0.45)]); ctx.fill();
  }
  ctx.restore();
  // stage floor
  const sf = [pj(-PRX - 0.6, STY, STZ), pj(PRX + 0.6, STY, STZ), pj(PRX, STY, BACKZ), pj(-PRX, STY, BACKZ)];
  fillPoly(ctx, sf, '#0b111b');
  ctx.save(); poly(ctx, sf); ctx.clip();
  const base = pj(WORK.X, STY, WORK.Z);
  glow(ctx, base[0], base[1], 300, '#8a94a6', 0.5 * w, 0.22);
  for (let X = -PRX; X <= PRX; X += 0.5) line(ctx, pj(X, STY, STZ), pj(X, STY, BACKZ), 1, 'rgba(0,0,0,0.3)');
  // piano's shadow on the stage floor (toward stage left / back)
  ctx.fillStyle = `rgba(2,4,8,${0.75 * w})`;
  poly(ctx, [pj(-2.25, STY, 15.25), pj(-3.55, STY, 15.25), pj(-7, STY, 16.3), pj(-6, STY, 17.2), pj(-2.25, STY, 15.85)]); ctx.fill();
  // tripod legs' thin shadows
  for (const [dx, dz] of [[-0.42, -0.25], [0.42, -0.25], [0, 0.42]]) {
    const f = [WORK.X + dx, WORK.Z + dz], tip = [WORK.X + dx * 3.2, WORK.Z + dz * 3.2];
    line(ctx, pj(f[0], STY, f[1]), pj(tip[0], STY, tip[1]), 1.5, `rgba(2,4,8,${0.6 * w})`);
  }
  // choir chairs' floor shadows (toward the back)
  for (const c of STAGE_CHAIRS) {
    const { W } = chairPts(c); const p = W(0, 0);
    const tipp = [WORK.X + (p[0] - WORK.X) * 1.8, WORK.Z + (p[1] - WORK.Z) * 1.8];
    poly(ctx, [pj(p[0] - 0.2, STY, p[1]), pj(p[0] + 0.2, STY, p[1]), pj(tipp[0] + 0.3, STY, Math.min(tipp[1], BACKZ)), pj(tipp[0] - 0.3, STY, Math.min(tipp[1], BACKZ))]);
    ctx.fill();
  }
  ctx.restore();
  // choir chairs
  for (const c of STAGE_CHAIRS) {
    const { P } = chairPts(c); const s = sOf(c.Z); const lw = Math.max(1, 0.024 * s);
    const Y = (y) => y + STY;
    for (const x of [-0.19, 0.19]) line(ctx, P(x, 0.4, Y(0)), P(x, 0.4, Y(0.45)), lw, '#03050a');
    fillPoly(ctx, [P(-0.21, 0.02, Y(0.45)), P(0.21, 0.02, Y(0.45)), P(0.21, 0.42, Y(0.45)), P(-0.21, 0.42, Y(0.45))], '#03050a');
    for (const x of [-0.2, 0.2]) line(ctx, P(x, 0, Y(0)), P(x, 0, Y(0.86)), lw, '#03050a');
    const back = [P(-0.215, 0, Y(0.53)), P(0.215, 0, Y(0.53)), P(0.215, 0, Y(0.87)), P(-0.215, 0, Y(0.87))];
    fillPoly(ctx, back, '#03050a');
    // lit from the bulb (camera side faces the light partly)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    line(ctx, back[3], back[2], 1.2, rgba('#9aa4b6', 0.4 * w));
    if (c.X > 0.5) line(ctx, back[0], back[3], 1.2, rgba('#9aa4b6', 0.35 * w));
    ctx.restore();
  }
  // a music stand
  { const a = pj(-0.9, STY, 14.6), b = pj(-0.9, STY + 1.15, 14.6); line(ctx, a, b, 1.6, '#03050a');
    fillPoly(ctx, [pj(-1.15, STY + 1.05, 14.6), pj(-0.65, STY + 1.05, 14.6), pj(-0.62, STY + 1.38, 14.65), pj(-1.18, STY + 1.38, 14.65)], '#03050a');
    for (const dx of [-0.2, 0.2]) line(ctx, pj(-0.9, STY + 0.25, 14.6), pj(-0.9 + dx, STY, 14.6 + 0.1), 1.2, '#03050a'); }
  // piano under a dust sheet
  auPiano(ctx, S);
  // the work light on its tripod
  auWorkLight(ctx, S);
  // side curtains (house tabs, gathered) + pelmet
  for (const side of [-1, 1]) {
    const xa = side * PRX, xb = side * (PRX - 0.95);
    const q = [pj(xa, STY, STZ + 0.25), pj(xb, STY, STZ + 0.25), pj(xb + side * 0.15, PRY, STZ + 0.25), pj(xa, PRY, STZ + 0.25)];
    fillPoly(ctx, q, AUP.velvet);
    ctx.save(); poly(ctx, q); ctx.clip();
    for (let i = 0; i < 7; i++) {
      const X = lerp(xa, xb, (i + 0.5) / 7), a = pj(X, STY, STZ + 0.25), b = pj(X, PRY, STZ + 0.25);
      const lit = side > 0 ? 0.55 : 0.3;
      ctx.fillStyle = linGrad(ctx, a[0] - 6, 0, a[0] + 6, 0, [[0, 'rgba(0,0,0,0)'], [0.5, rgba(AUP.velvetHi, lit * w)], [1, 'rgba(0,0,0,0)']]);
      ctx.fillRect(a[0] - 6, b[1], 12, a[1] - b[1]);
    }
    ctx.restore();
  }
  // proscenium wall with the opening cut out
  ctx.beginPath();
  const outer = [pj(WL, STY, STZ), pj(WR, STY, STZ), pj(WR, CEIL, STZ), pj(WL, CEIL, STZ)];
  const open = [pj(-PRX, STY, STZ), pj(-PRX, PRY, STZ), pj(PRX, PRY, STZ), pj(PRX, STY, STZ)];
  for (const pts of [outer, open]) { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
  ctx.fillStyle = linGrad(ctx, 0, outer[2][1], 0, outer[0][1], [[0, '#070b13'], [1, AUP.prosc]]);
  ctx.fill('evenodd');
  // moulded arch edge, catching a little of the bulb
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  line(ctx, open[0], open[1], 2, rgba('#55627a', 0.25 * w)); line(ctx, open[2], open[3], 2, rgba('#7c879b', 0.45 * w));
  ctx.restore();
  // pelmet (short scalloped valance)
  const pl = pj(-PRX, PRY, STZ + 0.1), pr = pj(PRX, PRY, STZ + 0.1), ph = sOf(STZ) * 0.42;
  ctx.fillStyle = AUP.velvet; ctx.beginPath(); ctx.moveTo(pl[0], pl[1] - 2);
  ctx.lineTo(pr[0], pr[1] - 2); ctx.lineTo(pr[0], pr[1] + ph);
  const nS = 9; for (let i = nS; i > 0; i--) { const xA = lerp(pl[0], pr[0], i / nS), xB = lerp(pl[0], pr[0], (i - 1) / nS); ctx.quadraticCurveTo((xA + xB) / 2, pl[1] + ph * 1.35, xB, pl[1] + ph); }
  ctx.closePath(); ctx.fill();
  // stage front face (+ the little steps at stage left)
  const ff = [pj(-PRX - 0.6, 0, STZ), pj(PRX + 0.6, 0, STZ), pj(PRX + 0.6, STY, STZ), pj(-PRX - 0.6, STY, STZ)];
  fillPoly(ctx, ff, AUP.stageFace);
  for (let X = -PRX; X <= PRX + 0.1; X += 1.2) line(ctx, pj(X, 0.05, STZ), pj(X, STY - 0.05, STZ), 1, 'rgba(40,52,72,0.35)');
  line(ctx, ff[3], ff[2], 1.5, rgba('#7c879b', 0.3 * w));
  for (let i = 0; i < 3; i++) {
    const y0 = (STY / 3) * i, y1 = (STY / 3) * (i + 1), z = STZ - 0.9 + i * 0.3;
    fillPoly(ctx, [pj(-PRX - 1.6, y1, z), pj(-PRX - 0.6, y1, z), pj(-PRX - 0.6, y1, STZ), pj(-PRX - 1.6, y1, STZ)], '#0e1522');
    fillPoly(ctx, [pj(-PRX - 1.6, y0, z), pj(-PRX - 0.6, y0, z), pj(-PRX - 0.6, y1, z), pj(-PRX - 1.6, y1, z)], '#060a12');
  }
}

function auPiano(ctx, S) {
  const { STY } = AU, w = S.work, Z = 15.2;
  const x0 = -3.6, x1 = -2.2, top = STY + 1.32;
  const s = sOf(Z);
  const a = pj(x0, STY, Z), b = pj(x1, STY, Z), c = pj(x1, top, Z), d = pj(x0, top, Z);
  // dust sheet over an upright piano: square shoulders, a ledge at keyboard height, hem pooled on the floor
  const kb = pj(x0, STY + 0.74, Z)[1];
  ctx.beginPath();
  ctx.moveTo(a[0] - s * 0.16, a[1] + 1);
  ctx.quadraticCurveTo(a[0] - s * 0.05, a[1] - s * 0.1, a[0] - s * 0.06, kb + s * 0.05);
  ctx.lineTo(a[0] - s * 0.07, kb - s * 0.02);
  ctx.lineTo(d[0] - s * 0.01, kb - s * 0.06);
  ctx.lineTo(d[0], d[1] + s * 0.06);
  ctx.quadraticCurveTo(d[0], d[1], d[0] + s * 0.06, d[1]);
  ctx.quadraticCurveTo((d[0] + c[0]) / 2, d[1] + s * 0.03, c[0] - s * 0.06, c[1]);
  ctx.quadraticCurveTo(c[0], c[1], c[0], c[1] + s * 0.06);
  ctx.lineTo(c[0] + s * 0.01, kb - s * 0.06);
  ctx.lineTo(b[0] + s * 0.07, kb - s * 0.02);
  ctx.lineTo(b[0] + s * 0.06, kb + s * 0.05);
  ctx.quadraticCurveTo(b[0] + s * 0.05, b[1] - s * 0.1, b[0] + s * 0.18, b[1] + 1);
  ctx.closePath();
  ctx.fillStyle = linGrad(ctx, a[0], 0, b[0] + s * 0.16, 0, [[0, mixHex('#1a1f29', AUP.sheet, 0.25)], [0.7, mixHex(AUP.sheet, AUP.sheetLit, 0.15 * w)], [1, mixHex(AUP.sheet, AUP.sheetLit, 0.7 * w)]]);
  ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = linGrad(ctx, 0, kb - s * 0.06, 0, kb + s * 0.14, [[0, 'rgba(255,255,255,0.08)'], [0.3, 'rgba(0,0,0,0.3)'], [1, 'rgba(0,0,0,0)']]);
  ctx.fillRect(a[0] - s * 0.2, kb - s * 0.06, b[0] - a[0] + s * 0.4, s * 0.2);
  ctx.restore();
  // folds
  ctx.save(); ctx.clip();
  for (let i = 0; i < 6; i++) {
    const u = 0.1 + i * 0.16 + hash(i + 70) * 0.05, x = lerp(a[0], b[0], u);
    ctx.fillStyle = linGrad(ctx, x - 7, 0, x + 7, 0, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(0,0,0,0.28)'], [1, 'rgba(0,0,0,0)']]);
    ctx.beginPath(); ctx.moveTo(x - 6, a[1]); ctx.quadraticCurveTo(x + 4, (a[1] + d[1]) / 2, x - 2 + hash(i) * 8, d[1] + s * 0.1); ctx.lineTo(x + 6, d[1] + s * 0.1); ctx.quadraticCurveTo(x + 10, (a[1] + d[1]) / 2, x + 6, a[1]); ctx.fill();
  }
  ctx.restore();
  // a candle-shaped lump (a lamp on the piano under the sheet) and the top highlight
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  line(ctx, [d[0] + s * 0.25, d[1] - s * 0.01], [c[0] - s * 0.2, c[1] - s * 0.02], 1.4, rgba(AUP.sheetLit, 0.35 * w));
  ctx.restore();
}

function auWorkLight(ctx, S) {
  const { STY } = AU, w = S.work;
  const top = pj(WORK.X, WORK.Y - 0.12, WORK.Z);
  for (const [dx, dz] of [[-0.42, -0.25], [0.42, -0.25], [0, 0.42]]) line(ctx, pj(WORK.X + dx, STY, WORK.Z + dz), pj(WORK.X, STY + 0.75, WORK.Z), 1.6, '#04060a');
  line(ctx, pj(WORK.X, STY + 0.75, WORK.Z), top, 2.2, '#04060a');
  // cable snaking off to stage left
  ctx.beginPath(); const c0 = pj(WORK.X, STY, WORK.Z);
  ctx.moveTo(c0[0], c0[1]); const c1 = pj(0.6, STY, 14.1), c2 = pj(-1.6, STY, 14.8), c3 = pj(-4.6, STY, 13.6);
  ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], c3[0], c3[1]);
  ctx.lineWidth = 1.2; ctx.strokeStyle = '#02040a'; ctx.stroke();
  // lamp head: a cage around a bare bulb, tilted toward the hall
  const b = pj(WORK.X, WORK.Y, WORK.Z), s = sOf(WORK.Z);
  ctx.save(); ctx.translate(b[0], b[1]); ctx.rotate(-0.35);
  ctx.fillStyle = '#05070b'; ctx.beginPath(); ctx.ellipse(s * 0.1, 0, s * 0.07, s * 0.15, 0, 0, TAU); ctx.fill();
  ctx.restore();
  if (w > 0.01) {
    glow(ctx, b[0], b[1], 520, '#7d8ba3', 0.18 * w);
    glow(ctx, b[0], b[1], 150, BULB, 0.55 * w);
    glow(ctx, b[0], b[1], 34, '#ffffff', 0.95 * w);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba('#ffffff', w); ctx.beginPath(); ctx.arc(b[0] - 2, b[1], s * 0.065, 0, TAU); ctx.fill();
    // cage wires over the bulb
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(b[0] - s * 0.09, b[1] + i * s * 0.05); ctx.lineTo(b[0] + s * 0.04, b[1] + i * s * 0.05); ctx.stroke(); }
    ctx.restore();
    // horizontal anamorphic streak
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = linGrad(ctx, b[0] - 300, 0, b[0] + 300, 0, [[0, 'rgba(200,210,225,0)'], [0.5, rgba('#c9d2e0', 0.22 * w)], [1, 'rgba(200,210,225,0)']]);
    ctx.fillRect(b[0] - 300, b[1] - 1.5, 600, 3);
    ctx.restore();
  }
}

function auBanner(ctx, S) {
  const w = S.work, Z = 12.85, s = sOf(Z);
  const XL = -4.35, XR = 4.35, TOP = 4.98, H = 0.8, SAG = 0.36;
  const yTop = (u) => TOP - SAG * (1 - (2 * u - 1) ** 2) - 0.05 * Math.sin(u * 9.4);
  const yBot = (u) => yTop(u) - H + 0.06 * Math.sin(u * 23 + 1) * 0.5;
  const N = 40, top = [], bot = [];
  for (let i = 0; i <= N; i++) { const u = i / N, X = lerp(XL, XR, u); top.push(pj(X, yTop(u), Z)); bot.push(pj(X, yBot(u), Z)); }
  // ropes up into the dark
  line(ctx, top[0], pj(XL - 0.5, 6.6, Z), 1.4, '#1b2230');
  line(ctx, top[N], pj(XR + 0.5, 6.6, Z), 1.4, '#1b2230');
  ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]);
  for (const p of top) ctx.lineTo(p[0], p[1]);
  for (let i = N; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
  ctx.closePath();
  const bulb = pj(WORK.X, WORK.Y, WORK.Z);
  ctx.fillStyle = linGrad(ctx, top[0][0], 0, top[N][0], 0, [[0, mixHex('#2a2b2d', AUP.bannerCloth, 0.55)], [0.62, mixHex(AUP.bannerCloth, AUP.bannerLit, 0.35 * w)], [1, mixHex('#3a3a39', AUP.bannerCloth, 0.75)]]);
  ctx.fill();
  ctx.save(); ctx.clip();
  // lit from below by the bulb
  glow(ctx, bulb[0], top[N / 2][1] + 70, 420, '#9aa2ae', 0.28 * w, 0.4);
  // sag creases
  for (const u of [0.22, 0.5, 0.74]) {
    const i = Math.round(u * N); const p = top[i], q = bot[i];
    ctx.fillStyle = linGrad(ctx, p[0] - 14, 0, p[0] + 14, 0, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(0,0,0,0.22)'], [1, 'rgba(0,0,0,0)']]);
    ctx.fillRect(p[0] - 14, p[1], 28, q[1] - p[1]);
  }
  ctx.restore();
  // painted letters (cap height ≈ 0.5 m)
  const ySc = (x) => { const u = clamp((x - top[0][0]) / (top[N][0] - top[0][0])); const i = u * N, i0 = Math.floor(i), i1 = Math.min(N, i0 + 1), f = i - i0; return lerp(lerp(top[i0][1], top[i1][1], f), lerp(bot[i0][1], bot[i1][1], f), 0.78); };
  curvedText(ctx, 'ANNUAL SCHOOL CONCERT', AU.VPX, ySc, { size: Math.round(s * 0.62), family: FONT.hand2, weight: 400, color: AUP.paint, tracking: s * 0.05, jitter: 1, seed: 7 });
  // two paper stars glued on the ends
  for (const [u, r] of [[0.035, 0.6], [0.965, 2.1]]) {
    const i = Math.round(u * N), x = top[i][0], y = (top[i][1] + bot[i][1]) / 2;
    starPath(ctx, x, y, s * 0.2, r); ctx.fillStyle = mixHex('#6b6556', '#b7ae95', 0.6 * w); ctx.fill();
  }
}

function auFloorLight(ctx, S, slab) {
  const w = S.work;
  // spill from the work light over the stage lip, fading toward camera
  if (w > 0.01) {
    ctx.save(); poly(ctx, [pj(AU.WL, 0, 1.5), pj(AU.WR, 0, 1.5), pj(AU.WR, 0, AU.STZ), pj(AU.WL, 0, AU.STZ)]); ctx.clip();
    const c = pj(WORK.X * 0.7, 0, 11.6);
    glow(ctx, c[0], c[1] + 10, 1400, AUP.floorLit, 0.5 * w, 0.24);
    glow(ctx, c[0], c[1], 420, '#6a7488', 0.25 * w, 0.18);
    // the stage lip's shadow band at the foot of the stage
    fillPoly(ctx, [pj(-6.5, 0, 12.1), pj(6.5, 0, 12.1), pj(6.5, 0, 13), pj(-6.5, 0, 13)], `rgba(2,4,8,${0.7 * w})`);
    // long chair shadows back toward the camera
    chairShadows(ctx, CHAIRS, WORK, 0.62 * w);
    ctx.restore();
  }
  // the corridor slab
  if (slab) {
    const p = slab.map((q) => pf(q));
    const dA = pf([AU.WL, ADOOR.z0 + 0.6]), dB = pf([1.5, 10]);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    poly(ctx, p);
    ctx.fillStyle = linGrad(ctx, dA[0], dA[1], dB[0], dB[1], [[0, rgba(CORR, 0.8 * S.door)], [0.35, rgba(CORR, 0.48 * S.door)], [1, rgba(CORR, 0.1 * S.door)]]);
    ctx.fill();
    ctx.restore();
    // chairs and Adam block the corridor light: their shadows cut the slab
    ctx.save(); poly(ctx, p); ctx.clip();
    chairShadows(ctx, CHAIRS.filter((c) => c.Z > ADOOR.z0 - 0.3), DLIGHT, 0.7);
    if (S.shadow > 0.01) auAdamShadow(ctx, S);
    ctx.restore();
  }
}

/** Adam's long, stretched shadow from the doorway down the slab. */
function auAdamShadow(ctx, S) {
  const foot = [AU.WL + 0.2, 6.6];
  const head = shadowTip(DLIGHT, foot[0], 1.78, foot[1]);
  const sh = shadowTip(DLIGHT, foot[0], 1.45, foot[1]);
  const along = [head[0] - foot[0], head[1] - foot[1]], len = Math.hypot(...along);
  const n = [-along[1] / len, along[0] / len];
  const W = (p, d, w2) => [p[0] + along[0] * d + n[0] * w2, p[1] + along[1] * d + n[1] * w2];
  const pts = [W(foot, 0, -0.1), W(foot, 0.42, -0.16), W(foot, 0.78, -0.2), W(foot, 0.86, -0.08), W(foot, 0.86, 0.08), W(foot, 0.78, 0.22), W(foot, 0.42, 0.17), W(foot, 0, 0.1)].map((q) => pf(q));
  ctx.fillStyle = `rgba(3,5,9,${0.9 * S.shadow})`; poly(ctx, pts); ctx.fill();
  const hc = pf(W(foot, 0.93, 0)), hs = sOf(W(foot, 0.93, 0)[1]);
  ctx.beginPath(); ctx.ellipse(hc[0], hc[1], hs * 0.55, hs * 0.08, Math.atan2(pf(head)[1] - pf(foot)[1], pf(head)[0] - pf(foot)[0]), 0, TAU); ctx.fill();
  void sh;
}

function auFloorThings(ctx, S, slab, slabK) {
  // paper stars + programme lying on the floor (foreshortened by the projection)
  for (const [X, Z, r, rot] of FLOOR_STARS) {
    const onStage = Z > AU.STZ, Y = onStage ? AU.STY : 0;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = rot + (i * Math.PI) / 5, rad2 = i % 2 ? r * 0.45 : r;
      pts.push(pj(X + Math.cos(a) * rad2, Y, Z + Math.sin(a) * rad2));
    }
    const inSlab = slab && inPoly([X, Z], slab) ? slabK([X, Z]) : 0;
    const lit = onStage ? 0.45 * S.work : 0.12 + 0.2 * S.work * clamp((Z - 7) / 5);
    fillPoly(ctx, pts, mixHex(mixHex('#1a2232', '#a8a596', lit), CORR, inSlab * 0.9));
  }
  const { X, Z, w, d, rot } = PROG, ca = Math.cos(rot), sa = Math.sin(rot);
  const P = (u, v) => pj(X + u * ca - v * sa, 0, Z + u * sa + v * ca);
  const inS = slab && inPoly([X, Z], slab) ? slabK([X, Z]) : 0;
  const pc = mixHex('#232a38', CORR, 0.1 + inS * 0.8);
  fillPoly(ctx, [P(-w, -d / 2), P(0, -d / 2 - 0.01), P(0, d / 2 - 0.01), P(-w, d / 2)], pc);
  fillPoly(ctx, [P(0, -d / 2 - 0.01), P(w, -d / 2 + 0.02), P(w * 0.95, d / 2 + 0.02), P(0, d / 2 - 0.01)], mixHex(pc, '#000000', 0.18));
  // printed lines and a star on the cover
  for (let i = 0; i < 5; i++) { const v = -d / 2 + 0.06 + i * 0.045; line(ctx, P(0.03, v), P(w * 0.8, v + 0.005), 1, rgba('#000000', 0.35)); }
  const sc = P(-w / 2, -0.05); starPath(ctx, sc[0], sc[1], 5, 0.3, 0.45); ctx.fillStyle = rgba('#000000', 0.35); ctx.fill();
}

function auAir(ctx, S, slab) {
  const t = S.t, w = S.work;
  // haze: cold, low, slowly drifting; brighter around the bulb
  fog(ctx, t, 230, 160, '#3a4a66', 0.05 * (0.4 + 0.6 * w), 3, 6);
  const b = pj(WORK.X, WORK.Y, WORK.Z);
  glow(ctx, b[0], b[1], 300, '#8a96aa', 0.08 * w);
  // dust in the work light
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) {
    const r = hash(i * 13 + 5), r2 = hash(i * 7 + 11);
    const x = b[0] + (r - 0.5) * 520 + wobble(t * 0.15, 1, i) * 30;
    const y = b[1] + (r2 - 0.4) * 300 + ((t * (4 + r * 6) + r2 * 300) % 300) - 150;
    const d = Math.hypot(x - b[0], y - b[1]);
    const a = 0.5 * w * clamp(1 - d / 280) * (0.5 + 0.5 * Math.sin(t * 0.7 + i));
    if (a > 0.01) { ctx.fillStyle = rgba('#dfe5ee', a); ctx.fillRect(x, y, 1.6, 1.6); }
  }
  ctx.restore();
  // the shaft of corridor light in the air, from the door down onto the slab
  if (slab) {
    const za = ADOOR.z0, zb = ADOOR.z0 + (ADOOR.z1 - ADOOR.z0) * S.gap;
    const a = pj(AU.WL, ADOOR.h, za), b2 = pj(AU.WL, ADOOR.h, zb), f0 = pf(slab[1]), f1 = pf(slab[2]), c0 = pj(AU.WL, 0, za);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    poly(ctx, [a, b2, f1, f0, c0]);
    ctx.fillStyle = linGrad(ctx, a[0], 0, f0[0], 0, [[0, rgba(CORR, 0.16 * S.door)], [0.5, rgba(CORR, 0.05 * S.door)], [1, rgba(CORR, 0)]]);
    ctx.fill();
    for (let i = 0; i < 26; i++) {
      const u = hash(i * 3 + 90), v = hash(i * 5 + 91);
      const x = lerp(a[0], f0[0], u * 0.8) + wobble(t * 0.2, 1, i + 40) * 12;
      const y = lerp(a[1], f0[1], v) - 30 + ((t * 5 * (0.5 + u) + v * 200) % 200);
      ctx.fillStyle = rgba('#f2ece0', 0.35 * S.door * (0.4 + 0.6 * Math.sin(t + i))); ctx.fillRect(x, y, 1.7, 1.7);
    }
    const dc = pj(AU.WL, 1.2, (za + zb) / 2);
    glow(ctx, dc[0] + 10, dc[1], 260, CORR, 0.16 * S.door);
    ctx.restore();
  }
}

export const auditorium = {
  W: 1920,
  floorY: 532,
  at(X, Z) { const p = pj(X, 0, Z); return { x: p[0], y: p[1], scale: (1.8 * sOf(Z)) / 430 }; },
  anchors: {
    door: { x: 133, y: 532, scale: 0.57 },
    doorStep: { x: 208, y: 556, scale: 0.6 },
    aisle: { x: 1060, y: 420, scale: 0.4 },
    stage: { x: 1060, y: 330, scale: 0.26 },
    bulb: { x: 1192, y: 240 },
    banner: { x: 1060, y: 165 },
    corridor: { x: 150, y: 400 },
  },
  lights: { nightDark: { key: CORR, from: -1, amount: 0.55 } },
  back(ctx, F, o = {}) {
    const S = auState(F, o);
    const slab = slabXZ(S);
    const slabK = (p) => {
      const d = Math.hypot(p[0] - AU.WL, p[1] - 6.6);
      return S.door * clamp(1.1 - d / 11);
    };
    ctx.save();
    camera(ctx, S.cam, 1, () => {
      auRoom(ctx, S);
      auStage(ctx, S);
      auBanner(ctx, S);
      auDoor(ctx, S);
      auFloorLight(ctx, S, slab);
      auFloorThings(ctx, S, slab, slabK);
      drawChairs(ctx, CHAIRS.filter((c) => c.Z >= S.splitZ), S, slab, slabK);
    });
    ctx.restore();
  },
  mid() {},
  front(ctx, F, o = {}) {
    const S = auState(F, o);
    const slab = slabXZ(S);
    const slabK = (p) => S.door * clamp(1.1 - Math.hypot(p[0] - AU.WL, p[1] - 6.6) / 11);
    ctx.save();
    camera(ctx, S.cam, 1, () => drawChairs(ctx, CHAIRS.filter((c) => c.Z < S.splitZ), S, slab, slabK));
    camera(ctx, S.cam, 1.12, () => auAir(ctx, S, slab));
    ctx.restore();
  },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// 2. STAGE (awards night, warm)
// ═══════════════════════════════════════════════════════════════════════════════════════════
const SG = { floor: 640, lip: 712, opL: 300, opR: 1620, top: -320, bot: 960 };
const WARM = { beam: '#ffd9a0', spot: '#ffe6bd', cloth: ['#5e3214', '#a8642a'], ink: LOOK.warmDay.ink };
const BUNT = ['#e8b85a', '#f3dcb0', '#d9a07a', '#c98f4a', '#efe0c2', '#b98a5e', '#e2c48a'];
const SG_STARS = Array.from({ length: 22 }, (_, i) => {
  const r = rng(500 + i); let x = 340 + r() * 1240, y = 250 + r() * 300;
  if (Math.abs(x - 1000) < 230 && y > 260) x += x < 1000 ? -260 : 260;   // keep the spot area clean
  return { x, y, r: 10 + r() * 18, rot: r() * TAU, tw: r() };
});
const HEADS = Array.from({ length: 19 }, (_, i) => {
  const r = rng(900 + i);
  return { x: -40 + i * 110 + (r() - 0.5) * 50, y: 760 + r() * 20, s: 0.86 + r() * 0.3, hair: Math.floor(r() * 4), tilt: (r() - 0.5) * 0.2, clap: r() < 0.5, ph: r() };
});

function sgState(F, o) {
  const t = tOf(F, o);
  return { t, clap: clamp(o.clap ?? 0), confetti: clamp(o.confetti ?? 0), spot: clamp(o.spot ?? 1), cam: o.cam };
}

function sgBack(ctx, S) {
  const t = S.t;
  ctx.fillStyle = '#1a0e06'; ctx.fillRect(-600, SG.top - 200, PW + 1200, SG.bot - SG.top + 400);
  // back cloth (honey velvet) with vertical folds
  ctx.fillStyle = linGrad(ctx, 0, SG.top, 0, SG.floor, [[0, '#3a1e0b'], [0.45, WARM.cloth[0]], [1, WARM.cloth[1]]]);
  ctx.fillRect(SG.opL, SG.top, SG.opR - SG.opL, SG.floor - SG.top);
  for (let x = SG.opL; x < SG.opR; x += 46) {
    const k = hash(x) * 0.5 + 0.5;
    ctx.fillStyle = linGrad(ctx, x, 0, x + 46, 0, [[0, 'rgba(0,0,0,0.16)'], [0.45, rgba('#ffcf8f', 0.07 * k)], [1, 'rgba(0,0,0,0.16)']]);
    ctx.fillRect(x, SG.top, 46, SG.floor - SG.top);
  }
  // general warm wash + the centre spot pool behind Maya / V1
  glow(ctx, 960, 420, 760, '#ffb561', 0.22);
  glow(ctx, 1020, 470, 360, WARM.spot, 0.55 * S.spot, 1.1);
  glow(ctx, 1020, 470, 180, '#fff2d8', 0.25 * S.spot, 1.1);
  // paper stars pinned to the cloth
  for (const s of SG_STARS) {
    starPath(ctx, s.x, s.y, s.r, s.rot + wobble(t * 0.3, 1, s.x) * 0.05);
    ctx.fillStyle = mixHex('#c99a3e', '#f5d27a', s.tw); ctx.fill();
    glow(ctx, s.x, s.y, s.r * 2.2, '#ffd890', 0.12 + 0.1 * Math.sin(t * 1.3 + s.tw * 9));
  }
  // banner "STAR PUPIL AWARDS"
  const bx0 = 610, bx1 = 1310, by = 112, H = 92, sag = 14;
  const yT = (u) => by + sag * (1 - (2 * u - 1) ** 2);
  ctx.beginPath(); ctx.moveTo(bx0, yT(0));
  for (let i = 1; i <= 30; i++) ctx.lineTo(lerp(bx0, bx1, i / 30), yT(i / 30));
  for (let i = 30; i >= 0; i--) ctx.lineTo(lerp(bx0, bx1, i / 30), yT(i / 30) + H);
  ctx.closePath();
  ctx.fillStyle = linGrad(ctx, 0, by, 0, by + H, [[0, '#fff1d4'], [1, '#f0d7a6']]); ctx.fill();
  line(ctx, [bx0, yT(0)], [bx0 - 60, SG.top], 2, '#5a3416'); line(ctx, [bx1, yT(1)], [bx1 + 60, SG.top], 2, '#5a3416');
  curvedText(ctx, 'STAR PUPIL AWARDS', 960, (x) => yT((x - bx0) / (bx1 - bx0)) + 68, { size: 64, family: FONT.hand2, weight: 400, color: '#3a2a52', tracking: 4, jitter: 0.8, seed: 3 });
  for (const [x, r] of [[bx0 + 34, 0.3], [bx1 - 34, 2.4]]) { starPath(ctx, x, yT((x - bx0) / (bx1 - bx0)) + H / 2, 24, r); ctx.fillStyle = '#e9b949'; ctx.fill(); }
  // bunting: three swags across the top
  for (const [x0, x1, y0, sg, seed] of [[SG.opL - 40, 980, -4, 56, 1], [940, SG.opR + 40, -4, 56, 2], [SG.opL - 40, SG.opR + 40, -70, 140, 3]]) {
    const yAt = (x) => { const u = (x - x0) / (x1 - x0); return y0 + sg * 4 * u * (1 - u); };
    ctx.beginPath(); for (let x = x0; x <= x1; x += 10) { if (x === x0) ctx.moveTo(x, yAt(x)); else ctx.lineTo(x, yAt(x)); }
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#4a2a10'; ctx.stroke();
    let i = 0;
    for (let x = x0 + 16; x < x1 - 16; x += 44, i++) {
      const y = yAt(x), a = Math.atan((yAt(x + 2) - yAt(x - 2)) / 4) + wobble(t * 0.8, 1, x + seed * 100) * 0.08;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(17, 0); ctx.lineTo(0, 40); ctx.closePath();
      const col = BUNT[(i + seed * 3) % BUNT.length];
      ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(17, 0); ctx.lineTo(0, 40); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  // proscenium edges + gathered curtains (deep golden brown, no red)
  for (const side of [-1, 1]) {
    const xe = side < 0 ? SG.opL : SG.opR;
    ctx.fillStyle = '#140904'; ctx.fillRect(side < 0 ? -600 : xe, SG.top - 200, 600 + (side < 0 ? xe : 0), SG.bot - SG.top + 400);
    const cw = 170, cx0 = side < 0 ? xe : xe - cw;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx0, SG.top); ctx.lineTo(cx0 + cw, SG.top);
    if (side < 0) { ctx.lineTo(cx0 + cw * 0.55, 300); ctx.quadraticCurveTo(cx0 + cw * 0.3, 380, cx0 + cw * 0.5, SG.floor); ctx.lineTo(cx0, SG.floor); }
    else { ctx.lineTo(cx0 + cw, SG.floor); ctx.lineTo(cx0 + cw * 0.5, SG.floor); ctx.quadraticCurveTo(cx0 + cw * 0.7, 380, cx0 + cw * 0.45, 300); ctx.lineTo(cx0, SG.top); }
    ctx.closePath(); ctx.fillStyle = '#5a2e10'; ctx.fill(); ctx.clip();
    for (let x = cx0; x < cx0 + cw; x += 22) {
      ctx.fillStyle = linGrad(ctx, x, 0, x + 22, 0, [[0, 'rgba(0,0,0,0.35)'], [0.5, rgba('#e6a45a', 0.35)], [1, 'rgba(0,0,0,0.35)']]);
      ctx.fillRect(x, SG.top, 22, SG.floor - SG.top);
    }
    ctx.restore();
    // tie-back tassel (gold)
    ctx.fillStyle = '#d9a640'; ctx.beginPath(); ctx.arc(side < 0 ? cx0 + 52 : cx0 + cw - 52, 350, 9, 0, TAU); ctx.fill();
  }
  // top border (dark valance) with a gold fringe
  ctx.fillStyle = '#241205'; ctx.fillRect(-600, SG.top - 200, PW + 1200, 200 + 80 - 40 - SG.top - 300);
  // trophy table at right, draped
  const tx0 = 1360, tx1 = 1545, ty = 532;
  ctx.fillStyle = linGrad(ctx, 0, ty, 0, SG.floor, [[0, '#f6e6c4'], [1, '#c9a676']]);
  ctx.beginPath(); ctx.moveTo(tx0 - 8, ty); ctx.lineTo(tx1 + 8, ty); ctx.lineTo(tx1 + 14, SG.floor); ctx.lineTo(tx0 - 14, SG.floor); ctx.closePath(); ctx.fill();
  for (let x = tx0 + 10; x < tx1; x += 28) line(ctx, [x, ty + 6], [x + 3, SG.floor], 2, 'rgba(120,80,40,0.18)');
  for (const [x, h] of [[1390, 46], [1430, 62], [1474, 40], [1515, 54]]) sgTrophy(ctx, x, ty, h, t);
  // stage floor edge + lip face + footlight glow
  ctx.fillStyle = '#4a2a12'; ctx.fillRect(-600, SG.floor - 4, PW + 1200, 6);
  ctx.fillStyle = linGrad(ctx, 0, SG.floor, 0, SG.lip, [[0, '#3a200c'], [1, '#1a0d05']]);
  ctx.fillRect(-600, SG.floor + 2, PW + 1200, SG.lip - SG.floor);
  for (let x = 380; x < 1600; x += 120) glow(ctx, x, SG.floor + 4, 70, '#ffd08a', 0.35, 0.4);
  ctx.fillStyle = linGrad(ctx, 0, SG.lip, 0, SG.bot, [[0, '#4a2a12'], [0.25, '#2e190a'], [1, '#170c05']]);
  ctx.fillRect(-600, SG.lip, PW + 1200, SG.bot - SG.lip + 200);
  // the two beams crossing on centre stage
  sgBeams(ctx, S, 0.13);
}

function sgTrophy(ctx, x, base, h, t) {
  ctx.fillStyle = '#5a3a14'; ctx.fillRect(x - h * 0.28, base - h * 0.18, h * 0.56, h * 0.18);
  ctx.fillStyle = linGrad(ctx, x - h * 0.3, 0, x + h * 0.3, 0, [[0, '#a6741e'], [0.45, '#ffe08a'], [1, '#b8862c']]);
  ctx.fillRect(x - h * 0.06, base - h * 0.45, h * 0.12, h * 0.28);
  ctx.beginPath(); ctx.moveTo(x - h * 0.3, base - h); ctx.lineTo(x + h * 0.3, base - h); ctx.quadraticCurveTo(x + h * 0.28, base - h * 0.45, x, base - h * 0.43); ctx.quadraticCurveTo(x - h * 0.28, base - h * 0.45, x - h * 0.3, base - h); ctx.fill();
  glow(ctx, x - h * 0.08, base - h * 0.8, h * 0.5, '#fff0c4', 0.25 + 0.1 * Math.sin(t * 2 + x));
}

function sgBeams(ctx, S, a) {
  const t = S.t;
  lightCone(ctx, 140, -260, Math.atan2(900, 840), 0.3, 1250, WARM.beam, a * (1 + 0.05 * wobble(t, 0.5, 1)));
  lightCone(ctx, 1780, -260, Math.atan2(900, -700), 0.3, 1250, WARM.beam, a * (1 + 0.05 * wobble(t, 0.5, 2)));
}
function lightCone(ctx, x, y, ang, spread, len, col, a) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.rotate(ang);
  const g = linGrad(ctx, 0, 0, len, 0, [[0, rgba(col, a * 1.2)], [0.7, rgba(col, a * 0.6)], [1, rgba(col, 0)]]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(len, -Math.tan(spread / 2) * len); ctx.lineTo(len, Math.tan(spread / 2) * len); ctx.lineTo(0, 10); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function sgLectern(ctx) {
  const x = 620, top = 478;
  ctx.fillStyle = linGrad(ctx, x - 80, 0, x + 80, 0, [[0, '#2a1608'], [0.6, '#5a3416'], [1, '#7a4a1e']]);
  ctx.beginPath(); ctx.moveTo(x - 62, top + 10); ctx.lineTo(x + 70, top - 8); ctx.lineTo(x + 66, top + 16); ctx.lineTo(x + 50, SG.floor); ctx.lineTo(x - 50, SG.floor); ctx.lineTo(x - 56, top + 22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2a1608'; ctx.fillRect(x - 64, SG.floor - 10, 128, 10);
  // carved star on the front panel
  starPath(ctx, x + 4, top + 82, 20, 0); ctx.fillStyle = '#d9a640'; ctx.fill();
  // gooseneck mic
  ctx.beginPath(); ctx.moveTo(x + 40, top - 4); ctx.quadraticCurveTo(x + 52, top - 50, x + 30, top - 62); ctx.lineWidth = 2.4; ctx.strokeStyle = '#120904'; ctx.stroke();
  ctx.fillStyle = '#120904'; ctx.beginPath(); ctx.ellipse(x + 27, top - 64, 7, 5, -0.6, 0, TAU); ctx.fill();
  // rim of stage light on the edge
  line(ctx, [x - 62, top + 10], [x + 70, top - 8], 2, rgba('#ffd9a0', 0.6));
}

function sgFront(ctx, S) {
  const t = S.t;
  // confetti + sparkles
  if (S.confetti > 0.005) {
    const n = Math.round(160 * S.confetti);
    for (let i = 0; i < n; i++) {
      const r = hash(i * 7 + 1), r2 = hash(i * 13 + 2), r3 = hash(i * 29 + 3);
      const sp = 70 + r2 * 90, x = 330 + r * 1260 + Math.sin(t * (1 + r3) + i) * 22;
      const y = SG.top + 200 + ((t * sp + r3 * 1000) % 900);
      const spin = Math.cos(t * (3 + r * 5) + i);
      ctx.save(); ctx.translate(x, y); ctx.rotate(r * TAU + t * (r2 - 0.5));
      ctx.fillStyle = BUNT[i % BUNT.length]; ctx.globalAlpha = 0.9;
      ctx.fillRect(-5, -3 * Math.abs(spin) - 0.5, 10, 6 * Math.abs(spin) + 1);
      ctx.restore();
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const r = hash(i * 31 + 7), r2 = hash(i * 17 + 9);
      const x = 520 + r * 900, y = 120 + r2 * 470;
      const k = Math.max(0, Math.sin(t * (2 + r * 2) + i * 1.7)) ** 3 * S.confetti;
      if (k < 0.02) continue;
      const L = 9 + 12 * k;
      ctx.fillStyle = rgba('#fff4d6', k);
      ctx.fillRect(x - L, y - 0.8, 2 * L, 1.6); ctx.fillRect(x - 0.8, y - L, 1.6, 2 * L);
      glow(ctx, x, y, 14, '#ffe6b0', 0.5 * k);
    }
    ctx.restore();
  }
  // beams again over the figures (thin) + haze
  sgBeams(ctx, S, 0.07);
  fog(ctx, t, 200, 380, '#ffcf8f', 0.05, 5, 10);
  // audience: back row smaller, then the near row
  for (const row of [0, 1]) {
    for (const h of HEADS) {
      const x = h.x + (row ? 55 : 0), y = h.y + (row ? 70 : -10), s = h.s * (row ? 1.75 : 1.3);
      sgHead(ctx, x, y, s, h, row, S);
    }
  }
}

function sgHead(ctx, x, y, s, h, row, S) {
  const ink = row ? '#080402' : '#120904';
  const t = S.t;
  // raised clapping hands (in front of the face, above the head): forearms + two mitten hands
  if (S.clap > 0.01 && h.clap && row === 0) {
    const up = S.clap * 95, ph = (t * 2.4 + h.ph) % 1, k = Math.pow(0.5 + 0.5 * Math.cos(ph * TAU), 0.6);
    ctx.save(); ctx.translate(x + 6 * s, y); ctx.scale(s, s);
    ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineCap = 'round';
    for (const sd of [-1, 1]) {
      const gap = 3 + 13 * k, hx = sd * gap, hy = -36 - up;
      ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(sd * 30, 60); ctx.quadraticCurveTo(sd * 30, hy + 60, hx + sd * 4, hy + 24); ctx.stroke();
      ctx.save(); ctx.translate(hx + sd * 6, hy); ctx.rotate(sd * (0.12 + 0.1 * k));
      rr(ctx, -7, -16, 14, 34, 7); ctx.fill();                                         // palm + fingers
      ctx.beginPath(); ctx.ellipse(-sd * 8, 4, 4, 9, sd * 0.6, 0, TAU); ctx.fill();    // thumb
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(hx + sd * 6 - 6, hy - 16); ctx.lineTo(hx + sd * 6 + 6, hy - 16);
      ctx.lineWidth = 1.6; ctx.strokeStyle = rgba('#ffd9a0', 0.55 * S.clap); ctx.stroke(); ctx.strokeStyle = ink;
    }
    ctx.restore();
  }
  ctx.save(); ctx.translate(x, y); ctx.rotate(h.tilt); ctx.scale(s, s);
  ctx.fillStyle = ink;
  // shoulders
  ctx.beginPath(); ctx.moveTo(-70, 120); ctx.quadraticCurveTo(-64, 40, -24, 34); ctx.lineTo(24, 34); ctx.quadraticCurveTo(64, 40, 70, 120); ctx.closePath(); ctx.fill();
  ctx.fillRect(-12, 10, 24, 30);
  // head + hair
  ctx.beginPath(); ctx.ellipse(0, 0, 26, 32, 0, 0, TAU); ctx.fill();
  if (h.hair === 1) { ctx.beginPath(); ctx.ellipse(0, -14, 31, 24, 0, Math.PI, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(24, 4, 9, 24, -0.3, 0, TAU); ctx.fill(); }
  if (h.hair === 2) { ctx.beginPath(); ctx.ellipse(-6, -30, 12, 10, 0, 0, TAU); ctx.fill(); }
  if (h.hair === 3) { ctx.beginPath(); ctx.ellipse(0, -2, 32, 34, 0, Math.PI * 1.05, TAU * 0.98); ctx.fill(); }
  // warm rim from the stage
  ctx.beginPath(); ctx.ellipse(0, 0, 26, 32, 0, Math.PI * 1.15, Math.PI * 1.85);
  ctx.lineWidth = 1.6; ctx.strokeStyle = rgba('#ffcf8f', row ? 0.18 : 0.32); ctx.stroke();
  ctx.restore();
}

export const stage = {
  W: 1920,
  floorY: SG.floor,
  crop: { square: { x: 480, y: 40, w: 860, h: 764 }, portrait: { x: 650, y: 4, w: 640, h: 800 } },
  anchors: {
    maya: { x: 960, y: 640 }, v1: { x: 1110, y: 640 }, teacher: { x: 585, y: 640 },
    lectern: { x: 620, y: 478 }, enter: { x: 1720, y: 640 }, trophies: { x: 1450, y: 532 },
  },
  lights: { warmDay: { key: LOOK.warmDay.key, from: 1, amount: 0.75 } },
  back(ctx, F, o = {}) {
    const S = sgState(F, o);
    ctx.save(); camera(ctx, S.cam, 1, () => sgBack(ctx, S)); ctx.restore();
  },
  mid(ctx, F, o = {}) {
    const S = sgState(F, o);
    ctx.save(); camera(ctx, S.cam, 1, () => sgLectern(ctx)); ctx.restore();
  },
  front(ctx, F, o = {}) {
    const S = sgState(F, o);
    ctx.save(); camera(ctx, S.cam, 1, () => sgFront(ctx, S)); ctx.restore();
  },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// 3. STEPS (blue hour)
// ═══════════════════════════════════════════════════════════════════════════════════════════
const ST = { ground: 700, riser: 44, tread: 68, nose1: 1030, corner: 1150, doorL: 1520, doorR: 1800, doorTop: 54, lampX: 1440, lampY: 190 };
const stepTop = (i) => ST.ground - ST.riser * i;           // i = 0 ground, 1..3 steps, 4 landing
const LANDING = stepTop(4);                                 // 524
const AMBER = '#ffb561';
const HOR_Y = 430, gy = (d) => HOR_Y + 270 * d;             // ground contact line at parallax depth d
const SKY_STARS = Array.from({ length: 90 }, (_, i) => { const r = rng(300 + i); return { x: -300 + r() * 2600, y: -260 + r() * 520, m: r() ** 3, ph: r() * TAU }; });

function stState(F, o) {
  const t = tOf(F, o);
  const lamp = clamp(o.lamp ?? 1) * (1 + 0.015 * wobble(t, 6, 2) + 0.01 * wobble(t, 23, 5));
  return { t, lamp, cam: o.cam };
}

let _tree = null;
function treePaths() {
  if (_tree) return _tree;
  const r = rng(77), buckets = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
  const grow = (x, y, ang, len, w, depth) => {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    const b = buckets[clamp(Math.floor((14 - w) / 3.6), 0, 3)];
    const mx = (x + x2) / 2 + (r() - 0.5) * len * 0.18, my = (y + y2) / 2 + (r() - 0.5) * len * 0.18;
    b.moveTo(x, y); b.quadraticCurveTo(mx, my, x2, y2);
    if (depth <= 0 || w < 0.8) return;
    const n = depth > 4 ? 2 : 2 + (r() < 0.4 ? 1 : 0);
    for (let i = 0; i < n; i++) grow(x2, y2, ang + (r() - 0.5) * 1.1 + (i - (n - 1) / 2) * 0.45, len * (0.68 + r() * 0.14), w * 0.66, depth - 1);
  };
  grow(0, 0, -Math.PI / 2 - 0.05, 170, 15, 8);
  grow(0, -120, -Math.PI / 2 - 0.7, 120, 9, 6);
  _tree = { buckets, widths: [13, 8, 4, 1.4] };
  return _tree;
}

let _mesh = null;
function meshPattern(ctx) {
  if (_mesh) return _mesh;
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
  const c = cv.getContext('2d');
  c.strokeStyle = 'rgba(150,170,205,0.9)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, 8); c.lineTo(8, 0); c.lineTo(16, 8); c.lineTo(8, 16); c.closePath(); c.stroke();
  _mesh = ctx.createPattern(cv, 'repeat');
  return _mesh;
}

function stSky(ctx, S) {
  ctx.fillStyle = linGrad(ctx, 0, -500, 0, gy(0.4), [[0, '#081330'], [0.45, LOOK.blueHour.sky[0]], [0.82, LOOK.blueHour.sky[1]], [1, '#5a76b4']]);
  ctx.fillRect(-1200, -900, PW + 2400, gy(0.4) + 1000);
  glow(ctx, 400, gy(0.4) - 20, 900, '#7f9ad0', 0.22, 0.35);   // cold horizon glow
  glow(ctx, 1500, gy(0.4) - 40, 700, '#6b84c0', 0.12, 0.35);
  // thin cloud streaks
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const y = 120 + i * 48 + hash(i) * 30, x = -200 + hash(i + 9) * 1800 + S.t * 3;
    ctx.translate(0, 0);
    ctx.fillStyle = radGrad(ctx, x, y, 0, 420, [[0, rgba('#5f78b0', 0.12)], [1, 'rgba(0,0,0,0)']]);
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.06); ctx.translate(-x, -y); ctx.beginPath(); ctx.arc(x, y, 420, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}

function stStars(ctx, S) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const s of SKY_STARS) {
    const fade = clamp((330 - s.y) / 300);
    const a = (0.25 + 0.75 * s.m) * fade * (0.75 + 0.25 * Math.sin(S.t * (1.3 + s.m) + s.ph));
    if (a < 0.03) continue;
    ctx.fillStyle = rgba('#dfe8ff', a);
    const r = 0.7 + s.m * 1.1;
    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, TAU); ctx.fill();
    if (s.m > 0.6) glow(ctx, s.x, s.y, 7, '#cfdcff', 0.25 * a);
  }
  ctx.restore();
}

function stFarStreet(ctx, S) {
  const base = gy(0.4), r = rng(41);
  const col = mixHex('#1b2a52', '#3a5088', 0.25);
  let x = -900;
  ctx.fillStyle = col;
  const wins = [];
  while (x < 2600) {
    const w = 120 + r() * 140, h = 70 + r() * 70, roof = r();
    ctx.beginPath(); ctx.moveTo(x, base);
    ctx.lineTo(x, base - h);
    if (roof < 0.55) { ctx.lineTo(x + w / 2, base - h - 34 - r() * 20); ctx.lineTo(x + w, base - h); }
    else ctx.lineTo(x + w, base - h);
    ctx.lineTo(x + w, base); ctx.closePath(); ctx.fill();
    if (r() < 0.6) ctx.fillRect(x + w * (0.2 + r() * 0.5), base - h - 46, 10, 30);   // chimney
    for (let k = 0; k < 2; k++) wins.push([x + 18 + r() * (w - 40), base - h + 18 + r() * (h - 40), r()]);
    x += w + r() * 10;
  }
  // a couple of lit windows (pale, cool-cream, small) and many dark ones
  for (const [wx, wy, k] of wins) {
    if (k > 0.9) { ctx.fillStyle = '#c9c6b4'; ctx.fillRect(wx, wy, 9, 11); glow(ctx, wx + 4, wy + 5, 22, '#b9bfc8', 0.25); }
    else { ctx.fillStyle = 'rgba(8,14,30,0.55)'; ctx.fillRect(wx, wy, 9, 11); }
  }
  // a far street lamp or two (cold)
  for (const lx of [260, 1320]) {
    line(ctx, [lx, base], [lx, base - 110], 2, '#132042');
    glow(ctx, lx + 6, base - 112, 26, '#b8c8e8', 0.5);
    glow(ctx, lx + 6, base - 112, 70, '#7f97c8', 0.15);
  }
  ctx.fillStyle = linGrad(ctx, 0, base - 40, 0, base + 10, [[0, 'rgba(90,118,180,0)'], [1, 'rgba(90,118,180,0.25)']]);
  ctx.fillRect(-1200, base - 40, PW + 2400, 50);
}

function stFence(ctx, S) {
  const base = gy(0.55), top = base - 250, x0 = -1100, x1 = 1600;
  // playground tarmac behind it
  ctx.fillStyle = linGrad(ctx, 0, gy(0.4), 0, base, [[0, '#24365f'], [1, '#1a2848']]);
  ctx.fillRect(-1300, gy(0.4), PW + 2600, base - gy(0.4) + 2);
  // a climbing frame silhouette in the playground
  ctx.strokeStyle = '#1a2a50'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-60, gy(0.47)); ctx.lineTo(-10, gy(0.47) - 110); ctx.lineTo(120, gy(0.47) - 110); ctx.lineTo(170, gy(0.47));
  ctx.moveTo(-35, gy(0.47) - 55); ctx.lineTo(145, gy(0.47) - 55); ctx.stroke();
  // mesh
  ctx.save();
  ctx.globalAlpha = 0.16; ctx.fillStyle = meshPattern(ctx); ctx.fillRect(x0, top, x1 - x0, base - top);
  ctx.restore();
  ctx.fillStyle = 'rgba(40,58,100,0.18)'; ctx.fillRect(x0, top, x1 - x0, base - top);
  // posts + top rail
  ctx.fillStyle = '#16244a';
  for (let x = x0; x <= x1; x += 190) ctx.fillRect(x, top - 6, 5, base - top + 6);
  ctx.fillRect(x0, top - 6, x1 - x0, 4);
  line(ctx, [x0, top - 4], [x1, top - 4], 1, rgba('#6f8ac4', 0.25));
}

function stTree(ctx, S) {
  const T = treePaths(), x = 160, y = gy(0.7);
  ctx.save(); ctx.translate(x, y); ctx.scale(1.25, 1.25);
  ctx.strokeStyle = '#111c3a'; ctx.lineCap = 'round';
  T.buckets.forEach((p, i) => { ctx.lineWidth = T.widths[i]; ctx.stroke(p); });
  ctx.restore();
}

function stBikeRack(ctx) {
  const base = gy(0.95);
  for (let i = 0; i < 4; i++) {
    const x = -40 + i * 70;
    ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - 150); ctx.arcTo(x, base - 180, x + 30, base - 180, 26); ctx.arcTo(x + 52, base - 180, x + 52, base - 150, 26); ctx.lineTo(x + 52, base);
    ctx.lineWidth = 7; ctx.strokeStyle = '#0b1328'; ctx.stroke();
    ctx.lineWidth = 1.2; ctx.strokeStyle = rgba('#7f98cc', 0.3); ctx.beginPath(); ctx.moveTo(x - 3, base - 150); ctx.arcTo(x - 3, base - 183, x + 30, base - 183, 28); ctx.stroke();
  }
}

function stSign(ctx) {
  const x0 = 330, x1 = 610, top = 404, bot = 530, base = gy(0.9);
  ctx.fillStyle = '#0b1328';
  ctx.fillRect(x0 + 20, top, 10, base - top); ctx.fillRect(x1 - 30, top, 10, base - top);
  rr(ctx, x0, top, x1 - x0, bot - top, 6); ctx.fillStyle = '#12224a'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#0b1328'; ctx.stroke();
  ctx.fillStyle = linGrad(ctx, 0, top, 0, bot, [[0, 'rgba(120,150,210,0.18)'], [1, 'rgba(0,0,0,0)']]); ctx.fill();
  const o = { family: FONT.sans, color: '#8193b8', align: 'center' };
  ctx.save(); ctx.font = `600 34px ${FONT.sans}`; ctx.fillStyle = o.color; ctx.textAlign = 'center';
  try { ctx.letterSpacing = '6px'; } catch (e) { /* */ }
  ctx.fillText('OAKFIELD', (x0 + x1) / 2 + 3, top + 52);
  ctx.font = `500 19px ${FONT.sans}`; try { ctx.letterSpacing = '4px'; } catch (e) { /* */ }
  ctx.fillText('PRIMARY SCHOOL', (x0 + x1) / 2 + 2, top + 84);
  ctx.font = `400 13px ${FONT.sans}`; ctx.globalAlpha = 0.6; try { ctx.letterSpacing = '1px'; } catch (e) { /* */ }
  ctx.fillText('Headteacher: Mrs J. Whitlow', (x0 + x1) / 2, top + 110);
  ctx.restore();
}

function stFacade(ctx, S) {
  const L = S.lamp, x0 = ST.corner;
  // the wall
  ctx.fillStyle = linGrad(ctx, x0, 0, PW + 300, 0, [[0, '#18264a'], [1, '#1e2c55']]);
  ctx.fillRect(x0, -800, PW + 900 - x0, ST.ground + 800);
  // ashlar courses
  ctx.strokeStyle = 'rgba(5,9,20,0.4)'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let y = LANDING; y > -800; y -= 46) {
    ctx.moveTo(x0, y); ctx.lineTo(PW + 900, y);
    const off = ((LANDING - y) / 46) % 2 ? 0 : 60;
    for (let x = x0 + off; x < PW + 900; x += 120) { ctx.moveTo(x, y); ctx.lineTo(x, y - 46); }
  }
  ctx.stroke();
  // the corner quoins + a shadowed edge
  for (let y = LANDING, i = 0; y > -800; y -= 46, i++) { ctx.fillStyle = i % 2 ? '#1c2b52' : '#203059'; ctx.fillRect(x0, y - 44, i % 2 ? 44 : 70, 44); }
  ctx.fillStyle = linGrad(ctx, x0 - 2, 0, x0 + 14, 0, [[0, rgba('#6f8ac4', 0.35)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(x0 - 2, -800, 16, ST.ground + 800);
  // plinth band at landing height
  ctx.fillStyle = '#14203f'; ctx.fillRect(x0, LANDING - 30, PW + 900 - x0, 30);
  // tall dark window high up, above Maya
  for (const wx of [1190]) {
    ctx.fillStyle = '#0e1834'; ctx.fillRect(wx, -260, 170, 330);
    ctx.fillStyle = linGrad(ctx, 0, -240, 0, 60, [[0, '#1f3166'], [1, '#14224a']]); ctx.fillRect(wx + 12, -240, 146, 296);
    ctx.fillStyle = '#0e1834'; ctx.fillRect(wx + 82, -240, 6, 296); ctx.fillRect(wx + 12, -90, 146, 6);
    ctx.fillStyle = '#25345c'; ctx.fillRect(wx - 8, 66, 186, 12);   // sill
  }
  // doors: stone surround, fanlight, two panelled leaves with glass
  const dL = ST.doorL, dR = ST.doorR, dT = ST.doorTop;
  ctx.fillStyle = '#22325c'; ctx.fillRect(dL - 34, dT - 120, dR - dL + 68, LANDING - dT + 120);
  ctx.fillStyle = '#0a1226'; ctx.fillRect(dL, dT - 92, dR - dL, LANDING - dT + 92);
  ctx.fillStyle = '#0f1a36'; ctx.fillRect(dL + 8, dT - 84, dR - dL - 16, 70);   // fanlight
  for (let i = 1; i < 6; i++) line(ctx, [dL + ((dR - dL) / 2), dT - 14], [lerp(dL + 8, dR - 8, i / 6), dT - 84], 2, '#0a1226');
  ctx.fillStyle = '#0a1226'; ctx.fillRect(dL, dT - 14, dR - dL, 14);
  for (const [a, b] of [[dL + 6, (dL + dR) / 2 - 3], [(dL + dR) / 2 + 3, dR - 6]]) {
    ctx.fillStyle = '#131f3e'; ctx.fillRect(a, dT, b - a, LANDING - dT);
    ctx.fillStyle = linGrad(ctx, 0, dT + 20, 0, dT + 260, [[0, '#1d2f5c'], [1, '#101b38']]); ctx.fillRect(a + 18, dT + 20, b - a - 36, 240);
    ctx.fillStyle = '#0d1630'; ctx.fillRect(a + 18, dT + 290, b - a - 36, 150);
    line(ctx, [a + 18, dT + 20], [a + 18 + (b - a - 36), dT + 260], 1, rgba('#7f98cc', 0.08));
  }
  // brass push bars (catch the lamp)
  for (const xb of [(dL + dR) / 2 - 40, (dL + dR) / 2 + 12]) { ctx.fillStyle = mixHex('#3a3428', '#d9a050', 0.6 * L); ctx.fillRect(xb, 300, 28, 5); }
  // a foundation stone plaque low on the wall (dim)
  ctx.fillStyle = '#25365f'; ctx.fillRect(1360, 420, 70, 46);
  ctx.save(); ctx.font = `500 12px ${FONT.serif}`; ctx.fillStyle = rgba('#0b1328', 0.8); ctx.textAlign = 'center'; ctx.fillText('MCMVIII', 1395, 448); ctx.restore();
  // the lamp's light on the wall: a warm pool (amber over blue stone → a muted honey)
  if (L > 0.01) {
    glow(ctx, ST.lampX, ST.lampY + 40, 560, AMBER, 0.2 * L, 1);
    glow(ctx, ST.lampX - 30, ST.lampY + 120, 360, AMBER, 0.3 * L, 1.05);
    glow(ctx, ST.lampX, ST.lampY + 10, 150, '#ffd08a', 0.35 * L);
  }
}

function stLamp(ctx, S) {
  const L = S.lamp, x = ST.lampX, y = ST.lampY;
  // bracket from the wall
  ctx.strokeStyle = '#05080f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 40, y - 70); ctx.lineTo(x + 40, y - 10); ctx.moveTo(x + 40, y - 58); ctx.quadraticCurveTo(x + 10, y - 66, x, y - 50); ctx.stroke();
  ctx.fillStyle = '#05080f'; ctx.fillRect(x + 34, y - 74, 12, 70);
  // lantern: cap, glass, base
  ctx.beginPath(); ctx.moveTo(x - 22, y - 34); ctx.lineTo(x + 22, y - 34); ctx.lineTo(x, y - 52); ctx.closePath(); ctx.fill();
  ctx.fillStyle = mixHex('#2a2a2a', '#fff0cc', L); ctx.beginPath(); ctx.moveTo(x - 17, y - 32); ctx.lineTo(x + 17, y - 32); ctx.lineTo(x + 12, y + 18); ctx.lineTo(x - 12, y + 18); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#05080f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 32); ctx.lineTo(x, y + 18); ctx.stroke();
  ctx.fillStyle = '#05080f'; ctx.fillRect(x - 14, y + 18, 28, 6); ctx.fillRect(x - 4, y + 24, 8, 8);
  if (L > 0.01) {
    glow(ctx, x, y - 6, 40, '#fff4dc', 0.8 * L);
    glow(ctx, x, y - 6, 120, '#ffd08a', 0.35 * L);
  }
}

function stSteps(ctx, S) {
  const L = S.lamp;
  // ground: forecourt from the fence line to the bottom of frame
  ctx.fillStyle = linGrad(ctx, 0, gy(0.55), 0, PH + 200, [[0, '#1e2c50'], [0.45, '#141f3c'], [1, '#080d1c']]);
  ctx.fillRect(-1300, gy(0.55), PW + 2600, PH + 400);
  // paving joints receding
  for (let i = 0; i < 9; i++) { const y = gy(0.55) + (ST.ground - gy(0.55)) * (i / 8) ** 1.6; line(ctx, [-1300, y], [PW + 1300, y], 1, 'rgba(5,9,20,0.35)'); }
  for (let y = ST.ground + 20; y < PH + 200; y += 40) line(ctx, [-1300, y], [PW + 1300, y], 1, 'rgba(5,9,20,0.3)');
  // kerb / edge of the building's base
  // the steps: solid stepped mass, side face visible
  const P = [[ST.nose1, ST.ground], [ST.nose1, stepTop(1)], [ST.nose1 + ST.tread, stepTop(1)], [ST.nose1 + ST.tread, stepTop(2)],
    [ST.nose1 + 2 * ST.tread, stepTop(2)], [ST.nose1 + 2 * ST.tread, stepTop(3)], [ST.nose1 + 3 * ST.tread, stepTop(3)], [ST.nose1 + 3 * ST.tread, LANDING],
    [PW + 900, LANDING], [PW + 900, ST.ground]];
  fillPoly(ctx, P, linGrad(ctx, 0, LANDING, 0, ST.ground, [[0, '#283a66'], [1, '#1c2b50']]));
  // vertical joints under each nose + a soft shadow along the foot of the mass
  for (let i = 1; i <= 3; i++) { const x = ST.nose1 + i * ST.tread; line(ctx, [x, stepTop(i + 1) + 6], [x, ST.ground], 1.2, 'rgba(5,9,20,0.35)'); }
  ctx.fillStyle = linGrad(ctx, 0, ST.ground - 18, 0, ST.ground, [[0, 'rgba(4,7,16,0)'], [1, 'rgba(4,7,16,0.5)']]);
  ctx.fillRect(ST.nose1, ST.ground - 18, PW + 900 - ST.nose1, 18);
  ctx.fillStyle = linGrad(ctx, 0, ST.ground, 0, ST.ground + 26, [[0, 'rgba(4,7,16,0.55)'], [1, 'rgba(4,7,16,0)']]);
  ctx.fillRect(ST.nose1 - 20, ST.ground, PW + 900 - ST.nose1, 26);
  // stone blocks on the side face
  ctx.strokeStyle = 'rgba(5,9,20,0.45)'; ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) { const y = stepTop(i); ctx.beginPath(); ctx.moveTo(ST.nose1 + (i - 1) * ST.tread, y + ST.riser); ctx.lineTo(PW + 900, y + ST.riser); ctx.stroke(); }
  // tread tops: a thin lit nosing strip on each step, warm near the lamp, cold sky elsewhere
  for (let i = 1; i <= 4; i++) {
    const x0 = ST.nose1 + (i - 1) * ST.tread, x1 = i === 4 ? PW + 900 : x0 + ST.tread, y = stepTop(i);
    ctx.fillStyle = '#34497a'; ctx.fillRect(x0 - 5, y - 1, x1 - x0 + 5, 7);
    ctx.fillStyle = rgba('#9db3e2', 0.5); ctx.fillRect(x0 - 5, y - 1, x1 - x0 + 5, 1.5);
    ctx.fillStyle = 'rgba(3,6,14,0.4)'; ctx.fillRect(x0 - 5, y + 6, x1 - x0 + 5, 3);
    // shadow under each nosing on the riser
    ctx.fillStyle = 'rgba(3,6,14,0.45)'; ctx.fillRect(x0 - 4, y + 5, 4, ST.riser - 5);
  }
  // the lamp pool on the top steps and the landing
  if (L > 0.01) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i <= 4; i++) {
      const x0 = ST.nose1 + (i - 1) * ST.tread, y = stepTop(i);
      const xm = Math.max(x0, ST.lampX - 500), xM = i === 4 ? ST.lampX + 420 : x0 + ST.tread;
      const g = linGrad(ctx, ST.lampX - 520, 0, ST.lampX + 420, 0, [[0, rgba(AMBER, 0)], [0.45, rgba(AMBER, 0.42 * L)], [0.6, rgba(AMBER, 0.42 * L)], [1, rgba(AMBER, 0)]]);
      ctx.fillStyle = g; ctx.fillRect(xm - 4, y - 1, xM - xm + 4, 6);
      // the riser face just below catches some too
      ctx.fillStyle = linGrad(ctx, ST.lampX - 520, 0, ST.lampX + 420, 0, [[0, rgba(AMBER, 0)], [0.55, rgba(AMBER, 0.12 * L * (i / 4))], [1, rgba(AMBER, 0)]]);
      ctx.fillRect(xm - 4, y + 5, xM - xm + 4, ST.riser - 5);
    }
    glow(ctx, ST.lampX - 90, LANDING + 2, 380, AMBER, 0.32 * L, 0.12);
    ctx.restore();
  }
}

function stFront(ctx, S) {
  const t = S.t, L = S.lamp;
  // ground mist, cold, drifting
  fog(ctx, t, 560, 140, '#4a68a8', 0.07, 11, 7);
  // lamp bloom over the figures + a moth circling the lantern
  if (L > 0.01) {
    glow(ctx, ST.lampX, ST.lampY - 4, 260, AMBER, 0.08 * L);
    glow(ctx, ST.lampX - 120, ST.lampY + 220, 300, AMBER, 0.05 * L);
    const a = t * 5.3, mx = ST.lampX + Math.cos(a) * 34 + wobble(t, 2, 9) * 10, my = ST.lampY - 4 + Math.sin(a * 1.3) * 20;
    ctx.fillStyle = rgba('#2a1d10', 0.85 * L); ctx.beginPath(); ctx.ellipse(mx, my, 2.6, 1.6, a, 0, TAU); ctx.fill();
  }
}

function stForegroundPost(ctx) {
  // a soft, dark, out-of-focus bollard at the far left edge (parallax depth 1.35)
  const cv = cached('school-post', 120, 400, (c) => { c.filter = 'blur(6px)'; c.fillStyle = '#03050b'; rr(c, 28, 35, 64, 330, 26); c.fill(); c.filter = 'none'; });
  ctx.drawImage(cv, -68, 525);
}

export const steps = {
  W: 1920,
  floorY: ST.ground,
  stepTops: [700, 656, 612, 568, 524],
  anchors: {
    mayaSit: { x: 1264, y: 568 },
    backpack: { x: 1330, y: 524 },
    mayaStand: { x: 1200, y: 568 },
    mayaDown: [{ x: 1132, y: 612 }, { x: 1064, y: 656 }, { x: 990, y: 700 }],
    mayaExit: { x: -160, y: 700 },
    adamKneel: { x: 975, y: 700 },
    adamEnter: { x: -180, y: 700 },
    adamStop: { x: 860, y: 700 },
    lamp: { x: ST.lampX, y: ST.lampY },
  },
  lights: { blueHour: { key: AMBER, from: 1, amount: 0.75 } },
  lightAt(look, x, o = {}) {
    const L = clamp(o.lamp ?? 1), d = Math.abs(x - 1250);
    const warm = 0.75 * L * clamp(1.2 - d / 470, 0, 1);
    if (warm < 0.2) return { key: '#7f9fd0', from: 1, amount: 0.25 };
    return { key: AMBER, from: x < ST.lampX ? 1 : -1, amount: warm };
  },
  back(ctx, F, o = {}) {
    const S = stState(F, o);
    ctx.save();
    camera(ctx, S.cam, 0.1, () => stSky(ctx, S));
    camera(ctx, S.cam, 0.12, () => stStars(ctx, S));
    camera(ctx, S.cam, 0.4, () => stFarStreet(ctx, S));
    camera(ctx, S.cam, 0.55, () => stFence(ctx, S));
    camera(ctx, S.cam, 0.7, () => stTree(ctx, S));
    camera(ctx, S.cam, 0.9, () => stSign(ctx));
    camera(ctx, S.cam, 0.95, () => stBikeRack(ctx));
    camera(ctx, S.cam, 1, () => { stFacade(ctx, S); stSteps(ctx, S); stLamp(ctx, S); });
    ctx.restore();
  },
  mid() {},
  front(ctx, F, o = {}) {
    const S = stState(F, o);
    ctx.save();
    camera(ctx, S.cam, 1, () => stFront(ctx, S));
    camera(ctx, S.cam, 1.35, () => stForegroundPost(ctx));
    ctx.restore();
  },
};
