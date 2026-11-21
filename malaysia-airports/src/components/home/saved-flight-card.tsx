'use client';

import { useMemo } from 'react';
import { getAirport, localName } from '@/content/airports';
import { pick } from '@/content/values';
import { formatFlightNumber, isFinalStatus, isInternationalFlight, placeCity, type Flight } from '@/lib/flights';
import { useFlightProvider } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { RECOMMENDED_ARRIVAL_MINUTES, buildJourney } from '@/lib/journey';
import type { SavedFlight } from '@/lib/stores';
import { addMinutes, dateKey, formatTime } from '@/lib/time';
import { DemoTag } from '@/components/common/demo-tag';
import { FlightStatusChip } from '@/components/common/flight-status-chip';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { flightHref } from '@/components/flights/flight-row';
import { Icon } from '@/components/ui/icon';

interface Picked {
  flight: Flight;
  saved: SavedFlight;
  /** Saved flights after this one that are also today or later. */
  others: number;
}

/**
 * The visitor's saved flight on the home first screen (A-08): status, terminal, gate, the next
 * step of its timeline and, for departures, when to be at the airport. Demonstration data, and
 * labelled so. Loaded only when a flight is saved (`SavedFlightSlot`).
 */
export function SavedFlightCard({ flights }: { flights: readonly SavedFlight[] }) {
  const t = useT();
  const lang = useLang();
  const provider = useFlightProvider();

  const picked = useMemo<Picked | null>(() => {
    if (!provider) return null;
    const now = provider.meta().generatedAt;
    const today = dateKey(now);
    const found = flights
      .filter((saved) => saved.date >= today)
      .map((saved) => ({ saved, flight: provider.getFlightSync(saved.id, saved.airport) }))
      .flatMap((item) => (item.flight ? [{ saved: item.saved, flight: item.flight as Flight }] : []));
    const [head] = found;
    return head ? { flight: head.flight, saved: head.saved, others: found.length - 1 } : null;
  }, [provider, flights]);

  const next = useMemo(() => {
    if (!picked || !provider) return null;
    const airport = getAirport(picked.flight.airport);
    if (!airport) return null;
    const mode = picked.saved.mode ?? (picked.flight.direction === 'd' ? 'departing' : 'arriving');
    const steps = buildJourney({ flight: picked.flight, mode, airportContent: { airport, guidesNotes: [] }, now: provider.meta().generatedAt });
    return steps.find((step) => step.state === 'current') ?? steps.find((step) => step.state === 'upcoming') ?? null;
  }, [picked, provider]);

  if (!provider) return <div aria-hidden="true" className="saved-flight-size rounded-lg border border-line-strong bg-surface" />;
  if (!picked) return null;

  const { flight, others } = picked;
  const departing = flight.direction === 'd';
  const arriveBy =
    departing && !isFinalStatus(flight.status)
      ? formatTime(addMinutes(flight.scheduled, -(isInternationalFlight(flight) ? RECOMMENDED_ARRIVAL_MINUTES.international : RECOMMENDED_ARRIVAL_MINUTES.domestic)))
      : null;
  const place = placeCity(departing ? flight.destination : flight.origin, lang);

  return (
    <section
      aria-labelledby="saved-flight-title"
      className="saved-flight-size flex flex-col gap-2 rounded-lg border border-ink bg-surface px-3 py-2.5 shadow-sm sm:px-4 sm:py-3"
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <h2 id="saved-flight-title" className="type-eyebrow flex items-center gap-1.5 text-ink-2">
          <Icon name="bookmark-check" size="sm" className="text-primary-ink" />
          {t('shellExtras.savedFlight.title')}
        </h2>
        <DemoTag />
        <LocaleLink href="/journey" className="link-action type-body-sm ml-auto text-ink">
          {others > 0 ? t.count('shellExtras.savedFlight.more', others) : t('shellExtras.savedFlight.journey')}
          <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
        </LocaleLink>
      </div>
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <LocaleLink href={flightHref(flight)} className="type-data-lg link font-semibold text-ink">
          {formatFlightNumber(flight)}
        </LocaleLink>
        <span className="type-title-sm min-w-0 text-ink">{departing ? t('shellExtras.savedFlight.to', { place }) : t('shellExtras.savedFlight.from', { place })}</span>
        <span className="type-data-md text-ink-2">{formatTime(flight.estimated)}</span>
        <FlightStatusChip status={flight.status} size="sm" />
      </p>
      <dl className="type-body-sm grid grid-cols-[auto_auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 text-ink-2 max-xs:grid-cols-2">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">{t('common.labels.terminal')}</dt>
          <dd>
            {flight.terminal === 'MAIN' ? <span className="text-ink">{localName(flight.airport, lang)}</span> : <TerminalBadge terminal={flight.terminal} size="sm" />}
          </dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt>{departing ? t('shellExtras.savedFlight.gate') : t('shellExtras.savedFlight.belt')}</dt>
          <dd className="type-data-md font-semibold text-ink">
            {departing ? (flight.gate ?? <span className="type-body-sm font-normal text-ink-2">{t('shellExtras.savedFlight.notAssigned')}</span>) : (flight.belt ?? <span className="type-body-sm font-normal text-ink-2">{t('shellExtras.savedFlight.notAssigned')}</span>)}
          </dd>
        </div>
        <div className="flex min-w-0 items-baseline gap-1.5 max-xs:col-span-2">
          <dt>{arriveBy ? t('shellExtras.savedFlight.arriveByLabel') : t('shellExtras.savedFlight.next')}</dt>
          <dd className="min-w-0 font-semibold text-ink">
            {arriveBy ? (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <span className="type-data-md">{arriveBy}</span>
                <ProvenanceTag provenance="estimated" length="short" />
              </span>
            ) : next ? (
              <>
                {pick(next.title, lang)}
                {/* Round 2: no second time when the step title already says it ("Board from 10:50"). */}
                {next.time && !pick(next.title, lang).includes(formatTime(next.time)) ? <span className="type-data-md ml-1.5 font-normal text-ink-2">{formatTime(next.time)}</span> : null}
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>
      {arriveBy && next ? (
        <p className="type-caption text-ink-2">
          {t('shellExtras.savedFlight.next')}: <span className="font-semibold text-ink">{pick(next.title, lang)}</span>
          {next.time && !pick(next.title, lang).includes(formatTime(next.time)) ? <span className="tabular"> {formatTime(next.time)}</span> : null}
        </p>
      ) : null}
    </section>
  );
}
