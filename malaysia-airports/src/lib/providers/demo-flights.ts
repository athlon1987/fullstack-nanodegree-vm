/**
 * DemoFlightProvider: a deterministic, synthetic flight board.
 *
 * How it works
 *  1. A stable daily TIMETABLE per airport and direction is built from the illustrative route
 *     templates in `demo-routes.ts` with a seeded PRNG (mulberry32 over a string hash). The same
 *     flight number leaves at the same time every day, like a real schedule.
 *  2. For a given local DATE, each flight gets seeded day-specific events: a small share of
 *     delays, rare cancellations, a gate, a belt and check-in counters.
 *  3. The flight's STATUS and which details are visible are derived from `now` relative to the
 *     scheduled time. Gates appear about 90 minutes before departure, belts about 20 minutes
 *     before landing, check-in rows when check-in opens.
 *
 * Purity: everything is a pure function of (airport, local date, now). Nothing here reads the
 * clock, so it is safe in Server Components, cached scopes and tests. The one exception is the
 * thin `createDemoProvider()` convenience at the bottom, for event handlers on the client.
 *
 * Every flight produced here has `isDemo: true`. The schedule is synthetic: every surface that
 * shows these flights must carry the "Demonstration data" label.
 */
import { getAirport } from '@/content/airports';
import { lt, type Airport, type LocalizedText, type TerminalId } from '@/content/types';
import { decodeFlightId, encodeFlightId, flightDesignator } from '@/lib/flights/id';
import { filterFlights, searchFlights, sortFlights } from '@/lib/flights/query';
import type { DemoFlight, FlightDirection, FlightPlace, FlightStatus } from '@/lib/flights/types';
import {
  addMinutes,
  dateKey,
  formatTime,
  isDateKey,
  minutesOfDay,
  shiftDateKey,
  toDate,
  toIsoWithOffset,
  zonedDateTime,
  zonedParts,
  type Instant,
} from '@/lib/time';
import { DEMO_AIRLINES, DEMO_AIRPORT_SLUGS, DEMO_PLACES, DEMO_ROUTES, hasDemoRoutes } from './demo-routes';
import { hashString, intWith, pickWith, seededRandom } from './random';
import type { FlightDataProvider, FlightListQuery, FlightSearchQuery, ProviderMeta } from './types';

/** How often a client should rebuild the demo board. */
export const DEMO_REFRESH_SECONDS = 30;

/** Share of flights that are delayed on a given day. */
const DELAY_SHARE = 0.14;
/** Share of flights that are cancelled on a given day. */
const CANCEL_SHARE = 0.012;

/** One line of the stable daily timetable. */
export interface DemoTimetableEntry {
  airlineCode: string;
  airlineName: string;
  /** Flight number without the airline code. */
  digits: string;
  direction: FlightDirection;
  terminal: TerminalId;
  /** The far end of the flight. */
  remote: FlightPlace;
  /** Scheduled local time as minutes after midnight. */
  minuteOfDay: number;
  durationMinutes: number;
  aircraft: string;
  international: boolean;
  /** ISO weekdays the flight operates; undefined means daily. */
  days?: number[];
}

const timetableCache = new Map<string, DemoTimetableEntry[]>();

function localPlace(airport: Airport): FlightPlace {
  const known = DEMO_PLACES[airport.code];
  return { code: airport.code, city: known?.city ?? airport.city, country: 'Malaysia' };
}

/**
 * The stable daily timetable for an airport and direction. Deterministic and cached: the same
 * inputs always give the same list, sorted by time.
 */
