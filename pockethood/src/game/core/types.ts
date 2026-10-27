// Core game types. All game state is plain, JSON-serialisable data so it can be
// persisted, migrated, diffed, simulated headlessly and (later) validated server-side.

export type ItemId = string;
export type BuildingTypeId = string;
export type ResidentId = string;
export type RecipeId = string;
export type QuestId = string;

export type ItemBag = Record<ItemId, number>;

export interface Cost {
  coins?: number;
  gems?: number;
  items?: ItemBag;
}

export interface Reward {
  coins?: number;
  gems?: number;
  xp?: number;
  items?: ItemBag;
  /** Decoration / keepsake ids unlocked for the build catalog. */
  unlocks?: BuildingTypeId[];
  friendship?: { resident: ResidentId; points: number };
}

export type BuildingCategory = 'residential' | 'commercial' | 'community' | 'production' | 'decoration' | 'path' | 'landmark';

/** Rotation in quarter turns. 0 = door faces +Z (towards the camera / street). */
export type Rotation = 0 | 1 | 2 | 3;

// ─── Content definitions (data-driven, see src/data) ──────────────────────────

export interface ItemDef {
  id: ItemId;
  name: string;
  /** Coin value used for selling and order pricing. */
  value: number;
  /** Food-kit model rendered as the icon / display prop, or an icon key. */
  icon: string;
  kind: 'good' | 'material';
  description: string;
  /** Module that supplied this item (absent for core/world items). */
  module?: string;
}

export interface RecipeDef {
  id: RecipeId;
  name: string;
  building: BuildingTypeId;
  /** Building level that unlocks this recipe. */
  level: number;
  inputs: ItemBag;
  /** Coins spent on ingredients (seeds, beans, flour) when production starts. */
  coins?: number;
  output: ItemId;
  qty: number;
  seconds: number;
  xp: number;
  module?: string;
}

export interface BuildingLevelDef {
  /** Cost to upgrade *to* this level (ignored for level 1, which uses the build cost). */
  upgradeCost: Cost;
  /** Production queue slots. */
  slots: number;
  /** Production speed multiplier. */
  speed: number;
  /** Passive income per cycle (rent / tips). */
  passive?: { coins: number; seconds: number; cycles: number };
  xp: number;
  /** Player-facing description of what this level changes, including visuals. */
  perks: string[];
}

export interface BuildingDef {
  id: BuildingTypeId;
  name: string;
  category: BuildingCategory;
  description: string;
  footprint: [number, number];
  unlockLevel: number;
  cost: Cost;
  xp: number;
  /** Max instances allowed (undefined = unlimited). */
  maxCount?: number;
  levels: BuildingLevelDef[];
  /** Render archetype key for the architecture kit / model registry. */
  archetype: string;
  /** Gameplay template (Layer B) this building runs; modules dress buildings by template. */
  template?: import('../../platform/content/templates').TemplateId;
  /** Resident who moves in / starts working when this building first exists. */
  resident?: ResidentId;
  /** Hidden from the catalog until unlocked by a reward (keepsakes). */
  keepsake?: boolean;
  /** Not offered in this world's build catalog (existing instances keep working). */
  hidden?: boolean;
  /** Can be walked over (paths). */
  walkable?: boolean;
  /** Neighborhood charm added when placed. */
  charm?: number;
  sellRefund?: number;
}

export type Trait = 'sociable' | 'creative' | 'energetic' | 'calm' | 'curious' | 'organised' | 'warm' | 'adventurous';

export interface DialogueLine {
  text: string;
  /** Minimum friendship level for the line. */
  minLevel?: number;
  /** Requires the resident to remember this memory key. */
  memory?: string;
  /** Time-of-day window. */
  phase?: DayPhase;
}

export interface ResidentDef {
  id: ResidentId;
  name: string;
  profession: string;
  bio: string;
  traits: Trait[];
  model: string;
  /** Hex colour used for UI accents / name tag. */
  color: string;
  workplace?: BuildingTypeId;
  favorites: ItemId[];
  favoritePlace: BuildingTypeId | 'park' | 'pond';
  arrival: { type: 'start' } | { type: 'building'; building: BuildingTypeId } | { type: 'level'; level: number };
  /** Profession behaviour used by the animation state machine while working. */
  workAction: 'interact' | 'pick-up' | 'emote-yes' | 'crouch';
  greetings: DialogueLine[];
  smallTalk: DialogueLine[];
  /** Lines unlocked by remembering shared history. */
  memoryLines: DialogueLine[];
  giftReactions: { love: string; like: string; neutral: string };
}

