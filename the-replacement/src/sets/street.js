// ════════════════════════════════════════════════════════════════════════════════════════════
// SET MODULE "street" — four locations.  Read this header; you should not need the code below.
// ════════════════════════════════════════════════════════════════════════════════════════════
//
// Every location is an object { W, floorY, anchors, lights, back(ctx,F,o), mid(ctx,F,o), front(ctx,F,o) }.
// Call order in a shot:
//     set.back(ctx, F, o);    // everything behind the people
//     …background people…     // (only homeStreet has a background staging position: the doorway)
//     set.mid(ctx, F, o);     // things between background and foreground people (no-op where unused)
//     …main characters…       // camera(ctx, o.cam, 1, () => …) in WORLD coordinates
//     set.front(ctx, F, o);   // foreground objects, bloom, haze
// o = { look, cam: {x,y,zoom,rot}, t, ...state }.  cam defaults to identity {x:960,y:402,zoom:1}; t defaults
// to F.t and only drives ambient life (traffic, smoke, rain, flicker). All state values are plain numbers.
// `look` is accepted but each location supports exactly one look, listed below.
//
// PERSPECTIVE CONVENTION used by all four sets: horizon at y = 430; an object at parallax depth d is drawn
// at scale d with its ground contact at y = 430 + 270·d  (so d = 1 → y = 700, the floor line).
// An anchor that is not on the subject plane carries {depth, scale}: draw that character inside
// camera(ctx, cam, anchor.depth, …) at (anchor.x, anchor.y) scaled by anchor.scale.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// 1. roadside — shot a1_08 — look: 'dusk'
//    The hard shoulder of a busy road at dusk, side-on. Adam's tired hatchback (facing right, hood up)
//    sits left of centre; crash barrier, traffic streaks, lamp posts and a hazy skyline behind.
//    W 1920 (painted from about x −700 to 2700, so the camera may pan ±500).
//    state   smoke  0..1  (default 1)   amount of steam/smoke pouring from the engine bay
//            shake  0..1  (default 0)   the engine's dying cough: body shudder, headlamp flicker, exhaust puff
//            lamps  0..1  (default 1)   sodium lamp posts (they stutter on by themselves from o.t)
//            hazard 0..1  (default 0)   hazard flashers on the car (amber, blink from o.t) — off unless wanted
//    anchors roof      (752, 348)   where the lunchbox sits on the car roof (its base rests on this point)
//            adam      (905, 700)   Adam beside the driver's door, facing right toward the steaming engine;
//                                   his head stands clear above the roof against the sky
//            adamClear (1330, 700)  alternative: standing clear of the nose, sky and traffic behind him
//            engine    (1085, 470)  mouth of the engine bay (the smoke source)
//            hoodTip   (1139, 316)  raised front edge of the hood
//            chip      (1440, 235)  a calm patch of sky for the floating notification chip (its centre)
//            exit      (2060, 700)  off-screen right
//    helper  roadside.carPose(o, t) → {dx, dy, rot, px, py}: the body shudder for this frame. To make the
//            lunchbox shake with the roof: translate(px,py) rotate(rot) translate(-px+dx,-py+dy) before drawing it.
//    light   dusk: key '#ff9d5c' from the right (+1), amount 0.6
//    framing master: identity, slow push to zoom 1.06 on (1000, 420).  Lunchbox grab: {x: 860, y: 420, zoom: 2}.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// 2. cityRun — shot a2_04 — look: 'greyMorning'
//    A long city pavement under an overcast sky for a side tracking shot. The camera stands on the shop side
//    of the pavement and looks across it: behind the runner are the kerb with parked cars, scooters, lamp
//    posts, street trees and a bus stop, then the road, then the far pavement with shopfronts (awnings,
//    blank signs, doorways), buildings above them and hazy towers beyond. In front of him (out of focus):
//    bollards, railings, colonnade posts and two passing pedestrians.
//    W 7200 (content continues from x −1500 to 8700; a 3.8 s run at 1400 px/s fits with room to spare).
//    state   peds   0..1  (default 1)   opacity of the blurred foreground pedestrians
//            fg     0..1  (default 1)   opacity of the whole foreground layer (bollards, railings, posts)
//            traffic 0..1 (default 1)   the few moving vehicles on the road
//    anchors pavement  y = 700 for every x  (anchors.line = {x0: -1500, x1: 8700, y: 700})
//            start     (400, 700)    a good place to begin the run
//            end       (6000, 700)   a good place to end it
//            busStop   (2620, 700)   the bus shelter stands on the kerb just behind this spot
//            crossing1 (1210, 700)   first side-street opening (bright gap: sky and far towers)
//            crossing2 (4360, 700)   second side-street opening
//    light   greyMorning: key '#cfdcee' from the right (+1), amount 0.35 (soft, overcast)
//    framing track {x: adamX + 140, y: 402, zoom: 1}; for a wider feel {y: 372, zoom: 0.9}.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// 3. homeStreet — shots a7_04, a7_06, a7_09 (background), a7_10, a7_12, a7_13 — look: 'golden'
//    (filled in below, see the homeStreet section of this header)
//
// 4. carInterior — the video in a7_07 — look: 'rainNight'
//    (filled in below, see the carInterior section of this header)
// ════════════════════════════════════════════════════════════════════════════════════════════
import {
  PW, PH, CX, CY, TAU, clamp, lerp, invlerp, ease, hash, rng, noise1, wobble, rgba, mixHex, rr, fillRR,
  linGrad, radGrad, glow, lightCone, fog, cached, camera,
} from '../engine.js';
import { LOOK } from '../style.js';

// ───────────────────────── shared geometry ─────────────────────────
const HY = 430, FY = 700;
/** Screen y of the ground at parallax depth d. */
const gy = (d) => HY + (FY - HY) * d;
/** Layer x (inside camera(…, d, …)) of the true world position X. */
const lx = (X, d) => CX + (X - CX) * d;
const camOf = (o) => { const c = (o && o.cam) || {}; return { x: c.x ?? CX, y: c.y ?? CY, zoom: c.zoom ?? 1, rot: c.rot ?? 0 }; };
/** Visible rectangle, in layer coordinates, of a layer at depth d. */
function view(cam, d, pad = 0) {
  const z = Math.max(0.05, 1 + (cam.zoom - 1) * d), cx = CX + (cam.x - CX) * d, cy = CY + (cam.y - CY) * d;
  const hw = CX / z + pad + 30, hh = CY / z + pad + 30;
  return { x0: cx - hw, x1: cx + hw, y0: cy - hh, y1: cy + hh, z };
}
/** Picture-space position of a layer point (for polygons whose corners sit at different depths). */
function proj(cam, xl, yl, d) {
  const z = 1 + (cam.zoom - 1) * d;
  let px = z * ((xl - CX) - (cam.x - CX) * d), py = z * ((yl - CY) - (cam.y - CY) * d);
  if (cam.rot) { const a = cam.rot * d, c = Math.cos(a), s = Math.sin(a); [px, py] = [px * c - py * s, px * s + py * c]; }
  return [CX + px, CY + py];
}
/** Picture-space position of the ground point at true world X and depth d (h = height above ground, world px). */
const gp = (cam, X, d, h = 0) => proj(cam, lx(X, d), gy(d) - h * d, d);
const mod = (a, n) => ((a % n) + n) % n;
function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }

// ───────────────────────── cached far layers ─────────────────────────
/** A strip of city blocks (bottom of the canvas = their base). Soft, far, cached. */
function cityStrip(key, w, h, p) {
  return cached(key, w, h, (c) => {
    const r = rng(p.seed);
    let x = -30;
    while (x < w + 30) {
      const bw = p.minW + r() * (p.maxW - p.minW);
      const bh = p.minH + Math.pow(r(), p.pow || 1.6) * (p.maxH - p.minH);
      const top = h - bh;
      const col = mixHex(p.color, p.color2 || p.color, r() * 0.6);
      const body = linGrad(c, 0, top, 0, h, [[0, col], [1, mixHex(col, p.haze, p.hazeK ?? 0.6)]]);
      c.fillStyle = body;
      c.fillRect(x, top, bw, bh);
      const kind = r();
      if (kind < 0.25) {
        const tw = bw * (0.35 + r() * 0.3), th = bh * (0.1 + r() * 0.22), tx = x + (bw - tw) * r();
        c.fillRect(tx, top - th, tw, th + 1);
        if (r() < 0.6) c.fillRect(tx + tw * 0.5 - 1, top - th - 12 - r() * 34, 2, 50);
      } else if (kind < 0.42) {
        c.fillRect(x + bw * 0.18, top - 6, bw * 0.24, 7); c.fillRect(x + bw * 0.62, top - 11, bw * 0.16, 12);
      } else if (kind < 0.5 && p.gables) {
        c.beginPath(); c.moveTo(x, top + 1); c.lineTo(x + bw * 0.5, top - bw * 0.2); c.lineTo(x + bw, top + 1); c.fill();
      }
      if (p.win) {
        const q = p.win;
        for (let wy = top + q.gy * 0.6; wy < h - q.gy; wy += q.gy) {
          for (let wx = x + q.gx * 0.5; wx < x + bw - q.w - 2; wx += q.gx) {
            const v = r();
            if (v < q.lit) { c.fillStyle = rgba(q.color, q.alpha * (0.45 + r() * 0.55)); c.fillRect(wx, wy, q.w, q.h); }
            else if (v < q.lit + (q.dark || 0)) { c.fillStyle = rgba(q.darkColor || '#000000', q.darkAlpha || 0.1); c.fillRect(wx, wy, q.w, q.h); }
          }
        }
      }
      x += bw + (r() < (p.gapP ?? 0.3) ? r() * (p.gap ?? 30) : -r() * 6);
    }
  });
}

// ───────────────────────── vehicles (side view, vector) ─────────────────────────
// Local frame of every vehicle: x 0 = rear bumper … L = nose (facing +x); y 0 = ground, up is negative.
const CAR = {
  hatch: { L: 892, H: 352, wr: 66, xr: 150, xf: 728, belt: 246, beltR: 250, roofR: 132, roofF: 504, cowl: 656, hoodEnd: 848, noseH: 212, bump: 152, sill: 56, xB: 388, hatch: 1 },
  sedan: { L: 1060, H: 340, wr: 66, xr: 196, xf: 850, belt: 238, beltR: 244, roofR: 330, roofF: 610, cowl: 760, hoodEnd: 1010, noseH: 196, bump: 146, sill: 54, xB: 520, deck: 150, deckH: 232 },
  van:   { L: 1120, H: 470, wr: 70, xr: 200, xf: 900, belt: 290, beltR: 290, roofR: 60, roofF: 860, cowl: 966, hoodEnd: 1086, noseH: 250, bump: 160, sill: 58, xB: 640, hatch: 1, van: 1 },
  suv:   { L: 1040, H: 408, wr: 76, xr: 178, xf: 830, belt: 280, beltR: 284, roofR: 120, roofF: 600, cowl: 742, hoodEnd: 990, noseH: 250, bump: 176, sill: 76, xB: 470, hatch: 1 },
};

