'use client';

import { memo } from 'react';
import { getAirport } from '@/content/airports';
import { cn } from '@/lib/cn';
import { formatFlightNumber, remotePlace, type Flight } from '@/lib/flights';
import { useT } from '@/lib/i18n/client';
import { formatTime } from '@/lib/time';
import { AirportCode } from '@/components/common/airport-code';
import { FlightStatusChip } from '@/components/common/flight-status-chip';
import { LocaleLink } from '@/components/common/locale-link';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { IconButton } from '@/components/ui/icon-button';
import { Td, Tr } from '@/components/ui/table';

/** Path of a flight's detail page (no locale prefix): `/kul/flights/mh2610-20261117-d`. */
export function flightHref(flight: Pick<Flight, 'airport' | 'id'>): string {
  return `/${flight.airport}/flights/${flight.id}`;
}

export interface FlightRowProps {
  flight: Flight;
  /**
   * `card`: a stacked row inside a `<ul>` (phones, narrow boards, search results).
   * `table`: a `<tr>` inside the board table.
   */
  layout?: 'card' | 'table';
  /** Show the code of the airport whose board the flight is on (lists that span airports). */
  showAirport?: boolean;
  /** Called when the link to the flight is followed (for closing an overlay). */
  onNavigate?: () => void;
  /** Whether the flight is in My journey. Only used with `onSaveChange`. */
  saved?: boolean;
  /** Show a save toggle (a bookmark button) and report presses. Omit for rows without one. */
  onSaveChange?: (saved: boolean) => void;
  className?: string;
}

/**
 * One flight. Times are mono and tabular; a delayed flight shows the old time struck through
 * beside the new one; a cancelled flight is dimmed and its time struck. Assistive technology
 * hears the times in words ("Scheduled 17:25, now 18:20"; "Cancelled, was 17:25"). The airline is always
 * shown, in both layouts. Place it on the board surface (`FlightBoard` does).
 *
 * Every flight in this prototype is simulated: whatever lists these rows must carry the
 * demonstration label.
 */
