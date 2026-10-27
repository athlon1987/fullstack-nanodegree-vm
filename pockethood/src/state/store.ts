// Client store: wraps the deterministic engine, routes events to UI feedback,
// audio, analytics and persistence. Rendering and UI read from here.
import { create } from 'zustand';
import { BUILDINGS } from '../data/buildings';
import { ITEMS } from '../data/items';
import { ACHIEVEMENTS, EVENTS, QUESTS, STORIES } from '../data/progression';
import { RESIDENTS } from '../data/residents';
import { activate, defaultWorldId, initContent } from '../platform/content/service';
import { flag } from '../platform/content/flags';
import { setLang, t, toLang, type Lang } from '../platform/i18n';
import { tc } from '../platform/i18n/content';
import { safeGet, safeRemove, safeSet } from '../utils/safeStorage';
import { dispatch as engineDispatch, type Action } from '../game/core/engine';
import type { ActionResult, GameEvent, GameState, Rotation } from '../game/core/types';
import { welcomeSummary, type WelcomeSummary } from '../game/engagement/PlayerReturnManager';
import { audio, type Sfx } from '../audio/AudioManager';
import { analytics } from '../services/analytics';
import { clock } from '../services/clock';
import { browserAdapter, SaveService } from '../services/persistence';

export type PanelId =
  | 'build'
  | 'inventory'
  | 'orders'
  | 'residents'
  | 'profile'
  | 'settings'
  | 'help'
  | 'pulse'
  | 'quests'
  | 'friends'
  | 'events'
  | 'community'
  | 'expand'
  | 'devtools';

export interface Toast {
  id: number;
  icon: string;
  title: string;
  body?: string;
  tone: 'info' | 'success' | 'error' | 'story';
}

export interface FlyFx {
  id: number;
  kind: 'coins' | 'xp' | 'item' | 'gems' | 'heart';
  amount: number;
  item?: string;
  /** World-space origin; the UI projects it to screen. */
  from: [number, number, number];
}

export interface Placing {
  type: string;
  /** Set when moving an existing building. */
  uid?: string;
  x: number;
  z: number;
  rot: Rotation;
}

export interface Dialogue {
  resident: string;
  text: string;
  mode: 'talk' | 'story-intro' | 'story-outro' | 'gift' | 'arrival' | 'quest';
  chapter?: string;
  questId?: string;
}

interface UI {
  panel: PanelId | null;
  selected: string | null;
  resident: string | null;
  placing: Placing | null;
  toasts: Toast[];
  fx: FlyFx[];
  dialogue: Dialogue | null;
  dialogueQueue: Dialogue[];
  levelUp: { level: number; unlocks: string[] } | null;
  welcome: WelcomeSummary | null;
  photoMode: boolean;
  focus: { x: number; z: number; zoom?: number; t: number } | null;
  hour: number;
  bumps: Record<string, number>;
  /** Building the tutorial is pointing at (renders a world arrow). */
  hintUid: string | null;
}

interface Store {
  game: GameState | null;
  ui: UI;
  loaded: boolean;
  /** Bumped whenever content is (re)installed (language switch, module change). */
  contentRev: number;
  init(): Promise<void>;
  dispatch(action: Action, origin?: [number, number, number]): ActionResult | null;
  setUI(patch: Partial<UI>): void;
  openPanel(panel: PanelId | null): void;
  toast(t: Omit<Toast, 'id'>): void;
  dismissToast(id: number): void;
  nextDialogue(): void;
  startPlacing(type: string, uid?: string): void;
  focusOn(x: number, z: number, zoom?: number): void;
  resetGame(worldId?: string): Promise<void>;
  saveNow(): Promise<void>;
  /** Re-install content for the current world (after a language, flag or module change). */
  reloadContent(): void;
}

const NEXT_WORLD_KEY = 'pockethood.nextWorld';
const LANG_KEY = 'pockethood.lang';

/** Device language guess for a brand-new player (never personal data, just the UI language). */
function initialLang(): Lang {
  const saved = safeGet(LANG_KEY);
  if (saved === 'en' || saved === 'ms') return saved;
  try {
    return toLang(navigator.language);
  } catch {
    return 'en';
  }
}

/** Zen Mode hides notifications and anything promotional. */
const zen = (s: GameState | null) => !!s?.settings.zen && flag('zen_mode');

let saves: SaveService | null = null;
let saveTimer: number | null = null;
let seq = 1;
let resetting = false;