export type DayPhase = 'morning' | 'day' | 'evening' | 'night';

// ─── Objectives, quests, stories ──────────────────────────────────────────────

export type Objective =
  | { type: 'counter'; counter: string; n: number; label: string }
  | { type: 'build'; building: BuildingTypeId; n: number; label: string }
  | { type: 'upgrade'; building: BuildingTypeId; level: number; label: string }
  | { type: 'level'; level: number; label: string }
  | { type: 'deliver'; items: ItemBag; to: ResidentId; label: string }
  | { type: 'friendship'; resident: ResidentId; level: number; label: string };

export interface QuestDef {
  id: QuestId;
  title: string;
  giver: ResidentId;
  intro: string;
  outro: string;
  objectives: Objective[];
  reward: Reward;
  /** Quest ids that must be complete first. */
  after?: QuestId[];
  minLevel?: number;
  /** Part of the guided first session. */
  tutorial?: boolean;
  /** Buildings or recipes highlighted for guidance. */
  focus?: { building?: BuildingTypeId; panel?: string };
  /** Short reason shown by the tutorial guide. */
  why?: string;
  module?: string;
}

export interface StoryChapterDef {
  id: string;
  resident: ResidentId;
  title: string;
  /** Friendship level required to start. */
  minFriendship: number;
  requires?: { building?: BuildingTypeId; quest?: QuestId; chapter?: string; level?: number };
  intro: string;
  outro: string;
  objectives: Objective[];
  reward: Reward;
  /** Memory the resident keeps afterwards. */
  memory: string;
  /** Visible world change, described for the history log. */
  worldChange?: string;
  /** Flag set in world.flags that the renderer uses to show the change. */
  flag?: string;
}

export interface LevelDef {
  level: number;
  xp: number;
  unlocks: string[];
}

export interface ExpansionDef {
  id: string;
  name: string;
  /** Plot rectangle in cells: x, z, w, d. */
  rect: [number, number, number, number];
  cost: Cost;
  minLevel: number;
  adjacentTo: string[];
}

export interface CommunityProjectDef {
  id: string;
  name: string;
  description: string;
  requirements: ItemBag & { coins?: number };
  stages: { at: number; label: string }[];
  reward: Reward;
  minLevel: number;
  /** World flag set on completion (the renderer shows the finished landmark). */
  flag: string;
}

export interface EventDef {
  id: string;
  name: string;
  description: string;
  minLevel: number;
  durationDays: number;
  objectives: Objective[];
  /** Reward tiers by number of objectives completed. */
  tiers: { at: number; reward: Reward; label: string }[];
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  counter?: string;
  n: number;
  /** Optional custom predicate key for state-based achievements. */
  check?: string;
  reward: Reward;
}

// ─── Runtime state ────────────────────────────────────────────────────────────

export interface ProductionJob {
  recipe: RecipeId;
  /** Absolute start time (ms). Jobs run sequentially; start = previous end. */
  start: number;
  end: number;
  /** Output snapshot taken when production started, so a job still pays out if its content is later withdrawn. */
  out?: { item: ItemId; qty: number; xp: number };
}

export interface BuildingInstance {
  uid: string;
  type: BuildingTypeId;
  x: number;
  z: number;
  rot: Rotation;
  level: number;
  /** Construction / upgrade completes at this time (ms). null = idle. */
  busyUntil: number | null;
  busyKind: 'build' | 'upgrade' | null;
  /** When the current construction/upgrade started (for progress display). */
  busyFrom?: number;
  /** Jobs run sequentially; finished jobs wait in the queue until collected. */
  queue: ProductionJob[];
  /** Passive income accounting. */
  passiveSince: number;
  placedAt: number;
  /** Footprint snapshot, so the grid stays correct even if the building's content is unavailable. */
  fp?: [number, number];
}

