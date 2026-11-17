/**
 * OfficialFlightProvider: a documented stub, NOT wired to any network call.
 *
 * What the audit observed (docs/research, November 2026)
 * ------------------------------------------------------
 * The official Malaysia Airports flight board pages load their rows from a public endpoint:
 *
 *   GET https://api.myairports.com.my/passenger-fids/api/flights/search-flights
 *       ?code=D|A          departures or arrivals
 *       &key=...           free-text search key (flight number, city)
 *       &terminal=...      terminal filter
 *       &live=...          live-board flag
 *       &limit=...&skip=...&take=...   paging
 *
 * The endpoint answers 401 without the official site's own request headers, so this prototype
 * does not call it and never will without an agreement with Malaysia Airports. The response
 * schema was therefore not observed. The board fields the official pages render are known
 * from the audit: scheduled time, origin or destination, airline, flight number, status,
 * check-in counter and boarding gate (departures), baggage belt and gate (arrivals), and a
 * "last update" stamp.
 *
 * How a real integration would map onto our model
 * -----------------------------------------------
 *   our FlightListQuery.direction 'd' | 'a'  ->  code=D | code=A
 *   our FlightListQuery.q                    ->  key
 *   our FlightListQuery.terminal 'T1' | 'T2' ->  terminal (value format to be confirmed)
 *   our FlightListQuery.limit                ->  take (with skip for paging)
 *
 *   their scheduled time            ->  Flight.scheduled   (convert to ISO with +08:00)
 *   their estimated or revised time ->  Flight.estimated
 *   their airline and flight number ->  Flight.airline, Flight.number (`flightDesignator`)
 *   their origin / destination      ->  Flight.origin / Flight.destination
 *   their status text               ->  Flight.status through a lookup table to `FlightStatus`,
 *                                       keeping the original text in `statusDetail`
 *   their check-in counter          ->  Flight.checkInRow / Flight.checkInCounters
 *   their boarding gate             ->  Flight.gate
 *   their baggage belt              ->  Flight.belt
 *   (always)                        ->  Flight.isDemo = false, meta().mode = 'live'
 *
 * The id format stays `<airline><number>-<yyyymmdd>-<d|a>` so saved flights survive a switch
 * from demo to live data.
 */
import type { Flight } from '@/lib/flights/types';
import { ProviderNotConfiguredError, type FlightDataProvider, type FlightListQuery, type ProviderMeta } from './types';

/** The endpoint observed in the audit. Documented only: nothing in this codebase requests it. */
export const OFFICIAL_FLIGHTS_ENDPOINT = 'https://api.myairports.com.my/passenger-fids/api/flights/search-flights';

/** Query parameters of the official endpoint, as observed. Value formats are unconfirmed. */
export interface OfficialFlightSearchParams {
  /** `D` for departures, `A` for arrivals. */
  code: 'D' | 'A';
  /** Free-text search key. */
  key?: string;
  /** Terminal filter. */
  terminal?: string;
  /** Live-board flag. */
  live?: string;
  limit?: number;
  skip?: number;
  take?: number;
}

/**
 * A row of the official response. The schema was NOT observed (the endpoint returned 401), so
 * every field is an assumption drawn from what the official board displays. Confirm against a
 * real response before relying on any of it.
 */
export interface OfficialFlightRowAssumed {
  scheduledTime?: string;
  estimatedTime?: string;
  airline?: string;
  flightNumber?: string;
  origin?: string;
  destination?: string;
  status?: string;
  checkInCounter?: string;
  gate?: string;
  belt?: string;
  terminal?: string;
  lastUpdate?: string;
}

/** Translate our list query into the official endpoint's parameters. Pure; performs no request. */
export function toOfficialParams(query: FlightListQuery): OfficialFlightSearchParams {
  const params: OfficialFlightSearchParams = { code: query.direction === 'a' ? 'A' : 'D' };
  if (query.q) params.key = query.q;
  if (query.terminal && query.terminal !== 'MAIN') params.terminal = query.terminal;
  if (query.limit !== undefined) params.take = query.limit;
  return params;
}

const REASON =
  'this prototype has no agreement to use the Malaysia Airports flight API, which rejects requests without the official site headers. Use the demo provider.';

/** Stub that documents the live integration. Every data method throws `ProviderNotConfiguredError`. */
export class OfficialFlightProvider implements FlightDataProvider {
  meta(): ProviderMeta {
    throw new ProviderNotConfiguredError('OfficialFlightProvider', REASON);
  }

  async listFlights(): Promise<Flight[]> {
    throw new ProviderNotConfiguredError('OfficialFlightProvider', REASON);
  }

  async getFlight(): Promise<Flight | null> {
    throw new ProviderNotConfiguredError('OfficialFlightProvider', REASON);
  }

  async search(): Promise<Flight[]> {
    throw new ProviderNotConfiguredError('OfficialFlightProvider', REASON);
  }
}
