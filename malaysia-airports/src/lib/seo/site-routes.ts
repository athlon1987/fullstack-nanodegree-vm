/**
 * Every page that belongs in the sitemap, without the locale (each is listed in both languages).
 * Server only: it reads the content layer and the section registry.
 *
 * Sources of truth, so nothing here goes stale by hand:
 *  - airports: the 39-airport registry; sections per airport from `airportSections()` (the same
 *    rule the navigation uses, so the sitemap never lists a section an airport does not have);
 *  - guides, help topics, outlets: their content registries;
 *  - pages other teams are still building (corporate, legal): listed once their route folder
 *    exists at build time, so the sitemap never advertises a 404.
 *
 * Left out on purpose: search results, My journey and the offline page (personal or utility),
 * flight detail pages (demonstration data, unbounded), the design system (internal).
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AIRPORTS, CORPORATE_PAGES, NEWS_ITEMS, getAirportContent, guideSlugs, helpTopicSlugs } from '@/content';
import { sectionPath } from '@/components/shell/sections';
import { airportSections } from '@/components/shell/sections.server';

/** Network pages that exist for both languages. */
const NETWORK_PATHS = ['/', '/airports', '/notices', '/guides', '/help', '/accessibility', '/concierge'] as const;

/** Is a route folder under `src/app/[lang]` present in this build? (Read at build time only.) */
function routeExists(segment: string): boolean {
  try {
    return existsSync(join(process.cwd(), 'src', 'app', '[lang]', segment));
  } catch {
    return false;
  }
}

function airportPaths(): string[] {
  return AIRPORTS.flatMap((airport) => {
    const sections = airportSections(airport.slug);
    const paths = sections.map((section) => sectionPath(airport.slug, section));
    if (sections.includes('shop-dine')) {
      for (const outlet of getAirportContent(airport.slug)?.outlets ?? []) paths.push(`/${airport.slug}/shop-dine/${outlet.slug}`);
    }
    return paths;
  });
}

function pendingPaths(): string[] {
  const paths: string[] = [];
  if (routeExists('corporate')) {
    paths.push('/corporate', ...CORPORATE_PAGES.map((page) => `/corporate/${page.slug}`));
    if (routeExists(join('corporate', 'news'))) paths.push('/corporate/news', ...NEWS_ITEMS.map((item) => `/corporate/news/${item.slug}`));
  }
  for (const legal of ['about-this-prototype', 'privacy', 'terms']) if (routeExists(legal)) paths.push(`/${legal}`);
  return paths;
}

/** Sitemap paths without the locale, unique, in a stable order. */
export function sitemapPaths(): string[] {
  const paths = [
    ...NETWORK_PATHS,
    ...guideSlugs().map((slug) => `/guides/${slug}`),
    ...helpTopicSlugs().map((slug) => `/help/${slug}`),
    ...airportPaths(),
    ...pendingPaths(),
  ];
  return [...new Set(paths)];
}
