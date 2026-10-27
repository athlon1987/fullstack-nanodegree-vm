// Seri Bayu, the modern Klang Valley world: it is the default for Malaysia, it uses the
// modern KL kit throughout, it is fully bilingual and policy-clean, and it plays like the others.
import { beforeAll, describe, expect, it } from 'vitest';
import { BUILDINGS } from '../data/buildings';
import { WORLD } from '../data/world';
import { createNewGame } from '../game/core/newGame';
import { ARCHETYPES } from './content/catalog';
import { scanDocument } from './content/policy';
import { worldSchema } from './content/schema';
import { activate, bundledFetcher, defaultWorldId, initContent } from './content/service';
import { run } from './validate';

const T0 = new Date('2026-11-02T09:00:00').getTime();
const ID = 'my.seri_bayu';
const raw = async (p: string) => JSON.parse(await bundledFetcher(p));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pack: any;

beforeAll(async () => {
  await initContent({ remoteBase: null, cache: null });
  pack = await raw(`worlds/${ID}.json`);
});

/** Every localised string in a document: objects whose keys are all locale codes. */
function texts(node: unknown, path = '$', out: [string, Record<string, string>][] = []) {
  if (node && typeof node === 'object') {
    const keys = Object.keys(node);
    if (keys.length && keys.every((k) => /^[a-z]{2}-[A-Z]{2}$/.test(k))) out.push([path, node as Record<string, string>]);
    else for (const k of keys) texts((node as Record<string, unknown>)[k], `${path}.${k}`, out);
  }
  return out;
}

describe('Seri Bayu (modern Klang Valley world)', () => {
  it('is valid and is the default world for Malaysia', () => {
    expect(run(worldSchema, pack).ok).toBe(true);
    expect(defaultWorldId()).toBe(ID);
  });

  it('installs with the urban style and the modern KL kit for every building it dresses', () => {
    activate(ID, 'en', T0);
    expect(WORLD.style).toBe('urban');
    const overridden = Object.entries(pack.buildings as Record<string, { archetype?: string }>).filter(([, b]) => b.archetype);
    expect(overridden.length).toBeGreaterThan(15);
    for (const [id, b] of overridden) {
      expect(b.archetype, id).toMatch(/^kl:/);
      expect(ARCHETYPES, id).toContain(b.archetype);
      expect(BUILDINGS[id].archetype, id).toBe(b.archetype);
    }
    // No village houses anywhere in the main environment.
    expect(JSON.stringify(pack)).not.toMatch(/my:rumah_kampung|my:rumah_papan/);
  });

  it('places the city landmarks around the neighbourhood as fixed scenery', () => {
    activate(ID, 'en', T0);
    const g = createNewGame(T0);
    for (const t of ['mall', 'school', 'clinic_row', 'petrol_station']) expect(g.buildings.some((b) => b.type === t), t).toBe(true);
  });

  it('every player-facing text is in English and Malay', () => {
    const all = texts(pack);
    expect(all.length).toBeGreaterThan(200);
    for (const [path, t] of all) {
      expect(t['en-MY']?.trim(), `${path} en`).toBeTruthy();
      expect(t['ms-MY']?.trim(), `${path} ms`).toBeTruthy();
    }
  });

  it('passes the content policy screen', () => {
    expect(scanDocument(pack)).toEqual([]);
  });

  it('keeps the shared tutorial and economy: same quest ids, order and rewards as Kampung Seri', async () => {
    const kampung = await raw('worlds/my.kampung_seri.json');
    const shape = (q: { id: string; after?: string; minLevel?: number; reward?: unknown; tutorial?: boolean }) => [q.id, q.after, q.minLevel, JSON.stringify(q.reward), q.tutorial];
    const ours = new Map((pack.quests as { id: string }[]).map((q) => [q.id, shape(q as never)]));
    for (const q of kampung.quests) expect(ours.get(q.id), q.id).toEqual(shape(q));
  });
});
