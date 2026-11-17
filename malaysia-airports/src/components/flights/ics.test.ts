import { describe, expect, it } from 'vitest';
import { getT } from '@/lib/i18n';
import { makeFlight } from '@/lib/testing/fixtures';
import { buildIcs, escapeIcsText, flightCalendarEvent, foldIcsLine, formatIcsDate, icsFileName } from './ics';

const URL_EN = 'https://example.test/en/kul/flights/mh2610-20261117-d';

describe('ics helpers', () => {
  it('formats instants in UTC basic format', () => {
    expect(formatIcsDate('2026-11-17T14:05:00+08:00')).toBe('20261117T060500Z');
  });

  it('escapes text values', () => {
    expect(escapeIcsText('a, b; c\\d\nnext')).toBe('a\\, b\\; c\\\\d\\nnext');
  });

  it('folds long lines at 75 octets without splitting characters', () => {
    const line = `DESCRIPTION:${'é'.repeat(80)}`;
    const folded = foldIcsLine(line);
    const encoder = new TextEncoder();
    for (const part of folded.split('\r\n')) expect(encoder.encode(part).length).toBeLessThanOrEqual(75);
    expect(folded.split('\r\n').map((part, index) => (index === 0 ? part : part.slice(1))).join('')).toBe(line);
    expect(foldIcsLine('SHORT:line')).toBe('SHORT:line');
  });
});

describe('flight calendar event', () => {
  const t = getT('en');

  it('spans a departure and labels it as demonstration data', () => {
    const flight = makeFlight({ durationMinutes: 800, gate: 'C12', checkInRow: 'H', checkInCounters: '1-18', status: 'check-in-open' });
    const event = flightCalendarEvent(flight, { t, lang: 'en', url: URL_EN, stamp: '2026-11-17T09:00:00+08:00' });
    expect(event.summary).toBe('MH 2610 Kuala Lumpur to London (demonstration)');
    expect(formatIcsDate(event.end)).toBe('20261117T192000Z');
    expect(event.description).toContain('Demonstration data');
    expect(event.description).toContain('Gate: C12');
    expect(event.description).toContain('Check-in: Row H, Counters 1-18');
    expect(event.location).toContain('Kuala Lumpur International Airport');
  });

  it('gives an arrival a 30-minute slot at the expected time', () => {
    const flight = makeFlight({ direction: 'a', estimated: '2026-11-17T14:30:00+08:00', belt: '5' });
    const event = flightCalendarEvent(flight, { t, lang: 'en', url: URL_EN, stamp: 0 });
    expect(formatIcsDate(event.start)).toBe('20261117T063000Z');
    expect(formatIcsDate(event.end)).toBe('20261117T070000Z');
    expect(event.description).toContain('Baggage belt: 5');
  });

  it('builds a valid calendar file', () => {
    const flight = makeFlight();
    const ics = buildIcs(flightCalendarEvent(flight, { t: getT('ms'), lang: 'ms', url: URL_EN, stamp: '2026-11-17T09:00:00+08:00' }));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTAMP:20261117T010000Z');
    expect(ics).toContain('UID:mh2610-20261117-d-kul@malaysia-airports-prototype');
    expect(ics).toContain('SUMMARY:MH 2610 Kuala Lumpur ke London (demonstrasi)');
    expect(ics.split('\r\n').every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
    expect(icsFileName(flight)).toBe('mh2610-20261117-d.ics');
  });
});
