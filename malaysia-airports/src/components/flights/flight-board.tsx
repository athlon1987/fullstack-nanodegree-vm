'use client';

import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { groupFlightsByHour, type Flight, type FlightDirection, type FlightHourGroup } from '@/lib/flights';
import { useT } from '@/lib/i18n/client';
import type { Instant } from '@/lib/time';
import { WeaveTexture } from '@/components/art/patterns';
import { DemoDataBanner } from '@/components/common/demo-data-banner';
import { Freshness } from '@/components/common/freshness';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableScroll, TBody, Th, THead, Tr } from '@/components/ui/table';
import { DemoMark } from './demo-mark';
import { FlightRow } from './flight-row';

export interface FlightBoardProps {
  /** Rows to show, already filtered and ordered. `null` while the clock is not available yet (before hydration). */
  flights: readonly Flight[] | null;
  direction: FlightDirection;
  /** Board heading, for example "Departures". */
  title: string;
  /** A separate line under the heading: the airport, or what the list covers. */
  subtitle?: ReactNode;
  headingLevel?: 2 | 3;
  /** When the boards shown were generated (`feed.updatedAt`), or `null` while loading. */
  updatedAt: Instant | null;
  refreshSeconds?: number;
  /** Shown before the freshness time: the airport code and the day. */
  context?: ReactNode;
  /** Controls beside the freshness row, for example "Pause live updates". */
  headerActions?: ReactNode;
  /** Announce refreshes politely (full boards) or not at all (previews). Default `off`. */
  live?: 'polite' | 'off';
  /** Add an Airport column: for lists that span several airports. */
  showAirport?: boolean;
  /** Shown instead of rows when the list is empty. */
  emptyMessage?: ReactNode;
  /** Richer content for an empty list (an `EmptyState` with actions). Takes precedence over `emptyMessage`. */
  empty?: ReactNode;
  /** Links or buttons under the rows. */
  footer?: ReactNode;
  /** Rows of the loading skeleton. */
  skeletonRows?: number;
  /**
   * Round 5 (E-01/E-02): a message to show while the rows load, instead of the skeleton rows. Pass
   * an `EmptyState`, like `empty`: the loading message and the empty state then share one block of
   * the skeleton's height, so at night the "No departures" message fills the block already
   * painted in the first flush instead of appearing as a new one after the feed.
   */
  loading?: ReactNode;
  /** Leave out the demonstration banner. Only when the same view already shows one directly above. */
  hideBanner?: boolean;
  /**
   * Round 6 (review-3 9.1 item 7): the banner as one line (its title, "Do not use this data to plan
   * travel" and the link), for a board under its own tabs, so more rows reach the first screen.
   */
  compactBanner?: boolean;
  /**
   * A shorter header, for a board under its own Departures/Arrivals tabs (A-01, round 2; on wider
   * screens too since round 6): the heading is left to screen readers (the selected tab names the
   * direction) and the header is one row. On phones the refresh interval is also left to screen
   * readers (the Pause button says the board is live) and the actions share the first row with
   * the subtitle.
   */
  compactHeader?: boolean;
  /** Group rows under the local hour of their scheduled time ("From 14:00"). */
  groupByHour?: boolean;
  /** Time zone of the board's airport, for the hour groups. */
  timeZone?: string;
  /** Names the day of an hour group ("Tomorrow") when it is not today; return `undefined` for today. */
  dayLabel?: (date: string) => string | undefined;
  /** Names the day of a row's time when it is not today ("Tomorrow"; `rowDayLabel`), for boards without hour groups (round 4). */
  rowDay?: (flight: Flight) => string | undefined;
  /** Inside the board, above the rows (for example "Show earlier flights"). Hidden while loading or empty. */
  before?: ReactNode;
  /** Classes for the row that holds `before` (the explorer hides it on wide screens, where its button moves to the header). */
  beforeClassName?: string;
  /** Inside the board, below the rows (for example "Show later flights"). Shown unless loading. */
  after?: ReactNode;
  /** Ids of flights in My journey; used with `onSaveChange`. */
  savedIds?: ReadonlySet<string>;
  /** Show a save toggle on every row. */
  onSaveChange?: (flight: Flight, saved: boolean) => void;
  className?: string;
}

