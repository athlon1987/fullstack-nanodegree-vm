/**
 * Locale-aware path helpers. Every page lives under `/en/...` or `/ms/...`; API routes and
 * external URLs are never prefixed. Content and navigation data store paths WITHOUT the locale
 * (`/kul/flights`) and the UI adds it with `localeHref`.
 *
 * Pure string functions: safe on the server and the client.
 */
import { DEFAULT_LANG, LANGS, isLang, type Lang } from '@/content/types';

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function splitSuffix(path: string): [string, string] {
  const index = path.search(/[?#]/);
  return index === -1 ? [path, ''] : [path.slice(0, index), path.slice(index)];
}

/** The locale a pathname starts with, if any: `/ms/kul` gives `ms`. */
export function localeFromPath(pathname: string): Lang | undefined {
  const first = pathname.split('/')[1];
  return isLang(first) ? first : undefined;
}

/**
 * Remove the locale prefix from a pathname: `/en/kul/flights` becomes `/kul/flights` and `/en`
 * becomes `/`. Paths without a locale are returned unchanged. Query and hash are kept.
 */
export function stripLocale(pathname: string): string {
  const [path, suffix] = splitSuffix(pathname);
  const segments = path.split('/');
  if (!isLang(segments[1])) return pathname;
  const rest = `/${segments.slice(2).join('/')}`;
  return `${rest === '/' ? '/' : rest.replace(/\/$/, '')}${suffix}`;
}

/**
 * Build an internal link for a language: `localeHref('ms', '/kul/flights')` is `/ms/kul/flights`.
 *
 * Left untouched: absolute URLs (`https:`, `mailto:`, `tel:`), hash-only links (`#main`) and
 * API routes (`/api/...`). A path that already has a locale prefix is re-prefixed.
 */
export function localeHref(lang: Lang, path: string): string {
  if (EXTERNAL.test(path) || path.startsWith('#')) return path;
  const normalised = path.startsWith('/') ? path : `/${path}`;
  if (normalised === '/api' || normalised.startsWith('/api/')) return normalised;
  const bare = stripLocale(normalised);
  const [pathname, suffix] = splitSuffix(bare);
  return `/${lang}${pathname === '/' ? '' : pathname}${suffix}`;
}

/** The same page in another language: `switchLocalePath('/en/kul/map?to=x', 'ms')` is `/ms/kul/map?to=x`. */
export function switchLocalePath(pathname: string, lang: Lang): string {
  return localeHref(lang, stripLocale(pathname));
}

/**
 * Pick a supported language from an `Accept-Language` header (for the `/` redirect in the
 * proxy). Falls back to the default language.
 */
export function negotiateLang(acceptLanguage: string | null | undefined): Lang {
  if (!acceptLanguage) return DEFAULT_LANG;
  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const quality = params.map((param) => param.trim()).find((param) => param.startsWith('q='));
      return { tag: tag.toLowerCase(), q: quality ? Number(quality.slice(2)) : 1 };
    })
    .filter((entry) => entry.tag && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if (base === 'ms' || base === 'my' || base === 'zsm') return 'ms';
    if ((LANGS as readonly string[]).includes(base)) return base as Lang;
  }
  return DEFAULT_LANG;
}
