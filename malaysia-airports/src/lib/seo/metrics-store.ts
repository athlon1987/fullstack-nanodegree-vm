/**
 * Moved in round 4 (E-17, layout package): the aggregate metric store is now durable and lives in
 * `src/components/platform/metrics-store.ts` (file, KV or memory adapter behind one interface).
 * This module re-exports it so existing imports keep working.
 */
export { createMemoryMetricsStore, createMetricsStore, sharedMetrics, type MetricCount, type MetricsStore } from '@/components/platform/metrics-store';
