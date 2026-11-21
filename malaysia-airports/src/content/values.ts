/**
 * Runtime values of the content model that do not need zod: the language list and `pick`, the
 * provenance and source rules, enum lists and their labels (round 2, E-03).
 *
 * Client Components import these from here (or from `@/content/airports`), never from
 * `./types`: that module builds the zod schemas at load time, which put zod and every schema
 * (35 KB gzip) in the JavaScript of every page. `./types` re-exports everything below, so server
 * code can keep importing from `@/content` or `@/content/types`. Types come from `./types`
 * (type-only imports are erased from the bundle).
 */
import type { FacilityCategory, Lang, LocalizedText, MapPoiKind, Source, SourceKind, TransportMode } from './types';

/** Supported interface languages: English and Bahasa Malaysia. */
export const LANGS = ['en', 'ms'] as const;

/** Language used when nothing else is known. */
export const DEFAULT_LANG: Lang = 'en';

/** Type guard for route params and stored values. */
export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

/**
 * Read a localised text in the requested language, falling back to English.
 * Use `hasTranslation` to decide whether to show the `TranslationNotice`.
 */
export function pick(text: LocalizedText, lang: Lang): string {
  return lang === 'ms' && text.ms ? text.ms : text.en;
}

/** True when `text` exists in `lang` without falling back (English always counts). */
export function hasTranslation(text: LocalizedText | undefined, lang: Lang): boolean {
  if (!text) return true;
  return lang === 'en' || Boolean(text.ms);
}

/** Small constructor for localised text: `lt('Prayer room', 'Surau')`. */
export function lt(en: string, ms?: string): LocalizedText {
  return ms ? { en, ms } : { en };
}

export const PROVENANCES = ['official', 'estimated', 'suggestion', 'demo'] as const;

export const SOURCE_KINDS = ['official', 'government', 'operator', 'news', 'aggregator', 'other'] as const;

/** Source kinds that can back an `official` tag. */
export const AUTHORITATIVE_SOURCE_KINDS: readonly SourceKind[] = ['official', 'government', 'operator'];

/** Social networks: posts there never back an `official` tag. */
export const SOCIAL_HOSTS: readonly string[] = ['x.com', 'twitter.com', 'threads.com', 'threads.net', 'tiktok.com', 'facebook.com', 'instagram.com'];

/** Third-party hosts that relay or advertise other organisations' statements. Never `official`, `government` or `operator`. */
export const RELAY_HOSTS: readonly string[] = ['routesonline.com', 'theedgemalaysia.com', 'marketscreener.com'];

