/**
 * The service worker. Next.js compiles it from `navigator.serviceWorker.register(new URL(…))` in
 * `sw-client.ts` and serves it from `/_next/static/service-worker/` with `Service-Worker-Allowed: /`
 * (Next.js notes, section 13). Registered in production builds only.
 *
 * Strategies per request: `sw-routes.ts`. In short: bundles cache first; guidance pages
 * stale-while-revalidate; other pages network first with a timeout; `/api/*`, search results and
 * React Server Component requests are never stored. Pages are saved with their title and time so
 * the offline page can list them. A new version waits until the visitor accepts the update prompt.
 */
import {
  CACHE_LIMITS,
  CACHE_NAMES,
  CACHE_PREFIX,
  NETWORK_TIMEOUT_MS,
  PRECACHE_PATHS,
  SAVED_AT_HEADER,
  TITLE_HEADER,
  classifyRequest,
  extractAssetUrls,
  extractTitle,
  isStorable,
  langOfPath,
  normalisePath,
  offlinePagePath,
  pageKey,
  type SwLang,
} from './sw-routes';

/* Minimal service-worker types: the project compiles against the DOM library only. */
interface WorkerEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}
interface WorkerFetchEvent extends WorkerEvent {
  request: Request;
  preloadResponse?: Promise<Response | undefined>;
  respondWith(response: Response | Promise<Response>): void;
}
interface WorkerMessageEvent extends WorkerEvent {
  data: unknown;
  ports: readonly MessagePort[];
}
interface WorkerNotificationEvent extends WorkerEvent {
  notification: { close(): void };
}
interface WorkerClient {
  url: string;
  focus?: () => Promise<unknown>;
}
interface WorkerGlobal {
  location: Location;
  navigator: Navigator;
  registration: ServiceWorkerRegistration & { navigationPreload?: { enable(): Promise<void> } };
  clients: {
    claim(): Promise<void>;
    matchAll(options: { type: 'window'; includeUncontrolled?: boolean }): Promise<WorkerClient[]>;
    openWindow(url: string): Promise<unknown>;
  };
  skipWaiting(): Promise<void>;
  addEventListener(type: string, listener: (event: Event) => void): void;
}

declare const __MA_BUILD__: string | undefined;

const sw = self as unknown as WorkerGlobal;
const ORIGIN = sw.location.origin;
/**
 * The build this worker belongs to (set in next.config.ts). Because it changes with every build,
 * every deployment ships a byte-different worker, which is what makes browsers install it and the
 * site show "A new version is ready". `__MA_BUILD__` is a compile-time constant from
 * `compiler.define` in next.config.ts: a reference to `process` here fails the Turbopack build
 * (the worker's chunking context cannot polyfill `node:process`). Guarded in case it is not inlined.
 */
const BUILD: string = typeof __MA_BUILD__ === 'string' ? __MA_BUILD__ : 'unversioned';
/** Paths answered from the saved copy because the network failed, for the "offline" indicator. */
const fallbacks = new Map<string, number>();
/** The visitor's last language, for pages without a locale while offline. */
let lastLang: SwLang | undefined;

/* ----------------------------------------------------------------------------------------- */

sw.addEventListener('install', (event) => {
  (event as WorkerEvent).waitUntil(precache());
});

sw.addEventListener('activate', (event) => {
  (event as WorkerEvent).waitUntil(
    (async () => {
      const current = new Set<string>(Object.values(CACHE_NAMES));
      for (const name of await caches.keys()) if (name.startsWith(CACHE_PREFIX) && !current.has(name)) await caches.delete(name);
      await sw.registration.navigationPreload?.enable().catch(() => undefined);
      await sw.clients.claim();
      // Keep the page the visitor is on: it loaded before this worker was in control.
      const windows = await sw.clients.matchAll({ type: 'window' });
      await Promise.allSettled(windows.map((client) => savePage(new URL(client.url), { withAssets: true })));
    })(),
  );
});

sw.addEventListener('message', (event) => {
  const { data, ports } = event as WorkerMessageEvent;
  const message = (data ?? {}) as { type?: string; path?: string };
  if (message.type === 'SKIP_WAITING') void sw.skipWaiting();
  if (message.type === 'PAGE_SOURCE' && ports[0]) {
    const path = normalisePath(message.path ?? '');
    const at = fallbacks.get(path);
    ports[0].postMessage({ fromCache: at !== undefined && Date.now() - at < 60_000 });
  }
});

