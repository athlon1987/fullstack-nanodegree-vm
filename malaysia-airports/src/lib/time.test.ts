import { describe, expect, it } from 'vitest';
import {
  addMinutes,
  dateKey,
  expandDateKey,
  formatDate,
  formatRelative,
  formatTime,
  isDateKey,
  isOpenAt,
  minutesBetween,
  nowInAirport,
  offsetCacheStats,
  offsetMinutes,
  shiftDateKey,
  timezoneDiffers,
  timezoneLabel,
  toIsoWithOffset,
  zonedDateTime,
  zonedParts,
} from './time';

const LATE_UTC = '2026-11-16T16:05:00Z'; // 00:05 on 17 November in Malaysia

describe('time: airport timezone', () => {
  it('formats a 24-hour local time and rolls the date over at Malaysian midnight', () => {
    expect(formatTime(LATE_UTC)).toBe('00:05');
    expect(dateKey(LATE_UTC)).toBe('2026-11-17');
    expect(dateKey(LATE_UTC, 'UTC')).toBe('2026-11-16');
  });

  it('writes ISO strings with the +08:00 offset', () => {
    expect(toIsoWithOffset(LATE_UTC)).toBe('2026-11-17T00:05:00+08:00');
    expect(offsetMinutes(LATE_UTC)).toBe(480);
  });

  it('turns a local wall-clock time into the right instant, including times past midnight', () => {
    expect(zonedDateTime('2026-11-17', 8 * 60 + 25).toISOString()).toBe('2026-11-17T00:25:00.000Z');
    expect(zonedDateTime('2026-11-17', 24 * 60 + 30).toISOString()).toBe('2026-11-17T16:30:00.000Z');
  });

  it('reports the ISO weekday in the airport zone (17 November 2026 is a Tuesday)', () => {
    expect(zonedParts('2026-11-17T04:00:00Z').weekday).toBe(2);
    expect(nowInAirport(LATE_UTC)).toMatchObject({ time: '00:05', dateKey: '2026-11-17', minutesOfDay: 5, weekday: 2 });
  });

  it('knows when the viewer is in a different timezone', () => {
    expect(timezoneDiffers(LATE_UTC, 'Europe/London')).toBe(true);
    expect(timezoneDiffers(LATE_UTC, 'Asia/Singapore')).toBe(false);
    expect(timezoneLabel(LATE_UTC)).toBe('MYT (UTC+8)');
  });
});

describe('time: date keys and arithmetic', () => {
  it('validates and shifts date keys across month ends', () => {
    expect(isDateKey('2026-02-28')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('17-11-2026')).toBe(false);
    expect(shiftDateKey('2026-11-30', 1)).toBe('2026-12-01');
    expect(shiftDateKey('2027-01-01', -1)).toBe('2026-12-31');
    expect(expandDateKey('20261117')).toBe('2026-11-17');
    expect(expandDateKey('20261340')).toBeNull();
  });

  it('adds and measures minutes', () => {
    const start = new Date('2026-11-17T06:00:00Z');
    expect(addMinutes(start, 90).toISOString()).toBe('2026-11-17T07:30:00.000Z');
    expect(minutesBetween(start, addMinutes(start, -45))).toBe(-45);
  });

  it('describes relative times in both languages', () => {
    const now = new Date('2026-11-17T06:00:00Z');
    expect(formatRelative(addMinutes(now, 25), now, 'en')).toBe('in 25 min');
    expect(formatRelative(addMinutes(now, 130), now, 'en')).toBe('in 2 h 10 min');
    expect(formatRelative(addMinutes(now, -25), now, 'ms')).toBe('25 min lalu');
    expect(formatRelative(now, now, 'ms')).toBe('sekarang');
  });

  it('formats dates in English and Malay', () => {
    expect(formatDate('2026-11-17T04:00:00Z', 'ms', 'weekday')).toBe('Selasa, 17 November');
    expect(formatDate('2026-11-17T04:00:00Z', 'en', 'long')).toBe('17 November 2026');
  });
});

describe('time: opening hours', () => {
  const at = (clock: string) => `2026-11-17T${clock}:00+08:00`;

  it('handles daily hours with an exclusive closing time', () => {
    const hours = { kind: 'daily', open: '07:00', close: '19:00' } as const;
    expect(isOpenAt(hours, at('06:59'))).toBe(false);
    expect(isOpenAt(hours, at('07:00'))).toBe(true);
    expect(isOpenAt(hours, at('19:00'))).toBe(false);
  });

  it('handles hours that run past midnight, 24-hour service and prose-only hours', () => {
    const overnight = { kind: 'daily', open: '22:00', close: '02:00' } as const;
    expect(isOpenAt(overnight, at('23:30'))).toBe(true);
    expect(isOpenAt(overnight, at('01:59'))).toBe(true);
    expect(isOpenAt(overnight, at('12:00'))).toBe(false);
    expect(isOpenAt({ kind: '24h' }, at('03:00'))).toBe(true);
    expect(isOpenAt({ kind: 'text', text: { en: 'Varies' } }, at('03:00'))).toBeUndefined();
    expect(isOpenAt(undefined, at('03:00'))).toBeUndefined();
  });
});

describe('time: cached zone offsets (performance-02)', () => {
  it('agrees with Intl.DateTimeFormat on every quarter hour across a daylight-saving change', () => {
    const exact = (ms: number, zone: string): string =>
      new Intl.DateTimeFormat('en-GB', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
    const fields = (ms: number, zone: string): string => {
      const p = zonedParts(ms, zone);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(p.day)}/${pad(p.month)}/${p.year}, ${pad(p.hour)}:${pad(p.minute)}`;
    };
    // 29 March 2026: Europe/London moves from UTC+0 to UTC+1 at 01:00 UTC.
    for (const zone of ['Europe/London', 'Australia/Adelaide', 'Asia/Kuala_Lumpur']) {
      for (let ms = Date.UTC(2026, 2, 28, 12); ms < Date.UTC(2026, 2, 30, 12); ms += 15 * 60000) {
        expect(fields(ms, zone)).toBe(exact(ms, zone));
      }
    }
  });

  it('computes an airport offset once per day, not once per value', () => {
    const before = offsetCacheStats().exactLookups;
    const start = Date.UTC(2031, 4, 4, 0, 0);
    for (let minute = 0; minute < 24 * 60; minute += 1) formatTime(start + minute * 60000);
    const used = offsetCacheStats().exactLookups - before;
    // One UTC day boundary is crossed: at most two days, two exact lookups each.
    expect(used).toBeLessThanOrEqual(4);
  });
});
