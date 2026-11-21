/**
 * Formatting helpers for money, durations, distances, numbers and lists, in English and
 * Bahasa Malaysia. All pure.
 */
import type { Lang, Money } from '@/content/types';
import { intlLocale } from './time';

/** Number formatters made once per locale and options (round 2: each one costs a few ms on a phone). */
const NUMBER_FORMATS = new Map<string, Intl.NumberFormat>();
function numberFormat(lang: Lang, minimumFractionDigits: number, maximumFractionDigits: number): Intl.NumberFormat {
  const key = `${lang}|${minimumFractionDigits}|${maximumFractionDigits}`;
  let format = NUMBER_FORMATS.get(key);
  if (!format) {
    format = new Intl.NumberFormat(intlLocale(lang), { minimumFractionDigits, maximumFractionDigits });
    NUMBER_FORMATS.set(key, format);
  }
  return format;
}
const LIST_FORMATS = new Map<string, Intl.ListFormat>();

/**
 * Malaysian ringgit: `RM 12.50`. Whole amounts drop the sen (`RM 12`) unless `alwaysShowSen`.
 */
export function formatCurrency(amount: number | Money, lang: Lang = 'en', options: { alwaysShowSen?: boolean } = {}): string {
  const value = typeof amount === 'number' ? amount : amount.amount;
  const whole = Number.isInteger(value) && !options.alwaysShowSen;
  const formatted = numberFormat(lang, whole ? 0 : 2, whole ? 0 : 2).format(value);
  return `RM ${formatted}`;
}

/** Whole number with grouping: `5,700`. */
export function formatNumber(value: number, lang: Lang = 'en'): string {
  return numberFormat(lang, 0, 0).format(value);
}

/**
 * A duration given in minutes: `45 min`, `1 h`, `1 h 25 min`, `2 days 3 h`
 * (`1 j 25 min`, `2 hari 3 j` in Malay). Rounds to whole minutes.
 */
export function formatDuration(minutes: number, lang: Lang = 'en'): string {
  const total = Math.max(0, Math.round(minutes));
  const hourUnit = lang === 'ms' ? 'j' : 'h';
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const rest = total % 60;
  if (days > 0) {
    const dayUnit = lang === 'ms' ? 'hari' : days === 1 ? 'day' : 'days';
    return hours > 0 ? `${days} ${dayUnit} ${hours} ${hourUnit}` : `${days} ${dayUnit}`;
  }
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} ${hourUnit}` : `${hours} ${hourUnit} ${rest} min`;
}

/** A distance given in metres: `350 m`, `1.2 km`. Below 1 km it rounds to the nearest 10 m. */
export function formatDistance(metres: number, lang: Lang = 'en'): string {
  if (metres < 1000) {
    const rounded = metres < 10 ? Math.round(metres) : Math.round(metres / 10) * 10;
    return `${formatNumber(rounded, lang)} m`;
  }
  const km = numberFormat(lang, 0, 1).format(metres / 1000);
  return `${km} km`;
}

/** A list in words: `A, B and C` (`A, B dan C`). Use `disjunction` for "or". */
export function formatList(items: readonly string[], lang: Lang = 'en', type: 'conjunction' | 'disjunction' = 'conjunction'): string {
  const key = `${lang}|${type}`;
  let format = LIST_FORMATS.get(key);
  if (!format) {
    format = new Intl.ListFormat(lang === 'ms' ? 'ms' : 'en-GB', { style: 'long', type });
    LIST_FORMATS.set(key, format);
  }
  return format.format(items);
}

/** Bay counts and similar published figures with their qualifier: `over 5,700`, `about 300`. */
export function formatQualifiedNumber(value: number, qualifier: 'exact' | 'over' | 'about' | undefined, lang: Lang = 'en'): string {
  const number = formatNumber(value, lang);
  if (qualifier === 'over') return lang === 'ms' ? `lebih ${number}` : `over ${number}`;
  if (qualifier === 'about') return lang === 'ms' ? `kira-kira ${number}` : `about ${number}`;
  return number;
}
