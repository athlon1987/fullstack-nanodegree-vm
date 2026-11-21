import { describe, expect, it } from 'vitest';
import { AIRPORTS } from '@/content';
import { en } from '@/lib/i18n/en';
import { ms } from '@/lib/i18n/ms';
import { JOURNEY_ACTIONS } from '@/components/home/journey-actions';
import {
  AIRPORT_SECTIONS,
  AIRPORT_SECTION_IDS,
  PRIMARY_NAV,
  hasSection,
  notPublishedPath,
  primaryNavHref,
  sameSectionPath,
  sectionHref,
  sectionPath,
} from './sections';
import { sectionAvailability } from './sections.server';

const availability = sectionAvailability();

describe('sectionHref (A-07): a link named after a section never lands on the overview', () => {
  it('covers every airport and every section', () => {
    expect(AIRPORTS).toHaveLength(39);
    expect(AIRPORT_SECTION_IDS).toHaveLength(9);
    let checked = 0;
    for (const airport of AIRPORTS) {
      for (const section of AIRPORT_SECTION_IDS) {
        const href = sectionHref(section, { airport: airport.slug }, availability);
        if (section === 'overview') expect(href).toBe(`/${airport.slug}`);
        else if (hasSection(availability, airport.slug, section)) expect(href, `${airport.slug}/${section}`).toBe(sectionPath(airport.slug, section));
        else expect(href, `${airport.slug}/${section}`).toBe(notPublishedPath(airport.slug, section));
        if (section !== 'overview') expect(href, `${airport.slug}/${section}`).not.toBe(`/${airport.slug}`);
        checked += 1;
      }
    }
    expect(checked).toBe(39 * 9);
  });

  it('sends Subang parking and transport to the "not published" state', () => {
    expect(sectionHref('parking', { airport: 'szb' }, availability)).toBe('/airports/not-published?airport=szb&section=parking');
    expect(sectionHref('flights', null, availability)).toBe('/airports?then=flights');
  });

  it('keeps the primary navigation honest at every airport', () => {
    for (const airport of AIRPORTS) {
      for (const item of PRIMARY_NAV) {
        const href = primaryNavHref(item, { airport: airport.slug }, availability);
        if (item.section) expect(href, `${airport.slug} ${item.id}`).not.toBe(`/${airport.slug}`);
      }
    }
  });

  it('switching airport on a section page goes to the same section or that airport home', () => {
    expect(sameSectionPath('/kul/parking', { airport: 'pen' }, availability)).toBe(hasSection(availability, 'pen', 'parking') ? '/pen/parking' : '/pen');
    expect(sameSectionPath('/guides', { airport: 'pen' }, availability)).toBeNull();
  });
});

describe('section glossary (A-21): one noun per section', () => {
  it('uses the same label in the section tabs, the primary navigation and the home tiles', () => {
    for (const dictionary of [en, ms]) {
      const label = (key: string): string => key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], dictionary) as string;
      const tabs = Object.fromEntries(AIRPORT_SECTIONS.map((section) => [section.id, label(section.labelKey)]));
      // Tiles: every quick action is titled with its section's tab label.
      for (const actions of Object.values(JOURNEY_ACTIONS)) {
        for (const action of actions) {
          expect(label(`home.actions.${action.copy}.title`), `${dictionary === en ? 'en' : 'ms'} ${action.copy}`).toBe(tabs[action.section]);
        }
      }
      // Primary navigation items that stand for one section use that section's label.
      for (const item of PRIMARY_NAV) {
        if (item.section && !item.fallbacks) expect(label(item.labelKey), item.id).toBe(tabs[item.section]);
      }
    }
  });

  /**
   * The h1 of each section page (the key its `PageHeader` reads) names the section with the same
   * noun as its tab: "Parking at {airport}" for "Parking". Titles in other packages' dictionaries
   * that still use a different noun are listed with their hand-off; delete an entry once that
   * package aligns its title, and the test then guards it too.
   */
  const PAGE_TITLE_KEYS: Record<Exclude<(typeof AIRPORT_SECTION_IDS)[number], 'overview'>, string> = {
    flights: 'flightPages.board.title',
    map: 'mapPages.title',
    facilities: 'nav.facilities',
    transport: 'transportPages.transport.title',
    parking: 'transportPages.parking.title',
    'shop-dine': 'nav.shopDine',
    lounges: 'nav.lounges',
    transit: 'guidePages.transit.title',
  };
  const AWAITING_HANDOFF: Partial<Record<keyof typeof PAGE_TITLE_KEYS, string>> = {
    flights: 'B: "Departures and arrivals" (flightPages.board.title)',
    transport: 'C: "Getting to and from {airport}" (transportPages.transport.title)',
    transit: 'D: "Connecting at {airport}" (guidePages.transit.title)',
  };

  it('uses the tab noun in each section page title', () => {
    for (const dictionary of [en, ms]) {
      const label = (key: string): string => key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], dictionary) as string;
      for (const section of AIRPORT_SECTIONS) {
        if (section.id === 'overview' || AWAITING_HANDOFF[section.id]) continue;
        const noun = label(section.labelKey).toLowerCase();
        const title = label(PAGE_TITLE_KEYS[section.id]).toLowerCase();
        expect(title, `${dictionary === en ? 'en' : 'ms'} ${section.id}`).toContain(noun);
      }
    }
    // Every hand-off names a real section, so the list cannot hide a typo.
    for (const id of Object.keys(AWAITING_HANDOFF)) expect(Object.keys(PAGE_TITLE_KEYS)).toContain(id);
  });
});

describe('Malay wording (A-25)', () => {
  const strings = (node: unknown): string[] =>
    typeof node === 'string' ? [node] : node && typeof node === 'object' ? Object.values(node).flatMap(strings) : [];
  const shell = strings({ ...ms, conciergePage: undefined, flightPages: undefined, mapPages: undefined, transportPages: undefined, commercePages: undefined, guidePages: undefined, corporatePages: undefined, platformPages: undefined });

  it('uses one name for the concierge: "Concierge"', () => {
    expect(shell.filter((value) => /konsierj/i.test(value))).toEqual([]);
    expect(ms.concierge.title).toBe('Concierge');
    expect(ms.nav.concierge).toBe('Concierge');
  });

  it('uses everyday terms: no "pelepasan" and no bare "Lounge"', () => {
    expect(shell.filter((value) => /pelepasan/i.test(value))).toEqual([]);
    expect(shell.filter((value) => /(^|[^(])\bLounge\b/.test(value))).toEqual([]);
  });
});
