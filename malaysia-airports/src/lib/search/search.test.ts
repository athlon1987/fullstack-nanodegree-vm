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

describe('vocabulary and ranking (A-12)', () => {
  const first = (searchIndex: typeof index, query: string) =>
    searchAll(searchIndex, query, { limit: 5 })
      .groups.flatMap((group) => group.hits)
      .sort((a, b) => b.score - a.score)[0]?.id;

  // Query -> the record that must come first, in English and on the Malay site.
  const EXPECTED: Record<string, string> = {
    surau: 'facility:kul-t1-prayer-rooms',
    'prayer room': 'facility:kul-t1-prayer-rooms',
    lift: 'place:kul-t1-schematic:l5-lifts',
    lif: 'place:kul-t1-schematic:l5-lifts',
    elevator: 'place:kul-t1-schematic:l5-lifts',
    troli: 'unpublished:trolley',
    trolley: 'unpublished:trolley',
    'tukar wang': 'unpublished:moneyChanger',
    'pengurup wang': 'unpublished:moneyChanger',
    'money changer': 'unpublished:moneyChanger',
    halal: 'outlet:kul-t1-paul-le-cafe',
    'hearing loop': 'unpublished:hearingLoop',
    'accessible parking': 'unpublished:accessibleParking',
    AirAsia: 'airline:kul:ak',
    'information counter': 'facility:kul-t1-information-counter',
    atm: 'facility:kul-t1-atms',
    aerotrain: 'transport:kul-t1-aerotrain',
    buggy: 'guide:reduced-mobility',
  };

  it('puts the right record first for at least 15 queries, in both languages', () => {
    expect(Object.keys(EXPECTED).length).toBeGreaterThanOrEqual(15);
    for (const [query, id] of Object.entries(EXPECTED)) {
      expect(first(index, query), `en "${query}"`).toBe(id);
    }
    for (const query of ['surau', 'lif', 'troli', 'tukar wang', 'halal', 'hearing loop', 'AirAsia']) {
      expect(first(malayIndex, query), `ms "${query}"`).toBe(EXPECTED[query]);
    }
  });

  it('finds an airline record, not only its flights', () => {
    const hit = first(index, 'Malaysia Airlines');
    expect(hit?.startsWith('airline:'), hit).toBe(true);
  });

  it('never ranks news above the place for a facility query', () => {
    for (const query of ['surau', 'toilet', 'atm', 'halal']) {
      const hits = searchAll(index, query, { limit: 10 }).groups.flatMap((group) => group.hits).sort((a, b) => b.score - a.score);
      const news = hits.findIndex((hit) => hit.type === 'corporate');
      const place = hits.findIndex((hit) => hit.type === 'facility' || hit.type === 'outlet' || hit.type === 'place');
      expect(place, query).toBeGreaterThanOrEqual(0);
      if (news >= 0) expect(news, query).toBeGreaterThan(place);
    }
  });

  it('answers "fast track" with the Fast Track record, or an honest "not published" until it exists', () => {
    // Package D adds the record (D-02). Until then the gap answers instead of 0 results, and it
    // steps aside by itself once a real record is indexed.
    const record = english.find((document) => /fast track/i.test(document.title) && document.type !== 'unpublished');
    const expected = record ? record.id : 'unpublished:fastTrack';
    expect(first(index, 'fast track')).toBe(expected);
    expect(first(malayIndex, 'laluan pantas')).toBe(expected);
    expect(first(malayIndex, 'fast track')).toBe(expected);
    if (record) expect(english.some((document) => document.id === 'unpublished:fastTrack')).toBe(false);
  });

  it('never leads with a "not published" gap reached only through a synonym', () => {
    // "wheelchair" and "buggy" expand to "accessible", which the accessible-parking gap carries.
    for (const searchIndex of [index, malayIndex]) {
      expect(first(searchIndex, 'wheelchair')).toBe('guide:reduced-mobility');
      expect(first(searchIndex, 'buggy')).toBe('guide:reduced-mobility');
      expect(first(searchIndex, 'kerusi roda')).not.toMatch(/^unpublished:/);
    }
  });
});

/* -------------------------------------------------------------------------------------------
 * Round 4 (A-12, re-review 6.1.5; package ask): the relevance gaps the panel quoted
 * ---------------------------------------------------------------------------------------- */

