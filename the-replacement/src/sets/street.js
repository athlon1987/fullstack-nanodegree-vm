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
//    The street outside the family's apartment block in low golden morning sun, side-on. The camera stands in
//    the road and looks across OUR pavement (the floor line y = 700). Left → right along the world:
//      x −1100…700   a sunlit terrace (two houses with a café between: green-striped awning, blank fascia board,
//                    bistro tables) set back at depth 0.86; street tree at x 380
//      x 700…1700    a little park behind low railings: lawn, two backlit trees (x 860, 1490), and through them the
//                    cross road (depth 0.5: traffic, the bus, parked cars at 0.56) and the far terrace in gold haze.
//                    Two wooden poles (x 640, 1660) carry wires with eight sparrows on them.
//      x 1700…2260   a side street runs away from camera; the ZEBRA CROSSING lies on our walking line, with a
//                    striped beacon (amber globe, blinking) at each kerb (x 1688, 2272)
//      x 2300…3820   the APARTMENT BLOCK (facade at depth 0.9): ground-floor windows, the ENTRANCE at x 3130 (two
//                    steps, door open, a sunlit glass door at the back of the lobby), planters, street tree x 3560,
//                    a bicycle against the wall at x 3730
//      x 3820…4320   a garden gap (low wall, open gate, hedge): the LOW SUN shines through here, at screen right
//      x 4320…       the next building
//    Sun: low at screen right (it moves only with depth 0.06). Shadows of everything rake toward camera-left.
//    W 3600 (painted from x −1100 to 5600: pan anywhere along it).
//    state   busX    world x | null (default null)  centre of a bus on the cross road (depth 0.5); sweep it e.g. 4200 → −1200 over 3 s
//            busDir  −1 | 1     (default −1)  the bus faces/moves left (−1) or right (+1)
//            flare   0..1       (default 1)   sun flare (glow, warm anamorphic streak, ghosts) — only where the sun is visible
//            blur    0..1       (default 0)   1 = the whole background becomes a soft, bright, out-of-focus plate with leaf bokeh
//                                             (a 1/4-res render blurred each frame; cheap). Use 1 for a7_09 / a7_13 close-ups.
//            traffic 0..1       (default 1)   the few cars moving on the cross road (from o.t)
//            fgLeaves 0..1      (default 1)   out-of-focus leaves hanging into the top of frame (depth 1.45; auto-off at blur 1)
//            part   'all' | 'far' | 'near'  back() only: 'far' = sky … cross road/bus/parked cars; 'near' = park, facades, our
//                                             pavement. Put people on the far pavement between the two calls. (Ignored with blur.)
//    ambient (from o.t): drifting pollen in the light, crowns swaying with sparkles of sun, birds bobbing/hopping, beacons blinking.
//    anchors (WORLD, on the floor line unless they carry {depth, scale}):
//            line      {x0: −1100, x1: 4600, y: 700}  the walking line
//            walkFrom  (1620, 700)   a7_04: Adam has just crossed and walks LEFT from here (sunlit park + far haze behind)
//            stop      (1150, 700)   a7_04/a7_06/a7_09: where Adam stops dead (bright lawn, cross road and bus behind him)
//            crossing  (1980, 700)   middle of the zebra crossing;  crossL (1700, 700) / crossR (2260, 700) its two kerbs
//            meet      (2600, 700)   a7_12/a7_13: where father and daughter meet (Adam kneels here; Maya ≈ meet.x + 120)
//            doorStep  (3130, 700)   on the pavement at the foot of the entrance steps
//            maya      (3330, 700)   a7_10: Maya waving the lunchbox, a little right of the door, flare behind her
//            wife      {x: 2913, y: 608.2, depth: 0.9, scale: 0.9}   LAYER point (feet) in the open doorway: draw her inside
//                                    camera(ctx, cam, 0.9, …) at (x, y) with s 0.9, after back() and before mid()
//            ped1 (260, 700) · ped2 (1480, 700) · ped3 (2850, 700) · ped4 (3700, 700)   passer-by marks on our pavement
//            farPedL {x: 976.8, y: 543.4, depth: 0.42, scale: 0.42} · farPedR {x: 1417.8, …}   far pavement (between part far/near)
//            sun {x: 1810, y: 352, depth: 0.06}  (use homeStreet.sunAt(o) → {x, y, vis} for its picture position)
//    helpers homeStreet.castShadow(ctx, o, x, h = 430, k = 1): the long golden-hour shadow of a figure standing at world x —
//            call it after back(), before drawing the figure (h = figure height; ~250 for a kneeling adult, 285 Maya).
//            homeStreet.sunAt(o) → {x, y, vis}: picture position of the sun and 0..1 visibility (for a matching glint).
//    light   golden: key '#ffd08a' from the right (+1), amount 0.85 (the low sun behind-right of everyone)
//    framing a7_04  walk: {x: adamX − 100, y: 402, zoom: 1.0 → 1.05} as he goes 1620 → 1150 (bright park behind)
//            a7_06  wide: {x: 1150, y: 402, zoom: 1.0 → 1.04}, busX sweeping 4000 → −800, peds at ped1/ped2
//            a7_09  ECU: {x: stop.x − 30, y: 300, zoom: 3}, blur: 1, fgLeaves 0 (soft gold plate + bokeh)
//            a7_10  POV: {x: 3260, y: 400, zoom: 1.15 → 1.2}, flare 1 (sun in the garden gap at screen right)
//            a7_12  track: {x: midpoint of the two runners, y: 380, zoom: 0.85}, busX optional
//            a7_13  close: {x: meet.x + 40, y: 480, zoom: 2.4}, blur 0.6–1 (bright windows of the block behind them)
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// 4. carInterior — the video inside the phone in a7_07 — look: 'rainNight'
//    Inside a parked car at night, side-on: the driver in profile facing RIGHT, his seat and headrest behind him, the
//    rain-beaded driver's window (wet street bokeh outside) behind his head, the A-pillar, the windscreen at the right
//    with a sodium streetlight blooming through it and rain crawling down, the rear-view mirror, the steering wheel in
//    front of him and the dashboard with a dim green-white instrument glow below. Drawn at true scale (driver s = 1).
//    W 1920 (cabin painted x −600…2600; everything outside the glass is dark trim).
//    state   rain  0..1  (default 1)    beads + rivulets on all glass, rain falling outside
//            lamp  0..1  (default 1)    the sodium streetlight (bloom, rim on pillar/mirror/wheel, wash on his face)
//            dash  0..1  (default 1)    instrument glow (dim green-white) and its up-light on the driver
//            sweep 0..1  (default 1)    a passing car's headlights sweep the cabin right → left every 13 s (at t ≈ 9, 22, …)
//            mist  0..1  (default 0.4)  condensation along the bottom of the side glass
//    anchors driver   {x: 860, y: 700, seat: 110}   pose for drawFigure: {x, y, seat, facing: 1, ...POSE.sit}
//            hips     (860, 568)    where his pelvis sits (top of the seat cushion)
//            head     (927, 411)    his head centre with POSE.sit + {curl: 10, neck: 6} (a tired slump); r ≈ 27
//            wheelGrip (997, 462) · wheelTop (994, 449) · wheelHub (1012, 500)   IK targets for hands on the wheel
//            eyeLine  (1160, 400)   looking out of the windscreen toward the light
//            lens     (1180, 470)   the phone propped on the dashboard = the camera he looks into
//            lamp     (1094, 404)   the streetlight · mirror (1068, 354)
//    crop    the video is shown in a phone-shaped clip. Recommended (PICTURE space, with its camera):
//            crop45  {x: 660, y: 27, w: 600, h: 750, cam: {x: 935, y: 452, zoom: 1.65}}   4:5
//            crop916 {x: 734, y: 0, w: 452, h: 804, cam: {x: 935, y: 448, zoom: 1.4}}    9:16
//            i.e. clip to the rect, then call back/figure/front with that cam. Head upper third, wheel at right,
//            light top-right. Push in toward zoom 2.2–2.6 on the head for the long pause (stays crisp).
//    light   rainNight: key '#ffa64d' from the right (+1), amount 0.6 (the sodium light through the windscreen)
// ════════════════════════════════════════════════════════════════════════════════════════════
import {
  PW, PH, CX, CY, TAU, clamp, lerp, invlerp, ease, hash, rng, noise1, wobble, rgba, mixHex, rr, fillRR,
  linGrad, radGrad, glow, lightCone, fog, cached, scratch, camera,
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

// ════════════════════════════════════════════════════════════════════════════════════════════
// 3. HOME STREET
// ════════════════════════════════════════════════════════════════════════════════════════════
const HS = {
  dFar: 0.12, dRow: 0.3, dRoad: 0.5, dParked: 0.56, dPark: 0.7, dTer: 0.86, dNb: 0.88, dBlock: 0.9, dPole: 0.93, dRail: 0.95, dTree: 0.965, dBeacon: 0.975, dKerb: 1.22, dFg: 1.45,
  ter0: -1100, ter1: 700, cross0: 1700, cross1: 2260, block0: 2300, block1: 3820, door: 3130, nb0: 4320, nb1: 5600,
  sun: { x: 1810, y: 352, d: 0.06 },
  poles: [640, 1660],
  parkTrees: [[860, 0], [1490, 1]],
  streetTrees: [[380, 2], [3560, 3]],
  // birds on the upper wire between the poles: [position 0..1 along the span, facing]
  birds: [[0.22, 1], [0.27, -1], [0.315, 1], [0.46, 1], [0.5, 1], [0.545, -1], [0.67, 1], [0.72, -1]],
  terrace: [[-1100, -460, 'house', 0], [-460, 160, 'cafe', 1], [160, 700, 'house', 2]],
  stepH: 36,
};
const HS_INK = '#160c05';
const yD = (cam, d) => proj(cam, 0, gy(d), d)[1];

function hsSky() {
  return cached('hs-sky', PW, PH, (c) => {
    c.fillStyle = linGrad(c, 0, 0, 0, 470, [[0, '#d48f4c'], [0.28, '#eba862'], [0.6, '#ffcf88'], [0.84, '#ffe6b8'], [1, '#fff2d4']]);
    c.fillRect(0, 0, PW, PH);
    const r = rng(83);
    c.filter = 'blur(12px)';
    for (let i = 0; i < 20; i++) {
      const x = r() * PW, y = 30 + r() * 270, w = 220 + r() * 640, h = 8 + r() * 24;
      c.fillStyle = 'rgba(176,96,52,0.10)'; c.beginPath(); c.ellipse(x - 30, y - h * 0.5, w * 0.42, h * 0.4, -0.02, 0, TAU); c.fill();
      c.fillStyle = `rgba(255,${226 + Math.floor(r() * 26)},${176 + Math.floor(r() * 50)},${0.22 + r() * 0.26})`;
      c.beginPath(); c.ellipse(x, y, w / 2, h / 2, -0.02, 0, TAU); c.fill();
    }
  });
}
function hsBand(ctx, cam, d0, d1, stops) {
  const y0 = yD(cam, d0), y1 = yD(cam, d1);
  if (y1 <= y0 || y1 < -10 || y0 > PH + 10) return;
  ctx.fillStyle = linGrad(ctx, 0, y0, 0, y1, stops);
  ctx.fillRect(-200, y0, PW + 400, y1 - y0 + 1);
}
/** Long soft shadow of an upright thing standing at true world X, depth d, raked toward camera-left. */
function hsCast(ctx, cam, X, d, h, w, a = 0.3) {
  const L = 1.5 * h, dd = 0.00032 * h;
  const b0 = gp(cam, X - w / 2, d), b1 = gp(cam, X + w / 2, d), t0 = gp(cam, X - L - w * 0.9, d + dd), t1 = gp(cam, X - L + w * 0.3, d + dd);
  const m0 = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2], m1 = [(t0[0] + t1[0]) / 2, (t0[1] + t1[1]) / 2];
  ctx.fillStyle = linGrad(ctx, m0[0], m0[1], m1[0], m1[1], [[0, rgba('#5a2c10', a)], [0.55, rgba('#5a2c10', a * 0.55)], [1, rgba('#5a2c10', 0)]]);
  poly(ctx, [b1, b0, t0, t1]); ctx.fill();
}
/** Dappled crown shadow on the ground: soft blobs around the tip of a tree's shadow. */
function hsDapple(ctx, cam, X, d, h, seed, a = 0.22) {
  const L = 1.5 * h, dd = 0.00032 * h, z = 1 + (cam.zoom - 1) * (d + dd);
  for (let i = 0; i < 6; i++) {
    const [px, py] = gp(cam, X - L + (hash(seed * 31 + i) - 0.5) * 900, d + dd * (0.55 + hash(seed * 7 + i) * 0.7));
    const r = (90 + hash(seed + i * 5) * 160) * z;
    ctx.save(); ctx.translate(px, py); ctx.scale(1, 0.16);
    ctx.fillStyle = radGrad(ctx, 0, 0, 0, r, [[0, rgba('#5a2c10', a)], [0.6, rgba('#5a2c10', a * 0.6)], [1, rgba('#5a2c10', 0)]]);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.restore();
  }
}
/** A sunlit crown: dark olive inside, gold toward the light (right), with holes of sky. */
function hsCrown(i, s = 1) {
  const w = Math.round(1000 * s), h = Math.round(820 * s);
  return canopy('hs-crown-' + i + '-' + w, w, h, 120 + i * 7, ['#5e4a1e', '#8a6c28', '#c39a3e', '#f2c66a', '#ffe39c'],
    { n: 150, clump: 50 * s, gaps: 40, bx: 0.07, by: -0.05, branch: '#3e2a12' });
}
function hsTwinkle(ctx, x, y, w, h, t, seed, k) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const a = noise1(t * (0.8 + hash(seed + i) * 1.2), seed * 13 + i);
    if (a < 0.55) continue;
    const px = x + (0.45 + hash(seed * 3 + i) * 0.5) * w, py = y + (0.15 + hash(seed * 5 + i * 2) * 0.6) * h;
    ctx.fillStyle = rgba('#fff3cf', (a - 0.55) * 1.6 * k);
    ctx.beginPath(); ctx.arc(px, py, 3 + hash(i + seed) * 4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function hsBus(ctx, x, G, s, dir) {
  // local frame: 0 = rear … 1240 = nose, ground 0, facing +x; flipped for dir -1
  ctx.save(); ctx.translate(x, G); ctx.scale(dir * s, s); ctx.translate(-620, 0);
  const L = 1240, H = 470;
  ctx.fillStyle = 'rgba(60,30,12,0.35)'; ctx.beginPath(); ctx.ellipse(620, 2, 640, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#20160c'; for (const wx of [220, 1000]) { ctx.beginPath(); ctx.arc(wx, -60, 74, Math.PI, TAU); ctx.fill(); }
  ctx.fillStyle = linGrad(ctx, 0, -H, 0, -30, [[0, '#a8a07a'], [0.05, '#6f7350'], [0.55, '#59603f'], [0.62, '#e9dcb8'], [0.68, '#59603f'], [1, '#3a3f28']]);
  rr(ctx, 0, -H, L, H - 30, 26); ctx.fill();
  ctx.beginPath(); ctx.moveTo(L - 40, -H); ctx.quadraticCurveTo(L + 4, -H, L + 6, -H + 70); ctx.lineTo(L + 8, -60); ctx.lineTo(L - 30, -40); ctx.fill();
  // windows: gold reflections of the low sun, dark people-shapes inside
  for (let i = 0; i < 6; i++) {
    const wx = 60 + i * 168, ww = 150;
    ctx.fillStyle = linGrad(ctx, wx, -H + 50, wx + ww, -250, [[0, '#ffe6b0'], [0.35, '#c99a5a'], [1, '#4a3a22']]);
    rr(ctx, wx, -H + 48, ww, 190, 10); ctx.fill();
    if (hash(i + 3) < 0.6) { ctx.fillStyle = 'rgba(40,26,12,0.6)'; ctx.beginPath(); ctx.ellipse(wx + 50 + hash(i) * 60, -300, 22, 28, 0, 0, TAU); ctx.fill(); ctx.fillRect(wx + 28 + hash(i) * 60, -290, 44, 60); }
  }
  ctx.fillStyle = linGrad(ctx, 0, -H + 50, 0, -60, [[0, '#ffe2a8'], [1, '#6a5a38']]); rr(ctx, L - 110, -H + 48, 100, 380, 10); ctx.fill();   // door + windscreen
  ctx.fillStyle = 'rgba(30,22,10,0.5)'; ctx.fillRect(L - 62, -H + 48, 4, 380);
  ctx.fillStyle = '#fff1cf'; rr(ctx, L - 100, -H + 14, 80, 26, 5); ctx.fill();                            // blank destination blind
  for (const wx of [220, 1000]) { wheel(ctx, wx, 60, { tyre: '#1a120a', cap: '#8f8a6a', light: '#ffe6b0' }, false); }
  ctx.fillStyle = 'rgba(255,230,180,0.5)'; ctx.fillRect(10, -H + 2, L - 40, 3);
  ctx.restore();
}

function hsWindow(ctx, x, y, w, h, s, seed, box = true) {
  // x,y = bottom-left of the opening (layer px); w,h = size
  const f = 12 * s;
  fillRR(ctx, x - f, y - h - f, w + 2 * f, h + 2 * f, 2 * s, '#f7ead2');
  ctx.fillStyle = linGrad(ctx, x, y - h, x + w * 0.6, y, [[0, '#ffefc8'], [0.32, '#efbc78'], [0.65, '#b0743e'], [1, '#7a4a24']]);
  ctx.fillRect(x, y - h, w, h);
  ctx.fillStyle = 'rgba(58,32,14,0.35)'; ctx.fillRect(x + w - 26 * s, y - h, 26 * s, h);                      // reveal shadow
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,236,190,0.22)';
  ctx.beginPath(); ctx.moveTo(x + w * 0.15, y - h); ctx.lineTo(x + w * 0.38, y - h); ctx.lineTo(x + w * 0.08, y); ctx.lineTo(x, y); ctx.lineTo(x, y - h * 0.6); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#f2e2c4'; ctx.fillRect(x + w / 2 - 4 * s, y - h, 8 * s, h); ctx.fillRect(x, y - h * 0.62, w, 7 * s);
  if (hash(seed) < 0.6) { ctx.fillStyle = 'rgba(240,226,200,0.55)'; ctx.fillRect(x + 6 * s, y - h, w * 0.18, h * 0.9); }   // a half-drawn curtain
  fillRR(ctx, x - 26 * s, y + f - 2 * s, w + 52 * s, 16 * s, 2 * s, '#f9edd6');                              // sill
  ctx.fillStyle = 'rgba(90,44,16,0.28)'; ctx.fillRect(x - 40 * s, y + f + 14 * s, w + 50 * s, 12 * s);
  if (box) {
    fillRR(ctx, x - 6 * s, y + f - 40 * s, w + 12 * s, 38 * s, 3 * s, '#6a4424');
    const r = rng(seed * 11 + 5);
    for (let i = 0; i < 18; i++) {
      const px = x + r() * w, py = y + f - 40 * s - r() * 34 * s, rad = (8 + r() * 12) * s;
      const leaf = r() < 0.6;
      ctx.fillStyle = leaf ? (px > x + w * 0.5 ? '#a8933c' : '#6e6226') : ['#fff3d8', '#f6d36a', '#c8a8d8'][Math.floor(r() * 3)];
      ctx.beginPath(); ctx.arc(px, py, rad * (leaf ? 1 : 0.55), 0, TAU); ctx.fill();
    }
  }
}
function hsDoor(ctx, x, y, w, h, s, col) {
  fillRR(ctx, x - 16 * s, y - h - 16 * s, w + 32 * s, h + 16 * s, 2 * s, '#f7ead2');
  ctx.fillStyle = linGrad(ctx, x, 0, x + w, 0, [[0, mixHex(col, '#000000', 0.25)], [0.8, col], [1, mixHex(col, '#ffd08a', 0.35)]]);
  ctx.fillRect(x, y - h, w, h);
  ctx.fillStyle = linGrad(ctx, x, y - h, x + w, y - h + 70 * s, [[0, '#fff0cc'], [1, '#c98a48']]); ctx.fillRect(x + 10 * s, y - h + 8 * s, w - 20 * s, 64 * s);  // fanlight
  ctx.strokeStyle = rgba('#000000', 0.25); ctx.lineWidth = 3 * s;
  for (const [px, py, pw, ph] of [[0.14, 0.2, 0.3, 0.32], [0.56, 0.2, 0.3, 0.32], [0.14, 0.6, 0.3, 0.32], [0.56, 0.6, 0.3, 0.32]]) ctx.strokeRect(x + px * w, y - h + py * h, pw * w, ph * h);
  ctx.fillStyle = '#ffd890'; ctx.beginPath(); ctx.arc(x + w * 0.82, y - h * 0.48, 6 * s, 0, TAU); ctx.fill();
}

/** Static vector artwork of one depth layer, rendered once at `res`× into a sprite; draws it at layer rect (x0,y0,w,h). */
function hsSprite(ctx, key, x0, y0, w, h, res, draw, cam) {
  // wide shots use the cached sprite (cheap); close shots draw the vectors so they stay crisp
  if (cam && cam.zoom > 1.3) { draw(ctx); return; }
  const cv = cached(key, w, h, (c) => { c.translate(-x0, -y0); draw(c); });
  ctx.drawImage(cv, x0, y0);
}
function hsTerrace(ctx, cam) {
  const s = HS.dTer, G = gy(s), x0 = lx(HS.ter0, s) - 20, x1 = lx(HS.ter1, s) + 20;
  ctx.fillStyle = '#f6d6a6'; ctx.fillRect(x0 + 20, -4000, x1 - x0 - 40, 3200 + 2);
  hsSprite(ctx, 'hs-terrace', x0, -800, x1 - x0, G + 806, 1, (c) => hsTerraceArt(c), cam);
}
function hsTerraceArt(ctx) {
  const s = HS.dTer, G = gy(s);
  const tints = ['#f0c287', '#f4cf9b', '#e9b479'];
  for (const [X0, X1, kind, i] of HS.terrace) {
    const x0 = lx(X0, s), x1 = lx(X1, s), col = tints[i];
    ctx.fillStyle = linGrad(ctx, 0, G - 1500 * s, 0, G, [[0, mixHex(col, '#ffe6b8', 0.3)], [0.7, col], [1, mixHex(col, '#b0703a', 0.3)]]);
    ctx.fillRect(x0, G - 3000 * s, x1 - x0 + 1, 3000 * s);
    ctx.fillStyle = 'rgba(120,64,24,0.22)'; ctx.fillRect(x0, G - 3000 * s, 6 * s, 3000 * s);                   // party-wall line
    ctx.fillStyle = mixHex(col, '#fff2d4', 0.4); ctx.fillRect(x0, G - 880 * s, x1 - x0, 26 * s);              // string course
    ctx.fillStyle = 'rgba(110,56,20,0.25)'; ctx.fillRect(x0, G - 854 * s, x1 - x0, 8 * s);
    ctx.fillStyle = '#c08b5c'; ctx.fillRect(x0, G - 60 * s, x1 - x0, 60 * s);                                  // plinth
    ctx.fillStyle = 'rgba(255,230,180,0.4)'; ctx.fillRect(x0, G - 62 * s, x1 - x0, 3 * s);
    // first-floor window bottoms (seen when the camera tilts up or zooms out)
    for (let wx = x0 + 90 * s; wx < x1 - 260 * s; wx += 300 * s) hsWindow(ctx, wx, G - 1000 * s, 220 * s, 420 * s, s, i * 5 + wx, false);
    if (kind === 'house') {
      hsDoor(ctx, x0 + 80 * s, G - 20 * s, 200 * s, 500 * s, s, ['#3f4a2a', '#5a2f1c', '#2e3a44'][i % 3]);
      fillRR(ctx, x0 + 50 * s, G - 22 * s, 260 * s, 22 * s, 2 * s, '#d8b088');                                // step
      hsWindow(ctx, x0 + 360 * s, G - 180 * s, 250 * s, 360 * s, s, i * 3 + 1);
    } else {
      // café: wide glass, blank fascia board, awning, two bistro tables
      const gx0 = x0 + 40 * s, gx1 = x1 - 40 * s;
      fillRR(ctx, x0 + 20 * s, G - 700 * s, x1 - x0 - 40 * s, 110 * s, 4 * s, '#3c3a20');
      ctx.strokeStyle = 'rgba(255,214,140,0.6)'; ctx.lineWidth = 3 * s; ctx.strokeRect(x0 + 34 * s, G - 688 * s, x1 - x0 - 68 * s, 86 * s);
      ctx.fillStyle = '#2a2414'; ctx.fillRect(gx0, G - 560 * s, gx1 - gx0, 500 * s);
      ctx.fillStyle = linGrad(ctx, gx0, G - 560 * s, gx0 + 300 * s, G - 60 * s, [[0, '#ffe2a8'], [0.35, '#a8743e'], [1, '#2e1c0e']]);
      ctx.fillRect(gx0 + 8 * s, G - 552 * s, gx1 - gx0 - 16 * s, 484 * s);
      for (const [lx2, ly2] of [[0.25, 0.4], [0.62, 0.35], [0.8, 0.5]]) glow(ctx, gx0 + lx2 * (gx1 - gx0), G - 560 * s + ly2 * 500 * s, 40 * s, '#ffcf88', 0.5);
      ctx.fillStyle = '#efe0c2'; for (const f of [0.33, 0.66]) ctx.fillRect(gx0 + f * (gx1 - gx0) - 5 * s, G - 560 * s, 10 * s, 500 * s);
      // awning: the valance seen from the front, stripes, scalloped hem, its shadow on the glass
      ctx.fillStyle = 'rgba(70,36,12,0.35)'; ctx.fillRect(gx0, G - 560 * s, gx1 - gx0, 90 * s);
      const ay = G - 600 * s;
      for (let k = 0, ax = x0 + 10 * s; ax < x1 - 10 * s; ax += 50 * s, k++) {
        ctx.fillStyle = k % 2 ? '#efe2c0' : '#56582c';
        ctx.beginPath(); ctx.moveTo(ax, ay - 90 * s); ctx.lineTo(ax + 50 * s, ay - 90 * s); ctx.lineTo(ax + 50 * s, ay); ctx.quadraticCurveTo(ax + 25 * s, ay + 24 * s, ax, ay); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,236,190,0.5)'; ctx.fillRect(x0 + 10 * s, ay - 92 * s, x1 - x0 - 20 * s, 4 * s);
      // bistro tables (silhouettes on the forecourt)
      ctx.fillStyle = '#2a1a0c';
      for (const tx of [gx0 + 120 * s, gx1 - 200 * s]) {
        ctx.fillRect(tx - 4 * s, G - 175 * s, 8 * s, 175 * s); ctx.beginPath(); ctx.ellipse(tx, G - 178 * s, 60 * s, 8 * s, 0, 0, TAU); ctx.fill();
        for (const cx2 of [-90, 90]) { ctx.fillRect(tx + cx2 * s - 22 * s, G - 110 * s, 44 * s, 6 * s); ctx.fillRect(tx + cx2 * s + (cx2 < 0 ? -22 : 18) * s, G - 230 * s, 5 * s, 230 * s); ctx.fillRect(tx + cx2 * s - 20 * s, G - 110 * s, 4 * s, 110 * s); ctx.fillRect(tx + cx2 * s + 16 * s, G - 110 * s, 4 * s, 110 * s); }
      }
    }
    // soft leaf-shadow dapples on the wall
    for (let k = 0; k < 5; k++) {
      const dx = x0 + hash(i * 17 + k) * (x1 - x0), dy = G - (300 + hash(i * 9 + k) * 700) * s, r = (80 + hash(k + i) * 120) * s;
      ctx.fillStyle = radGrad(ctx, dx, dy, 0, r, [[0, 'rgba(110,52,16,0.14)'], [1, 'rgba(110,52,16,0)']]);
      ctx.beginPath(); ctx.arc(dx, dy, r, 0, TAU); ctx.fill();
    }
  }
  // drainpipe between the houses
  ctx.fillStyle = '#5a3a20'; for (const X of [-460, 160]) { const x = lx(X, s); ctx.fillRect(x - 6 * s, G - 3000 * s, 12 * s, 3000 * s); ctx.fillStyle = 'rgba(255,220,160,0.45)'; ctx.fillRect(x + 3 * s, G - 3000 * s, 3 * s, 3000 * s); ctx.fillStyle = '#5a3a20'; }
}

function hsBlock(ctx, cam, t) {
  const s = HS.dBlock, G = gy(s), x0 = lx(HS.block0, s) - 10, x1 = lx(HS.block1, s) + 10;
  ctx.fillStyle = '#fbe0b4'; ctx.fillRect(x0 + 10, -4000, x1 - x0 - 20, 3200 + 2);
  hsSprite(ctx, 'hs-block', x0, -800, x1 - x0, G + 806, 1, (c) => hsBlockArt(c), cam);
}
function hsBlockArt(ctx) {
  const s = HS.dBlock, G = gy(s), x0 = lx(HS.block0, s), x1 = lx(HS.block1, s), st = HS.stepH * s;
  ctx.fillStyle = linGrad(ctx, 0, G - 1600 * s, 0, G, [[0, '#fbe0b4'], [0.6, '#f5d09c'], [1, '#d9a56c']]);
  ctx.fillRect(x0, G - 3000 * s, x1 - x0, 3000 * s);
  // raking light: brighter toward the sun (right), cooler shade at the left corner
  ctx.fillStyle = linGrad(ctx, x0, 0, x1, 0, [[0, 'rgba(140,70,30,0.2)'], [0.3, 'rgba(140,70,30,0)'], [1, 'rgba(255,240,200,0.18)']]);
  ctx.fillRect(x0, G - 3000 * s, x1 - x0, 3000 * s);
  // rusticated ground floor
  ctx.fillStyle = 'rgba(130,72,30,0.16)'; for (let y = G - 70 * s; y > G - 880 * s; y -= 64 * s) ctx.fillRect(x0, y, x1 - x0, 3 * s);
  ctx.fillStyle = '#f9e6c4'; ctx.fillRect(x0, G - 900 * s, x1 - x0, 30 * s); ctx.fillStyle = 'rgba(110,56,20,0.3)'; ctx.fillRect(x0, G - 870 * s, x1 - x0, 9 * s);
  ctx.fillStyle = '#c4946a'; ctx.fillRect(x0, G - 70 * s, x1 - x0, 70 * s); ctx.fillStyle = 'rgba(255,232,190,0.45)'; ctx.fillRect(x0, G - 72 * s, x1 - x0, 3 * s);
  // windows, first floor balconies (bottoms only)
  for (const X of [2440, 2760, 3500]) hsWindow(ctx, lx(X, s), G - 190 * s, 250 * s, 400 * s, s, X);
  for (const X of [2440, 2760, 3130, 3500]) {
    const bx = lx(X, s);
    hsWindow(ctx, bx, G - 1060 * s, 250 * s, 460 * s, s, X + 7, false);
    fillRR(ctx, bx - 50 * s, G - 1000 * s, 350 * s, 24 * s, 2 * s, '#efd6ae');
    ctx.fillStyle = '#3a2412'; for (let k = 0; k <= 14; k++) ctx.fillRect(bx - 44 * s + k * 24 * s, G - 1180 * s, 4 * s, 180 * s);
    ctx.fillRect(bx - 50 * s, G - 1186 * s, 350 * s, 7 * s);
  }
  // the entrance: two steps, open door, sunlit lobby behind, porch canopy
  const dx = lx(HS.door, s), dw = 270 * s, dh = 560 * s, dy = G - 2 * st;
  fillRR(ctx, dx - dw / 2 - 40 * s, dy - dh - 40 * s, dw + 80 * s, dh + 40 * s, 3 * s, '#f8ead0');
  ctx.fillStyle = '#3b2212'; ctx.fillRect(dx - dw / 2, dy - dh, dw, dh);
  ctx.fillStyle = linGrad(ctx, 0, dy - dh, 0, dy, [[0, '#2a170a'], [0.5, '#4a2c16'], [1, '#6a4020']]); ctx.fillRect(dx - dw / 2, dy - dh, dw, dh);
  // back door of the lobby: glass full of sun (what the wife is seen against)
  const bw = 150 * s, bh = 420 * s;
  ctx.fillStyle = linGrad(ctx, 0, dy - bh - 20 * s, 0, dy, [[0, '#fff6dc'], [0.7, '#ffe0a0'], [1, '#e8a860']]);
  ctx.fillRect(dx - bw / 2 + 10 * s, dy - bh - 30 * s, bw, bh);
  glow(ctx, dx + 10 * s, dy - bh * 0.5, 230 * s, '#ffd890', 0.55);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = linGrad(ctx, 0, dy - 40 * s, 0, dy, [[0, 'rgba(255,214,150,0)'], [1, 'rgba(255,214,150,0.5)']]); ctx.fillRect(dx - dw / 2, dy - 40 * s, dw, 40 * s);
  ctx.restore();
  ctx.fillStyle = '#2a1a0c'; ctx.fillRect(dx - bw / 2 + 10 * s + bw / 2 - 3 * s, dy - bh - 30 * s, 6 * s, bh);   // its glazing bar
  ctx.fillStyle = 'rgba(30,18,8,0.7)'; for (let k = 0; k < 3; k++) ctx.fillRect(dx - dw / 2 + 8 * s, dy - 330 * s + k * 34 * s, 54 * s, 24 * s);   // post boxes
  // the open door leaf, folded against the left reveal
  ctx.fillStyle = '#4a2a18'; ctx.beginPath(); ctx.moveTo(dx - dw / 2, dy - dh); ctx.lineTo(dx - dw / 2 + 46 * s, dy - dh + 30 * s); ctx.lineTo(dx - dw / 2 + 46 * s, dy - 20 * s); ctx.lineTo(dx - dw / 2, dy); ctx.fill();
  ctx.fillStyle = 'rgba(255,220,160,0.35)'; ctx.fillRect(dx - dw / 2 + 42 * s, dy - dh + 32 * s, 3 * s, dh - 50 * s);
  // steps
  fillRR(ctx, dx - dw / 2 - 70 * s, G - st, dw + 140 * s, st, 2 * s, '#d9b48a'); fillRR(ctx, dx - dw / 2 - 30 * s, G - 2 * st, dw + 60 * s, st, 2 * s, '#e6c49a');
  ctx.fillStyle = 'rgba(255,240,206,0.6)'; ctx.fillRect(dx - dw / 2 - 30 * s, G - 2 * st, dw + 60 * s, 2.5 * s); ctx.fillRect(dx - dw / 2 - 70 * s, G - st, dw + 140 * s, 2.5 * s);
  // canopy and its shadow (falls down-left)
  const cy = dy - dh - 70 * s;
  ctx.fillStyle = 'rgba(110,52,16,0.22)'; ctx.beginPath(); ctx.moveTo(dx - 210 * s, cy + 26 * s); ctx.lineTo(dx + 210 * s, cy + 26 * s); ctx.lineTo(dx + 120 * s, cy + 120 * s); ctx.lineTo(dx - 300 * s, cy + 120 * s); ctx.fill();
  fillRR(ctx, dx - 230 * s, cy, 460 * s, 26 * s, 3 * s, '#5a3a20'); ctx.fillStyle = 'rgba(255,226,170,0.7)'; ctx.fillRect(dx - 228 * s, cy, 456 * s, 3 * s);
  fillRR(ctx, dx - 50 * s, cy - 54 * s, 100 * s, 40 * s, 18 * s, '#f9efdc'); ctx.strokeStyle = 'rgba(90,58,32,0.6)'; ctx.lineWidth = 2 * s; ctx.strokeRect(dx - 38 * s, cy - 46 * s, 76 * s, 24 * s);   // blank number plaque
  // buzzer panel, wall lantern, drainpipes
  fillRR(ctx, dx + dw / 2 + 40 * s, dy - 330 * s, 46 * s, 90 * s, 4 * s, '#c9a87e'); ctx.fillStyle = '#5a3a20'; for (let k = 0; k < 5; k++) ctx.fillRect(dx + dw / 2 + 50 * s, dy - 318 * s + k * 16 * s, 26 * s, 8 * s);
  ctx.fillStyle = '#2a1a0c'; ctx.fillRect(dx - dw / 2 - 86 * s, dy - 440 * s, 30 * s, 64 * s); ctx.fillStyle = 'rgba(255,240,200,0.45)'; ctx.fillRect(dx - dw / 2 - 82 * s, dy - 434 * s, 22 * s, 50 * s);
  for (const X of [2330, 3790]) { const x = lx(X, s); ctx.fillStyle = '#6a4424'; ctx.fillRect(x - 7 * s, G - 3000 * s, 14 * s, 3000 * s); ctx.fillStyle = 'rgba(255,226,170,0.5)'; ctx.fillRect(x + 3 * s, G - 3000 * s, 3 * s, 3000 * s); }
  // planters either side of the door
  for (const X of [2900, 3370]) {
    const px = lx(X, s);
    fillRR(ctx, px - 70 * s, G - 120 * s, 140 * s, 120 * s, 4 * s, '#7a5030'); ctx.fillStyle = 'rgba(255,220,160,0.4)'; ctx.fillRect(px + 60 * s, G - 118 * s, 6 * s, 116 * s);
    const r = rng(X);
    for (let k = 0; k < 26; k++) { const a = r() * Math.PI, rad = r(); ctx.fillStyle = Math.cos(a) > 0.2 ? '#d6b04c' : r() < 0.5 ? '#7e6a26' : '#a08a34'; ctx.beginPath(); ctx.arc(px + Math.cos(a) * rad * 80 * s, G - 130 * s - Math.sin(a) * rad * 110 * s, (14 + r() * 14) * s, 0, TAU); ctx.fill(); }
  }
  // a bicycle against the wall
  const bx = lx(3730, s);
  ctx.strokeStyle = '#2e1c0e'; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
  for (const wx of [bx - 110 * s, bx + 110 * s]) { ctx.beginPath(); ctx.arc(wx, G - 70 * s, 68 * s, 0, TAU); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(bx - 110 * s, G - 70 * s); ctx.lineTo(bx - 20 * s, G - 70 * s); ctx.lineTo(bx - 50 * s, G - 190 * s); ctx.lineTo(bx - 110 * s, G - 70 * s);
  ctx.moveTo(bx - 20 * s, G - 70 * s); ctx.lineTo(bx + 70 * s, G - 180 * s); ctx.lineTo(bx - 50 * s, G - 190 * s); ctx.moveTo(bx + 70 * s, G - 180 * s); ctx.lineTo(bx + 110 * s, G - 70 * s);
  ctx.moveTo(bx + 70 * s, G - 180 * s); ctx.lineTo(bx + 60 * s, G - 215 * s); ctx.lineTo(bx + 30 * s, G - 222 * s); ctx.moveTo(bx - 50 * s, G - 190 * s); ctx.lineTo(bx - 56 * s, G - 212 * s); ctx.stroke();
  ctx.lineWidth = 9 * s; ctx.beginPath(); ctx.moveTo(bx - 78 * s, G - 214 * s); ctx.lineTo(bx - 34 * s, G - 214 * s); ctx.stroke();
  // leaf dapples on the facade
  for (let k = 0; k < 9; k++) {
    const ddx = x0 + hash(k * 13 + 1) * (x1 - x0), ddy = G - (250 + hash(k * 7) * 800) * s, r = (90 + hash(k) * 140) * s;
    ctx.fillStyle = radGrad(ctx, ddx, ddy, 0, r, [[0, 'rgba(120,56,18,0.13)'], [1, 'rgba(120,56,18,0)']]);
    ctx.beginPath(); ctx.arc(ddx, ddy, r, 0, TAU); ctx.fill();
  }
  // the sunlit right end wall of the block (faces the sun) is drawn as a bright edge
  ctx.fillStyle = 'rgba(255,244,214,0.8)'; ctx.fillRect(x1 - 5 * s, G - 3000 * s, 5 * s, 3000 * s);
}

function hsGap(ctx, cam, t) {
  // garden between the block and the next building: hedge, a backlit tree, low wall and an open gate
  camera(ctx, cam, 0.8, () => {
    const s = 0.8, G = gy(s), x0 = lx(HS.block1 - 60, s), x1 = lx(HS.nb0 + 60, s);
    ctx.fillStyle = '#6e5a22'; ctx.beginPath(); ctx.moveTo(x0, G);
    for (let x = x0; x <= x1; x += 20 * s) ctx.lineTo(x, G - 170 * s - noise1(x * 0.03, 9) * 40 * s);
    ctx.lineTo(x1, G); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,120,0.6)'; for (let x = x0; x <= x1; x += 20 * s) { ctx.beginPath(); ctx.arc(x + 6 * s, G - 172 * s - noise1(x * 0.03, 9) * 40 * s, 9 * s, 0, TAU); ctx.fill(); }
  });
  camera(ctx, cam, 0.92, () => {
    const s = 0.92, G = gy(s), x0 = lx(HS.block1, s), x1 = lx(HS.nb0, s);
    ctx.fillStyle = linGrad(ctx, 0, G - 130 * s, 0, G, [[0, '#d69a64'], [1, '#a8683a']]); ctx.fillRect(x0, G - 120 * s, x1 - x0, 120 * s);
    ctx.fillStyle = '#f2d2a2'; ctx.fillRect(x0, G - 132 * s, x1 - x0, 14 * s);
    ctx.fillStyle = 'rgba(110,52,16,0.18)'; for (let y = G - 100 * s; y < G; y += 24 * s) ctx.fillRect(x0, y, x1 - x0, 2 * s);
    const gx0 = lx(3980, s), gx1 = lx(4160, s);
    ctx.fillStyle = '#c99a64'; ctx.fillRect(gx0, G - 120 * s, gx1 - gx0, 120 * s);   // the gate opening shows the garden path
    ctx.fillStyle = linGrad(ctx, 0, G - 120 * s, 0, G, [[0, '#a88a3a'], [1, '#d8b070']]); ctx.fillRect(gx0, G - 120 * s, gx1 - gx0, 120 * s);
    for (const px of [gx0 - 30 * s, gx1]) { fillRR(ctx, px, G - 220 * s, 30 * s, 220 * s, 2 * s, '#e6bd88'); fillRR(ctx, px - 6 * s, G - 232 * s, 42 * s, 16 * s, 2 * s, '#f6dcb0'); }
    ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 3 * s;   // open gate, swung back
    ctx.beginPath(); for (let k = 0; k < 6; k++) { const xx = gx1 - 4 * s - k * 9 * s; ctx.moveTo(xx, G - 4 * s); ctx.lineTo(xx, G - 160 * s); } ctx.moveTo(gx1 - 52 * s, G - 150 * s); ctx.lineTo(gx1 - 4 * s, G - 150 * s); ctx.stroke();
  });
}

function hsNeighbour(ctx, cam) {
  camera(ctx, cam, HS.dNb, () => {
    const s = HS.dNb, G = gy(s), x0 = lx(HS.nb0, s), x1 = lx(HS.nb1, s);
    ctx.fillStyle = '#f2c992'; ctx.fillRect(x0, -4000, x1 - x0, 3200 + 2);
    hsSprite(ctx, 'hs-nb', x0 - 4, -800, x1 - x0 + 8, G + 806, 1, (ctx) => {
    ctx.fillStyle = linGrad(ctx, 0, G - 1600 * s, 0, G, [[0, '#f2c992'], [1, '#d09a62']]); ctx.fillRect(x0, G - 3000 * s, x1 - x0, 3000 * s);
    ctx.fillStyle = 'rgba(255,246,220,0.75)'; ctx.fillRect(x0, G - 3000 * s, 4 * s, 3000 * s);
    ctx.fillStyle = '#b8845a'; ctx.fillRect(x0, G - 60 * s, x1 - x0, 60 * s);
    for (let X = HS.nb0 + 140; X < HS.nb1 - 300; X += 380) { hsWindow(ctx, lx(X, s), G - 190 * s, 240 * s, 400 * s, s, X); hsWindow(ctx, lx(X, s), G - 1060 * s, 240 * s, 460 * s, s, X + 3, false); }
    }, cam);
  });
}

function hsPoles(ctx, cam, t) {
  camera(ctx, cam, HS.dPole, () => {
    const s = HS.dPole, G = gy(s), v = view(cam, s);
    const [pa, pb] = HS.poles.map((X) => lx(X, s));
    const ya = G - 690 * s, ya2 = G - 650 * s, sag = 92 * s;
    // wires: left off into the terrace, the span with the birds, right onto the corner of the block
    const wire = (x0, y0, x1, y1, sg, w, a) => {
      ctx.strokeStyle = rgba('#2e1a0a', a); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sg * 2, x1, y1); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,214,140,0.28)'; ctx.lineWidth = w * 0.5; ctx.beginPath(); ctx.moveTo(x0, y0 - w * 0.5); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sg * 2 - w * 0.5, x1, y1 - w * 0.5); ctx.stroke(); ctx.restore();
    };
    const xT = lx(-500, s), xB = lx(HS.block0 + 20, s);
    for (const [dy, w] of [[0, 2.6], [40 * s, 2]]) {
      wire(xT, G - 980 * s + dy, pa, ya + dy, 50 * s, w, 0.9);
      wire(pa, ya + dy, pb, ya + dy, sag, w, 0.9);
      wire(pb, ya + dy, xB, G - 760 * s + dy, 30 * s, w, 0.9);
    }
    for (const x of [pa, pb]) {
      ctx.fillStyle = linGrad(ctx, x - 12 * s, 0, x + 12 * s, 0, [[0, '#3a2210'], [0.65, '#5a3a1c'], [0.85, '#b07a42'], [1, '#ffd08a']]);
      ctx.fillRect(x - 11 * s, G - 780 * s, 22 * s, 780 * s);
      fillRR(ctx, x - 70 * s, G - 712 * s, 140 * s, 14 * s, 2 * s, '#3a2210');
      for (const ix of [-56, -20, 20, 56]) fillRR(ctx, x + ix * s - 4 * s, G - 726 * s, 8 * s, 16 * s, 3 * s, '#5a4430');
    }
    // birds
    for (let i = 0; i < HS.birds.length; i++) {
      const [u0, f] = HS.birds[i];
      const hop = Math.floor(t / 4.3 + hash(i * 3) * 4), hk = clamp((t / 4.3 + hash(i * 3) * 4 - hop) * 4.3 / 0.3);
      const du = (hash(i * 7 + hop) - 0.5) * 0.02 * (i % 3 === 1 ? 1 : 0);
      const u = u0 + du, x = lerp(pa, pb, u), y = (1 - u) * (1 - u) * ya + 2 * u * (1 - u) * (ya + sag * 2) + u * u * ya;
      const lift = i % 3 === 1 ? Math.sin(hk * Math.PI) * 8 * s : 0;
      const bob = Math.max(0, noise1(t * 1.3, i + 50) - 0.6) * 10 * s;
      ctx.save(); ctx.translate(x, y - lift); ctx.scale(f * s, s);
      ctx.fillStyle = '#2a1708';
      ctx.beginPath(); ctx.ellipse(0, -9, 10, 7, -0.15, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(-19, -2 + noise1(t * 2, i) * 3); ctx.lineTo(-16, 0); ctx.lineTo(-4, -4); ctx.fill();
      ctx.beginPath(); ctx.arc(7, -17 + bob, 5.4, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(11.5, -18 + bob); ctx.lineTo(16, -16.5 + bob); ctx.lineTo(11.5, -15 + bob); ctx.fill();
      ctx.strokeStyle = '#2a1708'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-1, -3); ctx.lineTo(-1, 1); ctx.moveTo(3, -3); ctx.lineTo(3, 1); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,214,140,0.6)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, -9, 10, -1.2, 0.3); ctx.stroke(); ctx.beginPath(); ctx.arc(7, -17 + bob, 5.4, -1.4, 0.5); ctx.stroke();
      ctx.restore();
    }
  });
}

