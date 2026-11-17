'use client';

import { useMemo, type ReactNode } from 'react';
import type { Source } from '@/content/types';
import { decodeFlightId } from '@/lib/flights';
import { useFlightProvider, useSavedJourney } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import type { JourneyAirportContent } from '@/lib/journey';
import { dateKey } from '@/lib/time';
import { flightAvailability, sameFlightOn } from './board-model';
import { FlightActions } from './flight-actions';
import { useFlightAlerts } from './flight-alerts';
import { FlightAlertsPanel } from './flight-alerts-panel';
import { FlightNotFound } from './flight-not-found';
import { FlightStatusHero, FlightStatusHeroSkeleton } from './flight-status-hero';
import { FlightWatcher } from './flight-watcher';
import { JourneyTimeline } from './journey-timeline';

export interface FlightDetailProps {
  flightId: string;
  airport: string;
  /** The page title ("MH 2610 to London"), for sharing. */
  title: string;
  journeyContent: JourneyAirportContent;
  sources: Readonly<Record<string, Source>>;
  /** "If your flight is delayed or cancelled", rendered on the server. Moves to the top when it applies. */
  disruption: ReactNode;
  /** Published facts about the airline at this airport, rendered on the server. */
  airlineFacts?: ReactNode;
}

/**
 * The live part of a flight page, computed after hydration from the demo provider: the status
 * hero, actions, the journey timeline, demo alerts and help. Unknown, finished or far-future
 * flights get a helpful not-found state instead.
 */
export function FlightDetail({ flightId, airport, title, journeyContent, sources, disruption, airlineFacts }: FlightDetailProps) {
  const t = useT();
  const provider = useFlightProvider();
  const zone = journeyContent.airport.timezone;
  const flight = useMemo(() => provider?.getFlightSync(flightId, airport) ?? null, [provider, flightId, airport]);
  const { isFlightSaved } = useSavedJourney();
  const alerts = useFlightAlerts();
  const saved = flight ? isFlightSaved(flight.id) : false;
  const alerted = flight ? alerts.ids.has(flight.id) : false;
  const watched = useMemo(() => (flight && (saved || alerted) ? [flight] : []), [flight, saved, alerted]);

  if (!provider) return <FlightStatusHeroSkeleton />;

  const parts = decodeFlightId(flightId);
  const availability = parts ? flightAvailability(parts.date, provider.now, zone) : 'expired';
  if (!flight || availability !== 'current') {
    const todayId = sameFlightOn(flightId, dateKey(provider.now, zone));
    const today = todayId && todayId !== flightId.toLowerCase() ? provider.getFlightSync(todayId, airport) : null;
    return <FlightNotFound airport={airport} reason={!flight || availability === 'current' ? 'unknown' : availability} sameToday={today} />;
  }

  const disrupted = flight.status === 'delayed' || flight.status === 'cancelled';

  return (
    <div className="flex flex-col gap-10 lg:gap-14">
      <div className="flex flex-col gap-4">
        <FlightStatusHero flight={flight} updatedAt={provider.meta().generatedAt} refreshSeconds={provider.meta().refreshSeconds} />
        <FlightActions flight={flight} title={title} />
      </div>
      {disrupted ? disruption : null}
      <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)]">
        <JourneyTimeline
          flight={flight}
          content={journeyContent}
          sources={sources}
          now={provider.now}
          title={t('journey.timeline.title')}
          headingId="flight-journey-title"
        />
        <div className="flex flex-col gap-5">
          <FlightAlertsPanel flight={flight} />
          {disrupted ? null : disruption}
          {airlineFacts}
        </div>
      </div>
      <FlightWatcher flights={watched} announce={saved} alertIds={alerts.ids} timeZone={zone} />
    </div>
  );
}
