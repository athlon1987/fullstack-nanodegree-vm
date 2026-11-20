import { describe, expect, it } from 'vitest';
import type { Flight } from '@/lib/flights';
import { previewFlights } from './preview-filter';

const NOW = Date.parse('2026-11-18T12:00:00+08:00');
const at = (minutes: number) => new Date(NOW + minutes * 60_000).toISOString();

function flight(id: string, direction: 'd' | 'a', minutes: number, status: Flight['status']): Flight {
  return {
    id,
    airline: { code: 'MH', name: 'Malaysia Airlines' },
    number: `MH${id}`,
    direction,
    airport: 'kul',
    terminal: 'T1',
    origin: { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia' },
    destination: { code: 'PEN', city: 'Penang', country: 'Malaysia' },
    date: '2026-11-18',
    scheduled: at(minutes),
    estimated: at(minutes),
    status,
    delayMinutes: 0,
    isDemo: true,
  } as Flight;
}

describe('previewFlights (A-20)', () => {
  it('starts departures 15 minutes from now and drops gate-closed, departed and cancelled flights', () => {
    const list = previewFlights(
      [
        flight('1', 'd', -20, 'departed'),
        flight('2', 'd', 5, 'gate-closed'),
        flight('3', 'd', 10, 'final-call'),
        flight('4', 'd', 16, 'boarding'),
        flight('5', 'd', 40, 'cancelled'),
        flight('6', 'd', 30, 'check-in-open'),
        flight('7', 'd', 20, 'gate-closed'),
      ],
      NOW,
      6,
    );
    expect(list.map((item) => item.id)).toEqual(['4', '6']);
  });

  it('keeps arrivals that are still to land or on the belt, sorted and limited', () => {
    const list = previewFlights(
      [flight('a', 'a', 30, 'en-route'), flight('b', 'a', -10, 'baggage'), flight('c', 'a', -40, 'completed'), flight('d', 'a', 5, 'landed'), flight('e', 'a', 60, 'scheduled')],
      NOW,
      2,
    );
    expect(list.map((item) => item.id)).toEqual(['b', 'd']);
  });
});
