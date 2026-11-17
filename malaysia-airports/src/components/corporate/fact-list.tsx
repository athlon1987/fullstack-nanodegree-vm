import { cn } from '@/lib/cn';
import type { Translator } from '@/lib/i18n';
import type { FactView } from './corporate-data.server';
import { FactMeta } from './fact-meta';

export interface FactListProps {
  facts: readonly FactView[];
  t: Translator;
  /**
   * `figures`: big tabular numbers in a grid (key figures).
   * `grid`: label over value in a grid.
   * `rows`: label beside value, one fact per row (ownership, agreements).
   */
  layout?: 'figures' | 'grid' | 'rows';
  className?: string;
}

/** Sourced facts as a description list: label, value, note, then provenance, date and sources. */
export function FactList({ facts, t, layout = 'grid', className }: FactListProps) {
  if (layout === 'rows') {
    return (
      <dl className={className}>
        {facts.map((fact) => (
          <div key={fact.id} className="grid gap-x-10 gap-y-1.5 border-t border-line py-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
            <dt className="type-body-sm font-semibold text-ink-2">{fact.label}</dt>
            <dd className="min-w-0">
              <p className="type-body-lg text-ink">{fact.value}</p>
              {fact.note ? <p className="type-body-sm mt-1.5 max-w-reading text-ink-2">{fact.note}</p> : null}
              <FactMeta className="mt-2.5" provenance={fact.provenance} dateLabel={t('corporatePages.common.asOf', { date: fact.asOf })} sources={fact.sources} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  const figures = layout === 'figures';
  return (
    <dl className={cn('grid gap-x-8 gap-y-10 sm:grid-cols-2', figures ? 'lg:grid-cols-4' : 'lg:grid-cols-3', className)}>
      {facts.map((fact) => (
        <div key={fact.id} className={cn('flex min-w-0 flex-col gap-2 border-t pt-4', figures ? 'border-ink' : 'border-line-strong')}>
          <dt className={cn(figures ? 'type-body-sm text-ink-2' : 'type-eyebrow text-ink-3')}>{fact.label}</dt>
          <dd className={cn('text-ink', figures ? 'type-data-xl order-first' : 'type-title-md')}>{fact.value}</dd>
          {fact.note ? <dd className="type-body-sm text-ink-2">{fact.note}</dd> : null}
          <dd className="mt-auto pt-1">
            <FactMeta provenance={fact.provenance} dateLabel={t('corporatePages.common.asOf', { date: fact.asOf })} sources={fact.sources} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
