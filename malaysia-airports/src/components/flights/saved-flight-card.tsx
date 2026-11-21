'use client';

import { getAirport } from '@/content/airports';
import { cn } from '@/lib/cn';
import { formatFlightNumber, type Flight } from '@/lib/flights';
import { useLang, useT } from '@/lib/i18n/client';
import type { JourneyStep } from '@/lib/journey';
import type { SavedFlight } from '@/lib/stores';
import { dateKey, formatDate, formatTime, shiftDateKey, type Instant } from '@/lib/time';
import { pick } from '@/content/values';
import { FlightStatusChip } from '@/components/common/flight-status-chip';
import { LocaleLink } from '@/components/common/locale-link';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Skeleton } from '@/components/ui/skeleton';
import { flightHref } from './flight-row';
import { flightTitle } from './identify-flight';

export interface SavedFlightCardProps {
  saved: SavedFlight;
  /** The flight now, or `null` when it is off the demonstration board. `undefined` while loading. */
  flight: Flight | null | undefined;
  now: Instant | null;
  /** The next step of its journey, when there is one. */
  next?: JourneyStep;
  selected: boolean;
  alertsOn: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

/** A saved flight in My journey: demo status, time, where to go, the next step, and controls. */
export function SavedFlightCard({ saved, flight, now, next, selected, alertsOn, onSelect, onRemove }: SavedFlightCardProps) {
  const t = useT();
  const lang = useLang();
  const airport = getAirport(saved.airport);
  const zone = airport?.timezone;
  const number = formatFlightNumber(saved.number);
  const remove = (
    <IconButton icon="trash-2" label={t('flightPages.journey.remove', { number })} size="sm" variant="quiet" onClick={onRemove} />
  );

  if (!flight) {
    return (
      <li className="rounded-lg border border-line bg-page-subtle p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="type-data-sm text-ink-2">
              {number} <span aria-hidden="true">·</span> {airport?.code ?? saved.airport.toUpperCase()}
            </p>
            <h3 className="type-title-sm mt-1 text-ink-2">{saved.route ?? number}</h3>
            {flight === undefined ? (
              <Skeleton className="mt-3 h-6 w-28" />
            ) : (
              <p className="type-body-sm mt-2 text-ink-2">{t('flightPages.journey.finished')}</p>
            )}
          </div>
          {remove}
        </div>
      </li>
    );
  }

  const today = now === null ? null : dateKey(now, zone);
  const day =
    today === null
      ? formatDate(flight.scheduled, lang, 'weekday', zone)
      : flight.date === today
        ? t('common.labels.today')
        : flight.date === shiftDateKey(today, 1)
          ? t('common.labels.tomorrow')
          : flight.date === shiftDateKey(today, -1)
            ? t('common.labels.yesterday')
            : formatDate(flight.scheduled, lang, 'weekday', zone);
  const moved = Date.parse(flight.estimated) !== Date.parse(flight.scheduled) && flight.status !== 'cancelled';
  const stand = flight.direction === 'd' ? flight.gate : flight.belt;
  const standLabel = flight.direction === 'd' ? t('common.labels.gate') : t('common.labels.belt');

  return (
    <li
      className={cn(
        'relative rounded-lg border bg-surface p-4 transition-colors duration-fast',
        selected ? 'border-ink shadow-sm' : 'border-line-strong hover:border-line-control',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="type-eyebrow text-ink-2">
            {day} <span aria-hidden="true">·</span> {airport?.shortName ?? saved.airport.toUpperCase()}
          </p>
          <h3 className="type-title-md mt-1 text-ink">
            <LocaleLink href={flightHref(flight)} className="link">
              {flightTitle(flight, t)}
            </LocaleLink>
          </h3>
          <p className="type-body-sm mt-0.5 text-ink-2">{flight.airline.name}</p>
        </div>
        <p className="flex shrink-0 flex-col items-end">
          <span className="sr-only">
            {flight.status === 'cancelled'
              ? t('flightPages.times.cancelled', { scheduled: formatTime(flight.scheduled, zone) })
              : moved
                ? t('flightPages.times.moved', { scheduled: formatTime(flight.scheduled, zone), estimated: formatTime(flight.estimated, zone) })
                : t('flightPages.times.onTime', { scheduled: formatTime(flight.scheduled, zone) })}
          </span>
          {moved ? (
            <s aria-hidden="true" className="type-data-sm text-ink-2">
              {formatTime(flight.scheduled, zone)}
            </s>
          ) : null}
          <span aria-hidden="true" className={cn('type-data-lg', flight.status === 'cancelled' ? 'text-ink-2 line-through' : 'text-ink')}>
            {formatTime(moved ? flight.estimated : flight.scheduled, zone)}
          </span>
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <FlightStatusChip status={flight.status} size="sm" />
        <span className="type-body-sm inline-flex items-center gap-1.5 text-ink-2">
          <TerminalBadge terminal={flight.terminal} size="sm" />
          {standLabel} <span className="type-data-sm text-ink">{stand ?? '–'}</span>
          {stand ? null : <span className="sr-only">{flight.direction === 'd' ? t('flights.board.gateNotAssigned') : t('flights.board.beltNotAssigned')}</span>}
        </span>
        {alertsOn ? (
          <Badge tone="neutral" size="sm">
            <Icon name="bell-ring" size="xs" /> {t('flightPages.journey.alertsOn')}
          </Badge>
        ) : null}
      </div>

      {next ? (
        <p className="type-body-sm mt-3 flex flex-wrap items-baseline gap-x-2 border-t border-line pt-3 text-ink">
          <span className="type-eyebrow text-ink-2">{t('flightPages.journey.next')}</span>
          <span className="min-w-0">
            {pick(next.title, lang)}
            {/* Round 2: no second time when the step title already says it ("Board from 10:50"). */}
            {next.time && !pick(next.title, lang).includes(formatTime(next.time, zone)) ? <span className="type-data-sm ml-2 text-ink-2">{formatTime(next.time, zone)}</span> : null}
          </span>
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <Button size="sm" variant={selected ? 'primary' : 'secondary'} iconStart="route" aria-pressed={selected} onClick={onSelect}>
          {t('flightPages.journey.showJourney')}
        </Button>
        {remove}
      </div>
    </li>
  );
}
