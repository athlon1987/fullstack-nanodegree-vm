/**
 * GET /[lang]/[airport]/flights/feed?date=2026-11-18&dir=d&at=<epoch ms>
 *
 * The flight feed the board, flight pages and My journey read (BR-05, exec-commerce-03): one
 * airport's board for one local date and direction, served from the server through the provider
 * interface with a cache, a timeout and a last-known fallback (`ResilientFlightFeed`). The demo
 * generator therefore stays on the server.
 *
 * `at` (demo provider only): the instant the simulated board describes, rounded to 30 seconds, so
 * that the board agrees with the visitor's clock (and with a fixed test clock). A live provider
 * would ignore it. Unknown airports, bad dates and out-of-range instants get a small 400/404.
 *
 * No route segment config is exported (Cache Components): the handler reads the request first.
 */
import type { NextRequest } from 'next/server';
import { getAirport } from '@/content/airports';
import { isDateKey } from '@/lib/time';
import { serveFlightFeed } from '@/lib/providers/feed-server';

export async function GET(request: NextRequest, context: { params: Promise<{ lang: string; airport: string }> }): Promise<Response> {
  const { airport: slug } = await context.params;
  const search = request.nextUrl.searchParams;
  const airport = getAirport(slug);
  const date = search.get('date') ?? '';
  const dir = search.get('dir');
  const headers = { 'X-Data-Mode': 'demo', 'Cache-Control': 'no-store' };
  if (!airport || airport.slug !== slug) return Response.json({ error: 'unknown-airport' }, { status: 404, headers });
  if (!isDateKey(date) || (dir !== 'd' && dir !== 'a')) return Response.json({ error: 'bad-request' }, { status: 400, headers });
  const result = await serveFlightFeed({ airport: airport.slug, date, direction: dir }, search.get('at'), new Date());
  return Response.json(result.body, {
    status: result.status,
    headers: { ...headers, 'Cache-Control': result.status === 200 ? 'public, max-age=0, s-maxage=30, stale-while-revalidate=30' : 'no-store' },
  });
}
