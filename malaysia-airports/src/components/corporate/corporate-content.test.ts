import { describe, expect, it } from 'vitest';
import {
  BRAND_FACTS,
  CARBON_ACCREDITATIONS,
  CORPORATE_IDENTITY,
  CORPORATE_KEY_FIGURES,
  CORPORATE_LINKS,
  CORPORATE_MILESTONES,
  CORPORATE_SOURCES,
  CORE_SOURCES,
  GROUP_COMPANIES,
  LEADERSHIP_BOARD,
  LEADERSHIP_MANAGEMENT,
  MEDIA_ITEMS,
  NETWORK_PROJECTS,
  NEWS_ITEMS,
  OPERATING_AGREEMENT_FACTS,
  OWNERSHIP_FACTS,
  RECOGNITION_FACTS,
  SUSTAINABILITY_TARGETS,
  TRAFFIC_FIGURES,
  TRAFFIC_RELEASE_PATTERN,
  getAirport,
  type CorporateFact,
} from '@/content';
import { SourceSchema } from '@/content/types';
import { getT } from '@/lib/i18n';
import {
  formatChange,
  formatMillions,
  formatPartialDate,
  formatPeriod,
  mediaSlugs,
  mediaViews,
  provenanceOf,
  resolveCorporateSources,
  unknownCorporateSourceIds,
} from './corporate-data.server';
import { DEVICE_KEYS } from './storage-keys';

const facts: CorporateFact[] = [
  ...CORPORATE_KEY_FIGURES,
  ...OWNERSHIP_FACTS,
  ...Object.values(BRAND_FACTS),
  ...GROUP_COMPANIES,
  ...OPERATING_AGREEMENT_FACTS,
  ...RECOGNITION_FACTS,
  ...NETWORK_PROJECTS.flatMap((project) => project.facts),
  ...SUSTAINABILITY_TARGETS,
  ...CORPORATE_IDENTITY,
  TRAFFIC_RELEASE_PATTERN,
];

const allSourceIds = [
  ...facts.flatMap((fact) => fact.sources),
  ...CORPORATE_MILESTONES.flatMap((item) => item.sources),
  ...LEADERSHIP_BOARD.flatMap((person) => person.sources),
  ...LEADERSHIP_MANAGEMENT.flatMap((person) => person.sources),
  ...TRAFFIC_FIGURES.flatMap((figure) => figure.sources),
  ...CARBON_ACCREDITATIONS.flatMap((item) => item.sources),
  ...MEDIA_ITEMS.flatMap((item) => item.sources),
  ...Object.values(CORPORATE_LINKS).flatMap((link) => link.sources),
];

const DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

describe('corporate content', () => {
  it('registers well-formed corporate sources with unique ids that do not shadow core sources', () => {
    for (const source of CORPORATE_SOURCES) expect(SourceSchema.safeParse(source).success, source.id).toBe(true);
    const ids = CORPORATE_SOURCES.map((source) => source.id);
    expect(new Set(ids).size).toBe(ids.length);
    const core = new Set(CORE_SOURCES.map((source) => source.id));
    expect(ids.filter((id) => core.has(id))).toEqual([]);
  });

  it('cites at least one known source for every published item', () => {
    expect(unknownCorporateSourceIds(allSourceIds)).toEqual([]);
    for (const fact of facts) expect(fact.sources.length, fact.id).toBeGreaterThan(0);
    for (const item of [...CORPORATE_MILESTONES, ...TRAFFIC_FIGURES, ...MEDIA_ITEMS]) expect(item.sources.length).toBeGreaterThan(0);
  });

  it('dates every fact and gives both languages', () => {
    for (const fact of facts) {
      expect(fact.asOf, fact.id).toMatch(DATE);
      expect(fact.label.ms, fact.id).toBeTruthy();
      expect(fact.value.ms, fact.id).toBeTruthy();
    }
    for (const item of MEDIA_ITEMS) {
      expect(item.date).toMatch(DATE);
      expect(item.title.ms && item.summary.ms, item.slug).toBeTruthy();
    }
  });

  it('keeps media slugs unique across the domain seed and the corporate items', () => {
    const slugs = mediaSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual(expect.arrayContaining(NEWS_ITEMS.map((item) => item.slug)));
  });

  it('refers only to airports in the registry', () => {
    for (const slug of [...MEDIA_ITEMS.flatMap((item) => item.airports ?? []), ...CARBON_ACCREDITATIONS.map((item) => item.airport), ...NETWORK_PROJECTS.map((p) => p.airport)]) {
      expect(getAirport(slug), slug).toBeDefined();
    }
  });

  it('labels facts official only when Malaysia Airports, a government or a programme operator says so', () => {
    expect(provenanceOf(resolveCorporateSources(['corp-mahb-news-1787', 'corp-thestar-chairman-2026']))).toBe('official');
    expect(provenanceOf(resolveCorporateSources(['corp-thestar-delisting-2025']))).toBe('estimated');
    expect(provenanceOf(resolveCorporateSources(['corp-wikipedia-mahb']))).toBe('estimated');
  });
});

describe('corporate formatting', () => {
  const en = getT('en');
  const ms = getT('ms');

  it('formats full, month and year dates', () => {
    expect(formatPartialDate('2026-01-20', 'en')).toBe('20 January 2026');
    expect(formatPartialDate('2026-05', 'en')).toBe('May 2026');
    expect(formatPartialDate('2020', 'en')).toBe('2020');
    expect(formatPartialDate('2026-05', 'ms')).toMatch(/Mei 2026/);
  });

  it('formats periods, passenger counts and changes', () => {
    expect(formatPeriod('2026-01/2026-09', 'en', en)).toBe('January to September 2026');
    expect(formatPeriod('2025', 'en', en)).toBe('2025');
    expect(formatMillions(104.4, 'en', en)).toBe('104.4 million');
    expect(formatMillions(4.9, 'en', en, 'about')).toBe('about 4.9 million');
    expect(formatMillions(48, 'ms', ms, 'over')).toBe('lebih 48 juta');
    expect(formatChange(-2.4, 'en')).toBe('−2.4%');
    expect(formatChange(11.2, 'en')).toBe('+11.2%');
  });

  it('lists the media centre newest first', () => {
    const dates = mediaViews('en').map((item) => item.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it('documents every storage key the privacy page clears', () => {
    expect(DEVICE_KEYS.map((item) => item.key)).toEqual(
      expect.arrayContaining(['ma:preferences:v1', 'ma:airport:v1', 'ma:journey-mode:v1', 'ma:journey:v1', 'ma:recent-searches:v1', 'ma:flight-alerts:v1', 'ma:concierge-consent:v1', 'ma:concierge-conversation:v1', 'lang']),
    );
  });
});
