'use client';

import { useMemo } from 'react';
import { pick } from '@/content/values';
import type { Lang, Money, TransportMode } from '@/content/types';
import { cn } from '@/lib/cn';
import { useNow } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import type { Translator } from '@/lib/i18n/translate';
import { dateKey } from '@/lib/time';
import { compareTransport } from '@/lib/transport';
import { NotPublished } from '@/components/common/not-published';
import { Icon } from '@/components/ui/icon';
import { fareInfo, optionsForDay, placeChoices, placeKey, type FareInfo, type FarePeriod } from './transport-logic';
import type { PlannerData, TransportContext } from './transport-types';
import { dayLabel, DurationValue, moneyText } from './transport-values';

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
 * names the option, its fare, the journey time and its dated fares, and links to the option's
 * full card with its sources. Renders nothing when no scheduled option publishes a fare for that
 * place.
 *
 * Round 5 (polish package):
 * - **No layout shift when the clock is read** (desktop CLS 0.019 to 0.022 of the page's 0.020 to
 *   0.022). Before, the row listed every dated fare and grew by two lines once React knew today's
 *   date. Now it has the same shape before and after: one figure (before the clock, the lowest
 *   dated fare as "from RM 55"; after, today's fare), with its width reserved for the widest
 *   figure it can show, and one line per dated fare (before the clock, each fare with its dates;
 *   after, which applies today, which comes next and which has ended).
 * - **The fare beside the option's name at every width**: a grid instead of a wrapping flex row,
 *   so at 125% text on a phone the figure no longer drops below the name, time and dates (Malay:
 *   881 px, under the 844 px screen).
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
            <li key={option.id} data-glance-row="" className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 py-3 first:pt-0 last:pb-0">
              <Icon name={option.mode} className="mt-0.5 text-ink-2" />
              <div className="min-w-0">
                <a href={`#transport-${option.id}`} className="link type-body font-semibold text-ink">
                  {pick(option.name, lang)}
                </a>
                <p className="type-body-sm mt-0.5 flex flex-wrap items-center gap-x-1.5 text-ink-2">
                  <span>{t('transportPages.glance.time')}</span>
                  <DurationValue info={info} shortLabel />
                </p>
              </div>
              <GlanceFigure info={info} lang={lang} t={t} />
              <GlanceFareLines info={info} day={day} context={context} lang={lang} t={t} />
            </li>
          );
        })}
      </ul>
      <p className="type-caption mt-3 text-ink-2">{t('transportPages.glance.note')}</p>
    </section>
  );
}

const fareOf = (period: FarePeriod): Money | undefined => period.destination.fare;

/** A figure in parts: the amount, and the words around it ("from RM 55": prefix "from "). */
interface Figure {
  prefix?: string;
  amount: string;
  suffix?: string;
  basis?: string;
}

/** "from {amount}" in the page language, split around the amount so the amount can stay where it is. */
function aroundAmount(t: Translator, amount: string): Pick<Figure, 'prefix' | 'amount' | 'suffix'> {
  const marker = '\u0000';
  const [prefix = '', suffix = ''] = t('transportPages.fare.from', { amount: marker }).split(marker);
  return { prefix: prefix || undefined, amount, suffix: suffix || undefined };
}

/**
 * The row's figure. Before the clock is read a dated place shows its lowest fare as "from RM 55"
 * (true on any date; the lines under it say which fare applies when), never one period's fare as
 * if it were today's. Nothing moves when the clock is read: the cell is as wide as the widest
 * figure it can show, it fills that width with its text aligned right, and the amount is its own
 * element, so dropping "from " leaves "RM 55" where it was (a right-aligned figure that changed
 * from "from RM 55" to "RM 55" moved by the difference: 0.0007 to 0.0011 of layout shift on a phone).
 */
