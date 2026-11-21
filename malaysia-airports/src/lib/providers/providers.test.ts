import { describe, expect, it } from 'vitest';
import { decodeFlightId } from '@/lib/flights/id';
import { isInternationalFlight } from '@/lib/flights/query';
import type { DemoFlight, FlightStatus } from '@/lib/flights/types';
import { addMinutes } from '@/lib/time';
import { DEMO_ROUTES } from './demo-routes';
import { hashString, mulberry32, seededRandom } from './random';
import {
  DEMO_AIRPORT_SLUGS,
  DemoFlightProvider,
  DemoParkingAvailabilityProvider,
  DemoWaitTimeProvider,
  OfficialFlightProvider,
  PROVIDER_MODES,
  ProviderNotConfiguredError,
  boardWindow,
  buildDemoTimetable,
  createDemoProvider,
  demoBusyness,
  demoFlightsForDate,
  getFlightProvider,
  hasDemoRoutes,
  toOfficialParams,
  type FlightDataProvider,
} from './index';

const DATE = '2026-11-17';
const AFTERNOON = new Date('2026-11-17T06:30:00Z'); // 14:30 in Malaysia
const NEXT_MORNING = new Date('2026-11-18T04:00:00Z'); // every flight of the 17th is over

/** Status of one flight as seen `minutes` relative to its scheduled time. */
function statusAt(flight: DemoFlight, minutes: number): DemoFlight {
  const seen = new DemoFlightProvider(addMinutes(flight.scheduled, minutes)).getFlightSync(flight.id, flight.airport);
  if (!seen) throw new Error(`Flight ${flight.id} disappeared`);
  return seen;
}

const finished = {
  departures: demoFlightsForDate('kul', DATE, 'd', NEXT_MORNING),
  arrivals: demoFlightsForDate('kul', DATE, 'a', NEXT_MORNING),
};
const clean = (flight: DemoFlight) => flight.delayMinutes === 0 && flight.status !== 'cancelled';

describe('seeded random numbers', () => {
  it('is deterministic for a seed and stays within [0, 1)', () => {
    expect(hashString('kul|2026-11-17')).toBe(hashString('kul|2026-11-17'));
    expect(hashString('kul')).not.toBe(hashString('pen'));
    const a = mulberry32(42);
    const b = mulberry32(42);
    const values = Array.from({ length: 200 }, () => a());
    expect(values).toEqual(Array.from({ length: 200 }, () => b()));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(seededRandom('x')()).toBe(seededRandom('x')());
  });
});

