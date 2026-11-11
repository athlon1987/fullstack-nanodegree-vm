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
const BOX = { x: K.tableTop.x + 4, y: K.tableTop.y, size: 64 };   // a child's lunchbox: ~26 cm at the film's scale
/** V1's folded hands on the table (same as a5_02). */
const V1_HANDS = { handF: { x: 946, y: 506 }, handB: { x: 958, y: 507 } };
/** A wobble that dies away after a prop is set down at time t0. */
const DEG = 180 / Math.PI;
let _scratch = null;
/** A tiny off-screen context: draw a figure there once to read its anchors (pure cache). */
const scratch = () => (_scratch ??= Object.assign(document.createElement('canvas'), { width: 4, height: 4 }).getContext('2d'));
const wrap180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
/**
 * Lay the hands of a facing-right figure along chosen world directions (degrees, 0 = right, + = down).
 * tips: { F: {x, y, dir, k}, B: ... } — the FINGERTIP point and direction; k (0..1) blends from the natural
 * IK hand toward the aimed one. Returns the pose with handF/handB (wrist targets) and handRotF/handRotB set.
 */
const FINGER = 0.052 * 430 * 0.95;                   // wrist → fingertip, adult hand
function aimHands(who, pose, opts, tips) {
  const p = { ...pose };
  for (const s of ['F', 'B']) {
    const tp = tips[s];
    if (!tp) continue;
    const r = tp.dir / DEG, k = tp.k ?? 1;
    const aimed = { x: tp.x - Math.cos(r) * FINGER, y: tp.y - Math.sin(r) * FINGER };
    p['hand' + s] = tp.from ? { x: lerp(tp.from.x, aimed.x, k), y: lerp(tp.from.y, aimed.y, k) } : aimed;
  }
  const a = drawFigure(scratch(), who, { ...p, handRotF: 0, handRotB: 0 }, opts);
  for (const s of ['F', 'B']) {
    const tp = tips[s];
    if (!tp) continue;
    const h = a['hand' + s], e = a['elbow' + s];
    const nat = Math.atan2(h.y - e.y, h.x - e.x) * DEG;
    p['handRot' + s] = wrap180(tp.dir - nat) * (tp.k ?? 1);
  }
  return p;
}
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
      const bx = lerp(BOX.x - 52, BOX.x - 30, carry) + 30 * push;   // ends at BOX.x, within Adam's reach
      const lift = 1 - ease.inOutSine(clamp(t / tPlace));
      const by = K.tableTop.y - 24 * lift;
      const a = lunchbox(ctx, { x: bx, y: by, size: BOX.size, lum: 1, tint: LOOK[look].fill, light: LAMP_ON_TABLE, shadow: 0.8 - 0.5 * lift, wobble: settle(t, tPlace) });
      // V1's folded hands at the right edge of frame — they do not move
      drawFigure(ctx, 'v1', { x: K.seatR.x, y: 700, facing: -1, ...POSE.sit, lean: 3, ...V1_HANDS }, {
        ink, light: rim(kitchen.lightAt(look, K.seatR.x, o)), breath: breath(t, 2) * 0.4, glint: 0.75, aura: 0.45,
      });
      // Adam: sits up a little while he carries it in (head clear of the box), leans in as he sets it down and pushes.
      // Both hands on the box's near end — front hand's fingers along the lid, back hand's flat against the end — and
      // they stay there while he asks, then slide back to rest on the table.
      const leave = ramp(t, why.end + 0.5, 1.0, ease.inOutSine);
      const L = a.base.x - BOX.size / 2, top = a.base.y - 0.61 * BOX.size;
      const lean = lerp(12, 24, carry) + 5 * push - 8 * leave, head = lerp(6, 12, carry) - 4 * leave;
      const fo = { breath: breath(t) };
      const pose = aimHands('adam', { x: K.seatL.x, y: 700, facing: 1, ...POSE.sitForward, hipX: 0.07, lean, head }, fo, {
        F: { x: L + 16, y: top - 2, dir: 8, from: { x: 712, y: 509 }, k: 1 - leave },
        B: { x: L + 8, y: a.base.y - 13, dir: -12, from: { x: 690, y: 511 }, k: 1 - leave },
      });
      drawFigure(ctx, 'adam', pose, {
        ink, light: rim(kitchen.lightAt(look, K.seatL.x, o)), talk: talk(F, 'a5_why'), ...fo,
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
    // from `read` on the frame must be dead still: ambient time (dust, breathing) glides to a stop by tRead + 0.5
    const u = clamp((t - (tRead - 0.5)) / 1.0);
    const tb = t < tRead - 0.5 ? t : tRead - 0.5 + 0.5 * (1 - (1 - u) * (1 - u));
    const o = { look, cam, lampSway: 0, t: tb };
    const open = ramp(t, tOpen, 0.8, ease.inOutSine);
    const take = ramp(t, tUnf, tRead - tUnf, ease.inOutSine);          // the note travels to the lens and unfolds
    const slide = ramp(t, tOpen + 0.7, tUnf - tOpen - 0.7, ease.inOutSine);
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    let slot = null;
    // where the note is (world) and how big, from `unfold` on
    const notePlace = (s) => ({ x: lerp(s.x, NOTE.x, take), y: lerp(s.y, NOTE.y, take), size: lerp(s.size, NOTE.size, take) });
    camera(ctx, cam, 1, () => {
      const a = lunchbox(ctx, { ...BOX, open, note: take > 0 ? 0 : 0.05 + 0.6 * slide, lum: 1, tint: LOOK[look].fill, light: LAMP_ON_TABLE, shadow: 0.8 });
      slot = a.noteSlot;
      // Adam's front hand: fingertips to the clasp, flip it, ride the lid up under its front edge, then reach in for
      // the note and lift it toward us (the growing note hides the hand). Each stage aims the FINGERTIPS, not the wrist.
      const toClasp = ramp(t, tOpen - 0.7, 0.6);
      const onLid = ramp(t, tOpen + 0.05, 0.2);
      const toNote = ramp(t, tOpen + 1.0, 0.6);
      const lift = ramp(t, tUnf, 0.5, ease.inOutSine);
      const np = notePlace(slot), ns = Math.min(np.size, 90);
      const stages = [
        [toClasp, { x: a.clasp.x + 1, y: a.clasp.y + 2, dir: 18 }],
        [onLid, { x: a.lidEdge.x - 4, y: a.lidEdge.y + 5, dir: -28 }],
        [toNote, { x: slot.x + 2, y: slot.y + 4, dir: 22 }],
        [lift, { x: np.x - ns * 0.36, y: np.y + ns * 0.3, dir: -18 }],
      ];
      let tip = { x: 742, y: 509, dir: 0 };                          // resting on the table
      for (const [k, s] of stages) tip = { x: lerp(tip.x, s.x, k), y: lerp(tip.y, s.y, k), dir: lerp(tip.dir, s.dir, k) };
      const fo = { breath: breath(tb) };
      const pose = aimHands('adam', { x: K.seatL.x, y: 700, facing: 1, ...POSE.sitForward, hipX: 0.09, lean: 30, head: 14, handB: { x: 690, y: 511 } }, fo, {
        F: { ...tip, k: toClasp },
      });
      drawFigure(ctx, 'adam', pose, { ink, light: rim(kitchen.lightAt(look, K.seatL.x, o)), ...fo });
      drawFigure(ctx, 'v1', { x: K.seatR.x, y: 700, facing: -1, ...POSE.sit, lean: 3, ...V1_HANDS }, {
        ink, light: rim(kitchen.lightAt(look, K.seatR.x, o)), breath: breath(tb, 2) * 0.4, glint: 0.75, aura: 0.45,
      });
    });
    kitchen.front(ctx, F, o);
    if (take <= 0) return;
    // everything behind the note sinks a little so the paper is the only bright thing
    ctx.save(); ctx.fillStyle = `rgba(4,3,2,${0.6 * take})`; ctx.fillRect(0, 0, 1920, 804); ctx.restore();
    camera(ctx, cam, 1, () => {
      const np = notePlace(slot);                                      // dead still from `read` on: no breath on the paper
      const n = note(ctx, { x: np.x, y: np.y, size: np.size, unfold: take, rot: lerp(slot.rot, 0, take), squash: lerp(slot.squash, 1, take),
        lum: 1, tint: LOOK[look].fill, light: { color: C.cream, from: 'above', amount: 0.5, wash: 0.15 } });
      // close to the lens, two fingertips pinch the bottom corners; they fade in once the paper is big enough to own the frame
      const hs = np.size * 0.4;
      const pinch = (corner, side) => {
        const rot = side < 0 ? -28 : 208;                               // left hand from lower left, right hand from lower right
        const r = (rot * Math.PI) / 180, tip = [hs * 0.78, -hs * 0.05];
        const wx = corner.x - (tip[0] * Math.cos(r) - tip[1] * (side > 0 ? -1 : 1) * Math.sin(r));
        const wy = corner.y - (tip[0] * Math.sin(r) + tip[1] * (side > 0 ? -1 : 1) * Math.cos(r));
        drawHand(ctx, { x: wx, y: wy, size: hs, rot, flip: side > 0, pose: 'pinch', ink, cuff: '#1a140e' });
      };
      const hk = ease.inOutSine(clamp((take - 0.45) / 0.35));
      if (hk > 0) {
        ctx.save(); ctx.globalAlpha = hk;
        pinch(n.bl, -1); pinch(n.br, 1);
        ctx.restore();
      }
    });
  },

  // ── V1 in tight profile: he raises his eyes, and for the first time the glint stutters. ──
  a5_06_noanswer(ctx, F) {
    const { t } = F, look = 'lampNight', ink = LOOK[look].ink;
    const tUp = F.ev('up'), tFl = F.ev('flicker');
    const cam = drift(F, { x: 1000, y: 402, zoom: 3.05 }, { x: 1004, y: 402, zoom: 3.2 });
    const o = { look, cam, lampSway: Math.sin(t * 0.5) * 0.04 };
    kitchen.back(ctx, F, o);
    kitchen.mid(ctx, F, o);
    camera(ctx, cam, 1, () => {
      // the glint: steady, then two cursor-like stutters (each dropout 3 frames at 24 fps, so it reads), settling dimmer
      const d = t - tFl;
      let glint = 0.8;
      if (d >= 0) glint = d < 0.125 ? 0 : d < 0.25 ? 0.85 : d < 0.375 ? 0 : d < 0.5 ? 0.55 : lerp(0.55, 0.45, clamp((d - 0.5) / 0.3));
      const aura = lerp(0.45, 0.3, ramp(t, tFl, 0.8, ease.inOutSine));
      const twitch = (d > 0 && d < 0.125 ? 1.2 : 0) + (d > 0.25 && d < 0.375 ? -0.8 : 0);
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
      lunchbox(ctx, { x: BOX.x, y: BOX.y, size: BOX.size, open: 1, lum: 1, tint: LOOK[look].fill, light: LAMP_ON_TABLE, shadow: 0.8 });
      // Adam: looks at V1; a breath after the first line; on the last third of a5_letdown his head drops to the note and stays
      const drop = ramp(t, let_.at + let_.dur * 0.66, 0.9, ease.inOutSine);
      const gasp = Math.exp(-(((t - (rem.end + 0.6)) / 0.45) ** 2));
      const hand = { x: 694, y: 490 + drop * 4 };                    // the note stays clear of the open box (box starts at BOX.x - 32)
      drawFigure(ctx, 'adam', { x: K.seatL.x, y: 700, facing: 1, ...POSE.sitForward, lean: 14 + drop * 5, curl: 8 + drop * 6, head: -9 + drop * 30,
        handF: hand, handB: { x: 668, y: 508 } }, {
        ink, light: rim(kitchen.lightAt(look, K.seatL.x, o)), talk: talk(F, 'a5_remember', 'a5_letdown'), breath: breath(t) + gasp * 1.4,
      });
      // the open note in his hand, tilted up toward him
      note(ctx, { x: hand.x + 22, y: hand.y - 12, size: 52, unfold: 1, rot: -14, squash: 0.62, lum: 0.95, tint: LOOK[look].fill, light: { color: C.honey, from: 'above', amount: 0.6 } });
      // V1: upright, hands folded; a very quiet line and the tiniest nod, then nothing
      const nod = Math.sin(clamp((t - nev.at - 0.2) / 0.9) * Math.PI) * 4;
      drawFigure(ctx, 'v1', { x: K.seatR.x, y: 700, facing: -1, ...POSE.sit, lean: 3, ...V1_HANDS, head: 1 + nod }, {
        ink, light: rim(kitchen.lightAt(look, K.seatR.x, o)), talk: talk(F, 'a5_never') * 0.5, breath: breath(t, 2) * 0.4, glint: 0.45, aura: 0.3,
      });
    });
    kitchen.front(ctx, F, o);
  },
};
