'use client';

import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Notice, Source } from '@/content/types';
import { decodeFlightId } from '@/lib/flights';
import { useSavedJourney } from '@/lib/hooks/use-saved-journey';
import { useT } from '@/lib/i18n/client';
import type { JourneyAirportContent } from '@/lib/journey';
import { useFlightFeed, type FeedRequest } from '@/lib/providers/use-flight-feed';
import { retryableLazy, retryingImport } from '@/lib/retrying-import';
import { dateKey } from '@/lib/time';
import { PartBoundary } from '@/components/common/part-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { flightAvailability, sameFlightOn } from './board-model';
import { FeedNotice } from './feed-notice';
import { FlightActions, NEEDS_CONTROL_ID } from './flight-actions';
import { useFlightAlerts } from './flight-alerts';
import type { FlightIdentity } from './flight-identity';
import { FlightStatusHero, type PublishedCheckIn } from './flight-status-hero';
import { FlightSummary } from './flight-summary';
import { FlightWatcher } from './flight-watcher';
import { modesForFlight, useJourneyPreferences } from './journey-preferences';

/*
 * Round 5 (E-03): the parts below the status card, and the rare not-found states, load as their
 * own chunks after the first paint instead of with the page (first-load JavaScript 249 KB, the
 * budget 250). They render only once the feed has answered, so loading them at idle costs no
 * visible time; the journey builder behind the summary loads alongside the feed.
 */
// Verification, round 5: a chunk that could not be fetched (a dropped connection) is fetched again
// when the connection returns, instead of the rejection replacing the page with the error screen.
const loadTimeline = () => retryingImport(() => import('./journey-timeline'));
const loadNeeds = () => retryingImport(() => import('./needs-control'));
const loadNotFound = () => retryingImport(() => import('./flight-not-found'));
const loadJourney = () => retryingImport(() => import('@/lib/journey'));
// Round 6 (review-3 9.1 item 1): each part also sits in its own `PartBoundary` below.
const JourneyTimeline = retryableLazy(() => loadTimeline().then((module) => module.JourneyTimeline));
const NeedsControl = retryableLazy(() => loadNeeds().then((module) => module.NeedsControl));
const FlightNotFound = retryableLazy(() => loadNotFound().then((module) => module.FlightNotFound));

type JourneyModule = Awaited<ReturnType<typeof loadJourney>>;
let journeyModule: JourneyModule | null = null;

/** The journey builder, fetched once after hydration (it is only needed with the feed's answer). */
function useJourneyModule(): JourneyModule | null {
  const [module, setModule] = useState<JourneyModule | null>(journeyModule);
  useEffect(() => {
    if (module) return;
    let live = true;
    void loadJourney().then((loaded) => {
      journeyModule = loaded;
      if (live) setModule(loaded);
    });
    return () => {
      live = false;
    };
  }, [module]);
  return module;
}

