// Neighbourhood pets. They anchor to building slots (not to named residents), so every
// world gets them; names are bilingual.
import type { LText } from '../platform/content/schema';

export interface PetDef {
  id: string;
  name: LText;
  model: string;
  height: number;
  /** Building type to wander around. */
  home?: string;
  /** Follow the resident who works at this building type. */
  followWorkerOf?: string;
  /** Appears once this building type is operational. */
  requires?: string;
}

export const PETS: PetDef[] = [
  { id: 'mochi', name: 'Mochi', model: 'cat', height: 0.3, home: 'starter_house' },
  { id: 'biscuit', name: { en: 'Biscuit', ms: 'Biskut' }, model: 'shiba', height: 0.34, followWorkerOf: 'bakery', requires: 'bakery' },
  { id: 'pudding', name: { en: 'Pudding', ms: 'Puding' }, model: 'pug', height: 0.28, home: 'cafe', requires: 'cafe' },
];

/** Fish that may visit the lake (catch-and-release journal, Zen Mode). */
export const FISH = ['tilapia', 'keli', 'puyu', 'haruan', 'sepat', 'kap', 'udang', 'kura'] as const;
