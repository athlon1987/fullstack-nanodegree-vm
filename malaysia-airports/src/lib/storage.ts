/**
 * Safe, versioned, validated client storage with cross-tab sync.
 *
 * `createStore` wraps one `localStorage` entry:
 *  - keys are namespaced and versioned (`ma:airport:v1`), so a shape change is a version bump
 *    and old data is simply ignored;
 *  - every read is validated with a zod schema; anything invalid falls back to the default;
 *  - storage being unavailable (private mode, blocked cookies, server render) never throws: the
 *    store keeps working in memory;
 *  - `subscribe` / `getSnapshot` / `getServerSnapshot` plug straight into
 *    `useSyncExternalStore`, with the default value as the server snapshot, so components are
 *    hydration-safe;
 *  - changes made in another tab arrive through the `storage` event.
 *
 * Nothing personal leaves the browser: this module never talks to the network.
 */
import type { z } from 'zod';

/** The part of the Web Storage API a store needs. Tests pass an in-memory implementation. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Namespace prefix for every key this app writes. */
export const STORAGE_PREFIX = 'ma';

/** The full storage key for a store: `storageKey('airport', 1)` is `ma:airport:v1`. */
export function storageKey(name: string, version: number): string {
  return `${STORAGE_PREFIX}:${name}:v${version}`;
}

/** Options for `createStore`. */
export interface StoreOptions<T> {
  /** Short name, for example `airport`. */
  name: string;
  /** Bump when the stored shape changes incompatibly. */
  version: number;
  /** Validates whatever is read from storage. */
  schema: z.ZodType<T>;
  /** Used on the server, before hydration, and whenever stored data is missing or invalid. */
  defaultValue: T;
  /**
   * Storage to use. Defaults to `window.localStorage` when available. Pass `null` to force
   * memory-only behaviour, or a `StorageLike` in tests.
   */
  storage?: StorageLike | null;
}

/** A single validated storage entry. */
export interface Store<T> {
  /** The full storage key. */
  readonly key: string;
  /** Current value (validated). Returns the same reference until the value changes. */
  get(): T;
  /** Replace the value, or derive it from the current one. Invalid values are rejected. */
  set(next: T | ((current: T) => T)): void;
  /** Remove the entry and go back to the default. */
  clear(): void;
  /** Listen for changes from this tab and other tabs. Returns the unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** For `useSyncExternalStore`: same as `get`. */
  getSnapshot(): T;
  /** For `useSyncExternalStore`: always the default value. */
  getServerSnapshot(): T;
}

function browserStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Create a store. Call it once per entry at module scope and share the instance. */
export function createStore<T>(options: StoreOptions<T>): Store<T> {
  const key = storageKey(options.name, options.version);
  const listeners = new Set<() => void>();
  let loaded = false;
  let value = options.defaultValue;

  const resolveStorage = (): StorageLike | null => (options.storage !== undefined ? options.storage : browserStorage());

  const parse = (raw: string | null): T => {
    if (raw === null) return options.defaultValue;
    try {
      const result = options.schema.safeParse(JSON.parse(raw));
      return result.success ? result.data : options.defaultValue;
    } catch {
      return options.defaultValue;
    }
  };

  const load = (): void => {
    loaded = true;
    try {
      value = parse(resolveStorage()?.getItem(key) ?? null);
    } catch {
      value = options.defaultValue;
    }
  };

  const notify = (): void => {
    for (const listener of [...listeners]) listener();
  };

  const onStorage = (event: StorageEvent): void => {
    if (event.key !== null && event.key !== key) return;
    const before = value;
    load();
    if (JSON.stringify(before) === JSON.stringify(value)) {
      value = before;
      return;
    }
    notify();
  };

  const get = (): T => {
    if (!loaded) load();
    return value;
  };

  return {
    key,
    get,
    getSnapshot: get,
    getServerSnapshot: () => options.defaultValue,
    set(next) {
      const current = get();
      const candidate = typeof next === 'function' ? (next as (current: T) => T)(current) : next;
      const result = options.schema.safeParse(candidate);
      if (!result.success) return;
      value = result.data;
      try {
        resolveStorage()?.setItem(key, JSON.stringify(value));
      } catch {
        // Storage is full or blocked: keep the value in memory for this visit.
      }
      notify();
    },
    clear() {
      value = options.defaultValue;
      loaded = true;
      try {
        resolveStorage()?.removeItem(key);
      } catch {
        // Nothing to remove when storage is unavailable.
      }
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1 && typeof window !== 'undefined') window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
      };
    },
  };
}