export function buildDemoTimetable(airportSlug: string, direction: FlightDirection): DemoTimetableEntry[] {
  const airport = getAirport(airportSlug);
  if (!airport) return [];
  const cacheKey = `${airport.slug}|${direction}`;
  const cached = timetableCache.get(cacheKey);
  if (cached) return cached;

  const entries: DemoTimetableEntry[] = [];
  const used = new Set<string>();
  const local = airport.code;

  for (const template of DEMO_ROUTES[airport.slug] ?? []) {
    const profile = DEMO_AIRLINES[template.code];
    const [min, max] = profile.numbers;
    const slots = Math.max(1, Math.floor((max - min) / 2));
    const terminal: TerminalId = template.terminal ?? airport.terminals[0].id;

    for (const destination of template.destinations) {
      const random = seededRandom(`${airport.slug}|${direction}|${template.code}|${destination.code}`);
      const pairKey = [local, destination.code].sort().join('-');
      const base = min + (hashString(`${template.code}|${pairKey}`) % slots) * 2;
      // Outbound and return flights of a city pair get interleaved numbers, as airlines do.
      const departs = direction === 'd' ? local : destination.code;
      const arrives = direction === 'd' ? destination.code : local;
      const parity = departs < arrives ? 0 : 1;

      const long = destination.minutes > 300;
      const [start, end] =
        direction === 'd' ? (long ? [510, 1430] : [360, 1350]) : long ? [330, 1350] : [420, 1410];

      for (let index = 0; index < destination.daily; index += 1) {
        const slot = start + ((index + 0.15 + 0.7 * random()) * (end - start)) / destination.daily;
        const minuteOfDay = Math.min(1435, Math.max(0, Math.round(slot / 5) * 5));
        let number = base + index * 2 + parity;
        while (used.has(`${template.code}${number}`)) number += 2;
        used.add(`${template.code}${number}`);

        const entry: DemoTimetableEntry = {
          airlineCode: template.code,
          airlineName: template.name,
          digits: String(number),
          direction,
          terminal,
          remote: { code: destination.code, city: destination.city, country: destination.country },
          minuteOfDay,
          durationMinutes: destination.minutes,
          aircraft: long && profile.aircraft.long ? profile.aircraft.long : profile.aircraft.short,
          international: destination.country !== 'Malaysia',
        };
        if (destination.days) entry.days = destination.days;
        entries.push(entry);
      }
    }
  }

  entries.sort(
    (a, b) => a.minuteOfDay - b.minuteOfDay || `${a.airlineCode}${a.digits}`.localeCompare(`${b.airlineCode}${b.digits}`),
  );
  timetableCache.set(cacheKey, entries);
  return entries;
}

/* ------------------------------------------------------------------------------------------
 * Gate, belt and check-in assignment (all illustrative)
 * --------------------------------------------------------------------------------------- */

const T1_ROWS = ['A', 'C', 'E', 'G', 'J', 'K', 'L', 'M'];
const T2_ROWS = ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

function gateFor(entry: DemoTimetableEntry, airport: Airport, random: () => number): string {
  if (airport.slug === 'kul' && entry.terminal === 'T1') {
    if (!entry.international) return `${pickWith(random, ['A', 'B'])}${intWith(random, 1, 11)}`;
    if (entry.durationMinutes > 300) return `C${intWith(random, 1, 37)}`;
    return `${pickWith(random, ['G', 'H'])}${intWith(random, 1, 10)}`;
  }
  if (airport.slug === 'kul') {
    return entry.international
      ? `${pickWith(random, ['L', 'P', 'Q'])}${intWith(random, 1, 18)}`
      : `${pickWith(random, ['J', 'K'])}${intWith(random, 1, 20)}`;
  }
  const gates = airport.depth === 'full' ? 10 : airport.slug === 'szb' ? 6 : 3;
  return String(intWith(random, 1, gates));
}

function beltFor(airport: Airport, random: () => number): string {
  const belts = airport.slug === 'kul' ? 10 : airport.depth === 'full' ? 4 : 2;
  return String(intWith(random, 1, belts));
}

function checkInFor(entry: DemoTimetableEntry, airport: Airport, random: () => number): { row?: string; counters: string } {
  const first = intWith(random, 1, 9);
  if (airport.slug !== 'kul') {
    const start = intWith(random, 1, airport.depth === 'full' ? 20 : 6);
    return { counters: `${start}-${start + 3}` };
  }
  if (entry.terminal === 'T1' && entry.airlineCode === 'MH') {
    // Mirrors the rows Malaysia Airlines publishes; still demo data, since counters vary daily.
    return { row: entry.international ? 'H' : 'B', counters: '1-18' };
  }
  const rows = entry.terminal === 'T1' ? T1_ROWS : T2_ROWS;
  return { row: rows[hashString(entry.airlineCode) % rows.length], counters: `${first}-${first + 5}` };
}

