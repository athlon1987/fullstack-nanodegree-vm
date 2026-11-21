import { describe, expect, it } from 'vitest';
import { getAirportContent } from '@/content';
import type { RateBand } from '@/content/types';
import { calculateParking } from '@/lib/parking';
import { parkingPageModel } from './parking-data.server';
import { dailyMaxCeiling, defaultArrival, localInstant, MATRIX_DAYS, parseClock, priceCell, priceRow, shiftStamp, stampFromIso, stayMinutes } from './parking-logic';

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

describe('price matrix (C-01)', () => {
  const base = { rates: [], graceMinutes: undefined };
  it('gives the most a stay can cost under a published daily maximum', () => {
    const ltcp = { ...base, rateStatus: 'not-verified' as const, dailyMax: 32 };
    expect(MATRIX_DAYS).toEqual([1, 3, 7]);
    expect(priceRow(ltcp)).toEqual([
      { kind: 'ceiling', amount: 32 },
      { kind: 'ceiling', amount: 96 },
      { kind: 'ceiling', amount: 224 },
    ]);
  });

  it('turns the sources’ own daily maximums into a range when rates are not verified', () => {
    const one = { ...base, rateStatus: 'not-verified' as const, reported: [{ amount: 52 }] };
    expect(priceCell(one, 3)).toEqual({ kind: 'reported', min: 156, max: 156 });
    const two = { ...base, rateStatus: 'not-verified' as const, reported: [{ amount: 52 }, { amount: 40 }] };
    expect(priceCell(two, 7)).toEqual({ kind: 'reported', min: 280, max: 364 });
  });

  it('says nothing it cannot stand behind, and estimates from a published tariff', () => {
    expect(priceCell({ ...base, rateStatus: 'not-verified' as const }, 1)).toEqual({ kind: 'none' });
    const tariff = { rates: [{ fromMinute: 0, kind: 'per-block' as const, amount: 4, blockMinutes: 60 }], rateStatus: 'published' as const, dailyMax: 30 };
    expect(priceCell(tariff, 1)).toEqual({ kind: 'estimate', amount: 30 });
    expect(priceCell(tariff, 3)).toEqual({ kind: 'estimate', amount: 90 });
  });

  it('reads the dates journey links carry, in airport time', () => {
    expect(stampFromIso('2026-11-21T02:30:00Z', 'Asia/Kuala_Lumpur')).toEqual({ date: '2026-11-21', time: '10:30' });
    expect(stampFromIso('not a date', 'Asia/Kuala_Lumpur')).toBeNull();
    expect(stampFromIso(null, 'Asia/Kuala_Lumpur')).toBeNull();
  });
});

describe('KLIA price matrix data (C-01)', () => {
  it('quotes a dated, attributed daily maximum for every not-verified car park that has one', () => {
    const kul = getAirportContent('kul');
    if (!kul) throw new Error('KUL content missing');
    const { data } = parkingPageModel(kul, 'en');
    const byId = new Map(data.carParks.map((carPark) => [carPark.id, carPark]));
    expect(priceRow(byId.get('kul-long-term-car-park')!)[1]).toEqual({ kind: 'ceiling', amount: 96 });
    const t1 = byId.get('kul-t1-car-park')!;
    expect(t1.reported).toEqual([{ amount: 52, sourceId: 'kliainfo-parking-rates', publisher: 'klia.info', retrieved: '2026-11-17' }]);
    expect(priceRow(t1)[0]).toEqual({ kind: 'reported', min: 52, max: 52 });
    // Preferred Parking has no figure: its row carries the warning instead.
    expect(priceRow(byId.get('kul-t1-preferred-parking')!).every((cell) => cell.kind === 'none')).toBe(true);
    expect(data.premiumWarning).toBeDefined();
  });
});

/* ---- Round 4 (re-review 6.1.3): one rate status for every surface ---------------------------- */

describe('rateFacts and rateStatusText (6.1.3)', async () => {
  const { rateFacts, rateStatusText } = await import('@/lib/parking');
  const base: { rates: RateBand[]; sources: string[] } = { rates: [], sources: ['a', 'b'] };
  // formatCurrency keeps "RM" and the figure together with a no-break space.
  const plain = (text: { en: string; ms?: string }) => ({ en: text.en.replace(/\u00a0/g, ' '), ms: text.ms?.replace(/\u00a0/g, ' ') });
  const sourceOf = (id: string) => (id === 'a' ? { publisher: 'klia.info' } : id === 'b' ? { publisher: 'The Rakyat Post', asOf: '2026-05-16' } : undefined);

  it('reads the basis from the record alone', () => {
    expect(rateFacts({ ...base, rateStatus: 'not-verified', dailyMax: 32 })).toMatchObject({ basis: 'daily-max', verified: false, lowestDaily: 32 });
    expect(rateFacts({ ...base, rateStatus: 'not-verified', reportedDailyMax: [{ amount: 52, source: 'a' }, { amount: 40, source: 'x' }] })).toMatchObject({ basis: 'reported', verified: false, lowestDaily: 52 });
    expect(rateFacts({ ...base, rateStatus: 'not-verified' })).toMatchObject({ basis: 'none', verified: false });
    expect(rateFacts({ ...base, rateStatus: 'published', rates: [{ fromMinute: 0, kind: 'flat', amount: 4 }], dailyMax: 76 })).toMatchObject({ basis: 'tariff', verified: true, dailyMax: 76 });
  });

  it('words each basis the same way in English and Malay, never as verified unless it is', () => {
    expect(plain(rateStatusText({ ...base, rateStatus: 'not-verified', dailyMax: 32 }, sourceOf))).toEqual({
      en: 'Rates not verified: our sources give a daily maximum of RM 32; the hourly rates are not confirmed.',
      ms: 'Kadar belum disahkan: sumber kami memberikan maksimum harian RM 32; kadar sejam belum dipastikan.',
    });
    expect(plain(rateStatusText({ ...base, rateStatus: 'not-verified', reportedDailyMax: [{ amount: 52, source: 'a' }] }, sourceOf))).toEqual({
      en: 'Rates not verified: klia.info (undated) gives RM 52 a day.',
      ms: 'Kadar belum disahkan: klia.info (tanpa tarikh) memberikan RM 52 sehari.',
    });
    expect(plain(rateStatusText({ ...base, rateStatus: 'not-verified', reportedDailyMax: [{ amount: 52, source: 'a' }, { amount: 50, source: 'b' }] }, sourceOf)).en).toBe(
      'Rates not verified: klia.info (undated) gives RM 52 a day and The Rakyat Post gives RM 50 a day.',
    );
    expect(rateStatusText({ ...base, rateStatus: 'not-verified' })).toEqual({ en: 'No price published.', ms: 'Tiada harga diterbitkan.' });
    expect(plain(rateStatusText({ ...base, rateStatus: 'published', rates: [{ fromMinute: 0, kind: 'flat', amount: 4 }], dailyMax: 76 })).en).toBe('Rates published, with a daily maximum of RM 76.');
  });
});
