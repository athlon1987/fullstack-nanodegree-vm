// ═══════════════════════════════════════════════════════════════════════════════════════════
// THE REPLACEMENT — set module "night": two locations.
//   bench       — a3_05 a3_09 a3_10 (rainNight) · a4_01 a4_02 a4_03 a4_05 (greyDawn)
//   policeStop  — a3_01 a3_02 (policeNight)
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
//   import { bench, policeStop, policeLight } from '../sets/night.js';
//   const o = { look: 'rainNight', cam, lamp: 1, rain: 1 };     // one options object for every call
//   bench.back(ctx, F, o);                                      // sky, city, road, car, pavement, lamp, bench back+seat
//   camera(ctx, cam, 1, () => { /* characters, lunchbox, phone */ });
//   bench.front(ctx, F, o);                                     // seat front edge + front legs, rain, bloom, mist
//   (mid() exists on both locations and is a no-op: there is no background staging plane.)
//
// o = { look, cam: {x,y,zoom,rot} (identity by default), t: seconds for ambient life (default F.t), ...state }
// PERSPECTIVE: horizon y = 430; something at parallax depth d stands on y = 430 + 270·d (d = 1 → 700).
// Every layer applies the camera itself (sky 0.1, city 0.22–0.36, far wall 0.42, road 0.55, car 0.57,
// pavement / bench / lamp 1.0, foreground rain 1.0–1.35), so camera moves have parallax. Rain is laid
// out in screen space (its density stays right at any zoom) but drifts with the camera's parallax.
//
// ───────────────────────────────────────────────────────────────────────────────────────────
// 1. bench — a public bench on a wide wet pavement, a tall sodium STREETLIGHT just behind/left of it,
//    a road behind, a low embankment wall with a railing beyond the road, the city beyond that.
//    W 1920 (painted from about x −700 to 2600 so the camera can pan ±500). floorY 700.
//    The bench is seen long side on (stage-like): x 572–1032, seat top y 590 (110 px above the floor,
//    use POSE.* with seat: 110 and pose.y = 700). Backrest = three lit slats y 486–542 with gaps that
//    show the bright haze through them; the seat front edge and front legs are drawn in front().
//
//    LOOKS
//    rainNight  steady rain, sodium cone + pool of light from the lamp (lamp 0..1), wet pavement with the
//               lamp's broken reflection, puddles with ripples, splash specks, the city dissolved into
//               cool-blue bokeh with a few warm discs, a low cool city-glow haze at the horizon that keeps
//               figures readable even at lamp = 0. Brightest point: the lamp head / its cone.
//    greyDawn   rain stopped. White-grey sky, misty pale city, wet ground and puddles mirroring the sky,
//               colour drained, lamp off. Brightest area: the sky low behind the bench.
//
//    STATE VALUES (all optional plain numbers)
//      lamp   0..1   streetlight brightness. Default 1 in rainNight, 0 in greyDawn. Flicker it yourself
//                    (a3_10: stutter around ev flicker, 0 at ev off). At 0 the city glow still reads.
//      rain   0..1   rain amount (streaks, splashes, ripples). Default 1 in rainNight, 0 in greyDawn.
//      carX   number|null  world x of the CENTRE of the dark car in the road behind the bench, or null
//                    (no car). Default null. The car faces LEFT (it drives in from the right):
//                    arrive from carX ≈ 2700 and stop at carX = 1480 (its nose is then at x ≈ 1130,
//                    its body spans ≈ 1130–1830, low beams pooling on the road ahead of it).
//                    Works in both looks (dim white running lights; no red anywhere).
//      carLights 0..1  the car's running lights + low beams. Default 1.
//      mist   0..1   ground mist / veil over the far city. Default 0.65 in greyDawn, 0.3 in rainNight.
//      t      sec    ambient time (rain, ripples, bokeh twinkle, far traffic, mist drift). Default F.t.
//
//    ANCHORS (world px; y is where a thing rests)
//      seatL      {x: 640,  y: 590}   left seat top — Adam sits here facing RIGHT: drawFigure pose
//                                     {x: 640, y: 700, seat: 110, facing: 1}
//      seatR      {x: 962,  y: 590}   right seat top — the representative, facing LEFT ({x: 962, y: 700,
//                                     seat: 110, facing: -1}); leaves a clear gap between the knees
//      seatMid    {x: 760,  y: 590}   seat beside Adam — the lunchbox in a3_05 (base on y 590)
//      standFront {x: 840,  y: 700}   standing in front of the bench, over Adam (rep, facing left, a4_01)
//      twoShot    {x: 801,  y: 700}   ground point centred between the seats (aim close two-shots here)
//      lampHead   {x: 588,  y: 160}   centre of the streetlight's lens (light comes from here)
//      lampBase   {x: 470,  y: 690}   foot of the lamp post (behind the bench's left end)
//      bin        {x: 318,  y: 700}   litter bin left of the lamp post (lid top y 520)
//      carStop    {x: 1480, y: 585}   car centre / road contact when stopped (depth 0.57); its kerbside
//                                     door is around x 1400 — the rep then walks in on y 700 from the right
//      enterR     {x: 2050, y: 700}   off-screen right on the pavement
//
//    LIGHT ON CHARACTERS  bench.lights[look] = {key, from, amount} (rim at the seats):
//      rainNight  key '#ffa64d' from −1 (lamp above-LEFT), amount 0.85 × lamp (bench.lightAt scales it)
//      greyDawn   key '#e2e7ee' from +1 (brighter sky to the right), amount 0.4
//    bench.lightAt(look, x, o) → {key, color, from, amount} for any world x (sodium falls off away from
//    the lamp; when lamp = 0 it returns a faint cool city rim '#5c79a8'). `color` is the same as `key`
//    so the result can go straight into drawFigure's opts.light.
//
//    RECOMMENDED FRAMINGS
//      a3_05 wide       cam {x: 900, y: 380, zoom: 1.0 → 1.08} drift in toward x 760 (Adam small,
//                       lamp at upper left third, lots of rain and city)
//      a3_09 tight      cam {x: 700, y: 410, zoom: 2.5} (Adam seated at seatL, head ≈ (650, 395));
//                       soft bokeh + streaks + warm rim from above-left. Keep the PIP clear of x>900.
//      a3_10 wide       as a3_05 at zoom ~1.06; animate lamp: 1 → stutter → 0
//      a4_01 wide       cam {x: 980, y: 400, zoom: 1.0 → 1.05}; carX 2700 → 1480 from ev car (ease out)
//      a4_02 two-shot   cam {x: 801, y: 430, zoom: 1.6}
//      a4_03 closer     cam {x: 801, y: 410, zoom: 2.1} (both profiles, the gap between them centred)
//      a4_05 two-shot   cam {x: 800, y: 425, zoom: 1.7}
//
// ───────────────────────────────────────────────────────────────────────────────────────────
// 2. policeStop — a narrow night street, side-on. Across the street: a brick facade with a SHUTTERED
//    SHOP (x 250–820), a recessed door with a cold caged wall lamp (x 980–1100), a drainpipe, upper
//    windows (one dimly lit), a FIRE ESCAPE (x 1150–1700, platform y 230) and a drop ladder. In front:
//    the far pavement, a kerb, the wet road where everyone stands (y 700), a steaming GRATE (x 905).
//    A PATROL CAR is parked at the right facing left (depth 0.88, nose at x ≈ 1252, light bar at
//    x ≈ 1833, y ≈ 372); its roof bar throws alternating RED and BLUE washes that travel right→left
//    across the wall, the shutter, the road and the steam; low beams light the road toward Adam.
//    W 1920 (painted from x −700 to 2600). floorY 700. Look: policeNight only.
//
//    STATE VALUES
//      police  0..1   strength of the light bar and its washes. Default 1.
//      phase   number override for the light cycle (seconds); default = o.t (so it runs by itself).
//      steam   0..1   steam from the grate. Default 1.
//      rain    0..1   optional drizzle (same rain as the bench). Default 0.
//      t       sec    ambient time. Default F.t.
//
//    LIGHT CYCLE  period 1.0 s: RED wash travels right→left during 0–0.5, BLUE during 0.5–1.0
//      (peaks at t%1 = 0.25 red and 0.75 blue). policeLight(t, x = 560) → {color, key, from: 1,
//      amount, red, blue} gives the rim for a figure at world x at that instant — pass o.phase ?? t.
//      Feed it to drawFigure as opts.light. Both phases come from the right (the car), so from = +1.
//      policeStop.lights.policeNight = {key '#8aa2d0', from 1, amount 0.3} is the cold ambient rim to
//      use for the officers' far side / between pulses.
//
//    ANCHORS
//      adam      {x: 560,  y: 700}   Adam stands here facing RIGHT (shutter + lit fascia behind him)
//      officer1  {x: 1010, y: 700}   first officer, facing LEFT (wall lamp + door behind)
//      officer2  {x: 1150, y: 700}   second officer, facing LEFT (car nose starts at x 1252)
//      grate     {x: 905,  y: 745}   steam source on the road between them
//      lightBar  {x: 1833, y: 372}   centre of the roof light bar
//      wallLamp  {x: 1040, y: 382}   caged bulb over the door
//      faceCU    {x: 640,  y: 300}   camera centre for the a3_02 profile close-up (zoom 2.6): Adam's
//                                    head is left of centre, the fascia/shutter behind it takes the washes
//
//    RECOMMENDED FRAMINGS
//      a3_01 master     cam {x: 900, y: 400, zoom: 1.0 → 1.05} + a little handheld
//      a3_01 scanner    cam {x: 820, y: 360, zoom: 1.5} (officer1's arm reaching toward Adam)
//      a3_02 close-up   cam {x: 640, y: 300, zoom: 2.6} (head ≈ (600, 300)), handheld 2 px
//
// COST (back+front, measured): bench rainNight ≈ 21 ms, bench greyDawn ≈ 15 ms, policeStop ≈ 19 ms.
// The far city, the bokeh field and (in wide police framings) the brickwork are cached; everything
// that may be seen close (bench, lamp, cars, facade details, puddles, rain) is vector.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import {
  PW, PH, CX, CY, TAU, clamp, lerp, hash, noise1, wobble, rgba, mixHex, linGrad, radGrad,
  glow, lightCone, fog, cached, scratch, camera, rng,
} from '../engine.js';
import { LOOK, C } from '../style.js';

// ───────────────────────────── shared helpers ─────────────────────────────
const HOR = 430;
const SOD = C.sodium;            // '#ffa64d'
const RED = C.policeRed, BLUE = C.policeBlue;

