// Content installation: core data (Layer A defaults) + a world pack (country district) +
// approved modules (Layer C) → the live registries the engine and renderer read.
//
// Installation is all-or-nothing per piece: a world pack with broken references is refused
// (the neutral core world stays), a module that fails a semantic or economic check is
// quarantined (its building reverts to the template's neutral presentation). Player state is
// never touched here.
import { BUILDINGS } from '../../data/buildings';
import { ITEMS, RECIPES } from '../../data/items';
import { CORE_QUIZ, CORE_SHOWROOM } from '../../data/neutral';
import { ACHIEVEMENTS, COMMUNITY_PROJECTS, EVENTS, EXPANSIONS, LEVELS, QUESTS, STORIES } from '../../data/progression';
import { RESIDENTS } from '../../data/residents';
import { WORLD, type WorldInfo } from '../../data/world';
import type { BuildingDef, ItemDef, Objective, QuestDef, RecipeDef, ResidentDef, Reward, StoryChapterDef } from '../../game/core/types';
import type { Lang } from '../i18n';
import { LINK_HOST_ALLOWLIST } from './catalog';
import { BLOCKED_TAGS, CONTENT_TAGS, describeIssue, scanDocument } from './policy';
import { CORE_OVERLAY_MS } from './coreOverlay.ms';
import type { LText, ModuleManifest, WorldPack } from './schema';
import { TEMPLATES, type TemplateId } from './templates';

// ─── Localised text ───────────────────────────────────────────────────────────

/** Resolve localised text: exact language, then English, then the first entry. */
export function L(v: LText | undefined, lang: Lang): string {
  if (v === undefined) return '';
  if (typeof v === 'string') return v;
  const keys = Object.keys(v);
  const hit = keys.find((k) => k.toLowerCase().split('-')[0] === lang) ?? keys.find((k) => k.toLowerCase().startsWith('en')) ?? keys[0];
  return hit ? v[hit] : '';
}

// ─── Core snapshot (taken once, before anything is installed) ────────────────

const clone = <T>(x: T): T => structuredClone(x);
const CORE = {
  buildings: clone(BUILDINGS),
  items: clone(ITEMS),
  recipes: clone(RECIPES),
  residents: clone(RESIDENTS),
  quests: clone(QUESTS),
  stories: clone(STORIES),
  events: clone(EVENTS),
  projects: clone(COMMUNITY_PROJECTS),
  achievements: clone(ACHIEVEMENTS),
  levels: clone(LEVELS),
  expansions: clone(EXPANSIONS),
  world: clone(WORLD),
};

function replaceRecord<T>(target: Record<string, T>, src: Record<string, T>) {
  for (const k of Object.keys(target)) delete target[k];
  for (const [k, v] of Object.entries(src)) target[k] = clone(v);
}
function replaceArray<T>(target: T[], src: T[]) {
  target.splice(0, target.length, ...src.map(clone));
}

function resetToCore() {
  replaceRecord(BUILDINGS, CORE.buildings);
  replaceRecord(ITEMS, CORE.items);
  replaceRecord(RECIPES, CORE.recipes);
  replaceRecord(RESIDENTS, CORE.residents);
  replaceArray(QUESTS, CORE.quests);
  replaceArray(STORIES, CORE.stories);
  replaceArray(EVENTS, CORE.events);
  replaceArray(COMMUNITY_PROJECTS, CORE.projects);
  replaceArray(ACHIEVEMENTS, CORE.achievements);
  replaceArray(LEVELS, CORE.levels);
  replaceArray(EXPANSIONS, CORE.expansions);
  Object.assign(WORLD, clone(CORE.world));
}

// ─── Active modules & behaviours (read by engine, UI and renderer) ───────────

export type ResolvedBehavior =
  | { type: 'hand_prepare'; recipe: string; steps: string[]; cooldownSeconds: number; tip: string }
  | { type: 'quiz'; topic: string; dailyLimit: number; questions: { id: string; prompt: string; choices: string[]; answer: number; explain: string }[] }
  | { type: 'showroom'; slots: number; models: string[]; paints: { id: string; name: string; hex: string }[] }
  | { type: 'garden_plots'; plots: number; plants: { id: string; name: string; icon: string; growSeconds: number; yields: string; qty: number; color: string }[] }
  | { type: 'visitors'; perHour: number }
  | { type: 'ambient_sound'; sound: string };

