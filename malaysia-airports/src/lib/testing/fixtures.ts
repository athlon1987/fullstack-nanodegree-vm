/**
 * Test fixtures shared by unit tests. Not used by application code.
 */
import type { Flight, FlightPlace } from '@/lib/flights/types';
import { encodeFlightId, flightDesignator } from '@/lib/flights/id';
import type { StorageLike } from '@/lib/storage';

export const KUL: FlightPlace = { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia' };
export const LHR: FlightPlace = { code: 'LHR', city: 'London', country: 'United Kingdom' };
export const PEN: FlightPlace = { code: 'PEN', city: 'Penang', country: 'Malaysia' };
export const NRT: FlightPlace = { code: 'NRT', city: 'Tokyo (Narita)', country: 'Japan' };
export const SIN: FlightPlace = { code: 'SIN', city: 'Singapore', country: 'Singapore' };

/** Options for `makeFlight`. `time` is the scheduled local time `HH:mm` on 2026-11-17 (UTC+8). */
export interface FlightSeed extends Partial<Flight> {
  code?: string;
  digits?: string;
  time?: string;
  remote?: FlightPlace;
}

const AIRLINE_NAMES: Record<string, string> = {
  MH: 'Malaysia Airlines',
  AK: 'AirAsia',
  SQ: 'Singapore Airlines',
  BA: 'British Airways',
  JL: 'Japan Airlines',
};

/** A hand-made flight at KUL on 2026-11-17 for tests that need full control. */
export function makeFlight(seed: FlightSeed = {}): Flight {
  const { code = 'MH', digits = '2610', time = '14:00', remote = LHR, ...overrides } = seed;
  const direction = overrides.direction ?? 'd';
  const date = overrides.date ?? '2026-11-17';
  const scheduled = `${date}T${time}:00+08:00`;
  return {
    id: encodeFlightId({ airlineCode: code, number: digits, date, direction }),
    airline: { code, name: AIRLINE_NAMES[code] ?? code },
    number: flightDesignator(code, digits),
    direction,
    airport: 'kul',
    terminal: 'T1',
    origin: direction === 'd' ? KUL : remote,
    destination: direction === 'd' ? remote : KUL,
    date,
    scheduled,
    estimated: scheduled,
    status: 'scheduled',
    delayMinutes: 0,
    isDemo: true,
    ...overrides,
  };
}

/** An in-memory `StorageLike` for store tests. */
export function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}
