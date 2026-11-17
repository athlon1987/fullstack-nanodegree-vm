'use client';

import { useMemo } from 'react';
import { DEMO_REFRESH_SECONDS, getFlightProvider, type DemoFlightProvider } from '@/lib/providers';
import { useNow } from './use-now';

/**
 * The flight provider for "now", rebuilt every `intervalMs` (default: the provider's refresh
 * interval, 30 seconds). Returns `null` until the clock is available after hydration.
 *
 * The provider is a snapshot, so derived data can be memoised on it:
 *
 * @example
 * const provider = useFlightProvider();
 * const flights = useMemo(() => provider?.listFlightsSync({ airport, direction }) ?? null, [provider, airport, direction]);
 */
export function useFlightProvider(intervalMs: number = DEMO_REFRESH_SECONDS * 1000): DemoFlightProvider | null {
  const now = useNow(intervalMs);
  return useMemo(() => (now === null ? null : getFlightProvider(now)), [now]);
}
