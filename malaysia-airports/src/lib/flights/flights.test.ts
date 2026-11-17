import { describe, expect, it } from 'vitest';
import { KUL, LHR, NRT, PEN, SIN, makeFlight } from '@/lib/testing/fixtures';
import {
  FLIGHT_STATUSES,
  FLIGHT_STATUS_META,
  decodeFlightId,
  encodeFlightId,
  filterFlights,
  flightDesignator,
  flightStatusLabel,
  formatFlightNumber,
  groupFlightsByHour,
  isFinalStatus,
  isFlightId,
  isInternationalFlight,
  looksLikeFlightQuery,
  matchFlight,
  parseFlightQuery,
  placeMatchScore,
  rankFlights,
  remotePlace,
  searchFlights,
  sortFlights,
  statusesForDirection,
} from './index';

describe('flight ids', () => {
  it('round-trips the documented format', () => {
    const id = encodeFlightId({ airlineCode: 'MH', number: '2610', date: '2026-11-17', direction: 'd' });
    expect(id).toBe('mh2610-20261117-d');
    expect(decodeFlightId(id)).toEqual({ airlineCode: 'MH', number: '2610', date: '2026-11-17', direction: 'd' });
  });

  it('supports airline codes with digits and strips leading zeros', () => {
    expect(decodeFlightId('d7123-20261117-a')).toEqual({ airlineCode: 'D7', number: '123', date: '2026-11-17', direction: 'a' });
    expect(encodeFlightId({ airlineCode: 'sq', number: '0002', date: '2026-01-05', direction: 'a' })).toBe('sq2-20260105-a');
    expect(flightDesignator('mh', '0072')).toBe('MH72');
    expect(decodeFlightId('  MH2610-20261117-D ')).toMatchObject({ airlineCode: 'MH', direction: 'd' });
  });

  it('rejects malformed ids and impossible dates', () => {
    for (const bad of ['mh2610', 'mh2610-20261117', 'mh2610-20261332-d', 'mh2610-20261117-x', 'mh-20261117-d', 'mh26101-20261117-d', '']) {
      expect(decodeFlightId(bad), bad).toBeNull();
      expect(isFlightId(bad), bad).toBe(false);
    }
    expect(() => encodeFlightId({ airlineCode: 'MAS', number: '2610', date: '2026-11-17', direction: 'd' })).toThrow();
    expect(() => encodeFlightId({ airlineCode: 'MH', number: '2610', date: '2026-02-31', direction: 'd' })).toThrow();
  });
});

describe('parseFlightQuery', () => {
  it('normalises every way of writing a flight number', () => {
    for (const text of ['MH 2610', 'mh2610', 'MH-2610', ' Mh  2610 ', 'MAS 2610', 'mas2610']) {
      expect(parseFlightQuery(text), text).toMatchObject({ kind: 'flight-number', airlineCode: 'MH', number: '2610' });
    }
    expect(parseFlightQuery('MH 0072')).toMatchObject({ airlineCode: 'MH', number: '72' });
    expect(parseFlightQuery('D7 536')).toMatchObject({ kind: 'flight-number', airlineCode: 'D7', number: '536' });
    expect(parseFlightQuery('2610')).toMatchObject({ kind: 'flight-number', number: '2610' });
    expect(parseFlightQuery('2610').airlineCode).toBeUndefined();
  });

  it('recognises routes written with codes or city names, in English or Malay', () => {
    expect(parseFlightQuery('KUL-LHR')).toMatchObject({ kind: 'route', from: 'kul', to: 'lhr' });
    expect(parseFlightQuery('kul > lhr')).toMatchObject({ kind: 'route', from: 'kul', to: 'lhr' });
    expect(parseFlightQuery('KUL to London')).toMatchObject({ kind: 'route', from: 'kul', to: 'london' });
    expect(parseFlightQuery('Kuala Lumpur ke Tokyo')).toMatchObject({ kind: 'route', from: 'kuala lumpur', to: 'tokyo' });
  });

  it('treats everything else as text, including "flights to London"', () => {
    expect(parseFlightQuery('AirAsia')).toMatchObject({ kind: 'text', terms: ['airasia'] });
    expect(parseFlightQuery('flights to London')).toMatchObject({ kind: 'text', terms: ['london'] });
    expect(parseFlightQuery('   ')).toMatchObject({ kind: 'empty' });
    expect(parseFlightQuery('XYZ 123').kind).toBe('text');
  });

  it('tells flight-like queries from general questions', () => {
    expect(looksLikeFlightQuery('MH 2610')).toBe(true);
    expect(looksLikeFlightQuery('KUL-LHR')).toBe(true);
    expect(looksLikeFlightQuery('surau')).toBe(false);
    expect(looksLikeFlightQuery('where is the prayer room')).toBe(false);
  });
});

