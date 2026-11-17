'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Flight, FlightDirection } from '@/lib/flights';
import { useT } from '@/lib/i18n/client';
import type { Instant } from '@/lib/time';
import { WeaveTexture } from '@/components/art/patterns';
import { DemoDataBanner } from '@/components/common/demo-data-banner';
import { Freshness } from '@/components/common/freshness';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableScroll, TBody, Th, THead, Tr } from '@/components/ui/table';
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
  /** Announce refreshes politely (full boards) or not at all (previews). Default `off`. */
  live?: 'polite' | 'off';
  /** Add an Airport column: for lists that span several airports. */
  showAirport?: boolean;
  /** Shown instead of rows when the list is empty. */
  emptyMessage?: ReactNode;
  /** Links or buttons under the rows. */
  footer?: ReactNode;
  /** Rows of the loading skeleton. */
  skeletonRows?: number;
  /** Leave out the demonstration banner. Only when the same view already shows one directly above. */
  hideBanner?: boolean;
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
  live = 'off',
  showAirport = false,
  emptyMessage,
  footer,
  skeletonRows = 6,
  hideBanner = false,
  className,
}: FlightBoardProps) {
  const t = useT();
  const Heading = `h${headingLevel}` as 'h2' | 'h3';
  const placeLabel = direction === 'd' ? t('flights.board.destination') : t('flights.board.origin');
  const standLabel = direction === 'd' ? t('common.labels.gate') : t('common.labels.belt');

  return (
    <div className={className}>
      {hideBanner ? null : <DemoDataBanner attached />}
      <div className={cn('surface-board @container relative overflow-hidden border border-line', hideBanner ? 'rounded-lg' : 'rounded-b-lg border-t-0')}>
        <WeaveTexture className="absolute right-0 bottom-0 h-14 w-2/5 max-sm:hidden" />
        <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <Heading className="type-title-lg text-ink">{title}</Heading>
            {subtitle ? <p className="type-body-sm mt-0.5 text-ink-2">{subtitle}</p> : null}
          </div>
          <Freshness live={live} updatedAt={updatedAt} refreshSeconds={refreshSeconds} context={context} />
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
          <p className="type-body relative px-4 py-8 text-ink-2 sm:px-5">{emptyMessage ?? t('flights.board.noFlights')}</p>
        ) : (
          <>
            <ul aria-label={title} className="relative @4xl:hidden">
              {flights.map((flight) => (
                <FlightRow key={flight.id} flight={flight} layout="card" showAirport={showAirport} />
              ))}
            </ul>
            <TableScroll label={title} className="relative @max-4xl:hidden">
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
                  </Tr>
                </THead>
                <TBody>
                  {flights.map((flight) => (
                    <FlightRow key={flight.id} flight={flight} layout="table" showAirport={showAirport} />
                  ))}
                </TBody>
              </Table>
            </TableScroll>
          </>
        )}

        {footer ? <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line px-4 py-3 sm:px-5">{footer}</div> : null}
      </div>
    </div>
  );
}
