import { describe, expect, it } from 'vitest';
import { getAirportContent } from '@/content';
import { shortestPath } from '@/lib/map';
import { filterFacilities, isAccessibilityFacility, parseFacilityFilters, writeFacilityFilters, type FacilityView } from '@/components/facilities/facility-view';
import {
  applyQueryPatch,
  buildRouteSteps,
  clampView,
  filterCounts,
  filterForKind,
  fitView,
  levelBounds,
  gatePlaceId,
  CHECKPOINT_KINDS,
  parseMapQuery,
  passesFilters,
  placeLabels,
  placeOptionLabels,
  placePosition,
  routeMinutes,
  routingModel,
  scoreMatch,
  searchText,
  shortName,
  sideFor,
  splitLevelName,
  viewBoxFor,
  zoomAround,
  baseScale,
  segmentHitsBox,
} from './map-logic';
import { buildMapView, facilityViews, officialPages } from './map-view.server';

const kul = getAirportContent('kul');
if (!kul) throw new Error('KUL content missing');
const view = buildMapView(kul.maps[0], kul, 'en');
const model = routingModel(view);
const context = {
  placeByNode: new Map(view.pois.map((poi) => [poi.node, poi.name])),
  levelOrder: new Map(view.levels.map((level) => [level.id, level.order])),
  edgeNotes: view.edgeNotes,
};

describe('map view', () => {
  it('orders levels highest first and splits their names', () => {
    expect(view.levels.map((level) => level.id)).toEqual(['L5', 'GATES', 'L3', 'L1']);
    expect(splitLevelName('Level 5: departures')).toEqual({ label: 'Level 5', hint: 'departures' });
    expect(view.levels[0]).toMatchObject({ label: 'Level 5', hint: 'departures' });
  });

  it('localises points and keeps provenance', () => {
    const prayer = view.pois.find((poi) => poi.id === 'l5-prayer-room');
    expect(prayer?.short).toBe('Prayer room');
    expect(prayer?.provenance).toBe('demo');
    expect(prayer?.facility?.provenance).toBe('official');
    const ms = buildMapView(kul.maps[0], kul, 'ms');
    expect(ms.pois.find((poi) => poi.id === 'l5-prayer-room')?.name).toBe('Surau (kedudukan ilustrasi)');
  });

  it('classifies sides of security', () => {
    expect(sideFor('security', 'airside')).toBe('checkpoint');
    expect(sideFor('lounge', 'pier', 'airside')).toBe('airside');
    expect(sideFor('toilet', 'landside')).toBe('landside');
    expect(sideFor('bus', 'transport')).toBe('landside');
    expect(sideFor('other', undefined)).toBe('unknown');
    expect(view.pois.find((poi) => poi.id === 'g-gates-c')?.side).toBe('airside');
  });

  it('points visitors to the official map page', () => {
    expect(officialPages(kul).map?.url).toContain('/klia1/map');
    const pen = getAirportContent('pen');
    expect(pen && officialPages(pen).airport).toContain('/penang');
  });
});

describe('filters and search', () => {
  it('maps every kind to a filter, with a catch-all', () => {
    expect(filterForKind('gate')).toBe('gates');
    expect(filterForKind('hotel')).toBe('lounges');
    expect(filterForKind('aerotrain' as never)).toBe('other');
    const counts = filterCounts(view.pois);
    expect(counts.gates).toBe(5);
    expect(counts.food).toBe(0);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(view.pois.length);
  });

  it('passes everything when no filter is active', () => {
    expect(passesFilters({ filter: 'gates' }, [])).toBe(true);
    expect(passesFilters({ filter: 'gates' }, ['prayer'])).toBe(false);
  });

  it('matches names, types and everyday words', () => {
    const haystack = (id: string) => {
      const poi = view.pois.find((item) => item.id === id);
      return poi ? searchText([poi.name, poi.kindLabel, poi.zoneName]) : '';
    };
    expect(scoreMatch('gate c', 'Gates C (Satellite Building)', haystack('g-gates-c'))).toBeGreaterThan(0);
    expect(scoreMatch('surau', 'Prayer room (illustrative position)', haystack('l5-prayer-room'))).toBeGreaterThan(0);
    expect(scoreMatch('loo', 'Toilets (illustrative position)', haystack('l5-toilets'))).toBeGreaterThan(0);
    expect(scoreMatch('aerotrain', 'Gates A (domestic)', haystack('g-gates-a'))).toBe(0);
    expect(scoreMatch('   ', 'x', 'x')).toBe(0);
  });
});

