'use client';

import { usePathname } from 'next/navigation';
import { Suspense, lazy, useEffect, useState } from 'react';
import { usePreferencesSync } from '@/lib/hooks';
import { ConciergePanel } from '@/components/concierge/concierge-panel';
import { AirportSwitcherDialog } from './airport-switcher';
import { closeOverlay, openOverlay, useOverlayState } from './overlay-store';
import { MenuPanel, PreferencesPanel } from './panels';

// The palette brings the search engine with it: load it the first time it is opened.
const CommandPalette = lazy(() => import('@/components/search/command-palette').then((module) => ({ default: module.CommandPalette })));

const isEditable = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** Close any overlay when the route changes: state survives navigation in this version of Next.js. */
function CloseOnNavigation() {
  const pathname = usePathname();
  useEffect(() => {
    closeOverlay();
  }, [pathname]);
  return null;
}

/**
 * Everything global and transient, mounted once by the root layout: the airport switcher, the
 * search palette, the concierge panel, the display settings and the menu, plus the keyboard
 * shortcuts (`/` and Ctrl or Cmd + K open search) and the cross-tab preference sync.
 */
export function GlobalOverlays() {
  usePreferencesSync();
  const { open } = useOverlayState();
  const [paletteWanted, setPaletteWanted] = useState(false);
  if (open === 'search' && !paletteWanted) setPaletteWanted(true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const commandK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;
      const slash = event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isEditable(event.target);
      if (!commandK && !slash) return;
      event.preventDefault();
      openOverlay('search');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
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
      </Suspense>
    </>
  );
}
