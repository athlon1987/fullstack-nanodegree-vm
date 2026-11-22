/**
 * Client-side platform state as external stores (read with `useSyncExternalStore`, fixed server
 * snapshots, so nothing touches browser APIs during render):
 *  - the service worker: registration (production builds only), update waiting, and whether this
 *    page was answered from the saved copy because the network failed;
 *  - connectivity: `navigator.onLine`, plus a short "back online" moment after reconnecting.
 *
 * The worker source is `service-worker.ts`; Next.js compiles it because of the
 * `register(new URL(…, import.meta.url))` call below (Next.js notes, section 13).
 */

import {
  clearServedFromCache,
  connectionNotice,
  getConnectivity,
  getServerConnectivity,
  getServerWorker,
  getWorker,
  savingState,
  subscribeConnectivity,
  subscribeWorker,
  worker,
  type ConnectivityState,
  type SavingState,
  type WorkerState,
  type WorkerStatus,
} from './connectivity';

// The shared state moved to `connectivity.ts` (round 6) so the shell's connection notice does not
// wait for this module; it is re-exported here for the existing importers.
export { clearServedFromCache, connectionNotice, getConnectivity, getServerConnectivity, getServerWorker, getWorker, savingState, subscribeConnectivity, subscribeWorker };
export type { ConnectivityState, SavingState, WorkerState, WorkerStatus };

/* Service worker ---------------------------------------------------------------------------- */

let started = false;
let registration: ServiceWorkerRegistration | undefined;
let reloadOnChange = false;
let lastUpdateCheck = 0;


/** Start once, from an effect in the always-mounted `PlatformRuntime`. */
export function startServiceWorker(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  if (!('serviceWorker' in navigator)) {
    worker.set({ status: 'unsupported' });
    return;
  }
  if (process.env.NODE_ENV !== 'production') {
    // Development: never cache, and remove a worker a production run on this origin left behind.
    worker.set({ status: 'disabled' });
    void navigator.serviceWorker.getRegistrations().then((all) => all.forEach((existing) => void existing.unregister()));
    return;
  }
  const register = () => {
    navigator.serviceWorker
      .register(new URL('./service-worker.ts', import.meta.url), { scope: '/', updateViaCache: 'none' })
      .then(track)
      .catch(() => worker.set({ status: 'error' }));
  };
  // Registration fails without a connection (the script cannot be fetched): try again once the
  // connection returns, so "pages you open from now on will be kept" stays true (round 4).
  window.addEventListener('online', () => {
    if (worker.get().status === 'error') register();
  });
  // Let the page and its prefetches finish first: the worker's precache must not compete with
  // them (performance-11).
  const start = () => afterNetworkIdle(register);
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

/**
 * Run `callback` once the network has been quiet for a moment: no new resource entries for
 * `quietMs`, checked every 500 ms, and at most `maxWaitMs` after the call. Then in an idle period.
 */
export function afterNetworkIdle(callback: () => void, quietMs = 1500, maxWaitMs = 10_000): void {
  const count = () => (typeof performance !== 'undefined' && performance.getEntriesByType ? performance.getEntriesByType('resource').length : 0);
  let last = count();
  let quiet = 0;
  let waited = 0;
  const idle = () => {
    const withIdle = window as Window & { requestIdleCallback?: (fn: () => void, options?: { timeout: number }) => number };
    if (withIdle.requestIdleCallback) withIdle.requestIdleCallback(callback, { timeout: 2000 });
    else callback();
  };
  const timer = window.setInterval(() => {
    const now = count();
    quiet = now === last ? quiet + 500 : 0;
    last = now;
    waited += 500;
    if (quiet >= quietMs || waited >= maxWaitMs) {
      window.clearInterval(timer);
      idle();
    }
  }, 500);
}

function track(reg: ServiceWorkerRegistration): void {
  registration = reg;
  const controlled = Boolean(navigator.serviceWorker.controller);
  worker.set({ status: controlled ? 'active' : 'installing', updateReady: controlled && Boolean(reg.waiting) });

  reg.addEventListener('updatefound', () => {
    const incoming = reg.installing;
    incoming?.addEventListener('statechange', () => {
      if (incoming.state === 'installed' && navigator.serviceWorker.controller) worker.set({ updateReady: true });
      if (incoming.state === 'activated' && !worker.get().updateReady) worker.set({ status: 'active' });
    });
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadOnChange) window.location.reload();
    else worker.set({ status: 'active' });
  });
  document.addEventListener('visibilitychange', () => {
    // Look for a new version when the visitor comes back, at most every 30 minutes.
    if (document.visibilityState !== 'visible' || Date.now() - lastUpdateCheck < 30 * 60_000) return;
    lastUpdateCheck = Date.now();
    void reg.update().catch(() => undefined);
  });
  askPageSource();
}

/** Ask the worker whether it answered this page from the saved copy. */
function askPageSource(): void {
  const controller = navigator.serviceWorker.controller;
  if (!controller) return;
  const channel = new MessageChannel();
  channel.port1.onmessage = (event: MessageEvent<{ fromCache?: boolean }>) => {
    if (event.data?.fromCache) worker.set({ servedFromCache: true });
  };
  controller.postMessage({ type: 'PAGE_SOURCE', path: window.location.pathname }, [channel.port2]);
}

/** Activate the waiting version and reload once it takes control. */
export function applyUpdate(): void {
  const waiting = registration?.waiting;
  if (!waiting) {
    window.location.reload();
    return;
  }
  reloadOnChange = true;
  waiting.postMessage({ type: 'SKIP_WAITING' });
}

export function dismissUpdate(): void {
  worker.set({ updateReady: false });
}

