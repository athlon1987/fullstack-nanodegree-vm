/**
 * A dynamic import that does not fail for good (verification, round 5). `import()` rejects when a
 * chunk cannot be fetched (on airport Wi-Fi, often because the connection dropped at that moment),
 * and `React.lazy` keeps that rejection: the component throws on every render and the nearest error
 * boundary replaces the page. This promise waits and fetches again instead: as soon as the browser
 * says it is back online, or after a pause that doubles from `firstPauseMs` up to a minute, for a
 * connection that is only unreliable. Until then a lazy component stays suspended (its fallback,
 * or the server's HTML while hydrating). On the server, where the import does not depend on the
 * network, a failure is passed through unchanged.
 */
export function retryingImport<T>(load: () => Promise<T>, firstPauseMs = 5_000): Promise<T> {
  if (typeof window === 'undefined') return load();
  return new Promise<T>((resolve) => {
    let pause = firstPauseMs;
    const attempt = () => {
      load().then(resolve, () => {
        const retry = () => {
          window.removeEventListener('online', retry);
          window.clearTimeout(timer);
          attempt();
        };
        const timer = window.setTimeout(retry, pause);
        pause = Math.min(pause * 2, 60_000);
        window.addEventListener('online', retry);
      });
    };
    attempt();
  });
}
