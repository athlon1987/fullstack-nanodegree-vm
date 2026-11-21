/**
 * Serialisable shapes the transport and parking pages hand from the server to their Client
 * Components. Client-safe: types only, plus tiny helpers that need no content.
 */
import type { Provenance, Source, TerminalId, TransportOption } from '@/content/types';

/** A terminal with its short label and level names, in the page language. */
export interface TerminalInfo {
  id: TerminalId;
  label: string;
  /** Level id to a short level name: `L1` to "Level 1". */
  levels: Record<string, string>;
}

/**
 * Anti-touting advice for the transport decision (C-02): the airport's sourced statement (the
 * Help answer the arriving guide also gives), shown at the top and beside taxi and e-hailing.
 */
export interface ToutsView {
  /** The sourced statement in the page language. */
  body: string;
  provenance: Provenance;
  asOf?: string;
  sourceIds: string[];
  /** Locale-free link to the Help answer: `/help/scams#scam-touts`. */
  helpHref: string;
}

/** What every transport card needs besides the option itself. */
export interface TransportContext {
  slug: string;
  airportName: string;
  timezone: string;
  terminals: TerminalInfo[];
  sources: Record<string, Source>;
  /** The airport's official website, for anything we do not publish. */
  officialUrl: string;
  /** Present where the airport has a sourced warning about ride touts (KLIA). */
  touts?: ToutsView;
}

/** Data for the planner: options compared by `compareTransport`, with their context. */
export interface PlannerData {
  context: TransportContext;
  options: TransportOption[];
}

/** A sourced editorial note (warning, transit advice, content gaps), in the page language. */
export interface NoteView {
  id: string;
  title: string;
  body: string;
  provenance: Provenance;
  asOf?: string;
  sourceIds: string[];
}

/** Resolve source ids against a lookup, skipping unknown ids. */
export function sourcesFor(ids: readonly string[], lookup: Readonly<Record<string, Source>>): Source[] {
  return ids.map((id) => lookup[id]).filter((source): source is Source => source !== undefined);
}

/** Modes you buy a ticket for before you ride, where an operator's own website can sell one. */
const TICKETED_MODES: readonly TransportOption['mode'][] = ['rail', 'bus', 'shuttle'];

/**
 * The official place to buy a ticket for an option (C-02), official channels only: the option's
 * own booking link; else the operator's page among its sources; else the website of its named
 * operator when another cited page of that operator is in the lookup (KLIA Ekspres and KLIA
 * Transit share Express Rail Link's kliaekspres.com). Never an aggregator or a booking site.
 */
export function ticketChannel(option: TransportOption, lookup: Readonly<Record<string, Source>>): string | undefined {
  if (option.bookingUrl) return option.bookingUrl;
  if (!TICKETED_MODES.includes(option.mode)) return undefined;
  const own = sourcesFor(option.sources, lookup).find((source) => source.kind === 'operator' && /^https?:/.test(source.url));
  if (own) return own.url;
  const operator = option.operator?.toLowerCase();
  if (!operator) return undefined;
  const site = Object.values(lookup).find((source) => source.kind === 'operator' && source.publisher.toLowerCase().startsWith(operator) && /^https?:/.test(source.url));
  return site ? new URL(site.url).origin + '/' : undefined;
}

/** The first official or operator page among an item's sources, for "check the official site" links. */
export function officialSourceUrl(ids: readonly string[], lookup: Readonly<Record<string, Source>>): string | undefined {
  return sourcesFor(ids, lookup).find((source) => (source.kind === 'official' || source.kind === 'operator') && /^https?:/.test(source.url))?.url;
}
