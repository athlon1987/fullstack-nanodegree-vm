/**
 * Server half of the flight feed: the process-wide `ResilientFlightFeed` around the configured
 * flight provider, and the pure request handling the feed route calls. Import only from route
 * handlers and server code.
 */
import type { FlightDirection } from '@/lib/flights/types';
import { DemoFlightProvider } from './demo-flights';
import { FeedUnavailableError, ResilientFlightFeed, type FeedDay } from './resilient';

/** Feed instants are rounded to this step, so answers can be shared and cached. */
export const FEED_STEP_MS = 30_000;
/** The demo can describe any instant in this range; a live provider ignores `at` altogether. */
const EARLIEST = Date.UTC(2024, 0, 1);
const LATEST = Date.UTC(2035, 0, 1);

let shared: ResilientFlightFeed | null = null;

/** The process-wide feed. Demo today; the official provider plugs in here (OOS-01). */
export function serverFlightFeed(): ResilientFlightFeed {
  shared ??= new ResilientFlightFeed((now) => new DemoFlightProvider(now));
  return shared;
}

export type FeedResponse = FeedDay | { error: 'unavailable' | 'bad-instant'; reason?: string };

/**
 * Answer one feed request. `at` is the demo instant asked for (epoch ms as text) or `null` for
 * the server clock `now`.
 */
export async function serveFlightFeed(
  query: { airport: string; date: string; direction: FlightDirection },
  at: string | null,
  now: Date,
  feed: ResilientFlightFeed = serverFlightFeed(),
): Promise<{ status: number; body: FeedResponse }> {
  let instant = now.getTime();
  if (at !== null) {
    const asked = Number(at);
    if (!Number.isFinite(asked) || asked < EARLIEST || asked > LATEST) return { status: 400, body: { error: 'bad-instant' } };
    instant = asked;
  }
  const bucket = Math.floor(instant / FEED_STEP_MS) * FEED_STEP_MS;
  try {
    const day = await feed.day(query, bucket, String(bucket));
    return { status: 200, body: day };
  } catch (error) {
    return { status: 503, body: { error: 'unavailable', reason: error instanceof FeedUnavailableError ? error.reason : 'error' } };
  }
}
