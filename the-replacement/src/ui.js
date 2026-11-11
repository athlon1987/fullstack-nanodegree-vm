// THE REPLACEMENT — UI kit: the phone, the hand that holds it, screen light, and every reusable
// piece of on-screen interface (Adam's ordinary apps and the Life Optimisation Program).
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
//  HOW TO SHOOT A SCREEN INSERT
//
//    import { phone, softBackground, statusBar, ... } from '../ui.js';
//    softBackground(ctx, 'rainNight', F.t);                         // blurred set behind the phone
//    phone(ctx, { x: 960, y: 402, w: 800, rot: 3, focus: [195, 210], worn: true,
//                 glow: '#cfd8e6', hand: 'right', thumb: { x: 300, y: 380, press: 0 } },
//          (ctx, sw, sh) => { /* draw the screen in a 390 x 844 logical space */ });
//
//  All screen content is drawn in LOGICAL SCREEN UNITS: 390 wide, 844 tall, origin top-left of
//  the glass (SCREEN.W / SCREEN.H). With the usual insert size (device w ≈ 800 → screen ≈ 736 px
//  wide) one logical unit is ≈ 1.9 picture px, so: must-read text ≥ 21.5 units (≥ 40 px), secondary
//  text ≥ 15 units (≥ 28 px). Only ~425 units of the 844 are visible in the 2.39:1 frame — choose
//  which part with `focus`.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
//  THE DEVICE
//
//  phone(ctx, o, drawScreen)
//      o.x, o.y      picture-space point where the phone sits (default: frame centre)
//      o.w           device width in px (screen width = 0.92 w)
//      o.rot         tilt in degrees (clockwise)
//      o.focus       [sx, sy] screen point (logical units) that lands on (x, y). Default: the screen
//                    centre [195, 422]. Animate focus + w for push-ins; everything is vector-crisp.
//      o.worn        true = Adam's phone (hairline crack at the top-right corner, scuffs, micro
//                    scratches); false = pristine (V1's).
//      o.glow        colour of the light the screen throws on the hand and the dark around it
//      o.glowAmt     strength of that spill, 0..1.5 (default 1; use ~0.25 in daylight)
//      o.hand        'right' | 'left' | null — which hand holds it
//      o.thumb       { x, y, press } thumb tip target in SCREEN units, press 0 (hovering) .. 1
//                    (pad flat on the glass), or null for a thumb resting on the bezel
//      o.grip        screen-y (logical) of the middle of the grip (default 600). Fingers show on the
//                    far edge around grip-200..grip+90, the thumb roots near grip+170.
//      o.bg          optional (ctx) => void drawn first (the blurred background)
//      o.on          screen brightness 0..1 (0 = display off, black glass)   default 1
//      o.bloom       strength of the soft bloom around bright UI (default 0.5)
//      o.sheen       options for glassSheen ({amt, tint, shift, env, envAmt}) or false
//      o.overlay     optional (ctx, sw, sh) => void drawn ON the glass after the sheen (raindrops)
//      o.ink         silhouette colour of the hand (default near-black)
//      o.rim         { color, amt, dx, dy } thin key-light rim on the hand/device, light from (dx,dy)
//      o.body        device body colour (default graphite)
//    drawScreen(ctx, 390, 844) is called clipped to the rounded glass. It may be called twice per
//    frame (once for the picture, once small for the bloom) so it must be a pure function.
//    Returns the pose metrics { s (px per logical unit), toFrame(sx, sy) → [x, y] in picture px }.
//
//  phoneMetrics(w)                    sizes of a device of width w
//  screenToFrame(o, sx, sy)           where a screen point lands in the picture for a pose o
//  hand(ctx, o)                       THE hand. One function, two layers ('back' behind the device,
//                                     'front' over the glass). Swap this for the character rig's hand.
//  screenBloom(ctx, cx, cy, sw, sh, color, amt)     the spill of screen light into the dark
//  glassSheen(ctx, sw, sh, o)         reflection on the glass (call inside the screen clip)
//  raindropsOnGlass(ctx, t, sw, sh, o)   beads of rain on the glass, some crawling down
//
//  UI PIECES (all in whatever space you are drawing in — normally screen units)
//  statusBar(ctx, o)                  time · signal · wifi · battery
//  bubbleSize(ctx, str, o) / bubble(ctx, o)   chat bubble with balanced wrapping; k = arrival 0..1
//  typingDots(ctx, x, y, t, o)        the three-dot "typing" bubble
//  banner(ctx, o)                     alert/notification card that drops from above; k = 0..1
//  sheet(ctx, o, draw)                bottom sheet with scrim; k = 0..1 raised
//  button(ctx, o)                     solid / outline / ghost button; press, breathe
//  tick(ctx, x, y, size, k, o)        check mark that draws itself on (optional ring)
//  spinner(ctx, x, y, r, t, o)        comet-tail activity spinner
//  typeLine(ctx, str, x, y, k, o)     typewriter text with caret; returns width drawn
//  hudBrackets(ctx, x, y, w, h, k, o) corner brackets that snap onto a rect
//  emblem(ctx, x, y, r, o)            the Program's mark: ring, vertical axis, two mirrored arcs
//  softBackground(ctx, kind, t, o)    out-of-focus set: 'bedroomDark' | 'rainNight' |
//                                     'goldenStreet' | 'kitchenNight'  (o: {x, y, zoom, dim, lamp, lunchbox})
//  crayonFamily(ctx, x, y, w, o)      a child's crayon drawing of three figures holding hands
//  UI                                 colour tokens for Adam's apps (UI.*) and the Program (UI.p*)
//
//  Everything is a pure function of its arguments (deterministic; no state between frames).
// ─────────────────────────────────────────────────────────────────────────────────────────────
import {
  PW, PH, CX, CY, TAU, clamp, lerp, invlerp, ease, rad, hash, rng, noise1, wobble, rgba, mixHex,
  rr, fillRR, linGrad, radGrad, text, measure, wrapLines, typeOn, cached, scratch, FONT,
} from './engine.js';
import { C } from './style.js';

export const SCREEN = { W: 390, H: 844, R: 44 };

/** Colour tokens. Adam's apps: plain, slightly dated greys on dark. The Program: near-black + cyan. */
export const UI = {
  bg: '#0f1114', surface: '#191c21', surface2: '#24282f', line: '#2e333b',
  text: '#eceef2', text2: '#a2a8b3', text3: '#69707b',
  bubbleIn: '#2b2f37', bubbleOut: '#3b4a60',
  red: C.alert, redDeep: '#c4272c',
  pBg: '#03070b', pPanel: '#07111a', pLine: C.cyan, pText: C.ice, pCyan: C.cyan, pDim: '#5d98ad', pLegal: '#6b7783',
};

// ───────────────────────────── the device ─────────────────────────────
export function phoneMetrics(w) {
  const sw = w * 0.92, s = sw / SCREEN.W, sh = SCREEN.H * s;
  return { w, h: sh + w * 0.09, sw, sh, s, r: w * 0.142, sr: SCREEN.R * s };
}

/** Picture-space position of a screen point (logical units) for a phone pose o = {x, y, w, rot, focus}. */
export function screenToFrame(o, sx, sy) {
  const { x = CX, y = CY, w = 800, rot = 0, focus = null } = o;
  const m = phoneMetrics(w), f = focus || [SCREEN.W / 2, SCREEN.H / 2];
  const dx = (sx - f[0]) * m.s, dy = (sy - f[1]) * m.s, a = rad(rot);
  return [x + dx * Math.cos(a) - dy * Math.sin(a), y + dx * Math.sin(a) + dy * Math.cos(a)];
}