export interface ActiveModule {
  id: string;
  version: string;
  template: TemplateId;
  slot: string;
  kind: 'business' | 'community';
  name: string;
  tagline: string;
  description: string;
  brand: { kind: 'fictional' | 'licensed'; signText: string; palette: { primary: string; secondary: string; accent: string } };
  /** Only set when the sponsorship is verified (see SPONSOR_PLATFORM.md). */
  sponsorLabel: 'sponsored_experience' | 'official_partner' | null;
  prefab: string;
  props: string[];
  staff?: string;
  greeting: string;
  items: string[];
  recipes: string[];
  quests: string[];
  behaviors: ResolvedBehavior[];
  realWorld: ResolvedRealWorld | null;
  warnings: string[];
}

export interface ResolvedRealWorld {
  menu: null | {
    currency: string;
    version: string;
    illustrative: boolean;
    verifiedAt: string | null;
    items: { name: string; description: string; priceMinor: number | null; available: boolean }[];
  };
  /** Only "certified" after the certificate record checks out; otherwise "not_stated". */
  halal: { status: 'certified' | 'not_certified' | 'not_stated'; certifier?: string; certificateRef?: string; verifiedAt?: string; expires?: string };
  links: { label: string; url: string }[];
  notice: string;
}

/** Slot building id → module dressing it. */
export const ACTIVE_MODULES: Record<string, ActiveModule> = {};

const neutralBehaviors = (template: TemplateId | undefined, lang: Lang): ResolvedBehavior[] => {
  if (template === 'learning')
    return [
      {
        type: 'quiz',
        topic: L(CORE_QUIZ.topic, lang),
        dailyLimit: CORE_QUIZ.dailyLimit,
        questions: CORE_QUIZ.questions.map((q) => ({ id: `core/${q.id}`, prompt: L(q.prompt, lang), choices: q.choices.map((c) => L(c, lang)), answer: q.answer, explain: L(q.explain, lang) })),
      },
    ];
  if (template === 'showroom') return [{ type: 'showroom', slots: CORE_SHOWROOM.slots, models: CORE_SHOWROOM.models, paints: CORE_SHOWROOM.paints.map((p) => ({ ...p, name: L(p.name, lang) })) }];
  return [];
};
let NEUTRAL: Record<string, ResolvedBehavior[]> = {};

/** Behaviours a building currently runs: its module's, else its template's neutral defaults. */
export function behaviorsFor(buildingType: string): ResolvedBehavior[] {
  return ACTIVE_MODULES[buildingType]?.behaviors ?? NEUTRAL[buildingType] ?? [];
}
export function behaviorOf<T extends ResolvedBehavior['type']>(buildingType: string, type: T): Extract<ResolvedBehavior, { type: T }> | undefined {
  return behaviorsFor(buildingType).find((b) => b.type === type) as Extract<ResolvedBehavior, { type: T }> | undefined;
}
export const moduleById = (id: string) => Object.values(ACTIVE_MODULES).find((m) => m.id === id);

// ─── World packs ─────────────────────────────────────────────────────────────

const objectiveRefs = (o: { type: string; building?: string; items?: Record<string, number>; to?: string; resident?: string }) => ({
  building: o.building,
  items: o.items ? Object.keys(o.items) : [],
  resident: o.to ?? o.resident,
});

