/**
 * A read-only flight provider over boards fetched from the feed (`/[lang]/[airport]/flights/feed`).
 * It offers the same synchronous lookups the pages used on the demo generator (`listFlightsSync`,
 * `getFlightSync`, `meta`, `now`) without shipping the generator to the browser.
 *
 * Imports nothing from the content layer or the demo generator: safe and light in client bundles.
 */
import type { LocalizedText, TerminalId } from '@/content/types';
import { decodeFlightId } from '@/lib/flights/id';
import { filterFlights, searchFlights, sortFlights } from '@/lib/flights/query';
import type { Flight, FlightDirection, FlightStatus } from '@/lib/flights/types';
import { toDate, type Instant } from '@/lib/time';
import type { FeedDay } from './resilient';

/** The parts of `ProviderMeta` the pages read. */
export interface SnapshotMeta {
  mode: 'demo' | 'live';
  label: LocalizedText;
  disclaimer: LocalizedText;
  generatedAt: string;
  refreshSeconds: number;
}

export interface SnapshotListQuery {
  airport: string;
  direction?: FlightDirection;
  terminal?: TerminalId;
  status?: readonly FlightStatus[];
  from?: Instant;
  to?: Instant;
  q?: string;
  limit?: number;
}

/** Key of one board: `kul|2026-11-18|d`. */
export const feedKey = (airport: string, date: string, direction: FlightDirection): string => `${airport}|${date}|${direction}`;

export class SnapshotFlightProvider {
  /** The client's current time (from `useNow()`), used for search ranking and "now" states. */
  readonly now: Date;
  private readonly days: ReadonlyMap<string, FeedDay>;

  constructor(days: Iterable<FeedDay>, now: Instant) {
    this.now = toDate(now);
    const map = new Map<string, FeedDay>();
    for (const day of days) map.set(feedKey(day.airport, day.date, day.direction), day);
    this.days = map;
  }

  /** Meta of the oldest board held (the most cautious freshness to show). */
  meta(): SnapshotMeta {
    const days = [...this.days.values()];
    const oldest = days.reduce<FeedDay | undefined>((found, day) => (!found || Date.parse(day.meta.generatedAt) < Date.parse(found.meta.generatedAt) ? day : found), undefined);
    return {
      mode: oldest?.meta.mode ?? 'demo',
      label: oldest?.meta.label ?? { en: 'Demonstration data', ms: 'Data demonstrasi' },
      disclaimer: oldest?.meta.disclaimer ?? { en: '' },
      generatedAt: oldest?.meta.generatedAt ?? this.now.toISOString(),
      refreshSeconds: oldest?.meta.refreshSeconds ?? 30,
    };
  }

  /** True when a board for this airport, date and direction is held. */
  has(airport: string, date: string, direction: FlightDirection): boolean {
    return this.days.has(feedKey(airport, date, direction));
  }

  private all(airport: string, direction?: FlightDirection): Flight[] {
    const flights: Flight[] = [];
    for (const day of this.days.values()) {
      if (day.airport !== airport) continue;
      if (direction && day.direction !== direction) continue;
      flights.push(...day.flights);
    }
    return flights;
  }

  listFlightsSync(query: SnapshotListQuery): Flight[] {
    const filtered = filterFlights(this.all(query.airport, query.direction), {
      terminal: query.terminal,
      status: query.status,
      from: query.from,
      to: query.to,
    });
    const ordered = query.q?.trim() ? searchFlights(filtered, query.q, { now: this.now }) : sortFlights(filtered);
    return query.limit === undefined ? ordered : ordered.slice(0, Math.max(0, query.limit));
  }

  getFlightSync(id: string, airport: string): Flight | null {
    const parts = decodeFlightId(id);
    if (!parts) return null;
    const day = this.days.get(feedKey(airport, parts.date, parts.direction));
    const wanted = id.trim().toLowerCase();
    return day?.flights.find((flight) => flight.id === wanted) ?? null;
  }
}
