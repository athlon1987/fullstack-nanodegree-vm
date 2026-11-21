import type { Provenance } from '@/content/types';

/**
 * The provenance most items of a list share, if it covers at least half of them (round 2, A-14).
 * Stated once with `ProvenanceDefault`; only the other items keep their own tag.
 */
export function sharedProvenance(items: readonly { provenance: Provenance }[]): Provenance | undefined {
  const counts = new Map<Provenance, number>();
  for (const item of items) counts.set(item.provenance, (counts.get(item.provenance) ?? 0) + 1);
  const [top, count] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [];
  return top && count !== undefined && count > 1 && count * 2 >= items.length && top !== 'demo' ? top : undefined;
}
