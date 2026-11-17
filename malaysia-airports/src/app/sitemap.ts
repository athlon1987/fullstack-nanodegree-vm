import type { MetadataRoute } from 'next';
import { LANGS } from '@/content/types';
import { sitemapPaths } from '@/lib/seo/site-routes';
import { absoluteUrl, localePaths } from '@/lib/seo/site';

/**
 * `/sitemap.xml`: every prerendered page in English and Bahasa Malaysia, each entry carrying
 * hreflang alternates for both languages plus `x-default` (English). Built from the registries at
 * build time (`src/lib/seo/site-routes.ts`), so it follows the content without hand edits.
 * No `lastModified`: a value we cannot vouch for is worse than none.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapPaths().flatMap((path) => {
    const paths = localePaths(path);
    const languages = { ...Object.fromEntries(LANGS.map((lang) => [lang, absoluteUrl(paths[lang])])), 'x-default': absoluteUrl(paths.en) };
    return LANGS.map((lang) => ({ url: absoluteUrl(paths[lang]), alternates: { languages } }));
  });
}
