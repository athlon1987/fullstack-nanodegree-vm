/**
 * A shared clock for Client Components.
 *
 * Reading `Date.now()` during render fails the build under Cache Components (server AND client
 * renders), and setting state synchronously in an effect fails lint. A `useSyncExternalStore`
 * subscription with a `null` server snapshot passes both: prerendered HTML shows a placeholder
 * and the real time appears after hydration. `useNow()` in `@/lib/hooks` wraps this.
 *
 * One ticker exists per interval length and runs only while something is subscribed.
 */

interface Ticker {
  now: number | null;
  listeners: Set<() => void>;
  timer: ReturnType<typeof setInterval> | undefined;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => number | null;
}

const tickers = new Map<number, Ticker>();

/** Smallest interval a ticker will run at, to protect battery life. */
export const MIN_TICK_MS = 1000;

/** The ticker for an interval, created on first use. */
export function getTicker(intervalMs: number): Pick<Ticker, 'subscribe' | 'getSnapshot'> {
  const interval = Math.max(MIN_TICK_MS, Math.round(intervalMs));
  let ticker = tickers.get(interval);
  if (!ticker) {
    const created: Ticker = {
      now: null,
      listeners: new Set(),
      timer: undefined,
      subscribe(listener) {
        created.listeners.add(listener);
        if (created.timer === undefined) {
          const tick = (): void => {
            created.now = Date.now();
            for (const current of [...created.listeners]) current();
          };
          created.now = Date.now();
          created.timer = setInterval(tick, interval);
        }
        return () => {
          created.listeners.delete(listener);
          if (created.listeners.size === 0 && created.timer !== undefined) {
            clearInterval(created.timer);
            created.timer = undefined;
            // Forget the last tick so that the next subscriber never renders a stale time.
            created.now = null;
          }
        };
      },
      getSnapshot: () => created.now,
    };
    ticker = created;
    tickers.set(interval, created);
  }
  return ticker;
}

/** Server snapshot for the clock: always `null`, so prerendered output never contains a time. */
export function getServerNow(): null {
  return null;
}
