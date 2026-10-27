// Progressive Web App: registers the service worker (production, top-level https only — it
// is skipped inside sandboxed iframes such as previews) and reports when an update is ready.
import { create } from 'zustand';
import { flag } from '../platform/content/flags';


export const usePwa = create<{ updateReady: boolean; apply: () => void }>(() => ({ updateReady: false, apply: () => {} }));

export function registerServiceWorker() {
  try {
    if (!import.meta.env.PROD || !flag('pwa') || !('serviceWorker' in navigator)) return;
    if (window.top !== window.self) return; // embedded (e.g. a sandboxed preview): skip
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
    void navigator.serviceWorker
      .register(`./sw.js?build=${encodeURIComponent(__BUILD_ID__)}`, { scope: './' })
      .then((reg) => {
        const offer = (w: ServiceWorker | null) => {
          if (!w || !navigator.serviceWorker.controller) return; // first install: nothing to update
          usePwa.setState({
            updateReady: true,
            apply: () => {
              navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
              w.postMessage('skipWaiting');
            },
          });
        };
        if (reg.waiting) offer(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const w = reg.installing;
          w?.addEventListener('statechange', () => w.state === 'installed' && offer(w));
        });
      })
      .catch(() => {});
  } catch {
    /* storage/service workers unavailable: the game still works online */
  }
}
