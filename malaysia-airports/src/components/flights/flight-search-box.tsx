'use client';

import { useId, useMemo, useState, type FormEvent } from 'react';
import { getAirport, terminalLabel } from '@/content/airports';
import type { TerminalId } from '@/content/types';
import { cn } from '@/lib/cn';
import { formatFlightNumber, parseFlightQuery, remotePlace, searchFlights, type Flight, type FlightDirection } from '@/lib/flights';
import { useAirportContext, useFlightProvider } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import type { TKey } from '@/lib/i18n/translate';
import { DEMO_AIRPORT_SLUGS, hasDemoRoutes } from '@/lib/providers';
import { RebungRule } from '@/components/art/patterns';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { AirportSwitcherButton } from '@/components/shell/airport-switcher';
import { overlays } from '@/components/shell/overlay-store';
import { rich } from '@/components/shell/rich';
import { sectionPath } from '@/components/shell/sections';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SearchField } from '@/components/ui/search-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useFlightDirection } from './flight-direction';
import { FlightRow } from './flight-row';

const VISIBLE_RESULTS = 5;

type QueryKind = 'flightNumber' | 'route' | 'airline' | 'destination' | 'origin' | 'place';

interface Example {
  kind: QueryKind;
  label: string;
  query: string;
}

const normalise = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

/** What the query was understood as, from the real parser and the flights it matched. */
function readQuery(query: string, results: readonly Flight[], direction: FlightDirection): QueryKind | null {
  const parsed = parseFlightQuery(query);
  if (parsed.kind === 'empty') return null;
  if (parsed.kind === 'flight-number') return 'flightNumber';
  if (parsed.kind === 'route') return 'route';
  if (parsed.airlineCode) return 'airline';
  const top = results[0];
  if (!top) return null;
  const text = normalise(query);
  if (normalise(top.airline.name).includes(text) || top.airline.code.toLowerCase() === text) return 'airline';
  const place = remotePlace(top);
  if (normalise(place.city).includes(text) || place.code.toLowerCase() === text || normalise(place.country).includes(text)) {
    return direction === 'd' ? 'destination' : 'origin';
  }
  return 'place';
}

export interface FlightSearchBoxProps {
  /**
   * Fix the search to this airport (airport pages). Omit it on network pages: the box then
   * follows the remembered airport, and searches every airport with a demo board when none is set.
   */
  airport?: string;
  /** Narrow a fixed airport to one terminal (KLIA, from the `?t=` filter). */
  terminal?: TerminalId;
  /** Show the airport and terminal selector inside the box (network home). */
  showAirportSelector?: boolean;
  /** Anchor id, so other parts of the page can link to the search (`#flight-search`). */
  id?: string;
  className?: string;
}

/**
 * The flight search: flight number, destination, airline or route, with a Departures/Arrivals
 * switch, a sentence that says what is being searched, example searches labelled by kind, and
 * results under the field as you type.
 *
 * Queries are read by the real parser in `@/lib/flights` and answered by the demo provider, so
 * the results are always labelled as demonstration data.
 */
