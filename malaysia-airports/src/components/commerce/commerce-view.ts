/**
 * Client-safe view model and pure logic for the shop and dine pages: the localised outlet view
 * the server builds, filters and their URL form, text search, sorting, and the schematic
 * "near my gate" proximity. Nothing here reads the clock, storage or the content layer.
 */
import type { Hours, TerminalId, Zone } from '@/content/types';
import { isOpenAt } from '@/lib/time';

export const OUTLET_KINDS = ['dine', 'shop', 'service'] as const;
export type OutletKind = (typeof OUTLET_KINDS)[number];
export type HalalStatus = 'certified' | 'pork-free' | 'non-halal';
export type PriceBand = 1 | 2 | 3 | 4;
export type Building = 'main' | 'satellite';

/** Opening hours, already localised. `daily` and `24h` can answer "open now"; `text` cannot. */
export type HoursView =
  | { kind: '24h'; note?: string }
  | { kind: 'daily'; open: string; close: string; note?: string }
  | { kind: 'text'; text: string };

/** Where an outlet is, as far as its location note says (used only for gate proximity). */
export interface OutletPlace {
  /** Gate letters the note names: "near gates C1 and C2" gives `['C']`. */
  gates: string[];
  building?: Building;
  /** True for international departures only, false for domestic only, undefined when not said. */
  international?: boolean;
}

/** One outlet, localised on the server and passed to Client Components. */
export interface OutletView {
  id: string;
  slug: string;
  /** Locale-free link to the outlet page. */
  href: string;
  name: string;
  kind: OutletKind;
  /** Stable key of the category (`duty-free`), for filters and the URL. */
  categoryKey: string;
  categoryLabel: string;
  cuisine?: string;
  terminal: TerminalId;
  terminalLabel: string;
  zone: Zone;
  levelName?: string;
  locationNote?: string;
  hours?: HoursView;
  priceBand?: PriceBand;
  halal?: HalalStatus;
  description?: string;
  /** Official when an authoritative source backs it, estimated when only news or guides do. */
  provenance: 'official' | 'estimated';
  asOf?: string;
  sourceIds: string[];
  mapHref?: string;
  place: OutletPlace;
  /** Normalised text the search matches against. */
  searchText: string;
}

/* -------------------------------------------------------------------------------------------
 * Gate areas (schematic). Only areas a source supports are listed:
 *  - KLIA Terminal 1: A and B are domestic gates and G and H international gates in the Contact
 *    Pier of the Main Terminal Building; C gates are in the Satellite Building (guide notes
 *    `kul-t1-gates-a-b-domestic`, `kul-t1-gates-g-h-contact-pier`, `kul-t1-gates-c-satellite`).
 *  - KLIA Terminal 2: gates L and P/Q are international departures (lounge listing for the
 *    Travel Club Lounge). Other Terminal 2 gates fall back to terminal-level proximity.
 * ---------------------------------------------------------------------------------------- */

export interface GateArea {
  id: string;
  airport: string;
  terminal: TerminalId;
  letters: string[];
  building?: Building;
  international: boolean;
}

export const GATE_AREAS: readonly GateArea[] = [
  { id: 'kul-t1-ab', airport: 'kul', terminal: 'T1', letters: ['A', 'B'], building: 'main', international: false },
  { id: 'kul-t1-gh', airport: 'kul', terminal: 'T1', letters: ['G', 'H'], building: 'main', international: true },
  { id: 'kul-t1-c', airport: 'kul', terminal: 'T1', letters: ['C'], building: 'satellite', international: true },
  { id: 'kul-t2-lpq', airport: 'kul', terminal: 'T2', letters: ['L', 'P', 'Q'], international: true },
];

export function gateAreasFor(airport: string): GateArea[] {
  return GATE_AREAS.filter((area) => area.airport === airport);
}

/** The letter of a gate (`C12` gives `C`), or undefined for numbered gates. */
export function gateLetter(gate: string): string | undefined {
  const match = /^([A-Z])/i.exec(gate.trim());
  return match ? match[1].toUpperCase() : undefined;
}

export function gateAreaFor(airport: string, terminal: TerminalId, letter: string | undefined): GateArea | undefined {
  if (!letter) return undefined;
  return GATE_AREAS.find((area) => area.airport === airport && area.terminal === terminal && area.letters.includes(letter));
}

