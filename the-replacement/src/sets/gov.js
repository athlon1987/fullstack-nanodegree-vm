// ═══════════════════════════════════════════════════════════════════════════════════════════
// THE REPLACEMENT — set: GOV HALL  (a government service hall, fluorescent, tired)
// Shots: a3_03_gov  (its mood also informs the terminal insert a3_04_class)
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
//   import { govHall } from '../sets/gov.js';
//   const o = { look: 'gov', cam, checks: key(F.t, [...]) };   // one options object for all calls
//   govHall.back(ctx, F, o);          // hall, waiting chairs, counter top, terminal, clerk's chair, displays
//   camera(ctx, cam, 1, () => drawFigure(ctx, 'clerk', { x: 1500, y: 700, facing: -1, ...POSE.sit, seat: 150 }, ...));
//   govHall.mid(ctx, F, o);           // the glass screen along the counter (between clerk and Adam)
//   camera(ctx, cam, 1, () => drawFigure(ctx, 'adam', { x: 1060, y: 700, facing: 1, handF: A.handF, handB: A.handB, ... }, ...));
//   govHall.front(ctx, F, o);         // near end of the counter (hides the clerk's knees), foreground post, air
//
//   front() can be split like the kitchen:  front(ctx, F, {...o, part: 'furniture'}) → figure → {...o, part: 'air'}
//
// LOCATION   export const govHall — world 1920 wide, side-on. Feet stand on y = 700 (floorY).
//   Fake perspective: eye line y = 300, vanishing point x = 960. Something at depth s (1 = the
//   subject plane, smaller = farther) stands on y = 300 + 400·s and is s times as big.
//   The back wall is at depth 0.65 (it meets the floor at y = 560; ceiling line y = 105).
//
//   x:  -300–640   WAITING AREA: three rows of bolted plastic chairs, facing right, receding into
//                  depth; two waiting people seated, one standing at the notice board (soft, far)
//        60–200    EXIT door on the back wall with a green EXIT sign
//       330–560    NOTICE BOARD (back wall)
//       470–740    TICKET DISPLAY hanging from the ceiling: "NOW SERVING 083" (green LED)
//       768       WATER COOLER (back, depth 0.74)          790 WALL CLOCK (back wall, y 232)
//       690–990    QUEUE BARRIER: chrome posts + slack grey rope, the lane leads to the counter
//       840–1760   frosted wired-glass windows high on the back wall — the bright backdrop
//      1100–1630   PUBLIC DISPLAY PANEL over the counter, facing us (y 70–272), three lines + ticks
//      1150–1420   SERVICE COUNTER (top y = 430 at the near end, i.e. 270 px = 110 cm high), running
//                  away from us into depth; the customer stands at its LEFT side, the clerk at its RIGHT
//      1290       GLASS SCREEN along the counter's centre line (top y 280), speaking grille, slot
//      1360       clerk's TERMINAL (thin flat monitor in profile, screen facing right, toward the clerk)
//      1500       clerk's office chair (seat top y 550 = 150 px high task chair)
//      1600–1850  filing cabinets and a second (closed, empty) position in the back office
//
// LOOKS   'gov' only (style.js LOOK.gov): sickly fluorescent green-grey, flat overhead light from
//         recessed ceiling troffers, one tube flickering. Brightest points: the frosted window band
//         behind the counter, the troffers, the green ticks on the display.
//
// STATE VALUES  (all optional, plain numbers in o)
//   checks     0..3   public display: number of lines shown. Fractions fade the next line in
//                     (1.4 = line 1 shown, line 2 at 40 %). Lines, in order:
//                     "TAX RETURN — FILED", "DEBTS — CLEARED", "LICENCE — RENEWED". Default 0
//                     (empty slots show faint placeholders). Ramp each over ~0.35 s at check1/2/3.
//   serving    int    ticket number on the NOW SERVING display. Default 83 (shows "083")
//   flicker    0..1   how badly the bad tube (over the waiting area) stutters. Default 1
//   terminal   0..1   clerk's monitor on (pale green glow on the clerk's face). Default 1
//   clock      hours  wall-clock time, e.g. 15.7 = 15:42. Default 15.7 (second hand runs from t)
//   waiting    0..1   the soft waiting people in the chairs (0 = empty hall). Default 1
//   t          sec    ambient time (tube flicker, clock second hand, haze drift). Default F.t
//   cam        {x,y,zoom,rot}   camera (identity by default)
//   part       'all' | 'furniture' | 'air'   front() only. Default 'all'
//
// ANCHORS  govHall.anchors.<name> = {x, y} in WORLD px
//   customer     {x:1060, y:700}  ADAM stands here facing right (feet). Backed by the window band
//                                 (head/torso) and the pale counter side (legs)
//   handF        {x:1188, y:428}  front hand resting on the counter top (pass as pose.handF)
//   handB        {x:1214, y:425}  back hand on the counter top (pose.handB)
//   handSlide    {x:1100, y:520}  where the hands end up when they slide off (a3_03 `slump`)
//   counterTop   {x:1185, y:430}  near-end counter-top height for props: y = 430 (110 cm)
//   counterEdge  {x:1150, y:430}  customer-side edge of the counter top (near end)
//   glass        {x:1290, y:430}  foot of the glass screen at the near end; top at glassTop
//   glassTop     {x:1290, y:280}
//   grille       {x:1264, y:332}  centre of the speaking grille (on the glass, a little into depth)
//   slot         {x:1264, y:420}  document slot under the glass
//   clerkSeat    {x:1500, y:550}  top of the clerk's chair seat. Draw the clerk with
//                                 { x:1500, y:700, facing:-1, ...POSE.sit, seat:150 } — feet on the floor,
//                                 knees under the desk (hidden by front())
//   clerkHands   {x:1405, y:428}  clerk's hands on the keyboard
//   terminal     {x:1362, y:430}  foot of the monitor stand on the desk
//   terminalScreen {x:1368, y:376} centre of the monitor's screen face (faces right, toward the clerk)
//   display      {x:1365, y:171}  centre of the public display panel (lines at y 140, 188, 236; text x 1188–1600)
//   ticket       {x:605,  y:177}  centre of the NOW SERVING display
//   clock        {x:790,  y:232}
//   queue        {x:860,  y:700}  standing in the queue lane, next in line (facing right)
//   enter        {x:640,  y:700}  where someone walks into the lane from the waiting area
//   waitSeat     {x:330,  y:672, s:0.93} a free seat in the nearest chair row: draw a figure with
//                                 { x:330, y:672, s:0.93, ...POSE.sit } (scale 0.93)
//
// LIGHT ON CHARACTERS  govHall.lights.gov = {key, from, amount} is the rim for ADAM at the
//   counter (lit from screen right: the window band, the display, the counter glass).
//   govHall.lightAt('gov', x) for any x: the clerk's side (x > 1300) is rimmed from the left.
//
// RECOMMENDED FRAMINGS  (a3_03_gov, 11.4 s)
//   master        cam {x:1060, y:392, zoom:1.00} → {x:1110, y:380, zoom:1.07}  (slow push, waiting hall at left,
//                 counter + display on the right third; display text 36 px)
//   two-shot      cam {x:1290, y:300, zoom:1.8}  glass, display, Adam's head and the clerk all in frame
//                 (looser alternative {x:1290, y:330, zoom:1.6})
//   hands         cam {x:1195, y:420, zoom:2.6}  Adam's hands on the counter, glass foot, slot; for `slump`
//   display CU    cam {x:1365, y:185, zoom:2.4}  the three lines + ticks fill the frame
//   clerk CU      cam {x:1440, y:360, zoom:2.4}  clerk in profile, terminal glow on his face, window behind
//   ticket insert cam {x:605,  y:180, zoom:2.6}  NOW SERVING 083
//   Everything at the counter is vector (crisp to zoom 3+). The ceiling, floor and the waiting area are
//   cached at 1× and are meant for the wide only.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import {
  PW, PH, TAU, clamp, lerp, hash, noise1, wobble, rgba, mixHex, rr, linGrad, radGrad,
  glow, fog, grade, text, FONT, cached, camera,
} from '../engine.js';
import { LOOK } from '../style.js';
import { drawFigure, POSE } from '../rig.js';

