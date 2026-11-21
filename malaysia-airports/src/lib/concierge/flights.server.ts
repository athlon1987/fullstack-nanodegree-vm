import 'server-only';
import { hasDemoRoutes } from '@/lib/providers/demo-routes';
import { serveFlightFeed } from '@/lib/providers/feed-server';
import type { FeedDay } from '@/lib/providers/resilient';
import { flightBoardsFor, flightSourceFromDays, unavailableFlightSource } from './flights';
import type { ConciergeContext, ConciergeFlightSource, ConciergeKnowledge } from './types';

/**
 * The flights for one question on the server (`/api/concierge`, round 5, B-09): the boards it can
 * need, served exactly as the feed route serves them (`serveFlightFeed`: the process-wide feed, its
 * cache, timeout and last-known fallback), so the concierge, the departures board, flight pages
 * and My journey answer from one source. `null` when the question needs no flight.
 */
export async function serverFlightSource(question: string, knowledge: ConciergeKnowledge, context: ConciergeContext, now: number): Promise<ConciergeFlightSource | null> {
  const boards = flightBoardsFor(question, knowledge, context, now, hasDemoRoutes);
  if (boards.length === 0) return null;
  const at = new Date(now);
  const results = await Promise.all(boards.map((board) => serveFlightFeed(board, null, at)));
  const days = results.flatMap((result) => (result.status === 200 ? [result.body as FeedDay] : []));
  return days.length > 0 ? flightSourceFromDays(days, now) : unavailableFlightSource();
}
