'use client';

import type { NoticeSeverity } from '@/content/types';
import { cn } from '@/lib/cn';
import { useNow } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { formatDate } from '@/lib/time';
import { LocaleLink } from '@/components/common/locale-link';
import { NoticeCard } from '@/components/common/notice-card';
import { SourceNote } from '@/components/common/source-note';
import { TranslationNotice } from '@/components/common/translation-notice';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { noticeViewState, sortNoticeViews, type NoticeView, type NoticeViewState } from './notice-utils';

export interface NoticeListProps {
  /** Full notice views (with body and sources) from `toNoticeViews(notices, lang)`. */
  notices: readonly NoticeView[];
  /** Only these airports' notices (slug), `network` for network-wide ones. Omit for all. */
  airport?: string | 'network';
  /** Only these severities. Empty or omitted means all. */
  severities?: readonly NoticeSeverity[];
  /** `current` hides notices that have ended (airport pages); `all` shows them, marked "Ended" (the notices page). */
  show?: 'current' | 'all';
  headingLevel?: 2 | 3;
  /** Shown when nothing matches. */
  emptyText: string;
  /** Add a link to the full notices page under the list. */
  linkToAll?: boolean;
  className?: string;
  /** Classes for the list itself, for example a two-column grid on wide pages. */
  listClassName?: string;
  /**
   * Redesign round one (the airport overview): one line per notice (its severity, title and
   * whether it is in effect), the body, period, provenance and sources behind a disclosure.
   */
  compact?: boolean;
}

/** Severity as icon and colour for the compact list (words go with it: the title and the state). */
const SEVERITY_BADGE: Record<NoticeSeverity, { badge: string; icon: IconName }> = {
  info: { badge: 'bg-info-bg text-info-fg', icon: 'info' },
  advisory: { badge: 'bg-fill text-ink', icon: 'megaphone' },
  warning: { badge: 'bg-warning-bg text-warning-fg', icon: 'triangle-alert' },
  critical: { badge: 'bg-critical-bg text-critical-fg', icon: 'octagon-alert' },
};

/**
 * A list of notices with their provenance, period and sources. Whether a notice is in effect,
 * coming up or ended depends on the clock, so that part appears after hydration.
 */
