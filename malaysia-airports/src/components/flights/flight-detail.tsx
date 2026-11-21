'use client';

import { useMemo, type ReactNode } from 'react';
import type { Notice, Source } from '@/content/types';
import { decodeFlightId } from '@/lib/flights';
import { useSavedJourney } from '@/lib/hooks/use-saved-journey';
import { useT } from '@/lib/i18n/client';
import { buildJourney, type JourneyAirportContent } from '@/lib/journey';
import { useFlightFeed, type FeedRequest } from '@/lib/providers/use-flight-feed';
import { dateKey } from '@/lib/time';
import { flightAvailability, sameFlightOn } from './board-model';
import { FeedNotice } from './feed-notice';
import { FlightActions, NEEDS_CONTROL_ID } from './flight-actions';
import { useFlightAlerts } from './flight-alerts';
import { FlightNotFound } from './flight-not-found';
import { FlightStatusHero, FlightStatusHeroSkeleton, type PublishedCheckIn } from './flight-status-hero';
import { FlightSummary, FlightSummarySkeleton } from './flight-summary';
import { FlightWatcher } from './flight-watcher';
import { JourneyTimeline, modesForFlight, useJourneyPreferences } from './journey-timeline';
import { NeedsControl } from './needs-control';

export interface FlightDetailProps {
  flightId: string;
  airport: string;
  /** The page title ("MH 2610 to London"), for sharing. */
  title: string;
  journeyContent: JourneyAirportContent;
  sources: Readonly<Record<string, Source>>;
  /** The airport's notices, for the status lines in the timeline (B-01). */
  notices?: readonly Notice[];
  /** The airline's published check-in area, for the card before the flight has a row (B-12). */
  publishedCheckIn?: PublishedCheckIn;
  /** "If your flight is delayed or cancelled", rendered on the server. Moves to the top when it applies. */
  disruption: ReactNode;
  /** Published facts about the airline at this airport, rendered on the server. */
  airlineFacts?: ReactNode;
}

/**
 * The live part of a flight page, from the server flight feed after hydration: the next-step
 * summary, the status card with Save and Follow, the journey timeline (with the visitor's needs
 * and trip options, and status lines), help and the airline's published facts. If the feed
 * fails, last-known data stays on screen with its age and a retry. Unknown, finished or
 * far-future flights get a helpful not-found state instead.
 */
export function FlightDetail({ flightId, airport, title, journeyContent, sources, notices, publishedCheckIn, disruption, airlineFacts }: FlightDetailProps) {
  const t = useT();
  const zone = journeyContent.airport.timezone;
  const parts = decodeFlightId(flightId);
  const feed = useFlightFeed((at): FeedRequest[] => {
    if (!parts) return [];
    const today = dateKey(at, zone);
    return [
      { airport, date: parts.date, direction: parts.direction },
      ...(today !== parts.date ? [{ airport, date: today, direction: parts.direction }] : []),
    ];
  });
  const provider = feed.provider;
  const flight = useMemo(() => provider?.getFlightSync(flightId, airport) ?? null, [provider, flightId, airport]);
  const { isFlightSaved } = useSavedJourney();
  const alerts = useFlightAlerts();
  const preferences = useJourneyPreferences();
  const saved = flight ? isFlightSaved(flight.id) : false;
  const alerted = flight ? alerts.ids.has(flight.id) : false;
  const watched = useMemo(() => (flight && (saved || alerted) ? [flight] : []), [flight, saved, alerted]);
  const summarySteps = useMemo(
    () => (flight && provider ? buildJourney({ flight, mode: modesForFlight(flight)[0], airportContent: journeyContent, now: provider.now, preferences }) : null),
    [flight, provider, journeyContent, preferences],
  );

  if (!provider) {
    return (
      <div className="flex flex-col gap-4">
        <FeedNotice feed={feed} timeZone={zone} />
        {feed.status === 'error' ? null : (
          <>
            <FlightSummarySkeleton />
            <FlightStatusHeroSkeleton />
          </>
        )}
      </div>
    );
  }

  const availability = parts ? flightAvailability(parts.date, provider.now, zone) : 'expired';
  if (!flight || availability !== 'current') {
    const todayId = sameFlightOn(flightId, dateKey(provider.now, zone));
    const today = todayId && todayId !== flightId.toLowerCase() ? provider.getFlightSync(todayId, airport) : null;
    return <FlightNotFound airport={airport} reason={!flight || availability === 'current' ? 'unknown' : availability} sameToday={today} />;
  }

  const disrupted = flight.status === 'delayed' || flight.status === 'cancelled';

  return (
    <div className="flex flex-col gap-10 lg:gap-14" data-answer-task="flight-status" data-answer-state="demo">
      <div className="flex flex-col gap-4">
        {summarySteps ? <FlightSummary flight={flight} steps={summarySteps} now={provider.now.getTime()} /> : null}
        <FeedNotice feed={feed} timeZone={zone} />
        <FlightStatusHero
          flight={flight}
          updatedAt={feed.updatedAt}
          refreshSeconds={feed.refreshSeconds}
          publishedCheckIn={publishedCheckIn}
        />
        <FlightActions flight={flight} title={title} />
      </div>
      {disrupted ? disruption : null}
      {/* Round 4 (re-review 6.1.6): on phones "My needs" comes before the timeline (it was eleven
          screens down); on wide screens it heads the side column, as before. */}
      <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:gap-y-5">
        <NeedsControl id={NEEDS_CONTROL_ID} tripOptions={flight.direction === 'd'} className="lg:col-start-2 lg:row-start-1" />
        <JourneyTimeline
          flight={flight}
          content={journeyContent}
          sources={sources}
          notices={notices}
          now={provider.now}
          title={t('journey.timeline.title')}
          headingId="flight-journey-title"
          className="lg:col-start-1 lg:row-span-2 lg:row-start-1"
        />
        <div className="flex flex-col gap-5 lg:col-start-2 lg:row-start-2">
          {disrupted ? null : disruption}
          {airlineFacts}
        </div>
      </div>
      <FlightWatcher flights={watched} announce={saved} alertIds={alerts.ids} timeZone={zone} />
    </div>
  );
}
