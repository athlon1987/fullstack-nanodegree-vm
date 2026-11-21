/**
 * Two remembered trip options that change the departing timeline (ux-frequent-13), kept on this
 * device only (`ma:trip-options:v1`):
 *  - `handLuggageOnly`: no bags to drop, so check-in can be done online and the arrive-by time
 *    moves later (estimated, never past the airline's check-in close);
 *  - `loungeAccess`: business class or a lounge pass, so the timeline suggests the lounge
 *    nearest the gate.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { check, createStore, validator } from '@/lib/storage';

export interface TripOptions {
  handLuggageOnly: boolean;
  loungeAccess: boolean;
}

export const DEFAULT_TRIP_OPTIONS: TripOptions = { handLuggageOnly: false, loungeAccess: false };

export const tripOptionsStore = createStore<TripOptions>({
  name: 'trip-options',
  version: 1,
  // zod-free validation (round 2, E-03): zod left the JavaScript of every page.
  schema: validator(check.object({ handLuggageOnly: check.boolean(), loungeAccess: check.boolean() })),
  defaultValue: DEFAULT_TRIP_OPTIONS,
});

/** Read and change the trip options. */
export function useTripOptions(): { options: TripOptions; setOption: (key: keyof TripOptions, on: boolean) => void } {
  const options = useSyncExternalStore(tripOptionsStore.subscribe, tripOptionsStore.getSnapshot, tripOptionsStore.getServerSnapshot);
  const setOption = useCallback((key: keyof TripOptions, on: boolean) => tripOptionsStore.set((current) => ({ ...current, [key]: on })), []);
  return { options, setOption };
}
