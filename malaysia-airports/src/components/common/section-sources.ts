import type { Source } from '@/content/types';

/** One section's sources, each listed once, with the items it supports. */
export interface SectionSources {
  sources: Source[];
  /** Source id to the names of the items that cite it, in the items' order. */
  citedBy: Record<string, string[]>;
}

/**
 * Round 4 (A-14, one source list per section): the union of the sources a section's items cite,
 * in first-cited order, each with the items it supports, so a single `SourceNote` can replace a
 * toggle on every card without losing which source backs which card. Unknown ids are skipped.
 *
 * @example const { sources, citedBy } = sectionSources(items, (item) => item.sourceIds, (item) => item.name, lookup);
 */
export function sectionSources<T>(
  items: readonly T[],
  idsOf: (item: T) => readonly string[],
  nameOf: (item: T) => string,
  lookup: Readonly<Record<string, Source>>,
): SectionSources {
  const sources: Source[] = [];
  const citedBy: Record<string, string[]> = {};
  for (const item of items) {
    const name = nameOf(item);
    for (const id of idsOf(item)) {
      const source = lookup[id];
      if (!source) continue;
      if (!citedBy[id]) {
        citedBy[id] = [];
        sources.push(source);
      }
      if (!citedBy[id].includes(name)) citedBy[id].push(name);
    }
  }
  return { sources, citedBy };
}
