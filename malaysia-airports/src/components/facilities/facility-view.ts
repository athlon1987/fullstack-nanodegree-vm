/**
 * Facilities directory: the serialisable view of a facility (built on the server, localised) and
 * the pure filtering logic. Client-safe: type imports only.
 */
import type { FacilityCategory, Provenance, TerminalId, Zone } from '@/content/types';

/** Opening hours with the prose already in the page language. */
export type HoursView =
  | { kind: '24h'; note?: string }
  | { kind: 'daily'; open: string; close: string; note?: string }
  | { kind: 'text'; text: string };

/** One facility, localised for the page and ready to cross the server and client boundary. */
export interface FacilityView {
  id: string;
  name: string;
  category: FacilityCategory;
  categoryLabel: string;
  /** Icon key for `Icon` (a domain key such as `prayer-room`). */
  icon: string;
  terminal: TerminalId;
  terminalLabel: string;
  zone: Zone;
  /** Published level name, when the level is published. */
  levelName?: string;
  locationNote?: string;
  hours?: HoursView;
  description: string;
  access?: string;
  operator?: string;
  /** Only set when a source says so. */
  accessible?: boolean;
  bookingUrl?: string;
  provenance: Provenance;
  asOf?: string;
  sourceIds: string[];
  /** Locale-free href of the point on a schematic map (`/kul/map?t=T1&poi=l5-calm-room`). */
  mapHref?: string;
}

/**
 * Categories travellers expect at any airport, mirroring the map's filters (C-07). When none is
 * published for an airport the directory shows a "not published" card for it, with the
 * information-counter route, rather than leaving a parent to search for a nursing room.
 */
export const EXPECTED_FACILITY_CATEGORIES: readonly FacilityCategory[] = ['nursing-room', 'accessible-toilet', 'toilet', 'prayer-room'];

/** Expected categories with no published facility, in the order above. */
export function missingExpectedCategories(items: readonly Pick<FacilityView, 'category'>[]): FacilityCategory[] {
  const present = new Set(items.map((item) => item.category));
  return EXPECTED_FACILITY_CATEGORIES.filter((category) => !present.has(category));
}

/** Categories that count as accessibility and assistance services in the directory filter. */
export const ASSISTANCE_CATEGORIES: readonly FacilityCategory[] = ['assistance', 'calm-room', 'accessible-toilet', 'porter'];

/** Directory filter state. Empty arrays and undefined mean "no filter". */
export interface FacilityFilters {
  categories: FacilityCategory[];
  terminal?: TerminalId;
  /** `landside` keeps items before security (and `both`); `airside` likewise. */
  area?: 'landside' | 'airside';
  accessible: boolean;
}

export const EMPTY_FACILITY_FILTERS: FacilityFilters = { categories: [], accessible: false };

/** Whether a facility counts as accessible or an assistance service. */
export function isAccessibilityFacility(facility: Pick<FacilityView, 'category' | 'accessible'>): boolean {
  return facility.accessible === true || ASSISTANCE_CATEGORIES.includes(facility.category);
}

/** Apply the directory filters. Order is preserved. */
export function filterFacilities<T extends FacilityView>(items: readonly T[], filters: FacilityFilters): T[] {
  return items.filter((item) => {
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) return false;
    if (filters.terminal && item.terminal !== filters.terminal) return false;
    if (filters.area && item.zone !== filters.area && item.zone !== 'both') return false;
    if (filters.accessible && !isAccessibilityFacility(item)) return false;
    return true;
  });
}

/** Parse the directory filters from the URL (`?cat=lounge,prayer-room&t=T1&area=airside&access=1`). */
export function parseFacilityFilters(
  params: { get(name: string): string | null },
  known: { categories: readonly FacilityCategory[]; terminals: readonly TerminalId[] },
): FacilityFilters {
  const categories = (params.get('cat') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is FacilityCategory => (known.categories as readonly string[]).includes(value));
  const t = params.get('t');
  const area = params.get('area');
  return {
    categories,
    terminal: known.terminals.length > 1 ? known.terminals.find((id) => id === t) : undefined,
    area: area === 'landside' || area === 'airside' ? area : undefined,
    accessible: params.get('access') === '1',
  };
}

/** Write the directory filters into a query, leaving unrelated parameters alone. */
export function writeFacilityFilters(query: URLSearchParams, filters: FacilityFilters): URLSearchParams {
  const next = new URLSearchParams(query);
  if (filters.categories.length > 0) next.set('cat', filters.categories.join(','));
  else next.delete('cat');
  if (filters.terminal) next.set('t', filters.terminal);
  else next.delete('t');
  if (filters.area) next.set('area', filters.area);
  else next.delete('area');
  if (filters.accessible) next.set('access', '1');
  else next.delete('access');
  return next;
}

/** Number of active filters, for the "Clear filters" affordance. */
export function activeFilterCount(filters: FacilityFilters): number {
  return filters.categories.length + (filters.terminal ? 1 : 0) + (filters.area ? 1 : 0) + (filters.accessible ? 1 : 0);
}