export function phone(ctx, o, drawScreen) {
  const {
    x = CX, y = CY, w = 800, rot = 0, focus = null, worn = false, glow: glowCol = '#aebfd8', glowAmt = 1,
    hand: side = 'right', thumb = null, grip = 600, bg = null, on = 1, bloom = 0.5, sheen = {}, overlay = null,
    ink = '#05070b', rim = null, body = '#0c0e13',
  } = o;
  const m = phoneMetrics(w);
  const f = focus || [SCREEN.W / 2, SCREEN.H / 2];
  if (bg) bg(ctx);

  ctx.save();
  ctx.translate(x, y); ctx.rotate(rad(rot));
  ctx.translate(-(f[0] - SCREEN.W / 2) * m.s, -(f[1] - SCREEN.H / 2) * m.s);   // device centre is now the origin

  const dev = (sx, sy) => [(sx - SCREEN.W / 2) * m.s, (sy - SCREEN.H / 2) * m.s];
  const handO = side ? {
    side, w: m.w, h: m.h, grip: dev(0, grip)[1], ink, rim, glow: glowCol, glowAmt: glowAmt * on,
    thumb: thumb ? { x: dev(thumb.x, 0)[0], y: dev(0, thumb.y)[1], press: thumb.press || 0 } : null,
  } : null;

  // 1. light the screen throws into the dark
  screenBloom(ctx, 0, 0, m.sw, m.sh, glowCol, glowAmt * on);
  // 2. the hand behind the device
  if (handO) hand(ctx, { ...handO, layer: 'back' });
  // 3. the body
  drawDevice(ctx, m, { body, glowCol, glowAmt: glowAmt * on, rim });

  // 4. the screen
  ctx.save();
  ctx.translate(-m.sw / 2, -m.sh / 2); ctx.scale(m.s, m.s);
  ctx.save();
  rr(ctx, 0, 0, SCREEN.W, SCREEN.H, SCREEN.R); ctx.clip();
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SCREEN.W, SCREEN.H);
  if (on > 0.001) {
    ctx.save(); drawScreen(ctx, SCREEN.W, SCREEN.H); ctx.restore();
    if (on < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - on})`; ctx.fillRect(0, 0, SCREEN.W, SCREEN.H); }
  }
  ctx.restore();
  // soft bloom of the bright UI (a small blurred copy, added back; bleeds a little over the bezel)
  if (bloom > 0 && on > 0.001) {
    const B = 0.25, pad = 10, bw = Math.ceil(SCREEN.W * B), bh = Math.ceil(SCREEN.H * B);
    const a = scratch('ui-bloom-a', bw, bh);
    a.ctx.save(); a.ctx.scale(B, B); drawScreen(a.ctx, SCREEN.W, SCREEN.H); a.ctx.restore();
    a.ctx.globalCompositeOperation = 'multiply'; a.ctx.drawImage(a.cv, 0, 0);       // square it: only bright UI blooms
    a.ctx.globalCompositeOperation = 'destination-in';                               // keep it inside the rounded glass
    rr(a.ctx, 0, 0, bw, bh, SCREEN.R * B); a.ctx.fillStyle = '#fff'; a.ctx.fill();
    a.ctx.globalCompositeOperation = 'source-over';
    const b = scratch('ui-bloom-b', bw + pad * 2, bh + pad * 2);
    b.ctx.filter = 'blur(2.6px)'; b.ctx.drawImage(a.cv, pad, pad); b.ctx.filter = 'none';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(bloom * on);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(b.cv, -pad / B, -pad / B, (bw + pad * 2) / B, (bh + pad * 2) / B);
    ctx.restore();
  }
  // glass: reflection, things lying on it
  ctx.save();
  rr(ctx, 0, 0, SCREEN.W, SCREEN.H, SCREEN.R); ctx.clip();
  if (sheen !== false) glassSheen(ctx, SCREEN.W, SCREEN.H, sheen || {});
  if (overlay) { ctx.save(); overlay(ctx, SCREEN.W, SCREEN.H); ctx.restore(); }
  ctx.restore();
  // punch-hole camera
  ctx.fillStyle = '#010102'; ctx.beginPath(); ctx.arc(SCREEN.W / 2, 19, 5.6, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(70,90,130,.35)'; ctx.beginPath(); ctx.arc(SCREEN.W / 2 - 1.2, 17.8, 1.5, 0, TAU); ctx.fill();
  ctx.restore();

  if (worn) wear(ctx, m);
  // 5. thumb and fingertips over the glass
  if (handO) hand(ctx, { ...handO, layer: 'front' });
  ctx.restore();

  const pose = { x, y, w, rot, focus: f };
  return { s: m.s, toFrame: (sx, sy) => screenToFrame(pose, sx, sy) };
}

function drawDevice(ctx, m, o) {
  const { w, h, r } = m, x = -w / 2, y = -h / 2;
  const { body, glowCol, glowAmt, rim } = o;
  const edge = mixHex(mixHex(body, '#5b6577', 0.55), glowCol, clamp(0.25 * glowAmt));
  // rim light from the environment key (sun) on the lit side
  if (rim && rim.amt > 0) {
    ctx.save(); ctx.translate((rim.dx || -1) * w * 0.006, (rim.dy || -1) * w * 0.006);
    fillRR(ctx, x, y, w, h, r, rgba(rim.color, 0.9 * rim.amt)); ctx.restore();
  }
  // side buttons
  fillRR(ctx, w / 2 - w * 0.006, -h * 0.215, w * 0.016, h * 0.085, w * 0.006, mixHex(body, '#39414f', 0.5));
  fillRR(ctx, -w / 2 - w * 0.010, -h * 0.262, w * 0.016, h * 0.052, w * 0.006, mixHex(body, '#39414f', 0.4));
  fillRR(ctx, -w / 2 - w * 0.010, -h * 0.196, w * 0.016, h * 0.052, w * 0.006, mixHex(body, '#39414f', 0.4));
  // frame: the metal band catches a little light on both sides
  fillRR(ctx, x, y, w, h, r, linGrad(ctx, x, 0, x + w, 0, [
    [0, edge], [0.022, mixHex(body, '#000000', 0.2)], [0.5, body], [0.978, mixHex(body, '#000000', 0.25)], [1, mixHex(edge, '#000000', 0.25)],
  ]));
  // front glass
  const e = w * 0.007;
  fillRR(ctx, x + e, y + e, w - 2 * e, h - 2 * e, r - e, '#030405');
  ctx.save();
  rr(ctx, x + e * 0.5, y + e * 0.5, w - e, h - e, r - e * 0.5);
  ctx.strokeStyle = rgba(mixHex('#8693a8', glowCol, clamp(0.5 * glowAmt)), 0.34); ctx.lineWidth = Math.max(1, w * 0.0028); ctx.stroke();
  ctx.restore();
}

/** Adam's phone: a hairline crack from the top-right corner, a chipped corner, scuffs and micro scratches. */
function wear(ctx, m) {
  const { w, h } = m, cx = w / 2, cy = -h / 2;
  const P = (a, b) => [cx + a * w, cy + b * w];
  const main = [P(-0.052, 0.006), P(-0.073, 0.062), P(-0.066, 0.108), P(-0.118, 0.158), P(-0.127, 0.232), P(-0.176, 0.292), P(-0.171, 0.352), P(-0.214, 0.418)];
  const br1 = [P(-0.118, 0.158), P(-0.178, 0.171), P(-0.226, 0.156), P(-0.292, 0.166)];
  const br2 = [P(-0.127, 0.232), P(-0.094, 0.266), P(-0.092, 0.306)];
  const br3 = [P(-0.066, 0.108), P(-0.031, 0.128), P(-0.012, 0.168)];
  const lw = Math.max(0.9, w * 0.0016);
  const poly = (pts, off, color, width, taper = true) => {
    for (let i = 1; i < pts.length; i++) {
      const k = taper ? 1 - (i - 1) / pts.length * 0.75 : 1;
      ctx.beginPath(); ctx.moveTo(pts[i - 1][0] + off, pts[i - 1][1] + off); ctx.lineTo(pts[i][0] + off, pts[i][1] + off);
      ctx.strokeStyle = color; ctx.globalAlpha = k; ctx.lineWidth = width * (0.55 + 0.45 * k); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [pts, a] of [[main, 1], [br1, 0.8], [br2, 0.7], [br3, 0.65]]) {
    poly(pts, lw * 1.1, `rgba(0,0,0,${0.55 * a})`, lw * 1.4);
    poly(pts, 0, `rgba(226,236,250,${0.5 * a})`, lw);
  }
  // the impact point: a tiny bright chip on the corner of the glass
  ctx.fillStyle = 'rgba(214,226,244,.5)';
  ctx.beginPath(); const c0 = P(-0.052, 0.006);
  ctx.moveTo(c0[0] - w * 0.012, c0[1]); ctx.lineTo(c0[0] + w * 0.010, c0[1] + w * 0.002); ctx.lineTo(c0[0] - w * 0.004, c0[1] + w * 0.016); ctx.closePath(); ctx.fill();
  // micro scratches on the glass (only catch the light faintly)
  const R = rng(4471);
  ctx.strokeStyle = 'rgba(220,230,245,.07)'; ctx.lineWidth = lw * 0.7;
  for (let i = 0; i < 9; i++) {
    const sx = (R() - 0.5) * w * 0.8, sy = (R() - 0.5) * h * 0.86, len = w * (0.05 + R() * 0.14), a = -0.9 + R() * 0.8, bend = (R() - 0.5) * len * 0.3;
    ctx.beginPath(); ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + Math.cos(a) * len * 0.5 - Math.sin(a) * bend, sy + Math.sin(a) * len * 0.5 + Math.cos(a) * bend, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
    ctx.stroke();
  }
  // scuffs on the metal frame
  ctx.strokeStyle = 'rgba(150,162,182,.35)'; ctx.lineWidth = lw * 1.3;
  for (let i = 0; i < 7; i++) {
    const sy = (R() - 0.5) * h * 0.9, s = R() < 0.5 ? -1 : 1, len = w * (0.006 + R() * 0.016);
    ctx.beginPath(); ctx.moveTo(s * (w / 2 - w * 0.0025), sy); ctx.lineTo(s * (w / 2 - w * 0.0025), sy + len); ctx.stroke();
  }
  ctx.restore();
}

// ───────────────────────────── the hand ─────────────────────────────
/** A tapered, gently curved finger as one path: a chain of circles from B (radius rb) to T (radius rt), bowed through K. */
function fingerPath(ctx, B, K, T, rb, rt, inset = 0, ox = 0, oy = 0) {
  const N = 56;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const px = u * u * B.x + 2 * u * t * K.x + t * t * T.x, py = u * u * B.y + 2 * u * t * K.y + t * t * T.y;
    // taper, with a little fullness at the joint and the pad
    const r = lerp(rb, rt, Math.pow(t, 0.8)) + rt * 0.09 * Math.exp(-Math.pow((t - 0.52) / 0.13, 2)) + rt * 0.05 * Math.exp(-Math.pow((t - 0.93) / 0.1, 2)) - inset;
    if (r <= 0.5) continue;
    ctx.moveTo(px + ox + r, py + oy); ctx.arc(px + ox, py + oy, r, 0, TAU);
  }
}

/** Geometry of the hand for a pose — shared by both layers. */
function handPose(o) {
  const { w: u, grip: G = 0, thumb = null, side = 'right' } = o;
  const mir = side === 'left' ? -1 : 1;
  const press = thumb ? thumb.press || 0 : 0.5;
  // thumb: root just off the near edge, below the grip; tip on the target (or resting along the bezel)
  let B = { x: 0.60 * u, y: G + 0.40 * u };
  const tgt = thumb ? { x: thumb.x * mir, y: thumb.y } : { x: 0.462 * u, y: G - 0.33 * u };
  const L = 0.90 * u;                                        // comfortable full reach, root to tip
  let dx = tgt.x - B.x, dy = tgt.y - B.y, d = Math.hypot(dx, dy) || 1;
  // the whole hand gives a little so the thumb is never folded double or over-stretched
  const dc = clamp(d, L * 0.62, L * 0.99);
  if (dc !== d) { B = { x: tgt.x - (dx / d) * dc, y: tgt.y - (dy / d) * dc }; dx = tgt.x - B.x; dy = tgt.y - B.y; d = dc; }
  // bow the thumb outward (toward the near edge / up) — more when it is drawn in close
  const bow = lerp(0.30, 0.10, invlerp(L * 0.62, L * 0.99, d)) * L;
  const nx = -dy / d, ny = dx / d;                            // left normal of root→tip; pick the side pointing to +x (outside)
  const sgn = nx >= 0 ? 1 : -1;
  const K = { x: B.x + dx * 0.56 + nx * sgn * bow, y: B.y + dy * 0.56 + ny * sgn * bow };
  const fingers = [-0.42, -0.226, -0.034, 0.156].map((k, i) => ({ y: G + k * u, p: [0.096, 0.120, 0.110, 0.080][i] * u, a: [-0.15, -0.09, -0.04, 0.03][i] }));
  return { u, G, mir, B, K, T: tgt, press, fingers, rb: 0.165 * u, rt: 0.090 * u * (1 + 0.06 * press), fr: 0.090 * u };
}

/** One finger coming round the far edge of the device (edge at x = ex): a stub with a soft square end, wrapping a little onto the front. */
function farFingerPath(ctx, ex, f, fr, u, inset = 0) {
  const h = fr - inset, tip = f.p - inset, wrap = 0.034 * u - inset, c = h * 0.82;
  ctx.save(); ctx.translate(ex, f.y); ctx.rotate(-f.a);
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(-tip + c, -h); ctx.bezierCurveTo(-tip - c * 0.2, -h, -tip, -h * 0.5, -tip, 0);
  ctx.bezierCurveTo(-tip, h * 0.5, -tip - c * 0.2, h, -tip + c, h);
  ctx.lineTo(0, h); ctx.bezierCurveTo(wrap * 1.25, h * 0.9, wrap * 1.25, -h * 0.9, 0, -h);
  ctx.closePath(); ctx.restore();
}

/**
 * The holding hand — near-black silhouette shapes. Drawn in DEVICE space: origin at the device centre,
 * +x right, +y down, already rotated with the phone.
 *   o.layer   'back' (palm, wrist — draw before the device) | 'front' (fingers round the far edge, thumb — after)
 *   o.side    'right' | 'left'
 *   o.w, o.h  device size in px
 *   o.grip    device-space y of the middle of the grip
 *   o.thumb   { x, y, press 0..1 } thumb-tip target in device space, or null (resting on the bezel)
 *   o.glow, o.glowAmt   screen light that edges the fingers      o.ink   silhouette colour
 *   o.rim     { color, amt, dx, dy }  key-light rim (thin offset copy toward the light)
 */
export function hand(ctx, o) {
  const lit = globalThis.__RIG_STYLE === 'lit';   // coloured characters: the hand is skin, dim because the screen back-lights it
  const { layer = 'back', glow: glowCol = '#aebfd8', glowAmt = 1, rim = null } = o;
  const ink = lit ? '#6f4830' : (o.ink ?? '#05070b');
  const P = handPose(o), { u, G, mir, B, K, T, press, fingers, fr } = P;
  const edge = -0.5 * u;
  ctx.save();
  if (mir < 0) ctx.scale(-1, 1);
  const rimPass = (draw) => {
    if (rim && rim.amt > 0) {
      ctx.save(); ctx.translate((rim.dx ?? -1) * mir * u * 0.008, (rim.dy ?? -1) * u * 0.008);
      ctx.globalAlpha *= clamp(rim.amt); ctx.fillStyle = rim.color; draw(); ctx.restore();
    }
    ctx.fillStyle = ink; draw();
  };

  if (layer === 'back') {
    rimPass(() => {
      // palm behind the device, the heel of the thumb swelling past the near edge, wrist and forearm leaving frame
      ctx.beginPath();
      ctx.moveTo(-0.34 * u, G + 0.30 * u);
      ctx.bezierCurveTo(-0.40 * u, G + 0.95 * u, -0.10 * u, G + 1.55 * u, 0.20 * u, G + 2.2 * u);
      ctx.bezierCurveTo(0.42 * u, G + 2.7 * u, 0.62 * u, G + 3.4 * u, 0.80 * u, G + 4.6 * u);
      ctx.lineTo(1.95 * u, G + 4.6 * u);
      ctx.bezierCurveTo(1.52 * u, G + 3.1 * u, 1.24 * u, G + 2.0 * u, 1.05 * u, G + 1.25 * u);
      ctx.bezierCurveTo(0.97 * u, G + 0.86 * u, 0.93 * u, G + 0.52 * u, B.x + 0.16 * u, B.y - 0.04 * u);
      ctx.bezierCurveTo(B.x + 0.02 * u, B.y - 0.24 * u, 0.30 * u, G - 0.10 * u, -0.34 * u, G + 0.30 * u);
      ctx.closePath(); ctx.fill();
    });
  } else {
    // fingers coming round the far edge
    rimPass(() => { for (const f of fingers) { farFingerPath(ctx, edge, f, fr, u); ctx.fill(); } });
    if (glowAmt > 0.01) {
      // screen light on the side of each finger that faces the glass, fading outward
      for (const f of fingers) {
        ctx.save();
        farFingerPath(ctx, edge, f, fr, u); ctx.clip();
        ctx.fillStyle = linGrad(ctx, edge + 0.045 * u, 0, edge - f.p * 0.95, 0, [[0, rgba(glowCol, 0.40 * glowAmt)], [0.4, rgba(glowCol, 0.13 * glowAmt)], [1, rgba(glowCol, 0)]]);
        ctx.fillRect(edge - 0.3 * u, f.y - 0.2 * u, 0.5 * u, 0.4 * u);
        ctx.restore();
      }
    }
    // the thumb
    const so = (1 - press) * 0.028 * u;                      // contact shadow under a hovering thumb, tightening as it presses
    fingerPath(ctx, B, K, T, P.rb, P.rt * 1.06, 0, so * 0.7, so);
    ctx.fillStyle = `rgba(0,0,0,${0.20 + 0.14 * press})`; ctx.fill();
    rimPass(() => {
      ctx.beginPath(); ctx.ellipse(B.x + 0.10 * u, B.y + 0.12 * u, 0.26 * u, 0.34 * u, -0.45, 0, TAU); ctx.fill();   // heel of the thumb
      fingerPath(ctx, B, K, T, P.rb, P.rt); ctx.fill();
    });
    if (glowAmt > 0.01) {
      // screen light wrapping the thumb's edge on the side toward the middle of the glass
      const cx = (B.x + T.x) / 2, cy = (B.y + T.y) / 2, l = Math.hypot(cx, cy) || 1;
      const ox = (cx / l) * u * 0.011, oy = (cy / l) * u * 0.011;       // push the unlit core away from the screen centre
      ctx.save();
      fingerPath(ctx, B, K, T, P.rb, P.rt); ctx.clip();
      const steps = [[0, 0.40], [0.0028, 0.30], [0.006, 0.21], [0.0098, 0.14], [0.0142, 0.09], [0.0195, 0.05], [0.026, 0.022], [0.034, 0]];
      for (const [ins, a] of steps) {
        fingerPath(ctx, B, K, T, P.rb, P.rt, ins * u, ox * (ins / 0.034), oy * (ins / 0.034));
        ctx.fillStyle = mixHex(ink, glowCol, clamp(a * glowAmt * (0.8 + 0.2 * press))); ctx.fill();
      }
      // no rim where the thumb grows out of the hand
      ctx.fillStyle = linGrad(ctx, B.x, B.y, lerp(B.x, T.x, 0.5), lerp(B.y, T.y, 0.5), [[0, ink], [0.35, ink], [1, rgba(ink, 0)]]);
      ctx.fillRect(Math.min(B.x, T.x) - u, Math.min(B.y, T.y) - u, Math.abs(B.x - T.x) + 2 * u, Math.abs(B.y - T.y) + 2 * u);
      ctx.beginPath(); ctx.ellipse(B.x + 0.10 * u, B.y + 0.12 * u, 0.25 * u, 0.33 * u, -0.45, 0, TAU); ctx.fillStyle = ink; ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

// ───────────────────────────── light on and around the glass ─────────────────────────────
/** The spill of screen light into the dark around a screen centred at (cx, cy), size sw x sh (px). */
export function screenBloom(ctx, cx, cy, sw, sh, color, amt = 1) {
  if (amt <= 0.003) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const blob = (x, y, r, a, sq = 1) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, sq);
    ctx.fillStyle = radGrad(ctx, 0, 0, 0, r, [[0, rgba(color, a)], [0.35, rgba(color, a * 0.5)], [0.7, rgba(color, a * 0.13)], [1, rgba(color, 0)]]);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.restore();
  };
  blob(cx, cy, sw * 2.3, 0.16 * amt, sh / (sw * 2.1));                      // wide atmosphere
  for (let i = -2; i <= 2; i++) blob(cx, cy + (i * sh) / 5, sw * 1.02, 0.085 * amt);   // close halo hugging the device
  ctx.restore();
}

/** Reflection on the glass. Call inside the screen clip, in screen units. o: {amt, tint, shift(-1..1), env, envAmt} */
export function glassSheen(ctx, sw, sh, o = {}) {
  const { amt = 1, tint = '#cddcf5', shift = 0, env = null, envAmt = 0.1 } = o;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (amt > 0) {
    const off = shift * sw * 0.35;
    // a broad soft diagonal band and a thin one beside it
    let g = ctx.createLinearGradient(off, 0, sw * 1.25 + off, sw * 0.8);
    g.addColorStop(0, rgba(tint, 0)); g.addColorStop(0.30, rgba(tint, 0)); g.addColorStop(0.44, rgba(tint, 0.055 * amt));
    g.addColorStop(0.50, rgba(tint, 0.03 * amt)); g.addColorStop(0.66, rgba(tint, 0.012 * amt)); g.addColorStop(0.8, rgba(tint, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, sw, sh);
    g = ctx.createLinearGradient(off, sh * 0.35, sw * 1.25 + off, sh * 0.35 + sw * 0.8);
    g.addColorStop(0, rgba(tint, 0)); g.addColorStop(0.52, rgba(tint, 0)); g.addColorStop(0.56, rgba(tint, 0.04 * amt)); g.addColorStop(0.60, rgba(tint, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, sw, sh);
  }
  if (env && envAmt > 0) {
    // the sky / room reflected in the upper part of the glass
    const g = ctx.createLinearGradient(0, 0, sw * 0.25, sh * 0.62);
    g.addColorStop(0, rgba(env, envAmt)); g.addColorStop(0.55, rgba(env, envAmt * 0.35)); g.addColorStop(1, rgba(env, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, sw, sh);
  }
  ctx.restore();
}

/**
 * Rain on the glass, in screen units. Beads sit, some crawl down in fits and starts leaving a wet trail,
 * new ones land. o: {n, seed, tint (colour the beads pick up from the street), amt}
 */
export function raindropsOnGlass(ctx, t, sw, sh, o = {}) {
  const { n = 54, seed = 7, tint = '#ffb872', amt = 1 } = o;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const h1 = hash(seed * 131 + i * 7 + 1), h2 = hash(seed * 131 + i * 7 + 2), h3 = hash(seed * 131 + i * 7 + 3), h4 = hash(seed * 131 + i * 7 + 4);
    const big = h3 > 0.72;
    const r = big ? 4.6 + h4 * 4.2 : 1.6 + h4 * 2.6;
    let x = 8 + h1 * (sw - 16), y = h2 * (sh + 60) - 30, trail = 0;
    // new drops land during the shot
    const born = h3 < 0.16 ? h4 * 4.2 : -1;
    if (born > t) continue;
    const grow = born < 0 ? 1 : clamp((t - born) / 0.12);
    if (big) {
      // stick-slip crawl
      const P = 2.2 + h1 * 3.4, tau = t / P + h2 * 5, D = 22 + h4 * 46;
      const fr = tau - Math.floor(tau), slip = ease.inOutQuad(clamp((fr - 0.62) / 0.38));
      const yOff = (Math.floor(tau) + slip) * D;
      trail = slip > 0 && slip < 1 ? D * slip : D * clamp(1 - fr / 0.5) * 0.9;
      y = ((y + yOff + 30) % (sh + 60)) - 30;
      x += Math.sin((y + i * 40) * 0.045) * 1.6;
    }
    const a = amt * grow, rx = r, ry = r * (big ? 1.22 : 1.05);
    if (trail > 1) {
      const g = ctx.createLinearGradient(0, y - trail, 0, y);
      g.addColorStop(0, 'rgba(210,225,245,0)'); g.addColorStop(1, `rgba(210,225,245,${0.11 * a})`);
      ctx.fillStyle = g; ctx.fillRect(x - rx * 0.42, y - trail, rx * 0.84, trail);
    }
    // the bead: darker where it bends the light away, a bright crescent low inside it, a hard specular up-left
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    const g = ctx.createRadialGradient(x - rx * 0.2, y - ry * 0.25, rx * 0.1, x, y, ry);
    g.addColorStop(0, `rgba(8,12,20,${0.34 * a})`); g.addColorStop(0.62, `rgba(8,12,20,${0.22 * a})`); g.addColorStop(1, `rgba(0,0,0,${0.5 * a})`);
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.clip();
    ctx.beginPath(); ctx.ellipse(x + rx * 0.1, y + ry * 0.92, rx * 1.0, ry * 0.8, 0, 0, TAU);
    ctx.fillStyle = rgba(h1 > 0.45 ? tint : '#dfeaff', (big ? 0.5 : 0.36) * a); ctx.fill();
    ctx.restore();
    ctx.fillStyle = `rgba(255,255,255,${(big ? 0.85 : 0.6) * a})`;
    ctx.beginPath(); ctx.ellipse(x - rx * 0.36, y - ry * 0.4, Math.max(0.5, rx * 0.2), Math.max(0.4, ry * 0.13), -0.6, 0, TAU); ctx.fill();
    if (born >= 0 && t - born < 0.3) {
      ctx.strokeStyle = `rgba(220,232,250,${0.3 * (1 - (t - born) / 0.3) * amt})`; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.ellipse(x, y, rx + (t - born) * 26, ry + (t - born) * 26, 0, 0, TAU); ctx.stroke();
    }
  }
  ctx.restore();
}

// ───────────────────────────── UI pieces ─────────────────────────────
/** o: {time, color, battery 0..1, low (bool → red), signal 0..4, wifi (bool), y, alpha, x0, x1, size} */
export function statusBar(ctx, o = {}) {
  const { time = '9:41', color = UI.text, battery = 0.8, low = battery < 0.16, signal = 3, wifi = true, y = 28, alpha = 1, x0 = 30, x1 = SCREEN.W - 28, size = 15.5, family = FONT.sans, weight = 600 } = o;
  ctx.save(); ctx.globalAlpha *= alpha;
  text(ctx, time, x0, y, { size, weight, family, color, tracking: 0.2 });
  // battery
  const bw = 25, bh = 12.5, bx = x1 - bw - 2.5, by = y - bh + 0.5;
  ctx.strokeStyle = rgba(color, 0.55); ctx.lineWidth = 1.1; rr(ctx, bx, by, bw, bh, 3.6); ctx.stroke();
  fillRR(ctx, bx + bw + 1.2, by + 3.6, 2.2, bh - 7.2, 1, rgba(color, 0.55));
  fillRR(ctx, bx + 1.9, by + 1.9, Math.max(2.2, (bw - 3.8) * clamp(battery)), bh - 3.8, 2, low ? C.alert : color);
  // wifi
  let cx = bx - 15;
  if (wifi) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.9; ctx.lineCap = 'round';
    for (let i = 1; i <= 2; i++) { ctx.beginPath(); ctx.arc(cx, y - 1, 3.6 + i * 3.6, -Math.PI * 0.76, -Math.PI * 0.24); ctx.stroke(); }
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, y - 1.6, 1.9, 0, TAU); ctx.fill();
    cx -= 22;
  }
  // signal bars
  for (let i = 0; i < 4; i++) fillRR(ctx, cx - 9 + i * 4.6, y - 3.4 - i * 2.9, 3.1, 3.4 + i * 2.9, 0.9, i < signal ? color : rgba(color, 0.28));
  ctx.restore();
}

function balancedLines(ctx, str, maxW, o) {
  let lines = wrapLines(ctx, str, maxW, o);
  if (lines.length > 1) {
    // narrow the column as far as it goes without adding a line → even line lengths, no orphan words
    let lo = maxW * 0.4, hi = maxW;
    for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; if (wrapLines(ctx, str, mid, o).length <= lines.length) hi = mid; else lo = mid; }
    lines = wrapLines(ctx, str, hi, o);
  }
  return lines;
}
const bubbleDefaults = (o) => ({ size: 21.5, weight: 400, family: FONT.sans, maxW: 318, padX: 15, padY: 11, lineH: (o.size ?? 21.5) * 1.3, ...o });
/** Size of a chat bubble for a text: {w, h, lines}. Same options as bubble(). */
export function bubbleSize(ctx, str, o = {}) {
  const q = bubbleDefaults(o);
  const lines = balancedLines(ctx, str, q.maxW - q.padX * 2, q);
  const tw = Math.max(...lines.map((l) => measure(ctx, l, q)));
  return { w: Math.ceil(tw) + q.padX * 2, h: lines.length * q.lineH + q.padY * 2 - (q.lineH - q.size * 1.18), lines };
}
/**
 * Chat bubble. o: {x, y (top), text, side 'in'|'out' (x is the left edge for 'in', the right edge for 'out'),
 * k (arrival 0..1: fades in, slides up `slide` px, grows from 96%), maxW, size, fill, color, r, tail, alpha, slide}
 * Returns {w, h}.
 */
export function bubble(ctx, o) {
  const q = bubbleDefaults(o);
  const { x = 16, y = 0, side = 'in', k = 1, fill = side === 'in' ? UI.bubbleIn : UI.bubbleOut, color = UI.text, r = 19, tail = true, alpha = 1, slide = 14 } = q;
  const { w, h, lines } = bubbleSize(ctx, q.text, q);
  if (k <= 0) return { w, h };
  const e = ease.outCubic(clamp(k)), x0 = side === 'in' ? x : x - w;
  ctx.save();
  ctx.globalAlpha *= alpha * clamp(k * 1.6);
  const ax = side === 'in' ? x0 : x0 + w, sc = lerp(0.96, 1, e);
  ctx.translate(ax, y + h + (1 - e) * slide); ctx.scale(sc, sc); ctx.translate(-ax, -(y + h));
  fillRR(ctx, x0, y, w, h, Math.min(r, h / 2), fill);
  if (tail) {
    // a small notch at the bottom corner on the sender's side
    ctx.beginPath();
    if (side === 'in') { ctx.moveTo(x0 + 1, y + h - 15); ctx.quadraticCurveTo(x0 + 0.5, y + h - 2, x0 - 6, y + h); ctx.quadraticCurveTo(x0 + 6, y + h + 0.5, x0 + 13, y + h - 5); }
    else { ctx.moveTo(x0 + w - 1, y + h - 15); ctx.quadraticCurveTo(x0 + w - 0.5, y + h - 2, x0 + w + 6, y + h); ctx.quadraticCurveTo(x0 + w - 6, y + h + 0.5, x0 + w - 13, y + h - 5); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  }
  lines.forEach((ln, i) => text(ctx, ln, x0 + q.padX, y + q.padY + q.size * 0.93 + i * q.lineH, { size: q.size, weight: q.weight, family: q.family, color }));
  ctx.restore();
  return { w, h };
}
/** The three-dot typing bubble, top-left at (x, y). o: {k (appear 0..1), fill, color} */
export function typingDots(ctx, x, y, t, o = {}) {
  const { k = 1, fill = UI.bubbleIn, color = UI.text2 } = o;
  if (k <= 0) return;
  const w = 66, h = 40, e = ease.outCubic(clamp(k));
  ctx.save(); ctx.globalAlpha *= clamp(k * 1.5);
  ctx.translate(x, y + h + (1 - e) * 8); ctx.scale(lerp(0.9, 1, e), lerp(0.9, 1, e)); ctx.translate(-x, -(y + h));
  fillRR(ctx, x, y, w, h, h / 2, fill);
  for (let i = 0; i < 3; i++) {
    const ph = (t * 1.25 - i * 0.16) % 1, up = Math.max(0, Math.sin(ph * TAU));
    ctx.fillStyle = rgba(color, 0.45 + 0.55 * up);
    ctx.beginPath(); ctx.arc(x + 19 + i * 14, y + h / 2 - up * 3.2, 4.3, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/**
 * Alert / notification card that drops in from above.
 * o: {x, y, w, k (0 hidden above .. 1 in place), title, body, fill, color, titleSize, size, r, pad, icon 'lock'|'alert'|null}
 * Returns {h, y} (its height and current top).
 */
export function banner(ctx, o) {
  const { x = 8, y = 8, w = SCREEN.W - 16, k = 1, title = '', body = '', fill = UI.redDeep, fill2 = null, color = '#ffffff', titleSize = 22, size = 21, r = 20, pad = 15, icon = 'alert', family = FONT.sans, lineH = size * 1.27 } = o;
  const bo = { size, weight: 400, family };
  const lines = body ? wrapLines(ctx, body, w - pad * 2, bo) : [];
  const h = pad + titleSize * 1.02 + (lines.length ? 9 + lines.length * lineH - (lineH - size) * 0.6 : 0) + pad - 2;
  if (k <= 0) return { h, y: -h };
  const yy = lerp(-h - 24, y, ease.outCubic(clamp(k)));
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.42)'; rr(ctx, x - 2, yy + 5, w + 4, h + 3, r + 2); ctx.fill();      // soft drop shadow
  fillRR(ctx, x, yy, w, h, r, fill2 ? linGrad(ctx, 0, yy, 0, yy + h, [[0, fill], [1, fill2]]) : fill);
  ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; rr(ctx, x + 0.5, yy + 0.5, w - 1, h - 1, r); ctx.stroke();
  let tx = x + pad;
  const ty = yy + pad + titleSize * 0.78;
  if (icon === 'lock') {
    const s = titleSize * 0.9, ix = tx + s * 0.42, iy = ty - s * 0.36;
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.13; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(ix, iy - s * 0.16, s * 0.24, Math.PI, 0); ctx.lineTo(ix + s * 0.24, iy + s * 0.02); ctx.moveTo(ix - s * 0.24, iy - s * 0.16); ctx.lineTo(ix - s * 0.24, iy + s * 0.02); ctx.stroke();
    fillRR(ctx, ix - s * 0.4, iy, s * 0.8, s * 0.6, s * 0.12, color);
    tx += s * 1.12;
  } else if (icon === 'alert') {
    const s = titleSize * 0.92, ix = tx + s * 0.46, iy = ty - s * 0.36;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(ix, iy, s * 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = fill; fillRR(ctx, ix - s * 0.065, iy - s * 0.3, s * 0.13, s * 0.36, s * 0.06, fill);
    ctx.beginPath(); ctx.arc(ix, iy + s * 0.24, s * 0.085, 0, TAU); ctx.fill();
    tx += s * 1.22;
  }
  text(ctx, title, tx, ty, { size: titleSize, weight: 700, family, color, tracking: titleSize * 0.045 });
  lines.forEach((ln, i) => text(ctx, ln, x + pad, ty + 9 + size * 0.95 + i * lineH, { ...bo, color, alpha: 0.94 }));
  ctx.restore();
  return { h, y: yy };
}

/**
 * Bottom sheet. o: {k (0 down .. 1 raised), h (sheet height), sw, sh, fill, scrim (max alpha), r, grabber}
 * draw(ctx, x, y, w, h) draws its contents with (x, y) = the sheet's current top-left.
 */
export function sheet(ctx, o, draw) {
  const { k = 1, h = 200, sw = SCREEN.W, sh = SCREEN.H, fill = UI.surface2, scrim = 0.5, r = 26, grabber = true } = o;
  if (k <= 0) return;
  const e = ease.outCubic(clamp(k)), y = sh - h * e;
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${scrim * clamp(k * 1.4)})`; ctx.fillRect(0, 0, sw, sh);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, 0, y - 5, sw, h + 40, r); ctx.fill();
  fillRR(ctx, 0, y, sw, h + 40, r, fill);
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; rr(ctx, 0.5, y + 0.5, sw - 1, h + 40, r); ctx.stroke();
  if (grabber) fillRR(ctx, sw / 2 - 19, y + 8, 38, 4.5, 2.25, 'rgba(255,255,255,.2)');
  if (draw) draw(ctx, 0, y, sw, h);
  ctx.restore();
}

