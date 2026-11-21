import { NextResponse, type NextRequest } from 'next/server';
import { isLang } from '@/content/values';
import { clientKey, createRouteLimiter, policyFor, tooManyRequests } from '@/lib/concierge/rate-limit';
import { negotiateLang } from '@/lib/locale';
// Package B (fix round, B-14): flight pages get a cheap 404 or a codeshare 308 before rendering.
import { flightRouteResponse } from '@/lib/providers/flight-route';

/**
 * Every page lives under `/en` or `/ms`. This proxy sends any path WITHOUT a locale to the
 * visitor's language: the `lang` cookie (set by the language switch), then `Accept-Language`,
 * then English. `/` becomes `/en`; `/kul/parking` becomes `/ms/kul/parking`.
 *
 * It also gives unknown locales a proper answer: `/fr/kul` is not a locale path, so it becomes
 * `/en/fr/kul`, which no route matches and the localised not-found page answers with a 404.
 *
 * It also applies the per-route request limits (security-06) to the API routes and to the pages
 * rendered per request (flight pages, the board feed, journey content): see `ROUTE_POLICIES` in
 * `src/lib/concierge/rate-limit.ts`. The concierge applies its own, stricter limit in its route,
 * so the proxy never buffers its body. The buckets live in this process's memory; with several
 * instances, `createRouteLimiter` takes a shared store, and the edge rules in
 * docs/engineering/edge/ apply the same limits before requests reach the app.
 *
 * It never runs for static localised pages, Next.js assets or files.
 */
const limiter = createRouteLimiter();

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const policy = policyFor(pathname);
  if (policy) {
    const result = await limiter.take(policy, clientKey(request.headers), Date.now());
    if (!result.allowed) return tooManyRequests(result);
  }
  if (pathname === '/api' || pathname.startsWith('/api/')) return NextResponse.next();
  const flight = flightRouteResponse(request);
  if (flight) return flight;
  if (isLang(pathname.split('/')[1])) return NextResponse.next();

  const cookie = request.cookies.get('lang')?.value;
  const lang = isLang(cookie) ? cookie : negotiateLang(request.headers.get('accept-language'));
  const url = request.nextUrl.clone();
  url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`;
  url.search = search;

  const response = NextResponse.redirect(url, 307);
  // The answer depends on the visitor, so it must not be cached for someone else.
  response.headers.set('Vary', 'Accept-Language, Cookie');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  // Everything except: localised pages, API routes, Next.js internals, and files with an extension.
  // Plus flight pages (B-14), which the proxy answers cheaply when the id is unknown or a codeshare,
  // the journey content handler, and every API route except the concierge (rate limits).
  matcher: [
    '/((?!en(?:/|$)|ms(?:/|$)|api(?:/|$)|_next/|.*\\.[^/]+$).*)',
    '/(en|ms)/:airport/flights/:id',
    '/(en|ms)/journey/content/:airport',
    '/api',
    '/api/((?!concierge(?:/|$)).*)',
  ],
};
