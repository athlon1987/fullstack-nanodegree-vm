'use client';

/**
 * Client-side i18n: a context provider fed by the root layout, plus `useT()` and `useLang()`.
 *
 *   // src/app/[lang]/layout.tsx (Server Component)
 *   <I18nProvider lang={lang} dictionary={clientDictionary(lang)}>{children}</I18nProvider>
 *
 *   // any Client Component
 *   const t = useT();
 *   const lang = useLang();
 *
 * The root provider carries the shared namespaces only (performance-09). Copy that only one part
 * of the site needs (corporate pages, the design system) is added where it is used, with the
 * server-side `I18nScope` from `@/lib/i18n`, which renders `I18nExtend` here:
 *
 *   <I18nScope lang={lang} namespaces={['corporatePages.privacy']}><DeviceData /></I18nScope>
 *
 * The locale comes from context, never from `usePathname()` / `useParams()`: URL hooks need a
 * Suspense boundary on routes with unknown params, context does not.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Lang } from '@/content/types';
import type { Dictionary } from './en';
import { createTranslator, type Translator } from './translate';

/** Part of a dictionary: whole namespaces or sub-trees of them. */
export type PartialDictionary = { [key: string]: string | PartialDictionary };

interface I18nValue {
  translator: Translator;
  dictionary: PartialDictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

/** Props of `I18nProvider`. */
export interface I18nProviderProps {
  /** The language of the current route. */
  lang: Lang;
  /** `clientDictionary(lang)` from `@/lib/i18n`, passed down by the server. */
  dictionary: PartialDictionary | Dictionary;
  children: ReactNode;
}

function merge(base: PartialDictionary, extra: PartialDictionary): PartialDictionary {
  const result: PartialDictionary = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const current = result[key];
    result[key] = typeof value === 'object' && typeof current === 'object' ? merge(current, value) : value;
  }
  return result;
}

/** Makes `useT()` and `useLang()` available to every Client Component below it. */
export function I18nProvider({ lang, dictionary, children }: I18nProviderProps) {
  const value = useMemo<I18nValue>(
    () => ({ translator: createTranslator(lang, dictionary as Dictionary), dictionary: dictionary as PartialDictionary }),
    [lang, dictionary],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Adds namespaces to the translator for the subtree below it. Rendered by `I18nScope`. */
export function I18nExtend({ dictionary, children }: { dictionary: PartialDictionary; children: ReactNode }) {
  const parent = useI18n();
  const value = useMemo<I18nValue>(() => {
    const merged = merge(parent.dictionary, dictionary);
    return { translator: createTranslator(parent.translator.lang, merged as unknown as Dictionary), dictionary: merged };
  }, [parent, dictionary]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useT() and useLang() need an <I18nProvider> above them (it belongs in the root layout).');
  }
  return value;
}

/** The translator for the current language: `const t = useT(); t('nav.flights')`. */
export function useT(): Translator {
  return useI18n().translator;
}

/** The current interface language: `'en'` or `'ms'`. */
export function useLang(): Lang {
  return useI18n().translator.lang;
}