// ───────────────────────────── geometry ─────────────────────────────
const FLOOR = 700, HOR = 300, VPX = 960, SB = 0.65;      // eye line, vanishing point, back-wall depth
const fy = (s) => HOR + (FLOOR - HOR) * s;              // floor line at depth s
const X = (wx, s) => VPX + (wx - VPX) * s;              // world x at depth s → screen x
const Yh = (h, s) => fy(s) - h * s;                     // height h above the floor at depth s → screen y
const WALL = { top: Yh(700, SB), base: fy(SB), rail: Yh(250, SB) };   // 105, 560, 397
const CNT = { xc: 1150, xk: 1420, h: 270, top: 430 };  // counter: customer edge, clerk edge, height
const GL = { x: 1290, h: 420 };                          // glass screen plane and top height
const DISP = { x0: 1100, x1: 1630, y0: 70, y1: 272 };
const TICK = { x0: 470, x1: 740, y0: 122, y1: 232 };
const WINS = [[842, 1060], [1080, 1300], [1320, 1540], [1560, 1780]];
const WIN_Y = [150, 372];
const LINES = ['TAX RETURN — FILED', 'DEBTS — CLEARED', 'LICENCE — RENEWED'];

// ───────────────────────────── colour ─────────────────────────────
const L = LOOK.gov;
const tone = (k) => (k <= 1 ? mixHex(L.ink, L.wall, k) : mixHex(L.wall, L.key, Math.min(1, k - 1)));
const P = {
  ink: L.ink, key: L.key, haze: L.haze,
  ceil: tone(0.92), ceilDark: tone(0.55), grid: tone(0.66), trof: '#f4f9ec', trofEdge: tone(0.5),
  wall: tone(1.08), wallDim: tone(0.86), dado: mixHex(tone(0.8), '#56705f', 0.35), rail: tone(0.5), skirt: tone(0.34),
  win: mixHex(L.key, '#ffffff', 0.25), winMid: tone(1.62), winFrame: tone(0.58), wire: tone(1.3),
  floorFar: mixHex(L.floor, L.wall, 0.5), floorNear: mixHex(L.floor, L.ink, 0.28),
  chair: mixHex(tone(0.5), '#45525e', 0.45), chairHi: mixHex(tone(0.95), '#7c8a96', 0.4), beam: tone(0.32),
  metal: tone(0.62), metalHi: tone(1.7), metalDark: tone(0.3),
  lam: mixHex(tone(1.38), '#c9c7b3', 0.25), lamShade: mixHex(tone(1.05), '#9c9c88', 0.2), lamTop: mixHex(tone(1.6), '#dcdccb', 0.3),
  lamEnd: mixHex(tone(0.62), '#6d6d5e', 0.2), lamEdge: tone(1.75), kick: tone(0.24),
  housing: tone(0.3), face: '#0e1511', faceLine: '#1b2620', txt: '#e6f0dc', tickG: '#86d98f', led: '#a7eba2',
  cork: mixHex('#86846d', tone(0.8), 0.45), paper: mixHex('#e8ead9', tone(1.4), 0.3),
  cab: tone(0.56), cabHi: tone(0.9), rope: mixHex(tone(0.4), '#3d4a5e', 0.45),
  exitG: '#7fd08a',
};
const _tones = new Map();
const hz = (c, k) => { const id = c + k.toFixed(2); let v = _tones.get(id); if (!v) { v = mixHex(c, P.haze, k); _tones.set(id, v); } return v; };

const poly = (ctx, pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); };
const fillPoly = (ctx, pts, fill) => { poly(ctx, pts); ctx.fillStyle = fill; ctx.fill(); };
const line = (ctx, x0, y0, x1, y1, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };

function resolve(F, o = {}) {
  const t = o.t ?? (F ? F.t : 0);
  const fl = clamp(o.flicker ?? 1);
  // the bad tube: long calm stretches, then a stutter burst
  const burst = clamp((noise1(t * 0.42, 11) - 0.5) * 6) * fl;
  const chop = hash(Math.floor(t * 17) + 77) < 0.5 ? 0.85 : 0.12;
  const bad = clamp(1 - burst * chop - 0.06 * fl);
  return {
    look: 'gov', cam: o.cam || null, t,
    checks: clamp(o.checks ?? 0, 0, 3), serving: Math.round(o.serving ?? 83),
    bad, hum: 1 + 0.01 * wobble(t, 9, 3),
    terminal: clamp(o.terminal ?? 1), clock: o.clock ?? 15.7, waiting: clamp(o.waiting ?? 1),
    part: o.part || 'all',
  };
}

// ───────────────────────────── ceiling ─────────────────────────────
const TROF_ROWS = [0.68, 0.8, 0.95, 1.14];
const TROF_COLS = [-420, 160, 740, 1320, 1900];
const BAD = { row: 1, col: 1 };
function drawCeiling(ctx, S) {
  ctx.fillStyle = linGrad(ctx, 0, WALL.top, 0, -300, [[0, P.ceil], [1, P.ceilDark]]);
  ctx.fillRect(-2400, -1600, 6720, 1600 + WALL.top + 1);
  // suspended-ceiling grid
  ctx.strokeStyle = rgba(P.grid, 0.55); ctx.lineWidth = 1.2; ctx.beginPath();
  for (let i = -30; i <= 30; i++) { const wx = VPX + i * 145; ctx.moveTo(X(wx, SB), WALL.top); ctx.lineTo(X(wx, 2.4), Yh(700, 2.4)); }
  for (let z = 0; z < 14; z++) { const s = SB / (1 - z * 0.075); if (s > 2.4) break; const y = Yh(700, s); ctx.moveTo(-2400, y); ctx.lineTo(4300, y); }
  ctx.stroke();
  // recessed troffers, seen from below
  TROF_ROWS.forEach((s0, r) => {
    const s1 = s0 * 1.075;
    TROF_COLS.forEach((wx, c) => {
      const isBad = r === BAD.row && c === BAD.col;
      const on = isBad ? S.bad : S.hum;
      const q = [[X(wx, s0), Yh(700, s0)], [X(wx + 290, s0), Yh(700, s0)], [X(wx + 290, s1), Yh(700, s1)], [X(wx, s1), Yh(700, s1)]];
      fillPoly(ctx, q, P.trofEdge);
      const inset = (k) => q.map(([x, y], i) => [lerp(x, (q[0][0] + q[2][0]) / 2, k), lerp(y, (q[0][1] + q[2][1]) / 2, k * 0.6)]);
      fillPoly(ctx, inset(0.06), mixHex(P.grid, P.trof, clamp(on)));
      if (isBad) { // dark tube ends
        const qi = inset(0.06), xa = qi[0][0], xb = qi[1][0];
        ctx.fillStyle = rgba(P.ink, 0.35 + 0.3 * (1 - on));
        ctx.fillRect(xa, Math.min(qi[0][1], qi[3][1]), (xb - xa) * 0.07, Math.abs(qi[3][1] - qi[0][1]) + 1);
        ctx.fillRect(xb - (xb - xa) * 0.07, Math.min(qi[0][1], qi[3][1]), (xb - xa) * 0.07, Math.abs(qi[3][1] - qi[0][1]) + 1);
      }
    });
  });
}

