'use client';

import { usePathname } from 'next/navigation';
import { Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePreferencesSync } from '@/lib/hooks';
import { closeOverlay, openOverlay, useOverlayOpen, type OverlayName } from './overlay-store';
import { RouteFocus } from './route-focus';

// The palette brings the search engine with it: load it the first time it is opened.
const CommandPalette = lazy(() => import('@/components/search/command-palette').then((module) => ({ default: module.CommandPalette })));

/*
 * The other overlays (round 2, E-03 and E-01): Radix Dialog, the switcher, the menu, display
 * settings and the concierge panel were in every page's first-load script and evaluated during
 * start-up. They load when the page is first idle, or at once when one is opened before that.
 */
const loadSwitcher = () => import('./airport-switcher-dialog');
const loadPanels = () => import('./panels');
const loadConcierge = () => import('@/components/concierge/concierge-panel');
const AirportSwitcherDialog = lazy(() => loadSwitcher().then((module) => ({ default: module.AirportSwitcherDialog })));
const PreferencesPanel = lazy(() => loadPanels().then((module) => ({ default: module.PreferencesPanel })));
const MenuPanel = lazy(() => loadPanels().then((module) => ({ default: module.MenuPanel })));
const ConciergePanel = lazy(() => loadConcierge().then((module) => ({ default: module.ConciergePanel })));

/** Mounts an overlay once the page has been idle (`ready`) or once it is first opened. */
function Deferred({ name, ready, children }: { name: OverlayName; ready: boolean; children: ReactNode }) {
  const open = useOverlayOpen(name);
  const [wanted, setWanted] = useState(false);
  if ((open || ready) && !wanted) setWanted(true);
  return wanted ? <Suspense fallback={null}>{children}</Suspense> : null;
}

/**
 * Taps on the header's switcher, search and menu buttons made before hydration (when React has
 * not attached its handlers yet) are remembered here, during HTML parsing, and replayed once the
 * shell has hydrated (A-09: early taps took no effect).
 */
const EARLY_TAP_SCRIPT = `(function(){try{document.addEventListener('click',function(e){if(window.__maHydrated)return;var t=e.target&&e.target.closest?e.target.closest('[data-early-overlay]'):null;if(t)window.__maEarlyOverlay=t.getAttribute('data-early-overlay')},true)}catch(e){}})()`;

type EarlyWindow = Window & { __maHydrated?: boolean; __maEarlyOverlay?: string };

function EarlyTapCapture() {
  return (
    <script
      suppressHydrationWarning
      // Plain text on the client: React never creates a script element after hydration.
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      dangerouslySetInnerHTML={{ __html: EARLY_TAP_SCRIPT }}
    />
  );
}

/**
 * Close any overlay when the route changes: state survives navigation in this version of Next.js.
 * Only on a real change of path: this mounts late (inside Suspense), and closing on mount shut
 * the switcher or menu a visitor had opened with an early tap (A-09).
 */
function CloseOnNavigation() {
  const pathname = usePathname();
  const seen = useRef(pathname);
  useEffect(() => {
    if (seen.current === pathname) return;
    seen.current = pathname;
    closeOverlay();
  }, [pathname]);
  return null;
}

/**
 * Everything global and transient, mounted once by the root layout: the airport switcher, the
 * search palette, the concierge panel, the display settings and the menu, plus the keyboard
 * shortcut (Ctrl or Cmd + K opens search) and the cross-tab preference sync.
 */
export function GlobalOverlays() {
  usePreferencesSync();
  // Only the search palette's state: opening another overlay does not re-render every panel (A-09).
  const searchOpen = useOverlayOpen('search');
  const [paletteWanted, setPaletteWanted] = useState(false);
  if (searchOpen && !paletteWanted) setPaletteWanted(true);
  // Set once the overlay modules have loaded in idle time; they then mount closed, as before.
  const [idleReady, setIdleReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void Promise.all([loadSwitcher(), loadPanels(), loadConcierge()]).then(() => {
        if (!cancelled) setIdleReady(true);
      });
    };
    const idle = typeof window.requestIdleCallback === 'function';
    const handle = idle ? window.requestIdleCallback(load, { timeout: 4000 }) : window.setTimeout(load, 2000);
    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  useEffect(() => {
    const early = window as EarlyWindow;
    early.__maHydrated = true;
    const tapped = early.__maEarlyOverlay;
    delete early.__maEarlyOverlay;
    if (tapped === 'airport' || tapped === 'menu' || tapped === 'search') openOverlay(tapped);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      // Only Ctrl or Cmd + K: a single-key shortcut ("/") cannot be turned off, so it was removed
      // (WCAG 2.1.4 Character Key Shortcuts).
      const commandK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;
      if (!commandK) return;
      event.preventDefault();
      openOverlay('search');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <EarlyTapCapture />
      <Deferred name="airport" ready={idleReady}>
        <AirportSwitcherDialog />
      </Deferred>
      <Deferred name="preferences" ready={idleReady}>
        <PreferencesPanel />
      </Deferred>
      <Deferred name="menu" ready={idleReady}>
        <MenuPanel />
      </Deferred>
      <Deferred name="concierge" ready={idleReady}>
        <ConciergePanel />
      </Deferred>
      {paletteWanted ? (
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      ) : null}
      <Suspense fallback={null}>
        <CloseOnNavigation />
        <RouteFocus />
      </Suspense>
    </>
  );
}
