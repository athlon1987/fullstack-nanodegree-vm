/**
 * Redirects from the old MAHB passenger URLs to this site's structure.
 *
 * The old site (sitemap of 16 Nov 2026, docs/research/direct/mahb-sitemap-urls-2026-11-16.txt)
 * had six identical trees of 46 paths: `/en/klia1/…`, `/en/klia2/…`, `/en/penang/…`,
 * `/en/kota-kinabalu/…`, `/en/kuching/…` and `/en/langkawi/…`, plus the flight boards at
 * `/<airport>/flight-information/(departures|arrivals)`. KLIA was two trees; here it is one
 * airport (`kul`) with a terminal filter (`?t=T1|T2`). Topics that the old site repeated under
 * several paths (parking, Butterfly Effect, transfers, facilities) collapse to one page each.
 *
 * Pure data and functions with NO imports: `next.config.ts` loads this file directly, outside the
 * app bundle, so path aliases and the content layer are not available here. The section lists in
 * `LEGACY_AIRPORTS` mirror `airportSections()` (content layer); `legacy-redirects.test.ts` fails
 * when a destination would 404 and reports when a better destination becomes available.
 *
 * Status codes: 308 (permanent) when the old page has a true equivalent here; 307 (temporary)
 * when we send the visitor to the closest page because the equivalent does not exist yet, so the
 * mapping can improve later without browsers having cached the fallback forever.
 */

/** Airport sections of this site (mirrors `AIRPORT_SECTION_IDS` in `src/components/shell/sections.ts`). */
export type LegacySection = 'overview' | 'flights' | 'map' | 'facilities' | 'transport' | 'parking' | 'shop-dine' | 'lounges' | 'transit';

export interface LegacyAirport {
  /** Path segment on the old site. */
  legacy: string;
  /** Airport slug here. */
  slug: string;
  /** KLIA terminal the old tree stood for (the old site had one tree per terminal). */
  terminal?: 'T1' | 'T2';
  /** Sections this airport has here today (`airportSections(slug)`); checked by the unit test. */
  sections: readonly LegacySection[];
}

const ALL_SECTIONS: readonly LegacySection[] = ['overview', 'flights', 'map', 'facilities', 'transport', 'parking', 'shop-dine', 'lounges', 'transit'];

export const LEGACY_AIRPORTS: readonly LegacyAirport[] = [
  { legacy: 'klia1', slug: 'kul', terminal: 'T1', sections: ALL_SECTIONS },
  { legacy: 'klia2', slug: 'kul', terminal: 'T2', sections: ALL_SECTIONS },
  { legacy: 'penang', slug: 'pen', sections: ['overview', 'flights', 'facilities', 'transport', 'parking', 'lounges'] },
  { legacy: 'kota-kinabalu', slug: 'bki', sections: ['overview', 'flights', 'facilities', 'transport', 'parking', 'lounges'] },
  { legacy: 'kuching', slug: 'kch', sections: ['overview', 'flights'] },
  { legacy: 'langkawi', slug: 'lgk', sections: ['overview', 'flights'] },
];

/** Where an old topic goes: an airport section (first available wins), or a network-wide page. */
export type LegacyDestination =
  | { sections: readonly LegacySection[]; query?: Record<string, string> }
  | { page: string };

export interface LegacyTopic {
  /** Path under the old airport root, without slashes at either end ('' is the airport home). */
  path: string;
  to: LegacyDestination;
  /** False when the destination is the closest match rather than an equivalent (always 307). */
  exact?: boolean;
}

