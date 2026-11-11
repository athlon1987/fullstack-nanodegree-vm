// THE REPLACEMENT — props library.
//
// Every prop is a function (ctx, o) that draws one small, slightly worn real-world object,
// side-on, with vector paths only (nothing is cached, so props stay crisp from a 20 px
// hand-prop to a 900 px close-up). Sizes are in the caller's units: at camera zoom 1 the film
// scale is 1 cm = 2.46 px, and the "film size" quoted for each prop is its real-world size.
//
// ── OPTIONS EVERY PROP UNDERSTANDS ────────────────────────────────────────────────────────
//   x, y     where the prop's origin goes (the origin of each prop is documented below).
//   size     the documented dimension, in px.
//   rot      degrees, clockwise, about the origin.
//   flip     -1 mirrors the prop left↔right (use it to make a prop face the other way).
//   squash   vertical foreshortening in screen space (1 = none; 0.2 = lying on a table/floor,
//            seen from a low angle). Applied before rot.
//   alpha    overall opacity.
//   lum      0..1 how brightly the prop is lit. 1 = full colour, 0.5 = a dim room,
//            0.15–0.25 = a dark scene where the object is a near-silhouette and only its rim
//            shows. Default 1.
//   tint     ambient colour (hex) the prop is pulled toward — pass the scene's fill/haze colour
//            (e.g. LOOK.nightDark.fill, C.navy, LOOK.golden.haze). The darker the prop, the
//            stronger the pull.
//   light    the key light: { color, from, amount }.
//              color   hex (use LOOK.x.key)
//              from    1 = light comes from screen right, -1 = from screen left,
//                      'above' | 'below', or give  angle: degrees  (direction TOWARD the light:
//                      0 = right, -90 = straight up, 90 = straight down, 180 = left).
//              amount  0..1 strength of the rim / highlight.
//              wash    0..1 (optional) how far the light floods across the face of the object,
//                      for a strong coloured glow (phone screen, police lights). Default subtle.
//            May also be an array of such lights (e.g. a warm lamp plus a cyan phone glow), or
//            null for no rim at all. Default: a faint neutral light from the upper left.
//   shadow   0..1 soft contact shadow under props that stand on a surface (default 0).
//
// Every prop returns an object of ANCHORS — points in the caller's coordinates ({x, y}), so a
// hand can be put on a handle, a glow on a lens, etc.
//
// ── HERO PROPS ───────────────────────────────────────────────────────────────────────────
// lunchbox(ctx, o)   Adam's battered red enamel lunchbox, front view.            film size 46
//   origin   centre of the base (it sits on y). With anchor:'handle' the origin is the grip of
//            the raised carry-handle and the box hangs below it (rot then swings it).
//   size     width of the body.  Closed it is 0.61 × size tall (plus the folded handle);
//            fully open, the lid stands 1.02 × size above the base.
//   open     0..1. 0–0.08 flips the clasp, then the lid lifts to about 100° at 1. The lid is
//            hinged along the back edge, so it swings up and away from us and shows its inside.
//   note     0 = no note. >0 = the folded note is tucked under the wire clip inside the lid
//            (only visible once the lid is open); toward 1 it slides out of the clip in the
//            direction noteDir, ready to be taken (swap to note() at anchors.noteSlot).
//   noteDir  degrees, direction the note slides (default -155: up and to the left).
//   noteSize unfolded width of the note it holds (default 0.8 × size; folded it is half that).
//   handleUp 0..1 raises the wire handle (default 0 = folded flat; 1 when anchor:'handle').
//   clasp    0..1 overrides the clasp flip that `open` drives.
//   wobble   -1..1. Sitting on its base: rocks the box onto one bottom corner (±4°) — use a
//            decaying wobble when it is set down. Hanging from the handle: swings the box
//            ±8° under the grip (lag while running).
//   anchors  { handle, clasp, lidEdge, noteSlot:{x,y,rot,size,squash}, top, centre, base }
//            noteSlot can be spread straight into note(): note(ctx, {...a.noteSlot, unfold:0}).
//
// note(ctx, o)       the note from inside the lunchbox.              film size 34 (14 cm wide)
//   origin   the centre of the paper AS CURRENTLY FOLDED (so it stays centred while it opens).
//   size     width of the sheet unfolded; it is 0.76 × size tall. Folded in four it is
//            0.5 × 0.38 of size.
//   unfold   0 = folded in four … 0.5 = folded in half … 1 = open flat. The writing is on the
//            inside and only shows during the second half of the unfold.
//   anchors  { centre, tl, tr, bl, br, w, h }  (corners of the visible paper, for fingertips)
//
// ── SUPPORTING PROPS ─────────────────────────────────────────────────────────────────────
// crayonFamily(ctx, o)  child's crayon drawing: three figures, a sun, a house.  film size 73
//   origin centre · size = paper width (height 0.72 × size) · paper:false draws only the wax
//   strokes (for a phone wallpaper on its own ground) · lunchbox:true puts a tiny red box in
//   the tall figure's hand (off by default: red is reserved) · anchors { centre, w, h }
// phoneSmall(ctx, o)    a phone in a character's hand, seen edge-on.            film size 37
//   origin the grip, 30 % up from the bottom end · size = length · rot 0 = upright
//   glow: colour|null lights the screen · face: 1|-1 which way the screen faces at rot 0
//   (default 1 = right; flip also works) · turn 0..1 swings the screen toward camera
//   (0 = pure edge, 1 = full front; default 0.16) · bloom 0..1 size of the light it throws
//   anchors { screen, top, bottom, grip }
// tablet(ctx, o)        the representative's slim tablet.                       film size 62
//   origin centre · size = long side · rot 0 = upright, screen facing right · glow (default
//   cold white C.ice) · face, turn, bloom as phoneSmall · anchors { screen, top, bottom }
// envelope(ctx, o)      window envelope with a brick-red OVERDUE stamp.         film size 54
//   origin centre · size = width (height 0.5 × size) · stamp 0..1 opacity of the stamp
//   anchors { centre, stamp, w, h }
// toast(ctx, o)         a slice of toast, face-on.                              film size 27
//   origin centre of the bottom crust · size = width (height 1.04 × size)
//   burnt 0 golden … 1 black · turn 0..1 (1 = seen edge-on) · anchors { centre, top }
// trophy(ctx, o)        gold star on a small plinth.                            film size 56
//   origin centre of the base · size = total height · sparkle 0..1 glints, t animates them
//   anchors { star, stem, base }
// wrench(ctx, o)        adjustable spanner.                                     film size 58
//   origin the grip (middle of the handle) · size = length · rot 0 = jaws to the right
//   anchors { head, tail }
// cloth(ctx, o)         a tea-towel bunched in a fist.                          film size 70
//   origin the grip (where it is bunched) · size = hanging length · sway -1..1
//   anchors { grip, hem }
// accessCard(ctx, o)    office access card.                                     film size 21
//   origin centre · size = long side (upright) · strap 0..1 length of lanyard stub
//   anchors { centre, top }
// stylus(ctx, o)        the tablet stylus.                                      film size 34
//   origin the grip (30 % back from the tip) · size = length · rot 0 = tip to the right
//   anchors { tip, tail }
// scanner(ctx, o)       police handheld identity scanner.                       film size 50
//   origin the grip (middle of the handle) · size = length · rot 0 = lens to the right
//   beam 0..1 cyan emission from the lens · beamLen px (default 6 × size) · beamSpread deg
//   anchors { lens, dir:{x,y}, screen }
// backpack(ctx, o)      Maya's school backpack, side view.                      film size 80
//   origin centre of the base · size = height · straps are on the left (flip to change)
//   slump 0..1 sags it (on a chair / the floor) · anchors { top, strap, centre }
// softToy(ctx, o)       a floppy rabbit held by one ear.                        film size 72
//   origin the grip (tip of the held ear) · size = hanging length · sway -1..1
//   anchors { grip, head, feet }
// cerealBowl(ctx, o)    bowl of cereal with a spoon.                            film size 38
//   origin centre of the base · size = rim width · spoon 0|1 · fill 0..1
//   anchors { rim, spoon, centre }
// mug(ctx, o)           plain mug, handle to the right.                         film size 23
//   origin centre of the base · size = height · steam 0..1 with t for motion
//   anchors { rim, handle, centre }
// satchel(ctx, o)       Adam's worn work bag.                                   film size 98
//   origin centre of the base (anchor:'handle' → the top handle grip) · size = width
//   anchors { handle, centre, top }
// stepStool(ctx, o)     Maya's two-step kitchen stool, side view.               film size 62
//   origin centre of the base on the floor · size = height · the tall step is on the right
//   anchors { top, step, w }
// paperStar(ctx, o)     a hand-cut paper star.                                  film size 30
//   origin centre · size = tip-to-tip · color (default pale gold) · seed varies the cut
//   anchors { centre }

import { clamp, lerp, invlerp, TAU, rad, ease, hash, rng, noise1, rgba, mixHex, linGrad, radGrad, glow, lightCone, rr, text, measure, FONT } from './engine.js';
import { C } from './style.js';

// ───────────────────────────── colour + light ─────────────────────────────
const _rgb = new Map();
function rgb(hex) {
  let v = _rgb.get(hex);
  if (!v) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
    v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    _rgb.set(hex, v);
  }
  return v;
}
const hexOf = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const K = 0.5523; // circle-ish bezier corner

/**
 * Resolve lum / tint / light into a small shading kit:
 *   L.col(hex, keep)  the colour as lit. keep 0..1 = how stubbornly the colour holds its own
 *                     chroma and brightness in dim or tinted light (the lunchbox red uses ~0.85).
 *   L.lights          [{color, amount, x, y}] with (x, y) the unit vector toward the light in
 *                     the prop's local (rotated / flipped) space — filled in by begin().
 */
function lighting(o) {
  const lum = clamp(o.lum ?? 1);
  let tn = null;
  if (o.tint) { const t = rgb(o.tint), m = Math.max(t[0], t[1], t[2], 1); tn = [t[0] / m, t[1] / m, t[2] / m]; }
  let src = o.light;
  if (src === undefined) {
    src = { color: tn ? hexOf(255 * lerp(1, tn[0], 0.5), 255 * lerp(1, tn[1], 0.5), 255 * lerp(1, tn[2], 0.5)) : '#ffffff', from: -1, amount: 0.34 * (0.15 + 0.85 * lum) };
  }
  const list = !src ? [] : Array.isArray(src) ? src : [src];
  const lights = list.map((l) => {
    const from = l.from ?? -1;
    let a;
    if (typeof l.angle === 'number') a = rad(l.angle);
    else if (from === 'above') a = -Math.PI / 2;
    else if (from === 'below') a = Math.PI / 2;
    else a = from >= 0 ? rad(-30) : rad(-150);
    return { color: l.color || '#ffffff', amount: clamp(l.amount ?? 0.6), wash: l.wash, wx: Math.cos(a), wy: Math.sin(a), x: Math.cos(a), y: Math.sin(a) };
  });
  const memo = new Map();
  const col = (hex, keep = 0) => {
    const id = hex + keep;
    let out = memo.get(id);
    if (out) return out;
    const c = rgb(hex);
    const e = Math.pow(lum, 1 - 0.5 * keep);
    const pull = 0.3 * (1 - keep), amb = 0.07 + 0.06 * keep;
    const ch = (i) => {
      const t = tn ? tn[i] : 1;
      return c[i] * (e * lerp(1, t, pull) + (1 - e) * lerp(t, 1, keep * 0.45) * amb);
    };
    out = hexOf(ch(0), ch(1), ch(2));
    memo.set(id, out);
    return out;
  };
  return { lum, tn, lights, col, main: lights[0] || { color: '#ffffff', amount: 0, x: -0.8, y: -0.6, wx: -0.8, wy: -0.6 } };
}

/** Enter the prop's local space. Returns P(lx, ly) → the same point in the caller's coordinates. */
function begin(ctx, o, L) {
  const x = o.x || 0, y = o.y || 0, rot = rad(o.rot || 0), flip = o.flip === -1 ? -1 : 1, sq = o.squash ?? 1;
  ctx.save();
  ctx.translate(x, y);
  if (sq !== 1) ctx.scale(1, sq);
  if (rot) ctx.rotate(rot);
  if (flip < 0) ctx.scale(-1, 1);
  if (o.alpha !== undefined) ctx.globalAlpha *= clamp(o.alpha);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const cs = Math.cos(rot), sn = Math.sin(rot);
  for (const l of [...L.lights, L.main]) {
    l.x = (l.wx * cs + l.wy * sn) * flip;
    l.y = -l.wx * sn + l.wy * cs;
  }
  return (lx, ly) => {
    const X = lx * flip;
    return { x: x + X * cs - ly * sn, y: y + (X * sn + ly * cs) * sq };
  };
}
const end = (ctx) => ctx.restore();

/** Soft contact shadow on the surface the prop stands on (drawn in the prop's local space, at y = 0). */
function contactShadow(ctx, o, w, cx = 0) {
  const a = clamp(o.shadow ?? 0);
  if (a <= 0) return;
  ctx.save();
  ctx.translate(cx, 0); ctx.scale(1, 0.16);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, w * 0.62, [[0, `rgba(0,0,0,${0.75 * a})`], [0.55, `rgba(0,0,0,${0.4 * a})`], [1, 'rgba(0,0,0,0)']]);
  ctx.beginPath(); ctx.arc(0, 0, w * 0.62, 0, TAU); ctx.fill();
  ctx.restore();
}

/**
 * Rim light: strokes the INSIDE edge of a shape with each light's colour, on the side that faces
 * it. path(ctx) must begin and build the path; bb is its local bounding box {x, y, w, h}.
 */
function rim(ctx, L, path, bb, w, k = 1) {
  for (const l of L.lights) {
    const a = clamp(l.amount * k);
    if (a < 0.015) continue;
    const cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2;
    const R = Math.abs(l.x) * bb.w / 2 + Math.abs(l.y) * bb.h / 2 || 1;
    const g = ctx.createLinearGradient(cx - l.x * R, cy - l.y * R, cx + l.x * R, cy + l.y * R);
    g.addColorStop(0, rgba(l.color, 0)); g.addColorStop(0.5, rgba(l.color, 0));
    g.addColorStop(0.84, rgba(l.color, a * 0.55)); g.addColorStop(1, rgba(l.color, a));
    ctx.save();
    path(ctx); ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = g; ctx.lineWidth = w * 2; ctx.lineJoin = 'round';
    path(ctx); ctx.stroke();
    ctx.restore();
  }
}

/** Soft volume: darkens the side away from the main light and washes the near side with its colour
 *  (a light's own `wash` 0..1 overrides lightK — use it for a glow that floods the object). */
