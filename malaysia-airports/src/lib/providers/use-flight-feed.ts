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
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
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
    const response = await fetcher(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`feed ${response.status}`);
    const body = (await response.json()) as FeedDay;
    if (!body || !Array.isArray(body.flights) || !body.meta) throw new Error('feed: malformed answer');
    return body;
  } finally {
    clearTimeout(timer);
  }
}

/** Forget every held board (tests). */
export function clearFeedMemory(): void {
  memory.clear();
  inFlight.clear();
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
    for (const request of pending) inFlight.add(`${feedKey(request.airport, request.date, request.direction)}|${bucket}`);
    Promise.allSettled(pending.map((request) => fetchFeedDay(lang, request, bucket))).then((results) => {
      let failed: string | null = null;
      results.forEach((result, index) => {
        const request = pending[index];
        const key = feedKey(request.airport, request.date, request.direction);
        inFlight.delete(`${key}|${bucket}`);
        if (result.status === 'fulfilled') memory.set(key, { day: result.value, at: bucket });
        else failed = result.reason instanceof Error && result.reason.name === 'AbortError' ? 'timeout' : 'error';
      });
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

  const provider = useMemo(() => (days.length > 0 && now !== null ? new SnapshotFlightProvider(days, now) : null), [days, now]);
  const oldest = days.reduce<string | null>((found, day) => (found === null || Date.parse(day.meta.generatedAt) < Date.parse(found) ? day.meta.generatedAt : found), null);
  const refreshSeconds = days[0]?.meta.refreshSeconds ?? 30;
  const ageSeconds = oldest && now !== null ? Math.max(0, Math.round((now - Date.parse(oldest)) / 1000)) : null;
  const missing = days.length < (signature === '' ? 0 : signature.split(',').length);
  const status: FeedStatus =
    days.length === 0
      ? failure
        ? 'error'
        : 'loading'
      : failure || days.some((day) => day.stale) || (!paused && ageSeconds !== null && ageSeconds > 2 * refreshSeconds) || (missing && failure)
        ? 'stale'
        : 'live';

  const retry = useCallback(() => {
    setFailure(null);
    setAttempt((value) => value + 1);
  }, []);

  return { provider, status, updatedAt: oldest, ageSeconds, refreshSeconds, retry, paused, now };
}
