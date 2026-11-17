'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatList } from '@/lib/format';
import { useLang, useT } from '@/lib/i18n/client';
import { formatDate } from '@/lib/time';
import { NotPublished } from '@/components/common/not-published';
import type { HoursView } from './commerce-view';

export interface FactRow {
  label: string;
  /** Undefined when the source does not publish it. */
  value?: ReactNode;
}

/**
 * Published facts as label and value rows, then ONE row naming everything that is not
 * published, so a sparse record reads as one honest line instead of a column of gaps.
 */
export function FactRows({ facts, className, wide = false }: { facts: readonly FactRow[]; className?: string; wide?: boolean }) {
  const lang = useLang();
  const present = facts.filter((fact) => fact.value !== undefined && fact.value !== null && fact.value !== '');
  const missing = facts.filter((fact) => !present.includes(fact)).map((fact) => fact.label);
  const row = cn('grid gap-x-4 gap-y-0.5 py-2.5', wide ? '@md:grid-cols-[10rem_minmax(0,1fr)]' : '@sm:grid-cols-[7.5rem_minmax(0,1fr)]');
  return (
    <div className={cn('@container', className)}>
      <dl className="divide-y divide-line border-y border-line">
        {present.map((fact) => (
          <div key={fact.label} className={row}>
            <dt className="type-body-sm text-ink-2">{fact.label}</dt>
            <dd className="type-body-sm min-w-0 font-medium text-ink">{fact.value}</dd>
          </div>
        ))}
        {missing.length > 0 ? (
          <div className={row}>
            <dt>
              <NotPublished />
            </dt>
            <dd className="type-body-sm min-w-0 text-ink-2">{formatList(missing, lang)}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

/** Opening hours in words. Prose hours are shown as published. */
export function HoursText({ hours }: { hours: HoursView }) {
  const t = useT();
  const main =
    hours.kind === 'text'
      ? hours.text
      : hours.kind === '24h'
        ? t('common.labels.open24Hours')
        : t('commercePages.hoursDaily', { open: hours.open, close: hours.close });
  const note = hours.kind === 'text' ? undefined : hours.note;
  return (
    <span className="block">
      <span className={hours.kind === 'daily' ? 'tabular' : undefined}>{main}</span>
      {note ? <span className="type-body-sm mt-0.5 block font-normal text-ink-2">{note}</span> : null}
    </span>
  );
}

/** "As of 16 November 2026" for a date, or the source's own wording ("Listing undated"). */
export function AsOfText({ value, className }: { value: string; className?: string }) {
  const t = useT();
  const lang = useLang();
  const month = /^(\d{4})-(\d{2})$/.exec(value);
  const text = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? t('freshness.asOf', { date: formatDate(value, lang) })
    : month
      ? t('freshness.asOf', { date: formatMonth(Number(month[1]), Number(month[2]), lang) })
      : value;
  return <p className={cn('type-caption py-2 text-ink-2', className)}>{text}</p>;
}

/** "November 2024" from a year and a month, without reading the clock. */
function formatMonth(year: number, month: number, lang: string): string {
  return new Intl.DateTimeFormat(lang === 'ms' ? 'ms-MY' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
}
