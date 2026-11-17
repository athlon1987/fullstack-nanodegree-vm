/**
 * Internationalisation for Server Components and shared code.
 *
 *   const t = getT(lang);            // plain function, no async
 *   t('nav.flights');                // 'Flights' | 'Penerbangan'
 *   t('freshness.updated', { time }) // interpolation
 *   t.count('search.resultsCount', n) // plurals
 *
 * Client Components: do not import this file (it contains both dictionaries). Use `useT()` and
 * `useLang()` from `@/lib/i18n/client`, and import types from `@/lib/i18n/translate`.
 */
import { DEFAULT_LANG, LANGS, isLang, type Lang } from '@/content/types';
import { en, type Dictionary } from './en';
import { ms } from './ms';
import { createTranslator, type Translator } from './translate';

export { DEFAULT_LANG, LANGS, isLang };
export type { Lang, Dictionary };
export * from './translate';
export { localeHref, stripLocale, switchLocalePath, localeFromPath, negotiateLang } from '../locale';

const DICTIONARIES: Record<Lang, Dictionary> = { en, ms };

/**
 * The whole dictionary for a language. The root layout passes it to `I18nProvider` so that
 * Client Components can translate without bundling both languages.
 */
export function getDictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang];
}

const TRANSLATORS: Record<Lang, Translator> = {
  en: createTranslator('en', en),
  ms: createTranslator('ms', ms),
};

/** The translator for a language, for Server Components. Unknown values fall back to English. */
export function getT(lang: Lang | string): Translator {
  return TRANSLATORS[isLang(lang) ? lang : DEFAULT_LANG];
}

/** Narrow a route param to a supported language, falling back to the default. */
export function toLang(value: string | null | undefined): Lang {
  return isLang(value) ? value : DEFAULT_LANG;
}

/** Route params for `generateStaticParams` in the root layout: `[{ lang: 'en' }, { lang: 'ms' }]`. */
export function langParams(): { lang: Lang }[] {
  return LANGS.map((lang) => ({ lang }));
}