/** Cross-reference checks a schema can't express. Returns errors (empty = ok). */
export function checkWorld(w: WorldPack): string[] {
  const errors: string[] = [];
  const residents = new Set(w.residents.map((r) => r.id));
  const buildings = new Set(Object.keys(CORE.buildings));
  const items = new Set(Object.keys(CORE.items));
  const quests = new Set(w.quests.map((q) => q.id));
  const chapters = new Set(w.stories.map((s) => s.id));
  for (const id of Object.keys(w.buildings)) if (!buildings.has(id)) errors.push(`buildings.${id}: unknown building`);
  for (const id of Object.keys(w.items)) if (!items.has(id)) errors.push(`items.${id}: unknown item`);
  for (const id of Object.keys(w.recipes)) if (!CORE.recipes[id]) errors.push(`recipes.${id}: unknown recipe`);
  for (const [id, o] of Object.entries(w.buildings)) if (o.resident && !residents.has(o.resident)) errors.push(`buildings.${id}.resident: unknown resident ${o.resident}`);
  for (const r of w.residents) {
    if (r.workplace && !buildings.has(r.workplace)) errors.push(`residents.${r.id}.workplace: unknown building`);
    if (r.arrival.type === 'building' && !buildings.has(r.arrival.building)) errors.push(`residents.${r.id}.arrival: unknown building`);
    for (const f of r.favorites) if (!items.has(f)) errors.push(`residents.${r.id}.favorites: unknown item ${f}`);
  }
  if (!w.residents.some((r) => r.arrival.type === 'start')) errors.push('residents: at least one resident must arrive at start');
  const checkObjectives = (where: string, objectives: { type: string }[]) =>
    objectives.forEach((o, i) => {
      const ref = objectiveRefs(o as never);
      if (ref.building && !buildings.has(ref.building)) errors.push(`${where}.objectives[${i}]: unknown building ${ref.building}`);
      for (const it of ref.items) if (!items.has(it)) errors.push(`${where}.objectives[${i}]: unknown item ${it}`);
      if (ref.resident && !residents.has(ref.resident)) errors.push(`${where}.objectives[${i}]: unknown resident ${ref.resident}`);
    });
  const checkReward = (where: string, r: { items?: Record<string, number>; unlocks?: string[]; friendship?: { resident: string } }) => {
    for (const it of Object.keys(r.items ?? {})) if (!items.has(it)) errors.push(`${where}.reward: unknown item ${it}`);
    for (const u of r.unlocks ?? []) if (!buildings.has(u)) errors.push(`${where}.reward: unknown unlock ${u}`);
    if (r.friendship && !residents.has(r.friendship.resident)) errors.push(`${where}.reward: unknown resident`);
  };
  for (const q of w.quests) {
    if (!residents.has(q.giver)) errors.push(`quests.${q.id}.giver: unknown resident ${q.giver}`);
    for (const a of q.after ?? []) if (!quests.has(a)) errors.push(`quests.${q.id}.after: unknown quest ${a}`);
    if (q.focus?.building && !buildings.has(q.focus.building)) errors.push(`quests.${q.id}.focus: unknown building`);
    checkObjectives(`quests.${q.id}`, q.objectives);
    checkReward(`quests.${q.id}`, q.reward);
  }
  for (const s of w.stories) {
    if (!residents.has(s.resident)) errors.push(`stories.${s.id}.resident: unknown resident`);
    if (s.requires?.chapter && !chapters.has(s.requires.chapter)) errors.push(`stories.${s.id}.requires: unknown chapter`);
    if (s.requires?.quest && !quests.has(s.requires.quest)) errors.push(`stories.${s.id}.requires: unknown quest`);
    if (s.requires?.building && !buildings.has(s.requires.building)) errors.push(`stories.${s.id}.requires: unknown building`);
    checkObjectives(`stories.${s.id}`, s.objectives);
    checkReward(`stories.${s.id}`, s.reward);
  }
  for (const e of w.events) {
    checkObjectives(`events.${e.id}`, e.objectives);
    e.tiers.forEach((t, i) => checkReward(`events.${e.id}.tiers[${i}]`, t.reward));
  }
  for (const it of Object.keys(w.project.requirements)) if (it !== 'coins' && !items.has(it)) errors.push(`project.requirements: unknown item ${it}`);
  checkReward('project', w.project.reward);
  for (const p of w.layout) if (!buildings.has(p.type)) errors.push(`layout: unknown building ${p.type}`);
  if (!w.layout.some((p) => p.type === 'starter_house')) errors.push('layout: needs a starter_house');
  for (const a of Object.keys(w.achievements)) if (!CORE.achievements.some((x) => x.id === a)) errors.push(`achievements.${a}: unknown achievement`);
  // Content policy (every language): no religious or political topics, hostility, restricted products or unverified claims.
  for (const i of scanDocument(w)) errors.push(describeIssue(i));
  return errors;
}

const objective = (o: WorldPack['quests'][number]['objectives'][number], lang: Lang): Objective => ({ ...o, label: L(o.label, lang) }) as Objective;
const reward = (r: WorldPack['quests'][number]['reward']): Reward => clone(r) as Reward;

