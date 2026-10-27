// Strict schemas for every piece of downloadable content: the content index, country
// records, world packs (a district for a country) and modules (Layer C). Content is data
// only: unknown fields, unknown behaviours, markup, script URLs and oversize values are
// rejected before anything reaches the game.
import {
  AMBIENT_SOUNDS,
  ARCHETYPES,
  CATEGORIES,
  CHARACTER_MODELS,
  ICONS,
  PANELS,
  PREFABS,
  PREP_STEPS,
  PROPS,
  TRAITS,
  VEHICLE_MODELS,
  WORK_ACTIONS,
} from './catalog';
import { TEMPLATE_IDS } from './templates';
import { COUNTRY, HEX, ID, ISO_DATE, LOCALE, SEMVER, SHA256, arr, bool, lit, num, obj, opt, rec, str, tagged, text, type Schema } from '../validate';

export const SCHEMA_VERSION = 1;

export type LText = string | Record<string, string>;

const int = (min: number, max: number) => num({ min, max, int: true });
/** Local ids inside one module ("teh_tarik"). */
const LOCAL_ID = str({ min: 2, max: 40, pattern: /^[a-z0-9][a-z0-9_]*$/, label: 'local id: a-z 0-9 _' });
/** Item references: core/world ids ("bread") or module-local ids, resolved at compile time. */
const ITEM_REF = str({ min: 2, max: 90, pattern: /^[a-z0-9][a-z0-9._/-]*$/, label: 'item id' });
const COUNTER = str({ max: 100, pattern: /^[a-z_]+(:[a-z0-9_./-]+)?$/, label: 'counter key' });
const ITEM_BAG = rec(ITEM_REF, int(1, 50), { max: 6 });
const PHASE = lit('morning', 'day', 'evening', 'night');

// ─── Shared gameplay shapes ───────────────────────────────────────────────────

export const rewardSchema = obj({
  coins: opt(int(0, 5000)),
  gems: opt(int(0, 20)),
  xp: opt(int(0, 500)),
  items: opt(ITEM_BAG),
  unlocks: opt(arr(ID, { max: 4 })),
  friendship: opt(obj({ resident: ID, points: int(1, 20) })),
});

export const objectiveSchema = tagged('type', {
  counter: obj({ type: lit('counter'), counter: COUNTER, n: int(1, 500), label: text(80) }),
  build: obj({ type: lit('build'), building: ID, n: int(1, 10), label: text(80) }),
  upgrade: obj({ type: lit('upgrade'), building: ID, level: int(2, 5), label: text(80) }),
  level: obj({ type: lit('level'), level: int(2, 60), label: text(80) }),
  deliver: obj({ type: lit('deliver'), items: ITEM_BAG, to: ID, label: text(80) }),
  friendship: obj({ type: lit('friendship'), resident: ID, level: int(1, 5), label: text(80) }),
});

export const questSchema = obj({
  id: ID,
  title: text(48),
  giver: ID,
  intro: text(320),
  outro: text(320),
  objectives: arr(objectiveSchema, { min: 1, max: 4 }),
  reward: rewardSchema,
  after: opt(arr(ID, { max: 4 })),
  minLevel: opt(int(1, 60)),
  tutorial: opt(bool()),
  focus: opt(obj({ building: opt(ID), panel: opt(lit(...PANELS)) })),
  /** Optional coaching line explaining *why* (shown by the guide during tutorials). */
  why: opt(text(140)),
});

export const storySchema = obj({
  id: ID,
  resident: ID,
  title: text(48),
  minFriendship: int(0, 5),
  requires: opt(obj({ building: opt(ID), quest: opt(ID), chapter: opt(ID), level: opt(int(1, 60)) })),
  intro: text(320),
  outro: text(320),
  objectives: arr(objectiveSchema, { min: 1, max: 3 }),
  reward: rewardSchema,
  memory: ID,
  worldChange: opt(text(160)),
  flag: opt(ID),
});

const line = obj({ text: text(220), minLevel: opt(int(0, 5)), memory: opt(ID), phase: opt(PHASE) });