/** World → screen for a camera at parallax depth d (rotation ignored). */
function toScreen(cam, d, x, y) {
  const { x: cx = CX, y: cy = CY, zoom = 1 } = cam || {};
  const z = 1 + (zoom - 1) * d;
  return { x: CX + z * (x - CX - (cx - CX) * d), y: CY + z * (y - CY - (cy - CY) * d), z };
}
/** Visible world rectangle at depth d (padded, generous for rotation). */
function visRect(cam, d, pad = 80) {
  const { x: cx = CX, y: cy = CY, zoom = 1, rot = 0 } = cam || {};
  const z = 1 + (zoom - 1) * d, e = Math.abs(rot) * 1000 + pad;
  return {
    x0: (-e - CX) / z + CX + (cx - CX) * d, x1: (PW + e - CX) / z + CX + (cx - CX) * d,
    y0: (-e - CY) / z + CY + (cy - CY) * d, y1: (PH + e - CY) / z + CY + (cy - CY) * d,
  };
}
const poly = (ctx, pts) => {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
};
/** Smooth closed path through points (quadratic midpoints). */
function smooth(ctx, pts) {
  const n = pts.length;
  ctx.beginPath();
  const m0 = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2];
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  ctx.closePath();
}

/** A light cone with soft edges: several nested cones of decreasing spread. */
function softCone(ctx, x, y, ang, spread, len, col, a) {
  for (let i = 0; i < 3; i++) lightCone(ctx, x, y, ang, spread * (0.45 + 0.27 * i), len * (0.86 + 0.07 * i), col, a / 2.4);
}

// ───────────────────────────── rain (shared) ─────────────────────────────
/**
 * Screen-space rain at parallax depths. layers: [{d, n, seed}]. light: {x, y, k, col} world lamp
 * (streaks inside its cone are drawn brighter). dim: colour of unlit streaks.
 */