export function FlightSearchBox({ airport, terminal, showAirportSelector = false, id, className }: FlightSearchBoxProps) {
  const t = useT();
  const lang = useLang();
  const provider = useFlightProvider();
  const context = useAirportContext();
  const { direction, setDirection } = useFlightDirection();
  const [query, setQuery] = useState('');
  const generatedId = useId();
  const inputId = id ? `${id}-input` : `${generatedId}-input`;
  const resultsId = `${generatedId}-results`;
  const focusInput = () => document.getElementById(inputId)?.focus();

  const scope = airport ? getAirport(airport) : context.airport;
  const scopeTerminal = airport ? terminal : context.selection?.terminal;
  const scopeSlug = scope?.slug;
  const hasBoard = scopeSlug ? hasDemoRoutes(scopeSlug) : true;
  const text = query.trim();
  const searching = text.length >= 2;

  /* Today's flights in scope: one airport, or every airport with a demo board. */
  const pool = useMemo<Flight[] | null>(() => {
    if (!provider) return null;
    const slugs = scopeSlug ? [scopeSlug] : DEMO_AIRPORT_SLUGS;
    return slugs
      .flatMap((slug) => provider.listFlightsSync({ airport: slug, direction }))
      .filter((flight) => !scopeTerminal || !scopeSlug || flight.terminal === scopeTerminal);
  }, [provider, scopeSlug, scopeTerminal, direction]);

  const results = useMemo<Flight[] | null>(() => {
    if (!pool || !provider || !searching) return null;
    return searchFlights(pool, text, { now: provider.meta().generatedAt, limit: 40 });
  }, [pool, provider, searching, text]);

  const examples = useMemo<Example[]>(() => {
    const fallback: Example[] = [
      { kind: 'flightNumber', label: t('flights.search.exampleFlight'), query: t('flights.search.exampleFlight') },
      { kind: direction === 'd' ? 'destination' : 'origin', label: t('flights.search.exampleCity'), query: t('flights.search.exampleCity') },
      { kind: 'airline', label: t('flights.search.exampleAirline'), query: t('flights.search.exampleAirline') },
      { kind: 'route', label: t('flights.search.exampleRouteLabel'), query: t('flights.search.exampleRouteQuery') },
    ];
    // On the network scope the fixed examples always have matches. For one airport, build them
    // from that airport's own board so that every example returns something.
    if (!scopeSlug || !pool) return fallback;
    if (pool.length === 0) return [];
    const first = pool[Math.floor(pool.length / 2)];
    const otherPlace = pool.find((flight) => remotePlace(flight).code !== remotePlace(first).code) ?? first;
    const otherAirline = pool.find((flight) => flight.airline.code !== first.airline.code) ?? first;
    return [
      { kind: 'flightNumber', label: formatFlightNumber(first), query: formatFlightNumber(first) },
      { kind: direction === 'd' ? 'destination' : 'origin', label: remotePlace(otherPlace).city, query: remotePlace(otherPlace).city },
      { kind: 'airline', label: otherAirline.airline.name, query: otherAirline.airline.name },
      { kind: 'route', label: `${first.origin.code}-${first.destination.code}`, query: `${first.origin.code}-${first.destination.code}` },
    ];
  }, [pool, scopeSlug, direction, t]);

  const kindLabels: Record<QueryKind, TKey> = {
    flightNumber: 'flights.search.kinds.flightNumber',
    route: 'flights.search.kinds.route',
    airline: 'flights.search.kinds.airline',
    destination: 'flights.search.kinds.destination',
    origin: 'flights.search.kinds.origin',
    place: 'flights.search.kinds.place',
  };

  const directionWord = direction === 'd' ? t('flights.search.directionDepartures') : t('flights.search.directionArrivals');
  const scopeName = scope ? terminalLabel(scope, scopeTerminal, lang) : '';
  const scopeSentence = scope
    ? rich(t('flights.search.scopeAirport'), { direction: <strong className="font-semibold text-ink">{directionWord}</strong>, airport: <strong className="font-semibold text-ink">{scopeName}</strong> })
    : rich(t('flights.search.scopeNetwork'), {
        direction: <strong className="font-semibold text-ink">{directionWord}</strong>,
        count: <strong className="tabular font-semibold text-ink">{DEMO_AIRPORT_SLUGS.length}</strong>,
      });

  const kind = results ? readQuery(text, results, direction) : null;
  const shown = results?.slice(0, VISIBLE_RESULTS) ?? [];
  const more = results ? results.length - shown.length : 0;
  const boardHref = scopeSlug ? `${sectionPath(scopeSlug, 'flights', scopeTerminal)}${scopeTerminal ? '&' : '?'}dir=${direction}${text ? `&q=${encodeURIComponent(text)}` : ''}` : null;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    // Results are already on screen: keep the keyboard where it is and let the live region speak.
    focusInput();
  };

  const clear = () => {
    setQuery('');
    focusInput();
  };

  return (
    <section id={id} aria-label={t('home.deskLabel')} className={cn('relative scroll-mt-24', className)}>
      <div className="relative overflow-hidden rounded-xl border border-line-strong bg-surface shadow-md">
        <div className="flex flex-col gap-2 p-2 sm:gap-2.5 sm:p-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {showAirportSelector ? <AirportSwitcherButton variant="desk" className="w-full sm:w-auto sm:min-w-72 sm:flex-none" /> : null}
            <SegmentedControl<FlightDirection>
              label={t('flights.filters.direction')}
              value={direction}
              onValueChange={setDirection}
              size="lg"
              className="max-sm:w-full"
              block
              options={[
                { value: 'd', label: t('common.labels.departures'), icon: 'plane-takeoff' },
                { value: 'a', label: t('common.labels.arrivals'), icon: 'plane-landing' },
              ]}
            />
            <p className="type-body-sm min-w-0 flex-1 basis-56 text-ink-2 sm:px-1 sm:text-right" data-flight-scope="">
              {scopeSentence}
            </p>
          </div>

          <form role="search" onSubmit={onSubmit} aria-label={t('flights.search.label')}>
            <SearchField
              label={t('flights.search.label')}
              size="lg"
              value={query}
              onValueChange={setQuery}
              onClear={clear}
              placeholder={t('flights.search.placeholderLong')}
              placeholderShort={t('flights.search.placeholderShort')}
              aria-controls={searching ? resultsId : undefined}
              name="q"
              inputMode="search"
              className="font-medium"
              id={inputId}
              trailing={
                <>
                  <Button type="submit" iconEnd="arrow-right" className="max-sm:hidden">
                    {t('flights.search.submit')}
                  </Button>
                  <button
                    type="submit"
                    aria-label={t('flights.search.submit')}
                    className="inline-flex size-11 items-center justify-center rounded-md bg-primary text-on-primary transition-colors duration-fast hover:bg-primary-hover sm:hidden"
                  >
                    <Icon name="arrow-right" strokeWidth={1.75} />
                  </button>
                </>
              }
            />
          </form>

          {examples.length > 0 && !searching ? (
            <div className="flex items-center gap-2 max-sm:-mx-2 max-sm:overflow-x-auto max-sm:px-2 sm:flex-wrap">
              <span className="type-eyebrow shrink-0 text-ink-2">{t('flights.search.examplesLabel')}</span>
              <ul className="flex items-center gap-1.5 sm:flex-wrap">
                {examples.map((example) => (
                  <li key={example.kind} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(example.query);
                        focusInput();
                      }}
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-line-strong bg-surface px-2.5 text-sm whitespace-nowrap text-ink transition-colors duration-fast hover:border-ink hover:bg-page-subtle touch:h-11"
                    >
                      <span className="type-data-xs text-ink-2 uppercase">{t(kindLabels[example.kind])}</span>
                      <span className="font-semibold">{example.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {scopeSlug && !hasBoard ? (
            <p className="type-body-sm flex items-start gap-2 rounded-md border border-line bg-page-subtle p-3 text-ink-2">
              <Icon name="info" size="sm" className="mt-0.5" />
              {t('flights.board.noDemoData')}
            </p>
          ) : null}

          <div id={resultsId} className={searching ? 'flex flex-col gap-2' : 'hidden'}>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-1">
              <p role="status" className="type-body-sm flex flex-wrap items-center gap-x-2.5 gap-y-1 text-ink">
                <strong className="font-semibold">{results ? t.count('flights.search.resultsCount', results.length) : t('common.labels.loading')}</strong>
                {kind ? (
                  <span className="inline-flex items-center gap-1.5 text-ink-2">
                    {t('flights.search.readingAs')}
                    <span className="type-data-xs rounded-xs border border-line-control px-1.5 py-0.5 font-semibold text-ink uppercase">{t(kindLabels[kind])}</span>
                  </span>
                ) : null}
              </p>
              <div className="flex items-center gap-2">
                <ProvenanceTag provenance="demo" length="short" />
                <Button variant="quiet" size="sm" iconStart="x" onClick={clear}>
                  {t('common.actions.clear')}
                </Button>
              </div>
            </div>

            {results && results.length > 0 ? (
              <div className="surface-board @container overflow-hidden rounded-lg border border-line">
                <ul aria-label={t('flights.search.resultsTitle')}>
                  {shown.map((flight) => (
                    <FlightRow key={`${flight.airport}-${flight.id}`} flight={flight} showAirport={!scopeSlug} />
                  ))}
                </ul>
                <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-t border-line px-4 py-2.5 sm:px-5">
                  <p className="type-body-sm text-ink-2">
                    {t('flights.search.demoNote')} <strong className="font-semibold text-ink">{t('demo.doNotPlan')}</strong>
                    {more > 0 ? <> {t.count('flights.search.moreOnBoard', more)}.</> : null}
                  </p>
                  {boardHref && scope ? (
                    <LocaleLink href={boardHref} className="link-action type-body-sm text-ink">
                      {t('flights.search.fullBoardAt', { airport: scope.shortName })}
                      <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
                    </LocaleLink>
                  ) : (
                    <button type="button" onClick={() => overlays.openAirportSwitcher('flights')} className="link-action type-body-sm text-ink">
                      {t('flights.search.chooseAirportForBoard')}
                      <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </div>
            ) : results ? (
              <div className="rounded-lg border border-line bg-page-subtle p-4">
                <p className="type-body font-semibold text-ink">{t('flights.search.noResults', { query: text })}</p>
                <p className="type-body-sm mt-1 text-ink-2">{t('flights.search.noResultsHint')}</p>
              </div>
            ) : null}
          </div>
        </div>
        <RebungRule className="absolute inset-x-3 bottom-0 text-gold opacity-70" />
      </div>
    </section>
  );
}
