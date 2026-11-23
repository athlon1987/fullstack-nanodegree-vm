'use client';

/**
 * The client half of the flight feed (BR-05): fetches boards from the server feed route, keeps
 * the last good answer for each board in memory, and says honestly how fresh it is.
 *
 *  - `loading`: nothing to show yet (a skeleton; never longer than the 8-second timeout).
 *  - `live`: the latest refresh worked.
 *  - `stale`: showing last-known data with its age, because a refresh failed or timed out, or
 *    the data itself is old. Shown as soon as the failure is known.
 *  - `error`: nothing could be loaded. Offer `retry()`.
 *
 * Refreshing can be paused (WCAG 2.2.2): with `paused: true` the hook stops fetching and freezes
 * the clock the page derives its view from, so nothing on screen moves until it is resumed.
 *
 * Imports neither the demo generator nor the content layer.
 */
import { useCallback, useDeferredValue, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { FlightDirection } from '@/lib/flights/types';
import { useNow } from '@/lib/hooks/use-now';
import { useLang } from '@/lib/i18n/client';
import type { FeedDay } from './resilient';
import { SnapshotFlightProvider, feedKey } from './snapshot';

/** One board the page needs. */
export interface FeedRequest {
  airport: string;
  /** Local date key at the airport. */
  date: string;
  direction: FlightDirection;
}

export type FeedStatus = 'loading' | 'live' | 'stale' | 'error';

export interface FlightFeedState {
  /** Lookups over the boards held, or `null` before anything has loaded. */
  provider: SnapshotFlightProvider | null;
  status: FeedStatus;
  /** When the oldest board shown was generated (ISO), or `null`. */
  updatedAt: string | null;
  /** Its age in whole seconds, as seen on this device. */
  ageSeconds: number | null;
  refreshSeconds: number;
  /** Try again now (after a failure, or any time). */
  retry: () => void;
  paused: boolean;
  /** The clock the page should use: frozen while paused. `null` before hydration. */
  now: number | null;
}

/** The client gives up on a request after this long (no spinner lasts more than 10 s). */
export const FEED_TIMEOUT_MS = 8_000;
const STEP_MS = 30_000;

interface Held {
  day: FeedDay;
  /** The demo instant (bucket) the board describes. */
  at: number;
}

/* Last good answer per board, shared by every page of this tab (survives client navigation). */
const memory = new Map<string, Held>();
const inFlight = new Set<string>();
/*
 * Round eight addendum (B-09): how the last request for a board failed, per board and bucket
 * (`key|bucket`). A board already in flight for another component is not asked for twice, so
 * without this a page whose boards were in someone else's failed request said "Loading" until
 * the next 30-second bucket (the home's board preview, while the search's request failed).
 */
const failures = new Map<string, 'error' | 'timeout'>();
const listeners = new Set<() => void>();
let version = 0;

function bump(): void {
  version += 1;
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Fetch one board. Exported for tests (pass a `fetcher`). */
export async function fetchFeedDay(
  lang: string,
  request: FeedRequest,
  at: number,
  fetcher: typeof fetch = fetch,
  timeoutMs = FEED_TIMEOUT_MS,
): Promise<FeedDay> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `/${lang}/${request.airport}/flights/feed?date=${request.date}&dir=${request.direction}&at=${at}`;
    const response = await fetcher(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`feed ${response.status}`);
    const body = (await response.json()) as FeedDay;
    if (!body || !Array.isArray(body.flights) || !body.meta) throw new Error('feed: malformed answer');
    return body;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch several airports' boards for one date and direction in one request (round 2): the home
 * search looks across every airport with a board, and one request per airport used up a
 * visitor's request allowance. Boards the server could not serve are missing from the answer.
 */
export async function fetchFeedDays(
  lang: string,
  requests: readonly FeedRequest[],
  at: number,
  fetcher: typeof fetch = fetch,
  timeoutMs = FEED_TIMEOUT_MS,
): Promise<FeedDay[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const [first] = requests;
    const airports = requests.map((request) => request.airport).join(',');
    const url = `/${lang}/flights/feed?date=${first.date}&dir=${first.direction}&at=${at}&airports=${airports}`;
    const response = await fetcher(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`feed ${response.status}`);
    const body = (await response.json()) as { days?: FeedDay[] };
    if (!body || !Array.isArray(body.days) || body.days.some((day) => !day || !Array.isArray(day.flights) || !day.meta)) throw new Error('feed: malformed answer');
    return body.days;
  } finally {
    clearTimeout(timer);
  }
}

/** Boards of one date and direction asked for together are fetched in one request from this many. */
const BATCH_FROM = 3;

/** Forget every held board (tests). */
export function clearFeedMemory(): void {
  memory.clear();
  inFlight.clear();
  failures.clear();
  bump();
}

/**
 * The boards a page needs, kept fresh every `intervalMs` (default 30 s).
 *
 * @example
 * const feed = useFlightFeed([{ airport: 'kul', date: '2026-11-18', direction: 'd' }]);
 * const flight = feed.provider?.getFlightSync(id, 'kul') ?? null;
 */
export function useFlightFeed(
  requests: readonly FeedRequest[] | ((now: number) => readonly FeedRequest[]),
  options: { intervalMs?: number; paused?: boolean } = {},
): FlightFeedState {
  const lang = useLang();
  const tick = useNow(options.intervalMs ?? STEP_MS);
  const [frozenAt, setFrozenAt] = useState<number | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const held = useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );

  // Freeze the clock when pausing and thaw it when resuming (state adjusted during render).
  const wantPaused = options.paused === true && tick !== null;
  if (wantPaused && frozenAt === null) setFrozenAt(tick);
  if (!wantPaused && frozenAt !== null) setFrozenAt(null);
  const paused = wantPaused;
  const now = paused ? (frozenAt ?? tick) : tick;
  const bucket = now === null ? null : Math.floor(now / STEP_MS) * STEP_MS;
  const list = now === null ? [] : typeof requests === 'function' ? requests(now) : requests;
  const signature = [...new Set(list.map((request) => feedKey(request.airport, request.date, request.direction)))].join(',');

  useEffect(() => {
    if (bucket === null || paused || signature === '') return;
    let cancelled = false;
    const wanted = signature.split(',').map((key) => {
      const [airport, date, direction] = key.split('|');
      return { airport, date, direction: direction as FlightDirection };
    });
    const pending = wanted.filter((request) => {
      const key = feedKey(request.airport, request.date, request.direction);
      const current = memory.get(key);
      return !(current && current.at === bucket && !current.day.stale) && !inFlight.has(`${key}|${bucket}`);
    });
    if (pending.length === 0) return;
    let retried = false;
    for (const request of pending) {
      const flight = `${feedKey(request.airport, request.date, request.direction)}|${bucket}`;
      inFlight.add(flight);
      retried = failures.delete(flight) || retried;
    }
    // Asked again (Try again): every page that showed this failure shows "Loading" again.
    if (retried) bump();
    // Boards of the same date and direction go in one request when there are several (round 2).
    const groups = new Map<string, FeedRequest[]>();
    for (const request of pending) groups.set(`${request.date}|${request.direction}`, [...(groups.get(`${request.date}|${request.direction}`) ?? []), request]);
    const jobs = [...groups.values()].flatMap((list) =>
      list.length >= BATCH_FROM
        ? [{ list, run: () => fetchFeedDays(lang, list, bucket) }]
        : list.map((request) => ({ list: [request], run: () => fetchFeedDay(lang, request, bucket).then((day) => [day]) })),
    );
    Promise.allSettled(jobs.map((job) => job.run())).then((results) => {
      let failed: string | null = null;
      results.forEach((result, index) => {
        for (const request of jobs[index].list) {
          const key = feedKey(request.airport, request.date, request.direction);
          inFlight.delete(`${key}|${bucket}`);
          const day = result.status === 'fulfilled' ? result.value.find((item) => item.airport === request.airport) : undefined;
          if (day) {
            memory.set(key, { day, at: bucket });
            failures.delete(`${key}|${bucket}`);
          } else {
            const kind = result.status === 'rejected' && result.reason instanceof Error && result.reason.name === 'AbortError' ? 'timeout' : 'error';
            failures.set(`${key}|${bucket}`, kind);
            failed = kind;
          }
        }
      });
      // Only the current bucket's failures matter; older ones are dropped so the map stays small.
      for (const flight of failures.keys()) if (!flight.endsWith(`|${bucket}`)) failures.delete(flight);
      bump();
      if (!cancelled) setFailure(failed);
    });
    return () => {
      cancelled = true;
    };
  }, [bucket, paused, signature, lang, attempt]);

  const days = useMemo(() => {
    void held;
    return signature === ''
      ? []
      : signature
          .split(',')
          .map((key) => memory.get(key)?.day)
          .filter((day): day is FeedDay => Boolean(day));
  }, [signature, held]);

  // A failed request for one of these boards in this bucket, whichever component asked (above).
  const sharedFailure = useMemo(() => {
    void held;
    if (bucket === null || signature === '') return null;
    for (const key of signature.split(',')) {
      const found = failures.get(`${key}|${bucket}`);
      if (found) return found;
    }
    return null;
  }, [signature, bucket, held]);
  const failed = failure ?? sharedFailure;

  const provider = useMemo(() => (days.length > 0 && now !== null ? new SnapshotFlightProvider(days, now) : null), [days, now]);
  const oldest = days.reduce<string | null>(
    (found, day) => (found === null || Date.parse(day.meta.generatedAt) < Date.parse(found) ? day.meta.generatedAt : found),
    null,
  );
  const refreshSeconds = days[0]?.meta.refreshSeconds ?? 30;
  const ageSeconds = oldest && now !== null ? Math.max(0, Math.round((now - Date.parse(oldest)) / 1000)) : null;
  const missing = days.length < (signature === '' ? 0 : signature.split(',').length);
  const status: FeedStatus =
    days.length === 0
      ? failed
        ? 'error'
        : 'loading'
      : failed || days.some((day) => day.stale) || (!paused && ageSeconds !== null && ageSeconds > 2 * refreshSeconds) || (missing && failed)
        ? 'stale'
        : 'live';

  const retry = useCallback(() => {
    setFailure(null);
    setAttempt((value) => value + 1);
  }, []);

  const state = useMemo<FlightFeedState>(
    () => ({
      provider,
      status,
      updatedAt: oldest,
      ageSeconds,
      refreshSeconds,
      retry,
      paused,
      now,
    }),
    [provider, status, oldest, ageSeconds, refreshSeconds, retry, paused, now],
  );
  // Round 2 (TBT, E-01): the clock and the held boards are external stores, and React renders a
  // store change synchronously, in one task (the first tick right after hydration, then each new
  // board). Pages get the state as a deferred value: that render stays small, and the rows follow
  // in an interruptible background render.
  return useDeferredValue(state);
}
