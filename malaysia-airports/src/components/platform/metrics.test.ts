import { describe, expect, it } from 'vitest';
import { createMetricsStore } from '@/lib/seo/metrics-store';
import { parseMetric, sectionOf, withCampaign } from './metrics';

describe('aggregate measurement (exec-commerce-12)', () => {
  it('accepts only the declared fields and values', () => {
    expect(parseMetric({ event: 'answer', name: 'parking-price', state: 'answered', section: '/en/kul/parking' })).toEqual({ event: 'answer', name: 'parking-price', state: 'answered', section: '/en/kul/parking' });
    expect(parseMetric({ event: 'handoff', name: 'parking-booking', host: 'www.example.com', section: '/ms/kul/parking' })).toMatchObject({ host: 'www.example.com' });
    expect(parseMetric({ event: 'answer', name: 'parking-price', state: 'answered', section: '/en/kul/parking', visitor: 'abc' })).toBeNull();
    expect(parseMetric({ event: 'answer', name: 'parking-price', state: 'maybe', section: '/en' })).toBeNull();
    expect(parseMetric({ event: 'search', name: 'x', section: '/en' })).toBeNull();
    expect(parseMetric({ event: 'handoff', name: 'Parking Booking', host: 'x.example', section: '/en' })).toBeNull();
    expect(parseMetric({ event: 'answer', name: 'a', state: 'answered', section: '/en/kul/flights/mh1-20261121-d' })).toBeNull();
  });

  it('reduces a path to its section, never a query or an id', () => {
    expect(sectionOf('/en/kul/flights/mh2610-20261121-d?ref=me#top')).toBe('/en/kul/flights');
    expect(sectionOf('/ms')).toBe('/ms');
    expect(sectionOf('/en/search?q=passport A1234567')).toBe('/en/search');
    expect(sectionOf('/xx/<script>')).toBe('/other');
  });

  it('adds campaign parameters to outbound https links only', () => {
    expect(withCampaign('https://partner.example/book?from=x', 'parking-booking')).toBe('https://partner.example/book?from=x&utm_source=malaysia-airports-concept&utm_medium=referral&utm_campaign=parking-booking');
    expect(withCampaign('https://partner.example/?utm_source=theirs', 'parking-booking')).toBe('https://partner.example/?utm_source=theirs');
    expect(withCampaign('mailto:a@example.com', 'x')).toBe('mailto:a@example.com');
    expect(withCampaign('/en/kul', 'x')).toBe('/en/kul');
  });

  it('counts per day and measurement, with a bounded number of keys', () => {
    const store = createMetricsStore(2);
    const metric = { event: 'answer', name: 'parking-price', state: 'answered', section: '/en/kul/parking' } as const;
    store.add(metric, '2026-11-21');
    store.add(metric, '2026-11-21');
    store.add({ ...metric, state: 'partial' }, '2026-11-21');
    store.add({ ...metric, name: 'other' }, '2026-11-21');
    expect(store.summary()).toEqual([
      { key: '2026-11-21 | answer | parking-price | answered | /en/kul/parking', count: 2 },
      { key: '2026-11-21 | answer | parking-price | partial | /en/kul/parking', count: 1 },
    ]);
  });
});
