import { SAVE_KEY } from '../config';
import type { HeroId } from '../data/types';
import { UPGRADES, type UpgradeId } from '../data/upgrades';

export const STAGE_COUNT = 5;

export type Rating = 'S' | 'A' | 'B' | 'C' | 'D';

export interface StageBest {
  rating: Rating;
  score: number;
  time: number;
}

export interface CampaignSave {
  mode: 'solo' | 'coop';
  soloHero: HeroId;
  unlocked: number; // highest playable stage index
  completed: boolean[];
  ink: number;
  xp: number;
  pencils: boolean[][];
  upgrades: Partial<Record<UpgradeId, number>>;
  best: (StageBest | null)[];
  challenges: boolean[];
  finished: boolean;
  introSeen: boolean;
}

export type KeyAction = 'left' | 'right' | 'up' | 'down' | 'jump' | 'light' | 'heavy' | 'special' | 'dodge' | 'ult' | 'interact';
export type KeyOverrides = Partial<Record<KeyAction, string>>;

export interface Settings {
  music: number;
  sfx: number;
  shake: boolean;
  reducedMotion: boolean;
  touchScale: number;
  touchOpacity: number;
  hints: boolean;
  pad1ToP2: boolean;
  quality: 'auto' | 'high' | 'low';
  keysSolo: KeyOverrides;
  keysP1: KeyOverrides;
  keysP2: KeyOverrides;
}

export interface SaveData {
  version: 1;
  campaign: CampaignSave | null;
  settings: Settings;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function defaultSettings(): Settings {
  let reduced = false;
  try {
    reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    reduced = false;
  }
  return {
    music: 0.6,
    sfx: 0.8,
    shake: !reduced,
    reducedMotion: reduced,
    touchScale: 1,
    touchOpacity: 0.75,
    hints: true,
    pad1ToP2: false,
    quality: 'auto',
    keysSolo: {},
    keysP1: {},
    keysP2: {},
  };
}

export function newCampaign(mode: 'solo' | 'coop', soloHero: HeroId): CampaignSave {
  return {
    mode,
    soloHero,
    unlocked: 0,
    completed: Array(STAGE_COUNT).fill(false),
    ink: 0,
    xp: 0,
    pencils: Array.from({ length: STAGE_COUNT }, () => [false, false, false]),
    upgrades: {},
    best: Array(STAGE_COUNT).fill(null),
    challenges: Array(STAGE_COUNT).fill(false),
    finished: false,
    introSeen: false,
  };
}

const num = (v: unknown, d: number, lo = -Infinity, hi = Infinity): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
const boolArr = (v: unknown, len: number): boolean[] =>
  Array.from({ length: len }, (_, i) => (Array.isArray(v) ? v[i] === true : false));

function sanitizeKeys(v: unknown): KeyOverrides {
  const out: KeyOverrides = {};
  if (!v || typeof v !== 'object') return out;
  for (const [k, code] of Object.entries(v as Record<string, unknown>)) {
    if (typeof code === 'string' && code.length < 40) out[k as KeyAction] = code;
  }
  return out;
}

export function sanitizeSettings(raw: unknown): Settings {
  const d = defaultSettings();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  return {
    music: num(r.music, d.music, 0, 1),
    sfx: num(r.sfx, d.sfx, 0, 1),
    shake: bool(r.shake, d.shake),
    reducedMotion: bool(r.reducedMotion, d.reducedMotion),
    touchScale: num(r.touchScale, d.touchScale, 0.7, 1.4),
    touchOpacity: num(r.touchOpacity, d.touchOpacity, 0.25, 1),
    hints: bool(r.hints, d.hints),
    pad1ToP2: bool(r.pad1ToP2, d.pad1ToP2),
    quality: r.quality === 'high' || r.quality === 'low' ? r.quality : 'auto',
    keysSolo: sanitizeKeys(r.keysSolo),
    keysP1: sanitizeKeys(r.keysP1),
    keysP2: sanitizeKeys(r.keysP2),
  };
}

export function sanitizeCampaign(raw: unknown): CampaignSave | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const c = newCampaign(r.mode === 'coop' ? 'coop' : 'solo', r.soloHero === 'scout' ? 'scout' : 'momo');
  c.unlocked = Math.floor(num(r.unlocked, 0, 0, STAGE_COUNT - 1));
  c.completed = boolArr(r.completed, STAGE_COUNT);
  c.ink = Math.floor(num(r.ink, 0, 0, 999999));
  c.xp = Math.floor(num(r.xp, 0, 0, 9999999));
  c.pencils = Array.from({ length: STAGE_COUNT }, (_, i) => boolArr(Array.isArray(r.pencils) ? r.pencils[i] : null, 3));
  const ups = (r.upgrades && typeof r.upgrades === 'object' ? r.upgrades : {}) as Record<string, unknown>;
  for (const u of UPGRADES) {
    const lv = Math.floor(num(ups[u.id], 0, 0, u.costs.length));
    if (lv > 0) c.upgrades[u.id] = lv;
  }
  const best = Array.isArray(r.best) ? r.best : [];
  c.best = Array.from({ length: STAGE_COUNT }, (_, i) => {
    const b = best[i] as Record<string, unknown> | null | undefined;
    if (!b || typeof b !== 'object') return null;
    const rating = ['S', 'A', 'B', 'C', 'D'].includes(b.rating as string) ? (b.rating as Rating) : 'D';
    return { rating, score: Math.floor(num(b.score, 0, 0)), time: num(b.time, 0, 0) };
  });
  c.challenges = boolArr(r.challenges, STAGE_COUNT);
  c.finished = bool(r.finished, false);
  c.introSeen = bool(r.introSeen, false);
  // a completed stage always unlocks the next one
  for (let i = 0; i < STAGE_COUNT - 1; i++) if (c.completed[i]) c.unlocked = Math.max(c.unlocked, i + 1);
  return c;
}

