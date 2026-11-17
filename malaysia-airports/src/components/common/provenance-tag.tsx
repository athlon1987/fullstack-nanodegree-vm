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
  /** `full` (default): "Official instruction". `short`: "Official", for dense rows. */
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
      className={cn(
        'type-caption relative inline-flex h-6 shrink-0 items-center gap-1.5 overflow-hidden rounded-sm border pr-2 pl-1.5 font-semibold whitespace-nowrap',
        provenance === 'demo' && 'pl-4',
        form.box,
        className,
      )}
      {...rest}
    >
      {provenance === 'demo' ? <span aria-hidden="true" className="hazard-stripes absolute inset-y-0 left-0 w-2.5" /> : null}
      <Icon name={form.icon} size="xs" strokeWidth={2} />
      {t(`provenance.${provenance}.${length === 'short' ? 'short' : 'label'}`)}
    </span>
  );
}