export function NoticeList({ notices, airport, severities, show = 'current', headingLevel = 3, emptyText, linkToAll = false, className, listClassName, compact = false }: NoticeListProps) {
  const t = useT();
  const lang = useLang();
  const now = useNow();

  const matching = sortNoticeViews(
    notices.filter((notice) => {
      if (airport === 'network' ? Boolean(notice.airport) : airport ? notice.airport !== airport : false) return false;
      return !severities?.length || severities.includes(notice.severity);
    }),
  );
  const withState = matching.map((notice) => ({ notice, state: now === null ? null : noticeViewState(notice, now) }));
  const visible = withState.filter(({ state }) => show === 'all' || state !== 'expired');
  // On the full page, ended notices sink to the bottom.
  const ordered = [...visible].sort((a, b) => Number(a.state === 'expired') - Number(b.state === 'expired'));
  const untranslated = ordered.some(({ notice }) => !notice.translated);

  const period = (notice: NoticeView): string => {
    const from = notice.validFrom ? formatDate(notice.validFrom, lang, 'medium') : null;
    const to = notice.validTo ? formatDate(notice.validTo, lang, 'medium') : null;
    if (from && to) return t('noticesPage.period', { from, to });
    if (from) return t('notices.from', { date: from });
    if (to) return t('notices.until', { date: to });
    return t('notices.untilFurtherNotice');
  };

  const stateLabel = (notice: NoticeView, state: NoticeViewState): string =>
    state === 'announced' && notice.appliesFrom
      ? t('notices.announced', { date: formatDate(notice.appliesFrom, lang, 'long') })
      : { active: t('notices.active'), announced: t('notices.active'), upcoming: t('notices.upcoming'), expired: t('noticesPage.ended') }[state];

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {untranslated ? <TranslationNotice /> : null}
      <p role="status" className="sr-only">
        {t.count('noticesPage.shown', ordered.length)}
      </p>
      {ordered.length === 0 ? (
        <p className="type-body flex items-start gap-2.5 rounded-lg border border-line bg-page-subtle p-4 text-ink-2">
          <Icon name="circle-check" className="mt-0.5 text-ink-3" />
          {emptyText}
        </p>
      ) : compact ? (
        <ul className={cn('flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm', listClassName)}>
          {ordered.map(({ notice, state }) => {
            const Heading = `h${headingLevel}` as 'h2' | 'h3';
            const badge = SEVERITY_BADGE[notice.severity];
            return (
              <li key={notice.id} id={notice.id} className={cn('scroll-mt-28 border-b border-line last:border-b-0', state === 'expired' && 'opacity-75')}>
                <article data-severity={notice.severity}>
                  <details className="group/notice">
                    <summary className="flex min-h-16 cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 transition-colors duration-fast hover:bg-page-subtle focus-visible:focus-ring-inset sm:flex-nowrap sm:px-5 [&::-webkit-details-marker]:hidden">
                      <span aria-hidden="true" className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', badge.badge)}>
                        <Icon name={badge.icon} size="sm" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1 basis-48">
                        <span className="type-caption block text-ink-2">
                          {t(`notices.severity.${notice.severity}`)} · {notice.scope ?? t('noticesPage.network')}
                        </span>
                        <Heading className="type-body font-semibold text-ink">{notice.title}</Heading>
                      </span>
                      {state ? (
                        <Chip
                          tone={state === 'active' ? 'outline' : 'neutral'}
                          icon={state === 'active' ? 'circle-dot' : state === 'upcoming' || state === 'announced' ? 'calendar-days' : 'history'}
                          className="max-sm:order-last max-sm:ml-12"
                        >
                          {stateLabel(notice, state)}
                        </Chip>
                      ) : null}
                      <Icon name="chevron-down" size="sm" strokeWidth={2} className="shrink-0 text-ink-2 transition-transform duration-fast group-open/notice:rotate-180" />
                    </summary>
                    <div className="flex flex-col gap-3 border-t border-line bg-page-subtle px-4 py-4 sm:px-5 sm:pl-[4.25rem]">
                      {notice.body ? <div className="type-body-sm max-w-reading text-ink-2 sm:text-base">{notice.body}</div> : null}
                      <p className="type-data-sm flex flex-wrap items-center gap-x-3 gap-y-1.5 text-ink-2">
                        <span>{period(notice)}</span>
                        {notice.provenance === 'demo' || notice.provenance === 'official' ? <ProvenanceTag provenance={notice.provenance} length="short" /> : null}
                      </p>
                      {notice.sources?.length ? <SourceNote sources={notice.sources} /> : null}
                    </div>
                  </details>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className={cn('flex flex-col gap-4', listClassName)}>
          {ordered.map(({ notice, state }) => (
            <li key={notice.id} id={notice.id} className={cn('scroll-mt-28', state === 'expired' && 'opacity-75')}>
              <NoticeCard
                severity={notice.severity}
                title={notice.title}
                // Round 6 (third review 9.1 item 6): no "Estimated" chip on a notice; its sources say
                // who reports it. Demonstration notices keep their label, official ones theirs.
                provenance={notice.provenance === 'demo' || notice.provenance === 'official' ? notice.provenance : undefined}
                scope={notice.scope ?? t('noticesPage.network')}
                headingLevel={headingLevel}
                period={
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {state ? (
                      <Chip tone={state === 'active' ? 'outline' : 'neutral'} icon={state === 'active' ? 'circle-dot' : state === 'upcoming' || state === 'announced' ? 'calendar-days' : 'history'}>
                        {stateLabel(notice, state)}
                      </Chip>
                    ) : null}
                    <span>{period(notice)}</span>
                  </span>
                }
                footer={notice.sources?.length ? <SourceNote sources={notice.sources} /> : undefined}
              >
                {notice.body}
              </NoticeCard>
            </li>
          ))}
        </ul>
      )}
      {linkToAll ? (
        <p>
          <LocaleLink href="/notices" className="link-action text-ink">
            {t('notices.viewAll')}
            <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
          </LocaleLink>
        </p>
      ) : null}
    </div>
  );
}
