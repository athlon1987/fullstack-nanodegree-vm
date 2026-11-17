import { describe, expect, it } from 'vitest';
import {
  AIRPORTS,
  AIRPORT_CHOICES,
  CORE_SOURCES,
  FACILITY_CATEGORIES,
  FACILITY_CATEGORY_META,
  FAQS,
  FEATURED_AIRPORTS,
  GUIDES,
  NETWORK_NOTICES,
  airportSlugs,
  airportsByClassification,
  airportsWithContent,
  currentNotices,
  faqsByTopic,
  findAirportChoice,
  getAirport,
  getAirportContent,
  getGuide,
  getNotices,
  getSource,
  hasTranslation,
  latestNews,
  lt,
  noticeState,
  pick,
  resolveSources,
  terminalLabel,
  validateAllContent,
  validateContent,
  type AirportContentModule,
  type ContentBundle,
} from './index';
import { KUL_CONTENT } from './airports/kul';

describe('content validation', () => {
  it('finds no problems in the published content', () => {
    expect(validateAllContent()).toEqual([]);
  });

  function bundleWith(change: (content: AirportContentModule) => void): ContentBundle {
    const content: AirportContentModule = structuredClone(KUL_CONTENT);
    change(content);
    return {
      sources: [...CORE_SOURCES],
      airports: [...AIRPORTS],
      airportContent: [content],
      guides: GUIDES,
      faqs: FAQS,
      notices: NETWORK_NOTICES,
      corporatePages: [],
      news: [],
    };
  }

  it('rejects an item that cites a source that does not exist', () => {
    const issues = validateContent(bundleWith((content) => content.facilities[0].sources.push('made-up-source')));
    expect(issues.some((issue) => issue.message.includes('made-up-source'))).toBe(true);
  });

  it('rejects an item without any source, and typos in field names', () => {
    const issues = validateContent(
      bundleWith((content) => {
        content.facilities[0].sources = [];
        (content.carParks[0] as unknown as Record<string, unknown>).bayz = 12;
      }),
    );
    expect(issues.some((issue) => issue.path.includes('facilities') && issue.path.endsWith('sources'))).toBe(true);
    expect(issues.some((issue) => issue.path.includes('carParks'))).toBe(true);
  });

  it('rejects a facility placed in a terminal the airport does not have', () => {
    const issues = validateContent(bundleWith((content) => (content.facilities[0].terminal = 'MAIN')));
    expect(issues.some((issue) => issue.message.includes('no terminal "MAIN"'))).toBe(true);
  });

  it('rejects rates that contradict their status', () => {
    const issues = validateContent(bundleWith((content) => (content.carParks[0].rateStatus = 'published')));
    expect(issues.some((issue) => issue.message.includes('no rate bands'))).toBe(true);
  });

  it('rejects a map whose walk graph is not connected or that points at missing records', () => {
    const issues = validateContent(
      bundleWith((content) => {
        content.maps[0].nodes.push({ id: 'island', level: 'L5', x: 10, y: 10 });
        content.maps[0].pois[1].ref = { type: 'facility', id: 'no-such-facility' };
      }),
    );
    expect(issues.some((issue) => issue.message === 'Node is not connected to the walk graph')).toBe(true);
    expect(issues.some((issue) => issue.message.includes('no-such-facility'))).toBe(true);
  });
});

