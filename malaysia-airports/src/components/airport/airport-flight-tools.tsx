'use client';

import { DemoMarkedList } from '@/components/common/demo-tag';
import { useT } from '@/lib/i18n/client';
import { FlightSearchBox } from '@/components/flights/flight-search-box';
import { BoardPreview } from '@/components/home/board-preview';
import { JourneyModeGuidance, JourneyModes } from '@/components/home/journey-modes';
import { ModeQuickActions } from '@/components/home/mode-quick-actions';
import { JOURNEY_ACTIONS } from '@/components/home/journey-actions';
import { hasSection } from '@/components/shell/sections';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { JOURNEY_MODES } from '@/lib/journey/modes';
import { useTerminalParam } from './use-terminal-filter';

export interface AirportFlightToolsProps {
  slug: string;
  /** The airport's short name, for headings. */
  name: string;
  /** False when the demo provider has no board for this airport: the flight tools are left out. */
  hasFlights: boolean;
}

/**
 * The scoped tools of an airport overview below the notices: journey modes with their quick
 * actions and a board preview, narrowed to the terminal in the URL (`?t=`) at KLIA. The flight
 * search is `AirportFlightSearch`, above the notices.
 *
 * No `<Suspense>` (round 2): the terminal comes from `useTerminalParam`, so this tree hydrates in
 * place and text typed into the search before hydration is kept (it used to be a fallback that
 * React replaced, losing the input).
 */
/**
 * The overview's flight search, on its own (round 6, review-3 9.1 item 7): it comes before the
 * notices, so on a phone it is on the first screen instead of below a long notice (it was at
 * 2,236 px). Renders nothing for an airport without a demonstration board.
 */
export function AirportFlightSearch({ slug, name, hasFlights }: AirportFlightToolsProps) {
  const t = useT();
  const terminal = useTerminalParam(slug);
  if (!hasFlights) return null;
  return (
    <section aria-labelledby="airport-search-title">
      <h2 id="airport-search-title" className="type-title-lg mb-3 text-ink">
        {t('airportPage.searchTitle', { airport: name })}
      </h2>
      <FlightSearchBox id="flight-search" airport={slug} terminal={terminal} />
    </section>
  );
}

export function AirportFlightTools({ slug, name, hasFlights }: AirportFlightToolsProps) {
  const t = useT();
  const terminal = useTerminalParam(slug);
  const availability = useSectionAvailability();
  // Round 4 (re-review 6.1.8): a directory-only airport (Lawas) has no task behind any journey
  // mode, so the switcher is left out instead of offering four modes with nothing behind them.
  const hasActions = JOURNEY_MODES.some((mode) => JOURNEY_ACTIONS[mode].some((action) => hasSection(availability, slug, action.section)));
  if (!hasFlights && !hasActions) return null;
  return (
    <div className="flex flex-col gap-10">
      {hasActions ? (
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
      ) : null}

      {hasFlights ? (
        <DemoMarkedList>
          <BoardPreview airport={slug} terminal={terminal} rows={6} headingLevel={2} />
        </DemoMarkedList>
      ) : null}
    </div>
  );
}
