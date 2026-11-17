'use client';

import { useMemo } from 'react';
import { FEATURED_AIRPORT_SLUGS, getAirport, terminalLabel } from '@/content/airports';
import type { TerminalId } from '@/content/types';
import { isFinalStatus, sortFlights, type Flight } from '@/lib/flights';
import { useAirportContext, useFlightProvider } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { boardWindow, hasDemoRoutes } from '@/lib/providers';
import { formatDate } from '@/lib/time';
import { AirportCode } from '@/components/common/airport-code';
import { LocaleLink } from '@/components/common/locale-link';
import { FlightBoard } from '@/components/flights/flight-board';
import { useFlightDirection } from '@/components/flights/flight-direction';
import { overlays } from '@/components/shell/overlay-store';
import { sectionPath } from '@/components/shell/sections';
import { Icon } from '@/components/ui/icon';

export interface BoardPreviewProps {
  /** Fix the preview to this airport (airport pages). Omit it to follow the remembered airport. */
  airport?: string;
  terminal?: TerminalId;
  /** Number of rows. */
  rows?: number;
  headingLevel?: 2 | 3;
  className?: string;
}

/**
 * The next departures (or arrivals: it follows the Departures/Arrivals switch and the journey
 * mode) on the board surface, under the demonstration banner, with a freshness row. With no
 * airport chosen it shows the next flights across the main airports, with an Airport column.
 */
export function BoardPreview({ airport, terminal, rows = 8, headingLevel = 2, className }: BoardPreviewProps) {
  const t = useT();
  const lang = useLang();
  const provider = useFlightProvider();
  const context = useAirportContext();
  const { direction } = useFlightDirection();

  const scope = airport ? getAirport(airport) : context.airport;
  const scopeTerminal = airport ? terminal : context.selection?.terminal;
  const scopeSlug = scope?.slug;
  const generatedAt = provider?.meta().generatedAt ?? null;

  const flights = useMemo<Flight[] | null>(() => {
    if (!provider) return null;
    const now = provider.meta().generatedAt;
    // A day ahead, so a quiet night still fills the preview with the first flights of the morning.
    const range = boardWindow(now, 24, 10);
    const slugs = scopeSlug ? [scopeSlug] : FEATURED_AIRPORT_SLUGS.filter((slug) => hasDemoRoutes(slug));
    const all = slugs.flatMap((slug) => provider.listFlightsSync({ airport: slug, direction, terminal: scopeSlug ? scopeTerminal : undefined, ...range }));
    // Lead with flights that are still to come; finished ones only fill the gap on a quiet board.
    const open = all.filter((flight) => !isFinalStatus(flight.status));
    const list = open.length >= rows ? open : all;
    return sortFlights(list, 'estimated').slice(0, rows);
  }, [provider, scopeSlug, scopeTerminal, direction, rows]);

  const title = direction === 'd' ? t('flights.board.departuresTitle') : t('flights.board.arrivalsTitle');
  const subtitle = scope
    ? scope.terminals.length > 1 && scopeTerminal
      ? `${scope.name}, ${terminalLabel(scope, scopeTerminal, lang, { short: true })}`
      : scope.name
    : t('home.board.networkSubtitle');
  const noBoard = scopeSlug ? !hasDemoRoutes(scopeSlug) : false;

  return (
    <FlightBoard
      className={className}
      flights={noBoard ? [] : flights}
      direction={direction}
      title={title}
      subtitle={subtitle}
      headingLevel={headingLevel}
      updatedAt={generatedAt}
      refreshSeconds={provider?.meta().refreshSeconds}
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
      skeletonRows={rows}
      emptyMessage={noBoard ? t('flights.board.noDemoData') : undefined}
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