function form(ctx, L, path, bb, dark = 0.3, lightK = 0.2) {
  const l = L.main;
  const cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2;
  const R = Math.abs(l.x) * bb.w / 2 + Math.abs(l.y) * bb.h / 2 || 1;
  ctx.save();
  path(ctx); ctx.clip();
  const g = ctx.createLinearGradient(cx - l.x * R, cy - l.y * R, cx + l.x * R, cy + l.y * R);
  g.addColorStop(0, `rgba(0,0,0,${dark})`); g.addColorStop(0.55, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(bb.x - 2, bb.y - 2, bb.w + 4, bb.h + 4);
  for (const q of L.lights) {
    const a = clamp(q.amount * (q.wash ?? lightK * (0.35 + 0.65 * L.lum)));
    if (a < 0.01) continue;
    const R2 = Math.abs(q.x) * bb.w / 2 + Math.abs(q.y) * bb.h / 2 || 1;
    const g2 = ctx.createLinearGradient(cx - q.x * R2, cy - q.y * R2, cx + q.x * R2, cy + q.y * R2);
    g2.addColorStop(0.3, rgba(q.color, 0)); g2.addColorStop(1, rgba(q.color, a));
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g2; ctx.fillRect(bb.x - 2, bb.y - 2, bb.w + 4, bb.h + 4);
  }
  ctx.restore();
}

/** Irregular closed polygon around (cx, cy) from precomputed unit offsets. */
function poly(ctx, cx, cy, pts, s = 1) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const px = cx + pts[i][0] * s, py = cy + pts[i][1] * s;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

/** Smooth closed blob through precomputed offsets (stains, soft patches). */
function blob(ctx, cx, cy, pts, s = 1) {
  const n = pts.length;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = pts[i % n], b = pts[(i + 1) % n];
    const mx = cx + ((a[0] + b[0]) / 2) * s, my = cy + ((a[1] + b[1]) / 2) * s;
    if (!i) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(cx + a[0] * s, cy + a[1] * s, mx, my);
  }
  ctx.closePath();
}
function ring(r, n, rx, ry, jag = 0.4) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + (r() - 0.5) * (TAU / n) * 0.7, k = 1 - jag / 2 + r() * jag;
    pts.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]);
  }
  return pts;
}

/** Rounded slab with a gently domed top edge: used for the lunchbox lid. */
function domeBox(ctx, x0, x1, yT, yB, rx, ry, rb, dome = 0) {
  ctx.beginPath();
  ctx.moveTo(x0 + rb, yB);
  ctx.lineTo(x1 - rb, yB);
  ctx.quadraticCurveTo(x1, yB, x1, yB - rb);
  ctx.lineTo(x1, yT + ry);
  ctx.bezierCurveTo(x1, yT + ry * (1 - K), x1 - rx * (1 - K), yT, x1 - rx, yT);
  ctx.quadraticCurveTo(0, yT - dome * 2, x0 + rx, yT);
  ctx.bezierCurveTo(x0 + rx * (1 - K), yT, x0, yT + ry * (1 - K), x0, yT + ry);
  ctx.lineTo(x0, yB - rb);
  ctx.quadraticCurveTo(x0, yB, x0 + rb, yB);
  ctx.closePath();
}

function starPath(ctx, cx, cy, R, r, rot = -Math.PI / 2, n = 5, jit = null) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n;
    let rr = i % 2 ? r : R;
    if (jit) rr *= jit[i % jit.length];
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

// ───────────────────────────── shared small helpers ─────────────────────────────
const D = Math.PI / 180;
const sm = (a, b, v) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
function run(ctx, o, fn) {
  const L = lighting(o);
  const P = begin(ctx, o, L);
  let a;
  try { a = fn(L, P); } finally { end(ctx); }
  return a || {};
}
/** fill a path with a lit colour, then volume shading and rim light. */
function solid(ctx, L, path, bb, color, keep = 0, k = {}) {
  path(ctx);
  ctx.fillStyle = k.fill || L.col(color, keep);
  ctx.fill();
  form(ctx, L, path, bb, k.dark ?? 0.28, k.lightK ?? 0.2);
  rim(ctx, L, path, bb, k.rimW ?? Math.max(0.7, bb.w * 0.018), k.rimK ?? 1);
}
const lw = (W, f, min = 0.6) => Math.max(min, W * f);
function line(ctx, x0, y0, x1, y1) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }

/** a chip in the enamel: bare steel with a dark rusty edge. */
function chip(ctx, L, cx, cy, s, seed) {
  s *= 0.72; const r = rng(seed), pts = ring(r, 8, s, s * 0.72, 0.7);
  ctx.save();
  poly(ctx, cx, cy, pts, 1.18); ctx.fillStyle = L.col(C.lunchDark, 0.85); ctx.globalAlpha *= 0.8; ctx.fill();
  ctx.globalAlpha = Math.min(1, ctx.globalAlpha / 0.8 * 1);
  poly(ctx, cx, cy, pts, 1); ctx.fillStyle = L.col('#a4abb2', 0.15); ctx.fill();
  poly(ctx, cx + s * 0.08, cy + s * 0.2, pts, 0.62); ctx.fillStyle = L.col('#6d6259', 0.2); ctx.globalAlpha *= 0.55; ctx.fill();
  ctx.restore();
}
function scratches(ctx, L, seed, n, x0, y0, x1, y1, W, light = '#e8836a') {
  const r = rng(seed);
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), a = (-25 + (r() - 0.5) * 70) * D, len = W * (0.03 + r() * 0.1);
    ctx.strokeStyle = r() < 0.45 ? L.col('#b9c0c6', 0.1) : L.col(light, 0.7);
    ctx.globalAlpha = 0.28 + r() * 0.3; ctx.lineWidth = lw(W, 0.004, 0.45);
    line(ctx, x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
  }
  ctx.restore();
}
/** a dent: shadow toward the light, catch-light on the far side. */
function dent(ctx, L, cx, cy, rx, ry, rotD = 0) {
  const l = L.main;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotD * D);
  const g = ctx.createLinearGradient(l.x * rx, l.y * ry, -l.x * rx, -l.y * ry);
  g.addColorStop(0, 'rgba(0,0,0,0.34)'); g.addColorStop(0.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,230,210,0.22)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = Math.max(0.5, rx * 0.06); ctx.stroke();
  ctx.restore();
}
function steelGrad(ctx, y0, y1, L, dark = '#5b636b', mid = '#a9b1b8', hi = '#dfe5ea') {
  return linGrad(ctx, 0, y0, 0, y1, [[0, L.col(hi, 0.1)], [0.4, L.col(mid, 0.1)], [1, L.col(dark, 0.1)]]);
}

