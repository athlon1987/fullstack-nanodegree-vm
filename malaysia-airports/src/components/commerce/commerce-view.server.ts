/**
 * Server-only builders for the shop and dine and the lounges pages. They read the content layer,
 * pick the page language and resolve sources, so Client Components receive small, serialisable
 * props and never import `@/content`.
 */
import {
  facilityCategoryLabel,
  getSource,
  hasTranslation,
  isMultiTerminal,
  pick,
  resolveSources,
  terminalLabel,
  type AirportContent,
  type Facility,
  type Hours,
  type Lang,
  type LocalizedText,
  type Outlet,
  type Source,
  type TerminalId,
} from '@/content';
import type { TKey, Translator } from '@/lib/i18n/translate';
import { categoryKey, normalise, placeFromNote, type HoursView, type OutletView } from './commerce-view';

const PASSENGER_SITE = 'https://airports.malaysiaairports.com.my/';
const AUTHORITATIVE: ReadonlySet<Source['kind']> = new Set(['official', 'government', 'operator']);

/** Category names the dictionary translates; other categories keep the content's wording. */
const KNOWN_CATEGORIES = new Set([
  'duty-free',
  'beauty',
  'fashion',
  'cafe',
  'restaurant',
  'fast-food',
  'bar',
  'convenience',
  'shopping-mall',
  'pharmacy',
  'electronics',
  'books',
  'souvenirs',
]);

export function hoursView(hours: Hours | undefined, lang: Lang): HoursView | undefined {
  if (!hours) return undefined;
  if (hours.kind === 'text') return { kind: 'text', text: pick(hours.text, lang) };
  const note = hours.note ? pick(hours.note, lang) : undefined;
  if (hours.kind === '24h') return note ? { kind: '24h', note } : { kind: '24h' };
  return note ? { kind: 'daily', open: hours.open, close: hours.close, note } : { kind: 'daily', open: hours.open, close: hours.close };
}

function optional(text: LocalizedText | undefined, lang: Lang): string | undefined {
  return text ? pick(text, lang) : undefined;
}

/**
 * Outlets carry no provenance field: an outlet is `official` when an authoritative source
 * (Malaysia Airports, a government body or the operator) backs it, `estimated` otherwise.
 */
export function outletProvenance(outlet: Pick<Outlet, 'sources'>): 'official' | 'estimated' {
  return resolveSources(outlet.sources).some((source) => AUTHORITATIVE.has(source.kind)) ? 'official' : 'estimated';
}

/** Locale-free link to a point on the airport's schematic map, with the terminal filter at KLIA. */
export function mapPointHref(content: AirportContent, poiId: string | undefined): string | undefined {
  if (!poiId) return undefined;
  const map = content.maps.find((model) => model.pois.some((poi) => poi.id === poiId));
  if (!map) return undefined;
  const terminal = isMultiTerminal(content.airport) ? `t=${map.terminal}&` : '';
  return `/${content.airport.slug}/map?${terminal}poi=${encodeURIComponent(poiId)}`;
}

export function categoryLabel(category: string, t: Translator): string {
  const key = categoryKey(category);
  return KNOWN_CATEGORIES.has(key) ? t(`commercePages.categoryNames.${key}` as TKey) : category;
}

