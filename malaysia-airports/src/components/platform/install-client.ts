/**
 * Installability as an external store. Chrome, Edge and Android browsers fire
 * `beforeinstallprompt` once per page load when the site can be installed; we keep the event so
 * the offline page can offer an "Install" button. We never call `preventDefault()`: the browser's
 * own install affordances stay as they are, and we do not nag. Safari has no event; the offline
 * page explains the Share > Add to Home Screen route instead.
 */

export type InstallState = 'unknown' | 'installed' | 'available' | 'manual' | 'done';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let state: InstallState = 'unknown';
let deferred: BeforeInstallPromptEvent | undefined;
let listening = false;
const listeners = new Set<() => void>();

function set(next: InstallState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

function standalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches;
}

/** Start listening early (from `PlatformRuntime`): the event can fire before the offline page mounts. */
export function listenForInstall(): void {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  state = standalone() ? 'installed' : 'manual';
  window.addEventListener('beforeinstallprompt', (event) => {
    deferred = event as BeforeInstallPromptEvent;
    if (state !== 'installed') set('available');
  });
  window.addEventListener('appinstalled', () => {
    deferred = undefined;
    set('done');
  });
}

export function subscribeInstall(listener: () => void): () => void {
  listenForInstall();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getInstall = (): InstallState => state;
export const getServerInstall = (): InstallState => 'unknown';

/** Show the browser's install dialog (only after `available`). */
export async function promptInstall(): Promise<void> {
  if (!deferred) return;
  const event = deferred;
  deferred = undefined;
  await event.prompt();
  const choice = await event.userChoice;
  set(choice.outcome === 'accepted' ? 'done' : 'manual');
}
