'use client';

import { lazy, Suspense, type ComponentProps } from 'react';
import { retryingImport } from '@/lib/retrying-import';

/**
 * Redesign 1c (verification SA5 item 1): the overview's tools below the fold (journey modes, quick
 * actions, board preview) are code-split, like the home's lower sections
 * (`src/components/home/lazy-sections.tsx`): the server still renders them into the static HTML,
 * and their script arrives during hydration instead of with the first-load scripts. A chunk that
 * cannot be fetched waits and is fetched again (`retryingImport`); the HTML stays meanwhile.
 */
const AirportFlightToolsChunk = lazy(() => retryingImport(() => import('./airport-flight-tools')).then((module) => ({ default: module.AirportFlightTools })));

export function LazyAirportFlightTools(props: ComponentProps<(typeof import('./airport-flight-tools'))['AirportFlightTools']>) {
  return (
    <Suspense fallback={null}>
      <AirportFlightToolsChunk {...props} />
    </Suspense>
  );
}
