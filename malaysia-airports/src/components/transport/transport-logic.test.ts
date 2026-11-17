import { describe, expect, it } from 'vitest';
import type { TransportOption } from '@/content/types';
import { compareTransport } from '@/lib/transport';
import {
  fareStatus,
  farePeriods,
  isDoorToDoor,
  optionsForDay,
  parseFareValidity,
  placeChoices,
  placeName,
  withDoorToDoorEntries,
} from './transport-logic';

const base = { airport: 'kul', boarding: [], provenance: 'official' as const, sources: ['x'] };

const express: TransportOption = {
  ...base,
  id: 'express',
  mode: 'rail',
  name: { en: 'Express' },
  destinations: [
    { name: { en: 'KL Sentral (fare from 1 January 2027)', ms: 'KL Sentral (tambang mulai 1 Januari 2027)' }, fare: { amount: 65, currency: 'MYR' }, durationMinutes: 28 },
    { name: { en: 'KL Sentral (fare until 31 December 2026)', ms: 'KL Sentral (tambang hingga 31 Disember 2026)' }, fare: { amount: 55, currency: 'MYR' }, durationMinutes: 28 },
  ],
};
const coach: TransportOption = { ...base, id: 'coach', mode: 'bus', name: { en: 'Coach' }, destinations: [{ name: { en: 'KL Sentral' } }] };
const stopping: TransportOption = {
  ...base,
  id: 'stopping',
  mode: 'rail',
  name: { en: 'Stopping' },
  destinations: [{ name: { en: 'Salak Tinggi' } }, { name: { en: 'Putrajaya & Cyberjaya' } }],
};
const hailing: TransportOption = { ...base, id: 'hail', mode: 'e-hailing', name: { en: 'E-hailing' }, destinations: [] };
const shuttle: TransportOption = { ...base, id: 'shuttle', mode: 'shuttle', name: { en: 'Shuttle' }, destinations: [] };

describe('fare validity', () => {
  it('reads the period from an English destination name', () => {
    expect(parseFareValidity({ en: 'KL Sentral (fare until 31 December 2026)' })).toEqual({ until: '2026-12-31' });
    expect(parseFareValidity({ en: 'KL Sentral (fare from 1 January 2027)' })).toEqual({ from: '2027-01-01' });
    expect(parseFareValidity({ en: 'KL Sentral' })).toEqual({});
    expect(parseFareValidity({ en: 'Terminal 1, Terminal 2 and the Long Term Car Park (loop)' })).toEqual({});
  });

  it('strips the period from the place name in both languages', () => {
    expect(placeName(express.destinations[0].name)).toEqual({ en: 'KL Sentral', ms: 'KL Sentral' });
    expect(placeName({ en: 'Kuala Lumpur city zone (KLCC, Bukit Bintang)' })).toEqual({ en: 'Kuala Lumpur city zone (KLCC, Bukit Bintang)' });
  });

  it('groups periods by place in date order', () => {
    const [place] = farePeriods(express);
    expect(place.name.en).toBe('KL Sentral');
    expect(place.periods.map((period) => period.destination.fare?.amount)).toEqual([55, 65]);
  });

  it('picks the fare that applies on a day and lists the coming change', () => {
    const [place] = farePeriods(express);
    const before = fareStatus(place, '2026-11-17');
    expect(before.current?.destination.fare?.amount).toBe(55);
    expect(before.upcoming.map((period) => period.from)).toEqual(['2027-01-01']);
    expect(fareStatus(place, '2026-12-31').current?.destination.fare?.amount).toBe(55);
    const after = fareStatus(place, '2027-01-01');
    expect(after.current?.destination.fare?.amount).toBe(65);
    expect(after.upcoming).toEqual([]);
  });

  it('reports an expired fare instead of showing it', () => {
    const old: TransportOption = { ...express, destinations: [express.destinations[1]] };
    const [place] = farePeriods(old);
    const status = fareStatus(place, '2027-03-01');
    expect(status.current).toBeUndefined();
    expect(status.expired?.until).toBe('2026-12-31');
    expect(optionsForDay([old], '2027-03-01')[0].destinations[0]).toEqual({ name: { en: 'KL Sentral', ms: 'KL Sentral' }, durationMinutes: 28 });
  });
});

describe('optionsForDay and compareTransport', () => {
  it('ranks on the fare in force on the day', () => {
    const today = compareTransport(optionsForDay([express, coach], '2026-11-17'), { priority: 'price', destination: 'KL Sentral' });
    expect(today[0].fare).toBe(55);
    expect(today[1].labels).toContain('fare-not-published');
    const next = compareTransport(optionsForDay([express, coach], '2027-02-01'), { priority: 'price', destination: 'KL Sentral' });
    expect(next[0].fare).toBe(65);
  });

  it('keeps the first period when the day is unknown', () => {
    const [option] = optionsForDay([express], null);
    expect(option.destinations).toHaveLength(1);
    expect(option.destinations[0].fare?.amount).toBe(55);
  });

  it('leaves options without periods unchanged in substance', () => {
    const [option] = optionsForDay([stopping], '2026-11-17');
    expect(option.destinations.map((item) => item.name.en)).toEqual(['Salak Tinggi', 'Putrajaya & Cyberjaya']);
  });
});

describe('places and door-to-door options', () => {
  it('lists places, most widely served first', () => {
    const choices = placeChoices([express, coach, stopping, hailing]);
    expect(choices[0]).toMatchObject({ value: 'KL Sentral', count: 2 });
    expect(choices.map((choice) => choice.value)).toEqual(['KL Sentral', 'Putrajaya & Cyberjaya', 'Salak Tinggi']);
  });

  it('recognises door-to-door modes only', () => {
    expect(isDoorToDoor(hailing)).toBe(true);
    expect(isDoorToDoor(shuttle)).toBe(false);
    expect(isDoorToDoor(coach)).toBe(false);
  });

  it('lets door-to-door options rank with the rest, without a number', () => {
    const rows = compareTransport(withDoorToDoorEntries([express, hailing, shuttle], 'KL Sentral'), { priority: 'convenience', destination: 'KL Sentral' });
    expect(rows[0].option.id).toBe('hail');
    expect(rows[0].fare).toBeUndefined();
    expect(rows[0].labels).not.toContain('destination-not-listed');
    expect(rows.find((row) => row.option.id === 'shuttle')?.labels).toContain('destination-not-listed');
  });
});