function hsRailings(ctx, cam) {
  camera(ctx, cam, HS.dRail, () => { const s = HS.dRail, G = gy(s), x0 = lx(HS.ter1, s), x1 = lx(HS.cross0, s); hsSprite(ctx, 'hs-rail', x0 - 40, G - 260, x1 - x0 + 80, 264, 1, (ctx) => {
    ctx.fillStyle = linGrad(ctx, 0, G - 70 * s, 0, G, [[0, '#d9ad78'], [1, '#a66e40']]); ctx.fillRect(x0, G - 66 * s, x1 - x0, 66 * s);
    ctx.fillStyle = '#f6dcae'; ctx.fillRect(x0, G - 72 * s, x1 - x0, 10 * s);
    ctx.fillStyle = '#24160a';
    for (let x = x0 + 10 * s; x < x1 - 4 * s; x += 24 * s) { ctx.fillRect(x - 2.2 * s, G - 200 * s, 4.4 * s, 130 * s); ctx.beginPath(); ctx.moveTo(x - 5 * s, G - 198 * s); ctx.lineTo(x, G - 212 * s); ctx.lineTo(x + 5 * s, G - 198 * s); ctx.fill(); }
    ctx.fillRect(x0, G - 186 * s, x1 - x0, 5 * s); ctx.fillRect(x0, G - 96 * s, x1 - x0, 5 * s);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,206,130,0.35)';
    for (let x = x0 + 10 * s; x < x1 - 4 * s; x += 24 * s) ctx.fillRect(x + 1.2 * s, G - 198 * s, 1.2 * s, 126 * s);
    ctx.restore();
    for (const x of [x0, x1]) { fillRR(ctx, x - 22 * s, G - 230 * s, 44 * s, 230 * s, 2 * s, '#e2b680'); fillRR(ctx, x - 28 * s, G - 244 * s, 56 * s, 18 * s, 2 * s, '#f6dcae'); }
  }, cam); });
  // the railing returns along the side street (corners at two depths)
  const X = HS.cross0, n = 9;
  for (let k = 0; k < n; k++) {
    const d = lerp(HS.dRail, 0.66, k / (n - 1));
    const a = gp(cam, X, d), b = gp(cam, X, d, 200);
    ctx.strokeStyle = '#24160a'; ctx.lineWidth = Math.max(1, 4.4 * d * (1 + (cam.zoom - 1) * d)); ctx.beginPath(); ctx.moveTo(a[0], a[1] - 70 * d); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  ctx.fillStyle = '#d9ad78'; poly(ctx, [gp(cam, X, HS.dRail), gp(cam, X, HS.dRail, 66), gp(cam, X, 0.66, 66), gp(cam, X, 0.66)]); ctx.fill();
  ctx.strokeStyle = '#24160a'; ctx.lineWidth = 3; ctx.beginPath(); const p0 = gp(cam, X, HS.dRail, 186), p1 = gp(cam, X, 0.66, 186); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
}

