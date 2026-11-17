import { describe, expect, it } from 'vitest';
import { calculateParking } from '@/lib/parking';
import { dailyMaxCeiling, defaultArrival, localInstant, parseClock, shiftStamp, stayMinutes } from './parking-logic';

const TZ = 'Asia/Kuala_Lumpur';

describe('clock and stamps', () => {
  it('parses 24-hour times', () => {
    expect(parseClock('00:00')).toBe(0);
    expect(parseClock('23:59')).toBe(1439);
    expect(parseClock('08:30:00')).toBe(510);
    expect(parseClock('24:00')).toBeNull();
    expect(parseClock('8:30')).toBeNull();
    expect(parseClock('')).toBeNull();
  });

  it('reads local dates and times in airport time', () => {
    expect(localInstant('2026-11-17', '08:00', TZ)?.toISOString()).toBe('2026-11-17T00:00:00.000Z');
    expect(localInstant('', '08:00', TZ)).toBeNull();
    expect(localInstant('2026-11-17', '', TZ)).toBeNull();
  });

  it('measures a stay, including across midnight and reversed', () => {
    expect(stayMinutes({ date: '2026-11-17', time: '22:00' }, { date: '2026-11-18', time: '01:30' }, TZ)).toBe(210);
    expect(stayMinutes({ date: '2026-11-18', time: '10:00' }, { date: '2026-11-17', time: '10:00' }, TZ)).toBe(-1440);
    expect(stayMinutes({ date: '2026-11-18', time: '' }, { date: '2026-11-17', time: '10:00' }, TZ)).toBeNull();
  });

  it('shifts a stamp by a stay length', () => {
    expect(shiftStamp({ date: '2026-12-31', time: '21:00' }, 180, TZ)).toEqual({ date: '2027-01-01', time: '00:00' });
    expect(shiftStamp({ date: '2026-11-17', time: '09:15' }, 7 * 1440, TZ)).toEqual({ date: '2026-11-24', time: '09:15' });
  });

  it('defaults the arrival to the next quarter hour', () => {
    expect(defaultArrival(Date.parse('2026-11-17T00:07:00Z'), TZ)).toEqual({ date: '2026-11-17', time: '08:15' });
    expect(defaultArrival(Date.parse('2026-11-17T15:45:00Z'), TZ)).toEqual({ date: '2026-11-18', time: '00:00' });
  });
});

describe('daily maximum ceiling', () => {
  it('multiplies started 24-hour periods by the daily maximum', () => {
    expect(dailyMaxCeiling({ dailyMax: 32 }, 180)).toEqual({ periods: 1, amount: 32, dailyMax: 32 });
    expect(dailyMaxCeiling({ dailyMax: 32 }, 1440)).toEqual({ periods: 1, amount: 32, dailyMax: 32 });
    expect(dailyMaxCeiling({ dailyMax: 32 }, 1441)).toEqual({ periods: 2, amount: 64, dailyMax: 32 });
    expect(dailyMaxCeiling({ dailyMax: 32 }, 7 * 1440)).toEqual({ periods: 7, amount: 224, dailyMax: 32 });
  });

  it('gives nothing without a daily maximum or a positive stay', () => {
    expect(dailyMaxCeiling({}, 600)).toBeUndefined();
    expect(dailyMaxCeiling({ dailyMax: 32 }, 0)).toBeUndefined();
    expect(dailyMaxCeiling({ dailyMax: 32 }, -5)).toBeUndefined();
  });

  it('is never below what calculateParking charges under the same cap', () => {
    const carPark = {
      rateStatus: 'published' as const,
      dailyMax: 46,
      rates: [
        { fromMinute: 0, toMinute: 60, kind: 'flat' as const, amount: 4 },
        { fromMinute: 60, kind: 'per-block' as const, amount: 3, blockMinutes: 60 },
      ],
    };
    for (const minutes of [30, 61, 600, 1440, 1500, 4000, 10080]) {
      const result = calculateParking(carPark, minutes);
      if (result.unavailable) throw new Error('expected a fee');
      expect(dailyMaxCeiling(carPark, minutes)!.amount).toBeGreaterThanOrEqual(result.total);
    }
  });
});