function drawRain(ctx, S, layers, light, dim) {
  if (S.rain <= 0.01) return;
  const cam = S.cam || {}, zoom = cam.zoom ?? 1, cx = cam.x ?? CX, cy = cam.y ?? CY;
  const L = light && light.k > 0.01 ? toScreen(cam, 1, light.x, light.y) : null;
  ctx.save();
  ctx.lineCap = 'round';
  const slant = 0.12;
  for (const ly of layers) {
    const d = ly.d, z = 1 + (zoom - 1) * d;
    const N = Math.round(ly.n * S.rain);
    const len0 = (16 + 34 * d) * Math.pow(z, 0.75), sp = (1500 + 1300 * d) * Math.pow(z, 0.5);
    const ox = -(cx - CX) * d * z, oy = -(cy - CY) * d * z;
    const WW = PW + 300, HH = PH + 340;
    const B = [[], [], [], []];
    for (let i = 0; i < N; i++) {
      const s = ly.seed * 7919 + i * 3;
      const h1 = hash(s), h2 = hash(s + 1), h3 = hash(s + 2);
      const len = len0 * (0.75 + 0.5 * h3);
      const y = ((((h2 * HH + S.t * sp * (0.88 + 0.24 * h3) + oy) % HH) + HH) % HH) - 170;
      const x = ((((h1 * WW + ox + y * slant) % WW) + WW) % WW) - 150;
      let b = 0;
      if (L) {
        const dy = y - L.y;
        if (dy > -20 * L.z) {
          const half = 26 * L.z + Math.max(0, dy) * 0.62, dx = Math.abs(x - L.x - dy * 0.03);
          if (dx < half) b = Math.pow(1 - dx / half, 0.8) * clamp(1.3 - Math.max(0, dy) / (760 * L.z)) * light.k;
        }
      }
      B[b > 0.5 ? 3 : b > 0.26 ? 2 : b > 0.07 ? 1 : 0].push(x, y, len);
    }
    const lw = (0.6 + 0.9 * d) * Math.pow(z, 0.5);
    const cols = [
      [dim, 0.07 + 0.11 * d],
      [light ? light.col : dim, 0.16 + 0.12 * d],
      [light ? light.col : dim, 0.28 + 0.18 * d],
      [light ? '#ffe2bd' : dim, 0.42 + 0.25 * d],
    ];
    for (let k = 0; k < 4; k++) {
      const arr = B[k]; if (!arr.length) continue;
      ctx.beginPath();
      for (let j = 0; j < arr.length; j += 3) {
        const x = arr[j], y = arr[j + 1], l = arr[j + 2];
        ctx.moveTo(x - slant * l, y - l); ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(cols[k][0], cols[k][1]);
      ctx.lineWidth = lw * (k === 3 ? 1.15 : 1);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ───────────────────────────── cars ─────────────────────────────
// Local coordinates: x from −600 (FRONT, facing left) to +600, y = 0 on the ground, up is negative.
const SLEEK = {
  body: [[-598, -46], [-608, -86], [-600, -116], [-566, -134], [-330, -154], [-215, -172], [-70, -300], [30, -318], [210, -316],
    [360, -280], [520, -204], [592, -188], [608, -150], [604, -62], [590, -44]],
  glass: [[-190, -184], [-66, -294], [32, -308], [206, -306], [342, -272], [474, -208], [472, -196], [-180, -192]],
  wheels: [-380, 380], wr: 86, belt: -196, pillar: 150,
};
const PATROL = {
  body: [[-588, -48], [-598, -98], [-590, -138], [-560, -150], [-300, -166], [-190, -176], [-86, -298], [20, -312], [262, -312],
    [366, -292], [446, -190], [578, -180], [596, -150], [592, -58], [578, -46]],
  glass: [[-170, -186], [-80, -290], [22, -302], [258, -302], [352, -284], [418, -196]],
  wheels: [-360, 380], wr: 84, belt: -190, pillar: 120,
};

/** Draw a car body in local coords (call inside translate/scale). pal: {body, glass, glassHi, wheel, rim, sheen, sheenA, stripe} */
function drawCarBody(ctx, M, pal) {
  // wheels first (arches are dark wells cut into the body by drawing them after)
  ctx.fillStyle = pal.body;
  smooth(ctx, M.body); ctx.fill();
  // sheen along the shoulder (sky / light reflected on the upper body)
  ctx.save();
  smooth(ctx, M.body); ctx.clip();
  ctx.fillStyle = linGrad(ctx, 0, -330, 0, -40, [[0, rgba(pal.sheen, pal.sheenA * 0.9)], [0.42, rgba(pal.sheen, pal.sheenA * 0.55)],
    [0.5, rgba(pal.sheen, 0.02)], [0.62, rgba(pal.sheen, pal.sheenA * 0.25)], [1, rgba(pal.sheen, 0)]]);
  ctx.fillRect(-620, -340, 1240, 300);
  // shoulder crease highlight
  ctx.strokeStyle = rgba(pal.sheen, pal.sheenA * 1.1); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-560, -132); ctx.quadraticCurveTo(0, M.belt + 22, 560, M.belt + 8); ctx.stroke();
  if (pal.stripe) { ctx.fillStyle = pal.stripe; ctx.fillRect(-600, -112, 1200, 14); }
  // door lines
  ctx.strokeStyle = rgba('#000000', 0.35); ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-200, M.belt + 4); ctx.lineTo(-206, -58);
  ctx.moveTo(M.pillar, M.belt + 2); ctx.lineTo(M.pillar - 4, -56);
  ctx.stroke();
  ctx.restore();
  // glass
  ctx.fillStyle = pal.glass; poly(ctx, M.glass); ctx.fill();
  ctx.save(); poly(ctx, M.glass); ctx.clip();
  ctx.fillStyle = linGrad(ctx, 0, -320, 0, -185, [[0, rgba(pal.glassHi, 0.5)], [0.55, rgba(pal.glassHi, 0.12)], [1, rgba(pal.glassHi, 0.02)]]);
  ctx.fillRect(-300, -330, 900, 160);
  ctx.fillStyle = pal.body; ctx.fillRect(M.pillar - 8, -330, 18, 150);   // B-pillar
  ctx.restore();
  // wheel wells + wheels
  for (const wx of M.wheels) {
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(wx, -M.wr, M.wr + 12, Math.PI, 0); ctx.lineTo(wx + M.wr + 12, -40); ctx.lineTo(wx - M.wr - 12, -40); ctx.fill();
    ctx.fillStyle = pal.wheel; ctx.beginPath(); ctx.arc(wx, -M.wr, M.wr, 0, TAU); ctx.fill();
    ctx.fillStyle = pal.rim; ctx.beginPath(); ctx.arc(wx, -M.wr, M.wr * 0.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(pal.sheen, pal.sheenA * 0.8); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(wx, -M.wr, M.wr * 0.6, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
    ctx.fillStyle = pal.wheel;
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU + 0.3;
      ctx.beginPath(); ctx.ellipse(wx + Math.cos(a) * M.wr * 0.34, -M.wr + Math.sin(a) * M.wr * 0.34, M.wr * 0.1, M.wr * 0.2, a, 0, TAU); ctx.fill();
    }
  }
  // side mirror
  ctx.fillStyle = pal.body;
  ctx.beginPath(); ctx.ellipse(-200, -196, 26, 13, -0.2, 0, TAU); ctx.fill();
}

// ═════════════════════════════════════ 1. BENCH ═════════════════════════════════════
const BX0 = 572, BX1 = 1032, BXM = 802, SEAT_Y = 590;
const LAMP = { x: 588, y: 160, pole: 470, base: 690 };
const BIN = { x: 318, w: 62, top: 520 };
const CAR_D = 0.574, CAR_Y = HOR + 270 * CAR_D;   // ≈ 585
const WALL_D = 0.42, WALL_BASE = 543, WALL_TOP = 488;
const PUDDLES = [[870, 752, 175, 12], [318, 728, 112, 8], [1430, 772, 220, 15], [1735, 716, 120, 7], [110, 786, 170, 13], [-330, 742, 150, 10], [2160, 760, 180, 12]];

const BSPEC = {
  rainNight: {
    dark: true,
    sky: [[0, '#02050b'], [0.35, '#050b17'], [0.56, '#0d1a2f'], [0.66, '#1b2d4b'], [0.74, '#16253d'], [1, '#0a1220']],
    haze: '#3a5078', hazeA: 0.34,
    wall: '#0b1322', coping: '#1d2a42', rail: '#070c15', railHi: '#33496e',
    road: ['#0b1424', '#060a13'], lane: '#5c79a8', laneA: 0.12,
    kerb: '#18233a', kerbFace: '#0a111d',
    pave: ['#111c2e', '#0a111e', '#070b14'], seam: '#03060b', seamA: 0.55,
    puddle: ['#162540', '#0b1322'],
    wood: '#1d1813', woodTop: '#2a2119', iron: '#06080c', ironHi: '#2b3650',
    pole: '#0a0e15', bin: '#0b1019', binHi: '#24324b',
    car: { body: '#07090d', glass: '#05070b', glassHi: '#5c79a8', wheel: '#030406', rim: '#0c0f15', sheen: '#7f9fd0', sheenA: 0.18 },
    rainDim: '#8ea6cc', mistCol: '#3a4f72',
    defaults: { lamp: 1, rain: 1, mist: 0.3 },
  },
  greyDawn: {
    dark: false,
    sky: [[0, '#8592a4'], [0.3, '#a9b4c2'], [0.56, '#d3d9e0'], [0.66, '#e4e8ed'], [0.8, '#d6dce3'], [1, '#c3cad3']],
    haze: '#e1e6ec', hazeA: 0.4,
    wall: '#7c8796', coping: '#a9b3c0', rail: '#4d5767', railHi: '#c4ccd6',
    road: ['#a5afbb', '#58626f'], lane: '#e6ebf0', laneA: 0.35,
    kerb: '#a3adb9', kerbFace: '#4e5866',
    pave: ['#aab3be', '#68727f', '#3b434e'], seam: '#2a313b', seamA: 0.4,
    puddle: ['#c9d0d8', '#9ea8b4'],
    wood: '#1f232b', woodTop: '#3e4550', iron: '#0f1218', ironHi: '#8994a2',
    pole: '#1d222a', bin: '#262c35', binHi: '#8d97a5',
    car: { body: '#0b0d12', glass: '#141920', glassHi: '#e2e7ee', wheel: '#050608', rim: '#1a1f27', sheen: '#e8edf3', sheenA: 0.28 },
    rainDim: '#c9d0d8', mistCol: '#dfe4ea',
    defaults: { lamp: 0, rain: 0, mist: 0.65 },
  },
};

function resolveBench(F, o = {}) {
  const look = BSPEC[o.look] ? o.look : 'rainNight';
  const sp = BSPEC[look], d = sp.defaults;
  const t = o.t ?? (F ? F.t : 0);
  const lamp = clamp(o.lamp ?? d.lamp);
  return {
    look, sp, t, cam: o.cam || null, dark: sp.dark,
    lamp, lampK: lamp * (1 + 0.015 * wobble(t, 9, 3)),
    rain: clamp(o.rain ?? d.rain), mist: clamp(o.mist ?? d.mist),
    carX: o.carX ?? null, carLights: clamp(o.carLights ?? 1),
  };
}

// ── far city (cached, soft) ──
function cityRain() {
  return cached('night.city.rain', 2900, 640, (c, w, h) => {
    const r = rng(41);
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const t = tmp.getContext('2d');
    // tower silhouettes, two ranks
    for (const rank of [0, 1]) {
      let x = 0;
      while (x < w) {
        const bw = 60 + r() * 150, top = rank ? 250 + r() * 180 : 140 + r() * 220;
        t.fillStyle = rank ? '#0c1729' : '#0b1526';
        t.fillRect(x, top, bw, h - top);
        // windows: sparse cool dots, a few warm
        for (let yy = top + 12; yy < 520; yy += 13) for (let xx = x + 8; xx < x + bw - 8; xx += 11) {
          const q = r();
          if (q < 0.06) { t.fillStyle = r() < 0.12 ? rgba('#ffb561', 0.45) : rgba(r() < 0.5 ? '#6f86a8' : '#a9bcd6', 0.25 + r() * 0.35); t.fillRect(xx, yy, 5, 6); }
        }
        x += bw + r() * 20;
      }
    }
    c.filter = 'blur(7px)'; c.drawImage(tmp, 0, 0); c.filter = 'none';
    // city glow rising behind the towers' feet
    c.fillStyle = linGrad(c, 0, 300, 0, 560, [[0, rgba('#1b2d4b', 0)], [1, rgba('#2a4064', 0.55)]]);
    c.fillRect(0, 300, w, 340);
    // bokeh discs
    const bt = document.createElement('canvas'); bt.width = w; bt.height = h;
    const b = bt.getContext('2d');
    b.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 95; i++) {
      const x = r() * w, y = 470 - Math.pow(r(), 1.6) * 210 + (r() - 0.5) * 40, rad = 5 + Math.pow(r(), 2.4) * 40;
      const warm = r() < 0.13;
      const col = warm ? (r() < 0.5 ? '#ffa64d' : '#ffd08a') : ['#7f9fd0', '#a9bcd6', '#4a68a8', '#5c79a8', '#d5deea'][Math.floor(r() * 5)];
      const a = ((warm ? 0.2 : 0.1) + r() * 0.22) * (rad > 25 ? 0.6 : 1);
      b.fillStyle = rgba(col, a); b.beginPath(); b.arc(x, y, rad, 0, TAU); b.fill();
      b.strokeStyle = rgba(col, a * 0.7); b.lineWidth = 1.6; b.beginPath(); b.arc(x, y, rad - 1, 0, TAU); b.stroke();
    }
    c.filter = 'blur(2.6px)'; c.drawImage(bt, 0, 0); c.filter = 'none';
  });
}
function cityDawn() {
  return cached('night.city.dawn', 2900, 640, (c, w, h) => {
    const r = rng(77);
    const ranks = [['#c3cbd5', 300, 4.5, 170], ['#adb7c3', 360, 2.8, 240], ['#97a2b0', 420, 1.6, 310]];
    for (const [col, base, blur, minTop] of ranks) {
      const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
      const t = tmp.getContext('2d');
      let x = 0;
      t.fillStyle = col;
      while (x < w) {
        const bw = 70 + r() * 170, top = minTop + r() * (base - minTop + 120);
        t.fillRect(x, top, bw, h - top);
        if (bw > 120 && r() < 0.5) t.fillRect(x + bw * 0.2, top - 26, bw * 0.55, 30);          // setback
        t.save(); t.globalAlpha = 0.07; t.fillStyle = '#ffffff';
        for (let yy = top + 10; yy < h; yy += 9) t.fillRect(x + 3, yy, bw - 6, 1);
        t.restore(); t.fillStyle = col;
        if (r() < 0.25) t.fillRect(x + bw * 0.4, top - 30 - r() * 40, 4, 40 + r() * 30);   // masts
        x += bw + r() * 10;
      }
      c.filter = `blur(${blur}px)`; c.drawImage(tmp, 0, 0); c.filter = 'none';
      c.fillStyle = linGrad(c, 0, base - 80, 0, h, [[0, rgba('#d9dee5', 0)], [1, rgba('#d9dee5', 0.85)]]);
      c.fillRect(0, base - 80, w, h - base + 80);
    }
  });
}

// near bokeh (live, twinkling) at depth 0.36
const NEAR_BOKEH = (() => {
  const r = rng(9), out = [];
  for (let i = 0; i < 18; i++) {
    const warm = r() < 0.18;
    out.push({ x: -500 + r() * 3100, y: 360 + r() * 140, r: 26 + r() * 40, col: warm ? (r() < 0.6 ? '#ffa64d' : '#ffd08a') : ['#7f9fd0', '#a9bcd6', '#5c79a8', '#8fb0e0'][Math.floor(r() * 4)], a: 0.06 + r() * 0.1, s: i });
  }
  return out;
})();

function benchSky(ctx, S) {
  camera(ctx, S.cam, 0.1, () => {
    ctx.fillStyle = linGrad(ctx, 0, -100, 0, 900, S.sp.sky.map(([o, c]) => [o, c]));
    ctx.fillRect(-1000, -800, PW + 2000, PH + 1800);
  });
}

function benchCity(ctx, S) {
  const sp = S.sp;
  camera(ctx, S.cam, 0.22, () => {
    ctx.drawImage(S.dark ? cityRain() : cityDawn(), -490, -60);
  });
  // horizon haze (city glow / mist)
  camera(ctx, S.cam, 0.3, () => {
    const a = sp.hazeA * (S.dark ? 1 : 0.6 + 0.6 * S.mist);
    ctx.fillStyle = linGrad(ctx, 0, 300, 0, 560, [[0, rgba(sp.haze, 0)], [0.6, rgba(sp.haze, a)], [1, rgba(sp.haze, a * 0.6)]]);
    ctx.fillRect(-800, 300, PW + 1600, 300);
  });
  if (S.dark) {
    camera(ctx, S.cam, 0.36, () => {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const b of NEAR_BOKEH) {
        const a = b.a * (0.8 + 0.35 * noise1(S.t * 0.4 + b.s * 3.1, 2));
        ctx.fillStyle = radGrad(ctx, b.x, b.y, 0, b.r, [[0, rgba(b.col, a * 0.75)], [0.7, rgba(b.col, a)], [0.88, rgba(b.col, a * 0.8)], [1, rgba(b.col, 0)]]);
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
      }
      // far traffic: pairs of soft white lamps gliding along the far bank
      for (let k = 0; k < 2; k++) {
        const per = 13 + k * 4, p = ((S.t + k * 6.5) % per) / per;
        const x = k ? lerp(-500, 2500, p) : lerp(2500, -500, p), y = 470 + k * 6;
        const col = k ? '#ffd08a' : '#e4ecf8';
        glow(ctx, x, y, 22, col, 0.35); glow(ctx, x + 30, y, 22, col, 0.35);
      }
      ctx.restore();
    });
  }
}

function benchWall(ctx, S) {
  const sp = S.sp;
  camera(ctx, S.cam, WALL_D, () => {
    const x0 = -900, x1 = PW + 900;
    ctx.fillStyle = sp.wall; ctx.fillRect(x0, WALL_TOP, x1 - x0, WALL_BASE - WALL_TOP + 80);
    // stone courses
    ctx.strokeStyle = rgba('#000000', S.dark ? 0.35 : 0.12); ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = WALL_TOP + 14; y < WALL_BASE; y += 14) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
    for (let y = WALL_TOP + 14, row = 0; y < WALL_BASE; y += 14, row++) for (let x = x0 + (row % 2) * 24; x < x1; x += 48) { ctx.moveTo(x, y); ctx.lineTo(x, y + 14); }
    ctx.stroke();
    // coping
    ctx.fillStyle = sp.coping; ctx.fillRect(x0, WALL_TOP - 6, x1 - x0, 8);
    // railing on top
    ctx.strokeStyle = sp.rail; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0, WALL_TOP - 40); ctx.lineTo(x1, WALL_TOP - 40);
    ctx.moveTo(x0, WALL_TOP - 22); ctx.lineTo(x1, WALL_TOP - 22);
    for (let x = x0; x < x1; x += 46) { ctx.moveTo(x, WALL_TOP - 6); ctx.lineTo(x, WALL_TOP - 44); }
    ctx.stroke();
    ctx.strokeStyle = rgba(sp.railHi, S.dark ? 0.3 : 0.5); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x0, WALL_TOP - 41.5); ctx.lineTo(x1, WALL_TOP - 41.5); ctx.stroke();
    if (S.dark) {
      // sodium catching the coping near the lamp, and the haze sitting on the wall top
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = linGrad(ctx, LAMP.x - 700, 0, LAMP.x + 700, 0, [[0, rgba(SOD, 0)], [0.5, rgba(SOD, 0.22 * S.lampK)], [1, rgba(SOD, 0)]]);
      ctx.fillRect(LAMP.x - 700, WALL_TOP - 6, 1400, 4);
      ctx.fillRect(LAMP.x - 700, WALL_TOP - 42, 1400, 2);
      ctx.restore();
    }
    // the wall's shadow side fades into the road
    ctx.fillStyle = linGrad(ctx, 0, WALL_TOP, 0, WALL_BASE + 10, [[0, rgba('#000000', 0)], [1, rgba('#000000', S.dark ? 0.4 : 0.15)]]);
    ctx.fillRect(x0, WALL_TOP, x1 - x0, WALL_BASE - WALL_TOP + 80);
  });
}

