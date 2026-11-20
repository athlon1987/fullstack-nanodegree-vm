/**
 * The server side of the flight feed (BR-05, exec-commerce-03): any `FlightDataProvider` (the
 * demo generator today, the official feed once connected, OOS-01) behind a cache with a timeout
 * and a last-known fallback.
 *
 *  - A fresh answer is cached per airport, local date and direction for `ttlMs`.
 *  - When the source throws or does not answer within `timeoutMs`, the last good answer is
 *    served with `stale: true` and its age; with nothing to fall back on, `FeedUnavailableError`.
 *  - An answer whose own `generatedAt` is older than two refresh intervals is marked stale too.
 *
 * Pure apart from the clock passed in: no `Date.now()` here, so it is testable and safe under
 * Cache Components. Server only in practice (the route handler holds the singleton).
 */
import type { Flight, FlightDirection } from '@/lib/flights/types';
import { toDate, type Instant } from '@/lib/time';
import type { FlightDataProvider, ProviderMeta } from './types';

/** One airport's board for one local date and direction, as the feed serves it. */
export interface FeedDay {
  airport: string;
  date: string;
  direction: FlightDirection;
  flights: Flight[];
  meta: Pick<ProviderMeta, 'mode' | 'label' | 'disclaimer' | 'refreshSeconds' | 'source' | 'generatedAt'>;
  /** True when this is last-known data: the source failed, timed out or sent old data. */
  stale: boolean;
  /** Seconds between the data's `generatedAt` and the moment it was served. */
  ageSeconds: number;
  /** Why the data is stale: `timeout`, `error` or `old-data`. */
  reason?: 'timeout' | 'error' | 'old-data';
}

/** No answer from the source and nothing cached to fall back on. */
export class FeedUnavailableError extends Error {
  constructor(
    readonly reason: 'timeout' | 'error',
    detail: string,
  ) {
    super(`Flight feed unavailable (${reason}): ${detail}`);
    this.name = 'FeedUnavailableError';
  }
}

export interface ResilientOptions {
  /** How long a fresh answer is reused. Default 30 s. */
  ttlMs?: number;
  /** How long the source may take. Default 4 s, so the client (8 s) always gets an answer. */
  timeoutMs?: number;
  /** Most entries kept per cache. Default 300. */
  maxEntries?: number;
}

interface Entry {
  day: FeedDay;
  /** Server time the entry was stored (ms). */
  storedAt: number;
}

const keyOf = (airport: string, date: string, direction: FlightDirection): string => `${airport}|${date}|${direction}`;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new FeedUnavailableError('timeout', `no answer within ${ms} ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Wraps a provider factory (`(now) => FlightDataProvider`). Create one per process and keep it.
 *
 * @example
 * const feed = new ResilientFlightFeed((now) => new DemoFlightProvider(now));
 * const day = await feed.day({ airport: 'kul', date: '2026-11-18', direction: 'd' }, new Date());
 */
export class ResilientFlightFeed {
  private readonly fresh = new Map<string, Entry>();
  private readonly lastGood = new Map<string, Entry>();
  private readonly ttlMs: number;
  private readonly timeoutMs: number;
  private readonly maxEntries: number;

  constructor(
    private readonly source: (now: Date) => FlightDataProvider,
    options: ResilientOptions = {},
  ) {
    this.ttlMs = options.ttlMs ?? 30_000;
    this.timeoutMs = options.timeoutMs ?? 4_000;
    this.maxEntries = options.maxEntries ?? 300;
  }

  private remember(map: Map<string, Entry>, key: string, entry: Entry): void {
    map.delete(key);
    map.set(key, entry);
    if (map.size > this.maxEntries) map.delete(map.keys().next().value as string);
  }

  /**
   * The board for one airport, date and direction at `now`.
   * `bucketKey` separates answers for different instants (the demo can be asked about any time).
   */
  async day(query: { airport: string; date: string; direction: FlightDirection }, now: Instant, bucketKey = ''): Promise<FeedDay> {
    const moment = toDate(now);
    const time = moment.getTime();
    const key = keyOf(query.airport, query.date, query.direction);
    const freshKey = `${key}|${bucketKey}`;
    const cached = this.fresh.get(freshKey);
    if (cached && time - cached.storedAt < this.ttlMs && time >= cached.storedAt) return this.age(cached.day, time);

    try {
      const provider = this.source(moment);
      const meta = provider.meta();
      const flights = await withTimeout(provider.listFlights({ airport: query.airport, date: query.date, direction: query.direction }), this.timeoutMs);
      const generated = Date.parse(meta.generatedAt);
      const old = Number.isFinite(generated) && time - generated > 2 * meta.refreshSeconds * 1000;
      const day: FeedDay = {
        ...query,
        flights,
        meta: { mode: meta.mode, label: meta.label, disclaimer: meta.disclaimer, refreshSeconds: meta.refreshSeconds, source: meta.source, generatedAt: meta.generatedAt },
        stale: old,
        ageSeconds: Number.isFinite(generated) ? Math.max(0, Math.round((time - generated) / 1000)) : 0,
        ...(old ? { reason: 'old-data' as const } : {}),
      };
      const entry = { day, storedAt: time };
      this.remember(this.fresh, freshKey, entry);
      if (!old) this.remember(this.lastGood, key, entry);
      return day;
    } catch (error) {
      const reason = error instanceof FeedUnavailableError ? error.reason : 'error';
      const fallback = this.lastGood.get(key);
      if (fallback) return { ...this.age(fallback.day, time), stale: true, reason };
      throw error instanceof FeedUnavailableError ? error : new FeedUnavailableError('error', error instanceof Error ? error.message : String(error));
    }
  }

  private age(day: FeedDay, time: number): FeedDay {
    const generated = Date.parse(day.meta.generatedAt);
    return { ...day, ageSeconds: Number.isFinite(generated) ? Math.max(0, Math.round((time - generated) / 1000)) : day.ageSeconds };
  }
}
