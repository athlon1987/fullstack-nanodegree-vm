/**
 * What a flight page can show before the flight feed answers (round 5, E-01/E-02): the fields of a
 * flight that come from the demonstration timetable alone and never from the clock. The server
 * resolves them from the id (`identifyFlight`), so the page's first flush already carries the
 * route, the scheduled time and the terminal; the status, expected time, check-in desks, gate,
 * belt and boarding times follow from the feed after hydration.
 *
 * Safe for Client Components: types and a pure picker only (no generator, no content layer).
 * `flight-identity.test.ts` checks that every field picked here is the same at any time of day.
 */
import type { Flight } from '@/lib/flights';

export type FlightIdentity = Pick<
  Flight,
  'id' | 'airline' | 'number' | 'direction' | 'airport' | 'terminal' | 'origin' | 'destination' | 'date' | 'scheduled' | 'durationMinutes' | 'aircraft' | 'codeshares' | 'isDemo'
>;

export const IDENTITY_FIELDS = [
  'id',
  'airline',
  'number',
  'direction',
  'airport',
  'terminal',
  'origin',
  'destination',
  'date',
  'scheduled',
  'durationMinutes',
  'aircraft',
  'codeshares',
  'isDemo',
] as const satisfies readonly (keyof FlightIdentity)[];

/** The clock-independent fields of a flight, as a plain serializable object. */
export function flightIdentity(flight: Flight): FlightIdentity {
  const identity: Partial<Record<keyof FlightIdentity, unknown>> = {};
  for (const field of IDENTITY_FIELDS) if (flight[field] !== undefined) identity[field] = flight[field];
  return identity as FlightIdentity;
}
