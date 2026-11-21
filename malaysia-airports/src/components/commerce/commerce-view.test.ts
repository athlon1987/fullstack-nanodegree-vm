import { describe, expect, it } from 'vitest';
import { getAirportContent } from '@/content';
import { getT } from '@/lib/i18n';
import {
  EMPTY_OUTLET_FILTERS,
  contextForGate,
  coverage,
  effectiveSort,
  filterAvailability,
  filterOutlets,
  gateContextFor,
  gateProximity,
  matchesQuery,
  normalise,
  parseOutletFilters,
  placeFromNote,
  relatedOutlets,
  sortOutlets,
  withoutUnavailable,
  writeOutletFilters,
  type OutletView,
} from './commerce-view';
import { officialDirectory, outletProvenance, outletViews, restViews } from './commerce-view.server';

function outlet(overrides: Partial<OutletView> & Pick<OutletView, 'id' | 'name'>): OutletView {
  return {
    slug: overrides.id,
    href: `/kul/shop-dine/${overrides.id}`,
    kind: 'shop',
    categoryKey: 'duty-free',
    categoryLabel: 'Duty free',
    terminal: 'T1',
    terminalLabel: 'Terminal 1',
    zone: 'airside',
    provenance: 'estimated',
    sourceIds: ['x'],
    place: { gates: [] },
    searchText: normalise(`${overrides.name} ${overrides.categoryLabel ?? 'Duty free'}`),
    ...overrides,
  };
}

const PARSE = { categories: ['duty-free', 'cafe'], cuisines: [], terminals: ['T1', 'T2'] as const, gateIds: ['kul-t1-c', 'kul-t1-gh'] };

describe('placeFromNote', () => {
  it('reads gate letters, the building and the side from a location note', () => {
    expect(placeFromNote('Satellite Building, near gates C1 and C2.', 'kul', 'T1')).toEqual({ gates: ['C'], building: 'satellite', international: true });
    expect(placeFromNote('Main Terminal Building, international departures.', 'kul', 'T1')).toEqual({ gates: [], building: 'main', international: true });
    expect(placeFromNote('International Departures, Gates L and P/Q, as listed.', 'kul', 'T2')).toEqual({ gates: ['L', 'P', 'Q'], international: true });
  });

  it('gives no building when the sources disagree', () => {
    const place = placeFromNote('Exact location not confirmed: one source places it in the Satellite Building, another in the Eraman Duty-Free Mall.', 'kul', 'T1');
    expect(place.building).toBeUndefined();
    expect(place.gates).toEqual([]);
  });

  it('returns an empty place when there is no note', () => {
    expect(placeFromNote(undefined, 'kul', 'T1')).toEqual({ gates: [] });
  });
});

describe('gateProximity', () => {
  const satelliteShop = outlet({ id: 'a', name: 'A', place: { gates: ['C'], building: 'satellite', international: true } });
  const mainShop = outlet({ id: 'b', name: 'B', place: { gates: [], building: 'main', international: true } });

  it('puts an outlet by the same gates first', () => {
    expect(gateProximity(satelliteShop, contextForGate('kul', 'T1', 'C12'))).toBe('near');
    const area = gateContextFor('kul', 'kul-t1-c');
    expect(area && gateProximity(satelliteShop, area)).toBe('near');
  });

  it('treats the Main Terminal Building as on the way to the Satellite gates', () => {
    expect(gateProximity(mainShop, contextForGate('kul', 'T1', 'C3'))).toBe('onTheWay');
    expect(gateProximity(mainShop, contextForGate('kul', 'T1', 'H4'))).toBe('sameBuilding');
    expect(gateProximity(satelliteShop, contextForGate('kul', 'T1', 'G2'))).toBe('otherBuilding');
  });

  it('says when an international-only outlet is not on a domestic route', () => {
    expect(gateProximity(mainShop, contextForGate('kul', 'T1', 'A5'))).toBe('otherSide');
  });

  it('handles landside, unknown and other-terminal outlets', () => {
    expect(gateProximity(outlet({ id: 'c', name: 'C', zone: 'landside' }), contextForGate('kul', 'T1', 'C1'))).toBe('landside');
    expect(gateProximity(outlet({ id: 'd', name: 'D', zone: 'unknown' }), contextForGate('kul', 'T1', 'C1'))).toBe('unknown');
    expect(gateProximity(outlet({ id: 'e', name: 'E', terminal: 'T2' }), contextForGate('kul', 'T1', 'C1'))).toBe('otherTerminal');
    expect(gateProximity(outlet({ id: 'f', name: 'F', terminal: 'T2' }), contextForGate('kul', 'T2', 'J7'))).toBe('sameTerminal');
  });

  it('resolves the gate filter from an area id or a saved flight gate', () => {
    expect(gateContextFor('kul', 'kul-t1-c')).toMatchObject({ terminal: 'T1', building: 'satellite', international: true });
    expect(gateContextFor('kul', 'T1-H7')).toMatchObject({ terminal: 'T1', gate: 'H7', letter: 'H', building: 'main' });
    expect(gateContextFor('kul', 'nonsense')).toBeUndefined();
    expect(gateContextFor('kul', undefined)).toBeUndefined();
  });
});

