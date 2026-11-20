/**
 * Flight domain types. A `Flight` is one row of a departures or arrivals board at one airport.
 *
 * In this prototype every flight comes from the demo provider and has `isDemo: true`: any
 * surface that shows a flight must carry the "Demonstration data" label.
 */
import type { LocalizedText, TerminalId } from '@/content/types';

/** `d` for departures, `a` for arrivals. */
export type FlightDirection = 'd' | 'a';

/** Every status a flight can show, in rough life-cycle order. */
export const FLIGHT_STATUSES = [
  'scheduled',
  'check-in-open',
  'check-in-closed',
  'boarding',
  'final-call',
  'gate-closed',
  'departed',
  'delayed',
  'cancelled',
  'en-route',
  'landed',
  'at-gate',
  'baggage',
  'completed',
] as const;

/** A flight status key. Labels, tone and icon come from `flightStatusMeta`. */
export type FlightStatus = (typeof FLIGHT_STATUSES)[number];

/** An airport at one end of a flight. */
export interface FlightPlace {
  /** IATA airport code, for example `LHR`. */
  code: string;
  city: string;
  country: string;
}

/** The operating airline. */
export interface FlightAirline {
  /** IATA airline code, for example `MH`. */
  code: string;
  name: string;
}

/** A cabin a check-in row can be reserved for. */
export type CheckInCabin = 'economy' | 'business' | 'first';

/** One check-in area of a flight: a row and its counters, for one cabin when the source says so. */
export interface CheckInDesk {
  /** The cabin the row serves. Omitted when the row serves the whole flight (or the source does not say). */
  cabin?: CheckInCabin;
  row: string;
  /** Counter range, for example `1-18`. */
  counters?: string;
}

/** One flight on a board. Times are ISO strings with the airport's UTC offset. */
export interface Flight {
  /** `<airline><number>-<yyyymmdd>-<d|a>`, for example `mh2610-20261117-d`. See `decodeFlightId`. */
  id: string;
  airline: FlightAirline;
  /** Flight designator without a space: `MH2610`. Use `formatFlightNumber` for display. */
  number: string;
  direction: FlightDirection;
  /** Slug of the airport whose board this row belongs to: `kul`. */
  airport: string;
  terminal: TerminalId;
  /** Where the flight starts. For departures this is the board's own airport. */
  origin: FlightPlace;
  /** Where the flight ends. For arrivals this is the board's own airport. */
  destination: FlightPlace;
  /** Local date of the scheduled time at the board's airport: `2026-11-17`. */
  date: string;
  /** Scheduled departure (departures) or arrival (arrivals) time. */
  scheduled: string;
  /** Latest expected time. Equals `scheduled` when the flight is on time. */
  estimated: string;
  /** Actual departure or landing time, once it has happened. */
  actual?: string;
  status: FlightStatus;
  /** A short second line for the status, already in both languages: "New time 14:35". */
  statusDetail?: LocalizedText;
  /** Known delay in minutes (0 when on time or not yet announced). */
  delayMinutes: number;
  /**
   * Check-in row of the first (main) desk, shown only while check-in is relevant (departures).
   * Kept for simple lists; when `checkInDesks` has several cabins, show those instead.
   */
  checkInRow?: string;
  /** Counter range of the first desk, for example `1-18` (departures). */
  checkInCounters?: string;
  /** Every check-in desk for the flight, by cabin when known (departures). Use `checkInLines()`. */
  checkInDesks?: CheckInDesk[];
  /** Self-service bag drop rows, when known (departures): `['F', 'G']`. */
  bagDrop?: string[];
  checkInOpensAt?: string;
  checkInClosesAt?: string;
  /** Gate. Undefined until it is assigned: show `flights.board.gateNotAssigned`. */
  gate?: string;
  /** When boarding is expected to start (departures). */
  boardingAt?: string;
  /** When the gate is expected to close (departures). */
  gateClosesAt?: string;
  /** Baggage belt (arrivals). Undefined until it is assigned. */
  belt?: string;
  /** Scheduled flight time in minutes, when known. */
  durationMinutes?: number;
  aircraft?: string;
  /** Other flight numbers the same flight is sold under, formatted like `QR 5441`. */
  codeshares?: string[];
  /** True for simulated flights. Always true in this prototype. */
  isDemo: boolean;
}

/** A flight from a demo provider: the demonstration label is mandatory. */
export type DemoFlight = Flight & { isDemo: true };
