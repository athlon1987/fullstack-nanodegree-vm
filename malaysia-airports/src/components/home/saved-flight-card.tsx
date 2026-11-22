'use client';

import { useMemo } from 'react';
import { getAirport, localName } from '@/content/airports';
import { formatFlightNumber, placeCity, type Flight } from '@/lib/flights';
import { useLang, useT } from '@/lib/i18n/client';
import { buildJourney, nextDeadline, nextStepSummary, type StepSummary, type TravelDeadline } from '@/lib/journey';
import { DEADLINE_KEYS, StepLine } from '@/components/flights/step-line';
import { useFlightFeed, type FeedRequest } from '@/lib/providers/use-flight-feed';
import type { SavedFlight } from '@/lib/stores';
import { dateKey, formatTime } from '@/lib/time';
import { DemoTag } from '@/components/common/demo-tag';
import { FlightStatusChip } from '@/components/common/flight-status-chip';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { FeedNotice } from '@/components/flights/feed-notice';
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
 * step of its timeline and, for departures, the deadline that still matters: be at the airport by,
 * then check-in closes, then boarding (round 4, 6.1.2: at 18:21 it said "Be at the airport by
 * 16:35 · Next: Check in 16:35"). No time shown is ever in the past, and every time follows the
 * flight's estimated time, as the timeline does. Demonstration data, and
 * labelled so. Loaded only when a flight is saved (`SavedFlightSlot`). The flights come from the
 * server flight feed (round 3, E-03): one board per saved airport, date and direction.
 */
export function SavedFlightCard({ flights }: { flights: readonly SavedFlight[] }) {
  const t = useT();
  const lang = useLang();
  const feed = useFlightFeed((at): FeedRequest[] => {
    const today = dateKey(at);
    return flights.filter((saved) => saved.date >= today).map((saved) => ({ airport: saved.airport, date: saved.date, direction: saved.direction }));
  });
  const provider = feed.provider;

  const picked = useMemo<Picked | null>(() => {
    if (!provider) return null;
    const today = dateKey(provider.now);
    const found = flights
      .filter((saved) => saved.date >= today)
      .map((saved) => ({ saved, flight: provider.getFlightSync(saved.id, saved.airport) }))
      .flatMap((item) => (item.flight ? [{ saved: item.saved, flight: item.flight as Flight }] : []));
    const [head] = found;
    return head ? { flight: head.flight, saved: head.saved, others: found.length - 1 } : null;
  }, [provider, flights]);

  const { next, deadline } = useMemo<{ next: StepSummary | null; deadline: TravelDeadline | null }>(() => {
    if (!picked || !provider) return { next: null, deadline: null };
    const airport = getAirport(picked.flight.airport);
    if (!airport) return { next: null, deadline: null };
    const mode = picked.saved.mode ?? (picked.flight.direction === 'd' ? 'departing' : 'arriving');
    const steps = buildJourney({ flight: picked.flight, mode, airportContent: { airport, guidesNotes: [] }, now: provider.now });
    return { next: nextStepSummary(steps, provider.now), deadline: nextDeadline(picked.flight, provider.now) };
  }, [picked, provider]);

  // Only past flights saved: nothing to fetch, so nothing to show (as before the feed).
  const today = feed.now === null ? null : dateKey(feed.now);
  if (today !== null && !flights.some((saved) => saved.date >= today)) return null;
  if (!provider) return feed.status === 'error' ? <FeedNotice feed={feed} /> : <div aria-hidden="true" className="saved-flight-size rounded-2xl border border-[rgb(255_255_255/0.4)] bg-surface shadow-lg" />;
  if (!picked) return null;

  const { flight, others } = picked;
  const departing = flight.direction === 'd';
  const place = placeCity(departing ? flight.destination : flight.origin, lang);

  function stepWhen(summary: StepSummary): string {
    return summary.when === 'now' ? t('flightPages.journey.now') : t('shellExtras.savedFlight.next');
  }

  return (
    <section
      aria-labelledby="saved-flight-title"
      className="saved-flight-size flex flex-col gap-2 rounded-2xl border border-[rgb(255_255_255/0.4)] bg-surface px-3 py-2.5 shadow-lg sm:px-4 sm:py-3"
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
          <dt>{deadline ? t(DEADLINE_KEYS[deadline.kind]) : next ? stepWhen(next) : t('shellExtras.savedFlight.next')}</dt>
          <dd className="min-w-0 font-semibold text-ink">
            {deadline ? (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <span className="type-data-md">{formatTime(deadline.time)}</span>
                {deadline.provenance === 'estimated' ? <ProvenanceTag provenance="estimated" length="short" /> : null}
              </span>
            ) : next ? (
              <StepLine summary={next} />
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>
      {deadline && next ? (
        <p className="type-caption text-ink-2">
          {stepWhen(next)}: <StepLine summary={next} hideTime={next.time === deadline.time} />
        </p>
      ) : null}
    </section>
  );
}

