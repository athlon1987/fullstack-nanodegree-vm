'use client';

/**
 * Client-side i18n: a context provider fed by the root layout, plus `useT()` and `useLang()`.
 *
 *   // src/app/[lang]/layout.tsx (Server Component)
 *   <I18nProvider lang={lang} dictionary={getDictionary(lang)}>{children}</I18nProvider>
 *
 *   // any Client Component
 *   const t = useT();
 *   const lang = useLang();
 *
 * The locale comes from context, never from `usePathname()` / `useParams()`: URL hooks need a
 * Suspense boundary on routes with unknown params, context does not.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Lang } from '@/content/types';
import type { Dictionary } from './en';
import { createTranslator, type Translator } from './translate';

const I18nContext = createContext<Translator | null>(null);

/** Props of `I18nProvider`. */
export interface I18nProviderProps {
  /** The language of the current route. */
  lang: Lang;
  /** `getDictionary(lang)` from `@/lib/i18n`, passed down by the server. */
  dictionary: Dictionary;
  children: ReactNode;
}

/** Makes `useT()` and `useLang()` available to every Client Component below it. */
export function I18nProvider({ lang, dictionary, children }: I18nProviderProps) {
  const translator = useMemo(() => createTranslator(lang, dictionary), [lang, dictionary]);
  return <I18nContext.Provider value={translator}>{children}</I18nContext.Provider>;
}

function useTranslator(): Translator {
  const translator = useContext(I18nContext);
  if (!translator) {
    throw new Error('useT() and useLang() need an <I18nProvider> above them (it belongs in the root layout).');
  }
  return translator;
}

/** The translator for the current language: `const t = useT(); t('nav.flights')`. */
export function useT(): Translator {
  return useTranslator();
}

/** The current interface language: `'en'` or `'ms'`. */
export function useLang(): Lang {
  return useTranslator().lang;
}
