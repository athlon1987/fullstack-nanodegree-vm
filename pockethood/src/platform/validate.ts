// A small, strict, dependency-free schema validator for untrusted content.
// No eval / code generation (works under strict CSPs). Unknown keys are rejected,
// strings are length-limited and screened for markup, scripts and control characters.

export interface Issue {
  path: string;
  message: string;
}

export type Schema<T> = {
  /** Returns the validated (and normalised) value, or undefined after recording issues. */
  check(value: unknown, path: string, issues: Issue[]): T | undefined;
  /** Human-readable type description for docs. */
  describe(): string;
  optional?: boolean;
};

const UNSAFE = [
  /<\s*\/?\s*[a-z!]/i, // any HTML/XML tag
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
  /vbscript\s*:/i,
  /on[a-z]+\s*=/i, // inline event handlers
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/, // control characters
  /[‪-‮⁦-⁩]/, // bidi overrides
];

/** True if a plain-text string is free of markup, script URLs and control characters. */
export const isSafeText = (s: string) => !UNSAFE.some((r) => r.test(s));

export function str(o: { min?: number; max?: number; pattern?: RegExp; text?: boolean; label?: string } = {}): Schema<string> {
  const max = o.max ?? 200;
  return {
    check(v, path, issues) {
      if (typeof v !== 'string') return void issues.push({ path, message: 'must be a string' });
      if (v.length < (o.min ?? 0)) return void issues.push({ path, message: `must be at least ${o.min} characters` });
      if (v.length > max) return void issues.push({ path, message: `must be at most ${max} characters` });
      if (o.pattern && !o.pattern.test(v)) return void issues.push({ path, message: `must match ${o.label ?? o.pattern}` });
      if (o.text !== false && !isSafeText(v)) return void issues.push({ path, message: 'contains markup, script or control characters' });
      return v.normalize('NFC');
    },
    describe: () => `string${o.label ? ` (${o.label})` : ''}, ≤ ${max} chars`,
  };
}

export function num(o: { min?: number; max?: number; int?: boolean } = {}): Schema<number> {
  return {
    check(v, path, issues) {
      if (typeof v !== 'number' || !Number.isFinite(v)) return void issues.push({ path, message: 'must be a finite number' });
      if (o.int && !Number.isInteger(v)) return void issues.push({ path, message: 'must be an integer' });
      if (o.min !== undefined && v < o.min) return void issues.push({ path, message: `must be ≥ ${o.min}` });
      if (o.max !== undefined && v > o.max) return void issues.push({ path, message: `must be ≤ ${o.max}` });
      return v;
    },
    describe: () => `${o.int ? 'integer' : 'number'}${o.min !== undefined ? ` ≥ ${o.min}` : ''}${o.max !== undefined ? ` ≤ ${o.max}` : ''}`,
  };
}

export const bool = (): Schema<boolean> => ({
  check(v, path, issues) {
    if (typeof v !== 'boolean') return void issues.push({ path, message: 'must be true or false' });
    return v;
  },
  describe: () => 'boolean',
});

export function lit<const T extends string | number>(...values: T[]): Schema<T> {
  return {
    check(v, path, issues) {
      if (!values.includes(v as T)) return void issues.push({ path, message: `must be one of: ${values.join(', ')}` });
      return v as T;
    },
    describe: () => values.map((x) => JSON.stringify(x)).join(' | '),
  };
}

export function arr<T>(item: Schema<T>, o: { min?: number; max?: number; unique?: (x: T) => string } = {}): Schema<T[]> {
  const max = o.max ?? 100;
  return {
    check(v, path, issues) {
      if (!Array.isArray(v)) return void issues.push({ path, message: 'must be a list' });
      if (v.length < (o.min ?? 0)) return void issues.push({ path, message: `needs at least ${o.min} entries` });
      if (v.length > max) return void issues.push({ path, message: `allows at most ${max} entries` });
      const out: T[] = [];
      const seen = new Set<string>();
      let bad = false;
      v.forEach((x, i) => {
        const r = item.check(x, `${path}[${i}]`, issues);
        if (r === undefined) bad = true;
        else {
          if (o.unique) {
            const k = o.unique(r);
            if (seen.has(k)) {
              issues.push({ path: `${path}[${i}]`, message: `duplicate "${k}"` });
              bad = true;
            }
            seen.add(k);
          }
          out.push(r);
        }
      });
      return bad ? undefined : out;
    },
    describe: () => `list of (${item.describe()}), ≤ ${max}`,
  };
}

export function opt<T>(s: Schema<T>): Schema<T | undefined> & { optional: true } {
  return { ...s, optional: true, check: (v, p, i) => (v === undefined ? undefined : s.check(v, p, i)) } as Schema<T | undefined> & { optional: true };
}

type Shape = Record<string, Schema<unknown>>;
type Val<S> = S extends Schema<infer T> ? T : never;
type Simplify<T> = { [K in keyof T]: T[K] } & {};
/** Validated object type: fields wrapped in opt() become optional keys. */
type Out<S extends Shape> = Simplify<
  { [K in keyof S as S[K] extends { optional: true } ? never : K]: Val<S[K]> } & {
    [K in keyof S as S[K] extends { optional: true } ? K : never]?: Exclude<Val<S[K]>, undefined>;
  }
