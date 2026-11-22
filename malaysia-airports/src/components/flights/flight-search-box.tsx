'use client';

import { useRouter } from 'next/navigation';
import { Suspense, startTransition, useDeferredValue, useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { getAirport, localizeAirport, terminalLabel } from '@/content/airports';
import type { TerminalId } from '@/content/types';
import { cn } from '@/lib/cn';
import { formatFlightNumber, parseFlightQuery, placeCity, remotePlace, searchFlights, type Flight, type FlightDirection } from '@/lib/flights';
import { useAirportContext } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import type { TKey } from '@/lib/i18n/translate';
import { localeHref } from '@/lib/locale';
import { retryableLazy } from '@/lib/retrying-import';
import { PartBoundary, PartLoading } from '@/components/common/part-boundary';
import { useFlightFeed, type FeedRequest } from '@/lib/providers/use-flight-feed';
import { dateKey } from '@/lib/time';
import { RebungRule } from '@/components/art/patterns';
import { LocaleLink } from '@/components/common/locale-link';
import { DemoTag } from '@/components/common/demo-tag';
import { AirportSwitcherButton } from '@/components/shell/airport-switcher';
import { overlays } from '@/components/shell/overlay-store';
import { rich } from '@/components/shell/rich';
import { hasSection, sectionPath } from '@/components/shell/sections';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SearchField } from '@/components/ui/search-field';
import { FeedNotice } from './feed-notice';
import { useFlightDirection } from './flight-direction';
import { FlightRow, rowDayLabel, flightHref } from './flight-row';

// Site results (and the search engine) load only once someone searches (A-03, A-09).
// Round 6 (review-3 9.1 item 1): fetched again when the connection allows; never the page's error.
const InlineSiteResults = retryableLazy(() => import('@/components/search/inline-site-results').then((module) => module.InlineSiteResults));
const TopicStatus = retryableLazy(() => import('./topic-status').then((module) => module.TopicStatus));

