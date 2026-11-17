/**
 * Pure logic for the terminal map: the serialisable view the server hands to the client, the
 * category filters, search, the pan and zoom maths, label placement and the turn-by-turn steps
 * built from a `shortestPath` result. No React, no clock, no content-layer runtime imports.
 */
import type { MapEdge, MapModel, MapNode, MapPoiKind, MapShape, MapZone, Provenance, TerminalId, Zone } from '@/content/types';
import { edgeMinutes, type PathResult, type WalkProfile } from '@/lib/map';
import type { TKey } from '@/lib/i18n/translate';
import type { FacilityView } from '@/components/facilities/facility-view';

/* -------------------------------------------------------------------------------------------
 * View model
 * ---------------------------------------------------------------------------------------- */

/** Which side of security a place is on, as far as the map or the facility record says. */
export type Side = 'landside' | 'airside' | 'both' | 'checkpoint' | 'unknown';

/** How a zone is drawn: public area, passenger-only area, or kerbs and links. */
export type ZoneTone = 'landside' | 'airside' | 'link';

export interface LevelView {
  id: string;
  /** Full name: "Level 5: departures". */
  name: string;
  /** Short label for the switcher: "Level 5". */
  label: string;
  /** Second line for the switcher: "departures". */
  hint?: string;
  order: number;
  note?: string;
}

export interface ZoneView {
  id: string;
  level: string;
  name: string;
  tone: ZoneTone;
  shape: MapShape;
}

export interface PoiView {
  id: string;
  level: string;
  x: number;
  y: number;
  /** Walk-graph node used for routing. */
  node: string;
  name: string;
  /** The name without its bracketed qualifier, for labels on the map. */
  short: string;
  kind: MapPoiKind;
  kindLabel: string;
  filter: MapFilterId;
  zoneName?: string;
  side: Side;
  /** Provenance of the point's existence in this part of the terminal (`demo`: illustrative). */
  provenance: Provenance;
  sourceIds: string[];
  facility?: FacilityView;
}

/** Everything the client needs to draw and route one schematic map, already localised. */
export interface MapView {
  id: string;
  airport: string;
  terminal: TerminalId;
  terminalLabel: string;
  name: string;
  note: string;
  /** Highest first, as the switcher shows them. */
  levels: LevelView[];
  zones: ZoneView[];
  pois: PoiView[];
  nodes: MapNode[];
  edges: Omit<MapEdge, 'note'>[];
  /** Localised edge notes keyed by `edgeKey(from, to)`. */
  edgeNotes: Record<string, string>;
  sourceIds: string[];
  asOf?: string;
}

export function edgeKey(from: string, to: string): string {
  return from < to ? `${from}>${to}` : `${to}>${from}`;
}

/** "Check-in Row B (Malaysia Airlines domestic Economy)" becomes "Check-in Row B". */
export function shortName(name: string): string {
  const cut = name.indexOf(' (');
  return cut > 0 ? name.slice(0, cut) : name;
}

/** "Level 5: departures" gives `{ label: 'Level 5', hint: 'departures' }`. */
export function splitLevelName(name: string): { label: string; hint?: string } {
  const cut = name.indexOf(': ');
  if (cut < 0) return { label: name };
  return { label: name.slice(0, cut), hint: name.slice(cut + 2) };
}

export function zoneTone(kind: MapZone['kind']): ZoneTone {
  if (kind === 'airside' || kind === 'pier' || kind === 'satellite') return 'airside';
  if (kind === 'landside') return 'landside';
  return 'link';
}

/**
 * The side of security for a point. Checkpoints are their own answer; a referenced facility's
 * published zone wins over the schematic zone; otherwise the drawn zone decides.
 */
