import type { TKey } from '@/lib/i18n/translate';
import type { IconName } from '@/components/ui/icon';
import { hasSection, type AirportSectionId, type SectionAvailability } from '@/components/shell/sections';

/**
 * How much this product offers for an airport, worked out from the sections it actually has
 * (round 4, re-review 6.1.8), not from the registry's planned depth: Kuching and Langkawi are
 * planned as "full" but have only an overview and a board today.
 */
export type AirportDepthLabel = 'guide' | 'flights' | 'guide-only' | 'directory';

/** Sections that count as airport guidance beyond the overview and the board. */
const GUIDE_SECTIONS: readonly AirportSectionId[] = ['map', 'facilities', 'transport', 'parking', 'shop-dine', 'lounges', 'transit'];

export function airportDepthLabel(availability: SectionAvailability, slug: string): AirportDepthLabel {
  const flights = hasSection(availability, slug, 'flights');
  const guide = GUIDE_SECTIONS.some((section) => hasSection(availability, slug, section));
  return flights ? (guide ? 'guide' : 'flights') : guide ? 'guide-only' : 'directory';
}

export const DEPTH_ORDER: readonly AirportDepthLabel[] = ['guide', 'flights', 'guide-only', 'directory'];

export const DEPTH_COPY: Record<AirportDepthLabel, { label: TKey; hint: TKey; icon: IconName }> = {
  guide: { label: 'flightPages.depth.guide', hint: 'flightPages.depth.guideHint', icon: 'map' },
  flights: { label: 'flightPages.depth.flights', hint: 'flightPages.depth.flightsHint', icon: 'plane-takeoff' },
  'guide-only': { label: 'flightPages.depth.guideOnly', hint: 'flightPages.depth.guideOnlyHint', icon: 'map' },
  directory: { label: 'flightPages.depth.directory', hint: 'flightPages.depth.directoryHint', icon: 'circle-dashed' },
};
