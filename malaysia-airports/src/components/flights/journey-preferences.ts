'use client';

import { useMemo } from 'react';
import type { Flight } from '@/lib/flights';
import type { JourneyPreferences } from '@/lib/journey';
import type { JourneyMode } from '@/lib/journey/modes';
import { useTripOptions } from '@/lib/journey/trip-options';
import { needsToPreferences, useNeeds } from '@/lib/needs';

/*
 * Split from `journey-timeline.tsx` in round 5 (E-03): the flight page needs these two for its
 * summary before the timeline itself, which now loads after the first paint.
 */

/**
 * The visitor's needs (`ma:needs:v1`) and trip options (`ma:trip-options:v1`) as journey
 * preferences. Both callers of `buildJourney` (flight page, My journey) use it (B-11, B-13).
 */
export function useJourneyPreferences(): JourneyPreferences {
  const { needs } = useNeeds();
  const { options } = useTripOptions();
  return useMemo(
    () => ({ ...needsToPreferences(needs), handLuggageOnly: options.handLuggageOnly, loungeAccess: options.loungeAccess }),
    [needs, options.handLuggageOnly, options.loungeAccess],
  );
}

/** The journey modes that make sense for a flight: a departure is a departure; an arrival can be met or connected from. */
export function modesForFlight(flight: Pick<Flight, 'direction'>): JourneyMode[] {
  return flight.direction === 'd' ? ['departing'] : ['arriving', 'meeting', 'transiting'];
}
