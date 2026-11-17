import { describe, expect, it } from 'vitest';
import { getAirportContent } from '@/content';
import { lt, type TransportOption } from '@/content/types';
import { compareTransport } from './transport';

function option(id: string, mode: TransportOption['mode'], extra: Partial<TransportOption> = {}): TransportOption {
  return {
    id,
    airport: 'kul',
    mode,
    name: lt(id),
    destinations: [],
    boarding: [],
    provenance: 'official',
    sources: ['test'],
    ...extra,
  };
}

/** Invented test fixtures: these are not published fares. */
const rail = option('rail', 'rail', {
  destinations: [
    { name: lt('City centre', 'Pusat bandar'), fare: { amount: 55, currency: 'MYR' }, durationMinutes: 28 },
    { name: lt('Midway station'), fare: { amount: 20, currency: 'MYR' }, durationMinutes: 15 },
  ],
  accessibility: { stepFree: true },
  frequencyMinutes: 15,
});
const bus = option('bus', 'bus', { destinations: [{ name: lt('City centre'), fare: { amount: 15, currency: 'MYR' }, durationMinutes: 60 }] });
const taxi = option('taxi', 'taxi', { destinations: [{ name: lt('City centre'), durationMinutes: 45 }], accessibility: { stepFree: false } });
const hailing = option('e-hailing', 'e-hailing', { hours: { kind: '24h' } });
const options = [taxi, hailing, rail, bus];
const order = (rows: { option: TransportOption }[]) => rows.map((row) => row.option.id);

describe('compareTransport', () => {
  it('sorts by published fare and puts options without a fare last, labelled', () => {
    const rows = compareTransport(options, { priority: 'price', destination: 'City centre' });
    expect(order(rows)).toEqual(['bus', 'rail', 'taxi', 'e-hailing']);
    expect(rows[0]).toMatchObject({ fare: 15, rank: 1, score: 100, basis: 'published' });
    expect(rows[0].labels).toContain('lowest-fare');
    expect(rows[2].labels).toContain('fare-not-published');
    expect(rows[2].score).toBe(0);
    expect(rows[3].labels).toEqual(expect.arrayContaining(['destination-not-listed', 'fare-not-published']));
  });

  it('never invents a missing fare or journey time', () => {
    const rows = compareTransport(options, { priority: 'price' });
    const taxiRow = rows.find((row) => row.option.id === 'taxi');
    const hailingRow = rows.find((row) => row.option.id === 'e-hailing');
    expect(taxiRow?.fare).toBeUndefined();
    expect(taxiRow?.minutes).toBe(45);
    expect(hailingRow?.fare).toBeUndefined();
    expect(hailingRow?.minutes).toBeUndefined();
  });

  it('sorts by published journey time', () => {
    const rows = compareTransport(options, { priority: 'time', destination: 'city' });
    expect(order(rows)).toEqual(['rail', 'taxi', 'bus', 'e-hailing']);
    expect(rows[0].labels).toContain('shortest-time');
    expect(rows[3].labels).toContain('duration-not-published');
  });

  it('matches destinations in either language and uses the cheapest when none is asked for', () => {
    expect(compareTransport([rail], { priority: 'price', destination: 'pusat bandar' })[0].fare).toBe(55);
    expect(compareTransport([rail], { priority: 'price', destination: 'midway' })[0].fare).toBe(20);
    expect(compareTransport([rail], { priority: 'price' })[0].fare).toBe(20);
  });

  it('ranks convenience with a labelled heuristic and accessibility by confirmed step-free access', () => {
    const convenience = compareTransport(options, { priority: 'convenience' });
    expect(order(convenience).slice(0, 2)).toEqual(['e-hailing', 'taxi']);
    expect(convenience.every((row) => row.basis === 'heuristic')).toBe(true);

    const accessible = compareTransport(options, { priority: 'accessibility' });
    expect(order(accessible)[0]).toBe('rail');
    expect(order(accessible)[3]).toBe('taxi');
    expect(accessible[0].labels).toContain('step-free');
    expect(accessible[1].labels).toContain('step-free-unknown');
    expect(accessible[3].labels).toContain('not-step-free');
  });

  it('can be limited to some modes', () => {
    expect(order(compareTransport(options, { priority: 'price', modes: ['rail', 'bus'] }))).toEqual(['bus', 'rail']);
    expect(compareTransport([], { priority: 'price' })).toEqual([]);
  });

  it('works on the real KLIA content: only the complimentary shuttle has a published fare', () => {
    const rows = compareTransport(getAirportContent('kul')?.transport ?? [], { priority: 'price' });
    expect(rows[0]).toMatchObject({ fare: 0, score: 100 });
    expect(rows[0].option.id).toBe('kul-ltcp-shuttle');
    expect(rows.slice(1).every((row) => row.fare === undefined && row.labels.includes('fare-not-published'))).toBe(true);
  });
});
