'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { getAirport } from '@/content/airports';
import type { Notice, Source } from '@/content/types';
import type { Flight } from '@/lib/flights';
import { useSavedJourney } from '@/lib/hooks/use-saved-journey';
import { useLang, useT } from '@/lib/i18n/client';
import { buildJourney, type JourneyAirportContent, type JourneyStep } from '@/lib/journey';
import { useFlightFeed, type FeedRequest } from '@/lib/providers/use-flight-feed';
import type { SavedFlight } from '@/lib/stores';
import { DemoDataBanner } from '@/components/common/demo-data-banner';
import { Freshness } from '@/components/common/freshness';
import { Skeleton } from '@/components/ui/skeleton';
import { flightAvailability } from './board-model';
import { ClearJourney } from './clear-journey';
import { FeedNotice } from './feed-notice';
import { useFlightAlerts } from './flight-alerts';
import { FlightWatcher } from './flight-watcher';
import { flightTitle } from './identify-flight';
import { JOURNEY_EMPTY_HEADING_ID, JourneyEmpty } from './journey-empty';
import { JourneyTimeline, modesForFlight, useJourneyPreferences } from './journey-timeline';
import { ParkedCarCard, type CarParkOption } from './parked-car-card';
import { SavedFlightCard } from './saved-flight-card';
import { SavedPlaces } from './saved-places';

export interface MyJourneyProps {
  carParks: readonly CarParkOption[];
}

/** One airport's journey content, as `/[lang]/journey/content/[airport]` serves it. */
type LoadedContent = Omit<JourneyAirportContent, 'airport'> & { slug: string; notices: Notice[]; sources: Record<string, Source> };

/* Loaded once per airport and language for the tab; shared by every render. */
const contentCache = new Map<string, LoadedContent | 'loading' | 'failed'>();
const contentListeners = new Set<() => void>();
let contentVersion = 0;
const subscribeContent = (listener: () => void) => {
  contentListeners.add(listener);
  return () => {
    contentListeners.delete(listener);
  };
};

function loadContent(lang: string, slug: string): void {
  const key = `${lang}|${slug}`;
  if (contentCache.has(key)) return;
  contentCache.set(key, 'loading');
  fetch(`/${lang}/journey/content/${slug}`)
    .then((response) => (response.ok ? (response.json() as Promise<LoadedContent>) : Promise.reject(new Error(String(response.status)))))
    .then((body) => contentCache.set(key, body))
    .catch(() => contentCache.set(key, 'failed'))
    .finally(() => {
      contentVersion += 1;
      for (const listener of [...contentListeners]) listener();
    });
}

interface Entry {
  saved: SavedFlight;
  /** `undefined` while loading, `null` when it is off the demonstration board. */
  flight: Flight | null | undefined;
  next?: JourneyStep;
}

const SAVED_FLIGHTS_HEADING_ID = 'saved-flights-title';
const STEPS_HEADING_ID = 'journey-steps-title';

/**
 * My journey: saved flights with live demo status, the selected flight's timeline, the parked-car
 * note, saved places and clear-all. Everything comes from this device's storage; status comes
 * from the flight feed and is labelled as such.
 *
 * Loading without layout shift (performance-06): the server HTML holds the empty state (the
 * storage hook's server snapshot is an empty journey), and saved flights replace it in place
 * once storage is read. The top section keeps a minimum height, so what sits below it is already
 * out of the first screen and does not move. Each airport's notes and sources are fetched only
 * when a saved flight needs them.
 */