/** Every path of one old airport tree (46 from the sitemap) plus the flight boards. */
export const LEGACY_TOPICS: readonly LegacyTopic[] = [
  { path: '', to: { sections: ['overview'] } },
  { path: 'flight-information', to: { sections: ['flights'] } },
  { path: 'flight-information/departures', to: { sections: ['flights'], query: { dir: 'd' } } },
  { path: 'flight-information/arrivals', to: { sections: ['flights'], query: { dir: 'a' } } },
  { path: 'parking', to: { sections: ['parking'] } },
  { path: 'map', to: { sections: ['map', 'facilities'] } },
  { path: 'help', to: { page: '/help' } },
  { path: 'butterfly-effect', to: { page: '/guides/neurodivergent' } },
  { path: 'mobile-app', to: { page: '/offline' }, exact: false },
  { path: 'myairports', to: { page: '/offline' }, exact: false },
  { path: 'air-travel', to: { page: '/guides' } },
  { path: 'air-travel/airport-facilities', to: { sections: ['facilities'] } },
  { path: 'air-travel/facilities', to: { sections: ['facilities'] } },
  { path: 'air-travel/services', to: { sections: ['facilities'] } },
  { path: 'air-travel/services/airport-care-ambassadors', to: { page: '/help' }, exact: false },
  { path: 'air-travel/services/butterfly-effect', to: { page: '/guides/neurodivergent' } },
  { path: 'air-travel/services/fast-track', to: { sections: ['overview'] }, exact: false },
  { path: 'air-travel/services/lost-and-found', to: { page: '/help/lost-property' } },
  { path: 'air-travel/services/special-assistance', to: { page: '/accessibility' } },
  { path: 'air-travel/services/wifi', to: { sections: ['facilities'] } },
  { path: 'air-travel/special-assistance', to: { page: '/accessibility' } },
  { path: 'air-travel/flight-transfer', to: { sections: ['transit'] } },
  { path: 'air-travel/inter-terminal-transfer', to: { sections: ['transit'] } },
  { path: 'air-travel/baggage', to: { page: '/guides/baggage' } },
  { path: 'air-travel/customs-and-immigration', to: { page: '/guides/immigration-customs' } },
  { path: 'air-travel/facial-recognition', to: { page: '/guides/immigration-customs' }, exact: false },
  { path: 'air-travel/lag-restricted-items', to: { page: '/guides/security' } },
  { path: 'air-travel/security-screening', to: { page: '/guides/security' } },
  { path: 'air-travel/vehicle-access-management-system', to: { sections: ['transport'] }, exact: false },
  { path: 'air-travel/parking', to: { sections: ['parking'] } },
  { path: 'air-travel/public-transport', to: { sections: ['transport'] } },
  { path: 'air-travel/rental-services', to: { sections: ['transport'] } },
  { path: 'air-travel/location-map', to: { sections: ['map', 'facilities'] } },
  { path: 'air-travel/passenger-services-charges', to: { page: '/help' }, exact: false },
  { path: 'air-travel/travel-health-sops', to: { page: '/notices' }, exact: false },
  { path: 'air-travel/visa', to: { page: '/guides/immigration-customs' } },
  { path: 'booking-services', to: { sections: ['lounges'] }, exact: false },
  { path: 'booking-services/butterfly-effect', to: { page: '/guides/neurodivergent' } },
  { path: 'booking-services/film-and-photography', to: { page: '/help/contact' }, exact: false },
  { path: 'booking-services/things-to-do', to: { sections: ['shop-dine'] }, exact: false },
  { path: 'booking-services/visitation-kul', to: { page: '/help/contact' }, exact: false },
  { path: 'shop-dine-services', to: { sections: ['shop-dine'] } },
  { path: 'shop-dine-services/all', to: { sections: ['shop-dine'] } },
  { path: 'shop-dine-services/dine', to: { sections: ['shop-dine'] } },
  { path: 'shop-dine-services/shop', to: { sections: ['shop-dine'] } },
  { path: 'shop-dine-services/services', to: { sections: ['facilities'] } },
  { path: 'transit/flight-transfers', to: { sections: ['transit'] } },
  { path: 'transit/inter-terminal-transfer', to: { sections: ['transit'] } },
  { path: 'transit/things-do', to: { sections: ['shop-dine'] }, exact: false },
];

/** One resolved mapping, without the locale: `from` and `to` start with `/`. */
export interface LegacyMapping {
  from: string;
  to: string;
  permanent: boolean;
  /** The airport section reached, or `null` for a network page. */
  section: LegacySection | null;
}

/** Resolve one topic for one old airport. */
export function resolveLegacyTopic(airport: LegacyAirport, topic: LegacyTopic): LegacyMapping {
  const from = `/${airport.legacy}${topic.path ? `/${topic.path}` : ''}`;
  if ('page' in topic.to) {
    return { from, to: topic.to.page, permanent: topic.exact !== false, section: null };
  }
  const wanted = topic.to.sections;
  const section = wanted.find((candidate) => airport.sections.includes(candidate)) ?? 'overview';
  const equivalent = section === wanted[0];
  const query = new URLSearchParams();
  if (airport.terminal) query.set('t', airport.terminal);
  // Filters only make sense on the page they were written for.
  if (equivalent) for (const [key, value] of Object.entries(topic.to.query ?? {})) query.set(key, value);
  const search = query.toString();
  return {
    from,
    to: `/${airport.slug}${section === 'overview' ? '' : `/${section}`}${search ? `?${search}` : ''}`,
    permanent: topic.exact !== false && equivalent,
    section,
  };
}

/** Every mapping, airport by airport, in table order (for the hand-off table and the tests). */
export function legacyMappings(): LegacyMapping[] {
  return LEGACY_AIRPORTS.flatMap((airport) => LEGACY_TOPICS.map((topic) => resolveLegacyTopic(airport, topic)));
}

/** The shape `next.config.ts` `redirects()` expects. */
export interface ConfigRedirect {
  source: string;
  destination: string;
  permanent: boolean;
}

/** Locale prefix of every rule. The old site was English only; `/ms/klia1/…` is accepted too. */
const LANG = '/:lang(en|ms)';

/**
 * Rules for `next.config.ts`. Old paths without a locale (`/klia1/parking`) first get one from
 * `src/proxy.ts`, then match here. Unknown paths under an old airport go to its home (307).
 */
export function legacyRedirects(): ConfigRedirect[] {
  const exact = legacyMappings().map((mapping) => ({
    source: `${LANG}${mapping.from}`,
    destination: `/:lang${mapping.to}`,
    permanent: mapping.permanent,
  }));
  const catchAll = LEGACY_AIRPORTS.map((airport) => ({
    source: `${LANG}/${airport.legacy}/:rest*`,
    destination: `/:lang/${airport.slug}${airport.terminal ? `?t=${airport.terminal}` : ''}`,
    permanent: false,
  }));
  return [...exact, ...catchAll];
}