/* ------------------------------------------------------------------------------------------
 * Status derivation
 * --------------------------------------------------------------------------------------- */

interface Timing {
  checkInOpen: number;
  checkInClose: number;
  boarding: number;
  finalCall: number;
  gateClose: number;
}

function departureTiming(international: boolean): Timing {
  return international
    ? { checkInOpen: 180, checkInClose: 60, boarding: 45, finalCall: 25, gateClose: 15 }
    : { checkInOpen: 120, checkInClose: 45, boarding: 30, finalCall: 18, gateClose: 10 };
}

const detail = {
  newTime: (time: string): LocalizedText => lt(`New time ${time}`, `Masa baharu ${time}`),
  gateNotAssigned: (): LocalizedText => lt('Gate not yet assigned', 'Pintu belum ditetapkan'),
  checkInOpens: (time: string): LocalizedText => lt(`Check-in opens ${time}`, `Daftar masuk dibuka ${time}`),
  goToGate: (gate: string): LocalizedText => lt(`Go to gate ${gate}`, `Sila ke pintu ${gate}`),
  gateCloses: (gate: string, time: string): LocalizedText => lt(`Gate ${gate} closes ${time}`, `Pintu ${gate} ditutup ${time}`),
  departedAt: (time: string): LocalizedText => lt(`Departed ${time}`, `Berlepas ${time}`),
  cancelled: (): LocalizedText => lt('Check with your airline', 'Semak dengan syarikat penerbangan anda'),
  expected: (time: string): LocalizedText => lt(`Expected ${time}`, `Dijangka ${time}`),
  landedAt: (time: string): LocalizedText => lt(`Landed ${time}`, `Mendarat ${time}`),
  belt: (belt: string): LocalizedText => lt(`Belt ${belt}`, `Karusel ${belt}`),
};