export const residentSchema = obj({
  id: ID,
  name: text(24),
  profession: text(40),
  bio: text(260),
  traits: arr(lit(...TRAITS), { min: 1, max: 3 }),
  model: lit(...CHARACTER_MODELS),
  color: HEX,
  workplace: opt(ID),
  favorites: arr(ITEM_REF, { max: 4 }),
  favoritePlace: ID,
  arrival: tagged('type', {
    start: obj({ type: lit('start') }),
    building: obj({ type: lit('building'), building: ID }),
    level: obj({ type: lit('level'), level: int(1, 60) }),
  }),
  workAction: lit(...WORK_ACTIONS),
  greetings: arr(line, { min: 1, max: 12 }),
  smallTalk: arr(line, { min: 1, max: 16 }),
  memoryLines: arr(line, { max: 16 }),
  giftReactions: obj({ love: text(160), like: text(160), neutral: text(160) }),
});

export const eventSchema = obj({
  id: ID,
  name: text(48),
  description: text(320),
  minLevel: int(1, 60),
  durationDays: int(1, 30),
  objectives: arr(objectiveSchema, { min: 1, max: 6 }),
  tiers: arr(obj({ at: int(1, 6), reward: rewardSchema, label: text(40) }), { min: 1, max: 6 }),
});

export const projectSchema = obj({
  id: ID,
  name: text(48),
  description: text(320),
  requirements: rec(ITEM_REF, int(1, 2000), { max: 6 }),
  stages: arr(obj({ at: num({ min: 0.05, max: 1 }), label: text(40) }), { min: 1, max: 6 }),
  reward: rewardSchema,
  minLevel: int(1, 60),
  /** World flag set on completion (the renderer shows the landmark). */
  flag: ID,
});

// ─── Country registry ─────────────────────────────────────────────────────────

export const countrySchema = obj({
  schemaVersion: lit(SCHEMA_VERSION),
  code: COUNTRY,
  name: text(40),
  status: lit('active', 'planned', 'paused'),
  locales: arr(LOCALE, { min: 1, max: 6 }),
  defaultLocale: LOCALE,
  currency: obj({ code: str({ min: 3, max: 3, pattern: /^[A-Z]{3}$/ }), symbol: str({ max: 4 }), minorUnits: int(0, 3) }),
  timezone: str({ max: 40, pattern: /^[A-Za-z_]+\/[A-Za-z_]+$/, label: 'IANA zone' }),
  worlds: arr(ID, { max: 8 }),
  compliance: obj({
    /** Halal/religious-compliance claims require a verified certificate record. */
    certifiedClaimsRequireVerification: bool(),
    /** Real-world prices may only show if supplied and verified by the partner. */
    pricesRequireVerification: bool(),
    notes: opt(text(400)),
  }),
});

// ─── World pack (a district for a country) ───────────────────────────────────

const buildingOverride = obj({
  name: opt(text(40)),
  description: opt(text(220)),
  perks: opt(arr(arr(text(80), { max: 6 }), { max: 5 })),
  archetype: opt(lit(...ARCHETYPES)),
  resident: opt(ID),
  hidden: opt(bool()),
  unlockLevel: opt(int(1, 99)),
});

export const worldSchema = obj({
  schemaVersion: lit(SCHEMA_VERSION),
  id: ID,
  version: SEMVER,
  country: COUNTRY,
  locales: arr(LOCALE, { min: 1, max: 6 }),
  name: text(40),
  tagline: text(140),
  hoodName: text(32),
  avatar: lit(...CHARACTER_MODELS),
  environment: obj({
    biome: lit('temperate', 'tropical'),
    rainChance: num({ min: 0, max: 1 }),
  }),
  buildings: rec(ID, buildingOverride, { max: 80 }),
  items: rec(ID, obj({ name: opt(text(32)), description: opt(text(160)), icon: opt(lit(...ICONS)) }), { max: 60 }),
  recipes: rec(ID, obj({ name: text(32) }), { max: 60 }),
  residents: arr(residentSchema, { min: 1, max: 16, unique: (r) => r.id }),
  quests: arr(questSchema, { min: 1, max: 80, unique: (q) => q.id }),
  stories: arr(storySchema, { max: 80, unique: (s) => s.id }),
  events: arr(eventSchema, { max: 6, unique: (e) => e.id }),
  project: projectSchema,
  expansionNames: arr(text(24), { min: 12, max: 12 }),
  levelUnlocks: rec(str({ max: 2, pattern: /^\d{1,2}$/ }), arr(text(60), { max: 6 }), { max: 30 }),
  achievements: rec(ID, obj({ name: text(40), description: text(120) }), { max: 40 }),
  layout: arr(obj({ type: ID, x: int(0, 23), z: int(0, 23), rot: opt(lit(0, 1, 2, 3)) }), { min: 1, max: 140 }),
  history: text(120),
});

