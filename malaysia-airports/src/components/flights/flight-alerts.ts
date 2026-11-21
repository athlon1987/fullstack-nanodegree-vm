'use client';

/**
 * Opt-in demo alerts: the browser's own permission prompt, a list of flight ids kept on this
 * device, and a helper that shows a notification. Every notification this prototype sends is a
 * clearly labelled demonstration made from simulated data, and only while a page is open: there
 * is no push server.
 */
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useStore } from '@/lib/hooks/use-store';
import { check, createStore, validator } from '@/lib/storage';

/** Flight ids with demo alerts turned on (`ma:flight-alerts:v1`). */
export const flightAlertsStore = createStore<string[]>({
  name: 'flight-alerts',
  version: 1,
  // zod-free validation (round 2, E-03): zod left the JavaScript of every page.
  schema: validator(check.array(check.string({ min: 5, max: 40 }), { max: 20 })),
  defaultValue: [],
});

/** `unknown` before hydration; `unsupported` when the browser has no Notification API. */
export type AlertPermission = 'unknown' | 'unsupported' | 'default' | 'granted' | 'denied';

const listeners = new Set<() => void>();
let watching = false;

function notify(): void {
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Follow changes made in the browser's site settings, where the Permissions API allows it.
  if (!watching && typeof navigator !== 'undefined' && navigator.permissions?.query) {
    watching = true;
    navigator.permissions
      .query({ name: 'notifications' as PermissionName })
      .then((status) => {
        status.addEventListener('change', notify);
      })
      .catch(() => undefined);
  }
  return () => {
    listeners.delete(listener);
  };
}

function snapshot(): AlertPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/** The browser's notification permission, kept current. */
export function useAlertPermission(): AlertPermission {
  return useSyncExternalStore(subscribe, snapshot, () => 'unknown');
}

/** Ask for permission (from a click handler only). Resolves to the new state. */
export async function requestAlertPermission(): Promise<AlertPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  try {
    await Notification.requestPermission();
  } catch {
    // Old Safari only supports the callback form; the state is read below either way.
  }
  notify();
  return snapshot();
}

/** Show a notification. Returns false when it could not be shown. Call only after permission is granted. */
export function showDemoNotification(title: string, body: string, tag?: string): boolean {
  if (snapshot() !== 'granted') return false;
  try {
    new Notification(title, { body, tag, lang: document.documentElement.lang });
    return true;
  } catch {
    // Some mobile browsers only show notifications through a service worker registration.
    navigator.serviceWorker?.getRegistration().then((registration) => registration?.showNotification(title, { body, tag }));
    return Boolean(navigator.serviceWorker?.controller);
  }
}

/** The flights with demo alerts on, and how to change that. */
export function useFlightAlerts(): { ids: ReadonlySet<string>; enable: (id: string) => void; disable: (id: string) => void; clear: () => void } {
  const list = useStore(flightAlertsStore);
  const ids = useMemo(() => new Set(list), [list]);
  const enable = useCallback((id: string) => flightAlertsStore.set((current) => [id, ...current.filter((item) => item !== id)].slice(0, 20)), []);
  const disable = useCallback((id: string) => flightAlertsStore.set((current) => current.filter((item) => item !== id)), []);
  const clear = useCallback(() => flightAlertsStore.clear(), []);
  return { ids, enable, disable, clear };
}