describe('filters', () => {
  const items = [
    outlet({ id: 'cafe', name: 'Cafe One', kind: 'dine', categoryKey: 'cafe', categoryLabel: 'Cafe', halal: 'certified', zone: 'unknown', searchText: normalise('Cafe One Cafe') }),
    outlet({ id: 'open', name: 'All Hours', hours: { kind: '24h' } }),
    outlet({ id: 'prose', name: 'Prose Hours', hours: { kind: 'text', text: 'Varies' }, terminal: 'T2' }),
    outlet({ id: 'land', name: 'Landside Mall', zone: 'landside', terminal: 'T2' }),
  ];

  it('leaves outlets without machine-readable hours out of "open now"', () => {
    const shown = filterOutlets(items, { ...EMPTY_OUTLET_FILTERS, openNow: true }, Date.UTC(2026, 10, 17, 4));
    expect(shown.map((item) => item.id)).toEqual(['open']);
    expect(filterOutlets(items, { ...EMPTY_OUTLET_FILTERS, openNow: true }, null)).toEqual([]);
  });

  it('filters by kind, halal, terminal and side of security', () => {
    expect(filterOutlets(items, { ...EMPTY_OUTLET_FILTERS, kind: 'dine' }, null).map((item) => item.id)).toEqual(['cafe']);
    expect(filterOutlets(items, { ...EMPTY_OUTLET_FILTERS, halal: true }, null).map((item) => item.id)).toEqual(['cafe']);
    expect(filterOutlets(items, { ...EMPTY_OUTLET_FILTERS, terminal: 'T2' }, null).map((item) => item.id)).toEqual(['prose', 'land']);
    expect(filterOutlets(items, { ...EMPTY_OUTLET_FILTERS, zone: 'landside' }, null).map((item) => item.id)).toEqual(['land']);
  });

  it('matches words, punctuation-free names and everyday synonyms', () => {
    expect(matchesQuery(normalise('gateway@klia2 Shopping mall'), 'gateway klia2')).toBe(true);
    expect(matchesQuery(normalise('PAUL Le Cafe Cafe'), 'coffee')).toBe(true);
    expect(matchesQuery(normalise('Charlotte Tilbury Beauty'), 'makeup')).toBe(true);
    expect(matchesQuery(normalise('Kapten Batik Fashion'), 'liquor')).toBe(false);
  });

  it('reads the URL, including the home page strip’s ?filters= form, and writes it back', () => {
    const parsed = parseOutletFilters(new URLSearchParams('filters=open-now,halal,airside&t=T2&cat=cafe,bogus&gate=kul-t1-c&sort=name'), PARSE);
    expect(parsed).toMatchObject({ openNow: true, halal: true, zone: 'airside', terminal: 'T2', categories: ['cafe'], gate: 'kul-t1-c', sort: 'name' });
    const written = writeOutletFilters(new URLSearchParams('filters=halal&other=keep'), { ...parsed, query: ' duty ' });
    expect(written.get('filters')).toBeNull();
    expect(written.get('other')).toBe('keep');
    expect(written.get('q')).toBe('duty');
    expect(written.get('open')).toBe('1');
    expect(parseOutletFilters(new URLSearchParams('t=T9&kind=nope&gate=<x>'), PARSE)).toEqual(EMPTY_OUTLET_FILTERS);
  });

  it('sorts by gate only when a gate is known', () => {
    expect(effectiveSort(EMPTY_OUTLET_FILTERS, true)).toBe('gate');
    expect(effectiveSort({ ...EMPTY_OUTLET_FILTERS, sort: 'gate' }, false)).toBe('suggested');
    const gate = contextForGate('kul', 'T1', 'C9');
    const sorted = sortOutlets(
      [outlet({ id: 'm', name: 'Main', place: { gates: [], building: 'main', international: true } }), outlet({ id: 's', name: 'Sat', place: { gates: ['C'], building: 'satellite' } })],
      'gate',
      { gate },
    );
    expect(sorted.map((item) => item.id)).toEqual(['s', 'm']);
  });

  it('suggests related outlets in the same terminal first', () => {
    const current = items[1];
    expect(relatedOutlets(items, current, 2).map((item) => item.id)).toEqual(['cafe', 'prose']);
  });
});

