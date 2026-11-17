'use client';

import { useMemo, useRef, useState } from 'react';
import { getAirport } from '@/content/airports';
import type { GuideNote, Source } from '@/content/types';
import type { Flight } from '@/lib/flights';
import { useFlightProvider, useSavedJourney } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { buildJourney, type JourneyAirportContent, type JourneyStep } from '@/lib/journey';
import type { SavedFlight } from '@/lib/stores';
import { DemoDataBanner } from '@/components/common/demo-data-banner';
import { Freshness } from '@/components/common/freshness';
import { Skeleton } from '@/components/ui/skeleton';
import { flightAvailability } from './board-model';
import { ClearJourney } from './clear-journey';
import { useFlightAlerts } from './flight-alerts';
import { FlightWatcher } from './flight-watcher';
import { flightTitle } from './identify-flight';
import { JOURNEY_EMPTY_HEADING_ID, JourneyEmpty } from './journey-empty';
import { JourneyTimeline, modesForFlight } from './journey-timeline';
import { ParkedCarCard, type CarParkOption } from './parked-car-card';
import { SavedFlightCard } from './saved-flight-card';
import { SavedPlaces } from './saved-places';

export interface MyJourneyProps {
  /** Sourced airport notes for the journey timeline, by airport slug (airports with content only). */
  notes: Readonly<Record<string, readonly GuideNote[]>>;
  /** Sources cited by those notes, by id. */
  sources: Readonly<Record<string, Source>>;
  carParks: readonly CarParkOption[];
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
 * from the demonstration provider and is labelled as such.
 */
export function MyJourney({ notes, sources, carParks }: MyJourneyProps) {
  const t = useT();
  const provider = useFlightProvider();
  const { journey, hydrated, removeFlight } = useSavedJourney();
  const alerts = useFlightAlerts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const savedHeading = useRef<HTMLHeadingElement>(null);

  /* The airport slice each saved flight's timeline needs, built once per change of the list. */
  const contents = useMemo(() => {
    const map = new Map<string, JourneyAirportContent>();
    for (const saved of journey.flights) {
      const airport = map.has(saved.airport) ? undefined : getAirport(saved.airport);
      if (airport) map.set(saved.airport, { airport, guidesNotes: [...(notes[saved.airport] ?? [])] });
    }
    return map;
  }, [journey.flights, notes]);

  const entries = useMemo<Entry[]>(() => {
    const list = journey.flights.map((saved): Entry => {
      if (!provider) return { saved, flight: undefined };
      const content = contents.get(saved.airport);
      if (!content || flightAvailability(saved.date, provider.now, content.airport.timezone) !== 'current') return { saved, flight: null };
      const flight = provider.getFlightSync(saved.id, saved.airport);
      if (!flight) return { saved, flight: null };
      const mode = saved.mode && modesForFlight(flight).includes(saved.mode) ? saved.mode : modesForFlight(flight)[0];
      const next = buildJourney({ flight, mode, airportContent: content, now: provider.now }).find((step) => step.state !== 'done');
      return { saved, flight, next };
    });
    if (!provider) return list;
    // Flights still to come first, by expected time; flights off the board last.
    return list.sort((a, b) => {
      if (!a.flight || !b.flight) return a.flight ? -1 : b.flight ? 1 : 0;
      return Date.parse(a.flight.estimated) - Date.parse(b.flight.estimated);
    });
  }, [journey.flights, provider, contents]);

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

  if (!hydrated) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <span className="sr-only">{t('common.labels.loading')}</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const nothingSaved = journey.flights.length === 0 && journey.places.length === 0 && !journey.parkedCar;

  return (
    <div className="flex flex-col gap-12 lg:gap-16">
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
            <Freshness live="off" updatedAt={provider?.meta().generatedAt ?? null} refreshSeconds={provider?.meta().refreshSeconds} />
          </div>
          <DemoDataBanner />
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
                sources={sources}
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
