/**
 * Map helpers: routing over a `MapModel` walk graph and small lookups for the map UI.
 *
 * Everything here is pure. Maps in this prototype are schematic, so distances and times are
 * indicative: always present them as estimates ("about 6 min") next to the schematic notice.
 */
import type { MapEdge, MapModel, MapNode, MapPoi } from '@/content/types';

/** Walking speed profiles in metres per minute. */
export const WALK_SPEEDS = {
  /** 1.2 m/s, about 70 m a minute: an unhurried adult with hand luggage. */
  standard: 70,
  /** 0.8 m/s, 48 m a minute: reduced mobility, small children or heavy bags. */
  reduced: 48,
} as const;

/** Which walking speed to estimate with. */
export type WalkProfile = keyof typeof WALK_SPEEDS;

/** Options for `shortestPath`. */
export interface PathOptions {
  /** Skip escalators and stairs (edges with `accessible: false`). */
  accessibleOnly?: boolean;
  /** Walking speed profile. Defaults to `reduced` when `accessibleOnly` is set, else `standard`. */
  profile?: WalkProfile;
}

/** One leg of a route: the edge taken and the node it leads to. */
export interface PathLeg {
  edge: MapEdge;
  from: MapNode;
  to: MapNode;
  /** Minutes for this leg at the chosen profile (or the edge's fixed ride time). */
  minutes: number;
}

/** Result of `shortestPath`. */
export interface PathResult {
  /** Nodes in order, starting at the origin and ending at the destination. */
  nodes: MapNode[];
  /** Legs between consecutive nodes. */
  legs: PathLeg[];
  /** Total walking distance in metres (rides with a fixed time contribute their own `metres`). */
  metres: number;
  /** Estimated minutes, rounded up to a whole minute (0 only when origin equals destination). */
  minutes: number;
  /** Level ids visited, in order, without repeats in a row. */
  levels: string[];
  /** True when every leg is step-free. */
  accessible: boolean;
  profile: WalkProfile;
}

/** Minutes needed for one edge at a walking profile. */
export function edgeMinutes(edge: MapEdge, profile: WalkProfile = 'standard'): number {
  if (edge.fixedMinutes !== undefined) return edge.fixedMinutes;
  return edge.metres / WALK_SPEEDS[profile];
}

function resolveNodeId(model: MapModel, id: string): string | undefined {
  if (model.nodes.some((node) => node.id === id)) return id;
  return model.pois.find((poi) => poi.id === id)?.node;
}

/**
 * Shortest route between two places on a map (Dijkstra over time, so a short ride beats a long
 * walk). `fromId` and `toId` may be walk-graph node ids or point-of-interest ids.
 *
 * Returns `null` when either end is unknown or no route exists under the given options (for
 * example the only link is an escalator and `accessibleOnly` is set).
 *
 * @example
 * const route = shortestPath(map, 'l5-row-h', 'g-gates-c', { accessibleOnly: true });
 * // route?.minutes, route?.metres, route?.nodes
 */
