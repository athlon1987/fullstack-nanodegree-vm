// Weather, visit links, localisation coverage, icon catalogue and bundled content integrity.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { createNewGame } from '../game/core/newGame';
import { rainAt } from '../game/world/weather';
import { decodeVisit, encodeVisit, visitState } from '../services/visit';
import { hasIcon } from '../ui/components/Icon';
import { ICONS } from './content/catalog';
import { loadBundle } from './content/loader';
import { activate, bundledFetcher, initContent } from './content/service';
import { DICTS } from './i18n/locales';

const T0 = new Date('2026-11-02T09:00:00').getTime();

beforeAll(async () => {
  await initContent({ remoteBase: null, cache: null });
  activate('my.kampung_seri', 'en', T0);
});

describe('weather', () => {
  it('is deterministic, bounded and roughly matches the world’s rain chance', () => {
    expect(rainAt(T0, 0)).toBe(0);
    expect(rainAt(T0 + 123_456, 0.3)).toBe(rainAt(T0 + 123_456, 0.3));
    let wet = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const r = rainAt(T0 + i * 97_000, 0.3);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
      if (r > 0) wet++;
    }
    expect(wet / N).toBeGreaterThan(0.18);
    expect(wet / N).toBeLessThan(0.42);
  });
});

describe('visit snapshot links', () => {
  it('carry the layout only — never coins, items, names or progress', () => {
    const g = createNewGame(T0, 3);
    g.coins = 123456;
    g.inventory = { coffee: 9 };
    g.profile.name = 'Secret Person';
    const code = encodeVisit(g);
    const json = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
    for (const leak of ['123456', 'coffee', 'Secret Person', 'inventory', 'coins', 'stats', 'history']) expect(json).not.toContain(leak);
    const v = decodeVisit(code)!;
    expect(v.n).toBe(g.profile.hoodName);
    const s = visitState(v, T0);
    expect(s.buildings.length).toBe(g.buildings.length);
    expect(s.coins).toBe(150); // a throwaway default, not the sender's
  });

  it('rejects tampered, hostile or oversized codes', () => {
    const enc = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const ok = { v: 1, w: 'my.kampung_seri', n: 'Kampung', l: 2, t: ['bush'], b: [[0, 10, 10, 0, 1]] };
    expect(decodeVisit(enc(ok))).not.toBeNull();
    expect(decodeVisit(enc({ ...ok, n: '<img src=x onerror=alert(1)>' }))).toBeNull();
    expect(decodeVisit(enc({ ...ok, b: [[0, 99, 10, 0, 1]] }))).toBeNull();
    expect(decodeVisit(enc({ ...ok, b: [[5, 1, 1, 0, 1]] }))).toBeNull();
    expect(decodeVisit(enc({ ...ok, extra: 'field' }))).toBeNull();
    expect(decodeVisit(enc({ ...ok, t: ['../../etc'] }))).toBeNull();
    expect(decodeVisit('eyJfX3Byb3RvX18iOnt9fQ')).toBeNull(); // {"__proto__":{}}
    expect(decodeVisit('A'.repeat(20_000))).toBeNull();
    expect(decodeVisit('not base64 !')).toBeNull();
  });
});

describe('bundled content', () => {
  it('every bundled file matches the hashes in the content index', async () => {
    const b = await loadBundle(bundledFetcher, 'bundled', { requireSignature: false });
    expect(b.problems).toEqual([]);
    expect(b.modules.every((m) => m.manifest && !m.issues.length)).toBe(true);
    expect(b.countries.map((c) => c.code).sort()).toEqual(['ID', 'JP', 'KR', 'MY', 'SG', 'TH']);
  });
});

describe('icons', () => {
  it('every icon content may name is drawn by the icon family', () => {
    expect(ICONS.filter((i) => !hasIcon(i))).toEqual([]);
  });
});

describe('localisation coverage', () => {
  /** Literal t('…') / tc('…') keys used anywhere in the source must exist. */
  it('every literal translation key used in code exists in the dictionaries', () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(f) && !f.endsWith('.test.ts') && !p.includes('locales') && !p.includes('studio')) files.push(p);
      }
    };
    walk(join(import.meta.dirname, '..'));
    const missing = new Set<string>();
    for (const f of files) {
      for (const m of readFileSync(f, 'utf8').matchAll(/\bt[cr]?\(\s*'([a-z][a-zA-Z0-9_.]+)'/g)) {
        const k = m[1];
        if (!(k in DICTS.en) && !(`${k}.one` in DICTS.en)) missing.add(`${k} (${f.split('/src/')[1]})`);
      }
    }
    expect([...missing]).toEqual([]);
  });

  it('Malay translations are not just copies of the English', () => {
    const same = Object.keys(DICTS.en).filter((k) => DICTS.en[k] === DICTS.ms[k] && /[a-z]{4,}/i.test(DICTS.en[k]));
    // Names, brand words and loanwords legitimately match; anything beyond a small set needs review.
    expect(same.length).toBeLessThan(40);
  });
});
