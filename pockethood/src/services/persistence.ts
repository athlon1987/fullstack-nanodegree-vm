// Versioned local-first persistence. IndexedDB (via idb-keyval) with a
// localStorage fallback; saves are schema-versioned and migrated on load.
import { createNewGame, DEFAULT_SETTINGS, SAVE_VERSION, emptyExt, emptySpots, emptyZen, spotBuildings } from '../game/core/newGame';
import type { GameState } from '../game/core/types';
import { BUILDINGS } from '../data/buildings';
import { safeGet, safeRemove, safeSet } from '../utils/safeStorage';

export interface StorageAdapter {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

export const SAVE_KEY = 'pockethood.save';

type AnySave = Record<string, unknown> & { version?: number };

/** Ordered migrations: MIGRATIONS[n] upgrades a version-n save to n+1. */
const MIGRATIONS: Record<number, (s: AnySave) => AnySave> = {
  1: (s) => ({ ...s, achievements: s.achievements ?? [], unlocked: s.unlocked ?? [], version: 2 }),
  2: (s) => ({
    ...s,
    flags: s.flags ?? {},
    history: s.history ?? [],
    community: s.community ?? { projectId: 'fountain', contributed: {}, ops: [], log: [], completedAt: null, rewardClaimed: false },
    version: 3,
  }),
  // v4: worlds & modules. Saves from before belong to the neutral core world.
  3: (s) => {
    const rename: Record<string, string> = { cafe_terrace: 'upgraded_cafe_2', fountain_built: 'landmark_built' };
    const residents = ((s.residents as { memories?: Record<string, number> }[]) ?? []).map((r) => ({
      ...r,
      memories: Object.fromEntries(Object.entries(r.memories ?? {}).map(([k, v]) => [rename[k] ?? k, v])),
    }));
    const pulse = s.pulse as { tasks?: { key?: string }[] } | null;
    return {
      ...s,
      residents,
      pulse: pulse ? { ...pulse, tasks: (pulse.tasks ?? []).map((t) => ({ ...t, key: t.key ?? '' })) } : null,
      world: s.world ?? { id: 'core.maple_hollow', country: 'ZZ' },
      ext: s.ext ?? emptyExt(),
      zen: s.zen ?? emptyZen(),
      version: 4,
    };
  },
  // v5: content policy renames (Kampung Seri's lakeside "wakaf" is now a pavilion).
  4: (s) => {
    const rename = (id: string) => (id === 'wakaf' ? 'pavilion' : id);
    const quests = s.quests as { active?: { id: string }[]; done?: string[] } | undefined;
    const community = s.community as { projectId?: string } | undefined;
    return {
      ...s,
      quests: quests ? { ...quests, active: (quests.active ?? []).map((q) => ({ ...q, id: rename(q.id) })), done: (quests.done ?? []).map(rename) } : quests,
      community: community ? { ...community, projectId: rename(community.projectId ?? '') } : community,
      version: 5,
    };
  },
};

/** The world a raw save belongs to (before migration), so the right content is installed first. */
export function worldOf(raw: AnySave): string {
  const w = raw.world as { id?: unknown } | undefined;
  return typeof w?.id === 'string' ? w.id : 'core.maple_hollow';
}

export function migrate(raw: AnySave): GameState {
  let s = { ...raw };
  let v = typeof s.version === 'number' ? s.version : 1;
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) throw new Error(`No migration from save version ${v}`);
    s = m(s);
    v = s.version as number;
  }
  return s as unknown as GameState;
}

