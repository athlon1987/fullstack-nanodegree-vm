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