function buildFlight(entry: DemoTimetableEntry, airport: Airport, date: string, now: Date): DemoFlight {
  const zone = airport.timezone;
  const scheduled = zonedDateTime(date, entry.minuteOfDay, zone);
  const designator = flightDesignator(entry.airlineCode, entry.digits);
  const random = seededRandom(`${airport.slug}|${date}|${entry.direction}|${designator}`);

  // Draw every day-specific value up front so that adding a field never shifts the others.
  const cancelRoll = random();
  const delayRoll = random();
  const delayAmountRoll = random();
  const cancelled = cancelRoll < CANCEL_SHARE;
  const delayed = !cancelled && delayRoll < DELAY_SHARE;
  const delay = delayed ? Math.round((20 + delayAmountRoll * 100) / 5) * 5 : 0;
  const announceLead = 60 + Math.floor(random() * 120);
  const gateLead = 78 + Math.floor(random() * 25);
  const gate = gateFor(entry, airport, random);
  const belt = beltFor(airport, random);
  const checkIn = checkInFor(entry, airport, random);
  const codeshareRoll = random();
  const codeshareNumber = 5000 + Math.floor(random() * 999);
  const partners = DEMO_AIRLINES[entry.airlineCode].codesharePartners;

  const local = localPlace(airport);
  const iso = (value: Date): string => toIsoWithOffset(value, zone);
  const clock = (value: Date): string => formatTime(value, zone);
  const time = now.getTime();
  const minutesBefore = (anchor: Date, minutes: number): number => anchor.getTime() - minutes * 60000;
  const minutesAfter = (anchor: Date, minutes: number): number => anchor.getTime() + minutes * 60000;

  const flight: DemoFlight = {
    id: encodeFlightId({ airlineCode: entry.airlineCode, number: entry.digits, date, direction: entry.direction }),
    airline: { code: entry.airlineCode, name: entry.airlineName },
    number: designator,
    direction: entry.direction,
    airport: airport.slug,
    terminal: entry.terminal,
    origin: entry.direction === 'd' ? local : entry.remote,
    destination: entry.direction === 'd' ? entry.remote : local,
    date,
    scheduled: iso(scheduled),
    estimated: iso(scheduled),
    status: 'scheduled',
    delayMinutes: 0,
    durationMinutes: entry.durationMinutes,
    aircraft: entry.aircraft,
    isDemo: true,
  };
  if (partners && entry.international && codeshareRoll < 0.3) {
    flight.codeshares = [`${partners[Math.floor(codeshareRoll * 1000) % partners.length]} ${codeshareNumber}`];
  }

  if (entry.direction === 'd') {
    const timing = departureTiming(entry.international);
    const announced = delayed && time >= minutesBefore(scheduled, announceLead + timing.checkInClose);
    const knownDelay = announced ? delay : 0;
    const estimated = addMinutes(scheduled, knownDelay);
    const checkInOpens = new Date(minutesBefore(scheduled, timing.checkInOpen));
    const checkInCloses = new Date(minutesBefore(estimated, timing.checkInClose));
    const boardingAt = new Date(minutesBefore(estimated, timing.boarding));
    const gateClosesAt = new Date(minutesBefore(estimated, timing.gateClose));

    flight.estimated = iso(estimated);
    flight.delayMinutes = knownDelay;
    flight.checkInOpensAt = iso(checkInOpens);
    flight.checkInClosesAt = iso(checkInCloses);
    flight.boardingAt = iso(boardingAt);
    flight.gateClosesAt = iso(gateClosesAt);

    if (cancelled) {
      if (time >= minutesBefore(scheduled, 300)) {
        flight.status = 'cancelled';
        flight.statusDetail = detail.cancelled();
      } else {
        flight.statusDetail = detail.checkInOpens(clock(checkInOpens));
      }
      return flight;
    }

    const gateKnown = time >= minutesBefore(estimated, gateLead);
    const checkInKnown = time >= checkInOpens.getTime();
    if (gateKnown) flight.gate = gate;
    if (checkInKnown && time < estimated.getTime()) {
      if (checkIn.row) flight.checkInRow = checkIn.row;
      flight.checkInCounters = checkIn.counters;
    }

    let status: FlightStatus;
    if (time >= estimated.getTime()) {
      status = 'departed';
      flight.actual = iso(estimated);
      flight.statusDetail = detail.departedAt(clock(estimated));
    } else if (time >= gateClosesAt.getTime()) {
      status = 'gate-closed';
    } else if (time >= minutesBefore(estimated, timing.finalCall)) {
      status = 'final-call';
      flight.statusDetail = detail.gateCloses(gate, clock(gateClosesAt));
    } else if (time >= boardingAt.getTime()) {
      status = 'boarding';
      flight.statusDetail = detail.goToGate(gate);
    } else if (announced) {
      status = 'delayed';
      flight.statusDetail = detail.newTime(clock(estimated));
    } else if (time >= checkInCloses.getTime()) {
      status = 'check-in-closed';
      if (!gateKnown) flight.statusDetail = detail.gateNotAssigned();
    } else if (checkInKnown) {
      status = 'check-in-open';
      if (!gateKnown) flight.statusDetail = detail.gateNotAssigned();
    } else {
      status = 'scheduled';
      flight.statusDetail = detail.checkInOpens(clock(checkInOpens));
    }
    flight.status = status;
    return flight;
  }

  // Arrivals
  const announced = delayed && time >= minutesBefore(scheduled, entry.durationMinutes + 30);
  const knownDelay = announced ? delay : 0;
  const estimated = addMinutes(scheduled, knownDelay);
  flight.estimated = iso(estimated);
  flight.delayMinutes = knownDelay;

  if (cancelled) {
    if (time >= minutesBefore(scheduled, Math.max(entry.durationMinutes + 120, 240))) {
      flight.status = 'cancelled';
      flight.statusDetail = detail.cancelled();
    }
    return flight;
  }

  const bagsFrom = entry.international ? 25 : 15;
  const doneAfter = entry.international ? 75 : 45;
  if (time >= minutesBefore(estimated, 30)) flight.gate = gate;
  if (time >= minutesBefore(estimated, 20)) flight.belt = belt;

  if (time >= minutesAfter(estimated, doneAfter)) {
    flight.status = 'completed';
    flight.actual = iso(estimated);
  } else if (time >= minutesAfter(estimated, bagsFrom)) {
    flight.status = 'baggage';
    flight.actual = iso(estimated);
    flight.statusDetail = detail.belt(belt);
  } else if (time >= minutesAfter(estimated, 6)) {
    flight.status = 'at-gate';
    flight.actual = iso(estimated);
    flight.statusDetail = detail.belt(belt);
  } else if (time >= estimated.getTime()) {
    flight.status = 'landed';
    flight.actual = iso(estimated);
    flight.statusDetail = detail.landedAt(clock(estimated));
  } else if (announced) {
    flight.status = 'delayed';
    flight.statusDetail = detail.newTime(clock(estimated));
  } else if (time >= minutesBefore(estimated, entry.durationMinutes)) {
    flight.status = 'en-route';
    flight.statusDetail = detail.expected(clock(estimated));
  }
  return flight;
}

