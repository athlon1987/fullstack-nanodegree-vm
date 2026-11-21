/**
 * GET /api/flights?airport=kul&direction=d&q=&terminal=&limit=&date= (and HEAD)
 *
 * Integration-layer demo: returns `{ meta, query, count, flights }` from the demo flight
 * provider. Every flight has `isDemo: true` and the response says so in `X-Data-Mode: demo`.
 * `date` is limited to yesterday through the day after tomorrow and repeated parameters are
 * refused (security-15). HEAD answers with the same status and headers and no body. Rate limited
 * in `src/proxy.ts`.
 *
 * Next.js 16 with Cache Components: no route segment config is exported (`dynamic`, `runtime`
 * and `revalidate` are build errors). The handler is per-request because it reads the request
 * (`request.nextUrl.searchParams`) before it reads the clock.
 */
import type { NextRequest } from 'next/server';
import { handleFlightsQuery } from '@/lib/providers/api';

const HEADERS = { 'Cache-Control': 'no-store', 'X-Data-Mode': 'demo' } as const;

export async function GET(request: NextRequest): Promise<Response> {
  const result = handleFlightsQuery(request.nextUrl.searchParams, new Date());
  return Response.json(result.body, { status: result.status, headers: HEADERS });
}

export async function HEAD(request: NextRequest): Promise<Response> {
  const result = handleFlightsQuery(request.nextUrl.searchParams, new Date());
  return new Response(null, { status: result.status, headers: { ...HEADERS, 'Content-Type': 'application/json' } });
}
