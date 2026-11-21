/**
 * Flight search: parse what people type, match it against flights, rank, filter and group.
 * All pure functions over `Flight[]`, so they work on any provider's output.
 */
import { DEFAULT_TIMEZONE, toDate, zonedParts, type Instant } from '@/lib/time';
import type { TerminalId } from '@/content/types';
import { normaliseFlightDigits } from './id';
import type { Flight, FlightDirection, FlightPlace, FlightStatus } from './types';

/**
 * Three-letter (ICAO) airline codes and common names mapped to the IATA code used on boards,
 * so that "MAS 2610" finds MH 2610.
 */
export const AIRLINE_ALIASES: Readonly<Record<string, string>> = {
  mas: 'MH',
  axm: 'AK',
  xax: 'D7',
  mxd: 'OD',
  ffm: 'FY',
  sia: 'SQ',
  tgw: 'TR',
  uae: 'EK',
  qtr: 'QR',
  cpa: 'CX',
  jal: 'JL',
  klm: 'KL',
  ana: 'NH',
  baw: 'BA',
  thy: 'TK',
  kal: 'KE',
  etd: 'EY',
  aic: 'AI',
  rba: 'BI',
  cal: 'CI',
};

/** What kind of search a query is. */
export type FlightQueryKind = 'empty' | 'flight-number' | 'route' | 'text';

/** The structured form of a search string. */
export interface ParsedFlightQuery {
  /** The text as typed. */
  raw: string;
  /** Lower-cased, accent-free, single-spaced text. */
  text: string;
  kind: FlightQueryKind;
  /** IATA airline code, when the query names one: `MH`. */
  airlineCode?: string;
  /** Flight number digits without leading zeros, possibly partial: `2610`, `26`. */
  number?: string;
  /** Route origin as typed (code or city), lower case. */
  from?: string;
  /** Route destination as typed (code or city), lower case. */
  to?: string;
  /** Words of a free-text query. */
  terms: string[];
}

/** Lower-case, strip accents and collapse whitespace. */
export function normaliseText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s\-–>→()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const FLIGHT_NUMBER = /^([a-z]{3}|[a-z][a-z0-9]|[0-9][a-z])\s*-?\s*(\d{1,4}[a-z]?)$/;
const DIGITS_ONLY = /^\d{1,4}$/;
const ROUTE_WORDS = /^(.+?)\s+(?:to|ke)\s+(.+)$/;
const ROUTE_CODES = /^([a-z]{3})\s*[-–>→]\s*([a-z]{3})$/;
const FILLER_ORIGINS = new Set(['flight', 'flights', 'fly', 'flying', 'penerbangan', 'terbang']);

/**
 * Understand a search string.
 *
 * - `"MH 2610"`, `"mh2610"`, `"MH-2610"`, `"MAS 2610"` give `{ kind: 'flight-number', airlineCode: 'MH', number: '2610' }`
 * - `"2610"` gives a flight number without an airline
 * - `"KUL-LHR"`, `"KUL to London"`, `"Kuala Lumpur ke Tokyo"` give `{ kind: 'route', from, to }`
 * - anything else is free text matched against airline, city, airport code and country
 */
export function parseFlightQuery(raw: string): ParsedFlightQuery {
  const text = normaliseText(raw);
  if (!text) return { raw, text, kind: 'empty', terms: [] };

  const numberMatch = FLIGHT_NUMBER.exec(text);
  if (numberMatch) {
    const code = numberMatch[1];
    const airlineCode = code.length === 3 ? AIRLINE_ALIASES[code] : code.toUpperCase();
    if (airlineCode) {
      return { raw, text, kind: 'flight-number', airlineCode, number: normaliseFlightDigits(numberMatch[2]), terms: [] };
    }
  }
  if (DIGITS_ONLY.test(text)) {
    return { raw, text, kind: 'flight-number', number: normaliseFlightDigits(text), terms: [] };
  }

  const routeMatch = ROUTE_CODES.exec(text) ?? ROUTE_WORDS.exec(text);
  if (routeMatch) {
    const from = routeMatch[1].trim();
    const to = routeMatch[2].trim();
    // "flights to London" is a destination search, not a route from a place called "flights".
    if (FILLER_ORIGINS.has(from)) return { raw, text: to, kind: 'text', terms: to.split(' ').filter(Boolean) };
    return { raw, text, kind: 'route', from, to, terms: [] };
  }

  return { raw, text, kind: 'text', terms: text.split(' ').filter(Boolean) };
}

/** True when the text looks like a flight number or a route rather than a general question. */
export function looksLikeFlightQuery(raw: string): boolean {
  const kind = parseFlightQuery(raw).kind;
  return kind === 'flight-number' || kind === 'route';
}

/** Digits (and suffix letter) of a flight's own number: `MH2610` gives `2610`. */
function ownDigits(flight: Flight): string {
  return flight.number.slice(flight.airline.code.length);
}

