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
//    A small plain bedroom seen side-on as a "box set": back wall, a left wall with the door,
//    and the RIGHT wall (in perspective) carrying the window with venetian blinds. The blinds
//    rake soft slanted stripes of light across the back wall, right behind the bed. Double bed
//    side-on, head at the RIGHT; bedside table (clock, glass, charger) right of the headboard;
//    a chair with yesterday's shirt and tie; wardrobe at the left.
//    looks:   'predawn' (cold blue, default) | 'golden' (first warm edge of sunrise)
//    state:   wifeAsleep  0|1   (default 1)  sleeping figure-shaped mound under the duvet on the far side
//             clockTime   '5:45' (default)   time shown on the little clock on the bedside table
//             clockGlitch 0..1  (default 0)  that clock glitching
//             phoneOnTable 0|1  (default 1)  a phone lying on the bedside table, on the charger
//             light       0..1  (default 1)  strength of the window light (stripes, glow) — dim it for inserts
//             dust        0..1  (default 1)  dust motes in the beams
//    anchors (world px; y = the surface a thing rests on):
//             sit      {x: 760, y: 582}   Adam's HIP point, sitting on the near edge of the bed facing right.
//                                         The edge is straight: any x from 620 to 960 works at y = 582.
//             feet     {x: 860, y: 700}   where his feet rest on the rug when sitting at `sit`
//             stand    {x: 1010, y: 700}  standing beside the bed (between bed and camera), on the rug
//             pillow   {x: 1022, y: 566}  Adam's own pillow (near side, dented) — where his head was
//             wifeHead {x: 1012, y: 548}  centre of the sleeping wife's head (far pillow)
//             wifeShoulder {x: 940, y: 480} top of the mound at her shoulder
//             tableTop {x: 1163, y: 552}  centre of the bedside-table top
//             clock    {x: 1146, y: 552}  the alarm clock (bottom-centre), 40 px wide in the wide shot
//             phone    {x: 1190, y: 552}  the phone on the table
//             window   {x: 1680, y: 330}  centre of the window (the light source)
//             door     {x: 180, y: 700}   the bedroom door in the left wall (exit to the hall)
//    extra:   bedroom.backdrop(ctx, F, {look, zoom, x, y, dim})  — a pre-blurred, darkened picture of the
//             bedroom for use behind an insert (the phone in a1_03). Fills the picture; no camera needed.
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
//    The cold institutional corridor outside the flat. The long back wall runs flat across the
//    left of frame; right of centre the wall with the family's FRONT DOOR is turned ~42° toward
//    camera, so the door is seen from the corridor side AND a figure in profile can stand facing
//    it, touch it and lean on it: the door's surface meets the plane the characters stand in along
//    the vertical line x = 1366. A reeded frosted-glass sidelight is right of the door.
//    look:    'corridor' (only)
//    state:   doorOpen      0..1 (default 0)   door swings inward (hinges on its right edge); warm honey light
//                                              pours out over floor, wall and into the air
//             underDoorGlow 0..1 (default 0)   warm strip under the closed door (+ its reflection)
//             family        0..1 (default 0)   three soft warm shapes (two adults and a child) behind the frosted glass
//             glassGlow     0..1 (default max(underDoorGlow, family, doorOpen))  how lit the frosted glass is
//             tubeFlicker   0..1 (default 0.2) buzz / flicker of the fluorescent tube over the door
//             evening       0..1 (default 0)   a5_01: deepens the corridor, the far tube dies
//    anchors: adam      {x: 1236, y: 700}  Adam standing in front of his door, facing right (an arm's length away)
//             lean      {x: 1300, y: 700}  his feet when he leans his forehead against the door
//             forehead  {x: 1364, y: 318}  the point on the door his forehead touches (door plane, x = 1366)
//             knock     {x: 1362, y: 392}  where his knuckles hit the door
//             handle    {x: 1318, y: 462}  the door handle
//             doorway   {x: 1408, y: 701}  feet of a figure standing in the open doorway, facing left
//             inside    {x: 1500, y: 705}  a step back / aside inside the flat (draw the figure, then corridor.mid())
//             doorCentre {x: 1392, y: 455} centre of the door
//             glass     {x: 1645, y: 430}  centre of the frosted sidelight
//             underDoor {x: 1392, y: 703}  middle of the gap under the door
//             tube      {x: 1150, y: 96}   the fluorescent tube
//    extra:   corridor.tubeLevel(o, t) -> 0..1   brightness of the tube right now (flicker the character's rim with it)
//             corridor.light(o, t) -> {key, from, amount}   the rim light Adam should get right now
//             corridor.mid(ctx, F, o)   re-draws the wall around the door opening: draw a figure who is INSIDE
//                                        the flat (doorway / inside anchors) before it, and Adam after it.
// ═══════════════════════════════════════════════════════════════════════════════════════════
import {
  PW, PH, TAU, clamp, lerp, ease, hash, noise1, rgba, mixHex, rr, fillRR, linGrad, radGrad, glow, cached, camera, text, FONT,
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