function FlightRowView({ flight, layout = 'card', showAirport = false, onNavigate, saved = false, onSaveChange, className }: FlightRowProps) {
  const t = useT();
  const place = remotePlace(flight);
  const moved = flight.estimated !== flight.scheduled;
  const cancelled = flight.status === 'cancelled';
  const number = formatFlightNumber(flight);
  const stand = flight.direction === 'd' ? flight.gate : flight.belt;
  const standLabel = flight.direction === 'd' ? t('common.labels.gate') : t('common.labels.belt');
  const notAssigned = flight.direction === 'd' ? t('flights.board.gateNotAssigned') : t('flights.board.beltNotAssigned');
  const boardAirport = showAirport ? getAirport(flight.airport) : undefined;
  const linkLabel = `${t('flights.search.viewFlight', { number })}, ${place.city}`;
  // The time in words for assistive technology: <s> is not announced (accessibility-03).
  const timeWords = cancelled
    ? t('flightPages.times.cancelled', { scheduled: formatTime(flight.scheduled) })
    : moved
      ? t('flightPages.times.moved', { scheduled: formatTime(flight.scheduled), estimated: formatTime(flight.estimated) })
      : t('flightPages.times.onTime', { scheduled: formatTime(flight.scheduled) });

  const saveButton = onSaveChange ? (
    <IconButton
      icon={saved ? 'bookmark-check' : 'bookmark'}
      label={t('flightPages.board.saveFlight', { number })}
      pressed={saved}
      size="sm"
      variant={saved ? 'secondary' : 'quiet'}
      onClick={() => onSaveChange(!saved)}
      className="relative z-10 shrink-0"
    />
  ) : null;

  const standValue = stand ?? (
    <span className="text-ink-2">
      <span aria-hidden="true">–</span>
      <span className="sr-only">{notAssigned}</span>
    </span>
  );

  if (layout === 'table') {
    return (
      <Tr muted={cancelled} className={className}>
        <Td mono className="whitespace-nowrap">
          <span aria-hidden="true">
            {moved && !cancelled ? (
              <>
                <s className="type-data-md text-ink-2">{formatTime(flight.scheduled)}</s>{' '}
                <span className="type-data-lg text-board-accent">{formatTime(flight.estimated)}</span>
              </>
            ) : cancelled ? (
              <s className="type-data-lg">{formatTime(flight.scheduled)}</s>
            ) : (
              <span className="type-data-lg text-board-accent">{formatTime(flight.scheduled)}</span>
            )}
          </span>
          <span className="sr-only">{timeWords}</span>
        </Td>
        <Td mono className="whitespace-nowrap">
          <LocaleLink
            href={flightHref(flight)}
            aria-label={linkLabel}
            onClick={onNavigate}
            className="rounded-xs underline decoration-line-control decoration-1 underline-offset-4 hover:decoration-current hover:decoration-2"
          >
            {number}
          </LocaleLink>
        </Td>
        <Td className="whitespace-nowrap">
          <span className={cn('font-semibold', cancelled && 'line-through')}>{place.city}</span>{' '}
          <AirportCode code={place.code} size="sm" className="ml-1 text-ink-2" />
        </Td>
        <Td className="text-ink-2">{flight.airline.name}</Td>
        {showAirport ? (
          <Td mono className="whitespace-nowrap">
            {boardAirport ? <AirportCode code={boardAirport.code} name={boardAirport.name} size="sm" /> : null}
          </Td>
        ) : null}
        <Td mono className="whitespace-nowrap">
          <span className="inline-flex items-center gap-2">
            <TerminalBadge terminal={flight.terminal} size="sm" />
            {standValue}
          </span>
        </Td>
        <Td>
          <FlightStatusChip status={flight.status} />
        </Td>
        {saveButton ? <Td className="w-px">{saveButton}</Td> : null}
      </Tr>
    );
  }

  return (
    <li
      className={cn(
        'relative flex gap-3 border-b border-line px-4 py-3 transition-colors duration-fast last:border-b-0 hover:bg-page-subtle has-[a:focus-visible]:focus-ring-inset sm:px-5',
        cancelled && 'text-ink-3',
        className,
      )}
    >
      <p className="flex w-[4.25rem] shrink-0 flex-col">
        <span className="sr-only">{timeWords}</span>
        {moved && !cancelled ? (
          <s aria-hidden="true" className="type-data-sm text-ink-2">
            {formatTime(flight.scheduled)}
          </s>
        ) : null}
        {cancelled ? (
          <s aria-hidden="true" className="type-data-lg">
            {formatTime(flight.scheduled)}
          </s>
        ) : (
          <span aria-hidden="true" className="type-data-lg text-board-accent">
            {formatTime(moved ? flight.estimated : flight.scheduled)}
          </span>
        )}
      </p>
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <div className="min-w-0 grow basis-52">
          <p className="type-title-sm">
            <LocaleLink
              href={flightHref(flight)}
              aria-label={linkLabel}
              onClick={onNavigate}
              className={cn('outline-none after:absolute after:inset-0', cancelled && 'line-through')}
            >
              {place.city}
            </LocaleLink>{' '}
            <AirportCode code={place.code} size="sm" className="ml-1 text-ink-2" />
          </p>
          <p className="type-data-sm mt-0.5 text-ink-2">
            {number} <span aria-hidden="true">·</span> <span className="font-sans">{flight.airline.name}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 @max-lg:basis-full">
          <span className="type-data-md inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            {boardAirport ? <AirportCode code={boardAirport.code} name={boardAirport.name} size="sm" variant="boxed" /> : null}
            <span className="inline-flex items-center gap-1.5">
              <TerminalBadge terminal={flight.terminal} size="sm" />
              {/* Visible on cards: a bare "2" next to an airport code does not say it is a gate. */}
              <span className="type-caption font-sans text-ink-2">{standLabel}</span>
              {standValue}
            </span>
          </span>
          <FlightStatusChip status={flight.status} size="sm" />
        </div>
      </div>
      {saveButton ? <div className="-mr-1.5 flex items-center sm:-mr-2">{saveButton}</div> : null}
    </li>
  );
}

/**
 * Rows are memoised (performance-02): a board refresh or a search re-renders only the rows whose
 * flight changed. Flights are immutable snapshots, so identity is the test. `onSaveChange` is
 * usually a new closure on every render of the list, so only its presence is compared; it is
 * called from a click, never during render.
 */
export const FlightRow = memo(
  FlightRowView,
  (before, after) =>
    before.flight === after.flight &&
    before.layout === after.layout &&
    before.showAirport === after.showAirport &&
    before.saved === after.saved &&
    before.className === after.className &&
    before.onNavigate === after.onNavigate &&
    Boolean(before.onSaveChange) === Boolean(after.onSaveChange),
);