function wordStarts(haystack: string, needle: string): boolean {
  return haystack.startsWith(needle) || haystack.includes(` ${needle}`) || haystack.includes(`(${needle}`);
}

/**
 * Malay forms of the demo destinations' city names that differ from English (D-09 hand-off,
 * round 2; draft pending native review, OOS-14). Flights keep the English name in `city`.
 */
const CITY_MS: Readonly<Record<string, string>> = {
  Penang: 'Pulau Pinang',
  Singapore: 'Singapura',
  'Singapore (Seletar)': 'Singapura (Seletar)',
};

/** A flight place's city in the page language. */
export function placeCity(place: Pick<FlightPlace, 'city'>, lang: 'en' | 'ms'): string {
  return lang === 'ms' ? (CITY_MS[place.city] ?? place.city) : place.city;
}

/**
 * How well a place matches a term, from 0 (no match) to 1 (exact airport code).
 * Matches the IATA code, the city in English or Malay (prefix or word start) and the country.
 */
export function placeMatchScore(place: FlightPlace, term: string): number {
  const needle = normaliseText(term);
  if (!needle) return 0;
  const code = place.code.toLowerCase();
  const city = normaliseText(place.city);
  const cityMs = normaliseText(placeCity(place, 'ms'));
  const country = normaliseText(place.country);
  if (needle === code) return 1;
  if (city === needle || cityMs === needle) return 0.95;
  if (city.startsWith(needle) || cityMs.startsWith(needle)) return 0.9;
  if (needle.length >= 3 && (wordStarts(city, needle) || wordStarts(cityMs, needle))) return 0.8;
  if (country === needle) return 0.6;
  if (needle.length >= 3 && wordStarts(country, needle)) return 0.5;
  return 0;
}

/** The far end of a flight as seen from its board: destination for departures, origin for arrivals. */
export function remotePlace(flight: Flight): FlightPlace {
  return flight.direction === 'd' ? flight.destination : flight.origin;
}

function airlineScore(flight: Flight, term: string): number {
  const code = flight.airline.code.toLowerCase();
  const name = normaliseText(flight.airline.name);
  if (term === code) return 55;
  if (name === term) return 58;
  if (term.length >= 3 && name.startsWith(term)) return 52;
  if (term.length >= 3 && wordStarts(name, term)) return 46;
  return 0;
}

function termScore(flight: Flight, term: string): number {
  const place = placeMatchScore(remotePlace(flight), term);
  const placePoints = place > 0 ? 40 + Math.round(place * 35) : 0;
  const number = flight.number.toLowerCase();
  const numberPoints = term.length >= 2 && number.startsWith(term) ? 50 : 0;
  return Math.max(placePoints, airlineScore(flight, term), numberPoints);
}

/**
 * Score one flight against a parsed query: 0 means no match, higher is better (100 is an exact
 * flight number).
 *
 * - Flight number: exact 100, codeshare 85, number without airline 90, prefix 60 to 70.
 * - Route: both ends must match; 60 to 100 by how exactly.
 * - Text: the whole phrase, or every word, must match the airline, the far-end city, airport
 *   code or country.
 */
export function matchFlight(flight: Flight, query: ParsedFlightQuery): number {
  if (query.kind === 'empty') return 0;

  if (query.kind === 'flight-number' && query.number) {
    const digits = ownDigits(flight);
    if (query.airlineCode) {
      if (flight.airline.code === query.airlineCode) {
        if (digits === query.number) return 100;
        if (digits.startsWith(query.number)) return 70;
      }
      const wanted = `${query.airlineCode}${query.number}`;
      const shares = (flight.codeshares ?? []).map((share) => share.replace(/\s+/g, '').toUpperCase());
      if (shares.includes(wanted)) return 85;
      return 0;
    }
    if (digits === query.number) return 90;
    if (digits.startsWith(query.number)) return 60;
    return 0;
  }

  if (query.kind === 'route' && query.from && query.to) {
    const from = placeMatchScore(flight.origin, query.from);
    const to = placeMatchScore(flight.destination, query.to);
    if (from === 0 || to === 0) return 0;
    return 60 + Math.round(20 * (from + to));
  }

  const whole = termScore(flight, query.text);
  if (whole > 0) return whole;
  if (query.terms.length < 2) return 0;
  let total = 0;
  for (const term of query.terms) {
    const score = termScore(flight, term);
    if (score === 0) return 0;
    total += score;
  }
  return Math.round(total / query.terms.length);
}

/** A flight together with its match score. */
export interface FlightMatch {
  flight: Flight;
  score: number;
}

/** Options for `searchFlights`. */
export interface FlightSearchOptions {
  limit?: number;
  /**
   * The current instant. When given, flights that have not left or landed yet rank ahead of
   * past ones among equal scores.
   */
  now?: Instant;
}

/**
 * Search flights and rank the matches: best score first, then upcoming before past (when `now`
 * is given), then by scheduled time.
 */
