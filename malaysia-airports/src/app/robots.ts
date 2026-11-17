import type { MetadataRoute } from 'next';
import { LANGS } from '@/content/types';
import { absoluteUrl } from '@/lib/seo/site';

/**
 * `/robots.txt`. Crawlers may fetch pages (so they can read each page's robots meta), but not the
 * API, search results, personal or utility pages, or demonstration flight details.
 *
 * Keeping the concept prototype out of search results is done with `noindex` (the root layout's
 * robots meta and the `X-Robots-Tag` header from `next.config.ts`), not here: a URL blocked in
 * robots.txt can still be listed from links elsewhere, because the crawler never sees `noindex`.
 */
export default function robots(): MetadataRoute.Robots {
  const perLanguage = LANGS.flatMap((lang) => [`/${lang}/search`, `/${lang}/journey`, `/${lang}/offline`, `/${lang}/design-system`, `/${lang}/*/flights/`]);
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', ...perLanguage] }],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