/**
 * Button. o: {x, y, w, h, label, kind 'solid'|'outline'|'ghost', color, textColor, size, weight, family, tracking, r,
 * press 0..1 (darkens and shrinks a hair), breathe 0..1 (outline/glow intensity for a breathing button), alpha, glow}
 */
export function button(ctx, o) {
  const { x, y, w, h, label = '', kind = 'solid', color = UI.surface2, size = 21.5, weight = 600, family = FONT.sans, tracking = 0, r = 14, press = 0, breathe = 0, alpha = 1, glow: glowAmt = 0 } = o;
  const textColor = o.textColor || (kind === 'solid' ? '#ffffff' : color);
  ctx.save();
  ctx.globalAlpha *= alpha;
  const cx = x + w / 2, cy = y + h / 2, sc = 1 - 0.025 * press;
  ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  if (glowAmt > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [grow, a] of [[14, 0.05], [8, 0.08], [3.5, 0.12]]) { rr(ctx, x - grow, y - grow, w + grow * 2, h + grow * 2, r + grow); ctx.fillStyle = rgba(color, a * glowAmt * (0.55 + 0.45 * breathe)); ctx.fill(); }
    ctx.restore();
  }
  if (kind === 'solid') {
    fillRR(ctx, x, y, w, h, r, color);
    if (press > 0) fillRR(ctx, x, y, w, h, r, `rgba(0,0,0,${0.28 * press})`);
  } else if (kind === 'outline') {
    fillRR(ctx, x, y, w, h, r, rgba(color, 0.07 + 0.11 * breathe + 0.2 * press));
    ctx.strokeStyle = rgba(color, 0.62 + 0.38 * breathe); ctx.lineWidth = 1.3; rr(ctx, x + 0.65, y + 0.65, w - 1.3, h - 1.3, r); ctx.stroke();
  } else if (press > 0) fillRR(ctx, x, y, w, h, r, rgba(color, 0.14 * press));
  text(ctx, label, cx, cy + size * 0.36, { size, weight, family, color: textColor, align: 'center', tracking });
  ctx.restore();
}

