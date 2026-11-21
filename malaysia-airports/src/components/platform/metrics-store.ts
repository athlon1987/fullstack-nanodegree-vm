/**
 * Durable aggregate counts for `/api/metrics` (E-17, round 4). Replaces the per-process in-memory
 * map, whose counts were lost on every restart and split across instances.
 *
 * One interface, three adapters, chosen by environment variables (`metricsStoreFromEnv`):
 *
 * | `METRICS_STORE` | Where the counts live | Use |
 * |---|---|---|
 * | `file` (default) | A JSON file (`METRICS_STORE_FILE`, default `.data/metrics.json`), written atomically a few seconds after the last count | The prototype and any single-instance `next start`; survives restarts |
 * | `kv` | A Redis-compatible REST store (`METRICS_KV_URL`, `METRICS_KV_TOKEN`; Upstash's REST API and its pipeline endpoint), one hash per day, `HINCRBY` | Production with several instances or a read-only file system |
 * | `memory` | This process only | Tests, and the fallback when the file cannot be written |
 *
 * What is stored is only what `parseMetric` lets through, as aggregate counts keyed by
 * `day | event | name | state-or-host | section`: no visitor, address, cookie, user agent, query,
 * flight or time finer than the day (docs/engineering/security.md, "Measurement and privacy").
 * The store never throws into a request: a failed write is counted in `status()` and the
 * measurement is dropped.
 */
import 'server-only';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { Metric } from './metrics';

export type MetricsStoreKind = 'memory' | 'file' | 'kv';

export interface MetricCount {
  key: string;
  count: number;
}

export interface MetricsStoreStatus {
  kind: MetricsStoreKind;
  /** Counts kept (keys), where the adapter can tell. */
  keys?: number;
  /** Writes or reads that failed since the process started (each dropped, never thrown). */
  errors: number;
  /** True when a file store could not write and fell back to memory. */
  degraded?: boolean;
}

/** The aggregate store `/api/metrics` writes to and `/api/health` reads from. */
export interface MetricsStore {
  readonly kind: MetricsStoreKind;
  /** Count one validated measurement for its day (`YYYY-MM-DD`). Never rejects. */
  add(metric: Metric, day: string): Promise<void>;
  /** The most frequent keys (at most 200), highest first. Never rejects. */
  summary(): Promise<MetricCount[]>;
  status(): MetricsStoreStatus;
  /** Write anything pending now (file store); a no-op elsewhere. */
  flush(): Promise<void>;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const SUMMARY_LIMIT = 200;

/** `event | name | state-or-host | section`: the part of a key below the day. */
export function metricField(metric: Metric): string {
  return [metric.event, metric.name, metric.state ?? metric.host ?? '', metric.section].join(' | ');
}

/** The full key: `day | event | name | state-or-host | section`. */
export function metricKey(metric: Metric, day: string): string {
  return `${day} | ${metricField(metric)}`;
}

function top(counts: Iterable<[string, number]>): MetricCount[] {
  return [...counts]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, SUMMARY_LIMIT);
}

/** Drop the days older than `retentionDays` before the newest day held (no clock is read). */
function prune(counts: Map<string, number>, retentionDays: number): void {
  let newest = '';
  for (const key of counts.keys()) {
    const day = key.slice(0, 10);
    if (day > newest) newest = day;
  }
  if (!newest) return;
  const cutoff = new Date(Date.parse(`${newest}T00:00:00Z`) - retentionDays * 86_400_000).toISOString().slice(0, 10);
  for (const key of [...counts.keys()]) if (key.slice(0, 10) < cutoff) counts.delete(key);
}

/** Counts in this process only. `maxKeys` bounds memory: new keys beyond it are dropped. */
export function createMemoryMetricsStore(maxKeys = 2000): MetricsStore {
  const counts = new Map<string, number>();
  return {
    kind: 'memory',
    async add(metric, day) {
      if (!DAY.test(day)) return;
      const key = metricKey(metric, day);
      if (!counts.has(key) && counts.size >= maxKeys) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    },
    async summary() {
      return top(counts);
    },
    status: () => ({ kind: 'memory', keys: counts.size, errors: 0 }),
    async flush() {},
  };
}