describe('routes and steps', () => {
  it('writes steps for kerb to C gates, with the Aerotrain ride and its note', () => {
    const path = shortestPath(model, 'l5-kerb', 'g-gates-c');
    expect(path).not.toBeNull();
    if (!path) return;
    const steps = buildRouteSteps(path, context);
    expect(steps[0]).toMatchObject({ kind: 'start', place: 'Departures drop-off' });
    expect(steps.at(-1)).toMatchObject({ kind: 'arrive', place: 'Gates C (Satellite Building)' });
    const ride = steps.find((step) => step.kind === 'ride');
    expect(ride).toMatchObject({ conveyance: 'train', place: 'Aerotrain station (Satellite Building)' });
    expect(ride?.note).toMatch(/three minutes/);
    expect(steps.some((step) => step.kind === 'through' && step.toLevel === 'GATES')).toBe(true);
    const minutes = routeMinutes(path);
    expect(minutes.reduced).toBeGreaterThan(minutes.standard);
    expect(minutes.standard).toBe(path.minutes);
  });

  it('merges a lift run into one level change and avoids escalators when step-free', () => {
    const fastest = shortestPath(model, 'l5-row-b', 'l3-toilets');
    const stepFree = shortestPath(model, 'l5-row-b', 'l3-toilets', { accessibleOnly: true });
    expect(fastest?.accessible).toBe(false);
    expect(stepFree?.accessible).toBe(true);
    if (!stepFree) return;
    const steps = buildRouteSteps(stepFree, context);
    const change = steps.find((step) => step.kind === 'change-level');
    expect(change).toMatchObject({ conveyance: 'lift', direction: 'down', toLevel: 'L3' });
    const lifts = buildRouteSteps(shortestPath(model, 'l5-lifts', 'l1-bus-terminal', { accessibleOnly: true })!, context);
    expect(lifts.filter((step) => step.kind === 'change-level')).toHaveLength(1);
    expect(lifts.find((step) => step.kind === 'change-level')?.toLevel).toBe('L1');
  });

  it('names an unnamed escalator approach', () => {
    const path = shortestPath(model, 'l5-row-b', 'l3-toilets');
    if (!path) throw new Error('no path');
    const steps = buildRouteSteps(path, context);
    expect(steps.some((step) => step.kind === 'change-level' && step.conveyance === 'escalator')).toBe(true);
  });
});

describe('view maths', () => {
  const bounds = levelBounds(view, 'L5');

  it('fits a level and keeps the view inside it', () => {
    expect(bounds.minX).toBeLessThan(100);
    const fit = fitView(bounds);
    expect(fit.k).toBe(1);
    expect(clampView({ k: 99, cx: -500, cy: 9999 }, bounds)).toEqual({ k: 6, cx: bounds.minX, cy: bounds.maxY });
  });

  it('frames the places on a tall phone frame and keeps the whole drawing on a wide one (redesign three)', () => {
    const phone = { width: 356, height: 285 };
    const wide = { width: 800, height: 420 };
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const contain = (frame: { width: number; height: number }) => Math.min(frame.width / width, frame.height / height);
    expect(baseScale(bounds, phone)).toBeGreaterThan(contain(phone));
    expect(baseScale(bounds, wide)).toBeGreaterThanOrEqual(contain(wide));
    expect(baseScale(bounds, wide)).toBeLessThanOrEqual(Math.max(wide.width / width, wide.height / height));
    // Every place of the level stays inside the first phone view.
    const box = viewBoxFor(fitView(bounds, phone), bounds, phone);
    for (const poi of view.pois.filter((item) => item.level === 'L5')) {
      expect(poi.x).toBeGreaterThanOrEqual(box.x);
      expect(poi.x).toBeLessThanOrEqual(box.x + box.width);
      expect(poi.y).toBeGreaterThanOrEqual(box.y);
      expect(poi.y).toBeLessThanOrEqual(box.y + box.height);
    }
  });

  it('keeps labels off the route, except the route\'s own ends when nothing else is free', () => {
    expect(segmentHitsBox([0, 0, 100, 100], { x1: 40, y1: 40, x2: 60, y2: 60 })).toBe(true);
    expect(segmentHitsBox([0, 0, 100, 0], { x1: 40, y1: 10, x2: 60, y2: 20 })).toBe(false);
    const frame = { width: 400, height: 300 };
    // A horizontal route through the right of the marker: the label goes to another side.
    const candidate = { id: 'a', x: 200, y: 150, text: 'Rows F and G', priority: 5 };
    const route = [[205, 150, 380, 150]] as const;
    const placed = placeLabels([candidate], frame, { radius: 12, segments: route });
    expect(placed.get('a')).not.toBe('right');
    // Boxed in by the route on every side: a plain label is dropped, an end of the route is not.
    const all = [[0, 150, 400, 150], [200, 0, 200, 300], [0, 120, 400, 120], [0, 180, 400, 180]] as const;
    expect(placeLabels([candidate], frame, { radius: 12, segments: all }).has('a')).toBe(false);
    expect(placeLabels([{ ...candidate, priority: 90 }], frame, { radius: 12, segments: all }).has('a')).toBe(true);
  });

  it('zooms around an anchor without moving it', () => {
    const frame = { width: 800, height: 500 };
    const start = fitView(bounds);
    const anchor = { x: 300, y: 300 };
    const next = zoomAround(start, 2, anchor, bounds);
    const before = viewBoxFor(start, bounds, frame);
    const after = viewBoxFor(next, bounds, frame);
    const screen = (box: typeof before) => ((anchor.x - box.x) * box.scale).toFixed(3);
    expect(screen(after)).toBe(screen(before));
  });

  it('places labels without overlaps and inside the frame', () => {
    const placed = placeLabels(
      [
        { id: 'a', x: 100, y: 100, text: 'Gates A', priority: 9 },
        { id: 'b', x: 130, y: 100, text: 'Gates B', priority: 5 },
        { id: 'c', x: 790, y: 100, text: 'Edge', priority: 1 },
      ],
      { width: 800, height: 400 },
      { radius: 15 },
    );
    expect(placed.get('a')).toBeDefined();
    expect(placed.get('c')).toBe('left');
  });
});