describe('KLIA content as the pages see it', () => {
  const content = getAirportContent('kul');
  if (!content) throw new Error('KLIA content missing');
  const views = outletViews(content, 'en', getT('en'));

  it('builds a view for every published outlet with resolvable sources and a provenance', () => {
    expect(views.length).toBe(content.outlets.length);
    expect(views.length).toBeGreaterThan(0);
    for (const view of views) {
      expect(view.sourceIds.length).toBeGreaterThan(0);
      expect(['official', 'estimated']).toContain(view.provenance);
      expect(view.href).toBe(`/kul/shop-dine/${view.slug}`);
    }
  });

  it('marks outlets backed only by news or guides as estimated', () => {
    const t2Mall = content.outlets.find((item) => item.id === 'kul-t2-gateway-klia2');
    expect(t2Mall && outletProvenance(t2Mall)).toBe('estimated');
    const paul = content.outlets.find((item) => item.id === 'kul-t1-paul-le-cafe');
    expect(paul && outletProvenance(paul)).toBe('official');
  });

  it('publishes no hours or prices the sources do not give, so the coverage says so', () => {
    const stats = coverage(views);
    expect(stats.total).toBe(views.length);
    expect(stats.hours).toBe(0);
    expect(stats.price).toBe(0);
  });

  it('links to the official directory and lists lounges, the hotel and rest services', () => {
    expect(officialDirectory(content).map((link) => link.key)).toEqual(['dine', 'shop', 'services', 'airportPage']);
    const rest = restViews(content, 'en');
    expect(rest.some((item) => item.category === 'lounge')).toBe(true);
    expect(rest.some((item) => item.category === 'hotel')).toBe(true);
    expect(rest.every((item) => item.sources.length > 0)).toBe(true);
  });
});

describe('filters the data cannot serve (C-05)', () => {
  it('offers no filter that returns nothing for the KLIA directory, and drops one asked for in a link', () => {
    const kul = getAirportContent('kul');
    if (!kul) throw new Error('KUL content missing');
    const items = outletViews(kul, 'en', getT('en'));
    const available = filterAvailability(items);
    // Every offered filter returns at least one outlet on its own.
    const offered = [
      available.openNow ? { ...EMPTY_OUTLET_FILTERS, openNow: true } : undefined,
      available.halal ? { ...EMPTY_OUTLET_FILTERS, halal: true } : undefined,
      available.landside ? { ...EMPTY_OUTLET_FILTERS, zone: 'landside' as const } : undefined,
      available.airside ? { ...EMPTY_OUTLET_FILTERS, zone: 'airside' as const } : undefined,
    ].filter((filters) => filters !== undefined);
    for (const filters of offered) expect(filterOutlets(items, filters, Date.parse('2026-11-21T04:00:00Z')).length).toBeGreaterThan(0);
    // No outlet publishes machine-readable hours yet, so "Open now" is not offered and a link's
    // ?filters=open-now is dropped with its name instead of giving "0 of 8".
    expect(available.openNow).toBe(false);
    const parsed = parseOutletFilters(new URLSearchParams('filters=open-now,airside'), { categories: [], cuisines: [], terminals: ['T1', 'T2'], gateIds: [] });
    const { filters, dropped } = withoutUnavailable(parsed, available);
    expect(dropped).toEqual(['openNow']);
    expect(filters.openNow).toBe(false);
    expect(filters.zone).toBe('airside');
    expect(filterOutlets(items, filters, null).length).toBeGreaterThan(0);
  });

  it('keeps every filter when the data can serve it', () => {
    const items = [
      outlet({ id: 'a', name: 'A', hours: { kind: '24h' }, halal: 'certified', zone: 'landside', priceBand: 2 }),
      outlet({ id: 'b', name: 'B', zone: 'airside' }),
    ];
    const available = filterAvailability(items);
    expect(available).toEqual({ openNow: true, halal: true, landside: true, airside: true, price: true });
    const asked = { ...EMPTY_OUTLET_FILTERS, openNow: true, halal: true, zone: 'airside' as const, prices: [2 as const] };
    expect(withoutUnavailable(asked, available)).toEqual({ filters: asked, dropped: [] });
    expect(withoutUnavailable(asked, { ...available, airside: false, price: false }).dropped).toEqual(['airside', 'price']);
  });
});