/** What we know about the passenger's gate. */
export interface GateContext {
  terminal: TerminalId;
  /** The gate itself (`C12`) when it comes from a flight; undefined for a chosen area. */
  gate?: string;
  letter?: string;
  /** Gate letters the context covers: the gate's own letter, or every letter of a chosen area. */
  letters: string[];
  building?: Building;
  international?: boolean;
  /** The area id when it was chosen from the list. */
  areaId?: string;
}

export function contextForArea(area: GateArea): GateContext {
  return { terminal: area.terminal, letters: area.letters, building: area.building, international: area.international, areaId: area.id };
}

export function contextForGate(airport: string, terminal: TerminalId, gate: string, international?: boolean): GateContext {
  const letter = gateLetter(gate);
  const area = gateAreaFor(airport, terminal, letter);
  return {
    terminal,
    gate,
    letter,
    letters: letter ? [letter] : [],
    building: area?.building,
    international: area?.international ?? international,
  };
}

/**
 * Read what a location note says about the place, in English (the content's base language).
 * Ambiguous notes ("one source says the Satellite Building, another the Duty-Free Mall") give
 * no building.
 */
export function placeFromNote(note: string | undefined, airport: string, terminal: TerminalId): OutletPlace {
  if (!note) return { gates: [] };
  const letters = new Set<string>();
  for (const clause of note.matchAll(/\bgates?\b([^.;,(]*)/gi)) {
    for (const token of clause[1].matchAll(/\b([A-Z])\d{0,2}[A-Z]?\b/g)) letters.add(token[1]);
  }
  const gates = [...letters];
  const satellite = /satellite/i.test(note);
  const main = /main terminal|contact pier|duty-free mall/i.test(note);
  let building: Building | undefined = satellite && !main ? 'satellite' : main && !satellite ? 'main' : undefined;
  let international: boolean | undefined = /\binternational\b/i.test(note) ? true : /\bdomestic\b/i.test(note) ? false : undefined;
  const areas = gates.map((letter) => gateAreaFor(airport, terminal, letter)).filter((area): area is GateArea => area !== undefined);
  if (areas.length > 0 && areas.length === gates.length) {
    const buildings = new Set(areas.map((area) => area.building));
    const sides = new Set(areas.map((area) => area.international));
    if (!building && buildings.size === 1) building = areas[0].building;
    if (international === undefined && sides.size === 1) international = areas[0].international;
  }
  const place: OutletPlace = { gates };
  if (building) place.building = building;
  if (international !== undefined) place.international = international;
  return place;
}

export const PROXIMITY_KINDS = ['near', 'sameBuilding', 'onTheWay', 'sameTerminal', 'otherBuilding', 'landside', 'unknown', 'otherSide', 'otherTerminal'] as const;
export type ProximityKind = (typeof PROXIMITY_KINDS)[number];

/** Lower is closer. Groups are shown in this order. */
export const PROXIMITY_RANK: Readonly<Record<ProximityKind, number>> = Object.fromEntries(
  PROXIMITY_KINDS.map((kind, index) => [kind, index]),
) as Record<ProximityKind, number>;

/**
 * Schematic proximity of an outlet to the passenger's gate. An estimate from location notes and
 * the gate areas above, never a walking distance.
 */
export function gateProximity(outlet: Pick<OutletView, 'terminal' | 'zone' | 'place'>, gate: GateContext): ProximityKind {
  if (outlet.terminal !== gate.terminal) return 'otherTerminal';
  if (outlet.zone === 'landside') return 'landside';
  if (outlet.zone === 'unknown') return 'unknown';
  const { place } = outlet;
  if (place.international !== undefined && gate.international !== undefined && place.international !== gate.international) return 'otherSide';
  if (gate.letters.some((letter) => place.gates.includes(letter))) return 'near';
  if (place.building && gate.building) {
    if (place.building === gate.building) return 'sameBuilding';
    // Every Satellite Building departure starts in the Main Terminal Building (the Aerotrain).
    if (place.building === 'main' && gate.building === 'satellite') return 'onTheWay';
    return 'otherBuilding';
  }
  return 'sameTerminal';
}

/* -------------------------------------------------------------------------------------------
 * Filters, search and sorting
 * ---------------------------------------------------------------------------------------- */

export const OUTLET_SORTS = ['suggested', 'name', 'gate'] as const;
export type OutletSort = (typeof OUTLET_SORTS)[number];

export interface OutletFilters {
  query: string;
  kind?: OutletKind;
  categories: string[];
  cuisines: string[];
  terminal?: TerminalId;
  zone?: 'landside' | 'airside';
  halal: boolean;
  openNow: boolean;
  prices: PriceBand[];
  /** Chosen sort; undefined means the default (by gate when a gate is set, else suggested). */
  sort?: OutletSort;
  /** A gate area id (`kul-t1-c`) or a gate from a saved flight (`T1-C12`). */
  gate?: string;
}

export const EMPTY_OUTLET_FILTERS: OutletFilters = { query: '', categories: [], cuisines: [], halal: false, openNow: false, prices: [] };

/** Number of active filters, not counting the query, sort or gate. */
export function activeFilterCount(filters: OutletFilters): number {
  return (
    (filters.kind ? 1 : 0) +
    filters.categories.length +
    filters.cuisines.length +
    (filters.terminal ? 1 : 0) +
    (filters.zone ? 1 : 0) +
    (filters.halal ? 1 : 0) +
    (filters.openNow ? 1 : 0) +
    filters.prices.length
  );
}

export function effectiveSort(filters: OutletFilters, hasGate: boolean): OutletSort {
  if (filters.sort === 'gate' && !hasGate) return 'suggested';
  return filters.sort ?? (hasGate ? 'gate' : 'suggested');
}

/** Lower-case, accents removed, punctuation as spaces: "gateway@klia2" matches "gateway klia2". */
export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** A few everyday words people type for what the directory calls something else. */
const SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  coffee: ['cafe', 'kafe'],
  kopi: ['cafe', 'kafe'],
  food: ['dine', 'cafe', 'restaurant', 'makanan'],
  makan: ['dine', 'makanan', 'cafe'],
  eat: ['dine', 'cafe', 'restaurant'],
  makeup: ['beauty', 'kecantikan'],
  cosmetics: ['beauty', 'kecantikan'],
  perfume: ['beauty', 'duty free'],
  alcohol: ['liquor'],
  wine: ['liquor'],
  snacks: ['convenience', 'chocolate'],
  clothes: ['fashion', 'fesyen'],
  batik: ['fashion'],
  dutyfree: ['duty free'],
  mall: ['shopping mall', 'duty free mall'],
};

