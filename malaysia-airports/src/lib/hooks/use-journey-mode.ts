'use client';

import { useCallback, useMemo } from 'react';
import { DEFAULT_JOURNEY_MODE, type JourneyMode } from '@/lib/journey/modes';
import { journeyModeStore } from '@/lib/stores';
import { useHydrated, useStore } from './use-store';

/** What `useJourneyMode` returns. */
export interface JourneyModeValue {
  /** The mode the user picked, or `null` when they have not picked one. */
  mode: JourneyMode | null;
  /** The mode to order content by: the picked mode, or `departing` by default. */
  effectiveMode: JourneyMode;
  set: (mode: JourneyMode) => void;
  clear: () => void;
  /** False until the stored value has been read after hydration. */
  hydrated: boolean;
}

/** The journey mode (departing, arriving, transiting, meeting) that reorders actions and content. */
export function useJourneyMode(): JourneyModeValue {
  const mode = useStore(journeyModeStore);
  const hydrated = useHydrated();
  const set = useCallback((next: JourneyMode) => journeyModeStore.set(next), []);
  const clear = useCallback(() => journeyModeStore.clear(), []);
  return useMemo(
    () => ({ mode, effectiveMode: mode ?? DEFAULT_JOURNEY_MODE, set, clear, hydrated }),
    [mode, set, clear, hydrated],
  );
}