// ═════════════════════════════════════════════ THE LUNCHBOX ═════════════════════════════════════════════
export function lunchbox(ctx, o = {}) {
  const W = o.size ?? 100;
  const open = clamp(o.open ?? 0);
  const handleMode = o.anchor === 'handle';
  const hUp = clamp(o.handleUp ?? (handleMode ? 1 : 0));
  const note = clamp(o.note ?? 0);
  const noteW = (o.noteSize ?? 0.8 * W);
  const HB = 0.36 * W, LH = 0.25 * W;
  const lift = ease.inOutSine(invlerp(0.08, 1, open));
  const phi = 100 * D * lift;
  const clasp = clamp(o.clasp ?? invlerp(0, 0.08, open));
  const v = clamp(lift * 7);                       // how much of the inside is showing
  const tray = 0.07 * W * v;
  const yh = -HB - tray;                           // hinge line (back top edge of the body)
  const r = (0.25 * Math.cos(phi) + 0.64 * Math.sin(phi)) * W;
  const yt = yh - r;                               // free (front) edge of the lid
  const wallH = Math.max(0.035 * W, LH * Math.abs(Math.cos(phi)));
  const wallTop = Math.cos(phi) >= 0 ? yt : yt - wallH;
  const wallBot = wallTop + wallH;
  const apexH = 0.3 * W * hUp;
  const yShift = handleMode ? 0.61 * W + apexH : 0;
  const wob = o.wobble || 0;

  return run(ctx, o, (L, P) => {
    // wobble transforms (applied in local space)
    let wpx = 0, wa = 0;
    if (handleMode) wa = wob * 8 * D; else { wa = wob * 4 * D; wpx = Math.sign(wob) * 0.485 * W; }
    const place = (px, py) => {      // local point -> after wobble + shift
      let x = px, y = py + yShift;
      if (wa) {
        const cx = handleMode ? 0 : wpx, cy = handleMode ? 0 : 0;
        const dx = x - cx, dy = y - cy, c = Math.cos(wa), s = Math.sin(wa);
        x = cx + dx * c - dy * s; y = cy + dx * s + dy * c;
      }
      return P(x, y);
    };
    if (!handleMode) contactShadow(ctx, o, W * 1.05);
    if (wa) { if (handleMode) ctx.rotate(wa); else { ctx.translate(wpx, 0); ctx.rotate(wa); ctx.translate(-wpx, 0); } }
    ctx.translate(0, yShift);

    const kBody = 0.85;
    const red = L.col(C.lunch, kBody), redLo = L.col(mixHex(C.lunch, C.lunchDark, 0.7), kBody), redHi = L.col(C.lunchLight, kBody);
    const bodyBB = { x: -0.485 * W, y: -HB, w: 0.97 * W, h: HB };
    const bodyPath = (c) => {
      const x0 = -0.485 * W, x1 = 0.485 * W, rb = 0.05 * W, rt = 0.015 * W;
      c.beginPath(); c.moveTo(x0 + rt, -HB); c.lineTo(x1 - rt, -HB); c.quadraticCurveTo(x1, -HB, x1, -HB + rt);
      c.lineTo(x1 - 0.004 * W, -rb); c.quadraticCurveTo(x1 - 0.004 * W, 0, x1 - rb, 0);
      c.lineTo(x0 + rb, 0); c.quadraticCurveTo(x0 + 0.004 * W, 0, x0 + 0.004 * W, -rb);
      c.lineTo(x0, -HB + rt); c.quadraticCurveTo(x0, -HB, x0 + rt, -HB); c.closePath();
    };

    // ── the body ──
    ctx.save();
    bodyPath(ctx);
    ctx.fillStyle = linGrad(ctx, 0, -HB, 0, 0, [[0, redHi], [0.18, red], [0.72, red], [1, redLo]]);
    ctx.fill();
    form(ctx, L, bodyPath, bodyBB, 0.3, 0.16);
    ctx.save(); bodyPath(ctx); ctx.clip();
    // rolled bottom edge and an embossed band
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(-W, -0.028 * W, 2 * W, 0.03 * W);
    ctx.fillStyle = rgba('#ffd9cc', 0.14 * (0.3 + 0.7 * L.lum)); ctx.fillRect(-W, -0.032 * W, 2 * W, 0.004 * W);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = lw(W, 0.006); line(ctx, -W, -0.1 * W, W, -0.1 * W);
    ctx.strokeStyle = rgba('#ffc9b8', 0.1 * (0.3 + 0.7 * L.lum)); line(ctx, -W, -0.1 * W + lw(W, 0.007), W, -0.1 * W + lw(W, 0.007));
    // side edges: enamel gets thinner and darker where it wraps
    ctx.fillStyle = linGrad(ctx, -0.485 * W, 0, 0.485 * W, 0, [[0, 'rgba(60,8,4,0.30)'], [0.07, 'rgba(60,8,4,0)'], [0.93, 'rgba(60,8,4,0)'], [1, 'rgba(60,8,4,0.30)']]);
    ctx.fillRect(-W, -HB, 2 * W, HB);
    // wear
    for (const c of [[-0.455, -0.012, 0.032, 1], [0.462, -0.02, 0.042, 2], [0.3, -0.003, 0.024, 3], [-0.24, -0.002, 0.02, 4], [-0.485, -0.17, 0.028, 5], [0.487, -0.27, 0.034, 6], [-0.47, -0.335, 0.024, 7], [0.14, -0.358, 0.02, 8], [0.4, -0.35, 0.016, 9], [-0.12, -0.325, 0.014, 10]])
      chip(ctx, L, c[0] * W, c[1] * W, c[2] * W, c[3]);
    scratches(ctx, L, 21, 16, -0.45 * W, -0.34 * W, 0.45 * W, -0.02 * W, W);
    scratches(ctx, L, 22, 7, 0.1 * W, -0.34 * W, 0.46 * W, -0.04 * W, W, '#ff9a80');
    // dents
    dent(ctx, L, 0.29 * W, -0.145 * W, 0.075 * W, 0.045 * W, -12);
    dent(ctx, L, -0.39 * W, -0.09 * W, 0.04 * W, 0.028 * W, 20);
    // the faded yellow star sticker
    ctx.save(); ctx.translate(-0.06 * W, -0.185 * W); ctx.rotate(-11 * D);
    const sR = 0.118 * W, sr = 0.054 * W;
    const jit = [1, 0.97, 1.03, 1, 0.95, 1.02, 0.98, 1.04, 1, 0.96];
    ctx.save(); ctx.translate(0.004 * W, 0.006 * W); starPath(ctx, 0, 0, sR * 1.02, sr * 1.04, -Math.PI / 2, 5, jit); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill(); ctx.restore();
    starPath(ctx, 0, 0, sR, sr, -Math.PI / 2, 5, jit);
    ctx.fillStyle = L.col('#e9cd6a', 0.55); ctx.fill();
    ctx.strokeStyle = L.col('#b48f35', 0.3); ctx.lineWidth = lw(W, 0.005); ctx.stroke();
    ctx.save(); starPath(ctx, 0, 0, sR, sr, -Math.PI / 2, 5, jit); ctx.clip();
    ctx.fillStyle = linGrad(ctx, -sR, -sR, sR, sR, [[0, 'rgba(255,245,200,0.28)'], [0.5, 'rgba(255,245,200,0)'], [1, 'rgba(120,70,0,0.22)']]); ctx.fillRect(-sR, -sR, 2 * sR, 2 * sR);
    const sr2 = rng(33);
    for (let i = 0; i < 14; i++) { ctx.fillStyle = L.col(sr2() < 0.5 ? C.lunch : '#f6e8a8', sr2() < 0.5 ? 0.85 : 0.3); ctx.globalAlpha = 0.5 + sr2() * 0.4; ctx.beginPath(); ctx.arc((sr2() - 0.5) * 1.6 * sR, (sr2() - 0.5) * 1.6 * sR, sR * (0.02 + sr2() * 0.05), 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    // a peeled, lifted lower-left point
    ctx.fillStyle = 'rgba(255,255,230,0.45)'; ctx.beginPath(); ctx.moveTo(-sR * 0.55, sR * 0.78); ctx.lineTo(-sR * 0.2, sR * 0.5); ctx.lineTo(-sR * 0.62, sR * 0.5); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
    ctx.restore(); // clip
    rim(ctx, L, bodyPath, bodyBB, lw(W, 0.012), 1);
    // seam / rolled steel lip at the top of the body
    ctx.fillStyle = steelGrad(ctx, -HB - 0.006 * W, -HB + 0.022 * W, L);
    ctx.fillRect(-0.487 * W, -HB, 0.974 * W, 0.022 * W);
    ctx.restore();

    // ── tray interior + hinge (only visible once the lid lifts) ──
    if (v > 0.01) {
      ctx.save(); ctx.globalAlpha *= v;
      const tp = (c) => { c.beginPath(); c.moveTo(-0.472 * W, -HB); c.lineTo(0.472 * W, -HB); c.lineTo(0.455 * W, yh); c.lineTo(-0.455 * W, yh); c.closePath(); };
      tp(ctx); ctx.fillStyle = linGrad(ctx, 0, yh, 0, -HB, [[0, L.col('#6c757d', 0.1)], [1, L.col('#20262c', 0.1)]]); ctx.fill();
      ctx.fillStyle = steelGrad(ctx, yh - 0.004 * W, yh + 0.012 * W, L); ctx.fillRect(-0.455 * W, yh - 0.004 * W, 0.91 * W, 0.016 * W);
      for (const s of [-1, 1]) { ctx.fillStyle = L.col('#7d868e', 0.1); ctx.fillRect(s * 0.3 * W - 0.035 * W, yh - 0.012 * W, 0.07 * W, 0.03 * W); }
      ctx.restore();
    }

    // ── lid inside ──
    const hx = 0.475 * W, tx = lerp(0.475, 0.44, lift) * W;
    const quad = (c, ins, top) => { c.beginPath(); c.moveTo(-hx + ins * 0.3, yh); c.lineTo(hx - ins * 0.3, yh); c.lineTo(tx - ins, yt + top); c.lineTo(-tx + ins, yt + top); c.closePath(); };
    let slot = { x: -0.06 * W, y: yh - 0.5 * r, rot: -4 };
    if (v > 0.01 && r > 0.05 * W) {
      ctx.save(); ctx.globalAlpha *= v;
      const bb = { x: -tx, y: yt, w: 2 * tx, h: r };
      const outer = (c) => quad(c, 0, 0);
      outer(ctx); ctx.fillStyle = red; ctx.fill();
      const inset = 0.04 * W, top = 0.045 * W;
      const inner = (c) => quad(c, inset, top);
      inner(ctx); ctx.fillStyle = linGrad(ctx, 0, yt, 0, yh, [[0, L.col('#7d868d', 0.15)], [0.5, L.col('#a2abb2', 0.15)], [1, L.col('#8a939a', 0.15)]]); ctx.fill();
      ctx.save(); inner(ctx); ctx.clip();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = lw(W, 0.05); inner(ctx); ctx.stroke();
      ctx.fillStyle = linGrad(ctx, -tx, 0, tx, 0, [[0.1, 'rgba(255,255,255,0)'], [0.3, rgba('#f2f6fa', 0.16 * (0.3 + 0.7 * L.lum))], [0.38, 'rgba(255,255,255,0)']]); ctx.fillRect(-tx, yt, 2 * tx, r);
      // a stamped panel in the tin
      const pm = 0.1 * W; ctx.lineWidth = lw(W, 0.007, 0.6);
      const pan = (c, d) => { c.beginPath(); c.moveTo(-tx + pm + d, yt + top + pm * 0.8 + d); c.lineTo(tx - pm + d, yt + top + pm * 0.8 + d); c.lineTo(tx - pm * 1.2 + d, yh - pm * 0.6 + d); c.lineTo(-tx + pm * 1.2 + d, yh - pm * 0.6 + d); c.closePath(); };
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'; pan(ctx, 0); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.16)'; pan(ctx, lw(W, 0.007, 0.6)); ctx.stroke();
      const ir = rng(55);
      for (let i = 0; i < 9; i++) { ctx.fillStyle = L.col('#7a4a2a', 0.2); ctx.globalAlpha = (0.25 + ir() * 0.3) * v; ctx.beginPath(); ctx.arc((ir() - 0.5) * 0.8 * W, lerp(yt, yh, ir()), W * (0.004 + ir() * 0.008), 0, TAU); ctx.fill(); }
      ctx.globalAlpha = v;
      ctx.strokeStyle = L.col('#d4dae0', 0.1); ctx.globalAlpha = 0.3 * v; ctx.lineWidth = lw(W, 0.004, 0.4);
      for (let i = 0; i < 6; i++) { const x = (ir() - 0.5) * 0.7 * W, y = lerp(yt + 0.05 * W, yh - 0.02 * W, ir()); line(ctx, x, y, x + W * (0.03 + ir() * 0.07), y - W * 0.02 * ir()); }
      ctx.restore();
      form(ctx, L, outer, bb, 0.2, 0.12);
      rim(ctx, L, outer, bb, lw(W, 0.012), 1);
      // red frame chips
      ctx.save(); outer(ctx); ctx.clip(); chip(ctx, L, -tx + 0.01 * W, yt + 0.02 * W, 0.03 * W, 41); chip(ctx, L, tx - 0.005 * W, yt + 0.12 * W, 0.024 * W, 42); ctx.restore();
      ctx.restore();
      // where the note is tucked
      const ib = yh - 0.01 * W, it = yt + top;
      slot = { x: -0.05 * W, y: lerp(it, ib, 0.5) + 0.01 * W, rot: -4 };
    }

    // ── the note tucked behind the wire clip ──
    const dirA = (o.noteDir ?? -155) * D, slide = note * 0.56 * W;
    const nx = slot.x + Math.cos(dirA) * slide, ny = slot.y + Math.sin(dirA) * slide;
    if (v > 0.5 && note > 0) {
      ctx.save(); ctx.globalAlpha *= clamp((v - 0.5) * 2);
      ctx.translate(nx, ny); ctx.rotate((slot.rot - note * 6) * D);
      drawNote(ctx, L, noteW, 0, {});
      ctx.restore();
      // clip strap over the lower part of the paper (the paper slides out from under it)
      ctx.save(); ctx.globalAlpha *= clamp((v - 0.5) * 2);
      const sy = slot.y + 0.075 * W, sx0 = slot.x - 0.3 * W, sx1 = slot.x + 0.3 * W;
      ctx.fillStyle = steelGrad(ctx, sy - 0.02 * W, sy + 0.02 * W, L); ctx.fillRect(sx0, sy - 0.018 * W, sx1 - sx0, 0.036 * W);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(sx0, sy + 0.018 * W, sx1 - sx0, 0.008 * W);
      ctx.fillStyle = L.col('#9aa3ab', 0.1);
      for (const x of [sx0, sx1]) { ctx.beginPath(); ctx.arc(x, sy, W * 0.014, 0, TAU); ctx.fill(); }
      ctx.restore();
    }

    // ── the lid's front wall (the "face" of the lid) ──
    {
      ctx.save();
      ctx.translate(0, wallTop); ctx.scale(lerp(1, 0.93, lift), wallH / LH);
      const lidPath = (c) => domeBox(c, -0.5 * W, 0.5 * W, 0, LH, 0.1 * W, 0.1 * W, 0.012 * W, 0.012 * W);
      const bb = { x: -0.5 * W, y: 0, w: W, h: LH };
      lidPath(ctx);
      ctx.fillStyle = linGrad(ctx, 0, 0, 0, LH, [[0, redHi], [0.25, red], [1, L.col(mixHex(C.lunch, C.lunchDark, 0.35), kBody)]]);
      ctx.fill();
      form(ctx, L, lidPath, bb, 0.24, 0.16);
      ctx.save(); lidPath(ctx); ctx.clip();
      ctx.fillStyle = rgba('#ffd9cc', 0.2 * (0.25 + 0.75 * L.lum)); ctx.fillRect(-W, 0.012 * W, 2 * W, 0.012 * W);
      ctx.fillStyle = linGrad(ctx, -0.5 * W, 0, 0.5 * W, 0, [[0, 'rgba(60,8,4,0.28)'], [0.07, 'rgba(60,8,4,0)'], [0.93, 'rgba(60,8,4,0)'], [1, 'rgba(60,8,4,0.28)']]); ctx.fillRect(-W, 0, 2 * W, LH);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-W, LH - 0.022 * W, 2 * W, 0.03 * W);
      for (const c of [[-0.478, 0.012, 0.04, 11], [0.47, 0.012, 0.034, 12], [0.22, 0.0, 0.022, 13], [-0.3, 0.002, 0.02, 14], [0.495, 0.13, 0.03, 15], [-0.49, 0.19, 0.022, 16], [0.07, LH / W - 0.002, 0.018, 17]])
        chip(ctx, L, c[0] * W, c[1] * W, c[2] * W, c[3]);
      scratches(ctx, L, 31, 9, -0.46 * W, 0.02 * W, 0.46 * W, LH - 0.03 * W, W);
      dent(ctx, L, -0.27 * W, 0.115 * W, 0.06 * W, 0.034 * W, -8);
      ctx.restore();
      rim(ctx, L, lidPath, bb, lw(W, 0.012), 1);
      ctx.restore();
    }

    // ── the clasp ──
    if (Math.cos(phi) > 0.12 || v < 0.05) {
      ctx.save(); ctx.globalAlpha *= clamp((Math.cos(phi) - 0.12) * 5 + (v < 0.05 ? 1 : 0));
      const piv = wallBot - 0.15 * W;
      const cb = { x: -0.03 * W, y: -0.332 * W, w: 0.06 * W, h: 0.05 * W };
      ctx.fillStyle = L.col('#6f7880', 0.1); fillRRsafe(ctx, cb.x, cb.y, cb.w, cb.h, 0.012 * W);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; fillRRsafe(ctx, -0.018 * W, -0.322 * W, 0.036 * W, 0.022 * W, 0.006 * W);
      const len = 0.19 * W * (1 - 1.35 * clasp), x0 = -0.036 * W, ww = 0.072 * W;
      const y0 = Math.min(piv, piv + len), hh = Math.abs(len);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = W * 0.01; ctx.shadowOffsetY = W * 0.006;
      ctx.fillStyle = L.col('#a2aab1', 0.1); fillRRsafe(ctx, x0, y0, ww, hh, 0.014 * W); ctx.restore();
      const tb = { x: x0, y: y0, w: ww, h: Math.max(hh, 1) };
      form(ctx, L, (c) => rr(c, x0, y0, ww, hh, 0.014 * W), tb, 0.3, 0.1);
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x0 + ww * 0.12, y0 + hh * 0.05, ww * 0.18, hh * 0.9);
      ctx.fillStyle = L.col('#5d656c', 0.1); ctx.beginPath(); ctx.arc(0, piv, W * 0.012, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x0 + ww * 0.2, y0 + hh - 0.026 * W * (1 - clasp), ww * 0.6, 0.012 * W * (1 - clasp));
      ctx.fillStyle = L.col('#7b3a24', 0.4); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(ww * 0.25, y0 + hh * 0.7, W * 0.008, 0, TAU); ctx.fill(); ctx.restore();
    }

    // ── wire handle (on the lid top; hidden once the lid is up and it faces away) ──
    const hA = 1 - v;
    const ly = yh - 0.25 * W - 0.0;            // lid-top y in closed state
    if (hA > 0.02) {
      ctx.save(); ctx.globalAlpha *= hA;
      const top = -HB - LH, hxx = 0.3 * W, wl = lw(W, 0.022, 0.9);
      for (const s of [-1, 1]) {
        ctx.fillStyle = L.col('#8d969e', 0.1); fillRRsafe(ctx, s * hxx - 0.03 * W, top - 0.004 * W, 0.06 * W, 0.03 * W, 0.008 * W);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(s * hxx - 0.026 * W, top - 0.002 * W, 0.052 * W, 0.006 * W);
      }
      const wire = (c) => { c.beginPath(); c.moveTo(-hxx, top + 0.004 * W); c.bezierCurveTo(-hxx, top - 0.012 * W - apexH * 1.33, hxx, top - 0.012 * W - apexH * 1.33, hxx, top + 0.004 * W); };
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = wl * 1.8; ctx.save(); ctx.translate(0, wl * 0.5); wire(ctx); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = L.col('#9aa3ab', 0.1); ctx.lineWidth = wl; wire(ctx); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.38)'; ctx.lineWidth = wl * 0.3; ctx.save(); ctx.translate(0, -wl * 0.22); wire(ctx); ctx.stroke(); ctx.restore();
      ctx.restore();
    }
    void ly;

    const base = place(0, 0);
    return {
      handle: place(0, -HB - LH - apexH),
      clasp: place(0, wallBot - 0.04 * W),
      lidEdge: place(0, yt),
      noteSlot: { ...place(nx, ny), rot: (o.rot || 0) + (o.flip === -1 ? -slot.rot : slot.rot), size: noteW, squash: o.squash ?? 1 },
      top: place(0, Math.min(yt, -HB - LH) - (hA > 0.5 ? apexH : 0)),
      centre: place(0, -HB * 0.5),
      base,
    };
  });
}
function fillRRsafe(ctx, x, y, w, h, r) { if (h < 0.2 || w < 0.2) { ctx.fillRect(x, y, w, h); return; } rr(ctx, x, y, w, h, r); ctx.fill(); }

// ═════════════════════════════════════════════ THE NOTE ═════════════════════════════════════════════
const NOTE_LINES = [['Daddy,', "don't"], ['forget', 'me', 'when'], ["you're", 'busy.']];

function notePath(ctx, w, h, torn, dog) {
  // the sheet outline in flat coordinates (centred, x ±w/2, y ±h/2) with a torn corner (TR) and dog-ear (BR)
  const r = rng(7), j = () => (r() - 0.5) * 0.006 * w;
  const a = -w / 2, b = w / 2, c = -h / 2, d = h / 2;
  ctx.beginPath();
  ctx.moveTo(a + j(), c + j());
  const edge = (x0, y0, x1, y1, n) => { for (let i = 1; i <= n; i++) { const t = i / n; ctx.lineTo(lerp(x0, x1, t) + j(), lerp(y0, y1, t) + j()); } };
  edge(a, c, b - torn * 1.3, c, 8);
  // torn corner: a ragged diagonal bite
  const zig = rng(11);
  const tx0 = b - torn * 1.3, tx1 = b, ty0 = c, ty1 = c + torn;
  for (let i = 1; i < 7; i++) { const t = i / 7, q = (i % 2 ? -1 : 1) * (0.012 + zig() * 0.014) * w; ctx.lineTo(lerp(tx0, tx1, t) + q * 0.7, lerp(ty0, ty1, t) + q); }
  ctx.lineTo(b, ty1);
  edge(b, ty1, b, d - dog, 8);
  ctx.lineTo(b - dog, d);
  edge(b - dog, d, a, d, 8);
  edge(a, d, a, c, 8);
  ctx.closePath();
}

