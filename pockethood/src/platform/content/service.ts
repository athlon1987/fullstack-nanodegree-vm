// Content service: loads the content set once, then (re)activates a world + its modules
// whenever the save's world or the language changes. UI subscribes to `useContent.rev`.
import { create } from 'zustand';
import { CORE_WORLD_ID, WORLD } from '../../data/world';
import { audit } from '../security/audit';
import { safeGet, safeSet } from '../../utils/safeStorage';
import type { Lang } from '../i18n';
import { flags, setRemoteFlags } from './flags';
import { installContent, type InstallReport } from './install';
import { loadContent, type ContentBundle, type ContentCache, type Fetcher } from './loader';
import { evaluate, type ModuleEntry } from './registry';
import type { ModuleManifest } from './schema';

export interface ContentState {
  bundle: ContentBundle | null;
  log: string[];
  modules: ModuleEntry[];
  report: InstallReport | null;
  worldId: string;
  /** Bumped on every install; components that show content names depend on it. */
  rev: number;
}

export const useContent = create<ContentState>(() => ({ bundle: null, log: [], modules: [], report: null, worldId: CORE_WORLD_ID, rev: 0 }));

/**
 * Studio (developer) overrides for this session/device only: preview edited module data
 * without publishing, and switch modules off locally. Never shipped to other players.
 */
export const studio = {
  previews: new Map<string, ModuleManifest>(),
  disabled: new Set<string>(),
};

/** Anonymous per-install id used only for staged-rollout buckets (never sent anywhere). */
export function installId(): string {
  let id = safeGet('pockethood.install');
  if (!id) {
    id = Math.random().toString(36).slice(2, 12);
    safeSet('pockethood.install', id);
  }
  return id;
}

const BUNDLED = import.meta.glob('/content/**/*.json', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
export const bundledFetcher: Fetcher = async (p) => {
  const text = BUNDLED[`/content/${p}`];
  if (text === undefined) throw new Error(`${p} not bundled`);
  return text;
};

function remoteFetcher(base: string): Fetcher {
  return async (p) => {
    const res = await fetch(new URL(p, base).toString(), { cache: 'no-cache', credentials: 'omit', redirect: 'error' });
    if (!res.ok) throw new Error(`${p}: HTTP ${res.status}`);
    return res.text();
  };
}

function idbCache(): ContentCache {
  const KEY = 'pockethood.content.lkg';
  return {
    async get() {
      const idb = await import('idb-keyval');
      return (await idb.get(KEY)) as Record<string, string> | undefined;
    },
    async set(files) {
      const idb = await import('idb-keyval');
      await idb.set(KEY, files);
    },
  };
}

/** Load the content set (remote → cache → bundled). Never throws for remote/cache failures. */
export async function initContent(opts: { remoteBase?: string | null; cache?: ContentCache | null; bundled?: Fetcher } = {}) {
  const base = opts.remoteBase === undefined ? (typeof location !== 'undefined' ? new URL('content/', location.href).toString() : null) : opts.remoteBase;
  const { bundle, log } = await loadContent({
    remote: base ? remoteFetcher(base) : undefined,
    cache: opts.cache === undefined ? idbCache() : opts.cache ?? undefined,
    bundled: opts.bundled ?? bundledFetcher,
  });
  setRemoteFlags(bundle.index.flags);
  for (const l of log) audit({ actor: 'system', action: 'content.load', detail: l });
  for (const p of bundle.problems) audit({ actor: 'system', action: 'content.reject', detail: p, level: 'warn' });
  useContent.setState({ bundle, log });
  return bundle;
}

/** The world a brand-new game starts in: the default country's first active world. */
export function defaultWorldId(bundle = useContent.getState().bundle): string {
  if (!bundle) return CORE_WORLD_ID;
  const country = bundle.countries.find((c) => c.code === bundle.index.defaultCountry && c.status === 'active');
  return country?.worlds.find((w) => bundle.worlds[w]) ?? CORE_WORLD_ID;
}

/**
 * Install a world and its modules. A missing or broken world falls back to the neutral core
 * world (player state is preserved; unknown content shows as closed until it returns).
 */
export function activate(worldId: string, lang: Lang, now = Date.now()): InstallReport {
  const { bundle } = useContent.getState();
  const pack = worldId === CORE_WORLD_ID ? null : bundle?.worlds[worldId] ?? null;
  if (worldId !== CORE_WORLD_ID && !pack) audit({ actor: 'system', action: 'world.fallback', target: worldId, detail: 'World pack unavailable — using the neutral core world', level: 'warn' });
  const country = pack?.country ?? 'ZZ';
  const f = flags();
  const entries: ModuleEntry[] = [];
  const listed = (bundle?.modules ?? []).map((m) => {
    const preview = studio.previews.get(m.entry.id);
    return preview ? { entry: { ...m.entry, version: preview.version }, manifest: preview, issues: [] as string[] } : m;
  });
  for (const m of listed) {
    const decision = studio.disabled.has(m.entry.id)
      ? { status: 'disabled' as const, reason: 'Switched off in Studio (this device only)' }
      : bundle
        ? evaluate(m.entry, m.manifest, { now, country, flags: f, index: bundle.index, installId: installId() })
        : { status: 'missing' as const, reason: '' };
    const status = !f.modules && decision.status === 'active' ? 'flag_off' : decision.status;
    entries.push({ id: m.entry.id, version: m.entry.version, status, reason: status === 'flag_off' && decision.status === 'active' ? 'Modules are switched off' : decision.reason, manifest: m.manifest, issues: [...m.issues], warnings: [], source: studio.previews.has(m.entry.id) ? 'studio' : bundle!.source });
  }
  const report = installContent({ world: pack, modules: entries.filter((e) => e.status === 'active').map((e) => e.manifest!), lang, now });
  if (!report.world.ok) audit({ actor: 'system', action: 'world.reject', target: worldId, detail: report.world.errors.slice(0, 5).join('; '), level: 'error' });
  for (const r of report.modules) {
    const e = entries.find((x) => x.id === r.id)!;
    e.warnings = r.warnings;
    if (!r.ok) {
      e.status = 'quarantined';
      e.reason = 'Failed semantic checks';
      e.issues.push(...r.errors);
      audit({ actor: 'system', action: 'module.quarantine', target: r.id, detail: r.errors.slice(0, 4).join('; '), level: 'warn' });
    }
  }
  for (const e of entries) if (e.status !== 'active' && e.status !== 'quarantined') audit({ actor: 'system', action: `module.${e.status}`, target: e.id, detail: e.reason });
  useContent.setState((s) => ({ modules: entries, report, worldId: WORLD.id, rev: s.rev + 1 }));
  return report;
}