function applyCoreOverlay(lang: Lang) {
  if (lang !== 'ms') return;
  const o = CORE_OVERLAY_MS;
  for (const [id, b] of Object.entries(o.buildings)) {
    const def = BUILDINGS[id];
    if (!def) continue;
    if (b.name) def.name = b.name;
    if (b.description) def.description = b.description;
    b.perks?.forEach((p, i) => def.levels[i] && (def.levels[i].perks = [...p]));
  }
  for (const [id, it] of Object.entries(o.items)) if (ITEMS[id]) Object.assign(ITEMS[id], it);
  for (const [id, name] of Object.entries(o.recipes)) if (RECIPES[id]) RECIPES[id].name = name;
  for (const [id, a] of Object.entries(o.achievements)) {
    const def = ACHIEVEMENTS.find((x) => x.id === id);
    if (def) Object.assign(def, a);
  }
  EXPANSIONS.forEach((e, i) => (e.name = o.expansionNames[i % o.expansionNames.length]));
  for (const l of LEVELS) l.unlocks = o.levelUnlocks[l.level] ?? [o.levelDefault];
}

function applyWorld(w: WorldPack, lang: Lang) {
  const info: WorldInfo = {
    id: w.id,
    country: w.country,
    name: L(w.name, lang),
    tagline: L(w.tagline, lang),
    hoodName: L(w.hoodName, lang),
    avatar: w.avatar,
    biome: w.environment.biome,
    rainChance: w.environment.rainChance,
    layout: w.layout.map((p) => [p.type, p.x, p.z, p.rot ?? 0]),
    history: L(w.history, lang),
  };
  Object.assign(WORLD, info);

  const residents: Record<string, ResidentDef> = {};
  for (const r of w.residents) {
    const line = (l: (typeof r.greetings)[number]) => ({ ...l, text: L(l.text, lang) });
    residents[r.id] = {
      ...clone(r),
      name: L(r.name, lang),
      profession: L(r.profession, lang),
      bio: L(r.bio, lang),
      favoritePlace: r.favoritePlace as ResidentDef['favoritePlace'],
      arrival: r.arrival as ResidentDef['arrival'],
      greetings: r.greetings.map(line),
      smallTalk: r.smallTalk.map(line),
      memoryLines: r.memoryLines.map(line),
      giftReactions: { love: L(r.giftReactions.love, lang), like: L(r.giftReactions.like, lang), neutral: L(r.giftReactions.neutral, lang) },
    };
  }
  replaceRecord(RESIDENTS, residents);
  // Core building → resident links that this world doesn't fill are cleared.
  for (const def of Object.values(BUILDINGS)) if (def.resident && !RESIDENTS[def.resident]) delete def.resident;

  for (const [id, o] of Object.entries(w.buildings)) {
    const def = BUILDINGS[id];
    if (o.name) def.name = L(o.name, lang);
    if (o.description) def.description = L(o.description, lang);
    o.perks?.forEach((p, i) => def.levels[i] && (def.levels[i].perks = p.map((x) => L(x, lang))));
    if (o.archetype) def.archetype = o.archetype;
    if (o.resident) def.resident = o.resident;
    if (o.hidden !== undefined) def.hidden = o.hidden;
    if (o.unlockLevel) def.unlockLevel = o.unlockLevel;
  }
  for (const [id, o] of Object.entries(w.items)) {
    if (o.name) ITEMS[id].name = L(o.name, lang);
    if (o.description) ITEMS[id].description = L(o.description, lang);
    if (o.icon) ITEMS[id].icon = o.icon;
  }
  for (const [id, o] of Object.entries(w.recipes)) RECIPES[id].name = L(o.name, lang);

  replaceArray<QuestDef>(
    QUESTS,
    w.quests.map((q) => ({
      ...q,
      title: L(q.title, lang),
      intro: L(q.intro, lang),
      outro: L(q.outro, lang),
      why: q.why ? L(q.why, lang) : undefined,
      objectives: q.objectives.map((o) => objective(o, lang)),
      reward: reward(q.reward),
    })),
  );
  replaceArray<StoryChapterDef>(
    STORIES,
    w.stories.map((s) => ({
      ...s,
      title: L(s.title, lang),
      intro: L(s.intro, lang),
      outro: L(s.outro, lang),
      worldChange: s.worldChange ? L(s.worldChange, lang) : undefined,
      objectives: s.objectives.map((o) => objective(o, lang)),
      reward: reward(s.reward),
    })),
  );
  replaceArray(
    EVENTS,
    w.events.map((e) => ({
      ...e,
      name: L(e.name, lang),
      description: L(e.description, lang),
      objectives: e.objectives.map((o) => objective(o, lang)),
      tiers: e.tiers.map((t) => ({ at: t.at, reward: reward(t.reward), label: L(t.label, lang) })),
    })),
  );
  const p = w.project;
  replaceArray(COMMUNITY_PROJECTS, [
    { ...p, name: L(p.name, lang), description: L(p.description, lang), stages: p.stages.map((s) => ({ at: s.at, label: L(s.label, lang) })), reward: reward(p.reward), requirements: { ...p.requirements } },
  ]);
  EXPANSIONS.forEach((e, i) => (e.name = L(w.expansionNames[i % w.expansionNames.length], lang)));
  for (const [lvl, list] of Object.entries(w.levelUnlocks)) {
    const l = LEVELS[Number(lvl) - 1];
    if (l) l.unlocks = list.map((x) => L(x, lang));
  }
  for (const [id, a] of Object.entries(w.achievements)) {
    const def = ACHIEVEMENTS.find((x) => x.id === id)!;
    def.name = L(a.name, lang);
    def.description = L(a.description, lang);
  }
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export interface CompileResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  module?: ActiveModule;
  defs?: { items: ItemDef[]; recipes: RecipeDef[]; quests: QuestDef[] };
}

