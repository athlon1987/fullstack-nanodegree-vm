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
import { Icon } from '@/components/ui/icon';
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
}

/**
 * A list of notices with their provenance, period and sources. Whether a notice is in effect,
 * coming up or ended depends on the clock, so that part appears after hydration.
 */
export function NoticeList({ notices, airport, severities, show = 'current', headingLevel = 3, emptyText, linkToAll = false, className }: NoticeListProps) {
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

  const stateLabel: Record<NoticeViewState, string> = { active: t('notices.active'), upcoming: t('notices.upcoming'), expired: t('noticesPage.ended') };

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
      ) : (
        <ul className="flex flex-col gap-4">
          {ordered.map(({ notice, state }) => (
            <li key={notice.id} id={notice.id} className={cn('scroll-mt-28', state === 'expired' && 'opacity-75')}>
              <NoticeCard
                severity={notice.severity}
                title={notice.title}
                provenance={notice.provenance}
                scope={notice.scope ?? t('noticesPage.network')}
                headingLevel={headingLevel}
                period={
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {state ? (
                      <Chip tone={state === 'active' ? 'outline' : 'neutral'} icon={state === 'active' ? 'circle-dot' : state === 'upcoming' ? 'calendar-days' : 'history'}>
                        {stateLabel[state]}
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
