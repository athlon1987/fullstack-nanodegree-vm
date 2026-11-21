/**
 * GET /[lang]/flights/feed?date=2026-11-18&dir=d&at=<epoch ms>&airports=kul,pen,…
 *
 * Several airports' boards for one local date and direction in one answer (round 2, the B-09
 * hand-off): the home flight search looks across every airport with a demonstration board, and
 * one request per airport (21) used up a visitor's request allowance in one query. Each board is
 * served exactly as `/[lang]/[airport]/flights/feed` serves it (`serveFlightFeed`: cache,
 * timeout, last-known fallback). Answers `{ days }` with the boards that could be served; a board
 * that failed is left out, and the client treats it as failed. Rate limited in `src/proxy.ts` as
 * one request.
 *
 * No route segment config is exported (Cache Components): the handler reads the request first.
 */
import type { NextRequest } from 'next/server';
import { isDateKey } from '@/lib/time';
import { serveFlightFeed } from '@/lib/providers/feed-server';
import { hasDemoRoutes } from '@/lib/providers/demo-routes';
import type { FeedDay } from '@/lib/providers/resilient';

/** At most this many airports per request (the demo network has 21). */
const MAX_AIRPORTS = 25;

export async function GET(request: NextRequest): Promise<Response> {
  const search = request.nextUrl.searchParams;
  const date = search.get('date') ?? '';
  const dir = search.get('dir');
  const airports = [...new Set((search.get('airports') ?? '').split(',').map((slug) => slug.trim().toLowerCase()).filter(Boolean))];
  const headers = { 'X-Data-Mode': 'demo', 'Cache-Control': 'no-store' };
  if (!isDateKey(date) || (dir !== 'd' && dir !== 'a') || airports.length === 0 || airports.length > MAX_AIRPORTS || !airports.every((slug) => /^[a-z]{3}$/.test(slug) && hasDemoRoutes(slug))) {
    return Response.json({ error: 'bad-request' }, { status: 400, headers });
  }
  const now = new Date();
  const results = await Promise.all(airports.map((airport) => serveFlightFeed({ airport, date, direction: dir }, search.get('at'), now)));
  if (results.some((result) => result.status === 400)) return Response.json({ error: 'bad-instant' }, { status: 400, headers });
  const days = results.flatMap((result) => (result.status === 200 ? [result.body as FeedDay] : []));
  if (days.length === 0) return Response.json({ error: 'unavailable' }, { status: 503, headers });
  return Response.json({ days }, { status: 200, headers: { ...headers, 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=30' } });
}