export function defaultSave(): SaveData {
  return { version: 1, campaign: null, settings: defaultSettings() };
}

/** Wraps browser storage. Every access is guarded: private windows and blocked storage just disable saving. */
export class SaveManager {
  data: SaveData;
  available: boolean;
  lastError: string | null = null;
  private storage: StorageLike | null;

  constructor(storage?: StorageLike | null) {
    this.storage = storage === undefined ? SaveManager.detectStorage() : storage;
    this.available = this.storage !== null;
    this.data = this.load();
  }

  static detectStorage(): StorageLike | null {
    try {
      const s = window.localStorage;
      const probe = '__inkrush_probe__';
      s.setItem(probe, '1');
      s.removeItem(probe);
      return s;
    } catch {
      return null;
    }
  }

  load(): SaveData {
    if (!this.storage) return defaultSave();
    let raw: string | null = null;
    try {
      raw = this.storage.getItem(SAVE_KEY);
    } catch (e) {
      this.available = false;
      this.lastError = String(e);
      return defaultSave();
    }
    if (!raw) return defaultSave();
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        version: 1,
        campaign: sanitizeCampaign(parsed.campaign),
        settings: sanitizeSettings(parsed.settings),
      };
    } catch (e) {
      // Corrupt data: keep a copy for recovery and start fresh rather than crash.
      this.lastError = 'Saved data was unreadable and has been reset.';
      try {
        this.storage.setItem(SAVE_KEY + '.corrupt', raw);
      } catch {
        /* ignore */
      }
      return defaultSave();
    }
  }

  persist(): boolean {
    if (!this.storage) return false;
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(this.data));
      this.available = true;
      return true;
    } catch (e) {
      this.available = false;
      this.lastError = String(e);
      return false;
    }
  }

  hasCampaign(): boolean {
    return this.data.campaign !== null;
  }

  startCampaign(mode: 'solo' | 'coop', hero: HeroId): CampaignSave {
    this.data.campaign = newCampaign(mode, hero);
    this.persist();
    return this.data.campaign;
  }

  eraseCampaign(): void {
    this.data.campaign = null;
    this.persist();
  }
}
