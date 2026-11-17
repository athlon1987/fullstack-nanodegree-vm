'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  return () => {
    media.removeEventListener('change', onChange);
    observer.disconnect();
  };
}

/** Reads the in-app setting (`data-motion` on `<html>`) and the system preference. */
export function prefersReducedMotion(): boolean {
  const setting = document.documentElement.dataset.motion;
  return setting === 'reduce' || setting === 'reduced' || window.matchMedia(QUERY).matches;
}

/** True when motion should be avoided. The server render assumes it should (no animation in static HTML). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => true);
}
