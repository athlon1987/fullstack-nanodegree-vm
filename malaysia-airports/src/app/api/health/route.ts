/**
 * GET /api/health
 *
 * Reports the mode of each data provider (all `demo` in this prototype) and build information.
 *
 * Next.js 16 with Cache Components: a GET handler that touches no request data would be
 * prerendered at build time and its timestamp frozen. Reading the request first keeps this
 * handler per-request; no route segment config is exported.
 */
import type { NextRequest } from 'next/server';
import { buildHealth } from '@/lib/providers/api';

export async function GET(request: NextRequest): Promise<Response> {
  // Reading the request makes the handler dynamic before the clock is read.
  const pretty = request.nextUrl.searchParams.has('pretty');
  const body = buildHealth(new Date(), {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
    GIT_COMMIT: process.env.GIT_COMMIT,
  });
  return new Response(JSON.stringify(body, null, pretty ? 2 : undefined), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Data-Mode': 'demo' },
  });
}
