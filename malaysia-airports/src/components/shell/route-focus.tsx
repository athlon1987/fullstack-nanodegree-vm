'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const HEADING = 'main h1';
/** How long to wait for the new page's heading (streamed sections can arrive a little later). */
const WAIT_MS = 2000;

function focusTarget(previous: Element | null): HTMLElement | null {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (hash) {
    const anchor = document.getElementById(hash);
    if (anchor) return anchor;
  }
  // Earlier routes stay mounted but hidden: take the first visible h1 that is not the old one.
  const headings = Array.from(document.querySelectorAll<HTMLElement>(HEADING));
  return headings.find((heading) => heading !== previous && heading.getClientRects().length > 0) ?? null;
}

function shouldMoveFocus(): boolean {
  const active = document.activeElement;
  if (!active || active === document.body || !active.isConnected) return true;
  // Never pull focus out of an open dialog or a field the visitor is typing in.
  if (active.closest('[role="dialog"]')) return false;
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return false;
  return true;
}

/**
 * Moves keyboard focus to the new page's `h1` after a client-side navigation that changes the
 * pathname (not the query alone), so the next Tab continues from the top of the new content
 * instead of jumping to the footer (WCAG 2.4.3). The heading gets `tabindex="-1"`; with no
 * heading, `<main>` takes focus. A `#hash` target takes precedence. The built-in route
 * announcer still reads the new title. Mounted once by `GlobalOverlays`.
 */
export function RouteFocus() {
  const pathname = usePathname();
  // The pathname focus was last settled for; `null` before the first render. Comparing paths
  // (not a "first run" flag) keeps Strict Mode's double effect from moving focus on load.
  const settled = useRef<string | null>(null);
  const heading = useRef<Element | null>(null);

  useEffect(() => {
    if (settled.current === null || settled.current === pathname) {
      settled.current = pathname;
      heading.current = document.querySelector(HEADING);
      return;
    }
    settled.current = pathname;
    const previous = heading.current;
    const started = performance.now();
    let frame = 0;
    const attempt = () => {
      const target = focusTarget(previous);
      if (!target && performance.now() - started < WAIT_MS) {
        frame = requestAnimationFrame(attempt);
        return;
      }
      const element = target ?? document.getElementById('main');
      heading.current = target?.matches(HEADING) ? target : document.querySelector(HEADING);
      if (!element || !shouldMoveFocus()) return;
      if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1');
      element.focus({ preventScroll: true });
    };
    frame = requestAnimationFrame(attempt);
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
