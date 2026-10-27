// POCKETHOOD service worker: offline play after the first visit.
// - Hashed build assets and 3D models: cache-first (their URLs change when they change).
// - The page and content JSON: network-first with a cached fallback (fresh when online).
// - Never caches cross-origin requests or anything that isn't a plain GET.
// A new version waits until the page asks it to take over (the in-game "Update" button).
const CACHE = 'pockethood-v1';

self.addEventListener('install', () => {
  // Wait for the page's go-ahead; don't interrupt a running session.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('pockethood-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

const immutable = (url) => /\/assets\//.test(url.pathname);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (immutable(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && (req.mode === 'navigate' || url.pathname.includes('/content/') || url.pathname.endsWith('.webmanifest') || url.pathname.includes('/icons/'))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./') : Response.error()))),
  );
});
