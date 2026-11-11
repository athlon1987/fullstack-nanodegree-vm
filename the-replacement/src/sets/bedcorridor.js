// ═══════════════════════════════════════════════════════════════════════════════════════════
// SET MODULE "bedcorridor" — the bedroom, the bedside ECU (alarm clock) and the corridor
// outside the apartment's front door.
//
// Every location follows the set contract:  { W, floorY, anchors, lights, back(), mid()?, front() }
//   back(ctx, F, o) / mid(ctx, F, o) / front(ctx, F, o)
//   o = { look, cam: {x, y, zoom, rot} (optional), t: seconds for ambient animation (default F.t), ...state }
// Draw characters between back() and front() with  camera(ctx, o.cam, 1, ...).
// Light always comes from screen RIGHT in the bedroom (the window); in the corridor the cold tube
// is up-left of the door and the warm light of the home comes from the RIGHT (the door).
//
// ───────────────────────────────────────────────────────────────────────────────────────────
// 1. bedroom                                   (a1_02 wide; dark background of a1_03)
//    A small plain bedroom seen side-on as a box set: back wall (door far left, chair with yesterday's
//    shirt and tie, a small wedding photo over the bed), and the RIGHT wall in perspective carrying
//    the window with venetian blinds (brightest point of the frame). The blinds rake soft sloping
//    stripes across the back wall right behind the bed and across the duvet; a striped patch on the
//    floor by the window. Double bed side-on, head at the RIGHT; the near edge is a bench-like seat.
//    Bedside table right of the headboard: little lamp (off), the alarm clock (live LED), glass of
//    water, phone on its charger (cable to the wall socket).
//    looks:   'predawn' (cold blue, default) | 'golden' (gold stripes; the room stays dusky)
//    state:   wifeAsleep  0|1   (default 1)  sleeping mound under the duvet (+ her hair on the far pillow); 0 = empty rumpled duvet
//             clockTime   '5:45' (default)   time on the little clock on the bedside table
//             clockGlitch 0..1  (default 0)  that clock glitching
//             phoneOnTable 0..1 (default 1)  the phone lying on the bedside table
//             light       0..1  (default 1)  strength of the window light (stripes, glows, beams)
//             dust        0..1  (default 1)  dust motes in the beams
//    ambient: wife's shoulder breathes, dust drifts, (predawn) a passing car's light slides along the ceiling line every 15 s.
//    anchors (world px; y = the surface a thing rests on):
//             sit      {x: 760, y: 580}   top of the near bed edge where Adam sits facing right. With the rig:
//                                         drawFigure(ctx,'adam',{x:760, y:700, ...POSE.sitBed}) (seat 120). Any x 620–900 works.
//             feet     {x: 860, y: 700}   where his feet land (sitBed puts them here automatically)
//             stand    {x: 1320, y: 700}  standing between bedside table and window, lit corner wall behind the head
//             bedFoot  {x: 560, y: 700}   standing at the foot of the bed (darker; stripes fade there)
//             door     {x: 212, y: 700}   the bedroom door (dark: not a staging place without your own light)
//             pillow   {x: 1040, y: 560}  Adam's dented pillow     wifeHead {x: 1012, y: 530}   wifeShoulder {x: 960, y: 478}
//             tableTop {x: 1170, y: 548}  clock {x: 1146, y: 550} (bottom-centre, 40 px wide)   phone {x: 1196, y: 556}   glass {x: 1208, y: 545}
//             window   {x: 1657, y: 330}  centre of the window (the light source)
//    lights:  predawn {key '#7f9fd0', from: 1, amount .55}   golden {key '#ffc978', from: 1, amount .85}
//    layers:  back() = whole room incl. bed + wife; draw Adam; front() = light shafts, dust, blurred dark corner (depth 1.4, lower right).
//    framings: a1_02 cam {x: 930, y: 430, zoom: 1.3 → 1.36} (Adam at `sit`, wife behind, stripes behind his head);
//             master {x: 960, y: 402, zoom: 1}; profile CU {x: 840, y: 420, zoom: 2.3}; bedside table {x: 1165, y: 520, zoom: 2.6}.
//    extra:   bedroom.backdrop(ctx, F, {look, zoom = 1.6, x = 900, y = 430, dim = 0.3, wifeAsleep})  — a pre-blurred,
//             darkened picture of the room for the back of an insert (the phone in a1_03). Fills the picture; no camera; cached.
//
// 2. alarmClock(ctx, o)                         (the hero prop of a1_01 / a7_02)
//    o = { x, y,        bottom-centre of the clock body, where it stands on the table
//          size,        width of the body in px (default 860). It is ~0.49 × size tall incl. snooze bar.
//          time,        '5:44' | '5:45' | any 'H:MM' / 'HH:MM' (7-segment digits)
//          glitch,      0..1 segments tear sideways in bands, drop out, brightness stutters
//          t,           seconds — pass F.t so the glitch pattern changes frame by frame (default 0)
//          look,        'predawn' | 'golden'  (colour of the light on the plastic)
//          press,       0..1 the snooze bar pushed down
//          shadow }     0..1 contact shadow + LED spill on the table (default 1)
//    The display is cracked across its top-right corner; the top-right segment and half of the top
//    segment of the LAST digit are dead, and so is the upper dot of the colon.
//    clockPoint(o, name) -> {x, y} of 'snooze' (top-centre of the snooze bar, where the hand lands),
//    'display' (centre of the display) or 'crack' (the impact point of the crack) for the same o.
//
// 3. bedsideCloseup                             (a1_01, a7_02 — the ECU around the clock)
//    The table top, the wall behind (big soft blind stripes), a glass of water (right, soft), the
//    charger cable. The clock itself is NOT drawn by the set: call
//        bedsideCloseup.back(ctx, F, o);  alarmClock(ctx, {...bedsideCloseup.anchors.clock, time, glitch, t, look, press});
//        <hand>;  bedsideCloseup.front(ctx, F, o);
//    all inside the same camera (the set applies o.cam itself; draw the clock and hand with camera(ctx, o.cam, 1, ...)).
//    looks:   'predawn' | 'golden' (a warm gold edge of sunrise rakes across the table from the right)
//    state:   light 0..1 (default 1), dust 0..1 (default 1)
//    anchors: clock   {x: 880, y: 640, size: 860}   pass straight to alarmClock
//             snooze  {x: 880, y: 224}              where the hand lands (top of the snooze bar, un-pressed)
//             display {x: 818, y: 429}              centre of the LED display
//             handFrom {x: -80, y: 250}             the hand enters from screen left, above the table
//             glass   {x: 1640, y: 610}             base of the water glass
//             tableEdge {x: 960, y: 722}            front edge of the table top
//
// 4. corridor                                   (a2_10, a5_01)
//    The cold institutional corridor outside the flat: the long back wall runs flat across the left
//    (neighbours' door 12-04, "TINGKAT 12" stencil, conduit, a dim green KELUAR sign at the far end,
//    a second tube) and falls into darkness at the far left. Right of centre the wall holding the
//    family's FRONT DOOR (12-05) is turned 42° toward the camera, so the door is seen from the
//    corridor side AND a figure in profile can face it, knock on it and lean his forehead on it: the
//    wall crosses the plane the characters stand in along the vertical line x = 1366. The door has a
//    tall reeded FROSTED-GLASS panel at head height (Adam's head is silhouetted against it when he
//    leans), the family's shoe rack stands left of the door (one small pair), a doormat in front.
//    look:    'corridor' (only)
//    state:   doorOpen      0..1 (default 0)   door swings inward (hinged on its right edge, ~100° at 1); the warm hall
//                                              shows through, honey light falls out across the floor as a wedge, warm haze
//             underDoorGlow 0..1 (default 0)   warm strip under the closed door + its reflection on the lino
//             family        0..1 (default 0)   three soft warm shapes (two adults, a child between them) behind the glass; they sway slightly
//             glassGlow     0..1 (default max(underDoorGlow, family, doorOpen))  how lit the frosted glass is
//             tubeFlicker   0..1 (default 0.2) buzz + occasional stutter of the tube over the door (1 = bad); dims the whole frame
//             evening       0..1 (default 0)   a5_01: darker paint, the far tube dies, the far end goes black
//    anchors: adam      {x: 1236, y: 700}  Adam standing in front of his door, facing right (an arm's length away)
//             lean      {x: 1290, y: 700}  his feet for POSE.foreheadOnDoor (forehead then lands on the glass)
//             forehead  {x: 1364, y: 316}  the point on the door his forehead touches     knock {x: 1362, y: 392}  knuckles
//             handle    {x: 1317, y: 455}  the lever handle (door shut)
//             doorway   {x: 1430, y: 702}  feet of a figure in the open doorway, facing left (draw BEFORE corridor.mid())
//             inside    {x: 1530, y: 704}  a step aside inside the flat (mostly hidden by the wall; draw before mid())
//             doorCentre {x: 1408, y: 455}   glass {x: 1395, y: 366}   underDoor {x: 1405, y: 703}   tube {x: 1145, y: 102}
//             neighbourDoor {x: 548, y: 700}   far {x: 300, y: 700} (far end of the corridor, under the second tube)
//    lights:  corridor {key '#b8d6dc', from: -1, amount .45} (the tube is behind Adam). Better, per frame:
//             corridor.light(o, t) -> {key, from, amount}: honey from the right once the door opens (> .15),
//             a faint amber from the glass when family is lit, else the tube (flickering with it).
//             corridor.tubeLevel(o, t) -> 0..1 brightness of the tube right now.
//    layers:  back(); figure INSIDE the flat (V1 in the doorway); corridor.mid() (re-draws the wall and casing around the
//             opening, so the jambs hide him); Adam; front() (tube bloom, haze, dust, warm air from the door, flicker dim).
//    framings: a2_10 start {x: 1160, y: 410, zoom: 1.25}; push to the lean {x: 1290, y: 400, zoom: 1.9};
//             a5_01 {x: 1160, y: 410, zoom: 1.25 → 1.32} with evening: 1; two-shot at the open door {x: 1340, y: 400, zoom: 1.9};
//             glass/handle insert {x: 1380, y: 400, zoom: 2.6}; full master {x: 960, y: 402, zoom: 1}.
// ═══════════════════════════════════════════════════════════════════════════════════════════
import {
  PW, PH, TAU, clamp, lerp, ease, hash, noise1, rgba, mixHex, rr, fillRR, linGrad, radGrad, glow, lightCone, fog, cached, scratch, camera, text, FONT,
} from '../engine.js';
import { C, LOOK } from '../style.js';

// ───────────────────────────── shared helpers ─────────────────────────────
// One perspective for every wall that is not parallel to the picture: eye 300 px above the floor,
// subject plane (scale 1, floor y = 700) at distance FOC, flat back walls at scale SB.
const HOR = 400, EYE = 300, FOC = 1724, SB = 0.92, ZB = FOC / SB;
const proj = (X, Z, h) => { const s = FOC / Z; return [960 + s * X, HOR + s * (EYE - h), s]; };
const bwY = (h) => HOR + SB * (EYE - h);          // y on a flat back wall of a point h px above the floor

const D = (o, k, d) => (o && o[k] !== undefined && o[k] !== null ? o[k] : d);
const timeOf = (F, o) => (o && o.t !== undefined ? o.t : (F && F.t) || 0);

function poly(ctx, pts) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) { if (i) ctx.lineTo(pts[i][0], pts[i][1]); else ctx.moveTo(pts[i][0], pts[i][1]); }
  ctx.closePath();
}
function fillPoly(ctx, pts, fill) { poly(ctx, pts); ctx.fillStyle = fill; ctx.fill(); }
/** Smooth open curve through points (appends to the current path; first point is a lineTo). */
function curveThrough(ctx, pts) {
  ctx.lineTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const l = pts[pts.length - 1]; ctx.lineTo(l[0], l[1]);
}
function line(ctx, x0, y0, x1, y1, color, w = 1) {
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
}
function ellipse(ctx, x, y, rx, ry, fill, rot = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU); ctx.fillStyle = fill; ctx.fill();
}
/** Soft elliptical shadow / light blob in normal compositing (glow() is additive). */
function blob(ctx, x, y, rx, ry, color, a) {
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, rx, [[0, rgba(color, a)], [0.55, rgba(color, a * 0.5)], [1, rgba(color, 0)]]);
  ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore();
}

// ═══════════════════════════════════ ALARM CLOCK ═══════════════════════════════════
const SEGS = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
const DG = { W: 104, H: 190, T: 23, top: -338, slant: -0.1, x: [-372, -242, -62, 82], colon: -104 };
const LED = { lit: '#ee7f49', core: '#ffc296', halo: '#c9542a' };

function clockPal(look) {
  if (look === 'golden') return {
    body: '#22170f', bodyLo: '#150d08', top: '#8f6434', topHi: '#ffd08a', rim: '#fff0c4', rimA: 0.95, glass: '#0d0906',
    label: '#b08a5c', foot: '#090503', bar: '#5a3e22', barTop: '#e0a860', sheen: '#ffe2b0', crack: '#fff0c4', shadow: '#120903',
  };
  return {
    body: '#111927', bodyLo: '#0a101a', top: '#30456a', topHi: '#7f9fd0', rim: '#a9c2ea', rimA: 0.7, glass: '#080b12',
    label: '#62779c', foot: '#04060a', bar: '#24344f', barTop: '#55729f', sheen: '#a9bcd6', crack: '#d5deea', shadow: '#02040a',
  };
}

function segPath(ctx, s) {
  const { W, H, T } = DG, hT = T / 2, g = T * 0.17, mid = H / 2;
  const hbar = (y) => { const x0 = hT + g, x1 = W - hT - g; ctx.moveTo(x0, y); ctx.lineTo(x0 + hT, y - hT); ctx.lineTo(x1 - hT, y - hT); ctx.lineTo(x1, y); ctx.lineTo(x1 - hT, y + hT); ctx.lineTo(x0 + hT, y + hT); ctx.closePath(); };
  const vbar = (x, y0, y1) => { ctx.moveTo(x, y0); ctx.lineTo(x + hT, y0 + hT); ctx.lineTo(x + hT, y1 - hT); ctx.lineTo(x, y1); ctx.lineTo(x - hT, y1 - hT); ctx.lineTo(x - hT, y0 + hT); ctx.closePath(); };
  if (s === 'a') hbar(hT); else if (s === 'g') hbar(mid); else if (s === 'd') hbar(H - hT);
  else if (s === 'f') vbar(hT, hT + g, mid - g); else if (s === 'b') vbar(W - hT, hT + g, mid - g);
  else if (s === 'e') vbar(hT, mid + g, H - hT - g); else if (s === 'c') vbar(W - hT, mid + g, H - hT - g);
}

