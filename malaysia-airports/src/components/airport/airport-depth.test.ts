import { describe, expect, it } from 'vitest';
import { AIRPORTS } from '@/content';
import { getT } from '@/lib/i18n';
import { rowDayLabel } from '@/components/flights/flight-row';
import { sectionAvailability } from '@/components/shell/sections.server';
import { airportDepthLabel } from './airport-depth';

describe('round 4: content depth on /airports (re-review 6.1.8)', () => {
  const availability = sectionAvailability();
  const depth = (slug: string) => airportDepthLabel(availability, slug);

  it('labels each airport by the sections it really has, not its planned depth', () => {
    expect(depth('kul')).toBe('guide');
    expect(depth('pen')).toBe('guide');
    // Kuching and Langkawi are planned "full" but have only an overview and a board today.
    expect(depth('kch')).toBe('flights');
    expect(depth('lgk')).toBe('flights');
    expect(depth('iph')).toBe('flights');
    expect(depth('lwy')).toBe('directory');
  });

  it('gives every airport in the registry a label', () => {
    for (const airport of AIRPORTS) expect(['guide', 'flights', 'guide-only', 'directory'], airport.slug).toContain(depth(airport.slug));
  });
});

describe('round 4: a row on another day says which (gallery note 2)', () => {
  const t = getT('en');
  const now = new Date('2026-11-21T09:20:00+08:00');
  const flight = (estimated: string, status: 'scheduled' | 'cancelled' = 'scheduled') => ({ airport: 'iph', scheduled: estimated, estimated, status });

  it('names tomorrow, yesterday or the date, and nothing for today', () => {
    expect(rowDayLabel(flight('2026-11-21T15:30:00+08:00'), now, t)).toBeUndefined();
    expect(rowDayLabel(flight('2026-11-22T09:25:00+08:00'), now, t)).toBe('Tomorrow');
    expect(rowDayLabel(flight('2026-11-20T23:50:00+08:00'), now, t)).toBe('Yesterday');
    expect(rowDayLabel(flight('2026-11-24T09:25:00+08:00'), now, t)).toBe('24 Nov');
    expect(rowDayLabel(flight('2026-11-22T09:25:00+08:00'), now, getT('ms'))).toBe('Esok');
  });

  it('uses the airport day, not UTC: 07:00 tomorrow in Kuala Lumpur is still today in UTC', () => {
    expect(rowDayLabel(flight('2026-11-22T07:00:00+08:00'), now, t)).toBe('Tomorrow');
  });
});