export function matchesQuery(searchText: string, query: string): boolean {
  const tokens = normalise(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((token) => searchText.includes(token) || (SYNONYMS[token] ?? []).some((alt) => searchText.includes(alt)));
}

/** Hours an outlet publishes in a form that can answer "open now". */
export function hasMachineHours(hours: HoursView | undefined): boolean {
  return hours !== undefined && hours.kind !== 'text';
}

/** True or false when the hours can tell, undefined when they cannot (prose or none). */
export function isOutletOpen(hours: HoursView | undefined, now: number | null): boolean | undefined {
  if (!hours || hours.kind === 'text' || now === null) return undefined;
  const rule: Hours = hours.kind === '24h' ? { kind: '24h' } : { kind: 'daily', open: hours.open, close: hours.close };
  return isOpenAt(rule, now);
}

export function filterOutlets(items: readonly OutletView[], filters: OutletFilters, now: number | null): OutletView[] {
  return items.filter((item) => {
    if (filters.kind && item.kind !== filters.kind) return false;
    if (filters.categories.length > 0 && !filters.categories.includes(item.categoryKey)) return false;
    if (filters.cuisines.length > 0 && (!item.cuisine || !filters.cuisines.includes(item.cuisine))) return false;
    if (filters.terminal && item.terminal !== filters.terminal) return false;
    if (filters.zone && item.zone !== filters.zone && item.zone !== 'both') return false;
    if (filters.halal && item.halal !== 'certified') return false;
    if (filters.prices.length > 0 && (item.priceBand === undefined || !filters.prices.includes(item.priceBand))) return false;
    if (filters.openNow && isOutletOpen(item.hours, now) !== true) return false;
    return matchesQuery(item.searchText, filters.query);
  });
}

/** How much an outlet publishes: used to put the most useful records first. */
export function completeness(item: OutletView): number {
  return (
    (item.locationNote ? 2 : 0) +
    (item.zone !== 'unknown' ? 1 : 0) +
    (item.levelName ? 1 : 0) +
    (item.hours ? 2 : 0) +
    (item.halal ? 1 : 0) +
    (item.priceBand ? 1 : 0) +
    (item.provenance === 'official' ? 1 : 0)
  );
}

function nameMatch(item: OutletView, query: string): number {
  const q = normalise(query);
  if (!q) return 0;
  const name = normalise(item.name);
  if (name === q) return 3;
  if (name.startsWith(q)) return 2;
  return name.includes(q) ? 1 : 0;
}

export function sortOutlets(items: readonly OutletView[], sort: OutletSort, options: { query?: string; gate?: GateContext; lang?: string } = {}): OutletView[] {
  const byName = (a: OutletView, b: OutletView) => a.name.localeCompare(b.name, options.lang) || a.terminal.localeCompare(b.terminal);
  const suggested = (a: OutletView, b: OutletView) =>
    nameMatch(b, options.query ?? '') - nameMatch(a, options.query ?? '') || completeness(b) - completeness(a) || byName(a, b);
  const sorted = [...items];
  if (sort === 'name') return sorted.sort(byName);
  if (sort === 'gate' && options.gate) {
    const gate = options.gate;
    return sorted.sort((a, b) => PROXIMITY_RANK[gateProximity(a, gate)] - PROXIMITY_RANK[gateProximity(b, gate)] || suggested(a, b));
  }
  return sorted.sort(suggested);
}

/**
 * Which filters can return anything with the data we hold (C-05). A filter that cannot is not
 * offered: "Open now" needs machine-readable hours, "Halal certified" a published certification,
 * a side of security at least one outlet placed there, price at least one price band.
 */
export interface FilterAvailability {
  openNow: boolean;
  halal: boolean;
  landside: boolean;
  airside: boolean;
  price: boolean;
}

export function filterAvailability(items: readonly OutletView[]): FilterAvailability {
  return {
    openNow: items.some((item) => hasMachineHours(item.hours)),
    halal: items.some((item) => item.halal === 'certified'),
    landside: items.some((item) => item.zone === 'landside' || item.zone === 'both'),
    airside: items.some((item) => item.zone === 'airside' || item.zone === 'both'),
    price: items.some((item) => item.priceBand !== undefined),
  };
}

/** A filter that was asked for (in a link) but cannot return anything with current data. */
export type UnavailableFilter = 'openNow' | 'halal' | 'landside' | 'airside' | 'price';

/**
 * Remove the filters that cannot return a result, and say which were removed. A link from the
 * home page with `?filters=open-now` then shows every outlet and the reason, never "0 of 8".
 */
export function withoutUnavailable(filters: OutletFilters, available: FilterAvailability): { filters: OutletFilters; dropped: UnavailableFilter[] } {
  const dropped: UnavailableFilter[] = [];
  const next: OutletFilters = { ...filters };
  if (next.openNow && !available.openNow) {
    next.openNow = false;
    dropped.push('openNow');
  }
  if (next.halal && !available.halal) {
    next.halal = false;
    dropped.push('halal');
  }
  if (next.zone && !available[next.zone]) {
    dropped.push(next.zone);
    delete next.zone;
  }
  if (next.prices.length > 0 && !available.price) {
    next.prices = [];
    dropped.push('price');
  }
  return { filters: next, dropped };
}

/** Coverage of each detail across the directory: what the filters can work with. */
export function coverage(items: readonly OutletView[]) {
  return {
    total: items.length,
    location: items.filter((item) => item.locationNote !== undefined || item.levelName !== undefined).length,
    hours: items.filter((item) => hasMachineHours(item.hours)).length,
    halal: items.filter((item) => item.halal !== undefined).length,
    price: items.filter((item) => item.priceBand !== undefined).length,
  };
}

/* -------------------------------------------------------------------------------------------
 * URL form: ?q=&kind=&cat=&cuisine=&t=&area=&halal=1&open=1&price=&sort=&gate=
 * The home page's shop and dine strip links with ?filters=open-now,halal,landside,airside.
 * ---------------------------------------------------------------------------------------- */

const list = (value: string | null): string[] => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []);

