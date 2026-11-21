/**
 * POST /api/csp-report: receives Content Security Policy violation reports from browsers (the
 * report-only policy in `src/lib/seo/security-headers.ts`), in either format
 * (`application/csp-report` from `report-uri`, `application/reports+json` from `report-to`).
 * Only aggregate counts are kept (`src/lib/seo/csp-reports.ts`); nothing is logged. Bodies over
 * 16 KB are refused unread; the route is rate limited in `src/proxy.ts`. Always answers 204 for
 * an accepted report so browsers do not retry.
 */
import { isSameOriginRequest, readBodyWithLimit, siteOrigins } from '@/lib/concierge/request';
import { parseCspReports, sharedCspReports } from '@/lib/seo/csp-reports';

const MEDIA_TYPES = ['application/csp-report', 'application/reports+json', 'application/json'];

export async function POST(request: Request): Promise<Response> {
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!MEDIA_TYPES.includes(type)) return new Response(null, { status: 415, headers: { 'Cache-Control': 'no-store' } });
  // Reports come from our own pages; browsers send them without credentials and may omit Origin.
  if (!isSameOriginRequest(request.headers, siteOrigins(request.url, request.headers)) && request.headers.get('sec-fetch-site') !== 'same-site') {
    return new Response(null, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }
  const body = await readBodyWithLimit(request, 16 * 1024);
  if (!body.ok) return new Response(null, { status: 413, headers: { 'Cache-Control': 'no-store' } });
  try {
    sharedCspReports().add(parseCspReports(JSON.parse(body.text)));
  } catch {
    return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