const london = makeFlight({ code: 'MH', digits: '2', time: '23:30', remote: LHR, codeshares: ['QR 5441'] });
const londonBa = makeFlight({ code: 'BA', digits: '34', time: '22:50', remote: LHR });
const penang = makeFlight({ code: 'MH', digits: '2610', time: '08:25', remote: PEN });
const penangAk = makeFlight({ code: 'AK', digits: '6114', time: '09:10', remote: PEN, terminal: 'T2' });
const tokyo = makeFlight({ code: 'JL', digits: '724', time: '22:40', remote: NRT, status: 'delayed', estimated: '2026-11-17T23:55:00+08:00', delayMinutes: 75 });
const fromLondon = makeFlight({ code: 'MH', digits: '1', time: '17:35', remote: LHR, direction: 'a' });
const singapore = makeFlight({ code: 'SQ', digits: '106', time: '10:05', remote: SIN });
const penang26 = makeFlight({ code: 'MH', digits: '26', time: '12:00', remote: PEN });
const all = [london, londonBa, penang, penangAk, tokyo, fromLondon, singapore, penang26];
const ids = (flights: { id: string }[]) => flights.map((flight) => flight.id);

describe('matchFlight and search', () => {
  it('scores an exact flight number above a prefix, and finds ICAO-style input', () => {
    expect(matchFlight(penang, parseFlightQuery('MH 2610'))).toBe(100);
    expect(matchFlight(penang, parseFlightQuery('MAS 2610'))).toBe(100);
    expect(matchFlight(penang, parseFlightQuery('MH 26'))).toBe(70);
    expect(matchFlight(penang, parseFlightQuery('AK 2610'))).toBe(0);
    expect(ids(searchFlights(all, 'mh26'))).toEqual([penang26.id, penang.id]);
  });

  it('matches a number without the airline, and codeshare numbers', () => {
    expect(ids(searchFlights(all, '2610'))).toEqual([penang.id]);
    expect(matchFlight(london, parseFlightQuery('QR 5441'))).toBe(85);
    expect(ids(searchFlights(all, 'qr5441'))).toEqual([london.id]);
  });

  it('matches airline by code or name', () => {
    expect(ids(searchFlights(all, 'JL'))).toEqual([tokyo.id]);
    expect(ids(searchFlights(all, 'malaysia airlines')).sort()).toEqual([london.id, penang.id, fromLondon.id, penang26.id].sort());
    expect(ids(searchFlights(all, 'airasia'))).toEqual([penangAk.id]);
  });

  it('matches the far-end city, airport code and country', () => {
    expect(ids(searchFlights(all, 'london')).sort()).toEqual([london.id, londonBa.id, fromLondon.id].sort());
    expect(ids(searchFlights(all, 'LHR')).sort()).toEqual([london.id, londonBa.id, fromLondon.id].sort());
    expect(ids(searchFlights(all, 'tokyo'))).toEqual([tokyo.id]);
    expect(ids(searchFlights(all, 'japan'))).toEqual([tokyo.id]);
    expect(searchFlights(all, 'kuala lumpur')).toEqual([]);
  });

  it('matches routes in the direction they are written', () => {
    expect(ids(searchFlights(all, 'KUL-LHR')).sort()).toEqual([london.id, londonBa.id].sort());
    expect(ids(searchFlights(all, 'KUL to London')).sort()).toEqual([london.id, londonBa.id].sort());
    expect(ids(searchFlights(all, 'London to Kuala Lumpur'))).toEqual([fromLondon.id]);
    expect(searchFlights(all, 'PEN-LHR')).toEqual([]);
  });

  it('requires every word of a multi-word query to match', () => {
    expect(ids(searchFlights(all, 'airasia penang'))).toEqual([penangAk.id]);
    expect(searchFlights(all, 'airasia london')).toEqual([]);
  });

  it('ranks by score, then upcoming flights before past ones when given the time', () => {
    const ranked = rankFlights(all, 'penang', { now: '2026-11-17T08:45:00+08:00' });
    expect(ranked.map((match) => match.flight.id)).toEqual([penangAk.id, penang26.id, penang.id]);
    expect(rankFlights(all, 'penang', { limit: 1 })).toHaveLength(1);
    expect(rankFlights(all, '')).toEqual([]);
  });

  it('ignores accents and case when matching places', () => {
    expect(placeMatchScore({ code: 'CGK', city: 'Jakarta', country: 'Indonesia' }, 'JAKÁRTA')).toBeGreaterThan(0.9);
    expect(placeMatchScore(NRT, 'narita')).toBeGreaterThan(0);
    expect(placeMatchScore(NRT, 'xyz')).toBe(0);
    expect(remotePlace(fromLondon)).toEqual(LHR);
    expect(remotePlace(london)).toEqual(LHR);
  });
});

