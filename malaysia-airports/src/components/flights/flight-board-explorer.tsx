'use client';

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAirport } from '@/content/airports';
import type { Airport, TerminalId } from '@/content/types';
import type { Flight, FlightDirection } from '@/lib/flights';
import { useFlightProvider, useSavedJourney } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { formatDate, formatTime, timezoneLabel } from '@/lib/time';
import { AirportCode } from '@/components/common/airport-code';
import { EmptyState } from '@/components/common/empty-state';
import { LocaleLink } from '@/components/common/locale-link';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MAX_EARLIER_STEPS,
  MAX_LATER_STEPS,
  STATUS_GROUPS,
  boardQueryString,
  boardRange,
  countByGroup,
  isSearching,
  readBoardParams,
  searchRange,
  selectBoardFlights,
  type BoardParams,
  type StatusGroupId,
} from './board-model';
import { BoardToolbar } from './board-toolbar';
import { FlightBoard } from './flight-board';
import { useFlightDirection } from './flight-direction';
import { FlightWatcher } from './flight-watcher';
import { toSavedFlight } from './saved-flight';

export interface FlightBoardExplorerProps {
  /** Airport slug: `kul`. */
  airport: string;
}

const NO_PARAMS: BoardParams = { q: '', groups: [] };

/**
 * The full departures and arrivals board of one airport: tabs synced to `?dir=d|a`, the terminal
 * filter (`?t=`), search within the board (`?q=`), status filters (`?s=`), a time window with
 * earlier and later steps, rows grouped by hour, and save toggles. Rows are computed on the
 * client after hydration; the static HTML holds the same layout with a skeleton board.
 */
export function FlightBoardExplorer({ airport }: FlightBoardExplorerProps) {
  const record = getAirport(airport);
  if (!record) return null;
  return (
    <Suspense fallback={<BoardView airport={record} params={NO_PARAMS} />}>
      <BoardFromUrl airport={record} />
    </Suspense>
  );
}

function BoardFromUrl({ airport }: { airport: Airport }) {
  const search = useSearchParams();
  const { direction } = useFlightDirection();
  const params = readBoardParams(
    search,
    airport.terminals.map((terminal) => terminal.id),
    direction,
  );
  return <BoardView airport={airport} params={params} />;
}

