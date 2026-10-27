// The active world (district). The neutral core world below is built in; country world
// packs (content/worlds/*.json) replace these values at install time. Nothing here names a
// real place or brand: the core is a neutral fallback that always works offline.
import type { Rotation } from '../game/core/types';

export type Placement = [type: string, x: number, z: number, rot?: Rotation];

export interface WorldInfo {
  id: string;
  /** ISO 3166 alpha-2; "ZZ" marks the neutral, country-less core world. */
  country: string;
  name: string;
  tagline: string;
  hoodName: string;
  avatar: string;
  biome: 'temperate' | 'tropical';
  rainChance: number;
  layout: Placement[];
  /** First history entry for a new save. */
  history: string;
}

export const CORE_WORLD_ID = 'core.maple_hollow';

export const CORE_LAYOUT: Placement[] = [
  ['starter_house', 12, 15],
  ['pond', 6, 6],
  ['fountain', 11, 10],
  ['request_board', 10, 17],
  ['welcome_sign', 6, 17],
  ['lamp', 9, 17],
  ['lamp', 17, 17],
  // Street-side path and the plaza ring around the fountain site
  ...[11, 12, 13, 14, 15, 16].map((x): Placement => ['path', x, 17]),
  ...[10, 11, 12, 13].flatMap((x): Placement[] => [['path', x, 9], ['path', x, 12]]),
  ['path', 10, 10], ['path', 10, 11], ['path', 13, 10], ['path', 13, 11],
  ['path', 11, 13], ['path', 11, 14], ['path', 11, 15], ['path', 11, 16],
  // A little front garden
  ['flower_bed', 9, 15], ['flower_bed', 10, 15], ['flower_bed', 9, 16], ['flower_bed', 10, 16],
  // Trees and shrubs framing the scene
  ['tree_round', 6, 12], ['tree_round', 7, 13], ['tree_round', 16, 7], ['tree_round', 15, 6], ['tree_round', 8, 11],
  ['tree_pine', 10, 6], ['tree_pine', 13, 6], ['tree_pine', 17, 6], ['tree_pine', 6, 15],
  ['bush', 9, 10], ['bush', 6, 14], ['bush', 17, 14], ['bush', 14, 8],
  ['fence', 6, 9], ['fence', 7, 9], ['fence', 8, 9], ['fence', 9, 7, 1], ['fence', 9, 8, 1],
  ['bench', 7, 10, 2],
  ['rock', 16, 9], ['mushroom', 15, 8], ['rock', 7, 16],
];

export const WORLD: WorldInfo = {
  id: CORE_WORLD_ID,
  country: 'ZZ',
  name: 'Maple Hollow',
  tagline: 'A neutral starter neighbourhood.',
  hoodName: 'Maple Hollow',
  avatar: 'mini_female_d',
  biome: 'temperate',
  rainChance: 0,
  layout: CORE_LAYOUT,
  history: 'You moved into your Starter House.',
};