// ─── Module (Layer C) ─────────────────────────────────────────────────────────

const moduleItem = obj({ id: LOCAL_ID, name: text(32), description: text(160), icon: lit(...ICONS), value: int(1, 200) });
const moduleRecipe = obj({
  id: LOCAL_ID,
  item: ITEM_REF,
  level: int(1, 3),
  inputs: opt(ITEM_BAG),
  coins: opt(int(0, 50)),
  seconds: int(5, 3600),
  qty: int(1, 5),
  xp: int(1, 20),
});

export const behaviorSchema = tagged('type', {
  hand_prepare: obj({
    type: lit('hand_prepare'),
    recipe: LOCAL_ID,
    steps: arr(lit(...PREP_STEPS), { min: 3, max: 6 }),
    cooldownSeconds: int(30, 3600),
    tip: opt(text(160)),
  }),
  quiz: obj({
    type: lit('quiz'),
    topic: text(60),
    dailyLimit: int(1, 10),
    questions: arr(
      obj({ id: LOCAL_ID, prompt: text(180), choices: arr(text(70), { min: 2, max: 4 }), answer: int(0, 3), explain: text(240) }),
      { min: 3, max: 60, unique: (q) => q.id },
    ),
  }),
  showroom: obj({
    type: lit('showroom'),
    slots: int(1, 4),
    models: arr(lit(...VEHICLE_MODELS), { min: 1, max: 7 }),
    paints: arr(obj({ id: LOCAL_ID, name: text(24), hex: HEX }), { min: 2, max: 8 }),
  }),
  garden_plots: obj({
    type: lit('garden_plots'),
    plots: int(2, 6),
    plants: arr(
      obj({ id: LOCAL_ID, name: text(32), icon: lit(...ICONS), growSeconds: int(60, 86_400), yields: ITEM_REF, qty: int(1, 4), color: HEX }),
      { min: 1, max: 8, unique: (p) => p.id },
    ),
  }),
  visitors: obj({ type: lit('visitors'), perHour: int(1, 12) }),
  ambient_sound: obj({ type: lit('ambient_sound'), sound: lit(...AMBIENT_SOUNDS) }),
});

