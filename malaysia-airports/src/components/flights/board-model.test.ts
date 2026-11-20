import { describe, expect, it } from 'vitest';
import { FLIGHT_STATUSES, statusesForDirection } from '@/lib/flights';
import { PEN, SIN, makeFlight } from '@/lib/testing/fixtures';
import {
  STATUS_GROUPS,
  boardQueryString,
  boardRange,
  countByGroup,
  datesInRange,
  flightAvailability,
  isSearching,
  readBoardParams,
  readQueryKind,
  sameFlightOn,
  searchRange,
  selectBoardFlights,
  setAsideFinished,
  statusGroupOf,
} from './board-model';

const ZONE = 'Asia/Kuala_Lumpur';
const NOW = '2026-11-17T10:00:00+08:00';

describe('status groups', () => {
  it('put every status of a board in exactly one group', () => {
    for (const direction of ['d', 'a'] as const) {
      for (const status of statusesForDirection(direction)) {
        const groups = STATUS_GROUPS[direction].filter((group) => group.statuses.includes(status));
        expect(groups, `${direction} ${status}`).toHaveLength(1);
      }
    }
  });

  it('only use statuses that exist', () => {
    const all = new Set<string>(FLIGHT_STATUSES);
    for (const groups of Object.values(STATUS_GROUPS)) for (const group of groups) for (const status of group.statuses) expect(all.has(status)).toBe(true);
  });

  it('count flights per group', () => {
    const flights = [
      makeFlight({ digits: '1', status: 'boarding' }),
      makeFlight({ digits: '2', status: 'final-call' }),
      makeFlight({ digits: '3', status: 'delayed' }),
      makeFlight({ digits: '4', status: 'landed' }),
    ];
    expect(countByGroup(flights, 'd')).toEqual({ boarding: 2, delayed: 1 });
    expect(statusGroupOf('baggage', 'a')).toBe('landed');
    expect(statusGroupOf('boarding', 'a')).toBeUndefined();
  });
});

describe('URL filters', () => {
  it('read valid values and drop the rest', () => {
    const params = new URLSearchParams('dir=a&t=t2&q=MH%20123&s=landed,boarding,landed');
    expect(readBoardParams(params, ['T1', 'T2'])).toEqual({ direction: 'a', terminal: 'T2', q: 'MH 123', groups: ['landed'] });
  });

  it('ignore the terminal at a single-terminal airport and an unknown direction', () => {
    const params = new URLSearchParams('dir=x&t=T1&s=delayed');
    expect(readBoardParams(params, ['MAIN'])).toEqual({ direction: undefined, terminal: undefined, q: '', groups: ['delayed'] });
  });

  it('validate status groups against the fallback direction when the URL has none', () => {
    expect(readBoardParams(new URLSearchParams('s=boarding,landed'), ['MAIN'], 'a').groups).toEqual(['landed']);
  });

  it('write a stable query string', () => {
    expect(boardQueryString({ direction: 'd', terminal: 'T1', q: '  London ', groups: ['delayed', 'cancelled'] })).toBe('?dir=d&t=T1&q=London&s=delayed%2Ccancelled');
    expect(boardQueryString({})).toBe('');
  });
});

