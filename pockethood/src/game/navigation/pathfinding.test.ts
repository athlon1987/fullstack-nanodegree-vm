import { describe, expect, it } from 'vitest';
import { createNewGame } from '../core/newGame';
import { cellsOf } from '../world/grid';
import { buildNavGrid, findPath, walkable } from './pathfinding';

describe('pathfinding', () => {
  const s = createNewGame(0, 1);
  const nav = buildNavGrid(s);
  it('never routes through buildings or locked land', () => {
    const path = findPath(nav, 8, 17, 17, 10)!;
    expect(path).not.toBeNull();
    const solid = new Set(s.buildings.filter((b) => b.type !== 'path').flatMap((b) => cellsOf(b.type, b.x, b.z, b.rot).map(([x, z]) => `${x},${z}`)));
    for (const [x, z] of path) {
      expect(solid.has(`${x},${z}`)).toBe(false);
      expect(walkable(nav, x, z)).toBe(true);
    }
  });
  it('can use the road to enter from the edge of the island', () => {
    expect(findPath(nav, 0, 18, 12, 13)).not.toBeNull();
  });
  it('returns null for unreachable goals', () => {
    expect(findPath(nav, 12, 13, 2, 2)).toBeNull();
  });
});
