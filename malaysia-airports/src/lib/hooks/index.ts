'use client';

/**
 * Client hooks for device-local state and time. All are hydration-safe: on the server and
 * during hydration they return defaults (`null` for the clock), then update without a mismatch.
 */
export { useStore, useHydrated } from './use-store';
export { useNow } from './use-now';
export { useFlightProvider } from './use-flight-provider';
export { useAirportContext, type AirportContextValue } from './use-airport-context';
export { useJourneyMode, type JourneyModeValue } from './use-journey-mode';
export { useSavedJourney, type SavedJourneyValue } from './use-saved-journey';
export { usePreferences, usePreferencesSync, type PreferencesValue } from './use-preferences';
