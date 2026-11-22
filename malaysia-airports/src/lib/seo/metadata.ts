/**
 * Metadata helper for pages: canonical URL, hreflang alternates for both languages, Open Graph
 * and the large-image card, from one call. Server only (reads the dictionaries).
 *
 * @example
 * export async function generateMetadata(): Promise<Metadata> {
 *   const lang = toLang(await routeLang());
 *   const t = getT(lang);
 *   return pageMetadata({ lang, path: '/guides', title: t('guidePages.title'), description: t('guidePages.hub.metaDescription') });
 * }
 *
 * Segments merge shallowly (Next.js notes, section 8): this returns complete `alternates`,
 * `openGraph` and `twitter` objects. It never sets `robots` unless asked, so the root layout's
 * prototype `noindex` stays in force. The Open Graph image comes from `app/[lang]/opengraph-image.png`.
 */
import type { Metadata } from 'next';
import { LANGS } from '@/content/values';
import type { Lang } from '@/content/types';
import { getT, toLang } from '@/lib/i18n';
import { OG_LOCALE, localePaths } from './site';

export interface PageMetadataInput {
  lang: Lang;
  /** Path WITHOUT the locale: `/kul/parking`, `/guides/baggage`, `/` for home. */
  path: string;
  title: string;
  description: string;
  /** Utility pages that should never be indexed (offline, search results, personal pages). */
  noindex?: boolean;
  /** Open Graph type; `article` for news and guides with a date. */
  type?: 'website' | 'article';
}

/**
 * Round 6 (E-14, third review 9.1 item 10): the canonical and the hreflang alternates for both
 * languages, for a page whose `generateMetadata` sets its own title and description. It replaces
 * the root layout's inherited canonical (segments merge shallowly), so the head still names
 * exactly one canonical, the same URL as the `Link` header.
 *
 * @example return { title, description, alternates: languageAlternates(await routeLang(), '/notices') };
 */
export function languageAlternates(lang: Lang | string, path: string): NonNullable<Metadata['alternates']> {
  const paths = localePaths(path);
  return { canonical: paths[toLang(lang)], languages: { ...paths, 'x-default': paths.en } };
}

export function pageMetadata({ lang, path, title, description, noindex, type = 'website' }: PageMetadataInput): Metadata {
  const paths = localePaths(path);
  const t = getT(lang);
  return {
    title,
    description,
    alternates: languageAlternates(lang, path),
    openGraph: {
      type,
      siteName: t('common.appName'),
      title,
      description,
      url: paths[lang],
      locale: OG_LOCALE[lang],
      alternateLocale: LANGS.filter((other) => other !== lang).map((other) => OG_LOCALE[other]),
    },
    twitter: { card: 'summary_large_image', title, description },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * Round 5 (E-14): the canonical every page inherits from the root layout, so that each page names
 * its canonical URL in the HTML head as well as in the `Link` header (`link-headers.ts`). 124 of
 * 276 pages relied on the header alone because their `generateMetadata` does not call
 * `pageMetadata`.
 *
 * `./` is resolved by Next.js against the path being rendered, with `metadataBase`: the same URL
 * the `Link` header names (origin, locale and path, no query string), so a response still carries
 * one distinct canonical. A page that calls `pageMetadata` replaces this with its own complete
 * `alternates` (segments merge shallowly), so no page gets two. Only the canonical is inherited:
 * the hreflang alternates need the other locale's path, which a relative URL cannot express; the
 * `Link` header gives them on every page.
 */
export const INHERITED_ALTERNATES: NonNullable<Metadata['alternates']> = { canonical: './' };