/** The note painted into the current transform. Origin = centre of the paper as currently folded. */
function drawNote(ctx, L, w, unfold, o = {}) {
  const h = 0.76 * w, hh = h / 2;
  const fy = ease.inOutSine(invlerp(0, 0.5, unfold)), fx = ease.inOutSine(invlerp(0.5, 1, unfold));
  const ky = -Math.cos(Math.PI * fy), kx = -Math.cos(Math.PI * fx);
  const xmin = -w / 2, xmax = Math.max(0, w / 2 * kx), ymin = Math.min(0, -hh * ky), ymax = hh;
  const cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2;
  const textA = sm(0.52, 0.92, unfold);
  const torn = 0.07 * w, dog = 0.075 * w;
  const paper = L.col(C.paper, 0.45), shade = L.col(C.paperShade, 0.4), grime = L.col('#8d8776', 0.2);
  const hand = o.hand !== false;

  // soft shadow of the current paper
  ctx.save(); ctx.translate(-cx, -cy);
  for (let i = 0; i < 4; i++) { const g = (4 - i) * 0.007 * w; ctx.fillStyle = `rgba(0,0,0,${0.05 * clamp(0.3 + L.lum)})`; ctx.fillRect(xmin - g + 0.004 * w, ymin - g + 0.012 * w, xmax - xmin + 2 * g, ymax - ymin + 2 * g); }
  ctx.restore();

  const panels = [
    { rect: [-w / 2, 0, w / 2, hh], kx: 1, ky: 1 },        // BL: fixed
    { rect: [-w / 2, -hh, w / 2, hh], kx: 1, ky, top: true },   // TL
    { rect: [0, -hh, w / 2, hh], kx, ky },                  // TR
    { rect: [0, 0, w / 2, hh], kx, ky: 1 },                 // BR
  ];
  // flat rect extents: [x0, y0, width, height]
  const R = [[-w / 2, 0, w / 2, hh], [-w / 2, -hh, w / 2, hh], [0, -hh, w / 2, hh], [0, 0, w / 2, hh]];
  const K = [[1, 1], [1, ky], [kx, ky], [kx, 1]];
  void panels;
  for (let p = 0; p < 4; p++) {
    const [px, py, pw, ph] = R[p], [sx, sy] = K[p];
    if (Math.abs(sx) < 0.003 || Math.abs(sy) < 0.003) continue;
    const inner = sx * sy > 0;
    ctx.save();
    ctx.translate(-cx, -cy);
    ctx.scale(sx, sy);
    notePath(ctx, w, h, torn, dog); ctx.clip();
    ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    const bb = { x: px, y: py, w: pw, h: ph };
    const fold = Math.min(Math.abs(sx), Math.abs(sy));
    // paper
    ctx.fillStyle = inner ? linGrad(ctx, -w / 2, -hh, w / 2, hh, [[0, paper], [0.55, L.col(mixHex(C.paper, '#fff6e4', 0.4), 0.45)], [1, L.col(mixHex(C.paper, C.paperShade, 0.6), 0.45)]]) : shade;
    ctx.fillRect(px - 2, py - 2, pw + 4, ph + 4);
    // grimy worn edges
    ctx.save(); ctx.strokeStyle = grime;
    notePath(ctx, w, h, torn, dog);
    for (const [lwd, al] of [[0.07, 0.05], [0.04, 0.07], [0.018, 0.1]]) { ctx.globalAlpha = al * (inner ? 1 : 1.9); ctx.lineWidth = lwd * w; ctx.stroke(); }
    ctx.restore();
    // wear: handled and greyed at the folds
    if (!inner) { ctx.fillStyle = 'rgba(80,70,55,0.09)'; ctx.fillRect(px, py, pw, ph); }
    const wr = rng(90 + p);
    ctx.save(); ctx.strokeStyle = grime; ctx.lineWidth = lw(w, 0.0025, 0.4);
    for (let i = 0; i < (inner ? 6 : 10); i++) { ctx.globalAlpha = 0.1 + wr() * 0.1; const x = px + wr() * pw, y = py + wr() * ph, a = wr() * Math.PI; line(ctx, x, y, x + Math.cos(a) * w * 0.06, y + Math.sin(a) * w * 0.06); }
    ctx.restore();
    // the cross crease
    for (const vert of [true, false]) {
      ctx.save();
      if (vert) { ctx.fillStyle = linGrad(ctx, -0.03 * w, 0, 0.03 * w, 0, [[0, 'rgba(70,55,35,0)'], [0.5, 'rgba(70,55,35,0.13)'], [1, 'rgba(70,55,35,0)']]); ctx.fillRect(-0.03 * w, -hh, 0.06 * w, h); ctx.fillStyle = 'rgba(255,250,235,0.5)'; ctx.fillRect(0.002 * w, -hh, lw(w, 0.003, 0.5), h); ctx.fillStyle = 'rgba(60,45,30,0.28)'; ctx.fillRect(-0.002 * w, -hh, lw(w, 0.003, 0.5), h); }
      else { ctx.fillStyle = linGrad(ctx, 0, -0.03 * w, 0, 0.03 * w, [[0, 'rgba(70,55,35,0)'], [0.5, 'rgba(70,55,35,0.13)'], [1, 'rgba(70,55,35,0)']]); ctx.fillRect(-w / 2, -0.03 * w, w, 0.06 * w); ctx.fillStyle = 'rgba(255,250,235,0.5)'; ctx.fillRect(-w / 2, 0.002 * w, w, lw(w, 0.003, 0.5)); ctx.fillStyle = 'rgba(60,45,30,0.28)'; ctx.fillRect(-w / 2, -0.002 * w, w, lw(w, 0.003, 0.5)); }
      ctx.restore();
    }
    if (inner) {
      // a faint lunch stain and a pencil smudge
      ctx.save();
      const sx0 = -0.3 * w, sy0 = 0.27 * w;
      ctx.fillStyle = radGrad(ctx, sx0, sy0, 0, 0.1 * w, [[0, 'rgba(150,100,50,0.10)'], [0.7, 'rgba(150,100,50,0.07)'], [0.86, 'rgba(120,80,40,0.17)'], [1, 'rgba(120,80,40,0)']]);
      ctx.beginPath(); ctx.ellipse(sx0, sy0, 0.1 * w, 0.085 * w, 0.4, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(120,90,50,0.09)'; ctx.beginPath(); ctx.ellipse(0.31 * w, -0.2 * w, 0.03 * w, 0.02 * w, 0.2, 0, TAU); ctx.fill();
      ctx.restore();
      // handwriting
      if (hand && textA > 0.01) { ctx.save(); ctx.globalAlpha *= textA; writing(ctx, L, w); ctx.restore(); }
    }
    // dog-ear flap (BR corner of the sheet, folded over, showing the back)
    if (p === 3 || p === 0) { /* handled once below via panel 3 coverage */ }
    if (p === 3 && inner) {
      ctx.fillStyle = shade; ctx.beginPath(); ctx.moveTo(w / 2 - dog, hh); ctx.lineTo(w / 2, hh - dog); ctx.lineTo(w / 2 - dog, hh - dog); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(60,45,30,0.3)'; ctx.lineWidth = lw(w, 0.003, 0.5); line(ctx, w / 2 - dog, hh, w / 2, hh - dog);
    }
    // torn edge fibres
    if (p === 2 || p === 1) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,250,238,0.75)'; ctx.lineWidth = lw(w, 0.005, 0.6);
      notePath(ctx, w, h, torn, dog); ctx.save(); ctx.beginPath(); ctx.rect(w / 2 - torn * 1.5, -hh - 2, torn * 1.6, torn * 1.3); ctx.clip(); notePath(ctx, w, h, torn, dog); ctx.stroke(); ctx.restore(); ctx.restore();
    }
    form(ctx, L, (c) => { c.beginPath(); c.rect(px, py, pw, ph); }, bb, 0.14, 0.1);
    // flaps in motion are shaded by their angle
    if (fold < 0.999) { ctx.fillStyle = `rgba(30,20,10,${0.38 * (1 - fold)})`; ctx.fillRect(px - 2, py - 2, pw + 4, ph + 4); }
    ctx.restore();
  }
  return { w: xmax - xmin, h: ymax - ymin, tl: { x: xmin - cx, y: ymin - cy }, tr: { x: xmax - cx, y: ymin - cy }, bl: { x: xmin - cx, y: ymax - cy }, br: { x: xmax - cx, y: ymax - cy }, ox: -cx, oy: -cy };
}

