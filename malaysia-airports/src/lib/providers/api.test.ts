import { describe, expect, it } from 'vitest';
import { FLIGHTS_DEFAULT_LIMIT, FLIGHTS_MAX_LIMIT, buildHealth, handleFlightsQuery, type ApiErrorResponse, type FlightsApiResponse } from './api';

const NOW = new Date('2026-11-17T06:30:00Z');
const run = (query: string) => handleFlightsQuery(new URLSearchParams(query), NOW);
const ok = (query: string): FlightsApiResponse => {
  const result = run(query);
  expect(result.status).toBe(200);
  return result.body as FlightsApiResponse;
};
const bad = (query: string): ApiErrorResponse => {
  const result = run(query);
  expect(result.status).toBe(400);
  return result.body as ApiErrorResponse;
};

describe('GET /api/flights handler', () => {
  it('returns demo flights with provider meta', () => {
    const body = ok('airport=kul&direction=d');
    expect(body.meta.mode).toBe('demo');
    expect(body.flights).toHaveLength(FLIGHTS_DEFAULT_LIMIT);
    expect(body.count).toBe(body.flights.length);
    expect(body.flights.every((flight) => flight.isDemo && flight.direction === 'd' && flight.airport === 'kul')).toBe(true);
    expect(body.query).toEqual({ airport: 'kul', direction: 'd', limit: FLIGHTS_DEFAULT_LIMIT });
  });

  it('treats empty parameters as absent and defaults to departures', () => {
    const body = ok('airport=KUL&direction=&q=&terminal=&limit=');
    expect(body.query).toEqual({ airport: 'kul', direction: 'd', limit: FLIGHTS_DEFAULT_LIMIT });
  });

  it('applies terminal, search and arrivals', () => {
    const t2 = ok('airport=kul&direction=a&terminal=T2&limit=10');
    expect(t2.flights).toHaveLength(10);
    expect(t2.flights.every((flight) => flight.terminal === 'T2' && flight.direction === 'a')).toBe(true);
    const london = ok('airport=kul&q=london');
    expect(london.flights.length).toBeGreaterThan(0);
    expect(london.flights.every((flight) => flight.destination.city === 'London')).toBe(true);
    expect(ok('airport=kul&date=2026-12-01&limit=3').flights.every((flight) => flight.date === '2026-12-01')).toBe(true);
  });

  it('caps the limit instead of failing', () => {
    const body = ok('airport=kul&limit=99999');
    expect(body.query.limit).toBe(FLIGHTS_MAX_LIMIT);
    expect(body.flights.length).toBeLessThanOrEqual(FLIGHTS_MAX_LIMIT);
  });

  it('rejects missing or unknown airports with a clear message', () => {
    expect(bad('direction=d').error.issues[0]).toMatchObject({ field: 'airport' });
    expect(bad('airport=jhb').error.issues[0]).toEqual({ field: 'airport', message: 'Unknown airport' });
  });

  it('rejects invalid direction, limit, date and terminals the airport does not have', () => {
    expect(bad('airport=kul&direction=x').error.issues[0].field).toBe('direction');
    expect(bad('airport=kul&limit=0').error.issues[0].field).toBe('limit');
    expect(bad('airport=kul&limit=abc').error.issues[0].field).toBe('limit');
    expect(bad('airport=kul&date=17-11-2026').error.issues[0].field).toBe('date');
    expect(bad('airport=pen&terminal=T2').error.issues[0]).toEqual({ field: 'terminal', message: 'PEN has terminals: MAIN' });
    expect(bad(`airport=kul&q=${'x'.repeat(200)}`).error.code).toBe('invalid_request');
  });

  it('returns an empty list, not an error, for an airport without demo flights', () => {
    expect(ok('airport=bbn').flights).toEqual([]);
  });
});

describe('GET /api/health payload', () => {
  it('reports provider modes and build information', () => {
    const health = buildHealth(NOW, { NODE_ENV: 'test', GIT_COMMIT: 'abc123' });
    expect(health.status).toBe('ok');
    expect(health.time).toBe('2026-11-17T14:30:00+08:00');
    expect(Object.values(health.providers).map((provider) => provider.mode)).toEqual(['demo', 'demo', 'demo']);
    expect(health.build).toMatchObject({ name: 'malaysia-airports', environment: 'test', commit: 'abc123' });
    expect(health.demoAirports).toBe(6);
    expect(buildHealth(NOW).build.commit).toBeNull();
  });
});