function BoardView({ airport, params }: { airport: Airport; params: BoardParams }) {
  const t = useT();
  const lang = useLang();
  const provider = useFlightProvider();
  const { journey, saveFlight, removeFlight } = useSavedJourney();
  const { direction: modeDirection, setDirection } = useFlightDirection();
  const direction = params.direction ?? modeDirection;
  const zone = airport.timezone;
  const [draft, setDraft] = useState(params.q);
  const [shift, setShift] = useState({ earlier: 0, later: 0 });
  const searching = isSearching(draft);

  /** Write the filters to the URL without a navigation, so the view can be shared and reloaded. */
  const write = (changes: Partial<{ direction: FlightDirection; terminal: TerminalId | undefined; q: string; groups: StatusGroupId[] }>) => {
    const next = { direction, terminal: params.terminal, q: draft, groups: params.groups, ...changes };
    window.history.replaceState(null, '', `${window.location.pathname}${boardQueryString(next)}${window.location.hash}`);
  };

  const range = useMemo(() => {
    if (!provider) return null;
    return searching ? searchRange(provider.now, zone) : boardRange(provider.now, shift.earlier, shift.later);
  }, [provider, searching, shift, zone]);

  /* Both boards for the window, before search and status filters. */
  const pools = useMemo(() => {
    if (!provider || !range) return null;
    const query = { airport: airport.slug, terminal: params.terminal, from: range.from, to: range.to };
    return { d: provider.listFlightsSync({ ...query, direction: 'd' }), a: provider.listFlightsSync({ ...query, direction: 'a' }) };
  }, [provider, range, airport.slug, params.terminal]);

  const now = provider?.now;
  const searched = useMemo(() => {
    if (!pools) return null;
    return {
      d: selectBoardFlights(pools.d, { q: draft, groups: [], direction: 'd', now }),
      a: selectBoardFlights(pools.a, { q: draft, groups: [], direction: 'a', now }),
    };
  }, [pools, draft, now]);
  const counts = useMemo(() => (searched ? countByGroup(searched[direction], direction) : null), [searched, direction]);
  const shown = useMemo<Flight[] | null>(
    () => (searched ? selectBoardFlights(searched[direction], { q: '', groups: params.groups, direction }) : null),
    [searched, direction, params.groups],
  );

  /* Saved flights at this airport, looked up wherever they sit in time, for the announcer. */
  const savedIds = useMemo(() => new Set(journey.flights.map((flight) => flight.id)), [journey.flights]);
  const savedHere = useMemo(() => {
    if (!provider) return null;
    return journey.flights
      .filter((flight) => flight.airport === airport.slug)
      .map((flight) => provider.getFlightSync(flight.id, airport.slug))
      .filter((flight): flight is NonNullable<typeof flight> => flight !== null);
  }, [provider, journey.flights, airport.slug]);
  const savedOnBoard = shown ? shown.filter((flight) => savedIds.has(flight.id)).length : 0;

  /* Announce the number of flights after the visitor changes a filter (never on refresh). */
  const countText = shown ? t.count('flightPages.board.shown', shown.length) : '';
  const latestCount = useRef(countText);
  useEffect(() => {
    latestCount.current = countText;
  });
  const filterKey = `${direction}|${params.terminal ?? ''}|${draft.trim()}|${params.groups.join(',')}|${shift.earlier}|${shift.later}`;
  const initialKey = useRef(filterKey);
  const countRegion = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (filterKey === initialKey.current) return;
    const timer = setTimeout(() => {
      if (countRegion.current) countRegion.current.textContent = latestCount.current;
    }, 500);
    return () => clearTimeout(timer);
  }, [filterKey]);

  const onQueryChange = (value: string) => {
    setDraft(value);
    write({ q: value });
  };
  const onDirectionChange = (value: string) => {
    if (value !== 'd' && value !== 'a') return;
    setDirection(value);
    write({ direction: value, groups: params.groups.filter((group) => STATUS_GROUPS[value].some((item) => item.id === group)) });
  };

  const title = direction === 'd' ? t('flights.board.departuresTitle') : t('flights.board.arrivalsTitle');
  const subtitle = !range
    ? airport.name
    : searching
      ? t('flightPages.board.searchWindow', { query: draft.trim() })
      : t('flightPages.board.window', { from: formatTime(range.from, zone), to: formatTime(range.to, zone) });
  const generatedAt = provider?.meta().generatedAt ?? null;

  const earlierButton = (
    <Button variant="quiet" size="sm" iconStart="arrow-up" onClick={() => setShift((current) => ({ ...current, earlier: current.earlier + 1 }))}>
      {t('flights.board.earlier')}
    </Button>
  );
  const laterButton = (
    <Button variant="quiet" size="sm" iconStart="arrow-down" onClick={() => setShift((current) => ({ ...current, later: current.later + 1 }))}>
      {t('flights.board.later')}
    </Button>
  );
  const edge = (canMove: boolean, button: ReactNode, limit: string) => (
    <div className="flex justify-center px-4 py-1.5 sm:px-5">{canMove ? button : <p className="type-body-sm py-2 text-ink-2">{limit}</p>}</div>
  );

  const empty = (() => {
    if (searching && (searched?.[direction].length ?? 0) === 0) {
      return (
        <EmptyState
          variant="plain"
          icon="search-x"
          title={t('flightPages.board.noResultsTitle', { query: draft.trim() })}
          action={
            <Button variant="secondary" size="sm" iconStart="x" onClick={() => onQueryChange('')}>
              {t('flightPages.board.clearSearch')}
            </Button>
          }
        >
          {t('flights.search.noResultsHint')}
        </EmptyState>
      );
    }
    if (params.groups.length > 0) {
      return (
        <EmptyState
          variant="plain"
          icon="list-filter"
          title={t('flightPages.board.noFilterResultsTitle')}
          action={
            <Button variant="secondary" size="sm" iconStart="x" onClick={() => write({ groups: [] })}>
              {t('flightPages.board.clearFilters')}
            </Button>
          }
        >
          {t('flightPages.board.noFilterResultsBody')}
        </EmptyState>
      );
    }
    const vars = range ? { from: formatTime(range.from, zone), to: formatTime(range.to, zone) } : { from: '', to: '' };
    return (
      <EmptyState
        variant="plain"
        icon={direction === 'd' ? 'plane-takeoff' : 'plane-landing'}
        title={direction === 'd' ? t('flightPages.board.emptyTitleDepartures', vars) : t('flightPages.board.emptyTitleArrivals', vars)}
        action={shift.earlier < MAX_EARLIER_STEPS ? earlierButton : undefined}
      >
        {t('flightPages.board.emptyBody')}
      </EmptyState>
    );
  })();

  const panel = (
    <div className="flex flex-col gap-5">
      <BoardToolbar
        airport={airport}
        direction={direction}
        query={draft}
        onQueryChange={onQueryChange}
        terminal={params.terminal}
        onTerminalChange={(terminal) => write({ terminal })}
        groups={params.groups}
        onGroupsChange={(groups) => write({ groups })}
        counts={counts}
      />

      {savedOnBoard > 0 ? (
        <p className="type-body-sm flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-line bg-page-subtle px-3 py-2 text-ink-2">
          <Icon name="bookmark-check" size="sm" className="text-ink" />
          <span>
            <strong className="font-semibold text-ink">{t.count('flightPages.board.savedHere', savedOnBoard)}</strong> {t('flightPages.board.savedHint')}
          </span>
          <LocaleLink href="/journey" className="link-action ml-auto text-ink">
            {t('flightPages.board.openJourney')}
            <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
          </LocaleLink>
        </p>
      ) : null}

      <FlightBoard
        flights={shown}
        direction={direction}
        title={title}
        subtitle={subtitle}
        headingLevel={2}
        updatedAt={generatedAt}
        refreshSeconds={provider?.meta().refreshSeconds}
        context={
          generatedAt ? (
            <>
              <AirportCode code={airport.code} name={airport.name} size="sm" /> <span aria-hidden="true">·</span> {formatDate(generatedAt, lang, 'weekday')}
            </>
          ) : undefined
        }
        live="off"
        groupByHour
        timeZone={zone}
        skeletonRows={8}
        savedIds={savedIds}
        onSaveChange={(flight, saved) => (saved ? saveFlight(toSavedFlight(flight, t)) : removeFlight(flight.id))}
        before={searching ? undefined : edge(shift.earlier < MAX_EARLIER_STEPS, earlierButton, t('flightPages.board.earlierLimit'))}
        after={searching || (shown?.length ?? 0) === 0 ? undefined : edge(shift.later < MAX_LATER_STEPS, laterButton, t('flightPages.board.laterLimit'))}
        empty={empty}
        footer={
          shown && now ? (
            <p className="type-body-sm text-ink-2">
              <strong className="font-semibold text-ink">{countText}</strong> <span aria-hidden="true">·</span> {t('flightPages.board.timesNote', { zone: timezoneLabel(now, zone) })}
            </p>
          ) : undefined
        }
      />
    </div>
  );

  const tab = (value: FlightDirection) => {
    const count = searching && searched ? searched[value].length : null;
    return (
      <TabsTrigger value={value} className="h-12 text-lg">
        <Icon name={value === 'd' ? 'plane-takeoff' : 'plane-landing'} size="sm" />
        {value === 'd' ? t('common.labels.departures') : t('common.labels.arrivals')}
        {count !== null ? <span className="type-data-sm rounded-xs border border-line-control px-1.5 text-ink-2">{count}</span> : null}
      </TabsTrigger>
    );
  };

  return (
    <div className="flex flex-col">
      <Tabs value={direction} onValueChange={onDirectionChange}>
        <TabsList aria-label={t('flightPages.board.tabsLabel')}>
          {tab('d')}
          {tab('a')}
        </TabsList>
        <TabsContent value="d">{direction === 'd' ? panel : null}</TabsContent>
        <TabsContent value="a">{direction === 'a' ? panel : null}</TabsContent>
      </Tabs>
      <p ref={countRegion} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
      <FlightWatcher flights={savedHere} timeZone={zone} />
    </div>
  );
}
