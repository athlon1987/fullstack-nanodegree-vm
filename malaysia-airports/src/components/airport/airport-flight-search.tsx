'use client';

import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { FlightSearchBox } from '@/components/flights/flight-search-box';
import { useTerminalParam } from './use-terminal-filter';

export interface AirportFlightToolsProps {
  slug: string;
  /** The airport's short name, for headings. */
  name: string;
  /** False when the demo provider has no board for this airport: the flight tools are left out. */
  hasFlights: boolean;
}

export interface AirportFlightSearchProps extends AirportFlightToolsProps {
  /** On the airport's midnight header (redesign round one): the heading takes the light ink. */
  onMedia?: boolean;
}

/**
 * The overview's flight search, on its own (round 6, review-3 9.1 item 7): it comes before the
 * notices, so on a phone it is on the first screen instead of below a long notice (it was at
 * 2,236 px). Renders nothing for an airport without a demonstration board.
 *
 * Redesign 1c: in a module of its own, apart from `AirportFlightTools`, so the hero's search does
 * not bring the tools below the fold (journey modes, quick actions, board preview) into the first
 * load; the overview loads those with `LazyAirportFlightTools`.
 */
export function AirportFlightSearch({ slug, name, hasFlights, onMedia = false }: AirportFlightSearchProps) {
  const t = useT();
  const terminal = useTerminalParam(slug);
  if (!hasFlights) return null;
  return (
    <section aria-labelledby="airport-search-title">
      <h2 id="airport-search-title" className={cn('type-title-lg mb-3 text-ink', onMedia && 'on-media')}>
        {t('airportPage.searchTitle', { airport: name })}
      </h2>
      <FlightSearchBox id="flight-search" airport={slug} terminal={terminal} />
    </section>
  );
}