function GlanceFigure({ info, lang, t }: { info: FareInfo; lang: Lang; t: Translator }) {
  if (!info.place || info.doorToDoor) return <NotPublished />;
  const fares = info.place.periods.map(fareOf).filter((fare): fare is Money => fare !== undefined);
  const texts = fares.map((fare) => moneyText(fare, lang, t));
  let figure: Figure | undefined;
  let before: Figure | undefined;
  if (info.dated && fares.length > 0) {
    const lowest = fares.reduce((low, fare) => (fare.amount < low.amount ? fare : low));
    const lowestText = moneyText(lowest, lang, t);
    const bases = new Set(texts.map((text) => text.basis));
    before = {
      ...(lowest.amount === 0 || lowest.basis === 'from' ? { amount: lowestText.amount } : aroundAmount(t, lowestText.amount)),
      basis: bases.size === 1 ? texts[0].basis : undefined,
    };
    if (!info.status) figure = before;
  }
  if (!figure && info.shown?.fare) figure = moneyText(info.shown.fare, lang, t);
  // Width reserved for the widest figure this row can show (a monospaced face: length in characters).
  const reserve = [before ? `${before.prefix ?? ''}${before.amount}${before.suffix ?? ''}` : undefined, ...texts.map((text) => text.amount)]
    .filter((text): text is string => Boolean(text))
    .reduce((wide, text) => (text.length > wide.length ? text : wide), '');
  return (
    <div data-glance-figure="" className="grid text-right">
      {reserve ? <span aria-hidden="true" data-reserve={reserve} className="type-data-lg invisible col-start-1 row-start-1 h-0 overflow-hidden before:content-[attr(data-reserve)]" /> : null}
      <span className="col-start-1 row-start-1 flex flex-col">
        {figure ? (
          <>
            <span className="type-data-lg text-ink">
              {figure.prefix ? <span>{figure.prefix}</span> : null}
              <span>{figure.amount}</span>
              {figure.suffix ? <span>{figure.suffix}</span> : null}
            </span>
            {figure.basis ? <span className="type-caption text-ink-2">{figure.basis}</span> : null}
          </>
        ) : (
          <NotPublished className="justify-end" />
        )}
      </span>
    </div>
  );
}

/**
 * One line per dated fare, the same number of lines before and after the clock is read. Before:
 * each fare with its dates. After: the one that applies today, the ones still to come and the
 * ones that have ended. Nothing for a place without dated fares.
 */
function GlanceFareLines({ info, day, context, lang, t }: { info: FareInfo; day: string | null; context: TransportContext; lang: Lang; t: Translator }) {
  if (!info.dated || !info.place) return null;
  const status = info.status;
  const date = (key: string) => dayLabel(key, lang, context.timezone, 'medium');
  const amountOf = (period: FarePeriod) => {
    const fare = fareOf(period);
    return fare ? moneyText(fare, lang, t).amount : t('transportPages.fare.notPublished');
  };
  return (
    <ul data-glance-periods="" className="col-span-2 col-start-2 mt-2 flex flex-col gap-1">
      {info.place.periods.map((period) => {
        const amount = amountOf(period);
        let tone: 'positive' | 'neutral' = 'neutral';
        let text: string;
        if (status && period === status.current) {
          tone = 'positive';
          text = period.until ? t('transportPages.fare.todayShort', { date: date(period.until) }) : t('transportPages.fare.appliesToday');
        } else if (status && period === status.expired && period.until) {
          text = t('transportPages.fare.expired', { date: date(period.until) });
        } else if (status && day !== null && period.until && period.until < day) {
          text = t('transportPages.glance.periodEnded', { amount, date: date(period.until) });
        } else if (period.from) {
          text = t('transportPages.fare.upcomingShort', { amount, date: date(period.from) });
        } else if (period.until) {
          text = t('transportPages.glance.periodUntil', { amount, date: date(period.until) });
        } else {
          text = amount;
        }
        return (
          <li key={period.from ?? period.until ?? 'any'} className={cn('type-caption flex items-start gap-1.5', tone === 'positive' ? 'text-positive-fg' : 'text-ink-2')}>
            <Icon name={tone === 'positive' ? 'circle-check' : 'calendar-days'} size="xs" className="mt-0.5 shrink-0" />
            {text}
          </li>
        );
      })}
    </ul>
  );
}