export interface Order {
  id: string;
  resident: ResidentId;
  items: ItemBag;
  reward: Reward;
  createdAt: number;
  /** Order slot reopens at this time after completion/skip. */
}

export interface ActiveQuest {
  id: QuestId;
  startedAt: number;
  /** Counter baselines captured when the quest started. */
  baseline: Record<string, number>;
  /** Items already handed in for 'deliver' objectives. */
  delivered?: ItemBag;
}

export interface ResidentState {
  id: ResidentId;
  arrivedAt: number;
  friendship: number;
  /** Persistent memories: key -> time remembered. */
  memories: Record<string, number>;
  lastTalkDay: string | null;
  lastGiftDay: string | null;
  storyDone: string[];
  storyActive: ActiveQuest | null;
}

export interface PulseTask {
  id: string;
  kind: 'practical' | 'resident' | 'creative';
  /** i18n key + params (resolved at display time, so a language switch applies). */
  key: string;
  params?: TextParams;
  /** Legacy English label from saves before v4. */
  label?: string;
  counter: string;
  n: number;
  baseline: number;
  reward: Reward;
  claimed: boolean;
}

export interface PulseState {
  day: string;
  tasks: PulseTask[];
  bonusClaimed: boolean;
}

/** Placeholder values; ids named building/resident/item/… are resolved to names at display time. */
export type TextParams = Record<string, string | number>;

export interface HistoryEntry {
  t: number;
  icon: string;
  key?: string;
  params?: TextParams;
  /** Legacy English text from saves before v4. */
  text?: string;
}

export interface CommunityState {
  projectId: string;
  contributed: ItemBag & { coins?: number };
  /** Contribution op ids already applied (idempotency). */
  ops: string[];
  log: { t: number; who: string; what: string }[];
  completedAt: number | null;
  rewardClaimed: boolean;
}

export interface EventState {
  id: string;
  startedAt: number;
  baseline: Record<string, number>;
  claimedTiers: number[];
}

export interface Settings {
  musicVolume: number;
  /** Interface sounds (taps, coins, confirmations). */
  sfxVolume: number;
  ambienceVolume: number;
  characterVolume: number;
  locale: 'en' | 'ms';
  /** Zen Mode: no currencies, objectives, notifications or promotions on screen. */
  zen: boolean;
  weather: boolean;
  muted: boolean;
  reducedMotion: boolean;
  graphics: 'low' | 'medium' | 'high';
  dayNight: 'cycle' | 'local' | 'day';
  showGrid: boolean;
  analyticsConsent: boolean;
  textScale: number;
}

export interface PlayerProfile {
  name: string;
  hoodName: string;
  avatar: string;
  createdAt: number;
}

export interface GameState {
  version: number;
  seed: number;
  profile: PlayerProfile;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  inventory: ItemBag;
  buildings: BuildingInstance[];
  /** Unlocked expansion plot ids. */
  plots: string[];
  residents: ResidentState[];
  orders: Order[];
  /** Order slots that are cooling down: reopen time per slot. */
  orderCooldowns: number[];
  orderCounter: number;
  quests: { active: ActiveQuest[]; done: QuestId[] };
  tutorial: { step: number; done: boolean; skipped: boolean };
  stats: Record<string, number>;
  achievements: string[];
  /** Decorations/keepsakes unlocked by rewards. */
  unlocked: BuildingTypeId[];
  flags: Record<string, boolean>;
  pulse: PulseState | null;
  community: CommunityState;
  event: EventState | null;
  history: HistoryEntry[];
  uidCounter: number;
  lastSeen: number;
  lastSessionStart: number;
  sessions: number;
  settings: Settings;
  /** Which world pack (district) this save belongs to. */
  world: { id: string; country: string };
  /** Per-building behaviour state, keyed by building uid (kept even if a module is switched off). */
  ext: {
    prep: Record<string, number>;
    gardens: Record<string, GardenPlot[]>;
    showrooms: Record<string, ShowroomSlot[]>;
    learning: { day: string; today: number; correct: number; answered: number; seen: Record<string, number> };
  };
  zen: ZenState;
}

