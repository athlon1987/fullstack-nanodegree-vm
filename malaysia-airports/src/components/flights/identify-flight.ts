/**
 * Who a flight id refers to, without reading the clock. The demo timetable is the same every
 * day, so the flight's identity (airline, number, route, scheduled time, terminal) can be
 * resolved on the server from the id alone. Its status depends on the current time and is
 * computed on the client.
 */
import { getAirport } from '@/content/airports';
import { decodeFlightId, formatFlightNumber, type Flight } from '@/lib/flights';
import type { Translator } from '@/lib/i18n/translate';
import { createDemoProvider, hasDemoRoutes } from '@/lib/providers';
import { zonedDateTime } from '@/lib/time';

/** The flight an id names at an airport, or `null` when the id is malformed or no such flight runs that day. */
export function identifyFlight(id: string, airportSlug: string): Flight | null {
  const parts = decodeFlightId(id);
  const airport = getAirport(airportSlug);
  if (!parts || !airport || !hasDemoRoutes(airport.slug)) return null;
  // A fixed instant on the flight's own date: only the identity fields are read from this snapshot.
  const provider = createDemoProvider(zonedDateTime(parts.date, 12 * 60, airport.timezone));
  return provider.getFlightSync(id, airport.slug);
}

/** "MH 2610 to London" or "MH 2611 from London". */
export function flightTitle(flight: Flight, t: Translator): string {
  const number = formatFlightNumber(flight);
  return flight.direction === 'd'
    ? t('flightPages.detail.titleDeparture', { number, city: flight.destination.city })
    : t('flightPages.detail.titleArrival', { number, city: flight.origin.city });
}