describe('airport registry', () => {
  it('lists the 39 airports Malaysia Airports operates: 5 international, 17 domestic, 17 STOLports', () => {
    const groups = airportsByClassification();
    expect(AIRPORTS).toHaveLength(39);
    expect(groups.international.map((airport) => airport.code)).toEqual(['KUL', 'PEN', 'LGK', 'BKI', 'KCH']);
    expect(groups.domestic).toHaveLength(17);
    expect(groups.stolport).toHaveLength(17);
    expect(new Set(AIRPORTS.map((airport) => airport.code)).size).toBe(39);
  });

  it('does not include airports Malaysia Airports does not operate', () => {
    for (const code of ['JHB', 'KTE', 'TGC']) expect(getAirport(code)).toBeUndefined();
  });

  it('assigns depth by role: five full airports, essentials for other domestic airports, listings for STOLports', () => {
    expect(airportSlugs(['full']).sort()).toEqual(['bki', 'kch', 'kul', 'lgk', 'pen']);
    expect(getAirport('szb')?.depth).toBe('essential');
    expect(airportsByClassification().stolport.every((airport) => airport.depth === 'listing')).toBe(true);
    expect(FEATURED_AIRPORTS.map((airport) => airport.slug)).toEqual(['kul', 'pen', 'bki', 'kch', 'lgk', 'szb']);
  });

  it('uses one timezone and marks every coordinate as approximate', () => {
    expect(AIRPORTS.every((airport) => airport.timezone === 'Asia/Kuala_Lumpur')).toBe(true);
    expect(AIRPORTS.every((airport) => airport.coordinates.approximate)).toBe(true);
  });

  it('flags records that rest on prior or low-confidence research', () => {
    expect(getAirport('pen')).toMatchObject({ verification: 'verified', unverifiedFields: [] });
    expect(getAirport('kul')).toMatchObject({ verification: 'unverified', unverifiedFields: ['icao'] });
    expect(getAirport('lkh')?.icao).toBeUndefined();
    expect(getAirport('pkg')?.unverifiedFields).toContain('network-membership');
    for (const airport of AIRPORTS) {
      expect(airport.verification === 'verified', airport.code).toBe(airport.unverifiedFields.length === 0);
    }
  });

  it('looks airports up by slug or code, ignoring case and spaces', () => {
    expect(getAirport('KUL')?.slug).toBe('kul');
    expect(getAirport(' bki ')?.code).toBe('BKI');
    expect(getAirport('zzz')).toBeUndefined();
    expect(getAirport(undefined)).toBeUndefined();
  });

  it('offers KLIA Terminal 1 and Terminal 2 as separate switcher choices of one airport', () => {
    expect(AIRPORT_CHOICES).toHaveLength(40);
    expect(AIRPORT_CHOICES.slice(0, 3).map((choice) => choice.id)).toEqual(['kul-t1', 'kul-t2', 'pen']);
    expect(AIRPORT_CHOICES[0]).toMatchObject({ airport: 'kul', terminal: 'T1', label: { en: 'KLIA Terminal 1' } });
    expect(AIRPORT_CHOICES[2].terminal).toBeUndefined();
    expect(findAirportChoice({ airport: 'kul', terminal: 'T2' })?.id).toBe('kul-t2');
    expect(findAirportChoice({ airport: 'pen' })?.id).toBe('pen');
    expect(findAirportChoice(null)).toBeUndefined();
  });

  it('labels terminals the way passengers know them', () => {
    expect(terminalLabel('kul', 'T1', 'en')).toBe('KLIA Terminal 1');
    expect(terminalLabel('kul', 'T2', 'ms', { short: true })).toBe('Terminal 2');
    expect(terminalLabel('pen', 'MAIN', 'en')).toBe('Penang');
  });
});

