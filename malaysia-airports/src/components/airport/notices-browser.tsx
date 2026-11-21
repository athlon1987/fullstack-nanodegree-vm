'use client';

import { useState } from 'react';
import { getAirport } from '@/content/airports';
import { NOTICE_SEVERITIES } from '@/content/values';
import type { NoticeSeverity } from '@/content/types';
import { useT } from '@/lib/i18n/client';
import { FilterChip } from '@/components/ui/filter-chip';
import { NativeSelect } from '@/components/ui/native-select';
import { NoticeList } from './notice-list';
import type { NoticeView } from './notice-utils';

/**
 * The notices page body: every notice from the content layer, filterable by airport and by
 * severity. Ended notices stay visible, marked as ended.
 */
export function NoticesBrowser({ notices }: { notices: readonly NoticeView[] }) {
  const t = useT();
  const [airport, setAirport] = useState('');
  const [severities, setSeverities] = useState<readonly NoticeSeverity[]>([]);
  const airports = [...new Set(notices.flatMap((notice) => (notice.airport ? [notice.airport] : [])))];
  const present = NOTICE_SEVERITIES.filter((severity) => notices.some((notice) => notice.severity === severity));

  return (
    <div className="flex flex-col gap-6">
      <form aria-label={t('noticesPage.filtersLabel')} onSubmit={(event) => event.preventDefault()} className="grid gap-x-8 gap-y-4 rounded-lg border border-line bg-page-subtle p-4 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] sm:p-5">
        <NativeSelect label={t('common.labels.airport')} value={airport} onChange={(event) => setAirport(event.target.value)} iconStart="tower-control">
          <option value="">{t('search.everywhere')}</option>
          <option value="network">{t('noticesPage.network')}</option>
          {airports.map((slug) => {
            const record = getAirport(slug);
            return (
              <option key={slug} value={slug}>
                {record ? `${record.shortName} (${record.code})` : slug.toUpperCase()}
              </option>
            );
          })}
        </NativeSelect>
        <fieldset className="min-w-0">
          <legend className="type-body-sm mb-1.5 font-semibold text-ink">{t('noticesPage.severity')}</legend>
          <div className="flex flex-wrap gap-2">
            {present.map((severity) => (
              <FilterChip
                key={severity}
                pressed={severities.includes(severity)}
                onPressedChange={(pressed) => setSeverities((current) => (pressed ? [...current, severity] : current.filter((item) => item !== severity)))}
              >
                {t(`notices.severity.${severity}`)}
              </FilterChip>
            ))}
          </div>
        </fieldset>
      </form>
      <NoticeList notices={notices} airport={airport || undefined} severities={severities} show="all" headingLevel={2} emptyText={t('noticesPage.none')} />
    </div>
  );
}