// Demonstration flight alerts are shown through this worker on phones: bring the site forward.
sw.addEventListener('notificationclick', (event) => {
  const notificationEvent = event as WorkerNotificationEvent;
  notificationEvent.notification.close();
  notificationEvent.waitUntil(
    (async () => {
      const windows = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows.find((client) => client.focus);
      if (open?.focus) await open.focus();
      else await sw.clients.openWindow('/');
    })(),
  );
});

sw.addEventListener('fetch', (event) => {
  const fetchEvent = event as WorkerFetchEvent;
  const request = fetchEvent.request;
  const url = new URL(request.url);
  const kind = classifyRequest(url, {
    method: request.method,
    mode: request.mode,
    destination: request.destination,
    rsc: request.headers.get('rsc') === '1',
    sameOrigin: url.origin === ORIGIN,
  });
  if (kind === 'bypass') return;
  const lang = langOfPath(url.pathname);
  if (lang && (kind === 'page' || kind === 'guidance')) lastLang = lang;

  if (kind === 'static') fetchEvent.respondWith(cacheFirst(request));
  else if (kind === 'data') fetchEvent.respondWith(staleWhileRevalidate(fetchEvent, CACHE_NAMES.data, request.url, 'json'));
  else if (kind === 'guidance') fetchEvent.respondWith(staleWhileRevalidate(fetchEvent, CACHE_NAMES.pages, pageKey(url), 'html'));
  else if (kind === 'page') fetchEvent.respondWith(networkFirst(fetchEvent, url));
  else fetchEvent.respondWith(rootNavigation(fetchEvent, url));
});

/* ----------------------------------------------------------------------------------------- */

async function precache(): Promise<void> {
  const results = await Promise.allSettled(PRECACHE_PATHS.map((path) => savePage(new URL(path, ORIGIN), { withAssets: true, required: true })));
  // The offline pages are the minimum: without them, do not take control (the browser retries later).
  const offlineFailed = PRECACHE_PATHS.some((path, index) => path.endsWith('/offline') && results[index].status === 'rejected');
  if (offlineFailed) throw new Error('Offline page could not be saved');
}

/** Fetch a page and store it with its title and time; optionally store its bundles too. */
async function savePage(url: URL, options: { withAssets?: boolean; required?: boolean } = {}): Promise<void> {
  const kind = classifyRequest(url, { method: 'GET', mode: 'navigate', destination: 'document', rsc: false, sameOrigin: url.origin === ORIGIN });
  if (kind !== 'page' && kind !== 'guidance') return;
  const response = await fetch(url.toString(), { cache: 'reload', credentials: 'same-origin' });
  const stored = await storePage(pageKey(url), response);
  if (!stored) {
    if (options.required) throw new Error(`Could not save ${url.pathname}`);
    return;
  }
  if (options.withAssets) await saveAssets(stored, url.toString());
}

/** Store an HTML response under `key`; returns the HTML, or null when it may not be stored. */
async function storePage(key: string, response: Response): Promise<string | null> {
  if (!isStorable(response, 'html')) return null;
  const html = await response.clone().text();
  const headers = new Headers(response.headers);
  // The stored body is the decoded text: drop transfer details that described the original bytes.
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.set(SAVED_AT_HEADER, new Date().toISOString());
  headers.set(TITLE_HEADER, encodeURIComponent(extractTitle(html)));
  headers.set('x-ma-build', BUILD);
  const cache = await caches.open(CACHE_NAMES.pages);
  await cache.put(key, new Response(html, { status: 200, statusText: 'OK', headers }));
  await trim(CACHE_NAMES.pages, CACHE_LIMITS.pages);
  return html;
}

/** Store the bundles a page needs (and the fonts its stylesheets name), skipping ones we have. */
async function saveAssets(html: string, pageUrl: string): Promise<void> {
  const cache = await caches.open(CACHE_NAMES.static);
  const assets = extractAssetUrls(html, pageUrl);
  await Promise.allSettled(
    assets.map(async (asset) => {
      if (await cache.match(asset)) return;
      const response = await fetch(asset, { credentials: 'same-origin' });
      if (!isStorable(response, 'any')) return;
      await cache.put(asset, response.clone());
      if (asset.endsWith('.css')) {
        const fonts = extractAssetUrls(await response.text(), asset).filter((font) => font !== asset);
        await Promise.allSettled(
          fonts.map(async (font) => {
            if (await cache.match(font)) return;
            const fontResponse = await fetch(font, { credentials: 'same-origin' });
            if (isStorable(fontResponse, 'any')) await cache.put(font, fontResponse);
          }),
        );
      }
    }),
  );
  await trim(CACHE_NAMES.static, CACHE_LIMITS.static);
}