const https = str({ max: 300, pattern: /^https:\/\/[a-z0-9.-]+(\/[A-Za-z0-9._~%/?=&#-]*)?$/, label: 'https URL' });

export const realWorldSchema = obj({
  menu: opt(
    obj({
      currency: str({ min: 3, max: 3, pattern: /^[A-Z]{3}$/ }),
      version: SEMVER,
      source: lit('partner_supplied', 'illustrative'),
      verifiedAt: opt(ISO_DATE),
      verifiedBy: opt(str({ max: 80 })),
      items: arr(
        obj({ name: text(60), description: opt(text(160)), priceMinor: opt(int(0, 10_000_000)), available: opt(bool()) }),
        { min: 1, max: 40 },
      ),
    }),
  ),
  halal: opt(
    obj({
      status: lit('certified', 'not_certified', 'not_stated'),
      certifier: opt(str({ max: 80 })),
      certificateRef: opt(str({ max: 60 })),
      verifiedAt: opt(ISO_DATE),
      expires: opt(ISO_DATE),
    }),
  ),
  links: opt(arr(obj({ label: text(40), url: https }), { max: 3 })),
  notice: opt(text(240)),
});

export const moduleSchema = obj({
  schemaVersion: lit(SCHEMA_VERSION),
  id: str({ min: 5, max: 64, pattern: /^[a-z]{2}\.[a-z0-9_]+\.[a-z0-9_]+$/, label: 'cc.category.name' }),
  version: SEMVER,
  kind: lit('business', 'community'),
  category: lit(...CATEGORIES),
  template: lit(...TEMPLATE_IDS),
  /** The core building this module dresses (must run the same template). */
  slot: ID,
  country: COUNTRY,
  locales: arr(LOCALE, { min: 1, max: 6 }),
  name: text(40),
  tagline: text(100),
  description: text(400),
  brand: obj({
    kind: lit('fictional', 'licensed'),
    signText: text(22),
    palette: obj({ primary: HEX, secondary: HEX, accent: HEX }),
    licence: opt(obj({ holder: str({ max: 80 }), agreementRef: str({ max: 60 }), expires: ISO_DATE })),
  }),
  sponsor: opt(
    obj({
      partnerId: ID,
      label: lit('sponsored_experience', 'official_partner'),
      verified: bool(),
      verifiedAt: opt(ISO_DATE),
      contractRef: opt(str({ max: 60 })),
    }),
  ),
  approval: obj({
    state: lit('draft', 'in_review', 'approved', 'rejected', 'retired'),
    reviewedBy: opt(str({ max: 80 })),
    reviewedAt: opt(ISO_DATE),
    notes: opt(text(300)),
  }),
  activation: obj({
    from: opt(ISO_DATE),
    until: opt(ISO_DATE),
    minGameVersion: SEMVER,
    maxGameVersion: opt(SEMVER),
    flags: opt(arr(ID, { max: 4 })),
  }),
  presentation: obj({
    prefab: lit(...PREFABS),
    props: opt(arr(lit(...PROPS), { max: 6 })),
    staff: opt(ID),
    greeting: opt(text(160)),
  }),
  items: arr(moduleItem, { max: 12, unique: (i) => i.id }),
  recipes: arr(moduleRecipe, { max: 12, unique: (r) => r.id }),
  behaviors: arr(behaviorSchema, { max: 6 }),
  quests: opt(arr(questSchema, { max: 6, unique: (q) => q.id })),
  realWorld: opt(realWorldSchema),
  licensing: obj({
    content: lit('original', 'licensed'),
    assets: arr(obj({ id: str({ max: 60 }), licence: lit('CC0-1.0', 'CC-BY-4.0', 'OFL-1.1', 'original', 'partner-licensed'), source: str({ max: 120 }) }), { max: 20 }),
  }),
});

// ─── Content index ────────────────────────────────────────────────────────────

const fileRef = { path: str({ max: 120, pattern: /^(?!.*\.\.)[a-z0-9][a-z0-9_./-]*\.json$/, label: 'relative .json path (no ..)' }), sha256: SHA256, bytes: int(2, 512_000) };

export const indexSchema = obj({
  schemaVersion: lit(SCHEMA_VERSION),
  contentVersion: SEMVER,
  generatedAt: ISO_DATE,
  minGameVersion: SEMVER,
  defaultCountry: COUNTRY,
  countries: arr(obj({ code: COUNTRY, ...fileRef }), { min: 1, max: 20 }),
  worlds: arr(obj({ id: ID, country: COUNTRY, ...fileRef }), { max: 20 }),
  modules: arr(
    obj({ id: str({ min: 5, max: 64 }), version: SEMVER, enabled: bool(), rolloutPercent: opt(int(0, 100)), ...fileRef }),
    { max: 200, unique: (m) => m.id },
  ),
  /** Remote kill switch: listed modules are switched off immediately, falling back to neutral. */
  killSwitch: obj({ modules: arr(str({ max: 64 }), { max: 200 }), reason: opt(str({ max: 200 })) }),
  flags: rec(ID, bool(), { max: 50 }),
});

// Inferred shapes (validated data is exactly this).
type Of<S> = S extends Schema<infer T> ? T : never;
export type ContentIndex = Of<typeof indexSchema>;
export type CountryRecord = Of<typeof countrySchema>;
export type WorldPack = Of<typeof worldSchema>;
export type ModuleManifest = Of<typeof moduleSchema>;
export type ModuleBehavior = Of<typeof behaviorSchema>;
export type RealWorldInfo = Of<typeof realWorldSchema>;
