import { describe, expect, it } from 'vitest';
import { FLIGHTS_DEFAULT_LIMIT, FLIGHTS_MAX_LIMIT, buildHealth, handleFlightsQuery, isMonitoringRequest, publicHealth, type ApiErrorResponse, type FlightsApiResponse } from './api';

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
    expect(ok('airport=kul&date=2026-11-18&limit=3').flights.every((flight) => flight.date === '2026-11-18')).toBe(true);
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

describe('API hygiene (security-15)', () => {
  it('bounds date to yesterday through the day after tomorrow, Malaysian time', () => {
    expect(ok('airport=kul&date=2026-11-16').query.date).toBe('2026-11-16');
    expect(ok('airport=kul&date=2026-11-19').query.date).toBe('2026-11-19');
    for (const date of ['2026-11-15', '2026-11-20', '1900-01-01', '9999-12-31']) {
      expect(bad(`airport=kul&date=${date}`).error.issues[0]).toMatchObject({ field: 'date', message: 'date must be between 2026-11-16 and 2026-11-19' });
    }
  });

  it('rejects repeated parameters, even when one is empty', () => {
    expect(bad('airport=kul&airport=pen').error.issues).toEqual([{ field: 'airport', message: 'airport is repeated' }]);
    expect(bad('airport=kul&q=&q=MH').error.issues[0].field).toBe('q');
  });
});

describe('GET /api/health payload', () => {
  it('tells the public only the status and the build (security-11)', () => {
    expect(publicHealth('202611210110')).toEqual({ status: 'ok', build: '202611210110' });
    expect(publicHealth(undefined)).toEqual({ status: 'ok', build: 'unversioned' });
    expect(publicHealth('<script>')).toEqual({ status: 'ok', build: 'unversioned' });
    const token = 'a-long-monitoring-token-123';
    expect(isMonitoringRequest(`Bearer ${token}`, token)).toBe(true);
    expect(isMonitoringRequest('Bearer wrong-token-of-length-27', token)).toBe(false);
    expect(isMonitoringRequest(`Bearer ${token}`, undefined)).toBe(false);
    expect(isMonitoringRequest(`Bearer short`, 'short')).toBe(false);
    expect(isMonitoringRequest(null, token)).toBe(false);
  });

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