export function sideFor(kind: MapPoiKind, zoneKind: MapZone['kind'] | undefined, facilityZone?: Zone): Side {
  if (kind === 'security' || kind === 'immigration' || kind === 'customs') return 'checkpoint';
  if (facilityZone && facilityZone !== 'unknown') return facilityZone;
  if (!zoneKind) return 'unknown';
  return zoneTone(zoneKind) === 'airside' ? 'airside' : 'landside';
}

/** A `MapModel` for `shortestPath`, rebuilt from the view (only the graph matters for routing). */
export function routingModel(view: MapView): MapModel {
  return {
    id: view.id,
    airport: view.airport,
    terminal: view.terminal,
    name: { en: view.name },
    schematic: true,
    note: { en: view.note },
    levels: view.levels.map((level) => ({ id: level.id, name: { en: level.name }, order: level.order })),
    zones: [],
    pois: view.pois.map((poi) => ({ id: poi.id, level: poi.level, x: poi.x, y: poi.y, name: { en: poi.name }, kind: poi.kind, node: poi.node, provenance: poi.provenance })),
    nodes: view.nodes,
    edges: view.edges,
    sources: view.sourceIds,
  };
}

/* -------------------------------------------------------------------------------------------
 * Category filters
 * ---------------------------------------------------------------------------------------- */

export type MapFilterId =
  | 'prayer'
  | 'toilets'
  | 'accessible-toilets'
  | 'nursing'
  | 'food'
  | 'shops'
  | 'lounges'
  | 'check-in'
  | 'baggage'
  | 'transport'
  | 'gates'
  | 'information'
  | 'other';

export interface MapFilter {
  id: MapFilterId;
  kinds: readonly MapPoiKind[];
  icon: string;
  labelKey: TKey;
}

/** The map's category filters, in display order. `other` collects every kind not listed. */
export const MAP_FILTERS: readonly MapFilter[] = [
  { id: 'gates', kinds: ['gate'], icon: 'gate', labelKey: 'mapPages.filters.groups.gates' },
  { id: 'check-in', kinds: ['check-in'], icon: 'check-in', labelKey: 'mapPages.filters.groups.checkIn' },
  { id: 'prayer', kinds: ['prayer-room'], icon: 'prayer-room', labelKey: 'mapPages.filters.groups.prayer' },
  { id: 'toilets', kinds: ['toilet'], icon: 'toilet', labelKey: 'mapPages.filters.groups.toilets' },
  { id: 'accessible-toilets', kinds: ['accessible-toilet'], icon: 'accessible-toilet', labelKey: 'mapPages.filters.groups.accessibleToilets' },
  { id: 'nursing', kinds: ['nursing-room'], icon: 'nursing-room', labelKey: 'mapPages.filters.groups.nursing' },
  { id: 'food', kinds: ['dine'], icon: 'dine', labelKey: 'mapPages.filters.groups.food' },
  { id: 'shops', kinds: ['shop'], icon: 'shop', labelKey: 'mapPages.filters.groups.shops' },
  { id: 'lounges', kinds: ['lounge', 'hotel', 'rest', 'shower'], icon: 'lounge', labelKey: 'mapPages.filters.groups.lounges' },
  { id: 'baggage', kinds: ['baggage-reclaim', 'baggage'], icon: 'baggage-reclaim', labelKey: 'mapPages.filters.groups.baggage' },
  { id: 'transport', kinds: ['train', 'bus', 'taxi', 'parking', 'shuttle'], icon: 'train', labelKey: 'mapPages.filters.groups.transport' },
  { id: 'information', kinds: ['information', 'lost-property', 'assistance'], icon: 'information', labelKey: 'mapPages.filters.groups.information' },
  { id: 'other', kinds: [], icon: 'map-pin', labelKey: 'mapPages.filters.groups.other' },
];

const FILTER_BY_KIND = new Map<MapPoiKind, MapFilterId>(MAP_FILTERS.flatMap((filter) => filter.kinds.map((kind) => [kind, filter.id] as const)));

export function filterForKind(kind: MapPoiKind): MapFilterId {
  return FILTER_BY_KIND.get(kind) ?? 'other';
}

