/**
 * The cheap first answer for flight pages (ux-frequent-09, security-05), called from
 * `src/proxy.ts` before any page is rendered:
 *
 *  - a malformed id, an unknown airport or a flight number that is not on that airport's
 *    timetable: `404` with a small, self-contained page (no app shell, well under 30 KB) that
 *    still helps: it searches the board and links to it;
 *  - a codeshare number (`qr5700-20261118-d`): `308` to the operating flight's page that day;
 *  - a real flight: through to the page, marked cacheable for a short time.
 *
 * Identity only: the demo timetable says which flights exist on a date without reading the clock.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getAirport } from '@/content/airports';
import { decodeFlightId } from '@/lib/flights/id';
import { demoFlightExists, demoFlightIdForCodeshare } from './demo-flights';
import { hasDemoRoutes } from './demo-routes';

/** Flight page paths: `/en/kul/flights/mh2610-20261117-d`. */
const FLIGHT_PATH = /^\/(en|ms)\/([^/]+)\/flights\/([^/]+)\/?$/;
/** Static siblings of `[flightId]` that are not flight ids. */
const NOT_IDS = new Set(['feed']);
const MAX_ID_LENGTH = 40;

export type FlightRouteDecision =
  | { kind: 'page' }
  | { kind: 'redirect'; location: string }
  | { kind: 'not-found'; lang: 'en' | 'ms'; airport?: string };

/** What to do with a path, or `null` when it is not a flight page. Pure. */
export function decideFlightRoute(pathname: string): FlightRouteDecision | null {
  const match = FLIGHT_PATH.exec(pathname);
  if (!match) return null;
  const [, lang, slug, rawId] = match as unknown as [string, 'en' | 'ms', string, string];
  if (NOT_IDS.has(rawId)) return null;
  let id: string;
  try {
    id = decodeURIComponent(rawId).trim().toLowerCase();
  } catch {
    return { kind: 'not-found', lang };
  }
  const airport = getAirport(slug);
  if (!airport || airport.slug !== slug) return { kind: 'not-found', lang };
  // Airports without flights: the page answers with its own section-missing state.
  if (!hasDemoRoutes(airport.slug)) return { kind: 'page' };
  const parts = id.length <= MAX_ID_LENGTH ? decodeFlightId(id) : null;
  if (!parts) return { kind: 'not-found', lang, airport: airport.slug };
  if (demoFlightExists(airport.slug, parts.date, parts.direction, id)) return { kind: 'page' };
  const operating = demoFlightIdForCodeshare(airport.slug, parts.date, parts.direction, `${parts.airlineCode} ${parts.number}`);
  if (operating) return { kind: 'redirect', location: `/${lang}/${airport.slug}/flights/${operating}` };
  return { kind: 'not-found', lang, airport: airport.slug };
}

const COPY = {
  en: {
    title: 'We could not find this flight',
    body: 'This flight is not on the board. Check the flight number and date on your booking, or search the board.',
    search: 'Search the board',
    label: 'Flight, airline or city',
    board: 'See all flights',
    home: 'Malaysia Airports (concept prototype)',
    demo: 'Flight information on this site is demonstration data.',
  },
  ms: {
    title: 'Kami tidak menemui penerbangan ini',
    body: 'Penerbangan ini tiada pada papan. Semak nombor dan tarikh penerbangan pada tempahan anda, atau cari di papan.',
    search: 'Cari di papan',
    label: 'Penerbangan, syarikat penerbangan atau bandar',
    board: 'Lihat semua penerbangan',
    home: 'Malaysia Airports (prototaip konsep)',
    demo: 'Maklumat penerbangan di laman ini ialah data demonstrasi.',
  },
} as const;

/** The small 404 page: plain HTML with system colours (light and dark), no scripts. */
export function flightNotFoundHtml(lang: 'en' | 'ms', airport?: string): string {
  const copy = COPY[lang];
  const board = airport ? `/${lang}/${airport}/flights` : `/${lang}`;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${copy.title}</title><style>:root{color-scheme:light dark;font-family:system-ui,sans-serif;line-height:1.5}body{margin:0 auto;max-width:40rem;padding:2rem 1rem;background:Canvas;color:CanvasText}h1{font-size:1.75rem;line-height:1.2}form{display:flex;flex-wrap:wrap;gap:.5rem;margin:1.5rem 0}label{flex-basis:100%;font-weight:600}input{flex:1 1 14rem;min-height:2.75rem;font:inherit;padding:0 .75rem}button{min-height:2.75rem;font:inherit;padding:0 1rem}a{color:LinkText}:focus-visible{outline:3px solid Highlight;outline-offset:2px}p.note{font-size:.875rem}</style></head><body><p><a href="/${lang}">${copy.home}</a></p><main><h1>${copy.title}</h1><p>${copy.body}</p>${airport ? `<form action="${board}" method="get" role="search"><label for="q">${copy.search}</label><input id="q" name="q" type="search" autocomplete="off" placeholder="${copy.label}"><button type="submit">${copy.search}</button></form>` : ''}<p><a href="${board}">${copy.board}</a></p><p class="note">${copy.demo}</p></main></body></html>`;
}

/** The proxy's answer for a flight page, or `null` to carry on as usual. */
export function flightRouteResponse(request: NextRequest): NextResponse | null {
  const decision = decideFlightRoute(request.nextUrl.pathname);
  if (!decision) return null;
  if (decision.kind === 'redirect') {
    const url = request.nextUrl.clone();
    url.pathname = decision.location;
    return NextResponse.redirect(url, 308);
  }
  if (decision.kind === 'not-found') {
    return new NextResponse(flightNotFoundHtml(decision.lang, decision.airport), {
      status: 404,
      // Round 2 (E-22): the same short shared cache as every other 404 (s-maxage=60), not five
      // minutes in browsers: a flight that appears later is not hidden by a cached 404.
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=60', 'X-Robots-Tag': 'noindex' },
    });
  }
  const response = NextResponse.next();
  // A real flight's page is the same for everyone for a short while (status is fetched on the client).
  response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=60');
  return response;
}
