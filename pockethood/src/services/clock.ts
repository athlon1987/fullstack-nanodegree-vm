// Game clock. Production accounting uses real timestamps (offline progress works);
// the developer time offset lets testers fast-forward without waiting.
// The *visual* day/night cycle is derived separately and never affects rewards.
import type { DayPhase, Settings } from '../game/core/types';

const OFFSET_KEY = 'pockethood.devTimeOffset';
let offset = 0;
try {
  offset = Number(localStorage.getItem(OFFSET_KEY) ?? 0) || 0;
} catch {
  offset = 0;
}

export const clock = {
  now: () => Date.now() + offset,
  get offset() {
    return offset;
  },
  advance(ms: number) {
    offset += ms;
    try {
      localStorage.setItem(OFFSET_KEY, String(offset));
    } catch {
      /* ignore */
    }
  },
  reset() {
    offset = 0;
    try {
      localStorage.removeItem(OFFSET_KEY);
    } catch {
      /* ignore */
    }
  },
};

/** One visual day lasts 24 real minutes in "cycle" mode. */
export const CYCLE_MS = 24 * 60_000;

/**
 * Hour of day (0–24) for rendering. Night is compressed so the world is
 * mostly bright: cycle fraction → hours via a piecewise-linear map.
 */
export function hourOfDay(now: number, mode: Settings['dayNight'], anchor: number): number {
  if (mode === 'day') return 11;
  if (mode === 'local') {
    const d = new Date(now);
    return d.getHours() + d.getMinutes() / 60;
  }
  // Start new players at 9am.
  const f = (((now - anchor) / CYCLE_MS + 0.25) % 1 + 1) % 1;
  // [fraction, hour] keyframes: 70% of the cycle is daylight
  const keys: [number, number][] = [
    [0, 6],
    [0.15, 9],
    [0.55, 16],
    [0.7, 19],
    [0.78, 21],
    [0.95, 4.5 + 24],
    [1, 6 + 24],
  ];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, h0] = keys[i];
    const [f1, h1] = keys[i + 1];
    if (f >= f0 && f <= f1) return (h0 + ((f - f0) / (f1 - f0)) * (h1 - h0)) % 24;
  }
  return 12;
}

export function phaseOf(hour: number): DayPhase {
  if (hour >= 5.5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 17.5) return 'day';
  if (hour >= 17.5 && hour < 21) return 'evening';
  return 'night';
}
