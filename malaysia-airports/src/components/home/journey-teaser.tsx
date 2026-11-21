'use client';

import { useMemo, useState } from 'react';
import { getAirport } from '@/content/airports';
import type { Provenance, Source, TerminalId } from '@/content/types';
import { formatFlightNumber, isFinalStatus, isInternationalFlight, placeCity, type Flight } from '@/lib/flights';
import { useAirportContext, useSavedJourney } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { useFlightFeed, type FeedRequest } from '@/lib/providers/use-flight-feed';
import { DEFAULT_TIMEZONE, addMinutes, dateKey, formatTime, type Instant } from '@/lib/time';
import { AirportCode } from '@/components/common/airport-code';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { datesInRange } from '@/components/flights/board-model';
import { flightHref } from '@/components/flights/flight-row';
import { hasSection } from '@/components/shell/sections';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Timeline, TimelineItem } from '@/components/ui/timeline';

/** A sourced, official fact about an airport, picked on the server from its guide notes. */
export interface TeaserOfficialFact {
  airport: string;
  terminal?: TerminalId;
  title: string;
  body: string;
  sources: Source[];
}

/** The arrive-by rule (`ARRIVAL_TIME_RULE`, D-13), localised on the server with its sources. */
export interface TeaserArrivalRule {
  minutesBefore: { international: number; domestic: number };
  text: string;
  provenance: Provenance;
  sources: Source[];
}

export interface JourneyTeaserProps {
  /** One official fact per airport that has one, by slug. */
  facts: Readonly<Record<string, TeaserOfficialFact>>;
  /** How early to be at the airport: the content record, not interface copy (D-13 hand-off, round 2). */
  arrival: TeaserArrivalRule;
  /** Used when the airport has no fact of its own: the group support line, with its sources. */
  fallback?: { value: string; sources: Source[] };
}

/** The sample flight leaves between two and a half and 14 hours from now. */
const sampleRange = (now: Instant) => ({ from: addMinutes(now, 150), to: addMinutes(now, 14 * 60) });

/**
 * A three-step sample of the journey timeline, one step for each kind of guidance: estimated
 * (our rule of thumb), official (a sourced fact about the airport) and suggestion. It hangs on a
 * sample demonstration flight, which the visitor can save to "My journey" for later. The flight
 * comes from the server flight feed (round 3, E-03), not from a generator in the browser.
 */