/** Check mark that draws itself on. k 0..1. o: {color, lw, ring (bool: a circle draws first), glow} */
export function tick(ctx, x, y, size, k, o = {}) {
  const { color = C.ok, lw = size * 0.13, ring = false, alpha = 1 } = o;
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  let kk = clamp(k);
  if (ring) {
    const kr = clamp(kk / 0.55); kk = clamp((kk - 0.4) / 0.6);
    ctx.save(); ctx.lineWidth = lw * 0.7; ctx.beginPath(); ctx.arc(x, y, size * 0.5, -Math.PI / 2, -Math.PI / 2 + TAU * ease.outCubic(kr)); ctx.stroke(); ctx.restore();
    size *= 0.56;
  }
  const p = [[-0.46, 0.03], [-0.13, 0.34], [0.48, -0.32]].map(([a, b]) => [x + a * size, y + b * size]);
  const l1 = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]), l2 = Math.hypot(p[2][0] - p[1][0], p[2][1] - p[1][1]);
  const d = ease.outCubic(kk) * (l1 + l2);
  if (d > 0) {
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
    const a = Math.min(1, d / l1); ctx.lineTo(lerp(p[0][0], p[1][0], a), lerp(p[0][1], p[1][1], a));
    if (d > l1) { const b = (d - l1) / l2; ctx.lineTo(lerp(p[1][0], p[2][0], b), lerp(p[1][1], p[2][1], b)); }
    ctx.stroke();
  }
  ctx.restore();
}

