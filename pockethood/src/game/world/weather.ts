// Deterministic weather: tropical showers come and go in short spells, the same for every
// player at the same moment (no randomness to save, nothing to sync). Pure; used by the
// renderer (rain, clouds, wind, mist, rainbows, lighting) and the soundscape. Weather is
// atmosphere only: it never slows production, blocks actions or costs the player anything.

const SPELL_MS = 6 * 60_000; // one weather "spell" (real time)
const RAMP = 0.12; // fraction of a spell spent fading in/out

function hash(n: number) {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Rain intensity 0..1 at time t for a world with the given rain chance. */
export function rainAt(t: number, chance: number): number {
  if (chance <= 0) return 0;
  const spell = Math.floor(t / SPELL_MS);
  const raining = (n: number) => hash(n) < chance;
  if (!raining(spell)) return 0;
  const p = (t % SPELL_MS) / SPELL_MS;
  const strength = 0.55 + hash(spell * 7 + 3) * 0.45;
  // Fade at the edges unless the neighbouring spell is also wet.
  const fadeIn = raining(spell - 1) ? 1 : Math.min(1, p / RAMP);
  const fadeOut = raining(spell + 1) ? 1 : Math.min(1, (1 - p) / RAMP);
  return strength * Math.min(fadeIn, fadeOut);
}

export interface Weather {
  /** Rain intensity 0..1. */
  rain: number;
  /** Cloud cover 0..1 (soft white puffs → fuller, greyer skies around showers). */
  cloud: number;
  /** Breeze 0..1 (trees sway more, rain slants). */
  wind: number;
  /** Morning mist 0..1. */
  mist: number;
  /** Bright post-rain sunshine (and a rainbow) 0..1. */
  afterglow: number;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Full weather at real time t, for a world's rain chance and the visual hour of day. */
export function weatherAt(t: number, chance: number, hour: number): Weather {
  const rain = rainAt(t, chance);
  const spell = Math.floor(t / SPELL_MS);
  const p = (t % SPELL_MS) / SPELL_MS;
  const wet = (n: number) => chance > 0 && hash(n) < chance;
  // Clouds build before a shower and linger after it; otherwise a light, varying cover.
  const nearRain = Math.max(wet(spell + 1) ? smooth(0.5, 1, p) : 0, wet(spell - 1) ? 1 - smooth(0, 0.5, p) : 0);
  const cloud = Math.min(1, 0.15 + hash(spell * 13 + 5) * 0.35 + nearRain * 0.4 + rain * 0.6);
  const wind = Math.min(1, 0.2 + 0.25 * (0.5 + 0.5 * Math.sin(t / 90_000)) + rain * 0.35 + nearRain * 0.15);
  // Mist on some mornings (about two in five), burning off by mid-morning.
  const day = Math.floor(t / 86_400_000);
  const misty = hash(day * 31 + 7) < 0.4;
  const mist = (misty ? smooth(4.5, 6, hour) * (1 - smooth(8, 9.5, hour)) : 0) * 0.9 + (wet(spell - 1) && !wet(spell) ? (1 - smooth(0, 0.35, p)) * 0.3 : 0);
  // The sun comes out after a shower: bright, warm, and a rainbow while it lasts.
  const afterglow = wet(spell - 1) && !wet(spell) && hour > 7 && hour < 18.5 ? 1 - smooth(0.05, 0.5, p) : 0;
  return { rain, cloud, wind, mist: Math.min(1, mist), afterglow };
}
