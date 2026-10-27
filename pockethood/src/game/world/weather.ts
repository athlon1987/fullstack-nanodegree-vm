// Deterministic weather: tropical showers come and go in short spells, the same for every
// player at the same moment (no randomness to save, nothing to sync). Pure; used by the
// renderer, the soundscape and resident behaviour.

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
