'use client';

import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
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

  // Polish (critique-redesign2 item 9): a quieter warning with the same words, role and place: a
  // white card with a 3 px amber edge and a small amber icon disc (it was a 194 px amber slab, half
  // a phone screen, and an olive-brown fill in dark mode). The body keeps a reading measure.
  return (
    <div
      role="note"
      className={cn(
        'relative isolate flex gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-4 pl-5 shadow-xs sm:gap-3.5 sm:p-5 sm:pl-6 hc:border-warning-border',
        className,
      )}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-warning-border" />
      <span aria-hidden="true" className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-warning-bg text-warning-fg">
        <Icon name="triangle-alert" size="xs" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="type-title-sm text-ink">{t('transportPages.touts.title')}</p>
        <p className="type-body-sm mt-1 max-w-reading text-ink-2">{touts.body}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          {help}
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ProvenanceTag provenance={touts.provenance} length="short" />
            <SourceNote sources={sourcesFor(touts.sourceIds, context.sources)} />
          </span>
        </div>
      </div>
    </div>
  );
}