/** Repairs invalid or partial state rather than crashing (invalid state recovery). */
export function sanitize(s: GameState, now: number): GameState {
  const fresh = createNewGame(now, s.seed);
  const out: GameState = { ...fresh, ...s, settings: { ...DEFAULT_SETTINGS, ...(s.settings ?? {}) } };
  out.ext = { ...emptyExt(), ...(s.ext ?? {}) };
  out.ext.learning = { ...emptyExt().learning, ...(s.ext?.learning ?? {}) };
  out.zen = { ...emptyZen(), ...(s.zen ?? {}) };
  if (!['en', 'ms'].includes(out.settings.locale)) out.settings.locale = 'en';
  out.coins = Number.isFinite(out.coins) ? Math.max(0, Math.floor(out.coins)) : fresh.coins;
  out.gems = Number.isFinite(out.gems) ? Math.max(0, Math.floor(out.gems)) : fresh.gems;
  out.xp = Number.isFinite(out.xp) ? Math.max(0, out.xp) : 0;
  out.inventory = Object.fromEntries(Object.entries(out.inventory ?? {}).filter(([, n]) => Number.isFinite(n) && n > 0));
  // Buildings whose content isn't installed are KEPT (shown closed) so nothing is lost if a
  // module or world pack is temporarily unavailable. Only malformed entries are dropped.
  out.buildings = (out.buildings ?? []).filter((b) => b && typeof b.type === 'string' && Number.isInteger(b.x) && Number.isInteger(b.z) && typeof b.uid === 'string');
  for (const b of out.buildings) {
    const def = BUILDINGS[b.type];
    if (def && !b.fp) b.fp = [...def.footprint];
    b.level = Math.max(1, b.level | 0);
    if (def) b.level = Math.min(b.level, def.levels.length);
    b.queue = Array.isArray(b.queue) ? b.queue : [];
    // Clock-skew protection: timers far in the future are clamped.
    if (b.busyUntil !== null && b.busyUntil > now + 7 * 86_400_000) b.busyUntil = now;
    if (b.passiveSince > now) b.passiveSince = now;
  }
  if (!out.buildings.some((b) => b.type === 'starter_house')) out.buildings.push(...fresh.buildings.filter((b) => b.type === 'starter_house'));
  // Shared community spots (added in save v5): state for each, and their place in the world.
  out.spots = { ...emptySpots(), ...(s.spots ?? {}) };
  let uid = out.uidCounter ?? out.buildings.length;
  out.buildings.push(...spotBuildings(out.buildings, now, () => `b${++uid}`));
  out.uidCounter = uid;
  return out;
}

export const BACKUP_KEY = 'pockethood.save.sync';

/** Synchronous storage for the unload-time snapshot (IndexedDB writes are async). */
export interface SyncStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

const lastSeenOf = (raw?: string | null) => {
  if (!raw) return -1;
  const m = raw.match(/"lastSeen":(\d+)/);
  return m ? Number(m[1]) : 0;
};

export class SaveService {
  constructor(
    private store: StorageAdapter,
    private sync: SyncStore | null = typeof localStorage !== 'undefined' ? localStorage : null,
  ) {}

  /**
   * @param prepare called with the save's world id (or null for a new game) before the save is
   *   repaired, so the caller can install that world's content first.
   */
  async load(now: number, prepare: (worldId: string | null) => void = () => {}): Promise<{ state: GameState; fresh: boolean; recovered: boolean }> {
    let raw: string | undefined;
    try {
      raw = await this.store.get(SAVE_KEY);
    } catch {
      raw = undefined;
    }
    // Prefer the unload-time snapshot if it is newer than the async save.
    let backup: string | null = null;
    try {
      backup = this.sync?.getItem(BACKUP_KEY) ?? null;
    } catch {
      backup = null;
    }
    if (backup && lastSeenOf(backup) > lastSeenOf(raw)) raw = backup;
    if (!raw) {
      prepare(null);
      return { state: createNewGame(now), fresh: true, recovered: false };
    }
    try {
      const parsed = JSON.parse(raw) as AnySave;
      prepare(worldOf(parsed));
      return { state: sanitize(migrate(parsed), now), fresh: false, recovered: false };
    } catch (e) {
      console.warn('Save could not be read; starting fresh and keeping a backup.', e);
      await this.store.set(`${SAVE_KEY}.corrupt.${now}`, raw).catch(() => {});
      prepare(null);
      return { state: createNewGame(now), fresh: true, recovered: true };
    }
  }

  async save(state: GameState) {
    await this.store.set(SAVE_KEY, JSON.stringify(state));
  }

  /** Called on pagehide/visibility change: guaranteed to finish before the page unloads. */
  saveSync(state: GameState) {
    try {
      this.sync?.setItem(BACKUP_KEY, JSON.stringify(state));
    } catch {
      /* quota exceeded: the async save still runs */
    }
  }

  async reset() {
    await this.store.del(SAVE_KEY);
    try {
      this.sync?.removeItem(BACKUP_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function memoryAdapter(): StorageAdapter & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    get: async (k) => data.get(k),
    set: async (k, v) => void data.set(k, v),
    del: async (k) => void data.delete(k),
  };
}

export async function browserAdapter(): Promise<StorageAdapter> {
  try {
    const idb = await import('idb-keyval');
    // Probe: IndexedDB can be unavailable (private mode, blocked storage).
    await idb.set('pockethood.probe', '1');
    return { get: (k) => idb.get(k), set: (k, v) => idb.set(k, v), del: (k) => idb.del(k) };
  } catch {
    return {
      get: async (k) => safeGet(k) ?? undefined,
      set: async (k, v) => safeSet(k, v),
      del: async (k) => safeRemove(k),
    };
  }
}
