/**
 * Pure helpers behind the flight board page: reading and writing the URL filters, the status
 * groups, the time window, and which flights to show. No clock, no storage: `now` is passed in.
 */
import type { TerminalId } from '@/content/types';
import {
  decodeFlightId,
  encodeFlightId,
  parseFlightQuery,
  searchFlights,
  sortFlights,
  type Flight,
  type FlightDirection,
  type FlightStatus,
} from '@/lib/flights';
import type { TKey } from '@/lib/i18n/translate';
import { addMinutes, dateKey, minutesOfDay, shiftDateKey, zonedDateTime, type Instant } from '@/lib/time';

/** A status filter: several statuses that mean the same thing to a passenger. */
export type StatusGroupId = 'scheduled' | 'check-in' | 'boarding' | 'delayed' | 'cancelled' | 'departed' | 'en-route' | 'landed' | 'completed';

export interface StatusGroup {
  id: StatusGroupId;
  statuses: readonly FlightStatus[];
  /** Label key; the label is the status word passengers see on the board. */
  labelKey: TKey;
  icon: string;
}

/** Status filters per board, in life-cycle order. Every status of a board is in exactly one group. */
export const STATUS_GROUPS: Readonly<Record<FlightDirection, readonly StatusGroup[]>> = {
  d: [
    { id: 'scheduled', statuses: ['scheduled'], labelKey: 'flights.statuses.scheduled', icon: 'clock' },
    { id: 'check-in', statuses: ['check-in-open', 'check-in-closed'], labelKey: 'common.labels.checkIn', icon: 'ticket-check' },
    { id: 'boarding', statuses: ['boarding', 'final-call', 'gate-closed'], labelKey: 'flights.statuses.boarding', icon: 'door-open' },
    { id: 'delayed', statuses: ['delayed'], labelKey: 'flights.statuses.delayed', icon: 'clock-alert' },
    { id: 'cancelled', statuses: ['cancelled'], labelKey: 'flights.statuses.cancelled', icon: 'circle-x' },
    { id: 'departed', statuses: ['departed'], labelKey: 'flights.statuses.departed', icon: 'plane-takeoff' },
  ],
  a: [
    { id: 'scheduled', statuses: ['scheduled'], labelKey: 'flights.statuses.scheduled', icon: 'clock' },
    { id: 'en-route', statuses: ['en-route'], labelKey: 'flights.statuses.enRoute', icon: 'plane' },
    { id: 'delayed', statuses: ['delayed'], labelKey: 'flights.statuses.delayed', icon: 'clock-alert' },
    { id: 'landed', statuses: ['landed', 'at-gate', 'baggage'], labelKey: 'flights.statuses.landed', icon: 'plane-landing' },
    { id: 'cancelled', statuses: ['cancelled'], labelKey: 'flights.statuses.cancelled', icon: 'circle-x' },
    { id: 'completed', statuses: ['completed'], labelKey: 'flights.statuses.completed', icon: 'circle-check' },
  ],
};

/** The group a status belongs to on a board, or `undefined` when the status cannot appear there. */
export function statusGroupOf(status: FlightStatus, direction: FlightDirection): StatusGroupId | undefined {
  return STATUS_GROUPS[direction].find((group) => group.statuses.includes(status))?.id;
}

/** How many flights fall in each status group of a board. */
export function countByGroup(flights: readonly Flight[], direction: FlightDirection): Partial<Record<StatusGroupId, number>> {
  const counts: Partial<Record<StatusGroupId, number>> = {};
  for (const flight of flights) {
    const group = statusGroupOf(flight.status, direction);
    if (group) counts[group] = (counts[group] ?? 0) + 1;
  }
  return counts;
}

/** The filters a board page reads from its URL. */
export interface BoardParams {
  /** `?dir=d|a`. Undefined when absent: the page then follows the journey mode. */
  direction?: FlightDirection;
  /** `?t=T1|T2`, only when the airport has that terminal and more than one. */
  terminal?: TerminalId;
  /** `?q=`: the search within the board. */
  q: string;
  /** `?s=delayed,cancelled`: status groups valid for the direction. */
  groups: StatusGroupId[];
}

const MAX_QUERY_LENGTH = 80;

/** Minimal read interface shared by `URLSearchParams` and Next's read-only search params. */
interface ParamReader {
  get(name: string): string | null;
}