const worldOf = (s: GameState, uid: string): [number, number, number] => {
  const b = s.buildings.find((x) => x.uid === uid);
  if (!b) return [0, 1, 0];
  const [w, d] = BUILDINGS[b.type]?.footprint ?? b.fp ?? [1, 1];
  return [b.x + (b.rot % 2 ? d : w) / 2 - 12, 1.6, b.z + (b.rot % 2 ? w : d) / 2 - 12];
};

export const useGame = create<Store>((set, get) => ({
  game: null,
  loaded: false,
  contentRev: 0,
  ui: {
    panel: null,
    selected: null,
    resident: null,
    placing: null,
    toasts: [],
    fx: [],
    dialogue: null,
    dialogueQueue: [],
    levelUp: null,
    welcome: null,
    photoMode: false,
    focus: null,
    hour: 9,
    bumps: {},
    hintUid: null,
  },

  async init() {
    if (get().loaded) return;
    saves = new SaveService(await browserAdapter());
    const now = clock.now();
    // Content first (remote → cache → bundled), then the save's world is installed before the
    // save is repaired, so its buildings, residents and quests resolve against the right content.
    await initContent();
    let lang = initialLang();
    setLang(lang);
    const nextWorld = safeGet(NEXT_WORLD_KEY);
    safeRemove(NEXT_WORLD_KEY);
    const { state, fresh, recovered } = await saves.load(now, (worldId) => activate(worldId ?? nextWorld ?? defaultWorldId(), lang, now));
    if (fresh) state.settings = { ...state.settings, locale: lang };
    else if (state.settings.locale !== lang) {
      lang = state.settings.locale;
      setLang(lang);
      activate(state.world.id, lang, now);
    }
    // Phones start on the Medium preset (lower pixel ratio, cheaper shadows).
    try {
      if (fresh && window.matchMedia('(pointer: coarse)').matches) state.settings = { ...state.settings, graphics: 'medium' };
    } catch {
      /* matchMedia unavailable */
    }
    const welcome = fresh ? null : welcomeSummary(state, now);
    const r = engineDispatch(state, { type: 'sessionStart' }, now);
    set({ game: r.state, loaded: true, ui: { ...get().ui, welcome } });
    analytics?.track(fresh ? 'first_session' : 'session_start', { sessions: r.state.sessions });
    if (recovered) get().toast({ icon: 'alert', title: t('toast.saveRepaired'), body: t('toast.saveRepairedBody'), tone: 'error' });
    routeEvents(r.events, r.state, undefined, true);
    scheduleSave();
    // Heartbeat: timers, arrivals and orders advance even while idle.
    window.setInterval(() => get().dispatch({ type: 'tick' }), 1000);
    const flush = () => {
      if (resetting) return;
      const g = get().game;
      if (g && saves) saves.saveSync({ ...g, lastSeen: clock.now() });
      void get().saveNow();
    };
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', flush);
  },

  dispatch(action, origin) {
    const game = get().game;
    if (!game) return null;
    const r = engineDispatch(game, action, clock.now());
    if (r.error) {
      if (action.type !== 'tick') {
        get().toast({ icon: 'alert', title: tc(r.error, r.errorParams), tone: 'error' });
        audio.play('error');
      }
      return r;
    }
    set({ game: r.state });
    if (action.type === 'settings' && action.patch.locale && action.patch.locale !== game.settings.locale) {
      safeSet(LANG_KEY, action.patch.locale);
      setLang(action.patch.locale);
      get().reloadContent();
    }
    routeEvents(r.events, r.state, origin ?? ('uid' in action ? worldOf(r.state, (action as { uid: string }).uid) : undefined));
    if (action.type !== 'tick' || r.events.length) scheduleSave();
    return r;
  },

  setUI(patch) {
    set({ ui: { ...get().ui, ...patch } });
  },

  openPanel(panel) {
    if (panel) audio.play('click');
    set({ ui: { ...get().ui, panel, selected: panel ? get().ui.selected : null } });
  },

  toast(t) {
    if (t.tone !== 'error' && zen(get().game)) return;
    const id = seq++;
    set({ ui: { ...get().ui, toasts: [...get().ui.toasts.slice(-3), { ...t, id }] } });
    window.setTimeout(() => get().dismissToast(id), t.tone === 'error' ? 2600 : 3800);
  },

  dismissToast(id) {
    set({ ui: { ...get().ui, toasts: get().ui.toasts.filter((x) => x.id !== id) } });
  },

  nextDialogue() {
    const [next, ...rest] = get().ui.dialogueQueue;
    set({ ui: { ...get().ui, dialogue: next ?? null, dialogueQueue: rest } });
  },

  startPlacing(type, uid) {
    const g = get().game!;
    const existing = uid ? g.buildings.find((b) => b.uid === uid) : undefined;
    audio.play('click');
    set({
      ui: {
        ...get().ui,
        panel: null,
        selected: null,
        placing: existing ? { type, uid, x: existing.x, z: existing.z, rot: existing.rot } : { type, x: 14, z: 13, rot: 0 },
      },
    });
  },

  focusOn(x, z, zoom) {
    set({ ui: { ...get().ui, focus: { x, z, zoom, t: Date.now() } } });
  },

  async resetGame(worldId) {
    resetting = true;
    if (worldId) safeSet(NEXT_WORLD_KEY, worldId);
    await saves?.reset();
    clock.reset();
    location.reload();
  },

  reloadContent() {
    const g = get().game;
    if (!g) return;
    activate(g.world.id, g.settings.locale, clock.now());
    set({ contentRev: get().contentRev + 1 });
  },

  async saveNow() {
    if (resetting) return;
    const g = get().game;
    if (g && saves) await saves.save({ ...g, lastSeen: clock.now() }).catch(() => {});
  },
}));

