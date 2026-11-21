'use client';

import type { ReactNode } from 'react';
import { getAirport, terminalLabel } from '@/content/airports';
import { pick, type Provenance, type Source } from '@/content/types';
import { cn } from '@/lib/cn';
import { checkInLines, formatFlightNumber, type Flight } from '@/lib/flights';
import { formatDuration } from '@/lib/format';
import { useLang, useT } from '@/lib/i18n/client';
import { formatDate, formatTime, minutesBetween, type Instant } from '@/lib/time';
import { AirportCode } from '@/components/common/airport-code';
import { DemoDataBanner } from '@/components/common/demo-data-banner';
import { FlightStatusChip } from '@/components/common/flight-status-chip';
import { Freshness } from '@/components/common/freshness';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { DemoMark } from './demo-mark';

/** The airline's published check-in area, shown when the flight has no row yet (B-12). */
export interface PublishedCheckIn {
  airline: string;
  text: string;
  /** True when `text` is English shown on a Malay page. */
  english?: boolean;
  provenance: Provenance;
  sources: Source[];
}

export interface FlightStatusHeroProps {
  flight: Flight;
  updatedAt: Instant | null;
  refreshSeconds?: number;
  publishedCheckIn?: PublishedCheckIn;
}

function Fact({ label, children, wide = false, demo = false }: { label: string; children: ReactNode; wide?: boolean; demo?: boolean }) {
  return (
    <div className={cn('min-w-0', wide && 'col-span-2')}>
      <dt className="type-eyebrow flex items-center gap-2 text-ink-2">
        {label}
        {/* The value is simulated: the label sits in the same view as the value (content-integrity-03). */}
        {demo ? <DemoMark /> : null}
      </dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  );
}

/**
 * The top of a flight page: status, the route, scheduled and expected times side by side, and
 * where to go (terminal, check-in, gate, or belt for arrivals). It sits on the board surface
 * under the demonstration banner, because every value in it is simulated.
 */
