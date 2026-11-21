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

export type WorkerStatus = 'unknown' | 'unsupported' | 'disabled' | 'installing' | 'active' | 'error';

export interface WorkerState {
  status: WorkerStatus;
  /** A new version is installed and waiting for the visitor to reload. */
  updateReady: boolean;
  /** This page was answered from the saved copy because the network failed or was too slow. */
  servedFromCache: boolean;
}

export interface ConnectivityState {
  online: boolean;
  /** True for a few seconds after the connection returns. */
  justReconnected: boolean;
}

const SERVER_WORKER: WorkerState = { status: 'unknown', updateReady: false, servedFromCache: false };
const SERVER_CONNECTIVITY: ConnectivityState = { online: true, justReconnected: false };

function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(patch: Partial<T>) {
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/* Service worker ---------------------------------------------------------------------------- */

const worker = createStore<WorkerState>(SERVER_WORKER);
let started = false;
let registration: ServiceWorkerRegistration | undefined;
let reloadOnChange = false;
let lastUpdateCheck = 0;

export const subscribeWorker = worker.subscribe;
export const getWorker = worker.get;
export const getServerWorker = () => SERVER_WORKER;

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

/** A new page load or a client navigation that reached the network clears the "saved copy" state. */
export function clearServedFromCache(): void {
  if (worker.get().servedFromCache) worker.set({ servedFromCache: false });
}

/* Connectivity ------------------------------------------------------------------------------- */

const connectivity = createStore<ConnectivityState>(SERVER_CONNECTIVITY);
let listening = false;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

export const getConnectivity = connectivity.get;
export const getServerConnectivity = () => SERVER_CONNECTIVITY;

export function subscribeConnectivity(listener: () => void): () => void {
  if (!listening && typeof window !== 'undefined') {
    listening = true;
    connectivity.set({ online: navigator.onLine });
    window.addEventListener('offline', () => {
      clearTimeout(reconnectTimer);
      connectivity.set({ online: false, justReconnected: false });
    });
    window.addEventListener('online', () => {
      connectivity.set({ online: true, justReconnected: true });
      clearServedFromCache();
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => connectivity.set({ justReconnected: false }), 4000);
    });
  }
  return connectivity.subscribe(listener);
}
