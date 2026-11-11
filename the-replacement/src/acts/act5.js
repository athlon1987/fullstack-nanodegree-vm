// Shots: a5_01_arrive, a5_02_table, a5_03_lunchbox, a5_05_note, a5_06_noanswer, a5_07_letdown
// Each entry is (ctx, F) => void — see STYLE.md and src/engine.js.
import { camera, key, ease, clamp, lerp } from '../engine.js';
import { LOOK, C } from '../style.js';
import { drawFigure, POSE, mixPose, walkPhase, drawHand } from '../rig.js';
import { lunchbox, note } from '../props.js';
import { kitchen } from '../sets/kitchen.js';
import { corridor } from '../sets/bedcorridor.js';
import { talk, breath, drift, ramp } from '../stage.js';

const K = kitchen.anchors;
const CA = corridor.anchors;

/** Set lights are {key, from, amount}; the rig wants {color, from, amount}. */
const rim = (l, k = 1) => ({ color: l.key ?? l.color, from: l.from, amount: (l.amount ?? 0.5) * k });
/** Draw a hanging prop at the grip of a hand, kept upright in world space. */
const upright = (draw) => (c) => {
  const m = c.getTransform(), sc = Math.hypot(m.a, m.b);
  c.save(); c.setTransform(sc, 0, 0, sc, m.e, m.f); draw(c); c.restore();
};
/** The lamp over the table, as it lands on props on the table top. */
const LAMP_ON_TABLE = { color: C.honey, from: 'above', amount: 0.85, wash: 0.2 };
/** Where the lunchbox ends up on the table (tableTop, pushed ~30 px toward V1). */
const BOX = { x: K.tableTop.x + 30, y: K.tableTop.y, size: 110 };
/** V1's folded hands on the table (same as a5_02). */
const V1_HANDS = { handF: { x: 946, y: 506 }, handB: { x: 958, y: 507 } };
/** A wobble that dies away after a prop is set down at time t0. */
const settle = (t, t0) => (t < t0 ? 0 : Math.exp(-(t - t0) * 7) * Math.sin((t - t0) * 22) * 0.6);

