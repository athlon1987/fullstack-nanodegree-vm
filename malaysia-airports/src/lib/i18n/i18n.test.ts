import { describe, expect, it } from 'vitest';
import { FLIGHT_STATUS_META } from '@/lib/flights/status';
import { en } from './en';
import { ms } from './ms';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { SCOPED_NAMESPACES, clientDictionary, getDictionary, getT, interpolate, langParams, numberFormat, pickDictionary, plural, toLang, type TKey } from './index';

function leaves(node: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof node === 'string') {
    out.set(prefix, node);
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      for (const [path, text] of leaves(value, prefix ? `${prefix}.${key}` : key)) out.set(path, text);
    }
  }
  return out;
}

const placeholders = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe('i18n dictionaries', () => {
  const english = leaves(en);
  const malay = leaves(ms);

  it('has exactly the same keys in English and Malay', () => {
    expect([...malay.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it('seeds enough keys that UI engineers rarely need to add basics', () => {
    expect(english.size).toBeGreaterThanOrEqual(250);
  });

  it('has no empty strings and no exclamation marks', () => {
    for (const [key, text] of [...english, ...malay]) {
      expect(text.trim().length, key).toBeGreaterThan(0);
      expect(text.includes('!'), key).toBe(false);
    }
  });

  it('uses the same placeholders in both languages', () => {
    for (const [key, text] of english) {
      expect(placeholders(malay.get(key) ?? ''), key).toEqual(placeholders(text));
    }
  });

  it('keeps flight status labels in step with the status model', () => {
    for (const meta of Object.values(FLIGHT_STATUS_META)) {
      expect(getT('en')(meta.i18nKey)).toBe(meta.label.en);
      expect(getT('ms')(meta.i18nKey)).toBe(meta.label.ms);
    }
  });
});

describe('translator', () => {
  it('translates in both languages and falls back to English for unknown languages', () => {
    expect(getT('en')('nav.flights')).toBe('Flights');
    expect(getT('ms')('nav.flights')).toBe('Penerbangan');
    expect(getT('fr')('nav.flights')).toBe('Flights');
    expect(getT('ms').lang).toBe('ms');
  });

  it('interpolates placeholders and leaves unknown ones visible', () => {
    expect(getT('en')('freshness.updated', { time: '14:05' })).toBe('Updated 14:05');
    expect(getT('ms')('freshness.updated', { time: '14:05' })).toBe('Dikemas kini 14:05');
    expect(interpolate('Hello {name}, {missing}', { name: 'Aisyah' })).toBe('Hello Aisyah, {missing}');
  });

  it('handles plurals: English has two forms, Malay one', () => {
    const t = getT('en');
    expect(t.count('search.resultsCount', 1)).toBe('1 result');
    expect(t.count('search.resultsCount', 3)).toBe('3 results');
    expect(t.count('common.units.bays', 5700)).toBe('5,700 bays');
    expect(getT('ms').count('search.resultsCount', 3)).toBe('3 hasil');
    expect(plural('en', 1, { one: 'bag', other: 'bags' })).toBe('bag');
    expect(plural('ms', 1, { one: 'beg', other: 'beg-beg' })).toBe('beg-beg');
  });

  it('returns the key itself when a key is missing at runtime', () => {
    expect(getT('en')('nav.doesNotExist' as TKey)).toBe('nav.doesNotExist');
  });

  it('exposes dictionaries and language helpers for the root layout', () => {
    expect(getDictionary('ms')).toBe(ms);
    expect(toLang('ms')).toBe('ms');
    expect(toLang('de')).toBe('en');
    expect(langParams()).toEqual([{ lang: 'en' }, { lang: 'ms' }]);
  });
});

describe('client dictionary (performance-09)', () => {
  it('leaves corporate and design-system copy out of the root provider', () => {
    for (const lang of ['en', 'ms'] as const) {
      const dictionary = clientDictionary(lang);
      for (const name of SCOPED_NAMESPACES) expect(dictionary).not.toHaveProperty(name);
      expect(dictionary).toHaveProperty('common');
      expect(clientDictionary(lang)).toBe(dictionary);
      expect(JSON.stringify(dictionary).length).toBeLessThan(JSON.stringify(getDictionary(lang)).length - 30_000);
    }
  });

  it('picks only the requested sub-trees', () => {
    const picked = pickDictionary('ms', ['corporatePages.privacy', 'nope.nothing']);
    expect(Object.keys(picked)).toEqual(['corporatePages']);
    expect(picked.corporatePages).toEqual({ privacy: getDictionary('ms').corporatePages.privacy });
  });

  it('only the scoped places read scoped namespaces in Client Components', () => {
    const root = join(__dirname, '..', '..');
    const allowed = [/^components\/corporate\/device-data\.tsx$/, /^components\/design-system\//];
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) {
          const source = readFileSync(path, 'utf8');
          const client = /^['"]use client['"]/m.test(source) || source.includes('useT()');
          const file = relative(root, path).split('\\').join('/');
          if (file.startsWith('lib/i18n/')) continue;
          if (client && SCOPED_NAMESPACES.some((name) => new RegExp(`['\`"]${name}\\.`).test(source)) && !allowed.some((rule) => rule.test(file))) offenders.push(file);
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });

  it('makes one number formatter per language (performance-16)', () => {
    expect(numberFormat('en')).toBe(numberFormat('en'));
    expect(numberFormat('ms')).not.toBe(numberFormat('en'));
    expect(getT('en').count('search.resultsCount', 1234)).toContain('1,234');
  });
});