/** Activity spinner: an arc with a fading tail turning once every `period` s. o: {color, lw, period, alpha} */
export function spinner(ctx, x, y, r, t, o = {}) {
  const { color = UI.text2, lw = Math.max(1.2, r * 0.2), period = 0.9, alpha = 1 } = o;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = lw;
  const a0 = (t / period) * TAU, N = 14;
  for (let i = 0; i < N; i++) {
    ctx.strokeStyle = rgba(color, alpha * Math.pow((i + 1) / N, 1.6));
    ctx.beginPath(); ctx.arc(x, y, r, a0 + (i / N) * TAU * 0.72, a0 + ((i + 1.05) / N) * TAU * 0.72); ctx.stroke();
  }
  ctx.restore();
}

/**
 * Typewriter line with a caret. k 0..1 = how much is typed. Takes the same options as engine.text plus
 * {t (for the blink), caret 'block'|'bar'|false, caretColor, hold (keep the caret blinking after the line is complete)}
 * Alignment is computed from the FULL string so the text does not shuffle while it types. Returns the width typed.
 */
export function typeLine(ctx, str, x, y, k, o = {}) {
  const { t = 0, caret = 'block', hold = false, size = 32, align = 'left', tracking = 0, alpha = 1 } = o;
  const full = measure(ctx, str, o) - tracking;
  const x0 = align === 'center' ? x - full / 2 : align === 'right' ? x - full : x;
  const shown = typeOn(str, k);
  const w = shown ? text(ctx, shown, x0, y, { ...o, align: 'left' }) : 0;
  const typing = k > 0 && k < 1;
  if (caret && alpha > 0 && (typing || (hold && k >= 1 && (t * 1.6) % 1 < 0.55))) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = o.caretColor || o.color || '#fff';
    if (caret === 'block') ctx.fillRect(x0 + w + size * 0.06, y - size * 0.78, size * 0.5, size * 0.94);
    else ctx.fillRect(x0 + w + size * 0.05, y - size * 0.82, Math.max(1.2, size * 0.07), size * 1.02);
    ctx.restore();
  }
  return w;
}

