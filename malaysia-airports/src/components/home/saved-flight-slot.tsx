'use client';

import { Suspense, lazy } from 'react';
import { cn } from '@/lib/cn';
import { useSavedJourney } from '@/lib/hooks';

// The card brings the journey builder with it: only visitors with a saved flight download it.
const SavedFlightCard = lazy(() => import('./saved-flight-card').then((module) => ({ default: module.SavedFlightCard })));

/**
 * Sets `data-saved-flight` on `<html>` before first paint when this device has a saved flight
 * dated today or later, so the slot below reserves the card's height in the server HTML and the
 * page does not shift when the card appears (A-08). Kept tiny and defensive: storage can throw.
 */
export const SAVED_FLIGHT_FLAG_SCRIPT = `(function(){try{var j=JSON.parse(localStorage.getItem('ma:journey:v1')||'null');var f=j&&j.flights;if(!f||!f.length)return;var d=new Date(Date.now()+8*3600000).toISOString().slice(0,10);for(var i=0;i<f.length;i++){if(f[i]&&f[i].date>=d){document.documentElement.setAttribute('data-saved-flight','');return}}}catch(e){}})()`;

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
        <Suspense fallback={<div aria-hidden="true" className="saved-flight-size rounded-lg border border-line-strong bg-surface" />}>
          <SavedFlightCard flights={journey.flights} />
        </Suspense>
      ) : null}
    </div>
  );
}