/** Most repetitions a partner quest objective may ask for. */
export const MODULE_MAX_REPEATS = 10;

const isPast = (iso: string | undefined, now: number) => !!iso && Date.parse(iso) <= now;

/**
 * Semantic + economic checks and localisation for one module, against the registries as
 * they are now (core + world). Does not mutate anything.
 */
export function compileModule(m: ModuleManifest, lang: Lang, now: number, worldCountry: string): CompileResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const tpl = TEMPLATES[m.template];
  const slot = BUILDINGS[m.slot];
  const full = (local: string) => `${m.id}/${local}`;
  const localItems = new Map(m.items.map((i) => [i.id, i]));
  const resolveItem = (ref: string) => (localItems.has(ref) ? full(ref) : ITEMS[ref] ? ref : null);

  if (m.country !== worldCountry) errors.push(`country ${m.country} does not match the active world (${worldCountry})`);
  if (tpl.status !== 'available') errors.push(`template ${m.template} has no building in this game version`);
  if (!slot) errors.push(`slot ${m.slot}: unknown building`);
  else if (slot.template !== m.template) errors.push(`slot ${m.slot} runs template ${slot.template ?? 'none'}, not ${m.template}`);
  if (!(tpl.prefabs as readonly string[]).includes(m.presentation.prefab)) errors.push(`prefab ${m.presentation.prefab} is not approved for template ${m.template}`);
  if (m.presentation.staff && !RESIDENTS[m.presentation.staff]) errors.push(`presentation.staff: unknown resident ${m.presentation.staff}`);
  if (m.brand.kind === 'licensed') {
    if (!m.brand.licence) errors.push('brand: licensed brands need a licence record');
    else if (isPast(m.brand.licence.expires, now)) errors.push('brand: licence has expired');
  }
  if (m.items.length > tpl.limits.items) errors.push(`items: template allows at most ${tpl.limits.items}`);
  if (m.recipes.length > tpl.limits.recipes) errors.push(`recipes: template allows at most ${tpl.limits.recipes}`);

  const [vMin, vMax] = tpl.limits.itemValue;
  for (const it of m.items) if (it.value < vMin || it.value > vMax) errors.push(`items.${it.id}.value must be ${vMin}–${vMax} for this template`);

  const value = (ref: string) => localItems.get(ref)?.value ?? ITEMS[ref]?.value ?? 0;
  const recipes: RecipeDef[] = [];
  for (const r of m.recipes) {
    const where = `recipes.${r.id}`;
    const out = resolveItem(r.item);
    if (!out) errors.push(`${where}.item: unknown item ${r.item}`);
    for (const i of Object.keys(r.inputs ?? {})) if (!resolveItem(i)) errors.push(`${where}.inputs: unknown item ${i}`);
    const [sMin, sMax] = tpl.limits.recipeSeconds;
    if (r.seconds < sMin || r.seconds > sMax) errors.push(`${where}.seconds must be ${sMin}–${sMax}`);
    if ((r.coins ?? 0) > tpl.limits.recipeCoins) errors.push(`${where}.coins must be ≤ ${tpl.limits.recipeCoins}`);
    if (r.qty > tpl.limits.qty) errors.push(`${where}.qty must be ≤ ${tpl.limits.qty}`);
    if (r.xp > tpl.limits.xp) errors.push(`${where}.xp must be ≤ ${tpl.limits.xp}`);
    if (slot && r.level > slot.levels.length) errors.push(`${where}.level exceeds the building's ${slot.levels.length} levels`);
    const inputValue = Object.entries(r.inputs ?? {}).reduce((s, [i, n]) => s + value(i) * n, 0);
    const net = value(r.item) * r.qty - inputValue - (r.coins ?? 0);
    const perMinute = net / (r.seconds / 60);
    if (perMinute > tpl.limits.valuePerMinute) errors.push(`${where}: creates ${perMinute.toFixed(1)} value/min, above the template ceiling of ${tpl.limits.valuePerMinute}`);
    if (out)
      recipes.push({
        id: full(r.id),
        name: L(localItems.get(r.item)?.name ?? ITEMS[r.item]?.name, lang),
        building: m.slot,
        level: r.level,
        inputs: Object.fromEntries(Object.entries(r.inputs ?? {}).map(([i, n]) => [resolveItem(i) ?? i, n])),
        coins: r.coins,
        output: out,
        qty: r.qty,
        seconds: r.seconds,
        xp: r.xp,
        module: m.id,
      });
  }

  const behaviors: ResolvedBehavior[] = [];
  const seenTypes = new Set<string>();
  for (const b of m.behaviors) {
    if (!(tpl.behaviors as readonly string[]).includes(b.type)) {
      errors.push(`behaviors: ${b.type} is not allowed for template ${m.template}`);
      continue;
    }
    if (seenTypes.has(b.type)) errors.push(`behaviors: ${b.type} listed twice`);
    seenTypes.add(b.type);
    switch (b.type) {
      case 'hand_prepare':
        if (!m.recipes.some((r) => r.id === b.recipe)) errors.push(`behaviors.hand_prepare.recipe: unknown recipe ${b.recipe}`);
        behaviors.push({ type: 'hand_prepare', recipe: full(b.recipe), steps: [...b.steps], cooldownSeconds: b.cooldownSeconds, tip: L(b.tip, lang) });
        break;
      case 'quiz':
        b.questions.forEach((q) => q.answer >= q.choices.length && errors.push(`behaviors.quiz.${q.id}.answer is out of range`));
        behaviors.push({
          type: 'quiz',
          topic: L(b.topic, lang),
          dailyLimit: b.dailyLimit,
          questions: b.questions.map((q) => ({ id: full(q.id), prompt: L(q.prompt, lang), choices: q.choices.map((c) => L(c, lang)), answer: q.answer, explain: L(q.explain, lang) })),
        });
        break;
      case 'showroom':
        behaviors.push({ type: 'showroom', slots: b.slots, models: [...b.models], paints: b.paints.map((p) => ({ id: p.id, name: L(p.name, lang), hex: p.hex })) });
        break;
      case 'garden_plots':
        behaviors.push({
          type: 'garden_plots',
          plots: b.plots,
          plants: b.plants.map((p) => {
            const y = resolveItem(p.yields);
            if (!y) errors.push(`behaviors.garden_plots.${p.id}.yields: unknown item ${p.yields}`);
            const perMinute = (value(p.yields) * p.qty) / (p.growSeconds / 60);
            if (perMinute > tpl.limits.valuePerMinute) errors.push(`behaviors.garden_plots.${p.id}: ${perMinute.toFixed(1)} value/min is above the ceiling`);
            return { id: p.id, name: L(p.name, lang), icon: p.icon, growSeconds: p.growSeconds, yields: y ?? p.yields, qty: p.qty, color: p.color };
          }),
        });
        break;
      case 'visitors':
        behaviors.push({ type: 'visitors', perHour: b.perHour });
        break;
      case 'ambient_sound':
        behaviors.push({ type: 'ambient_sound', sound: b.sound });
        break;
    }
  }

  // Content policy: the same screen in every language. Staff-only records (approval notes,
  // licences, contracts) and the verified halal record are not player-facing prose.
  for (const i of scanDocument(m, (p) => /^(realWorld\.halal|approval|licensing|sponsor|brand\.licence|activation)\b/.test(p))) errors.push(describeIssue(i));
  for (const tag of m.contentTags) {
    if ((BLOCKED_TAGS as readonly string[]).includes(tag)) errors.push(`contentTags: "${tag}" is outside POCKETHOOD's content policy`);
    else if (!(CONTENT_TAGS as readonly string[]).includes(tag)) errors.push(`contentTags: unknown tag ${tag}`);
  }

  const quests: QuestDef[] = [];
  for (const q of m.quests ?? []) {
    const where = `quests.${q.id}`;
    // Partner quests stay light: no grinding through long repetitive objectives.
    for (const o of q.objectives) if (o.type === 'counter' && o.n > MODULE_MAX_REPEATS) errors.push(`${where}.objectives: ${o.n} repetitions is above the partner limit of ${MODULE_MAX_REPEATS}`);
    if (!RESIDENTS[q.giver]) errors.push(`${where}.giver: unknown resident ${q.giver}`);
    if ((q.reward.gems ?? 0) > 0) errors.push(`${where}.reward: modules may not grant gems`);
    if ((q.reward.coins ?? 0) > tpl.limits.questCoins) errors.push(`${where}.reward.coins must be ≤ ${tpl.limits.questCoins}`);
    if (q.tutorial) errors.push(`${where}: modules may not add tutorial quests`);
    for (const u of q.reward.unlocks ?? []) errors.push(`${where}.reward: modules may not unlock ${u}`);
    const rewardItems = Object.fromEntries(Object.entries(q.reward.items ?? {}).map(([i, n]) => [resolveItem(i) ?? '', n]));
    if ('' in rewardItems) errors.push(`${where}.reward.items: unknown item`);
    const objectives = q.objectives.map((o) => {
      const x = { ...o, label: L(o.label, lang) } as Objective;
      if (x.type === 'counter') {
        const [kind, arg] = x.counter.split(':');
        if (arg && localItems.has(arg)) x.counter = `${kind}:${full(arg)}`;
      }
      if (x.type === 'deliver') {
        const items: Record<string, number> = {};
        for (const [i, n] of Object.entries(x.items)) {
          const r = resolveItem(i);
          if (!r) errors.push(`${where}.objectives: unknown item ${i}`);
          items[r ?? i] = n;
        }
        x.items = items;
        if (!RESIDENTS[x.to]) errors.push(`${where}.objectives: unknown resident ${x.to}`);
      }
      if ((x.type === 'build' || x.type === 'upgrade') && !BUILDINGS[x.building]) errors.push(`${where}.objectives: unknown building ${x.building}`);
      return x;
    });
    quests.push({
      id: full(q.id),
      title: L(q.title, lang),
      giver: q.giver,
      intro: L(q.intro, lang),
      outro: L(q.outro, lang),
      objectives,
      reward: { ...clone(q.reward), unlocks: undefined, items: Object.keys(rewardItems).length ? rewardItems : undefined } as Reward,
      after: q.after?.map((a) => (m.quests?.some((x) => x.id === a) ? full(a) : a)),
      minLevel: q.minLevel,
      focus: q.focus ? { building: q.focus.building, panel: q.focus.panel } : undefined,
      module: m.id,
    });
  }

  // Sponsor labels are earned by verification, never self-declared.
  let sponsorLabel: ActiveModule['sponsorLabel'] = null;
  if (m.sponsor) {
    if (!m.sponsor.verified || !m.sponsor.verifiedAt || !m.sponsor.contractRef) warnings.push('sponsor: not verified — no partner label will be shown');
    else if (m.sponsor.label === 'official_partner' && m.brand.kind !== 'licensed') warnings.push('sponsor: "Official Brand Partner" needs a licensed brand — showing "Sponsored Experience"');
    else sponsorLabel = m.sponsor.label;
    if (!sponsorLabel && m.sponsor.verified && m.sponsor.verifiedAt && m.sponsor.contractRef) sponsorLabel = 'sponsored_experience';
  }

  const realWorld = m.realWorld ? resolveRealWorld(m.realWorld, lang, now, warnings) : null;

  const items: ItemDef[] = m.items.map((i) => ({ id: full(i.id), name: L(i.name, lang), value: i.value, icon: i.icon, kind: 'good', description: L(i.description, lang), module: m.id }));
  if (errors.length) return { ok: false, errors, warnings };
  return {
    ok: true,
    errors,
    warnings,
    defs: { items, recipes, quests },
    module: {
      id: m.id,
      version: m.version,
      template: m.template,
      slot: m.slot,
      kind: m.kind,
      name: L(m.name, lang),
      tagline: L(m.tagline, lang),
      description: L(m.description, lang),
      brand: { kind: m.brand.kind, signText: L(m.brand.signText, lang), palette: { ...m.brand.palette } },
      sponsorLabel,
      prefab: m.presentation.prefab,
      props: [...(m.presentation.props ?? [])],
      staff: m.presentation.staff,
      greeting: L(m.presentation.greeting, lang),
      items: items.map((i) => i.id),
      recipes: recipes.map((r) => r.id),
      quests: quests.map((q) => q.id),
      behaviors,
      realWorld,
      warnings,
    },
  };
}

