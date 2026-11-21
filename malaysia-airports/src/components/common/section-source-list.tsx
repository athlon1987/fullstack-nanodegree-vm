'use client';

import type { Source } from '@/content/types';
import { useT } from '@/lib/i18n/client';
import { sectionSources } from './section-sources';
import { SourceNote } from './source-note';

export interface SectionSourceListProps {
  /** The section's items, each with its name and resolved sources. */
  items: readonly { name: string; sources: readonly Source[] }[];
  className?: string;
}

/**
 * Round 4 (A-14): "Sources for this section", one list instead of a toggle on every card, each
 * source naming the items it supports. Renders nothing when the items cite no source.
 *
 * @example <SectionSourceList items={facts.map((fact) => ({ name: fact.title, sources: fact.sources }))} />
 */
export function SectionSourceList({ items, className }: SectionSourceListProps) {
  const t = useT();
  const lookup = Object.fromEntries(items.flatMap((item) => item.sources.map((source) => [source.id, source] as const)));
  const listed = sectionSources(items, (item) => item.sources.map((source) => source.id), (item) => item.name, lookup);
  if (listed.sources.length === 0) return null;
  return (
    <div data-section-sources="" className={className}>
      <SourceNote sources={listed.sources} citedBy={items.length > 1 ? listed.citedBy : undefined} label={t('shellExtras.sourceLists.section')} />
    </div>
  );
}
