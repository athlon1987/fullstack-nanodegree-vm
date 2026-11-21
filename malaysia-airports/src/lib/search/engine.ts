/**
 * Site search engine: a MiniSearch index over `SearchDocument`s with prefix and fuzzy matching,
 * a boosted title, per-type weights and synonym expansion for common airport intents.
 *
 * This file imports no content, so Client Components can use it: build the documents on the
 * server with `buildSearchDocuments(lang)` (`@/lib/search/documents`), pass them down (or fetch
 * them), then call `createSearchIndex(docs)` in the browser on demand. Building the index for a
 * few hundred documents takes a few milliseconds.
 */
import MiniSearch from 'minisearch';
import { parseFlightQuery } from '@/lib/flights/query';

/** Kinds of things the site search can find. Flights are looked up live, not indexed. */
export const SEARCH_DOC_TYPES = ['airport', 'facility', 'outlet', 'transport', 'parking', 'guide', 'faq', 'notice', 'corporate', 'place', 'airline', 'unpublished'] as const;
export type SearchDocType = (typeof SEARCH_DOC_TYPES)[number];

/** One searchable item. */
export interface SearchDocument {
  /** Unique across types: `facility:kul-t1-calm-room`. */
  id: string;
  type: SearchDocType;
  title: string;
  summary: string;
  /** Link target WITHOUT the locale prefix: `/kul/facilities#kul-t1-calm-room`. Use `localeHref`. */
  href: string;
  /** Airport slug, for items that belong to one airport. */
  airport?: string;
  /** Extra words to match on: codes, categories in both languages, operators. */
  keywords: string[];
  /**
   * Relevance multiplier for this document on every query (default 1), set where the documents
   * are built (round 4, A-12): news below tasks, an airport's parking page above its car parks,
   * premium parking below long-stay parking.
   */
  rank?: number;
  /** Apply `rank` only when the query (with its synonyms) has one of these words. Default: always. */
  rankWhen?: string[];
}

/** A search hit: the document plus its relevance score. */
export interface SearchHit extends SearchDocument {
  score: number;
}

/** Hits of one type. */
export interface SearchGroup {
  type: SearchDocType;
  /** Number of hits of this type before `limit` was applied. */
  total: number;
  hits: SearchHit[];
}

/** Result of `searchAll`. */
export interface SearchResults {
  query: string;
  /** Total hits across all types, before `limit`. */
  total: number;
  /** Groups in order of their best hit; empty groups are left out. */
  groups: SearchGroup[];
}

/** Options for `searchAll`. */
export interface SearchOptions {
  /** Prefer and filter to this airport: its items and network-wide items are kept. */
  airport?: string;
  /** Maximum hits per group. Default 5. */
  limit?: number;
  /** Only these types. */
  types?: readonly SearchDocType[];
}

/**
 * Synonym groups for common airport intents, in English and Malay. When a query contains any
 * member of a group, the single-word members are added to the query, so "musolla" finds the
 * prayer room and "washroom" finds the toilets.
 */
