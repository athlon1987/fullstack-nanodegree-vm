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

import { clamp, lerp, invlerp, TAU, rad, ease, hash, rng, noise1, rgba, mixHex, linGrad, radGrad, glow, FONT } from './engine.js';
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