function hsTree(ctx, cam, X, d, idx, t, crownH = 560) {
  camera(ctx, cam, d, () => {
    const s = d, G = gy(d), x = lx(X, d);
    ctx.fillStyle = 'rgba(70,34,10,0.3)'; ctx.beginPath(); ctx.ellipse(x, G + 2, 60 * s, 6 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = linGrad(ctx, x - 22 * s, 0, x + 22 * s, 0, [[0, '#2e1c0c'], [0.6, '#4a2e16'], [0.85, '#a8743e'], [1, '#ffd08a']]);
    ctx.beginPath(); ctx.moveTo(x - 24 * s, G); ctx.quadraticCurveTo(x - 14 * s, G - 260 * s, x - 18 * s, G - crownH * s); ctx.lineTo(x + 14 * s, G - crownH * s); ctx.quadraticCurveTo(x + 12 * s, G - 260 * s, x + 26 * s, G); ctx.fill();
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 12 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 4 * s, G - (crownH - 20) * s); ctx.quadraticCurveTo(x - 50 * s, G - (crownH + 80) * s, x - 170 * s, G - (crownH + 170) * s);
    ctx.moveTo(x + 2 * s, G - (crownH - 20) * s); ctx.quadraticCurveTo(x + 60 * s, G - (crownH + 100) * s, x + 190 * s, G - (crownH + 200) * s); ctx.stroke();
    const sway = wobble(t, 0.25, idx) * 4 * s, cv = hsCrown(idx % 2, s), cw = cv.width, ch = cv.height;
    ctx.save(); ctx.translate(x + sway, G - crownH * s);
    ctx.drawImage(cv, -cw / 2, -ch + 120 * s);
    hsTwinkle(ctx, -cw / 2, -ch + 120 * s, cw, ch, t, idx + 3, 0.9);
    ctx.restore();
  });
}