/** Read the board filters from the URL, dropping anything invalid. */
export function readBoardParams(params: ParamReader, terminals: readonly TerminalId[], fallbackDirection?: FlightDirection): BoardParams {
  const dir = params.get('dir');
  const direction: FlightDirection | undefined = dir === 'd' || dir === 'a' ? dir : undefined;
  const t = params.get('t')?.toUpperCase();
  const terminal = terminals.length > 1 ? terminals.find((id) => id === t) : undefined;
  const q = (params.get('q') ?? '').slice(0, MAX_QUERY_LENGTH);
  const valid = STATUS_GROUPS[direction ?? fallbackDirection ?? 'd'].map((group) => group.id);
  const groups = [
    ...new Set(
      (params.get('s') ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter((value): value is StatusGroupId => (valid as string[]).includes(value)),
    ),
  ];
  return { direction, terminal, q, groups };
}

/** The query string for a board (`?dir=d&t=T1&q=MH&s=delayed`), or an empty string. */
export function boardQueryString(params: { direction?: FlightDirection; terminal?: TerminalId; q?: string; groups?: readonly StatusGroupId[] }): string {
  const query = new URLSearchParams();
  if (params.direction) query.set('dir', params.direction);
  if (params.terminal) query.set('t', params.terminal);
  const q = params.q?.trim();
  if (q) query.set('q', q.slice(0, MAX_QUERY_LENGTH));
  if (params.groups && params.groups.length > 0) query.set('s', params.groups.join(','));
  const text = query.toString();
  return text ? `?${text}` : '';
}

/** Hours added by each Earlier or Later step. */
export const WINDOW_STEP_HOURS = 3;
/** How far the window can be moved back (steps) and forward (steps). */
export const MAX_EARLIER_STEPS = 4;
export const MAX_LATER_STEPS = 6;

/** A time window on the board. */
export interface BoardRange {
  from: Date;
  to: Date;
}

/**
 * How far back the default window opens (ux-frequent-10): departures 10 minutes, so the board
 * leads with flights still to leave; arrivals 45 minutes, because people meeting a flight that
 * landed half an hour ago still need it.
 */
export const DEFAULT_BEHIND_MINUTES: Readonly<Record<FlightDirection, number>> = { d: 10, a: 45 };

/**
 * The default window runs from `DEFAULT_BEHIND_MINUTES` back to 6 hours ahead; each Earlier step
 * adds 3 hours before it, each Later step 3 hours after it.
 */
export function boardRange(now: Instant, earlier = 0, later = 0, direction: FlightDirection = 'd'): BoardRange {
  const back = DEFAULT_BEHIND_MINUTES[direction] + Math.min(Math.max(earlier, 0), MAX_EARLIER_STEPS) * WINDOW_STEP_HOURS * 60;
  const ahead = 6 * 60 + Math.min(Math.max(later, 0), MAX_LATER_STEPS) * WINDOW_STEP_HOURS * 60;
  return { from: addMinutes(now, -back), to: addMinutes(now, ahead) };
}

/**
 * In the default view (no Earlier steps, no search), flights that are over do not lead the board:
 * departed departures and completed arrivals are set aside and counted, and Earlier shows them.
 */
export function setAsideFinished(flights: readonly Flight[], direction: FlightDirection): { shown: Flight[]; finished: number } {
  const over: FlightStatus = direction === 'd' ? 'departed' : 'completed';
  const shown = flights.filter((flight) => flight.status !== over);
  return { shown, finished: flights.length - shown.length };
}

/** Rows rendered at once; "Show more" adds the same again (performance-02). */
export const BOARD_ROW_LIMIT = 40;

/**
 * The local dates a time range touches at an airport, for fetching boards. Shortly after
 * midnight the previous day's late flights are still on the board, so that day is included.
 */
export function datesInRange(range: BoardRange, timeZone: string): string[] {
  let first = dateKey(range.from, timeZone);
  if (minutesOfDay(range.from, timeZone) < 180) first = shiftDateKey(first, -1);
  // `to` is exclusive: a window ending at midnight does not need the next day.
  const last = dateKey(new Date(range.to.getTime() - 1), timeZone);
  const dates: string[] = [];
  for (let date = first; date <= last && dates.length < 4; date = shiftDateKey(date, 1)) dates.push(date);
  return dates;
}

/** The range a search covers: the whole of today and tomorrow at the airport. */
export function searchRange(now: Instant, timeZone: string): BoardRange {
  const today = dateKey(now, timeZone);
  return { from: zonedDateTime(today, 0, timeZone), to: zonedDateTime(shiftDateKey(today, 2), 0, timeZone) };
}

/** Shortest search the board acts on: one character matches too much to be useful. */
export const MIN_QUERY_LENGTH = 2;

/** True when the board should search rather than show its time window. */
export function isSearching(q: string): boolean {
  return q.trim().length >= MIN_QUERY_LENGTH;
}

/** How the board reads a query, for the "Reading this as" hint. */
export type QueryReading = 'flightNumber' | 'route' | 'airline' | 'text';

export function readQueryKind(q: string): QueryReading | null {
  if (!isSearching(q)) return null;
  const parsed = parseFlightQuery(q);
  if (parsed.kind === 'empty') return null;
  if (parsed.kind === 'flight-number') return 'flightNumber';
  if (parsed.kind === 'route') return 'route';
  return parsed.airlineCode ? 'airline' : 'text';
}

/**
 * The flights to show: the search (when there is one) and the status groups applied to the pool,
 * in scheduled-time order so that hour groups read like a departures board.
 */
export function selectBoardFlights(
  pool: readonly Flight[],
  options: { q: string; groups: readonly StatusGroupId[]; direction: FlightDirection; now?: Instant },
): Flight[] {
  let list: readonly Flight[] = pool;
  if (isSearching(options.q)) list = searchFlights(list, options.q, { now: options.now });
  if (options.groups.length > 0) {
    const statuses = new Set(STATUS_GROUPS[options.direction].filter((group) => options.groups.includes(group.id)).flatMap((group) => group.statuses));
    list = list.filter((flight) => statuses.has(flight.status));
  }
  return sortFlights(list);
}

/** Whether a flight id's date is still on the demonstration board. */
export type FlightAvailability = 'current' | 'expired' | 'future';

/** Flights stay from the day before today to a week ahead. */
export const DAYS_BEHIND = 1;
export const DAYS_AHEAD = 7;

export function flightAvailability(date: string, now: Instant, timeZone: string): FlightAvailability {
  const today = dateKey(now, timeZone);
  if (date < shiftDateKey(today, -DAYS_BEHIND)) return 'expired';
  if (date > shiftDateKey(today, DAYS_AHEAD)) return 'future';
  return 'current';
}

/** The id of the same flight number on another date (`mh2610-20261117-d` on 2026-11-18). */
export function sameFlightOn(id: string, date: string): string | null {
  const parts = decodeFlightId(id);
  if (!parts) return null;
  try {
    return encodeFlightId({ ...parts, date });
  } catch {
    return null;
  }
}
