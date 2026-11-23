'use client';

import { useMemo } from 'react';
import { formatAsOf, pick } from '@/content/values';
import type { Notice, Source, TerminalId } from '@/content/types';
import { cn } from '@/lib/cn';
import { useNow } from '@/lib/hooks/use-now';
import { useLang, useT } from '@/lib/i18n/client';
import { noticesPublishedUpTo, opsStatus, type OpsServiceId, type OpsStatusLine } from '@/lib/providers/demo-operations';
import type { WaitCheckpoint } from '@/lib/providers/types';
import { formatDate } from '@/lib/time';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { Icon, type IconName } from '@/components/ui/icon';
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
  /**
   * `card`: a titled panel (home, transit). `inline`: bare lines inside a journey step. `tiles`
   * (redesign round one, the airport overview): one at-a-glance tile per service, same words.
   */
  variant?: 'card' | 'inline' | 'tiles';
  headingLevel?: 2 | 3;
  className?: string;
}

const SERVICE_ICONS: Record<OpsServiceId, IconName> = {
  aerotrain: 'tram-front',
  'inter-terminal-train': 'train-front',
  'inter-terminal-shuttle': 'bus-front',
  immigration: 'stamp',
};

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
 * Fed by dated notices until a live operations feed exists (OOS-02), so (round 4, re-review
 * 6.1.1) no line carries a "Checked hh:mm" time: a notice line shows the notice's own date, the
 * block says which notices it rests on ("From notices published up to 7 Oct 2026; no live
 * feed"), and a service with no notice says "Status not available", where to check and the
 * official contacts, never "No disruption reported". The clock only decides whether a notice is
 * in effect; it is read with `useNow()`, so the server HTML holds a skeleton of the same height.
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
  // Content only (no clock), so the server HTML already has it.
  const publishedUpTo = noticesPublishedUpTo(notices, airport);
  const basis = publishedUpTo ? t('flightPages.ops.basisDated', { date: formatAsOf(publishedUpTo, lang) }) : t('flightPages.ops.basis');

  const line = (item: OpsStatusLine) => {
    const tone = item.state === 'notice' ? 'warning' : 'info';
    const noticeSources = (item.notice?.sources ?? []).map((id) => sources[id]).filter((source): source is Source => Boolean(source));
    const waits = item.waits.filter((wait) => (checkpoints ?? ['security', 'immigration-departure']).includes(wait.checkpoint));
    return (
      <li key={item.service} data-ops-service={item.service} data-ops-state={item.state} className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="type-body-sm font-semibold text-ink">{pick(item.name, lang)}</p>
          {item.notice?.asOf ? <p className="type-caption text-ink-2">{t('flightPages.ops.noticeDated', { date: formatAsOf(item.notice.asOf, lang) })}</p> : null}
        </div>
        {item.state === 'unknown' ? (
          <p className="type-body-sm flex items-start gap-2 text-ink-2">
            <Icon name="circle-help" size="sm" className="mt-0.5 shrink-0 text-ink" />
            <span>{t('flightPages.ops.unknown')}</span>
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
              {/* Round 6 (9.1 item 6): no "Estimated" chip on a notice; the sources say who reports it. */}
              {item.notice.provenance === 'demo' || item.notice.provenance === 'official' ? <ProvenanceTag provenance={item.notice.provenance} length="short" /> : null}
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
                {/* Round 6 (9.1 item 6): "Security MAIN" at one-terminal airports; only a real terminal is named. */}
                {terminal || item.terminal || wait.terminal === 'MAIN' ? '' : ` ${wait.terminal}`}: <span className="type-data-sm">{t('flightPages.ops.wait', { minutes: wait.minutes })}</span>
              </span>
            ))}
            <DemoMark />
          </div>
        ) : null}
      </li>
    );
  };

  // Where to check, once under the lines rather than on each one (A-14 density).
  const where = lines?.some((item) => item.state === 'unknown') ? (
    <p data-ops-where="" className="type-caption mt-2 text-ink-2">
      {t('flightPages.ops.unknownWhere')}{' '}
      <LocaleLink href={`/${airport}#airport-contacts`} className="link">
        {t('flightPages.ops.contacts')}
      </LocaleLink>
    </p>
  ) : null;

  const body =
    lines === null ? (
      <div role="status" className="flex flex-col gap-2">
        <span className="sr-only">{t('common.labels.loading')}</span>
        {(services ?? ['a', 'b']).map((key) => (
          <Skeleton key={String(key)} className="h-11 w-full" />
        ))}
      </div>
    ) : (
      <>
        <ul className="flex flex-col divide-y divide-line">{lines.map(line)}</ul>
        {where}
      </>
    );

  if (variant === 'tiles') {
    // Redesign round one (critique item 6): never a card stretched around a single pill. A service
    // with a notice gets a full-width alert (amber or blue icon, a 3 px rule on the left, no
    // outline); the queue estimates get a small card of their own; the services with no notice
    // share one compact line ("Status not available" and their names), with where to check.
    const waitsOf = (item: OpsStatusLine) => item.waits.filter((wait) => (checkpoints ?? ['security', 'immigration-departure']).includes(wait.checkpoint));
    const alert = (item: OpsStatusLine) => {
      const noticeSources = (item.notice?.sources ?? []).map((id) => sources[id]).filter((source): source is Source => Boolean(source));
      const warning = item.state === 'notice';
      if (!item.notice) return null;
      return (
        <li
          key={item.service}
          data-ops-service={item.service}
          data-ops-state={item.state}
          className={cn(
            'flex min-w-0 flex-col gap-2 rounded-xl border-l-[3px] bg-surface py-4 pr-4 pl-4 shadow-sm sm:flex-row sm:items-start sm:gap-4 sm:pr-5 sm:pl-5 forced-colors:border',
            warning ? 'border-l-warning-border' : 'border-l-info-border',
          )}
        >
          <span aria-hidden="true" className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', warning ? 'bg-warning-bg text-warning-fg' : 'bg-info-bg text-info-fg')}>
            <Icon name={warning ? 'triangle-alert' : SERVICE_ICONS[item.service]} size="sm" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="type-body font-semibold text-ink">{pick(item.name, lang)}</span>
              {item.notice.asOf ? <span className="type-caption text-ink-2">{t('flightPages.ops.noticeDated', { date: formatAsOf(item.notice.asOf, lang) })}</span> : null}
            </p>
            <p className="type-body-sm text-ink">
              <strong className={cn('font-semibold', warning ? 'text-warning-fg' : 'text-info-fg')}>
                {warning ? t('flightPages.ops.notice') : t('flightPages.ops.planned', { date: item.notice.validFrom ? formatDate(item.notice.validFrom, lang, 'short') : '' })}:
              </strong>{' '}
              {pick(item.notice.title, lang)}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {item.notice.provenance === 'demo' || item.notice.provenance === 'official' ? <ProvenanceTag provenance={item.notice.provenance} length="short" /> : null}
              {noticeSources.length > 0 ? <SourceNote sources={noticeSources} /> : null}
              <LocaleLink href={`/notices#${item.notice.id}`} className="link type-body-sm">
                {t('flightPages.ops.readNotice')}
              </LocaleLink>
            </div>
          </div>
        </li>
      );
    };
    const queue = (item: OpsStatusLine) => {
      const waits = waitsOf(item);
      return (
        <li key={item.service} data-ops-service={item.service} data-ops-state={item.state} className="flex min-w-0 flex-col gap-3 rounded-xl bg-surface p-4 shadow-sm ring-1 ring-line sm:p-5">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fill text-ink">
              <Icon name={SERVICE_ICONS[item.service]} size="sm" />
            </span>
            <p className="min-w-0 flex-1">
              <span className="type-body block font-semibold text-ink">{pick(item.name, lang)}</span>
              {/* Polish 1b (critique-redesign1b item 10): with estimates under it, the line says what they are. */}
              <span className="type-caption text-ink-2">
                {item.state === 'unknown' ? `${t('flightPages.ops.unknown')} · ${t('flightPages.ops.demoEstimates')}` : t('flightPages.ops.waitsLabel')}
              </span>
            </p>
          </div>
          <div className="flex flex-col gap-1.5 rounded-lg bg-page-subtle px-3.5 py-3">
            <span className="flex items-center justify-between gap-2">
              <span className="type-caption font-semibold text-ink-2">{t('flightPages.ops.waitsLabel')}</span>
              <DemoMark />
            </span>
            <ul className="flex flex-col gap-1">
              {waits.map((wait) => (
                // Wraps instead of squeezing: on a narrow card with large text (Malay at 360 px and
                // 125%) the time moves under the checkpoint, so no word breaks mid-word.
                <li key={`${wait.terminal}-${wait.checkpoint}`} className="type-body-sm flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-ink">
                  <span className="min-w-0">
                    {t(`flightPages.ops.checkpoints.${CHECKPOINT_KEYS[wait.checkpoint]}` as 'flightPages.ops.checkpoints.security')}
                    {terminal || item.terminal || wait.terminal === 'MAIN' ? '' : ` ${wait.terminal}`}
                  </span>
                  <span className="type-data-md ml-auto shrink-0 font-semibold whitespace-nowrap">{t('flightPages.ops.wait', { minutes: wait.minutes })}</span>
                </li>
              ))}
            </ul>
          </div>
        </li>
      );
    };
    const alerts = lines?.filter((item) => item.state !== 'unknown' && item.notice) ?? [];
    const queues = lines?.filter((item) => !alerts.includes(item) && waitsOf(item).length > 0) ?? [];
    const quiet = lines?.filter((item) => !alerts.includes(item) && !queues.includes(item)) ?? [];
    return (
      <section id="services-now" aria-label={t('flightPages.ops.title')} className={cn('scroll-mt-32', className)}>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
          <div className="min-w-0">
            <Heading className="type-title-lg text-ink">{t('flightPages.ops.title')}</Heading>
            <p className="type-caption mt-1 max-w-reading text-ink-2">
              {publishedUpTo ? t('flightPages.ops.leadDated', { date: formatAsOf(publishedUpTo, lang) }) : t('flightPages.ops.lead')}
            </p>
          </div>
          <LocaleLink href="/notices" className="link-action type-body-sm text-ink">
            {t('flightPages.ops.allNotices')}
            <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
          </LocaleLink>
        </div>
        <div className="mt-4">
          {lines === null ? (
            <div role="status" className="flex flex-col gap-3">
              <span className="sr-only">{t('common.labels.loading')}</span>
              <div className="grid gap-3 md:grid-cols-2">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
              <Skeleton className="h-5 w-2/3" />
            </div>
          ) : (
            // Polish (critique-redesign2 item 23): the services with a notice or queue estimates are
            // equal cards side by side; the services with no status share one footnote line (it was
            // a grey "Status not available" box with chips that left an empty column).
            <div className="flex flex-col gap-3">
              {alerts.length > 0 || queues.length > 0 ? (
                <ul className={cn('grid items-stretch gap-3', alerts.length + queues.length > 1 && 'md:grid-cols-2')}>
                  {alerts.map(alert)}
                  {queues.map(queue)}
                </ul>
              ) : null}
              {quiet.length > 0 ? (
                <div data-ops-quiet="" className="type-body-sm flex flex-wrap items-center gap-x-1.5 gap-y-1 text-ink-2">
                  <Icon name="circle-help" size="sm" className="shrink-0" />
                  <span className="font-semibold text-ink">{t('flightPages.ops.unknown')}:</span>
                  <ul className="contents">
                    {quiet.map((item, index) => (
                      <li key={item.service} data-ops-service={item.service} data-ops-state={item.state} className="inline">
                        {pick(item.name, lang)}
                        {index < quiet.length - 1 ? ', ' : null}
                        <span className="sr-only">: {t('flightPages.ops.unknown')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {where}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (variant === 'inline')
    return (
      <div className={cn('mt-3 rounded-md border border-line bg-page-subtle px-3.5 py-3', className)}>
        {body}
        <p className="type-caption mt-2 border-t border-line pt-2 text-ink-2">{basis}</p>
      </div>
    );

  return (
    <section aria-label={t('flightPages.ops.title')} className={cn('rounded-lg border border-line-strong bg-surface p-5', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Heading className="type-title-md text-ink">{t('flightPages.ops.title')}</Heading>
        <LocaleLink href="/notices" className="link type-body-sm">
          {t('flightPages.ops.allNotices')}
        </LocaleLink>
      </div>
      <p className="type-caption mt-1 text-ink-2">
        {publishedUpTo ? t('flightPages.ops.leadDated', { date: formatAsOf(publishedUpTo, lang) }) : t('flightPages.ops.lead')}
      </p>
      <div className="mt-3">{body}</div>
    </section>
  );
}
