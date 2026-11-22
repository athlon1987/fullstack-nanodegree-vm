/**
 * Connection and service-worker state shared by the shell's connection notice (always loaded) and
 * the lazily loaded platform runtime (round 6, G8 item 8 and gallery note 3: the "You are offline"
 * toast waited for the runtime's script, so a connection that dropped before it arrived got no
 * notice). Small on purpose: it is in every page's first load. The worker registration and its
 * events live in `sw-client.ts`, which writes the worker state through `worker`.
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

/**
 * One answer to "what is saved on this device", shared by the offline page's status card and the
 * connection toast so they never disagree (round 4, gallery note 3: with the connection cut before
 * the worker had registered, the card said saving was "not switched on in this version" while the
 * toast said "showing saved information"). Pure.
 *
 * - `on`: the worker controls the page; saved copies can be shown.
 * - `checking`: not known yet (before the first client snapshot, or before registration).
 * - `starting`: the worker is installing; nothing may be saved yet.
 * - `not-ready`: offline before saving was ready (or registration failed offline): nothing saved yet;
 *   it is tried again when the connection returns.
 * - `failed`: registration failed while online.
 * - `off`: this build or browser does not save pages (development builds; no service worker support).
 */
export type SavingState = 'on' | 'checking' | 'starting' | 'not-ready' | 'failed' | 'off';

export function savingState(status: WorkerStatus, online: boolean): SavingState {
  switch (status) {
    case 'active':
      return 'on';
    case 'unknown':
      return online ? 'checking' : 'not-ready';
    case 'installing':
      return online ? 'starting' : 'not-ready';
    case 'error':
      return online ? 'failed' : 'not-ready';
    case 'disabled':
    case 'unsupported':
      return 'off';
  }
}

/** The connection toast: `offline` (saved copies can be shown), `offline-nothing-saved`, `unreachable`, `back`, or nothing. Pure. */
export function connectionNotice(input: { online: boolean; justReconnected: boolean; servedFromCache: boolean; status: WorkerStatus }): 'offline' | 'offline-nothing-saved' | 'unreachable' | 'back' | null {
  if (!input.online) return savingState(input.status, false) === 'on' ? 'offline' : 'offline-nothing-saved';
  if (input.servedFromCache) return 'unreachable';
  return input.justReconnected ? 'back' : null;
}

const SERVER_WORKER: WorkerState = { status: 'unknown', updateReady: false, servedFromCache: false };
const SERVER_CONNECTIVITY: ConnectivityState = { online: true, justReconnected: false };

export function createStore<T>(initial: T) {
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

/* Service worker state (written by `sw-client.ts`) -------------------------------------------- */

export const worker = createStore<WorkerState>(SERVER_WORKER);
export const subscribeWorker = worker.subscribe;
export const getWorker = worker.get;
export const getServerWorker = () => SERVER_WORKER;

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
    // Before the runtime has registered the worker: a page the worker already controls can show saved copies.
    if (worker.get().status === 'unknown' && typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) worker.set({ status: 'active' });
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