export interface ParseOptions {
  categories: readonly string[];
  cuisines: readonly string[];
  terminals: readonly TerminalId[];
  gateIds: readonly string[];
}

export function parseOutletFilters(params: URLSearchParams, options: ParseOptions): OutletFilters {
  const legacy = list(params.get('filters'));
  const kind = params.get('kind');
  const terminal = params.get('t');
  const area = params.get('area') ?? (legacy.includes('landside') ? 'landside' : legacy.includes('airside') ? 'airside' : null);
  const sort = params.get('sort');
  const gate = params.get('gate');
  const filters: OutletFilters = {
    query: params.get('q') ?? '',
    categories: list(params.get('cat')).filter((item) => options.categories.includes(item)),
    cuisines: list(params.get('cuisine')).filter((item) => options.cuisines.includes(item)),
    halal: params.get('halal') === '1' || legacy.includes('halal'),
    openNow: params.get('open') === '1' || legacy.includes('open-now'),
    prices: list(params.get('price'))
      .map(Number)
      .filter((value): value is PriceBand => value === 1 || value === 2 || value === 3 || value === 4),
  };
  if (kind && (OUTLET_KINDS as readonly string[]).includes(kind)) filters.kind = kind as OutletKind;
  if (terminal && options.terminals.length > 1 && (options.terminals as readonly string[]).includes(terminal)) filters.terminal = terminal as TerminalId;
  if (area === 'landside' || area === 'airside') filters.zone = area;
  if (sort && (OUTLET_SORTS as readonly string[]).includes(sort)) filters.sort = sort as OutletSort;
  if (gate && (options.gateIds.includes(gate) || /^(T1|T2|MAIN)-[A-Z0-9]{1,4}$/.test(gate))) filters.gate = gate;
  return filters;
}

