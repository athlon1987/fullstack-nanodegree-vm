'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';

interface AirportChromeProps {
  /** The full airport banner: only on the overview. */
  full: ReactNode;
  /** The one-row airport bar: every section page. */
  compact: ReactNode;
}

function ChromeForSegment({ full, compact }: AirportChromeProps) {
  // `null` is the airport overview itself (`/[lang]/[airport]`).
  return <>{useSelectedLayoutSegment() === null ? full : compact}</>;
}

/**
 * Chooses the airport chrome for the page on screen. Both variants are rendered on the server
 * and passed in, so this only adds the route check. On prerendered routes the segment is known
 * at build time; where it is not (a flight page), the compact bar is the right fallback anyway.
 */
export function AirportChrome(props: AirportChromeProps) {
  return (
    <Suspense fallback={props.compact}>
      <ChromeForSegment {...props} />
    </Suspense>
  );
}
