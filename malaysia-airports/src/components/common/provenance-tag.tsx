'use client';

import type { HTMLAttributes } from 'react';
import type { Provenance } from '@/content/types';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { Icon, type IconName } from '@/components/ui/icon';

/** The form of each tag: solid, outlined, dashed, striped. The form carries the meaning with the icon and the label. */
const FORMS: Record<Provenance, { box: string; icon: IconName }> = {
  official: { box: 'border-official-border bg-official-bg text-official-fg', icon: 'badge-check' },
  estimated: { box: 'border-estimated-border bg-estimated-bg text-estimated-fg', icon: 'calculator' },
  suggestion: { box: 'border-dashed border-suggestion-border bg-suggestion-bg text-suggestion-fg', icon: 'lightbulb' },
  demo: { box: 'border-demo-border bg-demo-bg text-demo-fg', icon: 'flask-conical' },
};

export const PROVENANCE_ICONS: Record<Provenance, IconName> = {
  official: FORMS.official.icon,
  estimated: FORMS.estimated.icon,
  suggestion: FORMS.suggestion.icon,
  demo: FORMS.demo.icon,
};

export interface ProvenanceTagProps extends HTMLAttributes<HTMLSpanElement> {
  provenance: Provenance;
  /**
   * One tag set in both languages (A-14): Official, Estimated, Suggestion, Demo. `full` and
   * `short` now read the same for the first three; `full` spells out "Demonstration data".
   */
  length?: 'full' | 'short';
}

/**
 * Says what kind of guidance something is. Required wherever the product gives guidance
 * (build-spec section 1): official is solid, estimated is outlined, a suggestion is dashed and
 * demonstration data is hazard-striped.
 *
 * @example <ProvenanceTag provenance={step.provenance} />
 */
export function ProvenanceTag({ provenance, length = 'full', className, ...rest }: ProvenanceTagProps) {
  const t = useT();
  const form = FORMS[provenance];
  return (
    <span
      data-provenance={provenance}
      data-demo-marker={provenance === 'demo' ? '' : undefined}
      className={cn(
        // Wraps between words instead of widening the page at 320 px and 125% text (A-16); 20 px
        // tall otherwise. Round 4: no `overflow-hidden`, so a label is never clipped ("Estimatec");
        // the hazard stripe rounds its own corners instead.
        'type-caption relative inline-flex min-h-5 max-w-full items-center gap-1 rounded-xs border py-px pr-1.5 pl-1 leading-tight font-semibold',
        provenance === 'demo' && 'pl-3.5',
        form.box,
        className,
      )}
      {...rest}
    >
      {provenance === 'demo' ? <span aria-hidden="true" className="hazard-stripes absolute inset-y-0 left-0 w-2 rounded-l-xs" /> : null}
      <Icon name={form.icon} size="xs" strokeWidth={2} className="shrink-0" />
      {t(`provenance.${provenance}.${length === 'short' ? 'short' : 'label'}`)}
    </span>
  );
}

/** "[Official] unless marked otherwise": the shared provenance of a list, said once (round 2, A-14). */
export function ProvenanceDefault({ provenance, className }: { provenance: Provenance; className?: string }) {
  const t = useT();
  return (
    <p data-provenance-default={provenance} className={cn('type-caption flex flex-wrap items-center gap-x-1.5 gap-y-1 text-ink-2', className)}>
      <ProvenanceTag provenance={provenance} length="short" />
      <span>{t('provenance.unlessMarked')}</span>
    </p>
  );
}