/** Run `work` when the browser is idle (or soon after), never during hydration. */
function whenIdle(work: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(work, { timeout: 3000 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(work, 1500);
  return () => window.clearTimeout(handle);
}

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
  if (normalise(place.city).includes(text) || normalise(placeCity(place, 'ms')).includes(text) || place.code.toLowerCase() === text || normalise(place.country).includes(text)) {
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
  const router = useRouter();
  const context = useAirportContext();
  const { direction, setDirection } = useFlightDirection();
  const [query, setQuery] = useState('');
  // The flight pool is built on first use, never during hydration (A-09): on focus or the first
  // keystroke, or when the browser is idle on an airport page (for that airport's examples).
  const [active, setActive] = useState(false);
  const activate = () => {
    if (!active) startTransition(() => setActive(true));
  };
  const generatedId = useId();
  const inputId = id ? `${id}-input` : `${generatedId}-input`;
  const resultsId = `${generatedId}-results`;
  const focusInput = () => document.getElementById(inputId)?.focus();

  const record = airport ? getAirport(airport) : undefined;
  const scope = record ? localizeAirport(record, lang) : airport ? undefined : context.airport;
  const scopeTerminal = airport ? terminal : context.selection?.terminal;
  const scopeSlug = scope?.slug;
  // Which airports have a demonstration board, from the server-computed section list (round 3,
  // E-03: the demo route table no longer ships to the browser).
  const sections = useSectionAvailability();
  const networkBoards = useMemo(() => Object.keys(sections).filter((slug) => hasSection(sections, slug, 'flights')), [sections]);
  const hasBoard = scopeSlug ? hasSection(sections, scopeSlug, 'flights') : true;
  const text = query.trim();
  // Typing stays responsive: matching follows the field at a lower priority.
  const deferredText = useDeferredValue(text);
  // So does the Departures/Arrivals switch (and the journey mode that sets it): the pool for the
  // other direction is built in the background, after the switch has answered (A-09).
  const poolDirection = useDeferredValue(direction);
  const searching = text.length >= 2;

  useEffect(() => (scopeSlug && !active ? whenIdle(() => startTransition(() => setActive(true))) : undefined), [scopeSlug, active]);

  /* Today's flights in scope: one airport, or every airport with a demo board. */
  // Typing also asks for the pool, in the deferred render: a query typed before hydration (when
  // the focus handler was not attached yet) still gets its results instead of "Loading" forever.
  //
  // Round 2 (B-09 hand-off): the boards come from the server feed, as on the board and flight
  // pages, so the search shows last-known data with its age, or an error with a retry, when the
  // feed fails, and the demo generator stays on the server. One airport asks for its board when
  // the field is first used (or at idle, for its examples); the whole network asks for its boards
  // only while a query is typed.
  const wanted = active || deferredText.length >= 2;
  const boards = useMemo<readonly string[]>(() => (scopeSlug ? (hasBoard ? [scopeSlug] : []) : networkBoards), [scopeSlug, hasBoard, networkBoards]);
  const wantBoards = scopeSlug ? wanted : deferredText.length >= 2;
  const feed = useFlightFeed((at): FeedRequest[] => (wantBoards ? boards.map((slug) => ({ airport: slug, date: dateKey(at), direction: poolDirection })) : []));
  const provider = feed.provider;
  const pool = useMemo<Flight[] | null>(() => {
    if (!provider || !wanted) return null;
    return boards
      .flatMap((slug) => provider.listFlightsSync({ airport: slug, direction: poolDirection }))
      .filter((flight) => !scopeTerminal || !scopeSlug || flight.terminal === scopeTerminal);
  }, [provider, wanted, boards, scopeSlug, scopeTerminal, poolDirection]);

  const results = useMemo<Flight[] | null>(() => {
    if (!pool || !provider || deferredText.length < 2) return null;
    return searchFlights(pool, deferredText, { now: provider.now, limit: 40 });
  }, [pool, provider, deferredText]);

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
      { kind: direction === 'd' ? 'destination' : 'origin', label: placeCity(remotePlace(otherPlace), lang), query: placeCity(remotePlace(otherPlace), lang) },
      { kind: 'airline', label: otherAirline.airline.name, query: otherAirline.airline.name },
      { kind: 'route', label: `${first.origin.code}-${first.destination.code}`, query: `${first.origin.code}-${first.destination.code}` },
    ];
  }, [pool, scopeSlug, direction, t, lang]);

  const kindLabels: Record<QueryKind, TKey> = {
    flightNumber: 'flights.search.kinds.flightNumber',
    route: 'flights.search.kinds.route',
    airline: 'flights.search.kinds.airline',
    destination: 'flights.search.kinds.destination',
    origin: 'flights.search.kinds.origin',
    place: 'flights.search.kinds.place',
  };

  const directionWord = direction === 'd' ? t('flights.search.directionDepartures') : t('flights.search.directionArrivals');
  const scopeName = scope ? (scopeTerminal ? terminalLabel(scope, scopeTerminal, lang) : scope.shortName) : '';
  const scopeSentence = scope
    ? rich(t('flights.search.scopeAirport'), { direction: <strong className="font-semibold text-ink">{directionWord}</strong>, airport: <strong className="font-semibold text-ink">{scopeName}</strong> })
    : rich(t('flights.search.scopeNetwork'), {
        direction: <strong className="font-semibold text-ink">{directionWord}</strong>,
        count: <strong className="tabular font-semibold text-ink">{networkBoards.length}</strong>,
      });

  const kind = results ? readQuery(deferredText, results, direction) : null;
  const shown = results?.slice(0, VISIBLE_RESULTS) ?? [];
  const more = results ? results.length - shown.length : 0;
  const boardHref = scopeSlug ? `${sectionPath(scopeSlug, 'flights', scopeTerminal)}${scopeTerminal ? '&' : '?'}dir=${direction}${text ? `&q=${encodeURIComponent(text)}` : ''}` : null;
  const settled = results !== null && deferredText === text;

  /**
   * Enter (A-03): one exact flight-number match opens that flight; anything else opens the site
   * search for the words typed, where flights, places, services and pages are all searched.
   */
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!text) {
      focusInput();
      return;
    }
    const parsed = parseFlightQuery(text);
    if (parsed.kind === 'flight-number' && settled && results.length === 1) {
      router.push(localeHref(lang, flightHref(results[0])));
      return;
    }
    router.push(localeHref(lang, `/search?q=${encodeURIComponent(text)}`));
  };

  const clear = () => {
    setQuery('');
    focusInput();
  };

  return (
    <section id={id} aria-label={t('home.deskLabel')} className={cn('group/desk relative scroll-mt-24', className)}>
      <div className="relative overflow-hidden rounded-xl border border-line-strong bg-surface shadow-md">
        <div className="flex flex-col gap-2 p-2 sm:gap-2.5 sm:p-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
            {showAirportSelector ? <AirportSwitcherButton variant="desk" className="w-full sm:w-auto sm:min-w-72 sm:flex-none" /> : null}
            {/* The journey mode sets the direction (A-17); one small link switches it. */}
            <p className="type-body-sm min-w-0 flex-1 basis-44 text-ink-2 max-sm:text-[0.8125rem] max-sm:leading-snug" data-flight-scope="">
              {scopeSentence}
            </p>
            <button
              type="button"
              onClick={() => setDirection(direction === 'd' ? 'a' : 'd')}
              className="link-action type-body-sm shrink-0 text-ink-2 hover:text-ink"
            >
              <Icon name={direction === 'd' ? 'plane-landing' : 'plane-takeoff'} size="sm" strokeWidth={1.75} />
              {direction === 'd' ? t('shellExtras.homeSearch.arrivalsInstead') : t('shellExtras.homeSearch.departuresInstead')}
            </button>
          </div>

          {/* Without JavaScript (or before hydration) the form still submits to the site search. */}
          <form role="search" action={localeHref(lang, '/search')} method="get" onSubmit={onSubmit} onFocus={activate} onInput={activate} aria-label={t('flights.search.label')}>
            <SearchField
              label={t('flights.search.label')}
              size="lg"
              value={query}
              onValueChange={setQuery}
              onClear={clear}
              placeholder={t('home.searchPlaceholder')}
              placeholderShort={t('home.searchPlaceholderShort')}
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
            /* On phones the examples appear once the search has focus, so the first screen stays short. */
            <div className="flex items-center gap-2 max-sm:-mx-2 max-sm:hidden max-sm:overflow-x-auto max-sm:px-2 max-sm:group-focus-within/desk:flex sm:flex-wrap">
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
                      <span className="type-caption text-ink-2">{t(kindLabels[example.kind])}</span>
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
                {/* Round 4 (6.1.5): no "0 flights found" for a topic word such as "parking": the
                    line names the page result offered below instead. */}
                <strong className="font-semibold">
                  {results && results.length === 0 ? (
                    <PartBoundary silent>
                      <Suspense fallback={t('flightPages.search.topicNoFlights', { query: deferredText.trim() })}>
                        <TopicStatus query={deferredText} airport={scopeSlug} />
                      </Suspense>
                    </PartBoundary>
                  ) : results ? (
                    t.count('flights.search.resultsCount', results.length)
                  ) : feed.status === 'error' ? null : (
                    t('common.labels.loading')
                  )}
                </strong>
                {kind ? (
                  <span className="inline-flex items-center gap-1.5 text-ink-2">
                    {t('flights.search.readingAs')}
                    <span className="type-caption rounded-xs border border-line-control px-1.5 py-0.5 font-semibold text-ink">{t(kindLabels[kind])}</span>
                  </span>
                ) : null}
              </p>
              <div className="flex items-center gap-2">
                <DemoTag size="md" />
                <Button variant="quiet" size="sm" iconStart="x" onClick={clear}>
                  {t('common.actions.clear')}
                </Button>
              </div>
            </div>

            {/* Last-known flights with their age, or nothing loaded, each with a retry (B-09). Always
                mounted (an empty polite status region) so the change is announced once. */}
            <FeedNotice feed={feed} className="empty:hidden" />

            {results && results.length > 0 ? (
              <div className="surface-board @container overflow-hidden rounded-lg border border-line">
                <ul aria-label={t('flights.search.resultsTitle')}>
                  {shown.map((flight) => (
                    <FlightRow
                      key={`${flight.airport}-${flight.id}`}
                      flight={flight}
                      showAirport={!scopeSlug}
                      day={provider ? rowDayLabel(flight, provider.now, t) : undefined}
                    />
                  ))}
                </ul>
                <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-t border-line px-4 py-2.5 sm:px-5">
                  <p className="type-body-sm text-ink-2">
                    {t('flights.search.demoNote')} <strong className="font-semibold text-ink">{t('shellExtras.homeSearch.doNotPlan')}</strong>
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
            ) : null}

            {/* Not only flights (A-03): places, services and pages that match, after any flights. */}
            {searching ? (
              <PartBoundary onRetry={InlineSiteResults.renew}>
                <Suspense fallback={<PartLoading />}>
                  <InlineSiteResults query={deferredText} airport={scopeSlug} noFlights={results !== null && results.length === 0} />
                </Suspense>
              </PartBoundary>
            ) : null}
          </div>
        </div>
        <RebungRule className="absolute inset-x-3 bottom-0 text-gold opacity-70" />
      </div>
    </section>
  );
}