/**
 * The demo flights of one airport, local date and direction, as they stand at `now`.
 * Pure and deterministic. Returns an empty list for airports without demo routes.
 */
export function demoFlightsForDate(airportSlug: string, date: string, direction: FlightDirection, now: Instant): DemoFlight[] {
  const airport = getAirport(airportSlug);
  if (!airport || !isDateKey(date)) return [];
  const weekday = zonedParts(zonedDateTime(date, 720, airport.timezone), airport.timezone).weekday;
  const moment = toDate(now);
  return buildDemoTimetable(airport.slug, direction)
    .filter((entry) => !entry.days || entry.days.includes(weekday))
    .map((entry) => buildFlight(entry, airport, date, moment));
}

/** A sensible default window for a live board: from 45 minutes ago to `hoursAhead` hours ahead. */
export function boardWindow(now: Instant, hoursAhead = 6, minutesBehind = 45): { from: Date; to: Date } {
  return { from: addMinutes(now, -minutesBehind), to: addMinutes(now, hoursAhead * 60) };
}

/**
 * The demo flight provider: an immutable snapshot of the synthetic network at one instant.
 *
 * Create one per moment you want to show (`new DemoFlightProvider(now)`), where `now` comes
 * from the request (route handlers) or from `useNow()` (Client Components). Besides the async
 * `FlightDataProvider` methods it offers `*Sync` variants, which Client Components can call
 * directly inside `useMemo`.
 */
export class DemoFlightProvider implements FlightDataProvider {
  /** The instant this snapshot describes. */
  readonly now: Date;
  private readonly cache = new Map<string, DemoFlight[]>();

  constructor(now: Instant) {
    this.now = new Date(toDate(now).getTime());
  }

  meta(): ProviderMeta {
    return {
      mode: 'demo',
      label: lt('Demonstration data', 'Data demonstrasi'),
      generatedAt: toIsoWithOffset(this.now),
      refreshSeconds: DEMO_REFRESH_SECONDS,
      source: 'Synthetic schedule generated by this prototype from illustrative route templates. Not connected to any airport or airline system.',
      disclaimer: lt(
        'Flight times, gates and status are simulated for this prototype. They are not live. Check with your airline for real information.',
        'Waktu penerbangan, pintu dan status disimulasikan untuk prototaip ini. Ia bukan maklumat langsung. Semak dengan syarikat penerbangan anda untuk maklumat sebenar.',
      ),
    };
  }

  private forDate(slug: string, date: string, direction: FlightDirection): DemoFlight[] {
    const key = `${slug}|${date}|${direction}`;
    let flights = this.cache.get(key);
    if (!flights) {
      flights = demoFlightsForDate(slug, date, direction, this.now);
      this.cache.set(key, flights);
    }
    return flights;
  }

