// ═══════════════════════════════════════════════════════════════════════════════════════════
// THE REPLACEMENT — set: OFFICE  (Adam's company: manager's office, lobby, glass meeting room)
// Shots: a1_07_boss (managerOffice) · a2_01_gate (lobby) · a2_02_glass + a2_03_reverse (meetingGlass)
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
//   import { managerOffice, lobby, meetingGlass } from '../sets/office.js';
//   const o = { look: 'officeDay', cam, chart: 1 };            // one options object for all calls
//   managerOffice.back(ctx, F, o);                             // room, glass wall, blinds, wall screen
//   camera(ctx, cam, 1, () => { /* manager (behind desk), Adam in the visitor chair */ });
//   managerOffice.front(ctx, F, o);                            // the desk (hides the manager's legs), haze
//
// LOOK   all three locations are built for LOOK.officeDay only: flat, cool, bright corporate daylight,
//        no warm light anywhere. Any other o.look falls back to officeDay colours. The only reds are the
//        screen alerts the briefs ask for (chart line, ACCESS DENIED). No cyan anywhere.
//        Draw characters with ink LOOK.officeDay.ink and light <set>.lights.officeDay.
//
// COMMON o FIELDS   look 'officeDay' · cam {x,y,zoom,rot} (identity default) · t seconds of ambient
//        animation (default F.t). Every state value below is a plain number, all optional.
//
// ───────────────────────────────────────────────────────────────────────────────────────────
// 1. managerOffice   (a1_07_boss)  world 1920 wide, side-on. Feet on y = 700; back wall base y = 662.
//   x  -80–1160  GLASS WALL onto the open-plan office (pale desks, columns, pale far workers, one
//                walking slowly), venetian blinds lowered to y≈300–390, slat light. Mullions at
//                x 120, 470, 820, 1160.
//      540–690   LOW VISITOR CHAIR (seat 90 px high — lower than the desk; backrest on the left)
//      1045      a DYING POT PLANT (brown drooping leaves, two fallen on the floor)
//      1150–1690 MANAGER'S DESK, long side to camera, top y 512 (drawn in front(): hides the manager
//                below the waist). Monitor at its left end (back to Adam), papers, mug.
//      1505–1560 executive chair back, behind the manager
//      1290–1830 WALL SCREEN y 150–455: white dashboard, title "PERFORMANCE — ADAM" (30 px), grey dashed
//                line labelled "EXPECTED" (19 px), RED line sagging below it to the right, alert dot.
//   STATE   chart  0..1  how much of the red line is drawn (left→right). Default 1
//           blinds 0..1  blind light strength (stripes on wall/floor). Default 1
//   ANCHORS
//     visitorSeat  {x:600,  y:610}  seat top of the low chair; sitter faces right. Rig: {x:600, y:700,
//                                   ...POSE.sit, seat: 90}. Lap ≈ y 600 (lunchbox on knees x≈660).
//     visitorStand {x:470,  y:700}  standing beside the chair (blind light behind)
//     managerStand {x:1420, y:700}  manager stands behind the desk facing left (head lands on the screen)
//     deskTap      {x:1350, y:508}  desk top where he taps on "below" (top surface y 506–516)
//     deskTop      {x:1420, y:508}  centre of the desk top
//     screen       {x:1560, y:302}  centre of the wall screen
//     chartTitle   {x:1322, y:198}  baseline-left of the title text
//     chartEnd     {x:1796, y:414}  end of the red line (alert dot)
//     plant        {x:1045, y:700}  the dying plant (pot top y 628)
//   LIGHT   lights.officeDay = {key:'#f1f6fc', from:-1, amount:0.5}  (daylight from the glass at left)
//   FRAMINGS (a1_07)  master {x:1000,y:402,zoom:1.0→1.06} · manager+chart {x:1480,y:320,zoom:1.9}
//           Adam small in the chair {x:700,y:440,zoom:1.9–2.3} · chart insert {x:1560,y:300,zoom:2.2}
//           (title 30 px at zoom 1 → 66 px; "EXPECTED" needs zoom ≥ 1.6 to reach 30 px).
//
// ───────────────────────────────────────────────────────────────────────────────────────────
// 2. lobby   (a2_01_gate)  world 1920 wide, side-on. Feet on y = 700; back wall base y = 590 (deep
//            polished-stone floor with reflections between 590 and the bottom of frame).
//   x -140–1185  TALL WINDOWS, bright morning city outside, cool sun shafts falling down-right, sun patches
//      572–870   TURNSTILES: 4 waist-high cabinets receding in depth; the NEAREST (front(), base y 730)
//                carries the card reader on its top-left end and a small display on its camera face
//                ("ACCESS" / "DENIED" in red when reader > 0.5, 17 px — use zoom ≥ 2 for an insert).
//                Glass wings close the lane. Adam's lane is between the near cabinet and the next one.
//      1185–1250 pillar   1250+ pale stone LOGO WALL with an abstract ring-and-dot mark at (1610,168)
//      1400–1820 SECURITY DESK (front(), ledge top y 430, hides a standing/seated guard to the chest).
//                Monitor on the ledge faces us: "ADAM —" (24 px) / "CHECKED IN 08:02" (14 px).
//                Text is small at zoom 1: frame the insert at zoom ≥ 2.2 (14 px → 31 px).
//   STATE   reader  0..1  0 idle (dim white), >0.5 = red ACCESS DENIED, flashing (never fully off). Default 0
//           monitor 0..1  fades in the check-in row on the guard's monitor. Default 1
//           shafts  0..1  strength of sun shafts/dust. Default 1
//   ANCHORS
//     gateStand  {x:505,  y:700}  where Adam stands to tap (faces right; window behind him)
//     reader     {x:600,  y:476}  the card pad on the near cabinet (hand target for POSE.tapCard / handF)
//     display    {x:640,  y:530}  centre of the ACCESS DENIED display
//     gateLane   {x:720,  y:700}  standing IN the lane (legs hidden by the near cabinet; draw before front())
//     beyondGate {x:960,  y:700}  past the gates
//     guardStand {x:1660, y:700}  guard standing behind the desk, facing left
//     guardStool {x:1660, y:515}  guard seated on a high stool: rig {x:1660, y:700, ...POSE.sit, seat:185}
//     monitor    {x:1507, y:352}  centre of the guard's monitor screen
//     logo       {x:1610, y:168}  the company mark
//   LIGHT   lights.officeDay = {key:'#f1f6fc', from:-1, amount:0.65}  (morning sun from the windows, left)
//   EXTRA   lobby.reflect(ctx, F, o, drawFn)  draws drawFn (your figure drawing, world coords, no camera)
//           mirrored in the polished floor about y = 700, faded — call it right after back().
//   FRAMINGS (a2_01)  master {x:1000,y:402,zoom:1.0→1.05} · reader insert {x:630,y:500,zoom:2.4}
//           guard + monitor {x:1560,y:340,zoom:2.3} (monitor text 31 px) · Adam at gate {x:620,y:400,zoom:1.8}
//
// ───────────────────────────────────────────────────────────────────────────────────────────
// 3. meetingGlass   (a2_02_glass, a2_03_reverse)  two camera set-ups chosen with o.view:
//
//   view 'through' (default, a2_02): we stand in the dim corridor looking straight through a floor-to-
//     ceiling glass wall (base track y 690, top y 40, mullions x 250, 1090, 1930) into a bright meeting
//     room. Room people stand on y = 640 at scale s = 0.82 (adult 352 px). Room: window on the far wall
//     at left (x 70–720), long table x 330–1080 (top y 488, solid modesty panel hides sitters' legs),
//     6 chairs facing right, PRESENTATION SCREEN x 1130–1650 y 180–470 (white slide, GREEN line climbing).
//     Draw order:
//       back()                       corridor ceiling, room, screen, chair backs
//       → attendees + presenter      camera depth 1, s 0.82
//       mid(ctx,F,{...o,part:'table'})  table top + modesty panel + laptops (over sitters' legs)
//       mid(ctx,F,{...o,part:'glass'})  the GLASS: tint, reflections, frosted strip, mullions, corridor floor
//       → Adam in the corridor       over-shoulder: drawFigure at {x:130, y:1180, s:2.1}, camera depth 1.25
//         (his faint reflection: same figure at {x:430, y:700, s:0.9}, alpha 0.12, before the glass part)
//       front()                      corridor darkness + cool haze (depth 1.25)
//     (mid() with no part draws both, table first.)
//   view 'edge' (a2_03): one-point view down the dim corridor; the glass wall recedes on the RIGHT toward
//     a vanishing point (760,300); the bright room is seen through it as soft shapes. Adam stands in
//     profile facing right with his face a few cm from the glass (glass line at his depth: x = 1010).
//     back() draws everything; front() draws the breath fog on the glass + air. mid() does nothing.
//   STATE   chart 0..1  how much of the green line is drawn (through view; edge view shows it soft). Default 1
//           fog   0..1  breath-fog patch on the glass at anchors.fog (edge view). Default 0
//           view  'through' | 'edge'. Default 'through'
//           part  'table' | 'glass' | 'all'  for mid() in the through view. Default 'all'
//   ANCHORS (through view)
//     seat1 {x:300, y:550} head of the table (left end)  seat2 {x:450,y:550} seat3 {x:590,y:550}
//     seat4 {x:730, y:550} seat5 {x:870, y:550}  seat6 {x:1010,y:550}   — seat tops; all face right.
//           Rig: {x, y:640, s:0.82, ...POSE.sit, seat:90}. Draw sitters BEFORE mid().
//     presenter  {x:1190, y:640}  presenter beside the screen, facing left (s 0.82); head lands on the screen
//     screen     {x:1390, y:325}  centre of the presentation screen
//     adamOTS    {x:130,  y:1180} Adam's over-shoulder figure (s 2.1, curl 10, camera depth 1.25, facing right)
//     adamReflect{x:430,  y:700}  his reflection in the glass (s 0.9, alpha ~0.12)
//   ANCHORS (edge view)
//     adamGlass  {x:928,  y:700}  Adam standing in profile facing right; his mouth lands at ≈ (1000,318)
//     fog        {x:1030, y:318}  centre of the breath-fog patch on the glass
//     corridor   {x:520,  y:700}  one step back from the glass (he backs away to here, then bolts left)
//   LIGHT   lights.officeDay = {key:'#f1f6fc', from:1, amount:0.55}  (the room light, for Adam in the corridor)
//           roomLight = {key:'#f1f6fc', from:-1, amount:0.5}         (for the people inside the room)
//   FRAMINGS a2_02: {x:900,y:390,zoom:1.0} → push to {x:1000,y:380,zoom:1.12}; glance CU on the presenter
//           {x:1180,y:330,zoom:2.4}. a2_03: {x:960,y:330,zoom:2.2} (profile + fog); wider {x:900,y:380,zoom:1.4}.
//
// Close framings built vector (crisp to zoom 3): the manager's wall chart, the desk, the plant, the visitor
// chair; the turnstile reader + display; the guard's monitor; the presentation screen; the glass/fog.
// Cached + blurred (soft, meant to be out of focus): the open-plan beyond the office glass, the city
// outside the lobby, the sun shafts, the room seen through the glass in the edge view.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import {
  PW, PH, TAU, clamp, lerp, hash, noise1, wobble, rgba, mixHex, rr, fillRR, linGrad, radGrad,
  glow, cached, scratch, camera, text, FONT,
} from '../engine.js';
import { LOOK } from '../style.js';