export function isMapFilterId(value: string): value is MapFilterId {
  return MAP_FILTERS.some((filter) => filter.id === value);
}

/** Whether a point passes the active filters (none active means everything passes). */
export function passesFilters(poi: Pick<PoiView, 'filter'>, active: readonly MapFilterId[]): boolean {
  return active.length === 0 || active.includes(poi.filter);
}

/** Number of points per filter across all levels. */
export function filterCounts(pois: readonly Pick<PoiView, 'filter'>[]): Record<MapFilterId, number> {
  const counts = Object.fromEntries(MAP_FILTERS.map((filter) => [filter.id, 0])) as Record<MapFilterId, number>;
  for (const poi of pois) counts[poi.filter] += 1;
  return counts;
}

/* -------------------------------------------------------------------------------------------
 * Search
 * ---------------------------------------------------------------------------------------- */

/** Everyday words people type, mapped to words that appear in names and labels. */
const SYNONYMS: Record<string, readonly string[]> = {
  toilet: ['loo', 'restroom', 'washroom', 'wc', 'bathroom', 'lavatory'],
  tandas: ['loo', 'restroom', 'washroom', 'wc', 'bathroom'],
  prayer: ['pray', 'mosque', 'musolla', 'musalla', 'solat', 'masjid'],
  surau: ['pray', 'mosque', 'musolla', 'musalla', 'solat', 'masjid'],
  lounge: ['vip', 'business', 'premium'],
  gate: ['gates', 'boarding', 'pier'],
  check: ['checkin', 'counter', 'kaunter', 'bag drop', 'bagdrop'],
  baggage: ['luggage', 'bags', 'belt', 'carousel', 'bagasi'],
  train: ['aerotrain', 'rail', 'tren', 'skytrain'],
  bus: ['coach', 'bas'],
  information: ['info', 'help', 'desk', 'pertanyaan'],
  lift: ['elevator', 'lif'],
  hotel: ['sleep', 'nap', 'transit hotel'],
  atm: ['cash', 'money', 'bank'],
};

export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Every searchable word for a point: name, type, filter label, level, zone and facility type. */
export function searchText(parts: readonly (string | undefined)[]): string {
  return normalise(parts.filter(Boolean).join(' '));
}

function expandToken(token: string): string[] {
  const out = [token];
  for (const [word, synonyms] of Object.entries(SYNONYMS)) {
    if (synonyms.some((synonym) => synonym === token || synonym.startsWith(token))) out.push(word);
  }
  return out;
}

/**
 * Score a point against a query: 0 means no match. Every word of the query must start a word
 * of the point's text (directly or through a synonym); matches at the start of the name score
 * highest.
 */
