/**
 * Flight ids: `<airline><number>-<yyyymmdd>-<d|a>`, lower case, for example `mh2610-20261117-d`.
 * The date is the local date of the scheduled time at the board's airport.
 */
import { compactDateKey, expandDateKey, isDateKey } from '@/lib/time';
import type { FlightDirection } from './types';

/** The parts encoded in a flight id. */
export interface FlightIdParts {
  /** IATA airline code, upper case: `MH`. */
  airlineCode: string;
  /** Flight number without the airline, no leading zeros: `2610`. */
  number: string;
  /** Local date key: `2026-11-17`. */
  date: string;
  direction: FlightDirection;
}

const ID_PATTERN = /^([a-z0-9]{2})(\d{1,4}[a-z]?)-(\d{8})-([da])$/;

/** Strip leading zeros from a flight number while keeping an operational suffix letter. */
export function normaliseFlightDigits(number: string): string {
  const match = /^0*(\d+)([a-z]?)$/i.exec(number.trim());
  return match ? `${match[1]}${match[2].toUpperCase()}` : number.trim().toUpperCase();
}

/** Build a flight id. Throws on input that could not be decoded again. */
export function encodeFlightId(parts: FlightIdParts): string {
  const airline = parts.airlineCode.trim().toLowerCase();
  const number = normaliseFlightDigits(parts.number).toLowerCase();
  if (!/^[a-z0-9]{2}$/.test(airline) || !/^\d{1,4}[a-z]?$/.test(number) || !isDateKey(parts.date)) {
    throw new Error(`Cannot encode flight id from ${JSON.stringify(parts)}`);
  }
  return `${airline}${number}-${compactDateKey(parts.date)}-${parts.direction}`;
}

/** Parse a flight id. Returns `null` for anything that is not a well-formed id with a real date. */
export function decodeFlightId(id: string): FlightIdParts | null {
  const match = ID_PATTERN.exec(id.trim().toLowerCase());
  if (!match) return null;
  const date = expandDateKey(match[3]);
  if (!date) return null;
  return {
    airlineCode: match[1].toUpperCase(),
    number: normaliseFlightDigits(match[2]),
    date,
    direction: match[4] as FlightDirection,
  };
}

/** True for a well-formed flight id. */
export function isFlightId(id: string): boolean {
  return decodeFlightId(id) !== null;
}

/** The compact designator used in `Flight.number`: `flightDesignator('mh', '2610')` is `MH2610`. */
export function flightDesignator(airlineCode: string, number: string): string {
  return `${airlineCode.trim().toUpperCase()}${normaliseFlightDigits(number)}`;
}
