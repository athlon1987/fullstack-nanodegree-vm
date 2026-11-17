/**
 * Small helpers shared by the per-airport content files. Not an airport module: nothing here is
 * registered in `AIRPORT_CONTENT`.
 */
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
): Source {
  return asOf ? { id, kind, publisher, title, url, retrieved, asOf } : { id, kind, publisher, title, url, retrieved };
}

/**
 * The airport's "gaps note": what passengers might look for that this prototype has left out
 * because it could not be verified, with a pointer to the official channel.
 *
 * The content model has no dedicated gaps field, so the note is a `GuideNote` with the id
 * `<airport>-content-gaps`, topic `terminal` and provenance `suggestion` (it is our own advice,
 * not a fact about the airport). Pages can pick it out by id.
 */
export function contentGapsNote(input: {
  airport: string;
  title: LocalizedText;
  body: LocalizedText;
  /** The prototype's method note plus the official page passengers should use instead. */
  sources: string[];
  asOf: string;
}): GuideNote {
  return {
    id: `${input.airport}-content-gaps`,
    airport: input.airport,
    topic: 'terminal',
    title: input.title,
    body: input.body,
    provenance: 'suggestion',
    asOf: input.asOf,
    sources: input.sources,
  };
}