export function scoreMatch(query: string, name: string, haystack: string): number {
  const tokens = normalise(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return 0;
  const words = haystack.split(' ');
  const nameNorm = normalise(name);
  let score = 1;
  for (const token of tokens) {
    const options = expandToken(token);
    if (!options.some((option) => words.some((word) => word.startsWith(option)) || haystack.includes(` ${option}`) || haystack.startsWith(option))) return 0;
    if (nameNorm.startsWith(token)) score += 3;
    else if (nameNorm.split(' ').some((word) => word.startsWith(token))) score += 2;
  }
  return score;
}

/* -------------------------------------------------------------------------------------------
 * Pan and zoom
 * ---------------------------------------------------------------------------------------- */

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** `k` is the zoom factor over "fit the level"; `cx`, `cy` the centre in map units. */
export interface ViewState {
  k: number;
  cx: number;
  cy: number;
}

export interface FrameSize {
  width: number;
  height: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 6;
/** Server render and first paint assume the map's own aspect ratio. */
export const DEFAULT_FRAME: FrameSize = { width: 1000, height: 600 };

/** The drawn extent of a level: its zones and points, padded. */
export function levelBounds(view: Pick<MapView, 'zones' | 'pois'>, levelId: string, padding = 36): Bounds {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const zone of view.zones) {
    if (zone.level !== levelId) continue;
    if (zone.shape.type === 'rect') {
      xs.push(zone.shape.x, zone.shape.x + zone.shape.width);
      ys.push(zone.shape.y, zone.shape.y + zone.shape.height);
    } else {
      for (const [x, y] of zone.shape.points) {
        xs.push(x);
        ys.push(y);
      }
    }
  }
  for (const poi of view.pois) {
    if (poi.level !== levelId) continue;
    xs.push(poi.x);
    ys.push(poi.y);
  }
  if (xs.length === 0) return { minX: 0, minY: 0, maxX: 1000, maxY: 600 };
  return { minX: Math.min(...xs) - padding, minY: Math.min(...ys) - padding, maxX: Math.max(...xs) + padding, maxY: Math.max(...ys) + padding };
}

export function fitView(bounds: Bounds): ViewState {
  return { k: 1, cx: (bounds.minX + bounds.maxX) / 2, cy: (bounds.minY + bounds.maxY) / 2 };
}

/** Pixels per map unit at zoom 1. */
export function baseScale(bounds: Bounds, frame: FrameSize): number {
  return Math.min(frame.width / (bounds.maxX - bounds.minX), frame.height / (bounds.maxY - bounds.minY));
}

export function clampView(view: ViewState, bounds: Bounds): ViewState {
  const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.k));
  return {
    k,
    cx: Math.min(bounds.maxX, Math.max(bounds.minX, view.cx)),
    cy: Math.min(bounds.maxY, Math.max(bounds.minY, view.cy)),
  };
}

/** The SVG viewBox for a view, plus the pixels-per-unit scale. */
export function viewBoxFor(view: ViewState, bounds: Bounds, frame: FrameSize): { x: number; y: number; width: number; height: number; scale: number } {
  const scale = baseScale(bounds, frame) * view.k;
  const width = frame.width / scale;
  const height = frame.height / scale;
  return { x: view.cx - width / 2, y: view.cy - height / 2, width, height, scale };
}

/** Zoom by `factor`, keeping the map point under `anchor` (map units) where it is. */
export function zoomAround(view: ViewState, factor: number, anchor: { x: number; y: number }, bounds: Bounds): ViewState {
  const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.k * factor));
  const ratio = view.k / k;
  return clampView({ k, cx: anchor.x - (anchor.x - view.cx) * ratio, cy: anchor.y - (anchor.y - view.cy) * ratio }, bounds);
}

/** Move the view by a number of screen pixels. */
export function panByPixels(view: ViewState, dx: number, dy: number, scale: number, bounds: Bounds): ViewState {
  return clampView({ ...view, cx: view.cx + dx / scale, cy: view.cy + dy / scale }, bounds);
}

/* -------------------------------------------------------------------------------------------
 * Label placement (greedy, in screen pixels)
 * ---------------------------------------------------------------------------------------- */

export interface LabelCandidate {
  id: string;
  /** Marker centre on screen. */
  x: number;
  y: number;
  text: string;
  /** Higher places first. */
  priority: number;
}

export type LabelSide = 'right' | 'left' | 'below' | 'above';

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const overlaps = (a: Box, b: Box): boolean => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;

/**
 * Place as many labels as fit without overlapping each other, the markers or the frame edge.
 * Returns the chosen side for each placed label.
 */
