'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';
import { getAirport, localizeAirport, terminalLabel } from '@/content/airports';
import type { Airport, TerminalId } from '@/content/types';
import type { Flight, FlightDirection } from '@/lib/flights';
import { useSavedJourney } from '@/lib/hooks/use-saved-journey';
import { useUrlSearchParams } from '@/lib/hooks/use-url';
import { useFlightFeed, type FeedRequest } from '@/lib/providers/use-flight-feed';
import { cn } from '@/lib/cn';
import { useLang, useT } from '@/lib/i18n/client';
import { dateKey, formatDate, formatTime, shiftDateKey, timezoneLabel, zonedDateTime } from '@/lib/time';
import { AirportCode } from '@/components/common/airport-code';
import { EmptyState } from '@/components/common/empty-state';
import { LocaleLink } from '@/components/common/locale-link';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BOARD_ROW_LIMIT,
  MAX_EARLIER_STEPS,
  MAX_LATER_STEPS,
  STATUS_GROUPS,
  boardQueryString,
  boardRange,
  countByGroup,
  datesInRange,
  isSearching,
  readBoardParams,
  searchRange,
  selectBoardFlights,
  setAsideFinished,
  type BoardParams,
  type StatusGroupId,
} from './board-model';
import { BoardToolbar } from './board-toolbar';
import { FeedNotice } from './feed-notice';
import { FlightBoard } from './flight-board';
import { useFlightDirection } from './flight-direction';
import { FlightWatcher } from './flight-watcher';
import { toSavedFlight } from './saved-flight';

export interface FlightBoardExplorerProps {
  /** Airport slug: `kul`. */
  airport: string;
}

/**
 * The full departures and arrivals board of one airport: tabs synced to `?dir=d|a`, the terminal
 * filter (`?t=`), search within the board (`?q=`), status filters (`?s=`), a time window with
 * earlier and later steps, rows grouped by hour, and save toggles. Rows come from the server
 * flight feed after hydration (last-known data with its age if a refresh fails); the static HTML
 * holds the same layout with a skeleton board.
 *
 * Responsiveness (performance-02): the search field keeps its own text, so a keystroke re-renders
 * only the field; the list follows in a transition, the URL is written once typing pauses, a new
 * direction renders as a deferred value, and rows are memoised. At most `BOARD_ROW_LIMIT` rows
 * render until "Show more". Refreshing can be paused, and waits while a row has focus or the
 * pointer (WCAG 2.2.2).
 */
export function FlightBoardExplorer({ airport }: FlightBoardExplorerProps) {
  const record = getAirport(airport);
  if (!record) return null;
  // No `<Suspense>` (round 2): the filters come from `useUrlSearchParams`, empty until hydration,
  // so the server board hydrates in place and a search typed before hydration is kept.
  return <BoardFromUrl airport={record} />;
}

