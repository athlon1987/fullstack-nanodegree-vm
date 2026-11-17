/**
 * The translator: typed keys, `{name}` interpolation and plurals.
 *
 * This file imports no dictionary at runtime (only the `Dictionary` type), so Client Components
 * can use it without pulling both languages into the bundle.
 */
import type { Lang } from '@/content/types';
import type { Dictionary } from './en';

type PluralForms = { one: string; other: string };

type LeafPaths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : LeafPaths<T[K], `${P}${K}.`>;
}[keyof T & string];

type PluralPaths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends PluralForms
    ? `${P}${K}`
    : T[K] extends string
      ? never
      : PluralPaths<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Every dictionary key as a dotted path: `'common.actions.search'`. */
export type TKey = LeafPaths<Dictionary>;
/** Keys that hold plural forms, read with `t.count`: `'search.resultsCount'`. */
export type PluralKey = PluralPaths<Dictionary>;
/** Values for `{placeholders}`. */
export type TVars = Record<string, string | number>;

/** The `t` function returned by `getT(lang)` and `useT()`. */
export interface Translator {
  /** Look a key up and fill its placeholders: `t('freshness.updated', { time: '14:05' })`. */
  (key: TKey, vars?: TVars): string;
  /** Plural-aware lookup; `{count}` is filled for you: `t.count('search.resultsCount', 3)`. */
  count(key: PluralKey, count: number, vars?: TVars): string;
  /** The language this translator speaks. */
  readonly lang: Lang;
}

/** Replace `{name}` placeholders. Unknown placeholders are left as written. */
export function interpolate(template: string, vars?: TVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** Which plural form a count takes. Malay has no grammatical plural, so it is always `other`. */
export function pluralForm(lang: Lang, count: number): keyof PluralForms {
  return lang === 'en' && count === 1 ? 'one' : 'other';
}

/** Pick the right form for a count: `plural('en', 2, { one: 'bag', other: 'bags' })`. */
export function plural(lang: Lang, count: number, forms: PluralForms): string {
  return forms[pluralForm(lang, count)];
}

function lookup(dictionary: Dictionary, key: string): unknown {
  let node: unknown = dictionary;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

/**
 * Build a translator over a dictionary. A key that is somehow missing at runtime returns the
 * key itself, so the gap is visible instead of crashing the page.
 */
export function createTranslator(lang: Lang, dictionary: Dictionary): Translator {
  const translate = (key: TKey, vars?: TVars): string => {
    const value = lookup(dictionary, key);
    return typeof value === 'string' ? interpolate(value, vars) : key;
  };
  const count = (key: PluralKey, amount: number, vars?: TVars): string => {
    const value = lookup(dictionary, key);
    if (typeof value !== 'object' || value === null) return key;
    const form = (value as PluralForms)[pluralForm(lang, amount)];
    const shown = new Intl.NumberFormat(lang === 'ms' ? 'ms-MY' : 'en-MY').format(amount);
    return typeof form === 'string' ? interpolate(form, { count: shown, ...vars }) : key;
  };
  return Object.assign(translate, { count, lang });
}
