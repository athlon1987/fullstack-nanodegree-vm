'use client';

/**
 * Departures or arrivals, shared by the flight search box, the board preview and the journey
 * modes. The journey mode sets the default (departing and transiting show departures; arriving
 * and meeting show arrivals); the visitor can override it with the Departures/Arrivals switch
 * until they pick another mode.
 */
import { useSyncExternalStore } from 'react';
import type { FlightDirection } from '@/lib/flights';
import { useJourneyMode } from '@/lib/hooks/use-journey-mode';
import type { JourneyMode } from '@/lib/journey/modes';

/** The board a journey mode starts with. */
export function directionForMode(mode: JourneyMode): FlightDirection {
  return mode === 'arriving' || mode === 'meeting' ? 'a' : 'd';
}

let override: FlightDirection | null = null;
const listeners = new Set<() => void>();

function emit(next: FlightDirection | null): void {
  override = next;
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Choose departures or arrivals by hand. */
export function setFlightDirection(direction: FlightDirection): void {
  emit(direction);
}

/** Go back to the direction the journey mode implies (call it when the mode changes). */
export function resetFlightDirection(): void {
  emit(null);
}

/** The current direction and how to change it. */
export function useFlightDirection(): { direction: FlightDirection; setDirection: (direction: FlightDirection) => void } {
  const { effectiveMode } = useJourneyMode();
  const chosen = useSyncExternalStore(
    subscribe,
    () => override,
    () => null,
  );
  return { direction: chosen ?? directionForMode(effectiveMode), setDirection: setFlightDirection };
}
