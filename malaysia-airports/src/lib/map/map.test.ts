import { describe, expect, it } from 'vitest';
import { KUL_CONTENT } from '@/content/airports/kul';
import type { MapModel } from '@/content/types';
import { createEdgeBuilder, schematicMetres } from './build';
import { WALK_SPEEDS, edgeMinutes, findPoi, nearestPoi, poiForGate, poiForRef, poisOnLevel, shortestPath } from './index';

const map = KUL_CONTENT.maps[0];

const tiny: MapModel = {
  ...map,
  id: 'tiny',
  levels: [{ id: 'A', name: { en: 'A' }, order: 1 }],
  zones: [],
  pois: [],
  nodes: [
    { id: 'a', level: 'A', x: 0, y: 0 },
    { id: 'b', level: 'A', x: 140, y: 0 },
    { id: 'c', level: 'A', x: 280, y: 0 },
    { id: 'lonely', level: 'A', x: 500, y: 500 },
  ],
  edges: [
    { from: 'a', to: 'b', metres: 70, accessible: true, kind: 'walk' },
    { from: 'b', to: 'c', metres: 70, accessible: false, kind: 'escalator' },
  ],
};

describe('shortestPath', () => {
  it('routes from check-in to the C gates through the Aerotrain', () => {
    const route = shortestPath(map, 'l5-row-h', 'g-gates-c');
    expect(route).not.toBeNull();
    const ids = route?.nodes.map((node) => node.id) ?? [];
    expect(ids[0]).toBe('l5-row-h');
    expect(ids[ids.length - 1]).toBe('g-gates-c');
    expect(ids).toContain('g-aerotrain-main');
    expect(ids).toContain('g-aerotrain-satellite');
    expect(route?.levels).toEqual(['L5', 'GATES']);
    expect(route?.legs.some((leg) => leg.edge.kind === 'train')).toBe(true);
    expect(route?.minutes).toBeGreaterThan(3);
  });

  it('estimates time at 70 metres a minute and reports metres', () => {
    const route = shortestPath(tiny, 'a', 'c');
    expect(route).toMatchObject({ metres: 140, minutes: 2, accessible: false, profile: 'standard' });
    expect(WALK_SPEEDS).toEqual({ standard: 70, reduced: 48 });
  });

  it('avoids escalators when only step-free routes are allowed, and says so when none exists', () => {
    expect(shortestPath(tiny, 'a', 'c', { accessibleOnly: true })).toBeNull();
    const standard = shortestPath(map, 'l5-row-b', 'l3-arrival-hall');
    const stepFree = shortestPath(map, 'l5-row-b', 'l3-arrival-hall', { accessibleOnly: true });
    expect(standard?.legs.some((leg) => leg.edge.kind === 'escalator')).toBe(true);
    expect(standard?.accessible).toBe(false);
    expect(stepFree?.legs.some((leg) => leg.edge.kind === 'escalator')).toBe(false);
    expect(stepFree?.legs.some((leg) => leg.edge.kind === 'lift')).toBe(true);
    expect(stepFree?.accessible).toBe(true);
    expect(stepFree?.minutes ?? 0).toBeGreaterThan(standard?.minutes ?? Infinity);
  });

  it('uses the slower 0.8 m/s profile for reduced mobility', () => {
    const standard = shortestPath(map, 'l5-kerb', 'l5-calm-room', { profile: 'standard' });
    const reduced = shortestPath(map, 'l5-kerb', 'l5-calm-room', { profile: 'reduced' });
    expect(reduced?.metres).toBe(standard?.metres);
    expect(reduced?.minutes ?? 0).toBeGreaterThan(standard?.minutes ?? Infinity);
    expect(shortestPath(map, 'l5-kerb', 'l5-calm-room', { accessibleOnly: true })?.profile).toBe('reduced');
  });

  it('counts a ride by its fixed time, not by walking speed', () => {
    const ride = shortestPath(map, 'g-aerotrain-main', 'g-aerotrain-satellite');
    expect(ride).toMatchObject({ minutes: 3, metres: 0 });
    expect(edgeMinutes({ from: 'x', to: 'y', metres: 700, accessible: true, kind: 'walk' })).toBe(10);
    expect(edgeMinutes({ from: 'x', to: 'y', metres: 700, accessible: true, kind: 'train', fixedMinutes: 3 }, 'reduced')).toBe(3);
  });

  it('handles the same start and end, unknown places and unreachable nodes', () => {
    expect(shortestPath(map, 'l5-kerb', 'l5-kerb')).toMatchObject({ minutes: 0, metres: 0, legs: [] });
    expect(shortestPath(map, 'l5-kerb', 'nowhere')).toBeNull();
    expect(shortestPath(tiny, 'a', 'lonely')).toBeNull();
  });

  it('can reach every point of interest from the departures kerb, step-free', () => {
    for (const poi of map.pois) {
      expect(shortestPath(map, 'l5-kerb', poi.id, { accessibleOnly: true }), poi.id).not.toBeNull();
    }
  });
});

describe('map lookups and authoring helpers', () => {
  it('finds points by id, level, content reference and gate', () => {
    expect(findPoi(map, 'l5-calm-room')?.kind).toBe('calm-room');
    expect(poisOnLevel(map, 'L1').map((poi) => poi.id)).toContain('l1-bus-terminal');
    expect(poiForRef(map, 'facility', 'kul-t1-calm-room')?.id).toBe('l5-calm-room');
    expect(poiForGate(map, 'C12')?.id).toBe('g-gates-c');
    expect(poiForGate(map, 'h4')?.id).toBe('g-gates-h');
    expect(poiForGate(map, 'Z9')).toBeUndefined();
  });

  it('finds the nearest point of a kind', () => {
    expect(nearestPoi(map, 'l5-row-b', 'toilet')?.poi.id).toBe('l5-toilets');
    expect(nearestPoi(map, 'l3-arrival-hall', 'toilet')?.poi.id).toBe('l3-toilets');
    expect(nearestPoi(map, 'l5-row-b', 'smoking')).toBeNull();
  });

  it('measures schematic distances and refuses edges to unknown nodes', () => {
    expect(schematicMetres({ x: 0, y: 0 }, { x: 300, y: 400 })).toBe(250);
    expect(schematicMetres({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(5);
    const edge = createEdgeBuilder(tiny.nodes);
    expect(edge('a', 'b')).toMatchObject({ metres: 70, accessible: true, kind: 'walk' });
    expect(() => edge('a', 'missing')).toThrow(/unknown node/);
  });
});
