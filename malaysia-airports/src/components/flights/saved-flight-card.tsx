'use client';

import { getAirport } from '@/content/airports';
import { cn } from '@/lib/cn';
import { formatFlightNumber, type Flight } from '@/lib/flights';
import { useLang, useT } from '@/lib/i18n/client';
import type { StepSummary, TravelDeadline } from '@/lib/journey';
import type { SavedFlight } from '@/lib/stores';
import { dateKey, formatDate, formatTime, shiftDateKey, type Instant } from '@/lib/time';
import { LocaleLink } from '@/components/common/locale-link';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Skeleton } from '@/components/ui/skeleton';
import { flightHref } from './flight-row';
import { AirlineBadge, FlightStatusPill } from './flight-status-pill';
import { flightTitle } from './flight-title';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { DEADLINE_KEYS, StepLine } from './step-line';

export interface SavedFlightCardProps {
  saved: SavedFlight;
  /** The flight now, or `null` when it is off the demonstration board. `undefined` while loading. */
  flight: Flight | null | undefined;
  now: Instant | null;
  /** The step to name ("Now" or "Next"), with a time only when it is still ahead (round 4). */
  next?: StepSummary;
  /** The deadline that still matters for a departure: be at the airport by, check-in closes, boarding (round 4). */
  deadline?: TravelDeadline;
  selected: boolean;
  alertsOn: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

/** A saved flight in My journey: demo status, time, where to go, the next step, and controls. */
export function SavedFlightCard({ saved, flight, now, next, deadline, selected, alertsOn, onSelect, onRemove }: SavedFlightCardProps) {
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
      <li className="rounded-2xl border border-line bg-page-subtle p-4 sm:p-5">
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

  // Redesign round one: a card with a midnight ticket top (the flight, its time and status) and
  // the step that matters next on a warm band under it.
  return (
    <li
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-surface shadow-sm transition-[border-color,box-shadow] duration-base',
        selected ? 'border-ink shadow-lg' : 'border-line hover:shadow-md',
      )}
    >
      <div className="on-media surface-midnight relative px-4 pt-4 pb-4 text-ink sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <AirlineBadge code={flight.airline.code} size="md" className="mt-1" />
            <div className="min-w-0">
              <p className="type-caption font-semibold text-gold-bright">
                {day} <span aria-hidden="true">·</span> {airport?.shortName ?? saved.airport.toUpperCase()}
              </p>
              <h3 className="type-title-md mt-0.5 text-ink">
                <LocaleLink href={flightHref(flight)} className="link">
                  {flightTitle(flight, t)}
                </LocaleLink>
              </h3>
              <p className="type-body-sm mt-0.5 text-ink-2">{flight.airline.name}</p>
            </div>
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
            <span aria-hidden="true" className={cn('type-data-lg', flight.status === 'cancelled' ? 'text-ink-2 line-through' : 'text-board-accent')}>
              {formatTime(moved ? flight.estimated : flight.scheduled, zone)}
            </span>
          </p>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <FlightStatusPill status={flight.status} />
          <span className="type-body-sm inline-flex items-center gap-1.5 text-ink-2">
            <TerminalBadge terminal={flight.terminal} size="sm" />
            {standLabel} <span className="type-data-md font-semibold text-ink">{stand ?? '–'}</span>
            {stand ? null : <span className="sr-only">{flight.direction === 'd' ? t('flights.board.gateNotAssigned') : t('flights.board.beltNotAssigned')}</span>}
          </span>
          {alertsOn ? (
            <Badge tone="neutral" size="sm">
              <Icon name="bell-ring" size="xs" /> {t('flightPages.journey.alertsOn')}
            </Badge>
          ) : null}
        </div>
      </div>

      {deadline || next ? (
        // Redesign round one (critique item 10): a midnight strip with a gold hairline, not the retired ivory band.
        <div className="on-media surface-midnight flex flex-col gap-1.5 border-b border-line px-4 py-3.5 shadow-[inset_0_1px_0_0_var(--color-gold)] sm:px-5">
          {deadline ? (
            <p data-deadline={deadline.kind} className="type-body-sm flex flex-wrap items-center gap-x-2 gap-y-1 text-ink">
              <span className="type-eyebrow text-gold-ink">{t(DEADLINE_KEYS[deadline.kind])}</span>
              <span className="type-data-lg font-semibold">{formatTime(deadline.time, zone)}</span>
              {deadline.provenance === 'estimated' ? <ProvenanceTag provenance="estimated" length="short" /> : null}
            </p>
          ) : null}
          {next ? (
            <p data-next-step={next.when} className="type-body-sm flex flex-wrap items-baseline gap-x-2 text-ink">
              <span className="type-eyebrow text-gold-ink">{next.when === 'now' ? t('flightPages.journey.now') : t('flightPages.journey.next')}</span>
              <span className="min-w-0 font-medium">
                <StepLine summary={next} hideTime={Boolean(deadline && next.time === deadline.time)} />
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5">
        <Button size="sm" variant={selected ? 'primary' : 'secondary'} iconStart="route" aria-pressed={selected} onClick={onSelect}>
          {t('flightPages.journey.showJourney')}
        </Button>
        {remove}
      </div>
    </li>
  );
}