function BoardFromUrl({ airport }: { airport: Airport }) {
  const search = useUrlSearchParams();
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
  const { journey, saveFlight, removeFlight } = useSavedJourney();
  const { direction: modeDirection, setDirection } = useFlightDirection();
  /* The tab follows a click at once; the list for the new direction renders as a deferred value. */
  const chosenDirection = params.direction ?? modeDirection;
  const direction = useDeferredValue(chosenDirection);
  const zone = airport.timezone;
  const [query, setQuery] = useState(params.q);
  const [searchKey, setSearchKey] = useState(0);
  const [, startTransition] = useTransition();
  const urlTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [shift, setShift] = useState({ earlier: 0, later: 0 });
  const [userPaused, setUserPaused] = useState(false);
  const [held, setHeld] = useState({ focus: false, pointer: false });
  const [announcement, setAnnouncement] = useState('');
  const searching = isSearching(query);
  /* A `?q=` in the URL arrives after hydration (or after a client navigation commits): the field
     takes it once, unless the visitor has typed something meanwhile. */
  const [urlQueryTaken, setUrlQueryTaken] = useState(params.q !== '');
  if (params.q && !urlQueryTaken) {
    setUrlQueryTaken(true);
    if (!query) {
      setQuery(params.q);
      setSearchKey((value) => value + 1);
    }
  }

  const rangeAt = (at: number, dir: FlightDirection) => (searching ? searchRange(at, zone) : boardRange(at, shift.earlier, shift.later, dir));
  const feed = useFlightFeed(
    (at): FeedRequest[] =>
      (['d', 'a'] as const).flatMap((dir) =>
        datesInRange(rangeAt(at, dir), zone).map((date) => ({
          airport: airport.slug,
          date,
          direction: dir,
        })),
      ),
    { paused: userPaused || held.focus || held.pointer },
  );
  const provider = feed.provider;

  /** Write the filters to the URL without a navigation, so the view can be shared and reloaded. */
  const write = (
    changes: Partial<{
      direction: FlightDirection;
      terminal: TerminalId | undefined;
      q: string;
      groups: StatusGroupId[];
    }>,
  ) => {
    clearTimeout(urlTimer.current);
    const next = {
      direction: chosenDirection,
      terminal: params.terminal,
      q: query,
      groups: params.groups,
      ...changes,
    };
    window.history.replaceState(null, '', `${window.location.pathname}${boardQueryString(next)}${window.location.hash}`);
  };

  const range = useMemo(() => {
    if (!provider) return null;
    return searching ? searchRange(provider.now, zone) : boardRange(provider.now, shift.earlier, shift.later, direction);
  }, [provider, searching, shift, zone, direction]);

  /* Both boards for their windows, before search and status filters. */
  const pools = useMemo(() => {
    if (!provider) return null;
    const pool = (dir: FlightDirection) => {
      const window = searching ? searchRange(provider.now, zone) : boardRange(provider.now, shift.earlier, shift.later, dir);
      return provider.listFlightsSync({
        airport: airport.slug,
        terminal: params.terminal,
        from: window.from,
        to: window.to,
        direction: dir,
      });
    };
    return { d: pool('d'), a: pool('a') };
  }, [provider, searching, shift, zone, airport.slug, params.terminal]);

  const now = provider?.now;
  const searched = useMemo(() => {
    if (!pools) return null;
    return {
      d: selectBoardFlights(pools.d, {
        q: query,
        groups: [],
        direction: 'd',
        now,
      }),
      a: selectBoardFlights(pools.a, {
        q: query,
        groups: [],
        direction: 'a',
        now,
      }),
    };
  }, [pools, query, now]);
  const counts = useMemo(() => (searched ? countByGroup(searched[direction], direction) : null), [searched, direction]);
  /* The default view leads with flights still to come; Earlier brings the finished ones back (ux-frequent-10). */
  const selected = useMemo(() => {
    if (!searched) return null;
    const list = selectBoardFlights(searched[direction], {
      q: '',
      groups: params.groups,
      direction,
    });
    return searching || shift.earlier > 0 || params.groups.length > 0 ? { shown: list, finished: 0 } : setAsideFinished(list, direction);
  }, [searched, direction, params.groups, searching, shift.earlier]);
  const shown: Flight[] | null = selected?.shown ?? null;

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
  const filterKey = `${direction}|${params.terminal ?? ''}|${query.trim()}|${params.groups.join(',')}|${shift.earlier}|${shift.later}`;
  /* Rows rendered at once; reset whenever the filters change. */
  const [cap, setCap] = useState({ key: filterKey, limit: BOARD_ROW_LIMIT });
  const limit = cap.key === filterKey ? cap.limit : BOARD_ROW_LIMIT;
  const visible = useMemo(() => (shown ? shown.slice(0, limit) : null), [shown, limit]);
  const more = shown ? shown.length - (visible?.length ?? 0) : 0;
  const initialKey = useRef(filterKey);
  const countRegion = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (filterKey === initialKey.current) return;
    const timer = setTimeout(() => {
      if (countRegion.current) countRegion.current.textContent = latestCount.current;
    }, 500);
    return () => clearTimeout(timer);
  }, [filterKey]);

  /* Typing: the board follows in a transition, and the URL is written once typing pauses. */
  const onQueryChange = (value: string) => {
    startTransition(() => setQuery(value));
    clearTimeout(urlTimer.current);
    // Only `q` changes, merged into the URL as it is then (filters chosen meanwhile are kept).
    urlTimer.current = setTimeout(() => {
      const url = new URL(window.location.href);
      if (value.trim()) url.searchParams.set('q', value.trim());
      else url.searchParams.delete('q');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }, 400);
  };
  /* Clearing from outside the field (the no-results state) also resets the field. */
  const clearQuery = () => {
    setQuery('');
    setSearchKey((value) => value + 1);
    write({ q: '' });
  };
  useEffect(() => () => clearTimeout(urlTimer.current), []);
  const togglePause = () => {
    setUserPaused((value) => !value);
    setAnnouncement(userPaused ? t('flightPages.feed.resumed') : t('flightPages.feed.paused'));
  };
  const onDirectionChange = (value: string) => {
    if (value !== 'd' && value !== 'a') return;
    setDirection(value);
    write({
      direction: value,
      groups: params.groups.filter((group) => STATUS_GROUPS[value].some((item) => item.id === group)),
    });
  };

  const title = direction === 'd' ? t('flights.board.departuresTitle') : t('flights.board.arrivalsTitle');
  const subtitle = !range
    ? localizeAirport(airport, lang).name // verification round two (D-09): Malay on /ms before hydration
    : searching
      ? t('flightPages.board.searchWindow', { query: query.trim() })
      : params.terminal
        ? t('flightPages.board.windowTerminal', {
            terminal: terminalLabel(airport, params.terminal, lang),
            from: formatTime(range.from, zone),
            to: formatTime(range.to, zone),
          })
        : t('flightPages.board.window', {
            from: formatTime(range.from, zone),
            to: formatTime(range.to, zone),
          });
  const generatedAt = feed.updatedAt;

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
    <div className="flex justify-center px-4 py-0.5 sm:px-5 sm:py-1.5">{canMove ? button : <p className="type-body-sm py-2 text-ink-2">{limit}</p>}</div>
  );

  const empty = (() => {
    if (searching && (searched?.[direction].length ?? 0) === 0) {
      return (
        <EmptyState
          variant="plain"
          icon="search-x"
          title={t('flightPages.board.noResultsTitle', { query: query.trim() })}
          action={
            <Button variant="secondary" size="sm" iconStart="x" onClick={clearQuery}>
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
        // Round 5: both steps, as the message says (only Earlier was offered, under a line that
        // also suggests later flights).
        action={
          shift.earlier < MAX_EARLIER_STEPS || shift.later < MAX_LATER_STEPS ? (
            <>
              {shift.earlier < MAX_EARLIER_STEPS ? earlierButton : null}
              {shift.later < MAX_LATER_STEPS ? laterButton : null}
            </>
          ) : undefined
        }
      >
        {t('flightPages.board.emptyBody')}
      </EmptyState>
    );
  })();

  // Round 5 (E-01/E-02): server-rendered in the board's frame until the feed answers, in the same
  // block and the same `EmptyState` as the empty board, so at night the "No departures" message
  // fills what is already on screen (it painted as a new block after the feed: LCP 4.7 s). It
  // says what the board will hold, not that anything is live.
  const loading = (
    <EmptyState variant="plain" icon={direction === 'd' ? 'plane-takeoff' : 'plane-landing'} title={t('flightPages.board.loadingTitle')}>
      {t('flightPages.board.loadingBody')}
    </EmptyState>
  );

  // Tighter on phones so the first rows reach the first screen (A-01, round 2).
  const panel = (
    <div className="flex flex-col gap-3 sm:gap-5">
      <BoardToolbar
        airport={airport}
        direction={direction}
        query={query}
        initialQuery={query}
        searchKey={searchKey}
        onQueryChange={onQueryChange}
        terminal={params.terminal}
        onTerminalChange={(terminal) => write({ terminal })}
        groups={params.groups}
        onGroupsChange={(groups) => write({ groups })}
        counts={counts}
      />

      {/* The live region stays in the page; while empty it takes no gap of its own. */}
      <FeedNotice feed={feed} timeZone={zone} className="empty:-mt-3 sm:empty:-mt-5" />

      {savedOnBoard > 0 ? (
        <p className="type-body-sm flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-md border border-line bg-page-subtle py-1 pr-1 pl-3 text-ink-2">
          <Icon name="bookmark-check" size="sm" className="text-ink" />
          <span className="min-w-0 flex-1 basis-48">
            <strong className="font-semibold text-ink">{t.count('flightPages.board.savedHere', savedOnBoard)}</strong>{' '}
            <span className="max-md:sr-only">{t('flightPages.board.savedHint')}</span>
          </span>
          <LocaleLink href="/journey" className="link-action px-2 text-ink">
            {t('flightPages.board.openJourney')}
            <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
          </LocaleLink>
        </p>
      ) : null}

      <div
        onFocusCapture={(event) => {
          if ((event.target as HTMLElement).closest('li, tr')) setHeld((value) => ({ ...value, focus: true }));
        }}
        onBlurCapture={() => setHeld((value) => ({ ...value, focus: false }))}
        onPointerOver={(event) => {
          // Only a mouse resting on a row holds the updates (not anywhere on the board).
          const onRow = event.pointerType === 'mouse' && Boolean((event.target as HTMLElement).closest('li, tr'));
          setHeld((value) => (value.pointer === onRow ? value : { ...value, pointer: onRow }));
        }}
        onPointerLeave={() => setHeld((value) => (value.pointer ? { ...value, pointer: false } : value))}
      >
        <FlightBoard
          flights={visible}
          direction={direction}
          title={title}
          subtitle={subtitle}
          headingLevel={2}
          updatedAt={generatedAt}
          refreshSeconds={feed.paused ? undefined : feed.refreshSeconds}
          headerActions={
            provider ? (
              <Button variant="quiet" size="sm" aria-pressed={userPaused} onClick={togglePause} className="shrink-0">
                {userPaused ? t('flightPages.feed.resume') : t('flightPages.feed.pause')}
              </Button>
            ) : undefined
          }
          context={
            generatedAt ? (
              <>
                <AirportCode code={airport.code} name={airport.name} size="sm" /> <span aria-hidden="true">·</span>{' '}
                {/* The short date on phones keeps the freshness line to one row (A-01, round 2). */}
                <span className="sm:hidden">{formatDate(generatedAt, lang, 'short')}</span>
                <span className="max-sm:hidden">{formatDate(generatedAt, lang, 'weekday')}</span>
              </>
            ) : undefined
          }
          live="off"
          compactHeader
          groupByHour
          timeZone={zone}
          dayLabel={(date) => {
            if (!now) return undefined;
            const today = dateKey(now, zone);
            if (date === today) return undefined;
            if (date === shiftDateKey(today, 1)) return t('common.labels.tomorrow');
            if (date === shiftDateKey(today, -1)) return t('common.labels.yesterday');
            return formatDate(zonedDateTime(date, 720, zone), lang, 'weekday', zone);
          }}
          skeletonRows={8}
          loading={loading}
          savedIds={savedIds}
          onSaveChange={(flight, saved) => (saved ? saveFlight(toSavedFlight(flight, t)) : removeFlight(flight.id))}
          before={
            searching ? undefined : (
              <>
                {/* On phones the note is left to screen readers and "Show earlier flights" stays, so
                  the first row reaches the first 664 px in both languages (A-01, round 2). From sm up
                  the note and the button share one line, so on a 1440 x 900 screen the first row
                  sits above the fold (round 4, re-review 6.1.6: it was at 935 px). */}
                <div className="sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-2">
                  {selected && selected.finished > 0 ? (
                    <p className="type-body-sm px-4 text-center text-ink-2 max-sm:sr-only sm:pr-0 sm:pl-5">
                      {t.count(direction === 'd' ? 'flightPages.rows.departedHidden' : 'flightPages.rows.arrivedHidden', selected.finished)}
                    </p>
                  ) : null}
                  {edge(shift.earlier < MAX_EARLIER_STEPS, earlierButton, t('flightPages.board.earlierLimit'))}
                </div>
              </>
            )
          }
          after={
            (shown?.length ?? 0) === 0 ? undefined : (
              <>
                {more > 0 ? (
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 sm:px-5">
                    <span className="type-body-sm text-ink-2">
                      {t('flightPages.rows.shownOf', {
                        shown: visible?.length ?? 0,
                        total: shown?.length ?? 0,
                      })}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      iconStart="chevron-down"
                      onClick={() =>
                        setCap({
                          key: filterKey,
                          limit: limit + BOARD_ROW_LIMIT,
                        })
                      }
                    >
                      {t.count('flightPages.rows.showMore', Math.min(more, BOARD_ROW_LIMIT))}
                    </Button>
                  </div>
                ) : null}
                {searching || more > 0 ? null : edge(shift.later < MAX_LATER_STEPS, laterButton, t('flightPages.board.laterLimit'))}
              </>
            )
          }
          empty={empty}
          footer={
            shown && now ? (
              <p className="type-body-sm text-ink-2">
                {feed.paused ? (
                  <>
                    <strong className="font-semibold text-ink">{userPaused ? t('flightPages.feed.paused') : t('flightPages.feed.heldForFocus')}</strong>{' '}
                  </>
                ) : null}
                <strong className="font-semibold text-ink">{countText}</strong> <span aria-hidden="true">·</span>{' '}
                {t('flightPages.board.timesNote', {
                  zone: timezoneLabel(now, zone),
                })}
              </p>
            ) : undefined
          }
        />
      </div>
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
    // E-17 hand-off (round 2): the flight board answers with demonstration data.
    <div className="flex flex-col" data-answer-task="flight-board" data-answer-state="demo">
      <Tabs value={chosenDirection} onValueChange={onDirectionChange}>
        <TabsList aria-label={t('flightPages.board.tabsLabel')}>
          {tab('d')}
          {tab('a')}
        </TabsList>
        {/* While the new direction renders, the previous list stays under the chosen tab, dimmed.
            One panel that follows the chosen tab (round 2, B-06): with a panel per tab, a switch
            moved the board to the other panel, so React rebuilt every row before the tab could
            answer (320 to 440 ms at 4x CPU). Radix renders only the selected panel either way. */}
        <TabsContent value={chosenDirection} className={cn('max-sm:pt-3', chosenDirection !== direction && 'opacity-60')}>
          {panel}
        </TabsContent>
      </Tabs>
      <p ref={countRegion} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <FlightWatcher flights={savedHere} timeZone={zone} />
    </div>
  );
}