// ───────────────────────────── back wall ─────────────────────────────
function drawWall(ctx, S) {
  const x0 = -2400, x1 = 4320;
  // upper paint: brighter behind the counter where the windows are
  ctx.fillStyle = linGrad(ctx, -300, 0, 2200, 0, [[0, P.wallDim], [0.35, mixHex(P.wallDim, P.wall, 0.5)], [0.5, P.wall], [0.8, P.wall], [1, P.wallDim]]);
  ctx.fillRect(x0, WALL.top, x1 - x0, WALL.rail - WALL.top);
  // light scallops from the ceiling troffers
  for (const wx of TROF_COLS) {
    const cx = X(wx + 145, 0.7);
    const isBad = wx === TROF_COLS[BAD.col];
    glow(ctx, cx, WALL.top + 30, 260, L.key, 0.16 * (isBad ? S.bad : 1), 0.9);
  }
  ctx.fillStyle = linGrad(ctx, 0, WALL.top, 0, WALL.top + 40, [[0, rgba(P.ink, 0.25)], [1, rgba(P.ink, 0)]]);
  ctx.fillRect(x0, WALL.top, x1 - x0, 40);
  // dado (lower paint), rail, skirting
  ctx.fillStyle = linGrad(ctx, 0, WALL.rail, 0, WALL.base, [[0, P.dado], [1, mixHex(P.dado, P.ink, 0.22)]]);
  ctx.fillRect(x0, WALL.rail, x1 - x0, WALL.base - WALL.rail);
  ctx.fillStyle = P.rail; ctx.fillRect(x0, WALL.rail - 3, x1 - x0, 6);
  ctx.fillStyle = rgba(L.key, 0.35); ctx.fillRect(x0, WALL.rail - 3, x1 - x0, 1.2);
  ctx.fillStyle = P.skirt; ctx.fillRect(x0, WALL.base - 12, x1 - x0, 12);
  // scuffs on the dado where chairs have rubbed
  ctx.strokeStyle = rgba(P.ink, 0.12); ctx.lineWidth = 1.4; ctx.beginPath();
  for (let i = 0; i < 40; i++) { const x = -260 + hash(i * 3 + 1) * 1100, y = WALL.rail + 60 + hash(i * 5 + 2) * 70, w = 8 + hash(i * 7) * 26; ctx.moveTo(x, y); ctx.lineTo(x + w, y + (hash(i) - 0.5) * 4); }
  ctx.stroke();
  drawWindows(ctx, S);
  drawExit(ctx);
  drawNotice(ctx);
  drawClock(ctx, S);
}
function drawWindows(ctx, S) {
  const [y0, y1] = WIN_Y;
  for (const [a, b] of WINS) {
    ctx.fillStyle = P.winFrame; ctx.fillRect(a - 7, y0 - 7, b - a + 14, y1 - y0 + 14);
    ctx.fillStyle = linGrad(ctx, 0, y0, 0, y1, [[0, P.win], [0.6, mixHex(P.win, P.winMid, 0.4)], [1, P.winMid]]);
    ctx.fillRect(a, y0, b - a, y1 - y0);
    // wired glass: diamond mesh, very faint
    ctx.save(); ctx.beginPath(); ctx.rect(a, y0, b - a, y1 - y0); ctx.clip();
    ctx.strokeStyle = rgba(P.wire, 0.28); ctx.lineWidth = 0.8; ctx.beginPath();
    for (let k = -260; k < 260; k += 14) { ctx.moveTo(a + k, y0); ctx.lineTo(a + k + (y1 - y0), y1); ctx.moveTo(b - k, y0); ctx.lineTo(b - k - (y1 - y0), y1); }
    ctx.stroke();
    // soft shapes of the street beyond the frosting (a tree, a building edge)
    ctx.fillStyle = rgba(P.winMid, 0.35);
    ctx.beginPath(); ctx.ellipse(a + (b - a) * hash(a), y1 - 30, 70, 50, 0, 0, TAU); ctx.fill();
    ctx.restore();
    // mullions + transom
    ctx.fillStyle = P.winFrame;
    ctx.fillRect((a + b) / 2 - 3, y0, 6, y1 - y0); ctx.fillRect(a, y0 + 74, b - a, 5);
    ctx.fillStyle = rgba(P.ink, 0.25); ctx.fillRect(a - 7, y1 + 7, b - a + 14, 5);    // sill shadow
    ctx.fillStyle = tone(1.2); ctx.fillRect(a - 10, y1 + 5, b - a + 20, 4);
  }
  // the light spilling from the band onto the wall around it
  glow(ctx, 1300, 262, 720, L.key, 0.22, 0.42);
}
function drawExit(ctx) {
  const x0 = 62, x1 = 200, top = Yh(490, SB) + 4;
  ctx.fillStyle = P.winFrame; ctx.fillRect(x0 - 6, top - 6, x1 - x0 + 12, WALL.base - top + 6);
  ctx.fillStyle = mixHex(P.wallDim, P.ink, 0.25); ctx.fillRect(x0, top, x1 - x0, WALL.base - top);
  ctx.fillStyle = rgba(L.key, 0.18); ctx.fillRect((x0 + x1) / 2 - 1, top, 2, WALL.base - top);
  ctx.fillStyle = mixHex(P.wallDim, P.key, 0.25); ctx.fillRect(x0 + 18, top + 22, 44, 70); ctx.fillRect(x1 - 62, top + 22, 44, 70);
  ctx.fillStyle = P.metal; ctx.fillRect(x0 + 10, top + 150, x1 - x0 - 20, 7);                       // push bar
  // green exit sign
  const sx = (x0 + x1) / 2, sy = top - 30;
  ctx.fillStyle = P.housing; ctx.fillRect(sx - 48, sy - 16, 96, 32);
  ctx.fillStyle = '#2f6b3c'; ctx.fillRect(sx - 45, sy - 13, 90, 26);
  text(ctx, 'EXIT', sx + 10, sy + 6, { size: 17, weight: 700, family: FONT.sans, color: '#e8f6e4', align: 'center', tracking: 2 });
  ctx.fillStyle = '#e8f6e4'; ctx.beginPath(); ctx.arc(sx - 30, sy - 6, 3, 0, TAU); ctx.fill();
  line(ctx, sx - 31, sy - 2, sx - 34, sy + 6, 2.5, '#e8f6e4'); line(ctx, sx - 34, sy + 6, sx - 38, sy + 11, 2.2, '#e8f6e4'); line(ctx, sx - 34, sy + 6, sx - 29, sy + 11, 2.2, '#e8f6e4');
  glow(ctx, sx, sy, 90, P.exitG, 0.14);
}
function drawNotice(ctx) {
  const x0 = 330, x1 = 560, y0 = 262, y1 = 378;
  ctx.fillStyle = rgba(P.ink, 0.2); ctx.fillRect(x0 + 4, y0 + 5, x1 - x0, y1 - y0);
  ctx.fillStyle = P.metal; ctx.fillRect(x0 - 5, y0 - 5, x1 - x0 + 10, y1 - y0 + 10);
  ctx.fillStyle = P.cork; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const papers = [[342, 270, 52, 66, -2], [402, 274, 60, 44, 1.5], [470, 268, 44, 58, -1], [522, 278, 30, 40, 3], [404, 326, 46, 44, -3], [458, 334, 64, 36, 1], [346, 342, 40, 30, 4]];
  papers.forEach(([x, y, w, h, r], i) => {
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate((r * Math.PI) / 180);
    ctx.fillStyle = i === 2 ? mixHex(P.paper, '#c9d4a8', 0.4) : P.paper; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = rgba(P.ink, 0.28);
    for (let k = 0; k < Math.floor(h / 8) - 1; k++) ctx.fillRect(-w / 2 + 5, -h / 2 + 8 + k * 7, (w - 10) * (0.5 + 0.5 * hash(i * 31 + k)), 2);
    ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(0, -h / 2 + 3, 1.8, 0, TAU); ctx.fill();
    ctx.restore();
  });
}
function drawClock(ctx, S) {
  const x = 790, y = 232, r = 27;
  ctx.fillStyle = rgba(P.ink, 0.2); ctx.beginPath(); ctx.arc(x + 3, y + 4, r + 3, 0, TAU); ctx.fill();
  ctx.fillStyle = P.housing; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, TAU); ctx.fill();
  ctx.fillStyle = mixHex('#eef2e6', P.wall, 0.15); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = P.ink;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.fillRect(x + Math.sin(a) * (r - 5) - 1, y - Math.cos(a) * (r - 5) - 1, 2, 2); }
  const h = S.clock % 12, m = (S.clock * 60) % 60, sec = Math.floor(S.t) % 60;
  const hand = (ang, len, w, col) => line(ctx, x, y, x + Math.sin(ang) * len, y - Math.cos(ang) * len, w, col);
  ctx.lineCap = 'round';
  hand((h / 12) * TAU, r * 0.5, 3, P.ink); hand((m / 60) * TAU, r * 0.78, 2, P.ink);
  hand((sec / 60) * TAU, r * 0.84, 0.9, '#4f5a50');
  ctx.lineCap = 'butt';
}