describe('filter, sort and group', () => {
  it('filters by direction, terminal, status, airline and scope', () => {
    expect(ids(filterFlights(all, { direction: 'a' }))).toEqual([fromLondon.id]);
    expect(ids(filterFlights(all, { terminal: 'T2' }))).toEqual([penangAk.id]);
    expect(ids(filterFlights(all, { status: ['delayed'] }))).toEqual([tokyo.id]);
    expect(ids(filterFlights(all, { airline: 'sq' }))).toEqual([singapore.id]);
    expect(filterFlights(all, { international: false }).every((flight) => !isInternationalFlight(flight))).toBe(true);
    expect(filterFlights(all, {})).toHaveLength(all.length);
  });

  it('filters a time window on the expected time, so delayed flights stay on the board', () => {
    const window = { from: '2026-11-17T23:00:00+08:00', to: '2026-11-18T00:00:00+08:00' };
    expect(ids(filterFlights(all, window)).sort()).toEqual([london.id, tokyo.id].sort());
  });

  it('sorts by scheduled or expected time', () => {
    expect(ids(sortFlights(all)).slice(0, 2)).toEqual([penang.id, penangAk.id]);
    const late = sortFlights([tokyo, londonBa], 'estimated');
    expect(ids(late)).toEqual([londonBa.id, tokyo.id]);
  });

  it('groups flights by local hour', () => {
    const groups = groupFlightsByHour(all);
    expect(groups.map((group) => group.label)).toEqual(['08:00', '09:00', '10:00', '12:00', '17:00', '22:00', '23:00']);
    expect(ids(groups[5].flights)).toEqual([tokyo.id, londonBa.id]);
    expect(groups[0]).toMatchObject({ date: '2026-11-17', hour: 8 });
  });

  it('formats flight numbers for display', () => {
    expect(formatFlightNumber(penang)).toBe('MH 2610');
    expect(formatFlightNumber('d7536')).toBe('D7 536');
    expect(isInternationalFlight({ origin: KUL, destination: PEN })).toBe(false);
  });
});

describe('status model', () => {
  it('gives every status a label in both languages, a tone and an icon', () => {
    expect(FLIGHT_STATUSES).toHaveLength(14);
    for (const status of FLIGHT_STATUSES) {
      const meta = FLIGHT_STATUS_META[status];
      expect(meta.label.en, status).toBeTruthy();
      expect(meta.label.ms, status).toBeTruthy();
      expect(['neutral', 'positive', 'warning', 'critical', 'muted']).toContain(meta.tone);
      expect(meta.icon, status).toMatch(/^[a-z-]+$/);
    }
    expect(flightStatusLabel('boarding', 'ms')).toBe('Menaiki pesawat');
    expect(FLIGHT_STATUS_META.cancelled.tone).toBe('critical');
    expect(FLIGHT_STATUS_META.delayed.tone).toBe('warning');
  });

  it('knows which statuses belong to which board and which are final', () => {
    expect(statusesForDirection('a')).not.toContain('boarding');
    expect(statusesForDirection('a')).toContain('baggage');
    expect(statusesForDirection('d')).not.toContain('landed');
    expect(statusesForDirection('d')).toContain('delayed');
    expect(isFinalStatus('departed')).toBe(true);
    expect(isFinalStatus('cancelled')).toBe(true);
    expect(isFinalStatus('boarding')).toBe(false);
  });
});