describe('deep links', () => {
  it('parses and writes the query', () => {
    const query = parseMapQuery(new URLSearchParams('level=L3&poi=l3-atm&from=a&to=b&sf=1&cat=gates,nope,gates'));
    expect(query).toEqual({ terminal: undefined, level: 'L3', poi: 'l3-atm', from: 'a', to: 'b', stepFree: true, filters: ['gates'] });
    expect(applyQueryPatch('?poi=x&t=T1', { poi: null, level: 'L5' })).toBe('?t=T1&level=L5');
    expect(applyQueryPatch('?poi=x', { poi: null })).toBe('');
    expect(shortName('Gates A (domestic)')).toBe('Gates A');
  });
});

describe('facilities directory', () => {
  const items: FacilityView[] = facilityViews(kul, 'en');

  it('builds views with map links and groups by category order', () => {
    const calm = items.find((item) => item.id === 'kul-t1-calm-room');
    expect(calm?.mapHref).toBe('/kul/map?t=T1&poi=l5-calm-room');
    expect(calm?.levelName).toBeDefined();
    expect(items[0].category).toBe('prayer-room');
  });

  it('filters by category, terminal, area and accessibility', () => {
    expect(filterFacilities(items, { categories: ['lounge'], accessible: false }).every((item) => item.category === 'lounge')).toBe(true);
    expect(filterFacilities(items, { categories: [], terminal: 'T2', accessible: false }).every((item) => item.terminal === 'T2')).toBe(true);
    const airside = filterFacilities(items, { categories: [], area: 'airside', accessible: false });
    expect(airside.length).toBeGreaterThan(0);
    expect(airside.every((item) => item.zone === 'airside' || item.zone === 'both')).toBe(true);
    const access = filterFacilities(items, { categories: [], accessible: true });
    expect(access.every(isAccessibilityFacility)).toBe(true);
    expect(access.some((item) => item.category === 'calm-room')).toBe(true);
  });

  it('round-trips filters through the URL', () => {
    const known = { categories: ['lounge', 'calm-room'] as const, terminals: ['T1', 'T2'] as const };
    const filters = parseFacilityFilters(new URLSearchParams('cat=lounge,bogus&t=T2&area=airside&access=1&x=1'), { categories: [...known.categories], terminals: [...known.terminals] });
    expect(filters).toEqual({ categories: ['lounge'], terminal: 'T2', area: 'airside', accessible: true });
    expect(writeFacilityFilters(new URLSearchParams('x=1'), filters).toString()).toBe('x=1&cat=lounge&t=T2&area=airside&access=1');
  });
});

describe('gate deep links (journey timeline)', () => {
  it('resolves a flight gate to the gate itself or its gate area, like poiForGate', () => {
    const model = getAirportContent('kul')?.maps[0];
    expect(model).toBeDefined();
    const pois = model?.pois ?? [];
    expect(parseMapQuery(new URLSearchParams('gate=C12&t=T1')).gate).toBe('C12');
    expect(gatePlaceId(pois, 'C12')).toBe('g-gates-c');
    expect(gatePlaceId(pois, 'h3')).toBe('g-gates-h');
    expect(gatePlaceId(pois, 'Z9')).toBeUndefined();
  });
});