function benchRoad(ctx, S) {
  const sp = S.sp;
  camera(ctx, S.cam, 0.55, () => {
    const x0 = -1000, x1 = PW + 1000, y0 = WALL_BASE, y1 = 720;
    ctx.fillStyle = linGrad(ctx, 0, y0, 0, y1, [[0, sp.road[0]], [0.45, sp.road[1]], [1, sp.road[1]]]);
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (!S.dark) {
      // the sky mirrored in the wet road: a pale band right under the wall
      ctx.fillStyle = linGrad(ctx, 0, y0, 0, y0 + 34, [[0, rgba('#e7ebf0', 0.55)], [1, rgba('#e7ebf0', 0)]]);
      ctx.fillRect(x0, y0, x1 - x0, 34);
    }
    // lane dashes
    ctx.fillStyle = rgba(sp.lane, sp.laneA);
    for (let x = x0; x < x1; x += 150) ctx.fillRect(x, 566, 80, 3);
    if (S.dark) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      // reflections of the near bokeh: soft vertical smears on the wet asphalt
      for (const b of NEAR_BOKEH) {
        const rx = b.x;   // same screen x as the disc at the identity camera
        glow(ctx, rx, y0 + 6, b.r * 0.32, b.col, b.a * 0.8, 4.5);
      }
      // the lamp, smeared on the road
      glow(ctx, LAMP.x, y0 + 40, 90, SOD, 0.1 * S.lampK, 1.6);
      ctx.restore();
    }
  });
}

function benchCar(ctx, S) {
  if (S.carX == null) return;
  const sp = S.sp, s = CAR_D, cx = S.carX, L = S.carLights;
  camera(ctx, S.cam, CAR_D, () => {
    ctx.save();
    ctx.translate(cx, CAR_Y); ctx.scale(s, s);
    // low beams on the road ahead
    if (L > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, -1050, -10, 520, S.dark ? '#dfe8f5' : '#ffffff', (S.dark ? 0.32 : 0.12) * L, 0.12);
      lightCone(ctx, -604, -84, Math.PI + 0.06, 0.28, 900, S.dark ? '#dfe8f5' : '#ffffff', (S.dark ? 0.12 : 0.05) * L);
      ctx.restore();
    }
    // reflection in the wet road
    ctx.save();
    ctx.globalAlpha = S.dark ? 0.5 : 0.35;
    ctx.scale(1, -0.55);
    ctx.fillStyle = sp.car.body; smooth(ctx, SLEEK.body); ctx.fill();
    ctx.restore();
    ctx.fillStyle = linGrad(ctx, 0, 0, 0, 160, [[0, rgba(S.dark ? sp.road[1] : sp.road[1], 0)], [1, rgba(sp.road[1], 0.9)]]);
    ctx.fillRect(-640, 0, 1280, 170);
    // contact shadow
    ctx.fillStyle = radGrad(ctx, 0, 0, 0, 640, [[0, rgba('#000000', 0.6)], [1, rgba('#000000', 0)]]);
    ctx.save(); ctx.scale(1, 0.05); ctx.beginPath(); ctx.arc(0, 0, 640, 0, TAU); ctx.fill(); ctx.restore();
    drawCarBody(ctx, SLEEK, sp.car);
    // dim white running lights: a thin LED line in the nose and a slim one at the tail (white, not red)
    if (L > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba('#f4f7fb', 0.85 * L); ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-604, -104); ctx.quadraticCurveTo(-596, -122, -560, -128); ctx.stroke();
      glow(ctx, -596, -110, 70, '#e8eef8', 0.45 * L);
      glow(ctx, -650, -80, 160, '#e8eef8', 0.14 * L);
      ctx.strokeStyle = rgba('#c9d0d8', 0.3 * L); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(600, -160); ctx.lineTo(606, -140); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  });
}

function benchPavement(ctx, S) {
  const sp = S.sp, t = S.t;
  const V = visRect(S.cam, 1);
  camera(ctx, S.cam, 1, () => {
    const x0 = Math.min(-800, V.x0), x1 = Math.max(PW + 800, V.x1), y0 = 604, y1 = Math.max(900, V.y1);
    // kerb
    ctx.fillStyle = sp.kerbFace; ctx.fillRect(x0, 598, x1 - x0, 12);
    ctx.fillStyle = sp.kerb; ctx.fillRect(x0, 596, x1 - x0, 4);
    // slabs
    ctx.fillStyle = linGrad(ctx, 0, y0, 0, 820, [[0, sp.pave[0]], [0.35, sp.pave[1]], [1, sp.pave[2]]]);
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    // seams: rows get further apart toward the viewer, columns converge on the vanishing point
    ctx.strokeStyle = rgba(sp.seam, sp.seamA); ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const y of [622, 645, 674, 712, 760, 820]) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
    for (let X = -1400; X < 3400; X += 140) {
      const a = 960 + (X - 960) * (y0 - HOR) / 270, b = 960 + (X - 960) * (900 - HOR) / 270;
      ctx.moveTo(a, y0); ctx.lineTo(b, 900);
    }
    ctx.stroke();
    if (!S.dark) {
      // the white sky in the wet slabs: strongest at the grazing far edge, broken up by seams
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = linGrad(ctx, 0, y0, 0, 760, [[0, rgba('#eef1f5', 0.55)], [0.35, rgba('#dfe4ea', 0.2)], [1, rgba('#dfe4ea', 0.04)]]);
      ctx.fillRect(x0, y0, x1 - x0, 160);
      ctx.restore();
    } else {
      // city-glow sheen along the far edge of the pavement (keeps feet readable at lamp 0)
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = linGrad(ctx, 0, y0, 0, 690, [[0, rgba('#3a5078', 0.32)], [1, rgba('#3a5078', 0)]]);
      ctx.fillRect(x0, y0, x1 - x0, 90);
      ctx.restore();
    }
    // reflections of pole and bench (dark in a bright ground, bright where the lamp is)
    ctx.fillStyle = linGrad(ctx, 0, 690, 0, 800, [[0, rgba('#000000', S.dark ? 0.4 : 0.28)], [1, rgba('#000000', 0)]]);
    ctx.fillRect(LAMP.pole - 8, 690, 16, 110);
    ctx.fillRect(BIN.x - BIN.w / 2 + 4, 700, BIN.w - 8, 60);
    ctx.fillStyle = linGrad(ctx, 0, 700, 0, 730, [[0, rgba('#000000', S.dark ? 0.3 : 0.16)], [1, rgba('#000000', 0)]]);
    for (const x of LEGS) ctx.fillRect(x - 7, 700, 16, 30);
    if (S.dark && S.lampK > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const k = S.lampK;
      // pool of sodium light
      glow(ctx, LAMP.x + 10, 700, 560, SOD, 0.42 * k, 0.15);
      glow(ctx, LAMP.x, 690, 280, '#ffc58a', 0.3 * k, 0.16);
      glow(ctx, LAMP.x + 20, 598, 420, SOD, 0.3 * k, 0.03);
      // the lamp's broken reflection: a column of wavering dashes below it
      glow(ctx, LAMP.x, 760, 70, SOD, 0.22 * k, 2.6);
      for (let i = 0; i < 34; i++) {
        const y = 704 + i * 3.1 + hash(i * 3) * 2;
        const w = (8 + i * 1.1) * (0.4 + 1.1 * noise1(t * 2.2 + i * 1.7, 4));
        const dx = wobble(t * 1.1 + i * 0.45, 1, 8) * (2 + i * 0.35) * (0.4 + 0.6 * S.rain);
        const a = k * 0.32 * Math.pow(1 - i / 34, 1.2) * (0.35 + 0.65 * noise1(t * 4 + i * 2.3, 11));
        ctx.fillStyle = rgba(i < 8 ? '#ffd9a8' : SOD, a);
        ctx.beginPath(); ctx.ellipse(LAMP.x + dx, y, w / 2, 1.3 + i * 0.03, 0, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    // puddles
    for (const [px, py, rx, ry] of PUDDLES) {
      if (px + rx < V.x0 || px - rx > V.x1) continue;
      ctx.save();
      ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = linGrad(ctx, 0, py - ry, 0, py + ry, [[0, sp.puddle[0]], [1, sp.puddle[1]]]);
      ctx.fillRect(px - rx, py - ry, rx * 2, ry * 2);
      if (S.dark) {
        ctx.globalCompositeOperation = 'lighter';
        const near = clamp(1 - Math.abs(px - LAMP.x) / 700);
        ctx.fillStyle = rgba(SOD, 0.25 * near * S.lampK);
        ctx.fillRect(px - rx, py - ry, rx * 2, ry * 2);
        if (Math.abs(px - LAMP.x) < rx) { ctx.fillStyle = rgba('#ffd9a8', 0.5 * S.lampK); ctx.fillRect(LAMP.x - 7, py - ry, 14, ry * 2); }
        ctx.fillStyle = rgba('#7f9fd0', 0.12); ctx.fillRect(px - rx, py - ry, rx * 2, ry * 0.7);
      } else {
        ctx.fillStyle = rgba('#ffffff', 0.12); ctx.fillRect(px - rx, py - ry, rx * 2, ry * 0.5);
      }
      ctx.restore();
      // rim
      ctx.strokeStyle = rgba(S.dark ? '#000000' : '#2a313b', 0.35); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0.1, Math.PI - 0.1); ctx.stroke();
      // ripples
      const nR = S.rain > 0.01 ? Math.round(7 * S.rain) : (Math.abs(px - LAMP.x) < rx ? 1 : 0);
      for (let j = 0; j < nR; j++) {
        const per = S.rain > 0.01 ? 0.9 + hash(j * 13 + px) * 0.6 : 2.7;
        const p = ((t / per + hash(j * 7 + px)) % 1);
        const gen = Math.floor(t / per + hash(j * 7 + px));
        const qx = S.rain > 0.01 ? px + (hash(gen * 31 + j + px) * 2 - 1) * rx * 0.8 : LAMP.x + 8;
        const qy = py + (hash(gen * 17 + j + py) * 2 - 1) * ry * 0.4;
        const rr2 = 3 + p * 22 * (ry / 12);
        ctx.strokeStyle = rgba(S.dark ? (Math.abs(qx - LAMP.x) < 260 ? '#ffd2a0' : '#a9bcd6') : '#f4f7fb', (1 - p) * (S.dark ? 0.3 : 0.35) * (S.dark ? 0.4 + 0.6 * clamp(S.lampK + 0.3) : 1));
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(qx, qy, rr2, rr2 * 0.22, 0, 0, TAU); ctx.stroke();
      }
    }
    // splash specks on the slabs
    if (S.rain > 0.01) {
      const n = Math.round(240 * S.rain);
      ctx.lineWidth = 1.1; ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const per = 0.5 + hash(i * 5 + 3) * 0.5;
        const ph = t / per + hash(i * 11);
        const p = ph % 1; if (p > 0.16) continue;
        const gen = Math.floor(ph);
        const x = V.x0 + hash(gen * 131 + i * 7) * (V.x1 - V.x0);
        const y = 606 + Math.pow(hash(gen * 71 + i * 3), 0.8) * 200;
        const sc = 0.5 + (y - 600) / 200, k = 1 - p / 0.16;
        const inPool = Math.max(0, 1 - Math.abs(x - LAMP.x) / 560) * S.lampK;
        ctx.strokeStyle = rgba(inPool > 0.15 ? '#ffd2a0' : (S.dark ? '#9fb3d4' : '#f4f7fb'), (0.18 + 0.5 * inPool) * k);
        const h = 2.2 * sc * (0.5 + p * 5);
        ctx.beginPath();
        ctx.moveTo(x - 1 * sc, y); ctx.lineTo(x - 2.2 * sc, y - h);
        ctx.moveTo(x + 1 * sc, y); ctx.lineTo(x + 2.2 * sc, y - h);
        ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y, 3 * sc * (0.4 + p * 5), 0.8 * sc, 0, 0, TAU); ctx.stroke();
      }
    }
  });
}