/** Host name of a source URL, without `www.`; empty for internal paths. */
export function sourceHost(source: Pick<Source, 'url'>): string {
  if (source.url.startsWith('/')) return '';
  try {
    return new URL(source.url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** True when `host` is one of `list` or a subdomain of one (used by `validateContent`). */
export function onHost(host: string, list: readonly string[]): boolean {
  return list.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

/** True for a post on a social network. */
export function isSocialSource(source: Pick<Source, 'url'>): boolean {
  return onHost(sourceHost(source), SOCIAL_HOSTS);
}

/**
 * True when a source can back an `official` tag: an authoritative kind, a public URL (not this
 * prototype's own pages) and not a social post.
 */
export function isAuthoritativeSource(source: Pick<Source, 'kind' | 'url'>): boolean {
  return AUTHORITATIVE_SOURCE_KINDS.includes(source.kind) && sourceHost(source) !== '' && !isSocialSource(source);
}

/** Source title in the reader's language: our own pages are translated, everyone else's stay as published. */
export function sourceTitle(source: Source, lang: Lang): string {
  return source.localTitle ? pick(source.localTitle, lang) : source.title;
}

/** Publisher in the reader's language (translated only for this prototype's own pages). */
export function sourcePublisher(source: Source, lang: Lang): string {
  return source.localPublisher ? pick(source.localPublisher, lang) : source.publisher;
}

/** True when the title is shown as published in English on a page in another language (mark it `lang="en"`). */
export function sourceTitleIsForeign(source: Source, lang: Lang): boolean {
  return lang !== 'en' && !(source.localTitle && hasTranslation(source.localTitle, lang));
}

/** True when the publisher name is shown in English on a page in another language. */
export function sourcePublisherIsForeign(source: Source, lang: Lang): boolean {
  return lang !== 'en' && !(source.localPublisher && hasTranslation(source.localPublisher, lang));
}

/*
 * Made on first use and kept (round 2, E-01): this module loads on every page, and building the
 * four formatters while it loaded was the largest app-code cost of start-up (about 48 ms at 4x
 * CPU, mostly the Malay locale data).
 */
const AS_OF_FORMATS = new Map<string, Intl.DateTimeFormat>();
function asOfFormat(kind: 'day' | 'month', lang: Lang): Intl.DateTimeFormat {
  const key = `${kind}|${lang}`;
  let format = AS_OF_FORMATS.get(key);
  if (!format) {
    const options: Intl.DateTimeFormatOptions = kind === 'day' ? { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' };
    format = new Intl.DateTimeFormat(lang === 'ms' ? 'ms-MY' : 'en-GB', options);
    AS_OF_FORMATS.set(key, format);
  }
  return format;
}

/**
 * An `asOf` value in words, without reading the clock: `16 Nov 2026`, `November 2026`, `2025`.
 * Anything that is not a valid `AsOfSchema` value is returned unchanged.
 */
export function formatAsOf(value: string, lang: Lang): string {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (day) return asOfFormat('day', lang).format(new Date(Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]))));
  const month = /^(\d{4})-(\d{2})$/.exec(value);
  if (month) return asOfFormat('month', lang).format(new Date(Date.UTC(Number(month[1]), Number(month[2]) - 1, 1)));
  return value;
}

/** Earliest day an `asOf` value can mean (`2026-08` is `2026-08-01`), for staleness checks. */
export function asOfStartDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  if (/^\d{4}$/.test(value)) return `${value}-01-01`;
  return undefined;
}

/** Shown in place of an as-of date when a source states none. */
export const UNDATED_LABEL: LocalizedText = { en: 'Undated', ms: 'Tiada tarikh' };

export const TERMINAL_IDS = ['T1', 'T2', 'MAIN'] as const;

export const AIRPORT_CLASSIFICATIONS = ['international', 'domestic', 'stolport'] as const;

export const AIRPORT_DEPTHS = ['full', 'essential', 'listing'] as const;

export const AIRPORT_REGIONS = ['peninsular', 'sabah', 'sarawak', 'labuan'] as const;

export const FACILITY_CATEGORIES = [
  'prayer-room',
  'nursing-room',
  'toilet',
  'accessible-toilet',
  'lounge',
  'hotel',
  'clinic',
  'pharmacy',
  'baggage',
  'wifi',
  'atm',
  'money-changer',
  'sim',
  'information',
  'lost-property',
  'play-area',
  'smoking',
  'shower',
  'rest',
  'charging',
  'water',
  'porter',
  'assistance',
  'calm-room',
  'viewing',
  'other',
] as const;

/**
 * Human labels for facility categories in both languages, plus a semantic icon key.
 * The icon key is a hint for `src/components/ui/icon.tsx` to map; it is not a guaranteed
 * lucide name.
 */
export const FACILITY_CATEGORY_META: Record<FacilityCategory, { label: LocalizedText; icon: string }> = {
  'prayer-room': { label: lt('Prayer room (surau)', 'Surau'), icon: 'prayer' },
  'nursing-room': { label: lt('Nursing and baby care room', 'Bilik penjagaan bayi'), icon: 'baby' },
  toilet: { label: lt('Toilets', 'Tandas'), icon: 'toilet' },
  'accessible-toilet': { label: lt('Accessible toilet', 'Tandas OKU'), icon: 'accessible' },
  lounge: { label: lt('Lounge', 'Lounge'), icon: 'lounge' },
  hotel: { label: lt('Hotel', 'Hotel'), icon: 'hotel' },
  clinic: { label: lt('Clinic and medical help', 'Klinik dan bantuan perubatan'), icon: 'medical' },
  pharmacy: { label: lt('Pharmacy', 'Farmasi'), icon: 'pharmacy' },
  baggage: { label: lt('Baggage services', 'Perkhidmatan bagasi'), icon: 'baggage' },
  wifi: { label: lt('Wi-Fi', 'Wi-Fi'), icon: 'wifi' },
  atm: { label: lt('ATM', 'ATM'), icon: 'atm' },
  'money-changer': { label: lt('Money changer', 'Pengurup wang'), icon: 'currency' },
  sim: { label: lt('SIM cards and mobile', 'Kad SIM dan telekomunikasi'), icon: 'sim' },
  information: { label: lt('Information counter', 'Kaunter pertanyaan'), icon: 'info' },
  'lost-property': { label: lt('Lost and found', 'Barang hilang dan dijumpai'), icon: 'lost' },
  'play-area': { label: lt("Children's play area", 'Ruang permainan kanak-kanak'), icon: 'play' },
  smoking: { label: lt('Smoking room', 'Bilik merokok'), icon: 'smoking' },
  shower: { label: lt('Showers', 'Bilik mandi'), icon: 'shower' },
  rest: { label: lt('Rest area', 'Ruang rehat'), icon: 'rest' },
  charging: { label: lt('Charging point', 'Tempat mengecas peranti'), icon: 'charging' },
  water: { label: lt('Drinking water', 'Air minuman'), icon: 'water' },
  porter: { label: lt('Porter service', 'Perkhidmatan porter'), icon: 'porter' },
  assistance: { label: lt('Assistance', 'Bantuan khas'), icon: 'assistance' },
  'calm-room': { label: lt('Calm room', 'Bilik tenang'), icon: 'calm' },
  viewing: { label: lt('Viewing gallery', 'Galeri tinjau'), icon: 'viewing' },
  other: { label: lt('Other', 'Lain-lain'), icon: 'other' },
};

/** Label for a facility category in the given language. */
export function facilityCategoryLabel(category: FacilityCategory, lang: Lang): string {
  return pick(FACILITY_CATEGORY_META[category].label, lang);
}

export const ZONES = ['landside', 'airside', 'both', 'unknown'] as const;

export const TRANSPORT_MODES = [
  'rail',
  'bus',
  'taxi',
  'e-hailing',
  'car-rental',
  'private-car',
  'shuttle',
  'inter-terminal',
] as const;

/** Labels for transport modes in both languages. */
export const TRANSPORT_MODE_LABELS: Record<TransportMode, LocalizedText> = {
  rail: lt('Train', 'Kereta api'),
  bus: lt('Bus and coach', 'Bas'),
  taxi: lt('Taxi', 'Teksi'),
  'e-hailing': lt('E-hailing', 'E-hailing'),
  'car-rental': lt('Car rental', 'Kereta sewa'),
  'private-car': lt('Private car', 'Kenderaan sendiri'),
  shuttle: lt('Shuttle', 'Bas ulang-alik'),
  'inter-terminal': lt('Between terminals', 'Antara terminal'),
};

export const CAR_PARK_TYPES = ['terminal', 'long-term', 'preferred', 'valet', 'motorcycle', 'other'] as const;

export const AUDIENCES = [
  'departing',
  'arriving',
  'transiting',
  'meeting',
  'family',
  'first-time',
  'accessibility',
  'all',
] as const;

export const GUIDE_NOTE_TOPICS = [
  'terminal',
  'arrival-time',
  'getting-there',
  'check-in',
  'security',
  'immigration',
  'gate',
  'boarding',
  'landing',
  'baggage',
  'customs',
  'onward-transport',
  'meeting',
  'transit',
  'assistance',
  /** Parking advice: shown on the parking page only, never in a journey step (D-05). */
  'parking',
  /** What the prototype has not verified for an airport: one place per airport, never a journey step (D-05). */
  'coverage',
] as const;
/** Topics that no journey timeline or guide step reads. */
export const NON_JOURNEY_NOTE_TOPICS = ['parking', 'coverage'] as const;

/**
 * Areas a `coverage` note can say are not published. Each maps to records a test can count
 * (`coverageConflicts`): a facility category, or one of the collection-level areas below.
 */
export const COVERAGE_AREAS = [
  'outlets',
  'outlet-hours',
  'facilities',
  'transport',
  'car-parks',
  'parking-rates',
  'airlines',
  'maps',
  ...FACILITY_CATEGORIES,
] as const;

export const NOTICE_SEVERITIES = ['info', 'advisory', 'warning', 'critical'] as const;

export const CORPORATE_SECTIONS = [
  'about',
  'leadership',
  'network',
  'business',
  'procurement',
  'sustainability',
  'careers',
  'news',
  'governance',
  'contact',
  'investors',
] as const;

/** Every map is drawn in this coordinate space (SVG `viewBox="0 0 1000 600"`). */
export const MAP_VIEWBOX = { width: 1000, height: 600 } as const;

export const MAP_POI_KINDS = [
  ...FACILITY_CATEGORIES,
  'gate',
  'check-in',
  'security',
  'immigration',
  'customs',
  'baggage-reclaim',
  'entrance',
  'meeting-point',
  'lift',
  'train',
  'bus',
  'taxi',
  'parking',
  'shuttle',
  'dine',
  'shop',
] as const;

/** Labels for the map-only point kinds (facility kinds use `FACILITY_CATEGORY_META`). */
export const MAP_POI_KIND_LABELS: Record<Exclude<MapPoiKind, FacilityCategory>, LocalizedText> = {
  gate: lt('Gates', 'Pintu berlepas'),
  'check-in': lt('Check-in', 'Daftar masuk'),
  security: lt('Security screening', 'Pemeriksaan keselamatan'),
  immigration: lt('Immigration', 'Imigresen'),
  customs: lt('Customs', 'Kastam'),
  'baggage-reclaim': lt('Baggage reclaim', 'Tuntutan bagasi'),
  entrance: lt('Entrance', 'Pintu masuk'),
  'meeting-point': lt('Meeting point', 'Tempat menunggu'),
  lift: lt('Lift', 'Lif'),
  train: lt('Train', 'Tren'),
  bus: lt('Bus', 'Bas'),
  taxi: lt('Taxi', 'Teksi'),
  parking: lt('Parking', 'Tempat letak kereta'),
  shuttle: lt('Shuttle', 'Bas ulang-alik'),
  dine: lt('Food and drink', 'Makanan dan minuman'),
  shop: lt('Shops', 'Kedai'),
};

/** Label for any map point kind in the given language. */
export function mapPoiKindLabel(kind: MapPoiKind, lang: Lang): string {
  if (kind in FACILITY_CATEGORY_META) {
    return pick(FACILITY_CATEGORY_META[kind as FacilityCategory].label, lang);
  }
  return pick(MAP_POI_KIND_LABELS[kind as Exclude<MapPoiKind, FacilityCategory>], lang);
}
