// Community celebrations rotate: when one ends (and after a day's rest) the next one the
// neighbourhood is ready for begins. Some need a finished spot (a market needs a plaza).
import { EVENTS } from '../../data/progression';
import type { EventDef, GameState } from '../core/types';

const DAY = 86_400_000;
export const EVENT_REST_DAYS = 1;

export const eventEligible = (s: GameState, e: EventDef) => s.level >= e.minLevel && (!e.requires || !!s.flags[e.requires]);

/** The celebration that should start now, if any. */
export function nextEvent(s: GameState, now: number): EventDef | null {
  if (s.event) {
    const cur = EVENTS.find((e) => e.id === s.event!.id);
    const days = cur?.durationDays ?? 0;
    if (now < s.event.startedAt + (days + EVENT_REST_DAYS) * DAY) return null;
  }
  const from = s.event ? EVENTS.findIndex((e) => e.id === s.event!.id) : -1;
  for (let i = 1; i <= EVENTS.length; i++) {
    const e = EVENTS[(from + i + EVENTS.length) % EVENTS.length];
    if (eventEligible(s, e)) return e;
  }
  return null;
}

/** The running celebration, or null between celebrations. */
export function currentEvent(s: GameState, now: number): EventDef | null {
  if (!s.event) return null;
  const e = EVENTS.find((x) => x.id === s.event!.id);
  return e && now < s.event.startedAt + e.durationDays * DAY ? e : null;
}