/** @deprecated Round 4: use `createMemoryMetricsStore` (same behaviour, asynchronous interface). */
export const createMetricsStore = createMemoryMetricsStore;

export interface FileMetricsStoreOptions {
  /** The JSON file. Relative paths resolve against the working directory. */
  path: string;
  maxKeys?: number;
  /** Days of counts kept, counted back from the newest day held (default 400). */
  retentionDays?: number;
  /** Delay before a write after the last count, in milliseconds (default 2000). */
  flushMs?: number;
}

interface FileShape {
  version: 1;
  counts: Record<string, number>;
}

/**
 * Counts in a JSON file: loaded once, kept in memory, written atomically (a temporary file, then a
 * rename) `flushMs` after the last count. If the file cannot be written (a read-only deployment),
 * the store keeps counting in memory, says so in `status().degraded`, and stops trying.
 * One process per file: with several instances use the KV store.
 */
export function createFileMetricsStore({ path, maxKeys = 5000, retentionDays = 400, flushMs = 2000 }: FileMetricsStoreOptions): MetricsStore {
  const file = resolve(path);
  const counts = new Map<string, number>();
  let loaded: Promise<void> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let dirty = false;
  let writing: Promise<void> = Promise.resolve();
  let errors = 0;
  let degraded = false;

  const load = () =>
    (loaded ??= (async () => {
      try {
        const parsed = JSON.parse(await readFile(file, 'utf8')) as Partial<FileShape>;
        if (parsed && parsed.version === 1 && parsed.counts && typeof parsed.counts === 'object') {
          for (const [key, value] of Object.entries(parsed.counts)) {
            if (typeof value === 'number' && Number.isFinite(value) && value > 0 && DAY.test(key.slice(0, 10))) counts.set(key, Math.floor(value));
          }
        }
      } catch (error) {
        // A missing file is a fresh store; anything else (unreadable, not JSON) is counted and started afresh.
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') errors += 1;
      }
    })());

  const write = async () => {
    if (!dirty || degraded) return;
    dirty = false;
    prune(counts, retentionDays);
    const body: FileShape = { version: 1, counts: Object.fromEntries(counts) };
    const temporary = `${file}.${process.pid}.tmp`;
    try {
      await mkdir(dirname(file), { recursive: true });
      await writeFile(temporary, JSON.stringify(body), 'utf8');
      await rename(temporary, file);
    } catch {
      errors += 1;
      degraded = true;
    }
  };

  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    writing = writing.then(write, write);
    return writing;
  };

  const schedule = () => {
    dirty = true;
    if (timer || degraded) return;
    timer = setTimeout(() => void flush(), flushMs);
    // Never keep a process alive just to write counts.
    (timer as { unref?: () => void }).unref?.();
  };

  return {
    kind: 'file',
    async add(metric, day) {
      if (!DAY.test(day)) return;
      await load();
      const key = metricKey(metric, day);
      if (!counts.has(key) && counts.size >= maxKeys) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      schedule();
    },
    async summary() {
      await load();
      return top(counts);
    },
    status: () => ({ kind: 'file', keys: counts.size, errors, degraded }),
    flush: async () => {
      await load();
      await flush();
    },
  };
}

export interface KvMetricsStoreOptions {
  /** The REST endpoint, e.g. `https://<name>.upstash.io`. */
  url: string;
  /** Bearer token. Read from the environment; never logged or returned. */
  token: string;
  /** Key prefix (default `metrics`): one hash per day, `metrics:2026-11-21`. */
  prefix?: string;
  /** Days a day's hash is kept (default 400). */
  retentionDays?: number;
  /** Days read back for `summary()` (default 14). */
  summaryDays?: number;
  /** Injected in tests. */
  fetch?: typeof fetch;
  /** Injected in tests: today's date key for `summary()`. */
  today?: () => string;
}