// ───────────────────────────── floor (cached, wide shots only) ─────────────────────────────
const FL = { x: -900, y: WALL.base - 2, w: 3720, h: 330 };
function floorImage() {
  return cached('gov-floor', FL.w, FL.h, (c) => {
    c.translate(-FL.x, -FL.y);
    c.fillStyle = linGrad(c, 0, WALL.base, 0, 860, [[0, P.floorFar], [1, P.floorNear]]);
    c.fillRect(FL.x, FL.y, FL.w, FL.h);
    // lino tiles: depth rows (uniform in 1/s) × columns converging on the vanishing point
    const rows = []; for (let k = 0; k < 16; k++) { const s = SB / (1 - k * 0.042); if (s > 1.7) break; rows.push(s); }
    for (let r = 0; r < rows.length - 1; r++) {
      const sa = rows[r], sb = rows[r + 1];
      for (let i = -24; i <= 24; i++) {
        if ((i + r) % 2) continue;
        const wa = VPX + i * 150, wb = wa + 150;
        fillPoly(c, [[X(wa, sa), fy(sa)], [X(wb, sa), fy(sa)], [X(wb, sb), fy(sb)], [X(wa, sb), fy(sb)]], rgba(L.key, 0.035 + 0.02 * hash(i * 13 + r)));
      }
    }
    c.strokeStyle = rgba(P.ink, 0.16); c.lineWidth = 1; c.beginPath();
    for (const s of rows) { c.moveTo(FL.x, fy(s)); c.lineTo(FL.x + FL.w, fy(s)); }
    for (let i = -24; i <= 25; i++) { const wx = VPX + i * 150; c.moveTo(X(wx, SB), fy(SB)); c.lineTo(X(wx, 1.7), fy(1.7)); }
    c.stroke();
    // dull reflections of the window band and the counter side
    c.save(); c.filter = 'blur(10px)'; c.globalCompositeOperation = 'lighter';
    for (const [a, b] of WINS) {
      c.fillStyle = linGrad(c, 0, WALL.base, 0, 820, [[0, rgba(L.key, 0.2)], [0.5, rgba(L.key, 0.07)], [1, rgba(L.key, 0)]]);
      c.fillRect(a + 14, WALL.base + 2, b - a - 28, 260);
    }
    c.fillStyle = linGrad(c, 0, 700, 0, 800, [[0, rgba(P.lam, 0.14)], [1, rgba(P.lam, 0)]]); c.fillRect(1150, 700, 270, 100);
    c.restore();
    // worn path: the lane and the stretch in front of the counter are paler and smoother
    c.save(); c.filter = 'blur(18px)'; c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(L.key, 0.06);
    c.beginPath(); c.ellipse(1000, 690, 300, 36, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(820, 650, 260, 22, 0, 0, TAU); c.fill();
    c.restore();
    // scuffs and heel marks
    c.strokeStyle = rgba(P.ink, 0.22); c.lineWidth = 1.5; c.lineCap = 'round';
    for (let i = 0; i < 160; i++) {
      const s = SB + hash(i * 7 + 1) * 0.95, x = X(-500 + hash(i * 11 + 2) * 3000, s), y = fy(s) + (hash(i) - 0.5) * 6, w = (6 + hash(i * 5) * 22) * s;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 2 - hash(i * 3) * 3, x + w, y + (hash(i * 9) - 0.5) * 3); c.stroke();
    }
  });
}

// ───────────────────────────── waiting area (cached, soft) ─────────────────────────────
const ROWS_X = [-160, 120, 400];
const CHAIR_S = [0.95, 0.87, 0.8, 0.74, 0.69];
const SITTERS = [
  { row: 1, i: 2, who: 'extraF', pose: { ...POSE.sitHunched, head: 22 } },
  { row: 2, i: 3, who: 'extraM', pose: { ...POSE.sit, lean: 6, head: 10, curl: 10 } },
];
function chairProfile(c, x, s, col, hi) {
  const F = fy(s), u = s;
  // shell: back (left, chair faces right) + seat
  c.fillStyle = col; c.beginPath();
  c.moveTo(x - 30 * u, F - 212 * u);
  c.quadraticCurveTo(x - 20 * u, F - 216 * u, x - 18 * u, F - 200 * u);
  c.lineTo(x - 14 * u, F - 128 * u);
  c.quadraticCurveTo(x - 12 * u, F - 116 * u, x + 2 * u, F - 116 * u);
  c.lineTo(x + 40 * u, F - 114 * u);
  c.quadraticCurveTo(x + 48 * u, F - 113 * u, x + 47 * u, F - 104 * u);
  c.lineTo(x + 2 * u, F - 101 * u);
  c.quadraticCurveTo(x - 24 * u, F - 104 * u, x - 26 * u, F - 126 * u);
  c.lineTo(x - 36 * u, F - 204 * u);
  c.closePath(); c.fill();
  c.fillStyle = hi; c.fillRect(x + 2 * u, F - 117 * u, 40 * u, 2.2 * u);
  // seat bracket down to the beam
  c.fillStyle = P.beam; c.fillRect(x - 2 * u, F - 104 * u, 6 * u, 14 * u);
}
function waitingImage(on) {
  return cached('gov-wait-' + (on ? 1 : 0), 1500, 520, (c) => {
    const ox = -560, oy = 200;
    c.translate(-ox, -oy);
    const items = [];
    ROWS_X.forEach((wx, r) => CHAIR_S.forEach((s, i) => items.push({ s, r, i, kind: 'chair', wx })));
    if (on) {
      for (const p of SITTERS) items.push({ s: CHAIR_S[p.i] - 0.001, r: p.row, i: p.i, kind: 'fig', p, wx: ROWS_X[p.row] });
      items.push({ s: 0.68, kind: 'stand', wx: 470 });
    }
    items.sort((a, b) => a.s - b.s);
    for (const it of items) {
      const s = it.s, k = clamp((1 - s) * 1.25);           // haze by depth
      const x = X(it.wx, s);
      if (it.kind === 'chair') {
        chairProfile(c, x, s, hz(P.chair, k * 0.8), hz(P.chairHi, k * 0.6));
        // the beam connecting a row and its feet
        if (it.i < CHAIR_S.length - 1) {
          const s2 = CHAIR_S[it.i + 1];
          c.strokeStyle = hz(P.beam, k * 0.8); c.lineWidth = 6 * s;
          c.beginPath(); c.moveTo(x + 1, fy(s) - 92 * s); c.lineTo(X(it.wx, s2) + 1, fy(s2) - 92 * s2); c.stroke();
        }
        if (it.i === 0 || it.i === 2 || it.i === 4) {
          c.fillStyle = hz(P.beam, k * 0.8);
          c.fillRect(x - 3 * s, fy(s) - 92 * s, 6 * s, 92 * s); c.fillRect(x - 24 * s, fy(s) - 5 * s, 50 * s, 5 * s);
        }
      } else if (it.kind === 'fig') {
        drawFigure(c, it.p.who, { x: x + 6 * s, y: fy(s), s, facing: 1, ...it.p.pose }, { ink: hz(P.ink, 0.12 + k * 0.4), light: { color: L.key, from: 1, amount: 0.25 } });
      } else {
        drawFigure(c, 'extraM', { x, y: fy(s), s, facing: -1, ...POSE.stand, head: -6, armF: [30, 100], armB: [-6, 10] }, { ink: hz(P.ink, 0.4), light: { color: L.key, from: -1, amount: 0.2 } });
      }
    }
    // a bag left on a seat
    const bs = CHAIR_S[1], bx = X(ROWS_X[0], bs);
    c.fillStyle = hz(P.ink, 0.4); rr(c, bx - 6 * bs, fy(bs) - 160 * bs, 44 * bs, 46 * bs, 6 * bs); c.fill();
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = rgba(P.haze, 0.06); c.fillRect(ox, oy, 1500, 520);
  });
}