export function shortestPath(
  model: MapModel,
  fromId: string,
  toId: string,
  options: PathOptions = {},
): PathResult | null {
  const start = resolveNodeId(model, fromId);
  const goal = resolveNodeId(model, toId);
  if (!start || !goal) return null;

  const profile: WalkProfile = options.profile ?? (options.accessibleOnly ? 'reduced' : 'standard');
  const nodesById = new Map(model.nodes.map((node) => [node.id, node]));

  const adjacency = new Map<string, { edge: MapEdge; next: string }[]>();
  for (const edge of model.edges) {
    if (options.accessibleOnly && !edge.accessible) continue;
    if (!nodesById.has(edge.from) || !nodesById.has(edge.to)) continue;
    adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), { edge, next: edge.to }]);
    adjacency.set(edge.to, [...(adjacency.get(edge.to) ?? []), { edge, next: edge.from }]);
  }

  const cost = new Map<string, number>([[start, 0]]);
  const previous = new Map<string, { edge: MapEdge; from: string }>();
  const visited = new Set<string>();
  const frontier = new Set<string>([start]);

  while (frontier.size > 0) {
    let current: string | undefined;
    let best = Infinity;
    for (const id of frontier) {
      const value = cost.get(id) ?? Infinity;
      if (value < best || (value === best && current !== undefined && id < current)) {
        best = value;
        current = id;
      }
    }
    if (current === undefined) break;
    frontier.delete(current);
    if (current === goal) break;
    visited.add(current);

    for (const { edge, next } of adjacency.get(current) ?? []) {
      if (visited.has(next)) continue;
      const candidate = best + edgeMinutes(edge, profile);
      if (candidate < (cost.get(next) ?? Infinity)) {
        cost.set(next, candidate);
        previous.set(next, { edge, from: current });
        frontier.add(next);
      }
    }
  }

  if (start !== goal && !previous.has(goal)) return null;

  const legs: PathLeg[] = [];
  let cursor = goal;
  while (cursor !== start) {
    const step = previous.get(cursor);
    if (!step) return null;
    legs.unshift({
      edge: step.edge,
      from: nodesById.get(step.from) as MapNode,
      to: nodesById.get(cursor) as MapNode,
      minutes: edgeMinutes(step.edge, profile),
    });
    cursor = step.from;
  }

  const nodes: MapNode[] = [nodesById.get(start) as MapNode, ...legs.map((leg) => leg.to)];
  const levels: string[] = [];
  for (const node of nodes) {
    if (levels[levels.length - 1] !== node.level) levels.push(node.level);
  }
  const exactMinutes = legs.reduce((sum, leg) => sum + leg.minutes, 0);

  return {
    nodes,
    legs,
    metres: Math.round(legs.reduce((sum, leg) => sum + leg.edge.metres, 0)),
    minutes: exactMinutes <= 0 ? 0 : Math.ceil(exactMinutes - 1e-9),
    levels,
    accessible: legs.every((leg) => leg.edge.accessible),
    profile,
  };
}

/** A point of interest by id. */
export function findPoi(model: MapModel, id: string): MapPoi | undefined {
  return model.pois.find((poi) => poi.id === id);
}

/** Points of interest on one level, in authoring order. */
export function poisOnLevel(model: MapModel, levelId: string): MapPoi[] {
  return model.pois.filter((poi) => poi.level === levelId);
}

/** The point of interest that stands for a content record (facility, outlet, transport, car park). */
export function poiForRef(model: MapModel, type: NonNullable<MapPoi['ref']>['type'], id: string): MapPoi | undefined {
  return model.pois.find((poi) => poi.ref?.type === type && poi.ref.id === id);
}

/**
 * The point that best represents a flight gate on the map: an exact gate point if one exists,
 * otherwise the gate group for the letter prefix ("C12" resolves to the "C gates" point).
 */
export function poiForGate(model: MapModel, gate: string): MapPoi | undefined {
  const gates = model.pois.filter((poi) => poi.kind === 'gate');
  const wanted = gate.trim().toLowerCase();
  const exact = gates.find((poi) => poi.id.endsWith(`-gate-${wanted}`));
  if (exact) return exact;
  const prefix = wanted.match(/^[a-z]+/)?.[0];
  return prefix ? gates.find((poi) => poi.id.endsWith(`-gates-${prefix}`)) : undefined;
}

/** The nearest point of a given kind to an origin, by route time. Useful for "nearest toilets". */
export function nearestPoi(
  model: MapModel,
  fromId: string,
  kind: MapPoi['kind'],
  options: PathOptions = {},
): { poi: MapPoi; path: PathResult } | null {
  let best: { poi: MapPoi; path: PathResult } | null = null;
  for (const poi of model.pois) {
    if (poi.kind !== kind) continue;
    const path = shortestPath(model, fromId, poi.id, options);
    if (path && (!best || path.minutes < best.path.minutes || (path.minutes === best.path.minutes && path.metres < best.path.metres))) {
      best = { poi, path };
    }
  }
  return best;
}
