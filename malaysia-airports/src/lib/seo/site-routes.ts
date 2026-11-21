/**
 * Every page that belongs in the sitemap, without the locale (each is listed in both languages).
 * Server only: it reads the content layer, the section registry and the route folders.
 *
 * Sources of truth, so nothing here goes stale by hand (docs-01):
 *  - static pages: every `page.tsx` under `src/app/[lang]` whose path has no dynamic segment,
 *    found on disk at build time, so a new page (a corporate page, a legal page) is listed as
 *    soon as its folder exists and never before;
 *  - dynamic pages: the same registries their routes' `generateStaticParams` read: airports and
 *    their sections (`airportSections()`, the rule the navigation uses), outlets, guides, help
 *    topics and the corporate media centre (`mediaSlugs()`).
 *
 * Left out on purpose (`SITEMAP_EXCLUDED`): search results, My journey and the offline page
 * (personal or utility), the design system (internal), the airport "not published" note, and the
 * catch-all not-found route. Flight detail pages (demonstration data, unbounded) have no static
 * params at all. `seo.test.ts` checks the sitemap against the route folders and the routes'
 * own `generateStaticParams`.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { AIRPORTS, getAirportContent, guideSlugs, helpTopicSlugs } from '@/content';
import { mediaSlugs } from '@/components/corporate/corporate-data.server';
import { sectionPath } from '@/components/shell/sections';
import { airportSections } from '@/components/shell/sections.server';

/** Static pages that are deliberately not in the sitemap, without the locale. */
export const SITEMAP_EXCLUDED = ['/search', '/journey', '/offline', '/design-system', '/airports/not-published'] as const;

/** The `src/app/[lang]` folder, read at build time only. */
export const LANG_ROUTES_DIR = join(process.cwd(), 'src', 'app', '[lang]');

/**
 * Paths of every static page under `[lang]` (no `[param]` in the path), without the locale.
 * Route groups `(name)` do not change the URL; private `_folders` are not routes.
 */
export function staticRoutePaths(dir: string = LANG_ROUTES_DIR, base = ''): string[] {
  // `turbopackIgnore`: the sitemap is prerendered, so this walk runs at build time only. Without
  // the hint Turbopack traced the whole project (about 1,080 files) into the server output.
  if (!existsSync(/* turbopackIgnore: true */ dir)) return [];
  const paths: string[] = [];
  for (const name of readdirSync(/* turbopackIgnore: true */ dir).sort()) {
    const full = join(/* turbopackIgnore: true */ dir, name);
    if (!statSync(/* turbopackIgnore: true */ full).isDirectory()) {
      if (name === 'page.tsx' || name === 'page.ts') paths.push(base || '/');
      continue;
    }
    if (name.startsWith('[') || name.startsWith('_') || name.startsWith('@')) continue;
    const segment = name.startsWith('(') && name.endsWith(')') ? '' : `/${name}`;
    paths.push(...staticRoutePaths(full, `${base}${segment}`));
  }
  return paths;
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

/** Sitemap paths without the locale, unique, in a stable order. */
export function sitemapPaths(): string[] {
  const excluded = new Set<string>(SITEMAP_EXCLUDED);
  const statics = staticRoutePaths();
  const paths = [
    ...statics.filter((path) => !excluded.has(path)),
    ...guideSlugs().map((slug) => `/guides/${slug}`),
    ...helpTopicSlugs().map((slug) => `/help/${slug}`),
    ...airportPaths(),
    ...(statics.includes('/corporate/news') ? mediaSlugs().map((slug) => `/corporate/news/${slug}`) : []),
  ];
  return [...new Set(paths)];
}
