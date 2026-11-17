/**
 * Server-only builders for the map and facilities pages: they read the content layer, pick the
 * page language and resolve sources, so Client Components receive small, serialisable props and
 * never import `@/content`.
 */
import {
  FACILITY_CATEGORY_META,
  facilityCategoryLabel,
  getSource,
  hasTranslation,
  isMultiTerminal,
  mapPoiKindLabel,
  pick,
  resolveSources,
  terminalLabel,
  type AirportContent,
  type Facility,
  type Hours,
  type Lang,
  type LocalizedText,
  type MapModel,
  type Source,
} from '@/content';
import type { FacilityView, HoursView } from '@/components/facilities/facility-view';
import { edgeKey, filterForKind, shortName, sideFor, splitLevelName, zoneTone, type MapView } from './map-logic';

const PASSENGER_SITE = 'https://airports.malaysiaairports.com.my/';

function hoursView(hours: Hours | undefined, lang: Lang): HoursView | undefined {
  if (!hours) return undefined;
  if (hours.kind === 'text') return { kind: 'text', text: pick(hours.text, lang) };
  const note = hours.note ? pick(hours.note, lang) : undefined;
  if (hours.kind === '24h') return note ? { kind: '24h', note } : { kind: '24h' };
  return note ? { kind: 'daily', open: hours.open, close: hours.close, note } : { kind: 'daily', open: hours.open, close: hours.close };
}

function optional(text: LocalizedText | undefined, lang: Lang): string | undefined {
  return text ? pick(text, lang) : undefined;
}

/** Locale-free link to a point on the airport's map, with the terminal filter on multi-terminal airports. */
export function mapPointHref(content: AirportContent, poiId: string): string | undefined {
  const map = content.maps.find((model) => model.pois.some((poi) => poi.id === poiId));
  if (!map) return undefined;
  const terminal = isMultiTerminal(content.airport) ? `t=${map.terminal}&` : '';
  return `/${content.airport.slug}/map?${terminal}poi=${encodeURIComponent(poiId)}`;
}

/** One facility for the directory or the map's details panel. */
export function facilityView(facility: Facility, content: AirportContent, lang: Lang): FacilityView {
  const terminal = content.airport.terminals.find((item) => item.id === facility.terminal);
  const level = facility.level ? terminal?.levels.find((item) => item.id === facility.level) : undefined;
  return {
    id: facility.id,
    name: pick(facility.name, lang),
    category: facility.category,
    categoryLabel: facilityCategoryLabel(facility.category, lang),
    icon: facility.category,
    terminal: facility.terminal,
    terminalLabel: terminalLabel(content.airport, facility.terminal, lang, { short: true }),
    zone: facility.zone,
    levelName: level ? pick(level.name, lang) : undefined,
    locationNote: optional(facility.locationNote, lang),
    hours: hoursView(facility.hours, lang),
    description: pick(facility.description, lang),
    access: optional(facility.access, lang),
    operator: facility.operator,
    accessible: facility.accessible,
    bookingUrl: facility.bookingUrl,
    provenance: facility.provenance,
    asOf: facility.asOf,
    sourceIds: facility.sources,
    mapHref: facility.mapPoint ? mapPointHref(content, facility.mapPoint) : undefined,
  };
}

/** Every facility of an airport, in category order then authoring order. */
export function facilityViews(content: AirportContent, lang: Lang): FacilityView[] {
  const order = Object.keys(FACILITY_CATEGORY_META);
  return content.facilities
    .map((facility, index) => ({ view: facilityView(facility, content, lang), index }))
    .sort((a, b) => order.indexOf(a.view.category) - order.indexOf(b.view.category) || a.index - b.index)
    .map(({ view }) => view);
}

