/**
 * The public origin of the site and absolute URLs for sitemaps, JSON-LD and Open Graph.
 * Same source as the root layout's `metadataBase`: `NEXT_PUBLIC_SITE_URL`, else localhost.
 */
import { LANGS } from '@/content/values';
import type { Lang } from '@/content/types';
import { localeHref } from '@/lib/locale';

export const SITE_URL = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');

/** `/en/kul/parking` -> `https://example.org/en/kul/parking`. Paths must start with `/`. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/** Locale paths of one page: `{ en: '/en/kul', ms: '/ms/kul' }` for `/kul`. */
export function localePaths(path: string): Record<Lang, string> {
  return Object.fromEntries(LANGS.map((lang) => [lang, localeHref(lang, path)])) as Record<Lang, string>;
}

/** Open Graph locale codes. Malaysian English and Bahasa Malaysia. */
export const OG_LOCALE: Record<Lang, string> = { en: 'en_MY', ms: 'ms_MY' };

/** Whether search engines may index the site (`SITE_INDEXING=allow`); false for the concept prototype. */
export const SITE_INDEXABLE = process.env.SITE_INDEXING === 'allow';
