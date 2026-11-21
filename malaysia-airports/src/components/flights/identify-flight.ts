/**
 * Who a flight id refers to, without reading the clock. The demo timetable is the same every
 * day, so the flight's identity (airline, number, route, scheduled time, terminal) can be
 * resolved on the server from the id alone. Its status depends on the current time and is
 * computed on the client.
 *
 * Server only (round 3, E-03): it runs the demo generator. Client Components take the title from
 * `flight-title.ts`, which imported from here used to put the generator in the journey and flight
 * pages' JavaScript.
 */
import 'server-only';
import { getAirport } from '@/content/airports';
import { decodeFlightId, type Flight } from '@/lib/flights';
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
