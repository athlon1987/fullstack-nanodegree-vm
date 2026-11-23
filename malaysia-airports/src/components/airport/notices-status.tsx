'use client';

import { useLang, useT } from '@/lib/i18n/client';
import { useNow } from '@/lib/hooks';
import { formatNumber } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { noticeViewState, type NoticeView } from './notice-utils';

const ROWS = [
  { key: 'now', label: 'notices.active' },
  { key: 'upcoming', label: 'notices.upcoming' },
  { key: 'ended', label: 'noticesPage.ended' },
] as const;

/**
 * Polish (critique-redesign2 items 3 and 17): the notices page's key answer in the header's right
 * column, how many notices are in effect now, coming up and ended. Whether a notice is current
 * depends on the clock, so the counts arrive after hydration; until then each row holds its place
 * with a skeleton figure of the same height (no layout shift). The states map as the list's do:
 * an announced notice reads "In effect now".
 */
export function NoticesStatus({ notices }: { notices: readonly NoticeView[] }) {
  const t = useT();
  const lang = useLang();
  const now = useNow(60_000);
  const counts = now === null ? null : { now: 0, upcoming: 0, ended: 0 };
  if (counts && now !== null) {
    for (const notice of notices) {
      const state = noticeViewState(notice, now);
      counts[state === 'expired' ? 'ended' : state === 'upcoming' ? 'upcoming' : 'now'] += 1;
    }
  }
  return (
    <section aria-labelledby="notices-status-title" data-notices-status="" className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <h2 id="notices-status-title" className="type-title-md text-ink">
        {t('noticesPage.statusTitle')}
      </h2>
      <dl className="mt-3 grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-line">
        {ROWS.map((row) => (
          <div key={row.key} className="flex min-w-0 flex-col-reverse justify-end gap-0.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-2.5">
            <dt className="type-body-sm text-ink-2">{t(row.label)}</dt>
            <dd className="type-display-sm h-[1.15em] text-ink tabular-nums">
              {counts ? formatNumber(counts[row.key], lang) : <Skeleton className="inline-block h-[0.9em] w-7 align-middle" />}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