function resolveRealWorld(rw: NonNullable<ModuleManifest['realWorld']>, lang: Lang, now: number, warnings: string[]): ResolvedRealWorld {
  let menu: ResolvedRealWorld['menu'] = null;
  if (rw.menu) {
    const illustrative = rw.menu.source === 'illustrative';
    // Prices are shown only when the partner supplied them AND they were verified.
    const pricesOk = !illustrative && !!rw.menu.verifiedAt;
    if (!pricesOk && rw.menu.items.some((i) => i.priceMinor !== undefined)) warnings.push('realWorld.menu: prices removed (not partner-supplied and verified)');
    menu = {
      currency: rw.menu.currency,
      version: rw.menu.version,
      illustrative,
      verifiedAt: rw.menu.verifiedAt ?? null,
      items: rw.menu.items.map((i) => ({ name: L(i.name, lang), description: L(i.description, lang), priceMinor: pricesOk ? i.priceMinor ?? null : null, available: i.available ?? true })),
    };
  }
  let halal: ResolvedRealWorld['halal'] = { status: 'not_stated' };
  if (rw.halal) {
    const h = rw.halal;
    if (h.status === 'certified') {
      const ok = !!(h.certifier && h.certificateRef && h.verifiedAt) && !isPast(h.expires, now);
      if (ok) halal = { status: 'certified', certifier: h.certifier, certificateRef: h.certificateRef, verifiedAt: h.verifiedAt, expires: h.expires };
      else warnings.push('realWorld.halal: certification claim not verified or expired — shown as "not stated"');
    } else halal = { status: h.status };
  }
  const links = (rw.links ?? []).filter((l) => {
    const host = new URL(l.url).host;
    const ok = LINK_HOST_ALLOWLIST.includes(host);
    if (!ok) warnings.push(`realWorld.links: ${host} is not on the allowlist — link removed`);
    return ok;
  });
  return { menu, halal, links: links.map((l) => ({ label: L(l.label, lang), url: l.url })), notice: L(rw.notice, lang) };
}

