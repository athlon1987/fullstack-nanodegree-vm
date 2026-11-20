/**
 * The airport section registry and the one way to build links into airport-scoped pages.
 *
 * Build-spec section 4: primary navigation is the same everywhere. With an airport selected the
 * airport-scoped items go to `/[airport]/<section>`; with none they go to
 * `/airports?then=<section>` so the visitor chooses first and continues in one tap. A section is
 * shown for an airport only when the content layer has something for it.
 *
 * This module is client-safe: it holds no content. Which sections exist for which airport is
 * computed on the server (`sections.server.ts`) and reaches Client Components through
 * `useSectionAvailability()` from `shell-context.tsx`.
 *
 * Hrefs returned here have NO locale prefix: pass them to `LocaleLink` or `localeHref`.
 */
import { getAirport, type AirportSelection } from '@/content/airports';
import type { AirportContent, TerminalId } from '@/content/types';
import type { TKey } from '@/lib/i18n/translate';
import type { IconKey } from '@/components/ui/icon';

/** Airport sections in their fixed order. `overview` is the airport home itself. */
export const AIRPORT_SECTION_IDS = ['overview', 'flights', 'map', 'facilities', 'transport', 'parking', 'shop-dine', 'lounges', 'transit'] as const;

/** One section of an airport: also its route segment (`overview` has none). */
export type AirportSectionId = (typeof AIRPORT_SECTION_IDS)[number];

/** Display data for a section. */
export interface AirportSectionMeta {
  id: AirportSectionId;
  /** Route segment under `/[airport]`; empty for the overview. */
  segment: string;
  /** Dictionary key of the short label used in navigation. */
  labelKey: TKey;
  /** Dictionary key of a one-line description (cards on the airport overview). */
  descriptionKey?: TKey;
  icon: IconKey;
}

/** The registry, in navigation order. */
export const AIRPORT_SECTIONS: readonly AirportSectionMeta[] = [
  { id: 'overview', segment: '', labelKey: 'airportPage.overview', icon: 'tower-control' },
  { id: 'flights', segment: 'flights', labelKey: 'nav.flights', descriptionKey: 'airportPage.sections.flights', icon: 'plane-takeoff' },
  { id: 'map', segment: 'map', labelKey: 'nav.map', descriptionKey: 'airportPage.sections.map', icon: 'map' },
  { id: 'facilities', segment: 'facilities', labelKey: 'nav.facilities', descriptionKey: 'airportPage.sections.facilities', icon: 'map-pin' },
  { id: 'transport', segment: 'transport', labelKey: 'nav.groundTransport', descriptionKey: 'airportPage.sections.transport', icon: 'train-front' },
  { id: 'parking', segment: 'parking', labelKey: 'nav.parking', descriptionKey: 'airportPage.sections.parking', icon: 'square-parking' },
  { id: 'shop-dine', segment: 'shop-dine', labelKey: 'nav.shopDine', descriptionKey: 'airportPage.sections.shopDine', icon: 'utensils' },
  { id: 'lounges', segment: 'lounges', labelKey: 'nav.lounges', descriptionKey: 'airportPage.sections.lounges', icon: 'armchair' },
  { id: 'transit', segment: 'transit', labelKey: 'nav.transit', descriptionKey: 'airportPage.sections.transit', icon: 'arrow-left-right' },
];

const BY_ID = new Map(AIRPORT_SECTIONS.map((section) => [section.id, section]));

/** Type guard for route segments and the `?then=` parameter. */
export function isAirportSection(value: unknown): value is AirportSectionId {
  return typeof value === 'string' && BY_ID.has(value as AirportSectionId);
}

/** Display data for one section. */
export function getSection(id: AirportSectionId): AirportSectionMeta {
  return BY_ID.get(id) as AirportSectionMeta;
}

/** Sections available per airport slug, as computed on the server from the content layer. */
export type SectionAvailability = Readonly<Record<string, readonly AirportSectionId[]>>;

/** What `sectionsForContent` needs to know about an airport. */
export type SectionContentInput = Pick<AirportContent, 'facilities' | 'outlets' | 'transport' | 'carParks' | 'maps' | 'guidesNotes'>;