function hsBeacon(ctx, cam, X, t, i) {
  camera(ctx, cam, HS.dBeacon, () => {
    const s = HS.dBeacon, G = gy(s), x = lx(X, s), top = G - 600 * s;
    for (let k = 0; k < 9; k++) { ctx.fillStyle = k % 2 ? '#f4e6cc' : '#1e1208'; ctx.fillRect(x - 7 * s, G - (k + 1) * 60 * s, 14 * s, 60 * s + 1); }
    ctx.fillStyle = '#1e1208'; ctx.fillRect(x - 7 * s, top, 14 * s, G - 540 * s - top);
    ctx.fillStyle = 'rgba(255,220,160,0.5)'; ctx.fillRect(x + 4 * s, top, 3 * s, 600 * s);
    const k = 0.35 + 0.65 * clamp(Math.sin((t * 1.1 + i * 0.5) * TAU) * 3 + 0.5);
    ctx.fillStyle = mixHex('#c87a2e', '#ffc070', k); ctx.beginPath(); ctx.arc(x, top - 22 * s, 26 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,246,220,0.7)'; ctx.beginPath(); ctx.arc(x + 8 * s, top - 30 * s, 7 * s, 0, TAU); ctx.fill();
    glow(ctx, x, top - 22 * s, 70 * s, '#ffb050', 0.35 * k);
  });
}

