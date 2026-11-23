'use client';

import type { ReactNode } from 'react';
import { formatAsOf } from '@/content/values';
import type { Source } from '@/content/types';
import { formatList } from '@/lib/format';
import { useLang, useT } from '@/lib/i18n/client';
import { NotPublished } from '@/components/common/not-published';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/time';
import type { Side } from '@/components/map/map-logic';
import type { FacilityView, HoursView } from './facility-view';

/** Opening hours in words, or "Not published". */
export function HoursValue({ hours }: { hours: HoursView | undefined }) {
  const t = useT();
  if (!hours) return <NotPublished />;
  const main =
    hours.kind === 'text'
      ? hours.text
      : hours.kind === '24h'
        ? t('common.labels.open24Hours')
        : t('mapPages.details.daily', { open: hours.open, close: hours.close });
  const note = hours.kind === 'text' ? undefined : hours.note;
  return (
    <span className="block">
      <span className={hours.kind === 'daily' ? 'tabular' : undefined}>{main}</span>
      {note ? <span className="type-body-sm mt-0.5 block font-normal text-ink-2">{note}</span> : null}
    </span>
  );
}

/** Accessibility as the source states it, or "Not published". */
export function AccessibleValue({ accessible }: { accessible: boolean | undefined }) {
  const t = useT();
  if (accessible === undefined) return <NotPublished />;
  return <span>{accessible ? t('mapPages.details.accessibleYes') : t('mapPages.details.accessibleNo')}</span>;
}

/** Which side of security, in words. `unknown` reads "Not published". */
export function AreaValue({ side }: { side: Side }) {
  const t = useT();
  if (side === 'unknown') return <NotPublished />;
  return <span>{t(`mapPages.area.${side}`)}</span>;
}

export interface Fact {
  label: string;
  /** Undefined when the source does not publish it. */
  value?: ReactNode;
}

/**
 * Published facts as rows, then one row naming everything that is not published, so a sparse
 * record reads as one honest line instead of a column of "Not published".
 */
export function FactList({ facts, className }: { facts: readonly Fact[]; className?: string }) {
  const lang = useLang();
  const present = facts.filter((fact) => fact.value !== undefined && fact.value !== null && fact.value !== '');
  const missing = facts.filter((fact) => !present.includes(fact)).map((fact) => fact.label);
  const row = 'grid gap-x-4 gap-y-0.5 py-2 sm:py-2.5 @sm:grid-cols-[7.5rem_minmax(0,1fr)]';
  // Polish (critique-redesign2 item 13): when nothing is published, one quiet line, no well (a grey
  // well holding only "Not published" was the loudest thing on half the cards).
  if (present.length === 0 && missing.length > 0) {
    return (
      <p className={cn('type-body-sm flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-2', className)}>
        <NotPublished />
        <span className="min-w-0">{formatList(missing, lang)}</span>
      </p>
    );
  }
  // Redesign stage two: the facts in a soft well (where, when, who for), rows split by hairlines.
  return (
    <div className={cn('@container', className)}>
      <dl className="divide-y divide-line rounded-xl bg-page-subtle px-4">
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

/** "As of 16 November 2026" for a date; months and years ("2023-10") in words too (D-12 as-of format). */
export function AsOf({ value, className }: { value: string; className?: string }) {
  const t = useT();
  const lang = useLang();
  const text = t('freshness.asOf', { date: /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDate(value, lang) : formatAsOf(value, lang) });
  return <p className={cn('type-caption py-2 text-ink-2', className)}>{text}</p>;
}

/** Resolve source ids against a lookup, dropping unknown ids and duplicates. */
export function sourcesFor(ids: readonly string[], lookup: Readonly<Record<string, Source>>): Source[] {
  return [...new Set(ids)].map((id) => lookup[id]).filter((source): source is Source => source !== undefined);
}

export type { FacilityView };
