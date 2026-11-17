import { describe, expect, it } from 'vitest';
import { SEARCH_DOC_TYPES, buildSearchDocuments, createSearchIndex, expandQuery, looksLikeFlightQuery, searchAll } from './index';

const english = buildSearchDocuments('en');
const malay = buildSearchDocuments('ms');
const index = createSearchIndex(english);
const malayIndex = createSearchIndex(malay);

const top = (query: string, options: Parameters<typeof searchAll>[2] = {}) => searchAll(index, query, options).groups[0]?.hits[0];
const allIds = (query: string, options: Parameters<typeof searchAll>[2] = {}) =>
  searchAll(index, query, { limit: 50, ...options }).groups.flatMap((group) => group.hits.map((hit) => hit.id));

describe('buildSearchDocuments', () => {
  it('covers airports, facilities, transport, car parks, guides, FAQs, notices and corporate pages', () => {
    const types = new Set(english.map((document) => document.type));
    for (const type of SEARCH_DOC_TYPES) {
      if (type === 'outlet') continue; // no outlet has been verified yet
      expect(types.has(type), type).toBe(true);
    }
    expect(english.filter((document) => document.type === 'airport')).toHaveLength(39 + 2);
    expect(english.filter((document) => document.type === 'parking').map((document) => document.id)).toEqual(
      expect.arrayContaining(['parking:kul-t1-car-park', 'parking:kul-t1-preferred-parking', 'parking:kul-long-term-car-park', 'parking:kul-t2-gateway-car-park']),
    );
    expect(english.filter((document) => document.type === 'parking').length).toBe(english.filter((document) => document.id.startsWith('parking:')).length);
  });

  it('gives every document a unique id and a link without a locale prefix', () => {
    expect(new Set(english.map((document) => document.id)).size).toBe(english.length);
    for (const document of english) {
      expect(document.href.startsWith('/'), document.id).toBe(true);
      expect(/^\/(en|ms)(\/|$)/.test(document.href), document.id).toBe(false);
      expect(document.title.length, document.id).toBeGreaterThan(0);
    }
    expect(english.find((document) => document.id === 'facility:kul-t1-plaza-premium-lounge')?.href).toBe('/kul/lounges#kul-t1-plaza-premium-lounge');
    expect(english.find((document) => document.id === 'airport:kul:t2')?.href).toBe('/kul?t=T2');
  });

  it('writes titles in the requested language and keeps both languages searchable', () => {
    expect(malay.find((document) => document.id === 'facility:kul-t1-prayer-rooms')?.title).toBe('Surau');
    expect(english.find((document) => document.id === 'facility:kul-t1-prayer-rooms')?.title).toBe('Prayer rooms (surau)');
    expect(searchAll(malayIndex, 'prayer', { airport: 'kul' }).groups[0]?.hits[0]?.id).toBe('facility:kul-t1-prayer-rooms');
    expect(searchAll(malayIndex, 'parkir').groups.find((group) => group.type === 'parking')?.hits.length).toBeGreaterThanOrEqual(3);
  });
});

describe('searchAll', () => {
  it('finds the prayer room by any of its names', () => {
    for (const query of ['surau', 'prayer room', 'musolla', 'solat', 'Prayer']) {
      expect(top(query, { airport: 'kul' })?.id, query).toBe('facility:kul-t1-prayer-rooms');
    }
    expect(expandQuery('musolla')).toContain('surau');
    expect(expandQuery('where is the washroom')).toContain('tandas');
    expect(expandQuery('gate')).toBe('gate');
  });

  it('understands common intents through synonyms', () => {
    expect(allIds('cash machine')).toContain('facility:kul-t1-atms');
    expect(allIds('doctor')).toContain('facility:kul-t1-medical-services');
    expect(allIds('autism')).toContain('facility:kul-t1-calm-room');
    expect(allIds('car park').filter((id) => id.startsWith('parking:'))).toHaveLength(english.filter((document) => document.type === 'parking').length);
    expect(allIds('satellite')).toContain('transport:kul-t1-aerotrain');
    expect(allIds('lost')).toEqual(expect.arrayContaining(['facility:kul-t1-lost-and-found', 'faq:klia-lost-item']));
    expect(allIds('coach')).toContain('transport:kul-t1-buses');
  });

  it('matches prefixes and forgives small typos', () => {
    expect(top('penan')?.id).toBe('airport:pen');
    expect(top('langkwai')?.id).toBe('airport:lgk');
    expect(top('BKI')?.id).toBe('airport:bki');
    expect(top('aerotran')?.id).toBe('transport:kul-t1-aerotrain');
  });

  it('groups hits by type, limits each group and counts everything', () => {
    const results = searchAll(index, 'klia', { limit: 2 });
    expect(results.groups.length).toBeGreaterThan(2);
    for (const group of results.groups) {
      expect(group.hits.length).toBeLessThanOrEqual(2);
      expect(group.total).toBeGreaterThanOrEqual(group.hits.length);
      expect(group.hits.every((hit) => hit.type === group.type)).toBe(true);
    }
    expect(results.total).toBe(results.groups.reduce((sum, group) => sum + group.total, 0));
    const scores = results.groups.map((group) => group.hits[0].score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('keeps results to the selected airport plus network-wide items', () => {
    expect(allIds('calm room', { airport: 'kul' })).toContain('facility:kul-t1-calm-room');
    expect(allIds('calm room', { airport: 'pen' }).some((id) => id.startsWith('facility:kul'))).toBe(false);
    expect(allIds('contact malaysia airports', { airport: 'pen' })).toContain('faq:contact-malaysia-airports');
    expect(allIds('parking', { types: ['faq'] }).every((id) => id.startsWith('faq:'))).toBe(true);
  });

  it('returns nothing for an empty query or nonsense', () => {
    expect(searchAll(index, '   ')).toEqual({ query: '   ', total: 0, groups: [] });
    expect(searchAll(index, 'zzzzqqqq').total).toBe(0);
  });

  it('builds quickly enough to run in the browser on demand', () => {
    const started = performance.now();
    createSearchIndex(english);
    expect(performance.now() - started).toBeLessThan(250);
    expect(index.size).toBe(english.length);
  });

  it('leaves flight-like queries to the flight lookup', () => {
    expect(looksLikeFlightQuery('MH 2610')).toBe(true);
    expect(looksLikeFlightQuery('kul to london')).toBe(true);
    expect(looksLikeFlightQuery('surau')).toBe(false);
  });
});
