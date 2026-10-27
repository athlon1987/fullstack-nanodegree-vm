// Which arrangement the soundtrack should play, from what the player is doing right now.
// Pure, so it can be tested; the engine adds the settle time and bar-line timing.
import type { MoodId } from './music/score';

export interface MoodInput {
  zen: boolean;
  hour: number;
  /** Open activity card (mini-games, lake, …). */
  activity: string | null;
  placing: boolean;
  panel: string | null;
  /** Selected building's type and its ambient bed, if any. */
  selectedType: string | null;
  selectedBed: string | null;
  /** A celebration is on (landmark finished, festival goal, level up…). */
  celebrating: boolean;
  /** Something was just placed or is being built. */
  building: boolean;
}

const CAFE = new Set(['cafe', 'bakery']);
const GARDEN = new Set(['garden', 'park', 'pond', 'flower_bed']);
const SHOP = new Set(['grocery', 'flower_shop', 'showroom', 'learning_centre', 'workshop']);

export function musicMood(x: MoodInput): MoodId {
  if (x.zen) return 'zen';
  if (x.celebrating) return 'celebration';
  if (x.activity === 'prep' || x.activity === 'quiz') return 'activity';
  if (x.activity === 'lake') return 'garden';
  if (x.placing || x.panel === 'build' || x.building) return 'build';
  if (x.selectedBed === 'kopitiam_chatter' || (x.selectedType && CAFE.has(x.selectedType))) return 'cafe';
  if (x.selectedBed === 'garden_birds' || (x.selectedType && GARDEN.has(x.selectedType))) return 'garden';
  if (x.selectedType && SHOP.has(x.selectedType)) return 'activity';
  if (x.hour >= 19.5 || x.hour < 6) return 'night';
  return 'town';
}