/**
 * Counts in a Redis-compatible REST store (Upstash's REST API: `POST /pipeline` with a JSON array
 * of commands and `Authorization: Bearer`). Each count is one `HINCRBY` on the day's hash plus an
 * `EXPIRE`, so instances never overwrite each other. Errors are counted and dropped.
 */
export function createKvMetricsStore({ url, token, prefix = 'metrics', retentionDays = 400, summaryDays = 14, fetch: doFetch = fetch, today }: KvMetricsStoreOptions): MetricsStore {
  const endpoint = `${url.replace(/\/+$/, '')}/pipeline`;
  let errors = 0;
  const call = async (commands: (string | number)[][]): Promise<{ result?: unknown }[] | null> => {
    try {
      const response = await doFetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(commands),
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) {
        errors += 1;
        return null;
      }
      return (await response.json()) as { result?: unknown }[];
    } catch {
      errors += 1;
      return null;
    }
  };
  return {
    kind: 'kv',
    async add(metric, day) {
      if (!DAY.test(day)) return;
      const hash = `${prefix}:${day}`;
      await call([
        ['HINCRBY', hash, metricField(metric), 1],
        ['EXPIRE', hash, retentionDays * 86_400],
      ]);
    },
    async summary() {
      const end = today?.() ?? new Date().toISOString().slice(0, 10);
      const days = Array.from({ length: summaryDays }, (_, index) => new Date(Date.parse(`${end}T00:00:00Z`) - index * 86_400_000).toISOString().slice(0, 10));
      const replies = await call(days.map((day) => ['HGETALL', `${prefix}:${day}`]));
      if (!replies) return [];
      const counts = new Map<string, number>();
      replies.forEach((reply, index) => {
        const flat = Array.isArray(reply?.result) ? (reply.result as unknown[]) : [];
        for (let i = 0; i + 1 < flat.length; i += 2) {
          const count = Number(flat[i + 1]);
          if (typeof flat[i] === 'string' && Number.isFinite(count)) counts.set(`${days[index]} | ${flat[i]}`, count);
        }
      });
      return top(counts);
    },
    status: () => ({ kind: 'kv', errors }),
    async flush() {},
  };
}

/** The environment variables the store reads. */
export interface MetricsStoreEnv {
  METRICS_STORE?: string;
  METRICS_STORE_FILE?: string;
  METRICS_KV_URL?: string;
  METRICS_KV_TOKEN?: string;
}

/** Default file for the prototype's counts (ignored by git). */
export const DEFAULT_METRICS_FILE = '.data/metrics.json';

/**
 * The store the environment asks for: `kv` when `METRICS_STORE=kv` and both KV variables are set
 * (an https URL), `memory` when asked, otherwise `file`. A `kv` request without its settings falls
 * back to the file store rather than losing counts.
 */
export function metricsStoreFromEnv(env: MetricsStoreEnv): MetricsStore {
  const kind = (env.METRICS_STORE ?? 'file').trim().toLowerCase();
  if (kind === 'memory') return createMemoryMetricsStore();
  if (kind === 'kv' && env.METRICS_KV_URL?.startsWith('https://') && env.METRICS_KV_TOKEN) {
    return createKvMetricsStore({ url: env.METRICS_KV_URL, token: env.METRICS_KV_TOKEN });
  }
  return createFileMetricsStore({ path: env.METRICS_STORE_FILE || DEFAULT_METRICS_FILE });
}

const KEY = Symbol.for('malaysia-airports.metrics.v2');

/** The process-wide store, created from the environment on first use. */
export function sharedMetrics(): MetricsStore {
  const holder = globalThis as typeof globalThis & { [KEY]?: MetricsStore };
  holder[KEY] ??= metricsStoreFromEnv({
    METRICS_STORE: process.env.METRICS_STORE,
    METRICS_STORE_FILE: process.env.METRICS_STORE_FILE,
    METRICS_KV_URL: process.env.METRICS_KV_URL,
    METRICS_KV_TOKEN: process.env.METRICS_KV_TOKEN,
  });
  return holder[KEY];
}
