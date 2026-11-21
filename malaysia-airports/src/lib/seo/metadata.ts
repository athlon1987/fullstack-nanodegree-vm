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
import { getT } from '@/lib/i18n';
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

export function pageMetadata({ lang, path, title, description, noindex, type = 'website' }: PageMetadataInput): Metadata {
  const paths = localePaths(path);
  const t = getT(lang);
  return {
    title,
    description,
    alternates: {
      canonical: paths[lang],
      languages: { ...paths, 'x-default': paths.en },
    },
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