const FLOOR = 700;
const KEY = '#f1f6fc';
const HAZE = '#dfe7f0';

// ───────────────────────────── helpers ─────────────────────────────
const poly = (ctx, pts) => {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
};
const fillPoly = (ctx, pts, fill) => { poly(ctx, pts); ctx.fillStyle = fill; ctx.fill(); };
const line = (ctx, x0, y0, x1, y1, w, col) => {
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
};
/** Cached soft layer. sc < 1 renders it at reduced resolution (draw it back with drawImage(cv, x, y, w, h)). */
function soft(key, w, h, blur, draw, sc = 1) {
  return cached(key, w * sc, h * sc, (c, cw, ch) => {
    // draw sharp into a temp canvas, then blur ONCE (a filter on every shape is very slow)
    const tmp = document.createElement('canvas'); tmp.width = cw; tmp.height = ch;
    const tc = tmp.getContext('2d'); tc.scale(sc, sc); draw(tc);
    c.filter = blur ? `blur(${blur * sc}px)` : 'none'; c.drawImage(tmp, 0, 0); c.filter = 'none';
  });
}
function resolve(F, o = {}) {
  const look = LOOK[o.look] ? o.look : 'officeDay';
  return { o, look, L: LOOK.officeDay, cam: o.cam || {}, t: o.t ?? (F ? F.t : 0) };
}
/** Soft elliptical shadow on a floor. */
function floorShadow(ctx, x, y, rx, ry, a = 0.35, col = '#1a2230') {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, rx, [[0, rgba(col, a)], [0.6, rgba(col, a * 0.5)], [1, rgba(col, 0)]]);
  ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore();
}
/** Drifting dust motes inside a box, additive. */
function dust(ctx, t, x0, y0, x1, y1, n, seed, a = 0.35) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const w = x1 - x0, h = y1 - y0;
    const x = x0 + ((hash(seed + i * 3) * w + t * (4 + hash(seed + i) * 6)) % w);
    const y = y0 + ((hash(seed + i * 7) * h + t * (2 + hash(seed + i * 5) * 3) + wobble(t, 0.2, seed + i) * 8) % h + h) % h;
    const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + hash(i + seed * 3)) + i);
    ctx.fillStyle = rgba(KEY, a * tw * (0.4 + hash(seed + i * 11) * 0.6));
    ctx.beginPath(); ctx.arc(x, y, 0.8 + hash(seed + i * 13) * 1.4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
/** Simple pale far-away person (not a character: background extras through glass). */
function paleFigure(c, x, base, h, col, seated = false, facing = 1) {
  const u = h / 7;
  c.fillStyle = col;
  c.save(); c.translate(x, base); c.scale(facing, 1);
  if (seated) {
    c.beginPath(); c.roundRect(-u * 0.55, -u * 4.1, u * 1.1, u * 2.4, u * 0.4); c.fill();
    c.beginPath(); c.ellipse(u * 0.05, -u * 4.6, u * 0.42, u * 0.5, 0, 0, TAU); c.fill();
  } else {
    c.fillRect(-u * 0.35, -u * 3.5, u * 0.7, u * 3.5);
    c.beginPath(); c.roundRect(-u * 0.55, -u * 6.1, u * 1.1, u * 2.8, u * 0.4); c.fill();
    c.beginPath(); c.ellipse(u * 0.05, -u * 6.55, u * 0.42, u * 0.5, 0, 0, TAU); c.fill();
  }
  c.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// 1. MANAGER'S OFFICE
// ═══════════════════════════════════════════════════════════════════════════════════════════
const MO = {
  base: 662, ceil: 72, glassR: 1160,
  scr: { x0: 1290, y0: 150, x1: 1830, y1: 455 },
  desk: { x0: 1150, x1: 1690, top: 512 },
  chairX: 600, seat: 610, plantX: 1045,
};
const MO_MULL = [120, 470, 820];
const MO_PANES = [[-200, 116, 392], [128, 466, 328], [478, 816, 348], [828, 1154, 304]]; // x0, x1, blind bottom

function moOpenPlan(c) { // cached; world x = px - 420; drawn at depth 0.55
  c.translate(420, 0);
  c.fillStyle = linGrad(c, 0, 0, 0, 804, [[0, '#c3ccd8'], [0.14, '#cfd7e1'], [0.15, '#f1f5f9'], [0.6, '#e8edf3'], [0.66, '#bcc6d3'], [1, '#a3aebe']]);
  c.fillRect(-420, 0, 2760, 804);
  // far window wall: mullions, a pale city in haze
  for (let i = 0; i < 9; i++) { const x = -380 + i * 300 + hash(i) * 60; c.fillStyle = '#e1e7ef'; c.fillRect(x, 300 - hash(i + 9) * 140, 140 + hash(i + 3) * 120, 260); }
  for (let x = -400; x < 2340; x += 112) { c.fillStyle = '#c9d1dc'; c.fillRect(x, 120, 5, 410); }
  c.fillStyle = '#d1d8e2'; c.fillRect(-420, 300, 2760, 3);
  // ceiling panel lights in perspective rows
  for (const [y, w, h, step] of [[28, 150, 12, 300], [70, 100, 8, 220], [100, 64, 5, 160]]) {
    for (let x = -400; x < 2340; x += step) { c.fillStyle = '#fbfdff'; c.fillRect(x, y, w, h); }
  }
  // columns
  for (const x of [260, 1320, 2050]) {
    c.fillStyle = linGrad(c, x, 0, x + 56, 0, [[0, '#dfe5ec'], [1, '#c3ccd8']]); c.fillRect(x, 115, 56, 450);
  }
  // far row of desks
  for (let x = -380; x < 2300; x += 260) {
    c.fillStyle = '#b2bccb'; c.fillRect(x, 500, 230, 50);
    c.fillStyle = '#8e9bae'; c.fillRect(x + 30, 478, 34, 22); c.fillRect(x + 140, 478, 34, 22);
    if (hash(x * 3 + 1) > 0.35) paleFigure(c, x + 100, 560, 120, '#9ba7b9', true, hash(x) > 0.5 ? 1 : -1);
  }
  // near row
  for (let x = -350; x < 2300; x += 380) {
    c.fillStyle = '#a3aebf'; c.fillRect(x, 548, 330, 76);
    c.fillStyle = '#c8d0db'; c.fillRect(x, 546, 330, 4);
    c.fillStyle = '#7d8a9e'; c.fillRect(x + 50, 512, 52, 34); c.fillRect(x + 210, 512, 52, 34);
    if (hash(x * 7 + 2) > 0.3) paleFigure(c, x + 160, 640, 160, '#8995a9', true, hash(x + 5) > 0.5 ? 1 : -1);
  }
  // a standing pair chatting by a column
  paleFigure(c, 1250, 640, 190, '#8f9bae', false, 1); paleFigure(c, 1296, 640, 182, '#939fb2', false, -1);
}

function moBlinds(ctx, x0, x1, yb, t, seed) {
  const y0 = MO.ceil + 10, w = x1 - x0;
  fillRR(ctx, x0 - 2, y0 - 2, w + 4, 12, 2, '#c6ced9');
  ctx.fillStyle = '#9aa6b7'; ctx.fillRect(x0 - 2, y0 + 8, w + 4, 2);
  const pitch = 11, sway = wobble(t, 0.25, seed) * 0.8;
  for (let y = y0 + 14; y < yb - 6; y += pitch) {
    const tilt = 5.5 + 0.8 * Math.sin(y * 0.05 + seed);
    ctx.fillStyle = '#a7b2c2'; ctx.fillRect(x0 + sway, y, w, tilt);
    ctx.fillStyle = '#ccd4df'; ctx.fillRect(x0 + sway, y, w, 1.3);
    ctx.fillStyle = 'rgba(70,84,104,0.35)'; ctx.fillRect(x0 + sway, y + tilt - 1, w, 1);
  }
  fillRR(ctx, x0 + sway - 1, yb - 7, w + 2, 7, 2, '#8794a7');
  // ladder strings
  ctx.fillStyle = 'rgba(90,104,124,0.35)';
  for (const f of [0.18, 0.5, 0.82]) ctx.fillRect(x0 + w * f + sway, y0 + 10, 1.2, yb - y0 - 14);
  // pull cord + tassel on the right
  const cx = x1 - 14 + sway * 1.5;
  line(ctx, cx, y0 + 6, cx + wobble(t, 0.3, seed + 4) * 2, yb + 110, 1.4, 'rgba(80,92,110,0.6)');
  fillRR(ctx, cx - 3 + wobble(t, 0.3, seed + 4) * 2, yb + 106, 6, 14, 3, '#8794a7');
}

function moStripes() { // venetian light thrown on the right wall and the floor; soft, additive
  return soft('mo-stripes', 1100, 804, 2.2, (c) => {
    c.translate(-1000, 0); // world x = px + 1000
    c.save();
    poly(c, [[1162, 120], [1300, 96], [1300, 520], [1162, 610]]); c.clip();
    c.fillStyle = rgba(KEY, 1);
    for (let i = 0; i < 26; i++) { const y = 70 + i * 21; poly(c, [[1150, y], [1320, y - 52], [1320, y - 43], [1150, y + 10]]); c.fill(); }
    c.restore();
    c.save();
    poly(c, [[1162, 610], [1300, 520], [1300, 470], [1820, 470], [1820, 500], [1840, 662], [1162, 662]]); c.clip();
    for (let i = 0; i < 30; i++) { const y = 380 + i * 21; poly(c, [[1150, y], [1900, y - 230], [1900, y - 221], [1150, y + 10]]); c.fill(); }
    c.restore();
    // floor
    c.save(); poly(c, [[1000, 664], [1900, 664], [2000, 804], [1100, 804]]); c.clip();
    for (let i = 0; i < 14; i++) { const y = 666 + Math.pow(i / 13, 1.3) * 140, h = 3 + i * 0.6; c.fillRect(1000, y, 1000, h); }
    c.restore();
  });
}

function moChart(ctx, S, k) {
  const s = MO.scr, w = s.x1 - s.x0, h = s.y1 - s.y0;
  glow(ctx, (s.x0 + s.x1) / 2, (s.y0 + s.y1) / 2, 520, KEY, 0.16, 0.7);
  fillRR(ctx, s.x0 - 9, s.y0 - 9, w + 18, h + 18, 5, '#1c232e');
  ctx.fillStyle = '#323c4b'; ctx.fillRect(s.x0 - 9, s.y1 + 7, w + 18, 2);
  ctx.fillStyle = linGrad(ctx, 0, s.y0, 0, s.y1, [[0, '#f8fafc'], [1, '#e9eef4']]); ctx.fillRect(s.x0, s.y0, w, h);
  text(ctx, 'PERFORMANCE — ADAM', s.x0 + 32, s.y0 + 48, { size: 30, weight: 600, family: FONT.sans, color: '#212b3b', tracking: 1.5 });
  // alert badge (red, permitted: screen alert)
  const pul = 0.75 + 0.25 * Math.sin(S.t * 3.2);
  ctx.fillStyle = rgba('#e23b3f', pul); poly(ctx, [[s.x1 - 52, s.y0 + 26], [s.x1 - 28, s.y0 + 26], [s.x1 - 40, s.y0 + 44]]); ctx.fill();
  ctx.fillStyle = '#cfd7e1'; ctx.fillRect(s.x0 + 30, s.y0 + 66, w - 60, 2);
  const px0 = s.x0 + 44, px1 = s.x1 - 36, py0 = s.y0 + 92, py1 = s.y1 - 30;
  for (let i = 0; i <= 4; i++) { const y = py0 + ((py1 - py0) * i) / 4; ctx.fillStyle = '#dde3ea'; ctx.fillRect(px0, y, px1 - px0, 1.5); }
  for (let i = 1; i < 12; i++) { const x = px0 + ((px1 - px0) * i) / 12; ctx.fillStyle = '#b8c2ce'; ctx.fillRect(x, py1, 1.5, 7); }
  ctx.fillStyle = '#93a0b2'; ctx.fillRect(px0 - 2, py0 - 6, 2.5, py1 - py0 + 8); ctx.fillRect(px0 - 2, py1, px1 - px0 + 2, 2.5);
  const ey = (u) => lerp(py0 + (py1 - py0) * 0.42, py0 + (py1 - py0) * 0.12, u);
  const R = [[0, 0.42], [0.07, 0.38], [0.14, 0.47], [0.22, 0.44], [0.31, 0.56], [0.4, 0.52], [0.49, 0.64], [0.58, 0.61], [0.68, 0.74], [0.78, 0.71], [0.88, 0.84], [1, 0.94]];
  const rp = R.map(([u, v]) => [lerp(px0, px1, u), py0 + (py1 - py0) * v]);
  // EXPECTED dashed line
  ctx.save(); ctx.setLineDash([14, 10]);
  line(ctx, px0, ey(0), px1, ey(1), 3, '#66738a'); ctx.restore();
  text(ctx, 'EXPECTED', px1, ey(1) - 14, { size: 19, weight: 600, family: FONT.mono, color: '#5a667a', align: 'right', tracking: 2 });
  // red line, drawn on with k
  const xk = lerp(px0, px1, clamp(k));
  if (k > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(px0 - 4, py0 - 20, xk - px0 + 6, py1 - py0 + 40); ctx.clip();
    ctx.beginPath(); ctx.moveTo(px0, ey(0)); ctx.lineTo(px1, ey(1));
    for (let i = rp.length - 1; i >= 0; i--) ctx.lineTo(rp[i][0], rp[i][1]);
    ctx.closePath(); ctx.fillStyle = 'rgba(226,59,63,0.10)'; ctx.fill();
    ctx.beginPath(); rp.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 4.5; ctx.strokeStyle = '#e23b3f'; ctx.stroke();
    ctx.restore();
    // head point
    let hx = xk, hy = rp[rp.length - 1][1];
    for (let i = 1; i < rp.length; i++) if (rp[i][0] >= xk) { const f = (xk - rp[i - 1][0]) / (rp[i][0] - rp[i - 1][0]); hy = lerp(rp[i - 1][1], rp[i][1], f); break; }
    ctx.fillStyle = '#e23b3f'; ctx.beginPath(); ctx.arc(hx, hy, 6, 0, TAU); ctx.fill();
    const ring = (S.t * 0.8) % 1;
    ctx.strokeStyle = rgba('#e23b3f', 0.6 * (1 - ring)); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hx, hy, 7 + ring * 16, 0, TAU); ctx.stroke();
  }
  // faint glare across the glass
  ctx.save(); ctx.beginPath(); ctx.rect(s.x0, s.y0, w, h); ctx.clip();
  ctx.fillStyle = linGrad(ctx, s.x0, s.y0, s.x0 + 260, s.y0 + 300, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.10)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(s.x0, s.y0, w, h); ctx.restore();
}

function moLeaf(ctx, x, y, ang, len, wid, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.45, -wid, len, wid * 0.15);
  ctx.quadraticCurveTo(len * 0.5, wid * 0.7, 0, 0);
  ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
function moPlant(ctx, S) {
  const x = MO.plantX, top = 628;
  floorShadow(ctx, x + 10, 700, 60, 9, 0.35);
  // stems + drooping, browning leaves
  const stems = [[-10, 470, -0.2], [6, 452, 0.15], [16, 498, 0.45], [-22, 520, -0.5], [2, 540, 0.05]];
  stems.forEach(([dx, ty, bend], i) => {
    const tx = x + dx + bend * 60, sway = wobble(S.t, 0.15, i) * 1.2;
    ctx.beginPath(); ctx.moveTo(x + dx * 0.3, top + 2);
    ctx.quadraticCurveTo(x + dx, (top + ty) / 2, tx + sway, ty);
    ctx.lineWidth = 3; ctx.strokeStyle = '#6a6a50'; ctx.stroke();
    for (let j = 0; j < 4; j++) {
      const f = 0.35 + j * 0.2, lx = lerp(x + dx * 0.3, tx + sway, f), ly = lerp(top, ty, f);
      const side = j % 2 ? 1 : -1, dead = hash(i * 9 + j) > 0.45;
      const col = dead ? (hash(i + j * 3) > 0.5 ? '#8c7a57' : '#7d6c4f') : '#6d7a5c';
      moLeaf(ctx, lx, ly, side > 0 ? 0.9 + hash(j + i) * 0.5 : Math.PI - 0.9 - hash(j * 2 + i) * 0.5, 44 + hash(i * 3 + j) * 18, 11, col);
    }
    moLeaf(ctx, tx + sway, ty, 1.35 + bend, 40, 10, '#7f7052');
  });
  // pot (white ceramic)
  ctx.fillStyle = linGrad(ctx, x - 32, 0, x + 32, 0, [[0, '#eef2f6'], [0.55, '#d3dae3'], [1, '#a9b4c2']]);
  poly(ctx, [[x - 33, top], [x + 33, top], [x + 26, 700], [x - 26, 700]]); ctx.fill();
  ctx.fillStyle = '#4a4134'; ctx.beginPath(); ctx.ellipse(x, top + 2, 31, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f4f7fa'; ctx.fillRect(x - 34, top - 3, 68, 5);
  // fallen leaves
  moLeaf(ctx, x + 52, 699, -0.15, 34, 7, '#8a7754'); moLeaf(ctx, x - 70, 700, 0.1, 28, 6, '#7a6a4d');
}

function moVisitorChair(ctx) {
  const x = MO.chairX, s = MO.seat;
  floorShadow(ctx, x + 10, 700, 110, 10, 0.4);
  // cantilever chrome tube
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const tube = [[x - 44, s + 10], [x - 36, 694], [x + 82, 694], [x + 78, s + 12]];
  ctx.beginPath(); tube.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.lineWidth = 7; ctx.strokeStyle = '#6e7a8c'; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#d5dce5'; ctx.stroke();
  // seat cushion + low back
  fillRR(ctx, x - 58, s - 4, 150, 18, 7, '#56657b'); ctx.fillStyle = '#7d8ca1'; ctx.fillRect(x - 52, s - 4, 138, 2.5);
  ctx.save(); ctx.translate(x - 50, s + 4); ctx.rotate(-0.16);
  fillRR(ctx, -12, -150, 20, 156, 8, '#56657b'); ctx.fillStyle = '#7d8ca1'; ctx.fillRect(4, -146, 2.5, 146);
  ctx.restore();
}

function moDesk(ctx, S) {
  const d = MO.desk;
  // monitor at the left end, back turned to the visitor
  floorShadow(ctx, 1210, 508, 40, 4, 0.3);
  fillRR(ctx, 1186, 505, 52, 6, 3, '#3b4554');
  ctx.fillStyle = '#4a5464'; ctx.fillRect(1206, 462, 9, 44);
  ctx.save(); ctx.translate(1213, 420); ctx.rotate(0.03);
  fillRR(ctx, -14, -52, 26, 104, 4, '#2b3340');
  ctx.fillStyle = linGrad(ctx, 0, -52, 0, 52, [[0, '#dfe8f3'], [1, '#aebdd0']]); ctx.fillRect(11, -50, 3, 100);
  ctx.restore();
  glow(ctx, 1240, 420, 70, KEY, 0.12);
  // papers, mug, pen
  for (let i = 0; i < 5; i++) fillRR(ctx, 1262 + i * 1.5, 503 - i * 2.2, 86, 2.6, 1, i % 2 ? '#e4e9ef' : '#f4f7fa');
  ctx.save(); ctx.translate(1300, 492); ctx.rotate(-0.08); fillRR(ctx, 0, 0, 52, 2.4, 1, '#3d4757'); ctx.restore();
  fillRR(ctx, 1528, 482, 24, 28, 3, '#cfd6df'); ctx.fillStyle = '#e8edf2'; ctx.fillRect(1530, 482, 4, 28);
  ctx.beginPath(); ctx.arc(1554, 494, 7, -1.2, 1.2); ctx.lineWidth = 3.5; ctx.strokeStyle = '#b9c2ce'; ctx.stroke();
  // desk top (laminate), edge
  fillPoly(ctx, [[d.x0 + 8, 505], [d.x1 - 8, 505], [d.x1 + 6, 516], [d.x0 - 6, 516]], '#dfe5ec');
  ctx.fillStyle = linGrad(ctx, 0, 516, 0, 526, [[0, '#c3ccd7'], [1, '#97a3b3']]); ctx.fillRect(d.x0 - 6, 516, d.x1 - d.x0 + 12, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(d.x0 - 6, 516, d.x1 - d.x0 + 12, 1.5);
  // modesty panel + legs
  ctx.fillStyle = linGrad(ctx, 0, 526, 0, 650, [[0, '#7a879a'], [1, '#5a677a']]); ctx.fillRect(d.x0 + 22, 526, d.x1 - d.x0 - 44, 124);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = d.x0 + 22 + 90; x < d.x1 - 30; x += 90) ctx.fillRect(x, 530, 1.5, 116);
  for (const lx of [d.x0 - 4, d.x1 - 14]) {
    ctx.fillStyle = linGrad(ctx, lx, 0, lx + 18, 0, [[0, '#59657a'], [1, '#2f3846']]); ctx.fillRect(lx, 526, 18, 182);
    fillRR(ctx, lx - 6, 704, 30, 5, 2, '#262e3a');
  }
  floorShadow(ctx, (d.x0 + d.x1) / 2, 710, 330, 12, 0.28);
}

export const managerOffice = {
  W: 1920, floorY: FLOOR,
  anchors: {
    visitorSeat: { x: 600, y: 610 }, visitorStand: { x: 470, y: 700 },
    managerStand: { x: 1420, y: 700 }, deskTap: { x: 1350, y: 508 }, deskTop: { x: 1420, y: 508 },
    screen: { x: 1560, y: 302 }, chartTitle: { x: 1322, y: 198 }, chartEnd: { x: 1796, y: 414 },
    plant: { x: 1045, y: 700 },
  },
  lights: { officeDay: { key: KEY, from: -1, amount: 0.5 } },

  back(ctx, F, o = {}) {
    const S = resolve(F, o), chart = o.chart ?? 1, bl = clamp(o.blinds ?? 1);
    ctx.save();
    ctx.fillStyle = '#aab4c2'; ctx.fillRect(0, 0, PW, PH);
    // the open-plan beyond the glass (far, soft)
    camera(ctx, S.cam, 0.55, () => {
      ctx.drawImage(soft('mo-open', 2760, 804, 1.6, moOpenPlan), -420, 0);
      // one far worker walking slowly along the aisle
      const wx = -200 + ((S.t * 26 + 600) % 1700), bob = Math.abs(Math.sin(S.t * 3.4)) * 2;
      paleFigure(ctx, wx, 652 - bob, 170, '#97a3b5', false, 1);
    });
    camera(ctx, S.cam, 1, () => {
      // ceiling
      ctx.fillStyle = linGrad(ctx, 0, -300, 0, MO.ceil, [[0, '#8f9aab'], [1, '#b9c2ce']]); ctx.fillRect(-600, -300, 3200, MO.ceil + 300);
      fillRR(ctx, 640, 40, 260, 14, 3, '#f7fafd'); glow(ctx, 770, 54, 260, KEY, 0.22, 0.35);
      // glass veil + sheen over the panes
      ctx.fillStyle = rgba('#cfd9e5', 0.12); ctx.fillRect(-600, MO.ceil, MO.glassR + 600, MO.base - MO.ceil);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [x, wd] of [[60, 70], [380, 40], [640, 90], [990, 50]]) {
        ctx.fillStyle = rgba(KEY, 0.05); poly(ctx, [[x, MO.ceil], [x + wd, MO.ceil], [x + wd - 160, MO.base], [x - 160, MO.base]]); ctx.fill();
      }
      ctx.restore();
      // blinds
      MO_PANES.forEach(([x0, x1, yb], i) => moBlinds(ctx, x0, x1, yb, S.t, i + 1));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = linGrad(ctx, 0, MO.ceil, 0, 400, [[0, rgba(KEY, 0)], [0.6, rgba(KEY, 0.10 * bl)], [1, rgba(KEY, 0)]]);
      ctx.fillRect(-600, MO.ceil, MO.glassR + 600, 330); ctx.restore();
      // mullions + rails
      const alu = (x, w) => { ctx.fillStyle = linGrad(ctx, x, 0, x + w, 0, [[0, '#9ea9b8'], [0.4, '#d6dde6'], [1, '#7c889a']]); ctx.fillRect(x, MO.ceil, w, MO.base - MO.ceil); };
      MO_MULL.forEach((x) => alu(x, 8));
      ctx.fillStyle = '#a9b3c1'; ctx.fillRect(-600, MO.ceil, MO.glassR + 600, 9);
      ctx.fillStyle = linGrad(ctx, 0, MO.base - 13, 0, MO.base, [[0, '#9aa5b5'], [1, '#6c7889']]); ctx.fillRect(-600, MO.base - 13, MO.glassR + 600, 13);
      // the solid right wall
      ctx.fillStyle = linGrad(ctx, 0, MO.ceil, 0, MO.base, [[0, '#c7cfda'], [1, '#aeb8c6']]); ctx.fillRect(MO.glassR, MO.ceil, 1500, MO.base - MO.ceil);
      ctx.fillStyle = linGrad(ctx, MO.glassR, 0, MO.glassR + 200, 0, [[0, 'rgba(60,72,92,0.22)'], [1, 'rgba(60,72,92,0)']]); ctx.fillRect(MO.glassR, MO.ceil, 200, MO.base - MO.ceil);
      alu(MO.glassR - 6, 16);
      ctx.fillStyle = '#8a95a6'; ctx.fillRect(MO.glassR + 10, MO.base - 12, 1500, 12);
      // blind light on wall + floor
      if (bl > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.16 * bl; ctx.drawImage(moStripes(), 1000, 0); ctx.restore(); }
      // executive chair back (behind the manager)
      fillRR(ctx, 1500, 352, 70, 172, 16, '#4c5a6f'); fillRR(ctx, 1508, 334, 54, 30, 10, '#4c5a6f');
      ctx.fillStyle = '#6c7b91'; ctx.fillRect(1503, 360, 3, 150);
      // the wall screen
      moChart(ctx, S, chart);
      // floor (grey carpet tiles)
      ctx.fillStyle = linGrad(ctx, 0, MO.base, 0, 860, [[0, '#8693a7'], [0.35, '#6c798d'], [1, '#424e60']]); ctx.fillRect(-600, MO.base, 3200, 600);
      ctx.strokeStyle = 'rgba(30,40,56,0.08)'; ctx.lineWidth = 1;
      for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(960 + i * 110 * 0.5, MO.base); ctx.lineTo(960 + i * 110 * 1.6, 860); ctx.stroke(); }
      for (const y of [676, 698, 728, 768, 820]) { ctx.beginPath(); ctx.moveTo(-600, y); ctx.lineTo(2600, y); ctx.stroke(); }
      ctx.fillStyle = linGrad(ctx, 0, MO.base, 0, MO.base + 30, [[0, 'rgba(30,40,56,0.3)'], [1, 'rgba(30,40,56,0)']]); ctx.fillRect(-600, MO.base, 3200, 30);
      // daylight pooling on the floor in front of the glass
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = linGrad(ctx, 0, MO.base, 0, 760, [[0, rgba(KEY, 0.16)], [1, rgba(KEY, 0)]]);
      poly(ctx, [[-600, MO.base], [MO.glassR, MO.base], [MO.glassR + 160, 790], [-600, 790]]); ctx.fill();
      ctx.restore();
      moPlant(ctx, S);
      moVisitorChair(ctx);
      dust(ctx, S.t, 0, 120, 1150, 640, 40, 7, 0.35);
    });
    ctx.restore();
  },

  mid() {},

  front(ctx, F, o = {}) {
    const S = resolve(F, o);
    ctx.save();
    camera(ctx, S.cam, 1, () => {
      moDesk(ctx, S);
      // screen light catching the desk top
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = linGrad(ctx, 1290, 0, 1690, 0, [[0, rgba(KEY, 0)], [0.5, rgba(KEY, 0.14)], [1, rgba(KEY, 0)]]); ctx.fillRect(1290, 505, 400, 11);
      // daylight haze from the glass side
      ctx.fillStyle = linGrad(ctx, -200, 0, 1100, 0, [[0, rgba(HAZE, 0.10)], [1, rgba(HAZE, 0)]]); ctx.fillRect(-600, -200, 1700, 1100);
      ctx.restore();
    });
    ctx.restore();
  },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// 2. LOBBY
// ═══════════════════════════════════════════════════════════════════════════════════════════
const LB = { base: 590, soffit: 36, winR: 1185, pillar: [1185, 1250], logo: { x: 1610, y: 168 } };
const LB_MULL = [-20, 230, 480, 730, 980];
const LB_DESK = { x0: 1400, x1: 1820, top: 430, base: 708 };
const LB_MON = { x0: 1420, y0: 298, w: 174, h: 108 };
const CAB_K = [0.8, 0.86, 0.93, 1.08];                // far → near; near one is drawn in front()
const cabGeom = (k) => ({ x0: 960 - 359 * k, x1: 960 - 115 * k, base: 330 + 370 * k, h: 246 * k, k });

function lbOutside(c) { // cached; world x = px - 390; drawn at depth 0.4
  c.translate(390, 0);
  c.fillStyle = linGrad(c, 0, 0, 0, 600, [[0, '#cad6e3'], [0.7, '#eef3f8'], [1, '#f4f7fa']]); c.fillRect(-390, 0, 2700, 804);
  c.fillStyle = radGrad(c, 80, 40, 0, 600, [[0, 'rgba(255,255,255,0.9)'], [0.3, 'rgba(250,252,255,0.4)'], [1, 'rgba(250,252,255,0)']]); c.fillRect(-390, 0, 2700, 804);
  const blocks = [[-380, 140, 260], [-100, 60, 220], [150, 190, 300], [470, 90, 240], [740, 150, 330], [1100, 40, 260], [1390, 120, 300], [1720, 70, 280], [2020, 160, 260]];
  blocks.forEach(([x, top, w], i) => {
    const col = mixHex('#b4c1d0', '#dbe3ec', 0.35 + hash(i) * 0.35);
    c.fillStyle = col; c.fillRect(x, top, w, 560 - top);
    c.fillStyle = 'rgba(150,166,188,0.35)';
    for (let y = top + 24; y < 520; y += 34) for (let xx = x + 16; xx < x + w - 20; xx += 30) c.fillRect(xx, y, 16, 18);
  });
  for (let i = 0; i < 9; i++) { const x = -300 + i * 300 + hash(i * 5) * 90; c.fillStyle = '#a6b4c4'; c.beginPath(); c.ellipse(x, 470, 70, 80, 0, 0, TAU); c.fill(); c.fillRect(x - 4, 470, 8, 90); }
  c.fillStyle = '#d6dde6'; c.fillRect(-390, 548, 2700, 60);
  c.fillStyle = '#c3ccd8'; c.fillRect(-390, 570, 2700, 40);
  for (const x of [120, 820, 1500]) fillRR(c, x, 528, 170, 46, 16, '#9eabbc');
}
function lbShafts() {
  return soft('lb-shafts', 2400, 804, 7, (c) => {
    c.translate(200, 0);
    c.fillStyle = '#fff';
    for (let i = 0; i < LB_MULL.length; i++) {
      const a = LB_MULL[i] + 14, b = (LB_MULL[i + 1] ?? LB.winR) - 4;
      poly(c, [[a, 60], [b, 60], [b + 420, 804], [a + 420, 804]]); c.fill();
    }
  }, 0.25);
}
function lbSunPatches() {
  return soft('lb-sun', 2400, 400, 5, (c) => {
    c.translate(200, -580);
    c.fillStyle = '#fff';
    for (let i = 0; i < LB_MULL.length; i++) {
      const a = LB_MULL[i] + 14, b = (LB_MULL[i + 1] ?? LB.winR) - 4;
      poly(c, [[a + 230, 596], [b + 230, 596], [b + 400, 800], [a + 400, 800]]); c.fill();
    }
  }, 0.5);
}
function lbLogo(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  glow(ctx, 0, 0, 170, KEY, 0.35);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, 64, -0.55, TAU - 1.35); ctx.lineWidth = 18; ctx.strokeStyle = '#4f5f76'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 64, -0.55, TAU - 1.35); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(220,229,240,0.55)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 34, 0.9, TAU - 0.4); ctx.lineWidth = 10; ctx.strokeStyle = '#6a7a91'; ctx.stroke();
  ctx.fillStyle = '#4f5f76'; ctx.beginPath(); ctx.arc(64 * Math.cos(-1.0) + 26, 64 * Math.sin(-1.0) - 18, 12, 0, TAU); ctx.fill();
  ctx.restore();
}
function lbCabinet(ctx, S, g, near, reader) {
  const { x0, x1, base, h, k } = g, top = base - h, w = x1 - x0;
  const fade = clamp((1.08 - k) * 1.6);
  const steelT = mixHex('#c3cbd6', HAZE, fade * 0.6), steelB = mixHex('#7a8699', '#b9c4d2', fade);
  floorShadow(ctx, (x0 + x1) / 2, base + 2, w * 0.6, 7 * k, 0.35 * (1 - fade * 0.5));
  // glass wing (into the lane, behind the body)
  const wx = x0 + w * 0.6;
  ctx.fillStyle = 'rgba(232,240,248,0.22)'; rr(ctx, wx, top - 78 * k, 76 * k, 110 * k, 16 * k); ctx.fill();
  ctx.strokeStyle = 'rgba(245,250,255,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
  // body
  ctx.fillStyle = linGrad(ctx, 0, top, 0, base, [[0, steelT], [1, steelB]]); rr(ctx, x0, top, w, h, 12 * k); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x0 + 6 * k, top + 10 * k, 2, h - 20 * k);
  ctx.fillStyle = 'rgba(40,52,70,0.18)'; ctx.fillRect(x0 + w * 0.35, top + 14 * k, 1.5, h - 24 * k); ctx.fillRect(x0 + w * 0.7, top + 14 * k, 1.5, h - 24 * k);
  // dark glass top cap
  fillRR(ctx, x0 + 2, top - 3 * k, w - 4, 11 * k, 5 * k, mixHex('#2a3442', '#a9b5c5', clamp(fade * 2.2)));
  // LED strip along the top
  const deny = reader > 0.5, fl = deny ? 0.6 + 0.4 * (Math.sin(S.t * 18) > -0.3 ? 1 : 0.4) : 0;
  const ledCol = deny ? '#ff4d4f' : '#e7eef7';
  ctx.fillStyle = rgba(ledCol, deny ? fl : 0.55 - fade * 0.3); ctx.fillRect(x0 + 14 * k, top + 9 * k, w - 28 * k, 2.2 * k);
  if (deny && (near || k > 0.9)) glow(ctx, (x0 + x1) / 2, top + 10 * k, w * 0.55, '#ff4d4f', 0.22 * fl, 0.25);
  // reader pad on the left end of the top
  fillRR(ctx, x0 + 14 * k, top - 9 * k, 38 * k, 8 * k, 2, mixHex('#1a212b', '#a9b5c5', clamp(fade * 2.2)));
  ctx.fillStyle = rgba(deny ? '#ff4d4f' : '#dfe8f3', deny ? fl : 0.6 - fade * 0.4); ctx.fillRect(x0 + 24 * k, top - 7 * k, 18 * k, 2.5 * k);
  if (near) {
    // the display on the camera face
    const dx = x0 + 18, dy = top + 26, dw = 128, dh = 62;
    fillRR(ctx, dx - 4, dy - 4, dw + 8, dh + 8, 8, '#4a5466');
    fillRR(ctx, dx, dy, dw, dh, 6, '#0b0f16');
    if (deny) {
      glow(ctx, dx + dw / 2, dy + dh / 2, 110, '#ff4d4f', 0.28 * fl, 0.6);
      text(ctx, 'ACCESS', dx + dw / 2, dy + 27, { size: 18, weight: 700, family: FONT.mono, color: '#ff5a5c', align: 'center', tracking: 2, alpha: fl });
      text(ctx, 'DENIED', dx + dw / 2, dy + 50, { size: 18, weight: 700, family: FONT.mono, color: '#ff5a5c', align: 'center', tracking: 2, alpha: fl });
    } else {
      // idle: a dim white arrow
      ctx.fillStyle = 'rgba(225,234,245,0.55)';
      poly(ctx, [[dx + 48, dy + 22], [dx + 70, dy + 22], [dx + 70, dy + 14], [dx + 86, dy + 31], [dx + 70, dy + 48], [dx + 70, dy + 40], [dx + 48, dy + 40]]); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(dx, dy, dw, dh * 0.4);
  }
}
function lbDesk(ctx, S, mon) {
  const d = LB_DESK, m = LB_MON;
  // monitor on the ledge, turned toward camera
  fillRR(ctx, 1472, 424, 72, 7, 3, '#2a313c');
  ctx.fillStyle = '#3a4350'; ctx.fillRect(1500, m.y0 + m.h, 14, 424 - m.y0 - m.h);
  glow(ctx, m.x0 + m.w / 2, m.y0 + m.h / 2, 150, '#dbe5f2', 0.14);
  fillRR(ctx, m.x0 - 6, m.y0 - 6, m.w + 12, m.h + 12, 6, '#161c25');
  ctx.fillStyle = '#4a5464'; ctx.fillRect(m.x0 + m.w + 6, m.y0 - 2, 3, m.h + 4);
  ctx.fillStyle = linGrad(ctx, 0, m.y0, 0, m.y0 + m.h, [[0, '#1e2a3c'], [1, '#121a27']]); ctx.fillRect(m.x0, m.y0, m.w, m.h);
  ctx.fillStyle = '#2b3a52'; ctx.fillRect(m.x0, m.y0, m.w, 12);
  ctx.fillStyle = 'rgba(200,214,232,0.18)';
  for (let i = 0; i < 4; i++) ctx.fillRect(m.x0 + 10, m.y0 + 82 + i * 6, 60 + hash(i) * 80, 2.5);
  if (mon > 0) {
    ctx.fillStyle = rgba('#3c5878', 0.85 * mon); ctx.fillRect(m.x0 + 4, m.y0 + 18, m.w - 8, 60);
    text(ctx, 'ADAM —', m.x0 + 12, m.y0 + 45, { size: 24, weight: 700, family: FONT.mono, color: '#f1f5fa', alpha: mon, tracking: 1 });
    text(ctx, 'CHECKED IN 08:02', m.x0 + 12, m.y0 + 69, { size: 14, weight: 600, family: FONT.mono, color: '#dbe5f1', alpha: mon, tracking: 0.5 });
  }
  ctx.fillStyle = linGrad(ctx, m.x0, m.y0, m.x0 + 90, m.y0 + 110, [[0, 'rgba(255,255,255,0.10)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(m.x0, m.y0, m.w, m.h);
  // ledge + front panel
  floorShadow(ctx, (d.x0 + d.x1) / 2, d.base + 2, 260, 12, 0.35);
  ctx.fillStyle = linGrad(ctx, 0, d.top, 0, d.base, [[0, '#6f7e94'], [1, '#4a576b']]); ctx.fillRect(d.x0, d.top + 12, d.x1 - d.x0, d.base - d.top - 24);
  ctx.fillStyle = 'rgba(20,28,40,0.22)'; for (let x = d.x0 + 70; x < d.x1 - 20; x += 70) ctx.fillRect(x, d.top + 30, 2, d.base - d.top - 52);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(d.x0, d.top + 12, 3, d.base - d.top - 24);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = linGrad(ctx, 0, d.top + 13, 0, d.top + 60, [[0, rgba(KEY, 0.4)], [0.1, rgba(KEY, 0.12)], [1, rgba(KEY, 0)]]); ctx.fillRect(d.x0, d.top + 13, d.x1 - d.x0, 47);
  ctx.restore();
  fillRR(ctx, d.x0 - 14, d.top, d.x1 - d.x0 + 28, 14, 4, '#dfe5ec');
  ctx.fillStyle = '#f7f9fc'; ctx.fillRect(d.x0 - 12, d.top, d.x1 - d.x0 + 24, 2);
  ctx.fillStyle = '#26303c'; ctx.fillRect(d.x0 + 6, d.base - 12, d.x1 - d.x0 - 12, 12);
}

export const lobby = {
  W: 1920, floorY: FLOOR,
  anchors: {
    gateStand: { x: 505, y: 700 }, reader: { x: 600, y: 476 }, display: { x: 640, y: 530 },
    gateLane: { x: 720, y: 700 }, beyondGate: { x: 960, y: 700 },
    guardStand: { x: 1660, y: 700 }, guardStool: { x: 1660, y: 515 }, monitor: { x: 1507, y: 352 },
    logo: { x: 1610, y: 168 },
  },
  lights: { officeDay: { key: KEY, from: -1, amount: 0.65 } },

  back(ctx, F, o = {}) {
    const S = resolve(F, o), reader = o.reader ?? 0, sh = clamp(o.shafts ?? 1);
    ctx.save();
    ctx.fillStyle = '#d9e1ea'; ctx.fillRect(0, 0, PW, PH);
    camera(ctx, S.cam, 0.4, () => {
      ctx.drawImage(soft('lb-out', 2700, 804, 2.2, lbOutside, 0.5), -390, 0, 2700, 804);
      for (let i = 0; i < 2; i++) { // passers-by outside
        const x = -300 + ((S.t * (18 + i * 7) + i * 900) % 2300);
        paleFigure(ctx, x, 584, 130 - i * 10, '#a3b0c1', false, i ? -1 : 1);
      }
    });
    camera(ctx, S.cam, 1, () => {
      const B = LB.base;
      // window frame
      ctx.fillStyle = 'rgba(214,226,240,0.10)'; ctx.fillRect(-600, LB.soffit, LB.winR + 600, B - LB.soffit);
      for (const x of LB_MULL) { ctx.fillStyle = linGrad(ctx, x, 0, x + 14, 0, [[0, '#55627a'], [0.5, '#7d8aa0'], [1, '#424e62']]); ctx.fillRect(x, LB.soffit, 14, B - LB.soffit); }
      ctx.fillStyle = '#5d6a80'; ctx.fillRect(-600, 214, LB.winR + 600, 8); ctx.fillRect(-600, B - 12, LB.winR + 600, 12);
      // logo wall
      ctx.fillStyle = linGrad(ctx, 0, LB.soffit, 0, B, [[0, '#cfd7e0'], [1, '#b6c0cc']]); ctx.fillRect(LB.pillar[1], LB.soffit, 1500, B - LB.soffit);
      ctx.fillStyle = 'rgba(120,134,154,0.28)';
      for (let x = LB.pillar[1] + 150; x < 2700; x += 210) ctx.fillRect(x, LB.soffit, 1.2, B - LB.soffit);
      for (let y = LB.soffit + 140; y < B; y += 140) ctx.fillRect(LB.pillar[1], y, 1500, 1.2);
      for (const wx of [1450, 1780]) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = radGrad(ctx, wx, LB.soffit, 0, 330, [[0, rgba(KEY, 0.35)], [0.5, rgba(KEY, 0.1)], [1, rgba(KEY, 0)]]);
        ctx.fillRect(wx - 330, LB.soffit, 660, 400); ctx.restore();
      }
      lbLogo(ctx, LB.logo.x, LB.logo.y);
      // pillar
      ctx.fillStyle = linGrad(ctx, LB.pillar[0], 0, LB.pillar[1], 0, [[0, '#c0c9d4'], [0.25, '#a6b2c1'], [1, '#8f9cae']]); ctx.fillRect(LB.pillar[0], LB.soffit, LB.pillar[1] - LB.pillar[0], B - LB.soffit);
      // guard's chair back (behind the desk)
      fillRR(ctx, 1712, 350, 56, 90, 12, '#5d6a7e');
      // soffit with downlights
      ctx.fillStyle = linGrad(ctx, 0, -300, 0, LB.soffit, [[0, '#5d697b'], [1, '#7f8b9c']]); ctx.fillRect(-600, -300, 3200, LB.soffit + 300);
      for (let x = 100; x < 2000; x += 240) { fillRR(ctx, x - 18, LB.soffit - 5, 36, 5, 2, '#f5f8fc'); glow(ctx, x, LB.soffit, 70, KEY, 0.3, 0.5); }
      // polished floor
      ctx.fillStyle = linGrad(ctx, 0, B, 0, 860, [[0, '#a5b1c1'], [0.5, '#8794a8'], [1, '#5f6d82']]); ctx.fillRect(-600, B, 3200, 600);
      // reflections: windows, logo wall, pillar, cabinets, desk
      ctx.save(); ctx.beginPath(); ctx.rect(-600, B, 3200, 600); ctx.clip();
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < LB_MULL.length; i++) {
        const a = LB_MULL[i] + 14, b = (LB_MULL[i + 1] ?? LB.winR);
        ctx.fillStyle = linGrad(ctx, 0, B, 0, B + 200, [[0, 'rgba(244,248,252,0.8)'], [1, 'rgba(244,248,252,0)']]); ctx.fillRect(a, B, b - a, 200);
      }
      ctx.fillStyle = linGrad(ctx, 0, B, 0, B + 160, [[0, 'rgba(80,94,116,0.6)'], [1, 'rgba(80,94,116,0)']]); ctx.fillRect(LB.pillar[0], B, 65, 160);
      ctx.globalAlpha = 0.3;
      for (const k of CAB_K) {
        const g = cabGeom(k);
        ctx.fillStyle = linGrad(ctx, 0, g.base, 0, g.base + g.h * 0.6, [[0, 'rgba(60,72,92,0.9)'], [1, 'rgba(60,72,92,0)']]); ctx.fillRect(g.x0 + 4, g.base, g.x1 - g.x0 - 8, g.h * 0.6);
      }
      ctx.fillStyle = linGrad(ctx, 0, LB_DESK.base, 0, LB_DESK.base + 120, [[0, 'rgba(40,50,66,0.9)'], [1, 'rgba(40,50,66,0)']]); ctx.fillRect(LB_DESK.x0, LB_DESK.base, LB_DESK.x1 - LB_DESK.x0, 120);
      ctx.restore();
      // stone joints in perspective
      ctx.strokeStyle = 'rgba(40,52,70,0.10)'; ctx.lineWidth = 1;
      for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(960 + i * 200 * 0.7, B); ctx.lineTo(960 + i * 200 * 1.9, 860); ctx.stroke(); }
      for (const y of [612, 650, 712, 800]) { ctx.beginPath(); ctx.moveTo(-600, y); ctx.lineTo(2600, y); ctx.stroke(); }
      ctx.fillStyle = linGrad(ctx, 0, B, 0, B + 14, [[0, 'rgba(30,40,56,0.35)'], [1, 'rgba(30,40,56,0)']]); ctx.fillRect(-600, B, 3200, 14);
      // sun patches on the floor
      if (sh > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.22 * sh; ctx.drawImage(lbSunPatches(), -200, 580, 2400, 400); ctx.restore(); }
      // far turnstiles
      for (let i = 0; i < 3; i++) lbCabinet(ctx, S, cabGeom(CAB_K[i]), false, i === 2 ? reader : 0);
    });
    ctx.restore();
  },

  mid() {},

  front(ctx, F, o = {}) {
    const S = resolve(F, o), sh = clamp(o.shafts ?? 1);
    ctx.save();
    camera(ctx, S.cam, 1, () => {
      lbCabinet(ctx, S, cabGeom(CAB_K[3]), true, o.reader ?? 0);
      lbDesk(ctx, S, clamp(o.monitor ?? 1));
      if (sh > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.07 * sh;
        ctx.drawImage(lbShafts(), -200, 0, 2400, 804); ctx.restore();
        dust(ctx, S.t, 0, 80, 1500, 700, 50, 21, 0.4 * sh);
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = linGrad(ctx, 0, 0, 1300, 0, [[0, rgba(HAZE, 0.10)], [1, rgba(HAZE, 0)]]); ctx.fillRect(-600, -200, 1900, 1100);
      ctx.restore();
    });
    ctx.restore();
  },

  /** Mirror a figure in the polished floor. drawFn(ctx) draws in WORLD coords (no camera). */
  reflect(ctx, F, o = {}, drawFn) {
    const S = resolve(F, o);
    const { cv, ctx: r } = scratch('lb-refl', PW, PH);
    camera(r, S.cam, 1, () => {
      r.save(); r.translate(0, 2 * FLOOR); r.scale(1, -1); drawFn(r); r.restore();
      r.globalCompositeOperation = 'destination-in';   // unbounded: also clears everything above the floor
      r.fillStyle = linGrad(r, 0, FLOOR, 0, FLOOR + 150, [[0, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]);
      r.fillRect(-600, FLOOR, 3200, 150);
      r.globalCompositeOperation = 'source-over';
    });
    ctx.save(); ctx.globalAlpha = 0.28; ctx.drawImage(cv, 0, 0); ctx.restore();
  },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// 3. MEETING ROOM SEEN THROUGH GLASS
// ═══════════════════════════════════════════════════════════════════════════════════════════
const MG = { top: 40, base: 690, roomF: 640, wallBase: 598, ceil: 112, scr: { x0: 1130, y0: 180, x1: 1650, y1: 470 }, table: { x0: 330, x1: 1080, top: 488 } };
const MG_MULL = [250, 1090, 1930];
const MG_SEATS = [300, 450, 590, 730, 870, 1010];

function mgCity(c) { // cached; seen through the room's far window
  c.fillStyle = linGrad(c, 0, 0, 0, 420, [[0, '#dfe7f0'], [1, '#f6f9fc']]); c.fillRect(0, 0, 700, 420);
  for (let i = 0; i < 6; i++) { c.fillStyle = mixHex('#c3cedb', '#e3e9f0', hash(i * 3) * 0.6); c.fillRect(i * 120 - 20 + hash(i) * 30, 120 + hash(i + 7) * 120, 100, 400); }
}
function mgSlide(ctx, S, k, x0, y0, x1, y1) {
  const w = x1 - x0, h = y1 - y0;
  ctx.fillStyle = linGrad(ctx, 0, y0, 0, y1, [[0, '#fbfcfd'], [1, '#eef2f6']]); ctx.fillRect(x0, y0, w, h);
  // header bars (no text)
  fillRR(ctx, x0 + 28, y0 + 26, 180, 14, 4, '#c7d0db'); fillRR(ctx, x0 + 28, y0 + 48, 110, 8, 3, '#dde3ea');
  const px0 = x0 + 40, px1 = x1 - 40, py0 = y0 + 80, py1 = y1 - 30;
  for (let i = 0; i <= 4; i++) { ctx.fillStyle = '#e0e6ec'; ctx.fillRect(px0, py0 + ((py1 - py0) * i) / 4, px1 - px0, 1.5); }
  ctx.fillStyle = '#9aa6b6'; ctx.fillRect(px0 - 2, py0 - 4, 2.5, py1 - py0 + 6); ctx.fillRect(px0 - 2, py1, px1 - px0 + 2, 2.5);
  const G = [[0, 0.9], [0.1, 0.86], [0.2, 0.88], [0.3, 0.78], [0.4, 0.74], [0.5, 0.6], [0.6, 0.55], [0.7, 0.38], [0.8, 0.3], [0.9, 0.14], [1, 0.03]];
  const gp = G.map(([u, v]) => [lerp(px0, px1, u), lerp(py0, py1, v)]);
  const xk = lerp(px0, px1, clamp(k));
  if (k > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(px0 - 4, py0 - 30, xk - px0 + 6, py1 - py0 + 40); ctx.clip();
    ctx.beginPath(); ctx.moveTo(px0, py1); gp.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.lineTo(px1, py1); ctx.closePath();
    ctx.fillStyle = linGrad(ctx, 0, py0, 0, py1, [[0, 'rgba(34,179,94,0.22)'], [1, 'rgba(34,179,94,0.02)']]); ctx.fill();
    ctx.beginPath(); gp.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#1fa356'; ctx.stroke();
    ctx.restore();
    let hy = gp[gp.length - 1][1];
    for (let i = 1; i < gp.length; i++) if (gp[i][0] >= xk) { hy = lerp(gp[i - 1][1], gp[i][1], (xk - gp[i - 1][0]) / (gp[i][0] - gp[i - 1][0])); break; }
    if (k >= 0.98) { // arrowhead
      ctx.fillStyle = '#1fa356'; ctx.save(); ctx.translate(px1, gp[gp.length - 1][1]); ctx.rotate(-1.0);
      poly(ctx, [[10, 0], [-10, -10], [-10, 10]]); ctx.fill(); ctx.restore();
    } else { ctx.fillStyle = '#1fa356'; ctx.beginPath(); ctx.arc(xk, hy, 6, 0, TAU); ctx.fill(); }
  }
}
function mgRoom(ctx, S, k) {
  const s = MG.scr;
  // ceiling + light strips
  ctx.fillStyle = linGrad(ctx, 0, MG.top, 0, MG.ceil, [[0, '#d3dbe4'], [1, '#e6ebf1']]); ctx.fillRect(-600, MG.top, 3200, MG.ceil - MG.top);
  for (const [y, h] of [[58, 7], [84, 5], [102, 3]]) { ctx.fillStyle = '#fbfdff'; ctx.fillRect(160, y, 1500, h); }
  glow(ctx, 900, 90, 700, KEY, 0.25, 0.15);
  // far wall
  ctx.fillStyle = linGrad(ctx, 0, MG.ceil, 0, MG.wallBase, [[0, '#e1e8ef'], [1, '#c9d2dd']]); ctx.fillRect(-600, MG.ceil, 3200, MG.wallBase - MG.ceil);
  // window on the far wall
  ctx.drawImage(soft('mg-city', 700, 420, 2, mgCity), 70, 140);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 400, 330, 420, KEY, 0.35, 0.8); ctx.restore();
  ctx.fillStyle = '#b3bdca'; for (const x of [70, 285, 500, 712]) ctx.fillRect(x, 140, 8, 420);
  ctx.fillRect(70, 136, 650, 8); ctx.fillRect(70, 556, 650, 10);
  // screen
  glow(ctx, (s.x0 + s.x1) / 2, (s.y0 + s.y1) / 2, 480, KEY, 0.2, 0.7);
  fillRR(ctx, s.x0 - 9, s.y0 - 9, s.x1 - s.x0 + 18, s.y1 - s.y0 + 18, 5, '#202733');
  mgSlide(ctx, S, k, s.x0, s.y0, s.x1, s.y1);
  // credenza + plant
  fillRR(ctx, 1220, 524, 380, 74, 4, '#a7b2c1'); ctx.fillStyle = '#c3ccd7'; ctx.fillRect(1220, 524, 380, 4);
  const px = 1770;
  for (let i = 0; i < 9; i++) moLeaf(ctx, px + (i - 4) * 4, 520, -Math.PI / 2 + (i - 4) * 0.28 + wobble(S.t, 0.1, i) * 0.03, 70 + hash(i) * 40, 12, i % 2 ? '#6f8a6e' : '#5f7a60');
  fillRR(ctx, px - 30, 520, 60, 78, 6, '#dfe5ec');
  // floor
  ctx.fillStyle = linGrad(ctx, 0, MG.wallBase, 0, MG.base, [[0, '#b2bcc9'], [1, '#9ca8b8']]); ctx.fillRect(-600, MG.wallBase, 3200, MG.base - MG.wallBase);
  ctx.fillStyle = 'rgba(40,52,70,0.2)'; ctx.fillRect(-600, MG.wallBase, 3200, 3);
  floorShadow(ctx, (MG.table.x0 + MG.table.x1) / 2, 650, 420, 14, 0.25);
  // chairs (backs on the left of each sitter; all face right)
  for (const x of MG_SEATS) {
    ctx.save(); ctx.translate(x - 40, 552); ctx.rotate(-0.1);
    fillRR(ctx, -8, -104, 16, 110, 6, '#7a879a'); ctx.fillStyle = '#98a4b5'; ctx.fillRect(4, -100, 2, 100);
    ctx.restore();
    fillRR(ctx, x - 44, 548, 96, 12, 5, '#7a879a');
    ctx.fillStyle = '#5c687b'; ctx.fillRect(x - 2, 560, 5, 74); ctx.fillRect(x - 30, 632, 60, 4);
  }
}
function mgTable(ctx, S) {
  const t = MG.table;
  ctx.fillStyle = linGrad(ctx, 0, t.top, 0, 640, [[0, '#8e9aac'], [1, '#6d7a8e']]); ctx.fillRect(t.x0 + 40, t.top + 8, t.x1 - t.x0 - 80, 640 - t.top - 8);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(t.x0 + 40, t.top + 8, 2, 140);
  fillRR(ctx, t.x0 + 50, 634, t.x1 - t.x0 - 100, 8, 3, '#4f5a6b');
  fillPoly(ctx, [[t.x0 + 6, t.top - 6], [t.x1 - 6, t.top - 6], [t.x1 + 4, t.top + 2], [t.x0 - 4, t.top + 2]], '#e4e9ef');
  ctx.fillStyle = linGrad(ctx, 0, t.top + 2, 0, t.top + 10, [[0, '#c3ccd7'], [1, '#9aa6b6']]); ctx.fillRect(t.x0 - 4, t.top + 2, t.x1 - t.x0 + 8, 8);
  // laptops (open, side-on; lids toward each sitter), glasses
  for (const x of MG_SEATS.slice(1)) {
    const lx = x + 58;
    ctx.fillStyle = '#4d596b'; ctx.fillRect(lx - 4, t.top - 9, 40, 3);
    ctx.save(); ctx.translate(lx + 36, t.top - 8); ctx.rotate(-1.85); fillRR(ctx, 0, -2, 40, 4, 1.5, '#4d596b'); ctx.restore();
    ctx.fillStyle = 'rgba(235,242,250,0.6)'; ctx.fillRect(lx + 50, t.top - 22, 9, 16);
  }
}
function mgGlass(ctx, S) {
  // tint + soft reflections of the corridor
  ctx.fillStyle = rgba('#7a8ca6', 0.16); ctx.fillRect(-600, MG.top, 3200, MG.base - MG.top);
  ctx.fillStyle = linGrad(ctx, 0, MG.base - 160, 0, MG.base, [[0, 'rgba(14,20,30,0)'], [1, 'rgba(14,20,30,0.28)']]); ctx.fillRect(-600, MG.base - 160, 3200, 160);
  ctx.fillStyle = linGrad(ctx, 0, MG.top, 0, MG.top + 90, [[0, 'rgba(14,20,30,0.3)'], [1, 'rgba(14,20,30,0)']]); ctx.fillRect(-600, MG.top, 3200, 90);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const drift = wobble(S.t, 0.05, 3) * 30;
  for (const [x, w, a] of [[180, 120, 0.06], [520, 50, 0.05], [1300, 160, 0.05], [1600, 60, 0.06]]) {
    ctx.fillStyle = linGrad(ctx, x + drift, 0, x + w + drift, 0, [[0, rgba(KEY, 0)], [0.5, rgba(KEY, a)], [1, rgba(KEY, 0)]]);
    poly(ctx, [[x + drift + 200, MG.top], [x + w + drift + 200, MG.top], [x + w + drift - 120, MG.base], [x + drift - 120, MG.base]]); ctx.fill();
  }
  for (let x = 120; x < 2000; x += 420) { ctx.fillStyle = rgba('#c9d6e6', 0.16); ctx.fillRect(x, 64, 150, 4); } // corridor lights reflected
  ctx.restore();
  // the opposite corridor wall's doors, reflected faintly (darker panels)
  ctx.fillStyle = 'rgba(20,28,40,0.07)'; ctx.fillRect(560, 230, 150, 460); ctx.fillRect(1460, 230, 150, 460);
  // frosted manifestation strip (below the sitters' heads)
  ctx.fillStyle = 'rgba(236,242,248,0.22)';
  for (let x = -600; x < 2600; x += 9) ctx.fillRect(x, 548, 5, 10);
  ctx.fillStyle = 'rgba(236,242,248,0.12)'; ctx.fillRect(-600, 545, 3200, 2); ctx.fillRect(-600, 559, 3200, 2);
  // mullions + tracks
  for (const x of MG_MULL) {
    ctx.fillStyle = linGrad(ctx, x - 7, 0, x + 7, 0, [[0, '#2a3341'], [0.5, '#4a5568'], [1, '#1f2733']]); ctx.fillRect(x - 7, MG.top, 14, MG.base - MG.top);
    ctx.fillStyle = 'rgba(220,230,242,0.35)'; ctx.fillRect(x + 4, MG.top, 1.2, MG.base - MG.top);
  }
  ctx.fillStyle = '#232b37'; ctx.fillRect(-600, MG.top - 4, 3200, 10); ctx.fillRect(-600, MG.base - 6, 3200, 12);
  ctx.fillStyle = 'rgba(220,230,242,0.3)'; ctx.fillRect(-600, MG.base - 6, 3200, 1.2);
  // corridor ceiling + floor
  ctx.fillStyle = linGrad(ctx, 0, -300, 0, MG.top - 4, [[0, '#0c1119'], [1, '#18202c']]); ctx.fillRect(-600, -300, 3200, MG.top - 4 + 300);
  ctx.fillStyle = linGrad(ctx, 0, MG.base + 6, 0, 900, [[0, '#28323f'], [0.3, '#161d27'], [1, '#090d13']]); ctx.fillRect(-600, MG.base + 6, 3200, 900);
  // room light spilling through onto the corridor floor
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = linGrad(ctx, 0, MG.base + 6, 0, MG.base + 100, [[0, rgba(KEY, 0.16)], [1, rgba(KEY, 0)]]); ctx.fillRect(-600, MG.base + 6, 3200, 100);
  ctx.restore();
}

// ── edge view (a2_03) ──
const VP = { x: 760, y: 300 };
const gAt = (s) => ({ x: VP.x + 250 * s, top: VP.y - 215 * s, bot: VP.y + 400 * s });
const wallAt = (s) => VP.x - 650 * s;
function mgEdgeRoom(c) { // cached, soft: the room seen obliquely through the glass, plus its reflection
  c.translate(100, 0);   // world x = px - 100
  c.fillStyle = linGrad(c, 0, 0, 0, 804, [[0, '#d7dfe8'], [0.4, '#eef2f7'], [0.75, '#c3ccd8'], [1, '#a9b4c3']]); c.fillRect(-100, 0, 2100, 804);
  c.fillStyle = radGrad(c, 1000, 330, 0, 330, [[0, 'rgba(104,120,142,0.85)'], [0.55, 'rgba(120,136,158,0.5)'], [1, 'rgba(140,156,178,0)']]); c.fillRect(600, 0, 800, 700); // a dim wall section seen behind his head
  c.fillStyle = '#f7f9fc'; for (let i = 0; i < 6; i++) { const s = 0.3 + i * 0.35; c.fillRect(VP.x + 330 * s, VP.y - 200 * s, 140 * s, 10 * s); }
  // window glow far left of the room, screen with soft green rising line
  c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(800, 150, 160, 280);
  c.fillStyle = '#f6f8fb'; c.fillRect(1290, 120, 330, 200);
  c.strokeStyle = '#1fa356'; c.lineWidth = 9; c.beginPath(); c.moveTo(1320, 290); c.lineTo(1400, 270); c.lineTo(1470, 230); c.lineTo(1540, 190); c.lineTo(1600, 140); c.stroke();
  // table + heads receding toward the VP
  c.fillStyle = '#8592a4'; poly(c, [[900, 420], [1950, 470], [1950, 560], [900, 450]]); c.fill();
  for (let i = 0; i < 5; i++) {
    const s = 0.55 + i * 0.32, x = 880 + i * 210, y = 400 - i * 8;
    c.fillStyle = '#4a566a'; c.beginPath(); c.ellipse(x, y, 24 * s, 30 * s, 0, 0, TAU); c.fill();
    c.fillRect(x - 34 * s, y + 24 * s, 68 * s, 90 * s);
  }
  c.fillStyle = '#3f4a5c'; c.beginPath(); c.ellipse(1460, 300, 30, 36, 0, 0, TAU); c.fill(); c.fillRect(1430, 330, 60, 200); // presenter
  // reflections of the bright room ghosting on the glass
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(1100, 60, 60, 600); c.fillRect(1700, 30, 90, 700);
}
function mgEdge(ctx, S) {
  const near = gAt(3.2), far = gAt(0.18);
  // corridor: ceiling, left wall, floor, end wall
  ctx.fillStyle = '#121923'; ctx.fillRect(-600, -400, 3200, 1700);
  fillPoly(ctx, [[wallAt(3), VP.y - 215 * 3], [wallAt(0.18), far.top], [far.x, far.top], [near.x, near.top]], '#1a222e');
  fillPoly(ctx, [[wallAt(3), VP.y + 400 * 3], [wallAt(0.18), far.bot], [far.x, far.bot], [near.x, near.bot]], '#1b2430');
  ctx.fillStyle = linGrad(ctx, wallAt(1.6), 0, wallAt(0.18), 0, [[0, '#121a24'], [1, '#26313f']]);
  poly(ctx, [[wallAt(3), VP.y - 215 * 3], [wallAt(0.18), far.top], [wallAt(0.18), far.bot], [wallAt(3), VP.y + 400 * 3]]); ctx.fill();
  fillPoly(ctx, [[wallAt(0.18), far.top], [far.x, far.top], [far.x, far.bot], [wallAt(0.18), far.bot]], '#3a4759');
  glow(ctx, VP.x - 30, VP.y + 10, 70, '#b8c6d8', 0.25);
  // doors on the left wall
  for (const s of [1.25, 0.62, 0.38]) {
    const s2 = s * 0.82, x1 = wallAt(s), x2 = wallAt(s2);
    fillPoly(ctx, [[x1, VP.y - 90 * s], [x2, VP.y - 90 * s2], [x2, VP.y + 400 * s2], [x1, VP.y + 400 * s]], '#222c3a');
    ctx.fillStyle = 'rgba(160,178,200,0.25)'; ctx.fillRect(x2 + 4 * s, VP.y + 150 * s2, 3 * s, 14 * s);
  }
  // dim corridor ceiling lights
  for (const s of [2.2, 1.2, 0.75, 0.5, 0.36, 0.26]) {
    const cx = VP.x - 200 * s, cy = VP.y - 215 * s + 3 * s;
    fillRR(ctx, cx - 40 * s, cy, 80 * s, 6 * s, 2, '#8fa0b8'); glow(ctx, cx, cy + 6 * s, 90 * s, '#9fb2cc', 0.18);
  }
  // the room through the glass (soft), clipped to the glass wedge
  ctx.save();
  poly(ctx, [[far.x, far.top], [near.x, near.top], [near.x + 600, near.top], [near.x + 600, near.bot], [near.x, near.bot], [far.x, far.bot]]); ctx.clip();
  ctx.drawImage(soft('mg-edge-room', 2100, 804, 7, mgEdgeRoom, 0.5), -100, 0, 2100, 804);
  ctx.fillStyle = rgba('#8899b0', 0.12); ctx.fillRect(-100, -400, 2600, 1700);
  // frosted strip along the glass at ~1 m
  ctx.fillStyle = 'rgba(236,242,248,0.28)';
  for (let s = 0.2; s < 3.2; s *= 1.035) { const g = gAt(s); ctx.fillRect(g.x, VP.y + 154 * s, 3 * s, 7 * s); }
  // mullions + tracks
  for (const s of [2.4, 1.45, 0.66, 0.46, 0.34, 0.27, 0.22]) {
    const g = gAt(s), w = 13 * s;
    ctx.fillStyle = linGrad(ctx, g.x - w / 2, 0, g.x + w / 2, 0, [[0, '#2a3341'], [0.5, '#526079'], [1, '#1d2531']]); ctx.fillRect(g.x - w / 2, g.top, w, g.bot - g.top);
  }
  ctx.restore();
  ctx.lineWidth = 10; ctx.strokeStyle = '#222a36';
  ctx.beginPath(); ctx.moveTo(far.x, far.top); ctx.lineTo(near.x, near.top); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(far.x, far.bot); ctx.lineTo(near.x, near.bot); ctx.stroke();
  // room light spilling into the corridor: a bright band on the floor along the glass + on the left wall
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(soft('mg-edge-spill', 1400, 900, 18, (c) => {
    c.translate(-500, 0); c.fillStyle = rgba(KEY, 0.22);
    poly(c, [[far.x, far.bot], [near.x, near.bot], [near.x - 260, near.bot], [far.x - 30, far.bot + 6]]); c.fill();
  }, 0.25), 500, 0, 1400, 900);
  ctx.fillStyle = radGrad(ctx, 1000, 380, 0, 700, [[0, rgba('#c9d6e6', 0.14)], [1, rgba('#c9d6e6', 0)]]); ctx.fillRect(200, -100, 1600, 1000);
  ctx.restore();
}
function mgFog(ctx, S, f) {
  if (f <= 0) return;
  const { x, y } = meetingGlass.anchors.fog, a = clamp(f);
  const br = 1 + 0.04 * Math.sin(S.t * 1.3);
  ctx.save(); ctx.translate(x, y); ctx.scale(0.8 * br, 1.05 * br);
  const R = 26 + 18 * a;
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, R, [[0, rgba('#f2f6fa', 0.7 * a)], [0.5, rgba('#e8eef5', 0.55 * a)], [0.8, rgba('#dfe7f0', 0.3 * a)], [1, rgba('#dfe7f0', 0)]]);
  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();

  ctx.fillStyle = rgba('#ffffff', 0.35 * a);
  for (let i = 0; i < 26; i++) {
    const r = Math.sqrt(hash(i * 5 + 1)) * R * 0.75, th = hash(i * 7 + 2) * TAU;
    ctx.beginPath(); ctx.arc(Math.cos(th) * r, Math.sin(th) * r, 0.6 + hash(i) * 0.9, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

export const meetingGlass = {
  W: 1920, floorY: FLOOR,
  anchors: {
    seat1: { x: 300, y: 550 }, seat2: { x: 450, y: 550 }, seat3: { x: 590, y: 550 },
    seat4: { x: 730, y: 550 }, seat5: { x: 870, y: 550 }, seat6: { x: 1010, y: 550 },
    roomFloor: { x: 960, y: 640 }, presenter: { x: 1190, y: 640 }, screen: { x: 1390, y: 325 },
    adamOTS: { x: 130, y: 1180 }, adamReflect: { x: 430, y: 700 },
    adamGlass: { x: 928, y: 700 }, fog: { x: 1030, y: 318 }, corridor: { x: 520, y: 700 },
  },
  roomScale: 0.82,
  lights: { officeDay: { key: KEY, from: 1, amount: 0.55 } },
  roomLight: { key: KEY, from: -1, amount: 0.5 },

  back(ctx, F, o = {}) {
    const S = resolve(F, o);
    ctx.save();
    ctx.fillStyle = '#121923'; ctx.fillRect(0, 0, PW, PH);
    camera(ctx, S.cam, 1, () => {
      if (o.view === 'edge') mgEdge(ctx, S);
      else mgRoom(ctx, S, o.chart ?? 1);
    });
    ctx.restore();
  },

  mid(ctx, F, o = {}) {
    if (o.view === 'edge') return;
    const S = resolve(F, o), part = o.part || 'all';
    ctx.save();
    camera(ctx, S.cam, 1, () => {
      if (part !== 'glass') mgTable(ctx, S);
      if (part !== 'table') mgGlass(ctx, S);
    });
    ctx.restore();
  },

  front(ctx, F, o = {}) {
    const S = resolve(F, o);
    ctx.save();
    if (o.view === 'edge') {
      camera(ctx, S.cam, 1, () => mgFog(ctx, S, o.fog ?? 0));
      camera(ctx, S.cam, 1.2, () => {
        ctx.fillStyle = linGrad(ctx, -300, 0, 500, 0, [[0, 'rgba(6,9,14,0.55)'], [1, 'rgba(6,9,14,0)']]); ctx.fillRect(-600, -400, 1100, 1700);
      });
    } else {
      camera(ctx, S.cam, 1.25, () => {
        ctx.fillStyle = linGrad(ctx, -200, 0, 520, 0, [[0, 'rgba(6,9,14,0.6)'], [1, 'rgba(6,9,14,0)']]); ctx.fillRect(-600, -400, 1120, 1700);
        ctx.fillStyle = linGrad(ctx, 1640, 0, 2100, 0, [[0, 'rgba(6,9,14,0)'], [1, 'rgba(6,9,14,0.5)']]); ctx.fillRect(1640, -400, 900, 1700);
        ctx.fillStyle = linGrad(ctx, 0, 640, 0, 900, [[0, 'rgba(6,9,14,0)'], [1, 'rgba(6,9,14,0.5)']]); ctx.fillRect(-600, 640, 3200, 400);
      });
    }
    ctx.restore();
  },
};