export function outletView(outlet: Outlet, content: AirportContent, lang: Lang, t: Translator): OutletView {
  const { airport } = content;
  const terminal = airport.terminals.find((item) => item.id === outlet.terminal);
  const level = outlet.level ? terminal?.levels.find((item) => item.id === outlet.level) : undefined;
  const label = categoryLabel(outlet.category, t);
  const locationNote = optional(outlet.locationNote, lang);
  const description = optional(outlet.description, lang);
  const termLabel = terminalLabel(airport, outlet.terminal, lang, { short: true });
  const view: OutletView = {
    id: outlet.id,
    slug: outlet.slug,
    href: `/${airport.slug}/shop-dine/${outlet.slug}`,
    name: outlet.name,
    kind: outlet.kind,
    categoryKey: categoryKey(outlet.category),
    categoryLabel: label,
    terminal: outlet.terminal,
    terminalLabel: termLabel,
    zone: outlet.zone,
    provenance: outletProvenance(outlet),
    sourceIds: outlet.sources,
    place: placeFromNote(outlet.locationNote?.en, airport.slug, outlet.terminal),
    searchText: normalise(
      [
        outlet.name,
        outlet.category,
        label,
        outlet.cuisine ?? '',
        t(`commercePages.kindLabel.${outlet.kind}`),
        t(`commercePages.kinds.${outlet.kind}`),
        termLabel,
        outlet.zone !== 'unknown' ? t(`commercePages.card.zone.${outlet.zone}`) : '',
        locationNote ?? '',
        outlet.locationNote?.en ?? '',
        description ?? '',
      ].join(' '),
    ),
  };
  if (outlet.cuisine) view.cuisine = outlet.cuisine;
  if (level) view.levelName = pick(level.name, lang);
  if (locationNote) view.locationNote = locationNote;
  const hours = hoursView(outlet.hours, lang);
  if (hours) view.hours = hours;
  if (outlet.priceBand) view.priceBand = outlet.priceBand;
  if (outlet.halal) view.halal = outlet.halal;
  if (description) view.description = description;
  if (outlet.asOf) view.asOf = outlet.asOf;
  const mapHref = mapPointHref(content, outlet.mapPoint);
  if (mapHref) view.mapHref = mapHref;
  return view;
}

/** Every outlet of an airport, in authoring order. */
export function outletViews(content: AirportContent, lang: Lang, t: Translator): OutletView[] {
  return content.outlets.map((outlet) => outletView(outlet, content, lang, t));
}

/** Sources referenced by a set of ids, as a lookup the client can read. */
export function sourceLookup(ids: Iterable<string>): Record<string, Source> {
  return Object.fromEntries(resolveSources([...new Set(ids)]).map((source) => [source.id, source]));
}

/** True when some of the given texts fall back to English on a Malay page. */
export function needsTranslationNotice(texts: readonly (LocalizedText | undefined)[], lang: Lang): boolean {
  return lang !== 'en' && texts.some((text) => text !== undefined && !hasTranslation(text, lang));
}

export interface OfficialLink {
  key: 'dine' | 'shop' | 'services' | 'airportPage';
  url: string;
  /** Terminal the page covers, when it covers one terminal of a multi-terminal airport. */
  terminal?: TerminalId;
}

/** Official directory pages per airport, as registered sources (URLs confirmed, content not read). */
const OFFICIAL_DIRECTORIES: Readonly<Record<string, readonly { key: OfficialLink['key']; source: string; terminal?: TerminalId }[]>> = {
  kul: [
    { key: 'dine', source: 'mahb-klia-t1-dine-directory', terminal: 'T1' },
    { key: 'shop', source: 'mahb-klia-t1-shop-directory', terminal: 'T1' },
    { key: 'services', source: 'mahb-klia-t1-services-directory', terminal: 'T1' },
  ],
};

/** The airport's own page on the passenger website, from its sources or its gaps note. */
export function officialAirportPage(content: AirportContent): string {
  const gaps = content.guidesNotes.find((note) => note.id === `${content.airport.slug}-content-gaps`);
  const candidates = [...resolveSources(content.airport.sources), ...resolveSources(gaps?.sources)];
  const page = candidates.find((source) => source.kind === 'official' && source.url.startsWith(PASSENGER_SITE) && source.url.length > PASSENGER_SITE.length);
  return page?.url ?? getSource('mahb-airports-site')?.url ?? PASSENGER_SITE;
}

