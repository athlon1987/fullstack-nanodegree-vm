// Shared neighbourhood spots: places just beyond your own land that the whole community
// transforms together — an overgrown corner becomes a pocket park, an empty square a plaza,
// a bare lot a playground, a dusty rise a sunset lookout. Every step is visible in the world,
// brings neighbours closer and, when a spot is finished, opens a group celebration there.
//
// Spots are a place to *give*: they take coins and goods and never pay coins back (they are
// the economy's main sink), rewarding experience, friendship, keepsakes and celebrations.
import type { SpotDef } from '../game/core/types';

export const SPOTS: SpotDef[] = [
  {
    id: 'park',
    refresh: { coins: 1200, items: { flowers: 10, coffee: 6 } },
    building: 'spot_park',
    minLevel: 2,
    flag: 'spot_park',
    unlocks: 'picnic_set',
    celebration: 'garden_party',
    stages: [
      { needs: { coins: 60 }, xp: 10, friendship: 1 },
      { needs: { coins: 100, flowers: 6 }, xp: 15, friendship: 2 },
      { needs: { coins: 220, planks: 4 }, xp: 25, friendship: 2 },
      { needs: { coins: 350, coffee: 4, bread: 4 }, xp: 40, friendship: 3 },
    ],
  },
  {
    id: 'plaza',
    refresh: { coins: 2500, items: { bouquet: 3, jam: 3 } },
    building: 'spot_plaza',
    minLevel: 3,
    flag: 'spot_plaza',
    unlocks: 'market_stall',
    celebration: 'community_market',
    stages: [
      { needs: { coins: 250, planks: 3 }, xp: 20, friendship: 1 },
      { needs: { coins: 450, bricks: 6 }, xp: 30, friendship: 2 },
      { needs: { coins: 800, flowers: 10, furniture: 2 }, xp: 45, friendship: 2 },
      { needs: { coins: 1400, bouquet: 3, breakfast: 4 }, xp: 70, friendship: 3 },
    ],
  },
  {
    id: 'playground',
    refresh: { coins: 4000, items: { furniture: 2, berry_pie: 2 } },
    building: 'spot_playground',
    minLevel: 5,
    flag: 'spot_playground',
    unlocks: 'kite_post',
    celebration: 'pet_parade',
    stages: [
      { needs: { coins: 700, planks: 8 }, xp: 40, friendship: 1 },
      { needs: { coins: 1300, bricks: 10 }, xp: 55, friendship: 2 },
      { needs: { coins: 2400, furniture: 3 }, xp: 75, friendship: 2 },
      { needs: { coins: 4000, berry_pie: 3, veggie_basket: 2 }, xp: 110, friendship: 3 },
    ],
  },
  {
    id: 'lookout',
    refresh: { coins: 6000, items: { bouquet: 3, breakfast: 4 } },
    building: 'spot_lookout',
    minLevel: 7,
    flag: 'spot_lookout',
    unlocks: 'telescope',
    celebration: 'movie_night',
    stages: [
      { needs: { coins: 2500, planks: 10 }, xp: 70, friendship: 1 },
      { needs: { coins: 4500, bricks: 12 }, xp: 90, friendship: 2 },
      { needs: { coins: 7000, furniture: 4, flowers: 16 }, xp: 120, friendship: 2 },
      { needs: { coins: 11000, bouquet: 4, breakfast: 6, jam: 4 }, xp: 180, friendship: 3 },
    ],
  },
];

/** Where each spot sits: on shared land just past the starting neighbourhood (cell x, z). */
export const SPOT_PLACES: Record<string, [number, number]> = {
  park: [18, 7],
  plaza: [12, 3],
  playground: [3, 12],
  lookout: [12, 20],
};

export const spotDef = (id: string) => SPOTS.find((s) => s.id === id);

/** What a finished spot's next seasonal refresh needs: half as many coins again each season. */
export function refreshNeeds(def: SpotDef, season: number): Record<string, number> {
  const k = 1 + Math.floor(season / 2);
  return { coins: Math.round((def.refresh.coins * (1 + season * 0.5)) / 50) * 50, ...Object.fromEntries(Object.entries(def.refresh.items).map(([i, n]) => [i, n * k])) };
}

/** What the spot needs next (a build step, or a seasonal refresh once finished). */
export function spotNeeds(def: SpotDef, st: { stage: number; refreshes?: number }): Record<string, number> {
  return st.stage < def.stages.length ? (def.stages[st.stage].needs as Record<string, number>) : refreshNeeds(def, st.refreshes ?? 0);
}
export const spotForBuilding = (type: string) => SPOTS.find((s) => s.building === type);
