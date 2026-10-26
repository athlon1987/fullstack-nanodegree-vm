// Versioned local-first persistence. IndexedDB (via idb-keyval) with a
// localStorage fallback; saves are schema-versioned and migrated on load.
import { createNewGame, DEFAULT_SETTINGS, SAVE_VERSION } from '../game/core/newGame';
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
};

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
  out.coins = Number.isFinite(out.coins) ? Math.max(0, Math.floor(out.coins)) : fresh.coins;
  out.gems = Number.isFinite(out.gems) ? Math.max(0, Math.floor(out.gems)) : fresh.gems;
  out.xp = Number.isFinite(out.xp) ? Math.max(0, out.xp) : 0;
  out.inventory = Object.fromEntries(Object.entries(out.inventory ?? {}).filter(([, n]) => Number.isFinite(n) && n > 0));
  out.buildings = (out.buildings ?? []).filter((b) => b && BUILDINGS[b.type]);
  for (const b of out.buildings) {
    b.level = Math.min(Math.max(1, b.level | 0), BUILDINGS[b.type].levels.length);
    b.queue = Array.isArray(b.queue) ? b.queue : [];
    // Clock-skew protection: timers far in the future are clamped.
    if (b.busyUntil !== null && b.busyUntil > now + 7 * 86_400_000) b.busyUntil = now;
    if (b.passiveSince > now) b.passiveSince = now;
  }
  if (!out.buildings.some((b) => b.type === 'starter_house')) out.buildings.push(...fresh.buildings.filter((b) => b.type === 'starter_house'));
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

  async load(now: number): Promise<{ state: GameState; fresh: boolean; recovered: boolean }> {
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
    if (!raw) return { state: createNewGame(now), fresh: true, recovered: false };
    try {
      const parsed = JSON.parse(raw) as AnySave;
      return { state: sanitize(migrate(parsed), now), fresh: false, recovered: false };
    } catch (e) {
      console.warn('Save could not be read; starting fresh and keeping a backup.', e);
      await this.store.set(`${SAVE_KEY}.corrupt.${now}`, raw).catch(() => {});
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
