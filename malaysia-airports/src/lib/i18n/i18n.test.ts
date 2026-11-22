import { describe, expect, it } from 'vitest';
import { FLIGHT_STATUS_META } from '@/lib/flights/status';
import { en } from './en';
import { ms } from './ms';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PARTIAL_NAMESPACES, SCOPED_NAMESPACES, clientDictionary, getDictionary, getT, interpolate, langParams, numberFormat, pickDictionary, plural, toLang, type TKey } from './index';

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
    // Per namespace since round 2 (more namespaces are scoped; see `SCOPED_NAMESPACES`): the
    // folders whose Client Components are only rendered on pages that scope that namespace.
    const allowed: Record<(typeof SCOPED_NAMESPACES)[number], RegExp[]> = {
      // Round 2: the measurement switch is scoped like device-data (privacy page, I18nScope).
      corporatePages: [/^components\/corporate\/device-data\.tsx$/, /^components\/corporate\/measurement-switch\.tsx$/],
      designSystem: [/^components\/design-system\//],
      guidePages: [/^components\/(guides|help)\//],
      transportPages: [/^components\/(transport|parking)\//, /^components\/guides\/transit-planner\.tsx$/],
      commercePages: [/^components\/commerce\//],
      mapPages: [/^components\/(map|facilities)\//],
      home: [/^components\/home\//, /^components\/flights\/flight-search-box\.tsx$/],
      // Round 6: read only by the server-built search documents; no Client Component may read it.
      searchIndex: [],
      // Visual redesign: the photo credits page is a Server Component; no Client Component may read it.
      creditsPages: [],
    };
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
          for (const namespace of SCOPED_NAMESPACES) {
            if (client && new RegExp(`['\`"]${namespace}\\.`).test(source) && !allowed[namespace].some((rule) => rule.test(file))) offenders.push(`${file} (${namespace})`);
          }
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });

  it('pages whose Client Components read a scoped namespace send it with I18nPageScope (round 2)', () => {
    // Follows imports from each page (static and `import()`); once a module is a Client Component,
    // every module below it is client code. A namespace the page's client code reads must be in
    // the page's `I18nPageScope`, or users would see the raw key. The root layouts may read none.
    const root = join(__dirname, '..', '..');
    const sources = new Map<string, string>();
    const collect = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) collect(path);
        else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) sources.set(path, readFileSync(path, 'utf8'));
      }
    };
    collect(root);
    const resolve = (spec: string, from: string): string | undefined => {
      const base = spec.startsWith('@/') ? join(root, spec.slice(2)) : spec.startsWith('.') ? join(from, '..', spec) : undefined;
      if (!base) return undefined;
      return [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')].find((candidate) => sources.has(candidate));
    };
    const deps = (file: string): string[] =>
      [...(sources.get(file) ?? '').matchAll(/(?:^import\s+(?!type\s)[^;]*?from\s+|^export\s+(?!type\s)[^;]*?from\s+|import\(\s*)['"]([^'"]+)['"]/gm)]
        .map((match) => resolve(match[1], file))
        .filter((dep): dep is string => Boolean(dep));
    const clientReads = (entry: string): Set<string> => {
      const read = new Set<string>();
      const seen = new Set<string>();
      const stack: [string, boolean][] = [[entry, false]];
      while (stack.length > 0) {
        const [file, inClient] = stack.pop()!;
        const source = sources.get(file) ?? '';
        const client = inClient || /^['"]use client['"]/.test(source.trimStart());
        if (seen.has(`${file}|${client}`)) continue;
        seen.add(`${file}|${client}`);
        if (client && !relative(root, file).startsWith(join('lib', 'i18n'))) {
          for (const namespace of SCOPED_NAMESPACES) if (new RegExp(`['\`"]${namespace}\\.`).test(source)) read.add(namespace);
        }
        for (const dep of deps(file)) stack.push([dep, client]);
      }
      return read;
    };
    const app = join(root, 'app', '[lang]');
    expect([...clientReads(join(app, 'layout.tsx')), ...clientReads(join(app, '[airport]', 'layout.tsx'))]).toEqual([]);
    const missing: string[] = [];
    for (const file of sources.keys()) {
      if (!file.startsWith(app) || !file.endsWith('page.tsx')) continue;
      const source = sources.get(file) ?? '';
      const scoped = new Set([...source.matchAll(/<I18n(?:Page)?Scope[^>]*namespaces=\{\[([^\]]*)\]\}/g)].flatMap((match) => [...match[1].matchAll(/'([^'.]+)[^']*'/g)].map((name) => name[1])));
      for (const namespace of clientReads(file)) if (!scoped.has(namespace)) missing.push(`${relative(app, file)}: ${namespace}`);
    }
    expect(missing).toEqual([]);
  });

  it('makes one number formatter per language (performance-16)', () => {
    expect(numberFormat('en')).toBe(numberFormat('en'));
    expect(numberFormat('ms')).not.toBe(numberFormat('en'));
    expect(getT('en').count('search.resultsCount', 1234)).toContain('1,234');
  });
});

describe('partial namespaces in the root dictionary (round 5, E-11)', () => {
  it('sends only the listed concierge keys to every page', () => {
    for (const lang of ['en', 'ms'] as const) {
      const dictionary = clientDictionary(lang);
      expect(Object.keys(dictionary.conciergePage as object).sort()).toEqual([...PARTIAL_NAMESPACES.conciergePage].sort());
      expect(dictionary.conciergePage).toEqual(pickDictionary(lang, PARTIAL_NAMESPACES.conciergePage.map((key) => `conciergePage.${key}`)).conciergePage);
      // About 17 KB of copy no longer in each page's HTML.
      expect(JSON.stringify(getDictionary(lang).conciergePage).length - JSON.stringify(dictionary.conciergePage).length).toBeGreaterThan(15_000);
    }
  });

  it('only the concierge reads the rest, and its page and panel bring it', () => {
    const root = join(__dirname, '..', '..');
    const shared = new Set(PARTIAL_NAMESPACES.conciergePage.map((key) => `conciergePage.${key}`));
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) {
          const source = readFileSync(path, 'utf8');
          const file = relative(root, path).split('\\').join('/');
          const client = /^['"]use client['"]/m.test(source) || source.includes('useT()');
          if (!client || file.startsWith('components/concierge/') || file.startsWith('lib/i18n/')) continue;
          for (const match of source.matchAll(/['`"](conciergePage\.[\w.]+)/g)) if (!shared.has(match[1])) offenders.push(`${file}: ${match[1]}`);
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
    expect(readFileSync(join(root, 'app', '[lang]', 'concierge', 'page.tsx'), 'utf8')).toMatch(/<I18nPageScope namespaces=\{\['conciergePage'\]\}>/);
    const panel = readFileSync(join(root, 'components', 'concierge', 'concierge-panel.tsx'), 'utf8');
    expect(panel).toMatch(/import\('@\/lib\/i18n\/features\/concierge'\)/);
    // The panel's own frame reads only the shared keys.
    for (const match of panel.matchAll(/t\('(conciergePage\.[\w.]+)'/g)) expect(shared.has(match[1])).toBe(true);
  });
});