function drawLampPost(ctx, S) {
  const sp = S.sp, k = S.lampK;
  const X = LAMP.pole;
  // pole (slightly tapered), base collar
  ctx.fillStyle = sp.pole;
  poly(ctx, [[X - 7.5, LAMP.base], [X - 5, 190], [X + 5, 190], [X + 7.5, LAMP.base]]); ctx.fill();
  poly(ctx, [[X - 13, LAMP.base], [X - 11, 630], [X - 8, 622], [X + 8, 622], [X + 11, 630], [X + 13, LAMP.base]]); ctx.fill();
  ctx.fillRect(X - 9, 400, 18, 6);
  // arm
  ctx.strokeStyle = sp.pole; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(X, 196); ctx.quadraticCurveTo(X + 6, 150, 540, 150); ctx.stroke();
  // luminaire head
  ctx.fillStyle = sp.pole;
  smooth(ctx, [[528, 146], [560, 136], [618, 138], [646, 148], [640, 158], [600, 162], [548, 160]]); ctx.fill();
  // lit edge on the right of the pole (sodium from its own head barely reaches; city haze from the right)
  ctx.fillStyle = S.dark ? rgba('#3a5078', 0.5) : rgba(sp.ironHi, 0.4);
  ctx.fillRect(X + 3.5, 200, 2, LAMP.base - 200);
  if (S.dark && k > 0.01) {
    ctx.fillStyle = linGrad(ctx, 0, 300, 0, LAMP.base, [[0, rgba(SOD, 0)], [1, rgba(SOD, 0.4 * k)]]);
    ctx.fillRect(X + 3, 300, 4, LAMP.base - 300);
    ctx.fillRect(X + 9, 630, 3, 60);
  }
  // lens
  ctx.fillStyle = S.dark ? mixHex('#1a1612', '#fff1d8', clamp(k * 1.2)) : '#3a414c';
  smooth(ctx, [[552, 158], [588, 155], [626, 157], [600, 164], [560, 163]]); ctx.fill();
}

function drawBin(ctx, S) {
  const sp = S.sp, x = BIN.x, w = BIN.w;
  ctx.fillStyle = sp.bin;
  poly(ctx, [[x - w / 2, 700], [x - w / 2 + 3, BIN.top + 14], [x + w / 2 - 3, BIN.top + 14], [x + w / 2, 700]]); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, BIN.top + 14, w / 2 + 2, 10, 0, Math.PI, 0); ctx.fill();
  ctx.fillRect(x - w / 2 - 2, BIN.top + 12, w + 4, 8);
  // ribs + slot
  ctx.strokeStyle = rgba('#000000', 0.45); ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 1; i < 6; i++) { const xx = x - w / 2 + (w * i) / 6; ctx.moveTo(xx, BIN.top + 30); ctx.lineTo(xx, 690); }
  ctx.stroke();
  ctx.fillStyle = '#000000'; ctx.fillRect(x - w / 2 + 8, BIN.top + 24, w - 16, 8);
  // wet highlight on the lid and the lit side
  ctx.strokeStyle = rgba(sp.binHi, S.dark ? 0.6 : 0.7); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(x, BIN.top + 14, w / 2, 9, 0, Math.PI * 1.08, Math.PI * 1.9); ctx.stroke();
  if (S.dark) {
    ctx.fillStyle = linGrad(ctx, 0, BIN.top, 0, 700, [[0, rgba(SOD, 0.22 * S.lampK)], [1, rgba(SOD, 0.05 * S.lampK)]]);
    ctx.fillRect(x + w / 2 - 4, BIN.top + 16, 3, 680 - BIN.top);
  } else {
    ctx.fillStyle = rgba(sp.binHi, 0.25); ctx.fillRect(x + w / 2 - 6, BIN.top + 20, 3, 670 - BIN.top);
  }
}

// bench pieces (depth 1)
const LEGS = [BX0 + 22, BXM, BX1 - 22];
function benchHi(S) {
  // highlight colour + strength along the bench (sodium falls off away from the lamp)
  if (S.dark) return { col: SOD, a: (x) => (0.12 + 0.75 * clamp(1 - Math.abs(x - LAMP.x) / 620)) * S.lampK, amb: 0.22 };
  return { col: '#dfe5ec', a: () => 0.45, amb: 0 };
}
function drawBenchBack(ctx, S) {
  const sp = S.sp, H = benchHi(S);
  // rear legs
  ctx.fillStyle = sp.iron;
  for (const x of LEGS) poly(ctx, [[x + 2, 588], [x + 9, 588], [x + 12, 690], [x + 1, 690]]), ctx.fill();
  // backrest posts (cast iron, a gentle S)
  for (const x of LEGS) {
    ctx.beginPath(); ctx.moveTo(x - 3, 590); ctx.quadraticCurveTo(x - 9, 530, x - 2, 474); ctx.lineTo(x + 7, 474); ctx.quadraticCurveTo(x + 1, 530, x + 7, 590); ctx.closePath(); ctx.fill();
  }
  // slats
  const slats = [[480, 15], [502, 15], [524, 15]];
  for (const [y, h] of slats) {
    ctx.fillStyle = sp.wood; ctx.fillRect(BX0, y, BX1 - BX0, h);
    // underside shadow / wet top edge lit by the lamp
    ctx.fillStyle = rgba('#000000', 0.35); ctx.fillRect(BX0, y + h - 3, BX1 - BX0, 3);
    ctx.fillStyle = linGrad(ctx, BX0, 0, BX1, 0, [[0, rgba(H.col, H.a(BX0))], [0.5, rgba(H.col, H.a(BXM))], [1, rgba(H.col, H.a(BX1))]]);
    ctx.fillRect(BX0, y, BX1 - BX0, 2.2);
    if (S.dark) { ctx.fillStyle = rgba('#3a5078', H.amb); ctx.fillRect(BX0, y + 2, BX1 - BX0, 1); }
    // end grain caps
    ctx.fillStyle = sp.woodTop; ctx.fillRect(BX0 - 2, y, 3, h); ctx.fillRect(BX1 - 1, y, 3, h);
  }
  // seat top (seen a little from above): three boards
  ctx.fillStyle = sp.woodTop;
  poly(ctx, [[BX0, 584], [BX1, 584], [BX1 + 6, 597], [BX0 - 6, 597]]); ctx.fill();
  ctx.strokeStyle = rgba('#000000', 0.5); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(BX0 - 2, 588.5); ctx.lineTo(BX1 + 2, 588.5); ctx.moveTo(BX0 - 4, 592.8); ctx.lineTo(BX1 + 4, 592.8); ctx.stroke();
  ctx.fillStyle = linGrad(ctx, BX0, 0, BX1, 0, [[0, rgba(H.col, H.a(BX0) * 0.8)], [0.5, rgba(H.col, H.a(BXM) * 0.8)], [1, rgba(H.col, H.a(BX1) * 0.8)]]);
  ctx.fillRect(BX0, 584, BX1 - BX0, 1.6); ctx.fillRect(BX0 - 3, 589.5, BX1 - BX0 + 6, 1.2); ctx.fillRect(BX0 - 5, 594, BX1 - BX0 + 10, 1.2);
}
function drawBenchFront(ctx, S) {
  const sp = S.sp, H = benchHi(S);
  // front legs: cast iron with a curled foot
  ctx.fillStyle = sp.iron;
  for (const x of LEGS) {
    ctx.beginPath();
    ctx.moveTo(x - 6, 604); ctx.quadraticCurveTo(x - 2, 650, x - 10, 694); ctx.quadraticCurveTo(x - 16, 700, x - 6, 701);
    ctx.lineTo(x + 8, 701); ctx.quadraticCurveTo(x + 4, 660, x + 7, 604); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgba(H.col, (S.dark ? H.a(x) * 0.6 : 0.35));
    ctx.fillRect(x - 6, 606, 1.6, 40);
    ctx.fillStyle = sp.iron;
  }
  // seat front edge
  ctx.fillStyle = sp.wood; ctx.fillRect(BX0 - 7, 596, BX1 - BX0 + 14, 11);
  ctx.fillStyle = rgba('#000000', 0.45); ctx.fillRect(BX0 - 7, 603, BX1 - BX0 + 14, 4);
  ctx.fillStyle = linGrad(ctx, BX0, 0, BX1, 0, [[0, rgba(H.col, H.a(BX0))], [0.5, rgba(H.col, H.a(BXM))], [1, rgba(H.col, H.a(BX1))]]);
  ctx.fillRect(BX0 - 7, 596, BX1 - BX0 + 14, 1.8);
  // drips hanging off the seat edge (rain)
  if (S.rain > 0.01) {
    for (let i = 0; i < 9; i++) {
      const x = BX0 + 20 + hash(i * 9 + 1) * (BX1 - BX0 - 40);
      const p = (S.t * (0.6 + hash(i) * 0.5) + hash(i * 3)) % 1;
      const y = p < 0.7 ? 608 : 608 + (p - 0.7) / 0.3 * 90;
      const a = (p < 0.7 ? p / 0.7 : 1 - (p - 0.7) / 0.3) * 0.7 * S.rain;
      ctx.fillStyle = rgba(S.dark ? (Math.abs(x - LAMP.x) < 400 ? '#ffd2a0' : '#9fb3d4') : '#f4f7fb', a * (S.dark ? 0.4 + 0.6 * S.lampK : 1));
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill();
    }
  }
}

