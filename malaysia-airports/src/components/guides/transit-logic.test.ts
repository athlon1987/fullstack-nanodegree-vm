import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TRANSIT_INPUT,
  LAYOVER_OPTIONS,
  airsideFlavour,
  estimateTime,
  parseTransitQuery,
  timeVerdict,
  transitCase,
  transitQuery,
  transitSteps,
  type TransitInput,
} from './transit-logic';

const input = (overrides: Partial<TransitInput>): TransitInput => ({ ...DEFAULT_TRANSIT_INPUT, ...overrides });

describe('transitCase', () => {
  it('keeps one booking in one terminal airside', () => {
    expect(transitCase(input({}))).toBe('airside');
  });
  it('sends separate tickets landside', () => {
    expect(transitCase(input({ ticket: 'self' }))).toBe('landside-same');
  });
  it('treats a terminal change as landside whatever the ticket', () => {
    expect(transitCase(input({ to: 'T2' }))).toBe('landside-change');
    expect(transitCase(input({ to: 'T2', ticket: 'self' }))).toBe('landside-change');
  });
});

describe('transitSteps', () => {
  it('international to international airside: transfer signs then gate', () => {
    expect(transitSteps(input({}))).toEqual(['leave-aircraft', 'transfer-signs', 'gate']);
  });
  it('international to domestic: the traveller enters Malaysia and asks about bags', () => {
    expect(airsideFlavour({ arriving: 'international', departing: 'domestic' })).toBe('entering');
    expect(transitSteps(input({ departing: 'domestic' }))).toEqual(['leave-aircraft', 'immigration', 'bags-ask', 'customs', 'controls', 'gate']);
  });
  it('domestic to international: departure controls before the gate', () => {
    expect(transitSteps(input({ arriving: 'domestic' }))).toEqual(['leave-aircraft', 'transfer-signs', 'controls', 'gate']);
  });
  it('changing terminals from an international flight: the full landside sequence', () => {
    expect(transitSteps(input({ to: 'T2' }))).toEqual(['leave-aircraft', 'immigration', 'bags', 'customs', 'travel', 'check-in', 'controls', 'gate']);
  });
  it('changing terminals from a domestic flight skips immigration and customs', () => {
    expect(transitSteps(input({ to: 'T2', arriving: 'domestic' }))).toEqual(['leave-aircraft', 'bags', 'travel', 'check-in', 'controls', 'gate']);
  });
  it('self-transfer in one terminal walks to departures instead of travelling', () => {
    expect(transitSteps(input({ ticket: 'self' }))).toContain('to-departures');
    expect(transitSteps(input({ ticket: 'self' }))).not.toContain('travel');
  });
});

describe('estimateTime', () => {
  it('gives a range with min below max', () => {
    for (const to of ['T1', 'T2'] as const) {
      for (const ticket of ['protected', 'self'] as const) {
        const estimate = estimateTime(input({ to, ticket }));
        expect(estimate.min).toBeGreaterThan(0);
        expect(estimate.max).toBeGreaterThan(estimate.min);
      }
    }
  });
  it('makes a terminal change need more time than an airside transfer', () => {
    expect(estimateTime(input({ to: 'T2' })).min).toBeGreaterThan(estimateTime(input({})).max - 60);
    expect(estimateTime(input({ to: 'T2' })).max).toBeGreaterThan(estimateTime(input({})).max);
  });
  it('makes a domestic arrival quicker than an international one when changing terminals', () => {
    expect(estimateTime(input({ to: 'T2', arriving: 'domestic' })).max).toBeLessThan(estimateTime(input({ to: 'T2' })).max);
  });
  it('lists the fixed deadlines last for a new check-in', () => {
    const ids = estimateTime(input({ ticket: 'self' })).segments.map((segment) => segment.id);
    expect(ids.slice(-2)).toEqual(['cutoff', 'gateClose']);
  });
});

describe('timeVerdict', () => {
  it('grades a layover against the range', () => {
    expect(timeVerdict(200, { min: 60, max: 150 })).toBe('comfortable');
    expect(timeVerdict(150, { min: 60, max: 150 })).toBe('comfortable');
    expect(timeVerdict(100, { min: 60, max: 150 })).toBe('tight');
    expect(timeVerdict(45, { min: 60, max: 150 })).toBe('very-tight');
  });
});

describe('URL state', () => {
  it('round-trips through the query string', () => {
    const state = input({ to: 'T2', ticket: 'self', arriving: 'domestic', layover: 180 });
    expect(parseTransitQuery(new URLSearchParams(transitQuery(state)))).toEqual(state);
  });
  it('falls back to defaults for junk', () => {
    expect(parseTransitQuery(new URLSearchParams('from=T9&ticket=x&layover=7'))).toEqual(DEFAULT_TRANSIT_INPUT);
  });
  it('offers the default layover', () => {
    expect(LAYOVER_OPTIONS).toContain(DEFAULT_TRANSIT_INPUT.layover);
  });
});
