'use client';

import { usePathname } from 'next/navigation';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { usePreferencesSync } from '@/lib/hooks';
import { ConciergePanel } from '@/components/concierge/concierge-panel';
import { AirportSwitcherDialog } from './airport-switcher';
import { closeOverlay, openOverlay, useOverlayOpen } from './overlay-store';
import { MenuPanel, PreferencesPanel } from './panels';
import { RouteFocus } from './route-focus';

// The palette brings the search engine with it: load it the first time it is opened.
const CommandPalette = lazy(() => import('@/components/search/command-palette').then((module) => ({ default: module.CommandPalette })));

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
      <AirportSwitcherDialog />
      <PreferencesPanel />
      <MenuPanel />
      <ConciergePanel />
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