export function placeLabels(
  candidates: readonly LabelCandidate[],
  frame: FrameSize,
  options: { radius: number; charWidth?: number; height?: number; gap?: number; margin?: number; reserved?: readonly Box[] },
): Map<string, LabelSide> {
  const { radius, charWidth = 6.9, height = 18, gap = 6, margin = 4 } = options;
  const obstacles: Box[] = [
    ...(options.reserved ?? []),
    ...candidates.map((c) => ({ x1: c.x - radius, y1: c.y - radius, x2: c.x + radius, y2: c.y + radius })),
  ];
  const placed = new Map<string, LabelSide>();
  const ordered = [...candidates].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  for (const c of ordered) {
    const width = c.text.length * charWidth + 4;
    const boxes: [LabelSide, Box][] = [
      ['right', { x1: c.x + radius + gap, y1: c.y - height / 2, x2: c.x + radius + gap + width, y2: c.y + height / 2 }],
      ['left', { x1: c.x - radius - gap - width, y1: c.y - height / 2, x2: c.x - radius - gap, y2: c.y + height / 2 }],
      ['below', { x1: c.x - width / 2, y1: c.y + radius + 2, x2: c.x + width / 2, y2: c.y + radius + 2 + height }],
      ['above', { x1: c.x - width / 2, y1: c.y - radius - 2 - height, x2: c.x + width / 2, y2: c.y - radius - 2 }],
    ];
    for (const [side, box] of boxes) {
      const inside = box.x1 >= margin && box.y1 >= margin && box.x2 <= frame.width - margin && box.y2 <= frame.height - margin;
      if (!inside) continue;
      const own = { x1: c.x - radius, y1: c.y - radius, x2: c.x + radius, y2: c.y + radius };
      if (obstacles.some((other) => !(other.x1 === own.x1 && other.y1 === own.y1) && overlaps(box, other))) continue;
      placed.set(c.id, side);
      obstacles.push(box);
      break;
    }
  }
  return placed;
}

/* -------------------------------------------------------------------------------------------
 * Route steps
 * ---------------------------------------------------------------------------------------- */

export type Conveyance = 'lift' | 'escalator' | 'stairs' | 'travelator' | 'train' | 'bus';

export interface RouteStep {
  key: string;
  kind: 'start' | 'walk' | 'through' | 'change-level' | 'ride' | 'arrive';
  conveyance?: Conveyance;
  direction?: 'up' | 'down';
  /** Level where the step starts. */
  level: string;
  /** Level where the step ends, when it changes level. */
  toLevel?: string;
  /** The named place the step reaches (or starts at, for `start`). */
  place?: string;
  /** For a walk that ends at an unnamed lift, escalator or stairs. */
  approach?: 'lift' | 'escalator' | 'stairs';
  /** Named places passed on the way (at most three). */
  via: string[];
  metres: number;
  minutes: Record<WalkProfile, number>;
  note?: string;
  /** Node ids covered, in order (for drawing the step). */
  nodes: string[];
}

export interface StepContext {
  /** Point names by walk-graph node id. */
  placeByNode: ReadonlyMap<string, string>;
  levelOrder: ReadonlyMap<string, number>;
  edgeNotes?: Readonly<Record<string, string>>;
}

const CONVEYANCES: readonly MapEdge['kind'][] = ['lift', 'escalator', 'stairs'];

function stepMinutes(edges: readonly MapEdge[]): Record<WalkProfile, number> {
  return {
    standard: edges.reduce((sum, edge) => sum + edgeMinutes(edge, 'standard'), 0),
    reduced: edges.reduce((sum, edge) => sum + edgeMinutes(edge, 'reduced'), 0),
  };
}

/** Whole minutes for a route at both walking profiles (rounded up, like `shortestPath`). */
export function routeMinutes(path: Pick<PathResult, 'legs'>): Record<WalkProfile, number> {
  const exact = stepMinutes(path.legs.map((leg) => leg.edge));
  const round = (value: number) => (value <= 0 ? 0 : Math.ceil(value - 1e-9));
  return { standard: round(exact.standard), reduced: round(exact.reduced) };
}

/**
 * Turn a `shortestPath` result into the written directions: a start, then walks merged per
 * level, level changes merged per lift or escalator run, rides, and the arrival.
 */