// ───────────────────────────── mid-ground objects ─────────────────────────────
function drawCooler(ctx) {
  const s = 0.74, x = X(700, s), F = fy(s), u = s;
  ctx.fillStyle = rgba(P.ink, 0.22); ctx.beginPath(); ctx.ellipse(x, F, 50 * u, 6 * u, 0, 0, TAU); ctx.fill();
  // cabinet
  ctx.fillStyle = linGrad(ctx, x - 40 * u, 0, x + 40 * u, 0, [[0, tone(1.1)], [0.6, tone(1.3)], [1, tone(0.9)]]);
  rr(ctx, x - 40 * u, F - 250 * u, 80 * u, 248 * u, 6 * u); ctx.fill();
  ctx.fillStyle = tone(0.5); ctx.fillRect(x - 30 * u, F - 196 * u, 60 * u, 22 * u);              // drip recess
  ctx.fillStyle = P.metal; ctx.fillRect(x - 12 * u, F - 204 * u, 8 * u, 10 * u); ctx.fillRect(x + 6 * u, F - 204 * u, 8 * u, 10 * u);
  ctx.fillStyle = tone(0.8); ctx.fillRect(x - 32 * u, F - 176 * u, 64 * u, 4 * u);
  // bottle
  ctx.fillStyle = rgba(mixHex(P.win, '#c8d6c6', 0.5), 0.75);
  ctx.beginPath(); ctx.moveTo(x - 8 * u, F - 250 * u); ctx.lineTo(x - 8 * u, F - 262 * u);
  ctx.quadraticCurveTo(x - 34 * u, F - 268 * u, x - 34 * u, F - 300 * u); ctx.lineTo(x - 34 * u, F - 352 * u);
  ctx.quadraticCurveTo(x, F - 366 * u, x + 34 * u, F - 352 * u); ctx.lineTo(x + 34 * u, F - 300 * u);
  ctx.quadraticCurveTo(x + 34 * u, F - 268 * u, x + 8 * u, F - 262 * u); ctx.lineTo(x + 8 * u, F - 250 * u); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(tone(1.5), 0.5); ctx.fillRect(x - 34 * u, F - 318 * u, 68 * u, 2 * u);          // water line
  ctx.fillStyle = rgba('#ffffff', 0.45); ctx.fillRect(x + 18 * u, F - 345 * u, 5 * u, 40 * u);
  // cup dispenser on the side
  ctx.fillStyle = tone(0.9); ctx.fillRect(x + 40 * u, F - 240 * u, 10 * u, 70 * u);
}
function drawCabinets(ctx) {
  const s = 0.72, F = fy(s);
  for (let i = 0; i < 4; i++) {
    const a = X(1700 + i * 115, s), b = X(1812 + i * 115, s), top = Yh(320, s);
    ctx.fillStyle = hz(P.cab, 0.2); ctx.fillRect(a, top, b - a, F - top);
    ctx.fillStyle = hz(P.cabHi, 0.2); ctx.fillRect(a, top, b - a, 2);
    for (let d = 0; d < 4; d++) {
      const y = top + 6 + d * ((F - top - 12) / 4);
      ctx.fillStyle = rgba(P.ink, 0.25); ctx.fillRect(a + 3, y + (F - top - 12) / 4 - 3, b - a - 6, 1.5);
      ctx.fillStyle = hz(P.metal, 0.1); ctx.fillRect((a + b) / 2 - 10, y + 12, 20, 4);
    }
  }
  // a box file and a dead plant on top
  const tx = X(1930, s), ty = Yh(320, s);
  ctx.fillStyle = hz(P.cab, 0.05); ctx.fillRect(tx, ty - 34, 50, 34);
  const px = X(2120, s);
  ctx.fillStyle = hz(P.metalDark, 0.2); ctx.fillRect(px - 14, ty - 26, 28, 26);
  ctx.strokeStyle = hz(P.metalDark, 0.25); ctx.lineWidth = 2; ctx.beginPath();
  for (let k = 0; k < 6; k++) { const a = -1.2 + k * 0.45; ctx.moveTo(px, ty - 24); ctx.quadraticCurveTo(px + Math.sin(a) * 20, ty - 50, px + Math.sin(a) * 34, ty - 40 + k * 3); }
  ctx.stroke();
}
function drawStanchions(ctx) {
  const post = (wx, s) => {
    const x = X(wx, s), F = fy(s), top = Yh(240, s);
    ctx.fillStyle = rgba(P.ink, 0.25); ctx.beginPath(); ctx.ellipse(x, F, 26 * s, 4 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = P.metalDark; ctx.beginPath(); ctx.ellipse(x, F - 3 * s, 22 * s, 5 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = linGrad(ctx, x - 5 * s, 0, x + 5 * s, 0, [[0, P.metal], [0.4, P.metalHi], [1, P.metalDark]]);
    ctx.fillRect(x - 4.5 * s, top, 9 * s, F - top - 3 * s);
    ctx.beginPath(); ctx.arc(x, top, 7 * s, 0, TAU); ctx.fill();
    return [x, top + 8 * s];
  };
  const rope = (a, b, s) => {
    ctx.strokeStyle = P.rope; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 34 * s, b[0], b[1]); ctx.stroke();
    ctx.strokeStyle = rgba(L.key, 0.25); ctx.lineWidth = 1.5 * s;
    ctx.beginPath(); ctx.moveTo(a[0], a[1] - 2.5 * s); ctx.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 31 * s, b[0], b[1] - 2.5 * s); ctx.stroke();
    ctx.lineCap = 'butt';
  };
  // far line of the lane (depth 0.84), then the near line (depth 1)
  const f1 = post(700, 0.84), f2 = post(1000, 0.84);
  rope(f1, f2, 0.84);
  const n1 = post(690, 1), n2 = post(930, 1);
  rope(n1, n2, 1);
}