export interface FlightDetailProps {
  flightId: string;
  airport: string;
  /** The page title ("MH 2610 to London"), for sharing. */
  title: string;
  /**
   * What the timetable says about the flight without the clock (route, scheduled time, terminal),
   * resolved on the server: the status card shows it in the first paint, the rest follows.
   */
  identity: FlightIdentity;
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
 * Room for the needs control and the timeline while they load, so the footer does not jump up and
 * back. It carries the needs control's anchor until the control arrives (verification, round 5): a
 * tap on "My needs" before then lands where the control will be, instead of on nothing.
 */
function LowerPlaceholder() {
  return (
    <div id={NEEDS_CONTROL_ID} aria-hidden="true" className="grid scroll-mt-28 items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)]">
      <Skeleton className="h-96 w-full rounded-lg lg:col-start-1 lg:row-start-1" />
      <Skeleton className="h-56 w-full rounded-lg max-lg:hidden lg:col-start-2 lg:row-start-1" />
    </div>
  );
}

/**
 * The live part of a flight page, from the server flight feed after hydration: the next-step
 * summary, the status card with Save and Follow, the journey timeline (with the visitor's needs
 * and trip options, and status lines), help and the airline's published facts. If the feed
 * fails, last-known data stays on screen with its age and a retry. Unknown, finished or
 * far-future flights get a helpful not-found state instead.
 *
 * Round 5 (E-01, E-02): the summary frame and the status card are the same elements before and
 * after the feed answers. Before, they hold the timetable facts and placeholders; after, the
 * same elements are filled in. Nothing large is painted late as a new block (the flight page's
 * LCP was the summary, painted after the feed at 4.2 to 5.3 s on a slow phone), and nothing
 * below them moves when the status arrives.
 */
export function FlightDetail({ flightId, airport, title, identity, journeyContent, sources, notices, publishedCheckIn, disruption, airlineFacts }: FlightDetailProps) {
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
  const journey = useJourneyModule();
  const flight = useMemo(() => provider?.getFlightSync(flightId, airport) ?? null, [provider, flightId, airport]);
  const { isFlightSaved } = useSavedJourney();
  const alerts = useFlightAlerts();
  const preferences = useJourneyPreferences();
  const saved = flight ? isFlightSaved(flight.id) : false;
  const alerted = flight ? alerts.ids.has(flight.id) : false;
  const watched = useMemo(() => (flight && (saved || alerted) ? [flight] : []), [flight, saved, alerted]);
  const summarySteps = useMemo(
    () => (flight && provider && journey ? journey.buildJourney({ flight, mode: modesForFlight(flight)[0], airportContent: journeyContent, now: provider.now, preferences }) : null),
    [flight, provider, journey, journeyContent, preferences],
  );

  // Fetch the parts below the card while the feed loads, so they are ready when it answers.
  useEffect(() => {
    void loadTimeline();
    void loadNeeds();
  }, []);

  const availability = provider && parts ? flightAvailability(parts.date, provider.now, zone) : provider ? 'expired' : null;
  if (provider && (!flight || availability !== 'current')) {
    const todayId = sameFlightOn(flightId, dateKey(provider.now, zone));
    const today = todayId && todayId !== flightId.toLowerCase() ? provider.getFlightSync(todayId, airport) : null;
    return (
      <PartBoundary onRetry={FlightNotFound.renew}>
        <Suspense fallback={<LowerPlaceholder />}>
          <FlightNotFound airport={airport} reason={!flight || availability === 'current' ? 'unknown' : (availability ?? 'unknown')} sameToday={today} />
        </Suspense>
      </PartBoundary>
    );
  }

  // `flight` here is the live, current flight once the feed has answered; until then the card
  // shows the identity. When the feed fails before its first answer, only the notice and its
  // retry remain (no placeholder that would never fill).
  const live = provider && flight ? flight : null;
  const now = provider?.now ?? null;
  const failed = !provider && feed.status === 'error';
  const disrupted = live ? live.status === 'delayed' || live.status === 'cancelled' : false;

  return (
    // The answer is declared once there is one (E-17), as before round 5.
    <div className="flex flex-col gap-10 lg:gap-14" data-answer-task={live ? 'flight-status' : undefined} data-answer-state={live ? 'demo' : undefined}>
      <div className="flex flex-col gap-4">
        {failed ? null : <FlightSummary flight={live} steps={live ? summarySteps : null} now={now?.getTime() ?? 0} />}
        <FeedNotice feed={feed} timeZone={zone} />
        {failed ? null : live ? (
          <FlightStatusHero flight={live} updatedAt={feed.updatedAt} refreshSeconds={feed.refreshSeconds} publishedCheckIn={publishedCheckIn} />
        ) : (
          <FlightStatusHero flight={identity} pending updatedAt={null} refreshSeconds={feed.refreshSeconds} publishedCheckIn={publishedCheckIn} />
        )}
        {live ? <FlightActions flight={live} title={title} /> : null}
      </div>
      {live && disrupted ? disruption : null}
      {live && now ? (
        // Round 4 (re-review 6.1.6): on phones "My needs" comes before the timeline (it was eleven
        // screens down); on wide screens it heads the side column, as before.
        <PartBoundary
          id={NEEDS_CONTROL_ID}
          onRetry={() => {
            NeedsControl.renew();
            JourneyTimeline.renew();
          }}
        >
        <Suspense fallback={<LowerPlaceholder />}>
          <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:gap-y-5">
            <NeedsControl id={NEEDS_CONTROL_ID} tripOptions={live.direction === 'd'} className="lg:col-start-2 lg:row-start-1" />
            <JourneyTimeline
              flight={live}
              content={journeyContent}
              sources={sources}
              notices={notices}
              now={now}
              title={t('journey.timeline.title')}
              headingId="flight-journey-title"
              headingSize="md"
              className="lg:col-start-1 lg:row-span-2 lg:row-start-1"
            />
            <div className="flex flex-col gap-5 lg:col-start-2 lg:row-start-2">
              {disrupted ? null : disruption}
              {airlineFacts}
            </div>
          </div>
        </Suspense>
        </PartBoundary>
      ) : failed ? null : (
        <LowerPlaceholder />
      )}
      {live ? <FlightWatcher flights={watched} announce={saved} alertIds={alerts.ids} timeZone={zone} /> : null}
    </div>
  );
}