export function buildRouteSteps(path: PathResult, context: StepContext): RouteStep[] {
  const { placeByNode, levelOrder, edgeNotes = {} } = context;
  const first = path.nodes[0];
  const last = path.nodes[path.nodes.length - 1];
  const steps: RouteStep[] = [
    { key: 'start', kind: 'start', level: first.level, place: placeByNode.get(first.id), via: [], metres: 0, minutes: { standard: 0, reduced: 0 }, nodes: [first.id] },
  ];
  const legs = path.legs;
  let index = 0;
  while (index < legs.length) {
    const leg = legs[index];
    const kind = leg.edge.kind;
    const sameLevel = leg.from.level === leg.to.level;

    if (kind === 'walk' && sameLevel) {
      let end = index;
      while (end + 1 < legs.length && legs[end + 1].edge.kind === 'walk' && legs[end + 1].from.level === leg.from.level && legs[end + 1].to.level === leg.from.level) end += 1;
      const run = legs.slice(index, end + 1);
      const target = run[run.length - 1].to;
      const via = run
        .slice(0, -1)
        .map((item) => placeByNode.get(item.to.id))
        .filter((name): name is string => Boolean(name))
        .slice(0, 3);
      const next = legs[end + 1];
      const approach = !placeByNode.has(target.id) && next && CONVEYANCES.includes(next.edge.kind) ? (next.edge.kind as RouteStep['approach']) : undefined;
      steps.push({
        key: `walk-${index}`,
        kind: 'walk',
        level: leg.from.level,
        place: placeByNode.get(target.id),
        approach,
        via,
        metres: run.reduce((sum, item) => sum + item.edge.metres, 0),
        minutes: stepMinutes(run.map((item) => item.edge)),
        nodes: [leg.from.id, ...run.map((item) => item.to.id)],
      });
      index = end + 1;
      continue;
    }

    if (kind === 'walk') {
      steps.push({
        key: `through-${index}`,
        kind: 'through',
        level: leg.from.level,
        toLevel: leg.to.level,
        place: placeByNode.get(leg.to.id),
        via: [],
        metres: leg.edge.metres,
        minutes: stepMinutes([leg.edge]),
        nodes: [leg.from.id, leg.to.id],
      });
      index += 1;
      continue;
    }

    if (CONVEYANCES.includes(kind)) {
      let end = index;
      while (end + 1 < legs.length && legs[end + 1].edge.kind === kind) end += 1;
      const run = legs.slice(index, end + 1);
      const to = run[run.length - 1].to;
      const up = (levelOrder.get(to.level) ?? 0) > (levelOrder.get(leg.from.level) ?? 0);
      steps.push({
        key: `level-${index}`,
        kind: 'change-level',
        conveyance: kind as Conveyance,
        direction: up ? 'up' : 'down',
        level: leg.from.level,
        toLevel: to.level,
        place: placeByNode.get(to.id),
        via: [],
        metres: run.reduce((sum, item) => sum + item.edge.metres, 0),
        minutes: stepMinutes(run.map((item) => item.edge)),
        nodes: [leg.from.id, ...run.map((item) => item.to.id)],
      });
      index = end + 1;
      continue;
    }

    steps.push({
      key: `ride-${index}`,
      kind: 'ride',
      conveyance: kind as Conveyance,
      level: leg.from.level,
      toLevel: leg.to.level !== leg.from.level ? leg.to.level : undefined,
      place: placeByNode.get(leg.to.id),
      via: [],
      metres: leg.edge.metres,
      minutes: stepMinutes([leg.edge]),
      note: edgeNotes[edgeKey(leg.edge.from, leg.edge.to)],
      nodes: [leg.from.id, leg.to.id],
    });
    index += 1;
  }
  steps.push({ key: 'arrive', kind: 'arrive', level: last.level, place: placeByNode.get(last.id), via: [], metres: 0, minutes: { standard: 0, reduced: 0 }, nodes: [last.id] });
  return steps;
}
