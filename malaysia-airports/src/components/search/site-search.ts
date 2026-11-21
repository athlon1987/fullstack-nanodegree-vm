'use client';

/**
 * The search engine shared by the command palette and the search page.
 *
 *  - Documents are built on the server (`buildSearchDocuments(lang)`) and served as a static
 *    JSON file per language (`/[lang]/search/index.json`). They are fetched the first time a
 *    search surface opens, so no page pays for them up front.
 *  - Flights are looked up in the demo provider and must be shown with the demonstration label.
 *  - Recent searches stay on the device.
 */
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { Lang } from '@/content/types';
import type { Flight } from '@/lib/flights';
import { useFlightProvider, useStore } from '@/lib/hooks';
import { createSearchIndex, looksLikeFlightQuery, searchAll, type SearchDocument, type SearchGroup, type SearchIndex } from '@/lib/search/engine';
import { check, createStore, validator } from '@/lib/storage';

/* ---- The index ------------------------------------------------------------------------------- */

type IndexState = { status: 'idle' | 'loading' | 'error' } | { status: 'ready'; index: SearchIndex };

const IDLE: IndexState = { status: 'idle' };
const states = new Map<Lang, IndexState>();
const listeners = new Set<() => void>();

function setState(lang: Lang, state: IndexState): void {
  states.set(lang, state);
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Where the documents for a language live. */
export function searchIndexUrl(lang: Lang): string {
  return `/${lang}/search/index.json`;
}

/** Fetch and index the documents for a language (once; call again after an error to retry). */
export function loadSearchIndex(lang: Lang): void {
  const current = states.get(lang);
  if (current && (current.status === 'loading' || current.status === 'ready')) return;
  setState(lang, { status: 'loading' });
  fetch(searchIndexUrl(lang))
    .then((response) => {
      if (!response.ok) throw new Error(`Search index ${response.status}`);
      return response.json() as Promise<SearchDocument[]>;
    })
    .then((documents) => setState(lang, { status: 'ready', index: createSearchIndex(documents) }))
    .catch(() => setState(lang, { status: 'error' }));
}

/** The search index for a language. It loads when `enabled` first becomes true. */
export function useSearchIndex(lang: Lang, enabled: boolean): IndexState {
  const state = useSyncExternalStore(
    subscribe,
    () => states.get(lang) ?? IDLE,
    () => IDLE,
  );
  useEffect(() => {
    if (enabled) loadSearchIndex(lang);
  }, [enabled, lang]);
  return state;
}

/* ---- Searching ------------------------------------------------------------------------------- */

/** What one query found. */
export interface SiteSearchResults {
  query: string;
  /** Demo flights that match. Always label them as demonstration data. */
  flights: Flight[];
  /** True when the query reads like a flight number or a route: show flights first. */
  flightShaped: boolean;
  /** Content hits grouped by type, best group first. */
  groups: SearchGroup[];
  /** Flights plus content hits, before limits. */
  total: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
}

export interface SiteSearchOptions {
  /** Prefer and filter to this airport (its items and network-wide items are kept). */
  airport?: string;
  /** Hits per content group. */
  limit?: number;
  /** Maximum flights. */
  flightLimit?: number;
  /** Load the index and search. False keeps the hook idle (a closed palette). */
  enabled?: boolean;
}

/** Search content and demo flights for a query. Empty and one-letter queries return nothing. */
export function useSiteSearch(lang: Lang, query: string, { airport, limit = 5, flightLimit = 4, enabled = true }: SiteSearchOptions = {}): SiteSearchResults {
  const state = useSearchIndex(lang, enabled);
  const provider = useFlightProvider();
  const text = query.trim();
  return useMemo(() => {
    const active = enabled && text.length >= 2;
    const flights = active && provider && flightLimit > 0 ? provider.searchSync({ q: text, airport, limit: flightLimit }) : [];
    const content = active && state.status === 'ready' ? searchAll(state.index, text, { airport, limit }) : null;
    return {
      query: text,
      flights,
      flightShaped: active && looksLikeFlightQuery(text),
      groups: content?.groups ?? [],
      total: flights.length + (content?.total ?? 0),
      status: state.status,
    };
  }, [enabled, text, provider, state, airport, limit, flightLimit]);
}

/* ---- Recent searches ------------------------------------------------------------------------- */

const MAX_RECENT = 6;

const recentStore = createStore<string[]>({
  name: 'recent-searches',
  version: 1,
  // zod-free validation (round 2, E-03): zod left the JavaScript of every page.
  schema: validator(check.array(check.string({ min: 1, max: 80 }), { max: MAX_RECENT })),
  defaultValue: [],
});

/** Remember a query the visitor acted on (most recent first, no duplicates). */
export function rememberSearch(query: string): void {
  const text = query.trim().slice(0, 80);
  if (text.length < 2) return;
  recentStore.set((current) => [text, ...current.filter((item) => item.toLowerCase() !== text.toLowerCase())].slice(0, MAX_RECENT));
}

/** Forget every recent search. */
export function clearRecentSearches(): void {
  recentStore.clear();
}

/** Recent searches, most recent first. Empty until hydrated. */
export function useRecentSearches(): string[] {
  return useStore(recentStore);
}
