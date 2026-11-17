/**
 * Retrieval for the concierge: score the citable passages (FAQ answers, guide steps, airport
 * guide notes) against a question, and fall back to the site search engine for everything else.
 * Structured lookups (facilities by category, transport by destination and so on) live in the
 * engine; this module finds the prose that explains them.
 */
import { createSearchIndex, searchAll, type SearchDocType, type SearchHit, type SearchIndex } from '@/lib/search/engine';
import { normalise, tokens } from './text';
import type { ConciergeKnowledge, KnowledgePassage } from './types';

export interface PassageQuery {
  /** The question (or extra words) to score against. */
  text: string;
  airport?: string;
  terminal?: string;
  airline?: string;
  gatePrefix?: string;
  /** FAQ topics, guide slugs or note topics that suit the intent: a strong boost. */
  topics?: readonly string[];
  /** Words that must appear for a passage to count (any of them), normalised. */
  require?: readonly string[];
  limit?: number;
  /** Ignore passages scoring below this. */
  minScore?: number;
}

export interface ScoredPassage {
  passage: KnowledgePassage;
  score: number;
}

const passageTokenCache = new WeakMap<KnowledgePassage, { title: Set<string>; body: Set<string>; text: string }>();

function passageTokens(passage: KnowledgePassage) {
  let cached = passageTokenCache.get(passage);
  if (!cached) {
    const title = [passage.title.en, passage.title.ms ?? ''].join(' ');
    const body = [passage.body.en, passage.body.ms ?? ''].join(' ');
    cached = { title: new Set(tokens(title)), body: new Set(tokens(body)), text: normalise(`${title} ${body}`) };
    passageTokenCache.set(passage, cached);
  }
  return cached;
}

/** Short names of other airports: a passage naming one of them does not apply here. */
function otherAirportNames(knowledge: ConciergeKnowledge, airport: string | undefined): string[] {
  return knowledge.featured
    .map((item) => knowledge.airports.find((candidate) => candidate.slug === item.airport))
    .filter((item): item is NonNullable<typeof item> => item !== undefined && item.slug !== airport)
    .map((item) => normalise(item.shortName));
}

/** True when a passage applies to the airport (network-wide, or limited to it). */
export function passageApplies(passage: KnowledgePassage, airport: string | undefined, knowledge: ConciergeKnowledge): boolean {
  if (passage.airports.length > 0) return airport !== undefined && passage.airports.includes(airport);
  // A network-wide passage that names another airport (a KLIA-only step in a general guide).
  const text = passageTokens(passage).text;
  const others = otherAirportNames(knowledge, airport);
  return !others.some((name) => name && ` ${text} `.includes(` ${name} `));
}

/** Score passages against a question. Best first. */
export function retrievePassages(knowledge: ConciergeKnowledge, query: PassageQuery): ScoredPassage[] {
  const wanted = tokens(query.text);
  const unique = [...new Set(wanted)];
  const results: ScoredPassage[] = [];
  for (const passage of knowledge.passages) {
    if (!passageApplies(passage, query.airport, knowledge)) continue;
    if (passage.terminal && query.terminal && passage.terminal !== query.terminal) continue;
    if (passage.airline && query.airline && passage.airline !== query.airline) continue;
    if (passage.gatePrefixes && query.gatePrefix && !passage.gatePrefixes.includes(query.gatePrefix)) continue;
    const { title, body, text } = passageTokens(passage);
    if (query.require && !query.require.some((word) => ` ${text} `.includes(` ${word} `))) continue;
    let score = 0;
    for (const token of unique) {
      if (title.has(token)) score += 2;
      else if (body.has(token)) score += 1;
    }
    if (query.topics?.includes(passage.topic)) score += 3;
    if (query.airport && passage.airports.includes(query.airport)) score += 1;
    if (query.airline && passage.airline === query.airline) score += 2;
    if (score >= (query.minScore ?? 2)) results.push({ passage, score });
  }
  results.sort((a, b) => b.score - a.score || a.passage.id.localeCompare(b.passage.id));
  return results.slice(0, query.limit ?? 3);
}

const indexCache = new WeakMap<ConciergeKnowledge, SearchIndex>();

/** Site search over the knowledge's search documents (MiniSearch, built once per knowledge). */
export function searchKnowledge(
  knowledge: ConciergeKnowledge,
  question: string,
  options: { airport?: string; types?: readonly SearchDocType[]; limit?: number } = {},
): SearchHit[] {
  let index = indexCache.get(knowledge);
  if (!index) {
    index = createSearchIndex(knowledge.searchDocs);
    indexCache.set(knowledge, index);
  }
  const results = searchAll(index, question, { airport: options.airport, types: options.types, limit: 3 });
  return results.groups
    .flatMap((group) => group.hits)
    .filter((hit) => !options.airport || !hit.airport || hit.airport === options.airport)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit ?? 4);
}

/** The site link for a content item, from the search documents: `href('facility', id)`. */
export function hrefFor(knowledge: ConciergeKnowledge, type: SearchDocType, id: string): string | undefined {
  return knowledge.searchDocs.find((doc) => doc.id === `${type}:${id}`)?.href;
}