export const bench = {
  W: 1920,
  floorY: 700,
  anchors: {
    seatL: { x: 640, y: SEAT_Y }, seatR: { x: 962, y: SEAT_Y }, seatMid: { x: 760, y: SEAT_Y },
    standFront: { x: 840, y: 700 }, twoShot: { x: 801, y: 700 },
    lampHead: { x: LAMP.x, y: LAMP.y }, lampBase: { x: LAMP.pole, y: LAMP.base },
    bin: { x: BIN.x, y: 700 }, carStop: { x: 1480, y: Math.round(CAR_Y) }, enterR: { x: 2050, y: 700 },
  },
  lights: {
    rainNight: { key: SOD, color: SOD, from: -1, amount: 0.85 },
    greyDawn: { key: LOOK.greyDawn.key, color: LOOK.greyDawn.key, from: 1, amount: 0.4 },
  },
  /** Rim light for a figure at world x. o: the same options object (lamp is read from it). */
  lightAt(look, x, o = {}) {
    if (look === 'greyDawn') return { ...this.lights.greyDawn };
    const lamp = clamp(o.lamp ?? 1);
    const fall = clamp(1.15 - Math.abs(x - LAMP.x) / 900, 0.2, 1);
    const a = 0.85 * lamp * fall;
    if (a < 0.12) return { key: '#5c79a8', color: '#5c79a8', from: 1, amount: 0.18 };
    return { key: SOD, color: SOD, from: x >= LAMP.x ? -1 : 1, amount: a };
  },

  back(ctx, F, o = {}) {
    const S = resolveBench(F, o), sp = S.sp;
    ctx.save();
    benchSky(ctx, S);
    benchCity(ctx, S);
    if (!S.dark && S.mist > 0) {
      camera(ctx, S.cam, 0.32, () => {
        ctx.fillStyle = linGrad(ctx, 0, 250, 0, 560, [[0, rgba(sp.mistCol, 0)], [1, rgba(sp.mistCol, 0.5 * S.mist)]]);
        ctx.fillRect(-900, 250, PW + 1800, 320);
      });
    }
    benchWall(ctx, S);
    if (!S.dark) camera(ctx, S.cam, 0.45, () => fog(ctx, S.t, 470, 70, '#dfe4ea', 0.06 * S.mist, 3, 6));
    benchRoad(ctx, S);
    benchCar(ctx, S);
    // far rain (behind the bench), in the sodium cone
    const LL = { x: LAMP.x, y: LAMP.y + 4, k: S.dark ? S.lampK : 0, col: '#ffbf80' };
    drawRain(ctx, S, [{ d: 0.4, n: 260, seed: 1 }, { d: 0.6, n: 200, seed: 2 }], LL, sp.rainDim);
    benchPavement(ctx, S);
    camera(ctx, S.cam, 1, () => {
      drawLampPost(ctx, S);
      drawBin(ctx, S);
      drawBenchBack(ctx, S);
      if (S.dark && S.lampK > 0.01) {
        // the cone of sodium light in the rainy air
        softCone(ctx, LAMP.x, LAMP.y + 4, Math.PI / 2 + 0.03, 1.1, 640, SOD, 0.16 * S.lampK);
        softCone(ctx, LAMP.x, LAMP.y + 4, Math.PI / 2 + 0.02, 0.55, 520, '#ffc58a', 0.08 * S.lampK);
        glow(ctx, LAMP.x, LAMP.y + 8, 210, SOD, 0.42 * S.lampK);
      }
    });
    drawRain(ctx, S, [{ d: 0.85, n: 150, seed: 3 }], LL, sp.rainDim);
    ctx.restore();
  },

  mid() {},

  front(ctx, F, o = {}) {
    const S = resolveBench(F, o), sp = S.sp;
    ctx.save();
    camera(ctx, S.cam, 1, () => {
      drawBenchFront(ctx, S);
      if (S.dark && S.lampK > 0.01) {
        // light in the air over the figures + bloom around the head
        softCone(ctx, LAMP.x, LAMP.y + 4, Math.PI / 2 + 0.03, 0.95, 560, SOD, 0.05 * S.lampK);
        glow(ctx, LAMP.x, LAMP.y + 6, 110, '#ffc58a', 0.55 * S.lampK);
        glow(ctx, LAMP.x, LAMP.y + 4, 34, '#fff1d8', 0.9 * S.lampK, 0.6);
      }
    });
    const LL = { x: LAMP.x, y: LAMP.y + 4, k: S.dark ? S.lampK : 0, col: '#ffbf80' };
    drawRain(ctx, S, [{ d: 1.05, n: 110, seed: 4 }, { d: 1.35, n: 45, seed: 5 }], LL, sp.rainDim);
    // low mist
    camera(ctx, S.cam, 1.1, () => {
      if (S.dark) fog(ctx, S.t, 610, 120, sp.mistCol, 0.05 * S.mist, 7, 9);
      else fog(ctx, S.t, 560, 170, '#e4e8ed', 0.07 * S.mist, 7, 7);
    });
    ctx.restore();
  },
};

// ═════════════════════════════════════ 2. POLICE STOP ═════════════════════════════════════
const PW_D = 0.72, PW_BASE = 624;          // facade depth / base line
const PCAR = { d: 0.88, x: 1780, y: HOR + 270 * 0.88, s: 0.88 };   // patrol car centre, ground y ≈ 668
const BAR_LOCAL = { x: 60, y: -326 };
const BAR = { x: PCAR.x + BAR_LOCAL.x * PCAR.s, y: PCAR.y + BAR_LOCAL.y * PCAR.s };   // ≈ (1833, 381)
const GRATE = { x: 905, y: 745 };
const WLAMP = { x: 1040, y: 382 };
const PERIOD = 1.0;

/** Red / blue light-bar cycle at time t. Returns intensities and the travelling wash positions (wall screen x). */
function policeCycle(t, strength = 1) {
  const ph = (((t / PERIOD) % 1) + 1) % 1;
  const env = (u) => Math.pow(Math.sin(Math.PI * clamp(u)), 0.55);
  const ur = ph < 0.5 ? ph / 0.5 : -1, ub = ph >= 0.5 ? (ph - 0.5) / 0.5 : -1;
  const red = ur >= 0 ? env(ur) : 0, blue = ub >= 0 ? env(ub) : 0;
  // each wash enters at the car and sweeps away to the left
  const sx = (u) => lerp(BAR.x + 150, -350, Math.pow(clamp(u), 0.9));
  // a little afterglow of the other colour so the frame never goes fully dead
  return {
    ph, red: strength * (red + 0.08 * blue), blue: strength * (blue + 0.08 * red),
    rx: ur >= 0 ? sx(ur) : BAR.x, bx: ub >= 0 ? sx(ub) : BAR.x,
    rawR: red, rawB: blue,
  };
}
/** Rim light for a figure at world x at time t (both colours come from the car on the right). */
export function policeLight(t, x = 560, strength = 1) {
  const c = policeCycle(t, strength);
  const near = (sx) => 0.35 + 0.65 * Math.exp(-Math.pow((x - sx) / 520, 2));
  const r = c.red * near(c.rx), b = c.blue * near(c.bx);
  const color = r >= b ? RED : BLUE;
  return { color, key: color, from: 1, amount: clamp(0.15 + Math.max(r, b) * 0.85), red: r, blue: b };
}

const PSP = {
  // surfaces in neutral "white light" colours — the light map multiplies them
  mortar: '#77716c', brick: ['#7d6f69', '#71655f', '#887a72', '#6a5f5a'],
  fascia: '#a9adb4', fasciaEdge: '#5c5f66', pilaster: '#716c68',
  shutter: '#9599a1', rib: '#6e737b', ribHi: '#c3c8cf',
  door: '#25272b', doorFrame: '#5d5a57', glass: '#3c414a', frame: '#5c5a58', sill: '#9a9692',
  pipe: '#4c4e53', iron: '#232428', ironHi: '#7d8088',
  pave: '#62666d', kerb: '#8b8f96', kerbFace: '#4e5258', road: ['#4b5059', '#3b3f47', '#33363d'],
  car: { body: '#3a3e47', glass: '#121418', glassHi: '#9aa6b8', wheel: '#0c0d10', rim: '#2a2d33', sheen: '#d8dde5', sheenA: 0.35, stripe: '#b8bec8' },
  bag: '#2c2e31',
  ambient: '#232d48',
};

function resolvePolice(F, o = {}) {
  const t = o.t ?? (F ? F.t : 0);
  const police = clamp(o.police ?? 1);
  const cyc = policeCycle(o.phase ?? t, police);
  return { t, cam: o.cam || null, police, cyc, steam: clamp(o.steam ?? 1), rain: clamp(o.rain ?? 0), look: 'policeNight' };
}

