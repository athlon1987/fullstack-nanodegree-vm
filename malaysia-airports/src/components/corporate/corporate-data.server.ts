/**
 * SERVER ONLY. Turns the corporate content into small, serialisable views for the corporate,
 * transparency, privacy and terms pages: resolved sources, provenance, formatted dates and the
 * merged media centre. Never import this from a Client Component (it reads `@/content`).
 */
import {
  CORPORATE_SOURCES,
  MEDIA_ITEMS,
  NEWS_ITEMS,
  getSource,
  isAuthoritativeSource,
  pick,
  type CorporateFact,
  type CorporateMediaItem,
  type Lang,
  type LocalizedText,
  type NewsItem,
  type Provenance,
  type Source,
} from '@/content';
import type { Translator } from '@/lib/i18n';
import { formatDate } from '@/lib/time';

const CORPORATE_SOURCE_MAP: ReadonlyMap<string, Source> = new Map(CORPORATE_SOURCES.map((item) => [item.id, item]));

/** Resolve source ids against the corporate sources first, then the core registry. Unknown ids are dropped. */
export function resolveCorporateSources(ids: readonly string[] | undefined): Source[] {
  return (ids ?? []).map((id) => CORPORATE_SOURCE_MAP.get(id) ?? getSource(id)).filter((item): item is Source => item !== undefined);
}

/** Ids that resolve nowhere: used by the content test. */
export function unknownCorporateSourceIds(ids: readonly string[]): string[] {
  return ids.filter((id) => !CORPORATE_SOURCE_MAP.has(id) && getSource(id) === undefined);
}

/**
 * The guidance label a fact earns from its sources: `official` when Malaysia Airports, a
 * government body or the operator of a programme says it; `estimated` when only the press or a
 * third party reports it (the house rule in `src/content/sources.ts`).
 */
export function provenanceOf(sources: readonly Source[]): Provenance {
  // Same rule as validateContent (D-01): relays, social posts and our own pages never make it official.
  return sources.some(isAuthoritativeSource) ? 'official' : 'estimated';
}

const MONTH_YEAR: Record<Lang, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  ms: new Intl.DateTimeFormat('ms-MY', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
};

/** `2026-01-20` → `20 January 2026`; `2026-05` → `May 2026`; `2020` → `2020`; anything else as written. */
export function formatPartialDate(value: string, lang: Lang, style: 'long' | 'medium' = 'long'): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDate(value, lang, style);
  const month = /^(\d{4})-(\d{2})$/.exec(value);
  if (month) return MONTH_YEAR[lang].format(new Date(Date.UTC(Number(month[1]), Number(month[2]) - 1, 1)));
  return value;
}

/** A period such as `2025`, `2026-09` or `2026-01/2026-09`, in words. */
export function formatPeriod(period: string, lang: Lang, t: Translator): string {
  const [from, to] = period.split('/');
  if (to) {
    const sameYear = from.slice(0, 4) === to.slice(0, 4);
    const fromText = sameYear ? formatPartialDate(from, lang).replace(/\s*\d{4}$/, '') : formatPartialDate(from, lang);
    return t('corporatePages.media.periodRange', { from: fromText, to: formatPartialDate(to, lang) });
  }
  return formatPartialDate(from, lang);
}

/** `104.4` → `104.4 million`, with "about" or "over" when the source qualifies it. */
export function formatMillions(millions: number, lang: Lang, t: Translator, qualifier?: 'about' | 'over'): string {
  const number = new Intl.NumberFormat(lang === 'ms' ? 'ms-MY' : 'en-GB', { maximumFractionDigits: 1 }).format(millions);
  const value = t('corporatePages.common.millions', { value: number });
  return qualifier ? t(`corporatePages.common.${qualifier}`, { value }) : value;
}

/** `-2.4` → `−2.4%`, `11.2` → `+11.2%`. */
export function formatChange(pct: number, lang: Lang): string {
  const number = new Intl.NumberFormat(lang === 'ms' ? 'ms-MY' : 'en-GB', { maximumFractionDigits: 1 }).format(Math.abs(pct));
  return `${pct < 0 ? '−' : '+'}${number}%`;
}

export interface FactView {
  id: string;
  label: string;
  value: string;
  note?: string;
  asOf: string;
  provenance: Provenance;
  sources: Source[];
}

export function toFactView(fact: CorporateFact, lang: Lang): FactView {
  const sources = resolveCorporateSources(fact.sources);
  return {
    id: fact.id,
    label: pick(fact.label, lang),
    value: pick(fact.value, lang),
    note: fact.note ? pick(fact.note, lang) : undefined,
    asOf: formatPartialDate(fact.asOf, lang),
    provenance: provenanceOf(sources),
    sources,
  };
}

export const factViews = (facts: readonly CorporateFact[], lang: Lang): FactView[] => facts.map((fact) => toFactView(fact, lang));

/* ---- Media centre ------------------------------------------------------------------------- */

export interface MediaView {
  slug: string;
  kind: CorporateMediaItem['kind'];
  topic: CorporateMediaItem['topic'] | 'network';
  date: string;
  dateLabel: string;
  title: string;
  summary: string;
  airports: string[];
  provenance: Provenance;
  sources: Source[];
}

/** Topic of the items authored in `NEWS_ITEMS` (domain seed), which carry no topic. */
const NEWS_ITEM_TOPIC: Record<string, MediaView['topic']> = {
  'klia-aerotrain-24-hour-service-resumes': 'projects',
  'kota-bharu-expanded-terminal-full-operation': 'network',
};

type AnyMedia = (CorporateMediaItem & { source: 'media' }) | (NewsItem & { source: 'news' });

function allMedia(): AnyMedia[] {
  return [
    ...MEDIA_ITEMS.map((item) => ({ ...item, source: 'media' as const })),
    ...NEWS_ITEMS.map((item) => ({ ...item, source: 'news' as const })),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

function toMediaView(item: AnyMedia, lang: Lang): MediaView {
  const sources = resolveCorporateSources(item.sources);
  const text = (value: LocalizedText) => pick(value, lang);
  return {
    slug: item.slug,
    kind: item.source === 'media' ? item.kind : sources.some((s) => s.kind === 'official') ? 'release' : 'coverage',
    topic: item.source === 'media' ? item.topic : (NEWS_ITEM_TOPIC[item.slug] ?? 'company'),
    date: item.date,
    dateLabel: formatPartialDate(item.date, lang),
    title: text(item.title),
    summary: text(item.summary),
    airports: item.airports ?? [],
    provenance: provenanceOf(sources),
    sources,
  };
}

/** Every media centre item, newest first. */
export function mediaViews(lang: Lang, limit?: number): MediaView[] {
  const items = allMedia().map((item) => toMediaView(item, lang));
  return limit === undefined ? items : items.slice(0, limit);
}

export function mediaSlugs(): string[] {
  return allMedia().map((item) => item.slug);
}

export function mediaView(slug: string, lang: Lang): MediaView | undefined {
  const item = allMedia().find((entry) => entry.slug === slug);
  return item ? toMediaView(item, lang) : undefined;
}

/** True when the English text is all we have for this language. */
export function needsTranslationNotice(texts: readonly (LocalizedText | undefined)[], lang: Lang): boolean {
  return lang === 'ms' && texts.some((text) => text !== undefined && !text.ms);
}
