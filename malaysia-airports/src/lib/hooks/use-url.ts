'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useLayoutEffect, useMemo, useSyncExternalStore } from 'react';

/**
 * URL state that hydrates (round 2, verification issue 3).
 *
 * `useSearchParams()` and, on routes with params that are not prerendered, `usePathname()` must sit
 * inside `<Suspense>`. In a prerendered page React then sends that boundary's FALLBACK and
 * replaces it with a client render after hydration, so anything typed or tapped in the meantime
 * is thrown away with the old DOM (text in the airport flight search and the board search, taps
 * on the phone bar).
 *
 * These hooks read the browser's URL through `useSyncExternalStore` instead (Next.js notes,
 * section 4, option 1). On the server and during hydration they return a fixed snapshot (no
 * query, no path), so the server HTML hydrates in place; right after hydration React re-renders
 * with the real URL. `UrlSync` (rendered once in the root layout) tells them about client-side
 * navigations; `popstate` covers Back and Forward.
 */

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

const getSearch = (): string => window.location.search;
const getServerSearch = (): string => '';
const getPathname = (): string | null => window.location.pathname;
const getServerPathname = (): string | null => null;

/** Tell every subscriber that the URL may have changed (after a navigation or `history.replaceState`). */
export function notifyUrlChange(): void {
  for (const listener of [...listeners]) listener();
}

/** The query string as `URLSearchParams`: empty on the server and during hydration. */
export function useUrlSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  return useMemo(() => new URLSearchParams(search), [search]);
}

/** The current path (with the locale), or `null` on the server and during hydration. */
export function useUrlPathname(): string | null {
  return useSyncExternalStore(subscribe, getPathname, getServerPathname);
}

/**
 * Bridges the App Router to the hooks above: Next.js updates `history` in an insertion effect,
 * so by this layout effect `window.location` holds the new URL and subscribers re-render before
 * paint. Render it once, inside `<Suspense fallback={null}>` (it reads the router's URL hooks).
 */
export function UrlSync(): null {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useLayoutEffect(() => {
    notifyUrlChange();
  }, [pathname, search]);
  return null;
}