export function rankFlights(flights: readonly Flight[], query: string | ParsedFlightQuery, options: FlightSearchOptions = {}): FlightMatch[] {
  const parsed = typeof query === 'string' ? parseFlightQuery(query) : query;
  const now = options.now === undefined ? undefined : toDate(options.now).getTime();
  const matches: FlightMatch[] = [];
  for (const flight of flights) {
    const score = matchFlight(flight, parsed);
    if (score > 0) matches.push({ flight, score });
  }
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aTime = Date.parse(a.flight.estimated);
    const bTime = Date.parse(b.flight.estimated);
    if (now !== undefined) {
      const aPast = aTime < now ? 1 : 0;
      const bPast = bTime < now ? 1 : 0;
      if (aPast !== bPast) return aPast - bPast;
      if (aPast === 1) return bTime - aTime || a.flight.id.localeCompare(b.flight.id);
    }
    return aTime - bTime || a.flight.id.localeCompare(b.flight.id);
  });
  return options.limit === undefined ? matches : matches.slice(0, options.limit);
}

/** Like `rankFlights`, returning only the flights. An empty query returns no flights. */
export function searchFlights(flights: readonly Flight[], query: string | ParsedFlightQuery, options: FlightSearchOptions = {}): Flight[] {
  return rankFlights(flights, query, options).map((match) => match.flight);
}

/** Filters for a flight board. Every key is optional; omitted keys do not filter. */
export interface FlightFilters {
  direction?: FlightDirection;
  terminal?: TerminalId;
  /** Keep flights whose status is one of these. */
  status?: readonly FlightStatus[];
  /** Keep flights whose expected time is at or after this instant. */
  from?: Instant;
  /** Keep flights whose expected time is before this instant. */
  to?: Instant;
  /** IATA airline code. */
  airline?: string;
  /** `true` for international flights only, `false` for domestic only. */
  international?: boolean;
}

/** True when the flight crosses a border. */
export function isInternationalFlight(flight: Pick<Flight, 'origin' | 'destination'>): boolean {
  return flight.origin.country !== flight.destination.country;
}

/** Apply board filters. The time window uses the expected (`estimated`) time. */
export function filterFlights(flights: readonly Flight[], filters: FlightFilters): Flight[] {
  const from = filters.from === undefined ? undefined : toDate(filters.from).getTime();
  const to = filters.to === undefined ? undefined : toDate(filters.to).getTime();
  const airline = filters.airline?.toUpperCase();
  return flights.filter((flight) => {
    if (filters.direction && flight.direction !== filters.direction) return false;
    if (filters.terminal && flight.terminal !== filters.terminal) return false;
    if (filters.status && filters.status.length > 0 && !filters.status.includes(flight.status)) return false;
    if (airline && flight.airline.code !== airline) return false;
    if (filters.international !== undefined && isInternationalFlight(flight) !== filters.international) return false;
    const time = Date.parse(flight.estimated);
    if (from !== undefined && time < from) return false;
    if (to !== undefined && time >= to) return false;
    return true;
  });
}

/** Sort by scheduled (default) or expected time, earliest first, with a stable tie-break. */
export function sortFlights(flights: readonly Flight[], by: 'scheduled' | 'estimated' = 'scheduled'): Flight[] {
  return [...flights].sort((a, b) => Date.parse(a[by]) - Date.parse(b[by]) || a.id.localeCompare(b.id));
}

/** Flights that share a scheduled local hour. */
export interface FlightHourGroup {
  /** Local date of the hour: `2026-11-17`. */
  date: string;
  /** 0 to 23. */
  hour: number;
  /** `08:00` */
  label: string;
  flights: Flight[];
}

/** Group flights by the local hour of their scheduled time, in time order. */
export function groupFlightsByHour(flights: readonly Flight[], timeZone: string = DEFAULT_TIMEZONE): FlightHourGroup[] {
  const groups = new Map<string, FlightHourGroup>();
  for (const flight of sortFlights(flights)) {
    const parts = zonedParts(flight.scheduled, timeZone);
    const date = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
    const key = `${date}T${parts.hour}`;
    let group = groups.get(key);
    if (!group) {
      group = { date, hour: parts.hour, label: `${String(parts.hour).padStart(2, '0')}:00`, flights: [] };
      groups.set(key, group);
    }
    group.flights.push(flight);
  }
  return [...groups.values()];
}

/** Display form of a flight number: `MH 2610`. Accepts a flight or a compact designator. */
export function formatFlightNumber(flight: Pick<Flight, 'airline' | 'number'> | string): string {
  if (typeof flight === 'string') {
    const compact = flight.replace(/\s+/g, '').toUpperCase();
    return compact.length > 2 ? `${compact.slice(0, 2)} ${compact.slice(2)}` : compact;
  }
  return `${flight.airline.code} ${flight.number.slice(flight.airline.code.length)}`;
}
