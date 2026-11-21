import { describe, expect, it } from 'vitest';
import { createDemoProvider } from '@/lib/providers';
import { zonedDateTime } from '@/lib/time';
import { identifyFlight } from './identify-flight';
import { flightIdentity } from './flight-identity';

/*
 * Round 5 (E-01): the flight page renders the flight's identity on the server, before the feed
 * answers, and the status follows on the client. That is only honest if the identity never
 * depends on the time it is read: check every picked field against snapshots taken across the day
 * and the evening before, for every departure and arrival at two airports.
 */
const ZONE = 'Asia/Kuala_Lumpur';
const DATE = '2026-11-18';
const INSTANTS = [
  zonedDateTime('2026-11-17', 20 * 60, ZONE),
  zonedDateTime(DATE, 0, ZONE),
  zonedDateTime(DATE, 5 * 60 + 30, ZONE),
  zonedDateTime(DATE, 9 * 60 + 40, ZONE),
  zonedDateTime(DATE, 15 * 60, ZONE),
  zonedDateTime(DATE, 23 * 60 + 30, ZONE),
  zonedDateTime('2026-11-19', 6 * 60, ZONE),
];

describe('flight identity (round 5, server-rendered before the feed)', () => {
  for (const airport of ['kul', 'pen']) {
    it(`is the same at every instant for every flight at ${airport}`, () => {
      const base = createDemoProvider(zonedDateTime(DATE, 12 * 60, ZONE));
      const flights = (['d', 'a'] as const).flatMap((direction) =>
        base.listFlightsSync({ airport, direction, from: zonedDateTime(DATE, 0, ZONE), to: zonedDateTime(DATE, 24 * 60 - 1, ZONE) }),
      );
      expect(flights.length).toBeGreaterThan(20);
      for (const instant of INSTANTS) {
        const provider = createDemoProvider(instant);
        for (const flight of flights) {
          const later = provider.getFlightSync(flight.id, airport);
          expect(later, flight.id).not.toBeNull();
          expect(flightIdentity(later!), `${flight.id} at ${instant.toISOString()}`).toEqual(flightIdentity(flight));
        }
      }
    });
  }

  it('is what the server resolves from the id alone', () => {
    const provider = createDemoProvider(zonedDateTime(DATE, 9 * 60 + 40, ZONE));
    const [flight] = provider.listFlightsSync({ airport: 'kul', direction: 'd', from: zonedDateTime(DATE, 6 * 60, ZONE), to: zonedDateTime(DATE, 8 * 60, ZONE) });
    const server = identifyFlight(flight.id, 'kul');
    expect(server).not.toBeNull();
    expect(flightIdentity(server!)).toEqual(flightIdentity(flight));
    // A plain object: it crosses the server-client boundary as a prop.
    expect(JSON.parse(JSON.stringify(flightIdentity(server!)))).toEqual(flightIdentity(server!));
  });
});
