// Content loading: versioned JSON from a content source (remote → last-known-good cache →
// bundled copy). Every file is size-limited, hash-checked against the index, parsed without
// prototype-pollution keys and schema-validated. A bad file only affects itself.
import { run, type Issue } from '../validate';
import { REQUIRE_SIGNED_CONTENT, CONTENT_PUBLIC_KEY, sha256Hex, verifySignature } from '../security/integrity';
import { countrySchema, indexSchema, moduleSchema, worldSchema, type ContentIndex, type CountryRecord, type ModuleManifest, type WorldPack } from './schema';

export type Source = 'remote' | 'cache' | 'bundled';
/** Returns a file's text, or throws. Paths are relative to the content root. */
export type Fetcher = (path: string) => Promise<string>;

export interface LoadedModule {
  entry: ContentIndex['modules'][number];
  manifest?: ModuleManifest;
  issues: string[];
}

export interface ContentBundle {
  source: Source;
  index: ContentIndex;
  files: Record<string, string>;
  countries: CountryRecord[];
  worlds: Record<string, WorldPack>;
  modules: LoadedModule[];
  problems: string[];
}

export const MAX_FILE_BYTES = 512_000;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** JSON.parse that refuses prototype-pollution keys anywhere in the document. */
export function safeParse(text: string): unknown {
  return JSON.parse(text, (k, v) => {
    if (FORBIDDEN_KEYS.has(k)) throw new Error(`forbidden key "${k}"`);
    return v;
  });
}

const fmt = (issues: Issue[]) => issues.slice(0, 12).map((i) => `${i.path}: ${i.message}`);
const byteLength = (s: string) => new TextEncoder().encode(s).length;

async function checkedFile(fetch: Fetcher, ref: { path: string; sha256: string; bytes: number }, files: Record<string, string>): Promise<{ data?: unknown; issues: string[] }> {
  let text: string;
  try {
    text = await fetch(ref.path);
  } catch (e) {
    return { issues: [`missing: ${String((e as Error).message ?? e)}`] };
  }
  const size = byteLength(text);
  if (size > MAX_FILE_BYTES || size !== ref.bytes) return { issues: [`size ${size} does not match index (${ref.bytes})`] };
  const hash = await sha256Hex(text);
  if (hash !== ref.sha256) return { issues: ['integrity: sha256 does not match the content index'] };
  files[ref.path] = text;
  try {
    return { data: safeParse(text), issues: [] };
  } catch (e) {
    return { issues: [`parse: ${(e as Error).message}`] };
  }
}

/** Load and verify one complete content set from a fetcher. Throws only if the index itself is unusable. */
export async function loadBundle(fetch: Fetcher, source: Source, opts: { requireSignature?: boolean; publicKey?: JsonWebKey | null } = {}): Promise<ContentBundle> {
  const indexText = await fetch('index.json');
  if (byteLength(indexText) > MAX_FILE_BYTES) throw new Error('index too large');
  const requireSig = opts.requireSignature ?? REQUIRE_SIGNED_CONTENT;
  if (requireSig) {
    const key = opts.publicKey ?? CONTENT_PUBLIC_KEY;
    const sig = await fetch('index.json.sig').catch(() => '');
    if (!key || !sig || !(await verifySignature(indexText, sig, key))) throw new Error('index signature invalid');
  }
  const parsed = run(indexSchema, safeParse(indexText));
  if (!parsed.ok) throw new Error(`index invalid: ${fmt(parsed.issues).join('; ')}`);
  const index = parsed.value;
  const files: Record<string, string> = { 'index.json': indexText };
  const problems: string[] = [];

  const countries: CountryRecord[] = [];
  for (const ref of index.countries) {
    const f = await checkedFile(fetch, ref, files);
    const r = f.data !== undefined ? run(countrySchema, f.data) : null;
    if (r?.ok && r.value.code === ref.code) countries.push(r.value);
    else problems.push(`country ${ref.code}: ${[...f.issues, ...(r && !r.ok ? fmt(r.issues) : r ? ['code mismatch'] : [])].join('; ')}`);
  }

  const worlds: Record<string, WorldPack> = {};
  for (const ref of index.worlds) {
    const f = await checkedFile(fetch, ref, files);
    const r = f.data !== undefined ? run(worldSchema, f.data) : null;
    if (r?.ok && r.value.id === ref.id && r.value.country === ref.country) worlds[ref.id] = r.value;
    else problems.push(`world ${ref.id}: ${[...f.issues, ...(r && !r.ok ? fmt(r.issues) : r ? ['id/country mismatch'] : [])].join('; ')}`);
  }

  const modules: LoadedModule[] = [];
  for (const entry of index.modules) {
    const f = await checkedFile(fetch, entry, files);
    if (f.data === undefined) {
      modules.push({ entry, issues: f.issues });
      continue;
    }
    const r = run(moduleSchema, f.data);
    modules.push(r.ok ? { entry, manifest: r.value, issues: [] } : { entry, issues: fmt(r.issues) });
  }
  return { source, index, files, countries, worlds, modules, problems };
}

export interface ContentCache {
  get(): Promise<Record<string, string> | undefined>;
  set(files: Record<string, string>): Promise<void>;
}

/**
 * Remote first; on failure the last-known-good copy; then the copy bundled with the app.
 * Only a fully clean remote set replaces the last-known-good cache (so a partial outage
 * can't overwrite good content). Returns the bundle and a log of what happened.
 */
export async function loadContent(opts: { remote?: Fetcher; cache?: ContentCache; bundled: Fetcher }): Promise<{ bundle: ContentBundle; log: string[] }> {
  const log: string[] = [];
  if (opts.remote) {
    try {
      const b = await loadBundle(opts.remote, 'remote');
      const clean = !b.problems.length && b.modules.every((m) => m.manifest);
      if (clean) await opts.cache?.set(b.files).catch(() => {});
      log.push(`remote content ${b.index.contentVersion}${clean ? '' : ' (with problems)'}`);
      return { bundle: b, log };
    } catch (e) {
      log.push(`remote unavailable: ${(e as Error).message}`);
    }
  }
  if (opts.cache) {
    try {
      const files = await opts.cache.get();
      if (files) {
        const b = await loadBundle(async (p) => {
          if (!(p in files)) throw new Error('not cached');
          return files[p];
        }, 'cache', { requireSignature: false }); // verified when it was fetched; still re-hashed and re-validated
        log.push(`cached content ${b.index.contentVersion}`);
        return { bundle: b, log };
      }
    } catch (e) {
      log.push(`cache unusable: ${(e as Error).message}`);
    }
  }
  const b = await loadBundle(opts.bundled, 'bundled', { requireSignature: false }); // ships inside the reviewed app binary
  log.push(`bundled content ${b.index.contentVersion}`);
  return { bundle: b, log };
}
