/**
 * Every `/api/*` path that no other route answers (security-15): a small JSON 404, never the
 * 25 KB HTML not-found page, for every method. Static segments (`/api/flights`, `/api/health`,
 * `/api/concierge`, `/api/csp-report`) take precedence over this catch-all. `next.config.ts`
 * keeps `/api` out of its rewrite to the HTML not-found page so that requests reach this handler.
 */
const notFound = (withBody: boolean) =>
  new Response(withBody ? JSON.stringify({ error: { code: 'not_found', message: 'No such API endpoint.' } }) : null, {
    status: 404,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });

export async function GET(): Promise<Response> {
  return notFound(true);
}
export async function HEAD(): Promise<Response> {
  return notFound(false);
}
export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