// ─── Install ─────────────────────────────────────────────────────────────────

export interface InstallReport {
  world: { id: string; ok: boolean; errors: string[] };
  modules: { id: string; ok: boolean; errors: string[]; warnings: string[] }[];
}

export interface InstallPlan {
  world: WorldPack | null;
  modules: ModuleManifest[];
  lang: Lang;
  now: number;
}

/** Rebuild every content registry from core + world + modules. Safe to call repeatedly. */
export function installContent(plan: InstallPlan): InstallReport {
  resetToCore();
  applyCoreOverlay(plan.lang);
  const report: InstallReport = { world: { id: plan.world?.id ?? WORLD.id, ok: true, errors: [] }, modules: [] };
  if (plan.world) {
    const errors = checkWorld(plan.world);
    if (errors.length) report.world = { id: plan.world.id, ok: false, errors };
    else applyWorld(plan.world, plan.lang);
  }
  for (const k of Object.keys(ACTIVE_MODULES)) delete ACTIVE_MODULES[k];
  NEUTRAL = {};
  for (const def of Object.values(BUILDINGS)) if (def.template) NEUTRAL[def.id] = neutralBehaviors(def.template, plan.lang);

  for (const m of plan.modules) {
    if (ACTIVE_MODULES[m.slot]) {
      report.modules.push({ id: m.id, ok: false, errors: [`slot ${m.slot} is already dressed by ${ACTIVE_MODULES[m.slot].id}`], warnings: [] });
      continue;
    }
    const res = compileModule(m, plan.lang, plan.now, WORLD.country);
    report.modules.push({ id: m.id, ok: res.ok, errors: res.errors, warnings: res.warnings });
    if (!res.ok || !res.module || !res.defs) continue;
    for (const i of res.defs.items) ITEMS[i.id] = i;
    for (const r of res.defs.recipes) RECIPES[r.id] = r;
    QUESTS.push(...res.defs.quests);
    const def: BuildingDef = BUILDINGS[m.slot];
    def.name = res.module.name;
    def.description = res.module.tagline;
    if (res.module.staff) def.resident = res.module.staff;
    ACTIVE_MODULES[m.slot] = res.module;
  }
  return report;
}
