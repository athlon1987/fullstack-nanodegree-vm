// A new save for the installed world: its starting layout, neighbourhood name, first
// resident(s) and community project all come from the active world pack (or the core world).
import { BUILDINGS } from '../../data/buildings';
import { COMMUNITY_PROJECTS, START_PLOTS } from '../../data/progression';
import { RESIDENTS } from '../../data/residents';
import { WORLD } from '../../data/world';
import type { BuildingInstance, GameState, Settings } from './types';

export const SAVE_VERSION = 4;

export const DEFAULT_SETTINGS: Settings = {
  musicVolume: 0.5,
  sfxVolume: 0.8,
  ambienceVolume: 0.6,
  characterVolume: 0.7,
  locale: 'en',
  zen: false,
  weather: true,
  muted: false,
  reducedMotion: false,
  graphics: 'high',
  dayNight: 'cycle',
  showGrid: false,
  analyticsConsent: true,
  textScale: 1,
};

export const emptyExt = (): GameState['ext'] => ({ prep: {}, gardens: {}, showrooms: {}, learning: { day: '', today: 0, correct: 0, answered: 0, seen: {} } });
export const emptyZen = (): GameState['zen'] => ({ fish: {}, lastFish: 0, pets: {}, moments: {}, lastMoment: 0 });

export function createNewGame(now: number, seed = Math.floor(Math.random() * 2 ** 31), settings: Partial<Settings> = {}): GameState {
  let uid = 0;
  const buildings: BuildingInstance[] = WORLD.layout.map(([type, x, z, rot = 0]) => ({
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
    fp: BUILDINGS[type] ? [...BUILDINGS[type].footprint] : undefined,
  }));
  const starters = Object.values(RESIDENTS).filter((r) => r.arrival.type === 'start');
  return {
    version: SAVE_VERSION,
    seed,
    profile: { name: 'Neighbor', hoodName: WORLD.hoodName, avatar: WORLD.avatar, createdAt: now },
    coins: 150,
    gems: 10,
    xp: 0,
    level: 1,
    inventory: {},
    buildings,
    plots: [...START_PLOTS],
    residents: starters.map((r) => ({ id: r.id, arrivedAt: now, friendship: 0, memories: {}, lastTalkDay: null, lastGiftDay: null, storyDone: [], storyActive: null })),
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
    community: { projectId: COMMUNITY_PROJECTS[0]?.id ?? 'none', contributed: {}, ops: [], log: [], completedAt: null, rewardClaimed: false },
    event: null,
    history: [{ t: now, icon: 'home', key: 'history.start', params: { world: WORLD.id } }],
    uidCounter: uid,
    lastSeen: now,
    lastSessionStart: now,
    sessions: 1,
    settings: { ...DEFAULT_SETTINGS, ...settings },
    world: { id: WORLD.id, country: WORLD.country },
    ext: emptyExt(),
    zen: emptyZen(),
  };
}