describe('time window', () => {
  // Intended change (B-16, ux-frequent-10): departures open 10 minutes back, not 45.
  it('starts 10 minutes back for departures, 45 for arrivals, 6 hours ahead, and moves in 3-hour steps', () => {
    const base = boardRange(NOW);
    expect(base.from.toISOString()).toBe('2026-11-17T01:50:00.000Z');
    expect(base.to.toISOString()).toBe('2026-11-17T08:00:00.000Z');
    expect(boardRange(NOW, 0, 0, 'a').from.toISOString()).toBe('2026-11-17T01:15:00.000Z');
    const moved = boardRange(NOW, 1, 2);
    expect(moved.from.toISOString()).toBe('2026-11-16T22:50:00.000Z');
    expect(moved.to.toISOString()).toBe('2026-11-17T14:00:00.000Z');
  });

  it('sets departed departures and completed arrivals aside in the default view', () => {
    const gone = makeFlight({ status: 'departed' });
    const leaving = makeFlight({ digits: '7', status: 'boarding' });
    expect(setAsideFinished([gone, leaving], 'd')).toEqual({ shown: [leaving], finished: 1 });
    const done = makeFlight({ direction: 'a', status: 'completed' });
    const landed = makeFlight({ direction: 'a', digits: '9', status: 'landed' });
    expect(setAsideFinished([done, landed], 'a')).toEqual({ shown: [landed], finished: 1 });
  });

  it('lists the local dates a window touches, with the day before just after midnight', () => {
    expect(datesInRange(boardRange(NOW), ZONE)).toEqual(['2026-11-17']);
    expect(datesInRange(searchRange(NOW, ZONE), ZONE)).toEqual(['2026-11-16', '2026-11-17', '2026-11-18']);
  });

  it('caps the steps', () => {
    expect(boardRange(NOW, 99, 99)).toEqual(boardRange(NOW, 4, 6));
    expect(boardRange(NOW, -3, -1)).toEqual(boardRange(NOW));
  });

  it('searches the whole of today and tomorrow in airport time', () => {
    const range = searchRange(NOW, ZONE);
    expect(range.from.toISOString()).toBe('2026-11-16T16:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-11-18T16:00:00.000Z');
  });
});

describe('selecting flights', () => {
  const pool = [
    makeFlight({ digits: '3', time: '16:00', remote: SIN, status: 'delayed' }),
    makeFlight({ digits: '1', time: '09:00', status: 'boarding' }),
    makeFlight({ code: 'AK', digits: '2', time: '11:00', remote: PEN, status: 'scheduled' }),
  ];

  it('sorts by scheduled time without a search or filter', () => {
    expect(selectBoardFlights(pool, { q: '', groups: [], direction: 'd' }).map((flight) => flight.number)).toEqual(['MH1', 'AK2', 'MH3']);
  });

  it('applies the search, then status groups, and keeps time order', () => {
    expect(selectBoardFlights(pool, { q: 'MH', groups: [], direction: 'd', now: NOW }).map((flight) => flight.number)).toEqual(['MH1', 'MH3']);
    expect(selectBoardFlights(pool, { q: 'MH', groups: ['delayed'], direction: 'd' }).map((flight) => flight.number)).toEqual(['MH3']);
    expect(selectBoardFlights(pool, { q: 'Penang', groups: [], direction: 'd' }).map((flight) => flight.number)).toEqual(['AK2']);
  });

  it('ignores one-character searches', () => {
    expect(isSearching('M')).toBe(false);
    expect(selectBoardFlights(pool, { q: 'M', groups: [], direction: 'd' })).toHaveLength(3);
  });

  it('says how a query is read', () => {
    expect(readQueryKind('MH 2610')).toBe('flightNumber');
    expect(readQueryKind('KUL-PEN')).toBe('route');
    expect(readQueryKind('London')).toBe('text');
    expect(readQueryKind('a')).toBeNull();
  });
});

describe('flight availability', () => {
  it('keeps yesterday to a week ahead', () => {
    expect(flightAvailability('2026-11-16', NOW, ZONE)).toBe('current');
    expect(flightAvailability('2026-11-15', NOW, ZONE)).toBe('expired');
    expect(flightAvailability('2026-11-24', NOW, ZONE)).toBe('current');
    expect(flightAvailability('2026-11-25', NOW, ZONE)).toBe('future');
  });

  it('finds the same flight number on another date', () => {
    expect(sameFlightOn('mh2610-20261115-d', '2026-11-17')).toBe('mh2610-20261117-d');
    expect(sameFlightOn('not-an-id', '2026-11-17')).toBeNull();
  });
});