/** The LED layer of the display (digits, colon, indicator dots). B = brightness 0..1. */
function clockDigits(ctx, chars, B, g, fr) {
  const { W, H, top, slant, x: DX, colon } = DG;
  ctx.save();
  ctx.transform(1, 0, slant, 1, slant * 245, 0);          // italic 7-segment
  for (let d = 0; d < 4; d++) {
    ctx.save(); ctx.translate(DX[d], top);
    ctx.beginPath(); for (const s of 'abcdefg') segPath(ctx, s);     // ghost of every unlit segment
    ctx.fillStyle = rgba(LED.halo, 0.085); ctx.fill();
    const on = SEGS[chars[d]] || '';
    let k = 0;
    for (const s of 'abcdefg') {
      k++;
      if (!on.includes(s)) continue;
      let b = B;
      if (g > 0 && hash(fr * 57 + d * 9 + k) < 0.2 * g) b *= 0.08;                    // drop-outs while glitching
      if (d === 3 && s === 'b') b *= 0.1 + 0.07 * hash(fr * 3 + 1);                    // dead segment under the crack
      const dead = d === 3 && s === 'a';
      for (let half = 0; half < (dead ? 2 : 1); half++) {
        ctx.save();
        if (dead) { ctx.beginPath(); ctx.rect(half ? W * 0.5 : -10, -10, half ? W : W * 0.5 + 10, H + 20); ctx.clip(); }
        const bb = dead && half ? b * 0.12 : b;
        ctx.beginPath(); segPath(ctx, s);
        ctx.fillStyle = rgba(LED.lit, 0.1 + 0.9 * bb); ctx.fill();
        if (bb > 0.3) {                                                               // hot core
          ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(0.86, 0.94); ctx.translate(-W / 2, -H / 2);
          ctx.beginPath(); segPath(ctx, s); ctx.restore();
          ctx.strokeStyle = rgba(LED.core, 0.5 * bb); ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }
  // colon: the upper dot is dead
  for (let i = 0; i < 2; i++) {
    const cy = top + H * (i ? 0.69 : 0.31), b = i ? B : B * 0.09;
    ctx.beginPath(); ctx.rect(colon - 12, cy - 12, 24, 24);
    ctx.fillStyle = rgba(LED.lit, 0.09 + 0.91 * b); ctx.fill();
  }
  ctx.restore();
  // indicators: PM (off) at the top-left, ALARM (on) at the bottom-left
  ellipse(ctx, -412, -344, 8, 8, rgba(LED.halo, 0.12));
  ellipse(ctx, -412, -150, 8, 8, rgba(LED.lit, 0.15 + 0.85 * B));
}

/** Where things are on the clock for the same options as alarmClock(): 'snooze' | 'display' | 'crack'. */
export function clockPoint(o = {}, name = 'snooze') {
  const { x = 0, y = 0, size = 860, press = 0 } = o, u = size / 1000;
  if (name === 'display') return { x: x - 70 * u, y: y - 245 * u };
  if (name === 'crack') return { x: x + 214 * u, y: y - 268 * u };
  return { x, y: y - (468 + lerp(26, 6, clamp(press))) * u };
}

export function alarmClock(ctx, o = {}) {
  const { x = 0, y = 0, size = 860, time = '5:44', look = 'predawn', t = 0, shadow = 1 } = o;
  const g = clamp(o.glitch || 0), press = clamp(o.press || 0);
  const P = clockPal(look), u = size / 1000;
  const fr = Math.floor(t * 12 + 0.001), fr24 = Math.floor(t * 24 + 0.001);
  const [hh, mm] = String(time).split(':');
  const chars = ((hh || '').padStart(2, ' ') + (mm || '').padEnd(2, ' ')).slice(0, 4).split('');
  // brightness: stutter while glitching, a rare full blackout
  let B = 1;
  if (g > 0) {
    B = 1 - g * (0.12 + 0.5 * hash(fr24 * 7 + 1) * (hash(fr * 3 + 5) > 0.45 ? 1 : 0.25));
    if (hash(fr * 91 + 7) < 0.1 * g) B *= 0.12;
  }
  ctx.save();
  ctx.translate(x, y); ctx.scale(u, u);
  ctx.lineJoin = 'round';

  // contact shadow (light comes from the right) and the LED's spill on the table
  if (shadow > 0) {
    blob(ctx, -70, 6, 640, 46, P.shadow, 0.6 * shadow);
    blob(ctx, 0, 2, 520, 16, P.shadow, 0.75 * shadow);
    glow(ctx, -80, 34, 430, LED.halo, 0.17 * B * shadow, 0.13);
  }
  // feet
  fillRR(ctx, -420, -14, 90, 14, 5, P.foot); fillRR(ctx, 330, -14, 90, 14, 5, P.foot);

  // top face (we look down on the clock a little)
  fillPoly(ctx, [[-492, -424], [-472, -478], [472, -478], [492, -424]],
    linGrad(ctx, -492, 0, 492, 0, [[0, mixHex(P.top, P.bodyLo, 0.55)], [0.55, P.top], [1, mixHex(P.top, P.topHi, 0.75)]]));
  // snooze bar
  const R = lerp(26, 6, press), yf = -438 - R;
  fillPoly(ctx, [[-235, yf], [-226, yf - 30], [226, yf - 30], [235, yf]],
    linGrad(ctx, -235, 0, 235, 0, [[0, mixHex(P.barTop, P.bodyLo, 0.5)], [0.6, P.barTop], [1, mixHex(P.barTop, P.topHi, 0.6)]]));
  fillRR(ctx, -235, yf, 470, R + 4, 4, linGrad(ctx, 0, yf, 0, yf + R + 4, [[0, P.bar], [1, mixHex(P.bar, P.bodyLo, 0.7)]]));
  line(ctx, -232, yf + 0.5, 232, yf + 0.5, rgba(P.rim, 0.35 * P.rimA), 2.5);
  if (size > 300) text(ctx, 'SNOOZE', 0, yf - 14, { size: 17, weight: 600, family: FONT.sans, color: rgba(P.bodyLo, 0.55), align: 'center', baseline: 'middle', tracking: 9 });

  // body, front face
  rr(ctx, -500, -430, 1000, 420, 30);
  ctx.fillStyle = linGrad(ctx, 0, -430, 0, -10, [[0, mixHex(P.body, P.top, 0.22)], [0.12, P.body], [1, P.bodyLo]]);
  ctx.fill();
  // light from the right wraps the right end of the case
  ctx.save(); rr(ctx, -500, -430, 1000, 420, 30); ctx.clip();
  ctx.fillStyle = linGrad(ctx, 250, 0, 500, 0, [[0, rgba(P.rim, 0)], [0.8, rgba(P.rim, 0.1 * P.rimA)], [1, rgba(P.rim, 0.55 * P.rimA)]]);
  ctx.fillRect(250, -430, 250, 420);
  ctx.fillStyle = linGrad(ctx, 0, -430, 0, -404, [[0, rgba(P.rim, 0.5 * P.rimA)], [1, rgba(P.rim, 0)]]);
  ctx.fillRect(-500, -430, 1000, 30);
  ctx.restore();

  // display window
  const DX0 = -440, DY0 = -384, DWd = 744, DHt = 278;
  fillRR(ctx, DX0 - 5, DY0 - 5, DWd + 10, DHt + 10, 22, rgba('#000', 0.45));
  fillRR(ctx, DX0, DY0, DWd, DHt, 18, P.glass);
  ctx.save();
  rr(ctx, DX0, DY0, DWd, DHt, 18); ctx.clip();
  // smoked red-brown depth behind the digits
  ctx.fillStyle = radGrad(ctx, -60, -245, 20, 420, [[0, rgba(LED.halo, 0.12 * B)], [1, rgba(LED.halo, 0)]]);
  ctx.fillRect(DX0, DY0, DWd, DHt);
  // LED bloom
  for (let d = 1; d < 4; d++) glow(ctx, DG.x[d] + 38, DG.top + 95, 150, LED.halo, 0.2 * B);
  if (g > 0) {
    // horizontal tearing: bands of the display slide sideways
    const NB = 7, bh = DHt / NB;
    for (let i = 0; i < NB; i++) {
      const act = hash(fr * 13 + i * 5) < 0.6 * g;
      const dx = act ? (hash(fr * 29 + i * 11) - 0.5) * 190 * g : 0;
      ctx.save(); ctx.beginPath(); ctx.rect(DX0, DY0 + i * bh, DWd, bh + 0.5); ctx.clip();
      ctx.translate(dx, 0); clockDigits(ctx, chars, B, g, fr);
      if (act && hash(fr * 41 + i) < 0.5) { ctx.globalAlpha = 0.3; ctx.translate(-dx * 1.7, 0); clockDigits(ctx, chars, B, g, fr); }
      ctx.restore();
    }
  } else clockDigits(ctx, chars, B, 0, fr);
  // reflection of the room in the glass
  fillPoly(ctx, [[DX0, DY0], [DX0 + 250, DY0], [DX0 + 70, DY0 + DHt], [DX0, DY0 + DHt]], linGrad(ctx, DX0, DY0, DX0 + 200, DY0 + 120, [[0, rgba(P.sheen, 0.1)], [1, rgba(P.sheen, 0.015)]]));
  fillPoly(ctx, [[DX0 + 300, DY0], [DX0 + 345, DY0], [DX0 + 165, DY0 + DHt], [DX0 + 120, DY0 + DHt]], rgba(P.sheen, 0.035));
  ctx.restore();
  // inner lip of the bezel
  rr(ctx, DX0, DY0, DWd, DHt, 18); ctx.strokeStyle = rgba(P.rim, 0.12); ctx.lineWidth = 2; ctx.stroke();

  // the crack: a fracture cutting off the top-right corner of the glass
  ctx.save();
  rr(ctx, DX0, DY0, DWd, DHt, 18); ctx.clip();
  const K = [214, -268];
  const main = [[112, -384], [141, -340], [168, -326], [K[0], K[1]], [249, -243], [272, -214], [304, -190]];
  // the loose shard catches the light differently
  fillPoly(ctx, [...main, [304, -384]], linGrad(ctx, 130, -384, 300, -200, [[0, rgba(P.crack, 0.13)], [0.6, rgba(P.crack, 0.04)], [1, rgba(P.crack, 0.09)]]));
  const cracks = [
    main,
    [K, [236, -306], [246, -340], [270, -384]],                 // up to the top edge
    [K, [258, -284], [281, -290], [304, -312]],                 // out to the right edge
    [K, [196, -246], [184, -212], [150, -176], [141, -143], [112, -106]],   // the long hairline across the last digit
    [K, [188, -279], [162, -272]],                              // short spur
    [[249, -243], [244, -214], [256, -190]],
  ];
  for (let pass = 0; pass < 2; pass++) {
    cracks.forEach((c, i) => {
      ctx.beginPath();
      c.forEach((p, j) => { const q = [p[0] + (pass ? 0 : 2.5), p[1] + (pass ? 0 : 2.5)]; if (j) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.strokeStyle = pass ? rgba(P.crack, i === 0 ? 0.85 : i === 3 ? 0.5 : 0.62) : rgba('#000', 0.6);
      ctx.lineWidth = pass ? (i === 0 ? 3 : i === 3 ? 1.6 : 2) : (i === 0 ? 5 : 3);
      ctx.stroke();
    });
  }
  // chips at the impact point
  fillPoly(ctx, [K, [228, -292], [238, -270]], rgba(P.crack, 0.5));
  fillPoly(ctx, [K, [200, -262], [206, -246]], rgba(P.crack, 0.32));
  fillPoly(ctx, [K, [203, -283], [196, -271]], rgba(P.crack, 0.22));
  ctx.restore();

  // right-hand panel: speaker slots, labels
  for (let i = 0; i < 9; i++) fillRR(ctx, 340, -372 + i * 21, 122, 9, 4.5, rgba('#000', 0.55));
  for (let i = 0; i < 9; i++) line(ctx, 344, -362 + i * 21, 458, -362 + i * 21, rgba(P.rim, 0.1), 1.5);
  ellipse(ctx, 352, -146, 7, 7, rgba(LED.lit, 0.35 + 0.5 * B));
  if (size > 300) {
    text(ctx, 'ALARM', 372, -145, { size: 20, weight: 600, color: rgba(P.label, 0.85), baseline: 'middle', tracking: 3 });
    text(ctx, 'QUARTZ', -436, -56, { size: 24, weight: 600, color: rgba(P.label, 0.8), baseline: 'middle', tracking: 8 });
    text(ctx, 'PM', -396, -343, { size: 15, weight: 600, color: rgba(LED.halo, 0.35), baseline: 'middle', tracking: 1 });
    // slider switch and legend under the speaker
    fillRR(ctx, 150, -70, 150, 22, 11, rgba('#000', 0.5)); fillRR(ctx, 226, -68, 44, 18, 8, mixHex(P.body, P.top, 0.6));
    text(ctx, 'OFF · ON · AUTO', 318, -58, { size: 15, weight: 500, color: rgba(P.label, 0.6), baseline: 'middle', tracking: 2 });
  }
  // rim light on the right end and along the top front edge
  ctx.beginPath(); ctx.moveTo(-470, -430); ctx.lineTo(470, -430); ctx.arcTo(500, -430, 500, -400, 30); ctx.lineTo(500, -40); ctx.arcTo(500, -10, 470, -10, 30);
  ctx.strokeStyle = linGrad(ctx, -500, 0, 500, 0, [[0, rgba(P.rim, 0.1 * P.rimA)], [0.6, rgba(P.rim, 0.42 * P.rimA)], [1, rgba(P.rim, P.rimA)]]);
  ctx.lineWidth = 3.5; ctx.stroke();
  ctx.restore();
}

// ═══════════════════════════════════ small props ═══════════════════════════════════
/** A tumbler of water. (x, y) = centre of its base, w = width at the rim, h = height. P: {key, hot, dark}. */
function waterGlass(ctx, x, y, w, h, P, a = 1) {
  const wb = w * 0.8, lvl = h * 0.6, base = h * 0.09;
  const xs = (yy) => lerp(wb, w, (y - yy) / h) / 2;          // half-width at height yy
  ctx.save();
  // shadow to the left, with a caustic in it
  blob(ctx, x - w * 0.55, y + h * 0.012, w * 1.25, h * 0.05, P.dark, 0.5 * a);
  glow(ctx, x - w * 0.5, y + h * 0.014, w * 0.75, P.hot, 0.3 * a, 0.09);
  // body
  ctx.beginPath(); ctx.moveTo(x - xs(y - h), y - h); ctx.lineTo(x - wb / 2, y - base * 0.3); ctx.quadraticCurveTo(x - wb / 2, y, x - wb / 2 + base, y);
  ctx.lineTo(x + wb / 2 - base, y); ctx.quadraticCurveTo(x + wb / 2, y, x + wb / 2, y - base * 0.3); ctx.lineTo(x + xs(y - h), y - h); ctx.closePath();
  ctx.save(); ctx.clip();
  ctx.fillStyle = rgba(P.key, 0.07 * a); ctx.fillRect(x - w, y - h, w * 2, h);
  // water: darker than the glass, refracting the light into a bright band on the left
  const wy = y - lvl;
  ctx.fillStyle = linGrad(ctx, x - w / 2, 0, x + w / 2, 0, [[0, rgba(P.hot, 0.3 * a)], [0.16, rgba(P.key, 0.3 * a)], [0.42, rgba(P.dark, 0.3 * a)], [0.8, rgba(P.dark, 0.42 * a)], [0.93, rgba(P.key, 0.3 * a)], [1, rgba(P.hot, 0.5 * a)]]);
  ctx.fillRect(x - w, wy, w * 2, lvl);
  // thick base
  ctx.fillStyle = linGrad(ctx, 0, y - base * 1.6, 0, y, [[0, rgba(P.hot, 0)], [0.5, rgba(P.hot, 0.38 * a)], [1, rgba(P.key, 0.12 * a)]]);
  ctx.fillRect(x - w, y - base * 1.6, w * 2, base * 1.6);
  ctx.restore();
  // meniscus
  ctx.beginPath(); ctx.ellipse(x, wy, xs(wy), h * 0.014 + 1, 0, 0, TAU);
  ctx.fillStyle = rgba(P.hot, 0.34 * a); ctx.fill();
  // edges: strong highlight on the lit (right) side
  ctx.lineCap = 'round';
  line(ctx, x + xs(y - h) - w * 0.03, y - h, x + wb / 2 - w * 0.03, y - base, rgba(P.hot, 0.75 * a), Math.max(1, w * 0.035));
  line(ctx, x + xs(y - h) - w * 0.11, y - h * 0.98, x + wb / 2 - w * 0.1, y - base * 2.2, rgba(P.key, 0.25 * a), Math.max(0.8, w * 0.02));
  line(ctx, x - xs(y - h) + w * 0.02, y - h, x - wb / 2 + w * 0.02, y - base, rgba(P.key, 0.4 * a), Math.max(0.8, w * 0.02));
  // rim
  ctx.beginPath(); ctx.ellipse(x, y - h, w / 2, h * 0.016 + 1, 0, 0, TAU); ctx.strokeStyle = rgba(P.hot, 0.5 * a); ctx.lineWidth = Math.max(0.8, w * 0.018); ctx.stroke();
  ctx.restore();
}

// ═══════════════════════════════════ BEDSIDE ECU ═══════════════════════════════════
function ecuPal(look) {
  if (look === 'golden') return {
    wall: '#4b3226', wallDark: '#20140f', key: '#ffc978', hot: '#fff0c4', glowC: '#ffb561',
    table: '#3a2415', tableLit: '#b9783a', tableDark: '#170d07', edge: '#ffd08a', cable: '#e9d2ac', cableDark: '#6b4a2a',
    dark: '#0e0703', stripeA: 0.62, m: 0.045, haze: '#ffd890',
  };
  return {
    wall: '#16243d', wallDark: '#0a1120', key: '#7f9fd0', hot: '#c9d9f2', glowC: '#5f7fb0',
    table: '#0f1828', tableLit: '#33486d', tableDark: '#070b14', edge: '#8fabd8', cable: '#93a8cc', cableDark: '#1a2740',
    dark: '#03050a', stripeA: 0.4, m: 0.1, haze: '#5f7fb0',
  };
}
const ECU = { wallBase: 528, edge: 722, lip: 748, clock: { x: 880, y: 640, size: 860 }, glass: { x: 1640, y: 610 } };

export const bedsideCloseup = {
  W: 1920,
  floorY: 640,
  anchors: {
    clock: { x: 880, y: 640, size: 860 },
    snooze: { x: 880, y: 224 },
    display: { x: 818, y: 429 },
    handFrom: { x: -80, y: 250 },
    glass: { x: 1640, y: 610 },
    tableEdge: { x: 960, y: 722 },
  },
  lights: {
    predawn: { key: '#7f9fd0', from: 1, amount: 0.6 },
    golden: { key: '#ffd08a', from: 1, amount: 0.95 },
  },

  back(ctx, F, o = {}) {
    const look = o.look === 'golden' ? 'golden' : 'predawn', P = ecuPal(look), t = timeOf(F, o), light = clamp(D(o, 'light', 1));
    const gold = look === 'golden';
    // ── the wall, far out of focus ──
    camera(ctx, o.cam, 0.82, () => {
      ctx.fillStyle = linGrad(ctx, 0, -200, 0, 620, [[0, P.wallDark], [0.55, P.wall], [1, mixHex(P.wall, P.wallDark, 0.4)]]);
      ctx.fillRect(-500, -300, 2920, 1000);
      // blind stripes: three or four very wide soft bands, sloping down to the left
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.transform(1, -P.m, 0, 1, 0, P.m * 1920);
      const y0 = gold ? -40 : -70, per = gold ? 196 : 178, n = 5, stops = [];
      for (let i = 0; i < n; i++) {
        const a = P.stripeA * light * (0.82 + 0.3 * hash(i * 7 + 3));
        const p = i / n, w = 1 / n;
        stops.push([p + w * 0.1, rgba(P.key, a * 0.14)], [p + w * 0.36, rgba(P.key, a)], [p + w * 0.68, rgba(P.key, a)], [p + w * 0.96, rgba(P.key, a * 0.14)]);
      }
      ctx.fillStyle = linGrad(ctx, 0, y0, 0, y0 + per * n, stops);
      ctx.fillRect(-500, y0, 2920, per * n);
      ctx.restore();
      // the stripes die away to the left (far from the window) and brighten toward it
      ctx.fillStyle = linGrad(ctx, -200, 0, 2100, 0, [[0, rgba(P.wallDark, 0.82)], [0.4, rgba(P.wallDark, 0.3)], [0.75, rgba(P.wallDark, 0)]]);
      ctx.fillRect(-500, -300, 2920, 1000);
      glow(ctx, 2050, 240, 900, P.key, (gold ? 0.5 : 0.3) * light);
      // soft shadow of the mullion
      ctx.fillStyle = linGrad(ctx, 1150, 0, 1330, 0, [[0, rgba(P.wallDark, 0)], [0.5, rgba(P.wallDark, 0.4)], [1, rgba(P.wallDark, 0)]]);
      ctx.fillRect(1150, -300, 180, 1000);
    });
    // ── the table ──
    camera(ctx, o.cam, 1, () => {
      const yb = ECU.wallBase, ye = ECU.edge;
      // top surface
      ctx.fillStyle = linGrad(ctx, 0, yb, 0, ye, [[0, mixHex(P.table, P.tableLit, 0.55 * light)], [0.25, mixHex(P.table, P.tableLit, 0.22 * light)], [1, P.table]]);
      ctx.fillRect(-500, yb, 2920, ye - yb);
      // darker to the left, lit to the right
      ctx.fillStyle = linGrad(ctx, -200, 0, 2100, 0, [[0, rgba(P.tableDark, 0.75)], [0.45, rgba(P.tableDark, 0.2)], [0.8, rgba(P.tableDark, 0)]]);
      ctx.fillRect(-500, yb, 2920, ye - yb);
      // wood grain
      ctx.save(); ctx.beginPath(); ctx.rect(-500, yb, 2920, ye - yb); ctx.clip();
      for (let i = 0; i < 26; i++) {
        const gy = yb + 6 + Math.pow(i / 26, 1.5) * (ye - yb), x0 = -500 + hash(i * 13) * 900, len = 700 + hash(i * 5 + 2) * 1600;
        ctx.beginPath(); ctx.moveTo(x0, gy); ctx.bezierCurveTo(x0 + len * 0.3, gy + (hash(i) - 0.5) * 7, x0 + len * 0.7, gy + (hash(i + 40) - 0.5) * 7, x0 + len, gy + (hash(i + 9) - 0.5) * 4);
        ctx.strokeStyle = rgba(i % 3 ? P.tableDark : P.tableLit, i % 3 ? 0.32 : 0.1); ctx.lineWidth = 1 + hash(i * 3) * 1.6; ctx.stroke();
      }
      // sheen: the lit wall mirrored in the varnish, behind the clock
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = linGrad(ctx, 0, yb, 0, yb + 70, [[0, rgba(P.key, 0.3 * light)], [1, rgba(P.key, 0)]]);
      ctx.fillRect(300, yb, 2120, 70);
      if (gold) {
        // the gold edge of sunrise: a blade of light raking across the table from the right
        fillPoly(ctx, [[2420, yb + 16], [2420, ye - 20], [520, ye - 58], [960, yb + 46]],
          linGrad(ctx, 2000, 0, 560, 0, [[0, rgba(P.hot, 0.62 * light)], [0.45, rgba(P.key, 0.36 * light)], [1, rgba(P.key, 0)]]));
      } else {
        fillPoly(ctx, [[2420, yb + 30], [2420, ye - 40], [900, ye - 70], [1200, yb + 50]],
          linGrad(ctx, 2000, 0, 900, 0, [[0, rgba(P.key, 0.2 * light)], [1, rgba(P.key, 0)]]));
      }
      ctx.restore();
      // back edge of the table against the wall
      ctx.fillStyle = linGrad(ctx, 0, yb - 5, 0, yb + 9, [[0, rgba(P.dark, 0)], [0.4, rgba(P.dark, 0.6)], [1, rgba(P.dark, 0)]]);
      ctx.fillRect(-500, yb - 5, 2920, 14);
      // front lip and the drawer below
      ctx.fillStyle = linGrad(ctx, 0, ye, 0, ECU.lip, [[0, mixHex(P.table, P.tableLit, 0.3 * light)], [1, P.tableDark]]);
      ctx.fillRect(-500, ye, 2920, ECU.lip - ye);
      ctx.fillStyle = linGrad(ctx, 0, ECU.lip, 0, 900, [[0, P.dark], [0.1, P.tableDark], [1, P.dark]]);
      ctx.fillRect(-500, ECU.lip, 2920, 300);
      ctx.fillStyle = linGrad(ctx, 100, 0, 2100, 0, [[0, rgba(P.edge, 0.05)], [0.5, rgba(P.edge, 0.3 * light)], [1, rgba(P.edge, (gold ? 0.95 : 0.6) * light)]]);
      ctx.fillRect(-500, ye - 1.5, 2920, 3.5);

      // the glass of water, soft, at the right
      waterGlass(ctx, ECU.glass.x, ECU.glass.y, 410, 700, { key: P.key, hot: P.hot, dark: P.dark }, gold ? 1 : 0.85);
      if (gold) {      // caustic thrown by the glass toward the clock
        glow(ctx, 1385, 628, 260, P.hot, 0.5 * light, 0.11);
        glow(ctx, 1350, 624, 120, '#ffffff', 0.35 * light * (0.9 + 0.1 * Math.sin(t * 1.3)), 0.1);
      }

      // charger cable lying across the front of the table, plug end at the left
      const cable = () => { ctx.beginPath(); ctx.moveTo(2420, 668); ctx.bezierCurveTo(1900, 664, 1560, 712, 1250, 688); ctx.bezierCurveTo(1010, 670, 780, 716, 552, 690); };
      ctx.lineCap = 'round';
      ctx.save(); ctx.translate(-10, 9); cable(); ctx.strokeStyle = rgba(P.dark, 0.55); ctx.lineWidth = 20; ctx.stroke(); ctx.restore();
      cable(); ctx.strokeStyle = mixHex(P.cableDark, P.cable, 0.35 + 0.3 * light); ctx.lineWidth = 15; ctx.stroke();
      ctx.save(); ctx.translate(0, -4); cable(); ctx.strokeStyle = rgba(P.cable, 0.55 * light); ctx.lineWidth = 3.5; ctx.stroke(); ctx.restore();
      // plug: strain relief, body, metal tip
      ctx.save(); ctx.translate(552, 690); ctx.rotate(0.11);
      blob(ctx, -40, 12, 90, 12, P.dark, 0.5);
      fillRR(ctx, -34, -10, 40, 20, 8, mixHex(P.cableDark, P.cable, 0.45));
      fillRR(ctx, -92, -16, 62, 32, 9, mixHex(P.cableDark, P.cable, 0.6));
      fillRR(ctx, -88, -13, 54, 6, 3, rgba(P.cable, 0.6 * light));
      fillRR(ctx, -124, -8, 34, 16, 4, mixHex(P.cableDark, P.hot, 0.5));
      fillRR(ctx, -122, -6, 30, 3, 1.5, rgba(P.hot, 0.6 * light));
      ctx.restore();
    });
  },

  front(ctx, F, o = {}) {
    const look = o.look === 'golden' ? 'golden' : 'predawn', P = ecuPal(look), t = timeOf(F, o), light = clamp(D(o, 'light', 1));
    const gold = look === 'golden', dust = clamp(D(o, 'dust', 1));
    // haze and bloom from the window side, over everything
    camera(ctx, o.cam, 1.15, () => {
      glow(ctx, 2150, 250, 1000, P.key, (gold ? 0.26 : 0.12) * light);
      if (gold) glow(ctx, 2000, 560, 520, P.hot, 0.2 * light, 0.5);
      // big soft dust, out of focus
      if (dust > 0) for (let i = 0; i < 16; i++) {
        const sp = 0.5 + hash(i * 7 + 1);
        const px = 420 + hash(i * 3 + 11) * 1700 + Math.sin(t * 0.21 * sp + i) * 40 + t * 7 * (hash(i * 5) - 0.3);
        const py = 60 + hash(i * 9 + 4) * 560 + Math.cos(t * 0.17 * sp + i * 2) * 26 - t * 4 * sp;
        const k = clamp((px - 500) / 900), tw = 0.55 + 0.45 * Math.sin(t * 0.9 * sp + i * 4.1);
        glow(ctx, px, py, 7 + hash(i * 13) * 16, P.hot, (gold ? 0.2 : 0.11) * k * tw * dust * light);
      }
    });
    // the edge of the duvet, a dark soft mass in the lower-left corner
    camera(ctx, o.cam, 1.5, () => {
      const cv = cached('ecu-duvet', 900, 420, (c) => {
        c.filter = 'blur(22px)'; c.fillStyle = '#000';
        c.beginPath(); c.moveTo(-60, 480); c.lineTo(-60, 190); c.bezierCurveTo(120, 130, 330, 210, 520, 300); c.bezierCurveTo(640, 356, 760, 420, 820, 480); c.closePath(); c.fill();
      });
      ctx.globalAlpha = 0.93; ctx.drawImage(cv, -260, 470); ctx.globalAlpha = 1;
    });
  },
};

// ═══════════════════════════════════════ BEDROOM ═══════════════════════════════════════
// Box set: back wall (scale BR.sb), floor, and the right wall (plane X = BR.xr) with the window.
// P3(X, s, h): world X (px from centre at scale 1), depth scale s (1 = subject plane), height h above floor.
const P3 = (X, s, h) => [960 + s * X, HOR + s * (EYE - h)];
const BR = {
  sb: 0.83, xr: 690, ceil: 615,
  bed: { x0: -370, x1: 128, sn: 1, sf: 0.86, h: 120 },
  tbl: { x0: 170, x1: 300, sf: 0.965, sb: 0.845, h: 135 },
  win: { s0: 0.9, s1: 1.12, h0: 221, h1: 520 },
};
const bwy = (h) => HOR + BR.sb * (EYE - h);
const bwx = (X) => 960 + BR.sb * X;

function bedPal(look) {
  if (look === 'golden') return {
    look, ceil: '#0c080c', wallDark: '#120e16', wall: '#241d2a', wallLit: '#4a3634', key: '#ffc978', hot: '#fff0c4', glowC: '#ffb561',
    skyTop: '#33467a', skyMid: '#c98a7a', skyBot: '#ffc27a', city: '#2a2338', cityLight: '#ffe2b0',
    floor: '#120c0b', floorLit: '#4a2f1f', board: '#070404', wood: '#1d140f', woodLit: '#6e4828',
    duvet: '#3a2e38', duvetLit: '#a87452', drape: '#211a24', sheet: '#5a4648', pillow: '#4c3e45', pillowLit: '#d9a46c',
    dark: '#060304', haze: '#ffd890', stripeA: 0.62, door: '#140f14', hair: '#0a0606', led: 0.5,
  };
  return {
    look: 'predawn', ceil: '#050a14', wallDark: '#0a1222', wall: '#14223a', wallLit: '#27395a', key: '#7f9fd0', hot: '#c9d9f2', glowC: '#5f7fb0',
    skyTop: '#0b1730', skyMid: '#22365e', skyBot: '#4a6799', city: '#08101e', cityLight: '#c9d9f2',
    floor: '#090f1b', floorLit: '#1d2c45', board: '#04070d', wood: '#101828', woodLit: '#2c3e5e',
    duvet: '#223452', duvetLit: '#56729f', drape: '#16233a', sheet: '#33476a', pillow: '#344a72', pillowLit: '#8aa3cc',
    dark: '#03050a', haze: '#5f7fb0', stripeA: 0.5, door: '#0c1424', hair: '#04060b', led: 1,
  };
}
function bedState(F, o = {}) {
  const look = o.look === 'golden' ? 'golden' : 'predawn';
  return {
    look, P: bedPal(look), cam: o.cam, t: timeOf(F, o), light: clamp(D(o, 'light', 1)), dust: clamp(D(o, 'dust', 1)),
    wife: clamp(D(o, 'wifeAsleep', 1)), clockTime: D(o, 'clockTime', '5:45'), clockGlitch: clamp(D(o, 'clockGlitch', 0)),
    phone: clamp(D(o, 'phoneOnTable', 1)),
  };
}

// the patch of blind-striped light on the back wall (also re-used, offset, across the bed)
const STRIPE_Q = [[600, 250], [1533, 168], [1533, 520], [548, 600]];
function stripesImage(P) {
  return cached('bed-stripes-' + P.look, 560, 260, (c) => {
    const raw = document.createElement('canvas'); raw.width = 560; raw.height = 260;
    const r = raw.getContext('2d');
    r.scale(0.5, 0.5); r.translate(-500, -120);
    const [TL, TR, BR_, BL] = STRIPE_Q, n = 13;
    for (let i = 0; i < n; i++) {
      const a = (i + 0.18) / n, b = (i + 0.72) / n, A = 0.75 + 0.25 * hash(i * 5 + 2);
      const L0 = [lerp(TL[0], BL[0], a), lerp(TL[1], BL[1], a)], L1 = [lerp(TL[0], BL[0], b), lerp(TL[1], BL[1], b)];
      const R0 = [lerp(TR[0], BR_[0], a), lerp(TR[1], BR_[1], a)], R1 = [lerp(TR[0], BR_[0], b), lerp(TR[1], BR_[1], b)];
      fillPoly(r, [L0, R0, R1, L1], rgba(P.key, A));
    }
    // fade toward the far (left) end and soften the top edge
    r.globalCompositeOperation = 'destination-in';
    r.fillStyle = linGrad(r, 540, 0, 1533, 0, [[0, 'rgba(0,0,0,0.12)'], [0.25, 'rgba(0,0,0,0.55)'], [0.7, 'rgba(0,0,0,0.95)'], [1, 'rgba(0,0,0,1)']]);
    r.fillRect(400, 0, 1300, 800);
    c.filter = 'blur(2.5px)'; c.drawImage(raw, 0, 0); c.filter = 'none';
  });
}
function drawStripes(ctx, S, alpha, dx = 0, dy = 0) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(alpha);
  ctx.drawImage(stripesImage(S.P), 500 + dx, 120 + dy, 1120, 520);
  ctx.restore();
}

function bedShell(ctx, S) {
  const P = S.P, L = S.light, yb = bwy(0), yt = bwy(BR.ceil), xc = bwx(BR.xr);
  // ceiling
  ctx.fillStyle = linGrad(ctx, 0, -300, 0, yt, [[0, P.dark], [1, mixHex(P.ceil, P.wall, 0.35)]]);
  ctx.fillRect(-600, -400, 3100, yt + 400);
  // a plain flush ceiling lamp (off)
  { const [x, y] = P3(-90, 0.93, BR.ceil); ellipse(ctx, x, y + 4, 46, 9, mixHex(P.ceil, P.wall, 0.8)); ellipse(ctx, x, y + 1, 50, 5, P.ceil); }
  // floor
  ctx.fillStyle = linGrad(ctx, 0, yb, 0, 900, [[0, mixHex(P.floor, P.floorLit, 0.25)], [1, P.floor]]);
  ctx.fillRect(-600, yb, 3100, 600);
  ctx.save(); ctx.beginPath(); ctx.rect(-600, yb, 3100, 600); ctx.clip();
  for (let X = -1500; X <= 1500; X += 74) {          // boards running into depth
    const a = P3(X, BR.sb, 0), b = P3(X, 1.6, 0);
    line(ctx, a[0], a[1], b[0], b[1], rgba(P.board, 0.55), 1.4);
  }
  for (let i = 0; i < 40; i++) {                     // board joints
    const s = BR.sb + hash(i * 3 + 1) * 0.75, X = -1500 + Math.floor(hash(i * 7) * 40) * 74, [x0, y] = P3(X, s, 0), [x1] = P3(X + 74, s, 0);
    line(ctx, x0, y, x1, y, rgba(P.board, 0.5), 1);
  }
  ctx.restore();
  // back wall
  ctx.fillStyle = linGrad(ctx, 0, yt, 0, yb, [[0, P.wallDark], [0.45, P.wall], [1, mixHex(P.wall, P.wallDark, 0.3)]]);
  ctx.fillRect(-600, yt, xc + 600, yb - yt);
  // the room gets darker away from the window (left), lighter toward the corner
  ctx.fillStyle = linGrad(ctx, -200, 0, xc, 0, [[0, rgba(P.dark, 0.72)], [0.45, rgba(P.dark, 0.25)], [1, rgba(P.dark, 0)]]);
  ctx.fillRect(-600, yt, xc + 600, yb - yt);
  ctx.save(); ctx.beginPath(); ctx.rect(-600, yt, xc + 600, yb - yt); ctx.clip();
  glow(ctx, xc - 30, 330, 520, P.glowC, 0.32 * L, 1.1);
  glow(ctx, xc - 10, 300, 200, P.key, 0.2 * L, 1.4);
  // a car passes in the street below, now and then: its light slides across the ceiling line
  if (S.look === 'predawn') { const ph = ((S.t + 5) % 15) / 3.4; if (ph < 1) glow(ctx, lerp(1500, 150, ph), yt + 40, 380, P.key, 0.09 * Math.sin(ph * Math.PI) * L, 0.35); }
  ctx.restore();
  // skirting + ceiling line
  ctx.fillStyle = mixHex(P.wallDark, P.dark, 0.3); ctx.fillRect(-600, yb - 10, xc + 600, 10);
  line(ctx, -600, yb - 10, xc, yb - 10, rgba(P.key, 0.08 * L), 1);
  line(ctx, -600, yt + 1, xc, yt + 1, rgba(P.dark, 0.6), 2);

  // right wall (X = BR.xr), receding — carries the window
  const q = [P3(BR.xr, BR.sb, BR.ceil), P3(BR.xr, 1.6, BR.ceil), P3(BR.xr, 1.6, 0), P3(BR.xr, BR.sb, 0)];
  fillPoly(ctx, q, linGrad(ctx, xc, 0, 2000, 0, [[0, mixHex(P.wall, P.wallLit, 0.25)], [1, P.wallDark]]));
  ctx.save(); poly(ctx, q); ctx.clip();
  glow(ctx, 1660, 340, 360, P.glowC, 0.35 * L, 1.3);
  ctx.fillStyle = mixHex(P.wallDark, P.dark, 0.3);
  fillPoly(ctx, [P3(BR.xr, BR.sb, 10), P3(BR.xr, 1.6, 10), P3(BR.xr, 1.6, 0), P3(BR.xr, BR.sb, 0)], mixHex(P.wallDark, P.dark, 0.3));
  ctx.restore();
  line(ctx, xc, yt, xc, yb, rgba(P.dark, 0.45), 2);   // corner
}

function bedWindow(ctx, S) {
  const P = S.P, L = S.light, W = BR.win, X = BR.xr, t = S.t;
  const at = (s, h) => P3(X, s, h);
  // casing
  fillPoly(ctx, [at(W.s0 - 0.03, W.h1 + 22), at(W.s1 + 0.035, W.h1 + 22), at(W.s1 + 0.035, W.h0 - 26), at(W.s0 - 0.03, W.h0 - 26)], mixHex(P.wall, P.wallLit, 0.5));
  const q = [at(W.s0, W.h1), at(W.s1, W.h1), at(W.s1, W.h0), at(W.s0, W.h0)];
  ctx.save(); poly(ctx, q); ctx.clip();
  // sky + far blocks (a little parallax: they slide with the camera at depth 0.4)
  ctx.fillStyle = linGrad(ctx, 0, q[1][1], 0, q[2][1], [[0, P.skyTop], [0.6, P.skyMid], [1, P.skyBot]]);
  ctx.fillRect(1500, 100, 300, 420);
  const cx = S.cam ? (S.cam.x ?? 960) - 960 : 0;
  for (let i = 0; i < 6; i++) {
    const bx = 1560 + i * 34 - cx * 0.06, bh = 40 + hash(i * 9 + 1) * 90;
    ctx.fillStyle = P.city; ctx.fillRect(bx, 500 - bh, 30, bh + 20);
    for (let j = 0; j < 5; j++) if (hash(i * 31 + j) > 0.75) { ctx.fillStyle = rgba(P.cityLight, 0.5 * L); ctx.fillRect(bx + 6 + (j % 2) * 12, 500 - bh + 10 + j * 14, 4, 4); }
  }
  glow(ctx, 1660, 470, 160, P.skyBot, 0.35 * L, 0.6);
  // venetian blind: slats tilted, light leaks through the gaps
  const n = 22;
  for (let i = 0; i < n; i++) {
    const h = W.h1 - 4 - i * ((W.h1 - W.h0) / n), th = 9.5;
    const sl = [at(W.s0, h), at(W.s1, h), at(W.s1, h - th), at(W.s0, h - th)];
    fillPoly(ctx, sl, linGrad(ctx, sl[0][0], 0, sl[1][0], 0, [[0, mixHex(P.wall, P.pillowLit, 0.25)], [1, mixHex(P.wall, P.pillowLit, 0.55 * L)]]));
    line(ctx, sl[3][0], sl[3][1], sl[2][0], sl[2][1], rgba(P.dark, 0.5), 1.2);
    line(ctx, sl[0][0], sl[0][1] + 0.6, sl[1][0], sl[1][1] + 0.6, rgba(P.hot, 0.35 * L), 0.8);
  }
  // cords
  for (const s of [W.s0 + 0.05, W.s1 - 0.05]) { const a = at(s, W.h1), b = at(s, W.h0); line(ctx, a[0], a[1], b[0], b[1], rgba(P.dark, 0.45), 1); }
  ctx.restore();
  // head rail + sill
  fillPoly(ctx, [at(W.s0 - 0.01, W.h1 + 6), at(W.s1 + 0.01, W.h1 + 6), at(W.s1 + 0.01, W.h1 - 8), at(W.s0 - 0.01, W.h1 - 8)], mixHex(P.wall, P.wallLit, 0.8));
  fillPoly(ctx, [at(W.s0 - 0.04, W.h0), at(W.s1 + 0.045, W.h0), at(W.s1 + 0.05, W.h0 - 12), at(W.s0 - 0.04, W.h0 - 12)], mixHex(P.wallLit, P.hot, 0.15 * L));
  const bc = at((W.s0 + W.s1) / 2, (W.h0 + W.h1) / 2);
  glow(ctx, bc[0], bc[1], 230, P.key, 0.22 * L * (0.97 + 0.03 * Math.sin(t * 0.6)), 1.4);
}

function bedChair(ctx, S) {
  // a plain wooden chair against the back wall, yesterday's shirt and tie over it
  const P = S.P, s = 0.9, X = -520, col = mixHex(P.wood, P.dark, 0.2);
  const pt = (dx, h) => P3(X + dx, s, h);
  const leg = (dx) => { const a = pt(dx, 0), b = pt(dx, 110); fillRR(ctx, a[0] - 4, b[1], 8, a[1] - b[1], 2, col); };
  leg(-50); leg(50);
  const seat = [pt(-58, 112), pt(58, 112), pt(58, 100), pt(-58, 100)]; fillPoly(ctx, seat, col);
  const back = pt(-54, 112), top = pt(-54, 255); fillRR(ctx, back[0] - 6, top[1], 11, back[1] - top[1], 3, col);
  fillRR(ctx, top[0] - 8, top[1] - 4, 50, 14, 4, col);
  // shirt hanging over the back, sleeve dangling; tie over it
  ctx.fillStyle = mixHex(P.sheet, P.wall, 0.5);
  ctx.beginPath(); ctx.moveTo(top[0] - 14, top[1]); ctx.bezierCurveTo(top[0] + 30, top[1] - 10, top[0] + 50, top[1] + 6, top[0] + 46, top[1] + 30);
  ctx.lineTo(top[0] + 40, top[1] + 120); ctx.bezierCurveTo(top[0] + 20, top[1] + 128, top[0] + 4, top[1] + 112, top[0] - 4, top[1] + 124);
  ctx.lineTo(top[0] - 20, top[1] + 40); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(top[0] - 18, top[1] + 20); ctx.bezierCurveTo(top[0] - 34, top[1] + 70, top[0] - 26, top[1] + 120, top[0] - 34, top[1] + 160);
  ctx.lineTo(top[0] - 22, top[1] + 162); ctx.bezierCurveTo(top[0] - 14, top[1] + 120, top[0] - 10, top[1] + 70, top[0] - 4, top[1] + 30); ctx.closePath(); ctx.fill();
  ctx.fillStyle = mixHex(P.dark, P.wall, 0.35);
  ctx.beginPath(); ctx.moveTo(top[0] + 14, top[1] - 2); ctx.lineTo(top[0] + 22, top[1] - 2); ctx.lineTo(top[0] + 26, top[1] + 96); ctx.lineTo(top[0] + 18, top[1] + 108); ctx.lineTo(top[0] + 10, top[1] + 96); ctx.closePath(); ctx.fill();
  line(ctx, top[0] + 40, top[1] + 8, top[0] + 44, top[1] + 116, rgba(P.key, 0.1 * S.light), 1.5);
}

function bedDoorAndWall(ctx, S) {
  const P = S.P, L = S.light;
  // bedroom door (shut) in the back wall, far left
  const x0 = bwx(-1012), x1 = bwx(-790), y0 = bwy(490), y1 = bwy(0);
  fillRR(ctx, x0 - 12, y0 - 12, x1 - x0 + 24, y1 - y0 + 12, 2, mixHex(P.wall, P.wallLit, 0.35));
  ctx.fillStyle = linGrad(ctx, x0, 0, x1, 0, [[0, mixHex(P.door, P.dark, 0.3)], [1, P.door]]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (const [a, b] of [[0.08, 0.45], [0.53, 0.92]]) { ctx.strokeStyle = rgba(P.key, 0.06 * L); ctx.lineWidth = 2; ctx.strokeRect(x0 + 18, lerp(y0, y1, a), x1 - x0 - 36, lerp(y0, y1, b) - lerp(y0, y1, a)); }
  fillRR(ctx, x1 - 30, lerp(y0, y1, 0.52), 20, 6, 3, rgba(P.key, 0.25 * L));
  line(ctx, x0, y1 - 2, x1, y1 - 2, rgba(P.key, 0.06), 2);          // hall light under the door, barely
  // light switch
  fillRR(ctx, x1 + 30, bwy(130), 16, 24, 2, mixHex(P.wall, P.wallLit, 0.6));
  // a small framed photo over the head of the bed
  const fx = bwx(20), fy = bwy(455), fw = 112, fh = 82;
  fillRR(ctx, fx, fy, fw, fh, 2, mixHex(P.wood, P.dark, 0.3));
  ctx.fillStyle = linGrad(ctx, fx, fy, fx + fw, fy + fh, [[0, mixHex(P.wall, P.pillowLit, 0.25)], [1, mixHex(P.wall, P.dark, 0.3)]]); ctx.fillRect(fx + 9, fy + 9, fw - 18, fh - 18);
  // two tiny figures in the photo (wedding)
  ctx.fillStyle = rgba(P.dark, 0.6); ellipse(ctx, fx + 44, fy + 34, 7, 8, rgba(P.dark, 0.55)); ellipse(ctx, fx + 64, fy + 37, 6, 7, rgba(P.dark, 0.55));
  ctx.fillRect(fx + 36, fy + 42, 16, 31); ctx.fillRect(fx + 57, fy + 44, 15, 29);
  line(ctx, fx + 10, fy + 10, fx + fw - 30, fy + 10, rgba(P.hot, 0.18 * L), 1.5);
}

function bedTable(ctx, S) {
  const P = S.P, L = S.light, T = BR.tbl;
  const ft = (X, h) => P3(X, T.sf, h), bk = (X, h) => P3(X, T.sb, h);
  const body = mixHex(P.wood, P.dark, 0.15);
  // left side face (we see it: it faces the centre of the room)
  fillPoly(ctx, [bk(T.x0, T.h), ft(T.x0, T.h), ft(T.x0, 30), bk(T.x0, 30)], mixHex(body, P.dark, 0.35));
  // front face + drawer
  const f = [ft(T.x0, T.h), ft(T.x1, T.h), ft(T.x1, 30), ft(T.x0, 30)];
  fillPoly(ctx, f, linGrad(ctx, f[0][0], 0, f[1][0], 0, [[0, body], [1, mixHex(body, P.woodLit, 0.35 * L)]]));
  const d0 = ft(T.x0 + 10, T.h - 10), d1 = ft(T.x1 - 10, T.h - 58);
  ctx.strokeStyle = rgba(P.dark, 0.6); ctx.lineWidth = 2; ctx.strokeRect(d0[0], d0[1], d1[0] - d0[0], d1[1] - d0[1]);
  fillRR(ctx, (d0[0] + d1[0]) / 2 - 10, (d0[1] + d1[1]) / 2 - 2, 20, 5, 2, rgba(P.key, 0.3 * L));
  for (const X of [T.x0 + 6, T.x1 - 10]) { const a = ft(X, 30), b = ft(X, 0); ctx.fillStyle = body; ctx.fillRect(a[0], a[1], 5, b[1] - a[1]); }
  blob(ctx, (f[0][0] + f[1][0]) / 2, ft(0, 0)[1] - 2, 90, 10, P.dark, 0.7);
  // top
  const top = [bk(T.x0, T.h), bk(T.x1, T.h), ft(T.x1, T.h), ft(T.x0, T.h)];
  fillPoly(ctx, top, linGrad(ctx, top[0][0], 0, top[1][0], 0, [[0, mixHex(P.wood, P.woodLit, 0.3 * L)], [1, mixHex(P.wood, P.woodLit, 0.85 * L)]]));
  line(ctx, f[0][0], f[0][1], f[1][0], f[1][1], rgba(P.hot, 0.35 * L), 1.5);

  // bedside lamp (off), back left
  { const [x, y] = P3(192, 0.855, T.h), c = mixHex(P.wood, P.dark, 0.1);
    ellipse(ctx, x, y - 2, 13, 3.5, c); ctx.fillStyle = c; ctx.fillRect(x - 1.6, y - 52, 3.2, 50);
    fillPoly(ctx, [[x - 13, y - 52], [x + 13, y - 52], [x + 22, y - 84], [x - 22, y - 84]].map(([a, b]) => [a, b]), mixHex(P.sheet, P.wall, 0.2));
    ctx.fillStyle = linGrad(ctx, x - 22, 0, x + 22, 0, [[0, rgba(P.dark, 0.4)], [0.7, rgba(P.dark, 0)], [1, rgba(P.hot, 0.25 * L)]]);
    fillPoly(ctx, [[x - 13, y - 52], [x + 13, y - 52], [x + 22, y - 84], [x - 22, y - 84]], ctx.fillStyle); }
  // glass of water
  { const [x, y] = P3(282, 0.88, T.h); waterGlass(ctx, x, y, 14, 27, { key: P.key, hot: P.hot, dark: P.dark }, 0.9 * L + 0.1); }
  // phone, flat, on its charger; cable falls off the back of the table to the socket
  if (S.phone > 0) {
    const a = P3(232, 0.95, T.h), b = P3(268, 0.95, T.h), c = P3(268, 0.92, T.h), d = P3(232, 0.92, T.h);
    ctx.globalAlpha = S.phone;
    fillPoly(ctx, [d, c, b, a], '#05070b'); line(ctx, a[0], a[1], b[0], b[1], rgba(P.hot, 0.3 * L), 1);
    ctx.globalAlpha = 1;
  }
  { const p0 = P3(268, 0.935, T.h), sk = P3(T.x1 + 26, BR.sb + 0.002, 70);
    fillRR(ctx, sk[0] - 7, sk[1] - 8, 14, 16, 2, mixHex(P.wall, P.wallLit, 0.6));
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.bezierCurveTo(p0[0] + 26, p0[1] + 2, p0[0] + 34, p0[1] + 40, sk[0] + 2, sk[1] + 40);
    ctx.quadraticCurveTo(sk[0] + 4, sk[1] + 10, sk[0], sk[1]); ctx.strokeStyle = mixHex(P.sheet, P.dark, 0.2); ctx.lineWidth = 1.6; ctx.stroke(); }
  // the alarm clock, small, its LED a dull orange-red point in the room
  { const [x, y] = P3(205, 0.91, T.h);
    alarmClock(ctx, { x, y, size: 40, time: S.clockTime, glitch: S.clockGlitch, t: S.t, look: S.look, shadow: 0.7 });
    glow(ctx, x - 3, y - 12, 46, LED.halo, 0.2 * P.led, 0.8); }
}

/** The bed: frame, drape, mattress top, duvet, pillows, the sleeping wife, headboard. */
function bedBed(ctx, S) {
  const P = S.P, L = S.light, B = BR.bed, w = S.wife;
  const n0 = P3(B.x0, B.sn, B.h), n1 = P3(B.x1, B.sn, B.h), f0 = P3(B.x0, B.sf, B.h), f1 = P3(B.x1, B.sf, B.h);
  // under the bed: darkness + contact shadow
  blob(ctx, 840, 698, 330, 16, P.dark, 0.9);
  ctx.fillStyle = P.dark; ctx.fillRect(n0[0] + 6, 640, n1[0] - n0[0] - 10, 56);
  for (const X of [B.x0 + 14, B.x1 - 14]) { const a = P3(X, 1.0, 16); fillRR(ctx, a[0] - 6, a[1], 12, 700 - a[1], 2, mixHex(P.wood, P.dark, 0.3)); }
  // side rail
  const r0 = P3(B.x0, 1, 50), r1 = P3(B.x1, 1, 18);
  ctx.fillStyle = linGrad(ctx, r0[0], 0, r1[0], 0, [[0, mixHex(P.wood, P.dark, 0.4)], [1, mixHex(P.wood, P.woodLit, 0.3 * L)]]);
  ctx.fillRect(r0[0], r0[1], r1[0] - r0[0], r1[1] - r0[1]);
  // mattress top (sheet) seen a little from above
  fillPoly(ctx, [f0, f1, n1, n0], P.sheet);
  // the duvet: top surface across the bed, thrown back on the near side where Adam got up
  const top = (k) => lerp(f0[1], n0[1], k);
  ctx.beginPath();
  ctx.moveTo(f0[0] - 6, f0[1] + 2);
  ctx.lineTo(985, f1[1] + 2);
  ctx.bezierCurveTo(990, 560, 975, 572, 930, 573);        // folded-back corner
  ctx.bezierCurveTo(880, 574, 820, 568, 760, 579);
  ctx.lineTo(n0[0] - 4, n0[1] + 1);
  ctx.closePath();
  ctx.fillStyle = linGrad(ctx, 600, 0, 1000, 0, [[0, mixHex(P.duvet, P.dark, 0.25)], [1, mixHex(P.duvet, P.duvetLit, 0.35 * L)]]); ctx.fill();
  // the folded edge: a soft roll catching the light
  ctx.beginPath(); ctx.moveTo(760, 579); ctx.bezierCurveTo(820, 568, 880, 574, 930, 573); ctx.bezierCurveTo(975, 572, 990, 560, 985, f1[1] + 2);
  ctx.strokeStyle = rgba(P.duvetLit, 0.55 * L); ctx.lineWidth = 3; ctx.stroke();
  // the drape: duvet hanging down the near side, soft hem
  ctx.beginPath(); ctx.moveTo(n0[0] - 10, n0[1] - 2);
  ctx.bezierCurveTo(n0[0] - 26, n0[1] + 20, n0[0] - 20, 640, n0[0] - 6, 664);
  const hem = [[n0[0] + 40, 668], [660, 662], [700, 666], [745, 661], [770, 640], [790, 598]];
  curveThrough(ctx, [[n0[0] - 6, 664], ...hem]);
  ctx.lineTo(790, 580); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, 0, 576, 0, 668, [[0, mixHex(P.drape, P.duvetLit, 0.2 * L)], [1, mixHex(P.drape, P.dark, 0.35)]]); ctx.fill();
  // the sheet edge on Adam's side + mattress side
  ctx.fillStyle = linGrad(ctx, 0, 578, 0, 640, [[0, mixHex(P.sheet, P.pillowLit, 0.25 * L)], [0.15, P.sheet], [1, mixHex(P.sheet, P.dark, 0.5)]]);
  ctx.fillRect(790, 579, n1[0] - 790, 640 - 579);
  line(ctx, 790, 580, n1[0], 580, rgba(P.pillowLit, 0.4 * L), 1.5);
  // drape folds
  for (const [x, k] of [[640, 0.5], [700, 0.35], [742, 0.45]]) { ctx.beginPath(); ctx.moveTo(x, 590); ctx.quadraticCurveTo(x - 6, 625, x + 4, 660); ctx.strokeStyle = rgba(P.dark, 0.35 * k); ctx.lineWidth = 5; ctx.stroke(); }

  // pillows against the headboard: hers (far), his (near, dented)
  const pil = (cx, cy, rx, ry, dent) => {
    ctx.beginPath(); ctx.moveTo(cx - rx, cy + ry * 0.2);
    ctx.bezierCurveTo(cx - rx, cy - ry * 1.1, cx - rx * 0.2, cy - ry * (1.2 - dent), cx, cy - ry * (1 - dent));
    ctx.bezierCurveTo(cx + rx * 0.3, cy - ry * (1.25 - dent * 0.5), cx + rx, cy - ry * 1.1, cx + rx, cy);
    ctx.bezierCurveTo(cx + rx, cy + ry, cx - rx, cy + ry * 1.05, cx - rx, cy + ry * 0.2); ctx.closePath();
    ctx.fillStyle = linGrad(ctx, cx - rx, cy, cx + rx, cy - ry, [[0, mixHex(P.pillow, P.dark, 0.2)], [1, mixHex(P.pillow, P.pillowLit, 0.75 * L)]]); ctx.fill();
  };
  pil(1032, 548, 52, 15, 0); pil(1040, 568, 56, 15, 0.5);

  // the wife, asleep on her side, back to the camera side, under the duvet
  if (w > 0.001) {
    const m = (y, base) => lerp(base, y, w);
    const pts = [[648, 557], [688, m(540, 553)], [728, m(549, 554)], [790, m(522, 552)], [846, m(500, 551)], [902, m(516, 552)], [960, m(476, 551)], [992, m(500, 552)], [1004, 553]];
    const path = () => { ctx.beginPath(); ctx.moveTo(640, 572); curveThrough(ctx, pts); ctx.lineTo(1006, 572); ctx.closePath(); };
    // her head on the pillow (hair, dark), drawn first so the duvet edge tucks over it
    ctx.globalAlpha = w;
    ellipse(ctx, 1012, 530, 24, 21, P.hair, -0.3);
    ellipse(ctx, 1030, 524, 12, 10, P.hair, 0.2);            // a bun of hair on the pillow
    ellipse(ctx, 1004, 538, 13, 9, P.hair);
    ctx.beginPath(); ctx.arc(1012, 530, 23, -2.1, -0.5); ctx.strokeStyle = rgba(P.key, 0.35 * L); ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = 1;
    path();
    ctx.fillStyle = linGrad(ctx, 0, 470, 0, 572, [[0, mixHex(P.duvet, P.duvetLit, 0.55 * L)], [0.5, P.duvet], [1, mixHex(P.duvet, P.dark, 0.2)]]); ctx.fill();
    // rim light along the top of the mound, strongest on the slopes that face the window
    ctx.save(); path(); ctx.clip();
    ctx.beginPath(); ctx.moveTo(640, 572); curveThrough(ctx, pts);
    ctx.strokeStyle = rgba(P.duvetLit, 0.8 * L * w); ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
    // a slow breath: the shoulder rises and falls (very small)
    const br = Math.sin(S.t * 1.25) * 1.2 * w;
    ellipse(ctx, 958, 482 - br, 26, 7, rgba(P.duvetLit, 0.18 * L * w));
    S.bedClip = path;
  } else {
    S.bedClip = null;
  }
  // stripes of window light across the duvet / mound
  ctx.save();
  ctx.beginPath(); ctx.moveTo(f0[0] - 6, 600); ctx.lineTo(f0[0] - 6, f0[1] - 2); ctx.lineTo(990, f1[1]); ctx.lineTo(1000, 600); ctx.closePath();
  ctx.clip();
  drawStripes(ctx, S, P.stripeA * 0.75 * L, -60, 70);
  ctx.restore();
  if (S.bedClip) { ctx.save(); S.bedClip(); ctx.clip(); drawStripes(ctx, S, P.stripeA * 0.8 * L * w, -60, 60); ctx.restore(); }

  // headboard: inner face, top, near post
  const h = 215, X = B.x1;
  fillPoly(ctx, [P3(X, 0.845, h), P3(X, 1.01, h), P3(X, 1.01, B.h), P3(X, 0.845, B.h)], mixHex(P.wood, P.dark, 0.2));
  ctx.save(); poly(ctx, [P3(X, 0.845, h), P3(X, 1.01, h), P3(X, 1.01, B.h), P3(X, 0.845, B.h)]); ctx.clip();
  pil(1032, 548, 52, 15, 0); pil(1040, 568, 56, 15, 0.5); ctx.restore();
  const p0 = P3(X, 1.01, h + 4), p1 = P3(X + 18, 1.01, 0);
  ctx.fillStyle = linGrad(ctx, p0[0], 0, p1[0], 0, [[0, mixHex(P.wood, P.dark, 0.1)], [1, mixHex(P.wood, P.woodLit, 0.5 * L)]]);
  rr(ctx, p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1], 4); ctx.fill();
  fillPoly(ctx, [P3(X, 0.845, h), P3(X + 22, 0.845, h), P3(X + 22, 1.01, h), P3(X, 1.01, h)], mixHex(P.wood, P.woodLit, 0.4 * L));
  line(ctx, p1[0] - 1.5, p0[1] + 4, p1[0] - 1.5, p1[1] - 6, rgba(P.hot, 0.35 * L), 1.5);
}

function bedFloorLight(ctx, S) {
  const P = S.P, L = S.light;
  // blind-striped patch of window light on the floor, in front of the bedside table
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const A = P3(BR.xr, 0.98, 0), Bq = P3(BR.xr, 1.2, 0), Cq = P3(180, 1.25, 0), Dq = P3(280, 0.99, 0);
  for (let i = 0; i < 7; i++) {
    const a = (i + 0.15) / 7, b = (i + 0.65) / 7;
    const q = [[lerp(A[0], Dq[0], a), lerp(A[1], Dq[1], a)], [lerp(A[0], Dq[0], b), lerp(A[1], Dq[1], b)], [lerp(Bq[0], Cq[0], b), lerp(Bq[1], Cq[1], b)], [lerp(Bq[0], Cq[0], a), lerp(Bq[1], Cq[1], a)]];
    fillPoly(ctx, q, linGrad(ctx, A[0], 0, Cq[0], 0, [[0, rgba(P.key, 0.12 * L)], [1, rgba(P.key, 0)]]));
  }
  ctx.restore();
  glow(ctx, 1320, 735, 330, P.glowC, 0.12 * L, 0.2);
  // a worn rug under the feet, in front of the bed
  const r = [P3(-400, 0.985, 0), P3(260, 0.985, 0), P3(300, 1.22, 0), P3(-430, 1.22, 0)];
  fillPoly(ctx, r, linGrad(ctx, r[0][0], 0, r[1][0], 0, [[0, rgba(mixHex(P.floorLit, P.sheet, 0.4), 0.35)], [1, rgba(mixHex(P.floorLit, P.sheet, 0.6), 0.6 * L + 0.2)]]));
  line(ctx, r[3][0], r[3][1], r[2][0], r[2][1], rgba(P.dark, 0.5), 2);
  blob(ctx, 860, 704, 300, 14, P.dark, 0.55);
}

function beamsImage(P) {
  return cached('bed-beams-' + P.look, 700, 320, (c) => {
    const raw = document.createElement('canvas'); raw.width = 700; raw.height = 320; const r = raw.getContext('2d');
    r.scale(0.5, 0.5); r.translate(-400, -100);
    const W0 = P3(BR.xr, 1.0, BR.win.h1), W1 = P3(BR.xr, 1.0, BR.win.h0);
    const [TL, , , BL] = STRIPE_Q;
    for (let i = 0; i < 9; i++) {
      const a = (i + 0.2) / 9, b = (i + 0.6) / 9;
      fillPoly(r, [[W0[0], lerp(W0[1], W1[1], a)], [W0[0], lerp(W0[1], W1[1], b)], [lerp(TL[0], BL[0], b) + 200, lerp(TL[1], BL[1], b) + 20], [lerp(TL[0], BL[0], a) + 200, lerp(TL[1], BL[1], a) + 20]],
        linGrad(r, W0[0], 0, 800, 0, [[0, rgba(P.key, 0.55)], [0.5, rgba(P.key, 0.2)], [1, rgba(P.key, 0)]]));
    }
    c.filter = 'blur(9px)'; c.drawImage(raw, 0, 0); c.filter = 'none';
  });
}

export const bedroom = {
  W: 1920,
  floorY: 700,
  anchors: {
    sit: { x: 760, y: 580 }, feet: { x: 860, y: 700 }, stand: { x: 1320, y: 700 }, door: { x: 212, y: 700 },
    bedFoot: { x: 560, y: 700 }, pillow: { x: 1040, y: 560 }, wifeHead: { x: 1012, y: 530 }, wifeShoulder: { x: 960, y: 478 },
    tableTop: { x: 1170, y: 548 }, clock: { x: 1146, y: 550 }, phone: { x: 1196, y: 556 }, glass: { x: 1208, y: 545 },
    window: { x: 1657, y: 330 },
  },
  lights: {
    predawn: { key: '#7f9fd0', from: 1, amount: 0.55 },
    golden: { key: '#ffc978', from: 1, amount: 0.85 },
  },

  back(ctx, F, o = {}) {
    const S = bedState(F, o);
    ctx.save();
    ctx.fillStyle = S.P.ceil; ctx.fillRect(0, 0, PW, PH);
    camera(ctx, S.cam, 1, () => {
      bedShell(ctx, S);
      drawStripes(ctx, S, S.P.stripeA * S.light);
      bedDoorAndWall(ctx, S);
      bedWindow(ctx, S);
      bedChair(ctx, S);
      bedFloorLight(ctx, S);
      bedTable(ctx, S);
      bedBed(ctx, S);
    });
    ctx.restore();
  },

  front(ctx, F, o = {}) {
    const S = bedState(F, o), P = S.P, L = S.light, t = S.t;
    ctx.save();
    camera(ctx, S.cam, 1, () => {
      // light shafts from the blinds through the air
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (S.look === 'golden' ? 0.32 : 0.22) * L;
      ctx.drawImage(beamsImage(P), 400, 100, 1400, 640); ctx.restore();
      // dust drifting in the beams
      if (S.dust > 0) for (let i = 0; i < 26; i++) {
        const sp = 0.4 + hash(i * 7 + 3);
        const x = 700 + hash(i * 11 + 1) * 950 + Math.sin(t * 0.17 * sp + i) * 30 + ((t * 5 * sp + hash(i) * 400) % 400) - 200;
        const y = 180 + hash(i * 5 + 9) * 380 + Math.cos(t * 0.13 * sp + i * 2) * 20;
        const k = clamp((x - 700) / 700) * (0.5 + 0.5 * Math.sin(t * 0.8 * sp + i * 3.1));
        glow(ctx, x, y, 2.5 + hash(i * 13) * 3.5, P.hot, 0.35 * k * S.dust * L);
      }
      glow(ctx, 1657, 330, 420, P.glowC, 0.1 * L, 1.2);
    });
    // a soft dark corner in the foreground (end of a chest of drawers, very near camera)
    camera(ctx, S.cam, 1.4, () => {
      const cv = cached('bed-fg', 420, 520, (c) => { c.filter = 'blur(16px)'; c.fillStyle = '#000'; c.beginPath(); c.moveTo(120, 560); c.lineTo(150, 170); c.quadraticCurveTo(170, 130, 230, 128); c.lineTo(520, 120); c.lineTo(520, 560); c.closePath(); c.fill(); });
      ctx.globalAlpha = 0.9; ctx.drawImage(cv, 1700, 430); ctx.globalAlpha = 1;
    });
    ctx.restore();
  },

  /**
   * A pre-blurred, darkened picture of the bedroom for the background of an insert (a1_03).
   * o = { look, zoom (1.6), x (900), y (430), dim 0..1 (0.45), wifeAsleep (1) }.  Fills the picture; no camera.
   */
  backdrop(ctx, F, o = {}) {
    const look = o.look === 'golden' ? 'golden' : 'predawn', zoom = D(o, 'zoom', 1.6), x = D(o, 'x', 900), y = D(o, 'y', 430), dim = clamp(D(o, 'dim', 0.3));
    const wife = D(o, 'wifeAsleep', 1);
    const keyS = `bed-bd-${look}-${Math.round(zoom * 100)}-${Math.round(x)}-${Math.round(y)}-${wife}`;
    const raw = cached(keyS + '-raw', PW / 2, PH / 2, (c) => {
      c.scale(0.5, 0.5);
      const oo = { look, cam: { x, y, zoom }, t: 2, dust: 0, wifeAsleep: wife };
      bedroom.back(c, null, oo); bedroom.front(c, null, oo);
    });
    const blurred = cached(keyS + '-blur', PW / 4, PH / 4, (c) => { c.filter = 'blur(5px)'; c.drawImage(raw, 0, 0, PW / 4, PH / 4); c.filter = 'none'; });
    ctx.save(); ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(blurred, -20, -12, PW + 40, PH + 24);
    if (dim > 0) { ctx.fillStyle = rgba('#000000', dim); ctx.fillRect(0, 0, PW, PH); }
    ctx.restore();
  },
};

// ═══════════════════════════════════════ CORRIDOR ═══════════════════════════════════════
// Top view: the corridor's long back wall is flat (depth scale CR.sb). The wall holding the
// family's door is turned CR.ang toward the camera and crosses the subject plane (Z = FOC) at
// screen x = 1366. u = distance along that wall (px, + toward the camera / screen right), measured
// from that crossing; k = distance in front (-) of / behind (+, inside the flat) the wall.
const CR = { sb: 0.8, ceil: 615, ang: (42 * Math.PI) / 180, u0: -644, u1: 700, d0: -70, d1: 151, dh: 490, gl: { w0: 30, w1: 170, h0: 232, h1: 440 } };
const CD = Math.cos(CR.ang), SD = Math.sin(CR.ang);
const NX = SD, NZ = CD;                                   // wall normal pointing INTO the flat
const WXZ = (u, k = 0) => [406 + u * CD + k * NX, FOC - u * SD + k * NZ];
const PXZ = (X, Z, h) => { const s = FOC / Z; return [960 + s * X, HOR + s * (EYE - h)]; };
const WP = (u, h, k = 0) => { const [X, Z] = WXZ(u, k); return PXZ(X, Z, h); };
const cbx = (X) => 960 + CR.sb * X, cby = (h) => HOR + CR.sb * (EYE - h);
const LEAF_W = CR.d1 - CR.d0;
/** Point on the door leaf: w from the free (handle) edge, h above the floor, phi opening angle (rad). */
function leafXZ(w, phi) {
  const [hx, hz] = WXZ(CR.d1), r = LEAF_W - w;
  return [hx + r * (-CD * Math.cos(phi) + SD * Math.sin(phi)), hz + r * (SD * Math.cos(phi) + CD * Math.sin(phi))];
}
const leafP = (phi) => (w, h) => { const [X, Z] = leafXZ(w, phi); return PXZ(X, Z, h); };
const wallP = (w, h) => WP(CR.d0 + w, h);

function crPal(e) {
  const base = {
    ceil: '#0e161c', ceilLit: '#33454f', wallHi: '#43575f', wallLo: '#2b3b43', band: '#1b272e', wallDark: '#121b20',
    floor: '#141d23', floorLit: '#4a5f68', tile: '#0b1216', door: '#2c3c45', doorLit: '#5b7480', casing: '#4b5f69',
    key: '#b8d6dc', haze: '#6f8c95', dark: '#04070a',
  };
  if (e <= 0) return base;
  const night = { ceil: '#070b0f', ceilLit: '#1f2b33', wallHi: '#26343c', wallLo: '#18232a', band: '#10181d', wallDark: '#080d10',
    floor: '#0b1115', floorLit: '#2c3a42', tile: '#05090c', door: '#18232a', doorLit: '#38505a', casing: '#2b3940', key: '#a9c4cc', haze: '#4a6470', dark: '#020304' };
  const o = {}; for (const k in base) o[k] = mixHex(base[k], night[k], e); return o;
}
/** Brightness 0..1 of the fluorescent tube over the door at time t for a given tubeFlicker. */
function tubeLevelAt(f, t) {
  if (f <= 0) return 1;
  const fr = Math.floor(t * 24 + 0.001);
  let v = 1 - f * 0.12 * noise1(t * 7, 3);                                   // the buzz
  const burst = noise1(t * 0.9 + 3.7, 11);                                     // now and then it stutters
  if (burst > 0.78 - 0.3 * f && hash(fr * 13 + 5) < 0.5) v *= lerp(0.7, 0.12, f) + 0.15 * hash(fr * 7 + 1);
  return clamp(v, 0.06, 1);
}
function crState(F, o = {}) {
  const t = timeOf(F, o), e = clamp(D(o, 'evening', 0));
  const open = clamp(D(o, 'doorOpen', 0)), under = clamp(D(o, 'underDoorGlow', 0)), fam = clamp(D(o, 'family', 0));
  const flick = clamp(D(o, 'tubeFlicker', 0.2));
  return {
    t, e, open, under, fam, flick, cam: o.cam, P: crPal(e),
    glass: clamp(D(o, 'glassGlow', Math.max(under, fam, open))),
    lv: tubeLevelAt(flick, t) * (1 - 0.2 * e),
    lvFar: clamp(1 - e * 1.5) * (0.92 + 0.08 * noise1(t * 3, 21)),
    phi: ease.inOutSine(open) * rad(100),
  };
}
const rad = (d) => (d * Math.PI) / 180;

function crCeilingFloor(ctx, S) {
  const P = S.P, yt = cby(CR.ceil), yb = cby(0);
  ctx.fillStyle = linGrad(ctx, 0, -200, 0, yt, [[0, P.dark], [1, mixHex(P.ceil, P.ceilLit, 0.4)]]);
  ctx.fillRect(-600, -400, 3200, yt + 400);
  glow(ctx, 1145, 110, 520, P.key, 0.12 * S.lv, 0.45);
  glow(ctx, 345, 110, 420, P.key, 0.1 * S.lvFar, 0.45);
  for (const s of [0.86, 0.95, 1.06, 1.19, 1.34]) { const y = HOR + s * (EYE - CR.ceil); line(ctx, -600, y, 2600, y, rgba(P.dark, 0.5), 1.5); }
  for (let X = -1800; X <= 1800; X += 150) { const a = PXZ(X, FOC / CR.sb, CR.ceil), b = PXZ(X, FOC / 1.5, CR.ceil); line(ctx, a[0], a[1], b[0], b[1], rgba(P.dark, 0.35), 1); }
  // floor: polished institutional lino, square tiles
  ctx.fillStyle = linGrad(ctx, 0, yb, 0, 900, [[0, mixHex(P.floor, P.floorLit, 0.25)], [1, P.floor]]);
  ctx.fillRect(-600, yb, 3200, 700);
  ctx.save(); ctx.beginPath(); ctx.rect(-600, yb, 3200, 700); ctx.clip();
  for (let X = -2400; X <= 2400; X += 74) { const a = PXZ(X, FOC / CR.sb, 0), b = PXZ(X, FOC / 2.2, 0); line(ctx, a[0], a[1], b[0], b[1], rgba(P.tile, 0.5), 1.2); }
  for (let Z = FOC / CR.sb; Z > FOC / 2.2; Z -= 74) { const y = PXZ(0, Z, 0)[1]; line(ctx, -600, y, 2600, y, rgba(P.tile, 0.45), 1.2); }
  // sheen pools under the tubes (floor is glossy), cold
  glow(ctx, 1120, 712, 520, P.key, 0.2 * S.lv, 0.16);
  glow(ctx, 1120, 704, 220, P.key, 0.12 * S.lv, 0.12);
  glow(ctx, 345, 680, 420, P.key, 0.14 * S.lvFar, 0.16);
  ctx.restore();
}

function crBackWall(ctx, S) {
  const P = S.P, yt = cby(CR.ceil), yb = cby(0), xc = WP(CR.u0, 0)[0];
  const yd = cby(300);
  ctx.save(); ctx.beginPath(); ctx.rect(-600, yt, xc + 600, yb - yt); ctx.clip();
  ctx.fillStyle = linGrad(ctx, 0, yt, 0, yd, [[0, mixHex(P.wallHi, P.wallDark, 0.35)], [1, P.wallHi]]); ctx.fillRect(-600, yt, xc + 600, yd - yt);
  ctx.fillStyle = linGrad(ctx, 0, yd, 0, yb, [[0, P.wallLo], [1, mixHex(P.wallLo, P.wallDark, 0.4)]]); ctx.fillRect(-600, yd, xc + 600, yb - yd);
  ctx.fillStyle = P.band; ctx.fillRect(-600, yd - 7, xc + 600, 8);
  // tube light on the wall
  glow(ctx, 1000, 330, 620, P.key, 0.3 * S.lv, 0.75);
  glow(ctx, 360, 330, 520, P.key, 0.26 * S.lvFar, 0.75);
  // the far end of the corridor falls into darkness
  ctx.fillStyle = linGrad(ctx, -300, 0, 700, 0, [[0, rgba(P.dark, 0.85)], [0.6, rgba(P.dark, 0.25 + 0.4 * S.e)], [1, rgba(P.dark, 0.2 * S.e)]]); ctx.fillRect(-600, yt, xc + 900, yb - yt);
  // warm bounce from the open door, low on the wall
  glow(ctx, 900, 600, 520, C.amber, 0.08 * S.open, 0.5);
  // conduit along the top of the wall, junction boxes
  ctx.fillStyle = mixHex(P.wallHi, P.dark, 0.35); ctx.fillRect(-600, cby(575), xc + 600, 5);
  for (const X of [-1100, -620, -120]) fillRR(ctx, cbx(X) - 9, cby(575) - 8, 18, 20, 2, mixHex(P.wallHi, P.dark, 0.25));
  // skirting
  ctx.fillStyle = mixHex(P.wallDark, P.dark, 0.3); ctx.fillRect(-600, yb - 9, xc + 600, 9);
  ctx.restore();
  // the neighbours' door 12-04
  const x0 = cbx(-735), x1 = cbx(-514), y0 = cby(490);
  fillRR(ctx, x0 - 10, y0 - 10, x1 - x0 + 20, yb - y0 + 10, 1, mixHex(P.casing, P.dark, 0.25));
  ctx.fillStyle = linGrad(ctx, x0, 0, x1, 0, [[0, mixHex(P.door, P.dark, 0.25)], [1, mixHex(P.door, P.doorLit, 0.25 * S.lvFar)]]); ctx.fillRect(x0, y0, x1 - x0, yb - y0);
  ctx.strokeStyle = rgba(P.dark, 0.45); ctx.lineWidth = 2; ctx.strokeRect(x0 + 16, y0 + 18, x1 - x0 - 32, (yb - y0) * 0.42); ctx.strokeRect(x0 + 16, y0 + 30 + (yb - y0) * 0.42, x1 - x0 - 32, (yb - y0) * 0.45);
  fillRR(ctx, x0 + 12, cby(250) - 3, 30, 7, 3, rgba(P.key, 0.4 * Math.max(S.lvFar, 0.3)));
  text(ctx, '12-04', (x0 + x1) / 2, y0 + 50, { size: 17, weight: 600, color: rgba(P.key, 0.45 * Math.max(S.lvFar, 0.3)), align: 'center', tracking: 2 });
  ctx.fillStyle = rgba(P.dark, 0.55); ctx.fillRect(x0 - 10, yb - 3, x1 - x0 + 20, 4);
  // a pair of shoes outside it
  for (const dx of [0, 20]) ellipse(ctx, x1 + 30 + dx, yb + 6, 10, 4, rgba(P.dark, 0.85));
  // stencilled floor number, and a fire-exit sign at the far end (dim, desaturated)
  text(ctx, 'TINGKAT 12', cbx(-210), cby(410), { size: 26, weight: 700, family: FONT.sans, color: rgba(P.dark, 0.38), align: 'center', tracking: 6 });
  fillRR(ctx, cbx(-1230), cby(540), 96, 30, 3, rgba('#1b2a24', 0.9));
  fillRR(ctx, cbx(-1230) + 4, cby(540) + 4, 88, 22, 2, rgba('#6f9a80', 0.35 + 0.1 * (1 - S.e)));
  text(ctx, 'KELUAR', cbx(-1230) + 48, cby(540) + 21, { size: 15, weight: 700, color: rgba('#0d1612', 0.85), align: 'center', tracking: 2 });
  glow(ctx, cbx(-1230) + 48, cby(540) + 15, 90, '#6f9a80', 0.12, 0.6);
  // corner
  line(ctx, xc, yt, xc, yb, rgba(P.dark, 0.5), 2);
}

/** The angled wall with the door casing. mid = true: only the part around the doorway, opening cut out. */
function crWallFace(ctx, S, mid = false) {
  const P = S.P, ua = mid ? CR.d0 - 34 : CR.u0, ub = CR.u1;
  ctx.save();
  ctx.beginPath();
  const Q = [WP(ua, CR.ceil), WP(ub, CR.ceil), WP(ub, -2), WP(ua, -2)];
  ctx.moveTo(...Q[0]); ctx.lineTo(...Q[1]); ctx.lineTo(...Q[2]); ctx.lineTo(...Q[3]); ctx.closePath();
  const O = [WP(CR.d0, CR.dh), WP(CR.d0, -2), WP(CR.d1, -2), WP(CR.d1, CR.dh)];   // opening, reversed winding
  ctx.moveTo(...O[0]); ctx.lineTo(...O[1]); ctx.lineTo(...O[2]); ctx.lineTo(...O[3]); ctx.closePath();
  ctx.clip('evenodd');
  // two-tone paint
  const up = [WP(ua, CR.ceil), WP(ub, CR.ceil), WP(ub, 300), WP(ua, 300)], lo = [WP(ua, 300), WP(ub, 300), WP(ub, -2), WP(ua, -2)];
  fillPoly(ctx, up, linGrad(ctx, 0, 0, 0, 640, [[0, mixHex(P.wallHi, P.wallDark, 0.4)], [1, P.wallHi]]));
  fillPoly(ctx, lo, linGrad(ctx, 0, 380, 0, 760, [[0, P.wallLo], [1, mixHex(P.wallLo, P.wallDark, 0.45)]]));
  fillPoly(ctx, [WP(ua, 304), WP(ub, 304), WP(ub, 296), WP(ua, 296)], P.band);
  // the tube right above lights it; it falls off toward the camera (right)
  glow(ctx, 1200, 300, 600, P.key, 0.32 * S.lv, 0.85);
  glow(ctx, 1260, 200, 260, P.key, 0.14 * S.lv, 0.9);
  ctx.fillStyle = linGrad(ctx, 1450, 0, 2000, 0, [[0, rgba(P.dark, 0)], [1, rgba(P.dark, 0.6)]]); ctx.fillRect(1400, -300, 900, 1300);
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, 260, [[0, rgba(P.dark, 0.45)], [1, rgba(P.dark, 0)]]); ctx.fillRect(800, -300, 1600, 560);
  // warm light from the doorway on the jamb side / glass glow on the wall around the door
  glow(ctx, 1300, 560, 220, C.amber, 0.12 * S.open, 0.8);
  glow(ctx, 1410, 700, 260, C.amber, 0.16 * S.under * (1 - S.open), 0.25);
  // conduit + skirting
  fillPoly(ctx, [WP(ua, 578), WP(ub, 578), WP(ub, 572), WP(ua, 572)], mixHex(P.wallHi, P.dark, 0.35));
  fillPoly(ctx, [WP(ua, 10), WP(ub, 10), WP(ub, -2), WP(ua, -2)], mixHex(P.wallDark, P.dark, 0.3));
  // door casing
  const cas = mixHex(P.casing, P.doorLit, 0.25 * S.lv);
  fillPoly(ctx, [WP(CR.d0 - 14, CR.dh + 14), WP(CR.d0, CR.dh + 14), WP(CR.d0, -2), WP(CR.d0 - 14, -2)], cas);
  fillPoly(ctx, [WP(CR.d1, CR.dh + 14), WP(CR.d1 + 14, CR.dh + 14), WP(CR.d1 + 14, -2), WP(CR.d1, -2)], mixHex(cas, P.dark, 0.25));
  fillPoly(ctx, [WP(CR.d0 - 14, CR.dh + 14), WP(CR.d1 + 14, CR.dh + 14), WP(CR.d1 + 14, CR.dh), WP(CR.d0 - 14, CR.dh)], mixHex(cas, P.key, 0.12 * S.lv));
  { const a = WP(CR.d0 - 14, CR.dh + 14), b = WP(CR.d0 - 14, 0); line(ctx, a[0], a[1], b[0], b[1], rgba(P.key, 0.3 * S.lv), 1.5); }
  // unit number and bell beside the door
  { const p = WP(CR.d0 - 44, 330), q = WP(CR.d0 - 30, 330); fillRR(ctx, p[0] - 1, p[1] - 14, q[0] - p[0] + 2, 26, 2, mixHex(P.wallHi, P.key, 0.25 * S.lv));
    ellipse(ctx, (p[0] + q[0]) / 2, p[1], 3.5, 4, rgba(P.dark, 0.7)); }
  ctx.restore();
}

/** Glass content (frosted, lit from inside, family behind it) into a scratch canvas in glass space. */
function glassCanvas(S) {
  const G = CR.gl, gw = G.w1 - G.w0, gh = G.h1 - G.h0, sc = 2;
  const { cv, ctx: c } = scratch('cr-glass', gw * sc, gh * sc);
  c.scale(sc, sc);
  const g = S.glass, f = S.fam, t = S.t;
  c.fillStyle = linGrad(c, 0, 0, 0, gh, [[0, mixHex('#24323a', '#f2b56a', g)], [0.55, mixHex('#1c2830', '#ffd08a', g)], [1, mixHex('#16212a', '#d98a45', g)]]);
  c.fillRect(0, 0, gw, gh);
  c.fillStyle = radGrad(c, gw * 0.7, gh * 0.25, 0, gw, [[0, rgba('#fff0d0', 0.55 * g)], [1, rgba('#fff0d0', 0)]]); c.fillRect(0, 0, gw, gh);
  if (f > 0) {
    const soft = (x, y, rx, ry, a) => { c.save(); c.translate(x, y); c.scale(1, ry / rx); c.fillStyle = radGrad(c, 0, 0, 0, rx, [[0, rgba('#5a2f12', a)], [0.55, rgba('#6a3a18', a * 0.8)], [1, rgba('#7a4520', 0)]]); c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore(); };
    const sw = (k) => Math.sin(t * 0.5 + k) * 1.6;
    // two adults (one taller) and the child between them, a little behind, all soft
    // bodies first (broad, solid), heads joined to them by a neck so they never read as 'eyes'
    const person = (x, y, hr, sh, a) => {
      soft(x, y + hr * 5.2, sh, hr * 4.6, a); soft(x, y + hr * 2.4, sh * 0.9, hr * 1.5, a);
      soft(x + 1, y + hr * 1.2, hr * 0.7, hr * 1.1, a * 0.9); soft(x, y, hr, hr * 1.15, a * 0.85);
    };
    person(30 + sw(0), 40, 13, 34, 0.7 * f);
    person(112 + sw(2), 30, 14, 36, 0.7 * f);
    person(70 + sw(4), 146, 10, 22, 0.75 * f);
  }
  // reeded glass: vertical ribs smear the light
  for (let x = 0; x < gw; x += 5) { c.fillStyle = rgba('#000000', 0.08); c.fillRect(x, 0, 1.6, gh); c.fillStyle = rgba('#ffffff', 0.06 * (0.3 + g)); c.fillRect(x + 2.5, 0, 1.2, gh); }
  return cv;
}
/** Map an image onto a vertical plane given by pt(w, h) (w0..w1 across, h1 at the image top). */
function planeImage(ctx, img, pt, w0, w1, h0, h1, n = 12) {
  ctx.save();
  poly(ctx, [pt(w0, h1), pt(w1, h1), pt(w1, h0), pt(w0, h0)]); ctx.clip();
  const iw = img.width, ih = img.height;
  for (let i = 0; i < n; i++) {
    const a = i / n, b = (i + 1) / n, wa = lerp(w0, w1, a), wb = lerp(w0, w1, b);
    const p00 = pt(wa, h1), p10 = pt(wb, h1), p01 = pt(wa, h0), sw = (b - a) * iw;
    ctx.save();
    ctx.transform((p10[0] - p00[0]) / sw, (p10[1] - p00[1]) / sw, (p01[0] - p00[0]) / ih, (p01[1] - p00[1]) / ih, p00[0], p00[1]);
    ctx.drawImage(img, a * iw, 0, Math.min(sw + 1, iw - a * iw), ih, 0, 0, Math.min(sw + 1, iw - a * iw), ih * 1.08);   // overdraw: the slice is a parallelogram
    ctx.restore();
  }
  ctx.restore();
}
function planeText(ctx, str, pt, w, h, o) {
  const p = pt(w, h), ex = pt(w + 1, h), ey = pt(w, h - 1);
  ctx.save(); ctx.transform(ex[0] - p[0], ex[1] - p[1], ey[0] - p[0], ey[1] - p[1], p[0], p[1]); text(ctx, str, 0, 0, o); ctx.restore();
}

/** The door leaf at the current opening angle (call inside the opening clip when it is open). */
function crLeaf(ctx, S) {
  const P = S.P, phi = S.phi, pt = leafP(phi), lv = S.lv, G = CR.gl, H = CR.dh;
  const turn = clamp(phi / rad(60));                       // as it swings in, the corridor light leaves it
  const body = mixHex(mixHex(P.door, P.doorLit, 0.35 * lv), mixHex('#3a2a1c', '#7a5530', 0.4), turn * 0.85);
  const Q = [pt(0, H), pt(LEAF_W, H), pt(LEAF_W, 0), pt(0, 0)];
  fillPoly(ctx, Q, linGrad(ctx, Q[0][0], 0, Q[1][0], 0, [[0, mixHex(body, P.doorLit, 0.25 * lv * (1 - turn))], [1, mixHex(body, P.dark, 0.3)]]));
  // lit from the tube above: brighter at the top
  ctx.save(); poly(ctx, Q); ctx.clip();
  ctx.fillStyle = linGrad(ctx, 0, Q[0][1], 0, Q[3][1], [[0, rgba(P.key, 0.14 * lv * (1 - turn))], [0.5, rgba(P.key, 0)], [1, rgba(P.dark, 0.25)]]); ctx.fillRect(1200, 100, 500, 700);
  ctx.restore();
  // recessed panels (below the glass) and kick plate
  const panel = (w0, w1, h0, h1) => { poly(ctx, [pt(w0, h1), pt(w1, h1), pt(w1, h0), pt(w0, h0)]); ctx.strokeStyle = rgba(P.dark, 0.5); ctx.lineWidth = 2; ctx.stroke();
    const a = pt(w0, h1 - 2), b = pt(w1, h1 - 2); line(ctx, a[0], a[1], b[0], b[1], rgba(P.key, 0.2 * lv * (1 - turn)), 1.2); };
  panel(30, 170, 70, 200); panel(30, 170, 470 - 18, 470);
  fillPoly(ctx, [pt(4, 44), pt(LEAF_W - 4, 44), pt(LEAF_W - 4, 6), pt(4, 6)], mixHex(body, P.key, 0.18 * lv));
  // the frosted glass panel
  const gl = glassCanvas(S);
  fillPoly(ctx, [pt(G.w0 - 6, G.h1 + 6), pt(G.w1 + 6, G.h1 + 6), pt(G.w1 + 6, G.h0 - 6), pt(G.w0 - 6, G.h0 - 6)], mixHex(body, P.dark, 0.35));
  planeImage(ctx, gl, pt, G.w0, G.w1, G.h0, G.h1, 10);
  { const a = pt(G.w0, G.h1), b = pt(G.w1, G.h1); line(ctx, a[0], a[1] + 1, b[0], b[1] + 1, rgba(P.key, 0.25 * lv), 1.2); }
  // number plate
  fillPoly(ctx, [pt(78, 488 - 14), pt(122, 488 - 14), pt(122, 456), pt(78, 456)], mixHex(body, P.key, 0.3 * lv));
  planeText(ctx, '12-05', pt, 100, 461, { size: 13, weight: 700, color: rgba(P.dark, 0.85), align: 'center', tracking: 1 });
  // lever handle + deadbolt on the free edge
  { const r = pt(16, 246), d = pt(16, 300);
    ellipse(ctx, r[0], r[1], 6, 8, mixHex(P.casing, P.key, 0.4 * lv));
    const e = pt(44, 248), e2 = pt(44, 240);
    fillPoly(ctx, [[r[0], r[1] - 3], e, e2, [r[0], r[1] + 4]], mixHex(P.casing, P.key, 0.55 * lv));
    line(ctx, r[0], r[1] - 3, e[0], e[1], rgba('#ffffff', 0.35 * lv), 1);
    ellipse(ctx, d[0], d[1], 6, 7, mixHex(P.casing, P.key, 0.35 * lv)); ellipse(ctx, d[0], d[1], 1.5, 3.5, rgba(P.dark, 0.8)); }
  // the free edge catches the warm light when it opens
  if (phi > 0.01) { const a = pt(0, H), b = pt(0, 0); line(ctx, a[0], a[1], b[0], b[1], rgba(C.honey, 0.7 * clamp(phi * 3)), 2.5); }
}

/** Behind the doorway: the warm hall of the flat. */
function crInside(ctx, S) {
  const o = S.open;
  if (o <= 0.001) return;
  const O = [WP(CR.d0, CR.dh), WP(CR.d1, CR.dh), WP(CR.d1, 0), WP(CR.d0, 0)];
  ctx.save(); poly(ctx, O); ctx.clip();
  const ins = (u, k, h) => WP(u, h, k);
  // far wall of the hall (parallel to the door wall), then its floor
  fillPoly(ctx, [ins(-500, 300, 700), ins(600, 300, 700), ins(600, 300, -10), ins(-500, 300, -10)],
    linGrad(ctx, 1260, 0, 1560, 0, [[0, '#8a5a2c'], [0.55, '#e7a656'], [1, '#ffd08a']]));
  // a coat on a hook and a small framed picture on that wall, soft
  { const a = ins(-10, 300, 360), b = ins(20, 300, 210); fillRR(ctx, a[0] - 10, a[1], 22, b[1] - a[1], 8, rgba('#4a2a12', 0.75)); }
  { const a = ins(70, 300, 380), b = ins(130, 300, 300); fillRR(ctx, a[0], a[1], b[0] - a[0], b[1] - a[1], 2, rgba('#5a3418', 0.55)); fillRR(ctx, a[0] + 4, a[1] + 4, b[0] - a[0] - 8, b[1] - a[1] - 8, 1, rgba('#ffe2b0', 0.55)); }
  fillPoly(ctx, [ins(-500, 0, 0), ins(600, 0, 0), ins(600, 300, 0), ins(-500, 300, 0)], linGrad(ctx, 0, 690, 0, 720, [[0, '#a8652c'], [1, '#6a3d1a']]));
  glow(ctx, 1500, 260, 360, C.cream, 0.55 * o);
  glow(ctx, 1450, 650, 260, C.honey, 0.35 * o, 0.4);
  ctx.restore();
}

/** Warm light from the open door falling out across the corridor floor (a wedge through the gap). */
function crSpill(ctx, S) {
  const o = S.open; if (o <= 0.001) return;
  const A = WXZ(CR.d0), Hn = WXZ(CR.d1), B = leafXZ(0, S.phi);
  for (let j = 0; j < 3; j++) {
    const Lf = [620 + (j - 1) * 60, 1960 - (j - 1) * 30];
    const ang = (p) => Math.atan2(p[1] - Lf[1], p[0] - Lf[0]);
    const aA = ang(A), aR = Math.min(ang(B), ang(Hn));
    if (aR <= aA + 0.002) continue;
    const cx = Math.cos(aR), cz = Math.sin(aR);
    const tt = (406 * SD + FOC * CD - SD * Lf[0] - CD * Lf[1]) / (SD * cx + CD * cz);
    const R = [Lf[0] + tt * cx, Lf[1] + tt * cz];
    const far = (p, a) => { const s = Math.sin(a), k = s < 0 ? Math.min(2600, (p[1] - 560) / -s) : 2600; return [p[0] + Math.cos(a) * k, p[1] + s * k]; };
    const pts = [A, R, far(R, aR), far(A, aA)].map((p) => PXZ(p[0], p[1], 0));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const m = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
    fillPoly(ctx, pts, radGrad(ctx, m[0], m[1], 0, 900, [[0, rgba(C.honey, 0.3 * o)], [0.3, rgba(C.amber, 0.15 * o)], [1, rgba(C.amber, 0)]]));
    ctx.restore();
  }
  glow(ctx, 1405, 712, 300, C.amber, 0.3 * o, 0.18);
}

function crUnderDoor(ctx, S) {
  const g = S.under * (1 - clamp(S.open * 4)); if (g <= 0.001) return;
  fillPoly(ctx, [WP(CR.d0 + 3, 5), WP(CR.d1 - 3, 5), WP(CR.d1 - 3, 0), WP(CR.d0 + 3, 0)], rgba(C.honey, 0.95 * g));
  glow(ctx, 1405, 706, 190, C.amber, 0.45 * g, 0.12);
  glow(ctx, 1405, 703, 80, C.cream, 0.4 * g, 0.12);
  // its reflection in the polished floor
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const a = WP(CR.d0 + 10, 0), b = WP(CR.d1 - 10, 0);
  fillPoly(ctx, [a, b, [b[0] - 40, b[1] + 26], [a[0] - 40, a[1] + 26]], linGrad(ctx, 0, a[1], 0, a[1] + 26, [[0, rgba(C.amber, 0.25 * g)], [1, rgba(C.amber, 0)]]));
  ctx.restore();
}

function crFloorThings(ctx, S) {
  const P = S.P, lv = S.lv;
  // doormat in front of the door
  const m = [WP(CR.d0 + 4, 0, -14), WP(CR.d1 - 4, 0, -14), WP(CR.d1 - 4, 0, -125), WP(CR.d0 + 4, 0, -125)];
  fillPoly(ctx, m, mixHex(P.floor, P.dark, 0.45));
  line(ctx, m[3][0], m[3][1], m[2][0], m[2][1], rgba(P.key, 0.12 * lv), 1.2);
  // shoe rack against the wall left of the door, family shoes on it (one small pair)
  const R = (u, h, k) => WP(u, h, k), u0 = -480, u1 = -345, col = mixHex(P.wallDark, P.dark, 0.2);
  blob(ctx, ...R((u0 + u1) / 2, 0, -30), 90, 10, P.dark, 0.7);
  for (const h of [8, 52, 96]) fillPoly(ctx, [R(u0, h + 4, -64), R(u1, h + 4, -64), R(u1, h, -64), R(u0, h, -64)], mixHex(col, P.key, 0.2 * lv));
  for (const u of [u0, u1]) { const a = R(u, 100, -64), b = R(u, 0, -64); fillRR(ctx, a[0] - 2.5, a[1], 5, b[1] - a[1], 1, col); }
  const shoe = (u, h, len, ht, c) => { const a = R(u, h + 4, -40), b = R(u + len, h + 4, -40); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    ctx.quadraticCurveTo(b[0] + 2, b[1] - ht, b[0] - (b[0] - a[0]) * 0.4, a[1] - ht * 1.1); ctx.quadraticCurveTo(a[0], a[1] - ht * 1.2, a[0], a[1]); ctx.fillStyle = c; ctx.fill(); };
  shoe(-470, 52, 62, 15, mixHex(P.dark, P.wallLo, 0.2)); shoe(-400, 52, 60, 14, mixHex(P.dark, P.wallLo, 0.3));
  shoe(-466, 96, 56, 11, mixHex(P.dark, P.wallLo, 0.25)); shoe(-396, 96, 38, 10, mixHex(P.wallLo, P.key, 0.3 * lv));
  shoe(-470, 8, 64, 16, mixHex(P.dark, P.wallLo, 0.15));
}

function crTubes(ctx, S) {
  const P = S.P;
  const tube = (X0, X1, lv) => {
    const a = PXZ(X0, FOC, CR.ceil - 6), b = PXZ(X1, FOC, CR.ceil - 6), c = PXZ(X0, FOC, CR.ceil - 22);
    fillRR(ctx, a[0] - 8, a[1] - 2, b[0] - a[0] + 16, c[1] - a[1] + 4, 3, mixHex(P.ceil, P.ceilLit, 0.6));
    fillRR(ctx, a[0], c[1] - 2, b[0] - a[0], 9, 4.5, mixHex(mixHex(P.ceil, P.ceilLit, 0.8), '#f2fbff', clamp(lv)));
    if (lv > 0.02) { glow(ctx, (a[0] + b[0]) / 2, c[1] + 3, (b[0] - a[0]) * 0.75, P.key, 0.45 * lv, 0.22); glow(ctx, (a[0] + b[0]) / 2, c[1] + 3, (b[0] - a[0]) * 0.4, '#ffffff', 0.25 * lv, 0.12); }
  };
  tube(40, 330, S.lv);
  tube(-760, -470, S.lvFar);
}

export const corridor = {
  W: 1920,
  floorY: 700,
  anchors: {
    adam: { x: 1236, y: 700 }, lean: { x: 1290, y: 700 }, forehead: { x: 1364, y: 316 }, knock: { x: 1362, y: 392 },
    handle: { x: 1317, y: 455 }, doorway: { x: 1430, y: 702 }, inside: { x: 1530, y: 704 }, doorCentre: { x: 1408, y: 455 },
    glass: { x: 1395, y: 366 }, underDoor: { x: 1405, y: 703 }, tube: { x: 1145, y: 102 }, neighbourDoor: { x: 548, y: 700 }, far: { x: 300, y: 700 },
  },
  lights: { corridor: { key: '#b8d6dc', from: -1, amount: 0.45 } },
  tubeLevel(o = {}, t) { return crState(null, { ...o, t: t ?? o.t ?? 0 }).lv; },
  /** The rim light Adam should get right now (cold from the tube behind him, warm from the door once it opens). */
  light(o = {}, t) {
    const S = crState(null, { ...o, t: t ?? o.t ?? 0 });
    if (S.open > 0.15) return { key: C.honey, from: 1, amount: clamp(0.35 + 0.6 * S.open) };
    if (S.glass > 0.5 && S.fam > 0.5) return { key: C.amber, from: 1, amount: 0.3 };
    return { key: S.P.key, from: -1, amount: 0.45 * S.lv };
  },

  back(ctx, F, o = {}) {
    const S = crState(F, o);
    ctx.save();
    ctx.fillStyle = S.P.ceil; ctx.fillRect(0, 0, PW, PH);
    camera(ctx, S.cam, 1, () => {
      crCeilingFloor(ctx, S);
      crBackWall(ctx, S);
      crWallFace(ctx, S, false);
      crInside(ctx, S);
      if (S.phi > 0.001) { ctx.save(); poly(ctx, [WP(CR.d0, CR.dh), WP(CR.d1, CR.dh), WP(CR.d1, 0), WP(CR.d0, 0)]); ctx.clip(); crLeaf(ctx, S); ctx.restore(); }
      else crLeaf(ctx, S);
      crUnderDoor(ctx, S);
      crSpill(ctx, S);
      crFloorThings(ctx, S);
      crTubes(ctx, S);
    });
    ctx.restore();
  },

  /** Re-draws the wall around the doorway: draw a figure INSIDE the flat before this, Adam after. */
  mid(ctx, F, o = {}) {
    const S = crState(F, o);
    ctx.save(); camera(ctx, S.cam, 1, () => crWallFace(ctx, S, true)); ctx.restore();
  },

  front(ctx, F, o = {}) {
    const S = crState(F, o), P = S.P, t = S.t;
    ctx.save();
    camera(ctx, S.cam, 1, () => {
      // the tube's bloom and a faint cone of light under it
      glow(ctx, 1145, 102, 300, P.key, 0.16 * S.lv, 0.6);
      lightCone(ctx, 1145, 110, Math.PI / 2, 1.5, 560, P.key, 0.05 * S.lv);
      if (S.lvFar > 0.02) glow(ctx, 345, 102, 240, P.key, 0.12 * S.lvFar, 0.6);
      fog(ctx, t, 330, 260, P.haze, 0.035, 7, 6);
      // warm: the glass, the open door
      glow(ctx, 1395, 366, 170, C.amber, 0.14 * S.glass * (1 - S.open), 1.2);
      if (S.open > 0.001) {
        glow(ctx, 1420, 420, 420, C.amber, 0.22 * S.open, 1.1);
        lightCone(ctx, 1440, 330, rad(158), 0.75, 900, C.honey, 0.07 * S.open);
      }
      // dust in the tube light
      for (let i = 0; i < 12; i++) {
        const x = 980 + hash(i * 7 + 2) * 360 + Math.sin(t * 0.2 + i) * 20, y = 140 + ((hash(i * 3) * 400 + t * (4 + hash(i) * 6)) % 420);
        glow(ctx, x, y, 2 + hash(i * 5) * 2, '#ffffff', 0.18 * S.lv * (0.5 + 0.5 * Math.sin(t + i)));
      }
    });
    // flicker dims the whole place; evening darkens the far end
    if (S.lv < 0.995) { ctx.fillStyle = rgba(P.dark, (1 - S.lv) * 0.3); ctx.fillRect(0, 0, PW, PH); }
    if (S.e > 0) { ctx.fillStyle = linGrad(ctx, 0, 0, PW, 0, [[0, rgba(P.dark, 0.55 * S.e)], [0.5, rgba(P.dark, 0.1 * S.e)], [1, rgba(P.dark, 0.25 * S.e)]]); ctx.fillRect(0, 0, PW, PH); }
    ctx.restore();
  },
};
