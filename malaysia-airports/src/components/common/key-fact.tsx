import type { ReactNode } from 'react';
import type { Provenance, Source } from '@/content/types';
import { cn } from '@/lib/cn';
import { ProvenanceTag } from './provenance-tag';
import { SourceNote } from './source-note';

export interface KeyFactProps {
  label: ReactNode;
  /** The fact itself. When it is unknown, pass `<NotPublished />` instead of guessing. */
  value: ReactNode;
  /** A qualifier: the unit, the date it applies from, a condition. */
  hint?: ReactNode;
  provenance?: Provenance;
  /** Resolved sources (`resolveSources(ids)`), shown collapsed. */
  sources?: readonly Source[];
  /** Mono figures for amounts, times and counts. */
  mono?: boolean;
  className?: string;
}

/**
 * One published fact with its label, provenance and source: a fare, an opening time, a walking
 * distance. The value is the visual anchor; the provenance and source sit quietly under it.
 *
 * @example <KeyFact label={t('common.labels.price')} value={formatCurrency(fare, lang)} provenance="official" sources={sources} mono />
 */
export function KeyFact({ label, value, hint, provenance, sources, mono = false, className }: KeyFactProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2 border-t border-line-strong pt-3', className)}>
      <p className="type-eyebrow text-ink-3">{label}</p>
      <p className={cn('text-ink', mono ? 'type-data-xl' : 'type-title-lg')}>{value}</p>
      {hint ? <p className="type-body-sm text-ink-2">{hint}</p> : null}
      {provenance || sources?.length ? (
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
          {provenance ? <ProvenanceTag provenance={provenance} length="short" className="mt-1" /> : null}
          {sources?.length ? <SourceNote sources={sources} /> : null}
        </div>
      ) : null}
    </div>
  );
}