  private datesFor(query: FlightListQuery, zone: string): string[] {
    if (query.date && isDateKey(query.date)) return [query.date];
    if (query.from === undefined && query.to === undefined) return [dateKey(this.now, zone)];
    const from = query.from ?? this.now;
    const to = query.to ?? from;
    let first = dateKey(from, zone);
    // Shortly after midnight, late flights from the previous day are still on the board.
    if (minutesOfDay(from, zone) < 180) first = shiftDateKey(first, -1);
    const last = dateKey(to, zone);
    const dates: string[] = [];
    for (let date = first; date <= last && dates.length < 4; date = shiftDateKey(date, 1)) dates.push(date);
    return dates.length > 0 ? dates : [first];
  }

  /** Synchronous form of `listFlights`. */
  listFlightsSync(query: FlightListQuery): DemoFlight[] {
    const airport = getAirport(query.airport);
    if (!airport || !hasDemoRoutes(airport.slug)) return [];
    const directions: FlightDirection[] = query.direction ? [query.direction] : ['d', 'a'];
    const all = this.datesFor(query, airport.timezone).flatMap((date) =>
      directions.flatMap((direction) => this.forDate(airport.slug, date, direction)),
    );
    const filtered = filterFlights(all, {
      terminal: query.terminal,
      status: query.status,
      from: query.from,
      to: query.to,
    }) as DemoFlight[];
    const ordered = query.q?.trim()
      ? (searchFlights(filtered, query.q, { now: this.now }) as DemoFlight[])
      : (sortFlights(filtered) as DemoFlight[]);
    return query.limit === undefined ? ordered : ordered.slice(0, Math.max(0, query.limit));
  }

  /** Synchronous form of `getFlight`. */
  getFlightSync(id: string, airport?: string): DemoFlight | null {
    const parts = decodeFlightId(id);
    if (!parts) return null;
    const wanted = id.trim().toLowerCase();
    const slugs = airport ? [getAirport(airport)?.slug].filter((slug): slug is string => Boolean(slug)) : DEMO_AIRPORT_SLUGS;
    for (const slug of slugs) {
      const match = this.forDate(slug, parts.date, parts.direction).find((flight) => flight.id === wanted);
      if (match) return match;
    }
    return null;
  }

  /** Synchronous form of `search`. */
  searchSync(query: FlightSearchQuery): DemoFlight[] {
    if (!query.q.trim()) return [];
    const slugs = query.airport
      ? [getAirport(query.airport)?.slug].filter((slug): slug is string => Boolean(slug))
      : DEMO_AIRPORT_SLUGS.slice(0, 6);
    const directions: FlightDirection[] = query.direction ? [query.direction] : ['d', 'a'];
    const flights = slugs.flatMap((slug) => {
      const zone = getAirport(slug)?.timezone;
      const date = query.date && isDateKey(query.date) ? query.date : dateKey(this.now, zone);
      return directions.flatMap((direction) => this.forDate(slug, date, direction));
    });
    return searchFlights(flights, query.q, { now: this.now, limit: query.limit ?? 20 }) as DemoFlight[];
  }

  async listFlights(query: FlightListQuery): Promise<DemoFlight[]> {
    return this.listFlightsSync(query);
  }

  async getFlight(id: string, airport?: string): Promise<DemoFlight | null> {
    return this.getFlightSync(id, airport);
  }

  async search(query: FlightSearchQuery): Promise<DemoFlight[]> {
    return this.searchSync(query);
  }
}

/**
 * Convenience for Client Components: a demo provider for a given instant, or for the current
 * moment when called without one.
 *
 * Calling it WITHOUT an argument reads the clock, so do that only in event handlers or
 * subscriptions, never during render (it fails the build under Cache Components). In render,
 * pass the value from `useNow()`: `const provider = now ? createDemoProvider(now) : null`, or
 * use the `useFlightProvider()` hook, which does exactly that.
 */
export function createDemoProvider(now?: Instant): DemoFlightProvider {
  return new DemoFlightProvider(now ?? Date.now());
}