async function trim(cacheName: string, limit: number): Promise<void> {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - limit))) await cache.delete(key);
}

/* Strategies ------------------------------------------------------------------------------- */

async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAMES.static);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (isStorable(response, 'any')) {
    await cache.put(request, response.clone());
    void trim(CACHE_NAMES.static, CACHE_LIMITS.static);
  }
  return response;
}

/** The network response for a fetch event, using navigation preload when the browser started one. */
async function fromNetwork(event: WorkerFetchEvent): Promise<Response> {
  const preloaded = await event.preloadResponse?.catch(() => undefined);
  return preloaded ?? fetch(event.request);
}

async function staleWhileRevalidate(event: WorkerFetchEvent, cacheName: string, key: string, expect: 'html' | 'json'): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(key, { ignoreVary: true, ignoreSearch: expect === 'html' });
  const network = fromNetwork(event).then(async (response) => {
    if (expect === 'html') {
      const html = await storePage(key, response);
      if (html) await saveAssets(html, event.request.url);
    } else if (isStorable(response, 'json')) {
      await cache.put(key, response.clone());
      await trim(cacheName, CACHE_LIMITS.data);
    }
    return response;
  });
  if (cached) {
    event.waitUntil(network.catch(() => undefined));
    return cached;
  }
  try {
    return await network;
  } catch {
    return offlineResponse(event.request, new URL(event.request.url));
  }
}

async function networkFirst(event: WorkerFetchEvent, url: URL): Promise<Response> {
  const key = pageKey(url);
  const network = fromNetwork(event).then(async (response) => {
    const html = await storePage(key, response);
    if (html) await saveAssets(html, url.toString());
    return response;
  });
  event.waitUntil(network.catch(() => undefined));
  const timeout = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), NETWORK_TIMEOUT_MS));
  try {
    const first = await Promise.race([network, timeout]);
    if (first !== 'timeout') return first;
    // Slow connection: show the saved copy now if there is one; the fetch keeps updating it.
    const cached = await savedPage(key);
    if (cached) return markFallback(url, cached);
    return await network;
  } catch {
    const cached = await savedPage(key);
    if (cached) return markFallback(url, cached);
    return offlineResponse(event.request, url);
  }
}

/** `/` and other paths without a locale: the proxy picks the language online; offline, the last one used. */
async function rootNavigation(event: WorkerFetchEvent, url: URL): Promise<Response> {
  try {
    return await fromNetwork(event);
  } catch {
    const lang = lastLang ?? (sw.navigator.language?.toLowerCase().startsWith('ms') ? 'ms' : 'en');
    return Response.redirect(new URL(`/${lang}${url.pathname === '/' ? '' : normalisePath(url.pathname)}`, ORIGIN).toString(), 302);
  }
}

async function savedPage(key: string): Promise<Response | undefined> {
  const cache = await caches.open(CACHE_NAMES.pages);
  return cache.match(key, { ignoreVary: true, ignoreSearch: true });
}

function markFallback(url: URL, response: Response): Response {
  fallbacks.set(normalisePath(url.pathname), Date.now());
  if (fallbacks.size > 30) fallbacks.delete(fallbacks.keys().next().value as string);
  return response;
}

/** Neither online nor saved: the offline page (saved at install) says so and lists what is saved. */
async function offlineResponse(request: Request, url: URL): Promise<Response> {
  if (request.mode !== 'navigate') return Response.error();
  const lang = langOfPath(url.pathname) ?? lastLang ?? 'en';
  const offlinePath = offlinePagePath(lang);
  if (normalisePath(url.pathname) !== offlinePath && (await savedPage(`${ORIGIN}${offlinePath}`))) {
    return Response.redirect(new URL(offlinePagePath(lang, url.pathname), ORIGIN).toString(), 302);
  }
  return new Response(
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline | Malaysia Airports</title>' +
      '<body style="font:1.0625rem/1.5 system-ui,sans-serif;margin:0;padding:3rem 1.25rem;background:#faf5ea;color:#181b3a"><main style="max-width:36rem;margin:auto">' +
      '<h1 style="font-size:1.75rem;margin:0 0 .5rem">You are offline</h1><p>This page is not saved on this device. Try again when you are back online.</p>' +
      '<p lang="ms">Anda di luar talian. Halaman ini tidak disimpan pada peranti ini. Cuba lagi apabila anda kembali dalam talian.</p></main></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );
}
