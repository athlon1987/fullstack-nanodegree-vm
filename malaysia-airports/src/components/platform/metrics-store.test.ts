import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Metric } from './metrics';
import { createFileMetricsStore, createKvMetricsStore, createMemoryMetricsStore, metricsStoreFromEnv } from './metrics-store';

const answer: Metric = { event: 'answer', name: 'parking-price', state: 'answered', section: '/en/kul/parking' };
const handoff: Metric = { event: 'handoff', name: 'fast-track-booking', host: 'www.example.com', section: '/en/kul/facilities' };

const dirs: string[] = [];
async function tempFile() {
  const dir = await mkdtemp(join(tmpdir(), 'metrics-'));
  dirs.push(dir);
  return join(dir, 'nested', 'metrics.json');
}
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('durable aggregate metric store (E-17, round 4)', () => {
  it('memory: counts per day and measurement and ignores malformed days', async () => {
    const store = createMemoryMetricsStore();
    await store.add(answer, '2026-11-21');
    await store.add(answer, '2026-11-21');
    await store.add(answer, 'yesterday');
    expect(await store.summary()).toEqual([{ key: '2026-11-21 | answer | parking-price | answered | /en/kul/parking', count: 2 }]);
  });

  it('file: counts survive a restart (a new store on the same file)', async () => {
    const path = await tempFile();
    const first = createFileMetricsStore({ path, flushMs: 10_000 });
    await first.add(answer, '2026-11-21');
    await first.add(handoff, '2026-11-21');
    await first.add(handoff, '2026-11-21');
    await first.flush();
    const saved = JSON.parse(await readFile(path, 'utf8'));
    expect(saved).toEqual({
      version: 1,
      counts: {
        '2026-11-21 | answer | parking-price | answered | /en/kul/parking': 1,
        '2026-11-21 | handoff | fast-track-booking | www.example.com | /en/kul/facilities': 2,
      },
    });
    // Only aggregates: no field beyond the validated measurement and the day.
    expect(JSON.stringify(saved)).not.toMatch(/ip|agent|cookie|T\\d\\d:/i);

    const second = createFileMetricsStore({ path });
    await second.add(handoff, '2026-11-21');
    expect((await second.summary())[0]).toEqual({ key: '2026-11-21 | handoff | fast-track-booking | www.example.com | /en/kul/facilities', count: 3 });
    expect(second.status()).toMatchObject({ kind: 'file', errors: 0, degraded: false });
  });

  it('file: writes on its own after the delay, and drops days older than the retention', async () => {
    const path = await tempFile();
    const store = createFileMetricsStore({ path, flushMs: 5, retentionDays: 30 });
    await store.add(answer, '2026-09-01');
    await store.add(answer, '2026-11-21');
    await vi.waitFor(async () => expect(JSON.parse(await readFile(path, 'utf8')).counts).toEqual({ '2026-11-21 | answer | parking-price | answered | /en/kul/parking': 1 }));
  });

  it('file: a corrupt file starts afresh and is counted as an error', async () => {
    const path = await tempFile();
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, '{not json', 'utf8');
    const store = createFileMetricsStore({ path });
    expect(await store.summary()).toEqual([]);
    expect(store.status().errors).toBe(1);
  });

  it('file: an unwritable location degrades to memory without throwing', async () => {
    const path = await tempFile();
    const blocker = join(path, '..');
    await rm(blocker, { recursive: true, force: true });
    await writeFile(blocker, 'a file where the folder should be', 'utf8');
    const store = createFileMetricsStore({ path, flushMs: 10_000 });
    await store.add(answer, '2026-11-21');
    await expect(store.flush()).resolves.toBeUndefined();
    // The read and the write both fail (the folder is a file): each is counted, neither thrown.
    expect(store.status()).toMatchObject({ degraded: true, errors: 2 });
    expect(await store.summary()).toHaveLength(1);
  });

  it('kv: one HINCRBY and EXPIRE per count, and the summary reads the last days back', async () => {
    const calls: { url: string; body: unknown; auth: string | null }[] = [];
    const fake = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      calls.push({ url: String(url), body, auth: new Headers(init?.headers).get('authorization') });
      if (body[0][0] === 'HGETALL') return Response.json(body.map((_: unknown, index: number) => ({ result: index === 0 ? ['answer | parking-price | answered | /en/kul/parking', '4'] : [] })));
      return Response.json([{ result: 1 }, { result: 1 }]);
    });
    const store = createKvMetricsStore({ url: 'https://kv.example/', token: 'secret-token', fetch: fake as unknown as typeof fetch, summaryDays: 3, today: () => '2026-11-21' });
    await store.add(answer, '2026-11-21');
    expect(calls[0]).toEqual({
      url: 'https://kv.example/pipeline',
      auth: 'Bearer secret-token',
      body: [
        ['HINCRBY', 'metrics:2026-11-21', 'answer | parking-price | answered | /en/kul/parking', 1],
        ['EXPIRE', 'metrics:2026-11-21', 400 * 86_400],
      ],
    });
    expect(await store.summary()).toEqual([{ key: '2026-11-21 | answer | parking-price | answered | /en/kul/parking', count: 4 }]);
    expect(calls[1].body).toEqual([
      ['HGETALL', 'metrics:2026-11-21'],
      ['HGETALL', 'metrics:2026-11-20'],
      ['HGETALL', 'metrics:2026-11-19'],
    ]);
  });

  it('kv: a failing store is counted, never thrown, and the token is not exposed', async () => {
    const store = createKvMetricsStore({ url: 'https://kv.example', token: 'secret-token', fetch: (async () => new Response('no', { status: 500 })) as unknown as typeof fetch });
    await expect(store.add(answer, '2026-11-21')).resolves.toBeUndefined();
    expect(await store.summary()).toEqual([]);
    expect(store.status()).toEqual({ kind: 'kv', errors: 2 });
    expect(JSON.stringify(store.status())).not.toContain('secret');
  });

  it('chooses the adapter from the environment', () => {
    expect(metricsStoreFromEnv({}).kind).toBe('file');
    expect(metricsStoreFromEnv({ METRICS_STORE: 'memory' }).kind).toBe('memory');
    expect(metricsStoreFromEnv({ METRICS_STORE: 'kv', METRICS_KV_URL: 'https://kv.example', METRICS_KV_TOKEN: 't' }).kind).toBe('kv');
    // Incomplete or insecure KV settings keep the counts in the file rather than losing them.
    expect(metricsStoreFromEnv({ METRICS_STORE: 'kv', METRICS_KV_URL: 'http://kv.example', METRICS_KV_TOKEN: 't' }).kind).toBe('file');
    expect(metricsStoreFromEnv({ METRICS_STORE: 'kv' }).kind).toBe('file');
  });
});