/** The localised view of one schematic map. */
export function buildMapView(model: MapModel, content: AirportContent, lang: Lang): MapView {
  const facilities = new Map(content.facilities.map((facility) => [facility.id, facility]));
  const zones = new Map(model.zones.map((zone) => [zone.id, zone]));
  const levels = model.levels
    .map((level) => {
      const name = pick(level.name, lang);
      const { label, hint } = splitLevelName(name);
      return { id: level.id, name, label, hint, order: level.order, note: optional(level.note, lang) };
    })
    .sort((a, b) => b.order - a.order);
  const levelNames = new Map(levels.map((level) => [level.id, level.name]));

  return {
    id: model.id,
    airport: model.airport,
    terminal: model.terminal,
    terminalLabel: terminalLabel(content.airport, model.terminal, lang),
    name: pick(model.name, lang),
    note: pick(model.note, lang),
    levels,
    zones: model.zones.map((zone) => ({ id: zone.id, level: zone.level, name: pick(zone.name, lang), tone: zoneTone(zone.kind), shape: zone.shape })),
    pois: model.pois.map((poi) => {
      const facility = poi.ref?.type === 'facility' ? facilities.get(poi.ref.id) : undefined;
      const zone = poi.zone ? zones.get(poi.zone) : undefined;
      const name = pick(poi.name, lang);
      return {
        id: poi.id,
        level: poi.level,
        x: poi.x,
        y: poi.y,
        node: poi.node,
        name,
        short: shortName(name),
        kind: poi.kind,
        kindLabel: mapPoiKindLabel(poi.kind, lang),
        filter: filterForKind(poi.kind),
        zoneName: zone ? pick(zone.name, lang) : levelNames.get(poi.level),
        side: sideFor(poi.kind, zone?.kind, facility?.zone),
        provenance: poi.provenance,
        sourceIds: poi.sources ?? [],
        facility: facility ? facilityView(facility, content, lang) : undefined,
      };
    }),
    nodes: model.nodes,
    edges: model.edges.map((edge) => ({ from: edge.from, to: edge.to, metres: edge.metres, accessible: edge.accessible, kind: edge.kind, ...(edge.fixedMinutes !== undefined ? { fixedMinutes: edge.fixedMinutes } : {}) })),
    edgeNotes: Object.fromEntries(model.edges.filter((edge) => edge.note).map((edge) => [edgeKey(edge.from, edge.to), pick(edge.note as LocalizedText, lang)])),
    sourceIds: model.sources,
    asOf: model.asOf,
  };
}

/** Sources referenced by a set of ids, as a lookup the client can read. */
export function sourceLookup(ids: Iterable<string>): Record<string, Source> {
  const unique = [...new Set(ids)];
  return Object.fromEntries(resolveSources(unique).map((source) => [source.id, source]));
}

/** All source ids a map view and its facilities refer to. */
export function mapSourceIds(views: readonly MapView[]): string[] {
  return views.flatMap((view) => [...view.sourceIds, ...view.pois.flatMap((poi) => [...poi.sourceIds, ...(poi.facility?.sourceIds ?? [])])]);
}

/**
 * Where to send visitors for the airport's own maps: an official map page when the content
 * layer has one, otherwise the airport's official page, otherwise the passenger website.
 */
export function officialPages(content: AirportContent): { map?: Source; airport: string } {
  const mapSource = content.maps
    .flatMap((model) => resolveSources(model.sources))
    .find((source) => source.kind === 'official' && /map/i.test(source.title));
  const gaps = content.guidesNotes.find((note) => note.id === `${content.airport.slug}-content-gaps`);
  const candidates = [...resolveSources(content.airport.sources), ...resolveSources(gaps?.sources)];
  const airportPage = candidates.find(
    (source) => source.kind === 'official' && source.url.startsWith(PASSENGER_SITE) && source.url.length > PASSENGER_SITE.length,
  );
  return { map: mapSource, airport: airportPage?.url ?? getSource('mahb-airports-site')?.url ?? PASSENGER_SITE };
}

/** True when some of the given texts fall back to English on a Malay page. */
export function needsTranslationNotice(texts: readonly (LocalizedText | undefined)[], lang: Lang): boolean {
  return lang !== 'en' && texts.some((text) => text !== undefined && !hasTranslation(text, lang));
}