describe('search relevance (round 4, 6.1.5)', () => {
  /** Every hit, best first, as one list (what the home field and the palette show first). */
  const ranked = (searchIndex: typeof index, query: string, options: Parameters<typeof searchAll>[2] = {}) =>
    searchAll(searchIndex, query, { limit: 50, ...options })
      .groups.flatMap((group) => group.hits)
      .sort((a, b) => b.score - a.score);

  it('puts the terminal in titles that would otherwise repeat ("Fast Track" twice)', () => {
    const fast = ranked(index, 'fast track', { airport: 'kul' });
    expect(fast.slice(0, 2).map((hit) => hit.title).sort()).toEqual(['Fast Track (Terminal 1)', 'Fast Track (Terminal 2)']);
    // No two results of one airport share a title, in either language.
    for (const documents of [english, malay]) {
      const seen = new Map<string, string>();
      for (const document of documents) {
        if (!document.airport || document.type === 'airport') continue;
        const key = `${document.airport}|${document.type}|${document.title}`;
        expect(seen.get(key), `${document.id} repeats ${seen.get(key)}`).toBeUndefined();
        seen.set(key, document.id);
      }
    }
    expect(english.find((document) => document.id === 'facility:kul-t1-sensory-walls')?.title).toBe('Sensory walls (Terminal 1)');
  });

  it('answers "smoking" and "merokok" honestly', () => {
    expect(ranked(index, 'smoking')[0]?.id).toBe('unpublished:smoking');
    expect(ranked(index, 'smoking room', { airport: 'kul' })[0]?.id).toBe('unpublished:smoking');
    expect(ranked(malayIndex, 'merokok')[0]?.id).toBe('unpublished:smoking');
    expect(ranked(malayIndex, 'merokok')[0]?.title).toBe('Bilik merokok: belum diterbitkan');
  });

  it('"wifi" leads with the honest answer, not guides that start with "wi" or "fi"', () => {
    for (const query of ['wifi', 'Wi-Fi', 'wi fi', 'free wifi']) {
      const hits = ranked(index, query, { airport: 'kul' });
      expect(hits[0]?.id, query).toBe('unpublished:wifi');
      // Before: 55 results for "wifi", led by a first-time-flyer guide and Firefly.
      if (query !== 'free wifi') expect(hits.length, query).toBeLessThan(10);
      expect(hits.some((hit) => hit.id === 'airline:kul:fy'), query).toBe(false);
    }
    expect(ranked(malayIndex, 'wifi')[0]?.title).toBe('Wi-Fi: belum diterbitkan');
  });

  it('"taxi" lists taxis, not the liquids rule ("cab" no longer matches "cabin")', () => {
    for (const searchIndex of [index, malayIndex]) {
      const hits = ranked(searchIndex, 'taxi', { airport: 'kul' });
      expect(hits[0]?.type).toBe('transport');
      expect(hits.map((hit) => hit.id)).not.toContain('faq:liquids-limit');
    }
    expect(ranked(malayIndex, 'teksi', { airport: 'kul' })[0]?.type).toBe('transport');
  });

  it('ranks the honest "not published" first for accessible-toilet queries (EN and MS)', () => {
    expect(ranked(index, 'accessible toilet')[0]?.id).toBe('unpublished:accessibleToilet');
    expect(ranked(index, 'accessible toilets', { airport: 'kul' })[0]?.id).toBe('unpublished:accessibleToilet');
    expect(ranked(index, 'disabled toilet')[0]?.id).toBe('unpublished:accessibleToilet');
    expect(ranked(malayIndex, 'tandas OKU')[0]?.id).toBe('unpublished:accessibleToilet');
    expect(ranked(malayIndex, 'tandas OKU')[0]?.href).toBe('/accessibility#not-published');
    // A plain "toilet" still finds the toilets first.
    expect(ranked(index, 'toilet', { airport: 'kul' })[0]?.type).not.toBe('unpublished');
  });

  it('ranks news below tasks', () => {
    const isNews = (hit: { id: string }) => hit.id.startsWith('corporate:news:') || hit.id.startsWith('corporate:media:');
    for (const query of ['surau', 'parking', 'lift', 'klia ekspres', 'prayer room', 'taxi', 'wheelchair', 'lounge']) {
      const hits = ranked(index, query, { airport: 'kul' });
      // No news story among the first five results of a task question.
      expect(hits.slice(0, 5).filter(isNews).map((hit) => hit.id), query).toEqual([]);
    }
    // "surau" ranked a solar-farm story second: every facility now comes first.
    const surau = ranked(index, 'surau');
    expect(surau[0]?.id).toBe('facility:kul-t1-prayer-rooms');
    const firstNews = surau.findIndex(isNews);
    if (firstNews >= 0) expect(firstNews).toBeGreaterThan(surau.findLastIndex((hit) => hit.type === 'facility'));
  });

  it('"parking" leads with the parking page, then the Long Term Car Park, never Preferred Parking', () => {
    const kul = ranked(index, 'parking', { airport: 'kul' });
    expect(kul.slice(0, 2).map((hit) => hit.id)).toEqual(['parking:kul', 'parking:kul-long-term-car-park']);
    expect(kul[0]?.href).toBe('/kul/parking');
    // The home field without an airport: the network's main airport's parking page first.
    const network = ranked(index, 'parking');
    expect(network[0]?.id).toBe('parking:kul');
    expect(network.slice(0, 3).map((hit) => hit.id)).not.toContain('parking:kul-t1-preferred-parking');
    expect(ranked(malayIndex, 'parkir', { airport: 'kul' })[0]?.id).toBe('parking:kul');
    // The boost is for parking questions only: the airport still leads for its own name.
    expect(top('penan')?.id).toBe('airport:pen');
    // Asked by name, Preferred Parking is still found first.
    expect(ranked(index, 'preferred parking', { airport: 'kul' })[0]?.id).toBe('parking:kul-t1-preferred-parking');
  });

  it('"MH 2" does not match items only on the digit 2', () => {
    const hits = ranked(index, 'MH 2');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.type === 'airline'), hits.map((hit) => hit.id).join(', ')).toBe(true);
    expect(hits.map((hit) => hit.id)).not.toContain('facility:kul-t2-sensory-walls');
    // Terminal 2 is still found when asked for.
    expect(ranked(index, 'terminal 2', { airport: 'kul' }).slice(0, 5).map((hit) => hit.id)).toContain('airport:kul:t2');
  });
});
