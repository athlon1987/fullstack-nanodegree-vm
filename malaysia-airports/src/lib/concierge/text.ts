/**
 * Small text helpers for the concierge engine: normalising questions, picking a language from
 * bilingual content, filling phrase templates and tokenising for passage scoring.
 */
import type { FacilityCategory, Lang, LocalizedText } from '@/content/types';
import { conciergePageEn, conciergePageMs } from '@/lib/i18n/features/concierge';

/** Lower case, accents removed, anything that is not a letter or digit becomes one space. */
export function normalise(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** True when `phrase` (already normalised) occurs in `text` (already normalised) as whole words. */
export function hasPhrase(text: string, phrase: string): boolean {
  if (!phrase) return false;
  return ` ${text} `.includes(` ${phrase} `);
}

/** Bilingual content in the asked language, falling back to English. */
export function pickText(text: LocalizedText | undefined, lang: Lang): string {
  if (!text) return '';
  return (lang === 'ms' ? text.ms : undefined) ?? text.en;
}

/** True when Malay was asked for and this text has no Malay version. */
export function fellBack(text: LocalizedText | undefined, lang: Lang): boolean {
  return lang === 'ms' && text !== undefined && !text.ms;
}

export type EnginePhrase = keyof typeof conciergePageEn.engine;

/** An engine template in the asked language, with `{name}` placeholders filled. */
export function phrase(lang: Lang, key: EnginePhrase, vars: Record<string, string | number> = {}): string {
  const template = (lang === 'ms' ? conciergePageMs : conciergePageEn).engine[key] ?? conciergePageEn.engine[key] ?? '';
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/**
 * What is missing when a facility category has no record, as a phrase written for the category
 * (round 4, 6.1.4): "where the accessible toilets are", "Lokasi tandas OKU".
 */
export function missingFacility(lang: Lang, category: FacilityCategory): string {
  return (lang === 'ms' ? conciergePageMs : conciergePageEn).facilityMissing[category] ?? conciergePageEn.facilityMissing[category];
}

/** "A, B and C" in the asked language. */
export function list(items: readonly string[], lang: Lang, type: 'conjunction' | 'disjunction' = 'conjunction'): string {
  const unique = [...new Set(items.filter(Boolean))];
  try {
    return new Intl.ListFormat(lang === 'ms' ? 'ms-MY' : 'en-GB', { style: 'long', type }).format(unique);
  } catch {
    return unique.join(', ');
  }
}

const STOPWORDS = new Set(
  (
    'a an the and or but if of to in on at by for from with about into over under is are was were be been am do does did ' +
    'i me my mine we our you your it its this that these those there here what which who whom whose where when why how ' +
    'can could should would will shall may might must need want please tell know any some get got go going have has had ' +
    'not no yes up out as so than then too very just also near nearest one ' +
    'saya anda kami kita ia dia ini itu yang di ke dari dan atau untuk dengan pada apa siapa mana bagaimana bila berapa ' +
    'boleh perlu mahu hendak ada adakah tidak bukan juga sahaja lagi sudah akan sila tolong'
  ).split(' '),
);

/** Very light stemming so "gates" meets "gate" and "delayed" meets "delay". */
function stem(token: string): string {
  if (token.length > 5 && token.endsWith('ing')) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith('ed')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('es') && !token.endsWith('ses')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

/** Meaningful tokens of a text, stemmed, without stopwords. */
export function tokens(value: string): string[] {
  return normalise(value)
    .split(' ')
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
    .map(stem);
}

/** Read a duration in minutes, or undefined. */
export function minutesLabel(minutes: number, lang: Lang): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const h = lang === 'ms' ? 'jam' : hours === 1 ? 'hour' : 'hours';
  const m = lang === 'ms' ? 'minit' : 'min';
  if (hours === 0) return `${rest} ${m}`;
  if (rest === 0) return `${hours} ${h}`;
  return `${hours} ${h} ${rest} ${m}`;
}
