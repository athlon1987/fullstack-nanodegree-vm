'use client';

import { SAVED_FLIGHT_FLAG_SCRIPT } from '@/lib/inline-scripts';
import { Suspense } from 'react';
import { cn } from '@/lib/cn';
import { useSavedJourney } from '@/lib/hooks';
import { retryableLazy } from '@/lib/retrying-import';
import { PartBoundary, PartLoading } from '@/components/common/part-boundary';

// The card brings the journey builder with it: only visitors with a saved flight download it.
// Round 6 (review-3 9.1 item 1): a fetch that fails waits for the connection instead of replacing
// the home with "Something went wrong"; an error inside the card stays in the card.
const SavedFlightCard = retryableLazy(() => import('./saved-flight-card').then((module) => module.SavedFlightCard));

/**
 * Runs `SAVED_FLIGHT_FLAG_SCRIPT` during HTML parsing. Rendered as plain text on the client so
 * React never creates a script element after hydration (Next.js notes, section 4).
 */
export function SavedFlightFlag() {
  return (
    <script
      suppressHydrationWarning
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      dangerouslySetInnerHTML={{ __html: SAVED_FLIGHT_FLAG_SCRIPT }}
    />
  );
}

/**
 * Where the visitor's saved flight appears on the home first screen, above the journey modes.
 * Without a saved flight it renders nothing and takes no space.
 */
export function SavedFlightSlot({ className }: { className?: string }) {
  const { journey, hydrated } = useSavedJourney();
  const has = hydrated && journey.flights.length > 0;
  return (
    <div data-saved-flight-slot="" className={cn('empty:hidden', className)}>
      {has ? (
        <PartBoundary onRetry={SavedFlightCard.renew} className="saved-flight-size">
          <Suspense
            fallback={
              <PartLoading className="saved-flight-size">
                <div aria-hidden="true" className="saved-flight-size rounded-2xl border border-[rgb(255_255_255/0.4)] bg-surface shadow-lg" />
              </PartLoading>
            }
          >
            <SavedFlightCard flights={journey.flights} />
          </Suspense>
        </PartBoundary>
      ) : null}
    </div>
  );
}
