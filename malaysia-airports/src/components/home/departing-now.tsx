'use client';

import { useDeferredValue, useMemo, useState, useSyncExternalStore } from 'react';
import { getAirport, localizeAirport } from '@/content/airports';
import { cn } from '@/lib/cn';
import { formatFlightNumber, placeCity, remotePlace, type Flight } from '@/lib/flights';
import { useAirportContext } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { useFlightFeed, type FeedRequest } from '@/lib/providers/use-flight-feed';
import { DEFAULT_TIMEZONE, addMinutes, dateKey, formatTime, type Instant } from '@/lib/time';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { datesInRange } from '@/components/flights/board-model';
import { useFlightDirection } from '@/components/flights/flight-direction';
import { FlightStatusPill } from '@/components/flights/flight-status-pill';
import { flightHref, rowDayLabel } from '@/components/flights/flight-row';
import { sectionPath } from '@/components/shell/sections';
import { previewFlights } from './preview-filter';

const ROWS = 3;
/** The glance looks at the remembered airport, or KLIA, the hub, when none is chosen. */
const DEFAULT_SLUG = 'kul';
const glanceRange = (now: Instant) => ({ from: addMinutes(now, -10), to: addMinutes(now, 24 * 60) });

/** The panel shows from 1440 px (90rem); below that it renders no rows, so a phone's page has no hidden flight links. */
const WIDE = '(min-width: 90rem)';
const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
const useWide = () =>
  useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );

/**
 * Redesign round one (critique item 5): "Departing now" on the home hero, from 1440 px up. A
 * smoky glass panel beside the headline with the next three flights (time, city, status), a link
 * to the full board and the quiet demonstration line, so live flight status is in the hero, as
 * the client asked. It follows the remembered airport and the Departures/Arrivals switch; the
 * rows come from the same batched flight feed as the board preview below (shared cache, no extra
 * request). Fixed height with placeholder rows, so nothing moves when the feed answers.
 */
export function DepartingNow({ className }: { className?: string }) {
  const t = useT();
  const lang = useLang();
  const context = useAirportContext();
  const { direction: liveDirection } = useFlightDirection();
  const direction = useDeferredValue(liveDirection);
  const chosen = context.airport?.slug;
  const slug = chosen && getAirport(chosen) ? chosen : DEFAULT_SLUG;
  const airport = getAirport(slug);
  const zone = airport?.timezone ?? DEFAULT_TIMEZONE;
  const [nextDay, setNextDay] = useState(false);
  const wide = useWide();
  const feed = useFlightFeed((at): FeedRequest[] => {
    // Nothing to fetch for a panel that is not shown.
    if (!wide) return [];
    const today = dateKey(at, zone);
    return datesInRange(glanceRange(at), zone)
      .filter((date) => nextDay || date <= today)
      .map((date) => ({ airport: slug, date, direction }));
  });
  const provider = feed.provider;
  const flights = useMemo<Flight[] | null>(() => {
    if (!provider || !wide) return null;
    return previewFlights(provider.listFlightsSync({ airport: slug, direction, ...glanceRange(provider.now) }), provider.now.getTime(), ROWS);
  }, [provider, wide, slug, direction]);
  if (!nextDay && flights && flights.length < ROWS) setNextDay(true);
  const name = airport ? localizeAirport(airport, lang).shortName : '';
  const titleId = 'home-departing-now';

  return (
    <aside aria-labelledby={titleId} className={cn('glass-dark on-media flex flex-col rounded-3xl p-5 text-ink shadow-xl', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={titleId} className="type-title-md text-ink">
          {direction === 'd' ? t('home.v2.departingNow') : t('home.v2.arrivingNow')}
        </h2>
        <span className="type-caption text-ink-2">{name}</span>
      </div>
      <ul className="mt-3 flex flex-col divide-y divide-line">
        {flights === null
          ? Array.from({ length: ROWS }, (_, index) => (
              <li key={index} aria-hidden="true" className="flex h-16 items-center gap-3">
                <Skeleton className="h-5 w-12" />
                <span className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-full rounded-pill" />
                </span>
              </li>
            ))
          : flights.map((flight) => {
              const place = remotePlace(flight);
              const day = provider ? rowDayLabel(flight, provider.now, t) : undefined;
              const moved = flight.estimated !== flight.scheduled && flight.status !== 'cancelled';
              return (
                <li key={flight.id} className="relative flex h-16 items-center gap-3">
                  <span className="flex w-[4.25rem] shrink-0 flex-col whitespace-nowrap">
                    <span className="type-data-lg text-gold-bright">{formatTime(moved ? flight.estimated : flight.scheduled, zone)}</span>
                    {day ? <span className="type-caption text-ink-2">{day}</span> : null}
                  </span>
                  {/* Polish 1b (critique-redesign1b item 4): the destination is never cut. It has the
                      row's whole width (the status moved to line 2, the airline name is gone: the
                      flight number is enough) and may wrap; line 2 holds the number and the status. */}
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <LocaleLink
                      href={flightHref(flight)}
                      className="type-body leading-tight font-semibold [overflow-wrap:anywhere] text-ink outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:focus-ring"
                      aria-label={`${t('flights.search.viewFlight', { number: formatFlightNumber(flight) })}, ${placeCity(place, lang)}`}
                    >
                      {placeCity(place, lang)}
                    </LocaleLink>
                    <span className="type-caption flex items-center gap-2 whitespace-nowrap text-ink-2">
                      <span className="font-mono tabular-nums">{formatFlightNumber(flight)}</span>
                      <FlightStatusPill status={flight.status} className="ml-auto shrink-0" />
                    </span>
                  </span>
                </li>
              );
            })}
        {flights !== null && flights.length === 0 ? <li className="type-body-sm py-4 text-ink-2">{t('flights.board.noFlights')}</li> : null}
      </ul>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-3">
        {/* The quiet demonstration line: every value in the panel is simulated. */}
        <p role="note" aria-label={t('demo.bannerTitle')} data-demo-marker="" className="type-caption flex items-center gap-1.5 text-ink-2">
          <Icon name="flask-conical" size="xs" strokeWidth={2} className="text-gold-bright" />
          <span>
            <strong className="font-semibold text-ink">{t('provenance.demo.short')}</strong> · {t('shellExtras.demo.notLive')}
          </span>
        </p>
        <LocaleLink href={`${sectionPath(slug, 'flights')}?dir=${direction}`} className="link-action type-body-sm text-ink">
          {t('home.board.fullBoard')}
          <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
        </LocaleLink>
      </div>
    </aside>
  );
}
