'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { FEATURED_AIRPORT_SLUGS, getAirport, localizeAirport, terminalLabel } from '@/content/airports';
import type { TerminalId } from '@/content/types';
import type { Flight } from '@/lib/flights';
import { useAirportContext } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { useFlightFeed, type FeedRequest } from '@/lib/providers/use-flight-feed';
import { DEFAULT_TIMEZONE, addMinutes, dateKey, formatDate, type Instant } from '@/lib/time';
import { AirportCode } from '@/components/common/airport-code';
import { LocaleLink } from '@/components/common/locale-link';
import { datesInRange } from '@/components/flights/board-model';
import { FeedNotice } from '@/components/flights/feed-notice';
import { FlightBoard } from '@/components/flights/flight-board';
import { rowDayLabel } from '@/components/flights/flight-row';
import { useFlightDirection } from '@/components/flights/flight-direction';
import { overlays } from '@/components/shell/overlay-store';
import { hasSection, sectionPath } from '@/components/shell/sections';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { Icon } from '@/components/ui/icon';
import { previewFlights } from './preview-filter';

export interface BoardPreviewProps {
  /** Fix the preview to this airport (airport pages). Omit it to follow the remembered airport. */
  airport?: string;
  terminal?: TerminalId;
  /** Number of rows. */
  rows?: number;
  headingLevel?: 2 | 3;
  className?: string;
}

/** A day ahead, so a quiet night still fills the preview with the first flights of the morning. */
const previewRange = (now: Instant) => ({ from: addMinutes(now, -10), to: addMinutes(now, 24 * 60) });

/**
 * The next departures (or arrivals: it follows the Departures/Arrivals switch and the journey
 * mode) on the board surface, under the demonstration banner, with a freshness row. With no
 * airport chosen it shows the next flights across the main airports, with an Airport column.
 *
 * The flights come from the server flight feed (round 3, E-03), one batched request per local
 * date for the airports shown, so the demo generator is no longer part of the page's JavaScript.
 */
export function BoardPreview({ airport, terminal, rows = 8, headingLevel = 2, className }: BoardPreviewProps) {
  const t = useT();
  const lang = useLang();
  const context = useAirportContext();
  const { direction: liveDirection } = useFlightDirection();
  // The board follows the mode and direction switches at a lower priority, so the switches
  // themselves answer at once (A-09); the rows catch up a moment later.
  const direction = useDeferredValue(liveDirection);

  // Verification round two (D-09): a fixed airport (the overview's preview) is named in the page
  // language too; the remembered airport from `useAirportContext` already is.
  const fixed = airport ? getAirport(airport) : undefined;
  const scope = fixed ? localizeAirport(fixed, lang) : airport ? undefined : context.airport;
  const scopeTerminal = airport ? terminal : context.selection?.terminal;
  const scopeSlug = scope?.slug;
  const sections = useSectionAvailability();
  const noBoard = scopeSlug ? !hasSection(sections, scopeSlug, 'flights') : false;
  const slugs = scopeSlug ? (noBoard ? [] : [scopeSlug]) : FEATURED_AIRPORT_SLUGS.filter((slug) => hasSection(sections, slug, 'flights'));
  // Today's boards first (one batched request); the next day's only once today has fewer flights
  // left than the preview shows, late in the evening. Whole boards are about 15 KB gzip per day
  // for the six main airports, so the first load fetches one batch, not two.
  const [nextDay, setNextDay] = useState(false);
  const feed = useFlightFeed((at): FeedRequest[] =>
    slugs.flatMap((slug) => {
      const zone = getAirport(slug)?.timezone ?? DEFAULT_TIMEZONE;
      const today = dateKey(at, zone);
      return datesInRange(previewRange(at), zone)
        .filter((date) => nextDay || date <= today)
        .map((date) => ({ airport: slug, date, direction }));
    }),
  );
  const provider = feed.provider;
  const generatedAt = provider ? feed.updatedAt : null;
  const slugKey = slugs.join(',');

  const flights = useMemo<Flight[] | null>(() => {
    if (!provider) return null;
    const range = previewRange(provider.now);
    const all = slugKey
      .split(',')
      .filter(Boolean)
      .flatMap((slug) => provider.listFlightsSync({ airport: slug, direction, terminal: scopeSlug ? scopeTerminal : undefined, ...range }));
    // Only flights that can still be caught or met: departures from 15 minutes ahead, never
    // gate-closed or departed (A-20).
    return previewFlights(all, provider.now.getTime(), rows);
  }, [provider, slugKey, scopeSlug, scopeTerminal, direction, rows]);
  if (!nextDay && flights && flights.length < rows) setNextDay(true);

  const title = direction === 'd' ? t('flights.board.departuresTitle') : t('flights.board.arrivalsTitle');
  const subtitle = scope
    ? scope.terminals.length > 1 && scopeTerminal
      ? `${scope.name}, ${terminalLabel(scope, scopeTerminal, lang, { short: true })}`
      : scope.name
    : t('home.board.networkSubtitle');
  return (
    <FlightBoard
      className={className}
      flights={noBoard || (feed.status === 'error' && !flights) ? [] : flights}
      direction={direction}
      title={title}
      subtitle={subtitle}
      headingLevel={headingLevel}
      updatedAt={generatedAt}
      refreshSeconds={provider ? feed.refreshSeconds : undefined}
      context={
        generatedAt ? (
          <>
            {scope ? (
              <>
                <AirportCode code={scope.code} name={scope.name} size="sm" /> <span aria-hidden="true">·</span>{' '}
              </>
            ) : null}
            {formatDate(generatedAt, lang, 'weekday')}
          </>
        ) : undefined
      }
      showAirport={!scope}
      // A flight on another day says so ("Tomorrow"), so a short preview at a quiet airport cannot
      // be misread (round 4, gallery note 2).
      rowDay={provider ? (flight) => rowDayLabel(flight, provider.now, t) : undefined}
      skeletonRows={rows}
      emptyMessage={noBoard ? t('flights.board.noDemoData') : undefined}
      // Nothing loaded: say so with a retry; last-known rows: say how old they are (BR-05).
      empty={!noBoard && feed.status === 'error' ? <FeedNotice feed={feed} /> : undefined}
      before={feed.status === 'stale' ? <FeedNotice feed={feed} /> : undefined}
      footer={
        <>
          <p className="type-body-sm text-ink-2">{t('home.board.preview', { count: flights?.length || rows })}</p>
          {scopeSlug && !noBoard ? (
            <LocaleLink href={`${sectionPath(scopeSlug, 'flights', scopeTerminal)}${scopeTerminal ? '&' : '?'}dir=${direction}`} className="link-action text-ink">
              {t('home.board.fullBoard')}
              <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
            </LocaleLink>
          ) : scopeSlug ? null : (
            <button type="button" onClick={() => overlays.openAirportSwitcher('flights')} className="link-action text-ink">
              {t('home.board.chooseAirport')}
              <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
            </button>
          )}
        </>
      }
    />
  );
}