/** child's pencil handwriting in flat sheet coordinates (centre 0,0; w wide). */
function writing(ctx, L, w) {
  const pen = L.col(C.pencil, 0), size = 0.098 * w, r = rng(404);
  const baseY = [-0.175 * w, -0.035 * w, 0.105 * w];
  ctx.save();
  ctx.lineJoin = 'round';
  NOTE_LINES.forEach((words, li) => {
    let x = -0.385 * w + (li === 1 ? 0.012 * w : li === 2 ? -0.005 * w : 0);
    let y = baseY[li] + (r() - 0.5) * 0.01 * w;
    words.forEach((wd, wi) => {
      const s = size * (wd.startsWith('D') ? 1.12 : 0.93 + r() * 0.13), rot = (r() - 0.5) * 0.06 + 0.012 * li;
      const wy = y + (r() - 0.5) * 0.012 * w + wi * 0.003 * w;
      ctx.save(); ctx.translate(x, wy); ctx.rotate(rot);
      const wdth = text(ctx, wd, 0, 0, { size: s, family: FONT.hand, weight: 400, color: pen, alpha: 0.92 });
      text(ctx, wd, 0.0022 * w, 0.0016 * w, { size: s, family: FONT.hand, weight: 400, color: pen, alpha: 0.35 });   // pencil pressure, a second pass
      ctx.restore();
      x += wdth + size * (0.3 + r() * 0.12);
    });
  });
  // a small lopsided heart
  ctx.strokeStyle = pen; ctx.lineCap = 'round'; ctx.lineWidth = lw(w, 0.0075, 0.8); ctx.globalAlpha *= 0.9;
  const hx = 0.29 * w, hy = 0.262 * w, hs = 0.062 * w;
  for (let pass = 0; pass < 2; pass++) {
    ctx.save(); ctx.translate(pass * 0.003 * w, pass * 0.002 * w); ctx.globalAlpha *= pass ? 0.4 : 1;
    ctx.beginPath(); ctx.moveTo(hx + 0.01 * hs, hy + hs * 0.95);
    ctx.bezierCurveTo(hx - hs * 0.9, hy + hs * 0.25, hx - hs * 1.15, hy - hs * 0.75, hx - hs * 0.45, hy - hs * 0.78);
    ctx.bezierCurveTo(hx - hs * 0.1, hy - hs * 0.8, hx + hs * 0.0, hy - hs * 0.5, hx + hs * 0.05, hy - hs * 0.35);
    ctx.bezierCurveTo(hx + hs * 0.25, hy - hs * 0.95, hx + hs * 1.05, hy - hs * 0.95, hx + hs * 1.05, hy - hs * 0.3);
    ctx.bezierCurveTo(hx + hs * 1.0, hy + hs * 0.25, hx + hs * 0.4, hy + hs * 0.6, hx + hs * 0.05, hy + hs * 0.97);
    ctx.stroke(); ctx.restore();
  }
  // two stick figures holding hands, one big, one small
  const fx = -0.04 * w, fy = 0.345 * w;
  const stick = (x, y, H, lean) => {
    const hr = H * 0.15;
    ctx.beginPath(); ctx.ellipse(x, y - H + hr, hr, hr * 1.05, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - H + hr * 2); ctx.lineTo(x + lean, y - H * 0.4); ctx.stroke();            // body
    ctx.beginPath(); ctx.moveTo(x + lean, y - H * 0.4); ctx.lineTo(x - H * 0.14, y); ctx.moveTo(x + lean, y - H * 0.4); ctx.lineTo(x + H * 0.16, y); ctx.stroke();  // legs
  };
  ctx.lineWidth = lw(w, 0.0075, 0.8);
  const bigH = 0.205 * w, smH = 0.125 * w, bx = fx, sx2 = fx + 0.13 * w;
  for (let pass = 0; pass < 2; pass++) {
    ctx.save(); ctx.translate(pass * 0.003 * w, pass * 0.002 * w); ctx.globalAlpha *= pass ? 0.4 : 1;
    stick(bx, fy, bigH, 0.004 * w); stick(sx2, fy, smH, -0.003 * w);
    ctx.beginPath(); ctx.moveTo(bx, fy - bigH * 0.62); ctx.lineTo(bx + 0.06 * w, fy - bigH * 0.38); ctx.lineTo(bx + 0.095 * w, fy - smH * 0.55);   // big arm reaching down to small hand
    ctx.moveTo(sx2, fy - smH * 0.62); ctx.lineTo(sx2 - 0.03 * w, fy - smH * 0.56); ctx.lineTo(bx + 0.095 * w, fy - smH * 0.55);
    ctx.moveTo(bx, fy - bigH * 0.62); ctx.lineTo(bx - 0.05 * w, fy - bigH * 0.42);
    ctx.moveTo(sx2, fy - smH * 0.62); ctx.lineTo(sx2 + 0.04 * w, fy - smH * 0.42);
    ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}

export function note(ctx, o = {}) {
  const w = o.size ?? 100, u = clamp(o.unfold ?? 1);
  return run(ctx, o, (L, P) => {
    const a = drawNote(ctx, L, w, u, {});
    return {
      centre: P(0, 0), w: a.w, h: a.h,
      tl: P(a.tl.x, a.tl.y), tr: P(a.tr.x, a.tr.y), bl: P(a.bl.x, a.bl.y), br: P(a.br.x, a.br.y),
    };
  });
}

// ═════════════════════════════════════════════ SUPPORTING PROPS ═════════════════════════════════════════════

/** waxy crayon stroke: a few jittered passes along a polyline. */
function wax(ctx, pts, col, wd, seed, passes = 3) {
  const r = rng(seed);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col;
  for (let p = 0; p < passes; p++) {
    ctx.globalAlpha = 0.5 + r() * 0.25; ctx.lineWidth = wd * (0.7 + r() * 0.5);
    ctx.beginPath();
    pts.forEach(([x, y], i) => { const jx = (r() - 0.5) * wd * 0.6, jy = (r() - 0.5) * wd * 0.6; if (i) ctx.lineTo(x + jx, y + jy); else ctx.moveTo(x + jx, y + jy); });
    ctx.stroke();
  }
  ctx.restore();
}
function waxFill(ctx, x0, y0, x1, y1, col, wd, seed, clipFn) {
  ctx.save(); if (clipFn) { clipFn(ctx); ctx.clip(); }
  const r = rng(seed); ctx.strokeStyle = col; ctx.lineCap = 'round';
  const n = Math.max(3, Math.round((y1 - y0) / (wd * 0.8)));
  for (let i = 0; i <= n; i++) { const y = lerp(y0, y1, i / n); ctx.globalAlpha = 0.45 + r() * 0.3; ctx.lineWidth = wd * (0.8 + r() * 0.4); ctx.beginPath(); ctx.moveTo(x0 - wd + r() * wd, y); ctx.lineTo(x1 + wd - r() * wd, y + (r() - 0.5) * wd * 0.5); ctx.stroke(); }
  ctx.restore();
}
function waxCircle(ctx, cx, cy, rad_, col, wd, seed) {
  const pts = [], r = rng(seed);
  for (let i = 0; i <= 26; i++) { const a = i / 26 * TAU * 1.06; pts.push([cx + Math.cos(a) * rad_ * (1 + (r() - 0.5) * 0.08), cy + Math.sin(a) * rad_ * (1 + (r() - 0.5) * 0.08)]); }
  wax(ctx, pts, col, wd, seed + 1);
}

export function crayonFamily(ctx, o = {}) {
  const w = o.size ?? 200, h = 0.72 * w;
  return run(ctx, o, (L, P) => {
    const paper = o.paper !== false;
    if (paper) {
      const pp = (c) => { c.beginPath(); c.rect(-w / 2, -h / 2, w, h); };
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = w * 0.02; ctx.shadowOffsetY = w * 0.008; ctx.fillStyle = L.col('#f1ead8', 0.05); pp(ctx); ctx.fill(); ctx.restore();
      ctx.fillStyle = linGrad(ctx, -w / 2, -h / 2, w / 2, h / 2, [[0, L.col('#f5eedd', 0.05)], [1, L.col('#e6ddc6', 0.05)]]); pp(ctx); ctx.fill();
      ctx.strokeStyle = 'rgba(60,45,30,0.12)'; ctx.lineWidth = lw(w, 0.002, 0.4); line(ctx, -w / 2, 0, w / 2, 0); line(ctx, 0, -h / 2, 0, h / 2);
      // tape corner marks
      ctx.fillStyle = 'rgba(230,215,170,0.5)'; ctx.save(); ctx.translate(-w / 2 + w * 0.02, -h / 2 + w * 0.02); ctx.rotate(-0.7); ctx.fillRect(-w * 0.04, -w * 0.012, w * 0.08, w * 0.024); ctx.restore();
    }
    ctx.save(); ctx.translate(0, 0);
    const ink = (hex) => L.col(hex, 0.25);
    const u = w / 100, wd = Math.max(0.8, 1.6 * u);
    const gx = -50 * u, gy = 20 * u;
    // ground
    wax(ctx, [[-46, 20], [-30, 18.5], [-10, 20.5], [10, 19], [30, 20], [46, 18.8]].map(([x, y]) => [x * u, y * u]), ink('#5d9a4e'), wd * 1.4, 3);
    waxFill(ctx, -46 * u, 22 * u, 46 * u, 30 * u, ink('#7fb35f'), wd * 1.6, 4);
    // sun
    waxCircle(ctx, -34 * u, -21 * u, 6.5 * u, ink('#f0c63a'), wd, 5);
    waxFill(ctx, -41 * u, -27 * u, -27 * u, -15 * u, ink('#f6d24f'), wd * 1.3, 6, (c) => { c.beginPath(); c.arc(-34 * u, -21 * u, 5.8 * u, 0, TAU); });
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.2; wax(ctx, [[-34 * u + Math.cos(a) * 9 * u, -21 * u + Math.sin(a) * 9 * u], [-34 * u + Math.cos(a) * 12.5 * u, -21 * u + Math.sin(a) * 12.5 * u]], ink('#f0c63a'), wd, 10 + i, 2); }
    // house
    const hx = 33 * u, hy = 20 * u;
    wax(ctx, [[hx - 12 * u, hy], [hx - 12 * u, hy - 20 * u], [hx + 12 * u, hy - 20 * u], [hx + 12 * u, hy], [hx - 12 * u, hy]], ink('#b9895a'), wd * 1.1, 20);
    waxFill(ctx, hx - 11 * u, hy - 19 * u, hx + 11 * u, hy - 1 * u, ink('#d9b98a'), wd * 1.3, 21);
    wax(ctx, [[hx - 15 * u, hy - 20 * u], [hx, hy - 34 * u], [hx + 15 * u, hy - 20 * u], [hx - 15 * u, hy - 20 * u]], ink('#7a5a8a'), wd * 1.2, 22);
    waxFill(ctx, hx - 15 * u, hy - 33 * u, hx + 15 * u, hy - 21 * u, ink('#9a7aa8'), wd * 1.3, 23, (c) => { c.beginPath(); c.moveTo(hx - 13.5 * u, hy - 20.8 * u); c.lineTo(hx, hy - 32 * u); c.lineTo(hx + 13.5 * u, hy - 20.8 * u); c.closePath(); });
    wax(ctx, [[hx - 3 * u, hy], [hx - 3 * u, hy - 9 * u], [hx + 3 * u, hy - 9 * u], [hx + 3 * u, hy]], ink('#6b4a2e'), wd, 24, 2);
    wax(ctx, [[hx + 5 * u, hy - 16 * u], [hx + 10 * u, hy - 16 * u], [hx + 10 * u, hy - 11 * u], [hx + 5 * u, hy - 11 * u], [hx + 5 * u, hy - 16 * u]], ink('#4f86b8'), wd, 25, 2);
    // chimney smoke
    wax(ctx, [[hx + 8 * u, hy - 33 * u], [hx + 11 * u, hy - 38 * u], [hx + 7 * u, hy - 42 * u], [hx + 11 * u, hy - 46 * u]], ink('#9aa4b0'), wd, 26, 2);
    // three figures holding hands: tall, small, tall
    const fig = (x, H, body, seed, dress) => {
      const hr = H * 0.14, hy0 = gy - H;
      waxCircle(ctx, x, hy0 + hr, hr, ink('#7a4a2a'), wd, seed);
      waxFill(ctx, x - hr * 0.8, hy0 + hr * 0.2, x + hr * 0.8, hy0 + hr * 1.8, ink('#e7b78c'), wd * 1.1, seed + 2, (c) => { c.beginPath(); c.arc(x, hy0 + hr, hr * 0.85, 0, TAU); });
      // hair scribble
      wax(ctx, [[x - hr, hy0 + hr * 0.7], [x - hr * 0.5, hy0 - hr * 0.05], [x + hr * 0.4, hy0 - hr * 0.05], [x + hr, hy0 + hr * 0.6]], ink('#4a3326'), wd * 1.2, seed + 3, 2);
      const topY = hy0 + hr * 2, midY = gy - H * 0.38;
      if (dress) { wax(ctx, [[x, topY], [x - H * 0.2, midY + H * 0.1], [x + H * 0.2, midY + H * 0.1], [x, topY]], ink(body), wd * 1.2, seed + 4); waxFill(ctx, x - H * 0.2, topY, x + H * 0.2, midY + H * 0.1, ink(body), wd * 1.3, seed + 5, (c) => { c.beginPath(); c.moveTo(x, topY); c.lineTo(x - H * 0.19, midY + H * 0.1); c.lineTo(x + H * 0.19, midY + H * 0.1); c.closePath(); }); }
      else { wax(ctx, [[x, topY], [x, midY]], ink(body), wd * 2.4, seed + 4, 3); }
      wax(ctx, [[x, midY + (dress ? H * 0.1 : 0)], [x - H * 0.07, gy]], ink('#4a3326'), wd * 1.1, seed + 6, 2);
      wax(ctx, [[x, midY + (dress ? H * 0.1 : 0)], [x + H * 0.07, gy]], ink('#4a3326'), wd * 1.1, seed + 7, 2);
      return { sh: { x, y: topY + H * 0.08 } };
    };
    const A = fig(-24 * u, 36 * u, '#3f6fb0', 100, false), B = fig(-9 * u, 24 * u, '#e0a23a', 120, true), Cc = fig(6 * u, 34 * u, '#6aa07a', 140, true);
    const hy1 = gy - 15 * u;
    const arms = (xa, Ha, xb, Hb, seed) => { const sa = { x: xa, y: gy - Ha * 0.62 }, sb = { x: xb, y: gy - Hb * 0.62 }, mx = (xa + xb) / 2; wax(ctx, [[sa.x, sa.y], [lerp(sa.x, mx, 0.7), hy1 - 2 * u], [mx, hy1], [lerp(sb.x, mx, 0.7), hy1 - 2 * u], [sb.x, sb.y]], ink('#e7b78c'), wd * 1.5, seed, 2); };
    arms(-24 * u, 36 * u, -9 * u, 24 * u, 150); arms(-9 * u, 24 * u, 6 * u, 34 * u, 151);
    wax(ctx, [[6 * u, gy - 34 * u * 0.62], [10 * u, gy - 22 * u]], ink('#e7b78c'), wd * 1.4, 152, 2); wax(ctx, [[-24 * u, gy - 36 * u * 0.62], [-28 * u, gy - 22 * u]], ink('#e7b78c'), wd * 1.4, 153, 2);
    void A; void B; void Cc;
    if (o.lunchbox) { const bx = -26 * u - 6 * u, by = gy - 40 * u * 0.45; ctx.fillStyle = L.col(C.lunch, 0.85); ctx.fillRect(bx - 3 * u, by, 6 * u, 4 * u); }
    ctx.restore();
    return { centre: P(0, 0), w, h };
  });
}

// ── phones and tablets ──
function screenSlab(ctx, L, o, dims) {
  const { len, thick, faceW, top, bot, col, body, glowCol, bloom, rimW } = dims;
  const face = o.face ?? 1;
  ctx.save(); if (face < 0) ctx.scale(-1, 1);
  const sx0 = thick / 2, sx1 = thick / 2 + faceW;
  const bodyPath = (c) => { rr(c, -thick / 2, top, thick + faceW, bot - top, Math.min(len * 0.05, thick * 0.9 + faceW * 0.2)); };
  const bb = { x: -thick / 2, y: top, w: thick + faceW, h: bot - top };
  solid(ctx, L, bodyPath, bb, body, 0, { dark: 0.3, rimK: 0.9 });
  // the screen face
  if (faceW > 0.4) {
    const m = Math.min(len * 0.03, faceW * 0.1);
    const sp = (c) => rr(c, sx0 + m * 0.3, top + m * 1.5, faceW - m * 1.3, bot - top - m * 3, Math.min(len * 0.02, faceW * 0.12));
    if (glowCol) {
      sp(ctx); ctx.fillStyle = linGrad(ctx, sx0, top, sx1, bot, [[0, rgba(mixHex(glowCol, '#7a8da0', o.dimScreen ?? 0.12), 0.95)], [1, rgba(mixHex(glowCol, '#ffffff', 0.2), 0.95)]]); ctx.fill();
      ctx.save(); sp(ctx); ctx.clip(); ctx.fillStyle = 'rgba(30,60,90,0.16)'; for (let i = 0; i < 5; i++) ctx.fillRect(sx0 + faceW * 0.12, top + (bot - top) * (0.14 + i * 0.16), faceW * (0.75 - (i % 3) * 0.2), (bot - top) * 0.045); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(sx0, top, faceW, (bot - top) * 0.08); ctx.restore();
    } else {
      sp(ctx); ctx.fillStyle = L.col('#0a0d14', 0); ctx.fill();
      ctx.save(); sp(ctx); ctx.clip(); ctx.fillStyle = 'rgba(160,190,230,0.06)'; ctx.beginPath(); ctx.moveTo(sx0, top); ctx.lineTo(sx1, top); ctx.lineTo(sx0, top + (bot - top) * 0.5); ctx.fill(); ctx.restore();
    }
  } else if (glowCol) {
    ctx.fillStyle = rgba(glowCol, 0.9); ctx.fillRect(thick / 2 - 0.5, top + len * 0.04, 1, bot - top - len * 0.08);
  }
  ctx.restore();
  if (glowCol && bloom > 0) {
    const gx = (face < 0 ? -1 : 1) * (thick / 2 + faceW / 2 + len * 0.1), gy = (top + bot) / 2;
    glow(ctx, gx, gy, len * (0.8 + 0.8 * bloom), glowCol, 0.5 * bloom, 0.9);
    glow(ctx, gx, gy, len * 0.3, mixHex(glowCol, '#ffffff', 0.5), 0.35 * bloom);
  }
}
export function phoneSmall(ctx, o = {}) {
  const S = o.size ?? 40, glowCol = o.glow || null;
  const turn = clamp(o.turn ?? 0.16), face = o.face ?? 1;
  return run(ctx, o, (L, P) => {
    const thick = Math.max(1.2, S * 0.06), faceW = S * 0.5 * turn, top = -0.7 * S, bot = 0.3 * S;
    screenSlab(ctx, L, o, { len: S, thick, faceW, top, bot, body: '#161b26', glowCol, bloom: glowCol ? clamp(o.bloom ?? 1) : 0 });
    const sx = face * (thick / 2 + faceW / 2);
    return { screen: P(sx, -0.2 * S), top: P(0, top), bottom: P(0, bot), grip: P(0, 0) };
  });
}
export function tablet(ctx, o = {}) {
  const S = o.size ?? 60, glowCol = o.glow === undefined ? C.ice : o.glow;
  const turn = clamp(o.turn ?? 0.2);
  return run(ctx, o, (L, P) => {
    const thick = Math.max(1.4, S * 0.032), faceW = S * 0.72 * turn, top = -S / 2, bot = S / 2, face = o.face ?? 1;
    screenSlab(ctx, L, o, { len: S, thick, faceW, top, bot, body: '#c5ced9', glowCol, bloom: glowCol ? clamp(o.bloom ?? 1) : 0 });
    return { screen: P(face * (thick / 2 + faceW / 2), 0), top: P(0, top), bottom: P(0, bot) };
  });
}

