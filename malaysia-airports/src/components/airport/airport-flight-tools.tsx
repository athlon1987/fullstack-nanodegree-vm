'use client';

import { Suspense } from 'react';
import { DemoMarkedList } from '@/components/common/demo-tag';
import type { TerminalId } from '@/content/types';
import { useT } from '@/lib/i18n/client';
import { FlightSearchBox } from '@/components/flights/flight-search-box';
import { BoardPreview } from '@/components/home/board-preview';
import { JourneyModeGuidance, JourneyModes } from '@/components/home/journey-modes';
import { ModeQuickActions } from '@/components/home/mode-quick-actions';
import { useTerminalFilter } from './use-terminal-filter';

export interface AirportFlightToolsProps {
  slug: string;
  /** The airport's short name, for headings. */
  name: string;
  /** False when the demo provider has no board for this airport: the flight tools are left out. */
  hasFlights: boolean;
}

function Tools({ slug, name, hasFlights, terminal }: AirportFlightToolsProps & { terminal?: TerminalId }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-10">
      {hasFlights ? (
        <section aria-labelledby="airport-search-title">
          <h2 id="airport-search-title" className="type-title-lg mb-3 text-ink">
            {t('airportPage.searchTitle', { airport: name })}
          </h2>
          <FlightSearchBox id="flight-search" airport={slug} terminal={terminal} />
        </section>
      ) : null}

      <section aria-labelledby="airport-actions-title">
        <h2 id="airport-actions-title" className="type-title-lg mb-3 text-ink">
          {t('airportPage.quickTitle', { airport: name })}
        </h2>
        <div className="flex flex-col gap-3">
          <JourneyModes />
          <JourneyModeGuidance className="px-1" />
          <ModeQuickActions airport={slug} terminal={terminal} />
        </div>
      </section>

      {hasFlights ? (
        <DemoMarkedList>
          <BoardPreview airport={slug} terminal={terminal} rows={6} headingLevel={2} />
        </DemoMarkedList>
      ) : null}
    </div>
  );
}

function ToolsForRoute(props: AirportFlightToolsProps) {
  const { terminal } = useTerminalFilter(props.slug);
  return <Tools {...props} terminal={terminal} />;
}

/**
 * The scoped tools of an airport overview: flight search, journey modes with their quick actions
 * and a board preview, all narrowed to the terminal in the URL (`?t=`) at KLIA.
 */
export function AirportFlightTools(props: AirportFlightToolsProps) {
  return (
    <Suspense fallback={<Tools {...props} />}>
      <ToolsForRoute {...props} />
    </Suspense>
  );
}