describe('airport content', () => {
  it('returns empty collections for airports without a content file, and undefined for unknown airports', () => {
    const penang = getAirportContent('pen');
    expect(penang).toMatchObject({ hasContent: false, facilities: [], outlets: [], transport: [], carParks: [], airlines: [], notices: [], maps: [], guidesNotes: [] });
    expect(penang?.airport.code).toBe('PEN');
    expect(getAirportContent('zzz')).toBeUndefined();
    expect(airportsWithContent()).toContain('kul');
  });

  it('publishes KLIA parking without rates, because the official rates were not captured', () => {
    const carParks = getAirportContent('kul')?.carParks ?? [];
    expect(carParks.map((carPark) => carPark.id)).toEqual(['kul-t1-car-park', 'kul-t1-preferred-parking', 'kul-long-term-car-park']);
    for (const carPark of carParks) {
      expect(carPark.rates).toEqual([]);
      expect(carPark.rateStatus).toBe('not-verified');
      expect(carPark.sources).toEqual(['mahb-klia-t1-parking']);
    }
    expect(carParks[0]).toMatchObject({ bays: 5700, baysQualifier: 'over' });
  });

  it('publishes no outlets and no airline destinations that the research does not support', () => {
    const content = getAirportContent('kul');
    expect(content?.outlets).toEqual([]);
    expect(content?.airlines.every((airline) => airline.destinations.length === 0)).toBe(true);
    expect(content?.airlines.find((airline) => airline.code === 'MH')?.basis).toBe('airline');
    expect(content?.airlines.find((airline) => airline.code === 'EK')?.basis).toBe('third-party');
  });

  it('ships one schematic map for KLIA Terminal 1 with 25 to 40 points of interest', () => {
    const maps = getAirportContent('kul')?.maps ?? [];
    expect(maps).toHaveLength(1);
    expect(maps[0].schematic).toBe(true);
    expect(maps[0].pois.length).toBeGreaterThanOrEqual(25);
    expect(maps[0].pois.length).toBeLessThanOrEqual(40);
    expect(maps[0].levels.map((level) => level.id)).toEqual(['L5', 'L3', 'L1', 'GATES']);
  });

  it('resolves every source id used by KLIA content', () => {
    const content = getAirportContent('kul');
    const ids = [...(content?.facilities ?? []), ...(content?.transport ?? []), ...(content?.guidesNotes ?? [])].flatMap((item) => item.sources);
    expect(ids.length).toBeGreaterThan(20);
    for (const id of ids) expect(getSource(id), id).toBeDefined();
    expect(resolveSources(['mahb-klia-t1-parking', 'nope']).map((source) => source.kind)).toEqual(['official']);
  });
});

describe('labels, notices and seeds', () => {
  it('reads localised text with an English fallback', () => {
    const text = lt('Prayer room', 'Surau');
    expect(pick(text, 'ms')).toBe('Surau');
    expect(pick(lt('Only English'), 'ms')).toBe('Only English');
    expect(hasTranslation(lt('Only English'), 'ms')).toBe(false);
    expect(hasTranslation(text, 'ms')).toBe(true);
  });

  it('has a label in both languages for every facility category', () => {
    for (const category of FACILITY_CATEGORIES) {
      expect(FACILITY_CATEGORY_META[category].label.en, category).toBeTruthy();
      expect(FACILITY_CATEGORY_META[category].label.ms, category).toBeTruthy();
    }
  });

  it('works out whether a notice is upcoming, active or expired from the given time', () => {
    const aerotrain = getNotices('kul').find((notice) => notice.id === 'kul-aerotrain-software-update-nov-2026');
    expect(aerotrain).toBeDefined();
    if (!aerotrain) return;
    expect(noticeState(aerotrain, new Date('2026-11-17T04:00:00Z'))).toBe('upcoming');
    expect(noticeState(aerotrain, new Date('2026-11-29T01:00:00+08:00'))).toBe('active');
    expect(noticeState(aerotrain, new Date('2026-12-02T00:00:00+08:00'))).toBe('expired');
  });

  it('shows current and soon-to-start notices, most serious first, and scopes them to an airport', () => {
    const now = new Date('2026-11-17T04:00:00Z');
    expect(currentNotices(getNotices('kul'), now).map((notice) => notice.id)).toEqual(['kul-aerotrain-software-update-nov-2026', 'prototype-demo-data']);
    expect(currentNotices(getNotices('kul'), now, { upcomingWithinDays: 2 }).map((notice) => notice.id)).toEqual(['prototype-demo-data']);
    expect(currentNotices(getNotices('kul'), new Date('2026-12-05T00:00:00Z')).map((notice) => notice.id)).toEqual(['prototype-demo-data']);
    expect(getNotices('pen').map((notice) => notice.id)).toEqual(['prototype-demo-data']);
  });

  it('labels the demo notice as demonstration data', () => {
    expect(NETWORK_NOTICES.find((notice) => notice.id === 'prototype-demo-data')?.provenance).toBe('demo');
  });

  it('exposes guides, FAQs and news through helpers', () => {
    expect(getGuide('departing')?.sections.length).toBeGreaterThan(0);
    expect(faqsByTopic('terminals', 'pen')).toEqual([]);
    expect(faqsByTopic('terminals', 'kul').length).toBe(2);
    expect(latestNews(1)[0].slug).toBe('klia-aerotrain-24-hour-service-resumes');
  });
});
