import { describe, expect, it } from 'vitest';
import {
  AIRPORTS,
  AIRPORT_CHOICES,
  ARRIVAL_TIME_RULE,
  TRANSIT_ASSUMPTIONS,
  asOfStartDate,
  formatAsOf,
  localizeAirport,
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
    // Ipoh is a real MAHB airport with no content file yet.
    const ipoh = getAirportContent('iph');
    expect(ipoh).toMatchObject({ hasContent: false, facilities: [], outlets: [], transport: [], carParks: [], airlines: [], notices: [], maps: [], guidesNotes: [] });
    expect(ipoh?.airport.code).toBe('IPH');
    expect(getAirportContent('zzz')).toBeUndefined();
    expect(airportsWithContent()).toContain('kul');
  });

  it('publishes KLIA parking without rates, because the official rates were not captured', () => {
    const carParks = getAirportContent('kul')?.carParks ?? [];
    expect(carParks.map((carPark) => carPark.id)).toEqual(['kul-t1-car-park', 'kul-t1-preferred-parking', 'kul-long-term-car-park', 'kul-t2-gateway-car-park']);
    for (const carPark of carParks) {
      // Sources disagree on the rates, so none are published as settled figures.
      expect(carPark.rates).toEqual([]);
      expect(carPark.rateStatus).toBe('not-verified');
      expect(carPark.sources.length).toBeGreaterThan(0);
    }
    expect(carParks.filter((carPark) => carPark.terminal !== 'T2').every((carPark) => carPark.sources.includes('mahb-klia-t1-parking'))).toBe(true);
    expect(carParks[0]).toMatchObject({ bays: 5700, baysQualifier: 'over' });
  });

  it('publishes no outlets and no airline destinations that the research does not support', () => {
    const content = getAirportContent('kul');
    // Only the rows marked "publishable" in docs/research/facts/f-supplement-commerce-regional.md
    // (Nooodles: terminal uncertain; Dimensi Beauty: no citable link; gateway@klia2 restaurants:
    // undated fan pages, so not listed).
    expect(content?.outlets.map((outlet) => outlet.slug).sort()).toEqual([
      '7-eleven-cafe',
      'charlotte-tilbury',
      'eraman-chocolate-and-liquor-duty-free',
      'eraman-duty-free-mall-terminal-1',
      'eraman-duty-free-mall-terminal-2',
      'gateway-klia2',
      'kapten-batik',
      'paul-le-cafe',
    ]);
    for (const outlet of content?.outlets ?? []) {
      expect(outlet.sources.length, outlet.id).toBeGreaterThan(0);
      for (const id of outlet.sources) expect(getSource(id), `${outlet.id}: ${id}`).toBeDefined();
    }
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
    // Same-severity notices sort by start date; the fare notice now starts at its announcement
    // (D-10), so it follows the undated demo notice.
    expect(currentNotices(getNotices('kul'), now).map((notice) => notice.id)).toEqual(['kul-aerotrain-software-update-nov-2026', 'prototype-demo-data', 'kul-klia-ekspres-fare-rise-2027']);
    expect(currentNotices(getNotices('kul'), now, { upcomingWithinDays: 2 }).map((notice) => notice.id)).toEqual(['prototype-demo-data', 'kul-klia-ekspres-fare-rise-2027']);
    expect(currentNotices(getNotices('kul'), new Date('2026-12-05T00:00:00Z')).map((notice) => notice.id)).toEqual(['prototype-demo-data', 'kul-klia-ekspres-fare-rise-2027']);
    // Changed for D-10: the fare-rise notice stays in effect over the change and for some weeks
    // after it, instead of expiring the day the new fare applies.
    expect(currentNotices(getNotices('kul'), new Date('2027-01-02T00:00:00Z')).map((notice) => notice.id)).toEqual(['prototype-demo-data', 'kul-klia-ekspres-fare-rise-2027']);
    expect(currentNotices(getNotices('kul'), new Date('2027-02-02T00:00:00Z')).map((notice) => notice.id)).toEqual(['prototype-demo-data']);
    expect(getNotices('pen').map((notice) => notice.id)).toEqual(['prototype-demo-data', 'pen-terminal-expansion-works']);
    expect(getNotices('iph').map((notice) => notice.id)).toEqual(['prototype-demo-data']);
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

/* -------------------------------------------------------------------------------------------
 * Fix round D (content, provenance, dates, coverage): docs/qa/fixes/D.md
 * ---------------------------------------------------------------------------------------- */

describe('provenance and source policy (D-01, D-06)', () => {
  function bundleWith(change: (content: AirportContentModule) => void, extraSources: ContentBundle['sources'] = []): ContentBundle {
    const content: AirportContentModule = structuredClone(KUL_CONTENT);
    change(content);
    return { sources: [...CORE_SOURCES, ...extraSources], airports: [...AIRPORTS], airportContent: [content], guides: GUIDES, faqs: FAQS, notices: NETWORK_NOTICES, corporatePages: [], news: [] };
  }
  const officialWith = (ids: string[]) => (content: AirportContentModule) => {
    content.facilities[0].provenance = 'official';
    content.facilities[0].sources = ids;
  };
  const hasOfficialIssue = (bundle: ContentBundle) => validateContent(bundle).some((issue) => issue.message.startsWith('Tagged official'));

  it('rejects an Official tag that rests only on news, aggregators or this prototype', () => {
    expect(hasOfficialIssue(bundleWith(officialWith(['thestar-klia-ekspres-fares-2027', 'wego-klia-to-city'])))).toBe(true);
    expect(hasOfficialIssue(bundleWith(officialWith(['prototype-method'])))).toBe(true);
    expect(hasOfficialIssue(bundleWith(officialWith(['mahb-klia-t1-parking'])))).toBe(false);
  });

  it('never lets a social post back an Official tag, even the airport’s own', () => {
    expect(hasOfficialIssue(bundleWith(officialWith(['mahb-tiktok-jungle-boardwalk'])))).toBe(true);
  });

  it('rejects a relayed release or advertorial registered as official, and annotations in titles', () => {
    const relay = { id: 'test-relay', kind: 'official' as const, publisher: 'Routes', title: 'A release', url: 'https://www.routesonline.com/x', retrieved: '2026-11-16', undated: true as const };
    const annotated = { id: 'test-annotated', kind: 'news' as const, publisher: 'Paper', title: 'A story (as summarised in search results)', url: 'https://example.com/x', retrieved: '2026-11-16', undated: true as const };
    const issues = validateContent(bundleWith(() => undefined, [relay, annotated]));
    expect(issues.some((issue) => issue.path === 'sources[test-relay]' && issue.message.includes('relays'))).toBe(true);
    expect(issues.some((issue) => issue.path === 'sources[test-annotated]' && issue.message.includes('note'))).toBe(true);
  });

  it('tags the records the audit found as Official on third-party sources as Estimated, and prototype statements as Suggestion', () => {
    const kul = getAirportContent('kul')!;
    const pen = getAirportContent('pen')!;
    const szb = getAirportContent('szb')!;
    expect(kul.transport.find((option) => option.id === 'kul-klia-ekspres')?.provenance).toBe('estimated');
    for (const id of ['kul-klia-ekspres-fare-rise-2027', 'kul-aerotrain-software-update-nov-2026']) {
      expect(kul.notices.find((notice) => notice.id === id)?.provenance).toBe('estimated');
    }
    expect(pen.transport.find((option) => option.id === 'pen-e-hailing')?.provenance).toBe('estimated');
    expect(pen.guidesNotes.find((note) => note.id === 'pen-e-hailing-pick-up')?.provenance).toBe('estimated');
    expect(szb.guidesNotes.find((note) => note.id === 'szb-night-curfew')?.provenance).toBe('estimated');
    expect(FAQS.find((faq) => faq.id === 'flight-delay-refund')?.provenance).toBe('estimated');
    for (const id of ['is-this-official', 'privacy-this-site', 'privacy-clear-data']) expect(FAQS.find((faq) => faq.id === id)?.provenance).toBe('suggestion');
    for (const id of ['corp-routes-2025-growth', 'routesonline-calm-room-t2', 'corp-edge-solar-advertorial', 'ana-kuala-lumpur-guide']) {
      expect(['official', 'operator', 'government']).not.toContain(getSource(id)?.kind);
    }
  });

  it('states the Preferred Parking advice as a rule on the parking topic, with the press report only as a source', () => {
    const warning = getAirportContent('kul')!.guidesNotes.find((note) => note.id === 'kul-preferred-parking-warning')!;
    expect(warning.topic).toBe('parking');
    expect(warning.body.en).toMatch(/RM32 a day from 1 May 2026/);
    expect(`${warning.title.en} ${warning.body.en} ${warning.body.ms}`).not.toMatch(/paultan|2,084/);
    expect(warning.sources).toContain('paultan-preferred-parking-2025');
  });
});

describe('Fast Track (D-02)', () => {
  it('publishes a sourced Fast Track record for each KLIA terminal, with what is unknown said to be unknown', () => {
    const kul = getAirportContent('kul')!;
    for (const terminal of ['T1', 'T2'] as const) {
      const record = kul.facilities.find((facility) => facility.id === `kul-${terminal.toLowerCase()}-fast-track`);
      expect(record, terminal).toBeDefined();
      expect(record!.terminal).toBe(terminal);
      expect(record!.name.en).toBe('Fast Track');
      expect(record!.bookingUrl).toBe('https://www.myairportfasttrack.com/');
      expect(record!.description.en).toMatch(/Not published in our sources: .*price.*hours.*seller/);
      expect(record!.description.ms).toBeTruthy();
      expect(resolveSources(record!.sources).some((source) => source.kind === 'official' && source.url.includes('malaysiaairports.com.my'))).toBe(true);
      expect(record!.asOf).toBeTruthy();
    }
  });
});

describe('localised source metadata and dates (D-03, D-12)', () => {
  const all = [...CORE_SOURCES, ...airportsWithContent().flatMap((slug) => resolveSources(getAirportContent(slug)!.facilities.flatMap((f) => f.sources)))];

  it('gives every annotation and date qualifier a Malay version', () => {
    for (const source of all) {
      if (source.note) expect(source.note.ms, source.id).toBeTruthy();
      if (source.asOfNote) expect(source.asOfNote.ms, source.id).toBeTruthy();
    }
    const method = getSource('prototype-method')!;
    expect(method.localTitle?.ms).toBeTruthy();
    expect(method.localPublisher?.ms).toBeTruthy();
  });

  it('localises airline check-in notes and payment lists', () => {
    for (const slug of airportsWithContent()) {
      const content = getAirportContent(slug)!;
      for (const airline of content.airlines) if (airline.checkIn) expect(airline.checkIn.ms, `${slug} ${airline.code}`).toBeTruthy();
      for (const option of content.transport) for (const method of option.payment ?? []) expect(method.ms, option.id).toBeTruthy();
    }
  });

  it('dates every source and FAQ, or marks it undated, in a form code can compare', () => {
    for (const source of all) expect(Boolean(source.asOf) !== Boolean(source.undated), source.id).toBe(true);
    for (const faq of FAQS) expect(Boolean(faq.asOf) !== Boolean(faq.undated), faq.id).toBe(true);
    expect(asOfStartDate('2026-08')).toBe('2026-08-01');
    expect(formatAsOf('2026-11-16', 'en')).toBe('16 Nov 2026');
    expect(formatAsOf('2026-08', 'ms')).toMatch(/Ogos 2026/);
  });

  /**
   * Records whose as-of date is more than 12 months before the last content review. Each was
   * looked at on that day; a new stale record fails this test until someone re-checks it or
   * adds it here with a reason.
   */
  const CONTENT_REVIEWED_ON = '2026-11-21';
  const REVIEWED_STALE: Record<string, string> = {
    'facility:kul-t1-calm-room': 'Opening coverage; the official site still promotes the Calm Rooms',
    'facility:kul-t2-calm-room': 'Opening release; still promoted',
    'facility:kul-butterfly-effect': 'Programme still on the official menu (21 Nov 2026)',
    'facility:kul-t1-sensory-walls': 'Opening coverage',
    'facility:kul-t2-sensory-walls': 'Opening coverage',
    'facility:kul-t1-information-counter': 'Calm Room release names the counter',
    'facility:kul-t1-jungle-boardwalk': 'Hours already marked as not verified',
    'outlet:kul-t1-eraman-duty-free-mall': 'Opening coverage of a permanent outlet',
    'note:kul-butterfly-effect-note': 'Programme still on the official menu',
    'carPark:pen-premium-parking': 'Launch announcement; tagged Estimated',
    'note:pen-premium-parking-link-bridge': 'Launch announcement; tagged Estimated',
    'facility:bki-airport-contact': 'Contact page date',
    'note:szb-check-which-airport': 'Tagged Estimated; needs a first-hand source',
    'note:szb-night-curfew': 'Tagged Estimated; needs a first-hand source',
    'faq:klia-terminal-names': 'Date of the rebranding, which still applies',
    'faq:klia-hidden-disabilities': 'Programme still on the official menu',
    'faq:flight-delay-care': 'The 2016 consumer code is the rule in force',
    'faq:flight-delay-refund': 'Tagged Estimated',
    'faq:privacy-malaysia-airports': 'Current privacy notice',
    'faq:power-bank-rules': 'Airline rule page date',
  };

  it('flags records older than 12 months that nobody has reviewed', () => {
    const cutoff = `${Number(CONTENT_REVIEWED_ON.slice(0, 4)) - 1}${CONTENT_REVIEWED_ON.slice(4)}`;
    const stale: string[] = [];
    const check = (id: string, asOf?: string) => {
      const start = asOfStartDate(asOf);
      if (start && start < cutoff) stale.push(id);
    };
    for (const slug of airportsWithContent()) {
      const content = getAirportContent(slug)!;
      for (const item of content.facilities) check(`facility:${item.id}`, item.asOf);
      for (const item of content.outlets) check(`outlet:${item.id}`, item.asOf);
      for (const item of content.transport) check(`transport:${item.id}`, item.asOf);
      for (const item of content.carParks) check(`carPark:${item.id}`, item.asOf);
      for (const item of content.guidesNotes) check(`note:${item.id}`, item.asOf);
      for (const item of content.notices) check(`notice:${item.id}`, item.asOf);
    }
    for (const faq of FAQS) check(`faq:${faq.id}`, faq.asOf);
    expect(stale.filter((id) => !(id in REVIEWED_STALE))).toEqual([]);
  });
});

describe('coverage notes (D-05) and departing immigration (D-07)', () => {
  it('keeps every gaps note off the journey topics and consistent with the published records', () => {
    for (const slug of airportsWithContent()) {
      const note = getAirportContent(slug)!.guidesNotes.find((item) => item.id === `${slug}-content-gaps`);
      expect(note?.topic, slug).toBe('coverage');
      expect(note?.gaps?.length, slug).toBeGreaterThan(0);
    }
  });

  it('fails when a gaps note names an area that has published records', () => {
    const content: AirportContentModule = structuredClone(KUL_CONTENT);
    content.outlets[0].hours = { kind: '24h' };
    const issues = validateContent({ sources: [...CORE_SOURCES], airports: [...AIRPORTS], airportContent: [content], guides: GUIDES, faqs: FAQS, notices: NETWORK_NOTICES, corporatePages: [], news: [] });
    expect(issues.some((issue) => issue.path.includes('kul-content-gaps') && issue.message.includes('outlet-hours'))).toBe(true);
  });

  it('publishes a departing passport-control note for Malaysian citizens in both languages', () => {
    const note = getAirportContent('kul')!.guidesNotes.find((item) => item.id === 'kul-departing-immigration-citizens')!;
    expect(note.topic).toBe('immigration');
    expect(note.appliesTo).toMatchObject({ direction: 'departing', traveller: 'citizen' });
    expect(note.body.ms).toBeTruthy();
    expect(note.provenance).not.toBe('official');
  });
});

describe('time-sensitive notices (D-08, D-10)', () => {
  const kul = () => getAirportContent('kul')!.notices;
  const at = (iso: string) => new Date(iso);

  it('names the Aerotrain closure without "Planned", in effect on the night and ended afterwards', () => {
    const notice = kul().find((item) => item.id === 'kul-aerotrain-software-update-nov-2026')!;
    expect(notice.title.en).not.toMatch(/planned/i);
    expect(notice.title.ms).not.toMatch(/dirancang/i);
    expect(notice.body.en).toMatch(/step-free/);
    expect(noticeState(notice, at('2026-11-28T02:00:00+08:00'))).toBe('active');
    expect(noticeState(notice, at('2027-01-15T12:00:00+08:00'))).toBe('expired');
  });

  it('keeps the fare-rise notice in effect over the change, with one title that reads right on both sides', () => {
    const notice = kul().find((item) => item.id === 'kul-klia-ekspres-fare-rise-2027')!;
    for (const instant of ['2026-12-31T23:00:00+08:00', '2027-01-01T00:10:00+08:00', '2027-01-15T12:00:00+08:00']) {
      expect(noticeState(notice, at(instant)), instant).toBe('active');
    }
    expect(noticeState(notice, at('2027-02-15T12:00:00+08:00'))).toBe('expired');
    expect(notice.title.en).toBe('KLIA Ekspres adult fare: RM65 from 1 January 2027');
    const option = getAirportContent('kul')!.transport.find((item) => item.id === 'kul-klia-ekspres')!;
    expect(option.description?.en).not.toMatch(/both fares are listed/);
  });
});

describe('Malay airport names (D-09) and planning rules (D-13)', () => {
  it('gives every airport its name, city and state in Malay', () => {
    const pen = localizeAirport(getAirport('pen')!, 'ms');
    expect(pen.name).toBe('Lapangan Terbang Antarabangsa Pulau Pinang');
    expect(pen.state).toBe('Pulau Pinang');
    expect(localizeAirport(getAirport('lbu')!, 'ms').state).toBe('Wilayah Persekutuan Labuan');
    expect(localizeAirport(getAirport('szb')!, 'ms').name).toBe('Lapangan Terbang Sultan Abdul Aziz Shah');
    expect(localizeAirport(getAirport('pen')!, 'en').name).toBe('Penang International Airport');
    for (const airport of AIRPORTS) expect(localizeAirport(airport, 'ms').name, airport.code).toMatch(/^Lapangan Terbang/);
  });

  it('keeps the arrival-time rule in step with the departing guide', () => {
    const step = getGuide('departing')!.sections.flatMap((section) => section.steps).find((item) => item.id === 'plan-arrival-time')!;
    expect(step.body.en).toMatch(new RegExp(`${ARRIVAL_TIME_RULE.minutesBefore.international / 60} hours before an international flight`));
    expect(step.body.en).toMatch(new RegExp(`${ARRIVAL_TIME_RULE.minutesBefore.domestic / 60} hours before a domestic flight`));
    expect(TRANSIT_ASSUMPTIONS.provenance).toBe('estimated');
  });
});

/* -------------------------------------------------------------------------------------------
 * One fact, one answer (round 4, re-review 6.1.3; package ask): the parking page, the concierge
 * and the help FAQ read a car park's rates from the same record and say the same thing. Any
 * surface that words a car park's rate status its own way fails this test.
 * ---------------------------------------------------------------------------------------- */

describe('one fact, one answer: parking rates (6.1.3)', async () => {
  const { parkingPageModel } = await import('@/components/parking/parking-data.server');
  const { priceRow } = await import('@/components/parking/parking-logic');
  const { answerQuestion } = await import('@/lib/concierge/engine');
  const { buildConciergeKnowledge } = await import('@/lib/concierge/knowledge.server');
  const { rateFacts, rateStatusText } = await import('@/lib/parking');
  const content = await import('./index');
  const NOW = Date.parse('2026-11-21T10:00:00+08:00');
  const publisher = (id: string) => content.getSource(id);
  const withCarParks = content.airportsWithContent().map((slug) => content.getAirportContent(slug)).filter((item) => item !== undefined && item.carParks.length > 0);

  it('covers every airport with car parks, and all four kinds of rate status', () => {
    expect(withCarParks.map((item) => item?.airport.slug)).toEqual(expect.arrayContaining(['kul', 'pen', 'bki']));
    const kinds = new Set(withCarParks.flatMap((item) => item?.carParks.map((carPark) => rateFacts(carPark).basis) ?? []));
    expect([...kinds].sort()).toEqual(['daily-max', 'none', 'reported', 'tariff']);
  });

  for (const lang of ['en', 'ms'] as const) {
    it(`the parking page, the concierge and the help FAQ agree on every car park (${lang})`, () => {
      const knowledge = buildConciergeKnowledge(lang);
      for (const airport of withCarParks) {
        if (!airport) continue;
        const slug = airport.airport.slug;
        const page = parkingPageModel(airport, lang).data;
        const question = lang === 'en' ? 'How much does parking cost?' : 'Berapakah kos parkir?';
        const answer = answerQuestion({ question, lang, context: { airport: slug } }, { knowledge, now: NOW });
        expect(answer.intent, slug).toBe('parking');
        for (const carPark of airport.carParks) {
          const line = content.pick(rateStatusText(carPark, publisher), lang);
          const facts = rateFacts(carPark);
          // The parking page: the price table's row note, the car-park card and the calculator all render `rateLine`.
          const view = page.carParks.find((item) => item.id === carPark.id);
          expect(view?.rateLine, `${slug} page ${carPark.id}`).toBe(line);
          expect(view?.rateVerified, `${slug} page ${carPark.id}`).toBe(facts.verified);
          // The price table marks a figure "not verified" exactly when the record has no tariff.
          const cells = view ? priceRow(view) : [];
          expect(cells.every((cell) => cell.kind === 'estimate'), `${slug} table ${carPark.id}`).toBe(facts.verified);
          // The concierge: the car park's card carries the same sentence.
          const card = answer.cards.find((item) => item.type === 'car-park' && item.id === carPark.id);
          expect(card && card.type === 'car-park' ? card.rateText : undefined, `${slug} concierge ${carPark.id}`).toBe(line);
          expect(card && card.type === 'car-park' ? card.ratesPublished : undefined, `${slug} concierge ${carPark.id}`).toBe(facts.verified);
          // The help FAQ: any answer that names this car park and talks about its rates says the same.
          const name = content.pick(carPark.name, lang).split(' (')[0];
          for (const faq of content.FAQS) {
            const text = content.pick(faq.answer, lang);
            if (!text.includes(name) || !/\brates?\b|\bkadar\b|RM\s?\d/i.test(text)) continue;
            expect(text, `${faq.id} on ${carPark.id}`).toContain(line);
          }
        }
        // The concierge's lead agrees with the records: no "verified" claim without a tariff.
        const verified = airport.carParks.some((carPark) => rateFacts(carPark).verified);
        if (!verified) expect(answer.text, slug).not.toMatch(/publishes its rates|menerbitkan kadarnya/);
      }
    });
  }

  it('the help centre has a parking-rate answer, and it is the record’s own sentence', () => {
    const faq = content.FAQS.find((item) => item.id === 'klia-long-term-parking-shuttle');
    const ltcp = content.getAirportContent('kul')?.carParks.find((carPark) => carPark.id === 'kul-long-term-car-park');
    expect(faq && ltcp).toBeTruthy();
    if (!faq || !ltcp) return;
    expect(faq.answer.en).toContain(rateStatusText(ltcp, publisher).en);
    expect(faq.answer.ms).toContain(rateStatusText(ltcp, publisher).ms);
    expect(faq.answer.en).not.toMatch(/not yet verified in this prototype/);
    // Every source behind the figures is cited by the answer.
    for (const id of ltcp.sources) expect(faq.sources, id).toContain(id);
  });
});