export interface GardenPlot {
  plant: string | null;
  plantedAt: number;
  /** Each watering (max 3) brings the harvest closer. */
  water: number;
  lastWater: number;
}

export interface ShowroomSlot {
  model: string;
  paint: string;
}

export interface ZenState {
  /** Fish journal: species -> times seen (catch-and-release, no currency). */
  fish: Record<string, number>;
  lastFish: number;
  /** Pet -> last day fed. */
  pets: Record<string, string>;
  /** Calm moments by kind (sunset watched, sat by the lake, flowers arranged). */
  moments: Record<string, number>;
  lastMoment: number;
}

// ─── Events emitted by the simulation (consumed by engagement, audio, FX, analytics) ─

export type GameEvent =
  | { type: 'BUILDING_PLACED'; uid: string; building: BuildingTypeId }
  | { type: 'BUILDING_CONSTRUCTED'; uid: string; building: BuildingTypeId }
  | { type: 'BUILDING_UPGRADED'; uid: string; building: BuildingTypeId; level: number }
  | { type: 'BUILDING_MOVED'; uid: string }
  | { type: 'BUILDING_SOLD'; uid: string; building: BuildingTypeId }
  | { type: 'DECORATION_PLACED'; uid: string; building: BuildingTypeId }
  | { type: 'RESOURCE_COLLECTED'; uid: string; coins: number; items: ItemBag; xp: number }
  | { type: 'PRODUCTION_STARTED'; uid: string; recipe: RecipeId }
  | { type: 'ORDER_COMPLETED'; order: Order }
  | { type: 'ORDER_SKIPPED'; order: Order }
  | { type: 'RESIDENT_ARRIVED'; resident: ResidentId }
  | { type: 'RESIDENT_INTERACTED'; resident: ResidentId; line: string }
  | { type: 'GIFT_GIVEN'; resident: ResidentId; item: ItemId; reaction: 'love' | 'like' | 'neutral'; line: string }
  | { type: 'FRIENDSHIP_UP'; resident: ResidentId; level: number }
  | { type: 'QUEST_STARTED'; quest: QuestId }
  | { type: 'QUEST_COMPLETED'; quest: QuestId; reward: Reward }
  | { type: 'STORY_STARTED'; chapter: string; resident: ResidentId }
  | { type: 'STORY_MILESTONE_COMPLETED'; chapter: string; resident: ResidentId; reward: Reward }
  | { type: 'LEVEL_UP'; level: number; unlocks: string[] }
  | { type: 'XP_GAINED'; amount: number }
  | { type: 'COINS_CHANGED'; delta: number }
  | { type: 'DISTRICT_UNLOCKED'; plot: string }
  | { type: 'COMMUNITY_PROJECT_CONTRIBUTED'; project: string; what: string; stage: number }
  | { type: 'LANDMARK_COMPLETED'; project: string }
  | { type: 'PULSE_TASK_DONE'; task: string }
  | { type: 'PULSE_COMPLETE' }
  | { type: 'ACHIEVEMENT'; id: string }
  | { type: 'EVENT_TIER'; event: string; tier: number }
  | { type: 'PHOTO_TAKEN' }
  | { type: 'ITEM_SOLD'; item: ItemId; qty: number; coins: number }
  | { type: 'UNLOCKED'; what: string }
  | { type: 'HAND_PREPARED'; uid: string; recipe: RecipeId; item: ItemId }
  | { type: 'QUIZ_ANSWERED'; uid: string; question: string; correct: boolean }
  | { type: 'SHOWROOM_ARRANGED'; uid: string; slot: number }
  | { type: 'PLANTED'; uid: string; plot: number; plant: string }
  | { type: 'WATERED'; uid: string; plot: number }
  | { type: 'HARVESTED'; uid: string; plot: number; items: ItemBag }
  | { type: 'FISH_SEEN'; species: string; first: boolean }
  | { type: 'PET_FED'; pet: string }
  | { type: 'ZEN_MOMENT'; kind: string };

export interface ActionResult {
  state: GameState;
  events: GameEvent[];
  /** i18n key (errors.*) describing why the action was refused. */
  error?: string;
  errorParams?: TextParams;
}
