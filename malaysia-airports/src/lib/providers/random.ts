/**
 * Deterministic pseudo-random numbers for the demo providers. The same seed string always
 * produces the same sequence, on the server and in the browser.
 */

/** 32-bit FNV-1a hash of a string. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** The mulberry32 generator: returns a function yielding numbers in [0, 1). */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A generator seeded from a string key. */
export function seededRandom(key: string): () => number {
  return mulberry32(hashString(key));
}

/** Pick an item with a generator. */
export function pickWith<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length) % items.length];
}

/** An integer in [min, max] from a generator. */
export function intWith(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}
