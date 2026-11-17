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

/** What every transport card needs besides the option itself. */
export interface TransportContext {
  slug: string;
  airportName: string;
  timezone: string;
  terminals: TerminalInfo[];
  sources: Record<string, Source>;
  /** The airport's official website, for anything we do not publish. */
  officialUrl: string;
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

/** The first official or operator page among an item's sources, for "check the official site" links. */
export function officialSourceUrl(ids: readonly string[], lookup: Readonly<Record<string, Source>>): string | undefined {
  return sourcesFor(ids, lookup).find((source) => (source.kind === 'official' || source.kind === 'operator') && /^https?:/.test(source.url))?.url;
}
