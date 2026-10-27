// Localisation core. Every user-facing string is looked up by key; dictionaries live in
// ./locales/<lang>/<namespace>.ts. The Malay dictionaries are typed against the English
// ones, so a missing translation is a compile error rather than a silent gap.
import { create } from 'zustand';
import { DICTS } from './locales';

export type Lang = 'en' | 'ms';
export const LANGS: { id: Lang; label: string; bcp47: string }[] = [
  { id: 'en', label: 'English', bcp47: 'en-MY' },
  { id: 'ms', label: 'Bahasa Melayu', bcp47: 'ms-MY' },
];

export type Params = Record<string, string | number | undefined>;

/** Reactive language holder (UI subscribes through useT / useLang). */
export const useLang = create<{ lang: Lang }>(() => ({ lang: 'en' }));

export const getLang = (): Lang => useLang.getState().lang;
export const bcp47 = (lang: Lang = getLang()) => LANGS.find((l) => l.id === lang)!.bcp47;

const missing = new Set<string>();

/** Map any locale string ("ms-MY", "en", "ms") onto a supported language. */
export function toLang(locale: string | undefined | null): Lang {
  const l = (locale ?? '').toLowerCase();
  return l.startsWith('ms') ? 'ms' : 'en';
}

export function setLang(lang: Lang) {
  if (useLang.getState().lang === lang) return;
  useLang.setState({ lang });
  if (typeof document !== 'undefined') document.documentElement.lang = bcp47(lang);
}

export function hasKey(key: string, lang: Lang = getLang()) {
  return key in DICTS[lang] || key in DICTS.en;
}

/**
 * Translate a key. Plurals: when params.n is a number and `key.one` / `key.other`
 * exist, the right form is picked. Placeholders use {name}.
 */
export function t(key: string, params?: Params, lang: Lang = getLang()): string {
  let k = key;
  if (params && typeof params.n === 'number') {
    const form = `${key}.${params.n === 1 ? 'one' : 'other'}`;
    if (form in DICTS[lang] || form in DICTS.en) k = form;
  }
  const raw = DICTS[lang][k] ?? DICTS.en[k];
  if (raw === undefined) {
    if (!missing.has(k)) {
      missing.add(k);
      if (import.meta.env?.DEV) console.warn(`[i18n] missing key: ${k}`);
    }
    return key;
  }
  return params ? interpolate(raw, params) : raw;
}

export function interpolate(s: string, params: Params) {
  return s.replace(/\{(\w+)\}/g, (m, name: string) => {
    const v = params[name];
    return v === undefined ? m : typeof v === 'number' ? fmtNum(v) : v;
  });
}

const nf = new Map<string, Intl.NumberFormat>();
/** Compact, locale-aware number (1.2k style above 10 000). */
export function fmtNum(n: number, lang: Lang = getLang()) {
  const tag = bcp47(lang);
  const compact = Math.abs(n) >= 10_000;
  const k = `${tag}:${compact}`;
  let f = nf.get(k);
  if (!f) {
    f = new Intl.NumberFormat(tag, compact ? { notation: 'compact', maximumFractionDigits: 1 } : { maximumFractionDigits: 0 });
    nf.set(k, f);
  }
  return f.format(n);
}

/** Durations like "2m 5s" / "1j 3m" from milliseconds. */
export function fmtDuration(ms: number, lang: Lang = getLang()) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const u = (k: string) => t(`common.unit.${k}`, undefined, lang);
  if (h) return `${h}${u('h')} ${m}${u('m')}`;
  if (m) return `${m}${u('m')} ${sec}${u('s')}`;
  return `${sec}${u('s')}`;
}

/** Keys referenced but not found (for the Studio i18n report). */
export const missingKeys = () => [...missing];

/** React hook: re-renders on language change and returns the translator. */
export function useT() {
  useLang((s) => s.lang);
  return t;
}