function carBodyPath(c, P) {
  const { L, H, wr, xr, xf, belt, beltR, roofR, roofF, cowl, hoodEnd, noseH, bump, sill } = P;
  const ar = wr + 13, a0 = Math.asin(clamp((wr - sill) / ar, -1, 1));
  c.moveTo(26, -sill - 6);
  c.quadraticCurveTo(2, -sill - 8, 2, -sill - 30);
  c.lineTo(2, -bump + 8); c.quadraticCurveTo(2, -bump, 12, -bump - 2);
  if (P.deck) {
    c.lineTo(10, -P.deckH + 16); c.quadraticCurveTo(10, -P.deckH, 30, -P.deckH - 4);
    c.lineTo(P.deck, -beltR - 2);
    c.quadraticCurveTo(P.deck + 24, -beltR - 6, P.deck + 44, -beltR - 30);
    c.lineTo(roofR - 34, -H + 18);
  } else if (P.van) {
    c.lineTo(10, -H + 40); c.quadraticCurveTo(10, -H + 6, roofR - 10, -H + 2);
  } else {
    c.lineTo(15, -beltR + 12); c.quadraticCurveTo(15, -beltR - 4, 25, -beltR - 16);
    c.lineTo(roofR - 36, -H + 18);
  }
  c.quadraticCurveTo(roofR - 22, -H + 3, roofR, -H);
  c.quadraticCurveTo((roofR + roofF) / 2, -H - 6, roofF, -H + 1);
  c.quadraticCurveTo(roofF + 26, -H + 3, roofF + 44, -H + 17);
  c.lineTo(cowl - 8, -belt - 4); c.lineTo(cowl + 4, -belt + 2);
  c.quadraticCurveTo((cowl + hoodEnd) / 2, -(belt + noseH) / 2 - 12, hoodEnd, -noseH);
  c.quadraticCurveTo(L - 12, -noseH + 5, L - 7, -noseH + 26);
  c.lineTo(L - 4, -bump - 6); c.lineTo(L, -bump); c.lineTo(L, -sill - 34);
  c.quadraticCurveTo(L, -sill - 10, L - 16, -sill - 8); c.lineTo(L - 34, -sill - 6);
  c.lineTo(xf + ar * Math.cos(a0), -sill);
  c.arc(xf, -wr, ar, a0, Math.PI - a0, true);
  c.lineTo(xr + ar * Math.cos(a0), -sill);
  c.arc(xr, -wr, ar, a0, Math.PI - a0, true);
  c.closePath();
}
/** Window openings: returns an array of polygons. */
function carWindows(P) {
  const { H, belt, beltR, roofR, roofF, cowl, xB } = P, top = -H + 21, out = [];
  const fTopX = roofF + 30, fBotX = cowl - 30;
  // front door glass
  out.push([[xB + 9, -belt - 7], [xB + 9, top], [fTopX - 8, top], [fBotX, -belt - 7]]);
  if (P.van) {
    out.push([[40, -beltR - 7], [40, top + 6], [xB - 9, top], [xB - 9, -belt - 7]]);
  } else if (P.deck) {
    const rTop = roofR + 6, rBot = P.deck + 62;
    out.push([[rBot, -beltR - 7], [rTop, top], [xB - 9, top], [xB - 9, -belt - 7]]);
  } else {
    const rTop = roofR + 2, rBot = 62, xC = (roofR + xB) / 2 + 6;
    out.push([[xC + 8, -beltR - 7], [xC + 8, top], [xB - 9, top], [xB - 9, -belt - 7]]);
    const k = (xC - 8 - rBot) / (rTop + 44 - rBot);        // quarter glass
    out.push([[rBot + 26, -beltR - 7], [lerp(rBot + 26, rTop + 40, 1), top + 2], [xC - 8, top], [xC - 8, -beltR - 7]]);
  }
  return out;
}
function wheel(c, x, r, pal, bare) {
  c.fillStyle = pal.tyre; c.beginPath(); c.arc(x, -r, r, 0, TAU); c.fill();
  c.strokeStyle = rgba(pal.light, 0.16); c.lineWidth = r * 0.05; c.beginPath(); c.arc(x, -r, r * 0.9, -2.5, -0.7); c.stroke();
  if (bare) {
    c.fillStyle = mixHex(pal.tyre, pal.cap, 0.22); c.beginPath(); c.arc(x, -r, r * 0.6, 0, TAU); c.fill();
    c.fillStyle = pal.tyre;
    for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + 0.3; c.beginPath(); c.arc(x + Math.cos(a) * r * 0.38, -r + Math.sin(a) * r * 0.38, r * 0.085, 0, TAU); c.fill(); }
    c.fillStyle = mixHex(pal.tyre, pal.cap, 0.4); c.beginPath(); c.arc(x, -r, r * 0.17, 0, TAU); c.fill();
  } else {
    c.fillStyle = pal.cap; c.beginPath(); c.arc(x, -r, r * 0.61, 0, TAU); c.fill();
    c.fillStyle = mixHex(pal.cap, pal.tyre, 0.72);
    for (let k = 0; k < 8; k++) {
      const a = k * TAU / 8 + 0.2;
      c.save(); c.translate(x + Math.cos(a) * r * 0.4, -r + Math.sin(a) * r * 0.4); c.rotate(a);
      rr(c, -r * 0.13, -r * 0.055, r * 0.26, r * 0.11, r * 0.05); c.fill(); c.restore();
    }
    c.fillStyle = mixHex(pal.cap, pal.light, 0.25); c.beginPath(); c.arc(x, -r, r * 0.15, 0, TAU); c.fill();
    c.strokeStyle = rgba(pal.light, 0.35); c.lineWidth = r * 0.035; c.beginPath(); c.arc(x, -r, r * 0.59, -2.3, -0.9); c.stroke();
  }
}
/**
 * Draw a car in its local frame (caller translates/scales). pal: {body, dark, light, glass, glassA, tyre, cap, trim, rimA}
 * opt: {detail 0..2, hood 0..1 (open), lampOn 0..1, hazard 0..1, bareFront, seats}
 */
function drawCar(c, P, pal, opt = {}) {
  const { L, H, wr, xr, xf, belt, beltR, roofR, roofF, cowl, hoodEnd, noseH, bump, sill, xB } = P;
  const detail = opt.detail ?? 1;
  const wins = carWindows(P);
  // interior seen through the glass (dark seat shapes)
  if (detail > 0) {
    c.save();
    c.beginPath(); for (const w of wins) { c.moveTo(w[0][0], w[0][1]); for (let i = 1; i < w.length; i++) c.lineTo(w[i][0], w[i][1]); c.closePath(); }
    c.clip();
    c.fillStyle = rgba(pal.glass, pal.glassA); c.fillRect(0, -H - 10, L, H);
    c.fillStyle = rgba(pal.inside || '#0a0a14', 0.82);
    const seat = (sx) => {
      c.beginPath(); c.moveTo(sx - 26, -belt + 30); c.lineTo(sx - 54, -belt - 52); c.quadraticCurveTo(sx - 58, -belt - 70, sx - 40, -belt - 70);
      c.lineTo(sx - 18, -belt - 68); c.quadraticCurveTo(sx - 4, -belt - 66, sx + 2, -belt - 50); c.lineTo(sx + 26, -belt + 30); c.closePath(); c.fill();
      c.fillRect(sx - 43, -belt - 80, 4, 14); c.fillRect(sx - 29, -belt - 80, 4, 14);
      fillRR(c, sx - 56, -belt - 106, 40, 30, 10, c.fillStyle);
    };
    seat(xB + 44); if (!P.van) seat(xB - 150);
    // steering wheel + dash top
    c.beginPath(); c.ellipse(cowl - 96, -belt - 14, 9, 30, 0.42, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(cowl - 86, -belt + 10); c.quadraticCurveTo(cowl - 60, -belt - 22, cowl - 20, -belt - 12); c.lineTo(cowl, -belt + 10); c.fill();
    // far-side pillar hints
    c.fillStyle = rgba(pal.inside || '#0a0a14', 0.5); c.fillRect(xB - 22, -H, 12, H - belt);
    // glass reflection streaks
    c.fillStyle = rgba(pal.light, 0.10);
    for (const sx of [xB + 70, xB + 120, xB - 130]) { c.beginPath(); c.moveTo(sx, -H); c.lineTo(sx + 26, -H); c.lineTo(sx - 60, -belt); c.lineTo(sx - 86, -belt); c.fill(); }
    c.restore();
  }
  // wheel wells
  c.fillStyle = pal.tyre;
  c.beginPath(); c.arc(xf, -wr, wr + 13, Math.PI, TAU); c.arc(xr, -wr, wr + 13, Math.PI, TAU); c.fill();
  c.fillRect(xr, -sill - 8, xf - xr, 14);
  // body
  c.beginPath(); carBodyPath(c, P);
  for (const w of wins) { c.moveTo(w[0][0], w[0][1]); for (let i = 1; i < w.length; i++) c.lineTo(w[i][0], w[i][1]); c.closePath(); }
  c.fillStyle = linGrad(c, 0, -H, 0, -sill, [
    [0, mixHex(pal.body, pal.light, 0.34)], [0.07, mixHex(pal.body, pal.light, 0.12)], [(H - belt) / (H - sill) - 0.01, pal.body],
    [(H - belt) / (H - sill) + 0.02, mixHex(pal.body, pal.light, 0.16)], [(H - belt) / (H - sill) + 0.12, mixHex(pal.body, pal.dark, 0.1)],
    [0.8, mixHex(pal.body, pal.dark, 0.45)], [1, mixHex(pal.body, pal.dark, 0.8)]]);
  c.fill('evenodd');
  // bumpers & trim
  c.fillStyle = pal.trim;
  c.beginPath(); c.moveTo(L - 62, -bump + 2); c.lineTo(L - 3, -bump - 4); c.lineTo(L, -bump); c.lineTo(L, -sill - 34); c.quadraticCurveTo(L, -sill - 10, L - 16, -sill - 8); c.lineTo(L - 34, -sill - 6); c.lineTo(xf + wr + 12, -sill - 6); c.lineTo(xf + wr + 13, -sill - 30); c.lineTo(L - 62, -sill - 40); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(2, -bump + 8); c.quadraticCurveTo(2, -bump, 12, -bump - 2); c.lineTo(58, -bump + 6); c.lineTo(58, -sill - 40); c.lineTo(xr - wr - 12, -sill - 30); c.lineTo(xr - wr - 12, -sill - 6); c.lineTo(26, -sill - 6); c.quadraticCurveTo(2, -sill - 8, 2, -sill - 30); c.closePath(); c.fill();
  if (detail > 0) {
    // rubbing strip
    c.fillStyle = rgba(pal.trim, 0.9); c.fillRect(xr + wr + 20, -bump - 2, xf - xr - 2 * wr - 40, 9);
    // shut lines
    c.strokeStyle = rgba(pal.dark, 0.55); c.lineWidth = 2.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(xB, -belt - 4); c.lineTo(xB, -sill - 4); c.stroke();
    c.beginPath(); c.moveTo(cowl - 26, -belt - 4); c.lineTo(cowl - 30, -bump - 40); c.quadraticCurveTo(cowl - 34, -sill - 20, cowl - 60, -sill - 4); c.stroke();
    if (!P.van) { const xD = xr + wr + 44; c.beginPath(); c.moveTo(xD, -beltR - 4); c.lineTo(xD - 2, -bump - 46); c.quadraticCurveTo(xD - 6, -wr - 54, xr + wr + 14, -wr - 22); c.stroke(); }
    c.beginPath(); c.moveTo(cowl + 6, -belt + 3); c.quadraticCurveTo((cowl + hoodEnd) / 2, -(belt + noseH) / 2 - 10, hoodEnd + 2, -noseH + 2); c.stroke();   // hood/fender seam
    // handles
    c.fillStyle = rgba(pal.dark, 0.7); fillRR(c, xB + 22, -belt + 20, 44, 11, 5, c.fillStyle);
    if (!P.van) fillRR(c, xB - 190, -belt + 20, 44, 11, 5, c.fillStyle);
    // mirror
    c.fillStyle = mixHex(pal.body, pal.dark, 0.55); c.beginPath(); c.ellipse(cowl - 34, -belt - 12, 20, 13, -0.15, 0, TAU); c.fill();
    c.fillStyle = rgba(pal.light, 0.25); c.beginPath(); c.ellipse(cowl - 36, -belt - 17, 13, 4, -0.15, 0, TAU); c.fill();
    // lamps
    c.fillStyle = pal.lens || mixHex(pal.body, pal.light, 0.3); c.beginPath(); c.moveTo(L - 50, -noseH + 12); c.lineTo(L - 8, -noseH + 26); c.lineTo(L - 5, -bump - 10); c.lineTo(L - 54, -bump - 14); c.closePath(); c.fill();
    c.fillStyle = rgba(pal.dark, 0.5); c.fillRect(L - 54, -bump - 14, 50, 4);
    c.fillStyle = pal.tail || mixHex(pal.dark, '#5a3040', 0.5); c.beginPath(); c.moveTo(13, -beltR + 8); c.lineTo(34, -beltR + 4); c.lineTo(36, -bump - 14); c.lineTo(11, -bump - 8); c.closePath(); c.fill();
  }
  // wheels
  wheel(c, xr, wr, pal, false); wheel(c, xf, wr, pal, !!opt.bareFront);
  // rim light along the top edges
  if (pal.rimA > 0) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(pal.rim || pal.light, pal.rimA); c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    if (P.van) c.moveTo(20, -H + 14); else if (P.deck) { c.moveTo(34, -P.deckH - 5); c.lineTo(P.deck, -beltR - 3); c.moveTo(roofR - 20, -H + 5); } else c.moveTo(roofR - 30, -H + 12);
    c.quadraticCurveTo(roofR - 12, -H + 1, roofR, -H - 1);
    c.quadraticCurveTo((roofR + roofF) / 2, -H - 7, roofF, -H);
    c.quadraticCurveTo(roofF + 26, -H + 2, roofF + 44, -H + 16);
    c.lineTo(cowl - 8, -belt - 5);
    c.stroke();
    if (!(opt.hood > 0)) { c.beginPath(); c.moveTo(cowl + 6, -belt + 1); c.quadraticCurveTo((cowl + hoodEnd) / 2, -(belt + noseH) / 2 - 13, hoodEnd, -noseH - 1); c.quadraticCurveTo(L - 12, -noseH + 4, L - 7, -noseH + 22); c.stroke(); }
    c.restore();
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// 1. ROADSIDE
// ════════════════════════════════════════════════════════════════════════════════════════════
const RS = { carX: 300, engX: 1085, engY: 470 };
const RS_PAL = {
  body: '#565a86', dark: '#191a34', light: '#ffb98a', glass: '#f0a070', glassA: 0.10, tyre: '#0c0c18', cap: '#6a6c92', trim: '#22233f',
  rim: '#ff9d5c', rimA: 0.55, inside: '#0b0b18', tail: '#3a2c48',
};

function rsSky() {
  return cached('rs-sky', PW, PH, (c) => {
    c.fillStyle = linGrad(c, 0, 0, 0, 600, [
      [0, '#141c42'], [0.22, '#1f2b58'], [0.45, '#4a3d6d'], [0.62, '#93566c'], [0.78, '#d9704f'], [0.9, '#f2975a'], [1, '#f8b872']]);
    c.fillRect(0, 0, PW, PH);
    // afterglow where the sun went down (right of centre)
    c.save(); c.globalCompositeOperation = 'lighter';
    c.translate(1290, 575); c.scale(1, 0.42);
    c.fillStyle = radGrad(c, 0, 0, 0, 900, [[0, 'rgba(255,214,150,0.75)'], [0.25, 'rgba(255,170,100,0.38)'], [0.6, 'rgba(255,120,80,0.12)'], [1, 'rgba(255,120,80,0)']]);
    c.beginPath(); c.arc(0, 0, 900, 0, TAU); c.fill();
    c.restore();
    // long stratus bars, dark on top, lit from below
    const r = rng(41);
    c.save(); c.filter = 'blur(5px)';
    for (let i = 0; i < 16; i++) {
      const x = r() * PW, y = 250 + Math.pow(r(), 0.8) * 250, w = 240 + r() * 620, h = 5 + r() * 12;
      const k = invlerp(250, 500, y);
      c.fillStyle = rgba(mixHex('#3a3466', '#7a4a66', k), 0.5 - k * 0.15);
      c.beginPath(); c.ellipse(x, y, w / 2, h, 0, 0, TAU); c.fill();
      c.fillStyle = rgba(mixHex('#ff8f6a', '#ffc27a', k), 0.34 + k * 0.2);
      c.beginPath(); c.ellipse(x + 20, y + h * 0.9, w * 0.44, h * 0.5, 0, 0, TAU); c.fill();
    }
    c.restore();
  });
}

function rsTraffic(ctx, t, y, dir, speed, n, seed, s, v) {
  const span = 5600;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const h1 = hash(seed * 131 + i * 7), h2 = hash(seed * 57 + i * 13 + 1), h3 = hash(seed * 11 + i * 29 + 2);
    const vel = speed * (0.78 + h2 * 0.5);
    const x = mod((i + h1 * 0.7) / n * span + dir * vel * t, span) - 1800;
    if (x < v.x0 - 900 || x > v.x1 + 900) continue;
    const truck = h3 > 0.78, len = (truck ? 330 : 160) * s, ht = (truck ? 120 : 54) * s;
    const xl = x + dir * len / 2, xt = x - dir * len / 2, yy = y + (h2 - 0.5) * 8 * s;
    // the vehicle itself: a dark smear
    ctx.globalCompositeOperation = 'source-over';
    const bx0 = Math.min(xt - dir * 120 * s, xl + dir * 24 * s);
    ctx.fillStyle = linGrad(ctx, xt - dir * 120 * s, 0, xl + dir * 24 * s, 0, [[0, 'rgba(20,17,40,0)'], [0.4, 'rgba(20,17,40,0.6)'], [0.9, 'rgba(20,17,40,0.66)'], [1, 'rgba(20,17,40,0)']]);
    rr(ctx, bx0, yy - ht, len + 144 * s, ht + 8 * s, 14 * s); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    if (truck) {   // marker lights along the roof line
      ctx.fillStyle = linGrad(ctx, xt - dir * 200 * s, 0, xl, 0, [[0, 'rgba(255,190,120,0)'], [1, 'rgba(255,190,120,0.4)']]);
      ctx.fillRect(Math.min(xt - dir * 200 * s, xl), yy - ht - 1, len + 200 * s, 2.4 * s);
    }
    // head lights: a long smear behind them, a short beam ahead
    const sl = (420 + h2 * 520) * s;
    ctx.fillStyle = linGrad(ctx, xl, 0, xl - dir * sl, 0, [[0, 'rgba(255,238,206,1)'], [0.12, 'rgba(255,224,176,0.62)'], [0.5, 'rgba(255,206,150,0.2)'], [1, 'rgba(255,200,150,0)']]);
    ctx.fillRect(Math.min(xl, xl - dir * sl), yy - 17 * s, sl, 4.2 * s);
    ctx.fillStyle = linGrad(ctx, xl, 0, xl + dir * 300 * s, 0, [[0, 'rgba(255,226,180,0.24)'], [1, 'rgba(255,226,180,0)']]);
    ctx.beginPath(); ctx.moveTo(xl, yy - 20 * s); ctx.lineTo(xl + dir * 300 * s, yy - 40 * s); ctx.lineTo(xl + dir * 300 * s, yy + 12 * s); ctx.lineTo(xl, yy - 10 * s); ctx.fill();
    glow(ctx, xl, yy - 15 * s, 54 * s, '#ffe6c0', 1);
    glow(ctx, xl + dir * 70 * s, yy + 7 * s, 190 * s, '#ffd6a0', 0.2, 0.15);          // pool on the tarmac
    // tail lights: desaturated, secondary
    const tl = (300 + h3 * 380) * s;
    ctx.fillStyle = linGrad(ctx, xt, 0, xt - dir * tl, 0, [[0, 'rgba(214,100,90,0.8)'], [0.2, 'rgba(196,86,84,0.4)'], [1, 'rgba(180,80,84,0)']]);
    ctx.fillRect(Math.min(xt, xt - dir * tl), yy - 18 * s, tl, 3.2 * s);
    glow(ctx, xt, yy - 16.5 * s, 26 * s, '#cc625c', 0.6);
  }
  ctx.restore();
}

function rsLampFlicker(i, t, lamps) {
  // each lamp strikes at its own moment, stutters, then holds; one of them never quite settles
  const strike = 0.15 + hash(i * 17 + 3) * 1.1;
  let k = clamp((t - strike) / 0.5);
  if (t > strike && t < strike + 0.9) k *= 0.45 + 0.55 * (noise1(t * 21, i) > 0.42 ? 1 : 0.15);
  if (mod(i, 5) === 2) k *= 0.72 + 0.28 * (noise1(t * 13, i + 40) > 0.3 ? 1 : 0.35);
  return lamps * (0.25 + 0.75 * k) * (0.96 + 0.04 * wobble(t, 3, i));
}

function rsSmoke(ctx, t, amount, shake, layer) {
  if (amount <= 0) return;
  const N = layer === 0 ? 60 : 8, life = layer === 0 ? 4.6 : 5.4;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < N; i++) {
      const dark = i % 4 === 0;
      if ((pass === 0) !== dark) continue;
      const seed = i * 13 + layer * 101;
      const cyc = t / life + i / N + hash(seed) * 0.013;
      const a = cyc - Math.floor(cyc), gen = Math.floor(cyc);
      const h1 = hash(seed + gen * 7), h2 = hash(seed + gen * 11 + 5), h3 = hash(seed + gen * 3 + 9);
      const rise = Math.pow(a, 0.9);
      // the column leans right with the wash of the traffic and curls as it climbs
      const x = RS.engX - 52 + h1 * 104 + rise * rise * (120 + h2 * 110) + rise * 34 + Math.sin(a * 6 + h3 * 9) * 30 * a + (layer ? 46 : 0);
      const y = RS.engY + 6 - rise * (410 + h3 * 130) + (dark ? 14 : 0);
      const r = 24 + Math.pow(a, 0.72) * (100 + h2 * 66) + (layer ? 26 : 0);
      const dens = Math.min(1, a * 22) * Math.pow(1 - a, 1.05) * amount * (1 + shake * 0.35);
      if (dark) {
        const al = dens * (0.34 + 0.3 * shake) * (layer ? 0.3 : 1);
        ctx.fillStyle = radGrad(ctx, x, y, 0, r, [[0, rgba('#2f2a4a', al)], [0.6, rgba('#2f2a4a', al * 0.6)], [1, rgba('#2f2a4a', 0)]]);
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        continue;
      }
      const al = dens * (0.5 + 0.4 * h3) * (layer ? 0.26 : 1);
      // pale steam near the bay, cooling to lilac as it thins; peach where the afterglow shines through it
      const kWarm = clamp((y - 300) / 240) * 0.55 + clamp((x - 1150) / 420) * 0.35;
      const col = mixHex(mixHex('#d6cbe0', '#9a90b8', clamp(a * 1.5)), '#f2b89a', clamp(kWarm));
      ctx.fillStyle = radGrad(ctx, x, y, 0, r, [[0, rgba(col, 0.78 * al)], [0.5, rgba(col, 0.62 * al)], [0.82, rgba(col, 0.2 * al)], [1, rgba(col, 0)]]);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      // back-lit edge toward the afterglow
      ctx.fillStyle = radGrad(ctx, x + r * 0.36, y + r * 0.26, 0, r * 0.62, [[0, rgba('#ffcaa0', 0.3 * al)], [1, rgba('#ffcaa0', 0)]]);
      ctx.beginPath(); ctx.arc(x + r * 0.36, y + r * 0.26, r * 0.62, 0, TAU); ctx.fill();
    }
  }
}