/**
 * Corner brackets that snap onto the rect (x, y, w, h). k 0 = wide open and invisible, 1 = locked on.
 * o: {color, len (arm length), lw, spread (how far out they start), glow (bool), alpha}
 */
export function hudBrackets(ctx, x, y, w, h, k, o = {}) {
  const { color = C.cyan, len = Math.min(w, h) * 0.16, lw = 2, spread = 46, glow: g = true, alpha = 1 } = o;
  if (k <= 0) return;
  const e = ease.outExpo(clamp(k)), s = (1 - e) * spread;
  const x0 = x - s, y0 = y - s, x1 = x + w + s, y1 = y + h + s;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x0, y0 + len); ctx.lineTo(x0, y0); ctx.lineTo(x0 + len, y0);
    ctx.moveTo(x1 - len, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + len);
    ctx.moveTo(x1, y1 - len); ctx.lineTo(x1, y1); ctx.lineTo(x1 - len, y1);
    ctx.moveTo(x0 + len, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - len);
  };
  ctx.save();
  ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
  const a = alpha * clamp(k * 3);
  if (g) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [m, al] of [[5, 0.10], [2.6, 0.18]]) { path(); ctx.strokeStyle = rgba(color, al * a); ctx.lineWidth = lw * m; ctx.stroke(); }
    ctx.restore();
  }
  path(); ctx.strokeStyle = rgba(color, a); ctx.lineWidth = lw; ctx.stroke();
  ctx.restore();
}

/**
 * The Life Optimisation Program's mark: a ring, a vertical axis, and two mirrored arcs facing each other across it
 * (a man and his reflection). Abstract on purpose — no real crest. r = ring radius.
 * o: {color, k (draw-on 0..1), alpha, lw, glow (0..1), ticks (bool: fine outer graduation ring)}
 */
