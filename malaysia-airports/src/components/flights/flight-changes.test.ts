import { describe, expect, it } from 'vitest';
import { getT } from '@/lib/i18n';
import { makeFlight } from '@/lib/testing/fixtures';
import { collectChanges, describeFlightChanges, diffSnapshot, snapshotOf } from './flight-changes';

describe('flight changes', () => {
  const before = makeFlight({ status: 'check-in-open' });

  it('reports status, time, gate and belt changes', () => {
    const after = makeFlight({ status: 'boarding', estimated: '2026-11-17T14:30:00+08:00', gate: 'C12' });
    expect(diffSnapshot(snapshotOf(before), snapshotOf(after))).toEqual([
      { kind: 'status', from: 'check-in-open', to: 'boarding' },
      { kind: 'time', from: before.estimated, to: after.estimated },
      { kind: 'gate', from: undefined, to: 'C12' },
    ]);
  });

  it('treats the same instant written differently as no change and ignores a gate that disappears', () => {
    const previous = { ...snapshotOf(before), gate: 'C12' };
    const next = { ...snapshotOf(before), estimated: '2026-11-17T06:00:00.000Z' };
    expect(diffSnapshot(previous, next)).toEqual([]);
  });

  it('only reports flights seen before', () => {
    const known = new Map([[before.id, snapshotOf(before)]]);
    const fresh = makeFlight({ digits: '99', status: 'boarding' });
    const changed = collectChanges(known, [makeFlight({ status: 'boarding' }), fresh]);
    expect(changed).toHaveLength(1);
    expect(changed[0].flight.id).toBe(before.id);
  });

  it('describes the changes in both languages', () => {
    const changes = diffSnapshot(snapshotOf(before), snapshotOf(makeFlight({ status: 'boarding', gate: 'C12' })));
    expect(describeFlightChanges(before, changes, getT('en'), 'en')).toBe('MH 2610 to London: now Boarding and gate C12.');
    expect(describeFlightChanges(before, changes, getT('ms'), 'ms')).toBe('MH 2610 ke London: kini Menaiki pesawat dan pintu C12.');
  });
});
