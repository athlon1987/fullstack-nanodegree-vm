/**
 * Which flights a board preview shows (home and airport overview). Pure, so it is unit tested.
 */
import { isFinalStatus, sortFlights, type Flight } from '@/lib/flights';

/** Departures leave the preview this many minutes before they are due: nobody can still catch them. */
export const PREVIEW_LEAD_MINUTES = 15;

/** Statuses a departure preview never leads with: the gate is shut or the flight has gone. */
const CLOSED_DEPARTURE = new Set<Flight['status']>(['gate-closed', 'departed', 'cancelled']);

/**
 * The next `rows` flights worth showing (A-20):
 * - departures due at least 15 minutes from now, never gate-closed, departed or cancelled;
 * - arrivals that have not finished (landed flights still on the belt stay: people meet them);
 * - sorted by the latest expected time.
 * When a quiet board has fewer than `rows` such flights, the list is simply shorter: the preview
 * never pads itself with flights that can no longer be caught.
 */
export function previewFlights(flights: readonly Flight[], now: number, rows: number): Flight[] {
  const earliest = now + PREVIEW_LEAD_MINUTES * 60_000;
  const open = flights.filter((flight) => {
    if (flight.direction === 'd') return !CLOSED_DEPARTURE.has(flight.status) && Date.parse(flight.estimated) >= earliest;
    return !isFinalStatus(flight.status);
  });
  return sortFlights(open, 'estimated').slice(0, rows);
}