function rsGrass(key, seed) {
  return cached(key, 760, 220, (c) => {
    const r = rng(seed);
    c.filter = 'blur(2.2px)';
    c.strokeStyle = '#090913'; c.lineCap = 'round';
    for (let i = 0; i < 150; i++) {
      const x = 30 + r() * 700, h = 40 + Math.pow(r(), 1.6) * 150, lean = (r() - 0.4) * 80;
      c.lineWidth = 2 + r() * 3.5;
      c.beginPath(); c.moveTo(x, 222); c.quadraticCurveTo(x + lean * 0.2, 220 - h * 0.6, x + lean, 220 - h); c.stroke();
    }
    c.fillStyle = '#090913';
    for (let i = 0; i < 9; i++) { const x = 60 + r() * 640, h = 90 + r() * 90; c.beginPath(); c.ellipse(x + 6, 220 - h, 5, 13, 0.3, 0, TAU); c.fill(); }
  });
}

export const roadside = {
  W: 1920,
  floorY: FY,
  anchors: {
    roof: { x: 752, y: 348 },
    adam: { x: 905, y: 700 },
    adamClear: { x: 1330, y: 700 },
    engine: { x: RS.engX, y: RS.engY },
    hoodTip: { x: 1139, y: 316 },
    chip: { x: 1440, y: 235 },
    exit: { x: 2060, y: 700 },
  },
  lights: { dusk: { key: '#ff9d5c', from: 1, amount: 0.6 } },

  /** Body shudder of the car for this frame: rotate by `rot` about (px,py), then translate (dx,dy). */
  carPose(o = {}, t = 0) {
    const s = clamp(o.shake ?? 0);
    const j = Math.sin(t * 71) * 0.6 + Math.sin(t * 113 + 1) * 0.4, j2 = Math.sin(t * 83 + 2);
    return { dx: j * 2.4 * s, dy: j2 * 1.7 * s, rot: (Math.sin(t * 59 + 0.5) * 0.6 + j * 0.4) * 0.0042 * s, px: RS.carX + 150, py: FY };
  },

  back(ctx, F, o = {}) {
    const L = LOOK.dusk, cam = camOf(o), t = o.t ?? F.t;
    const smoke = clamp(o.smoke ?? 1), shake = clamp(o.shake ?? 0), lamps = clamp(o.lamps ?? 1), hazard = clamp(o.hazard ?? 0);

    // sky (infinitely far: does not move with the camera)
    ctx.drawImage(rsSky(), 0, 0);

    // far skyline, soaked in the afterglow
    camera(ctx, cam, 0.1, () => {
      const far = cityStrip('rs-far', 2600, 260, { seed: 7, minW: 26, maxW: 80, minH: 30, maxH: 250, pow: 2.2, color: '#9c5f73', color2: '#7f5676', haze: '#e88a5e', hazeK: 0.75, gapP: 0.2, gap: 40,
        win: { w: 2, h: 2, gx: 7, gy: 9, lit: 0.07, color: '#ffe3b5', alpha: 0.7 } });
      ctx.drawImage(far, -340, 555 - 260);
    });
    // nearer skyline: cooler, darker
    camera(ctx, cam, 0.22, () => {
      const mid = cityStrip('rs-mid', 3000, 240, { seed: 19, minW: 50, maxW: 150, minH: 34, maxH: 200, pow: 1.9, color: '#4e3f68', color2: '#3d375f', haze: '#a85f66', hazeK: 0.55, gapP: 0.35, gap: 70, gables: 1,
        win: { w: 3, h: 4, gx: 11, gy: 13, lit: 0.09, color: '#ffe0b0', alpha: 0.75 } });
      ctx.drawImage(mid, -540, 575 - 240);
      ctx.fillStyle = linGrad(ctx, 0, 520, 0, 600, [[0, 'rgba(60,44,90,0)'], [1, 'rgba(46,38,78,1)']]);
      ctx.fillRect(-600, 520, 3200, 700);
    });

    // far side of the road: embankment, hedge, lamp posts
    camera(ctx, cam, 0.42, () => {
      const v = view(cam, 0.42);
      ctx.fillStyle = '#2b2850';
      ctx.beginPath(); ctx.moveTo(v.x0 - 50, 900);
      for (let x = Math.floor((v.x0 - 60) / 40) * 40; x <= v.x1 + 60; x += 40) ctx.lineTo(x, 548 - noise1(x * 0.011, 3) * 16 - noise1(x * 0.05, 5) * 5);
      ctx.lineTo(v.x1 + 60, 900); ctx.closePath(); ctx.fill();
      for (let i = Math.floor((v.x0 - 100) / 340); i <= Math.ceil((v.x1 + 100) / 340); i++) {
        const x = i * 340 + 120, top = 205, k = rsLampFlicker(i, t, lamps);
        ctx.strokeStyle = '#27244a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, 560); ctx.lineTo(x, top + 22); ctx.quadraticCurveTo(x, top, x + 30, top - 3); ctx.stroke();
        ctx.fillStyle = '#27244a'; fillRR(ctx, x + 24, top - 8, 26, 7, 3, '#27244a');
        ctx.fillStyle = rgba('#ffcf96', 0.2 + 0.8 * k); fillRR(ctx, x + 27, top - 2.5, 20, 3.4, 1.5, ctx.fillStyle);
        glow(ctx, x + 37, top, 13, '#ffe2b4', 0.95 * k);
        glow(ctx, x + 37, top + 2, 90, '#ff9a55', 0.42 * k);
        lightCone(ctx, x + 37, top, Math.PI / 2, 0.8, 330, '#ffa868', 0.045 * k);
      }
    });

    // carriageway + traffic
    camera(ctx, cam, 0.62, () => {
      const v = view(cam, 0.62);
      ctx.fillStyle = linGrad(ctx, 0, 556, 0, 640, [[0, '#3a3058'], [0.4, '#2a2648'], [1, '#1d1b38']]);
      ctx.fillRect(v.x0 - 100, 556, v.x1 - v.x0 + 200, 800);
      ctx.fillStyle = 'rgba(255,170,120,0.16)'; ctx.fillRect(v.x0 - 100, 556, v.x1 - v.x0 + 200, 3);
      rsTraffic(ctx, t, 568, -1, 700, 13, 3, 0.56, v);
    });
    camera(ctx, cam, 0.76, () => {
      const v = view(cam, 0.76);
      ctx.fillStyle = 'rgba(214,190,200,0.22)';
      for (let x = Math.floor((v.x0 - 200) / 190) * 190; x < v.x1 + 200; x += 190) ctx.fillRect(x, 580, 84, 2.6);
      rsTraffic(ctx, t, 600, 1, 1150, 11, 9, 0.8, v);
    });

    // crash barrier + the near lamp post behind it
    camera(ctx, cam, 0.9, () => {
      const v = view(cam, 0.9);
      // verge strip under the barrier
      ctx.fillStyle = linGrad(ctx, 0, 648, 0, 700, [[0, '#26223f'], [1, '#17162c']]);
      ctx.fillRect(v.x0 - 100, 652, v.x1 - v.x0 + 200, 800);
      // near lamp post (its head is above the frame)
      const k = rsLampFlicker(2, t, lamps);
      const px = 1612;
      ctx.fillStyle = linGrad(ctx, px - 8, 0, px + 8, 0, [[0, '#17162e'], [0.72, '#2a2748'], [0.86, '#6a4a5c'], [1, '#c98060']]);
      ctx.fillRect(px - 8, -900, 16, 1565);
      fillRR(ctx, px - 15, 612, 30, 56, 4, '#1a1932'); ctx.fillStyle = '#1a1932'; ctx.fillRect(px - 20, 662, 40, 8);
      ctx.fillStyle = rgba('#ff9d5c', 0.45); ctx.fillRect(px + 13, 614, 2, 52);
      // posts and beam
      const x0 = Math.floor((v.x0 - 200) / 176) * 176;
      for (let x = x0; x < v.x1 + 200; x += 176) {
        ctx.fillStyle = '#1f1e3a'; ctx.fillRect(x - 6, 610, 12, 60);
        ctx.fillStyle = rgba('#ffb080', 0.3); ctx.fillRect(x + 4, 610, 2, 58);
        ctx.fillStyle = 'rgba(8,8,18,0.5)'; ctx.beginPath(); ctx.ellipse(x - 12, 670, 30, 4, 0, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = linGrad(ctx, 0, 606, 0, 640, [[0, '#7d6788'], [0.1, '#514c76'], [0.42, '#38365d'], [0.5, '#62587f'], [0.6, '#302e56'], [1, '#201f3c']]);
      ctx.fillRect(v.x0 - 100, 606, v.x1 - v.x0 + 200, 34);
      ctx.fillStyle = 'rgba(255,186,130,0.62)'; ctx.fillRect(v.x0 - 100, 605, v.x1 - v.x0 + 200, 2);
      ctx.fillStyle = 'rgba(10,10,24,0.55)'; ctx.fillRect(v.x0 - 100, 640, v.x1 - v.x0 + 200, 3);
      for (let x = x0; x < v.x1 + 200; x += 176) {
        fillRR(ctx, x - 9, 612, 18, 22, 2, '#2a2848');
        const pass = 0.3 + 0.7 * noise1(t * 3.1 + x * 0.004, 8);     // reflectors catch the passing headlights
        fillRR(ctx, x - 3.5, 618, 7, 7, 1.5, rgba('#ffe2b8', 0.2 + 0.55 * pass));
      }
      // light falling from the near lamp
      lightCone(ctx, px + 40, -160, Math.PI / 2 + 0.03, 0.6, 900, '#ffac68', 0.085 * k);
    });

    // the shoulder (subject plane) and the car
    camera(ctx, cam, 1, () => {
      const v = view(cam, 1);
      ctx.fillStyle = linGrad(ctx, 0, 664, 0, 804, [[0, '#2a2644'], [0.18, '#1e1c36'], [1, '#0e0d1c']]);
      ctx.fillRect(v.x0 - 100, 664, v.x1 - v.x0 + 200, 900);
      // sky sheen on the worn tarmac
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = linGrad(ctx, 0, 664, 0, 720, [[0, 'rgba(255,150,100,0.20)'], [1, 'rgba(255,150,100,0)']]);
      ctx.fillRect(v.x0 - 100, 664, v.x1 - v.x0 + 200, 60);
      const kL = rsLampFlicker(2, t, lamps);
      glow(ctx, 1660, 704, 520, '#ffa868', 0.30 * kL, 0.13);
      ctx.restore();
      // gravel, cracks, the painted edge line
      const r = rng(77);
      for (let i = 0; i < 260; i++) {
        const gx = -700 + r() * 3400, gy2 = 668 + Math.pow(r(), 1.4) * 120, w = 2 + r() * 5, lit = r();
        if (gx < v.x0 - 10 || gx > v.x1 + 10) continue;
        ctx.fillStyle = lit > 0.7 ? rgba('#c99a9a', 0.22 * lit) : rgba('#06060e', 0.3 + 0.3 * lit);
        ctx.fillRect(gx, gy2, w, 1.4 + (gy2 - 668) * 0.012);
      }
      ctx.fillStyle = 'rgba(214,196,206,0.34)';
      for (let x = Math.floor((v.x0 - 200) / 520) * 520; x < v.x1 + 200; x += 520) { ctx.fillRect(x, 764, 470, 9); ctx.fillStyle = 'rgba(214,196,206,0.26)'; }
      // coolant creeping out from under the nose, mirroring the sky
      ctx.save();
      ctx.translate(1215, 716); ctx.scale(1, 0.085);
      ctx.fillStyle = radGrad(ctx, 30, 0, 20, 250, [[0, 'rgba(255,190,130,0.62)'], [0.55, 'rgba(230,120,90,0.42)'], [0.85, 'rgba(120,70,110,0.3)'], [1, 'rgba(60,50,90,0)']]);
      ctx.beginPath(); ctx.ellipse(0, 0, 250, 150, 0, 0, TAU); ctx.ellipse(-190, 40, 120, 90, 0, 0, TAU); ctx.ellipse(170, -60, 110, 70, 0, 0, TAU); ctx.fill();
      ctx.restore();

      // ── the hatchback ──
      const P = CAR.hatch, pose = roadside.carPose(o, t);
      // contact shadow
      ctx.fillStyle = radGrad(ctx, RS.carX + 446, 702, 60, 520, [[0, 'rgba(4,4,12,0.85)'], [0.6, 'rgba(4,4,12,0.6)'], [1, 'rgba(4,4,12,0)']]);
      ctx.save(); ctx.translate(RS.carX + 446, 702); ctx.scale(1, 0.07); ctx.translate(-(RS.carX + 446), -702);
      ctx.beginPath(); ctx.arc(RS.carX + 446, 702, 520, 0, TAU); ctx.fill(); ctx.restore();
      ctx.save();
      ctx.translate(pose.px, pose.py); ctx.rotate(pose.rot); ctx.translate(-pose.px + pose.dx, -pose.py + pose.dy);
      ctx.translate(RS.carX, FY);
      // exhaust cough
      if (shake > 0.02) {
        for (let i = 0; i < 6; i++) {
          const cyc = t * 1.9 + i / 6, a = cyc - Math.floor(cyc), g = Math.floor(cyc);
          const al = shake * (1 - a) * Math.min(1, a * 8) * 0.38;
          const ex = -10 - a * (110 + hash(i + g * 5) * 60), ey = -70 - a * a * 50 + Math.sin(a * 6 + i) * 8, er = 12 + a * 58;
          ctx.fillStyle = radGrad(ctx, ex, ey, 0, er, [[0, rgba('#2e2a48', al)], [1, rgba('#2e2a48', 0)]]);
          ctx.beginPath(); ctx.arc(ex, ey, er, 0, TAU); ctx.fill();
        }
      }
      // engine bay: dark lumps under the raised hood
      ctx.fillStyle = '#0d0d1a';
      ctx.beginPath(); ctx.moveTo(P.cowl + 10, -P.belt + 6); ctx.lineTo(P.cowl + 26, -P.belt - 14); ctx.lineTo(P.cowl + 74, -P.belt - 12); ctx.lineTo(P.cowl + 80, -P.belt - 26);
      ctx.lineTo(P.cowl + 120, -P.belt - 24); ctx.lineTo(P.cowl + 126, -P.belt - 2); ctx.lineTo(P.hoodEnd - 30, -P.noseH - 12); ctx.lineTo(P.hoodEnd - 8, -P.noseH + 2); ctx.lineTo(P.cowl + 10, -P.belt + 20); ctx.closePath(); ctx.fill();
      drawCar(ctx, P, RS_PAL, { detail: 2, hood: 1, bareFront: true });
      // tired details: mismatched front wing, rust blooms, a dent, a bent aerial
      ctx.save();
      ctx.beginPath(); ctx.moveTo(P.cowl - 26, -P.belt - 2); ctx.quadraticCurveTo((P.cowl + P.hoodEnd) / 2, -(P.belt + P.noseH) / 2 - 10, P.hoodEnd + 2, -P.noseH + 2);
      ctx.lineTo(P.L - 56, -P.bump - 14); ctx.lineTo(P.xf + 79, -P.bump - 14); ctx.arc(P.xf, -P.wr, 79, -0.62, Math.PI + 0.75, true); ctx.quadraticCurveTo(P.cowl - 34, -P.sill - 20, P.cowl - 30, -P.bump - 40); ctx.closePath();
      ctx.fillStyle = 'rgba(30,28,60,0.22)'; ctx.fill();
      ctx.restore();
      const rr2 = rng(5);
      for (const [bx, by, br] of [[P.xr + 86, -110, 20], [P.xf - 92, -98, 15], [P.xB - 60, -64, 13], [P.xr - 70, -150, 11]]) {
        for (let i = 0; i < 9; i++) { ctx.fillStyle = rgba('#2a1f38', 0.16 + rr2() * 0.2); ctx.beginPath(); ctx.ellipse(bx + (rr2() - 0.5) * br * 2, by + (rr2() - 0.5) * br, 2 + rr2() * br * 0.5, 1.5 + rr2() * br * 0.3, rr2() * 3, 0, TAU); ctx.fill(); }
      }
      ctx.strokeStyle = 'rgba(20,20,44,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(P.xB + 110, -176); ctx.quadraticCurveTo(P.xB + 150, -196, P.xB + 196, -180); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,190,150,0.14)'; ctx.beginPath(); ctx.moveTo(P.xB + 112, -172); ctx.quadraticCurveTo(P.xB + 150, -190, P.xB + 194, -176); ctx.stroke();
      ctx.strokeStyle = '#15152a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(P.roofF - 30, -P.H + 1); ctx.quadraticCurveTo(P.roofF - 62, -P.H - 60, P.roofF - 120, -P.H - 92); ctx.stroke();
      // the propped hood: a thin slab, pale underside catching the glow, prop rod
      const hx = P.cowl + 6, hy = -P.belt + 2, hl = P.hoodEnd - P.cowl + 26, ang = -0.66;
      ctx.strokeStyle = '#15152a'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(P.hoodEnd - 6, -P.noseH - 2); ctx.lineTo(hx + Math.cos(ang) * hl * 0.8, hy + Math.sin(ang) * hl * 0.8); ctx.stroke();
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
      ctx.fillStyle = linGrad(ctx, 0, -9, 0, 6, [[0, mixHex(RS_PAL.body, RS_PAL.light, 0.3)], [0.5, RS_PAL.body], [1, '#1d1d3a']]);
      ctx.beginPath(); ctx.moveTo(-4, -4); ctx.quadraticCurveTo(hl * 0.5, -13, hl - 10, -8); ctx.quadraticCurveTo(hl + 2, -6, hl + 2, 2); ctx.lineTo(hl - 8, 6); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#ff9d5c', 0.7); ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(-2, -5); ctx.quadraticCurveTo(hl * 0.5, -14, hl - 10, -9); ctx.quadraticCurveTo(hl + 3, -7, hl + 3, 2); ctx.stroke();
      ctx.restore();
      // headlamp: only the dying flicker of the cough
      const lampK = shake * (0.25 + 0.75 * (noise1(t * 17, 4) > 0.45 ? 1 : 0.1));
      if (lampK > 0.01) { glow(ctx, P.L - 20, -P.noseH + 36, 80, '#ffe6b0', 0.55 * lampK); lightCone(ctx, P.L - 10, -P.noseH + 36, 0.05, 0.4, 420, '#ffe0a8', 0.16 * lampK); }
      if (hazard > 0.01) {
        const hz = hazard * (mod(t * 1.4, 1) < 0.5 ? 1 : 0.05);
        glow(ctx, P.L - 30, -P.bump - 6, 46, '#ffb050', 0.7 * hz); glow(ctx, 22, -P.bump - 30, 46, '#ffb050', 0.7 * hz);
      }
      ctx.restore();

      // steam and smoke (behind the people)
      rsSmoke(ctx, t, smoke, shake, 0);
    });
  },

  mid() {},

  front(ctx, F, o = {}) {
    const L = LOOK.dusk, cam = camOf(o), t = o.t ?? F.t;
    const smoke = clamp(o.smoke ?? 1), shake = clamp(o.shake ?? 0), lamps = clamp(o.lamps ?? 1);
    camera(ctx, cam, 1, () => rsSmoke(ctx, t, smoke, shake, 1));
    // road haze lit by the afterglow
    fog(ctx, t, 548, 120, L.haze, 0.05, 11, 16);
    // out-of-focus verge grass in the bottom corners
    camera(ctx, cam, 1.38, () => {
      const sway = wobble(t, 0.35, 2) * 0.02;
      for (const [x, key, seed, flip] of [[-330, 'rs-grass-a', 3, 1], [1700, 'rs-grass-b', 8, -1]]) {
        ctx.save(); ctx.translate(x + 380, 828); ctx.transform(flip, 0, sway, 1, 0, 0); ctx.drawImage(rsGrass(key, seed), -380, -220); ctx.restore();
      }
    });
    // veil of the low sky and the lamp over everything
    const kL = rsLampFlicker(2, t, lamps);
    const [sx, sy] = proj(cam, 1650, 430, 0.9);
    glow(ctx, sx, sy - 500, 700, '#ff9d5c', 0.07 * kL);
    glow(ctx, 1290, 590, 760, '#ff8a5a', 0.06, 0.5);
  },
};

// ───────────────────────── soft background people, scooters, trees (drawn by the sets) ─────────────────────────
/**
 * A plain profile figure. Local frame: feet at (0,0), facing +x, h = height. ph = walk phase 0..1 (null = standing,
 * 'sit' = seated on a 110-scale bench). v = {coat, bag, pack, hat, bun}. Fills with the current fillStyle.
 */
function figure(c, h, ph, v = {}) {
  const u = h / 7.4, walking = typeof ph === 'number', sit = ph === 'sit', a = walking ? ph * TAU : 0;
  const col = c.fillStyle;
  c.save();
  c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  const leg = (phi, back) => {
    let th, kn;
    if (sit) { th = 1.45; kn = 1.4; } else if (walking) { th = 0.42 * Math.sin(phi); kn = 0.1 + 0.6 * Math.max(0, Math.sin(phi - 2.0)); } else { th = back ? -0.07 : 0.06; kn = 0.03; }
    const kx = Math.sin(th) * 1.85 * u, ky = Math.cos(th) * 1.85 * u, sh = th - kn;
    return { kx, ky, ax: kx + Math.sin(sh) * 1.7 * u, ay: ky + Math.cos(sh) * 1.7 * u, sh };
  };
  const A = leg(a, false), B = leg(a + Math.PI, true);
  const hipY = sit ? -(110 / 430) * h - 0.3 * u : -(Math.max(A.ay, B.ay) + 0.22 * u) + (walking ? Math.abs(Math.sin(a)) * -0.06 * u : 0);
  c.translate(0, hipY);
  for (const L of [B, A]) {
    c.lineWidth = 0.56 * u; c.beginPath(); c.moveTo(0, 0); c.lineTo(L.kx, L.ky); c.stroke();
    c.lineWidth = 0.4 * u; c.beginPath(); c.moveTo(L.kx, L.ky); c.lineTo(L.ax, L.ay); c.stroke();
    c.save(); c.translate(L.ax, L.ay); c.rotate(-L.sh * 0.6);
    c.beginPath(); c.ellipse(0.24 * u, 0.1 * u, 0.44 * u, 0.15 * u, 0, 0, TAU); c.fill(); c.restore();
  }
  const lean = walking ? 0.06 : sit ? -0.05 : 0.01;
  c.rotate(lean);
  // torso (and coat)
  c.beginPath();
  c.moveTo(-0.44 * u, 0.1 * u); c.quadraticCurveTo(-0.56 * u, -1.3 * u, -0.46 * u, -2.2 * u); c.quadraticCurveTo(-0.34 * u, -2.62 * u, -0.1 * u, -2.72 * u);
  c.lineTo(0.2 * u, -2.7 * u); c.quadraticCurveTo(0.52 * u, -2.3 * u, 0.5 * u, -1.5 * u); c.quadraticCurveTo(0.5 * u, -0.6 * u, 0.42 * u, 0.1 * u);
  if (v.coat) { c.lineTo(0.56 * u, 1.25 * u); c.lineTo(-0.6 * u, 1.25 * u); }
  c.closePath(); c.fill();
  // head, hair, hat
  c.beginPath(); c.ellipse(0.14 * u, -3.22 * u, 0.42 * u, 0.5 * u, 0, 0, TAU); c.fill();
  c.fillRect(-0.12 * u, -2.86 * u, 0.36 * u, 0.3 * u);
  if (v.bun) { c.beginPath(); c.ellipse(-0.36 * u, -3.36 * u, 0.24 * u, 0.2 * u, 0, 0, TAU); c.fill(); }
  if (v.hat) { c.beginPath(); c.ellipse(0.16 * u, -3.6 * u, 0.5 * u, 0.2 * u, 0, Math.PI, TAU); c.fill(); c.fillRect(0.2 * u, -3.64 * u, 0.62 * u, 0.09 * u); }
  if (v.pack) fillRR(c, -1.02 * u, -2.5 * u, 0.66 * u, 1.5 * u, 0.24 * u, col);
  // arms
  const arm = (ang, bend) => {
    const ex = Math.sin(ang) * 1.4 * u, ey = -2.4 * u + Math.cos(ang) * 1.4 * u, fa = ang + bend;
    const hx = ex + Math.sin(fa) * 1.25 * u, hy = ey + Math.cos(fa) * 1.25 * u;
    c.lineWidth = 0.34 * u; c.beginPath(); c.moveTo(0, -2.4 * u); c.lineTo(ex, ey); c.stroke();
    c.lineWidth = 0.27 * u; c.beginPath(); c.moveTo(ex, ey); c.lineTo(hx, hy); c.stroke();
    c.beginPath(); c.arc(hx, hy, 0.19 * u, 0, TAU); c.fill();
    return [hx, hy];
  };
  const sw = walking ? 0.4 * Math.sin(a) : 0;
  const h1 = arm(-sw + (sit ? 0.5 : 0), sit ? 0.9 : 0.22), h2 = arm(sw + (sit ? 0.4 : 0.04), sit ? 0.9 : 0.18);
  if (v.bag) { fillRR(c, h2[0] - 0.5 * u, h2[1] + 0.1 * u, 1.0 * u, 0.8 * u, 0.12 * u, col); }
  c.restore();
}

// scooter: local frame x 0 = rear … 440 = front (facing +x), ground y = 0
function drawScooter(c, pal) {
  const tyre = pal.tyre, body = pal.body;
  c.fillStyle = tyre;
  c.beginPath(); c.arc(66, -50, 50, 0, TAU); c.arc(372, -50, 50, 0, TAU); c.fill();
  c.fillStyle = pal.cap; c.beginPath(); c.arc(66, -50, 24, 0, TAU); c.arc(372, -50, 24, 0, TAU); c.fill();
  c.fillStyle = tyre; c.beginPath(); c.arc(66, -50, 9, 0, TAU); c.arc(372, -50, 9, 0, TAU); c.fill();
  // stand, exhaust
  c.strokeStyle = tyre; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(214, -70); c.lineTo(196, -6); c.stroke();
  fillRR(c, 10, -84, 150, 30, 14, mixHex(body, pal.dark, 0.6));
  // body shell
  c.fillStyle = linGrad(c, 0, -240, 0, -60, [[0, mixHex(body, pal.light, 0.3)], [0.5, body], [1, mixHex(body, pal.dark, 0.5)]]);
  c.beginPath();
  c.moveTo(4, -150); c.quadraticCurveTo(0, -176, 30, -186); c.lineTo(228, -190); c.quadraticCurveTo(250, -150, 256, -86);
  c.lineTo(322, -86); c.lineTo(352, -236); c.quadraticCurveTo(356, -252, 372, -250); c.lineTo(394, -246);
  c.quadraticCurveTo(404, -200, 396, -150); c.quadraticCurveTo(380, -108, 352, -60); c.lineTo(250, -58);
  c.quadraticCurveTo(190, -62, 150, -104); c.quadraticCurveTo(70, -118, 4, -150); c.closePath(); c.fill();
  // seat
  fillRR(c, 22, -208, 214, 30, 15, mixHex(tyre, body, 0.12));
  // front mudguard, fork
  c.fillStyle = mixHex(body, pal.dark, 0.25); c.beginPath(); c.arc(372, -50, 62, Math.PI * 1.08, Math.PI * 1.9); c.arc(372, -50, 52, Math.PI * 1.9, Math.PI * 1.08, true); c.fill();
  // handlebar, mirror, headlamp
  c.strokeStyle = tyre; c.lineWidth = 8; c.beginPath(); c.moveTo(372, -250); c.lineTo(366, -278); c.lineTo(338, -284); c.stroke();
  c.lineWidth = 4; c.beginPath(); c.moveTo(360, -278); c.lineTo(352, -322); c.stroke();
  c.fillStyle = tyre; c.beginPath(); c.ellipse(346, -330, 20, 13, -0.2, 0, TAU); c.fill();
  c.fillStyle = mixHex(body, pal.light, 0.6); c.beginPath(); c.ellipse(398, -216, 9, 16, 0.1, 0, TAU); c.fill();
  c.fillStyle = rgba(pal.light, 0.35); c.fillRect(40, -188, 180, 3);
}

/** Cached tree crown: leaf clumps in up to four tones, the later tones gathered toward the light. */
function canopy(key, w, h, seed, tones, o = {}) {
  return cached(key, w, h, (c) => {
    const r = rng(seed), n = o.n || 80, cl = o.clump || 34, bx = o.bx ?? 0.08, by = o.by ?? -0.08;
    if (o.blur) c.filter = `blur(${o.blur}px)`;
    if (o.branch) {
      c.strokeStyle = o.branch; c.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.3 + (r() - 0.5) * 0.2, len = h * (0.42 + r() * 0.25);
        c.lineWidth = Math.max(2, w * 0.022 * (1 - Math.abs(i - 3) * 0.16));
        c.beginPath(); c.moveTo(w / 2, h); c.quadraticCurveTo(w / 2 + Math.cos(a) * len * 0.4, h - len * 0.5, w / 2 + Math.cos(a) * len, h + Math.sin(a) * len); c.stroke();
      }
    }
    for (let pass = 0; pass < tones.length; pass++) {
      c.fillStyle = tones[pass];
      const m = Math.round(n * (pass === 0 ? 1 : 0.7 - pass * 0.12));
      for (let i = 0; i < m; i++) {
        const a = r() * TAU, rad = Math.pow(r(), 0.6) * (1 - pass * 0.07);
        const cx = w / 2 + Math.cos(a) * rad * w * 0.4 + bx * w * pass, cy = h * 0.46 + Math.sin(a) * rad * h * 0.36 + by * h * pass;
        const rx = cl * (0.55 + r() * 0.8) * (1 - pass * 0.2), ry = rx * (0.55 + r() * 0.35);
        c.beginPath(); c.ellipse(cx, cy, rx, ry, (r() - 0.5) * 1.2, 0, TAU); c.fill();
      }
    }
    if (o.gaps) {     // little holes of sky
      c.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < o.gaps; i++) { const a = r() * TAU, rad = Math.sqrt(r()) * 0.9; c.beginPath(); c.ellipse(w / 2 + Math.cos(a) * rad * w * 0.36, h * 0.46 + Math.sin(a) * rad * h * 0.32, 5 + r() * 12, 4 + r() * 8, r() * 3, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// 2. CITY RUN
// ════════════════════════════════════════════════════════════════════════════════════════════
const CR = {
  dRow: 0.5, dFarKerb: 0.56, dKerb: 0.92, dFg: 1.36,
  // far side of the street, in layer coordinates of depth 0.5: [x0, x1, storeys, units, seed] | [x0, x1, 'gap'|'park']
  row: [
    [-1500, -900, 2, 1, 9], [-900, -200, 3, 2, 1], [-200, 80, 'gap'], [80, 560, 2, 1, 2], [560, 1100, 1, 1, 3], [1100, 1420, 'gap'],
    [1420, 2260, 3, 2, 4], [2260, 2960, 'park'], [2960, 3420, 2, 1, 5], [3420, 3980, 1, 1, 6], [3980, 4300, 'gap'],
    [4300, 5060, 3, 2, 7], [5060, 5640, 2, 1, 8], [5640, 6200, 1, 1, 10],
  ],
  // near kerb, by true world X: [kind, X, variant]
  kerb: [
    ['car', -620, 'sedan', 0], ['tree', 150], ['car', 560, 'hatch', 2], ['scooter', 1040, 1], ['lamp', 1250],
    ['lamp', 1880], ['car', 2360, 'suv', 1], ['tree', 2960], ['shelter', 3260], ['lamp', 3640], ['scooter', 3860, 0], ['scooter', 4120, 2],
    ['tree', 4480], ['car', 5080, 'van', 3], ['car', 6240, 'sedan', 4], ['lamp', 5700], ['tree', 6900], ['scooter', 7150, 1], ['car', 7900, 'hatch', 0], ['lamp', 7420],
  ],
  farKerb: [
    ['car', -300, 'hatch', 1], ['car', 1900, 'sedan', 3], ['tree', 2700], ['car', 3200, 'van', 0], ['tree', 4000], ['tree', 4700], ['car', 5600, 'suv', 2], ['tree', 6300], ['car', 6800, 'hatch', 4], ['tree', 7600], ['car', 8300, 'sedan', 1],
  ],
  // foreground, by true world X
  fg: [['post', 1000], ['rail', 1650, 620], ['bollards', 2850, 4], ['post', 3500], ['bollards', 4500, 3], ['rail', 5350, 560], ['post', 6100], ['bollards', 7000, 4]],
  peds: [[2150, -1, 0], [4200, 1, 1], [6500, -1, 2]],
  farPeds: [[400, 1, 0], [1750, -1, 1], [2500, 1, 2], [3900, -1, 3], [5300, 1, 4], [6000, -1, 5], [7300, 1, 6]],
};
const CR_BODY = ['#93a1b5', '#7c8ca3', '#b6c0ce', '#6d7d95', '#a3abb6'];
const crPal = (i, haze = 0) => {
  const body = mixHex(CR_BODY[mod(i, CR_BODY.length)], '#b9c6d8', haze);
  return { body, dark: mixHex('#1b2533', '#b9c6d8', haze), light: '#eef3f9', glass: '#dbe5f0', glassA: 0.2 + haze * 0.2, tyre: mixHex('#141b26', '#b9c6d8', haze * 0.8), cap: mixHex('#a9b4c2', '#b9c6d8', haze), trim: mixHex('#2a3544', '#b9c6d8', haze * 0.8), rim: '#ffffff', rimA: 0.16, inside: mixHex('#19212d', '#b9c6d8', haze), tail: mixHex('#4d4750', '#b9c6d8', haze), lens: mixHex('#d9e2ec', '#b9c6d8', haze) };
};

function crSky() {
  return cached('cr-sky', PW, PH, (c) => {
    c.fillStyle = linGrad(c, 0, 0, 0, 520, [[0, '#8496b0'], [0.45, '#a9b9cd'], [0.8, '#c8d3e0'], [1, '#d9e1ea']]);
    c.fillRect(0, 0, PW, PH);
    const r = rng(12);
    c.filter = 'blur(38px)';
    for (let i = 0; i < 26; i++) {
      const x = r() * PW, y = r() * 420, w = 260 + r() * 520, h = 40 + r() * 90, lightC = r() < 0.55;
      c.fillStyle = lightC ? 'rgba(232,238,246,0.34)' : 'rgba(112,128,152,0.26)';
      c.beginPath(); c.ellipse(x, y, w / 2, h / 2, 0, 0, TAU); c.fill();
    }
    c.fillStyle = 'rgba(244,247,251,0.5)'; c.beginPath(); c.ellipse(1340, 210, 420, 130, -0.1, 0, TAU); c.fill();   // the sun, somewhere behind the cloud
  });
}

const CR_WALL = ['#8a9bb2', '#7b8ca4', '#98a6b9', '#8291a6', '#a2adbd', '#74859c'];
const CR_AWN = ['#44566f', '#6e7b8a', '#5d6f74', '#8e949c', '#374252', '#56657c'];
function crBuilding(ctx, b) {
  const [x0, x1, st, units, seed] = b, r = rng(seed * 97 + 5), G = 565, sTop = 208, sh = 369;
  const wall = CR_WALL[mod(seed, CR_WALL.length)], top = st === 1 ? sTop - 30 : sTop - (st - 1) * sh, w = x1 - x0;
  ctx.fillStyle = linGrad(ctx, 0, top, 0, G, [[0, mixHex(wall, '#dfe7f0', 0.12)], [1, mixHex(wall, '#2b3648', 0.1)]]);
  ctx.fillRect(x0, top, w, G - top + 1);
  // cornice + roof clutter
  ctx.fillStyle = mixHex(wall, '#eef3f9', 0.3); ctx.fillRect(x0 - 4, top - 6, w + 8, 8);
  ctx.fillStyle = mixHex(wall, '#2b3648', 0.25); ctx.fillRect(x0 - 4, top + 2, w + 8, 3);
  ctx.fillStyle = mixHex(wall, '#2b3648', 0.18);
  if (r() < 0.7) { const tx = x0 + 30 + r() * (w - 120); ctx.fillRect(tx, top - 40, 60, 34); ctx.fillRect(tx + 8, top - 48, 44, 8); }
  if (r() < 0.6) { const ax = x0 + 20 + r() * (w - 40); ctx.fillRect(ax, top - 70, 2.5, 64); ctx.fillRect(ax - 10, top - 62, 22, 2); ctx.fillRect(ax - 7, top - 52, 16, 2); }
  // upper storeys
  const uw = w / units;
  for (let f = 1; f < st; f++) {
    const fy = sTop - f * sh;   // top of this storey
    ctx.fillStyle = mixHex(wall, '#2b3648', 0.14); ctx.fillRect(x0, fy + sh - 5, w, 4);
    for (let k = 0; k < units; k++) {
      const n = uw > 420 ? 3 : 2, ww = 70, wh = 150, gap = (uw - n * ww) / (n + 1), balc = r() < 0.35;
      for (let i = 0; i < n; i++) {
        const wx = x0 + k * uw + gap + i * (ww + gap), wy = fy + sh - 80 - wh;
        ctx.fillStyle = mixHex(wall, '#eef3f9', 0.25); ctx.fillRect(wx - 7, wy - 7, ww + 14, wh + 14);
        ctx.fillStyle = linGrad(ctx, 0, wy, 0, wy + wh, [[0, '#6f8098'], [1, '#4c5c73']]); ctx.fillRect(wx, wy, ww, wh);
        const blind = r();
        if (blind < 0.6) { ctx.fillStyle = rgba('#c3cedb', 0.5 + r() * 0.3); ctx.fillRect(wx, wy, ww, wh * (0.2 + r() * 0.6)); }
        else if (blind < 0.75) { ctx.fillStyle = 'rgba(220,228,238,0.35)'; ctx.fillRect(wx, wy, ww * 0.3, wh); ctx.fillRect(wx + ww * 0.7, wy, ww * 0.3, wh); }
        ctx.fillStyle = mixHex(wall, '#2b3648', 0.3); ctx.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
        ctx.fillStyle = mixHex(wall, '#eef3f9', 0.4); ctx.fillRect(wx - 11, wy + wh + 5, ww + 22, 6);
        if (r() < 0.25) { fillRR(ctx, wx + 6, wy + wh + 14, 50, 32, 3, mixHex(wall, '#dfe7f0', 0.35)); ctx.fillStyle = mixHex(wall, '#2b3648', 0.3); ctx.fillRect(wx + 12, wy + wh + 20, 38, 3); ctx.fillRect(wx + 12, wy + wh + 27, 38, 3); ctx.fillRect(wx + 12, wy + wh + 34, 38, 3); }
      }
      if (balc) {
        const bx = x0 + k * uw + gap * 0.5, bw = uw - gap, byy = fy + sh - 84;
        ctx.fillStyle = mixHex(wall, '#2b3648', 0.4); ctx.fillRect(bx, byy, bw, 6); ctx.fillRect(bx, byy - 58, bw, 4);
        for (let q = bx + 4; q < bx + bw; q += 14) ctx.fillRect(q, byy - 58, 2.5, 58);
      }
    }
    ctx.fillStyle = mixHex(wall, '#2b3648', 0.3); ctx.fillRect(x0 + w - 16, top + 6, 5, sTop - top);    // downpipe
  }
  // shops
  for (let k = 0; k < units; k++) {
    const ux = x0 + k * uw, type = Math.floor(r() * 5), awn = CR_AWN[Math.floor(r() * CR_AWN.length)], doorSide = r() < 0.5 ? 0 : 1;
    const ox = ux + 18, ow = uw - 36, oy = sTop + 64, oh = G - oy;
    // sign band
    const sign = r() < 0.5 ? mixHex(awn, '#1b2533', 0.2) : mixHex(wall, '#eef3f9', 0.4);
    ctx.fillStyle = sign; ctx.fillRect(ox - 6, sTop + 10, ow + 12, 46);
    ctx.fillStyle = rgba(sign === mixHex(wall, '#eef3f9', 0.4) ? '#44566f' : '#e3eaf2', 0.6);
    const lw = ow * (0.3 + r() * 0.25), lxx = ox + (ow - lw) * (0.15 + r() * 0.7);
    fillRR(ctx, lxx, sTop + 24, lw * 0.6, 9, 4, ctx.fillStyle); fillRR(ctx, lxx + lw * 0.66, sTop + 24, lw * 0.34, 9, 4, ctx.fillStyle);
    fillRR(ctx, lxx, sTop + 39, lw * 0.4, 5, 2.5, ctx.fillStyle);
    // glass and interior
    ctx.fillStyle = linGrad(ctx, 0, oy, 0, G, [[0, '#56677f'], [0.5, '#44546b'], [1, '#3a495f']]); ctx.fillRect(ox, oy, ow, oh);
    if (type === 3) {      // shutter down
      ctx.fillStyle = '#8492a6'; ctx.fillRect(ox, oy, ow, oh);
      ctx.fillStyle = 'rgba(40,52,70,0.22)'; for (let yy = oy + 6; yy < G; yy += 11) ctx.fillRect(ox, yy, ow, 3);
      ctx.fillStyle = 'rgba(40,52,70,0.4)'; ctx.fillRect(ox + ow / 2 - 14, G - 20, 28, 8);
    } else {
      const ir = rng(seed * 31 + k);
      for (let i = 0; i < 7; i++) {   // dim shapes inside
        const sx = ox + 10 + ir() * (ow - 70), sw = 30 + ir() * 60, shh = 40 + ir() * 130;
        ctx.fillStyle = rgba(ir() < 0.5 ? '#8fa0b6' : '#2c3a4e', 0.3 + ir() * 0.25); ctx.fillRect(sx, G - 30 - shh, sw, shh);
      }
      for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(236,242,250,0.5)'; ctx.beginPath(); ctx.arc(ox + ow * (0.2 + i * 0.3), oy + 54, 5, 0, TAU); ctx.fill(); }
      // door
      const dw = 86, dx = doorSide ? ox + ow - dw - 14 : ox + 14;
      ctx.fillStyle = '#2f3d52'; ctx.fillRect(dx - 6, G - 268, dw + 12, 268);
      ctx.fillStyle = linGrad(ctx, 0, G - 262, 0, G, [[0, '#4d5e76'], [1, '#34435a']]); ctx.fillRect(dx, G - 262, dw, 256);
      ctx.fillStyle = 'rgba(226,234,244,0.55)'; ctx.fillRect(dx + (doorSide ? 8 : dw - 12), G - 150, 4, 46);
      ctx.fillStyle = '#2f3d52'; ctx.fillRect(dx, G - 62, dw, 5);
      // mullions, stall riser
      ctx.fillStyle = mixHex(wall, '#2b3648', 0.45);
      const nm = Math.max(1, Math.round((ow - dw) / 150));
      for (let i = 1; i < nm; i++) ctx.fillRect((doorSide ? ox : ox + dw + 28) + (ow - dw - 28) * i / nm - 2, oy, 4, oh);
      ctx.fillRect(doorSide ? ox : dx + dw + 6, G - 34, ow - dw - 20, 34);
      // reflections of the bright sky
      ctx.fillStyle = linGrad(ctx, 0, oy, 0, oy + 190, [[0, 'rgba(214,224,236,0.34)'], [1, 'rgba(214,224,236,0)']]); ctx.fillRect(ox, oy, ow, 190);
      ctx.fillStyle = 'rgba(226,234,244,0.10)';
      for (let i = 0; i < 3; i++) { const rx = ox + ow * (0.18 + i * 0.3); ctx.beginPath(); ctx.moveTo(rx, oy); ctx.lineTo(rx + 44, oy); ctx.lineTo(rx - 60, G - 34); ctx.lineTo(rx - 104, G - 34); ctx.fill(); }
    }
    // awning / canopy
    if (type <= 1 || type === 4) {
      const ay = sTop + 58, ah = 64;
      ctx.fillStyle = 'rgba(28,38,54,0.3)'; ctx.fillRect(ox, ay + ah, ow, 26);
      ctx.fillStyle = awn; ctx.beginPath(); ctx.moveTo(ox - 4, ay); ctx.lineTo(ox + ow + 4, ay); ctx.lineTo(ox + ow + 16, ay + ah); ctx.lineTo(ox - 16, ay + ah); ctx.closePath(); ctx.fill();
      if (type === 0) { ctx.fillStyle = rgba('#dfe7f0', 0.5); const n = Math.round(ow / 44); for (let i = 0; i < n; i += 2) { const a0 = i / n, a1 = (i + 1) / n; ctx.beginPath(); ctx.moveTo(ox - 4 + (ow + 8) * a0, ay); ctx.lineTo(ox - 4 + (ow + 8) * a1, ay); ctx.lineTo(ox - 16 + (ow + 32) * a1, ay + ah); ctx.lineTo(ox - 16 + (ow + 32) * a0, ay + ah); ctx.fill(); } }
      ctx.fillStyle = mixHex(awn, '#1b2533', 0.25);
      const n = Math.round((ow + 32) / 26);
      for (let i = 0; i < n; i++) { const sx = ox - 16 + (ow + 32) * i / n, sw2 = (ow + 32) / n; ctx.beginPath(); ctx.moveTo(sx, ay + ah - 1); ctx.lineTo(sx + sw2, ay + ah - 1); ctx.lineTo(sx + sw2, ay + ah + 8); ctx.quadraticCurveTo(sx + sw2 / 2, ay + ah + 18, sx, ay + ah + 8); ctx.fill(); }
      ctx.fillStyle = 'rgba(238,243,249,0.35)'; ctx.fillRect(ox - 4, ay, ow + 8, 3);
    } else if (type === 2) {
      ctx.fillStyle = 'rgba(28,38,54,0.3)'; ctx.fillRect(ox - 10, sTop + 78, ow + 20, 22);
      ctx.fillStyle = mixHex(wall, '#2b3648', 0.5); ctx.fillRect(ox - 24, sTop + 60, ow + 48, 18);
      ctx.fillStyle = 'rgba(238,243,249,0.3)'; ctx.fillRect(ox - 24, sTop + 60, ow + 48, 3);
    }
    // pilasters and a hanging blade sign
    ctx.fillStyle = mixHex(wall, '#eef3f9', 0.18); ctx.fillRect(ux, sTop + 4, 18, G - sTop - 4); ctx.fillRect(ux + uw - 18, sTop + 4, 18, G - sTop - 4);
    ctx.fillStyle = mixHex(wall, '#2b3648', 0.3); ctx.fillRect(ux, G - 30, 18, 30); ctx.fillRect(ux + uw - 18, G - 30, 18, 30);
    if (r() < 0.6) { const bx = ux + (r() < 0.5 ? 26 : uw - 70); ctx.fillStyle = '#2f3d52'; ctx.fillRect(bx, sTop - 26, 44, 3); fillRR(ctx, bx + 4, sTop - 22, 38, 50, 5, mixHex(awn, '#dfe7f0', 0.2)); ctx.fillStyle = 'rgba(238,243,249,0.6)'; ctx.beginPath(); ctx.arc(bx + 23, sTop + 2, 10, 0, TAU); ctx.fill(); }
    if (type === 4) {    // café tables on the far pavement
      for (let i = 0; i < 2; i++) { const tx = ox + ow * (0.3 + i * 0.36); ctx.fillStyle = '#34435a'; ctx.fillRect(tx - 2, G - 44, 4, 46); ctx.fillRect(tx - 24, G - 48, 48, 5); ctx.fillRect(tx - 46, G - 30, 4, 32); ctx.fillRect(tx - 52, G - 32, 22, 4); ctx.fillRect(tx + 42, G - 30, 4, 32); ctx.fillRect(tx + 30, G - 32, 22, 4); }
    }
  }
  ctx.fillStyle = mixHex(wall, '#2b3648', 0.22); ctx.fillRect(x0, sTop, w, 5);
  ctx.fillStyle = mixHex(wall, '#eef3f9', 0.25); ctx.fillRect(x0, sTop - 4, w, 4);
  // atmosphere
  ctx.fillStyle = 'rgba(185,198,216,0.16)'; ctx.fillRect(x0 - 4, top - 80, w + 8, G - top + 82);
}

function crTreeFar(ctx, x, G, s, seed) {
  ctx.fillStyle = '#5b6878'; ctx.beginPath(); ctx.moveTo(x - 9 * s, G); ctx.lineTo(x - 6 * s, G - 260 * s); ctx.lineTo(x + 6 * s, G - 260 * s); ctx.lineTo(x + 9 * s, G); ctx.fill();
  const cv = canopy('cr-crown-' + (seed % 3), 420, 380, 40 + (seed % 3), ['#66757f', '#74848c', '#8a9aa2'], { n: 70, clump: 36, branch: '#5b6878', gaps: 14 });
  ctx.drawImage(cv, x - 210 * s, G - 560 * s, 420 * s, 380 * s);
}

function crShelter(ctx, x, G, s, t) {
  // glass bus shelter seen from behind the pavement: roof, posts, back glass, bench, a blank light box
  const w = 560 * s, h = 580 * s, x0 = x - w / 2;
  ctx.fillStyle = 'rgba(20,28,40,0.28)'; ctx.beginPath(); ctx.ellipse(x, G + 3, w * 0.56, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(214,224,236,0.20)'; ctx.fillRect(x0 + 10 * s, G - h + 34 * s, w - 150 * s, h - 110 * s);
  ctx.fillStyle = 'rgba(238,243,249,0.16)';
  for (let i = 0; i < 3; i++) { const rx = x0 + (80 + i * 130) * s; ctx.beginPath(); ctx.moveTo(rx, G - h + 34 * s); ctx.lineTo(rx + 50 * s, G - h + 34 * s); ctx.lineTo(rx - 60 * s, G - 76 * s); ctx.lineTo(rx - 110 * s, G - 76 * s); ctx.fill(); }
  ctx.fillStyle = '#3a495f';
  for (const px of [x0 + 6 * s, x0 + w * 0.5 - 70 * s, x0 + w - 146 * s]) ctx.fillRect(px, G - h + 20 * s, 9 * s, h - 20 * s);
  ctx.fillRect(x0 + 6 * s, G - 80 * s, w - 150 * s, 6 * s);
  // light box
  fillRR(ctx, x0 + w - 136 * s, G - h + 46 * s, 130 * s, h - 96 * s, 6 * s, '#33425a');
  ctx.fillStyle = linGrad(ctx, 0, G - h + 56 * s, 0, G - 60 * s, [[0, '#eef3f9'], [1, '#c9d5e3']]); ctx.fillRect(x0 + w - 126 * s, G - h + 58 * s, 110 * s, h - 122 * s);
  ctx.fillStyle = 'rgba(86,103,127,0.5)'; fillRR(ctx, x0 + w - 108 * s, G - h + 96 * s, 74 * s, 150 * s, 8 * s, ctx.fillStyle);
  ctx.fillStyle = 'rgba(86,103,127,0.4)'; ctx.fillRect(x0 + w - 108 * s, G - h + 270 * s, 74 * s, 10 * s); ctx.fillRect(x0 + w - 108 * s, G - h + 292 * s, 50 * s, 10 * s);
  glow(ctx, x0 + w - 70 * s, G - h * 0.5, 190 * s, '#dfe7f0', 0.2);
  ctx.fillRect(x0 + w - 136 * s, G - 52 * s, 130 * s, 52 * s);
  // roof
  ctx.fillStyle = '#2f3d52'; ctx.beginPath(); ctx.moveTo(x0 - 26 * s, G - h + 26 * s); ctx.quadraticCurveTo(x, G - h - 6 * s, x0 + w + 26 * s, G - h + 26 * s); ctx.lineTo(x0 + w + 26 * s, G - h + 40 * s); ctx.quadraticCurveTo(x, G - h + 10 * s, x0 - 26 * s, G - h + 40 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(238,243,249,0.4)'; ctx.fillRect(x0 - 20 * s, G - h + 24 * s, w + 40 * s, 2);
  // bench and the people waiting
  ctx.fillStyle = '#2f3d52'; ctx.fillRect(x0 + 40 * s, G - 114 * s, 300 * s, 10 * s); ctx.fillRect(x0 + 60 * s, G - 106 * s, 8 * s, 106 * s); ctx.fillRect(x0 + 312 * s, G - 106 * s, 8 * s, 106 * s);
  ctx.fillStyle = '#1d2634';
  ctx.save(); ctx.translate(x0 + 130 * s, G); figure(ctx, 414 * s, 'sit', { coat: 0, bun: 1 }); ctx.restore();
  ctx.save(); ctx.translate(x0 + 392 * s, G); ctx.scale(-1, 1); figure(ctx, 440 * s, null, { coat: 1, bag: 1 }); ctx.restore();
  // stop flag
  ctx.fillStyle = '#3a495f'; ctx.fillRect(x0 - 96 * s, G - 640 * s, 8 * s, 640 * s);
  ctx.beginPath(); ctx.arc(x0 - 92 * s, G - 610 * s, 44 * s, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c9d5e3'; ctx.beginPath(); ctx.arc(x0 - 92 * s, G - 610 * s, 35 * s, 0, TAU); ctx.fill();
  fillRR(ctx, x0 - 112 * s, G - 622 * s, 40 * s, 24 * s, 5 * s, '#3a495f');
  fillRR(ctx, x0 - 122 * s, G - 548 * s, 60 * s, 96 * s, 4 * s, '#c9d5e3'); ctx.fillStyle = 'rgba(58,73,95,0.5)'; for (let i = 0; i < 5; i++) ctx.fillRect(x0 - 114 * s, G - (536 - i * 16) * s, (30 + hash(i) * 14) * s, 5 * s);
}

function crLamp(ctx, x, G, s) {
  ctx.fillStyle = 'rgba(20,28,40,0.25)'; ctx.beginPath(); ctx.ellipse(x, G + 2, 40 * s, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = linGrad(ctx, x - 9 * s, 0, x + 9 * s, 0, [[0, '#2c394b'], [0.6, '#3d4c62'], [1, '#6f8098']]);
  ctx.fillRect(x - 7 * s, G - 2600 * s, 14 * s, 2600 * s);
  fillRR(ctx, x - 14 * s, G - 150 * s, 28 * s, 150 * s, 5 * s, '#2c394b'); ctx.fillStyle = '#2c394b'; ctx.fillRect(x - 19 * s, G - 12 * s, 38 * s, 12 * s);
  // a blank notice and a bin strapped to the pole
  fillRR(ctx, x - 44 * s, G - 470 * s, 88 * s, 62 * s, 4 * s, '#c9d5e3'); ctx.fillStyle = 'rgba(58,73,95,0.55)'; ctx.fillRect(x - 32 * s, G - 452 * s, 50 * s, 7 * s); ctx.fillRect(x - 32 * s, G - 436 * s, 34 * s, 7 * s);
  fillRR(ctx, x + 10 * s, G - 260 * s, 62 * s, 96 * s, 8 * s, '#33425a'); ctx.fillStyle = '#1d2634'; ctx.fillRect(x + 20 * s, G - 246 * s, 42 * s, 9 * s);
}

function crTreeNear(ctx, x, G, s, seed, t) {
  // trunk in a guard; the crown hangs into the top of the frame
  ctx.fillStyle = 'rgba(20,28,40,0.22)'; ctx.beginPath(); ctx.ellipse(x, G + 2, 70 * s, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = linGrad(ctx, x - 20 * s, 0, x + 20 * s, 0, [[0, '#28323f'], [0.7, '#3a4756'], [1, '#56657a']]);
  ctx.beginPath(); ctx.moveTo(x - 22 * s, G); ctx.quadraticCurveTo(x - 14 * s, G - 200 * s, x - 16 * s, G - 520 * s); ctx.lineTo(x + 14 * s, G - 520 * s); ctx.quadraticCurveTo(x + 12 * s, G - 200 * s, x + 24 * s, G); ctx.fill();
  ctx.strokeStyle = '#2f3b4c'; ctx.lineWidth = 12 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 4 * s, G - 500 * s); ctx.quadraticCurveTo(x - 40 * s, G - 600 * s, x - 150 * s, G - 700 * s); ctx.moveTo(x + 2 * s, G - 500 * s); ctx.quadraticCurveTo(x + 50 * s, G - 620 * s, x + 170 * s, G - 720 * s); ctx.stroke();
  ctx.strokeStyle = '#33425a'; ctx.lineWidth = 4 * s;
  for (const gx of [-44, -15, 15, 44]) { ctx.beginPath(); ctx.moveTo(x + gx * s, G); ctx.lineTo(x + gx * s, G - 150 * s); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(x - 46 * s, G - 150 * s); ctx.lineTo(x + 46 * s, G - 150 * s); ctx.moveTo(x - 46 * s, G - 76 * s); ctx.lineTo(x + 46 * s, G - 76 * s); ctx.stroke();
  const cv = canopy('cr-near-crown-' + (seed % 2), 900, 560, 70 + (seed % 2), ['#3f4c58', '#4d5b66', '#627079'], { n: 110, clump: 52, gaps: 26 });
  const sway = wobble(t, 0.3, seed) * 0.012;
  ctx.save(); ctx.translate(x, G - 560 * s); ctx.rotate(sway); ctx.drawImage(cv, -450 * s, -500 * s, 900 * s, 560 * s); ctx.restore();
}

function crFgSprite(kind, n) {
  // out-of-focus foreground pieces, drawn once with a blur. Their local origin is bottom-centre.
  const ink = '#0d1119';
  if (kind === 'post') return cached('cr-fg-post', 320, 1100, (c) => { c.filter = 'blur(7px)'; c.fillStyle = ink; c.fillRect(60, 20, 200, 1100); c.fillRect(30, 880, 260, 240); c.fillStyle = 'rgba(120,136,158,0.25)'; c.fillRect(236, 20, 16, 1100); });
  if (kind === 'bollard') return cached('cr-fg-bollard', 200, 420, (c) => { c.filter = 'blur(6px)'; c.fillStyle = ink; rr(c, 60, 40, 80, 400, 34); c.fill(); c.fillRect(48, 110, 104, 22); c.fillStyle = 'rgba(120,136,158,0.22)'; c.fillRect(124, 70, 10, 340); });
  if (kind === 'rail') return cached('cr-fg-rail', 1000, 520, (c) => {
    c.filter = 'blur(6px)'; c.fillStyle = ink;
    c.fillRect(20, 40, 960, 22); c.fillRect(20, 380, 960, 16);
    for (let x = 30; x < 980; x += 58) c.fillRect(x, 50, 12, 340);
    for (const px of [20, 480, 950]) c.fillRect(px, 14, 30, 520);
    c.fillStyle = 'rgba(120,136,158,0.2)'; c.fillRect(20, 40, 960, 5);
  });
  return cached(`cr-fg-ped-${kind}-${n}`, 560, 840, (c) => {
    c.filter = 'blur(7px)'; c.fillStyle = ink; c.translate(280, 820);
    figure(c, 590, n / 8, kind === 0 ? { coat: 1, bag: 1 } : kind === 1 ? { pack: 1, hat: 1 } : { coat: 1, bun: 1 });
  });
}

export const cityRun = {
  W: 7200,
  floorY: FY,
  anchors: {
    line: { x0: -1500, x1: 8700, y: 700 },
    start: { x: 400, y: 700 },
    end: { x: 6000, y: 700 },
    busStop: { x: 3260, y: 700 },
    crossing1: { x: 1560, y: 700 },
    park: { x: 4260, y: 700 },
    crossing2: { x: 7320, y: 700 },
  },
  lights: { greyMorning: { key: '#cfdcee', from: 1, amount: 0.35 } },

  back(ctx, F, o = {}) {
    const L = LOOK.greyMorning, cam = camOf(o), t = o.t ?? F.t, traffic = clamp(o.traffic ?? 1);
    ctx.drawImage(crSky(), 0, 0);

    camera(ctx, cam, 0.12, () => {
      const far = cityStrip('cr-far', 3800, 380, { seed: 23, minW: 40, maxW: 120, minH: 60, maxH: 370, pow: 1.7, color: '#b3c0d1', color2: '#a6b4c8', haze: '#cfd9e5', hazeK: 0.8, gapP: 0.3, gap: 60,
        win: { w: 3, h: 4, gx: 9, gy: 11, lit: 0, dark: 0.5, darkColor: '#8a9bb3', darkAlpha: 0.22 } });
      ctx.drawImage(far, -560, gy(0.12) - 372);
    });
    camera(ctx, cam, 0.25, () => {
      const mid = cityStrip('cr-mid', 4800, 460, { seed: 31, minW: 90, maxW: 240, minH: 120, maxH: 440, pow: 1.3, color: '#97a7bc', color2: '#8898af', haze: '#c3cedd', hazeK: 0.7, gapP: 0.35, gap: 90,
        win: { w: 6, h: 9, gx: 15, gy: 19, lit: 0.04, color: '#eef3f9', alpha: 0.5, dark: 0.6, darkColor: '#5d6d84', darkAlpha: 0.3 } });
      ctx.drawImage(mid, -760, gy(0.25) - 452);
    });

    // ground plane (picture space): far road haze → road → near pavement
    const yH = proj(cam, 0, gy(0.2), 0.2)[1], yFar = proj(cam, 0, gy(CR.dRow), CR.dRow)[1], yKerb = proj(cam, 0, gy(0.93), 0.93)[1];
    ctx.fillStyle = linGrad(ctx, 0, yH, 0, yKerb, [[0, '#c3cedd'], [0.45, '#8f9db1'], [0.62, '#7d8ca1'], [1, '#62718a']]);
    ctx.fillRect(0, yH, PW, Math.max(0, yKerb - yH) + 2);
    ctx.fillStyle = linGrad(ctx, 0, yKerb, 0, PH, [[0, '#93a0b3'], [0.3, '#8492a6'], [1, '#63718a']]);
    ctx.fillRect(0, yKerb, PW, PH - yKerb + 2);

    // side walls of the corner buildings, receding down the side streets
    for (const b of CR.row) {
      if (typeof b[2] !== 'number') continue;
      const [x0, x1, st, , seed] = b, wall = mixHex(CR_WALL[mod(seed, CR_WALL.length)], '#b9c6d8', 0.3), topH = (565 - (st === 1 ? 178 : 208 - (st - 1) * 369)) / 0.5;
      for (const xe of [x0, x1]) {
        const X = CX + (xe - CX) / 0.5;
        const a = gp(cam, X, 0.5, 0), b2 = gp(cam, X, 0.5, topH), c2 = gp(cam, X, 0.27, topH), d = gp(cam, X, 0.27, 0);
        if (Math.max(a[0], d[0]) < -50 || Math.min(a[0], d[0]) > PW + 50) continue;
        ctx.fillStyle = linGrad(ctx, a[0], 0, d[0], 0, [[0, mixHex(wall, '#2b3648', 0.16)], [1, mixHex(wall, '#c3cedd', 0.55)]]);
        poly(ctx, [a, b2, c2, d]); ctx.fill();
      }
    }

    // far side: shopfronts, gaps, the little park
    camera(ctx, cam, CR.dRow, () => {
      const v = view(cam, CR.dRow);
      for (const b of CR.row) {
        if (b[1] < v.x0 - 60 || b[0] > v.x1 + 60) continue;
        if (b[2] === 'park') {
          const [x0, x1] = b, G = 565;
          for (let i = 0; i < 4; i++) crTreeFar(ctx, x0 + 90 + i * 175 + hash(i + 3) * 40, G - 6, 1.25 + hash(i) * 0.3, i + 1);
          ctx.fillStyle = '#8e9db2'; ctx.fillRect(x0, G - 40, x1 - x0, 42);
          ctx.fillStyle = '#a9b6c8'; ctx.fillRect(x0, G - 46, x1 - x0, 7);
          ctx.fillStyle = '#4c5b72';
          for (let x = x0 + 6; x < x1; x += 13) ctx.fillRect(x, G - 124, 2.4, 80);
          ctx.fillRect(x0, G - 126, x1 - x0, 4); ctx.fillRect(x0, G - 60, x1 - x0, 3);
          for (const px of [x0, x0 + (x1 - x0) / 2 - 60, x0 + (x1 - x0) / 2 + 40, x1 - 20]) { ctx.fillStyle = '#93a2b7'; ctx.fillRect(px, G - 150, 22, 150); ctx.fillStyle = '#b3c0d1'; ctx.fillRect(px - 3, G - 156, 28, 8); }
        } else if (typeof b[2] === 'number') crBuilding(ctx, b);
      }
      // far pavement + kerb
      ctx.fillStyle = '#a6b3c5'; ctx.fillRect(v.x0 - 50, 565, v.x1 - v.x0 + 100, 12);
      ctx.fillStyle = '#7f8ea4'; ctx.fillRect(v.x0 - 50, 576, v.x1 - v.x0 + 100, 4);
      // people on the far pavement
      for (const [X0, dir, k] of CR.farPeds) {
        const X = X0 + dir * 150 * t, x = lx(X, 0.5);
        if (x < v.x0 - 80 || x > v.x1 + 80) continue;
        ctx.fillStyle = '#48566a';
        ctx.save(); ctx.translate(x, 571); ctx.scale(dir, 1); figure(ctx, (410 + hash(k) * 40) * 0.5, mod(t * 0.9 + hash(k + 9), 1), { coat: k % 2, bag: k % 3 === 0, pack: k % 3 === 1, bun: k % 4 === 2, hat: k % 5 === 3 }); ctx.restore();
      }
    });

    // far kerb: parked cars, trees
    camera(ctx, cam, CR.dFarKerb, () => {
      const v = view(cam, CR.dFarKerb), G = gy(CR.dFarKerb), s = CR.dFarKerb;
      for (const it of CR.farKerb) {
        const x = lx(it[1], s);
        if (x < v.x0 - 700 || x > v.x1 + 700) continue;
        if (it[0] === 'tree') crTreeFar(ctx, x, G - 8, 1.05, it[1] / 100 | 0);
        else {
          const P = CAR[it[2]];
          ctx.fillStyle = 'rgba(30,40,56,0.3)'; ctx.beginPath(); ctx.ellipse(x, G + 2, P.L * s * 0.52, 5, 0, 0, TAU); ctx.fill();
          ctx.save(); ctx.translate(x + P.L * s / 2, G); ctx.scale(-s, s); drawCar(ctx, P, crPal(it[3], 0.34), { detail: 1 }); ctx.restore();
        }
      }
    });

    // road markings, crossings
    camera(ctx, cam, 0.72, () => {
      const v = view(cam, 0.72), G = gy(0.72);
      ctx.fillStyle = 'rgba(226,234,244,0.5)';
      for (let x = Math.floor((v.x0 - 200) / 300) * 300; x < v.x1 + 200; x += 300) ctx.fillRect(x, G - 2, 130, 4);
    });
    for (const key of ['crossing1', 'crossing2']) {
      const X = cityRun.anchors[key].x, D0 = 2400 / 0.895, D1 = 2400 / 0.575;
      for (let k = 0; k < 9; k++) {
        const da = 2400 / lerp(D0, D1, (k * 2) / 17), db = 2400 / lerp(D0, D1, (k * 2 + 1) / 17);
        const p = [gp(cam, X - 330, da), gp(cam, X + 330, da), gp(cam, X + 330, db), gp(cam, X - 330, db)];
        if (p[1][0] < -100 || p[0][0] > PW + 100) break;
        ctx.fillStyle = 'rgba(226,234,244,0.55)'; poly(ctx, p); ctx.fill();
      }
    }
    // a little moving traffic
    if (traffic > 0) {
      const movers = [[0.66, -1, 5200, 430, 'sedan', 2], [0.66, -1, 9000, 520, 'van', 4], [0.8, 1, -900, 560, 'hatch', 3], [0.8, 1, 2100, 470, 'suv', 0]];
      ctx.save(); ctx.globalAlpha = traffic;
      for (const [d, dir, X0, vel, kind, pi] of movers) {
        camera(ctx, cam, d, () => {
          const v = view(cam, d), P = CAR[kind], x = lx(mod(X0 + dir * vel * t + 2000, 12000) - 2000, d), G = gy(d);
          if (x < v.x0 - 800 || x > v.x1 + 800) return;
          ctx.fillStyle = 'rgba(30,40,56,0.3)'; ctx.beginPath(); ctx.ellipse(x, G + 2, P.L * d * 0.54, 6, 0, 0, TAU); ctx.fill();
          ctx.save(); ctx.translate(x - dir * P.L * d / 2, G); ctx.scale(dir * d, d); drawCar(ctx, P, crPal(pi, (1 - d) * 0.5), { detail: 1 }); ctx.restore();
        });
      }
      ctx.restore();
    }

    // near kerb: parked cars, scooters, lamp posts, trees, the bus shelter
    camera(ctx, cam, CR.dKerb, () => {
      const v = view(cam, CR.dKerb), G = gy(CR.dKerb), s = CR.dKerb;
      // kerb stones
      ctx.fillStyle = '#a3afc0'; ctx.fillRect(v.x0 - 50, G - 2, v.x1 - v.x0 + 100, 8);
      ctx.fillStyle = 'rgba(43,54,72,0.35)'; ctx.fillRect(v.x0 - 50, G - 4, v.x1 - v.x0 + 100, 2.5);
      for (const it of CR.kerb) {
        const x = lx(it[1], s);
        if (x < v.x0 - 900 || x > v.x1 + 900) continue;
        if (it[0] === 'car') {
          const P = CAR[it[2]];
          ctx.fillStyle = 'rgba(24,32,46,0.42)'; ctx.beginPath(); ctx.ellipse(x, G + 1, P.L * s * 0.53, 9, 0, 0, TAU); ctx.fill();
          ctx.save(); ctx.translate(x - P.L * s / 2, G - 3); ctx.scale(s, s); drawCar(ctx, P, crPal(it[3], 0.04), { detail: 2 }); ctx.restore();
        } else if (it[0] === 'scooter') {
          ctx.fillStyle = 'rgba(24,32,46,0.36)'; ctx.beginPath(); ctx.ellipse(x, G + 1, 220 * s, 6, 0, 0, TAU); ctx.fill();
          const p = crPal(it[2] + 1, 0.04);
          ctx.save(); ctx.translate(x - 220 * s, G - 2); ctx.scale(s, s); drawScooter(ctx, p); ctx.restore();
        } else if (it[0] === 'lamp') crLamp(ctx, x, G, s);
        else if (it[0] === 'tree') crTreeNear(ctx, x, G, s, it[1] / 100 | 0, t);
        else if (it[0] === 'shelter') crShelter(ctx, x, G, s, t);
      }
    });

    // the pavement: flag joints in perspective (they streak past in a tracking shot), covers, damp patches
    {
      const v1 = view(cam, 1);
      ctx.strokeStyle = 'rgba(43,54,72,0.24)'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let X = Math.floor((v1.x0 - 400) / 172) * 172; X < v1.x1 + 400; X += 172) { const a = gp(cam, X, 0.94), b = gp(cam, X, 1.6); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      for (const d of [0.975, 1.04, 1.115, 1.2, 1.3, 1.42]) { const yy = proj(cam, 0, gy(d), d)[1]; ctx.moveTo(0, yy); ctx.lineTo(PW, yy); }
      ctx.stroke();
      // tactile strip along the kerb
      const ya = proj(cam, 0, gy(0.945), 0.945)[1], yb = proj(cam, 0, gy(0.965), 0.965)[1];
      ctx.fillStyle = 'rgba(214,224,236,0.22)'; ctx.fillRect(0, ya, PW, yb - ya);
      for (let i = Math.floor((v1.x0 - 600) / 900); i <= Math.ceil((v1.x1 + 600) / 900); i++) {
        const X = i * 900 + hash(i) * 500, d = 1.06 + hash(i + 50) * 0.2;
        const [px, py] = gp(cam, X, d), z = 1 + (cam.zoom - 1) * d;
        if (hash(i + 7) < 0.5) {       // manhole cover
          ctx.fillStyle = 'rgba(43,54,72,0.4)'; ctx.beginPath(); ctx.ellipse(px, py, 62 * d * z, 13 * d * z, 0, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(214,224,236,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(px, py, 50 * d * z, 10 * d * z, 0, 0, TAU); ctx.stroke();
        } else {                       // damp patch mirroring the sky
          ctx.fillStyle = radGrad(ctx, px, py, 0, 190 * z, [[0, 'rgba(226,234,244,0.4)'], [0.7, 'rgba(226,234,244,0.16)'], [1, 'rgba(226,234,244,0)']]);
          ctx.save(); ctx.translate(px, py); ctx.scale(1, 0.11); ctx.translate(-px, -py); ctx.beginPath(); ctx.arc(px, py, 190 * z, 0, TAU); ctx.fill(); ctx.restore();
        }
      }
    }
  },

  mid() {},

  front(ctx, F, o = {}) {
    const L = LOOK.greyMorning, cam = camOf(o), t = o.t ?? F.t, fg = clamp(o.fg ?? 1), peds = clamp(o.peds ?? 1);
    // thin daylight haze over the street
    fog(ctx, t, 500, 140, L.haze, 0.035, 5, 10);
    if (fg > 0) {
      camera(ctx, cam, CR.dFg, () => {
        const v = view(cam, CR.dFg), G = gy(CR.dFg), s = CR.dFg;
        ctx.save(); ctx.globalAlpha = fg;
        for (const it of CR.fg) {
          const x = lx(it[1], s);
          if (x < v.x0 - 1000 || x > v.x1 + 1000) continue;
          if (it[0] === 'post') ctx.drawImage(crFgSprite('post'), x - 160, G - 1100 + 60);
          else if (it[0] === 'bollards') for (let i = 0; i < it[2]; i++) ctx.drawImage(crFgSprite('bollard'), x + i * 250 - 100, G - 400);
          else if (it[0] === 'rail') { const n = Math.round(it[2] * s / 480); for (let i = 0; i < n; i++) ctx.drawImage(crFgSprite('rail'), x + i * 930 * 0.52 - 10, G - 260, 1000 * 0.52, 520 * 0.52); }
        }
        ctx.restore();
        if (peds > 0) {
          ctx.save(); ctx.globalAlpha = peds;
          for (const [X0, dir, k] of CR.peds) {
            const x = lx(X0 + dir * 300 * t, s);
            if (x < v.x0 - 400 || x > v.x1 + 400) continue;
            const ph = mod(t * 1.7 + k * 0.37, 1), n = Math.floor(ph * 8) % 8;
            ctx.save(); ctx.translate(x, G); ctx.scale(dir, 1); ctx.drawImage(crFgSprite(k, n), -280, -820); ctx.restore();
          }
          ctx.restore();
        }
      });
    }
  },
};

// ═══ END ═══