export function envelope(ctx, o = {}) {
  const w = o.size ?? 120, h = 0.5 * w, st = clamp(o.stamp ?? 1);
  return run(ctx, o, (L, P) => {
    const path = (c) => rr(c, -w / 2, -h / 2, w, h, w * 0.01);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = w * 0.025; ctx.shadowOffsetY = w * 0.01; ctx.fillStyle = L.col('#dfe2e4', 0.05); path(ctx); ctx.fill(); ctx.restore();
    solid(ctx, L, path, { x: -w / 2, y: -h / 2, w, h }, '#e3e5e4', 0.05, { dark: 0.16, lightK: 0.1, rimW: lw(w, 0.006, 0.5) });
    ctx.save(); path(ctx); ctx.clip();
    // back flap hint (V of the seam seen through the front edge) and fold shading
    ctx.strokeStyle = 'rgba(70,70,60,0.13)'; ctx.lineWidth = lw(w, 0.003, 0.5); ctx.beginPath(); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(-w * 0.1, h * 0.02); ctx.moveTo(w / 2, h / 2); ctx.lineTo(w * 0.1, h * 0.02); ctx.stroke();
    // window
    const wx = -w * 0.43, wy = -h * 0.3, ww = w * 0.46, wh = h * 0.36;
    ctx.fillStyle = L.col('#b9c4c9', 0.05); ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = 'rgba(60,70,70,0.35)'; ctx.lineWidth = lw(w, 0.004, 0.5); ctx.strokeRect(wx, wy, ww, wh);
    ctx.fillStyle = L.col('#4c5560', 0.05);
    for (let i = 0; i < 3; i++) ctx.fillRect(wx + ww * 0.08, wy + wh * (0.2 + i * 0.26), ww * (0.62 - i * 0.12), Math.max(0.8, wh * 0.1));
    // sender line + postage
    ctx.fillStyle = L.col('#8a929b', 0.05); ctx.fillRect(-w * 0.43, -h * 0.43, w * 0.18, Math.max(0.8, h * 0.05));
    ctx.fillStyle = L.col('#c8c0a8', 0.05); ctx.fillRect(w * 0.33, -h * 0.42, w * 0.12, h * 0.2); ctx.strokeStyle = 'rgba(80,70,50,0.4)'; ctx.lineWidth = lw(w, 0.003, 0.4); ctx.strokeRect(w * 0.33, -h * 0.42, w * 0.12, h * 0.2);
    // red rule + barcode
    ctx.fillStyle = L.col('#59616a', 0.05); for (let i = 0; i < 26; i++) ctx.fillRect(-w * 0.43 + i * w * 0.011, h * 0.34, Math.max(0.5, w * (i % 3 ? 0.004 : 0.007)), h * 0.09);
    // the stamp
    if (st > 0.01) {
      ctx.save(); ctx.translate(w * 0.17, h * 0.1); ctx.rotate(-7 * D); ctx.globalAlpha *= st;
      const sw = w * 0.5, sh = h * 0.3, col = L.col('#9a4638', 0.3);
      ctx.strokeStyle = col; ctx.lineWidth = lw(w, 0.012, 0.9); ctx.globalAlpha *= 0.88; ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);
      ctx.lineWidth = lw(w, 0.004, 0.5); ctx.strokeRect(-sw / 2 + sw * 0.03, -sh / 2 + sh * 0.08, sw * 0.94, sh * 0.84);
      text(ctx, 'OVERDUE', 0, sh * 0.2, { size: sh * 0.66, family: FONT.sans, weight: 800, color: col, align: 'center', tracking: sw * 0.012 });
      // the stamp is never evenly inked
      const sr = rng(7); ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 26; i++) { ctx.globalAlpha = 0.5 * st; ctx.beginPath(); ctx.arc((sr() - 0.5) * sw, (sr() - 0.5) * sh, w * (0.002 + sr() * 0.005), 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
    return { centre: P(0, 0), stamp: P(w * 0.17, h * 0.1), w, h };
  });
}

export function toast(ctx, o = {}) {
  const w = o.size ?? 60, h = 1.04 * w, b = clamp(o.burnt ?? 0), turn = clamp(o.turn ?? 0);
  return run(ctx, o, (L, P) => {
    ctx.save(); ctx.scale(1 - 0.9 * turn, 1);
    const path = (c) => {
      c.beginPath(); c.moveTo(-0.4 * w, 0);
      c.lineTo(-0.42 * w, -0.52 * w);
      c.bezierCurveTo(-0.6 * w, -0.56 * w, -0.64 * w, -0.98 * w, -0.34 * w, -0.98 * w);
      c.bezierCurveTo(-0.2 * w, -1.06 * w, 0.2 * w, -1.06 * w, 0.34 * w, -0.98 * w);
      c.bezierCurveTo(0.64 * w, -0.98 * w, 0.6 * w, -0.56 * w, 0.42 * w, -0.52 * w);
      c.lineTo(0.4 * w, 0); c.closePath();
    };
    const bb = { x: -0.6 * w, y: -h, w: 1.2 * w, h };
    const crust = mixHex('#a2602b', '#120d0a', b), crumb = mixHex('#e9b863', '#1a1410', b), mid = mixHex('#f0c97d', '#26201a', b);
    path(ctx); ctx.fillStyle = L.col(crust, 0.2); ctx.fill();
    // crumb
    ctx.save(); ctx.translate(0, -0.5 * w); ctx.scale(0.88, 0.9); ctx.translate(0, 0.5 * w); path(ctx); ctx.restore();
    ctx.save(); path(ctx); ctx.clip(); ctx.translate(0, -h * 0.5); ctx.scale(0.88, 0.9); ctx.translate(0, h * 0.5);
    path(ctx); ctx.fillStyle = radGrad(ctx, 0, -0.5 * w, 0, 0.6 * w, [[0, L.col(mid, 0.2)], [1, L.col(crumb, 0.2)]]); ctx.fill();
    const tr = rng(3); ctx.fillStyle = mixHex('#7a4a1f', '#050403', b); ctx.globalAlpha = 0.18 + 0.3 * b;
    for (let i = 0; i < 28; i++) { ctx.beginPath(); ctx.arc((tr() - 0.5) * w * 0.8, -tr() * h * 0.9, w * (0.008 + tr() * 0.02), 0, TAU); ctx.fill(); }
    ctx.restore();
    form(ctx, L, path, bb, 0.22, 0.14); rim(ctx, L, path, bb, lw(w, 0.014, 0.6), 0.9);
    ctx.restore();
    return { centre: P(0, -h * 0.5), top: P(0, -h) };
  });
}

export function trophy(ctx, o = {}) {
  const H = o.size ?? 100, sp = clamp(o.sparkle ?? 0), t = o.t ?? 0;
  return run(ctx, o, (L, P) => {
    contactShadow(ctx, o, H * 0.5);
    const baseW = H * 0.46;
    const blk = [[0, 0.1, baseW, '#3b2f27'], [0.1, 0.16, baseW * 0.78, '#4a3b30']];
    for (const [a, b, ww, col] of blk) {
      const path = (c) => rr(c, -ww / 2, -b * H, ww, (b - a) * H, H * 0.012);
      solid(ctx, L, path, { x: -ww / 2, y: -b * H, w: ww, h: (b - a) * H }, col, 0.1, { dark: 0.35, lightK: 0.1 });
    }
    ctx.fillStyle = L.col('#d3a93a', 0.5); fillRRsafe(ctx, -baseW * 0.2, -0.145 * H, baseW * 0.4, H * 0.03, H * 0.006);
    const stem = (c) => { c.beginPath(); c.moveTo(-H * 0.035, -0.16 * H); c.lineTo(H * 0.035, -0.16 * H); c.lineTo(H * 0.02, -0.3 * H); c.lineTo(-H * 0.02, -0.3 * H); c.closePath(); };
    solid(ctx, L, stem, { x: -H * 0.035, y: -0.3 * H, w: H * 0.07, h: 0.14 * H }, C.gold, 0.5);
    const cy = -0.6 * H, R = 0.3 * H, rI = 0.13 * H;
    const star = (c) => starPath(c, 0, cy, R, rI);
    star(ctx); ctx.fillStyle = L.col(C.gold, 0.55); ctx.fill();
    ctx.save(); star(ctx); ctx.clip();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, a2 = a + Math.PI / 5, rr1 = i % 2 ? rI : R, rr2 = i % 2 ? R : rI;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(Math.cos(a) * rr1, cy + Math.sin(a) * rr1); ctx.lineTo(Math.cos(a2) * rr2, cy + Math.sin(a2) * rr2); ctx.closePath();
      const lx = Math.cos((a + a2) / 2), ly = Math.sin((a + a2) / 2), k = lx * L.main.x + ly * L.main.y;
      ctx.fillStyle = k > 0 ? `rgba(255,245,200,${0.12 + 0.22 * k * (0.3 + 0.7 * L.lum)})` : `rgba(90,50,0,${0.1 - 0.2 * k})`; ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = L.col('#9a7414', 0.4); ctx.lineWidth = lw(H, 0.006, 0.5); star(ctx); ctx.stroke();
    rim(ctx, L, star, { x: -R, y: cy - R, w: 2 * R, h: 2 * R }, lw(H, 0.012, 0.6), 1);
    if (sp > 0) {
      const spots = [[-0.2, -0.78, 0.9], [0.18, -0.52, 0.6], [0.02, -0.92, 1], [0.3, -0.7, 0.7]];
      spots.forEach(([x, y, s], i) => {
        const k = Math.max(0, Math.sin(t * 2.4 + i * 1.7)) * sp, Rr = H * 0.09 * s * k;
        if (Rr < 0.3) return;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,248,214,0.9)';
        ctx.beginPath(); ctx.moveTo(x * H, y * H - Rr); ctx.quadraticCurveTo(x * H, y * H, x * H + Rr * 0.7, y * H); ctx.quadraticCurveTo(x * H, y * H, x * H, y * H + Rr); ctx.quadraticCurveTo(x * H, y * H, x * H - Rr * 0.7, y * H); ctx.quadraticCurveTo(x * H, y * H, x * H, y * H - Rr); ctx.fill(); ctx.restore();
      });
    }
    return { star: P(0, cy), stem: P(0, -0.23 * H), base: P(0, 0) };
  });
}