export const SEARCH_SYNONYMS: readonly (readonly string[])[] = [
  ['surau', 'prayer room', 'prayer', 'pray', 'musolla', 'musalla', 'solat'],
  ['toilet', 'toilets', 'washroom', 'restroom', 'bathroom', 'tandas', 'wc'],
  ['wifi', 'wi-fi', 'internet', 'wireless'],
  ['sim', 'sim card', 'esim', 'telco', 'prepaid', 'kad sim', 'mobile data'],
  ['money changer', 'currency exchange', 'forex', 'pengurup wang', 'pengurup', 'currency', 'exchange', 'tukar wang', 'tukaran wang', 'penukaran wang', 'changer'],
  ['atm', 'cash machine', 'cash'],
  ['baby', 'nursing', 'nursing room', 'baby care', 'breastfeeding', 'bayi', 'diaper'],
  ['wheelchair', 'prm', 'oku', 'reduced mobility', 'disabled', 'disability', 'assistance', 'accessible', 'kerusi roda', 'buggy', 'buggies', 'mobility cart'],
  ['hidden disability', 'autism', 'sensory', 'calm', 'butterfly'],
  ['taxi', 'teksi', 'cab'],
  ['grab', 'e-hailing', 'ehailing', 'ride hailing'],
  ['train', 'rail', 'erl', 'klia ekspres', 'ekspres', 'klia transit', 'tren', 'kereta api'],
  ['bus', 'coach', 'bas'],
  ['parking', 'car park', 'parkir', 'tempat letak kereta', 'park'],
  ['luggage', 'baggage', 'bagasi', 'left luggage', 'bags'],
  ['lost', 'lost and found', 'lost property', 'barang hilang', 'hilang'],
  ['clinic', 'doctor', 'medical', 'klinik', 'first aid'],
  ['pharmacy', 'farmasi', 'medicine'],
  ['hotel', 'sleep', 'transit hotel', 'nap'],
  ['food', 'eat', 'restaurant', 'makan', 'dining', 'dine', 'cafe', 'coffee'],
  ['shop', 'shopping', 'duty free', 'kedai', 'beli-belah'],
  ['smoking', 'smoke', 'merokok', 'rokok', 'smoking room', 'bilik merokok'],
  ['shower', 'showers', 'mandi'],
  ['aerotrain', 'satellite', 'satelit'],
  ['lift', 'lifts', 'lif', 'elevator', 'elevators'],
  ['trolley', 'trolleys', 'troli', 'baggage trolley', 'luggage cart'],
  ['fast track', 'fasttrack', 'laluan pantas', 'priority lane', 'lorong keutamaan', 'express lane'],
  ['hearing loop', 'hearing loops', 'induction loop', 'gelung pendengaran', 'gelung aruhan'],
  ['halal', 'muslim friendly', 'muslim-friendly', 'mesra muslim'],
  ['information', 'information counter', 'information desk', 'kaunter pertanyaan', 'pertanyaan', 'help desk'],
];

/**
 * Words that mean the visitor is looking for a place or service in a terminal. For these queries
 * news and corporate pages are demoted and places are lifted, so "surau" never ranks a solar
 * farm press release above the prayer room (A-12).
 */
const FACILITY_INTENT = new Set([
  'surau', 'prayer', 'pray', 'musolla', 'solat', 'toilet', 'toilets', 'tandas', 'washroom', 'restroom', 'wifi', 'sim', 'esim',
  'atm', 'cash', 'forex', 'currency', 'changer', 'pengurup', 'baby', 'nursing', 'bayi', 'wheelchair', 'oku', 'buggy', 'calm',
  'sensory', 'autism', 'smoking', 'merokok', 'shower', 'mandi', 'lift', 'lifts', 'lif', 'elevator', 'trolley', 'troli', 'halal',
  'clinic', 'klinik', 'pharmacy', 'farmasi', 'lounge', 'lounges', 'hotel', 'food', 'makan', 'cafe', 'coffee', 'shop', 'kedai',
  'information', 'pertanyaan', 'lost', 'luggage', 'bagasi', 'hearing', 'parking', 'parkir', 'fasttrack',
]);

const TYPE_WEIGHT: Record<SearchDocType, number> = {
  facility: 1.3,
  transport: 1.25,
  airport: 1.2,
  parking: 1.2,
  outlet: 1.15,
  guide: 1.1,
  // An airline's own record (terminal, check-in) before lounges that carry its name.
  airline: 1.6,
  place: 1,
  faq: 1,
  notice: 1,
  // An honest "not published" answer for a known gap: only wins on a close title match.
  unpublished: 1,
  corporate: 0.7,
};

/** Extra weights when the query is about a place or service in a terminal (see `FACILITY_INTENT`). */
const FACILITY_WEIGHT: Partial<Record<SearchDocType, number>> = {
  facility: 1.4,
  outlet: 1.3,
  place: 1.2,
  parking: 1.1,
  faq: 0.75,
  notice: 0.6,
  corporate: 0.25,
};