export const shots = {
  // ── Adam at his own door, evening: three soft knocks like a visitor; the door opens on warm light and V1. ──
  a5_01_arrive(ctx, F) {
    const { t } = F, look = 'corridor', ink = LOOK[look].ink;
    const tKnock = F.ev('knock'), tOpen = F.ev('open');
    const cam = drift(F, { x: 1175, y: 410, zoom: 1.25 }, { x: 1215, y: 408, zoom: 1.32 });
    const doorOpen = ramp(t, tOpen, 0.6, ease.inOutSine);
    const o = { look, cam, evening: 1, doorOpen, tubeFlicker: 0.2 };
    corridor.back(ctx, F, o);
    // V1 in the doorway (inside the flat — drawn before mid() so the jambs hide him): backlit, plumb, facing left.
    camera(ctx, cam, 1, () => {
      const show = clamp((doorOpen - 0.35) / 0.4);
      if (show <= 0) return;
      const aside = ramp(t, tOpen + 1.05, 0.8, ease.inOutSine);           // steps back and aside to let him in
      const vx = lerp(CA.doorway.x, CA.doorway.x + 78, aside);
      const stepping = aside > 0 && aside < 1;
      const feet = stepping ? mixPose(POSE.walk(-walkPhase(vx - CA.doorway.x, 'v1')), POSE.stand, Math.abs(aside - 0.5) * 2) : POSE.stand;
      const regard = ramp(t, tOpen + 0.3, 0.6);
      drawFigure(ctx, 'v1', { x: vx, y: CA.doorway.y, facing: -1, ...feet, head: lerp(-2, 1, regard) + aside * 3, armF: [6 + aside * 10, 8], armB: [-4, 6] }, {
        ink, light: { color: C.honey, from: 1, amount: 0.55 * doorOpen }, breath: breath(t, 2) * 0.4, glint: 0.7 * show, aura: 0.45, alpha: show,
      });
    });
    corridor.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // Adam: arm rises, three soft raps (IK knuckles on the door), arm comes down; at `open` he lifts his head to V1.
      const raps = [tKnock, tKnock + 0.35, tKnock + 0.7];
      const up = ramp(t, tKnock - 0.55, 0.5) * (1 - ramp(t, raps[2] + 0.35, 0.65));
      let hit = 0;
      for (const r of raps) hit = Math.max(hit, ease.inOutSine(clamp(1 - Math.abs(t - r) / 0.14)));
      const rest = { x: CA.adam.x + 18, y: 500 }, ready = { x: CA.knock.x - 22, y: CA.knock.y + 4 };
      const handF = { x: lerp(rest.x, ready.x + 22 * hit, up), y: lerp(rest.y, ready.y, up) - Math.sin(up * Math.PI) * 10 };
      const look2 = ramp(t, tOpen + 0.15, 0.7);                       // sees him
      const settleBack = ramp(t, tOpen + 0.4, 1.0, ease.inOutSine);   // weight eases back a hair
      const head = 7 - up * 3 - look2 * 7;
      const sb = breath(t, 0.6);
      drawFigure(ctx, 'adam', { x: CA.adam.x, y: 700, facing: 1, ...POSE.stand, head, lean: 2 - settleBack * 2.5, armB: [12, 16], handF }, {
        ink, light: rim(corridor.light(o, t)), breath: sb,
        held: { back: upright((c) => lunchbox(c, { x: 0, y: -2, size: 46, anchor: 'handle', handleUp: 1, wobble: Math.sin(t * 1.3) * 0.08,
          lum: 0.9, tint: LOOK[look].fill, light: [{ color: '#b8d6dc', from: -1, amount: 0.55 }, { color: C.amber, from: 1, amount: 0.6 * doorOpen }] })) },
      });
    });
    corridor.front(ctx, F, o);
  },

  // ── WORKED EXAMPLE ── the two men at the table under the lamp: exact mirror symmetry, slow push-in.
  a5_02_table(ctx, F) {
    const { t } = F, look = 'lampNight', ink = LOOK[look].ink;
    const cam = drift(F, { x: 800, y: 425, zoom: 1.5 }, { x: 800, y: 436, zoom: 1.82 });
    const o = { look, cam, lampSway: Math.sin(t * 0.5) * 0.05 };
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // Adam (left, faces right): slumped on his forearms; raises his eyes to V1 to ask.
      const up = key(t, [[0, 0], [1.6, 0], [2.3, 1], [20, 1]]);
      drawFigure(ctx, 'adam', {
        x: K.seatL.x, y: 700, facing: 1, ...POSE.sitForward, head: 14 - up * 12, lean: 18 - up * 3,
        handF: { x: 690, y: 506 }, handB: { x: 668, y: 508 },
      }, { ink, light: kitchen.lightAt(look, K.seatL.x, o), talk: talk(F, 'a5_love', 'a5_howmuch'), breath: breath(t) });
      // V1 (right, faces left): plumb upright, hands folded on the table, answers instantly, never moves.
      drawFigure(ctx, 'v1', {
        x: K.seatR.x, y: 700, facing: -1, ...POSE.sit, lean: 3,
        handF: { x: 946, y: 506 }, handB: { x: 958, y: 507 },
      }, { ink, light: kitchen.lightAt(look, K.seatR.x, o), talk: talk(F, 'a5_ofcourse', 'a5_more'), breath: breath(t, 2) * 0.4, glint: 0.75, aura: 0.45 });
    });
    kitchen.front(ctx, F, o);
  },

  // ── Close on the table top: Adam's hands set the red lunchbox down and push it toward V1. ──
  a5_03_lunchbox(ctx, F) {
    const { t } = F, look = 'lampNight', ink = LOOK[look].ink;
    const tPlace = F.ev('place'), why = F.cue('a5_why');
    const cam = drift(F, { x: 790, y: 470, zoom: 2.6 }, { x: 800, y: 474, zoom: 2.74 });
    const o = { look, cam, lampSway: Math.sin(t * 0.5) * 0.04 };
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // the box: carried in low over the table from the left, set down at tableTop on `place`, then pushed ~30 px toward V1
      const carry = ramp(t, 0, tPlace, ease.outCubic);
      const push = ramp(t, tPlace + 0.55, 0.8, ease.inOutSine);
      const bx = lerp(K.tableTop.x - 150, K.tableTop.x, carry) + 30 * push;
      const by = K.tableTop.y - 46 * (1 - ease.inOutSine(clamp(t / tPlace)));
      const down = t >= tPlace;
      const a = lunchbox(ctx, { x: bx, y: by, size: BOX.size, lum: 1, tint: LOOK[look].fill, light: LAMP_ON_TABLE, shadow: down ? 0.8 : 0.3, wobble: settle(t, tPlace) });
      // V1's folded hands at the right edge of frame — they do not move
      drawFigure(ctx, 'v1', { x: K.seatR.x, y: 700, facing: -1, ...POSE.sit, lean: 3, ...V1_HANDS }, {
        ink, light: rim(kitchen.lightAt(look, K.seatR.x, o)), breath: breath(t, 2) * 0.4, glint: 0.75, aura: 0.45,
      });
      // Adam: sitting on the front edge of his chair, both hands on the box's near side; after the push the hands stay,
      // fingertips touching it while he asks, then slide back to rest on the table.
      const leave = ramp(t, why.end + 0.5, 1.0, ease.inOutSine);
      const L = a.base.x - BOX.size / 2;
      const hF = { x: lerp(L + 10, 712, leave), y: lerp(a.base.y - 40, 509, leave) };
      const hB = { x: lerp(L - 2, 690, leave), y: lerp(a.base.y - 18, 511, leave) };
      drawFigure(ctx, 'adam', { x: K.seatL.x, y: 700, facing: 1, ...POSE.sitForward, hipX: 0.07, lean: 33 - 8 * leave, head: 22, handF: hF, handB: hB }, {
        ink, light: rim(kitchen.lightAt(look, K.seatL.x, o)), talk: talk(F, 'a5_why'), breath: breath(t),
      });
    });
    kitchen.front(ctx, F, o);
  },

  // ── The clasp, the lid, the note: it comes up to the lens, opens, and holds. ──
  a5_05_note(ctx, F) {
    const { t } = F, look = 'lampNight', ink = LOOK[look].ink;
    const tOpen = F.ev('open'), tUnf = F.ev('unfold'), tRead = F.ev('read');
    const NOTE = { x: BOX.x, y: 452, size: 820 / 3.4 };              // the note's final place: centre of the last frame, 820 px wide
    // push in to the final framing by `read`, then the camera is perfectly still (a 1 px breath only)
    const camEnd = { x: NOTE.x, y: NOTE.y, zoom: 3.4 };
    const camK = ease.inOutSine(clamp(t / tRead));
    const cam = { x: lerp(BOX.x - 4, camEnd.x, camK), y: lerp(482, camEnd.y, camK), zoom: lerp(2.8, 3.4, camK) };
    const o = { look, cam, lampSway: 0 };
    const open = ramp(t, tOpen, 0.8, ease.inOutSine);
    const take = ramp(t, tUnf, tRead - tUnf, ease.inOutCubic);         // the note travels to the lens and unfolds
    const slide = ramp(t, tOpen + 0.7, tUnf - tOpen - 0.7, ease.inOutSine);
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    let slot = null;
    camera(ctx, cam, 1, () => {
      const a = lunchbox(ctx, { ...BOX, open, note: take > 0 ? 0 : 0.05 + 0.6 * slide, lum: 1, tint: LOOK[look].fill, light: LAMP_ON_TABLE, shadow: 0.8 });
      slot = a.noteSlot;
      // Adam's front hand: to the clasp, flips it, rides the lid up, then reaches in for the note and lifts it toward us
      const toClasp = ramp(t, tOpen - 0.7, 0.6);
      const onLid = ramp(t, tOpen + 0.05, 0.2);
      const toNote = ramp(t, tOpen + 1.0, 0.6);
      const away = ramp(t, tUnf + 0.1, 0.6, ease.inOutSine);
      const restF = { x: 712, y: 509 };
      let hF = { x: lerp(restF.x, a.clasp.x - 6, toClasp), y: lerp(restF.y, a.clasp.y + 4, toClasp) };
      hF = { x: lerp(hF.x, a.lidEdge.x - 8, onLid), y: lerp(hF.y, a.lidEdge.y + 4, onLid) };
      hF = { x: lerp(hF.x, slot.x - 10, toNote), y: lerp(hF.y, slot.y + 6, toNote) };
      hF = { x: lerp(hF.x, 640, away), y: lerp(hF.y, 380, away) };
      drawFigure(ctx, 'adam', { x: K.seatL.x, y: 700, facing: 1, ...POSE.sitForward, hipX: 0.07, lean: 33, head: 22, handF: hF, handB: { x: 690, y: 511 } }, {
        ink, light: rim(kitchen.lightAt(look, K.seatL.x, o)), breath: breath(t),
      });
      drawFigure(ctx, 'v1', { x: K.seatR.x, y: 700, facing: -1, ...POSE.sit, lean: 3, ...V1_HANDS }, {
        ink, light: rim(kitchen.lightAt(look, K.seatR.x, o)), breath: breath(t, 2) * 0.4, glint: 0.75, aura: 0.45,
      });
    });
    kitchen.front(ctx, F, o);
    if (take <= 0) return;
    // everything behind the note sinks a little so the paper is the only bright thing
    ctx.save(); ctx.fillStyle = `rgba(4,3,2,${0.42 * take})`; ctx.fillRect(0, 0, 1920, 804); ctx.restore();
    camera(ctx, cam, 1, () => {
      const still = clamp((t - tRead) / 0.6);
      const by = Math.sin(t * 1.1) * 0.35 * still;                     // ~1 px breath of the hands, nothing else
      const nx = lerp(slot.x, NOTE.x, take), ny = lerp(slot.y, NOTE.y, take) + by;
      const size = lerp(slot.size, NOTE.size, take);
      const n = note(ctx, { x: nx, y: ny, size, unfold: take, rot: lerp(slot.rot, 0, take), squash: lerp(slot.squash, 1, take),
        lum: 1, tint: LOOK[look].fill, light: { color: C.cream, from: 'above', amount: 0.5, wash: 0.15 } });
      // two fingertips pinch the bottom corners; the hands come up from below the frame
      const hs = size * 0.62;
      const pinch = (corner, side) => {
        const rot = side < 0 ? -62 : -118;
        const r = (rot * Math.PI) / 180, tip = [hs * 0.66, -hs * 0.1 * (side < 0 ? 1 : -1)];
        const wx = corner.x - (tip[0] * Math.cos(r) - tip[1] * Math.sin(r));
        const wy = corner.y - (tip[0] * Math.sin(r) + tip[1] * Math.cos(r));
        drawHand(ctx, { x: wx, y: wy, size: hs, rot, flip: side > 0, pose: 'pinch', ink, cuff: '#1a140e' });
      };
      ctx.save(); ctx.globalAlpha = clamp(take * 3);
      pinch(n.bl, -1); pinch(n.br, 1);
      ctx.restore();
    });
  },

  // ── V1 in tight profile: he raises his eyes, and for the first time the glint stutters. ──
  a5_06_noanswer(ctx, F) {
    const { t } = F, look = 'lampNight', ink = LOOK[look].ink;
    const tUp = F.ev('up'), tFl = F.ev('flicker');
    const cam = drift(F, { x: 990, y: 404, zoom: 2.95 }, { x: 994, y: 404, zoom: 3.08 });
    const o = { look, cam, lampSway: Math.sin(t * 0.5) * 0.04 };
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // the glint: steady, then two cursor-like stutters, settling dimmer
      const d = t - tFl;
      let glint = 0.8;
      if (d >= 0) glint = d < 0.07 ? 0 : d < 0.17 ? 0.8 : d < 0.27 ? 0.1 : d < 0.38 ? 0.5 : lerp(0.5, 0.45, clamp((d - 0.38) / 0.12));
      const aura = lerp(0.45, 0.3, ramp(t, tFl, 0.8, ease.inOutSine));
      const twitch = (d > 0 && d < 0.07 ? 1.2 : 0) + (d > 0.17 && d < 0.27 ? -0.8 : 0);
      const up = ramp(t, tUp, 0.7, ease.inOutSine);
      drawFigure(ctx, 'v1', { x: K.seatR.x, y: 700, facing: -1, ...POSE.sit, lean: 3, ...V1_HANDS, head: lerp(16, 2, up) + twitch }, {
        ink, light: rim(kitchen.lightAt(look, K.seatR.x, o)), breath: breath(t, 2) * 0.4, glint, aura,
      });
    });
    kitchen.front(ctx, F, o);
  },

  // ── Across the table: "You remember everything about her." The head drops to the note. "I never have." ──
  a5_07_letdown(ctx, F) {
    const { t } = F, look = 'lampNight', ink = LOOK[look].ink;
    const rem = F.cue('a5_remember'), let_ = F.cue('a5_letdown'), nev = F.cue('a5_never');
    const cam = drift(F, { x: 800, y: 398, zoom: 2.2 }, { x: 800, y: 404, zoom: 2.32 });
    const o = { look, cam, lampSway: Math.sin(t * 0.5) * 0.04 };
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      lunchbox(ctx, { x: BOX.x, y: BOX.y, size: 78, open: 1, lum: 1, tint: LOOK[look].fill, light: LAMP_ON_TABLE, shadow: 0.8 });
      // Adam: looks at V1; a breath after the first line; on the last third of a5_letdown his head drops to the note and stays
      const drop = ramp(t, let_.at + let_.dur * 0.66, 0.9, ease.inOutSine);
      const gasp = Math.exp(-(((t - (rem.end + 0.6)) / 0.45) ** 2));
      const hand = { x: 712, y: 488 + drop * 4 };
      drawFigure(ctx, 'adam', { x: K.seatL.x, y: 700, facing: 1, ...POSE.sitForward, lean: 18 + drop * 3, curl: 8 + drop * 6, head: 2 + drop * 26,
        handF: hand, handB: { x: 668, y: 508 } }, {
        ink, light: rim(kitchen.lightAt(look, K.seatL.x, o)), talk: talk(F, 'a5_remember', 'a5_letdown'), breath: breath(t) + gasp * 1.4,
      });
      // the open note in his hand, tilted up toward him
      note(ctx, { x: hand.x + 26, y: hand.y - 14, size: 62, unfold: 1, rot: -14, squash: 0.62, lum: 0.95, tint: LOOK[look].fill, light: { color: C.honey, from: 'above', amount: 0.6 } });
      // V1: upright, hands folded; a very quiet line and the tiniest nod, then nothing
      const nod = Math.sin(clamp((t - nev.at - 0.2) / 0.9) * Math.PI) * 4;
      drawFigure(ctx, 'v1', { x: K.seatR.x, y: 700, facing: -1, ...POSE.sit, lean: 3, ...V1_HANDS, head: 1 + nod }, {
        ink, light: rim(kitchen.lightAt(look, K.seatR.x, o)), talk: talk(F, 'a5_never') * 0.5, breath: breath(t, 2) * 0.4, glint: 0.45, aura: 0.3,
      });
    });
    kitchen.front(ctx, F, o);
  },
};