export function MyJourney({ carParks }: MyJourneyProps) {
  const t = useT();
  const lang = useLang();
  const { journey, removeFlight } = useSavedJourney();
  const preferences = useJourneyPreferences();
  const loaded = useSyncExternalStore(
    subscribeContent,
    () => contentVersion,
    () => 0,
  );
  const slugs = useMemo(() => [...new Set(journey.flights.map((flight) => flight.airport))], [journey.flights]);
  useEffect(() => {
    for (const slug of slugs) loadContent(lang, slug);
  }, [slugs, lang]);
  const feed = useFlightFeed((at): FeedRequest[] =>
    journey.flights
      .filter((saved) => {
        const airport = getAirport(saved.airport);
        return airport ? flightAvailability(saved.date, at, airport.timezone) === 'current' : false;
      })
      .map((saved) => ({ airport: saved.airport, date: saved.date, direction: saved.id.endsWith('-a') ? 'a' : 'd' })),
  );
  const provider = journey.flights.length > 0 ? feed.provider : null;
  const alerts = useFlightAlerts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const savedHeading = useRef<HTMLHeadingElement>(null);

  /* The airport slice each saved flight's timeline needs: notes once loaded, none until then. */
  const contents = useMemo(() => {
    void loaded;
    const map = new Map<string, JourneyAirportContent & { notices?: Notice[]; sources?: Record<string, Source> }>();
    for (const slug of slugs) {
      const airport = getAirport(slug);
      if (!airport) continue;
      const entry = contentCache.get(`${lang}|${slug}`);
      map.set(slug, typeof entry === 'object' ? { ...entry, airport } : { airport, guidesNotes: [] });
    }
    return map;
  }, [slugs, lang, loaded]);

  const entries = useMemo<Entry[]>(() => {
    const list = journey.flights.map((saved): Entry => {
      if (!provider) return { saved, flight: undefined };
      const content = contents.get(saved.airport);
      if (!content || flightAvailability(saved.date, provider.now, content.airport.timezone) !== 'current') return { saved, flight: null };
      const flight = provider.getFlightSync(saved.id, saved.airport);
      if (!flight) return { saved, flight: null };
      const mode = saved.mode && modesForFlight(flight).includes(saved.mode) ? saved.mode : modesForFlight(flight)[0];
      const next = buildJourney({ flight, mode, airportContent: content, now: provider.now, preferences }).find(
        (step) => step.state === 'current' || (step.state === 'upcoming' && step.kind !== 'status'),
      );
      return { saved, flight, next };
    });
    if (!provider) return list;
    // Flights still to come first, by expected time; flights off the board last.
    return list.sort((a, b) => {
      if (!a.flight || !b.flight) return a.flight ? -1 : b.flight ? 1 : 0;
      return Date.parse(a.flight.estimated) - Date.parse(b.flight.estimated);
    });
  }, [journey.flights, provider, contents, preferences]);

  const live = useMemo(() => entries.flatMap((entry) => (entry.flight ? [entry.flight] : [])), [entries]);
  const selected = entries.find((entry) => entry.flight && entry.saved.id === selectedId) ?? entries.find((entry) => entry.flight);
  const selectedContent = selected?.flight ? contents.get(selected.flight.airport) : undefined;

  const select = (id: string) => {
    setSelectedId(id);
    // On one column the steps sit below the list: bring them into view.
    if (window.matchMedia('(max-width: 63.99rem)').matches) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
      window.requestAnimationFrame(() => document.getElementById(STEPS_HEADING_ID)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }));
    }
  };
  const remove = (id: string) => {
    removeFlight(id);
    alerts.disable(id);
    window.requestAnimationFrame(() => (savedHeading.current ?? document.getElementById(JOURNEY_EMPTY_HEADING_ID))?.focus());
  };

  const nothingSaved = journey.flights.length === 0 && journey.places.length === 0 && !journey.parkedCar;

  return (
    <div className="flex flex-col gap-12 lg:gap-16">
      {/* A first-screen minimum: swapping the empty state for saved flights moves nothing in view. */}
      <div className="min-h-[70svh]">
      {journey.flights.length === 0 ? (
        <JourneyEmpty />
      ) : (
        <section aria-labelledby={SAVED_FLIGHTS_HEADING_ID} className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <h2 id={SAVED_FLIGHTS_HEADING_ID} ref={savedHeading} tabIndex={-1} className="type-display-sm text-ink">
                {t('journey.saved.flights')}
              </h2>
              <p className="type-body-sm mt-1 text-ink-2">{t.count('flightPages.journey.flightsCount', journey.flights.length)}</p>
            </div>
            <Freshness live="off" updatedAt={feed.updatedAt} refreshSeconds={feed.refreshSeconds} />
          </div>
          <DemoDataBanner />
          <FeedNotice feed={feed} />
          <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
            <ul aria-labelledby={SAVED_FLIGHTS_HEADING_ID} className="flex flex-col gap-3">
              {entries.map((entry) => (
                <SavedFlightCard
                  key={entry.saved.id}
                  saved={entry.saved}
                  flight={entry.flight}
                  now={provider?.now ?? null}
                  next={entry.next}
                  selected={Boolean(entry.flight) && selected?.saved.id === entry.saved.id}
                  alertsOn={alerts.ids.has(entry.saved.id)}
                  onSelect={() => select(entry.saved.id)}
                  onRemove={() => remove(entry.saved.id)}
                />
              ))}
            </ul>
            {selected?.flight && selectedContent && provider ? (
              <JourneyTimeline
                key={selected.flight.id}
                flight={selected.flight}
                content={selectedContent}
                sources={selectedContent.sources ?? {}}
                notices={selectedContent.notices}
                now={provider.now}
                title={t('flightPages.journey.journeyFor', { flight: flightTitle(selected.flight, t) })}
                headingId={STEPS_HEADING_ID}
                preferredMode={selected.saved.mode}
                className="scroll-mt-24 rounded-xl border border-line-strong bg-surface p-5 sm:p-7"
              />
            ) : provider === null ? (
              <Skeleton className="h-96 w-full" />
            ) : null}
          </div>
        </section>
      )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <ParkedCarCard carParks={carParks} />
        <SavedPlaces />
      </div>

      {nothingSaved ? null : (
        <div className="flex justify-end border-t border-line pt-6">
          <ClearJourney
            onCleared={() => {
              setAnnouncement(t('flightPages.journey.clear.done'));
              document.getElementById(JOURNEY_EMPTY_HEADING_ID)?.focus();
            }}
          />
        </div>
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <FlightWatcher flights={provider ? live : null} alertIds={alerts.ids} />
    </div>
  );
}