/** Write filters into a copy of the current query, keeping parameters that belong to others. */
export function writeOutletFilters(current: URLSearchParams, filters: OutletFilters): URLSearchParams {
  const params = new URLSearchParams(current);
  for (const key of ['q', 'kind', 'cat', 'cuisine', 't', 'area', 'halal', 'open', 'price', 'sort', 'gate', 'filters']) params.delete(key);
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.kind) params.set('kind', filters.kind);
  if (filters.categories.length > 0) params.set('cat', filters.categories.join(','));
  if (filters.cuisines.length > 0) params.set('cuisine', filters.cuisines.join(','));
  if (filters.terminal) params.set('t', filters.terminal);
  if (filters.zone) params.set('area', filters.zone);
  if (filters.halal) params.set('halal', '1');
  if (filters.openNow) params.set('open', '1');
  if (filters.prices.length > 0) params.set('price', filters.prices.join(','));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.gate) params.set('gate', filters.gate);
  return params;
}

/** Resolve the `gate` filter into a context: an area id, or `T1-C12` from a saved flight. */
export function gateContextFor(airport: string, value: string | undefined): GateContext | undefined {
  if (!value) return undefined;
  const area = GATE_AREAS.find((item) => item.airport === airport && item.id === value);
  if (area) return contextForArea(area);
  const match = /^(T1|T2|MAIN)-([A-Z0-9]{1,4})$/.exec(value);
  if (!match) return undefined;
  return contextForGate(airport, match[1] as TerminalId, match[2]);
}

/** Related outlets for an outlet page: same terminal and kind first, then same terminal, then the rest. */
export function relatedOutlets(items: readonly OutletView[], current: OutletView, limit = 3): OutletView[] {
  const score = (item: OutletView) =>
    (item.terminal === current.terminal ? 4 : 0) + (item.kind === current.kind ? 2 : 0) + (item.categoryKey === current.categoryKey ? 1 : 0);
  return items
    .filter((item) => item.id !== current.id)
    .map((item, index) => ({ item, index, score: score(item) }))
    .sort((a, b) => b.score - a.score || completeness(b.item) - completeness(a.item) || a.index - b.index)
    .slice(0, limit)
    .map(({ item }) => item);
}

/** Stable key for a free-form category: "Duty free" gives `duty-free`. */
export function categoryKey(category: string): string {
  return normalise(category).replace(/ /g, '-');
}