export function emblem(ctx, x, y, r, o = {}) {
  const { color = C.cyan, k = 1, alpha = 1, lw = Math.max(1, r * 0.05), glow: g = 0.5, ticks = true } = o;
  if (k <= 0 || alpha <= 0) return;
  const kRing = ease.inOutCubic(clamp(k / 0.55)), kAxis = ease.outCubic(clamp((k - 0.25) / 0.45)), kArc = ease.outCubic(clamp((k - 0.5) / 0.5));
  const draw = (width, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineCap = 'butt';
    if (kRing > 0) { ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * kRing); ctx.stroke(); }
    if (kAxis > 0) {
      const a = r * 1.34 * kAxis;
      ctx.beginPath(); ctx.moveTo(x, y - a); ctx.lineTo(x, y + a); ctx.stroke();
      if (kAxis > 0.9) { ctx.beginPath(); ctx.moveTo(x - r * 0.1, y - r * 1.34); ctx.lineTo(x + r * 0.1, y - r * 1.34); ctx.moveTo(x - r * 0.1, y + r * 1.34); ctx.lineTo(x + r * 0.1, y + r * 1.34); ctx.stroke(); }
    }
    if (kArc > 0) {
      const R2 = r * 0.74, off = r * 0.98, th = 0.86 * kArc;
      ctx.beginPath(); ctx.arc(x - off, y, R2, -th, th); ctx.stroke();                         // left figure, facing right
      ctx.beginPath(); ctx.arc(x + off, y, R2, Math.PI - th, Math.PI + th); ctx.stroke();     // its mirror image
    }
  };
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (g > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    draw(lw * 5, rgba(color, 0.07 * g)); draw(lw * 2.6, rgba(color, 0.13 * g));
    ctx.restore();
  }
  draw(lw, color);
  if (ticks && kRing > 0) {
    ctx.strokeStyle = rgba(color, 0.45); ctx.lineWidth = Math.max(0.6, lw * 0.5);
    const n = 48, shown = Math.round(n * kRing);
    ctx.beginPath();
    for (let i = 0; i < shown; i++) {
      const a = -Math.PI / 2 + (i / n) * TAU, r0 = r * 1.16, r1 = r * (i % 12 === 0 ? 1.3 : i % 4 === 0 ? 1.25 : 1.21);
      ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
    }
    ctx.stroke();
  }
  if (kArc > 0.6) { ctx.fillStyle = color; ctx.globalAlpha *= clamp((kArc - 0.6) / 0.4); ctx.beginPath(); ctx.arc(x, y, lw * 1.25, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ───────────────────────────── out-of-focus sets ─────────────────────────────
const BW = 2304, BH = 964;      // background canvas (20 % overscan round the 1920 x 804 picture)

function bokehSprite(color) {
  return cached('ui-bokeh-' + color, 160, 160, (c) => {
    const g = c.createRadialGradient(80, 80, 0, 80, 80, 78);
    g.addColorStop(0, rgba(color, 0.52)); g.addColorStop(0.8, rgba(color, 0.56)); g.addColorStop(0.9, rgba(color, 0.8)); g.addColorStop(0.955, rgba(color, 0.5)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fillRect(0, 0, 160, 160);
  });
}
function softBlob(c, x, y, rx, ry, color, a) {
  c.save(); c.translate(x, y); c.scale(1, ry / rx);
  c.fillStyle = radGrad(c, 0, 0, 0, rx, [[0, rgba(color, a)], [0.5, rgba(color, a * 0.45)], [1, rgba(color, 0)]]);
  c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}

const BG_PAINT = {
  bedroomDark(c) {
    c.fillStyle = linGrad(c, 0, 0, 0, BH, [[0, '#070c18'], [0.55, '#0b1324'], [1, '#070b16']]); c.fillRect(0, 0, BW, BH);
    softBlob(c, 380, 330, 900, 640, '#2a4474', 0.40);                        // the window's cold breath, screen left
    softBlob(c, 1960, 420, 760, 560, '#22395f', 0.30);
    c.filter = 'blur(2.5px)';
    c.save(); c.translate(360, 340); c.rotate(-0.07);                        // slats of the blind
    for (let i = 0; i < 10; i++) { c.fillStyle = rgba('#7098dc', 0.50 - Math.abs(i - 4) * 0.035); c.fillRect(-330, -470 + i * 98, 600, 44); }
    c.restore();
    c.filter = 'blur(4.5px)';
    c.save(); c.translate(1960, 430); c.rotate(-0.21);                       // their stripes thrown across the far wall
    for (let i = 0; i < 8; i++) { c.fillStyle = rgba('#4467a8', 0.30 - Math.abs(i - 3.5) * 0.03); c.fillRect(-460, -430 + i * 122, 940, 54); }
    c.restore();
    c.filter = 'blur(16px)';
    c.fillStyle = '#04070e';
    c.beginPath(); c.ellipse(1640, 1030, 980, 300, -0.05, 0, TAU); c.fill();  // the bed, his knees: dark masses low in frame
    c.beginPath(); c.ellipse(240, 1070, 760, 250, 0.08, 0, TAU); c.fill();
    c.filter = 'none';
  },
  rainNight(c) {
    c.fillStyle = linGrad(c, 0, 0, 0, BH, [[0, '#050912'], [0.5, '#0a1424'], [1, '#05080f']]); c.fillRect(0, 0, BW, BH);
    softBlob(c, 640, -40, 1100, 760, '#ffa64d', 0.20);                        // sodium streetlight haze
    softBlob(c, 1900, 300, 800, 520, '#3a5f9c', 0.22);                        // cold city glow, right
    c.filter = 'blur(10px)';
    const R = rng(77);                                                         // wet ground: smeared reflections
    for (let i = 0; i < 16; i++) {
      const x = R() * BW, w = 26 + R() * 60, col = R() < 0.55 ? '#ffa64d' : R() < 0.5 ? '#ffe2b0' : '#8fb0e8';
      c.fillStyle = linGrad(c, 0, 520, 0, BH, [[0, rgba(col, 0)], [0.35, rgba(col, 0.10 + R() * 0.14)], [1, rgba(col, 0.02)]]);
      c.fillRect(x, 520, w, BH - 520);
    }
    c.filter = 'none';
  },
  goldenStreet(c) {
    c.fillStyle = linGrad(c, 0, 0, 0, BH, [[0, '#f4bd62'], [0.42, '#e9a650'], [0.72, '#b97a3c'], [1, '#8a5626']]); c.fillRect(0, 0, BW, BH);
    softBlob(c, 330, -60, 1400, 900, '#fff2cc', 0.85);                        // the low sun, top left
    c.filter = 'blur(13px)';
    c.fillStyle = rgba('#7d4a1f', 0.50); c.fillRect(1500, -40, 420, 560);      // soft masses: buildings across the street
    c.fillStyle = rgba('#8c5727', 0.42); c.fillRect(1960, 40, 420, 500);
    c.fillStyle = rgba('#6c3f1b', 0.36); c.fillRect(1120, 230, 300, 300);
    c.fillStyle = rgba('#fff0c8', 0.34); c.fillRect(-40, 560, BW + 80, 46);    // sunlit kerb line
    c.filter = 'blur(18px)';
    c.fillStyle = rgba('#4f2c10', 0.42);                                        // long morning shadows raking the pavement
    for (const [x, w] of [[260, 150], [980, 90], [1700, 210]]) { c.beginPath(); c.moveTo(x, 640); c.lineTo(x + w, 640); c.lineTo(x + w + 760, BH + 60); c.lineTo(x + 420, BH + 60); c.closePath(); c.fill(); }
    c.filter = 'none';
  },
  kitchenNight(c, o) {
    const lamp = o.lamp ?? 1;
    c.fillStyle = linGrad(c, 0, 0, 0, BH, [[0, mixHex('#05080e', '#0b0806', lamp)], [0.6, mixHex('#080d16', '#120c07', lamp)], [1, mixHex('#04060a', '#070503', lamp)]]); c.fillRect(0, 0, BW, BH);
    softBlob(c, 2050, 300, 760, 560, '#31507f', 0.30 - 0.12 * lamp);          // streetlight through the window, right
    c.filter = 'blur(9px)';
    c.fillStyle = rgba('#5a7fb8', 0.30 - 0.14 * lamp); c.fillRect(1900, 90, 250, 380); c.fillStyle = rgba('#05080e', 0.9); c.fillRect(2018, 80, 16, 400);
    c.filter = 'none';
    if (lamp > 0) {
      softBlob(c, 560, 210, 1100, 800, '#ff9a3d', 0.34 * lamp);               // pendant lamp over the table
      softBlob(c, 560, 150, 300, 260, '#ffd08a', 0.9 * lamp);
      c.filter = 'blur(12px)';
      c.fillStyle = linGrad(c, 0, 690, 0, BH, [[0, rgba('#c98a48', 0.5 * lamp)], [1, rgba('#3a2210', 0.2 * lamp)]]); c.fillRect(-40, 700, 1500, 300);   // lit table top
      c.filter = 'none';
    } else {
      c.filter = 'blur(12px)';
      c.fillStyle = linGrad(c, 0, 700, 0, BH, [[0, rgba('#22344f', 0.55)], [1, rgba('#0a1220', 0.3)]]); c.fillRect(-40, 712, BW + 80, 300);              // table edge in the dark
      c.filter = 'none';
    }
    if (o.lunchbox) {
      c.filter = 'blur(8px)';
      fillRR(c, 300, 600, 300, 190, 30, '#6f1c11'); fillRR(c, 300, 596, 300, 60, 26, '#b3341f'); fillRR(c, 420, 570, 60, 22, 8, '#3a0f09');
      c.fillStyle = rgba('#cfd6de', 0.28); c.save(); c.translate(900, 800); c.rotate(-0.12); c.fillRect(0, 0, 330, 120); c.restore();   // the unopened bill
      c.filter = 'none';
    }
  },
};

const BOKEH = {
  rainNight: () => { const R = rng(311), out = []; for (let i = 0; i < 30; i++) out.push({ x: R() * BW, y: 40 + R() * 600, r: 20 + R() * R() * 74, col: R() < 0.5 ? '#ffa64d' : R() < 0.45 ? '#ffe0b0' : R() < 0.6 ? '#9db8e8' : '#ffc27a', a: 0.10 + R() * 0.22, s: R() * 100 }); return out; },
  goldenStreet: () => { const R = rng(912), out = []; for (let i = 0; i < 22; i++) out.push({ x: R() * BW, y: 20 + R() * 640, r: 18 + R() * R() * 70, col: R() < 0.6 ? '#ffe2ae' : '#ffc97e', a: 0.12 + R() * 0.2, s: R() * 100 }); return out; },
  kitchenNight: () => { const R = rng(51), out = []; for (let i = 0; i < 7; i++) out.push({ x: 1500 + R() * 800, y: 120 + R() * 380, r: 14 + R() * 30, col: R() < 0.5 ? '#8fb0e8' : '#ffc27a', a: 0.06 + R() * 0.1, s: R() * 100 }); return out; },
};
const _bokehCache = {};

/**
 * A soft, out-of-focus suggestion of where we are, filling the picture. kind: 'bedroomDark' | 'rainNight' |
 * 'goldenStreet' | 'kitchenNight'. o: {x, y (parallax shift px), zoom, dim 0..1, lamp 0..1 (kitchen pendant lamp),
 * lunchbox (kitchen: a blurred red lunchbox + the bill on the table), rain 0..1}
 */
export function softBackground(ctx, kind, t = 0, o = {}) {
  const { x = 0, y = 0, zoom = 1, dim = 0, lamp = 1, lunchbox = false, rain = 1 } = o;
  const paint = BG_PAINT[kind] || BG_PAINT.bedroomDark;
  const base = cached(`ui-bg-${kind}-${kind === 'kitchenNight' ? lamp + (lunchbox ? 'L' : '') : ''}`, BW / 4, BH / 4, (c) => { c.scale(0.25, 0.25); paint(c, { lamp, lunchbox }); });
  ctx.save();
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, PW, PH);
  ctx.translate(CX + x, CY + y); ctx.scale(zoom, zoom); ctx.translate(-BW / 2, -BH / 2);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(base, 0, 0, BW, BH);
  const list = BOKEH[kind] ? (_bokehCache[kind] ||= BOKEH[kind]()) : null;
  if (list) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const b of list) {
      const tw = kind === 'rainNight' ? 0.72 + 0.28 * noise1(t * 1.7 + b.s, 3) : 0.9 + 0.1 * noise1(t * 0.6 + b.s, 3);
      const dx = kind === 'goldenStreet' ? wobble(t, 0.12, b.s) * 10 : 0;
      ctx.globalAlpha = b.a * tw * (kind === 'kitchenNight' ? 1 - 0.3 * lamp : 1);
      ctx.drawImage(bokehSprite(b.col), b.x - b.r + dx, b.y - b.r, b.r * 2, b.r * 2);
    }
    ctx.restore();
  }
  if (kind === 'rainNight' && rain > 0) {
    // rain between us and the lights: soft slanted streaks
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const h1 = hash(i * 13 + 5), h2 = hash(i * 13 + 6), h3 = hash(i * 13 + 7);
      const sp = 1.5 + h3 * 1.3, ph = (h2 + t * sp) % 1, len = 60 + h3 * 150;
      const px = h1 * (BW + 200) - 100 - ph * 70, py = ph * (BH + 300) - 150;
      ctx.strokeStyle = rgba(h1 < 0.5 ? '#ffd9a8' : '#c9d8f0', (0.035 + h3 * 0.06) * rain); ctx.lineWidth = 1.5 + h2 * 3.5;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - len * 0.2, py + len); ctx.stroke();
    }
    ctx.restore();
  }
  if (kind === 'goldenStreet') {
    // dust in the low sun
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i++) {
      const h1 = hash(i * 19 + 1), h2 = hash(i * 19 + 2), h3 = hash(i * 19 + 3);
      const px = (h1 * BW + t * (6 + h3 * 14)) % BW, py = h2 * BH * 0.9 + Math.sin(t * (0.3 + h3 * 0.5) + i) * 12;
      ctx.fillStyle = rgba('#fff6dc', 0.10 + 0.22 * h3 * (0.6 + 0.4 * Math.sin(t * 1.3 + i * 2.1)));
      ctx.beginPath(); ctx.arc(px, py, 1.4 + h3 * 3.2, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
  if (dim > 0) { ctx.save(); ctx.fillStyle = `rgba(0,0,0,${clamp(dim)})`; ctx.fillRect(0, 0, PW, PH); ctx.restore(); }
}

// ───────────────────────────── a child's drawing ─────────────────────────────
function crayonStroke(c, R, pts, color, width) {
  // a waxy line: several thin offset passes, broken where the paper's tooth shows through
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let pass = 0; pass < 5; pass++) {
    const ox = (R() - 0.5) * width * 0.7, oy = (R() - 0.5) * width * 0.7;
    c.strokeStyle = rgba(color, 0.34 + R() * 0.3); c.lineWidth = width * (0.34 + R() * 0.3);
    c.beginPath();
    let pen = false;
    for (let i = 0; i < pts.length; i++) {
      const px = pts[i][0] + ox + (R() - 0.5) * width * 0.25, py = pts[i][1] + oy + (R() - 0.5) * width * 0.25;
      if (R() < 0.07) { pen = false; continue; }
      if (!pen) { c.moveTo(px, py); pen = true; } else c.lineTo(px, py);
    }
    c.stroke();
  }
}
const seg2 = (a, b, n = 8, wob = 0, R = null) => { const out = []; for (let i = 0; i <= n; i++) { const k = i / n; out.push([lerp(a[0], b[0], k) + (R ? (R() - 0.5) * wob : 0), lerp(a[1], b[1], k) + (R ? (R() - 0.5) * wob : 0)]); } return out; };
const arcPts = (cx, cy, rx, ry, a0, a1, n = 18, wob = 0, R = null) => { const out = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); out.push([cx + Math.cos(a) * rx + (R ? (R() - 0.5) * wob : 0), cy + Math.sin(a) * ry + (R ? (R() - 0.5) * wob : 0)]); } return out; };
function scribbleFill(c, R, x0, y0, x1, y1, color, width, inside) {
  // a child colouring in: back-and-forth diagonal strokes
  const pts = [];
  const n = Math.round((x1 - x0 + y1 - y0) / (width * 1.5));
  for (let i = 0; i <= n; i++) {
    const k = i / n, d = (x1 - x0 + y1 - y0) * k;
    let ax = x0 + d, ay = y0, bx = x0, by = y0 + d;
    if (ax > x1) { ay += ax - x1; ax = x1; } if (by > y1) { bx += by - y1; by = y1; }
    const A = [ax + (R() - 0.5) * width, ay + (R() - 0.5) * width], B = [bx + (R() - 0.5) * width, by + (R() - 0.5) * width];
    const sub = i % 2 ? seg2(A, B, 6) : seg2(B, A, 6);
    for (const p of sub) if (!inside || inside(p[0], p[1])) pts.push(p);
  }
  if (pts.length > 2) crayonStroke(c, R, pts, color, width);
}