function normalise(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** MiniSearch's own word boundaries (spaces and punctuation). */
const SPACE_OR_PUNCTUATION = /[\n\r\p{Z}\p{P}]+/u;

/**
 * Words, with "Wi-Fi" and "wi fi" kept as one word ("wifi"): split in two, "wi" matched every
 * word starting "wi" and "fi" every word starting "fi" (round 4, A-12: 55 results for "wifi").
 * Used for the documents and the queries alike.
 */
function tokenize(text: string): string[] {
  return text.replace(/\bwi[\s‐‑-]?fi\b/gi, 'wifi').split(SPACE_OR_PUNCTUATION);
}

/** The query plus the single-word synonyms of every group it touches. */
export function expandQuery(query: string): string {
  const text = normalise(query);
  if (!text) return '';
  const padded = ` ${text.replace(/[^a-z0-9\- ]/g, ' ')} `;
  const extra = new Set<string>();
  for (const group of SEARCH_SYNONYMS) {
    if (group.some((member) => padded.includes(` ${member} `))) {
      for (const member of group) {
        if (!member.includes(' ') && !padded.includes(` ${member} `)) extra.add(member);
      }
    }
  }
  return extra.size > 0 ? `${text} ${[...extra].join(' ')}` : text;
}

/** Stored keywords come back as one string (see `extractField`); normalised, space-padded. */
function storedKeywords(document: SearchDocument): string {
  const value = document.keywords as unknown;
  return ` ${normalise(Array.isArray(value) ? value.join(' | ') : String(value ?? '')).replace(/[^a-z0-9| ]+/g, ' ')} `;
}

/** Multi-word topics an honest "not published" answer can be asked for by name. */
const UNPUBLISHED_PHRASES = ['accessible toilet', 'accessible toilets', 'disabled toilet', 'tandas oku', 'oku toilet', 'smoking room', 'bilik merokok', 'accessible parking', 'parkir oku', 'hearing loop', 'money changer', 'pengurup wang', 'baggage trolley'];

/** An index built by `createSearchIndex`. Treat it as opaque and pass it to `searchAll`. */
export interface SearchIndex {
  mini: MiniSearch<SearchDocument>;
  size: number;
}

/** Build the index. Cheap enough to run in the browser when the search box is first focused. */
export function createSearchIndex(documents: readonly SearchDocument[]): SearchIndex {
  const mini = new MiniSearch<SearchDocument>({
    fields: ['title', 'keywords', 'summary'],
    storeFields: ['id', 'type', 'title', 'summary', 'href', 'airport', 'keywords', 'rank', 'rankWhen'],
    extractField: (document, fieldName) => {
      const value = (document as unknown as Record<string, unknown>)[fieldName];
      return Array.isArray(value) ? value.join(' ') : (value as string | undefined) ?? '';
    },
    processTerm: (term) => normalise(term) || null,
    tokenize,
    searchOptions: {
      tokenize,
      boost: { title: 3, keywords: 2 },
      prefix: (term) => term.length >= 2,
      fuzzy: (term) => (term.length > 4 ? 0.2 : false),
      combineWith: 'OR',
    },
  });
  mini.addAll([...documents]);
  return { mini, size: documents.length };
}

/**
 * Search everything and group the hits by type.
 *
 * Words the user typed count for more than synonyms added by `expandQuery`; documents of the
 * selected airport are preferred, and other airports' items are filtered out.
 *
 * @example
 * const results = searchAll(index, 'surau', { airport: 'kul' });
 * results.groups[0]?.hits[0]?.title; // 'Prayer rooms (surau)'
 */
export function searchAll(index: SearchIndex, query: string, options: SearchOptions = {}): SearchResults {
  // A flight number ("MH 2") is looked up on the boards; for the site's content its digits mean
  // nothing, and "2" alone matched every "Terminal 2" item (round 4, A-12).
  const flightNumber = parseFlightQuery(query).kind === 'flight-number';
  const text = flightNumber ? normalise(query.replace(/\b\d+[a-z]?\b/gi, ' ')) : normalise(query);
  if (!text) return { query, total: 0, groups: [] };
  const limit = options.limit ?? 5;
  const typed = new Set(text.split(/[^a-z0-9]+/).filter(Boolean));
  if (/\bwi[\s-]?fi\b/.test(text)) typed.add('wifi');
  const expanded = expandQuery(text);
  const asked = new Set(expanded.split(/[^a-z0-9]+/).filter(Boolean));
  const facilityIntent = [...asked].some((word) => FACILITY_INTENT.has(word));
  const phrase = ` ${text.replace(/[^a-z0-9]+/g, ' ').trim()} `;

  const raw = index.mini.search(expanded, {
    // Only words the visitor typed match as prefixes or with typos; synonyms match whole words.
    // "taxi" adds "cab", and "cab" as a prefix found "cabin bag" (the liquids rule) (round 4, A-12).
    prefix: (term) => term.length >= 2 && typed.has(term),
    fuzzy: (term) => (term.length > 4 && typed.has(term) ? 0.2 : false),
    filter: (result) => {
      const stored = result as unknown as SearchDocument;
      if (options.types && !options.types.includes(stored.type)) return false;
      // A "not published" answer only for a topic the visitor typed, never through a synonym:
      // "wheelchair" must not lead with "Accessible parking: not published" via "accessible".
      if (stored.type === 'unpublished' && !result.queryTerms.some((term) => typed.has(term))) return false;
      return !options.airport || !stored.airport || stored.airport === options.airport;
    },
    boostDocument: (_id, _term, stored) => {
      const document = stored as unknown as SearchDocument | undefined;
      if (!document) return 1;
      const local = options.airport && document.airport === options.airport ? 1.3 : 1;
      const intent = facilityIntent ? (FACILITY_WEIGHT[document.type] ?? 1) : 1;
      // The honest "not published" answer leads when the visitor typed its topic as a phrase:
      // "accessible toilet" and "tandas OKU" put it above the general toilets (round 4, A-12).
      const exact = document.type === 'unpublished' && UNPUBLISHED_PHRASES.some((keyword) => phrase.includes(` ${keyword} `) && storedKeywords(document).includes(keyword)) ? 4 : 1;
      // Stored fields come back through `extractField`: a missing rank reads as '', a word list as one string.
      const when = document.rankWhen as unknown;
      const applies = !when || String(Array.isArray(when) ? when.join(' ') : when).split(' ').some((word) => asked.has(word));
      const rank = typeof document.rank === 'number' && applies ? document.rank : 1;
      return TYPE_WEIGHT[document.type] * local * intent * exact * rank;
    },
    boostTerm: (term) => (typed.has(term) ? 1 : 0.6),
  });

  const hits: SearchHit[] = raw.map((result) => {
    const stored = result as unknown as SearchDocument & { score: number };
    const hit: SearchHit = {
      id: stored.id,
      type: stored.type,
      title: stored.title,
      summary: stored.summary,
      href: stored.href,
      keywords: stored.keywords,
      score: result.score,
    };
    if (stored.airport) hit.airport = stored.airport;
    return hit;
  });

  const byType = new Map<SearchDocType, SearchHit[]>();
  for (const hit of hits) byType.set(hit.type, [...(byType.get(hit.type) ?? []), hit]);
  const groups: SearchGroup[] = [...byType.entries()]
    .map(([type, list]) => ({ type, total: list.length, hits: list.slice(0, limit) }))
    .sort((a, b) => (b.hits[0]?.score ?? 0) - (a.hits[0]?.score ?? 0));

  return { query, total: hits.length, groups };
}

export { looksLikeFlightQuery } from '@/lib/flights/query';