/**
 * The sections an airport gets, from what the content layer holds for it:
 *  - `overview` always;
 *  - `flights` when the demo provider has a board for the airport (`hasFlights`);
 *  - `map`, `facilities`, `transport`, `parking`, `shop-dine` when their collection is not empty;
 *  - `lounges` when a lounge or a hotel is published;
 *  - `transit` when there is a transit note or an inter-terminal transfer.
 */
export function sectionsForContent(content: SectionContentInput, options: { hasFlights: boolean }): AirportSectionId[] {
  const has: Record<AirportSectionId, boolean> = {
    overview: true,
    flights: options.hasFlights,
    map: content.maps.length > 0,
    facilities: content.facilities.length > 0,
    transport: content.transport.length > 0,
    parking: content.carParks.length > 0,
    'shop-dine': content.outlets.length > 0,
    lounges: content.facilities.some((facility) => facility.category === 'lounge' || facility.category === 'hotel'),
    transit: content.guidesNotes.some((note) => note.topic === 'transit') || content.transport.some((option) => option.mode === 'inter-terminal'),
  };
  return AIRPORT_SECTION_IDS.filter((id) => has[id]);
}

/** Does this airport have this section? Unknown airports have none; without availability data we assume yes. */
export function hasSection(availability: SectionAvailability | undefined, airport: string, section: AirportSectionId): boolean {
  if (section === 'overview') return true;
  if (!availability) return true;
  return availability[airport]?.includes(section) ?? false;
}

/** Path of a section at an airport: `/kul/parking`, `/kul` for the overview, `?t=T1` at KLIA when a terminal is given. */
export function sectionPath(airport: string, section: AirportSectionId = 'overview', terminal?: TerminalId): string {
  const record = getAirport(airport);
  const slug = record?.slug ?? airport.toLowerCase();
  const segment = getSection(section).segment;
  const query = terminal && terminal !== 'MAIN' && record && record.terminals.length > 1 ? `?t=${terminal}` : '';
  return `/${slug}${segment ? `/${segment}` : ''}${query}`;
}

/** Path of the "choose an airport first" step for a section. */
export function chooseAirportPath(section: AirportSectionId = 'overview'): string {
  return section === 'overview' ? '/airports' : `/airports?then=${section}`;
}

/**
 * The honest state for a section an airport does not have (A-07): it says the section is not
 * published for that airport and points to the official site and phone. A link named after a
 * section never silently lands on the airport overview.
 */
export function notPublishedPath(airport: string, section: AirportSectionId): string {
  const slug = getAirport(airport)?.slug ?? airport.toLowerCase();
  return `/airports/not-published?airport=${slug}&section=${section}`;
}

/**
 * The link for an airport-scoped destination.
 *
 * @param section      Where the visitor wants to go.
 * @param selection    The remembered airport (`useAirportContext().selection`), an airport slug, or nothing.
 * @param availability Sections per airport (`useSectionAvailability()`); when the chosen airport
 *                     lacks the section the link goes to the "not published" state for it
 *                     (`notPublishedPath`), never to a 404 and never silently to the overview.
 *
 * @example sectionHref('parking', selection, availability) // '/kul/parking?t=T1' or '/airports?then=parking'
 */
export function sectionHref(
  section: AirportSectionId,
  selection: AirportSelection | string | null | undefined,
  availability?: SectionAvailability,
): string {
  const chosen = typeof selection === 'string' ? { airport: selection } : selection;
  const airport = chosen ? getAirport(chosen.airport) : undefined;
  if (!chosen || !airport) return chooseAirportPath(section);
  if (!hasSection(availability, airport.slug, section)) return notPublishedPath(airport.slug, section);
  return sectionPath(airport.slug, section, chosen.terminal);
}

/** True when `sectionHref` would lead to the "not published" state for the chosen airport. */
export function isSectionMissing(
  section: AirportSectionId,
  selection: AirportSelection | string | null | undefined,
  availability?: SectionAvailability,
): boolean {
  const chosen = typeof selection === 'string' ? { airport: selection } : selection;
  const airport = chosen ? getAirport(chosen.airport) : undefined;
  return Boolean(airport) && !hasSection(availability, airport!.slug, section);
}

/**
 * Where choosing an airport should lead, given the page the visitor is on (`pathname` without
 * the locale): the same section at the new airport when it exists there, otherwise that
 * airport's home (the visitor chose an airport, not a section). Returns `null` when the current
 * page is not airport-scoped (stay where you are).
 */
