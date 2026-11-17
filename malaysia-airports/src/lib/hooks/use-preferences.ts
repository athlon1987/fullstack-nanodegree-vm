'use client';

import { useCallback, useLayoutEffect, useMemo } from 'react';
import { DEFAULT_PREFERENCES, applyPreferences, type Preferences } from '@/lib/preferences';
import { preferencesStore } from '@/lib/stores';
import { useHydrated, useStore } from './use-store';

let syncInstalled = false;

/**
 * Keep `<html>` in step with the preferences store for the rest of the visit: changes made in
 * this tab, in another tab, and changes of the device colour scheme (for the "system" theme).
 * Installed once, from an effect.
 */
function installPreferencesSync(): void {
  if (syncInstalled || typeof window === 'undefined') return;
  syncInstalled = true;
  const apply = (): void => applyPreferences(preferencesStore.get());
  preferencesStore.subscribe(apply);
  if (typeof window.matchMedia === 'function') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply);
  }
}

/** What `usePreferences` returns. */
export interface PreferencesValue {
  preferences: Preferences;
  /** Change one or more preferences: `set({ theme: 'dark' })`. Applied to `<html>` at once. */
  set: (changes: Partial<Preferences>) => void;
  /** Back to the defaults. */
  reset: () => void;
  /** False until the stored value has been read after hydration. */
  hydrated: boolean;
}

/**
 * Display and accessibility preferences: theme (system, light, dark), text size (100, 112,
 * 125 percent), high contrast and reduced motion.
 *
 * The values are applied as `data-*` attributes on `<html>` (see `@/lib/preferences` for the
 * contract). First paint is handled by `PREFERENCES_INIT_SCRIPT` in the root layout; this hook
 * keeps the attributes in step afterwards.
 */
export function usePreferences(): PreferencesValue {
  const preferences = useStore(preferencesStore);
  const hydrated = useHydrated();

  // DOM sync only (no state is set here). It also re-applies the attributes after React's
  // development Strict Mode remount clears what the inline script set.
  useLayoutEffect(() => {
    installPreferencesSync();
    applyPreferences(preferencesStore.get());
  }, [preferences]);

  const set = useCallback((changes: Partial<Preferences>) => {
    preferencesStore.set((current) => ({ ...current, ...changes }));
  }, []);
  const reset = useCallback(() => preferencesStore.set(DEFAULT_PREFERENCES), []);

  return useMemo(() => ({ preferences, set, reset, hydrated }), [preferences, set, reset, hydrated]);
}

/**
 * Call once in a client component that is always mounted (the shell) so that preference
 * changes from other tabs are applied even while the preferences panel is closed.
 */
export function usePreferencesSync(): void {
  useLayoutEffect(() => {
    installPreferencesSync();
  }, []);
}
