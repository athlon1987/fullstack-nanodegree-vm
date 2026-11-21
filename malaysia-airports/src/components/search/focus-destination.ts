/**
 * Focus after a search selection (round 6, A-05 residual, WCAG 2.4.3). When the palette closes
 * because a result was chosen, focus goes to what was chosen: the `#anchor` target when the
 * result has one, otherwise the new page's `h1`. Before this, focus went back to the Search
 * button that opened the palette (phone) or was lost to `<body>` (desktop), so the next Tab
 * started from the header instead of the destination.
 *
 * The destination may not be on screen yet when the palette has finished closing (the route is
 * still loading or streaming), so this waits for the URL to match and the target to render, for
 * up to five seconds, then falls back to `<main>`. It never takes focus from a field or dialog
 * the visitor has moved to in the meantime.
 */

const HEADING = 'main h1';
const WAIT_MS = 5000;

function visibleHeading(exclude: Element | null): HTMLElement | null {
  // Earlier routes stay mounted but hidden: take the first visible h1 that is not the old one.
  const headings = Array.from(document.querySelectorAll<HTMLElement>(HEADING));
  return headings.find((heading) => heading !== exclude && heading.getClientRects().length > 0) ?? null;
}

function arrived(target: URL): boolean {
  const here = window.location;
  return here.pathname === target.pathname && here.search === target.search && here.hash === target.hash;
}

/** Focus somewhere else the visitor chose in the meantime: leave it. */
function focusTakenElsewhere(): boolean {
  const active = document.activeElement;
  if (!active || active === document.body || !active.isConnected) return false;
  if (active.closest('[role="dialog"]')) return true;
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
}

/** Where focus should land for this URL, once it is on screen; null while it is not yet. */
export function destinationElement(target: URL, previousHeading: Element | null): HTMLElement | null {
  if (!arrived(target)) return null;
  const hash = decodeURIComponent(target.hash.slice(1));
  if (hash) {
    const anchor = document.getElementById(hash);
    if (anchor && anchor.getClientRects().length > 0) return anchor;
  }
  return visibleHeading(previousHeading);
}

export function focusDestination(href: string): void {
  if (typeof window === 'undefined') return;
  const target = new URL(href, window.location.href);
  // Choosing the page already shown keeps its heading; a new page must bring its own.
  const previousHeading = target.pathname === window.location.pathname ? null : visibleHeading(null);
  const started = performance.now();

  const attempt = () => {
    if (focusTakenElsewhere()) return;
    const element = destinationElement(target, previousHeading);
    if (!element) {
      if (performance.now() - started < WAIT_MS) {
        requestAnimationFrame(attempt);
        return;
      }
      const main = document.getElementById('main');
      if (main && !focusTakenElsewhere()) main.focus({ preventScroll: true });
      return;
    }
    if (document.activeElement === element) return;
    if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1');
    element.focus({ preventScroll: true });
    // The router scrolls to an anchor; if it has not (a same-page choice), bring it into view.
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) element.scrollIntoView({ block: 'start' });
  };
  requestAnimationFrame(attempt);
}