>;

/** Strict object: unknown keys are errors (content can't smuggle extra behaviour). */
export function obj<S extends Shape>(shape: S): Schema<Out<S>> {
  return {
    check(v, path, issues) {
      if (typeof v !== 'object' || v === null || Array.isArray(v)) return void issues.push({ path, message: 'must be an object' });
      const rec = v as Record<string, unknown>;
      let bad = false;
      for (const k of Object.keys(rec)) {
        if (!(k in shape)) {
          issues.push({ path: `${path}.${k}`, message: 'is not an allowed field' });
          bad = true;
        }
      }
      const out: Record<string, unknown> = {};
      for (const [k, s] of Object.entries(shape)) {
        if (rec[k] === undefined) {
          if (!s.optional) {
            issues.push({ path: `${path}.${k}`, message: 'is required' });
            bad = true;
          }
          continue;
        }
        const before = issues.length;
        const r = s.check(rec[k], `${path}.${k}`, issues);
        if (r === undefined && issues.length > before) bad = true;
        else if (r !== undefined) out[k] = r;
      }
      return bad ? undefined : (out as Out<S>);
    },
    describe: () => `{ ${Object.entries(shape).map(([k, s]) => `${k}${s.optional ? '?' : ''}: ${s.describe()}`).join('; ')} }`,
  };
}

/** Map with validated keys and values. */
export function rec<T>(key: Schema<string>, value: Schema<T>, o: { max?: number } = {}): Schema<Record<string, T>> {
  const max = o.max ?? 50;
  return {
    check(v, path, issues) {
      if (typeof v !== 'object' || v === null || Array.isArray(v)) return void issues.push({ path, message: 'must be an object' });
      const entries = Object.entries(v as Record<string, unknown>);
      if (entries.length > max) return void issues.push({ path, message: `allows at most ${max} keys` });
      const out: Record<string, T> = {};
      let bad = false;
      for (const [k, x] of entries) {
        if (key.check(k, `${path}{${k}}`, issues) === undefined) bad = true;
        const r = value.check(x, `${path}.${k}`, issues);
        if (r === undefined) bad = true;
        else out[k] = r;
      }
      return bad ? undefined : out;
    },
    describe: () => `map ${key.describe()} → ${value.describe()}`,
  };
}

/** Tagged union on a discriminant field. */
type Inner<S> = S extends Schema<infer T> ? T : never;
export function tagged<V extends Record<string, Schema<any>>>(field: string, variants: V): Schema<Inner<V[keyof V]>> {
  return {
    check(v, path, issues) {
      const tag = (v as Record<string, unknown> | null)?.[field];
      const s = typeof tag === 'string' ? variants[tag] : undefined;
      if (!s) return void issues.push({ path: `${path}.${field}`, message: `must be one of: ${Object.keys(variants).join(', ')}` });
      return s.check(v, path, issues) as Inner<V[keyof V]> | undefined;
    },
    describe: () => Object.keys(variants).join(' | '),
  };
}

export function run<T>(schema: Schema<T>, value: unknown, root = '$'): { ok: true; value: T } | { ok: false; issues: Issue[] } {
  const issues: Issue[] = [];
  const v = schema.check(value, root, issues);
  return issues.length || v === undefined ? { ok: false, issues: issues.length ? issues : [{ path: root, message: 'invalid' }] } : { ok: true, value: v };
}

// ── Common building blocks ───────────────────────────────────────────────────

export const ID = str({ min: 2, max: 64, pattern: /^[a-z0-9][a-z0-9._-]*$/, label: 'lowercase id: a-z 0-9 . _ -' });
export const SEMVER = str({ max: 20, pattern: /^\d+\.\d+\.\d+$/, label: 'semver x.y.z' });
export const ISO_DATE = str({ max: 30, pattern: /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z)?$/, label: 'ISO date' });
export const COUNTRY = str({ min: 2, max: 2, pattern: /^[A-Z]{2}$/, label: 'ISO 3166 alpha-2' });
export const LOCALE = str({ max: 10, pattern: /^[a-z]{2}(-[A-Z]{2})?$/, label: 'locale, e.g. en-MY' });
export const HEX = str({ max: 7, pattern: /^#[0-9a-fA-F]{6}$/, label: '#rrggbb' });
export const SHA256 = str({ min: 64, max: 64, pattern: /^[0-9a-f]{64}$/, label: 'sha256 hex' });

/** Localised text: plain string or { "en-MY": "...", "ms-MY": "..." }. */
export function text(max = 200): Schema<string | Record<string, string>> {
  const plain = str({ min: 1, max });
  const map = rec(LOCALE, str({ min: 1, max }), { max: 12 });
  return {
    check(v, path, issues) {
      return typeof v === 'string' ? plain.check(v, path, issues) : map.check(v, path, issues);
    },
    describe: () => `localised text (string or {locale: string}), ≤ ${max} chars`,
  };
}
