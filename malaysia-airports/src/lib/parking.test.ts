import { describe, expect, it } from 'vitest';
import { getAirportContent } from '@/content';
import type { CarPark, RateBand } from '@/content/types';
import { calculateParking, chargeForPeriod, parkingMinutes, type ParkingEstimate } from './parking';

type Tariff = Pick<CarPark, 'rates' | 'rateStatus' | 'dailyMax' | 'graceMinutes'>;

/** RM 4 for the first hour, RM 3 for each further hour, RM 46 a day (an invented test tariff). */
const hourly: Tariff = {
  rateStatus: 'published',
  rates: [
    { fromMinute: 0, toMinute: 60, kind: 'flat', amount: 4 },
    { fromMinute: 60, kind: 'per-block', amount: 3, blockMinutes: 60 },
  ],
  dailyMax: 46,
};

const estimate = (tariff: Tariff, minutes: number): ParkingEstimate => {
  const result = calculateParking(tariff, minutes);
  if (result.unavailable) throw new Error(`Unexpectedly unavailable: ${result.reason}`);
  return result;
};

describe('calculateParking', () => {
  it('refuses to guess when rates are not verified (every KLIA car park today)', () => {
    for (const carPark of getAirportContent('kul')?.carParks ?? []) {
      expect(calculateParking(carPark, 120)).toEqual({ unavailable: true, reason: 'rates-not-verified' });
    }
  });

  it('charges the first hour flat and each further started hour', () => {
    expect(estimate(hourly, 30).total).toBe(4);
    expect(estimate(hourly, 60).total).toBe(4);
    expect(estimate(hourly, 61).total).toBe(7);
    expect(estimate(hourly, 150)).toMatchObject({ total: 10, capped: false, currency: 'MYR', minutes: 150 });
  });

  it('applies the daily maximum', () => {
    const result = estimate(hourly, 20 * 60);
    expect(result).toMatchObject({ total: 46, capped: true });
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0]).toMatchObject({ amount: 46, capped: true });
  });

  it('charges each 24-hour period separately over several days', () => {
    const result = estimate(hourly, 2 * 1440 + 90);
    expect(result.total).toBe(46 * 2 + 7);
    expect(result.breakdown.map((line) => [line.minutes, line.amount, line.capped])).toEqual([
      [2880, 92, true],
      [90, 7, false],
    ]);
    expect(result.breakdown[0].label).toEqual({ en: '2 full days', ms: '2 hari penuh' });
    expect(estimate(hourly, 1440).breakdown).toHaveLength(1);
    expect(estimate(hourly, 1440).total).toBe(46);
  });

  it('honours a grace period and rounds part minutes up', () => {
    const withGrace: Tariff = { ...hourly, graceMinutes: 15 };
    expect(estimate(withGrace, 10)).toMatchObject({ total: 0, capped: false });
    expect(estimate(withGrace, 16).total).toBe(4);
    expect(estimate(hourly, 60.2).total).toBe(7);
    expect(estimate(hourly, 0)).toMatchObject({ total: 0, breakdown: [] });
  });

  it('rejects impossible durations', () => {
    expect(calculateParking(hourly, -5)).toEqual({ unavailable: true, reason: 'invalid-duration' });
    expect(calculateParking(hourly, Number.NaN)).toEqual({ unavailable: true, reason: 'invalid-duration' });
  });

  it('handles flat daily tariffs, half-hour blocks and stepped bands', () => {
    const flatDay: Tariff = { rateStatus: 'published', rates: [{ fromMinute: 0, kind: 'flat', amount: 10 }] };
    expect(estimate(flatDay, 3 * 1440).total).toBe(30);
    expect(estimate(flatDay, 3 * 1440 + 1).total).toBe(40);

    const halfHours: RateBand[] = [{ fromMinute: 0, kind: 'per-block', amount: 2, blockMinutes: 30 }];
    expect(chargeForPeriod(halfHours, 45)).toBe(4);

    const stepped: RateBand[] = [
      { fromMinute: 180, kind: 'per-block', amount: 5, blockMinutes: 60 },
      { fromMinute: 0, toMinute: 180, kind: 'per-block', amount: 3, blockMinutes: 60 },
    ];
    expect(chargeForPeriod(stepped, 240)).toBe(14);
    expect(chargeForPeriod(stepped, 180)).toBe(9);
  });

  it('never caps when no daily maximum is published', () => {
    const uncapped: Tariff = { rateStatus: 'published', rates: hourly.rates };
    expect(estimate(uncapped, 20 * 60)).toMatchObject({ total: 4 + 19 * 3, capped: false });
  });

  it('measures a stay between two instants', () => {
    expect(parkingMinutes('2026-11-17T08:00:00+08:00', '2026-11-17T10:30:00+08:00')).toBe(150);
    expect(parkingMinutes('2026-11-17T10:00:00+08:00', '2026-11-17T08:00:00+08:00')).toBe(-120);
  });
});
