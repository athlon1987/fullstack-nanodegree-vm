'use client';

import { useEffect } from 'react';

/** Below this window height, or at 112% and 125% text, the fixed chrome gives way while reading. */
const SHORT_WINDOW = '(max-height: 40rem)';
const LARGE_TEXT = new Set(['112', '125']);
/** A root font size from this many pixels (the device's or browser's text size, 112.5% and up) compacts the chrome too. */
const DEVICE_LARGE_TEXT_PX = 18;
/** Pixels of movement before the chrome reacts, so a jittery thumb does not make it flicker. */
const THRESHOLD = 8;
/** After scrolling stops, the bottom bar comes back. */
const IDLE_MS = 700;

/**
 * Keeps the sticky header and the phone bottom bar from covering content on short windows and at
 * large text (A-11). Sets two attributes on `<html>` that `globals.css` reads:
 *
 * - `data-compact-chrome`: the condition holds (window under 40rem high, or text at 112 or 125%).
 *   The bottom bar then drops its labels to a 44 px icon row (names stay for assistive technology).
 * - `data-scroll-chrome="hidden"` while scrolling down (header and bar slide away),
 *   `"header"` while scrolling up (header only), removed when scrolling stops or near the top.
 *
 * Focus moving into the header or the bar always brings them back. Mounted once by `MobileBar`.
 *
 * Direction v2: also sets `data-scrolled` on `<html>` once the page has scrolled at all, on every
 * window size. The header reads it over a hero (home) in browsers without CSS scroll-driven
 * animations, to fade its bar in (`SiteHeader`).
 */
export function ScrollChrome() {
  useEffect(() => {
    const html = document.documentElement;
    const query = window.matchMedia(SHORT_WINDOW);
    let enabled = false;
    let lastY = window.scrollY;
    let frame = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;

    const show = () => {
      delete html.dataset.scrollChrome;
    };
    const evaluate = () => {
      // Round 6 (review-3 9.1 item 9): text enlarged by the device or browser (a root font size
      // above 18 px), not only by this site's setting, also gets the compact chrome: at 200% the
      // bottom bar's labels overlapped and its last item was pushed off a 390 px screen.
      const rootSize = parseFloat(getComputedStyle(html).fontSize) || 16;
      enabled = query.matches || LARGE_TEXT.has(html.dataset.textSize ?? '') || rootSize >= DEVICE_LARGE_TEXT_PX;
      if (enabled) html.dataset.compactChrome = 'true';
      else {
        delete html.dataset.compactChrome;
        show();
      }
    };
    const markScrolled = () => {
      const scrolled = window.scrollY > 8;
      if (scrolled === ('scrolled' in html.dataset)) return;
      if (scrolled) html.dataset.scrolled = '';
      else delete html.dataset.scrolled;
    };
    const onScroll = () => {
      markScrolled();
      if (!enabled || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const delta = y - lastY;
        if (y < 64) show();
        else if (delta > THRESHOLD) html.dataset.scrollChrome = 'hidden';
        else if (delta < -THRESHOLD) html.dataset.scrollChrome = 'header';
        if (Math.abs(delta) > THRESHOLD || y < 64) lastY = y;
        clearTimeout(idle);
        idle = setTimeout(() => {
          if (html.dataset.scrollChrome === 'header') show();
        }, IDLE_MS);
      });
    };
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('[data-site-header], [data-mobile-bar]')) show();
    };

    evaluate();
    markScrolled();
    // The text size is an attribute the display settings change at any time.
    const observer = new MutationObserver(evaluate);
    observer.observe(html, { attributes: true, attributeFilter: ['data-text-size'] });
    query.addEventListener('change', evaluate);
    // A device text size changed while the page is open reaches the root font size; a resize
    // event follows most such changes, and it is cheap to re-check then.
    window.addEventListener('resize', evaluate);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('focusin', onFocusIn);
    return () => {
      observer.disconnect();
      query.removeEventListener('change', evaluate);
      window.removeEventListener('resize', evaluate);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('focusin', onFocusIn);
      cancelAnimationFrame(frame);
      clearTimeout(idle);
      show();
      delete html.dataset.compactChrome;
      delete html.dataset.scrolled;
    };
  }, []);
  return null;
}
