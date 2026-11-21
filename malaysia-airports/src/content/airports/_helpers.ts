/**
 * Small helpers shared by the per-airport content files. Not an airport module: nothing here is
 * registered in `AIRPORT_CONTENT`.
 */
import type { SourceExtras } from '../source-notes';
import type { GuideNote, LocalizedText, Source } from '../types';

/** Dates of the research runs that produced `docs/research/facts/*`. */
export const RETRIEVED_16_NOV = '2026-11-16';
export const RETRIEVED_17_NOV = '2026-11-17';

export const MAHB = 'Malaysia Airports Holdings Berhad';
export const CAAM = 'Civil Aviation Authority of Malaysia';

/** Build a source record. `retrieved` is the date the research run captured it. */
export function source(
  id: string,
  kind: Source['kind'],
  publisher: string,
  title: string,
  url: string,
  retrieved: string,
  asOf?: string,
  extras: SourceExtras = {},
): Source {
  const base = { id, kind, publisher, title, url, retrieved, ...extras };
  return asOf ? { ...base, asOf } : { ...base, undated: true };
}

/**
 * The airport's "gaps note": what passengers might look for that this prototype has left out
 * because it could not be verified, with a pointer to the official channel.
 *
 * The note is a `GuideNote` with the id `<airport>-content-gaps`, topic `coverage` (no journey
 * step or guide reads it, D-05) and provenance `suggestion` (it is our own advice, not a fact
 * about the airport). It is listed once per airport on About this prototype; section pages pick
 * it out by id. `gaps` names the areas it says are missing, and `validateContent` fails when any
 * of them has published records, so the note cannot contradict the pages.
 */
export function contentGapsNote(input: {
  airport: string;
  title: LocalizedText;
  body: LocalizedText;
  /** The prototype's method note plus the official page passengers should use instead. */
  sources: string[];
  /** The day the list was last checked against the published content. */
  asOf: string;
  /** Areas the body says are not published; checked against the records by `validateContent`. */
  gaps?: NonNullable<GuideNote['gaps']>;
}): GuideNote {
  return {
    id: `${input.airport}-content-gaps`,
    airport: input.airport,
    topic: 'coverage',
    title: input.title,
    body: input.body,
    ...(input.gaps ? { gaps: input.gaps } : {}),
    provenance: 'suggestion',
    asOf: input.asOf,
    sources: input.sources,
  };
}
