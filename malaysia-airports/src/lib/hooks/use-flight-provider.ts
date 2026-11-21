'use client';

import { useDeferredValue, useMemo } from 'react';
import { DEMO_REFRESH_SECONDS, getFlightProvider, type DemoFlightProvider } from '@/lib/providers';
import { useNow } from './use-now';

/**
 * The flight provider for "now", rebuilt every `intervalMs` (default: the provider's refresh
 * interval, 30 seconds). Returns `null` until the clock is available after hydration, and each new
 * provider a moment later than the clock (a deferred value).
 *
 * The provider is a snapshot, so derived data can be memoised on it:
 *
 * @example
 * const provider = useFlightProvider();
 * const flights = useMemo(() => provider?.listFlightsSync({ airport, direction }) ?? null, [provider, airport, direction]);
 */
export function useFlightProvider(intervalMs: number = DEMO_REFRESH_SECONDS * 1000): DemoFlightProvider | null {
  const now = useNow(intervalMs);
  const provider = useMemo(() => (now === null ? null : getFlightProvider(now)), [now]);
  // Round 2 (TBT, E-01): the clock is an external store, so its first tick after hydration (and
  // each later one) renders synchronously. Handing the provider on as a deferred value keeps that
  // render small; the flights built from it render in an interruptible background render.
  return useDeferredValue(provider);
}