/** Where to send visitors for the complete directory: the official directory pages, then the airport page. */
export function officialDirectory(content: AirportContent): OfficialLink[] {
  const links: OfficialLink[] = [];
  for (const entry of OFFICIAL_DIRECTORIES[content.airport.slug] ?? []) {
    const source = getSource(entry.source);
    if (source) links.push(entry.terminal ? { key: entry.key, url: source.url, terminal: entry.terminal } : { key: entry.key, url: source.url });
  }
  links.push({ key: 'airportPage', url: officialAirportPage(content) });
  return links;
}

/* -------------------------------------------------------------------------------------------
 * Lounges, hotels, rest and showers
 * ---------------------------------------------------------------------------------------- */

export const REST_CATEGORIES = ['lounge', 'hotel', 'rest', 'shower'] as const;
export type RestCategory = (typeof REST_CATEGORIES)[number];

export interface RestView {
  id: string;
  name: string;
  category: RestCategory;
  categoryLabel: string;
  terminal: TerminalId;
  terminalLabel: string;
  zone: Facility['zone'];
  levelName?: string;
  locationNote?: string;
  hours?: HoursView;
  description: string;
  access?: string;
  operator?: string;
  /** The operator's own page, when one of the item's sources is the operator speaking. */
  operatorUrl?: string;
  bookingUrl?: string;
  mapHref?: string;
  provenance: Facility['provenance'];
  asOf?: string;
  sources: Source[];
}

function isRestCategory(category: Facility['category']): category is RestCategory {
  return (REST_CATEGORIES as readonly string[]).includes(category);
}

export function restViews(content: AirportContent, lang: Lang): RestView[] {
  return content.facilities
    .map((facility, index) => ({ facility, index }))
    .filter((entry): entry is { facility: Facility & { category: RestCategory }; index: number } => isRestCategory(entry.facility.category))
    .sort((a, b) => REST_CATEGORIES.indexOf(a.facility.category) - REST_CATEGORIES.indexOf(b.facility.category) || a.index - b.index)
    .map(({ facility }) => {
      const terminal = content.airport.terminals.find((item) => item.id === facility.terminal);
      const level = facility.level ? terminal?.levels.find((item) => item.id === facility.level) : undefined;
      const sources = resolveSources(facility.sources);
      const operatorSource = facility.operator
        ? sources.find((source) => source.kind === 'operator' && normalise(source.publisher).includes(normalise(facility.operator ?? '')))
        : undefined;
      const view: RestView = {
        id: facility.id,
        name: pick(facility.name, lang),
        category: facility.category,
        categoryLabel: facilityCategoryLabel(facility.category, lang),
        terminal: facility.terminal,
        terminalLabel: terminalLabel(content.airport, facility.terminal, lang, { short: true }),
        zone: facility.zone,
        description: pick(facility.description, lang),
        provenance: facility.provenance,
        sources,
      };
      if (level) view.levelName = pick(level.name, lang);
      const locationNote = optional(facility.locationNote, lang);
      if (locationNote) view.locationNote = locationNote;
      const hours = hoursView(facility.hours, lang);
      if (hours) view.hours = hours;
      const access = optional(facility.access, lang);
      if (access) view.access = access;
      if (facility.operator) view.operator = facility.operator;
      if (operatorSource) view.operatorUrl = operatorSource.url;
      if (facility.bookingUrl) view.bookingUrl = facility.bookingUrl;
      const mapHref = mapPointHref(content, facility.mapPoint);
      if (mapHref) view.mapHref = mapHref;
      if (facility.asOf) view.asOf = facility.asOf;
      return view;
    });
}

/** The airport's official lounge listing, when the content layer cites one. */
export function officialLoungeListing(content: AirportContent): string | undefined {
  const ids = content.facilities.filter((facility) => facility.category === 'lounge').flatMap((facility) => facility.sources);
  return resolveSources([...new Set(ids)]).find((source) => source.kind === 'official' && /lounge/i.test(source.title))?.url;
}
