'use client';

import { useSyncExternalStore } from 'react';
import type { Store } from '@/lib/storage';

/**
 * Subscribe a component to a store. During server rendering and hydration it returns the
 * store's default value; the stored value arrives right after hydration without a mismatch.
 */
export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

const subscribeNever = (): (() => void) => () => undefined;

/**
 * False during server rendering and hydration, true afterwards. Use it to tell "nothing stored"
 * apart from "not read yet", for example to avoid flashing an empty state before saved items
 * appear.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}
