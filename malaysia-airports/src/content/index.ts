/**
 * Entry point of the verified content layer.
 *
 * Server Components import from here: `getAirportContent`, `getSource`, `getNotices`, the
 * guides, FAQs and corporate helpers, and every content type.
 *
 * Client Components should NOT import this file (it pulls in every airport's content). Import
 * the small modules directly instead: `@/content/types` (types, `pick`, labels) and
 * `@/content/airports` (the 39-airport registry), and take content as props from the server.
 */
import { AIRPORTS, getAirport } from './airports';
import { BKI_CONTENT } from './airports/bki';
import { KCH_CONTENT } from './airports/kch';
import { KUL_CONTENT } from './airports/kul';
import { LGK_CONTENT } from './airports/lgk';
import { PEN_CONTENT } from './airports/pen';
import { SZB_CONTENT } from './airports/szb';
import { CORPORATE_PAGES, NEWS_ITEMS } from './corporate';
import { FAQS } from './faqs';
import { GUIDES } from './guides';
import { NETWORK_NOTICES, filterNoticesForAirport } from './notices';
import { CORE_SOURCES } from './sources';
import {
  validateContent,
  type AirportContent,
  type AirportContentModule,
  type ContentIssue,
  type Notice,
  type Source,
} from './types';

/**
 * REGISTER AIRPORT CONTENT HERE: this is the one place.
 *
 * To publish content for another airport: create `src/content/airports/<code>.ts` exporting a
 * module built with `defineAirportContent({ airport: '<code>', ... })`, import it above and add
 * one line to this map. The key is the airport slug (lower-case IATA code). Airports that are
 * not listed still work: `getAirportContent` returns empty collections for them.
 */
const AIRPORT_CONTENT: Readonly<Record<string, AirportContentModule>> = {
  kul: KUL_CONTENT,
  pen: PEN_CONTENT,
  bki: BKI_CONTENT,
  kch: KCH_CONTENT,
  lgk: LGK_CONTENT,
  szb: SZB_CONTENT,
};

/** Slugs of the airports that have a registered content file. */
export function airportsWithContent(): string[] {
  return Object.keys(AIRPORT_CONTENT);
}

/**
 * Everything published about an airport. Returns `undefined` only for an unknown airport; a
 * registered airport without a content file gets empty collections and `hasContent: false`.
 *
 * @example const content = getAirportContent('kul'); content?.carParks
 */
export function getAirportContent(slugOrCode: string): AirportContent | undefined {
  const airport = getAirport(slugOrCode);
  if (!airport) return undefined;
  const content = AIRPORT_CONTENT[airport.slug];
  return {
    airport,
    hasContent: content !== undefined,
    facilities: content?.facilities ?? [],
    outlets: content?.outlets ?? [],
    transport: content?.transport ?? [],
    carParks: content?.carParks ?? [],
    airlines: content?.airlines ?? [],
    notices: content?.notices ?? [],
    maps: content?.maps ?? [],
    guidesNotes: content?.guidesNotes ?? [],
  };
}

/** Every source: the core registry plus the sources each airport content file brings. */
export const ALL_SOURCES: readonly Source[] = [
  ...CORE_SOURCES,
  ...Object.values(AIRPORT_CONTENT).flatMap((content) => content.sources),
];

const SOURCE_MAP: ReadonlyMap<string, Source> = new Map(ALL_SOURCES.map((source) => [source.id, source]));

/** One source by id. */
export function getSource(id: string): Source | undefined {
  return SOURCE_MAP.get(id);
}

/** Resolve a `sources: string[]` list to source records, dropping unknown ids. */
export function resolveSources(ids: readonly string[] | undefined): Source[] {
  return (ids ?? []).map((id) => SOURCE_MAP.get(id)).filter((source): source is Source => source !== undefined);
}

/**
 * All notices: network-wide plus every airport's own. Pass `airport` to get the notices that
 * apply there (its own plus network-wide). Filter by date with `currentNotices(notices, now)`.
 */
export function getNotices(airport?: string): Notice[] {
  const all = [...NETWORK_NOTICES, ...Object.values(AIRPORT_CONTENT).flatMap((content) => content.notices)];
  return airport === undefined ? all : filterNoticesForAirport(all, getAirport(airport)?.slug ?? airport);
}

/** Run every schema and cross-reference check over the real content. Empty array means sound. */
export function validateAllContent(): ContentIssue[] {
  return validateContent({
    sources: [...CORE_SOURCES],
    airports: [...AIRPORTS],
    airportContent: Object.values(AIRPORT_CONTENT),
    guides: GUIDES,
    faqs: FAQS,
    notices: NETWORK_NOTICES,
    corporatePages: CORPORATE_PAGES,
    news: NEWS_ITEMS,
  });
}

export * from './types';
export * from './airports';
export * from './guides';
export * from './faqs';
export * from './notices';
export * from './corporate';
export { CORE_SOURCES } from './sources';
