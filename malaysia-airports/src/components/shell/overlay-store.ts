'use client';

/**
 * The overlay store: one global overlay is open at a time (search palette, concierge panel,
 * display settings, airport switcher, menu). Any component can open one:
 *
 *   import { overlays } from '@/components/shell/overlay-store';
 *   <Button onClick={() => overlays.openConcierge('Where can I pray at KLIA Terminal 1?')}>…</Button>
 *
 * The overlays themselves are mounted once by `GlobalOverlays` in the root layout. Focus returns
 * to whatever had it when the overlay was opened.
 */
import { useSyncExternalStore } from 'react';
import type { AirportSectionId } from './sections';

/** The overlays the shell owns. */
export type OverlayName = 'search' | 'concierge' | 'preferences' | 'airport' | 'menu';

/** Optional data for the overlay being opened. */
export interface OverlayPayload {
  /** Search palette: start with this query. */
  query?: string;
  /** Concierge: start with this question. */
  question?: string;
  /** Airport switcher: after choosing, continue to this section. */
  then?: AirportSectionId;
  /** Airport switcher: query string carried into that section (`filters=halal`), without `?`. */
  thenQuery?: string;
}

/** What is open right now. */
export interface OverlayState {
  open: OverlayName | null;
  payload: OverlayPayload;
}

const CLOSED: OverlayState = { open: null, payload: {} };

let state: OverlayState = CLOSED;
let returnFocusTo: HTMLElement | null = null;
const listeners = new Set<() => void>();

function emit(next: OverlayState): void {
  state = next;
  for (const listener of [...listeners]) listener();
}

/** Open an overlay (closing any other). Call it from event handlers only. */
export function openOverlay(name: OverlayName, payload: OverlayPayload = {}): void {
  if (typeof document !== 'undefined' && state.open === null) {
    returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  emit({ open: name, payload });
}

/** Close the open overlay; with a name, only if that one is open. */
export function closeOverlay(name?: OverlayName): void {
  if (state.open === null || (name && state.open !== name)) return;
  emit(CLOSED);
}

/** Put focus back where it was before the overlay opened. Used by the dialogs' close handlers. */
export function restoreOverlayFocus(): void {
  const target = returnFocusTo;
  returnFocusTo = null;
  if (target && target.isConnected) target.focus();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = (): OverlayState => state;
const getServerSnapshot = (): OverlayState => CLOSED;

/** Subscribe to the overlay state. Re-renders on every change: prefer `useOverlayOpen` for one overlay. */
export function useOverlayState(): OverlayState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Is this one overlay open? Re-renders only when that answer changes, so opening the airport
 * switcher does not re-render every other trigger and panel (A-09: switcher open under 200 ms).
 */
export function useOverlayOpen(name: OverlayName): boolean {
  return useSyncExternalStore(
    subscribe,
    () => state.open === name,
    () => false,
  );
}

/**
 * Props for a Radix dialog that is driven by this store.
 *
 * @example const dialog = useOverlayDialog('preferences');
 *          <Sheet open={dialog.open} onOpenChange={dialog.onOpenChange}>
 *            <SheetContent onCloseAutoFocus={dialog.onCloseAutoFocus} …>
 */
export function useOverlayDialog(name: OverlayName) {
  // Only this dialog's state: other overlays opening and closing do not re-render it.
  const current = useSyncExternalStore(
    subscribe,
    () => (state.open === name ? state : CLOSED),
    getServerSnapshot,
  );
  return {
    open: current.open === name,
    payload: current.open === name ? current.payload : CLOSED.payload,
    onOpenChange: (next: boolean) => {
      if (next) openOverlay(name);
      else closeOverlay(name);
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      // Another overlay may have opened in the same tick (menu to airport switcher): keep focus there.
      if (state.open === null) restoreOverlayFocus();
    },
  };
}

/** The public API for features: open the search palette, the concierge, the settings and so on. */
export const overlays = {
  openSearch: (query?: string) => openOverlay('search', query ? { query } : {}),
  openConcierge: (question?: string) => openOverlay('concierge', question ? { question } : {}),
  openPreferences: () => openOverlay('preferences'),
  openAirportSwitcher: (then?: AirportSectionId, thenQuery?: string) => openOverlay('airport', then ? { then, ...(thenQuery ? { thenQuery } : {}) } : {}),
  openMenu: () => openOverlay('menu'),
  close: () => closeOverlay(),
};