// ───────────────────────────── the counter ─────────────────────────────
function drawCounterBack(ctx, S) {
  const sN = 1, sF = SB + 0.005;
  const topN = Yh(CNT.h, sN), topF = Yh(CNT.h, sF);
  // customer-side face, receding: pale laminate (Adam's legs read against it)
  const face = [[X(CNT.xc, sN), topN], [X(CNT.xc, sF), topF], [X(CNT.xc, sF), fy(sF)], [X(CNT.xc, sN), fy(sN)]];
  fillPoly(ctx, face, linGrad(ctx, X(CNT.xc, sF), 0, X(CNT.xc, sN), 0, [[0, P.lamShade], [1, P.lam]]));
  // panel seams on that face, and a dark kick
  ctx.strokeStyle = rgba(P.ink, 0.18); ctx.lineWidth = 1.2; ctx.beginPath();
  for (const s of [0.9, 0.8, 0.72]) { ctx.moveTo(X(CNT.xc, s), Yh(CNT.h - 8, s)); ctx.lineTo(X(CNT.xc, s), fy(s) - 14 * s); }
  ctx.stroke();
  fillPoly(ctx, [[X(CNT.xc, sN), fy(sN) - 16], [X(CNT.xc, sF), fy(sF) - 16 * sF], [X(CNT.xc, sF), fy(sF)], [X(CNT.xc, sN), fy(sN)]], P.kick);
  // top surface (seen from slightly above)
  const top = [[X(CNT.xc - 6, sN), topN], [X(CNT.xk, sN), topN], [X(CNT.xk, sF), topF], [X(CNT.xc - 6, sF), topF]];
  fillPoly(ctx, top, linGrad(ctx, 0, topF, 0, topN, [[0, mixHex(P.lamTop, P.lamShade, 0.4)], [1, P.lamTop]]));
  // the lip line along the customer edge
  line(ctx, X(CNT.xc - 6, sN), topN + 1, X(CNT.xc - 6, sF), topF + 1, 2, P.lamEdge);
  // light from the window band lying on the counter top
  glow(ctx, 1210, 420, 160, L.key, 0.12, 0.12);
  // divider between positions (a frosted side screen on the customer half, depth 0.82)
  const sd = 0.82;
  const dv = [[X(CNT.xc, sd), Yh(CNT.h, sd)], [X(GL.x, sd), Yh(CNT.h, sd)], [X(GL.x, sd), Yh(GL.h - 20, sd)], [X(CNT.xc, sd), Yh(GL.h - 20, sd)]];
  fillPoly(ctx, dv, rgba(mixHex(P.win, P.lam, 0.3), 0.72));
  ctx.strokeStyle = P.metal; ctx.lineWidth = 2.5; poly(ctx, dv); ctx.stroke();
  // items on the counter: pen on a chain, leaflet holder at the far position
  const ps = 0.95, pxl = X(1236, ps), pyl = Yh(CNT.h, ps);
  ctx.fillStyle = P.metalDark; ctx.fillRect(pxl - 6, pyl - 3, 12, 3);
  ctx.strokeStyle = P.metal; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pxl, pyl - 2);
  ctx.quadraticCurveTo(pxl - 12, pyl + 1, pxl - 26, pyl - 1); ctx.stroke();
  ctx.fillStyle = P.ink; ctx.save(); ctx.translate(pxl - 34, pyl - 2); ctx.rotate(-0.06); ctx.fillRect(-14, -2, 28, 3.4); ctx.restore();
  const ls = 0.76, lx = X(1175, ls), ly = Yh(CNT.h, ls);
  ctx.fillStyle = rgba(P.winMid, 0.8); ctx.fillRect(lx - 14, ly - 34, 30, 34);
  ctx.fillStyle = P.paper; ctx.fillRect(lx - 10, ly - 30, 22, 26);
  ctx.fillStyle = mixHex(P.paper, '#9fb39a', 0.5); ctx.fillRect(lx - 10, ly - 30, 22, 7);
  // clerk's side: papers tray, keyboard, terminal
  const ts = 0.88, tx = X(1395, ts), ty = Yh(CNT.h, ts);
  ctx.fillStyle = P.housing; ctx.fillRect(tx - 30, ty - 12, 60, 12);
  ctx.fillStyle = P.paper; ctx.fillRect(tx - 26, ty - 16, 52, 5); ctx.fillStyle = mixHex(P.paper, P.ink, 0.15); ctx.fillRect(tx - 24, ty - 19, 50, 3);
  drawTerminal(ctx, S);
}
function drawTerminal(ctx, S) {
  const y = CNT.top;
  // keyboard (wedge, seen side-on)
  ctx.fillStyle = P.housing; poly(ctx, [[1384, y], [1448, y], [1448, y - 5], [1386, y - 9]]); ctx.fill();
  ctx.fillStyle = tone(0.7); ctx.fillRect(1388, y - 10, 58, 1.5);
  // monitor stand + thin flat panel, tilted back a little, screen facing right
  ctx.fillStyle = P.housing; ctx.fillRect(1340, y - 4, 44, 4); ctx.fillRect(1356, y - 52, 8, 50);
  ctx.save(); ctx.translate(1366, 376); ctx.rotate(-0.07);
  ctx.fillStyle = P.housing; rr(ctx, -9, -44, 15, 88, 3); ctx.fill();
  ctx.fillStyle = mixHex(P.housing, P.ink, 0.4); ctx.fillRect(-12, -14, 5, 30);                        // back bulge
  ctx.fillStyle = mixHex(P.face, '#cfe8c0', 0.55 * S.terminal); ctx.fillRect(5, -40, 2.4, 80);       // the lit screen edge
  ctx.restore();
  // a sticky note on the bezel, a mug
  ctx.fillStyle = mixHex(P.paper, '#d6d9a0', 0.4); ctx.fillRect(1371, 330, 3, 14);
  ctx.fillStyle = tone(1.25); rr(ctx, 1452, y - 30, 18, 30, 3); ctx.fill();
  ctx.strokeStyle = tone(1.25); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(1472, y - 16, 7, -1.2, 1.2); ctx.stroke();
}
function drawClerkChair(ctx) {
  const x = 1500, seat = 550;
  ctx.fillStyle = rgba(P.ink, 0.25); ctx.beginPath(); ctx.ellipse(x, FLOOR, 70, 7, 0, 0, TAU); ctx.fill();
  // five-star base, gas lift
  ctx.fillStyle = P.metalDark;
  ctx.beginPath(); ctx.moveTo(x - 62, FLOOR - 12); ctx.lineTo(x, FLOOR - 30); ctx.lineTo(x + 62, FLOOR - 12); ctx.lineTo(x + 62, FLOOR - 6); ctx.lineTo(x, FLOOR - 22); ctx.lineTo(x - 62, FLOOR - 6); ctx.closePath(); ctx.fill();
  for (const cx of [x - 58, x + 58, x - 14]) { ctx.beginPath(); ctx.arc(cx, FLOOR - 6, 6, 0, TAU); ctx.fill(); }
  ctx.fillStyle = linGrad(ctx, x - 6, 0, x + 6, 0, [[0, P.metal], [0.5, P.metalHi], [1, P.metalDark]]);
  ctx.fillRect(x - 5, seat + 14, 10, FLOOR - 30 - seat - 14);
  // seat pad + back (behind him, on the right)
  ctx.fillStyle = mixHex(P.chair, P.ink, 0.35);
  rr(ctx, x - 52, seat, 104, 16, 7); ctx.fill();
  ctx.fillRect(x + 44, seat - 30, 8, 40);
  rr(ctx, x + 40, seat - 200, 26, 172, 10); ctx.fill();
}

