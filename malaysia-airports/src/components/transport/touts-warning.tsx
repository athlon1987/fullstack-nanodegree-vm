'use client';

import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { Callout } from '@/components/ui/callout';
import { Icon } from '@/components/ui/icon';
import { sourcesFor, type TransportContext } from './transport-types';

export interface ToutsWarningProps {
  context: TransportContext;
  /** `banner` at the top of the transport page; `inline` inside a taxi or e-hailing card. */
  variant?: 'banner' | 'inline';
  /** For `inline`: the advice that fits the card's mode. */
  mode?: 'taxi' | 'e-hailing';
  className?: string;
}

/**
 * "Book taxis only at the coupon counters; ignore anyone offering a ride" (C-02), with the
 * airport's sourced statement, its sources and a link to the Help answer about touts. Renders
 * nothing where the content layer has no such statement for the airport.
 */
export function ToutsWarning({ context, variant = 'banner', mode = 'taxi', className }: ToutsWarningProps) {
  const t = useT();
  const touts = context.touts;
  if (!touts) return null;
  const help = (
    <LocaleLink href={touts.helpHref} className="link-action type-body-sm text-ink">
      {t('transportPages.touts.help')}
      <Icon name="arrow-right" size="sm" />
    </LocaleLink>
  );

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-start gap-3 rounded-xl border border-warning-border/40 bg-warning-bg px-3.5 py-3 text-warning-fg hc:border-warning-border', className)}>
        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface/70">
          <Icon name="triangle-alert" size="sm" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="type-body-sm font-semibold">{mode === 'e-hailing' ? t('transportPages.touts.ehailing') : t('transportPages.touts.taxi')}</p>
          <div className="mt-0.5">{help}</div>
        </div>
      </div>
    );
  }

  return (
    <Callout
      tone="warning"
      icon="triangle-alert"
      title={t('transportPages.touts.title')}
      // Redesign stage two: a refined callout (the soft amber panel, the tone's round icon, one
      // quiet provenance line), no longer a 2 px frame. The words, sources and link are unchanged.
      className={cn('sm:p-6', className)}
      actions={
        <>
          {help}
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ProvenanceTag provenance={touts.provenance} length="short" />
            <SourceNote sources={sourcesFor(touts.sourceIds, context.sources)} />
          </span>
        </>
      }
    >
      <p>{touts.body}</p>
    </Callout>
  );
}