function scheduleSave() {
  if (saveTimer !== null) return;
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    void useGame.getState().saveNow();
  }, 600);
}

function queueDialogue(d: Dialogue, important = false) {
  const st = useGame.getState();
  // Zen Mode: only conversations the player starts appear.
  if (!important && zen(st.game)) return;
  if (!st.ui.dialogue) st.setUI({ dialogue: d });
  else st.setUI({ dialogueQueue: [...st.ui.dialogueQueue, d] });
}

/** Turns simulation events into feedback: sounds, fly-ups, toasts, dialogue. */
function routeEvents(events: GameEvent[], s: GameState, origin?: [number, number, number], silent = false) {
  const st = useGame.getState();
  analytics?.fromGameEvents(events);
  const fx: FlyFx[] = [];
  const play = (n: Sfx) => !silent && audio.play(n);
  const bumps = { ...st.ui.bumps };
  for (const e of events) {
    switch (e.type) {
      case 'RESOURCE_COLLECTED': {
        const from = worldOf(s, e.uid);
        if (e.coins) fx.push({ id: seq++, kind: 'coins', amount: e.coins, from });
        for (const [item, n] of Object.entries(e.items)) fx.push({ id: seq++, kind: 'item', item, amount: n, from });
        if (e.xp) fx.push({ id: seq++, kind: 'xp', amount: e.xp, from });
        bumps.coins = Date.now();
        play('collect');
        break;
      }
      case 'BUILDING_PLACED':
        play('place');
        break;
      case 'BUILDING_CONSTRUCTED':
        if (BUILDINGS[e.building] && BUILDINGS[e.building].category !== 'decoration' && BUILDINGS[e.building].category !== 'path') {
          play('complete');
          st.toast({ icon: 'build', title: tc('toast.opened', { building: e.building }), tone: 'success' });
        }
        break;
      case 'BUILDING_UPGRADED':
        play('complete');
        st.toast({ icon: 'upgrade', title: tc('toast.upgraded', { building: e.building }), body: BUILDINGS[e.building]?.levels[e.level - 1]?.perks.join(' · '), tone: 'success' });
        break;
      case 'ORDER_COMPLETED':
        fx.push({ id: seq++, kind: 'coins', amount: e.order.reward.coins ?? 0, from: origin ?? [0, 2, 4] });
        fx.push({ id: seq++, kind: 'xp', amount: e.order.reward.xp ?? 0, from: origin ?? [0, 2, 4] });
        play('reward');
        queueDialogue({ resident: e.order.resident, text: t(`dialogue.thanks.${seq % 4}`), mode: 'talk' });
        break;
      case 'RESIDENT_ARRIVED':
        if (!silent && RESIDENTS[e.resident] && RESIDENTS[e.resident].arrival.type !== 'start') {
          const r = RESIDENTS[e.resident];
          queueDialogue({ resident: e.resident, text: t('dialogue.arrival', { name: r.name, profession: r.profession, bio: r.bio }), mode: 'arrival' });
        }
        break;
      case 'FRIENDSHIP_UP':
        st.toast({ icon: 'heart', title: tc('toast.friendship', { resident: e.resident, friend: e.level }), body: t('toast.friendshipBody'), tone: 'story' });
        play('reward');
        break;
      case 'QUEST_STARTED': {
        const q = QUESTS.find((x) => x.id === e.quest);
        if (q && (!silent || q.id === 'welcome')) queueDialogue({ resident: q.giver, text: q.intro, mode: 'quest', questId: q.id }, !!q.tutorial);
        break;
      }
      case 'QUEST_COMPLETED': {
        const q = QUESTS.find((x) => x.id === e.quest);
        st.toast({ icon: 'check', title: t('toast.questDone', { title: q?.title ?? '' }), body: rewardText(e.reward), tone: 'success' });
        if (e.reward.coins) fx.push({ id: seq++, kind: 'coins', amount: e.reward.coins, from: origin ?? [0, 2, 0] });
        play('complete');
        break;
      }
      case 'STORY_MILESTONE_COMPLETED': {
        const ch = STORIES.find((c) => c.id === e.chapter);
        if (ch) queueDialogue({ resident: e.resident, text: ch.outro, mode: 'story-outro', chapter: ch.id }, true);
        play('levelup');
        break;
      }
      case 'LEVEL_UP':
        if (!silent && !zen(s)) {
          st.setUI({ levelUp: { level: e.level, unlocks: e.unlocks } });
          play('levelup');
        }
        break;
      case 'ACHIEVEMENT': {
        const a = ACHIEVEMENTS.find((x) => x.id === e.id);
        if (a) st.toast({ icon: 'trophy', title: t('toast.achievement', { name: a.name }), body: rewardText(a.reward), tone: 'success' });
        break;
      }
      case 'PULSE_TASK_DONE':
        st.toast({ icon: 'pulse', title: t('toast.pulseDone'), tone: 'success' });
        play('reward');
        break;
      case 'EVENT_TIER': {
        const ev = EVENTS.find((x) => x.id === e.event);
        if (ev) st.toast({ icon: 'flower', title: `${ev.name}: ${ev.tiers[e.tier].label}!`, body: rewardText(ev.tiers[e.tier].reward), tone: 'success' });
        play('reward');
        break;
      }
      case 'COMMUNITY_PROJECT_CONTRIBUTED':
        play('reward');
        break;
      case 'LANDMARK_COMPLETED':
        st.toast({ icon: 'landmark', title: tc('toast.landmark', { project: e.project }), body: t('toast.landmarkBody'), tone: 'story' });
        play('levelup');
        break;
      case 'DISTRICT_UNLOCKED':
        play('levelup');
        break;
      case 'UNLOCKED':
        if (BUILDINGS[e.what]) st.toast({ icon: 'gift', title: tc('toast.keepsake', { building: e.what }), body: t('toast.keepsakeBody'), tone: 'story' });
        break;
      case 'ITEM_SOLD':
        fx.push({ id: seq++, kind: 'coins', amount: e.coins, from: [0, 2, 4] });
        play('collect');
        break;
      case 'HAND_PREPARED':
      case 'HARVESTED': {
        const from = worldOf(s, e.uid);
        const items = e.type === 'HARVESTED' ? e.items : { [e.item]: 1 };
        for (const [item, n] of Object.entries(items)) fx.push({ id: seq++, kind: 'item', item, amount: n, from });
        play('collect');
        break;
      }
      case 'QUIZ_ANSWERED':
        play(e.correct ? 'reward' : 'click');
        break;
      case 'SHOWROOM_ARRANGED':
      case 'PLANTED':
      case 'WATERED':
        play('place');
        break;
      case 'FISH_SEEN':
      case 'PET_FED':
      case 'ZEN_MOMENT':
        play('click');
        break;
      case 'GIFT_GIVEN':
        queueDialogue({ resident: e.resident, text: e.line, mode: 'gift' }, true);
        fx.push({ id: seq++, kind: 'heart', amount: e.reaction === 'love' ? 8 : e.reaction === 'like' ? 4 : 2, from: [0, 2, 0] });
        play('reward');
        break;
    }
  }
  if (fx.length && !zen(s)) st.setUI({ fx: [...useGame.getState().ui.fx, ...fx].slice(-30), bumps });
}

export function rewardText(r: { coins?: number; gems?: number; xp?: number; items?: Record<string, number>; unlocks?: string[] }) {
  const parts: string[] = [];
  if (r.coins) parts.push(`+${t('common.coinsN', { n: r.coins })}`);
  if (r.gems) parts.push(`+${t('common.gemsN', { n: r.gems })}`);
  if (r.xp) parts.push(`+${t('common.xpN', { n: r.xp })}`);
  for (const [id, n] of Object.entries(r.items ?? {})) parts.push(`+${t('common.itemN', { n, item: ITEMS[id]?.name ?? t('common.unknownItem') })}`);
  for (const u of r.unlocks ?? []) parts.push(BUILDINGS[u]?.name ?? u);
  return parts.join(' · ');
}

// Test/dev handle (used by Playwright e2e tests and the dev inspector).
if (typeof window !== 'undefined') {
  const w = window as unknown as { __pockethood: typeof useGame; __pockethoodClock: typeof clock };
  w.__pockethood = useGame;
  w.__pockethoodClock = clock;
}