export function sameSectionPath(pathname: string, next: AirportSelection, availability?: SectionAvailability): string | null {
  const [first, second] = pathname.split(/[?#]/)[0].split('/').filter(Boolean);
  if (!first || !getAirport(first)) return null;
  const section: AirportSectionId = isAirportSection(second) ? second : 'overview';
  const airport = getAirport(next.airport);
  if (!airport) return null;
  return sectionPath(airport.slug, hasSection(availability, airport.slug, section) ? section : 'overview', next.terminal);
}

/* ---- Primary navigation --------------------------------------------------------------------- */

/** One item of the primary navigation. */
export interface PrimaryNavItem {
  id: 'flights' | 'plan' | 'at-airport' | 'shop-dine' | 'transport' | 'help' | 'assistance';
  labelKey: TKey;
  icon: IconKey;
  /** Airport-scoped items name their section; the others have a fixed path. */
  section?: AirportSectionId;
  /** Tried in order when the chosen airport lacks `section`. */
  fallbacks?: readonly AirportSectionId[];
  href?: string;
  /** Airport sections (second path segment) that mark this item as current. */
  activeSections?: readonly AirportSectionId[];
  /** Top-level path prefixes that mark this item as current. */
  activePrefixes?: readonly string[];
}

/** Flights, Plan your journey, At the airport, Shops and food, Transport and parking, Help, Assistance. */
export const PRIMARY_NAV: readonly PrimaryNavItem[] = [
  { id: 'flights', labelKey: 'nav.flights', icon: 'plane-takeoff', section: 'flights', activeSections: ['flights'] },
  { id: 'plan', labelKey: 'nav.plan', icon: 'route', href: '/guides', activePrefixes: ['/guides', '/journey'] },
  {
    id: 'at-airport',
    labelKey: 'nav.atAirport',
    icon: 'map-pin',
    section: 'facilities',
    fallbacks: ['map', 'lounges', 'transit'],
    activeSections: ['map', 'facilities', 'lounges', 'transit'],
  },
  { id: 'shop-dine', labelKey: 'nav.shopDine', icon: 'utensils', section: 'shop-dine', activeSections: ['shop-dine'] },
  { id: 'transport', labelKey: 'nav.transport', icon: 'train-front', section: 'transport', fallbacks: ['parking'], activeSections: ['transport', 'parking'] },
  { id: 'help', labelKey: 'nav.help', icon: 'circle-help', href: '/help', activePrefixes: ['/help', '/notices'] },
  // Assistance in the header, one interaction from any page (A-15, BR-18).
  { id: 'assistance', labelKey: 'shellExtras.nav.assistance', icon: 'accessibility', href: '/accessibility', activePrefixes: ['/accessibility'] },
];

/** The section a primary navigation item leads to at the chosen airport, or `null` when none of its sections exists there. */
export function primaryNavSection(item: PrimaryNavItem, selection: AirportSelection | null | undefined, availability?: SectionAvailability): AirportSectionId | null {
  if (!item.section) return null;
  if (!selection) return item.section;
  const candidates = [item.section, ...(item.fallbacks ?? [])];
  return candidates.find((candidate) => hasSection(availability, selection.airport, candidate)) ?? null;
}

/** The link of a primary navigation item for the current airport context. */
export function primaryNavHref(item: PrimaryNavItem, selection: AirportSelection | null | undefined, availability?: SectionAvailability): string {
  if (!item.section) return item.href ?? '/';
  if (!selection) return chooseAirportPath(item.section);
  const section = primaryNavSection(item, selection, availability);
  return section ? sectionHref(section, selection, availability) : notPublishedPath(selection.airport, item.section);
}

/** Is this item the current one for a pathname (without the locale)? */
export function isPrimaryNavActive(item: PrimaryNavItem, pathname: string): boolean {
  const [first, second] = pathname.split(/[?#]/)[0].split('/').filter(Boolean);
  if (!first) return false;
  if (item.activePrefixes?.some((prefix) => `/${first}` === prefix)) return true;
  if (first === 'airports') return false;
  return Boolean(item.activeSections && getAirport(first) && isAirportSection(second) && item.activeSections.includes(second));
}
