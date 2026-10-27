// Module lifecycle: decides, for each module listed in the content index, whether it may run
// right now. Every decision has a reason so the Studio inspector and audit log can explain it.
import type { ContentIndex, ModuleManifest } from './schema';

export const GAME_VERSION = '0.3.0';

export type ModuleStatus =
  | 'active' //          running
  | 'scheduled' //       approved, but its activation window hasn't opened
  | 'expired' //         activation window closed (or licence ended)
  | 'disabled' //        switched off in the index
  | 'killed' //          remote kill switch
  | 'quarantined' //     failed integrity, schema or semantic checks
  | 'incompatible' //    needs a newer (or older) game version
  | 'unapproved' //      not in the approved state
  | 'other_country' //   belongs to a different country than the active world
  | 'flag_off' //        depends on a feature flag that is off
  | 'rollout' //         outside this device's staged-rollout bucket
  | 'missing'; //        file could not be fetched

export interface ModuleEntry {
  id: string;
  version: string;
  status: ModuleStatus;
  reason: string;
  manifest?: ModuleManifest;
  issues: string[];
  warnings: string[];
  source: 'remote' | 'cache' | 'bundled';
}

/** Compare semver strings: -1, 0, 1. */
export function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) < (pb[i] ?? 0) ? -1 : 1;
  return 0;
}

/** Stable 0–99 bucket for staged rollouts (per install, never per person). */
export function rolloutBucket(installId: string, moduleId: string): number {
  let h = 2166136261;
  for (const c of `${installId}:${moduleId}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) % 100;
}

export interface LifecycleContext {
  now: number;
  country: string;
  flags: Record<string, boolean>;
  index: ContentIndex;
  installId: string;
  gameVersion?: string;
}

/** Lifecycle decision for one module whose manifest validated (or not). */
export function evaluate(entry: ContentIndex['modules'][number], manifest: ModuleManifest | undefined, ctx: LifecycleContext): { status: ModuleStatus; reason: string } {
  const gv = ctx.gameVersion ?? GAME_VERSION;
  if (ctx.index.killSwitch.modules.includes(entry.id)) return { status: 'killed', reason: ctx.index.killSwitch.reason ?? 'Remote kill switch' };
  if (!entry.enabled) return { status: 'disabled', reason: 'Disabled in the content index' };
  if (!manifest) return { status: 'quarantined', reason: 'Failed validation' };
  if (manifest.id !== entry.id || manifest.version !== entry.version) return { status: 'quarantined', reason: 'Manifest id/version does not match the index' };
  if (manifest.approval.state !== 'approved') return { status: 'unapproved', reason: `Approval state: ${manifest.approval.state}` };
  if (manifest.country !== ctx.country) return { status: 'other_country', reason: `For ${manifest.country}` };
  const a = manifest.activation;
  if (cmpVersion(gv, a.minGameVersion) < 0) return { status: 'incompatible', reason: `Needs game ${a.minGameVersion}+` };
  if (a.maxGameVersion && cmpVersion(gv, a.maxGameVersion) > 0) return { status: 'incompatible', reason: `Only up to game ${a.maxGameVersion}` };
  if (a.from && Date.parse(a.from) > ctx.now) return { status: 'scheduled', reason: `Starts ${a.from}` };
  if (a.until && Date.parse(a.until) <= ctx.now) return { status: 'expired', reason: `Ended ${a.until}` };
  if (manifest.brand.licence && Date.parse(manifest.brand.licence.expires) <= ctx.now) return { status: 'expired', reason: 'Brand licence expired' };
  const off = (a.flags ?? []).find((f) => !ctx.flags[f]);
  if (off) return { status: 'flag_off', reason: `Feature flag "${off}" is off` };
  if (entry.rolloutPercent !== undefined && rolloutBucket(ctx.installId, entry.id) >= entry.rolloutPercent) return { status: 'rollout', reason: `Staged rollout (${entry.rolloutPercent}%)` };
  return { status: 'active', reason: 'Running' };
}
