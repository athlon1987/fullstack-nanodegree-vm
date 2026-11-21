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
import { createElement, type ComponentProps, type ReactNode } from 'react';
import { DEFAULT_LANG, LANGS, isLang, type Lang } from '@/content/types';
import { I18nExtend, type PartialDictionary } from './client';
import { en, type Dictionary } from './en';
import { ms } from './ms';
import { createTranslator, type Translator } from './translate';

export { DEFAULT_LANG, LANGS, isLang };
export type { Lang, Dictionary };
export * from './translate';
export { localeHref, stripLocale, switchLocalePath, localeFromPath, negotiateLang } from '../locale';

const DICTIONARIES: Record<Lang, Dictionary> = { en, ms };

/** The whole dictionary for a language (server side, tests). Client Components get `clientDictionary`. */
export function getDictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang];
}

/**
 * Namespaces left out of the root `I18nProvider` because only one part of the site uses them in
 * Client Components (performance-09): corporate copy must never ride along on passenger pages.
 * Where a Client Component needs one, wrap it in `I18nScope` with just the part it reads.
 * `i18n.test.ts` fails if a Client Component outside the allowed places reads one of them.
 */
export const SCOPED_NAMESPACES = ['corporatePages', 'designSystem'] as const satisfies readonly (keyof Dictionary)[];

/**
 * The dictionary the root layout sends to the browser: every namespace except the scoped ones.
 * Cached per language so the object identity is stable.
 */
const CLIENT_DICTIONARIES = new Map<Lang, PartialDictionary>();
export function clientDictionary(lang: Lang): PartialDictionary {
  let dictionary = CLIENT_DICTIONARIES.get(lang);
  if (!dictionary) {
    const scoped = new Set<string>(SCOPED_NAMESPACES);
    dictionary = Object.fromEntries(Object.entries(DICTIONARIES[lang]).filter(([name]) => !scoped.has(name))) as PartialDictionary;
    CLIENT_DICTIONARIES.set(lang, dictionary);
  }
  return dictionary;
}

/**
 * Only the given parts of a dictionary: `pickDictionary('en', ['corporatePages.privacy'])` is
 * `{ corporatePages: { privacy: … } }`. Unknown paths are ignored.
 */
export function pickDictionary(lang: Lang, paths: readonly string[]): PartialDictionary {
  const result: PartialDictionary = {};
  for (const path of paths) {
    const parts = path.split('.');
    let source: unknown = DICTIONARIES[lang];
    for (const part of parts) source = typeof source === 'object' && source !== null ? (source as Record<string, unknown>)[part] : undefined;
    if (source === undefined) continue;
    let target = result;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) target[part] = source as PartialDictionary;
      else target = (target[part] ??= {}) as PartialDictionary;
    });
  }
  return result;
}

/**
 * Server Component: gives the Client Components below it the listed namespaces (or sub-trees)
 * on top of the shared ones from the root layout.
 *
 *   <I18nScope lang={lang} namespaces={['corporatePages.privacy']}><DeviceData /></I18nScope>
 */
export function I18nScope({ lang, namespaces, children }: { lang: Lang; namespaces: readonly string[]; children: ReactNode }) {
  const props: ComponentProps<typeof I18nExtend> = { dictionary: pickDictionary(lang, namespaces), children: undefined };
  return createElement(I18nExtend, props, children);
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