function brickWall(ctx, x0, x1, y0, y1) {
  ctx.fillStyle = PSP.mortar; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  // bricks in four tones (one path each)
  const BW = 40, BH = 13;
  const paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
  for (let row = Math.floor(y0 / BH); row * BH < y1; row++) {
    const y = row * BH, off = (row & 1) * (BW / 2);
    for (let x = Math.floor(x0 / BW) * BW - off; x < x1; x += BW) {
      const k = Math.floor(hash(row * 977 + Math.round(x / BW) * 131) * 4);
      paths[k].rect(x + 1, y + 1, BW - 2, BH - 2);
    }
  }
  for (let k = 0; k < 4; k++) { ctx.fillStyle = PSP.brick[k]; ctx.fill(paths[k]); }
  // soot / grime toward the pavement
  ctx.fillStyle = linGrad(ctx, 0, PW_BASE - 140, 0, PW_BASE, [[0, rgba('#000000', 0)], [1, rgba('#000000', 0.35)]]);
  ctx.fillRect(x0, PW_BASE - 140, x1 - x0, 140);
}
const BRICK_CACHE = { x0: -760, y0: -360, w: 3440, h: 360 + PW_BASE };
function drawFacade(ctx, S) {
  const V = visRect(S.cam, PW_D, 40);
  const z = 1 + ((S.cam && S.cam.zoom ? S.cam.zoom : 1) - 1) * PW_D;
  const x0 = Math.max(-1000, V.x0 - 40), x1 = Math.min(3000, V.x1 + 40);
  const y0 = Math.max(-400, V.y0 - 20), y1 = PW_BASE;
  const B = BRICK_CACHE;
  if (z < 1.3 && x0 >= B.x0 && x1 <= B.x0 + B.w && y0 >= B.y0) {
    // wide shots: the brickwork comes from a cached layer (crisp at this scale)
    const cv = cached('night.police.bricks', B.w, B.h, (c) => { c.translate(-B.x0, -B.y0); brickWall(c, B.x0, B.x0 + B.w, B.y0, PW_BASE); });
    ctx.drawImage(cv, B.x0, B.y0);
  } else brickWall(ctx, x0, x1, y0, y1);
  // upper windows
  for (const [wx, lit] of [[330, 0], [620, 1], [-260, 0], [1240, 0], [1540, 0], [2000, 0]]) {
    ctx.fillStyle = PSP.sill; ctx.fillRect(wx - 8, 208, 136, 9);
    ctx.fillStyle = PSP.frame; ctx.fillRect(wx - 4, 40, 128, 170);
    ctx.fillStyle = PSP.glass; ctx.fillRect(wx + 4, 48, 112, 154);
    ctx.fillStyle = PSP.frame; ctx.fillRect(wx + 57, 48, 6, 154); ctx.fillRect(wx + 4, 118, 112, 6);
    ctx.fillStyle = rgba('#000000', 0.3); ctx.fillRect(wx - 8, 202, 136, 6);
  }
  // shop: fascia, pilasters, shutter
  ctx.fillStyle = PSP.pilaster; ctx.fillRect(228, 262, 24, y1 - 262); ctx.fillRect(818, 262, 24, y1 - 262);
  ctx.fillStyle = PSP.fascia; ctx.fillRect(220, 262, 630, 66);
  ctx.fillStyle = PSP.fasciaEdge; ctx.fillRect(220, 262, 630, 5); ctx.fillRect(220, 323, 630, 5);
  ctx.fillStyle = PSP.shutter; ctx.fillRect(252, 330, 566, y1 - 330);
  ctx.strokeStyle = PSP.rib; ctx.lineWidth = 2.4; ctx.beginPath();
  for (let y = 340; y < y1 - 4; y += 10) { ctx.moveTo(252, y); ctx.lineTo(818, y); }
  ctx.stroke();
  ctx.strokeStyle = PSP.ribHi; ctx.lineWidth = 1; ctx.beginPath();
  for (let y = 336; y < y1 - 4; y += 10) { ctx.moveTo(252, y); ctx.lineTo(818, y); }
  ctx.stroke();
  ctx.fillStyle = PSP.fasciaEdge; ctx.fillRect(252, 330, 566, 10); ctx.fillRect(252, y1 - 14, 566, 14);
  ctx.fillStyle = PSP.iron; ctx.fillRect(522, y1 - 26, 26, 18);                 // padlock hasp
  ctx.fillStyle = linGrad(ctx, 0, 330, 0, 400, [[0, rgba('#000000', 0.35)], [1, rgba('#000000', 0)]]);
  ctx.fillRect(252, 330, 566, 70);
  // drainpipe
  ctx.fillStyle = PSP.pipe; ctx.fillRect(900, y0, 12, y1 - y0);
  for (let y = 60; y < y1; y += 120) ctx.fillRect(896, y, 20, 6);
  ctx.fillRect(892, y1 - 18, 28, 18);
  // door, recessed, with a step
  ctx.fillStyle = PSP.doorFrame; ctx.fillRect(972, 392, 136, y1 - 392);
  ctx.fillStyle = PSP.door; ctx.fillRect(984, 404, 112, y1 - 404);
  ctx.fillStyle = rgba('#000000', 0.4); ctx.fillRect(984, 404, 112, 16);
  ctx.fillStyle = PSP.sill; ctx.fillRect(966, y1 - 8, 148, 8);
  // wall lamp bracket + cage
  ctx.fillStyle = PSP.iron; ctx.fillRect(WLAMP.x - 3, WLAMP.y - 34, 6, 22); ctx.fillRect(WLAMP.x - 3, WLAMP.y - 34, 20, 5);
  ctx.strokeStyle = PSP.iron; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(WLAMP.x, WLAMP.y, 13, 0, TAU); ctx.moveTo(WLAMP.x - 13, WLAMP.y); ctx.lineTo(WLAMP.x + 13, WLAMP.y); ctx.moveTo(WLAMP.x, WLAMP.y - 13); ctx.lineTo(WLAMP.x, WLAMP.y + 13); ctx.stroke();
  // fire escape: platform, railing, stairs, drop ladder
  ctx.strokeStyle = PSP.iron; ctx.lineCap = 'butt';
  ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(1150, 232); ctx.lineTo(1710, 232); ctx.moveTo(1150, -50); ctx.lineTo(1710, -50); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath();
  ctx.moveTo(1150, 190); ctx.lineTo(1710, 190); ctx.moveTo(1150, 207); ctx.lineTo(1710, 207);
  for (let x = 1150; x <= 1710; x += 16) { ctx.moveTo(x, 190); ctx.lineTo(x, 232); }
  for (let x = 1150; x <= 1710; x += 140) { ctx.moveTo(x, 232); ctx.lineTo(x + 40, 262); }        // brackets
  // stairs up to the next landing
  ctx.moveTo(1230, 232); ctx.lineTo(1500, -50); ctx.moveTo(1262, 232); ctx.lineTo(1532, -50);
  for (let k = 0; k < 14; k++) { const u = k / 14; const xa = lerp(1230, 1500, u), ya = lerp(232, -50, u); ctx.moveTo(xa, ya); ctx.lineTo(xa + 32, ya); }
  // drop ladder
  ctx.moveTo(1640, 232); ctx.lineTo(1640, 470); ctx.moveTo(1676, 232); ctx.lineTo(1676, 470);
  for (let y = 250; y < 470; y += 22) { ctx.moveTo(1640, y); ctx.lineTo(1676, y); }
  ctx.stroke();
  // the fire escape's shadow on the brick (soft, offset down-left)
  ctx.strokeStyle = rgba('#000000', 0.25); ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(1130, 250); ctx.lineTo(1690, 250); ctx.stroke();
  // far pavement + kerb
  ctx.fillStyle = PSP.pave; ctx.fillRect(x0, y1, x1 - x0, 26);
  ctx.fillStyle = PSP.kerb; ctx.fillRect(x0, y1 + 24, x1 - x0, 5);
  ctx.fillStyle = PSP.kerbFace; ctx.fillRect(x0, y1 + 29, x1 - x0, 12);
  // rubbish bags against the wall at the far left
  ctx.fillStyle = PSP.bag;
  smooth(ctx, [[60, y1 + 6], [70, y1 - 40], [110, y1 - 66], [150, y1 - 46], [160, y1 + 6]]); ctx.fill();
  smooth(ctx, [[140, y1 + 8], [150, y1 - 30], [185, y1 - 44], [212, y1 - 22], [216, y1 + 8]]); ctx.fill();
}

function drawStreet(ctx, S) {
  const V = visRect(S.cam, 1, 40);
  const x0 = Math.min(-800, V.x0), x1 = Math.max(PW + 800, V.x1), y1 = Math.max(900, V.y1);
  ctx.fillStyle = linGrad(ctx, 0, 650, 0, 820, [[0, PSP.road[0]], [0.4, PSP.road[1]], [1, PSP.road[2]]]);
  ctx.fillRect(x0, 640, x1 - x0, y1 - 640);
  // patches and cracks
  ctx.strokeStyle = rgba('#000000', 0.3); ctx.lineWidth = 1.2; ctx.beginPath();
  ctx.moveTo(x0, 690); ctx.lineTo(x1, 688);
  ctx.moveTo(300, 760); ctx.lineTo(420, 770); ctx.lineTo(470, 800);
  ctx.moveTo(1300, 720); ctx.lineTo(1420, 728);
  ctx.stroke();
  // grate
  ctx.fillStyle = '#111215'; ctx.beginPath(); ctx.ellipse(GRATE.x, GRATE.y, 78, 12, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#55585e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(GRATE.x, GRATE.y, 78, 12, 0, 0, TAU); ctx.stroke();
  ctx.lineWidth = 2.4; ctx.beginPath();
  for (let k = -5; k <= 5; k++) { const x = GRATE.x + k * 12; const hh = 11 * Math.sqrt(1 - Math.pow((k * 12) / 78, 2)); ctx.moveTo(x, GRATE.y - hh); ctx.lineTo(x, GRATE.y + hh); }
  ctx.stroke();
  // puddles (bright, they take the washes)
  ctx.fillStyle = '#8d939c';
  for (const [px, py, rx, ry] of [[620, 770, 190, 10], [1180, 735, 140, 7], [180, 712, 120, 6], [1560, 790, 230, 12]]) {
    ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0, TAU); ctx.fill();
  }
}

