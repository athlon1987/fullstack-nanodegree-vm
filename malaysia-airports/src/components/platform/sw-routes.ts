/**
 * What the service worker does with each request. Pure functions, shared by the worker
 * (`service-worker.ts`) and its unit tests; no browser globals.
 *
 *   static    cache first: content-hashed bundles, fonts, icons
 *   data      stale-while-revalidate: the manifest, the static search index and concierge knowledge
 *   guidance  stale-while-revalidate: prerendered guidance (airport pages, getting there,
 *             parking, facilities, guides, help, accessibility, the airport directory)
 *   page      network first with a short timeout, then the saved copy: home, notices, flights,
 *             journey and everything else under a locale
 *   root      a page without a locale (`/`, `/journey`): the network decides the language; when
 *             offline, the saved copy in the visitor's last language
 *   bypass    never touched, never stored: `/api/*`, React Server Component requests, search
 *             results, other origins, non-GET requests and framework internals
 *
 * Pages are stored by path only (no query, no hash): `?t=T1` filters render on the client, and
 * search terms or other query values are never written to the device.
 */

export type RequestKind = 'static' | 'data' | 'guidance' | 'page' | 'root' | 'bypass';

export interface RequestInfo {
  method: string;
  /** `Request.mode`: `navigate` for page loads. */
  mode: string;
  /** `Request.destination`: `document` for page loads. */
  destination: string;
  /** React Server Component fetch (header `RSC: 1` or a `_rsc` parameter): must reach the network. */
  rsc: boolean;
  /** Request origin equals the worker's origin. */
  sameOrigin: boolean;
}

export const LOCALES = ['en', 'ms'] as const;
export type SwLang = (typeof LOCALES)[number];

/** Cache names; bump `CACHE_SCHEMA` only when the stored format changes. */
export const CACHE_SCHEMA = 'v1';
export const CACHE_PREFIX = 'ma-';
export const CACHE_NAMES = {
  static: `${CACHE_PREFIX}${CACHE_SCHEMA}-static`,
  pages: `${CACHE_PREFIX}${CACHE_SCHEMA}-pages`,
  data: `${CACHE_PREFIX}${CACHE_SCHEMA}-data`,
} as const;

/** Entries kept per cache (oldest dropped first). Pages stay small: about 60 KB to 200 KB each. */
export const CACHE_LIMITS = { static: 400, pages: 60, data: 8 } as const;

/** The app shell: precached on install, so the start page and the offline page always open. */
export const PRECACHE_PATHS = ['/en', '/ms', '/en/offline', '/ms/offline'] as const;

/** Response headers the worker adds to stored pages (read by the offline page). */
export const SAVED_AT_HEADER = 'x-ma-saved-at';
export const TITLE_HEADER = 'x-ma-title';

/** Network-first pages fall back to the saved copy after this long on a slow connection. */
export const NETWORK_TIMEOUT_MS = 3500;

const STATIC_FILES = /^\/(?:icon\.svg|icon\d*\.png|apple-icon\d*\.png|favicon\.ico|(?:en|ms)\/opengraph-image\.png)$/;
/** Unhashed JSON (the manifest has no content hash in its URL, so it is revalidated too). */
const DATA_FILES = /^\/(?:manifest\.webmanifest|(?:en|ms)\/(?:search\/index|concierge\/knowledge)\.json)$/;
const LOCALE_PATH = /^\/(en|ms)(\/.*)?$/;
const NEVER_STORED = /^\/search(?:\/|$)/;
const AIRPORT_SECTIONS = 'transport|parking|transit|facilities|map|lounges|shop-dine';
const GUIDANCE = new RegExp(`^/(?:(?:guides|help)(?:/[^/]+)?|accessibility|airports|[a-z]{3}(?:/(?:${AIRPORT_SECTIONS})(?:/[^/]+)?)?)$`);

