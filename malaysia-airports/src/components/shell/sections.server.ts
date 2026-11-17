/**
 * Server-side section helpers: they read the content layer, so never import this file from a
 * Client Component (use `useSectionAvailability()` there).
 */
import { AIRPORTS, getAirportContent } from '@/content';
import { hasDemoRoutes } from '@/lib/providers';
import { sectionsForContent, type AirportSectionId, type SectionAvailability } from './sections';

/** The sections an airport has, in navigation order. Unknown airports have none. */
export function airportSections(slugOrCode: string): AirportSectionId[] {
  const content = getAirportContent(slugOrCode);
  if (!content) return [];
  return sectionsForContent(content, { hasFlights: hasDemoRoutes(content.airport.slug) });
}

/** Sections for every airport in the registry: small enough to hand to the client shell. */
export function sectionAvailability(): SectionAvailability {
  return Object.fromEntries(AIRPORTS.map((airport) => [airport.slug, airportSections(airport.slug)]));
}

/** Slugs of the airports that have a section. */
export function airportsWithSection(section: AirportSectionId): string[] {
  return AIRPORTS.filter((airport) => airportSections(airport.slug).includes(section)).map((airport) => airport.slug);
}

/**
 * `generateStaticParams` for a page under `/[lang]/[airport]/<section>`: only the airports that
 * have that section are prerendered (the others answer with the not-found page).
 *
 * @example export const generateStaticParams = () => sectionStaticParams('parking');
 */
export function sectionStaticParams(section: AirportSectionId): { airport: string }[] {
  const slugs = airportsWithSection(section);
  // Cache Components rejects an empty list: keep one real airport so the route still builds.
  return (slugs.length > 0 ? slugs : [AIRPORTS[0].slug]).map((airport) => ({ airport }));
}