export function FlightStatusHero({ flight, updatedAt, refreshSeconds, publishedCheckIn }: FlightStatusHeroProps) {
  const t = useT();
  const lang = useLang();
  const airport = getAirport(flight.airport);
  const zone = airport?.timezone;
  const departure = flight.direction === 'd';
  const cancelled = flight.status === 'cancelled';
  const late = Math.max(0, minutesBetween(flight.scheduled, flight.estimated));
  const moved = late > 0 && !cancelled;
  const time = (value: string) => formatTime(value, zone);
  const notAssigned = (text: string) => <span className="type-body text-ink-2">{text}</span>;

  // One line per cabin and the bag drop, from the same helper as the timeline (ux-frequent-08).
  const checkIn = checkInLines(flight).map((line) => pick(line, lang));

  return (
    <section aria-labelledby="flight-status-title">
      <DemoDataBanner attached />
      <div className="surface-board @container relative overflow-hidden rounded-b-lg border border-t-0 border-line">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line px-4 py-3 sm:px-6">
          <h2 id="flight-status-title" className="type-title-md text-ink">
            {t('flightPages.detail.statusTitle')}
          </h2>
          <Freshness
            live="off"
            updatedAt={updatedAt}
            refreshSeconds={refreshSeconds}
            context={
              airport ? (
                <>
                  <AirportCode code={airport.code} name={airport.name} size="sm" /> <span aria-hidden="true">·</span> {formatDate(flight.scheduled, lang, 'weekday', zone)}
                </>
              ) : undefined
            }
          />
        </div>

        <div className="grid gap-x-10 gap-y-8 px-4 py-6 sm:px-6 sm:py-7 @3xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <FlightStatusChip status={flight.status} className="h-8 px-2.5 text-base" />
              <span className="type-data-sm text-ink-2">
                {flight.airline.name} <span aria-hidden="true">·</span> {formatFlightNumber(flight)}
              </span>
            </div>

            <p className="sr-only">{t('flights.detail.route', { origin: `${flight.origin.city} (${flight.origin.code})`, destination: `${flight.destination.city} (${flight.destination.code})` })}</p>
            <div aria-hidden="true" className="grid grid-cols-[auto_minmax(2rem,1fr)_auto] items-center gap-x-3 sm:gap-x-5">
              <span className="type-data-xl text-ink">{flight.origin.code}</span>
              <span className="relative flex items-center">
                <span className="h-px w-full border-t border-dashed border-line-control" />
                <Icon name="plane" className="absolute left-1/2 box-content -translate-x-1/2 bg-board px-1.5 text-ink-2" />
              </span>
              <span className="type-data-xl text-right text-ink">{flight.destination.code}</span>
              <span className={cn('type-body-sm text-ink-2', cancelled && 'line-through')}>{flight.origin.city}</span>
              <span />
              <span className={cn('type-body-sm text-right text-ink-2', cancelled && 'line-through')}>{flight.destination.city}</span>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 xs:grid-cols-3">
              <Fact label={t('common.labels.scheduled')}>
                {moved || cancelled ? <s className="type-data-lg text-ink-2">{time(flight.scheduled)}</s> : <span className="type-data-lg">{time(flight.scheduled)}</span>}
              </Fact>
              <Fact label={t('common.labels.estimated')}>
                {cancelled ? (
                  <span className="type-body text-ink-2">–</span>
                ) : (
                  <>
                    <span className="type-data-lg text-board-accent">{time(flight.estimated)}</span>
                    <span className="type-caption mt-0.5 block text-ink-2">{moved ? t.count('flightPages.detail.minutesLate', late) : t('flightPages.detail.onSchedule')}</span>
                  </>
                )}
              </Fact>
              {flight.actual ? (
                <Fact label={t('common.labels.actual')}>
                  <span className="type-data-lg">{time(flight.actual)}</span>
                </Fact>
              ) : null}
            </dl>
          </div>

          <dl className="grid min-w-0 grid-cols-2 content-start gap-x-6 gap-y-5 @3xl:border-l @3xl:border-line @3xl:pl-10">
            {/* On an arrival the terminal heads the column with no gate or counters below it, so it carries the label. */}
            <Fact label={t('common.labels.terminal')} wide demo={flight.isDemo && !departure}>
              <span className="inline-flex flex-wrap items-center gap-2">
                <TerminalBadge terminal={flight.terminal} size="sm" />
                <span className="type-body font-semibold">{airport ? terminalLabel(airport, flight.terminal, lang) : flight.terminal}</span>
              </span>
            </Fact>
            {departure ? (
              <>
                <Fact label={t('common.labels.checkIn')} wide demo={checkIn.length > 0}>
                  {checkIn.length > 0 ? (
                    <ul className="flex flex-col gap-0.5">
                      {checkIn.map((line) => (
                        <li key={line} className="type-data-md">
                          {line}
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
                </Fact>
                <Fact label={t('common.labels.gate')} wide demo={Boolean(flight.gate)}>
                  {flight.gate ? <span className="type-data-xl text-board-accent">{flight.gate}</span> : notAssigned(t('flights.board.gateNotAssigned'))}
                </Fact>
                {flight.boardingAt && !cancelled ? (
                  <Fact label={t('flightPages.detail.boardingFrom')}>
                    <span className="type-data-md">{time(flight.boardingAt)}</span>
                  </Fact>
                ) : null}
                {flight.gateClosesAt && !cancelled ? (
                  <Fact label={t('flightPages.detail.gateCloses')}>
                    <span className="type-data-md">{time(flight.gateClosesAt)}</span>
                  </Fact>
                ) : null}
              </>
            ) : (
              <Fact label={t('common.labels.belt')} wide demo={flight.isDemo}>
                {flight.belt ? <span className="type-data-xl text-board-accent">{flight.belt}</span> : notAssigned(t('flights.board.beltNotAssigned'))}
              </Fact>
            )}
            {flight.durationMinutes ? (
              <Fact label={t('flightPages.detail.flightTime')}>
                <span className="type-data-md">{formatDuration(flight.durationMinutes, lang)}</span>
              </Fact>
            ) : null}
            {flight.aircraft ? (
              <Fact label={t('flights.detail.aircraft')}>
                <span className="type-data-md">{flight.aircraft}</span>
              </Fact>
            ) : null}
          </dl>
        </div>

        {flight.codeshares && flight.codeshares.length > 0 ? (
          <p className="type-body-sm flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line px-4 py-3 text-ink-2 sm:px-6">
            <span className="type-eyebrow">{t('flightPages.detail.codeshares')}</span>
            <span className="type-data-sm text-ink">{flight.codeshares.join(' · ')}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** Placeholder while the clock is not available (before hydration). */
export function FlightStatusHeroSkeleton() {
  const t = useT();
  return (
    <div role="status" className="flex flex-col">
      <span className="sr-only">{t('flightPages.detail.loading')}</span>
      <DemoDataBanner attached />
      <div className="surface-board rounded-b-lg border border-t-0 border-line px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-10 w-full max-w-md" />
        <Skeleton className="mt-6 h-16 w-full" />
      </div>
    </div>
  );
}
