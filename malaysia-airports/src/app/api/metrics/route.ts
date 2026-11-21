/**
 * POST /api/metrics: one aggregate measurement from this site's pages (exec-commerce-12;
 * contract in `src/components/platform/metrics.ts`). Counted per day, event, name, state or host,
 * and site section; nothing about the visitor is read or kept (no address, cookie or user agent).
 * Same-origin only, JSON only, 2 KB at most, rate limited in `src/proxy.ts`. Always 204 when
 * accepted. The counts reach authenticated monitoring through `/api/health`.
 */
import { isSameOriginRequest, readBodyWithLimit, siteOrigins } from '@/lib/concierge/request';
import { parseMetric } from '@/components/platform/metrics';
import { sharedMetrics } from '@/lib/seo/metrics-store';

const empty = (status: number) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request): Promise<Response> {
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json' && type !== 'text/plain') return empty(415);
  if (!isSameOriginRequest(request.headers, siteOrigins(request.url, request.headers))) return empty(403);
  const body = await readBodyWithLimit(request, 2048);
  if (!body.ok) return empty(413);
  let metric;
  try {
    metric = parseMetric(JSON.parse(body.text));
  } catch {
    return empty(400);
  }
  if (!metric) return empty(400);
  // The day is the only time kept: read the clock only after the request was read.
  sharedMetrics().add(metric, new Date().toISOString().slice(0, 10));
  return empty(204);
}
