'use client';

import { useCallback, useMemo } from 'react';
import { findAirportChoice, getAirport, type AirportChoice, type AirportSelection } from '@/content/airports';
import type { Airport } from '@/content/types';
import { airportStore } from '@/lib/stores';
import { useHydrated, useStore } from './use-store';

/** What `useAirportContext` returns. */
export interface AirportContextValue {
  /** The remembered choice, or `null` when the user has not chosen (no airport is assumed). */
  selection: AirportSelection | null;
  /** The registry record for the remembered airport. */
  airport: Airport | undefined;
  /** The matching airport switcher row (KLIA Terminal 1 and 2 are separate rows). */
  choice: AirportChoice | undefined;
  /** Remember an airport (and terminal at KLIA). Unknown airports are ignored. */
  set: (selection: AirportSelection) => void;
  /** Forget the remembered airport. */
  clear: () => void;
  /** False until the stored value has been read after hydration. */
  hydrated: boolean;
}

/**
 * The user's remembered airport and terminal. Nothing is assumed: `selection` is `null` until
 * the user picks an airport, and it is offered as a default they can change in one tap.
 */
export function useAirportContext(): AirportContextValue {
  const selection = useStore(airportStore);
  const hydrated = useHydrated();
  const set = useCallback((next: AirportSelection) => {
    const airport = getAirport(next.airport);
    if (!airport) return;
    const terminal = airport.terminals.length > 1 ? next.terminal : undefined;
    airportStore.set(terminal ? { airport: airport.slug, terminal } : { airport: airport.slug });
  }, []);
  const clear = useCallback(() => airportStore.clear(), []);
  return useMemo(
    () => ({
      selection,
      airport: selection ? getAirport(selection.airport) : undefined,
      choice: findAirportChoice(selection),
      set,
      clear,
      hydrated,
    }),
    [selection, set, clear, hydrated],
  );
}
