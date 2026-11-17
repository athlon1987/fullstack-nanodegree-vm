/**
 * GET /api/flights?airport=kul&direction=d&q=&terminal=&limit=&date=
 *
 * Integration-layer demo: returns `{ meta, query, count, flights }` from the demo flight
 * provider. Every flight has `isDemo: true` and the response says so in `X-Data-Mode: demo`.
 *
 * Next.js 16 with Cache Components: no route segment config is exported (`dynamic`, `runtime`
 * and `revalidate` are build errors). The handler is per-request because it reads the request
 * (`request.nextUrl.searchParams`) before it reads the clock.
 */
import type { NextRequest } from 'next/server';
import { handleFlightsQuery } from '@/lib/providers/api';

const HEADERS = { 'Cache-Control': 'no-store', 'X-Data-Mode': 'demo' } as const;

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const result = handleFlightsQuery(searchParams, new Date());
  return Response.json(result.body, { status: result.status, headers: HEADERS });
}
