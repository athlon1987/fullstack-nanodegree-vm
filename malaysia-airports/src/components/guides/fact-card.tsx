import type { Provenance, Source } from '@/content/types';
import { cn } from '@/lib/cn';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';

/** A sourced fact or answer from the content layer, ready to render. Serialisable. */
export interface FactView {
  id: string;
  title: string;
  body: string;
  provenance: Provenance;
  sources: Source[];
  details?: { label: string; value: string }[];
}

export interface FactCardProps {
  fact: FactView;
  headingLevel?: 3 | 4;
  /** `plain` drops the border, for facts nested inside another surface. */
  variant?: 'card' | 'plain';
  /** Round 4 (A-14): the section lists the sources once (`SectionSourceList`): none on the card. */
  groupedSources?: boolean;
  className?: string;
}

/** Title, body, optional detail rows, provenance tag and sources. Works in Server and Client Components. */
export function FactCard({ fact, headingLevel = 3, variant = 'card', groupedSources = false, className }: FactCardProps) {
  const Heading = `h${headingLevel}` as 'h3' | 'h4';
  return (
    // Redesign stage two: an elegant fact card (20 px corners, hairline and soft shadow), as the guides' airport notes.
    <div className={cn('flex min-w-0 flex-col gap-2', variant === 'card' && 'rounded-xl border border-line bg-surface p-5 shadow-sm', className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <Heading className="type-title-sm min-w-0 text-ink">{fact.title}</Heading>
        <ProvenanceTag provenance={fact.provenance} length="short" />
      </div>
      <p className="type-body-sm text-ink-2">{fact.body}</p>
      {fact.details && fact.details.length > 0 ? (
        <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[auto_minmax(0,1fr)]">
          {fact.details.map((detail) => (
            <div key={detail.label} className="contents">
              <dt className="type-caption font-semibold text-ink">{detail.label}</dt>
              <dd className="type-body-sm text-ink-2">{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {groupedSources ? null : <SourceNote sources={fact.sources} />}
    </div>
  );
}
