'use client';

import { Fragment, type ReactNode } from 'react';
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
  /** `provider.meta().generatedAt`, or `null` while loading. */
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
  /** Leave out the demonstration banner. Only when the same view already shows one directly above. */
  hideBanner?: boolean;
  /** Group rows under the local hour of their scheduled time ("From 14:00"). */
  groupByHour?: boolean;
  /** Time zone of the board's airport, for the hour groups. */
  timeZone?: string;
  /** Names the day of an hour group ("Tomorrow") when it is not today; return `undefined` for today. */
  dayLabel?: (date: string) => string | undefined;
  /** Inside the board, above the rows (for example "Show earlier flights"). Hidden while loading or empty. */
  before?: ReactNode;
  /** Inside the board, below the rows (for example "Show later flights"). Shown unless loading. */
  after?: ReactNode;
  /** Ids of flights in My journey; used with `onSaveChange`. */
  savedIds?: ReadonlySet<string>;
  /** Show a save toggle on every row. */
  onSaveChange?: (flight: Flight, saved: boolean) => void;
  className?: string;
}

/**
 * The flight board: the hazard-striped demonstration banner, then a neutral dark surface (the
 * same in both themes) with a heading, a freshness row and the flights.
 *
 * It responds to its own width, not the window: a table when wide, stacked rows when narrow or
 * when the text size is large, so nothing scrolls sideways on a phone.
 *
 * @example
 * const provider = useFlightProvider();
 * const flights = useMemo(() => provider?.listFlightsSync({ airport, direction, ...boardWindow(provider.meta().generatedAt) }) ?? null, [provider, airport, direction]);
 * <FlightBoard flights={flights} direction={direction} title={t('flights.board.departuresTitle')} subtitle={airport.name}
 *   updatedAt={provider?.meta().generatedAt ?? null} refreshSeconds={provider?.meta().refreshSeconds} />
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
  hideBanner = false,
  groupByHour = false,
  timeZone,
  dayLabel,
  before,
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
    />
  );
  const groupLabel = (group: FlightHourGroup) => {
    const day = dayLabel?.(group.date);
    return day ? t('flightPages.board.hourGroupDay', { time: group.label, day }) : t('flightPages.board.hourGroup', { time: group.label });
  };
  const groupCount = (group: FlightHourGroup) => t.count('flights.board.count', group.flights.length);

  return (
    <div className={className}>
      {hideBanner ? null : <DemoDataBanner attached />}
      {/* overflow-clip (not hidden) keeps the rounded corners without breaking the sticky hour headers. */}
      <div className={cn('surface-board @container relative overflow-clip border border-line', hideBanner ? 'rounded-lg' : 'rounded-b-lg border-t-0')}>
        <WeaveTexture className="absolute right-0 bottom-0 h-14 w-2/5 max-sm:hidden" />
        <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <Heading className="type-title-lg text-ink">{title}</Heading>
            {subtitle ? <p className="type-body-sm mt-0.5 text-ink-2">{subtitle}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Freshness live={live} updatedAt={updatedAt} refreshSeconds={refreshSeconds} context={context} />
            {headerActions}
          </div>
        </div>

        {flights === null ? (
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
            <div className="relative">{empty}</div>
          ) : (
            <p className="type-body relative px-4 py-8 text-ink-2 sm:px-5">{emptyMessage ?? t('flights.board.noFlights')}</p>
          )
        ) : (
          <>
            {before ? <div className="relative border-b border-line">{before}</div> : null}
            {groups ? (
              <div className="relative @4xl:hidden">
                {groups.map((group) => {
                  const id = `board-${direction}-${group.date}-${group.hour}`;
                  return (
                    <section key={id} aria-labelledby={id}>
                      {/* Sticky, with a demo label: every scrolled view of the board shows one (content-integrity-01). */}
                      <GroupHeading id={id} className="sticky top-header z-20 flex items-center justify-between gap-3 border-b border-line bg-board-raised px-4 py-1.5 sm:px-5">
                        <span className="type-data-sm text-ink">{groupLabel(group)}</span>
                        <span className="flex items-center gap-2">
                          <span className="type-caption text-ink-2">{groupCount(group)}</span>
                          <DemoMark />
                        </span>
                      </GroupHeading>
                      <ul aria-labelledby={id}>{group.flights.map((flight) => row(flight, 'card'))}</ul>
                    </section>
                  );
                })}
              </div>
            ) : (
              <ul aria-label={title} className="relative @4xl:hidden">
                {flights.map((flight) => row(flight, 'card'))}
              </ul>
            )}
            {/* The table only shows when the board is wide enough for it, so it never needs to scroll
                sideways; visible overflow lets its hour headers stick while the page scrolls. */}
            <TableScroll label={title} className="relative overflow-x-visible @max-4xl:hidden">
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
                          <th scope="rowgroup" colSpan={columns} className="sticky top-header z-20 bg-board-raised px-4 py-1.5 text-left font-normal sm:px-5">
                            <span className="flex items-center gap-2">
                              <span className="type-data-sm text-ink">{groupLabel(group)}</span>
                              <span className="type-caption text-ink-2">{groupCount(group)}</span>
                              <DemoMark className="ml-auto" />
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