function hsBack(ctx, F, o) {
  const cam = camOf(o), t = o.t ?? F.t, part = o.part || 'all';
  const traffic = clamp(o.traffic ?? 1), busX = o.busX ?? null, busDir = o.busDir ?? -1;
  if (part !== 'near') {
    if (o._lo) ctx.drawImage(hsSky(), -100, -60, PW + 200, PH + 120); else ctx.drawImage(hsSky(), 0, 0);
    // the sun (behind everything solid), then the far town in gold haze
    camera(ctx, cam, HS.sun.d, () => {
      glow(ctx, HS.sun.x, HS.sun.y, 150, '#fff3d0', 0.95);
      ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(HS.sun.x, HS.sun.y, 30, 0, TAU); ctx.fill();
    });
    camera(ctx, cam, HS.dFar, () => {
      const far = cityStrip('hs-far', 3800, 300, { seed: 51, minW: 40, maxW: 130, minH: 30, maxH: 210, pow: 2, color: '#e9b77c', color2: '#e0aa72', haze: '#fff0cf', hazeK: 0.85, gapP: 0.3, gap: 60,
        win: { w: 3, h: 4, gx: 10, gy: 12, lit: 0, dark: 0.3, darkColor: '#c48a55', darkAlpha: 0.18 } });
      ctx.drawImage(far, -1300, gy(HS.dFar) - 296);
    });
    camera(ctx, cam, HS.dRow, () => {
      const row = cityStrip('hs-row', 5600, 420, { seed: 63, minW: 150, maxW: 320, minH: 120, maxH: 360, pow: 1.3, color: '#dca368', color2: '#d29660', haze: '#ffe6b6', hazeK: 0.6, gapP: 0.45, gap: 120, gables: 1,
        win: { w: 10, h: 15, gx: 24, gy: 34, lit: 0.02, color: '#fff2d0', alpha: 0.7, dark: 0.5, darkColor: '#8a5a30', darkAlpha: 0.22 } });
      ctx.drawImage(row, -2000, gy(HS.dRow) - 414);
      // trees along the far road
      for (let i = -6; i < 14; i++) {
        const x = i * 330 + hash(i + 70) * 120, G = gy(HS.dRow) + 6;
        ctx.fillStyle = 'rgba(180,120,60,0.7)'; ctx.fillRect(x - 3, G - 70, 6, 70);
        ctx.fillStyle = 'rgba(196,140,70,0.75)'; ctx.beginPath(); ctx.ellipse(x, G - 100, 46 + hash(i) * 20, 50, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,224,150,0.5)'; ctx.beginPath(); ctx.ellipse(x + 14, G - 112, 26, 30, 0, 0, TAU); ctx.fill();
      }
    });
    // the sun bleeds over the rooftops
    { const [sx, sy] = proj(cam, HS.sun.x, HS.sun.y, HS.sun.d); glow(ctx, sx, sy, 460, '#ffcf80', 0.42); }
    // ground: far pavement, cross road, verge, our pavement, near road
    hsBand(ctx, cam, HS.dRow, 0.45, [[0, '#f6d2a0'], [1, '#e8b47c']]);
    hsBand(ctx, cam, 0.45, 0.47, [[0, '#fbe2b8'], [1, '#c8925e']]);
    hsBand(ctx, cam, 0.47, 0.62, [[0, '#c69a6c'], [0.5, '#a8805a'], [1, '#93704e']]);
    hsBand(ctx, cam, 0.62, 0.64, [[0, '#f0cc98'], [1, '#c09060']]);
    hsBand(ctx, cam, 0.64, HS.dRail, [[0, '#c8a752'], [0.5, '#b0923e'], [1, '#8a7430']]);
    // side street (runs away from camera between the park and the block)
    {
      const X0 = HS.cross0, X1 = HS.cross1;
      ctx.fillStyle = linGrad(ctx, 0, yD(cam, 0.62), 0, yD(cam, 1.6), [[0, '#c69a6c'], [0.4, '#a27a54'], [1, '#7a5638']]);
      poly(ctx, [gp(cam, X0, 0.62), gp(cam, X1, 0.62), gp(cam, X1, 3), gp(cam, X0, 3)]); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';   // sheen of low sun down the street
      ctx.fillStyle = linGrad(ctx, 0, yD(cam, 0.62), 0, yD(cam, 1.1), [[0, 'rgba(255,214,150,0.45)'], [1, 'rgba(255,214,150,0)']]);
      poly(ctx, [gp(cam, X0 + 80, 0.62), gp(cam, X1 - 40, 0.62), gp(cam, X1 - 80, 1.1), gp(cam, X0 + 160, 1.1)]); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,240,206,0.5)';
      for (let k = 0; k < 7; k++) { const da = lerp(0.64, 0.92, k / 7), db = da + 0.02; poly(ctx, [gp(cam, (X0 + X1) / 2 - 5, da), gp(cam, (X0 + X1) / 2 + 5, da), gp(cam, (X0 + X1) / 2 + 5, db), gp(cam, (X0 + X1) / 2 - 5, db)]); ctx.fill(); }
    }
    // traffic on the cross road, the bus, parked cars
    const vehicles = [];
    if (traffic > 0) for (const [X0, dir, vel, kind, pi, d] of [[600, -1, 520, 'sedan', 0, 0.5], [5200, -1, 480, 'hatch', 2, 0.5], [-2600, 1, 560, 'van', 1, 0.535], [1900, 1, 500, 'suv', 3, 0.535]]) vehicles.push({ X: mod(X0 + dir * vel * t + 2500, 9000) - 2500, dir, kind, pi, d, a: traffic });
    const gold = ['#cdb38a', '#8f8a6a', '#a98266', '#6f7a72', '#d8c4a0'];
    const palG = (i) => ({ body: gold[mod(i, gold.length)], dark: '#3a2412', light: '#fff0c8', glass: '#ffe0a8', glassA: 0.35, tyre: '#1e140a', cap: '#c9b08a', trim: '#4a3018', rim: '#ffd890', rimA: 0.5, inside: '#3a2412', tail: '#7a5a40', lens: '#fff0d0' });
    for (const vh of vehicles) {
      camera(ctx, cam, vh.d, () => {
        const P = CAR[vh.kind], x = lx(vh.X, vh.d), G = gy(vh.d), v = view(cam, vh.d);
        if (x < v.x0 - 700 || x > v.x1 + 700) return;
        ctx.save(); ctx.globalAlpha = vh.a;
        ctx.fillStyle = 'rgba(70,34,10,0.3)'; ctx.beginPath(); ctx.ellipse(x - 120 * vh.d, G + 2, P.L * vh.d * 0.6, 6, 0, 0, TAU); ctx.fill();
        ctx.translate(x - vh.dir * P.L * vh.d / 2, G); ctx.scale(vh.dir * vh.d, vh.d); drawCar(ctx, P, palG(vh.pi), { detail: 1 }); ctx.restore();
      });
    }
    if (busX !== null && busX !== undefined) camera(ctx, cam, HS.dRoad, () => hsBus(ctx, lx(busX, HS.dRoad), gy(HS.dRoad), HS.dRoad, busDir < 0 ? -1 : 1));
    camera(ctx, cam, HS.dParked, () => { const s = HS.dParked, G = gy(s); hsSprite(ctx, 'hs-parked', lx(-200, s), G - 230, lx(2200, s) - lx(-200, s), 240, 1, (ctx) => {
      for (const [X, kind, pi] of [[420, 'hatch', 4], [1180, 'sedan', 2], [1560, 'hatch', 0]]) {
        const P = CAR[kind], x = lx(X, s);
        ctx.fillStyle = 'rgba(70,34,10,0.35)'; ctx.beginPath(); ctx.ellipse(x - 80 * s, G + 2, P.L * s * 0.62, 6, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.translate(x + P.L * s / 2, G); ctx.scale(-s, s); drawCar(ctx, P, palG(pi), { detail: 1 }); ctx.restore();
      }
    }, cam); });
  }
  if (part === 'far') return;

  // park trees and the light coming through them
  for (const [X, i] of HS.parkTrees) hsTree(ctx, cam, X, HS.dPark, i, t, 470);
  camera(ctx, cam, 0.75, () => {
    for (let i = 0; i < 3; i++) { const x = lx(760 + i * 380 + hash(i + 4) * 90, 0.75); lightCone(ctx, x + 420, -220, 2.05 + hash(i) * 0.08, 0.1 + hash(i + 9) * 0.08, 1100, '#ffd890', 0.05 + 0.03 * noise1(t * 0.2, i)); }
  });
  // return walls (seen in perspective), then the facades
  { const X = HS.ter1, a = gp(cam, X, HS.dTer), b = gp(cam, X, HS.dTer, 3000), c = gp(cam, X, 0.72, 3000), d = gp(cam, X, 0.72);
    ctx.fillStyle = linGrad(ctx, a[0], 0, d[0], 0, [[0, '#ffdcaa'], [1, '#f6c690']]); poly(ctx, [a, b, c, d]); ctx.fill(); }
  { const X = HS.block0, a = gp(cam, X, HS.dBlock), b = gp(cam, X, HS.dBlock, 3000), c = gp(cam, X, 0.62, 3000), d = gp(cam, X, 0.62);
    ctx.fillStyle = linGrad(ctx, a[0], 0, d[0], 0, [[0, '#b97c48'], [1, '#d29a62']]); poly(ctx, [a, b, c, d]); ctx.fill();
    for (let k = 1; k < 4; k++) { const dd = lerp(HS.dBlock, 0.62, k / 4); const p = gp(cam, X, dd, 190), q = gp(cam, X, dd, 590), w = 60 * dd * (1 + (cam.zoom - 1) * dd); if (Math.abs(a[0] - d[0]) > 40) { ctx.fillStyle = 'rgba(70,36,14,0.45)'; ctx.fillRect(Math.min(p[0], p[0] + Math.sign(d[0] - a[0]) * w), q[1], w, p[1] - q[1]); } } }
  { const X = HS.nb0, a = gp(cam, X, HS.dNb), b = gp(cam, X, HS.dNb, 3000), c = gp(cam, X, 0.7, 3000), d = gp(cam, X, 0.7);
    ctx.fillStyle = '#b07a48'; poly(ctx, [a, b, c, d]); ctx.fill(); }
  hsGap(ctx, cam, t);
  camera(ctx, cam, HS.dTer, () => hsTerrace(ctx, cam));
  hsNeighbour(ctx, cam);
  camera(ctx, cam, HS.dBlock, () => hsBlock(ctx, cam, t));
  // forecourt strips between the facades and our pavement
  for (const [X0, X1, d, col] of [[HS.ter0 - 400, HS.ter1, HS.dTer, '#d9aa74'], [HS.block0, HS.block1, HS.dBlock, '#e0b07a'], [HS.block1, HS.nb0, 0.92, '#d4a46e'], [HS.nb0, HS.nb1 + 400, HS.dNb, '#d9aa74']]) {
    ctx.fillStyle = col; poly(ctx, [gp(cam, X0, d), gp(cam, X1, d), gp(cam, X1, HS.dRail + 0.002), gp(cam, X0, HS.dRail + 0.002)]); ctx.fill();
  }
  hsPoles(ctx, cam, t);
  hsRailings(ctx, cam);
  // our pavement and the near road
  {
    const yP = yD(cam, HS.dRail), yK = yD(cam, HS.dKerb);
    const cx0 = gp(cam, HS.cross0, 1)[0], cx1 = gp(cam, HS.cross1, 1)[0];
    ctx.save();
    ctx.beginPath(); ctx.rect(-200, yP - 1, PW + 400, PH + 400);
    poly(ctx, [gp(cam, HS.cross0, HS.dRail - 0.01), gp(cam, HS.cross1, HS.dRail - 0.01), gp(cam, HS.cross1, 3), gp(cam, HS.cross0, 3)]);
    ctx.clip('evenodd');
    ctx.fillStyle = linGrad(ctx, 0, yP, 0, yK, [[0, '#e8bc84'], [0.5, '#d8a870'], [1, '#c39260']]); ctx.fillRect(-200, yP - 1, PW + 400, yK - yP + 2);
    ctx.fillStyle = '#f2d6a8'; ctx.fillRect(-200, yK - 2, PW + 400, 5);
    ctx.fillStyle = linGrad(ctx, 0, yK + 3, 0, PH, [[0, '#8c6444'], [1, '#6a4a30']]); ctx.fillRect(-200, yK + 3, PW + 400, PH - yK + 400);
    // flag joints
    ctx.strokeStyle = 'rgba(110,62,26,0.28)'; ctx.lineWidth = 1.4; ctx.beginPath();
    const v1 = view(cam, 1);
    for (let X = Math.floor((v1.x0 - 500) / 190) * 190; X < v1.x1 + 500; X += 190) { const a = gp(cam, X, HS.dRail), b = gp(cam, X, HS.dKerb); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    for (const d of [1.0, 1.065, 1.14]) { const yy = yD(cam, d); ctx.moveTo(-200, yy); ctx.lineTo(PW + 200, yy); }
    ctx.stroke();
    ctx.restore();
    // kerbs of the side street
    for (const X of [HS.cross0, HS.cross1]) { ctx.strokeStyle = '#f2d6a8'; ctx.lineWidth = 4; const a = gp(cam, X, 0.62), b = gp(cam, X, 2.5); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    // zebra crossing on our walking line
    ctx.fillStyle = 'rgba(255,244,222,0.9)';
    for (let X = HS.cross0 + 34; X + 36 <= HS.cross1 - 20; X += 66) { poly(ctx, [gp(cam, X, 0.97), gp(cam, X + 36, 0.97), gp(cam, X + 36, 1.2), gp(cam, X, 1.2)]); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,244,222,0.6)';   // give-way dashes
    for (let k = 0; k < 8; k++) { const X = HS.cross0 + 30 + k * 66; poly(ctx, [gp(cam, X, 0.93), gp(cam, X + 34, 0.93), gp(cam, X + 34, 0.945), gp(cam, X, 0.945)]); ctx.fill(); }
    void cx0; void cx1;
  }
  // street trees, beacons, and their long shadows
  for (const [X, i] of HS.streetTrees) { hsCast(ctx, cam, X, HS.dTree, 560, 46, 0.32); hsDapple(ctx, cam, X - 300, HS.dTree, 380, i, 0.2); }
  for (const X of HS.poles) hsCast(ctx, cam, X, HS.dPole, 780, 22, 0.24);
  hsCast(ctx, cam, HS.cross0 - 12, HS.dBeacon, 600, 14, 0.22); hsCast(ctx, cam, HS.cross1 + 12, HS.dBeacon, 600, 14, 0.22);
  { // railing shadow: a long comb of thin stripes thrown onto the pavement
    const L = 0.00032 * 200;
    ctx.fillStyle = 'rgba(90,44,16,0.16)';
    for (let X = HS.ter1 + 10; X < HS.cross0; X += 24) poly(ctx, [gp(cam, X, HS.dRail), gp(cam, X + 6, HS.dRail), gp(cam, X - 300 + 6, HS.dRail + L), gp(cam, X - 300, HS.dRail + L)]), ctx.fill();
  }
  for (const [X, i] of HS.streetTrees) hsTree(ctx, cam, X, HS.dTree, i + 2, t, 600);
  hsBeacon(ctx, cam, HS.cross0 - 12, t, 0); hsBeacon(ctx, cam, HS.cross1 + 12, t, 1);
  // light down the side street and warm air over the far road
  {
    const g = gp(cam, (HS.cross0 + HS.cross1) / 2, 0.55, 260), z = 1 + (cam.zoom - 1) * 0.55;
    glow(ctx, g[0], g[1], 420 * z, '#ffe0a0', 0.34, 0.7);
    for (let i = 0; i < 2; i++) lightCone(ctx, g[0] + (260 + i * 120) * z, g[1] - 600 * z, 1.95 + i * 0.06, 0.16, 1300 * z, '#ffd890', 0.06);
  }
}

/** Bokeh discs of sun through leaves, for the blurred background. */
function hsBokeh(ctx, cam, t, k) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const crowns = [...HS.parkTrees.map(([X, i]) => [X, HS.dPark, 470, i]), ...HS.streetTrees.map(([X, i]) => [X, HS.dTree, 600, i + 2])];
  for (const [X, d, h, i] of crowns) {
    for (let j = 0; j < 12; j++) {
      const [px, py] = gp(cam, X + (hash(i * 40 + j) - 0.2) * 420, d, h + 80 + hash(i * 9 + j) * 380);
      if (px < -80 || px > PW + 80 || py < -80 || py > PH + 80) continue;
      const r = 16 + hash(j + i * 3) * 30, a = (0.1 + 0.16 * hash(j * 5 + i)) * k * (0.75 + 0.25 * noise1(t * 0.5, i * 20 + j));
      ctx.fillStyle = radGrad(ctx, px, py, 0, r, [[0, rgba('#ffe6b0', a * 0.7)], [0.82, rgba('#ffe6b0', a)], [1, rgba('#ffe6b0', 0)]]);
      ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

/** Screen position and visibility (0..1, 0 = hidden behind a building) of the sun. */
function hsSunVis(cam) {
  const [sx, sy] = proj(cam, HS.sun.x, HS.sun.y, HS.sun.d);
  let occ = 0;
  for (const [X0, X1, d] of [[HS.ter0 - 2000, HS.ter1, HS.dTer], [HS.block0, HS.block1, HS.dBlock], [HS.nb0, HS.nb1 + 3000, HS.dNb]]) {
    const a = gp(cam, X0, d)[0], b = gp(cam, X1, d)[0];
    occ = Math.max(occ, clamp(Math.min(sx - a, b - sx) / 50 + 0.5));
  }
  return { sx, sy, vis: 1 - occ };
}
function hsFlare(ctx, cam, amount) {
  const { sx, sy, vis } = hsSunVis(cam), k = amount * vis;
  if (k <= 0.01) return;
  glow(ctx, sx, sy, 220, '#fff1d0', 0.55 * k);
  glow(ctx, sx, sy, 80, '#ffffff', 0.7 * k);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = linGrad(ctx, sx - 1100, 0, sx + 1100, 0, [[0, 'rgba(255,200,130,0)'], [0.5, `rgba(255,226,170,${0.2 * k})`], [1, 'rgba(255,200,130,0)']]);
  ctx.fillRect(sx - 1100, sy - 5, 2200, 10);
  ctx.fillStyle = linGrad(ctx, sx - 500, 0, sx + 500, 0, [[0, 'rgba(255,240,210,0)'], [0.5, `rgba(255,250,236,${0.3 * k})`], [1, 'rgba(255,240,210,0)']]);
  ctx.fillRect(sx - 500, sy - 1, 1000, 2);
  // ghosts along the line through the picture centre (warm only)
  for (const [f, r, col, a] of [[0.35, 26, '#ffd890', 0.12], [0.62, 60, '#ffb878', 0.06], [1.22, 110, '#ffe0a8', 0.05], [1.5, 34, '#ffc890', 0.1], [1.85, 180, '#ffd8a0', 0.035]]) {
    const gx = sx + (CX - sx) * f, gy2 = sy + (CY - sy) * f;
    ctx.fillStyle = radGrad(ctx, gx, gy2, r * 0.6, r, [[0, rgba(col, a * k * 0.5)], [0.85, rgba(col, a * k)], [1, rgba(col, 0)]]);
    ctx.beginPath(); ctx.arc(gx, gy2, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function hsLeaves(i) {
  return cached('hs-fg-leaves-' + i, 1000, 520, (c) => {
    const r = rng(300 + i);
    c.filter = 'blur(9px)';
    c.strokeStyle = '#2a1808'; c.lineWidth = 16; c.lineCap = 'round';
    c.beginPath(); c.moveTo(i ? 1000 : 0, 30); c.quadraticCurveTo(500, 60, i ? 120 : 880, 210); c.stroke();
    for (let k = 0; k < 70; k++) {
      const u = r(), x = i ? lerp(1000, 120, u) : lerp(0, 880, u), y = 30 + u * 180 + (r() - 0.3) * 200;
      c.fillStyle = r() < 0.7 ? '#3a2610' : '#8a6420';
      c.beginPath(); c.ellipse(x, y, 30 + r() * 26, 14 + r() * 10, r() * 3, 0, TAU); c.fill();
    }
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 26; k++) { c.fillStyle = 'rgba(255,214,120,0.35)'; c.beginPath(); c.ellipse(r() * 1000, 40 + r() * 300, 20 + r() * 16, 10, r() * 3, 0, TAU); c.fill(); }
  });
}

export const homeStreet = {
  W: 3600,
  floorY: FY,
  anchors: {
    line: { x0: -1100, x1: 4600, y: 700 },
    walkFrom: { x: 1620, y: 700 },
    stop: { x: 1150, y: 700 },
    crossing: { x: 1980, y: 700 },
    crossL: { x: 1700, y: 700 },
    crossR: { x: 2260, y: 700 },
    meet: { x: 2600, y: 700 },
    doorStep: { x: 3130, y: 700 },
    maya: { x: 3330, y: 700 },
    wife: { x: lx(3130, HS.dBlock), y: gy(HS.dBlock) - 2 * HS.stepH * HS.dBlock, depth: HS.dBlock, scale: HS.dBlock },
    ped1: { x: 260, y: 700 },
    ped2: { x: 1480, y: 700 },
    ped3: { x: 2850, y: 700 },
    ped4: { x: 3700, y: 700 },
    farPedL: { x: lx(1000, 0.42), y: gy(0.42), depth: 0.42, scale: 0.42 },
    farPedR: { x: lx(2050, 0.42), y: gy(0.42), depth: 0.42, scale: 0.42 },
    sun: { x: HS.sun.x, y: HS.sun.y, depth: HS.sun.d },
  },
  lights: { golden: { key: '#ffd08a', from: 1, amount: 0.85 } },

  /** Long golden shadow of a figure standing at world x on the floor line, raking toward camera-left. Call after back(), before the figure. */
  castShadow(ctx, o = {}, x, h = 430, k = 1) {
    const cam = camOf(o);
    hsCast(ctx, cam, x, 1, h, h * 0.15, 0.34 * k);
    hsCast(ctx, cam, x, 1, h * 0.7, h * 0.24, 0.12 * k);
  },
  /** Screen position of the sun for this camera and whether it is visible: {x, y, vis}. */
  sunAt(o = {}) { const s = hsSunVis(camOf(o)); return { x: s.sx, y: s.sy, vis: s.vis }; },

  back(ctx, F, o = {}) {
    const blur = clamp(o.blur ?? 0), cam = camOf(o), t = o.t ?? F.t;
    if (blur < 1) hsBack(ctx, F, o);
    if (blur > 0 && o.part !== 'near') {
      const q = 0.25, m = 16, w = Math.ceil(PW * q) + 2 * m, h = Math.ceil(PH * q) + 2 * m;
      const A = scratch('hs-blur-a', w, h);
      A.ctx.translate(m, m); A.ctx.scale(q, q);
      hsBack(A.ctx, F, { ...o, part: 'all', _lo: 1 });
      const B = scratch('hs-blur-b', w, h);
      B.ctx.filter = 'blur(4px)'; B.ctx.drawImage(A.cv, 0, 0); B.ctx.filter = 'none';
      ctx.save(); ctx.globalAlpha = blur; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(B.cv, m, m, w - 2 * m, h - 2 * m, 0, 0, PW, PH);
      ctx.restore();
      hsBokeh(ctx, cam, t, blur);
    }
  },

  mid() {},

  front(ctx, F, o = {}) {
    const cam = camOf(o), t = o.t ?? F.t, flare = clamp(o.flare ?? 1), leaves = clamp(o.fgLeaves ?? 1), blur = clamp(o.blur ?? 0);
    // golden air: a band of warm haze about the horizon, breathing slowly
    { const y0 = yD(cam, 0.35) - 260, y1 = yD(cam, 1.05), k = 0.11 + 0.02 * wobble(t, 0.1, 4);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = linGrad(ctx, 0, y0, 0, y1, [[0, 'rgba(255,216,144,0)'], [0.45, rgba('#ffd890', k)], [1, 'rgba(255,216,144,0)']]);
      ctx.fillRect(0, Math.max(0, y0), PW, Math.min(PH, y1) - Math.max(0, y0)); ctx.restore(); }
    // pollen / dust drifting in the light
    camera(ctx, cam, 1.12, () => {
      const v = view(cam, 1.12), W2 = v.x1 - v.x0, H2 = v.y1 - v.y0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 46; i++) {
        const x = v.x0 + mod(hash(i * 3) * 4000 + t * (6 + hash(i) * 10) + Math.sin(t * 0.4 + i) * 14, W2);
        const y = v.y0 + mod(hash(i * 5 + 1) * 2000 - t * (3 + hash(i + 7) * 5), H2);
        const a = (0.25 + 0.6 * noise1(t * 0.7, i)) * (0.4 + 0.6 * hash(i + 11));
        ctx.fillStyle = rgba('#fff2cf', a * 0.7); ctx.beginPath(); ctx.arc(x, y, (1.2 + hash(i + 2) * 1.8) / v.z * 1.6, 0, TAU); ctx.fill();
      }
      ctx.restore();
    });
    // out-of-focus leaves hanging into the top of frame
    if (leaves > 0 && blur < 1) {
      camera(ctx, cam, HS.dFg, () => {
        const v = view(cam, HS.dFg);
        ctx.save(); ctx.globalAlpha = leaves * (1 - blur);
        for (const [X, i] of [[-520, 0], [1350, 1], [3000, 0], [4300, 1]]) {
          const x = lx(X, HS.dFg); if (x < v.x0 - 1100 || x > v.x1 + 1100) continue;
          ctx.save(); ctx.translate(x, -150); ctx.rotate(wobble(t, 0.3, i + X) * 0.015); ctx.drawImage(hsLeaves(i), -500, 0); ctx.restore();
        }
        ctx.restore();
      });
    }
    // the sun: flare and a warm veil over everything near it
    const { sx, sy, vis } = hsSunVis(cam);
    glow(ctx, sx, sy + 60, 540, '#ffbf6a', 0.18 * (0.4 + 0.6 * vis) * (0.5 + 0.5 * flare));
    hsFlare(ctx, cam, flare);
    // ground warmth at the bottom of frame
    ctx.fillStyle = linGrad(ctx, 0, PH * 0.82, 0, PH, [[0, 'rgba(90,40,12,0)'], [1, 'rgba(90,40,12,0.22)']]); ctx.fillRect(0, PH * 0.82, PW, PH * 0.18);
  },
};

// ════════════════════════════════════════════════════════════════════════════════════════════
// 4. CAR INTERIOR (the video in a7_07)
// ════════════════════════════════════════════════════════════════════════════════════════════
const CI = {
  roofY: 330,
  // driver-door window (behind him), rear-door window, windscreen (right of the A-pillar) — world px, driver at s = 1
  win: [[716, 350], [800, 340], [920, 335], [1004, 334], [1112, 514], [716, 516]],
  rear: [[560, 372], [610, 356], [690, 350], [690, 516], [586, 516]],
  ws: [[1032, 330], [1640, 330], [1640, 530], [1142, 530]],
  pillarA: [[998, 324], [1034, 324], [1148, 534], [1108, 534]],
  lamp: { x: 1094, y: 404 },
  wheel: { x: 1012, y: 500, rx: 9, ry: 54, rot: -0.33 },
  mirror: { x: 1068, y: 354 },
};
function ciOutside() {
  return cached('ci-out', 1200, 280, (c) => {
    // a wet street at night, seen out of focus (canvas x 0 = world x 480, y 0 = world y 300)
    c.fillStyle = linGrad(c, 0, 0, 0, 280, [[0, '#08101e'], [0.45, '#13213a'], [0.7, '#1b2a44'], [1, '#0b1322']]);
    c.fillRect(0, 0, 1200, 280);
    c.filter = 'blur(4px)';
    const r = rng(17);
    for (let x = -30; x < 1230;) {
      const w = 50 + r() * 130, h = 70 + r() * 110; c.fillStyle = mixHex('#0b1424', '#16233c', r()); c.fillRect(x, 190 - h, w, h + 30);
      for (let k = 0; k < 5; k++) if (r() < 0.45) { c.fillStyle = rgba(r() < 0.5 ? '#d8d2c0' : '#c8b088', 0.22 + r() * 0.25); c.fillRect(x + r() * (w - 12), 190 - h + 12 + r() * (h - 30), 6, 9); }
      x += w + r() * 20;
    }
    c.fillStyle = '#0c1526'; c.fillRect(0, 190, 1200, 90);
    for (const x of [90, 330, 560, 760, 1050]) { c.fillStyle = linGrad(c, 0, 190, 0, 280, [[0, 'rgba(255,166,77,0.45)'], [1, 'rgba(255,166,77,0)']]); c.fillRect(x - 9, 190, 18, 90); }
    c.filter = 'blur(6px)';
    // bokeh: sodium lamps down the street, a few cold white points; denser behind the driver's head
    for (let i = 0; i < 34; i++) {
      const x = i < 10 ? 330 + r() * 260 : r() * 1200, y = 60 + r() * 140, rad = 6 + r() * 16, sod = r() < 0.72;
      c.fillStyle = rgba(sod ? '#ffa64d' : '#e6e8ee', 0.28 + r() * 0.38); c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill();
    }
    c.filter = 'blur(30px)';
    c.fillStyle = 'rgba(255,150,70,0.16)'; c.beginPath(); c.ellipse(470, 110, 260, 90, 0, 0, TAU); c.fill();   // sodium haze behind the head
  });
}
function ciGlassDrops(ctx, t, pts, seed, n, rain, lampK) {
  if (rain <= 0) return;
  ctx.save();
  poly(ctx, pts); ctx.clip();
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const W2 = x1 - x0, H2 = y1 - y0, L = CI.lamp;
  const tint = (x, y) => clamp(1 - Math.hypot(x - L.x, y - L.y) / 300) * lampK;
  // rain falling beyond the glass
  ctx.strokeStyle = 'rgba(170,190,220,0.13)'; ctx.lineWidth = 0.8; ctx.beginPath();
  for (let i = 0; i < 40 * rain; i++) { const x = x0 + mod(hash(seed + i) * W2 + t * 40, W2), y = y0 + mod(hash(seed + i * 3) * H2 + t * 620, H2 + 40) - 20; ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 17); }
  ctx.stroke();
  // beads that sit on the glass; each lives a while, then a new one forms elsewhere
  for (let i = 0; i < n * rain; i++) {
    const life = 5 + hash(seed * 7 + i) * 8, ph = t / life + hash(seed + i * 13), g = Math.floor(ph), a = ph - g;
    const x = x0 + hash(seed * 3 + i * 17 + g * 101) * W2, y = y0 + hash(seed * 5 + i * 23 + g * 89) * H2;
    const r = 0.9 + Math.pow(hash(seed + i * 29 + g * 7), 2) * 3, al = Math.min(1, a * 6, (1 - a) * 4), k = tint(x, y);
    ctx.fillStyle = rgba('#02050c', 0.35 * al); ctx.beginPath(); ctx.arc(x, y + r * 0.2, r, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(mixHex('#9fb2d0', '#ffc27a', k), (0.35 + 0.5 * k) * al); ctx.beginPath(); ctx.arc(x - r * 0.2, y + r * 0.35, r * 0.55, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.25 * al * (0.4 + k)); ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, TAU); ctx.fill();
  }
  // rivulets: stick, then slip, leaving a wet trail
  const nr = Math.round((n / 9) * rain);
  for (let i = 0; i < nr; i++) {
    const rate = 0.25 + hash(seed + i * 41) * 0.35, u = t * rate + hash(seed * 11 + i) * 3;
    const g = Math.floor(u / 3), uu = u - g * 3;
    const travel = (Math.floor(uu) + Math.pow(uu - Math.floor(uu), 3)) / 3;           // stick-slip, monotone within a trip
    const xs = x0 + hash(seed * 13 + i * 7 + g * 31) * W2, ys = y0 + hash(seed + i * 5 + g) * H2 * 0.4;
    const yh = ys + travel * H2 * 1.1, k = tint(xs, yh);
    const wob = (y) => xs + Math.sin(y * 0.07 + i) * 2.5 + (noise1(y * 0.03, i + seed) - 0.5) * 6;
    ctx.strokeStyle = rgba(mixHex('#8aa0c4', '#ffb870', k), 0.16 + 0.3 * k); ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(wob(ys), ys); for (let y = ys + 5; y < yh; y += 5) ctx.lineTo(wob(y), y); ctx.stroke();
    const hx = wob(yh);
    ctx.fillStyle = rgba('#02050c', 0.4); ctx.beginPath(); ctx.ellipse(hx, yh, 2.8, 3.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(mixHex('#b8c6dc', '#ffcf90', k), 0.55 + 0.4 * k); ctx.beginPath(); ctx.ellipse(hx - 0.5, yh + 0.9, 1.6, 2, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function ciSweep(t, amount) {
  // a car passes outside every 13 s (first at t = 9): its headlights sweep the cabin right → left
  const p = mod(t + 4, 13);
  if (p > 2.6 || amount <= 0) return null;
  const k = p / 2.6;
  return { x: lerp(1500, 400, ease.inOutSine(k)), a: Math.sin(k * Math.PI) * amount };
}

export const carInterior = {
  W: 1920,
  floorY: FY,
  anchors: {
    driver: { x: 860, y: 700, seat: 110 },
    hips: { x: 860, y: 590 },
    head: { x: 927, y: 411 },
    eyeLine: { x: 1160, y: 400 },
    lens: { x: 1180, y: 470 },
    wheelTop: { x: 994, y: 449 },
    wheelGrip: { x: 997, y: 462 },
    wheelHub: { x: CI.wheel.x, y: CI.wheel.y },
    lamp: { x: CI.lamp.x, y: CI.lamp.y },
    mirror: { x: CI.mirror.x, y: CI.mirror.y },
    crop45: { x: 660, y: 27, w: 600, h: 750, cam: { x: 935, y: 452, zoom: 1.65 } },
    crop916: { x: 734, y: 0, w: 452, h: 804, cam: { x: 935, y: 448, zoom: 1.4 } },
  },
  lights: { rainNight: { key: '#ffa64d', from: 1, amount: 0.6 } },

  back(ctx, F, o = {}) {
    const cam = camOf(o), t = o.t ?? F.t, rain = clamp(o.rain ?? 1), lamp = clamp(o.lamp ?? 1), dash = clamp(o.dash ?? 1), mist = clamp(o.mist ?? 0.4);
    const sw = ciSweep(t, clamp(o.sweep ?? 1)), lampK = lamp * (0.96 + 0.04 * wobble(t, 2.2, 5));
    ctx.fillStyle = '#04070d'; ctx.fillRect(0, 0, PW, PH);
    camera(ctx, cam, 1, () => {
      // the world outside, through all the glass
      ctx.save();
      ctx.beginPath(); for (const P of [CI.win, CI.rear, CI.ws]) { ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.closePath(); }
      ctx.clip();
      ctx.drawImage(ciOutside(), 480, 300);
      glow(ctx, CI.lamp.x + 30, CI.lamp.y, 300, '#ff9a40', 0.5 * lampK);       // the sodium streetlight through the windscreen
      glow(ctx, CI.lamp.x, CI.lamp.y, 80, '#ffc27a', 0.9 * lampK);
      glow(ctx, CI.lamp.x, CI.lamp.y, 16, '#fff0d0', lampK);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';                    // rain smears it into vertical streaks
      for (let i = 0; i < 7; i++) {
        const x = CI.lamp.x - 40 + i * 13 + wobble(t, 0.5, i) * 2;
        ctx.fillStyle = linGrad(ctx, 0, CI.lamp.y - 100, 0, CI.lamp.y + 150, [[0, 'rgba(255,170,90,0)'], [0.4, rgba('#ffb060', 0.15 * lampK)], [1, 'rgba(255,170,90,0)']]);
        ctx.fillRect(x, CI.lamp.y - 100, 2.5 + hash(i) * 3.5, 250);
      }
      ctx.restore();
      if (sw) glow(ctx, sw.x, 440, 240, '#f6efe2', 0.5 * sw.a, 0.5);
      ctx.fillStyle = linGrad(ctx, 0, 450, 0, 518, [[0, 'rgba(120,140,170,0)'], [1, rgba('#7f93b4', 0.3 * mist)]]); ctx.fillRect(500, 450, 700, 70);   // condensation
      ctx.restore();
      ciGlassDrops(ctx, t, CI.win, 3, 110, rain, lampK);
      ciGlassDrops(ctx, t, CI.rear, 9, 40, rain, lampK);
      ciGlassDrops(ctx, t, CI.ws, 21, 120, rain, lampK);

      // headliner, pillars, door, mirror
      ctx.fillStyle = linGrad(ctx, 0, 100, 0, CI.roofY + 10, [[0, '#03060c'], [1, '#0d1626']]);
      ctx.beginPath(); ctx.moveTo(-600, -600); ctx.lineTo(2600, -600); ctx.lineTo(2600, CI.roofY); ctx.lineTo(1000, CI.roofY + 1); ctx.quadraticCurveTo(760, 330, 560, 372); ctx.lineTo(-600, 430); ctx.closePath(); ctx.fill();
      glow(ctx, 1080, 300, 260, '#ff9a40', 0.13 * lampK, 0.4);
      if (sw) glow(ctx, sw.x, 300, 220, '#f6efe2', 0.16 * sw.a, 0.35);
      ctx.fillStyle = '#060a13'; poly(ctx, CI.pillarA); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#ffa64d', 0.45 * lampK); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(CI.pillarA[1][0], CI.pillarA[1][1] + 8); ctx.lineTo(CI.pillarA[2][0], CI.pillarA[2][1]); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#070b15'; ctx.fillRect(690, 344, 26, 600);                                     // B-pillar
      fillRR(ctx, 692, 376, 20, 30, 5, '#0c1322');                                                    // belt anchor
      ctx.fillStyle = '#05080f'; poly(ctx, [[-600, 440], [560, 372], [586, 516], [-600, 560]]); ctx.fill();   // C-pillar / rear
      ctx.fillStyle = linGrad(ctx, 0, 512, 0, 804, [[0, '#0e1727'], [0.15, '#0a1220'], [1, '#05080f']]);
      poly(ctx, [[-600, 520], [1120, 512], [1160, 1000], [-600, 1000]]); ctx.fill();                  // door panel
      ctx.fillStyle = 'rgba(150,170,200,0.12)'; ctx.fillRect(560, 514, 548, 2);
      fillRR(ctx, 730, 554, 230, 16, 7, '#111b2c'); ctx.fillStyle = rgba('#ffa64d', 0.18 * lampK); ctx.fillRect(738, 554, 214, 1.5);
      fillRR(ctx, 770, 534, 30, 4, 2, rgba('#ffc27a', 0.45 * lampK));
      const M = CI.mirror;                                                                           // rear-view mirror
      ctx.fillStyle = '#05080f'; ctx.fillRect(M.x + 2, CI.roofY - 4, 6, M.y - CI.roofY + 2);
      fillRR(ctx, M.x - 34, M.y - 3, 74, 26, 9, '#070b14');
      fillRR(ctx, M.x - 28, M.y + 1, 62, 18, 6, 'rgba(120,135,160,0.18)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#ffb060', 0.55 * lampK); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(M.x - 26, M.y + 23); ctx.quadraticCurveTo(M.x + 32, M.y + 25, M.x + 39, M.y + 8); ctx.stroke(); ctx.restore();
      // driver's seat: back, headrest (behind him), cushion
      ctx.fillStyle = '#0c1424';
      ctx.beginPath(); ctx.moveTo(826, 600); ctx.quadraticCurveTo(818, 530, 838, 470); ctx.lineTo(858, 452); ctx.lineTo(896, 458); ctx.quadraticCurveTo(900, 530, 904, 600); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0a111f'; ctx.fillRect(864, 428, 4, 30); ctx.fillRect(882, 428, 4, 30);
      fillRR(ctx, 848, 370, 50, 62, 15, '#0d1626');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#ffa64d', 0.25 * lampK); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(858, 371); ctx.quadraticCurveTo(890, 370, 897, 392); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(858, 453); ctx.lineTo(896, 459); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#0b1322'; poly(ctx, [[798, 594], [962, 586], [972, 602], [962, 618], [798, 624]]); ctx.fill();
      // dashboard and the instrument cluster behind the wheel (dim green-white)
      ctx.fillStyle = '#070b14'; poly(ctx, [[1100, 540], [1108, 516], [1700, 520], [1700, 1000], [1090, 1000]]); ctx.fill();
      fillRR(ctx, 996, 512, 118, 50, 16, '#080d17');
      for (const [gx2, gy3] of [[1030, 538], [1076, 536]]) {
        ctx.fillStyle = rgba('#cfe6d4', 0.1 * dash); ctx.beginPath(); ctx.arc(gx2, gy3, 16, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba('#d6ecd8', 0.5 * dash); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(gx2, gy3, 15, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
        ctx.strokeStyle = rgba('#e6f2e6', 0.7 * dash); ctx.beginPath(); ctx.moveTo(gx2, gy3); ctx.lineTo(gx2 - 9, gy3 + 5); ctx.stroke();
      }
      glow(ctx, 1054, 536, 120, '#cfe6d4', 0.22 * dash);
      ctx.strokeStyle = rgba('#ffa64d', 0.3 * lampK); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(1112, 517); ctx.lineTo(1680, 521); ctx.stroke();
    });
  },

  mid() {},

  front(ctx, F, o = {}) {
    const cam = camOf(o), t = o.t ?? F.t, lamp = clamp(o.lamp ?? 1), dash = clamp(o.dash ?? 1);
    const lampK = lamp * (0.96 + 0.04 * wobble(t, 2.2, 5)), sw = ciSweep(t, clamp(o.sweep ?? 1));
    camera(ctx, cam, 1, () => {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      lightCone(ctx, 1040, 540, -2.5, 0.8, 230, '#cfe6d4', 0.05 * dash);       // dash glow from below on the driver
      glow(ctx, 960, 400, 170, '#ff9a40', 0.06 * lampK, 0.8);                   // sodium wash from the windscreen
      if (sw) glow(ctx, sw.x, 420, 300, '#f6efe2', 0.08 * sw.a, 0.6);
      ctx.restore();
      ctx.fillStyle = '#04070d';                                                  // under-dash (hides the shins)
      ctx.beginPath(); ctx.moveTo(1022, 584); ctx.quadraticCurveTo(1046, 550, 1110, 546); ctx.lineTo(1700, 548); ctx.lineTo(1700, 1000); ctx.lineTo(950, 1000); ctx.quadraticCurveTo(990, 680, 1022, 584); ctx.fill();
      const Wh = CI.wheel;                                                        // column + wheel (the rim stands in front of his hands)
      ctx.strokeStyle = '#04070d'; ctx.lineWidth = 28; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(Wh.x, Wh.y); ctx.lineTo(Wh.x + 84, Wh.y + 70); ctx.stroke();
      ctx.save(); ctx.translate(Wh.x, Wh.y); ctx.rotate(Wh.rot);
      ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(0, 0, Wh.rx, Wh.ry, 0, 0, TAU); ctx.stroke();
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -Wh.ry + 6); ctx.lineTo(0, Wh.ry - 6); ctx.stroke();
      fillRR(ctx, -10, -28, 20, 56, 8, '#05080f');
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba('#ffa64d', 0.55 * lampK); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, 0, Wh.rx + 5, Wh.ry + 5, 0, -1.9, -0.9); ctx.stroke();
      ctx.strokeStyle = rgba('#cfe6d4', 0.35 * dash); ctx.beginPath(); ctx.ellipse(0, 0, Wh.rx + 4, Wh.ry + 4, 0, 0.9, 1.9); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#020408';                                                  // centre console, out of focus in the foreground
      ctx.beginPath(); ctx.moveTo(640, 1000); ctx.quadraticCurveTo(720, 700, 900, 676); ctx.lineTo(1000, 684); ctx.lineTo(1000, 1000); ctx.fill();
      ctx.fillStyle = rgba('#cfe6d4', 0.08 * dash); ctx.fillRect(800, 679, 190, 1.5);
    });
  },
};

// ═══ END ═══
