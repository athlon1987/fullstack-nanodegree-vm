/**
 * Safe, versioned, validated client storage with cross-tab sync.
 *
 * `createStore` wraps one `localStorage` entry:
 *  - keys are namespaced and versioned (`ma:airport:v1`), so a shape change is a version bump
 *    and old data is simply ignored;
 *  - every read is validated (a `Validator`: the small `check` toolkit below, or any zod schema);
 *    anything invalid falls back to the default;
 *  - storage being unavailable (private mode, blocked cookies, server render) never throws: the
 *    store keeps working in memory;
 *  - `subscribe` / `getSnapshot` / `getServerSnapshot` plug straight into
 *    `useSyncExternalStore`, with the default value as the server snapshot, so components are
 *    hydration-safe;
 *  - changes made in another tab arrive through the `storage` event.
 *
 * Nothing personal leaves the browser: this module never talks to the network.
 *
 * Bundle size (performance-08): this module and the app's own stores validate with the
 * hand-written `check` toolkit, so zod and the content schemas stay out of the browser shell.
 */

/* ---- Validation ----------------------------------------------------------------------------- */

/**
 * What a store needs from a schema: a `safeParse` that never throws. Zod schemas (classic or
 * mini) match it, and so do validators built with `check` + `validator`.
 */
export interface Validator<T> {
  safeParse(input: unknown): { success: true; data: T } | { success: false };
}

const INVALID: unique symbol = Symbol('invalid');
type Invalid = typeof INVALID;

/** A check returns the (cleaned) value, or `INVALID`. */
export type Check<T> = (input: unknown) => T | Invalid;
type Out<C> = C extends Check<infer T> ? T : never;
type OptionalKeys<S> = { [K in keyof S]: undefined extends Out<S[K]> ? K : never }[keyof S];
type Simplify<T> = { [K in keyof T]: T[K] } & {};
type ObjectOut<S> = Simplify<{ [K in Exclude<keyof S, OptionalKeys<S>>]: Out<S[K]> } & { [K in OptionalKeys<S>]?: Exclude<Out<S[K]>, undefined> }>;

/** The value type a check or validator accepts. */
export type Infer<C> = C extends Validator<infer T> ? T : Out<C>;

const isRecord = (input: unknown): input is Record<string, unknown> => typeof input === 'object' && input !== null && !Array.isArray(input);

/** Tiny, tree-shakable validation for stored JSON. Unknown object keys are dropped. */
export const check = {
  string:
    (options: { min?: number; max?: number; pattern?: RegExp } = {}): Check<string> =>
    (input) =>
      typeof input === 'string' && input.length >= (options.min ?? 0) && input.length <= (options.max ?? Number.POSITIVE_INFINITY) && (!options.pattern || options.pattern.test(input))
        ? input
        : INVALID,
  boolean: (): Check<boolean> => (input) => (typeof input === 'boolean' ? input : INVALID),
  oneOf:
    <const V extends readonly (string | number | boolean)[]>(values: V): Check<V[number]> =>
    (input) =>
      (values as readonly unknown[]).includes(input) ? (input as V[number]) : INVALID,
  optional:
    <T>(inner: Check<T>): Check<T | undefined> =>
    (input) =>
      input === undefined ? undefined : inner(input),
  nullable:
    <T>(inner: Check<T>): Check<T | null> =>
    (input) =>
      input === null ? null : inner(input),
  object:
    <S extends Record<string, Check<unknown>>>(shape: S): Check<ObjectOut<S>> =>
    (input) => {
      if (!isRecord(input)) return INVALID;
      const output: Record<string, unknown> = {};
      for (const [key, inner] of Object.entries(shape)) {
        const value = inner(input[key]);
        if (value === INVALID) return INVALID;
        if (value !== undefined) output[key] = value;
      }
      return output as ObjectOut<S>;
    },
  /**
   * An array of at most `max` items. With `dropInvalid`, items that fail are left out instead of
   * failing the whole value (one tampered saved place must not wipe the saved journey).
   */
  array:
    <T>(item: Check<T>, options: { max?: number; dropInvalid?: boolean } = {}): Check<T[]> =>
    (input) => {
      if (!Array.isArray(input) || input.length > (options.max ?? Number.POSITIVE_INFINITY)) return INVALID;
      const output: T[] = [];
      for (const entry of input) {
        const value = item(entry);
        if (value === INVALID) {
          if (options.dropInvalid) continue;
          return INVALID;
        }
        output.push(value);
      }
      return output;
    },
  /** A plain object of string keys to values, each key and value checked (round 2: `follow.ts`). */
  record:
    <V>(key: Check<string>, value: Check<V>): Check<Record<string, V>> =>
    (input) => {
      if (!isRecord(input)) return INVALID;
      const output: Record<string, V> = {};
      for (const [name, entry] of Object.entries(input)) {
        const checked = value(entry);
        if (key(name) === INVALID || checked === INVALID) return INVALID;
        output[name] = checked;
      }
      return output;
    },
};

/** Wrap a check as a `Validator` for `createStore`. */
export function validator<T>(rule: Check<T>): Validator<T> {
  return {
    safeParse(input) {
      const value = rule(input);
      return value === INVALID ? { success: false } : { success: true, data: value };
    },
  };
}

/* ---- Stores --------------------------------------------------------------------------------- */

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
  /** Validates whatever is read from storage (a `validator(check…)` or a zod schema). */
  schema: Validator<T>;
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
