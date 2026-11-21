/**
 * Locale-aware path helpers. Every page lives under `/en/...` or `/ms/...`; API routes and
 * external URLs are never prefixed. Content and navigation data store paths WITHOUT the locale
 * (`/kul/flights`) and the UI adds it with `localeHref`.
 *
 * Pure string functions: safe on the server and the client.
 */
import type { Lang } from '@/content/types';

/*
 * The locales, kept here as plain values (checked against `Lang` at compile time) so that this
 * module, which every link in the browser uses, does not pull the content schemas and zod into
 * the client bundle (performance-08).
 */
const LOCALE_FLAGS: Record<Lang, true> = { en: true, ms: true };
const LANGS = Object.keys(LOCALE_FLAGS) as Lang[];
const DEFAULT_LANG: Lang = 'en';
const isLang = (value: unknown): value is Lang => typeof value === 'string' && Object.hasOwn(LOCALE_FLAGS, value);

/** Absolute and scheme links that may be passed through unchanged (security-09). */
const ALLOWED_EXTERNAL = /^(?:https:\/\/[^\s/\\]|mailto:|tel:)/i;
/** Anything else that is not a plain path: other schemes, `//host` and `/\host`. */
const OTHER_SCHEME = /^(?:[a-z][a-z0-9+.-]*:|[/\\]{2}|\/\\)/i;
/** What a link that is not allowed becomes: an inert in-page link. */
export const BLOCKED_HREF = '#';

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
 * Left untouched: `https:`, `mailto:` and `tel:` links, hash-only links (`#main`) and API routes
 * (`/api/...`). Any other scheme (`http:`, `data:`, `javascript:`…), protocol-relative `//host`
 * and `/\host` become `BLOCKED_HREF`. A path that already has a locale prefix is re-prefixed.
 */
export function localeHref(lang: Lang, path: string): string {
  const trimmed = path.trim();
  if (ALLOWED_EXTERNAL.test(trimmed) || trimmed.startsWith('#')) return trimmed;
  if (OTHER_SCHEME.test(trimmed) || /[\u0000-\u001f]/.test(trimmed)) return BLOCKED_HREF;
  path = trimmed;
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
