/**
 * The concierge's flights come from the server flight feed (round 5, B-09), the same boards the
 * departures board, flight pages, My journey and the home previews show: on the server from
 * `serveFlightFeed` (`/api/concierge`), in the browser from the batched `/[lang]/flights/feed`
 * route (the on-device answers). The demonstration generator no longer runs in the browser.
 *
 * The engine looks flights up synchronously, so the boards a question can need are worked out
 * first (`flightBoardsFor`), fetched, and handed to the engine as a `ConciergeFlightSource`
 * (`flightSourceFromDays`). When they cannot be fetched (offline, the feed failing) the engine
 * gets `unavailableFlightSource()` and says that flight information could not be loaded, instead
 * of saying the flight does not exist.
 *
 * Pure and light: no content tables, no generator, no React; safe in client bundles.
 */
import { FEATURED_AIRPORT_SLUGS } from '@/content/airports';
import { decodeFlightId } from '@/lib/flights/id';
import type { FlightDirection } from '@/lib/flights/types';
import type { DemoFlightProvider } from '@/lib/providers';
import type { FeedDay } from '@/lib/providers/resilient';
import { SnapshotFlightProvider } from '@/lib/providers/snapshot';
import { dateKey } from '@/lib/time';
import { understand } from './understand';
import type { ConciergeContext, ConciergeFlightSource, ConciergeKnowledge } from './types';

/** One board: an airport's flights for a local date and direction. */
export interface FlightBoardRequest {
  airport: string;
  date: string;
  direction: FlightDirection;
}

const DIRECTIONS: readonly FlightDirection[] = ['d', 'a'];

/**
 * The boards the engine may look a flight up in for this question, the same ones the demo
 * generator searched: today's departures and arrivals at the airport the question or the context
 * names and at the six featured airports when it names a flight (`MH2610`), or the saved flight's
 * own board. None when the question needs no flight. Only airports with a board (`hasBoard`).
 */
export function flightBoardsFor(
  question: string,
  knowledge: ConciergeKnowledge,
  context: ConciergeContext,
  now: number,
  hasBoard: (airport: string) => boolean,
  /** The saved flight's own airport, when the caller knows it (the browser does). */
  flightAirport?: string,
): FlightBoardRequest[] {
  const boards = new Map<string, FlightBoardRequest>();
  const add = (airport: string | undefined, date: string, direction: FlightDirection) => {
    if (airport && hasBoard(airport)) boards.set(`${airport}|${date}|${direction}`, { airport, date, direction });
  };
  const understanding = understand(question, knowledge, context);
  if (understanding.slots.flight) {
    const today = dateKey(now);
    // As the engine resolves the airport: named, else the one multi-terminal airport when a
    // terminal is named, else the context's.
    const multiTerminal = knowledge.airports.filter((airport) => airport.terminals.length > 1);
    const named = understanding.slots.airport ?? (understanding.slots.terminals.length > 0 && multiTerminal.length === 1 ? multiTerminal[0].slug : undefined);
    for (const airport of new Set([named, context.airport, ...FEATURED_AIRPORT_SLUGS])) for (const direction of DIRECTIONS) add(airport, today, direction);
  } else if (context.flightId) {
    const parts = decodeFlightId(context.flightId);
    if (parts) add(flightAirport ?? context.airport, parts.date, parts.direction);
  }
  return [...boards.values()];
}

/** Boards grouped by date and direction: one batched feed request each. */
export function groupBoards(boards: readonly FlightBoardRequest[]): FlightBoardRequest[][] {
  const groups = new Map<string, FlightBoardRequest[]>();
  for (const board of boards) {
    const key = `${board.date}|${board.direction}`;
    groups.set(key, [...(groups.get(key) ?? []), board]);
  }
  return [...groups.values()];
}

/** The engine's flight lookups over boards from the feed. */
export function flightSourceFromDays(days: readonly FeedDay[], now: number): ConciergeFlightSource {
  const provider = new SnapshotFlightProvider(days, now);
  return {
    generatedAt: provider.meta().generatedAt,
    get: (id, airport) => {
      if (airport) return provider.getFlightSync(id, airport);
      for (const day of days) {
        const found = provider.getFlightSync(id, day.airport);
        if (found) return found;
      }
      return null;
    },
    find: (designator, airport) =>
      provider.searchSync({ q: designator, airport, limit: 6 }).filter((flight) => flight.number.toUpperCase() === designator.toUpperCase()),
  };
}

/** The flight boards could not be loaded: lookups find nothing and the engine says why. */
export function unavailableFlightSource(): ConciergeFlightSource {
  return { generatedAt: '', unavailable: true, get: () => null, find: () => [] };
}

/**
 * The engine's lookups over a demo provider built for `now`. Unit tests only since round 5: the
 * concierge itself reads the flight feed (above), which serves the same generated boards.
 */
export function flightSourceFromProvider(provider: DemoFlightProvider): ConciergeFlightSource {
  return {
    generatedAt: provider.meta().generatedAt,
    get: (id, airport) => provider.getFlightSync(id, airport),
    find: (designator, airport) =>
      provider
        .searchSync({ q: designator, airport, limit: 6 })
        .filter((flight) => flight.number.toUpperCase() === designator.toUpperCase()),
  };
}
