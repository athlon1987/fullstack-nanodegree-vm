import type { Provenance, Source } from '@/content/types';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { cn } from '@/lib/cn';

export interface FactMetaProps {
  provenance?: Provenance;
  /** Already formatted, for example "As of 20 January 2026". */
  dateLabel?: string;
  sources: readonly Source[];
  className?: string;
  /** Inverse surfaces: dim the date line on `bg-inverse`. */
  onInverse?: boolean;
}

/** The provenance tag, the date a fact applies to and its collapsed sources, on one wrapping line. */
export function FactMeta({ provenance, dateLabel, sources, className, onInverse = false }: FactMetaProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      {provenance ? <ProvenanceTag provenance={provenance} length="short" /> : null}
      {dateLabel ? <span className={cn('type-caption', onInverse ? 'text-on-inverse-dim' : 'text-ink-3')}>{dateLabel}</span> : null}
      {sources.length ? <SourceNote sources={sources} /> : null}
    </div>
  );
}
