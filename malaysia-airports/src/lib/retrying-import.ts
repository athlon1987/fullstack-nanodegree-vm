import { createElement, lazy, type ComponentType, type ReactElement } from 'react';

/**
 * A dynamic import that does not fail for good (verification, round 5). `import()` rejects when a
 * chunk cannot be fetched (on airport Wi-Fi, often because the connection dropped at that moment),
 * and `React.lazy` keeps that rejection: the component throws on every render and the nearest error
 * boundary replaces the page. This promise waits and fetches again instead: as soon as the browser
 * says it is back online, or after a pause that doubles from `firstPauseMs` up to a minute, for a
 * connection that is only unreliable, or at once when the visitor asks (`retryWaitingImports`, the
 * "Try again" of `PartLoading`). Until then a lazy component stays suspended (its fallback, or the
 * server's HTML while hydrating). On the server, where the import does not depend on the network,
 * a failure is passed through unchanged.
 */
export function retryingImport<T>(load: () => Promise<T>, firstPauseMs = 5_000): Promise<T> {
  if (typeof window === 'undefined') return load();
  return new Promise<T>((resolve) => {
    let pause = firstPauseMs;
    const attempt = () => {
      load().then(
        (value) => {
          resolve(value);
        },
        () => {
          let done = false;
          const retry = () => {
            if (done) return;
            done = true;
            window.removeEventListener('online', retry);
            window.clearTimeout(timer);
            setWaiting(retry, false);
            attempt();
          };
          const timer = window.setTimeout(retry, pause);
          pause = Math.min(pause * 2, 60_000);
          window.addEventListener('online', retry);
          setWaiting(retry, true);
        },
      );
    };
    attempt();
  });
}

/* Imports that failed and are waiting to try again (round 6, review-3 9.1 item 1) --------------- */

const waiting = new Set<() => void>();
const listeners = new Set<() => void>();
let waitingCount = 0;

function setWaiting(retry: () => void, on: boolean): void {
  if (on) waiting.add(retry);
  else waiting.delete(retry);
  if (waiting.size === waitingCount) return;
  waitingCount = waiting.size;
  listeners.forEach((listener) => listener());
}

/** For `useSyncExternalStore`: how many failed imports are waiting to try again. */
export function subscribeWaitingImports(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export const getWaitingImports = (): number => waitingCount;
export const getServerWaitingImports = (): number => 0;

/** Fetch every waiting import again now (a fresh `import()`, not the failed promise). */
export function retryWaitingImports(): void {
  for (const retry of [...waiting]) retry();
}

/* Lazy components ------------------------------------------------------------------------------ */

/** A lazily loaded component that can be loaded afresh (`renew`), for `PartBoundary`'s "Try again". */
export interface RetryableLazy<P extends object> {
  (props: P): ReactElement;
  displayName?: string;
  /** Forget the loaded (or failed) component: the next render imports it again. */
  renew(): void;
}

/**
 * `React.lazy` over `retryingImport` (round 6): a chunk that cannot be fetched leaves the part
 * suspended (its `<Suspense>` fallback) and it loads by itself once the connection allows, instead
 * of throwing to the page's error boundary. Use it for every lazy part that renders on page load,
 * inside a `PartBoundary` so that an error in the part stays in the part.
 *
 * @example
 * const Card = retryableLazy(() => import('./card').then((module) => module.Card));
 * <PartBoundary onRetry={Card.renew}><Suspense fallback={<PartLoading />}><Card /></Suspense></PartBoundary>
 */
export function retryableLazy<P extends object>(load: () => Promise<ComponentType<P>>): RetryableLazy<P> {
  const make = () => lazy(() => retryingImport(load).then((component) => ({ default: component })));
  let current = make();
  const Part = ((props: P) => createElement(current as unknown as ComponentType<P>, props)) as RetryableLazy<P>;
  Part.renew = () => {
    current = make();
  };
  return Part;
}