describe('fix round: positions, option labels and step-free directions', () => {
  it('does not give an illustrative pin a level or area its facility does not publish (C-04)', () => {
    const prayer = view.pois.find((poi) => poi.id === 'l5-prayer-room');
    if (!prayer?.facility) throw new Error('prayer room point or facility missing');
    expect(prayer.provenance).toBe('demo');
    expect(prayer.facility.levelName).toBeUndefined();
    expect(prayer.facility.zone).toBe('unknown');
    expect(placePosition(prayer)).toEqual({ level: false, area: false, unpublished: true });
    // A sourced point keeps its level and area.
    const calm = view.pois.find((poi) => poi.id === 'l5-calm-room');
    expect(calm && placePosition(calm)).toEqual({ level: true, area: true, unpublished: false });
    // A demo point with no facility behind it is unchanged (its name already says "illustrative").
    const toilets = view.pois.find((poi) => poi.id === 'l5-toilets');
    expect(toilets && placePosition(toilets)).toEqual({ level: true, area: true, unpublished: false });
    // Every demo point linked to a facility follows the facility record.
    for (const poi of view.pois.filter((item) => item.provenance === 'demo' && item.facility)) {
      const position = placePosition(poi);
      expect(position.level).toBe(poi.facility?.levelName !== undefined);
      expect(position.area).toBe(poi.facility?.zone !== 'unknown');
    }
  });

  it('labels every From and To option uniquely on every map (C-09)', () => {
    for (const content of [kul]) {
      for (const model of content.maps) {
        for (const lang of ['en', 'ms'] as const) {
          const map = buildMapView(model, content, lang);
          const labels = [...placeOptionLabels(map).values()];
          expect(labels).toHaveLength(map.pois.length);
          expect(new Set(labels).size).toBe(labels.length);
        }
      }
    }
    const labels = placeOptionLabels(view);
    expect(labels.get('g-aerotrain-main')).toBe('Aerotrain station (Main Terminal Building) · Gates');
    expect(labels.get('g-aerotrain-satellite')).toBe('Aerotrain station (Satellite Building) · Gates');
    expect(labels.get('g-gates-c')).toBe('Gates C · Gates');
  });

  it('names immigration, customs and the level change on a step-free route from gate C to the arrivals pick-up (C-08)', () => {
    // The taxi counter is not a map place yet (hand-off to D); the arrivals pick-up is the nearest point.
    const path = shortestPath(model, 'g-gates-c', 'l3-kerb', { accessibleOnly: true });
    if (!path) throw new Error('no step-free path');
    const checkpoints = new Set(view.pois.filter((poi) => CHECKPOINT_KINDS.includes(poi.kind)).map((poi) => poi.node));
    const steps = buildRouteSteps(path, { ...context, checkpoints, stepFree: true });
    const kinds = steps.map((step) => step.kind);
    // No vague "Walk on": every walk names where it goes.
    expect(steps.filter((step) => step.kind === 'walk').every((step) => step.place || step.approach)).toBe(true);
    // The level change is its own named, step-free step that leads to arrival immigration.
    const change = steps.find((step) => step.toLevel === 'L3');
    expect(change).toMatchObject({ kind: 'checkpoint', levelDirection: 'down', stepFree: true, place: 'Arrival immigration' });
    // Customs is a named step of its own.
    expect(steps.find((step) => step.kind === 'checkpoint' && step.place === 'Customs')).toBeDefined();
    expect(kinds.at(-1)).toBe('arrive');
    expect(steps.at(-1)?.place).toBe('Arrivals pick-up');
    // Immigration comes before customs.
    expect(steps.findIndex((step) => step.place === 'Arrival immigration')).toBeLessThan(steps.findIndex((step) => step.place === 'Customs'));
  });

  it('keeps a security checkpoint as its own step on the way to the C gates', () => {
    const path = shortestPath(model, 'l5-kerb', 'g-gates-c');
    if (!path) throw new Error('no path');
    const checkpoints = new Set(view.pois.filter((poi) => CHECKPOINT_KINDS.includes(poi.kind)).map((poi) => poi.node));
    const steps = buildRouteSteps(path, { ...context, checkpoints });
    expect(steps.find((step) => step.kind === 'checkpoint')?.place).toMatch(/Immigration and security/);
    expect(steps.some((step) => step.kind === 'through' && step.toLevel === 'GATES' && step.levelDirection === 'down')).toBe(true);
  });
});
