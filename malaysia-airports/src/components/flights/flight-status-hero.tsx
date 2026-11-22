'use client';

import type { ReactNode } from 'react';
import { getAirport, terminalLabel } from '@/content/airports';
import { pick } from '@/content/values';
import type { Provenance, Source } from '@/content/types';
import { cn } from '@/lib/cn';
import { checkInDesks, checkInLines, formatFlightNumber, placeCity, type Flight } from '@/lib/flights';
import { formatDuration } from '@/lib/format';
import { useLang, useT } from '@/lib/i18n/client';
import { formatDate, formatTime, minutesBetween, type Instant } from '@/lib/time';
import { keepRanges } from '@/components/common/keep-ranges';
import { AirportCode } from '@/components/common/airport-code';
import { DemoDataBanner } from '@/components/common/demo-data-banner';
import { Freshness } from '@/components/common/freshness';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { AirlineBadge, FlightStatusPill } from './flight-status-pill';
import type { FlightIdentity } from './flight-identity';

/** The airline's published check-in area, shown when the flight has no row yet (B-12). */
export interface PublishedCheckIn {
  airline: string;
  text: string;
  /** True when `text` is English shown on a Malay page. */
  english?: boolean;
  provenance: Provenance;
  sources: Source[];
}

export type FlightStatusHeroProps = {
  updatedAt: Instant | null;
  refreshSeconds?: number;
  publishedCheckIn?: PublishedCheckIn;
} & (
  | { flight: Flight; pending?: false }
  /**
   * Round 5 (E-01): before the feed answers, the timetable facts the server knows from the id
   * (route, scheduled time, terminal, flight time, aircraft) with placeholders for everything
   * the clock decides. The same elements are then filled in place, so the card neither jumps nor
   * repaints as a new block when the status arrives.
   */
  | { flight: FlightIdentity; pending: true }
);

function Fact({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      {/* Redesign round one: no Demo label per value. The card is short enough that its
          demonstration line, directly above, is in the same view as every value (content-integrity-03). */}
      <dt className="type-eyebrow text-ink-2">{label}</dt>
      <dd className="mt-1 min-h-7 text-ink">{children}</dd>
    </div>
  );
}

/**
 * The top of a flight page: status, the route, scheduled and expected times side by side, and
 * where to go (terminal, check-in, gate, or belt for arrivals). It sits on the board surface
 * under the demonstration banner, because every value in it is simulated.
 */
