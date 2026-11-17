/**
 * Authoring helpers for schematic maps. Content authors use these in
 * `src/content/airports/<code>.ts` to keep map definitions short and consistent.
 */
import type { LocalizedText, MapEdge, MapNode } from '@/content/types';

/** Schematic scale: one map unit stands for this many metres. */
export const SCHEMATIC_METRES_PER_UNIT = 0.5;

/** Straight-line schematic distance between two nodes, rounded to 5 m (minimum 5 m). */
export function schematicMetres(a: Pick<MapNode, 'x' | 'y'>, b: Pick<MapNode, 'x' | 'y'>): number {
  const units = Math.hypot(a.x - b.x, a.y - b.y);
  return Math.max(5, Math.round((units * SCHEMATIC_METRES_PER_UNIT) / 5) * 5);
}

/** Options for `createEdgeBuilder` edges. */
export interface EdgeOptions {
  /** Override the schematic distance. */
  metres?: number;
  /** Defaults to true. Set false for escalators and stairs. */
  accessible?: boolean;
  kind?: MapEdge['kind'];
  fixedMinutes?: number;
  note?: LocalizedText;
}

/**
 * Returns a function that creates edges between nodes by id, measuring the schematic distance
 * from the node coordinates unless `metres` is given. Throws on unknown node ids so that typos
 * fail at module load (and therefore in the test run).
 */
export function createEdgeBuilder(nodes: readonly MapNode[]): (from: string, to: string, options?: EdgeOptions) => MapEdge {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return (from, to, options = {}) => {
    const a = byId.get(from);
    const b = byId.get(to);
    if (!a || !b) throw new Error(`Map edge refers to an unknown node: ${from} > ${to}`);
    const edge: MapEdge = {
      from,
      to,
      metres: options.metres ?? schematicMetres(a, b),
      accessible: options.accessible ?? true,
      kind: options.kind ?? 'walk',
    };
    if (options.fixedMinutes !== undefined) edge.fixedMinutes = options.fixedMinutes;
    if (options.note) edge.note = options.note;
    return edge;
  };
}
