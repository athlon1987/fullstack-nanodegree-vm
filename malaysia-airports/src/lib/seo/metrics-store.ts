/**
 * In-memory aggregate counts for `/api/metrics` (per process; a shared store replaces it with
 * several instances). Keys hold only the day and the validated measurement fields.
 */
import type { Metric } from '@/components/platform/metrics';

export interface MetricsStore {
  add(metric: Metric, day: string): void;
  summary(): { key: string; count: number }[];
}

export function createMetricsStore(maxKeys = 2000): MetricsStore {
  const counts = new Map<string, number>();
  return {
    add(metric, day) {
      const key = [day, metric.event, metric.name, metric.state ?? metric.host ?? '', metric.section].join(' | ');
      if (!counts.has(key) && counts.size >= maxKeys) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    },
    summary() {
      return [...counts].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count).slice(0, 200);
    },
  };
}

const KEY = Symbol.for('malaysia-airports.metrics');

export function sharedMetrics(): MetricsStore {
  const holder = globalThis as typeof globalThis & { [KEY]?: MetricsStore };
  holder[KEY] ??= createMetricsStore();
  return holder[KEY];
}