/** The block that holds the loading message or the empty state (one element for both, see `loading`); top-aligned, so a longer message grows downwards. */
const STATE_BLOCK = 'relative flex flex-col';

/**
 * The flight board: the hazard-striped demonstration banner, then a neutral dark surface (the
 * same in both themes) with a heading, a freshness row and the flights.
 *
 * It responds to its own width, not the window: a table when wide, stacked rows when narrow or
 * when the text size is large, so nothing scrolls sideways on a phone.
 *
 * @example
 * const feed = useFlightFeed((at) => [{ airport, date: dateKey(at), direction }]);
 * const flights = useMemo(() => feed.provider?.listFlightsSync({ airport, direction }) ?? null, [feed.provider, airport, direction]);
 * <FlightBoard flights={flights} direction={direction} title={t('flights.board.departuresTitle')} subtitle={airport.name}
 *   updatedAt={feed.provider ? feed.updatedAt : null} refreshSeconds={feed.refreshSeconds} />
 */
export function FlightBoard({
  flights,
  direction,
  title,
  subtitle,
  headingLevel = 2,
  updatedAt,
  refreshSeconds,
  context,
  headerActions,
  live = 'off',
  showAirport = false,
  emptyMessage,
  empty,
  footer,
  skeletonRows = 6,
  loading,
  hideBanner = false,
  compactBanner = false,
  compactHeader = false,
  groupByHour = false,
  timeZone,
  dayLabel,
  rowDay,
  before,
  beforeClassName,
  after,
  savedIds,
  onSaveChange,
  className,
}: FlightBoardProps) {
  const t = useT();
  const Heading = `h${headingLevel}` as 'h2' | 'h3';
  const GroupHeading = `h${headingLevel + 1}` as 'h3' | 'h4';
  const placeLabel = direction === 'd' ? t('flights.board.destination') : t('flights.board.origin');
  const standLabel = direction === 'd' ? t('common.labels.gate') : t('common.labels.belt');
  const columns = 6 + (showAirport ? 1 : 0) + (onSaveChange ? 1 : 0);
  const groups: FlightHourGroup[] | null = flights && groupByHour ? groupFlightsByHour(flights, timeZone) : null;

  const row = (flight: Flight, layout: 'card' | 'table') => (
    <FlightRow
      key={flight.id}
      flight={flight}
      layout={layout}
      showAirport={showAirport}
      saved={savedIds?.has(flight.id) ?? false}
      onSaveChange={onSaveChange ? (saved) => onSaveChange(flight, saved) : undefined}
      day={rowDay?.(flight)}
    />
  );
  const groupLabel = (group: FlightHourGroup) => {
    const day = dayLabel?.(group.date);
    return day ? t('flightPages.board.hourGroupDay', { time: group.label, day }) : t('flightPages.board.hourGroup', { time: group.label });
  };
  const groupCount = (group: FlightHourGroup) => t.count('flights.board.count', group.flights.length);
  const [bannerInView, trackBanner] = useBannerInView(!hideBanner);
  /*
   * Round 6 (review-3 9.1 item 7, A-14: one Demo marker per view). Every hour header carried its
   * own Demo label, so a view of a filtered board showed up to 18. Now one label floats over
   * whichever hour header is stuck at the top (a sticky layer of the header's height), and only
   * once the banner above has scrolled out of view: every view of the board still shows exactly
   * one label (content-integrity-01). The headers keep an invisible copy for its width.
   */
  const groupMarker = (
    <div
      data-board-demo-marker=""
      className={cn('pointer-events-none sticky top-sticky z-30 -mb-8 flex h-8 items-center justify-end px-4 sm:px-5', bannerInView && 'invisible')}
    >
      <DemoMark />
    </div>
  );
  const markerSpace = (
    <span aria-hidden="true" className="invisible">
      <DemoMark />
    </span>
  );

  return (
    // Redesign round one: banner and board read as one rounded, lifted panel. `overflow-clip`
    // (never hidden) keeps the corners without breaking the sticky hour headings.
    <div className={cn('overflow-clip rounded-2xl shadow-lg dark:shadow-xl dark:ring-1 dark:ring-line-strong', className)}>
      {hideBanner ? null : (
        <div ref={trackBanner}>
          <DemoDataBanner attached compact={compactBanner} />
        </div>
      )}
      {/* overflow-clip (not hidden) keeps the rounded corners without breaking the sticky hour headers. */}
      <div className={cn('surface-board @container relative overflow-clip border border-line', hideBanner ? 'rounded-2xl' : 'rounded-b-2xl border-t-0')}>
        <WeaveTexture className="absolute right-0 bottom-0 h-14 w-2/5 max-sm:hidden" />
        <div
          className={cn(
            'relative flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line px-4 py-4 sm:px-5',
            compactHeader && 'max-sm:grid max-sm:grid-cols-[minmax(min-content,1fr)_auto] max-sm:items-center max-sm:gap-x-3 max-sm:gap-y-1 max-sm:py-2.5 sm:items-center sm:justify-start sm:py-2.5 lg:py-1.5',
          )}
        >
          {/* Redesign round one: in the compact header the time window keeps a minimum width, so the
              freshness line after it does not slide when the placeholder becomes the times (night CLS). */}
          <div className={cn('min-w-0', compactHeader && 'sm:min-w-36')}>
            {/* Round 6 (A-14): the card title size (22 px was a ninth type size on the home at 1440 px). */}
            <Heading className={cn('type-title-md text-ink', compactHeader && 'sr-only')}>{title}</Heading>
            {subtitle ? <p className={cn('type-body-sm mt-0.5 text-ink-2', compactHeader && 'mt-0')}>{subtitle}</p> : null}
          </div>
          {/* Compact (round 6, G8 item 9): from sm the freshness line starts after the time window and
              the actions sit at the right edge, so the line growing when the feed answers moves
              neither (it was right-aligned and slid left). */}
          <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', compactHeader && 'max-sm:contents sm:flex-1')}>
            <Freshness
              live={live}
              updatedAt={updatedAt}
              refreshSeconds={refreshSeconds}
              // The Pause button beside it says the board updates itself; the interval is read out.
              intervalClassName={compactHeader ? 'max-sm:sr-only' : undefined}
              context={context}
              className={compactHeader ? 'max-sm:col-span-2' : undefined}
            />
            {headerActions ? <div className={cn('contents', compactHeader && 'max-sm:col-start-2 max-sm:row-start-1 max-sm:block sm:ml-auto sm:block')}>{headerActions}</div> : null}
          </div>
        </div>

        {flights === null && loading ? (
          <div role="status" data-board-state="loading" className={STATE_BLOCK} style={{ minHeight: `calc(var(--spacing-row) * ${skeletonRows})` }}>
            {loading}
          </div>
        ) : flights === null ? (
          <div role="status" className="relative flex flex-col">
            <span className="sr-only">{t('common.labels.loading')}</span>
            {Array.from({ length: skeletonRows }, (_, index) => (
              <div key={index} className="flex h-row items-center gap-4 border-b border-line px-4 sm:px-5">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="ml-auto h-5 w-20" />
              </div>
            ))}
          </div>
        ) : flights.length === 0 ? (
          empty ? (
            <div data-board-state="empty" className={STATE_BLOCK} style={loading ? { minHeight: `calc(var(--spacing-row) * ${skeletonRows})` } : undefined}>
              {empty}
            </div>
          ) : (
            <p className="type-body relative px-4 py-8 text-ink-2 sm:px-5">{emptyMessage ?? t('flights.board.noFlights')}</p>
          )
        ) : (
          <>
            {before ? <div className={cn('relative border-b border-line', beforeClassName)}>{before}</div> : null}
            {groups ? (
              <div className="relative @4xl:hidden">
                {groupMarker}
                {groups.map((group) => {
                  const id = `board-${direction}-${group.date}-${group.hour}`;
                  return (
                    <section key={id} aria-labelledby={id}>
                      {/* Sticky, with a demo label: every scrolled view of the board shows one (content-integrity-01). */}
                      <GroupHeading id={id} className="sticky top-sticky z-20 flex items-center justify-between gap-3 border-y border-line bg-board-raised/95 px-4 py-1.5 backdrop-blur-sm sm:px-5">
                        <span className="type-data-sm font-semibold text-board-accent">{groupLabel(group)}</span>
                        <span className="flex items-center gap-2">
                          <span className="type-caption text-ink-2">{groupCount(group)}</span>
                          {markerSpace}
                        </span>
                      </GroupHeading>
                      <ul aria-labelledby={id} className="flex flex-col gap-2 p-2.5 sm:p-3">
                        {group.flights.map((flight) => row(flight, 'card'))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            ) : (
              <ul aria-label={title} className="relative flex flex-col gap-2 p-2.5 sm:p-3 @4xl:hidden">
                {flights.map((flight) => row(flight, 'card'))}
              </ul>
            )}
            {/* The table only shows when the board is wide enough for it, so it never needs to scroll
                sideways; visible overflow lets its hour headers stick while the page scrolls. */}
            <TableScroll label={title} className="relative overflow-x-visible @max-4xl:hidden">
              {groups ? groupMarker : null}
              <Table density="default">
                <caption className="sr-only">
                  {title}
                  {typeof subtitle === 'string' ? `: ${subtitle}` : ''}. {t('demo.badge')}.
                </caption>
                <THead>
                  <Tr>
                    <Th>{t('common.labels.time')}</Th>
                    <Th>{t('common.labels.flight')}</Th>
                    <Th>{placeLabel}</Th>
                    <Th>{t('common.labels.airline')}</Th>
                    {showAirport ? <Th>{t('common.labels.airport')}</Th> : null}
                    <Th>{standLabel}</Th>
                    <Th>{t('common.labels.status')}</Th>
                    {onSaveChange ? (
                      <Th>
                        <span className="sr-only">{t('common.actions.save')}</span>
                      </Th>
                    ) : null}
                  </Tr>
                </THead>
                {groups ? (
                  groups.map((group) => (
                    <Fragment key={`${group.date}-${group.hour}`}>
                      <TBody>
                        <tr className="border-b border-line bg-board-raised">
                          <th scope="rowgroup" colSpan={columns} className="sticky top-sticky z-20 bg-board-raised px-4 py-1.5 text-left font-normal sm:px-5">
                            <span className="flex items-center gap-2">
                              <span className="type-data-sm font-semibold text-board-accent">{groupLabel(group)}</span>
                              <span className="type-caption text-ink-2">{groupCount(group)}</span>
                            </span>
                          </th>
                        </tr>
                        {group.flights.map((flight) => row(flight, 'table'))}
                      </TBody>
                    </Fragment>
                  ))
                ) : (
                  <TBody>{flights.map((flight) => row(flight, 'table'))}</TBody>
                )}
              </Table>
            </TableScroll>
          </>
        )}

        {flights !== null && after ? <div className="relative border-t border-line first:border-t-0">{after}</div> : null}
        {footer ? <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line px-4 py-3 sm:px-5">{footer}</div> : null}
      </div>
    </div>
  );
}

/**
 * Whether the element passed to `ref` (the banner) can still be seen: its bottom is below the
 * sticky top edge that the hour headers stick to (`stickyTop` from the floating label's computed
 * `top`, which follows the header as it slides away). Starts `true` when `enabled`, the usual
 * case at load (the banner is at the top of the board), so the floating label does not flash
 * beside it. Checked once per frame while scrolling.
 */
function useBannerInView(enabled: boolean) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(enabled);
  useEffect(() => {
    if (!node) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      const marker = node.parentElement?.querySelector<HTMLElement>('[data-board-demo-marker]');
      const stickyTop = marker ? parseFloat(getComputedStyle(marker).top) || 0 : 0;
      const box = node.getBoundingClientRect();
      setVisible(box.bottom > stickyTop + 4 && box.top < window.innerHeight);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [node]);
  return [enabled && visible, setNode] as const;
}
