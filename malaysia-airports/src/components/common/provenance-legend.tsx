'use client';

import { PROVENANCES, type Provenance } from '@/content/types';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { ProvenanceTag } from './provenance-tag';

export interface ProvenanceLegendProps {
  /** Which kinds to explain; all four by default. List only the kinds that appear on the page. */
  kinds?: readonly Provenance[];
  /** Heading level for "How to read this guidance". `null` hides the heading. */
  headingLevel?: 2 | 3 | 4 | null;
  className?: string;
}

/**
 * Explains the provenance tags. Put one on every page that shows guidance with tags.
 *
 * @example <ProvenanceLegend kinds={['official', 'estimated', 'suggestion']} />
 */
export function ProvenanceLegend({ kinds = PROVENANCES, headingLevel = 3, className }: ProvenanceLegendProps) {
  const t = useT();
  const Heading = headingLevel ? (`h${headingLevel}` as 'h2' | 'h3' | 'h4') : null;
  return (
    <div className={cn('min-w-0', className)}>
      {Heading ? <Heading className="type-eyebrow mb-2 text-ink-3">{t('provenance.title')}</Heading> : null}
      <dl className="border-t border-line-strong">
        {kinds.map((kind) => (
          <div key={kind} className="grid gap-x-4 gap-y-1.5 border-b border-line py-3 sm:grid-cols-[11.5rem_minmax(0,1fr)] sm:items-center">
            <dt>
              <ProvenanceTag provenance={kind} />
            </dt>
            <dd className="type-body-sm text-ink-2">{t(`provenance.${kind}.description`)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
