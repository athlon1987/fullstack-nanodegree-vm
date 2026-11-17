/**
 * Data-provider interfaces: the seam between the UI and operational data.
 *
 * The prototype ships demo implementations only. A real integration would implement the same
 * interfaces and return `mode: 'live'` in its meta; nothing in the UI would need to change
 * except that the demonstration labels disappear when `meta().mode === 'live'`.
 */
import type { LocalizedText, TerminalId } from '@/content/types';
import type { Flight, FlightDirection, FlightStatus } from '@/lib/flights/types';
import type { Instant } from '@/lib/time';

/** Whether data is simulated or comes from an operational system. */
export type ProviderMode = 'demo' | 'live';

/** What a provider says about itself. Show `label` and `disclaimer` wherever its data appears. */
export interface ProviderMeta {
  mode: ProviderMode;
  /** Short label: "Demonstration data". */
  label: LocalizedText;
  /** ISO instant (with airport offset) the data was generated for. */
  generatedAt: string;
  /** How often a client should ask again. */
  refreshSeconds: number;
  /** Where the data comes from, in plain words. */
  source: string;
  /** One sentence the UI shows near the data. */
  disclaimer: LocalizedText;
}

/** Query for a flight board. */
export interface FlightListQuery {
  /** Airport slug or IATA code. */
  airport: string;
  /** Omit for departures and arrivals together. */
  direction?: FlightDirection;
  /** Local date key (`2026-11-17`). Defaults to the airport's current date, or the days spanned by `from`/`to`. */
  date?: string;
  terminal?: TerminalId;
  status?: readonly FlightStatus[];
  /** Keep flights expected at or after this instant. */
  from?: Instant;
  /** Keep flights expected before this instant. */
  to?: Instant;
  /** Free-text filter (flight number, city, airline, route). */
  q?: string;
  limit?: number;
}

/** Query for flight search across one airport or the whole demo network. */
export interface FlightSearchQuery {
  q: string;
  /** Airport slug. Omit to search the featured airports. */
  airport?: string;
  direction?: FlightDirection;
  /** Local date key. Defaults to the current date. */
  date?: string;
  limit?: number;
}

/** A source of flight information. */
export interface FlightDataProvider {
  meta(): ProviderMeta;
  /** Flights for a board, in scheduled-time order (or ranked by relevance when `q` is set). */
  listFlights(query: FlightListQuery): Promise<Flight[]>;
  /**
   * One flight by id (`mh2610-20261117-d`). The id does not name the airport: pass `airport`
   * when you know it (the flight detail route does), otherwise every airport is searched.
   */
  getFlight(id: string, airport?: string): Promise<Flight | null>;
  /** Ranked search results. */
  search(query: FlightSearchQuery): Promise<Flight[]>;
}

/** Checkpoints that can have a queue. */
export type WaitCheckpoint =
  | 'check-in'
  | 'security'
  | 'immigration-departure'
  | 'immigration-arrival'
  | 'customs'
  | 'taxi-queue';

/** A queue estimate for one checkpoint. */
export interface WaitTime {
  airport: string;
  terminal: TerminalId;
  checkpoint: WaitCheckpoint;
  /** Estimated wait in whole minutes. */
  minutes: number;
  level: 'short' | 'moderate' | 'long';
  trend: 'falling' | 'steady' | 'rising';
  /** ISO instant the estimate applies to. */
  updatedAt: string;
  /** True for simulated values. Always true in this prototype. */
  isDemo: boolean;
}

/** A source of queue estimates. */
export interface WaitTimeProvider {
  meta(): ProviderMeta;
  getWaitTimes(query: { airport: string; terminal?: TerminalId }): Promise<WaitTime[]>;
}

/** How full a car park is. */
export interface ParkingAvailability {
  carParkId: string;
  /** 0 to 100. */
  percentFull: number;
  /** Free bays, only when the car park's bay count is published. */
  availableBays?: number;
  level: 'plenty' | 'filling' | 'nearly-full' | 'full';
  updatedAt: string;
  /** True for simulated values. Always true in this prototype. */
  isDemo: boolean;
}

/** A source of car park availability. */
export interface ParkingAvailabilityProvider {
  meta(): ProviderMeta;
  /** Pass the car parks you want figures for (id and published bay count are enough). */
  getAvailability(query: { airport: string; carParks: readonly { id: string; bays?: number }[] }): Promise<ParkingAvailability[]>;
}

/** Thrown by provider stubs that exist to document an integration but are not wired up. */
export class ProviderNotConfiguredError extends Error {
  constructor(provider: string, detail: string) {
    super(`${provider} is not configured: ${detail}`);
    this.name = 'ProviderNotConfiguredError';
  }
}