export function wrench(ctx, o = {}) {
  const S = o.size ?? 100, t = S * 0.07;
  return run(ctx, o, (L, P) => {
    const hx0 = -0.5 * S, hx1 = 0.22 * S;
    const handle = (c) => { c.beginPath(); c.moveTo(hx0, -t * 0.55); c.lineTo(hx1, -t * 0.42); c.lineTo(hx1, t * 0.42); c.lineTo(hx0, t * 0.55); c.arc(hx0, 0, t * 0.55, Math.PI / 2, -Math.PI / 2); c.closePath(); };
    solid(ctx, L, handle, { x: hx0 - t * 0.5, y: -t * 0.55, w: hx1 - hx0 + t * 0.5, h: t * 1.1 }, '#8f98a1', 0.1, { fill: steelGrad(ctx, -t * 0.55, t * 0.55, L, '#4d555d', '#98a1aa', '#d6dde3') });
    // head with two jaws
    const head = (c) => { c.beginPath(); c.moveTo(hx1, -t * 0.42); c.lineTo(0.3 * S, -t * 0.9); c.lineTo(0.5 * S, -t * 0.82); c.lineTo(0.5 * S, -t * 0.28); c.lineTo(0.37 * S, -t * 0.28); c.lineTo(0.37 * S, t * 0.28); c.lineTo(0.5 * S, t * 0.28); c.lineTo(0.5 * S, t * 0.82); c.lineTo(0.3 * S, t * 0.9); c.lineTo(hx1, t * 0.42); c.closePath(); };
    solid(ctx, L, head, { x: hx1, y: -t * 0.9, w: 0.28 * S, h: t * 1.8 }, '#8f98a1', 0.1, { fill: steelGrad(ctx, -t * 0.9, t * 0.9, L, '#4d555d', '#98a1aa', '#d6dde3') });
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = lw(S, 0.006, 0.5); line(ctx, 0.37 * S, -t * 0.28, 0.37 * S, t * 0.28);
    ctx.fillStyle = L.col('#555d65', 0.1); ctx.beginPath(); ctx.arc(0.29 * S, 0, t * 0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = lw(S, 0.005, 0.4); for (let i = 0; i < 6; i++) line(ctx, 0.2 * S + i * S * 0.012, -t * 0.12, 0.2 * S + i * S * 0.012, t * 0.12);
    ctx.fillStyle = 'rgba(40,30,20,0.22)'; ctx.fillRect(-0.3 * S, -t * 0.55, 0.12 * S, t * 1.1);   // greasy grip
    return { head: P(0.44 * S, 0), tail: P(hx0, 0) };
  });
}

export function cloth(ctx, o = {}) {
  const S = o.size ?? 80, sw = clamp(o.sway ?? 0, -1, 1);
  return run(ctx, o, (L, P) => {
    ctx.rotate(sw * 8 * D);
    const wdt = S * 0.46, top = 0;
    const path = (c) => {
      c.beginPath(); c.moveTo(-S * 0.04, 0); c.bezierCurveTo(-S * 0.1, S * 0.08, -wdt * 0.5, S * 0.18, -wdt * 0.5, S * 0.36);
      c.bezierCurveTo(-wdt * 0.52 - sw * S * 0.03, S * 0.7, -wdt * 0.46, S * 0.9, -wdt * 0.5 + sw * S * 0.05, S);
      c.quadraticCurveTo(-wdt * 0.2, S * 1.03, 0, S * 0.99); c.quadraticCurveTo(wdt * 0.2, S * 1.04, wdt * 0.5 + sw * S * 0.05, S);
      c.bezierCurveTo(wdt * 0.48, S * 0.9, wdt * 0.52 - sw * S * 0.03, S * 0.7, wdt * 0.5, S * 0.36);
      c.bezierCurveTo(wdt * 0.5, S * 0.18, S * 0.1, S * 0.08, S * 0.04, 0); c.closePath();
    };
    const bb = { x: -wdt * 0.55, y: 0, w: wdt * 1.1, h: S };
    path(ctx); ctx.fillStyle = L.col('#cfd6de', 0.05); ctx.fill();
    ctx.save(); path(ctx); ctx.clip();
    ctx.fillStyle = L.col('#8fa3bd', 0.05); for (let i = 0; i < 6; i++) ctx.fillRect(-wdt, S * (0.3 + i * 0.12), 2 * wdt, S * 0.03); for (let i = -3; i <= 3; i++) ctx.fillRect(i * wdt * 0.2, 0, S * 0.025, S * 1.1);
    ctx.strokeStyle = 'rgba(40,50,70,0.2)'; ctx.lineWidth = lw(S, 0.012, 0.6); for (const x of [-0.12, 0.05, 0.16]) { ctx.beginPath(); ctx.moveTo(x * S * 0.5, S * 0.06); ctx.bezierCurveTo(x * S * 1.2, S * 0.4, x * S * 0.6, S * 0.7, x * S * 1.1 + sw * S * 0.03, S); ctx.stroke(); }
    ctx.restore();
    form(ctx, L, path, bb, 0.28, 0.12); rim(ctx, L, path, bb, lw(S, 0.012, 0.6), 1);
    ctx.fillStyle = L.col('#aab4c0', 0.05); ctx.beginPath(); ctx.ellipse(0, S * 0.02, S * 0.07, S * 0.05, 0, 0, TAU); ctx.fill();
    return { grip: P(0, 0), hem: P(sw * S * 0.04, S) };
  });
}

export function accessCard(ctx, o = {}) {
  const S = o.size ?? 60, w = S * 0.63, strap = clamp(o.strap ?? 0);
  return run(ctx, o, (L, P) => {
    if (strap > 0) { ctx.fillStyle = L.col('#3a4d6b', 0.05); ctx.beginPath(); ctx.moveTo(-w * 0.12, -S / 2); ctx.lineTo(w * 0.12, -S / 2); ctx.lineTo(w * 0.1, -S / 2 - S * 0.4 * strap); ctx.lineTo(-w * 0.1, -S / 2 - S * 0.4 * strap); ctx.fill(); }
    const path = (c) => rr(c, -w / 2, -S / 2, w, S, S * 0.06);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = S * 0.04; ctx.fillStyle = '#fff'; path(ctx); ctx.fill(); ctx.restore();
    solid(ctx, L, path, { x: -w / 2, y: -S / 2, w, h: S }, '#e8edf2', 0.05, { dark: 0.18, lightK: 0.1 });
    ctx.fillStyle = L.col('#3a4d6b', 0.05); ctx.fillRect(-w / 2, -S / 2 + S * 0.05, w, S * 0.12);
    ctx.fillStyle = L.col('#8fa3bd', 0.05); ctx.fillRect(-w * 0.34, -S * 0.22, w * 0.68, S * 0.38);
    ctx.fillStyle = L.col('#5f6f86', 0.05); ctx.beginPath(); ctx.arc(0, -S * 0.1, w * 0.1, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, S * 0.08, w * 0.2, w * 0.14, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = L.col('#6f7a88', 0.05); ctx.fillRect(-w * 0.34, S * 0.24, w * 0.5, Math.max(0.8, S * 0.03)); ctx.fillRect(-w * 0.34, S * 0.3, w * 0.35, Math.max(0.8, S * 0.025));
    ctx.fillStyle = L.col('#c9a64a', 0.2); fillRRsafe(ctx, w * 0.16, S * 0.28, w * 0.2, S * 0.13, S * 0.015);
    return { centre: P(0, 0), top: P(0, -S / 2) };
  });
}

export function stylus(ctx, o = {}) {
  const S = o.size ?? 60, t = S * 0.05;
  return run(ctx, o, (L, P) => {
    const x0 = -0.3 * S, x1 = 0.58 * S - S * 0.3 * 0 - S * 0.3 + S * 0.3;
    const body = (c) => { c.beginPath(); c.moveTo(-0.3 * S - 0.4 * S + 0.4 * S, -t); c.lineTo(0.5 * S - S * 0.2, -t); c.lineTo(0.7 * S - S * 0.3 + 0.0, -t * 0.4); c.lineTo(0.7 * S - S * 0.3, t * 0.4); c.lineTo(0.5 * S - S * 0.2, t); c.lineTo(x0, t); c.arc(x0, 0, t, Math.PI / 2, -Math.PI / 2); c.closePath(); };
    void x1;
    solid(ctx, L, body, { x: x0 - t, y: -t, w: S, h: 2 * t }, '#d6dde5', 0.05, { fill: steelGrad(ctx, -t, t, L, '#7c8794', '#cfd6de', '#f4f7fb') });
    ctx.fillStyle = L.col('#222a35', 0.05); ctx.beginPath(); ctx.moveTo(0.4 * S, -t * 0.55); ctx.lineTo(0.4 * S + S * 0.07, -t * 0.25); ctx.lineTo(0.4 * S + S * 0.07, t * 0.25); ctx.lineTo(0.4 * S, t * 0.55); ctx.fill();
    ctx.fillStyle = L.col('#9aa6b4', 0.05); ctx.fillRect(-0.18 * S, -t * 0.95, S * 0.02, t * 1.9);
    return { tip: P(0.4 * S + S * 0.07, 0), tail: P(x0 - t, 0) };
  });
}

export function scanner(ctx, o = {}) {
  const S = o.size ?? 100, beam = clamp(o.beam ?? 0);
  return run(ctx, o, (L, P) => {
    const hw = S * 0.1, headH = S * 0.26;
    // grip
    const gp = (c) => { c.beginPath(); c.moveTo(-S * 0.12, -S * 0.02); c.lineTo(S * 0.0, -S * 0.02); c.lineTo(-S * 0.04, S * 0.34); c.lineTo(-S * 0.16, S * 0.34); c.closePath(); };
    solid(ctx, L, gp, { x: -S * 0.16, y: 0, w: S * 0.16, h: S * 0.34 }, '#2b323d', 0.05, { dark: 0.3 });
    ctx.fillStyle = L.col('#161a22', 0.05); ctx.fillRect(-S * 0.1, S * 0.12, S * 0.05, S * 0.12);
    // head
    const hd = (c) => rr(c, -S * 0.3, -S * 0.02 - headH, S * 0.74, headH, S * 0.04);
    solid(ctx, L, hd, { x: -S * 0.3, y: -S * 0.02 - headH, w: S * 0.74, h: headH }, '#3a4351', 0.05, { dark: 0.32 });
    // screen on top face
    ctx.fillStyle = L.col('#0c1017', 0.05); fillRRsafe(ctx, -S * 0.24, -S * 0.02 - headH * 0.85, S * 0.28, headH * 0.55, S * 0.015);
    ctx.fillStyle = rgba(C.cyan, 0.5 * (0.35 + 0.65 * L.lum)); ctx.fillRect(-S * 0.22, -S * 0.02 - headH * 0.78, S * 0.16, Math.max(0.8, S * 0.012)); ctx.fillRect(-S * 0.22, -S * 0.02 - headH * 0.66, S * 0.1, Math.max(0.8, S * 0.012));
    // lens collar
    const lx = S * 0.44, ly = -S * 0.02 - headH * 0.5;
    ctx.fillStyle = L.col('#222a35', 0.05); fillRRsafe(ctx, S * 0.4, ly - headH * 0.34, S * 0.08, headH * 0.68, S * 0.015);
    ctx.fillStyle = L.col('#0a0d12', 0.05); fillRRsafe(ctx, S * 0.46, ly - headH * 0.22, S * 0.012, headH * 0.44, S * 0.004);
    ctx.fillStyle = mixHex('#102030', C.cyan, 0.15 + 0.85 * beam); ctx.beginPath(); ctx.ellipse(S * 0.474, ly, Math.max(0.8, S * 0.008), headH * 0.18, 0, 0, TAU); ctx.fill();
    if (beam > 0.01) {
      const len = o.beamLen ?? S * 6, sp = (o.beamSpread ?? 6) * D;
      ctx.save(); ctx.translate(S * 0.48, ly);
      const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, rgba(C.cyan, 0.5 * beam)); g.addColorStop(0.15, rgba(C.cyan, 0.22 * beam)); g.addColorStop(1, rgba(C.cyan, 0));
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -headH * 0.1); ctx.lineTo(len, -Math.tan(sp) * len); ctx.lineTo(len, Math.tan(sp) * len); ctx.lineTo(0, headH * 0.1); ctx.fill();
      ctx.restore();
      glow(ctx, S * 0.48, ly, S * 0.35, C.cyan, 0.7 * beam);
    }
    return { lens: P(S * 0.48, ly), dir: { x: P(1, 0).x - P(0, 0).x, y: P(1, 0).y - P(0, 0).y }, screen: P(-S * 0.1, -S * 0.02 - headH * 0.6) };
  });
}

export function backpack(ctx, o = {}) {
  const H = o.size ?? 100, sl = clamp(o.slump ?? 0), w = 0.66 * H, hh = H * (1 - 0.14 * sl);
  return run(ctx, o, (L, P) => {
    contactShadow(ctx, o, w * 1.1);
    ctx.save(); ctx.translate(0, 0); if (sl) ctx.rotate(sl * -3 * D);
    const body = (c) => { c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w / 2, -hh * 0.78); c.bezierCurveTo(-w / 2, -hh * 0.98, -w * 0.3, -hh, 0, -hh); c.bezierCurveTo(w * 0.3, -hh, w / 2, -hh * 0.98, w / 2, -hh * 0.78); c.lineTo(w / 2 + sl * w * 0.04, 0); c.closePath(); };
    const bb = { x: -w / 2, y: -hh, w: w, h: hh };
    solid(ctx, L, body, bb, '#3d6b73', 0.1, { dark: 0.34 });
    ctx.save(); body(ctx); ctx.clip();
    const pk = (c) => rr(c, -w * 0.4, -hh * 0.42, w * 0.8, hh * 0.38, w * 0.08);
    solid(ctx, L, pk, { x: -w * 0.4, y: -hh * 0.42, w: w * 0.8, h: hh * 0.38 }, '#4c8089', 0.1, { dark: 0.3 });
    ctx.strokeStyle = L.col('#bfc9cf', 0.05); ctx.lineWidth = lw(H, 0.008, 0.6); ctx.setLineDash([H * 0.02, H * 0.015]); rr(ctx, -w * 0.37, -hh * 0.4, w * 0.74, hh * 0.34, w * 0.07); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = lw(H, 0.01, 0.7); ctx.beginPath(); ctx.moveTo(-w * 0.45, -hh * 0.72); ctx.quadraticCurveTo(0, -hh * 0.68, w * 0.45, -hh * 0.72); ctx.stroke();
    ctx.fillStyle = L.col('#c9a13a', 0.4); ctx.beginPath(); ctx.arc(w * 0.02, -hh * 0.24, w * 0.05, 0, TAU); ctx.fill();   // keyring charm
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-w / 2, -hh * 0.05, w, hh * 0.05);
    ctx.restore();
    // top handle + strap on the left
    ctx.strokeStyle = L.col('#2c4f56', 0.1); ctx.lineWidth = lw(H, 0.03, 1); ctx.beginPath(); ctx.moveTo(-w * 0.1, -hh * 0.995); ctx.quadraticCurveTo(0, -hh * 1.09, w * 0.1, -hh * 0.995); ctx.stroke();
    ctx.strokeStyle = L.col('#2c4f56', 0.1); ctx.lineWidth = lw(H, 0.05, 1.4); ctx.beginPath(); ctx.moveTo(-w * 0.28, -hh * 0.93); ctx.bezierCurveTo(-w * 0.78, -hh * 0.8, -w * 0.78, -hh * 0.25, -w * 0.3, -hh * 0.05); ctx.stroke();
    ctx.restore();
    return { top: P(0, -hh * 1.06), strap: P(-w * 0.6, -hh * 0.5), centre: P(0, -hh * 0.5) };
  });
}

export function softToy(ctx, o = {}) {
  const S = o.size ?? 100, sw = clamp(o.sway ?? 0, -1, 1);
  return run(ctx, o, (L, P) => {
    const fur = '#d9ccbf', furDk = '#bfae9e', pink = '#d7a7a3';
    const col = (h) => L.col(h, 0.1);
    ctx.save(); ctx.rotate(sw * 7 * D);
    // held ear (taut)
    const ear1 = (c) => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(S * 0.06, S * 0.1, S * 0.07, S * 0.22, S * 0.05, S * 0.31); c.lineTo(-S * 0.05, S * 0.31); c.bezierCurveTo(-S * 0.07, S * 0.2, -S * 0.04, S * 0.08, 0, 0); c.closePath(); };
    solid(ctx, L, ear1, { x: -S * 0.07, y: 0, w: S * 0.14, h: S * 0.31 }, fur, 0.1, { dark: 0.2 });
    ctx.fillStyle = col(pink); ctx.beginPath(); ctx.moveTo(0, S * 0.07); ctx.quadraticCurveTo(S * 0.03, S * 0.2, S * 0.01, S * 0.3); ctx.lineTo(-S * 0.02, S * 0.3); ctx.quadraticCurveTo(-S * 0.03, S * 0.18, 0, S * 0.07); ctx.fill();
    ctx.translate(0, S * 0.3); ctx.rotate(sw * 6 * D);
    // second ear flops down beside the head
    const ear2 = (c) => { c.beginPath(); c.moveTo(S * 0.06, 0); c.bezierCurveTo(S * 0.19, S * 0.06, S * 0.2, S * 0.26, S * 0.12, S * 0.34); c.bezierCurveTo(S * 0.05, S * 0.3, S * 0.03, S * 0.12, S * 0.02, S * 0.02); c.closePath(); };
    solid(ctx, L, ear2, { x: 0, y: 0, w: S * 0.2, h: S * 0.34 }, furDk, 0.1, { dark: 0.25 });
    // head
    const head = (c) => { c.beginPath(); c.ellipse(0, S * 0.1, S * 0.11, S * 0.115, 0, 0, TAU); };
    solid(ctx, L, head, { x: -S * 0.11, y: -S * 0.015, w: S * 0.22, h: S * 0.23 }, fur, 0.1, { dark: 0.22 });
    ctx.fillStyle = col('#3b3330'); ctx.beginPath(); ctx.arc(S * 0.06, S * 0.09, Math.max(0.8, S * 0.014), 0, TAU); ctx.fill();
    ctx.fillStyle = col(pink); ctx.beginPath(); ctx.arc(S * 0.105, S * 0.125, Math.max(0.7, S * 0.01), 0, TAU); ctx.fill();
    // body: soft sack
    ctx.save(); ctx.translate(0, S * 0.2); ctx.rotate(sw * 4 * D);
    const bd = (c) => { c.beginPath(); c.moveTo(-S * 0.08, 0); c.bezierCurveTo(-S * 0.2, S * 0.1, -S * 0.17, S * 0.27, -S * 0.04, S * 0.3); c.bezierCurveTo(S * 0.1, S * 0.32, S * 0.2, S * 0.18, S * 0.08, 0); c.closePath(); };
    solid(ctx, L, bd, { x: -S * 0.2, y: 0, w: S * 0.4, h: S * 0.32 }, fur, 0.1, { dark: 0.26 });
    ctx.fillStyle = col('#ece3d8'); ctx.beginPath(); ctx.ellipse(S * 0.01, S * 0.17, S * 0.06, S * 0.08, 0, 0, TAU); ctx.fill();
    // limbs dangling
    const limb = (x, y, len, a, wd) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = col(furDk); ctx.beginPath(); ctx.ellipse(0, len / 2, wd, len / 2, 0, 0, TAU); ctx.fill(); ctx.restore(); };
    limb(-S * 0.14, S * 0.06, S * 0.18, 0.2 + sw * 0.15, S * 0.04); limb(S * 0.12, S * 0.05, S * 0.17, -0.15 + sw * 0.1, S * 0.04);
    limb(-S * 0.05, S * 0.26, S * 0.19, 0.08, S * 0.05); limb(S * 0.07, S * 0.26, S * 0.18, -0.1, S * 0.05);
    ctx.restore(); ctx.restore();
    return { grip: P(0, 0), head: P(0, S * 0.4), feet: P(0, S * 0.97) };
  });
}

