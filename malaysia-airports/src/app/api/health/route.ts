/**
 * GET /api/health (and HEAD)
 *
 * Public answer: `{ status, build }` and nothing about the runtime (security-11). Monitoring that
 * sends `Authorization: Bearer <HEALTH_TOKEN>` (a secret of at least 16 characters set on the
 * server) also gets the provider modes, the runtime, the concierge's model-budget counters and the
 * aggregated report-only CSP violations.
 *
 * Next.js 16 with Cache Components: a GET handler that touches no request data would be
 * prerendered at build time. Reading the request first keeps this handler per-request; no route
 * segment config is exported. Rate limited in `src/proxy.ts`.
 */
import type { NextRequest } from 'next/server';
import { sharedModelBudget } from '@/lib/concierge/rate-limit';
import { buildHealth, isMonitoringRequest, publicHealth } from '@/lib/providers/api';
import { sharedCspReports } from '@/lib/seo/csp-reports';
import { sharedMetrics } from '@/lib/seo/metrics-store';

const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } as const;

function respond(request: NextRequest, withBody: boolean): Response {
  // Reading the request makes the handler dynamic before the clock is read.
  const detailed = isMonitoringRequest(request.headers.get('authorization'), process.env.HEALTH_TOKEN);
  const pretty = request.nextUrl.searchParams.has('pretty');
  const body = detailed
    ? {
        ...buildHealth(new Date(), {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
          GIT_COMMIT: process.env.GIT_COMMIT,
        }),
        counters: { conciergeModel: sharedModelBudget().counters(), cspReportOnly: sharedCspReports().summary(), measurement: sharedMetrics().summary() },
      }
    : publicHealth(process.env.NEXT_PUBLIC_APP_VERSION);
  const headers = detailed ? { ...HEADERS, 'X-Data-Mode': 'demo', Vary: 'Authorization' } : { ...HEADERS, Vary: 'Authorization' };
  return new Response(withBody ? JSON.stringify(body, null, pretty ? 2 : undefined) : null, { status: 200, headers });
}

export async function GET(request: NextRequest): Promise<Response> {
  return respond(request, true);
}

export async function HEAD(request: NextRequest): Promise<Response> {
  return respond(request, false);
}
