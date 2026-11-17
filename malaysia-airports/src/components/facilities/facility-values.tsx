'use client';

import type { Source } from '@/content/types';
import { useT } from '@/lib/i18n/client';
import { NotPublished } from '@/components/common/not-published';
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

/** Resolve source ids against a lookup, dropping unknown ids and duplicates. */
export function sourcesFor(ids: readonly string[], lookup: Readonly<Record<string, Source>>): Source[] {
  return [...new Set(ids)].map((id) => lookup[id]).filter((source): source is Source => source !== undefined);
}

export type { FacilityView };