export function cerealBowl(ctx, o = {}) {
  const W = o.size ?? 100, fill = clamp(o.fill ?? 0.8), sp = o.spoon ?? 1;
  return run(ctx, o, (L, P) => {
    contactShadow(ctx, o, W * 0.8);
    const h = W * 0.42, ry = W * 0.09;
    const body = (c) => { c.beginPath(); c.moveTo(-W / 2, -h); c.bezierCurveTo(-W * 0.48, -h * 0.25, -W * 0.3, 0, -W * 0.18, 0); c.lineTo(W * 0.18, 0); c.bezierCurveTo(W * 0.3, 0, W * 0.48, -h * 0.25, W / 2, -h); c.ellipse(0, -h, W / 2, ry, 0, 0, Math.PI); c.closePath(); };
    const bb = { x: -W / 2, y: -h - ry, w: W, h: h + ry };
    // back of the rim + inside
    ctx.fillStyle = L.col('#b9b2a6', 0.05); ctx.beginPath(); ctx.ellipse(0, -h, W / 2, ry, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, -h, W / 2 - 1, ry - 1, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = L.col('#e9e4d8', 0.1); ctx.fillRect(-W, -h - ry, 2 * W, 2 * ry);
    ctx.fillStyle = L.col('#d7cfc0', 0.1); ctx.beginPath(); ctx.ellipse(0, -h + ry * (0.9 - fill * 0.6), W * 0.46, ry * 0.8, 0, 0, TAU); ctx.fill();
    const rr_ = rng(5);
    for (let i = 0; i < 24; i++) { const a = rr_() * TAU, d = Math.sqrt(rr_()) * 0.42; ctx.fillStyle = L.col(rr_() < 0.5 ? '#d9a95a' : '#c18a40', 0.2); ctx.beginPath(); ctx.ellipse(Math.cos(a) * d * W, -h + Math.sin(a) * d * ry * 0.9 - ry * 0.1 * fill, W * 0.03, W * 0.022, a, 0, TAU); ctx.fill(); }
    ctx.restore();
    solid(ctx, L, body, bb, '#e8e2d6', 0.05, { dark: 0.32, lightK: 0.14 });
    ctx.save(); body(ctx); ctx.clip(); ctx.fillStyle = L.col('#4f7a9a', 0.15); ctx.fillRect(-W, -h * 0.55, 2 * W, h * 0.08); ctx.fillRect(-W, -h * 0.4, 2 * W, h * 0.03); ctx.restore();
    // front of the rim
    ctx.strokeStyle = L.col('#f3eee4', 0.1); ctx.lineWidth = lw(W, 0.012, 0.8); ctx.beginPath(); ctx.ellipse(0, -h, W / 2, ry, 0, 0, Math.PI); ctx.stroke();
    if (sp) { ctx.save(); ctx.translate(W * 0.18, -h + ry * 0.2); ctx.rotate(-28 * D); ctx.fillStyle = steelGrad(ctx, -W * 0.014, W * 0.014, L); fillRRsafe(ctx, 0, -W * 0.012, W * 0.5, W * 0.024, W * 0.01); ctx.beginPath(); ctx.ellipse(-W * 0.02, 0, W * 0.06, W * 0.036, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    return { rim: P(0, -h), spoon: P(W * 0.55, -h - W * 0.2), centre: P(0, -h * 0.5) };
  });
}

export function mug(ctx, o = {}) {
  const H = o.size ?? 60, steam = clamp(o.steam ?? 0), t = o.t ?? 0, w = H * 0.82;
  return run(ctx, o, (L, P) => {
    contactShadow(ctx, o, w * 1.1);
    const hd = (c) => { c.beginPath(); c.moveTo(w / 2 - 1, -H * 0.8); c.bezierCurveTo(w * 0.95, -H * 0.85, w * 0.95, -H * 0.2, w / 2 - 1, -H * 0.25); };
    ctx.strokeStyle = L.col('#d9d2c6', 0.05); ctx.lineWidth = lw(H, 0.12, 1.4); hd(ctx); ctx.stroke();
    ctx.strokeStyle = L.col('#f3eee4', 0.05); ctx.globalAlpha *= 0.4; ctx.lineWidth = lw(H, 0.02, 0.5); ctx.save(); ctx.translate(-H * 0.02, -H * 0.035); hd(ctx); ctx.stroke(); ctx.restore(); ctx.globalAlpha /= 0.4 || 1;
    const body = (c) => { c.beginPath(); c.moveTo(-w / 2, -H); c.lineTo(-w / 2 + H * 0.03, -H * 0.06); c.quadraticCurveTo(-w / 2 + H * 0.04, 0, -w / 2 + H * 0.12, 0); c.lineTo(w / 2 - H * 0.12, 0); c.quadraticCurveTo(w / 2 - H * 0.04, 0, w / 2 - H * 0.03, -H * 0.06); c.lineTo(w / 2, -H); c.closePath(); };
    solid(ctx, L, body, { x: -w / 2, y: -H, w, h: H }, '#cfc8bb', 0.05, { dark: 0.36, lightK: 0.14 });
    ctx.fillStyle = L.col('#4a3a2c', 0.1); ctx.beginPath(); ctx.ellipse(0, -H, w / 2 - H * 0.02, H * 0.05, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = L.col('#e6e0d4', 0.05); ctx.lineWidth = lw(H, 0.02, 0.6); ctx.beginPath(); ctx.ellipse(0, -H, w / 2, H * 0.05, 0, Math.PI, TAU, true); ctx.stroke();
    if (steam > 0.01) {
      ctx.save(); ctx.strokeStyle = rgba(L.lights[0] ? L.lights[0].color : '#ffffff', 0.4 * steam); ctx.lineCap = 'round'; ctx.lineWidth = lw(H, 0.04, 0.8);
      for (let i = 0; i < 3; i++) { const x0 = (i - 1) * w * 0.22, ph = t * 0.6 + i * 1.9; ctx.globalAlpha = steam * (0.5 + 0.3 * Math.sin(ph)); ctx.beginPath(); ctx.moveTo(x0, -H * 1.1); ctx.bezierCurveTo(x0 + Math.sin(ph) * H * 0.12, -H * 1.3, x0 - Math.sin(ph) * H * 0.12, -H * 1.45, x0 + Math.cos(ph) * H * 0.1, -H * 1.65); ctx.stroke(); }
      ctx.restore();
    }
    return { rim: P(0, -H), handle: P(w * 0.5, -H * 0.5), centre: P(0, -H * 0.5) };
  });
}

export function satchel(ctx, o = {}) {
  const W = o.size ?? 100, h = 0.72 * W, hm = o.anchor === 'handle';
  return run(ctx, o, (L, P) => {
    const gy = hm ? 0.2 * W + h : 0;   // handle grip at origin
    ctx.translate(0, gy);
    contactShadow(ctx, hm ? { shadow: 0 } : o, W);
    const body = (c) => { c.beginPath(); c.moveTo(-W / 2, 0); c.lineTo(-W * 0.47, -h * 0.9); c.quadraticCurveTo(-W * 0.46, -h, -W * 0.4, -h); c.lineTo(W * 0.4, -h); c.quadraticCurveTo(W * 0.46, -h, W * 0.47, -h * 0.9); c.lineTo(W / 2, 0); c.closePath(); };
    const bb = { x: -W / 2, y: -h, w: W, h };
    // top handle
    ctx.strokeStyle = L.col('#2e2a27', 0.05); ctx.lineWidth = lw(W, 0.045, 1.2); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-W * 0.17, -h * 0.97); ctx.bezierCurveTo(-W * 0.14, -h - W * 0.2, W * 0.14, -h - W * 0.2, W * 0.17, -h * 0.97); ctx.stroke();
    solid(ctx, L, body, bb, '#4b4540', 0.05, { dark: 0.34, lightK: 0.14 });
    ctx.save(); body(ctx); ctx.clip();
    const flap = (c) => { c.beginPath(); c.moveTo(-W * 0.5, -h * 1.01); c.lineTo(W * 0.5, -h * 1.01); c.lineTo(W * 0.49, -h * 0.55); c.quadraticCurveTo(0, -h * 0.42, -W * 0.49, -h * 0.55); c.closePath(); };
    solid(ctx, L, flap, { x: -W / 2, y: -h, w: W, h: h * 0.58 }, '#58514b', 0.05, { dark: 0.3 });
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = lw(W, 0.01, 0.6); ctx.beginPath(); ctx.moveTo(-W * 0.49, -h * 0.55); ctx.quadraticCurveTo(0, -h * 0.42, W * 0.49, -h * 0.55); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,210,195,0.22)'; ctx.lineWidth = lw(W, 0.005, 0.5); ctx.setLineDash([W * 0.02, W * 0.014]); ctx.beginPath(); ctx.moveTo(-W * 0.45, -h * 0.6); ctx.quadraticCurveTo(0, -h * 0.48, W * 0.45, -h * 0.6); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = L.col('#a2a39f', 0.1); fillRRsafe(ctx, -W * 0.05, -h * 0.55, W * 0.1, h * 0.17, W * 0.012);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; fillRRsafe(ctx, -W * 0.03, -h * 0.51, W * 0.06, h * 0.09, W * 0.008);
    // worn edges and scuffs
    ctx.strokeStyle = 'rgba(190,180,165,0.26)'; ctx.lineWidth = lw(W, 0.008, 0.6); ctx.beginPath(); ctx.moveTo(-W / 2 + 1, 0); ctx.lineTo(-W * 0.47, -h * 0.9); ctx.moveTo(W / 2 - 1, 0); ctx.lineTo(W * 0.47, -h * 0.9); ctx.stroke();
    scratches(ctx, L, 77, 8, -W * 0.4, -h * 0.4, W * 0.4, -h * 0.03, W, '#8a8077');
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-W / 2, -h * 0.06, W, h * 0.06);
    ctx.restore();
    // side strap, folded
    ctx.strokeStyle = L.col('#3a3531', 0.05); ctx.lineWidth = lw(W, 0.035, 1); ctx.beginPath(); ctx.moveTo(-W * 0.4, -h * 0.55); ctx.bezierCurveTo(-W * 0.62, -h * 0.5, -W * 0.6, -h * 0.1, -W * 0.46, -h * 0.07); ctx.stroke();
    return { handle: P(0, -h - W * 0.15), centre: P(0, -h * 0.5), top: P(0, -h) };
  });
}

export function stepStool(ctx, o = {}) {
  const H = o.size ?? 100, w = H * 0.9;
  return run(ctx, o, (L, P) => {
    contactShadow(ctx, o, w);
    const wood = '#b79a74', woodDk = '#8c7455', tt = H * 0.07;
    const plank = (x0, y0, x1, y1, col, rad) => { const p = (c) => rr(c, x0, y0, x1 - x0, y1 - y0, rad); solid(ctx, L, p, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, col, 0.05, { dark: 0.3, lightK: 0.14, rimW: lw(H, 0.008, 0.5) }); };
    // far legs, near legs (side-on: two A-frame sides)
    ctx.fillStyle = L.col(woodDk, 0.05);
    ctx.beginPath(); ctx.moveTo(-w * 0.42, 0); ctx.lineTo(-w * 0.34, 0); ctx.lineTo(-w * 0.2, -H * 0.5); ctx.lineTo(-w * 0.28, -H * 0.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w * 0.42, 0); ctx.lineTo(w * 0.34, 0); ctx.lineTo(w * 0.24, -H * 0.93); ctx.lineTo(w * 0.32, -H * 0.93); ctx.fill();
    // lower step (left), tall step/top (right)
    plank(-w * 0.5, -H * 0.5, -w * 0.02, -H * 0.5 + tt, wood, H * 0.01);
    plank(-w * 0.05, -H, w * 0.46, -H + tt, wood, H * 0.01);
    // front legs
    const leg = (pts) => { const p = (c) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); }; solid(ctx, L, p, { x: -w / 2, y: -H, w, h: H }, wood, 0.05, { dark: 0.3, lightK: 0.12 }); };
    leg([[-w * 0.46, 0], [-w * 0.37, 0], [-w * 0.18, -H * 0.5 + tt], [-w * 0.27, -H * 0.5 + tt]]);
    leg([[w * 0.46, 0], [w * 0.37, 0], [w * 0.2, -H + tt], [w * 0.29, -H + tt]]);
    leg([[-w * 0.02, 0], [w * 0.07, 0], [w * 0.1, -H * 0.55], [w * 0.02, -H * 0.55]]);
    ctx.fillStyle = L.col(woodDk, 0.05); ctx.fillRect(-w * 0.3, -H * 0.18, w * 0.7, H * 0.045);
    return { top: P(w * 0.2, -H), step: P(-w * 0.26, -H * 0.5), w };
  });
}

export function paperStar(ctx, o = {}) {
  const S = o.size ?? 60, col = o.color ?? '#efdc9c', r = rng(Math.floor((o.seed ?? 1) * 997) + 3);
  return run(ctx, o, (L, P) => {
    const R = S / 2, jit = Array.from({ length: 10 }, () => 0.94 + r() * 0.12), rot = (r() - 0.5) * 0.2 - Math.PI / 2;
    const path = (c) => starPath(c, 0, 0, R, R * 0.45, rot, 5, jit);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = S * 0.06; ctx.shadowOffsetY = S * 0.02; ctx.fillStyle = L.col(col, 0.2); path(ctx); ctx.fill(); ctx.restore();
    ctx.save(); path(ctx); ctx.clip();
    for (let i = 0; i < 10; i++) {
      const a = rot + i * Math.PI / 5, a2 = a + Math.PI / 5, r1 = (i % 2 ? 0.45 : 1) * R * jit[i % 10], r2 = (i % 2 ? 1 : 0.45) * R * jit[(i + 1) % 10];
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2); ctx.closePath();
      ctx.fillStyle = i % 2 ? L.col(mixHex(col, '#ffffff', 0.2), 0.2) : L.col(mixHex(col, '#b89a4a', 0.3), 0.2); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(120,90,30,0.25)'; ctx.lineWidth = lw(S, 0.01, 0.5); path(ctx); ctx.stroke();
    rim(ctx, L, path, { x: -R, y: -R, w: 2 * R, h: 2 * R }, lw(S, 0.02, 0.6), 1);
    return { centre: P(0, 0) };
  });
}