/**
 * A child's crayon drawing of three figures holding hands (a tall one, a small one in the middle, a medium one),
 * on paper. Centre-bottom of the group at (x, y); w = width of the whole drawing. Drawn in a 600-unit design space.
 * o: {paper (colour, or null for no paper), sun (bool), ground (bool), seed}
 */
export function crayonFamily(ctx, x, y, w, o = {}) {
  const { sun = true, ground = true, seed = 2019, hearts = true } = o;
  const sc = w / 600;
  const cv = cached(`ui-crayon-${seed}-${sun}-${ground}-${hearts}`, 1500, 1200, (c) => {
    const R = rng(seed);
    c.scale(2, 2); c.translate(375, 520);               // design origin: centre of the ground line; canvas = 750 x 600 design units
    const fig = (fx, hgt, body, hair, dress) => {
      const headR = hgt * 0.17, headY = -hgt + headR, neck = headY + headR, hip = -hgt * 0.36;
      // legs + feet
      crayonStroke(c, R, seg2([fx - hgt * 0.07, hip], [fx - hgt * 0.11, -2], 8, 2, R), body, 7);
      crayonStroke(c, R, seg2([fx + hgt * 0.07, hip], [fx + hgt * 0.11, -2], 8, 2, R), body, 7);
      crayonStroke(c, R, seg2([fx - hgt * 0.11, -2], [fx - hgt * 0.2, -1], 4, 1, R), body, 7);
      crayonStroke(c, R, seg2([fx + hgt * 0.11, -2], [fx + hgt * 0.2, -1], 4, 1, R), body, 7);
      // body: a triangle dress or a box shirt, coloured in
      if (dress) {
        const A = [fx, neck + 2], B = [fx - hgt * 0.2, hip + hgt * 0.08], Cc = [fx + hgt * 0.2, hip + hgt * 0.08];
        scribbleFill(c, R, B[0], A[1], Cc[0], B[1], dress, 7, (px, py) => { const k = (py - A[1]) / (B[1] - A[1]); return k >= 0 && k <= 1 && Math.abs(px - fx) <= hgt * 0.2 * k + 2; });
        crayonStroke(c, R, [...seg2(A, B, 8, 2, R), ...seg2(B, Cc, 8, 2, R), ...seg2(Cc, A, 8, 2, R)], dress, 6);
      } else {
        const bx0 = fx - hgt * 0.115, bx1 = fx + hgt * 0.115, by0 = neck + 3, by1 = hip + 4;
        scribbleFill(c, R, bx0, by0, bx1, by1, body, 7);
        crayonStroke(c, R, [...seg2([bx0, by0], [bx1, by0], 5, 2, R), ...seg2([bx1, by0], [bx1, by1], 8, 2, R), ...seg2([bx1, by1], [bx0, by1], 5, 2, R), ...seg2([bx0, by1], [bx0, by0], 8, 2, R)], body, 6);
      }
      // head
      crayonStroke(c, R, arcPts(fx, headY, headR, headR * 1.04, -1.4, -1.4 + TAU * 1.06, 26, 2.2, R), '#3d3a45', 6);
      // hair
      if (hair === 'long') { crayonStroke(c, R, arcPts(fx, headY - 2, headR * 1.12, headR * 1.12, Math.PI * 0.98, Math.PI * 2.02, 16, 3, R), '#6a4326', 9); crayonStroke(c, R, seg2([fx - headR * 1.1, headY], [fx - headR * 1.22, headY + headR * 1.5], 6, 3, R), '#6a4326', 9); crayonStroke(c, R, seg2([fx + headR * 1.1, headY], [fx + headR * 1.22, headY + headR * 1.5], 6, 3, R), '#6a4326', 9); }
      else if (hair === 'tuft') { for (let i = -2; i <= 2; i++) crayonStroke(c, R, seg2([fx + i * headR * 0.3, headY - headR * 0.9], [fx + i * headR * 0.42, headY - headR * 1.42], 3, 1.5, R), '#3d3a45', 6); }
      else if (hair === 'pig') { crayonStroke(c, R, arcPts(fx - headR * 1.25, headY - headR * 0.25, headR * 0.34, headR * 0.34, 0, TAU, 10, 2, R), '#6a4326', 7); crayonStroke(c, R, arcPts(fx + headR * 1.25, headY - headR * 0.25, headR * 0.34, headR * 0.34, 0, TAU, 10, 2, R), '#6a4326', 7); crayonStroke(c, R, arcPts(fx, headY - 2, headR * 1.08, headR * 1.08, Math.PI * 1.08, Math.PI * 1.92, 12, 2, R), '#6a4326', 8); }
      // face: two dots and a big smile
      crayonStroke(c, R, [[fx - headR * 0.36, headY - headR * 0.18], [fx - headR * 0.35, headY - headR * 0.1]], '#3d3a45', 6);
      crayonStroke(c, R, [[fx + headR * 0.36, headY - headR * 0.18], [fx + headR * 0.37, headY - headR * 0.1]], '#3d3a45', 6);
      crayonStroke(c, R, arcPts(fx, headY + headR * 0.1, headR * 0.5, headR * 0.44, 0.25, Math.PI - 0.25, 10, 1.2, R), '#b8502c', 5);
      return { shoulderY: neck + hgt * 0.07, handY: neck + hgt * 0.26, half: hgt * 0.115 };
    };
    if (ground) {
      // grass
      const g = []; for (let i = 0; i <= 60; i++) g.push([-330 + i * 11, 6 + (i % 2 ? -9 : 7) + (R() - 0.5) * 6]);
      crayonStroke(c, R, g, '#5d9a48', 9);
    }
    if (sun) {
      scribbleFill(c, R, 196, -470, 276, -390, '#f2b632', 8, (px, py) => Math.hypot(px - 236, py + 430) < 40);
      crayonStroke(c, R, arcPts(236, -430, 42, 42, 0, TAU * 1.05, 22, 3, R), '#f2b632', 7);
      for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + 0.2; crayonStroke(c, R, seg2([236 + Math.cos(a) * 56, -430 + Math.sin(a) * 56], [236 + Math.cos(a) * 86, -430 + Math.sin(a) * 86], 3, 2, R), '#f2b632', 7); }
    }
    const dad = fig(-150, 330, '#3f6fb3', 'tuft', null);
    const kid = fig(0, 200, '#3d3a45', 'pig', '#e58a2e');
    const mum = fig(150, 300, '#3d3a45', 'long', '#8c5fb0');
    // arms: outer arms hang out, inner arms reach down to the child's hands
    const arm = (a, b, col) => crayonStroke(c, R, seg2(a, b, 8, 2.5, R), col, 7);
    const kidHandL = [-52, -200 * 0.52], kidHandR = [52, -200 * 0.52];
    arm([-150 - dad.half, -330 + 330 * 0.42], [-150 - 330 * 0.24, -330 + 330 * 0.6], '#3f6fb3');
    arm([-150 + dad.half, -330 + 330 * 0.42], kidHandL, '#3f6fb3');
    arm([0 - 200 * 0.1, -200 + 200 * 0.44], kidHandL, '#e58a2e');
    arm([0 + 200 * 0.1, -200 + 200 * 0.44], kidHandR, '#e58a2e');
    arm([150 - mum.half * 0.6, -300 + 300 * 0.42], kidHandR, '#8c5fb0');
    arm([150 + mum.half * 0.6, -300 + 300 * 0.42], [150 + 300 * 0.25, -300 + 300 * 0.6], '#8c5fb0');
    if (hearts) {
      const heart = (hx, hy, s) => { const p = []; for (let i = 0; i <= 22; i++) { const a = (i / 22) * TAU; p.push([hx + s * 16 * Math.pow(Math.sin(a), 3) / 16, hy - s * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16]); } crayonStroke(c, R, p, '#e58a2e', 6); };
      heart(-78, -262, 22); heart(74, -252, 17);
    }
  });
  ctx.save();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cv, x - 375 * sc, y - 520 * sc, 750 * sc, 600 * sc);
  ctx.restore();
}