describe('demo timetable', () => {
  it('gives KLIA roughly 60 to 140 flights each way, split between Terminal 1 and Terminal 2', () => {
    const departures = buildDemoTimetable('kul', 'd');
    const arrivals = buildDemoTimetable('kul', 'a');
    for (const list of [departures, arrivals]) {
      expect(list.length).toBeGreaterThanOrEqual(60);
      expect(list.length).toBeLessThanOrEqual(140);
      expect(list.filter((entry) => entry.terminal === 'T1').length).toBeGreaterThan(20);
      expect(list.filter((entry) => entry.terminal === 'T2').length).toBeGreaterThan(20);
    }
    expect(arrivals.length).toBe(departures.length);
  });

  it('gives smaller airports fewer flights and STOLports none', () => {
    const kul = buildDemoTimetable('kul', 'd').length;
    for (const slug of ['pen', 'bki', 'kch', 'lgk', 'szb']) {
      const count = buildDemoTimetable(slug, 'd').length;
      expect(count, slug).toBeGreaterThan(10);
      expect(count, slug).toBeLessThan(kul);
    }
    expect(buildDemoTimetable('tgg', 'd').length).toBeLessThanOrEqual(10);
    expect(buildDemoTimetable('bbn', 'd')).toEqual([]);
    expect(hasDemoRoutes('mkz')).toBe(false);
    expect(buildDemoTimetable('zzz', 'd')).toEqual([]);
  });

  it('is stable, sorted by time, and never repeats a flight number on a board', () => {
    for (const slug of DEMO_AIRPORT_SLUGS) {
      for (const direction of ['d', 'a'] as const) {
        const list = buildDemoTimetable(slug, direction);
        const numbers = list.map((entry) => `${entry.airlineCode}${entry.digits}`);
        expect(new Set(numbers).size, `${slug} ${direction}`).toBe(numbers.length);
        expect(list.map((entry) => entry.minuteOfDay)).toEqual([...list.map((entry) => entry.minuteOfDay)].sort((a, b) => a - b));
      }
    }
    expect(buildDemoTimetable('kul', 'd')).toBe(buildDemoTimetable('kul', 'd'));
  });

  it('marks every route template as illustrative', () => {
    for (const templates of Object.values(DEMO_ROUTES)) {
      expect(templates.every((template) => template.illustrative === true)).toBe(true);
    }
  });

  it('respects days of operation (Kuantan to Singapore runs on Wednesday, Friday and Sunday)', () => {
    const tuesday = demoFlightsForDate('kua', '2026-11-17', 'd', AFTERNOON);
    const wednesday = demoFlightsForDate('kua', '2026-11-18', 'd', AFTERNOON);
    expect(tuesday.some((flight) => flight.destination.code === 'SIN')).toBe(false);
    expect(wednesday.some((flight) => flight.destination.code === 'SIN')).toBe(true);
  });
});

