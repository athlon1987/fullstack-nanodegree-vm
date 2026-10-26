// The handcrafted starting neighborhood. Coordinates are grid cells; the starting
// land is x 6–17, z 6–17 and the main street runs along z 18–19.
import { START_PLOTS } from '../../data/progression';
import type { BuildingInstance, GameState, Rotation, Settings } from './types';

export const SAVE_VERSION = 3;

export const DEFAULT_SETTINGS: Settings = {
  musicVolume: 0.5,
  sfxVolume: 0.8,
  muted: false,
  reducedMotion: false,
  graphics: 'high',
  dayNight: 'cycle',
  showGrid: false,
  analyticsConsent: true,
  textScale: 1,
};

type Placement = [type: string, x: number, z: number, rot?: Rotation];

export const STARTING_LAYOUT: Placement[] = [
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

export function createNewGame(now: number, seed = Math.floor(Math.random() * 2 ** 31)): GameState {
  let uid = 0;
  const buildings: BuildingInstance[] = STARTING_LAYOUT.map(([type, x, z, rot = 0]) => ({
    uid: `b${++uid}`,
    type,
    x,
    z,
    rot,
    level: 1,
    busyUntil: null,
    busyKind: null,
    queue: [],
    // The house has been "collecting rent" while the player unpacked.
    passiveSince: type === 'starter_house' ? now - 3 * 60_000 : now,
    placedAt: now,
  }));
  return {
    version: SAVE_VERSION,
    seed,
    profile: { name: 'Neighbor', hoodName: 'Maple Hollow', avatar: 'mini_female_d', createdAt: now },
    coins: 150,
    gems: 10,
    xp: 0,
    level: 1,
    inventory: {},
    buildings,
    plots: [...START_PLOTS],
    residents: [
      { id: 'mia', arrivedAt: now, friendship: 0, memories: {}, lastTalkDay: null, lastGiftDay: null, storyDone: [], storyActive: null },
    ],
    orders: [],
    orderCooldowns: [],
    orderCounter: 0,
    quests: { active: [], done: [] },
    tutorial: { step: 0, done: false, skipped: false },
    stats: {},
    achievements: [],
    unlocked: [],
    flags: {},
    pulse: null,
    community: { projectId: 'fountain', contributed: {}, ops: [], log: [], completedAt: null, rewardClaimed: false },
    event: null,
    history: [{ t: now, icon: 'home', text: 'You moved into your Starter House.' }],
    uidCounter: uid,
    lastSeen: now,
    lastSessionStart: now,
    sessions: 1,
    settings: { ...DEFAULT_SETTINGS },
  };
}
