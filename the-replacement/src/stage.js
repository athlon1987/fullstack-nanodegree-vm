// Small conveniences shared by every shot. See STYLE.md and src/acts/act5.js (a5_02_table) for a worked example.
import { ease, handheld, clamp, lerp } from './engine.js';

/** Mouth/nod amount for a character who speaks the given cue ids:  talk: talk(F, 'a5_love', 'a5_howmuch') */
export const talk = (F, ...ids) => Math.max(0, ...ids.map((id) => F.voice(id)));

/** Breathing -1..1 for opts.breath. Give each character a different phase. */
export const breath = (t, phase = 0, rate = 1.6) => Math.sin(t * rate + phase);

/**
 * A camera that drifts from framing a to framing b over the whole shot (and keeps going past the end, for dissolves),
 * with optional handheld wobble:  const cam = drift(F, {x: 800, y: 430, zoom: 1.5}, {x: 800, y: 440, zoom: 1.85}, {hand: 2});
 */
export function drift(F, a, b, o = {}) {
  const k = (o.ease || ease.inOutSine)(clamp(F.t / (F.T + 1)));
  const h = o.hand ? handheld(F.gt, o.hand, o.seed || 1) : { x: 0, y: 0, rot: 0 };
  return { x: lerp(a.x, b.x, k) + h.x, y: lerp(a.y, b.y, k) + h.y, zoom: lerp(a.zoom ?? 1, b.zoom ?? 1, k), rot: (a.rot || 0) + h.rot };
}

/** 0→1 ramp starting at time a lasting d seconds, eased. Handy for "at event X, over 0.6 s, do Y". */
export const ramp = (t, a, d = 0.5, e = ease.inOutCubic) => e(clamp((t - a) / d));
