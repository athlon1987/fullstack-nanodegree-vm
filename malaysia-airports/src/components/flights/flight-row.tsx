'use client';

import { memo } from 'react';
import { getAirport, localizeAirport } from '@/content/airports';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui/icon';
import { formatFlightNumber, placeCity, remotePlace, type Flight } from '@/lib/flights';
import { useT } from '@/lib/i18n/client';
import { dateKey, formatDate, formatTime, shiftDateKey, type Instant } from '@/lib/time';
import type { Translator } from '@/lib/i18n/translate';
import { AirportCode } from '@/components/common/airport-code';
import { LocaleLink } from '@/components/common/locale-link';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { IconButton } from '@/components/ui/icon-button';
import { Td, Tr } from '@/components/ui/table';
import { AirlineBadge, FlightStatusPill } from './flight-status-pill';

/**
 * The day of the time a row shows, when it is not today at the airport: "Tomorrow", "Yesterday"
 * or the date (round 4, gallery note 2: Ipoh's preview listed 11:40, 15:30, then a 09:25 that was
 * the next morning, with no date). `undefined` for today.
 */
export function rowDayLabel(flight: Pick<Flight, 'scheduled' | 'estimated' | 'status' | 'airport'>, now: Instant, t: Translator): string | undefined {
  const zone = getAirport(flight.airport)?.timezone;
  const shown = flight.status === 'cancelled' ? flight.scheduled : flight.estimated;
  const day = dateKey(shown, zone);
  const today = dateKey(now, zone);
  if (day === today) return undefined;
  if (day === shiftDateKey(today, 1)) return t('common.labels.tomorrow');
  if (day === shiftDateKey(today, -1)) return t('common.labels.yesterday');
  return formatDate(shown, t.lang, 'short', zone);
}

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
  /** The day of the time shown when it is not today ("Tomorrow"), from `rowDayLabel`. */
  day?: string;
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
function FlightRowView({ flight, layout = 'card', showAirport = false, onNavigate, saved = false, onSaveChange, day, className }: FlightRowProps) {
  const t = useT();
  const remote = remotePlace(flight);
  // City in the page language (D-09, round 2).
  const place = { ...remote, city: placeCity(remote, t.lang) };
  const moved = flight.estimated !== flight.scheduled;
  const cancelled = flight.status === 'cancelled';
  const number = formatFlightNumber(flight);
  const stand = flight.direction === 'd' ? flight.gate : flight.belt;
  const standLabel = flight.direction === 'd' ? t('common.labels.gate') : t('common.labels.belt');
  const notAssigned = flight.direction === 'd' ? t('flights.board.gateNotAssigned') : t('flights.board.beltNotAssigned');
  const boardRecord = showAirport ? getAirport(flight.airport) : undefined;
  const boardAirport = boardRecord ? localizeAirport(boardRecord, t.lang) : undefined;
  const linkLabel = `${t('flights.search.viewFlight', { number })}, ${place.city}`;
  // The time in words for assistive technology: <s> is not announced (accessibility-03).
  const timeWords = cancelled
    ? t('flightPages.times.cancelled', { scheduled: formatTime(flight.scheduled) })
    : moved
      ? t('flightPages.times.moved', { scheduled: formatTime(flight.scheduled), estimated: formatTime(flight.estimated) })
      : t('flightPages.times.onTime', { scheduled: formatTime(flight.scheduled) });
  const timeWordsWithDay = day ? `${day}, ${timeWords}` : timeWords;
  const dayMark = day ? (
    <span aria-hidden="true" data-row-day="" className="type-caption block font-sans font-semibold whitespace-nowrap text-ink">
      {day}
    </span>
  ) : null;

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
    // Redesign round one: the airline's code badge with the flight number, the place in large
    // type, the gate with its terminal, and a colour status pill (icon and words always).
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
          {dayMark}
          <span className="sr-only">{timeWordsWithDay}</span>
        </Td>
        <Td mono className="whitespace-nowrap">
          <span className="inline-flex items-center gap-2.5">
            <AirlineBadge code={flight.airline.code} />
            <LocaleLink
              href={flightHref(flight)}
              aria-label={linkLabel}
              onClick={onNavigate}
              className="group/num inline-flex items-center gap-1 rounded-xs font-semibold underline decoration-transparent decoration-1 underline-offset-4 hover:decoration-current"
            >
              {number}
              <Icon name="chevron-right" size="xs" strokeWidth={2} className="text-ink-3 transition-transform duration-fast group-hover/num:translate-x-0.5 motion-reduce:transition-none" />
            </LocaleLink>
          </span>
        </Td>
        <Td className="whitespace-nowrap">
          <span className={cn('type-title-md', cancelled && 'line-through')}>{place.city}</span>{' '}
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
            <span className="type-data-lg">{standValue}</span>
          </span>
        </Td>
        <Td>
          <FlightStatusPill status={flight.status} size="md" />
        </Td>
        {saveButton ? <Td className="w-px">{saveButton}</Td> : null}
      </Tr>
    );
  }

  // Phones and narrow boards: one card per flight.
  // Redesign round one (critique item 9): a fixed two-row grid, about 76 px instead of 120 to 150.
  // [time | city and code ... status pill pinned right], [day or old time | flight · airline
  // (the airline truncates first) ... terminal and gate, save]. The pill no longer drops to a
  // second line for long city names, so the status column does not zig-zag.
  return (
    <li
      className={cn(
        'relative grid grid-cols-[3.75rem_minmax(0,1fr)] gap-x-2.5 gap-y-0.5 rounded-xl border border-line bg-surface px-3.5 py-2 transition-[border-color,background-color,box-shadow,translate] duration-fast hover:border-line-strong hover:bg-surface-raised has-[a:focus-visible]:focus-ring motion-ok:hover:-translate-y-px sm:px-4',
        cancelled && 'text-ink-3',
        className,
      )}
    >
      <p className="row-span-2 flex flex-col pt-0.5">
        <span className="sr-only">{timeWordsWithDay}</span>
        {cancelled ? (
          <s aria-hidden="true" className="type-data-lg">
            {formatTime(flight.scheduled)}
          </s>
        ) : (
          <span aria-hidden="true" className="type-data-lg text-board-accent">
            {formatTime(moved ? flight.estimated : flight.scheduled)}
          </span>
        )}
        {moved && !cancelled ? (
          <s aria-hidden="true" className="type-data-sm mt-0.5 text-ink-2">
            {formatTime(flight.scheduled)}
          </s>
        ) : null}
        {dayMark}
      </p>
      {/* Each line keeps room for its fixed parts (the code; the airline badge and flight number) and
          wraps instead of overlapping: when the pill or the gate block does not fit beside them (a
          360 px phone, or 125% text), it moves to the next line, right-aligned. At 390 px with
          normal text both lines stay as designed. */}
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <p className="type-title-md flex min-w-[4.5rem] flex-1 items-baseline gap-1.5 leading-snug">
          <LocaleLink
            href={flightHref(flight)}
            aria-label={linkLabel}
            onClick={onNavigate}
            className={cn('min-w-0 truncate outline-none after:absolute after:inset-0 after:rounded-xl', cancelled && 'line-through')}
          >
            {place.city}
          </LocaleLink>
          <AirportCode code={place.code} size="sm" className="shrink-0 text-ink-2" />
        </p>
        {/* Alone on its line and still wider than it (320 px, large text), the label wraps. */}
        <FlightStatusPill status={flight.status} className="ml-auto h-auto min-h-6 max-w-full shrink-0 py-0.5 whitespace-normal" />
      </div>
      {/* Three items: the badge and flight number (never shrink), the airline with its dot (no width
          of its own, `w-0 grow`: it fills what is left and truncates first), and the gate block
          with the save button (moves to the next line, right-aligned, when it does not fit). */}
      <div className="flex min-w-0 flex-wrap items-center gap-y-1">
        <p className="type-body-sm inline-flex shrink-0 items-center gap-1.5 text-ink-2">
          <AirlineBadge code={flight.airline.code} size="sm" />
          <span className="font-mono tabular-nums">{number}</span>
        </p>
        <span className="type-body-sm w-0 min-w-0 grow truncate text-ink-2">
          <span aria-hidden="true" className="mx-1.5">
            ·
          </span>
          {flight.airline.name}
        </span>
        <span className="ml-auto inline-flex max-w-full shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 pl-2">
          <span className="type-data-md inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
            {boardAirport ? <AirportCode code={boardAirport.code} name={boardAirport.name} size="sm" variant="boxed" /> : null}
            <span className="inline-flex items-center gap-1.5">
              <TerminalBadge terminal={flight.terminal} size="sm" />
              {/* Visible on cards: a bare "2" next to an airport code does not say it is a gate. */}
              <span className="type-caption font-sans text-ink-2">{standLabel}</span>
              <span className="font-semibold">{standValue}</span>
            </span>
          </span>
          {saveButton ? <span className="-my-2 -mr-1.5 flex shrink-0 items-center sm:-mr-2">{saveButton}</span> : null}
        </span>
      </div>
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
    before.day === after.day &&
    before.onNavigate === after.onNavigate &&
    Boolean(before.onSaveChange) === Boolean(after.onSaveChange),
);
