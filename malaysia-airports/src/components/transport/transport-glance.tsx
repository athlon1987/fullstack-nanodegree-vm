'use client';

import { useMemo } from 'react';
import { pick } from '@/content/values';
import type { TransportMode } from '@/content/types';
import { useNow } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { dateKey } from '@/lib/time';
import { compareTransport } from '@/lib/transport';
import { Icon } from '@/components/ui/icon';
import { fareInfo, optionsForDay, placeChoices, placeKey } from './transport-logic';
import type { PlannerData } from './transport-types';
import { DurationValue, FareFigure, FareTimeline } from './transport-values';

/**
 * Scheduled services only: a ticketed train, coach or shuttle fare is the same for everyone and
 * needs no anti-touting advice, so it can be answered before the warning (C-02 stays true: the
 * warning still precedes every taxi and e-hailing option).
 */
const GLANCE_MODES: readonly TransportMode[] = ['rail', 'bus', 'shuttle'];
/** At most this many rows: the answer, not a second planner. */
const GLANCE_ROWS = 2;

/**
 * Round 4 (6.1.6, answer first): the cheapest published scheduled fares to the most widely served
 * place, at the top of the transport page, above the touting warning and the planner. Each row
 * names the option, today's fare (or every dated fare before the clock is read), the journey time
 * and the next fare change, and links to the option's full card with its sources. Renders nothing
 * when no scheduled option publishes a fare for that place.
 */
export function TransportGlance({ context, options }: PlannerData) {
  const t = useT();
  const lang = useLang();
  const now = useNow(60_000);
  const day = now === null ? null : dateKey(now, context.timezone);
  const place = useMemo(() => placeChoices(options)[0], [options]);

  const rows = useMemo(() => {
    if (!place) return [];
    const scheduled = options.filter((option) => GLANCE_MODES.includes(option.mode));
    const byId = new Map(scheduled.map((option) => [option.id, option]));
    return compareTransport(optionsForDay(scheduled, day), { priority: 'price', destination: place.value })
      .filter((row) => row.fare !== undefined && !row.labels.includes('destination-not-listed'))
      .slice(0, GLANCE_ROWS)
      .map((row) => byId.get(row.option.id) ?? row.option);
  }, [options, day, place]);

  if (!place || rows.length === 0) return null;
  const key = placeKey(place.value);
  const placeName = pick(place.name, lang);

  return (
    <section aria-labelledby="transport-glance-title" data-transport-glance="" className="rounded-xl border border-line-strong bg-surface p-4 shadow-xs sm:p-5">
      <h2 id="transport-glance-title" className="type-title-md text-ink">
        {t('transportPages.glance.title', { destination: placeName })}
      </h2>
      <ul className="mt-3 flex flex-col divide-y divide-line">
        {rows.map((option) => {
          const info = fareInfo(option, key, day);
          return (
            <li key={option.id} className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
              <div className="flex min-w-0 flex-1 basis-56 items-start gap-3">
                <Icon name={option.mode} className="mt-0.5 shrink-0 text-ink-2" />
                <div className="min-w-0">
                  <a href={`#transport-${option.id}`} className="link type-body font-semibold text-ink">
                    {pick(option.name, lang)}
                  </a>
                  <p className="type-body-sm mt-0.5 flex flex-wrap items-center gap-x-1.5 text-ink-2">
                    <span>{t('transportPages.glance.time')}</span>
                    <DurationValue info={info} shortLabel />
                  </p>
                  <FareTimeline info={info} context={context} compact />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <FareFigure info={info} context={context} size="lg" shortLabel />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="type-caption mt-3 text-ink-2">{t('transportPages.glance.note')}</p>
    </section>
  );
}