export function JourneyTeaser({ facts, arrival, fallback }: JourneyTeaserProps) {
  const t = useT();
  const context = useAirportContext();
  const sections = useSectionAvailability();
  const { saveFlight, removeFlight, isFlightSaved } = useSavedJourney();

  const chosen = context.airport?.slug;
  const sampleAirport = chosen && hasSection(sections, chosen, 'flights') ? chosen : (Object.keys(facts)[0] ?? 'kul');
  const fact = facts[sampleAirport];
  const factTerminal = fact?.terminal;
  const airport = getAirport(sampleAirport);
  // Today's board (shared with the board preview's request); the next day's only when today has
  // no flight left to sample.
  const [nextDay, setNextDay] = useState(false);
  const zone = airport?.timezone ?? DEFAULT_TIMEZONE;
  const feed = useFlightFeed((at): FeedRequest[] =>
    hasSection(sections, sampleAirport, 'flights')
      ? datesInRange(sampleRange(at), zone)
          .filter((date) => nextDay || date <= dateKey(at, zone))
          .map((date) => ({ airport: sampleAirport, date, direction: 'd' }))
      : [],
  );
  const provider = feed.provider;

  const flight = useMemo<Flight | null>(() => {
    if (!provider) return null;
    const candidates = provider
      .listFlightsSync({ airport: sampleAirport, direction: 'd', ...sampleRange(provider.now) })
      .filter((item) => !isFinalStatus(item.status) && item.status !== 'cancelled');
    return candidates.find((item) => !factTerminal || item.terminal === factTerminal) ?? candidates[0] ?? null;
  }, [provider, sampleAirport, factTerminal]);
  if (!nextDay && provider && !flight) setNextDay(true);

  // On the estimated time, the basis every other day-of-travel time uses (round 4, 6.1.2).
  const arriveBy = flight ? formatTime(addMinutes(flight.estimated, -(isInternationalFlight(flight) ? arrival.minutesBefore.international : arrival.minutesBefore.domestic))) : null;
  const saved = flight ? isFlightSaved(flight.id) : false;

  const toggle = () => {
    if (!flight) return;
    if (saved) {
      removeFlight(flight.id);
      return;
    }
    saveFlight({
      id: flight.id,
      airport: flight.airport,
      number: flight.number,
      direction: flight.direction,
      date: flight.date,
      route: t('flights.detail.route', { origin: placeCity(flight.origin, t.lang), destination: placeCity(flight.destination, t.lang) }),
      mode: 'departing',
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line-strong bg-surface shadow-sm">
      <div className="flex min-h-18 flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-line bg-page-subtle px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="type-eyebrow flex flex-wrap items-center gap-2 text-ink-2">
            {t('home.journey.sample')}
            <ProvenanceTag provenance="demo" length="short" />
          </p>
          {flight ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-2.5 text-ink">
              <LocaleLink href={flightHref(flight)} className="type-data-lg link inline-flex min-h-11 items-center">
                {formatFlightNumber(flight)}
              </LocaleLink>
              <span className="type-title-sm">{t('flights.detail.route', { origin: placeCity(flight.origin, t.lang), destination: placeCity(flight.destination, t.lang) })}</span>
              <span className="type-data-md text-ink-2">{formatTime(flight.scheduled)}</span>
            </p>
          ) : (
            <p className="type-body-sm mt-1.5 text-ink-2">{t('home.journey.sampleNote')}</p>
          )}
        </div>
        {airport ? <AirportCode code={airport.code} name={airport.name} variant="boxed" /> : null}
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <Timeline>
          <TimelineItem
            eyebrow={t('journey.relative.beforeYouLeave')}
            time={arriveBy ?? undefined}
            title={arriveBy ? t('home.journey.arriveBy', { time: arriveBy }) : t('home.journey.arriveGeneric')}
            meta={<ProvenanceTag provenance={arrival.provenance} />}
            actions={<SourceNote sources={arrival.sources} />}
          >
            {arrival.text}
          </TimelineItem>
          <TimelineItem
            eyebrow={t('journey.relative.atTheAirport')}
            title={fact ? fact.title : t('home.journey.officialFallbackTitle')}
            meta={<ProvenanceTag provenance="official" />}
            actions={fact ? <SourceNote sources={fact.sources} /> : fallback ? <SourceNote sources={fallback.sources} /> : undefined}
          >
            {fact ? fact.body : fallback ? t('home.journey.officialFallbackBody', { value: fallback.value }) : null}
          </TimelineItem>
          <TimelineItem eyebrow={t('journey.relative.afterSecurity')} title={t('home.journey.suggestionTitle')} meta={<ProvenanceTag provenance="suggestion" />}>
            {t('home.journey.suggestionBody')}
          </TimelineItem>
        </Timeline>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line px-5 py-4 sm:px-6">
        <Button asChild iconEnd="arrow-right">
          <a href="#flight-search">{t('journey.timeline.addFlight')}</a>
        </Button>
        <Button variant="secondary" iconStart={saved ? 'bookmark-check' : 'bookmark'} aria-pressed={saved} disabled={!flight} onClick={toggle}>
          {saved ? t('home.journey.saved') : t('home.journey.save')}
        </Button>
        {saved ? (
          <LocaleLink href="/journey" className="link-action type-body-sm text-ink">
            {t('home.journey.open')}
            <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
          </LocaleLink>
        ) : (
          <p className="type-caption text-ink-2">{t('home.journey.saveHint')}</p>
        )}
      </div>
    </div>
  );
}