// ───────────────────────────── displays ─────────────────────────────
function tickMark(ctx, x, y, size, alpha, flash) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.fillStyle = P.tickG; rr(ctx, x - size / 2, y - size / 2, size, size, size * 0.18); ctx.fill();
  ctx.strokeStyle = P.face; ctx.lineWidth = size * 0.14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - size * 0.26, y + size * 0.02); ctx.lineTo(x - size * 0.06, y + size * 0.22); ctx.lineTo(x + size * 0.28, y - size * 0.22); ctx.stroke();
  ctx.restore();
  glow(ctx, x, y, size * 1.6, P.tickG, (0.18 + 0.5 * flash) * alpha);
}
function drawDisplay(ctx, S) {
  const { x0, x1, y0, y1 } = DISP;
  // ceiling rods
  ctx.fillStyle = P.metalDark; ctx.fillRect(x0 + 60, -400, 4, y0 + 400); ctx.fillRect(x1 - 64, -400, 4, y0 + 400);
  // housing
  ctx.fillStyle = rgba(P.ink, 0.25); ctx.fillRect(x0 + 6, y1, x1 - x0 - 6, 8);
  ctx.fillStyle = P.housing; rr(ctx, x0, y0, x1 - x0, y1 - y0, 6); ctx.fill();
  ctx.fillStyle = tone(0.55); ctx.fillRect(x0 + 4, y0 + 1, x1 - x0 - 8, 2);
  // face
  const fx0 = x0 + 12, fy0 = y0 + 12, fw = x1 - x0 - 24, fh = y1 - y0 - 24;
  ctx.fillStyle = linGrad(ctx, 0, fy0, 0, fy0 + fh, [[0, '#131c17'], [1, P.face]]); ctx.fillRect(fx0, fy0, fw, fh);
  // header strip
  ctx.fillStyle = P.faceLine; ctx.fillRect(fx0, fy0, fw, 30);
  text(ctx, 'CITIZEN RECORD  ·  CASE 083', fx0 + 18, fy0 + 21, { size: 17, weight: 500, family: FONT.mono, color: P.txt, alpha: 0.62, tracking: 2.5 });
  text(ctx, 'STATUS', fx0 + fw - 18, fy0 + 21, { size: 17, weight: 500, family: FONT.mono, color: P.txt, alpha: 0.4, tracking: 2.5, align: 'right' });
  // three lines
  LINES.forEach((str, i) => {
    const cyl = 140 + i * 48, a = clamp(S.checks - i), e = a * a * (3 - 2 * a);
    const flash = a > 0 && a < 1 ? Math.sin(a * Math.PI) : 0;
    if (a < 1) { // empty slot placeholder
      ctx.fillStyle = rgba(P.txt, 0.07 * (1 - e));
      for (let k = 0; k < 16; k++) ctx.fillRect(1188 + k * 24, cyl - 1, 12, 3);
      ctx.strokeStyle = rgba(P.txt, 0.12 * (1 - e)); ctx.lineWidth = 1.5; ctx.strokeRect(1135, cyl - 17, 34, 34);
    }
    tickMark(ctx, 1152, cyl, 34, e, flash);
    text(ctx, str, 1188, cyl + 13, { size: 36, weight: 500, family: FONT.mono, color: P.txt, alpha: e, tracking: 1 });
    if (i < 2) { ctx.fillStyle = rgba(P.txt, 0.06); ctx.fillRect(fx0 + 14, cyl + 24, fw - 28, 1); }
  });
  // scanlines + glass sheen
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = fy0 + 1; y < fy0 + fh; y += 3) ctx.fillRect(fx0, y, fw, 1);
  ctx.fillStyle = linGrad(ctx, fx0, fy0, fx0 + fw * 0.5, fy0 + fh, [[0, 'rgba(255,255,255,0.05)'], [0.45, 'rgba(255,255,255,0.0)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(fx0, fy0, fw, fh);
  // the panel's own light
  glow(ctx, (x0 + x1) / 2, (y0 + y1) / 2, 360, P.tickG, 0.025 + 0.025 * S.checks, 0.5);
}
function drawTicket(ctx, S) {
  const { x0, x1, y0, y1 } = TICK, cx = (x0 + x1) / 2;
  ctx.fillStyle = P.metalDark; ctx.fillRect(x0 + 30, -400, 3, y0 + 400); ctx.fillRect(x1 - 33, -400, 3, y0 + 400);
  ctx.fillStyle = rgba(P.ink, 0.25); ctx.fillRect(x0 + 5, y1, x1 - x0 - 5, 6);
  ctx.fillStyle = P.housing; rr(ctx, x0, y0, x1 - x0, y1 - y0, 5); ctx.fill();
  ctx.fillStyle = '#070a08'; ctx.fillRect(x0 + 10, y0 + 10, x1 - x0 - 20, y1 - y0 - 20);
  const num = String(S.serving).padStart(3, '0');
  const sh = { color: P.led, blur: 10 };
  text(ctx, 'NOW SERVING', cx, y0 + 44, { size: 30, weight: 600, family: FONT.mono, color: P.led, align: 'center', tracking: 1, shadow: sh });
  text(ctx, num, cx, y1 - 18, { size: 60, weight: 700, family: FONT.mono, color: P.led, align: 'center', tracking: 8, shadow: sh });
  // LED matrix
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (let x = x0 + 10; x < x1 - 10; x += 3.5) ctx.fillRect(x, y0 + 10, 1, y1 - y0 - 20);
  for (let y = y0 + 10; y < y1 - 10; y += 3.5) ctx.fillRect(x0 + 10, y, x1 - x0 - 20, 1);
  glow(ctx, cx, (y0 + y1) / 2, 200, P.led, 0.08, 0.6);
}

// ───────────────────────────── glass screen (mid) ─────────────────────────────
function drawGlass(ctx, S) {
  const sN = 1, sF = SB + 0.01;
  const bN = Yh(CNT.h, sN), tN = Yh(GL.h, sN), bF = Yh(CNT.h, sF), tF = Yh(GL.h, sF);
  const xN = X(GL.x, sN), xF = X(GL.x, sF);
  const pane = [[xN, tN], [xF, tF], [xF, bF], [xN, bN]];
  fillPoly(ctx, pane, linGrad(ctx, xF, 0, xN, 0, [[0, rgba(L.key, 0.26)], [1, rgba(mixHex(L.key, '#ffffff', 0.4), 0.2)]]));
  // reflections: two diagonal streaks
  ctx.save(); poly(ctx, pane); ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  for (const [o, w, a] of [[0.12, 10, 0.26], [0.24, 3, 0.2], [0.55, 16, 0.12]]) {
    const xa = lerp(xN, xF, o);
    ctx.fillStyle = rgba('#ffffff', a);
    poly(ctx, [[xa, tN - 10], [xa + w, tN - 10], [xa + w - 30, bN + 10], [xa - 30, bN + 10]]); ctx.fill();
  }
  ctx.restore();
  // frame: top rail, near upright, joint at the position divider
  line(ctx, xN, tN, xF, tF, 3.5, P.metal);
  line(ctx, xN, tN - 1.2, xF, tF - 1.2, 1, P.metalHi);
  line(ctx, xN, bN, xN, tN, 4, P.metal); line(ctx, xN + 1.5, bN, xN + 1.5, tN, 1, P.metalHi);
  const sd = 0.82; line(ctx, X(GL.x, sd), Yh(CNT.h, sd), X(GL.x, sd), Yh(GL.h, sd), 3, P.metal);
  // bottom channel
  line(ctx, xN, bN - 2, xF, bF - 2, 4, P.metalDark);
  // speaking grille (round, foreshortened) at the near position
  const gs = 0.92, gx = X(GL.x, gs), gy = Yh(368, gs);
  ctx.fillStyle = P.metal; ctx.beginPath(); ctx.ellipse(gx, gy, 8, 21, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = P.metalDark; ctx.beginPath(); ctx.ellipse(gx, gy, 6, 17.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = P.metalHi;
  for (let r = -3; r <= 3; r++) for (let c2 = -1; c2 <= 1; c2++) {
    if (Math.abs(r) === 3 && c2 !== 0) continue;
    ctx.fillRect(gx + c2 * 2.8 - 0.6, gy + r * 4.6 - 0.6, 1.3, 1.3);
  }
  ctx.fillStyle = rgba(P.metalHi, 0.8); ctx.beginPath(); ctx.ellipse(gx - 2, gy - 6, 1.5, 6, 0, 0, TAU); ctx.fill();
  // document slot under the glass
  const sy = Yh(CNT.h + 10, gs), sx = gx;
  ctx.fillStyle = P.metalDark; poly(ctx, [[sx + 6, sy - 2], [sx - 6, sy - 4], [sx - 6, Yh(CNT.h, 0.86) + 1], [sx + 6, Yh(CNT.h, gs) + 1]]); ctx.fill();
  // "position closed" card on the far glass
  const cs = 0.74, cx = X(GL.x, cs), cy = Yh(330, cs);
  ctx.fillStyle = mixHex(P.paper, P.haze, 0.2); poly(ctx, [[cx + 3, cy - 18], [cx - 3, cy - 17], [cx - 3, cy + 17], [cx + 3, cy + 18]]); ctx.fill();
  ctx.fillStyle = rgba(P.ink, 0.5); ctx.fillRect(cx - 2, cy - 8, 4, 2); ctx.fillRect(cx - 2, cy - 2, 4, 2);
}

// ───────────────────────────── front ─────────────────────────────
function drawCounterFront(ctx) {
  const x0 = CNT.xc - 6, x1 = CNT.xk + 4, y0 = CNT.top, y1 = FLOOR;
  // lip
  ctx.fillStyle = P.lamEdge; ctx.fillRect(x0, y0, x1 - x0, 3);
  ctx.fillStyle = mixHex(P.lamEnd, P.lam, 0.5); ctx.fillRect(x0, y0 + 3, x1 - x0, 13);
  ctx.fillStyle = rgba(P.ink, 0.3); ctx.fillRect(x0, y0 + 16, x1 - x0, 3);
  // end panel
  ctx.fillStyle = linGrad(ctx, x0, 0, x1, 0, [[0, mixHex(P.lamEnd, P.lam, 0.25)], [0.5, P.lamEnd], [1, mixHex(P.lamEnd, P.ink, 0.25)]]);
  ctx.fillRect(x0 + 4, y0 + 19, x1 - x0 - 8, y1 - y0 - 19 - 18);
  ctx.fillStyle = P.kick; ctx.fillRect(x0 + 8, y1 - 18, x1 - x0 - 16, 18);
  // a recessed panel, a scuffed corner, an information plaque
  ctx.strokeStyle = rgba(P.ink, 0.25); ctx.lineWidth = 1.4; ctx.strokeRect(x0 + 26, y0 + 44, x1 - x0 - 52, y1 - y0 - 100);
  ctx.strokeStyle = rgba(L.key, 0.12); ctx.strokeRect(x0 + 27, y0 + 45, x1 - x0 - 52, y1 - y0 - 100);
  ctx.fillStyle = rgba(P.ink, 0.12); ctx.beginPath(); ctx.ellipse(x0 + 30, y1 - 40, 30, 16, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = tone(0.4); ctx.fillRect((x0 + x1) / 2 - 46, y0 + 70, 92, 54);
  text(ctx, 'COUNTER', (x0 + x1) / 2, y0 + 92, { size: 13, weight: 600, family: FONT.mono, color: P.txt, align: 'center', alpha: 0.6, tracking: 3 });
  text(ctx, '4', (x0 + x1) / 2, y0 + 118, { size: 24, weight: 600, family: FONT.mono, color: P.txt, align: 'center', alpha: 0.75 });
  // light on the lip edge facing the window band
  glow(ctx, x0 + 40, y0 + 8, 90, L.key, 0.1, 0.2);
}
function fgPostImage() {
  return cached('gov-fgpost', 300, 640, (c) => {
    c.filter = 'blur(9px)';
    c.fillStyle = P.ink;
    c.fillRect(150, 70, 40, 640);
    rr(c, 136, 50, 68, 36, 10); c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 26; c.beginPath(); c.moveTo(150, 82); c.quadraticCurveTo(70, 140, -40, 120); c.stroke();
    c.filter = 'none';
  });
}
function drawAir(ctx, S) {
  // haze: a fluorescent pall hanging in the upper hall
  fog(ctx, S.t, 120, 300, L.haze, 0.05, 4, 3);
  ctx.fillStyle = linGrad(ctx, 0, -200, 0, 600, [[0, rgba(L.haze, 0.1)], [0.6, rgba(L.haze, 0.03)], [1, rgba(L.haze, 0)]]);
  ctx.fillRect(-2400, -400, 6720, 1000);
  // troffer blooms
  TROF_ROWS.forEach((s0, r) => TROF_COLS.forEach((wx, c) => {
    const on = r === BAD.row && c === BAD.col ? S.bad : S.hum;
    glow(ctx, X(wx + 145, s0 * 1.04), Yh(700, s0 * 1.04), 220 * s0, L.key, 0.13 * on, 0.35);
  }));
  // the window band bloom (soft, over the figures' edges — gives them that wrapped rim)
  glow(ctx, 1300, 262, 560, mixHex(L.key, '#ffffff', 0.3), 0.08, 0.5);
  // the near floor and the hall's far left fall off (the eye goes to the counter)
  ctx.fillStyle = linGrad(ctx, 0, 640, 0, 860, [[0, rgba(P.ink, 0)], [1, rgba(P.ink, 0.32)]]);
  ctx.fillRect(-2400, 640, 6720, 1200);
  ctx.fillStyle = linGrad(ctx, -400, 0, 700, 0, [[0, rgba(P.ink, 0.3)], [1, rgba(P.ink, 0)]]);
  ctx.fillRect(-2400, -400, 3100, 1600);
  // terminal light on the clerk's face
  if (S.terminal > 0.01) glow(ctx, 1420, 372, 110, '#cfe8c0', 0.14 * S.terminal, 1.1);
  // the bad tube washes the waiting area when it comes back
  glow(ctx, X(TROF_COLS[BAD.col] + 145, 0.86), 220, 420, L.key, 0.04 * S.bad, 0.8);
}

// ───────────────────────────── export ─────────────────────────────
export const govHall = {
  W: 1920,
  floorY: FLOOR,

  anchors: {
    customer: { x: 1060, y: 700 },
    handF: { x: 1188, y: 428 }, handB: { x: 1214, y: 425 }, handSlide: { x: 1100, y: 520 },
    counterTop: { x: 1185, y: CNT.top }, counterEdge: { x: CNT.xc, y: CNT.top },
    glass: { x: GL.x, y: CNT.top }, glassTop: { x: GL.x, y: Yh(GL.h, 1) },
    grille: { x: Math.round(X(GL.x, 0.92)), y: Math.round(Yh(368, 0.92)) }, slot: { x: Math.round(X(GL.x, 0.92)), y: 420 },
    clerkSeat: { x: 1500, y: 550 }, clerkHands: { x: 1405, y: 428 },
    terminal: { x: 1362, y: CNT.top }, terminalScreen: { x: 1368, y: 376 },
    display: { x: (DISP.x0 + DISP.x1) / 2, y: (DISP.y0 + DISP.y1) / 2 },
    ticket: { x: (TICK.x0 + TICK.x1) / 2, y: (TICK.y0 + TICK.y1) / 2 },
    clock: { x: 790, y: 232 },
    queue: { x: 860, y: 700 }, enter: { x: 640, y: 700 },
    waitSeat: { x: 330, y: 672, s: 0.93 },
  },

  lights: {
    gov: { key: L.key, from: 1, amount: 0.45 },
  },

  /** Rim light for a figure at world x: the customer side is lit from the right, the clerk's side from the left. */
  lightAt(look, x) {
    if (x > 1300) return { key: L.key, from: -1, amount: 0.38 };
    return { key: L.key, from: 1, amount: clamp(0.45 - Math.max(0, 900 - x) / 2400, 0.2, 0.45) };
  },

  // ───────── everything behind the characters ─────────
  back(ctx, F, o = {}) {
    const S = resolve(F, o);
    ctx.save();
    ctx.fillStyle = P.ceil; ctx.fillRect(0, 0, PW, PH);
    camera(ctx, S.cam, 1, () => {
      drawCeiling(ctx, S);
      drawWall(ctx, S);
      ctx.fillStyle = P.floorNear; ctx.fillRect(-2400, WALL.base, 6720, 1600);
      ctx.drawImage(floorImage(), FL.x, FL.y);
      drawCabinets(ctx);
      drawCooler(ctx);
      ctx.drawImage(waitingImage(S.waiting > 0.5), -560, 200);
      drawStanchions(ctx);
      drawCounterBack(ctx, S);
      drawClerkChair(ctx);
      drawTicket(ctx, S);
      drawDisplay(ctx, S);
    });
    ctx.restore();
  },

  // ───────── between the clerk (behind the glass) and Adam ─────────
  mid(ctx, F, o = {}) {
    const S = resolve(F, o);
    ctx.save();
    camera(ctx, S.cam, 1, () => drawGlass(ctx, S));
    ctx.restore();
  },

  // ───────── everything in front of the characters ─────────
  front(ctx, F, o = {}) {
    const S = resolve(F, o);
    ctx.save();
    if (S.part !== 'air') {
      camera(ctx, S.cam, 1, () => drawCounterFront(ctx));
      camera(ctx, S.cam, 1.35, () => ctx.drawImage(fgPostImage(), -40, 430));
    }
    if (S.part !== 'furniture') {
      camera(ctx, S.cam, 1, () => drawAir(ctx, S));
      grade(ctx, '#a9c49a', 0.1, 'soft-light');
    }
    ctx.restore();
  },
};
