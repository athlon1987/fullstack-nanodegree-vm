/**
 * "My needs": what kind of help a traveller wants the journey to plan for, kept on this device
 * only (`ma:needs:v1`), without an account. Nothing here is sent anywhere.
 *
 * The journey timeline reads it through `needsToPreferences()`: any need adds the assistance
 * step with the operating airline's notice period and the airport's service, and the mobility
 * needs switch map links to step-free routes (`sf=1`).
 *
 * @example
 * const { needs, setNeed } = useNeeds();
 * const steps = buildJourney({ flight, mode, airportContent, now, preferences: needsToPreferences(needs) });
 */
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { createStore } from '@/lib/storage';

/** Needs a traveller can choose. Order is the order the control shows them in. */
export const TRAVELLER_NEEDS = ['wheelchair', 'step-free', 'older', 'companion'] as const;
export type TravellerNeed = (typeof TRAVELLER_NEEDS)[number];

/** Needs that call for step-free routes on the map. */
export const MOBILITY_NEEDS: readonly TravellerNeed[] = ['wheelchair', 'step-free'];

export function isTravellerNeed(value: unknown): value is TravellerNeed {
  return typeof value === 'string' && (TRAVELLER_NEEDS as readonly string[]).includes(value);
}

/** The chosen needs (`ma:needs:v1`). */
export const needsStore = createStore<TravellerNeed[]>({
  name: 'needs',
  version: 1,
  schema: z.array(z.enum(TRAVELLER_NEEDS)).max(TRAVELLER_NEEDS.length),
  defaultValue: [],
});

/** The journey preferences that follow from a set of needs. */
export function needsToPreferences(needs: readonly TravellerNeed[]): { needs: TravellerNeed[]; reducedMobility: boolean; stepFree: boolean } {
  const list = TRAVELLER_NEEDS.filter((need) => needs.includes(need));
  return { needs: list, reducedMobility: list.length > 0, stepFree: list.some((need) => MOBILITY_NEEDS.includes(need)) };
}

/** Read and change the needs. `hydrated` is false until storage has been read in the browser. */
export function useNeeds(): { needs: readonly TravellerNeed[]; setNeed: (need: TravellerNeed, on: boolean) => void; clear: () => void } {
  const list = useSyncExternalStore(needsStore.subscribe, needsStore.getSnapshot, needsStore.getServerSnapshot);
  const setNeed = useCallback((need: TravellerNeed, on: boolean) => {
    needsStore.set((current) => TRAVELLER_NEEDS.filter((item) => (item === need ? on : current.includes(item))));
  }, []);
  const clear = useCallback(() => needsStore.clear(), []);
  return useMemo(() => ({ needs: list, setNeed, clear }), [list, setNeed, clear]);
}