describe('DemoFlightProvider: determinism and shape', () => {
  it('returns identical data for the same airport, date and instant', async () => {
    const first = await new DemoFlightProvider(AFTERNOON).listFlights({ airport: 'kul' });
    const second = await new DemoFlightProvider(new Date(AFTERNOON.getTime())).listFlights({ airport: 'KUL' });
    expect(first.length).toBeGreaterThan(120);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it('keeps the timetable from day to day while day-specific events change', () => {
    const today = demoFlightsForDate('kul', '2026-11-17', 'd', NEXT_MORNING);
    const later = demoFlightsForDate('kul', '2026-11-20', 'd', new Date('2026-11-21T04:00:00Z'));
    expect(later.map((flight) => flight.number)).toEqual(today.map((flight) => flight.number));
    expect(later.map((flight) => flight.scheduled.slice(11))).toEqual(today.map((flight) => flight.scheduled.slice(11)));
    expect(later.map((flight) => flight.delayMinutes)).not.toEqual(today.map((flight) => flight.delayMinutes));
  });

  it('labels every flight as demo data with well-formed ids and local times', () => {
    const flights = new DemoFlightProvider(AFTERNOON).listFlightsSync({ airport: 'kul' });
    for (const flight of flights) {
      expect(flight.isDemo).toBe(true);
      expect(flight.scheduled).toMatch(/^2026-11-17T\d{2}:\d{2}:00\+08:00$/);
      expect(decodeFlightId(flight.id)).toEqual({
        airlineCode: flight.airline.code,
        number: flight.number.slice(2),
        date: flight.date,
        direction: flight.direction,
      });
      const local = flight.direction === 'd' ? flight.origin : flight.destination;
      expect(local.code).toBe('KUL');
    }
    expect(new Set(flights.map((flight) => flight.id)).size).toBe(flights.length);
  });

  it('describes itself as demonstration data', () => {
    const meta = new DemoFlightProvider(AFTERNOON).meta();
    expect(meta).toMatchObject({ mode: 'demo', refreshSeconds: 30, generatedAt: '2026-11-17T14:30:00+08:00', label: { en: 'Demonstration data', ms: 'Data demonstrasi' } });
    expect(meta.disclaimer.en).toMatch(/simulated/);
    expect(PROVIDER_MODES).toEqual({ flights: 'demo', waitTimes: 'demo', parkingAvailability: 'demo' });
    expect(getFlightProvider(AFTERNOON)).toBeInstanceOf(DemoFlightProvider);
    expect(createDemoProvider(AFTERNOON).now.toISOString()).toBe(AFTERNOON.toISOString());
  });
});

describe('DemoFlightProvider: status around the scheduled time', () => {
  it('walks an international departure through its life cycle', () => {
    const flight = finished.departures.find((item) => clean(item) && isInternationalFlight(item));
    expect(flight).toBeDefined();
    if (!flight) return;
    const expected: [number, FlightStatus][] = [
      [-240, 'scheduled'],
      [-170, 'check-in-open'],
      [-55, 'check-in-closed'],
      [-40, 'boarding'],
      [-20, 'final-call'],
      [-12, 'gate-closed'],
      [1, 'departed'],
    ];
    for (const [minutes, status] of expected) expect(statusAt(flight, minutes).status, `${minutes} min`).toBe(status);
    expect(statusAt(flight, 1).actual).toBe(flight.scheduled);
    expect(statusAt(flight, -40).statusDetail?.en).toMatch(/^Go to gate /);
  });

  it('uses shorter cut-offs for a domestic departure', () => {
    const flight = finished.departures.find((item) => clean(item) && !isInternationalFlight(item));
    expect(flight).toBeDefined();
    if (!flight) return;
    expect(statusAt(flight, -150).status).toBe('scheduled');
    expect(statusAt(flight, -110).status).toBe('check-in-open');
    expect(statusAt(flight, -40).status).toBe('check-in-closed');
    expect(statusAt(flight, -25).status).toBe('boarding');
    expect(statusAt(flight, -5).status).toBe('gate-closed');
  });

  it('shows the gate about 90 minutes before departure and says so before then', () => {
    const sample = finished.departures.filter(clean).slice(0, 25);
    for (const flight of sample) {
      const early = statusAt(flight, -115);
      expect(early.gate, flight.id).toBeUndefined();
      expect(statusAt(flight, -75).gate, flight.id).toBeDefined();
      if (early.status === 'check-in-open') expect(early.statusDetail?.en).toBe('Gate not yet assigned');
    }
  });

  it('shows check-in counters only while check-in is relevant', () => {
    const flight = finished.departures.find((item) => clean(item) && isInternationalFlight(item));
    if (!flight) throw new Error('No clean international departure');
    expect(statusAt(flight, -200).checkInCounters).toBeUndefined();
    expect(statusAt(flight, -120).checkInCounters).toBeDefined();
    expect(statusAt(flight, 30).checkInCounters).toBeUndefined();
  });

  it('announces a delay with a new time, and not before it is known', () => {
    const delayed = finished.departures.find((item) => item.delayMinutes > 0);
    expect(delayed).toBeDefined();
    if (!delayed) return;
    const before = statusAt(delayed, -330);
    expect(before).toMatchObject({ status: 'scheduled', delayMinutes: 0, estimated: delayed.scheduled });
    const announced = statusAt(delayed, -50);
    expect(announced.status).toBe('delayed');
    expect(announced.delayMinutes).toBe(delayed.delayMinutes);
    expect(Date.parse(announced.estimated) - Date.parse(announced.scheduled)).toBe(delayed.delayMinutes * 60000);
    expect(announced.statusDetail?.en).toMatch(/^New time \d{2}:\d{2}$/);
    expect(announced.statusDetail?.ms).toMatch(/^Masa baharu /);
  });

  it('keeps delays to a small share and cancellations rare', () => {
    const all = [...finished.departures, ...finished.arrivals];
    const delayed = all.filter((flight) => flight.delayMinutes > 0).length / all.length;
    const cancelled = all.filter((flight) => flight.status === 'cancelled').length / all.length;
    expect(delayed).toBeGreaterThan(0.04);
    expect(delayed).toBeLessThan(0.3);
    expect(cancelled).toBeLessThan(0.06);
    expect(all.filter((flight) => flight.delayMinutes > 0).every((flight) => flight.delayMinutes >= 20 && flight.delayMinutes <= 120)).toBe(true);
  });

  it('shows a cancellation only once it would be known', () => {
    let cancelled: DemoFlight | undefined;
    for (let day = 17; day <= 30 && !cancelled; day += 1) {
      cancelled = demoFlightsForDate('kul', `2026-11-${day}`, 'd', new Date('2026-12-02T00:00:00Z')).find((flight) => flight.status === 'cancelled');
    }
    expect(cancelled).toBeDefined();
    if (!cancelled) return;
    expect(statusAt(cancelled, -400).status).toBe('scheduled');
    expect(statusAt(cancelled, -120)).toMatchObject({ status: 'cancelled', statusDetail: { en: 'Check with your airline' } });
    expect(statusAt(cancelled, -120).gate).toBeUndefined();
  });

  it('walks an arrival from en route to bags on the belt', () => {
    const flight = finished.arrivals.find((item) => clean(item) && isInternationalFlight(item));
    expect(flight).toBeDefined();
    if (!flight) return;
    const duration = flight.durationMinutes ?? 0;
    expect(statusAt(flight, -(duration + 60)).status).toBe('scheduled');
    const enRoute = statusAt(flight, -40);
    expect(enRoute).toMatchObject({ status: 'en-route' });
    expect(enRoute.belt).toBeUndefined();
    expect(statusAt(flight, -10).belt).toBeDefined();
    expect(statusAt(flight, 2).status).toBe('landed');
    expect(statusAt(flight, 10).status).toBe('at-gate');
    const bags = statusAt(flight, 40);
    expect(bags.status).toBe('baggage');
    expect(bags.statusDetail?.en).toBe(`Belt ${bags.belt}`);
    expect(statusAt(flight, 120).status).toBe('completed');
  });
});

describe('DemoFlightProvider: lookups, filters and search', () => {
  const provider = new DemoFlightProvider(AFTERNOON);

  it('finds a flight again by id, with or without the airport', async () => {
    const flight = provider.listFlightsSync({ airport: 'pen', direction: 'a' })[3];
    expect(provider.getFlightSync(flight.id, 'pen')).toEqual(flight);
    expect(await provider.getFlight(flight.id)).toMatchObject({ number: flight.number, direction: 'a' });
    expect(provider.getFlightSync('zz9999-20261117-d')).toBeNull();
    expect(provider.getFlightSync('not-an-id')).toBeNull();
    expect(provider.getFlightSync(flight.id, 'zzz')).toBeNull();
  });

  it('filters by direction, terminal, window and limit', () => {
    const t2 = provider.listFlightsSync({ airport: 'kul', direction: 'd', terminal: 'T2' });
    expect(t2.length).toBeGreaterThan(20);
    expect(t2.every((flight) => flight.terminal === 'T2' && flight.direction === 'd')).toBe(true);
    expect(provider.listFlightsSync({ airport: 'kul', direction: 'd', limit: 7 })).toHaveLength(7);

    const window = boardWindow(AFTERNOON, 3);
    const soon = provider.listFlightsSync({ airport: 'kul', direction: 'd', ...window });
    expect(soon.length).toBeGreaterThan(5);
    for (const flight of soon) {
      expect(Date.parse(flight.estimated)).toBeGreaterThanOrEqual(window.from.getTime());
      expect(Date.parse(flight.estimated)).toBeLessThan(window.to.getTime());
    }
    expect(provider.listFlightsSync({ airport: 'bbn' })).toEqual([]);
  });

  it('spans midnight when the window does', () => {
    const lateEvening = new DemoFlightProvider(new Date('2026-11-17T15:30:00Z')); // 23:30
    const flights = lateEvening.listFlightsSync({ airport: 'kul', direction: 'd', ...boardWindow(lateEvening.now, 9) });
    expect(new Set(flights.map((flight) => flight.date))).toEqual(new Set(['2026-11-17', '2026-11-18']));
  });

  it('searches by city, flight number and route', async () => {
    const london = provider.searchSync({ q: 'london' });
    expect(london.length).toBeGreaterThan(0);
    expect(london.every((flight) => [flight.origin.city, flight.destination.city].includes('London'))).toBe(true);

    const target = provider.listFlightsSync({ airport: 'kul', direction: 'd' })[20];
    const byNumber = await provider.search({ q: `${target.airline.code} ${target.number.slice(2)}`, airport: 'kul', direction: 'd' });
    expect(byNumber[0].id).toBe(target.id);

    const route = provider.searchSync({ q: 'KUL-PEN', limit: 50 });
    expect(route.length).toBeGreaterThan(5);
    expect(route.every((flight) => flight.origin.code === 'KUL' && flight.destination.code === 'PEN')).toBe(true);
    expect(provider.searchSync({ q: '  ' })).toEqual([]);

    const filtered = provider.listFlightsSync({ airport: 'kul', direction: 'd', q: 'singapore' });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((flight) => flight.destination.code === 'SIN')).toBe(true);
  });
});

describe('other providers', () => {
  it('documents the official flight API without calling it', async () => {
    const official: FlightDataProvider = new OfficialFlightProvider();
    await expect(official.listFlights({ airport: 'kul' })).rejects.toBeInstanceOf(ProviderNotConfiguredError);
    await expect(official.getFlight('mh2610-20261117-d')).rejects.toThrow(/not configured/);
    expect(() => official.meta()).toThrow(ProviderNotConfiguredError);
    expect(toOfficialParams({ airport: 'kul', direction: 'a', q: 'MH', terminal: 'T1', limit: 20 })).toEqual({ code: 'A', key: 'MH', terminal: 'T1', take: 20 });
    expect(toOfficialParams({ airport: 'pen' })).toEqual({ code: 'D' });
  });

  it('simulates wait times deterministically and flags them as demo', async () => {
    const provider = new DemoWaitTimeProvider(AFTERNOON);
    const first = await provider.getWaitTimes({ airport: 'kul', terminal: 'T1' });
    expect(first).toHaveLength(6);
    expect(first.every((item) => item.isDemo && item.terminal === 'T1' && item.minutes >= 1)).toBe(true);
    expect(new DemoWaitTimeProvider(AFTERNOON).getWaitTimesSync({ airport: 'kul', terminal: 'T1' })).toEqual(first);
    expect(provider.getWaitTimesSync({ airport: 'kul' })).toHaveLength(12);
    expect(provider.getWaitTimesSync({ airport: 'bbn' })).toEqual([]);
    expect(provider.meta().mode).toBe('demo');
    expect(demoBusyness(7 * 60 + 30)).toBeGreaterThan(demoBusyness(3 * 60));
  });

  it('simulates car park availability without inventing bay counts', () => {
    const provider = new DemoParkingAvailabilityProvider(AFTERNOON);
    const [withBays, withoutBays] = provider.getAvailabilitySync({ airport: 'kul', carParks: [{ id: 'kul-t1-car-park', bays: 5700 }, { id: 'unknown-size' }] });
    expect(withBays.isDemo).toBe(true);
    expect(withBays.percentFull).toBeGreaterThanOrEqual(0);
    expect(withBays.percentFull).toBeLessThanOrEqual(100);
    expect(withBays.availableBays).toBe(Math.round((5700 * (100 - withBays.percentFull)) / 100));
    expect(withoutBays.availableBays).toBeUndefined();
    expect(provider.getAvailabilitySync({ airport: 'kul', carParks: [{ id: 'kul-t1-car-park', bays: 5700 }] })[0]).toEqual(withBays);
  });
});

/* ------------------------------------------------------------------------------------------
 * Fix round B: shared caches (B-06), the resilient feed (B-09), codeshares (B-14), status lines (B-01)
 * --------------------------------------------------------------------------------------- */

import type { Notice } from '@/content/types';
import { clearDemoCaches, demoCacheStats, demoFlightExists, demoFlightIdForCodeshare } from './demo-flights';
import { opsStatus } from './demo-operations';
import { serveFlightFeed } from './feed-server';
import { FeedUnavailableError, ResilientFlightFeed } from './resilient';
import { SnapshotFlightProvider } from './snapshot';

describe('demo caches shared across provider instances (B-06)', () => {
  it('builds a board once per airport, date, direction and instant, whatever the number of providers', () => {
    clearDemoCaches();
    const instant = new Date('2026-11-17T06:30:00Z');
    const before = demoCacheStats();
    const first = new DemoFlightProvider(instant).listFlightsSync({ airport: 'kul', direction: 'd', date: DATE });
    const second = new DemoFlightProvider(instant.getTime()).listFlightsSync({ airport: 'kul', direction: 'd', date: DATE });
    expect(second).toEqual(first);
    const after = demoCacheStats();
    expect(after.flightBuilds - before.flightBuilds).toBe(1);
    expect(after.planBuilds - before.planBuilds).toBe(1);
    // A later instant re-derives the status from the cached day plan without re-planning the day.
    new DemoFlightProvider(addMinutes(instant, 30)).listFlightsSync({ airport: 'kul', direction: 'd', date: DATE });
    expect(demoCacheStats().planBuilds - after.planBuilds).toBe(0);
    expect(demoCacheStats().flightBuilds - after.flightBuilds).toBe(1);
  });

  it('computes the two-day search pool once per instant', () => {
    clearDemoCaches();
    const instant = new Date('2026-11-17T06:30:00Z');
    const search = () => {
      const provider = new DemoFlightProvider(instant);
      for (const direction of ['d', 'a'] as const) {
        provider.listFlightsSync({ airport: 'kul', direction, from: new Date('2026-11-16T16:00:00Z'), to: new Date('2026-11-18T16:00:00Z'), q: 'MH' });
      }
    };
    search();
    const once = demoCacheStats().flightBuilds;
    for (let index = 0; index < 4; index += 1) search();
    // Four more providers for the same instant (one per keystroke or component) build nothing.
    expect(demoCacheStats().flightBuilds).toBe(once);
  });
});

describe('codeshares and known ids (B-14)', () => {
  it('finds the operating flight for a codeshare number, and says whether an id exists', () => {
    const shared = demoFlightsForDate('kul', DATE, 'd', AFTERNOON).find((flight) => flight.codeshares && flight.codeshares.length > 0);
    expect(shared).toBeDefined();
    if (!shared?.codeshares) return;
    expect(demoFlightIdForCodeshare('kul', DATE, 'd', shared.codeshares[0])).toBe(shared.id);
    expect(demoFlightIdForCodeshare('kul', DATE, 'd', 'ZZ 9999')).toBeNull();
    expect(demoFlightExists('kul', DATE, 'd', shared.id)).toBe(true);
    expect(demoFlightExists('kul', DATE, 'd', 'zz9999-20261117-d')).toBe(false);
  });
});

describe('ResilientFlightFeed: chaos (B-09)', () => {
  const day = { airport: 'kul', date: DATE, direction: 'd' as const };
  const t0 = new Date('2026-11-17T06:30:00Z');

  it('serves fresh data, then last-known data with its age when the source throws', async () => {
    let fail = false;
    const feed = new ResilientFlightFeed((now) => {
      if (fail) throw new Error('feed down');
      return new DemoFlightProvider(now);
    });
    const fresh = await feed.day(day, t0);
    expect(fresh.stale).toBe(false);
    expect(fresh.flights.length).toBeGreaterThan(50);
    fail = true;
    const fallback = await feed.day(day, addMinutes(t0, 3));
    expect(fallback).toMatchObject({ stale: true, reason: 'error', ageSeconds: 180 });
    expect(fallback.flights).toEqual(fresh.flights);
  });

  it('times out a source that does not answer, falling back to last-known data or failing clearly', async () => {
    let hang = false;
    const slow: FlightDataProvider = {
      meta: () => new DemoFlightProvider(t0).meta(),
      listFlights: (query) => (hang ? new Promise(() => undefined) : new DemoFlightProvider(t0).listFlights(query)),
      getFlight: async () => null,
      search: async () => [],
    };
    const feed = new ResilientFlightFeed(() => slow, { timeoutMs: 20, ttlMs: 0 });
    await feed.day(day, t0);
    hang = true;
    await expect(feed.day(day, addMinutes(t0, 1))).resolves.toMatchObject({ stale: true, reason: 'timeout' });
    const empty = new ResilientFlightFeed(() => slow, { timeoutMs: 20 });
    await expect(empty.day(day, t0)).rejects.toBeInstanceOf(FeedUnavailableError);
  });

  it('marks data the source generated long ago as stale', async () => {
    const old = new DemoFlightProvider(addMinutes(t0, -10));
    const feed = new ResilientFlightFeed(() => old);
    await expect(feed.day(day, t0)).resolves.toMatchObject({ stale: true, reason: 'old-data', ageSeconds: 600 });
  });

  it('meets the provider contract with the official stub: a clear error, never invented data', async () => {
    const feed = new ResilientFlightFeed(() => new OfficialFlightProvider());
    await expect(feed.day(day, t0)).rejects.toBeInstanceOf(FeedUnavailableError);
  });

  it('answers the feed route: rounded instants, 400 for a bad instant, 503 with nothing to show', async () => {
    const ok = await serveFlightFeed(day, String(t0.getTime() + 12_345), t0);
    expect(ok.status).toBe(200);
    if ('flights' in ok.body) expect(ok.body.meta.generatedAt).toBe('2026-11-17T14:30:00+08:00');
    expect((await serveFlightFeed(day, 'yesterday', t0)).status).toBe(400);
    expect((await serveFlightFeed(day, '1', t0)).status).toBe(400);
    const down = new ResilientFlightFeed(() => new OfficialFlightProvider());
    expect((await serveFlightFeed(day, null, t0, down)).status).toBe(503);
  });
});

describe('SnapshotFlightProvider (B-09)', () => {
  it('answers the same lookups as the generator from fetched boards', async () => {
    const generator = new DemoFlightProvider(AFTERNOON);
    const feed = new ResilientFlightFeed((now) => new DemoFlightProvider(now));
    const days = await Promise.all((['d', 'a'] as const).map((direction) => feed.day({ airport: 'kul', date: DATE, direction }, AFTERNOON)));
    const snapshot = new SnapshotFlightProvider(days, AFTERNOON);
    const window = { from: addMinutes(AFTERNOON, -45), to: addMinutes(AFTERNOON, 360) };
    expect(snapshot.listFlightsSync({ airport: 'kul', direction: 'd', ...window })).toEqual(generator.listFlightsSync({ airport: 'kul', direction: 'd', ...window }));
    const one = days[0].flights[10];
    expect(snapshot.getFlightSync(one.id, 'kul')).toEqual(one);
    expect(snapshot.getFlightSync('zz1-20261117-d', 'kul')).toBeNull();
  });
});

describe('opsStatus: status lines fed by notices (B-01)', () => {
  const notice: Notice = {
    id: 'kul-aerotrain-test',
    airport: 'kul',
    terminal: 'T1',
    severity: 'advisory',
    title: { en: 'No Aerotrain between midnight and 5am' },
    body: { en: 'Shuttle buses replace it.' },
    validFrom: '2026-11-28T00:00:00+08:00',
    validTo: '2026-12-01T05:00:00+08:00',
    provenance: 'official',
    sources: ['malaymail-aerotrain-software-oct-2026'],
  };

  it('reports an active notice, an upcoming one, and no disruption with the time it was checked', () => {
    const active = opsStatus({ airport: 'kul', notices: [notice], now: new Date('2026-11-29T01:00:00+08:00'), services: ['aerotrain'] });
    expect(active[0]).toMatchObject({ service: 'aerotrain', state: 'notice', notice: { id: 'kul-aerotrain-test' } });
    const upcoming = opsStatus({ airport: 'kul', notices: [notice], now: new Date('2026-11-18T10:00:00+08:00'), services: ['aerotrain'] });
    expect(upcoming[0].state).toBe('planned');
    const none = opsStatus({ airport: 'kul', notices: [notice], now: new Date('2026-12-20T10:00:00+08:00'), services: ['aerotrain', 'inter-terminal-train', 'inter-terminal-shuttle'] });
    expect(none.map((line) => line.state)).toEqual(['clear', 'clear', 'clear']);
    expect(none[0].checkedAt).toBe('2026-12-20T10:00:00+08:00');
  });

  it('does not mistake a fare notice for a train disruption, and adds demo queue estimates to immigration', () => {
    const fare: Notice = { ...notice, id: 'kul-klia-ekspres-fare-rise-2027', title: { en: 'KLIA Ekspres adult fare rises to RM65' }, validFrom: undefined, validTo: undefined };
    const lines = opsStatus({ airport: 'kul', notices: [fare], now: new Date('2026-11-18T10:00:00+08:00'), services: ['inter-terminal-train', 'immigration'], terminal: 'T1' });
    expect(lines[0].state).toBe('clear');
    // Security and immigration when leaving, immigration when arriving (the arrival step shows its own).
    expect(lines[1].waits.map((wait) => wait.checkpoint)).toEqual(['security', 'immigration-departure', 'immigration-arrival']);
    expect(lines[1].waits.every((wait) => wait.isDemo && wait.terminal === 'T1')).toBe(true);
  });
});

import { decideFlightRoute, flightNotFoundHtml } from './flight-route';

describe('flight route guard (B-14)', () => {
  const shared = demoFlightsForDate('kul', DATE, 'd', AFTERNOON).find((flight) => flight.codeshares && flight.codeshares.length > 0);
  const real = demoFlightsForDate('kul', DATE, 'd', AFTERNOON)[0];

  it('sends a codeshare number to the operating flight with a permanent redirect', () => {
    expect(shared?.codeshares).toBeDefined();
    const [airline, digits] = (shared?.codeshares?.[0] ?? '').split(' ');
    expect(decideFlightRoute(`/en/kul/flights/${airline.toLowerCase()}${digits}-20261117-d`)).toEqual({ kind: 'redirect', location: `/en/kul/flights/${shared?.id}` });
  });

  it('answers malformed and unknown ids with a small not-found page, and lets real flights through', () => {
    expect(decideFlightRoute('/en/kul/flights/zz9999-20990101-d')).toEqual({ kind: 'not-found', lang: 'en', airport: 'kul' });
    expect(decideFlightRoute('/ms/kul/flights/%3Cimg%20src%3Dx%3E')).toEqual({ kind: 'not-found', lang: 'ms', airport: 'kul' });
    expect(decideFlightRoute(`/en/kul/flights/${'x'.repeat(1600)}`)).toMatchObject({ kind: 'not-found' });
    expect(decideFlightRoute('/en/zzz/flights/mh1-20261117-d')).toEqual({ kind: 'not-found', lang: 'en' });
    expect(decideFlightRoute(`/en/kul/flights/${real.id}`)).toEqual({ kind: 'page' });
    expect(decideFlightRoute('/en/kul/flights/feed')).toBeNull();
    expect(decideFlightRoute('/en/kul/flights')).toBeNull();
    const html = flightNotFoundHtml('en', 'kul');
    expect(html.length).toBeLessThan(30_000);
    expect(html).toContain('action="/en/kul/flights"');
    expect(flightNotFoundHtml('ms', 'kul')).toContain('lang="ms"');
  });
});
