'use client';

import { useSyncExternalStore } from 'react';
import { getServerNow, getTicker } from '@/lib/time-store';

/**
 * The current time as epoch milliseconds, refreshed every `intervalMs` (default 30 seconds).
 *
 * Returns `null` during server rendering, hydration and the first client render: render a
 * placeholder for that case. This is the ONLY approved way to read the clock in a component:
 * `Date.now()` or `new Date()` during render fails the build under Cache Components.
 *
 * @example
 * const now = useNow();
 * if (now === null) return <BoardSkeleton />;
 * const flights = getFlightProvider(now).listFlightsSync({ airport: 'kul', direction: 'd' });
 */
export function useNow(intervalMs = 30_000): number | null {
  const ticker = getTicker(intervalMs);
  return useSyncExternalStore(ticker.subscribe, ticker.getSnapshot, getServerNow);
}