export function FlightStatusHero({ flight, pending = false, updatedAt, refreshSeconds, publishedCheckIn }: FlightStatusHeroProps) {
  const t = useT();
  const lang = useLang();
  const airport = getAirport(flight.airport);
  const zone = airport?.timezone;
  const departure = flight.direction === 'd';
  // Only read while not pending: every field below comes from the feed.
  const live = pending ? null : (flight as Flight);
  const cancelled = live?.status === 'cancelled';
  const late = live ? Math.max(0, minutesBetween(live.scheduled, live.estimated)) : 0;
  const moved = late > 0 && !cancelled;
  const time = (value: string) => formatTime(value, zone);
  const notAssigned = (text: string) => <span className="type-body text-ink-2">{text}</span>;
  // Placeholders for what the feed decides, the height of the value they stand for.
  const waiting = (className: string) => <Skeleton className={cn('inline-block align-middle', className)} />;

  // One line per cabin and the bag drop, from the same helper as the timeline (ux-frequent-08).
  const checkIn = live ? checkInLines(live).map((line) => pick(line, lang)) : [];

  // Rows of the check-in desks, for the fact grid ("Row H, D"); the counters go in the disclosure.
  const rows = live ? [...new Set(checkInDesks(live).map((desk) => desk.row).filter(Boolean))] : [];
  const shownTime = live && !cancelled ? live.estimated : flight.scheduled;

  // The place at each end of the route, as on a boarding pass: the code in large type and the city
  // (struck through on a cancelled flight). The airport's own end carries the time.
  const end = (label: string, place: typeof flight.origin, align: 'start' | 'end', here: boolean) => (
    <span className={cn('flex min-w-0 flex-col', align === 'end' && 'items-end text-right')}>
      <span className="type-caption text-ink-2 max-sm:hidden">{label}</span>
      <span className="type-display-md tracking-tight text-ink">{place.code}</span>
      <span className={cn('type-body-sm text-ink-2', cancelled && 'line-through')}>{placeCity(place, lang)}</span>
      {here ? (
        <span className="mt-3 flex flex-col max-sm:hidden">
          {/* The answer in display size (critique item 4): the time at this airport, tabular. */}
          {!live ? (
            waiting('h-11 w-28')
          ) : (
            <span className={cn('type-display-md font-mono tabular-nums tracking-tight', cancelled ? 'text-ink-2 line-through' : moved ? 'text-board-accent' : 'text-ink')}>{time(shownTime)}</span>
          )}
          <span className="type-caption mt-1 text-ink-2">
            {!live ? (
              <>
                {t('common.labels.scheduled')} {time(flight.scheduled)}
              </>
            ) : moved ? (
              <>
                <s>
                  {t('common.labels.scheduled')} {time(flight.scheduled)}
                </s>{' '}
                · {t.count('flightPages.detail.minutesLate', late)}
              </>
            ) : cancelled ? (
              <>
                {t('common.labels.scheduled')} {time(flight.scheduled)}
              </>
            ) : (
              t('flightPages.detail.onSchedule')
            )}
          </span>
          {live?.actual ? (
            <span className="type-caption text-ink-2">
              {t('common.labels.actual')} {time(live.actual)}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );

  return (
    // Redesign round one (critique items 4 and 11): a boarding pass. The quiet demonstration line
    // caps it (every value in it is simulated); then the status, the route with the time in display
    // size, and a 2 x 3 grid of where and when (terminal, gate, boarding, gate closes, check-in
    // row, aircraft), so time, status and gate are in the first view on a phone and a desktop. The
    // counters (six lines at KLIA) wait in a disclosure instead of filling the stub.
    <section
      aria-labelledby="flight-status-title"
      aria-busy={pending || undefined}
      data-flight-hero={pending ? 'pending' : 'live'}
      className="overflow-clip rounded-3xl shadow-xl"
    >
      <DemoDataBanner attached />
      <div className="surface-board @container relative overflow-hidden rounded-b-3xl border border-t-0 border-line">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-2 sm:px-7 sm:py-2.5">
          <h2 id="flight-status-title" className="type-body font-semibold text-ink">
            {t('flightPages.detail.statusTitle')}
          </h2>
          <Freshness
            live="off"
            updatedAt={updatedAt}
            refreshSeconds={refreshSeconds}
            intervalClassName="max-sm:sr-only"
            context={
              airport ? (
                // Phones: the date is in the eyebrow above, so the header stays one row.
                <span className="max-sm:sr-only">
                  <AirportCode code={airport.code} name={airport.name} size="sm" /> <span aria-hidden="true">·</span> {formatDate(flight.scheduled, lang, 'weekday', zone)}
                </span>
              ) : undefined
            }
          />
        </div>

        <div className="grid @3xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-4 px-5 py-4 sm:gap-5 sm:px-7 sm:py-6">
            <div className="flex flex-wrap items-center gap-3">
              {live ? (
                <FlightStatusPill status={live.status} size="lg" />
              ) : (
                <span role="status" className="inline-flex h-10 items-center">
                  {waiting('h-10 w-32 rounded-pill')}
                  <span className="sr-only">{t('flightPages.detail.loading')}</span>
                </span>
              )}
              {/* Phones: the time beside the status, so both are on the first screen (critique item 4). */}
              <span aria-hidden="true" className="ml-auto flex flex-col items-end text-right sm:hidden">
                {!live ? (
                  waiting('h-7 w-20')
                ) : (
                  <span className={cn('type-data-xl', cancelled ? 'text-ink-2 line-through' : moved ? 'text-board-accent' : 'text-ink')}>{time(shownTime)}</span>
                )}
                <span className="type-caption mt-0.5 text-ink-2">{live && moved ? t.count('flightPages.detail.minutesLate', late) : live && !cancelled ? t('flightPages.detail.onSchedule') : `${t('common.labels.scheduled')} ${time(flight.scheduled)}`}</span>
              </span>
              <span className="type-body-sm inline-flex items-center gap-2 text-ink-2 max-sm:basis-full">
                <AirlineBadge code={flight.airline.code} />
                <span>
                  {flight.airline.name} <span aria-hidden="true">·</span> <span className="font-mono tabular-nums">{formatFlightNumber(flight)}</span>
                </span>
              </span>
            </div>

            <p className="sr-only">
              {t('flights.detail.route', { origin: `${placeCity(flight.origin, lang)} (${flight.origin.code})`, destination: `${placeCity(flight.destination, lang)} (${flight.destination.code})` })}.{' '}
              {t('common.labels.scheduled')} {time(flight.scheduled)}.
              {live && !cancelled ? ` ${t('common.labels.estimated')} ${time(live.estimated)}, ${moved ? t.count('flightPages.detail.minutesLate', late) : t('flightPages.detail.onSchedule')}.` : ''}
              {live?.actual ? ` ${t('common.labels.actual')} ${time(live.actual)}.` : ''}
              {flight.durationMinutes ? ` ${t('flightPages.detail.flightTime')} ${formatDuration(flight.durationMinutes, lang)}.` : ''}
            </p>
            <div aria-hidden="true" className="grid grid-cols-[auto_minmax(2.5rem,1fr)_auto] items-start gap-x-3 sm:gap-x-6">
              {end(t('flightPages.look.from'), flight.origin, 'start', departure)}
              <span className="relative mt-4 flex flex-col items-center gap-2 sm:mt-11">
                <span className="relative flex w-full items-center">
                  <span className="h-px w-full border-t-2 border-dotted border-line-control" />
                  <span className="absolute left-1/2 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-line bg-board-raised text-board-accent">
                    <Icon name="plane" size="sm" />
                  </span>
                </span>
                {flight.durationMinutes ? <span className="type-caption mt-4 text-center text-ink-2 max-xs:hidden">{formatDuration(flight.durationMinutes, lang)}</span> : null}
              </span>
              {end(t('flightPages.look.to'), flight.destination, 'end', !departure)}
            </div>
          </div>

          {/* The stub: a perforated edge (decoration) and where and when, two columns of three. */}
          {/* Phones: three columns of two rows, so every value sits within one screen of the
              demonstration line above (content-integrity-03) and the card stays short. */}
          <div className="relative flex min-w-0 flex-col gap-4 border-t-2 border-dashed border-line-strong bg-board-raised/60 px-5 py-4 sm:px-7 sm:py-6 @3xl:border-t-0 @3xl:border-l-2">
            <dl className="grid grid-cols-3 content-start gap-x-4 gap-y-4 @xl:gap-x-6 @3xl:grid-cols-2">
              <Fact label={t('common.labels.terminal')}>
                <span className="inline-flex flex-wrap items-center gap-2">
                  <TerminalBadge terminal={flight.terminal} size="sm" />
                  <span className="type-body font-semibold">{airport ? terminalLabel(airport, flight.terminal, lang, { short: true }) : flight.terminal}</span>
                </span>
              </Fact>
              {departure ? (
                <>
                  <Fact label={t('common.labels.gate')}>
                    {!live ? waiting('h-8 w-16') : live.gate ? <span className="type-data-xl text-board-accent">{live.gate}</span> : notAssigned(t('flights.board.gateNotAssigned'))}
                  </Fact>
                  <Fact label={t('flightPages.detail.boardingFrom')}>
                    {!live ? waiting('h-6 w-14') : live.boardingAt && !cancelled ? <span className="type-data-lg">{time(live.boardingAt)}</span> : notAssigned('–')}
                  </Fact>
                  <Fact label={t('flightPages.detail.gateCloses')}>
                    {!live ? waiting('h-6 w-14') : live.gateClosesAt && !cancelled ? <span className="type-data-lg">{time(live.gateClosesAt)}</span> : notAssigned('–')}
                  </Fact>
                  <Fact label={t('common.labels.checkIn')}>
                    {!live ? (
                      waiting('h-6 w-20')
                    ) : rows.length > 0 ? (
                      <span className="type-body font-semibold">
                        {t('common.labels.row')} {rows.join(', ')}
                      </span>
                    ) : (
                      notAssigned(t('flightPages.detail.checkInNotShown'))
                    )}
                  </Fact>
                </>
              ) : (
                <Fact label={t('common.labels.belt')}>
                  {!live ? waiting('h-8 w-16') : live.belt ? <span className="type-data-xl text-board-accent">{live.belt}</span> : notAssigned(t('flights.board.beltNotAssigned'))}
                </Fact>
              )}
              {flight.aircraft ? (
                <Fact label={t('flights.detail.aircraft')}>
                  {/* Verification round 6: only the model number stays whole ("A330-300"), so a long
                      name can still wrap at its space instead of being cut by the card at 320 px. */}
                  <span className="type-body-sm">{keepRanges(flight.aircraft)}</span>
                </Fact>
              ) : null}
              {!departure && flight.durationMinutes ? (
                <Fact label={t('flightPages.detail.flightTime')}>
                  <span className="type-body-sm">{formatDuration(flight.durationMinutes, lang)}</span>
                </Fact>
              ) : null}
            </dl>

            {departure ? (
              <details className="group rounded-xl border border-line bg-board/60 [&_summary::-webkit-details-marker]:hidden">
                <summary className="type-body-sm flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3.5 font-semibold text-ink">
                  {t('flightPages.detail.countersTitle')}
                  <Icon name="chevron-down" size="sm" className="shrink-0 text-ink-2 transition-transform duration-fast motion-reduce:transition-none group-open:rotate-180" />
                </summary>
                <div className="border-t border-line px-3.5 py-3">
                  {!live ? (
                    waiting('h-6 w-48')
                  ) : checkIn.length > 0 ? (
                    <ul className="flex flex-col gap-1">
                      {checkIn.map((line) => (
                        <li key={line} className="type-body-sm text-ink">
                          {keepRanges(line)}
                        </li>
                      ))}
                    </ul>
                  ) : publishedCheckIn && !cancelled ? (
                    <div className="flex flex-col gap-1.5">
                      <p className="type-body-sm text-ink" lang={publishedCheckIn.english ? 'en' : undefined}>
                        {publishedCheckIn.text}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <ProvenanceTag provenance={publishedCheckIn.provenance} length="short" />
                        <span className="type-caption text-ink-2">
                          {t('flightPages.checkInCard.published', { airline: publishedCheckIn.airline })} · {t('flightPages.checkInCard.notLive')}
                        </span>
                        <SourceNote sources={publishedCheckIn.sources} />
                      </div>
                    </div>
                  ) : (
                    notAssigned(t('flightPages.detail.checkInNotShown'))
                  )}
                </div>
              </details>
            ) : null}
          </div>
        </div>

        {flight.codeshares && flight.codeshares.length > 0 ? (
          <p className="type-body-sm flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line px-5 py-3 text-ink-2 sm:px-7">
            <span className="type-eyebrow">{t('flightPages.detail.codeshares')}</span>
            <span className="type-data-sm text-ink">{flight.codeshares.join(' · ')}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
