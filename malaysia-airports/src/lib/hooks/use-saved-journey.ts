'use client';

import { useCallback, useMemo } from 'react';
import { EMPTY_SAVED_JOURNEY, savedJourneyStore, type ParkedCarNote, type SavedFlight, type SavedJourney, type SavedPlace } from '@/lib/stores';
import { useHydrated, useStore } from './use-store';

/** What `useSavedJourney` returns. Every action is meant to be called from an event handler. */
export interface SavedJourneyValue {
  journey: SavedJourney;
  /** Save a flight (replaces an existing entry with the same id). `savedAt` is stamped for you. */
  saveFlight: (flight: Omit<SavedFlight, 'savedAt'>) => void;
  removeFlight: (id: string) => void;
  isFlightSaved: (id: string) => boolean;
  /** Save a place (replaces an existing entry with the same type and id). */
  savePlace: (place: Omit<SavedPlace, 'savedAt'>) => void;
  removePlace: (type: SavedPlace['type'], id: string) => void;
  isPlaceSaved: (type: SavedPlace['type'], id: string) => boolean;
  /** Save or replace the parked-car note. `savedAt` is stamped for you. */
  setParkedCar: (note: Omit<ParkedCarNote, 'savedAt'>) => void;
  clearParkedCar: () => void;
  /** Remove everything saved. */
  clearAll: () => void;
  /** False until the stored value has been read after hydration. */
  hydrated: boolean;
}

// Called from event handlers only, never during render.
const stamp = (): string => new Date().toISOString();

/**
 * "My journey": saved flights, saved places and the parked-car note, kept in `localStorage`
 * on this device only. Flights store identifiers; look their status up fresh from the provider.
 */
export function useSavedJourney(): SavedJourneyValue {
  const journey = useStore(savedJourneyStore);
  const hydrated = useHydrated();

  const saveFlight = useCallback((flight: Omit<SavedFlight, 'savedAt'>) => {
    savedJourneyStore.set((current) => ({
      ...current,
      flights: [{ ...flight, savedAt: stamp() }, ...current.flights.filter((item) => item.id !== flight.id)].slice(0, 20),
    }));
  }, []);
  const removeFlight = useCallback((id: string) => {
    savedJourneyStore.set((current) => ({ ...current, flights: current.flights.filter((item) => item.id !== id) }));
  }, []);
  const savePlace = useCallback((place: Omit<SavedPlace, 'savedAt'>) => {
    savedJourneyStore.set((current) => ({
      ...current,
      places: [
        { ...place, savedAt: stamp() },
        ...current.places.filter((item) => !(item.type === place.type && item.id === place.id)),
      ].slice(0, 50),
    }));
  }, []);
  const removePlace = useCallback((type: SavedPlace['type'], id: string) => {
    savedJourneyStore.set((current) => ({
      ...current,
      places: current.places.filter((item) => !(item.type === type && item.id === id)),
    }));
  }, []);
  const setParkedCar = useCallback((note: Omit<ParkedCarNote, 'savedAt'>) => {
    savedJourneyStore.set((current) => ({ ...current, parkedCar: { ...note, savedAt: stamp() } }));
  }, []);
  const clearParkedCar = useCallback(() => {
    savedJourneyStore.set((current) => ({ ...current, parkedCar: null }));
  }, []);
  const clearAll = useCallback(() => savedJourneyStore.set(EMPTY_SAVED_JOURNEY), []);

  return useMemo(
    () => ({
      journey,
      saveFlight,
      removeFlight,
      isFlightSaved: (id: string) => journey.flights.some((item) => item.id === id),
      savePlace,
      removePlace,
      isPlaceSaved: (type: SavedPlace['type'], id: string) => journey.places.some((item) => item.type === type && item.id === id),
      setParkedCar,
      clearParkedCar,
      clearAll,
      hydrated,
    }),
    [journey, saveFlight, removeFlight, savePlace, removePlace, setParkedCar, clearParkedCar, clearAll, hydrated],
  );
}