/** Decide the strategy for one request. */
export function classifyRequest(url: URL, info: RequestInfo): RequestKind {
  if (info.method !== 'GET' || !info.sameOrigin) return 'bypass';
  const path = url.pathname;
  if (path === '/api' || path.startsWith('/api/')) return 'bypass';
  if (path.startsWith('/_next/static/service-worker/')) return 'bypass';
  if (path.startsWith('/_next/static/') || path.startsWith('/_next/image')) return 'static';
  if (path.startsWith('/_next/') || path.startsWith('/__nextjs')) return 'bypass';
  if (STATIC_FILES.test(path)) return 'static';
  if (DATA_FILES.test(path)) return 'data';
  if (info.rsc || url.searchParams.has('_rsc')) return 'bypass';
  if (info.mode !== 'navigate' && info.destination !== 'document') return 'bypass';

  const match = LOCALE_PATH.exec(path);
  if (!match) return /\.[a-z0-9]+$/i.test(path) ? 'bypass' : 'root';
  const rest = normalisePath(match[2] ?? '/');
  if (NEVER_STORED.test(rest)) return 'bypass';
  if (GUIDANCE.test(rest)) return 'guidance';
  return 'page';
}

/** Strip a trailing slash (except for `/`). */
export function normalisePath(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/** Cache key of a page: origin plus path, without query or hash. */
export function pageKey(url: URL): string {
  return `${url.origin}${normalisePath(url.pathname)}`;
}

/** The locale of a path, if it has one. */
export function langOfPath(path: string): SwLang | undefined {
  const match = LOCALE_PATH.exec(path);
  return match ? (match[1] as SwLang) : undefined;
}

/** Where to send a navigation that is neither online nor saved. */
export function offlinePagePath(lang: SwLang, from?: string): string {
  return `/${lang}/offline${from ? `?from=${encodeURIComponent(from)}` : ''}`;
}

/**
 * Same-origin asset URLs referenced by a page or stylesheet: script and style bundles, fonts and
 * images under `/_next/static/`, including chunks named only in the inline flight data.
 */
export function extractAssetUrls(text: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const found = new Set<string>();
  for (const match of text.matchAll(/\/_next\/static\/[^"'\\\s)<>]+/g)) found.add(match[0]);
  // Stylesheets refer to fonts relatively: url(../media/x.woff2).
  for (const match of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    const ref = match[1];
    if (ref.startsWith('data:')) continue;
    const resolved = new URL(ref, base);
    if (resolved.origin === base.origin && resolved.pathname.startsWith('/_next/static/')) found.add(resolved.pathname);
  }
  return [...found].filter((path) => !path.startsWith('/_next/static/service-worker/')).map((path) => new URL(path, base).toString());
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", '#x27': "'", nbsp: ' ' };

/** The document title of a page, decoded; empty when there is none. */
export function extractTitle(html: string): string {
  const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  if (!match) return '';
  return match[1].replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, name: string) => {
    const key = name.toLowerCase();
    if (key in ENTITIES) return ENTITIES[key];
    if (key.startsWith('#x')) return String.fromCodePoint(Number.parseInt(key.slice(2), 16));
    if (key.startsWith('#')) return String.fromCodePoint(Number.parseInt(key.slice(1), 10));
    return entity;
  }).trim();
}

/**
 * May this response be stored? Only complete, same-origin HTML (or JSON for data) that the
 * server did not mark as private or uncacheable: redirects, errors and personal responses never are.
 */
export function isStorable(response: { ok: boolean; status: number; type: string; redirected: boolean; headers: { get(name: string): string | null } }, expect: 'html' | 'json' | 'any'): boolean {
  if (!response.ok || response.status !== 200 || response.type !== 'basic' || response.redirected) return false;
  const cacheControl = response.headers.get('cache-control') ?? '';
  if (/\b(?:no-store|private)\b/i.test(cacheControl)) return false;
  const type = response.headers.get('content-type') ?? '';
  if (expect === 'html') return type.includes('text/html');
  if (expect === 'json') return type.includes('json');
  return true;
}
