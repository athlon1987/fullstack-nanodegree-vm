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

const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]';

/** Focus the element with this id (making it focusable with `tabindex="-1"` if it is not). */
function focusSection(id: string): HTMLElement | null {
  const target = document.getElementById(id);
  if (!target || target === document.activeElement) return target;
  if (!target.matches(FOCUSABLE)) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  return target;
}

/** How long a moved-to section is watched for being replaced (a lazy part arriving in its placeholder). */
const FOLLOW_MS = 15_000;

/**
 * Round 6 (review-3 9.1 item 3, A-05 residual): a link to a section of the same page ("My needs"
 * on the flight page, the accessibility hub's contents, "Skip to the list") scrolled there but
 * left keyboard focus on `<body>`, so screen readers that follow focus stayed where they were and
 * the accessibility statement's "a link to a section moves focus to that section" was untrue. After
 * the browser has scrolled to the section, focus moves to it (`tabindex="-1"` where needed, no
 * second scroll). When the section is a placeholder that a lazily loaded part then replaces under
 * the same id (the flight page's needs control), focus follows to the part. Links whose click
 * was handled by a script (`preventDefault`) are left alone. Mounted once by `GlobalOverlays`.
 */
export function InPageFocus() {
  useEffect(() => {
    let follow: number | undefined;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== '_self')) return;
      const url = new URL(link.href, window.location.href);
      const here = window.location;
      if (!url.hash || url.origin !== here.origin || url.pathname !== here.pathname || url.search !== here.search) return;
      const id = decodeURIComponent(url.hash.slice(1));
      if (!id) return;
      requestAnimationFrame(() => {
        const focused = focusSection(id);
        window.clearInterval(follow);
        if (!focused) return;
        const started = Date.now();
        follow = window.setInterval(() => {
          const active = document.activeElement;
          if (Date.now() - started > FOLLOW_MS || (focused.isConnected && active !== focused)) {
            window.clearInterval(follow);
            return;
          }
          if (focused.isConnected) return;
          // Replaced: follow it, unless the visitor has moved on meanwhile.
          if (active && active !== document.body) window.clearInterval(follow);
          else if (document.getElementById(id)) {
            focusSection(id);
            window.clearInterval(follow);
          }
        }, 200);
      });
    };
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      window.clearInterval(follow);
    };
  }, []);
  return null;
}
