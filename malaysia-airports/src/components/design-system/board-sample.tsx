import { AIRPORTS, getAirport } from '@/content/airports';
import type { Lang } from '@/content/types';
import { cn } from '@/lib/cn';
import { formatFlightNumber } from '@/lib/flights';
import type { Translator } from '@/lib/i18n/translate';
import { boardWindow, createDemoProvider } from '@/lib/providers';
import { formatDate, formatTime } from '@/lib/time';
import { WeaveTexture } from '@/components/art/patterns';
import { AirportCode } from '@/components/common/airport-code';
import { DemoDataBanner } from '@/components/common/demo-data-banner';
import { FlightStatusChip } from '@/components/common/flight-status-chip';
import { Freshness } from '@/components/common/freshness';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '@/components/ui/table';

/**
 * A fixed instant, so this server-rendered specimen is deterministic (Server Components never
 * read the clock). Real boards are Client Components fed by `useFlightProvider()`.
 */
const SAMPLE_INSTANT = '2026-11-17T09:30:00+08:00';

/** The demo provider's flights for the specimen board and the flight-detail specimens. */
export function sampleFlights(limit = 7) {
  const provider = createDemoProvider(SAMPLE_INSTANT);
  const flights = provider.listFlightsSync({ airport: 'kul', direction: 'd', ...boardWindow(SAMPLE_INSTANT, 8, 60) });
  // Show a spread of statuses first, then fill with the next flights in time order.
  const seen = new Set<string>();
  const varied = flights.filter((flight) => (seen.has(flight.status) ? false : (seen.add(flight.status), true)));
  const rest = flights.filter((flight) => !varied.includes(flight));
  return { provider, flights: [...varied, ...rest].slice(0, limit).sort((a, b) => a.scheduled.localeCompare(b.scheduled)) };
}

export function BoardSample({ t, lang }: { t: Translator; lang: Lang }) {
  const { provider, flights } = sampleFlights();
  const airport = getAirport('kul') ?? AIRPORTS[0];
  const gateOf = (gate: string | undefined) =>
    gate ?? (
      <span className="text-ink-2">
        <span aria-hidden="true">–</span>
        <span className="sr-only">{t('flights.board.gateNotAssigned')}</span>
      </span>
    );
  return (
    <div>
      <DemoDataBanner attached />
      <div className="surface-board @container relative overflow-hidden rounded-b-lg border border-t-0 border-line">
        <WeaveTexture className="absolute right-0 bottom-0 h-14 w-2/5 max-sm:hidden" />
        <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line px-4 py-4 sm:px-5">
          <div>
            <h3 className="type-title-lg text-ink">{t('flights.board.departuresTitle')}</h3>
            <p className="type-body-sm mt-0.5 text-ink-2">{airport.name}</p>
          </div>
          <Freshness
            live="off"
            updatedAt={provider.meta().generatedAt}
            refreshSeconds={provider.meta().refreshSeconds}
            context={
              <>
                <AirportCode code={airport.code} size="sm" /> · {formatDate(SAMPLE_INSTANT, lang, 'weekday')}
              </>
            }
          />
        </div>
        {/* Narrow boards (phones, small tablets, large text): each flight is a stacked row and nothing
            scrolls sideways. The switch is a container query, so it also follows the text-size setting. */}
        <ul aria-label={t('flights.board.departuresTitle')} className="relative @4xl:hidden">
          {flights.map((flight) => {
            const moved = flight.estimated !== flight.scheduled;
            const cancelled = flight.status === 'cancelled';
            return (
              <li key={flight.id} className={cn('flex gap-3 border-b border-line px-4 py-3 sm:px-5', cancelled && 'text-ink-3')}>
                <p className="flex w-[4.25rem] shrink-0 flex-col">
                  <span className="sr-only">{t('common.labels.time')}: </span>
                  {moved ? <s className="type-data-sm text-ink-2">{formatTime(flight.scheduled)}</s> : null}
                  <span className={cn('type-data-lg', !cancelled && 'text-board-accent')}>{formatTime(moved ? flight.estimated : flight.scheduled)}</span>
                </p>
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-5 gap-y-2">
                  <div className="min-w-0 grow basis-52">
                    <p className="type-title-sm">
                      {flight.destination.city} <AirportCode code={flight.destination.code} size="sm" className="ml-1 text-ink-2" />
                    </p>
                    <p className="type-data-sm mt-0.5 text-ink-2">
                      {formatFlightNumber(flight)} <span aria-hidden="true">·</span> <span className="font-sans">{flight.airline.name}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 @max-lg:basis-full">
                    <span className="type-data-md inline-flex items-center gap-2">
                      <span className="sr-only">{t('common.labels.gate')}: </span>
                      <TerminalBadge terminal={flight.terminal} size="sm" />
                      {gateOf(flight.gate)}
                    </span>
                    <FlightStatusChip status={flight.status} size="sm" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <TableScroll label={t('flights.board.departuresTitle')} className="relative @max-4xl:hidden">
          <Table density="default">
            <caption className="sr-only">
              {t('flights.board.departuresTitle')}: {airport.name}. {t('demo.badge')}.
            </caption>
            <THead>
              <Tr>
                <Th>{t('common.labels.time')}</Th>
                <Th>{t('common.labels.flight')}</Th>
                <Th>{t('flights.board.destination')}</Th>
                <Th>{t('common.labels.airline')}</Th>
                <Th>{t('common.labels.gate')}</Th>
                <Th>{t('common.labels.status')}</Th>
              </Tr>
            </THead>
            <TBody>
              {flights.map((flight) => {
                const moved = flight.estimated !== flight.scheduled;
                const cancelled = flight.status === 'cancelled';
                return (
                  <Tr key={flight.id} muted={cancelled}>
                    <Td mono className="whitespace-nowrap">
                      {moved ? (
                        <>
                          <s className="type-data-md text-ink-2">{formatTime(flight.scheduled)}</s>{' '}
                          <span className="type-data-lg text-board-accent">{formatTime(flight.estimated)}</span>
                        </>
                      ) : (
                        <span className={cancelled ? 'type-data-lg' : 'type-data-lg text-board-accent'}>{formatTime(flight.scheduled)}</span>
                      )}
                    </Td>
                    <Td mono className="whitespace-nowrap">
                      {formatFlightNumber(flight)}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span className="font-semibold">{flight.destination.city}</span> <AirportCode code={flight.destination.code} size="sm" className="ml-1 text-ink-2" />
                    </Td>
                    <Td className="whitespace-nowrap text-ink-2">{flight.airline.name}</Td>
                    <Td mono className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <TerminalBadge terminal={flight.terminal} size="sm" />
                        {gateOf(flight.gate)}
                      </span>
                    </Td>
                    <Td>
                      <FlightStatusChip status={flight.status} />
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </TableScroll>
        <p className="type-caption relative px-4 py-3 text-ink-2 sm:px-5">{t('designSystem.notes.boardSample')}</p>
      </div>
    </div>
  );
}