function drawPatrolCar(ctx, S) {
  camera(ctx, S.cam, PCAR.d, () => {
    ctx.save();
    ctx.translate(PCAR.x, PCAR.y); ctx.scale(PCAR.s, PCAR.s);
    ctx.fillStyle = radGrad(ctx, 0, 0, 0, 640, [[0, rgba('#000000', 0.7)], [1, rgba('#000000', 0)]]);
    ctx.save(); ctx.scale(1, 0.06); ctx.beginPath(); ctx.arc(0, 0, 640, 0, TAU); ctx.fill(); ctx.restore();
    drawCarBody(ctx, PATROL, PSP.car);
    // light bar housing
    ctx.fillStyle = '#1b1d22';
    ctx.fillRect(BAR_LOCAL.x - 120, -324, 240, 14); ctx.fillRect(BAR_LOCAL.x - 110, BAR_LOCAL.y - 10, 220, 16);
    ctx.restore();
  });
}

function policeLightMap(ctx, S) {
  const c = S.cyc;
  const { cv, ctx: m } = scratch('night.police.map', PW / 2, PH / 2);   // the map is soft: half resolution
  m.scale(0.5, 0.5);
  m.fillStyle = PSP.ambient; m.fillRect(0, 0, PW, PH);
  m.globalCompositeOperation = 'lighter';
  const band = (cx, col, k, depth, y0, y1, w) => {
    if (k <= 0.003) return;
    camera(m, S.cam, depth, () => {
      m.fillStyle = linGrad(m, cx - w, 0, cx + w, 0, [[0, rgba(col, 0)], [0.5, rgba(col, k)], [1, rgba(col, 0)]]);
      m.fillRect(cx - w, y0, w * 2, y1 - y0);
    });
  };
  // the cold wall lamp and its pool
  camera(m, S.cam, PW_D, () => {
    glow(m, WLAMP.x, WLAMP.y + 60, 300, '#8fa3c8', 0.55);
    glow(m, WLAMP.x, PW_BASE, 260, '#8fa3c8', 0.4, 0.4);
  });
  camera(m, S.cam, 1, () => {
    // low beams along the road toward Adam
    glow(m, 900, 712, 760, '#b9c6d8', 0.4, 0.14);
    glow(m, 1250, 640, 300, '#b9c6d8', 0.25, 0.5);
  });
  // general glow of each colour around the car, then the travelling washes (wall and road)
  for (const [col, k, sx] of [[RED, c.red, c.rx], [BLUE, c.blue, c.bx]]) {
    if (k <= 0.003) continue;
    camera(m, S.cam, PW_D, () => glow(m, BAR.x, BAR.y, 1100, col, 0.55 * k));
    camera(m, S.cam, 1, () => glow(m, BAR.x, BAR.y + 120, 600, col, 0.6 * k));
    band(sx, col, 1.0 * k, PW_D, -500, PW_BASE + 60, 330);
    band(sx, col, 0.6 * k, 1, 640, 1000, 260);
  }
  m.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(cv, 0, 0, PW, PH); ctx.restore();
}

function policeEmissive(ctx, S) {
  const c = S.cyc, t = S.t;
  // dim lit window (cold, blinds half down)
  camera(ctx, S.cam, PW_D, () => {
    ctx.fillStyle = rgba('#5c79a8', 0.35); ctx.fillRect(624, 92, 112, 110);
    ctx.fillStyle = rgba('#000000', 0.5); for (let y = 52; y < 92; y += 6) ctx.fillRect(624, y, 112, 3);
    glow(ctx, 680, 150, 110, '#5c79a8', 0.15);
    // wall lamp bulb
    ctx.fillStyle = '#e8eef8'; ctx.beginPath(); ctx.arc(WLAMP.x, WLAMP.y, 6, 0, TAU); ctx.fill();
    glow(ctx, WLAMP.x, WLAMP.y, 90, '#a9bcd6', 0.5);
    lightCone(ctx, WLAMP.x, WLAMP.y, Math.PI / 2, 0.9, 260, '#a9bcd6', 0.07);
  });
  camera(ctx, S.cam, 1, () => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // wet-road reflections: the washes, the bar, the headlights, the wall lamp
    // soft vertical smears (a squashed-tall glow, brightest at its top, faded below)
    const streak = (x, col, a, w, y0 = 648, y1 = 804) => {
      if (a <= 0.003) return;
      const h = y1 - y0;
      glow(ctx, x, y0 + h * 0.25, w * 0.6, col, a, (h * 0.75) / (w * 0.6));
    };
    const toR = (sx) => (sx - CX) * (1 + 0) + CX;   // wall wash x (depth .72) ≈ same screen x at identity
    streak(toR(c.rx), RED, 0.28 * c.red, 260);
    streak(toR(c.bx), BLUE, 0.3 * c.blue, 260);
    streak(BAR.x - 30, RED, 0.5 * c.red, 70, 680);
    streak(BAR.x + 30, BLUE, 0.5 * c.blue, 70, 680);
    streak(1240, '#dfe8f5', 0.3, 60, 670);
    streak(WLAMP.x, '#a9bcd6', 0.12, 40, 652);
    // puddle glints
    for (const [px, py, rx] of [[620, 770, 190], [1180, 735, 140], [180, 712, 120], [1560, 790, 230]]) {
      const col = c.rawR > c.rawB ? RED : BLUE, k = Math.max(c.red, c.blue);
      ctx.fillStyle = rgba(col, 0.18 * k); ctx.beginPath(); ctx.ellipse(px, py, rx * 0.9, 4, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  });
  // patrol car lights
  camera(ctx, S.cam, PCAR.d, () => {
    ctx.save();
    ctx.translate(PCAR.x, PCAR.y); ctx.scale(PCAR.s, PCAR.s);
    const bx = BAR_LOCAL.x, by = BAR_LOCAL.y;
    // lenses: red on the left half, blue on the right
    ctx.fillStyle = mixHex('#3a1015', '#ffd0d4', clamp(c.rawR * 1.1) * S.police); ctx.fillRect(bx - 106, by - 8, 100, 12);
    ctx.fillStyle = mixHex('#101a3a', '#d6e0ff', clamp(c.rawB * 1.1) * S.police); ctx.fillRect(bx + 6, by - 8, 100, 12);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, bx - 56, by - 2, 260, RED, 0.9 * c.red);
    glow(ctx, bx - 56, by - 2, 70, '#ffd0d4', 0.7 * c.rawR * S.police);
    glow(ctx, bx + 56, by - 2, 260, BLUE, 1.0 * c.blue);
    glow(ctx, bx + 56, by - 2, 70, '#d6e0ff', 0.7 * c.rawB * S.police);
    // headlight + low beam
    glow(ctx, -596, -104, 60, '#f4f7fb', 0.8);
    glow(ctx, -640, -96, 200, '#dfe8f5', 0.22);
    lightCone(ctx, -600, -96, Math.PI + 0.05, 0.3, 1100, '#dfe8f5', 0.07);
    ctx.restore();
  });
}

function drawSteam(ctx, S) {
  const s = S.steam; if (s <= 0.01) return;
  const c = S.cyc, t = S.t;
  const base = '#7d8aa3';
  let col = mixHex(base, RED, clamp(c.red * 0.55));
  col = mixHex(col, BLUE, clamp(c.blue * 0.55));
  const n = 30;
  for (let i = 0; i < n; i++) {
    const p = (((t * (0.13 + 0.05 * hash(i * 3)) + i / n) % 1) + 1) % 1;
    const y = GRATE.y - 6 - p * 380;
    const x = GRATE.x + (hash(i * 7) - 0.5) * 110 * (1 - p * 0.4) + wobble(t * 0.3 + i, 1, i) * 30 * p + p * p * 90;
    const r = (14 + p * 90) * (0.8 + 0.4 * hash(i * 5));
    const a = clamp(p * 7) * Math.pow(1 - p, 1.4) * 0.3 * s;
    ctx.fillStyle = radGrad(ctx, x, y, 0, r, [[0, rgba(col, a)], [0.6, rgba(col, a * 0.5)], [1, rgba(col, 0)]]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
}

export const policeStop = {
  W: 1920,
  floorY: 700,
  anchors: {
    adam: { x: 560, y: 700 }, officer1: { x: 1010, y: 700 }, officer2: { x: 1150, y: 700 },
    grate: { x: GRATE.x, y: GRATE.y }, lightBar: { x: Math.round(BAR.x), y: Math.round(BAR.y) },
    wallLamp: { x: WLAMP.x, y: WLAMP.y }, faceCU: { x: 640, y: 300 },
  },
  lights: { policeNight: { key: LOOK.policeNight.key, color: LOOK.policeNight.key, from: 1, amount: 0.3 } },
  /** Rim for a figure at world x right now (o.phase ?? o.t). */
  lightAt(look, x, o = {}) { return policeLight(o.phase ?? o.t ?? 0, x, clamp(o.police ?? 1)); },

  back(ctx, F, o = {}) {
    const S = resolvePolice(F, o);
    ctx.save();
    ctx.fillStyle = PSP.mortar; ctx.fillRect(0, 0, PW, PH);
    camera(ctx, S.cam, PW_D, () => drawFacade(ctx, S));
    camera(ctx, S.cam, 1, () => drawStreet(ctx, S));
    drawPatrolCar(ctx, S);
    policeLightMap(ctx, S);
    policeEmissive(ctx, S);
    if (S.rain > 0.01) drawRain(ctx, S, [{ d: 0.6, n: 220, seed: 11 }, { d: 0.85, n: 120, seed: 12 }], null, '#8ea6cc');
    ctx.restore();
  },

  mid() {},

  front(ctx, F, o = {}) {
    const S = resolvePolice(F, o), c = S.cyc;
    ctx.save();
    camera(ctx, S.cam, 1, () => {
      drawSteam(ctx, S);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      // beams from the bar raking toward the travelling washes, and the coloured air round the car
      for (const [col, k, sx] of [[RED, c.red, c.rx], [BLUE, c.blue, c.bx]]) {
        if (k <= 0.01) continue;
        const ang = Math.atan2(420 - BAR.y, sx - BAR.x);
        softCone(ctx, BAR.x, BAR.y, ang, 0.3, Math.hypot(sx - BAR.x, 420 - BAR.y) + 200, col, 0.14 * k);
        glow(ctx, BAR.x, BAR.y, 420, col, 0.22 * k);
      }
      ctx.restore();
    });
    if (S.rain > 0.01) drawRain(ctx, S, [{ d: 1.1, n: 90, seed: 13 }], null, '#8ea6cc');
    camera(ctx, S.cam, 1.1, () => fog(ctx, S.t, 600, 140, '#31456e', 0.05, 5, 8));
    ctx.restore();
  },
};
