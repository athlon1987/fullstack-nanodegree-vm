'use client';

import { useMemo } from 'react';
import { pick } from '@/content/values';
import type { Notice, Source, TerminalId } from '@/content/types';
import { cn } from '@/lib/cn';
import { useNow } from '@/lib/hooks/use-now';
import { useLang, useT } from '@/lib/i18n/client';
import { opsStatus, type OpsServiceId, type OpsStatusLine } from '@/lib/providers/demo-operations';
import type { WaitCheckpoint } from '@/lib/providers/types';
import { formatDate, formatTime } from '@/lib/time';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { DemoMark } from './demo-mark';

export interface OpsStatusProps {
  /** Airport slug: `kul`. */
  airport: string;
  /** The airport's notices (`getNotices(airport)` on the server). Plain data. */
  notices: readonly Notice[];
  /** Sources cited by those notices, by id (`resolveSources` on the server). */
  sources?: Readonly<Record<string, Source>>;
  /** Which services, in order. Default: every service at the airport. */
  services?: readonly OpsServiceId[];
  terminal?: TerminalId;
  /** Queue checkpoints to show with the immigration line. Default: security and immigration (leaving). */
  checkpoints?: readonly WaitCheckpoint[];
  /** `card`: a titled panel (home, overview, transit). `inline`: bare lines inside a journey step. */
  variant?: 'card' | 'inline';
  headingLevel?: 2 | 3;
  className?: string;
}

const CHECKPOINT_KEYS: Record<WaitCheckpoint, string> = {
  'check-in': 'checkIn',
  security: 'security',
  'immigration-departure': 'immigrationDeparture',
  'immigration-arrival': 'immigrationArrival',
  customs: 'customs',
  'taxi-queue': 'taxiQueue',
};

/**
 * Status lines for the services passengers ask about (BR-08, exec-commerce-04, usability-11):
 * Aerotrain, the train and shuttle between terminals, and immigration with demo queue estimates.
 * Each line gives a state, the time it was checked and its source. With no notice it says "No
 * disruption reported in our sources as of hh:mm; check the signs". Fed by dated notices until a
 * live operations feed exists (OOS-02). The clock is read with `useNow()`, so the server HTML
 * holds a skeleton of the same height.
 *
 * Other packages render it through `OpsStatusSection` (a Server Component that loads the notices).
 */
export function OpsStatus({ airport, notices, sources = {}, services, terminal, checkpoints, variant = 'card', headingLevel = 2, className }: OpsStatusProps) {
  const t = useT();
  const lang = useLang();
  const now = useNow(60_000);
  const lines = useMemo(
    () => (now === null ? null : opsStatus({ airport, notices, now, services, terminal })),
    [airport, notices, now, services, terminal],
  );
  const Heading = `h${headingLevel}` as 'h2' | 'h3';

  const line = (item: OpsStatusLine) => {
    const tone = item.state === 'notice' ? 'warning' : item.state === 'planned' ? 'info' : 'neutral';
    const checked = formatTime(item.checkedAt);
    const noticeSources = (item.notice?.sources ?? []).map((id) => sources[id]).filter((source): source is Source => Boolean(source));
    const waits = item.waits.filter((wait) => (checkpoints ?? ['security', 'immigration-departure']).includes(wait.checkpoint));
    return (
      <li key={item.service} data-ops-service={item.service} data-ops-state={item.state} className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="type-body-sm font-semibold text-ink">{pick(item.name, lang)}</p>
          <p className="type-caption text-ink-2">{t('flightPages.ops.checked', { time: checked })}</p>
        </div>
        {item.state === 'clear' ? (
          <p className="type-body-sm flex items-start gap-2 text-ink-2">
            <Icon name="circle-check" size="sm" className="mt-0.5 shrink-0 text-ink" />
            <span>{t('flightPages.ops.clear', { time: checked })}</span>
          </p>
        ) : item.notice ? (
          <div className={cn('rounded-md border px-3 py-2', tone === 'warning' ? 'border-warning-border bg-warning-bg' : 'border-info-border bg-info-bg')}>
            <p className={cn('type-body-sm flex items-start gap-2', tone === 'warning' ? 'text-warning-fg' : 'text-info-fg')}>
              <Icon name={tone === 'warning' ? 'triangle-alert' : 'info'} size="sm" className="mt-0.5 shrink-0" />
              <span>
                <strong className="font-semibold">
                  {item.state === 'notice'
                    ? t('flightPages.ops.notice')
                    : t('flightPages.ops.planned', { date: item.notice.validFrom ? formatDate(item.notice.validFrom, lang, 'short') : '' })}
                  :
                </strong>{' '}
                {pick(item.notice.title, lang)}
              </span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <ProvenanceTag provenance={item.notice.provenance} length="short" />
              {noticeSources.length > 0 ? <SourceNote sources={noticeSources} /> : null}
              <LocaleLink href={`/notices#${item.notice.id}`} className="link type-body-sm">
                {t('flightPages.ops.readNotice')}
              </LocaleLink>
            </div>
          </div>
        ) : null}
        {waits.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="type-caption text-ink-2">{t('flightPages.ops.waitsLabel')}</span>
            {waits.map((wait) => (
              <span key={`${wait.terminal}-${wait.checkpoint}`} className="type-body-sm text-ink">
                {t(`flightPages.ops.checkpoints.${CHECKPOINT_KEYS[wait.checkpoint]}` as 'flightPages.ops.checkpoints.security')}
                {terminal || item.terminal ? '' : ` ${wait.terminal}`}: <span className="type-data-sm">{t('flightPages.ops.wait', { minutes: wait.minutes })}</span>
              </span>
            ))}
            <DemoMark />
          </div>
        ) : null}
      </li>
    );
  };

  const body =
    lines === null ? (
      <div role="status" className="flex flex-col gap-2">
        <span className="sr-only">{t('common.labels.loading')}</span>
        {(services ?? ['a', 'b']).map((key) => (
          <Skeleton key={String(key)} className="h-11 w-full" />
        ))}
      </div>
    ) : (
      <ul className="flex flex-col divide-y divide-line">{lines.map(line)}</ul>
    );

  if (variant === 'inline') return <div className={cn('mt-3 rounded-md border border-line bg-page-subtle px-3.5 py-3', className)}>{body}</div>;

  return (
    <section aria-label={t('flightPages.ops.title')} className={cn('rounded-lg border border-line-strong bg-surface p-5', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Heading className="type-title-md text-ink">{t('flightPages.ops.title')}</Heading>
        <LocaleLink href="/notices" className="link type-body-sm">
          {t('flightPages.ops.allNotices')}
        </LocaleLink>
      </div>
      <p className="type-caption mt-1 text-ink-2">{t('flightPages.ops.lead')}</p>
      <div className="mt-3">{body}</div>
    </section>
  );
}
