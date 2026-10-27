// Validates every content file with the same schemas and semantic checks the game uses,
// then writes content/index.json (sha256 + sizes) and publishes a copy to public/content/.
// Run: npm run content:build  (fails with a non-zero exit code on any error).
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { run } from '../../src/platform/validate';
import { countrySchema, moduleSchema, worldSchema, indexSchema, type ContentIndex } from '../../src/platform/content/schema';
import { checkWorld, installContent } from '../../src/platform/content/install';
import { safeParse } from '../../src/platform/content/loader';

const ROOT = join(import.meta.dirname, '../../content');
const PUBLIC = join(import.meta.dirname, '../../public/content');
const errors: string[] = [];
const warnings: string[] = [];

const read = (dir: string) => (existsSync(join(ROOT, dir)) ? readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.json')).sort() : []);
const load = (path: string) => {
  const text = readFileSync(join(ROOT, path), 'utf8');
  return { text, data: safeParse(text), ref: { path, sha256: createHash('sha256').update(text).digest('hex'), bytes: Buffer.byteLength(text) } };
};

// Keep enabled/kill-switch/rollout/flags from the previous index (they are operations data).
const prev: Partial<ContentIndex> = existsSync(join(ROOT, 'index.json')) ? (JSON.parse(readFileSync(join(ROOT, 'index.json'), 'utf8')) as ContentIndex) : {};

const countries = read('countries').map((f) => {
  const { data, ref } = load(`countries/${f}`);
  const r = run(countrySchema, data);
  if (!r.ok) errors.push(...r.issues.map((i) => `${ref.path} ${i.path}: ${i.message}`));
  return { code: (data as { code: string }).code, ...ref };
});

const worlds = read('worlds').map((f) => {
  const { data, ref } = load(`worlds/${f}`);
  const r = run(worldSchema, data);
  if (!r.ok) errors.push(...r.issues.map((i) => `${ref.path} ${i.path}: ${i.message}`));
  else errors.push(...checkWorld(r.value).map((e) => `${ref.path} ${e}`));
  const w = data as { id: string; country: string };
  return { id: w.id, country: w.country, ...ref, value: r.ok ? r.value : null };
});

const modules = read('modules').map((f) => {
  const { data, ref } = load(`modules/${f}`);
  const r = run(moduleSchema, data);
  if (!r.ok) errors.push(...r.issues.map((i) => `${ref.path} ${i.path}: ${i.message}`));
  const m = data as { id: string; version: string; country: string };
  const old = prev.modules?.find((x) => x.id === m.id);
  return { id: m.id, version: m.version, enabled: old?.enabled ?? true, ...(old?.rolloutPercent !== undefined ? { rolloutPercent: old.rolloutPercent } : {}), ...ref, value: r.ok ? r.value : null, country: m.country };
});

// Semantic + economic checks: install each country's world with its modules, in every language.
for (const w of worlds) {
  if (!w.value) continue;
  for (const lang of ['en', 'ms'] as const) {
    const mods = modules.filter((m) => m.value && m.country === w.country).map((m) => m.value!);
    const report = installContent({ world: w.value, modules: mods, lang, now: Date.now() });
    if (!report.world.ok) errors.push(...report.world.errors.map((e) => `${w.path} [${lang}] ${e}`));
    for (const m of report.modules) {
      errors.push(...m.errors.map((e) => `module ${m.id} [${lang}] ${e}`));
      warnings.push(...m.warnings.map((e) => `module ${m.id} [${lang}] ${e}`));
    }
  }
}

const index: ContentIndex = {
  schemaVersion: 1,
  contentVersion: process.env.CONTENT_VERSION ?? prev.contentVersion ?? '1.0.0',
  generatedAt: new Date().toISOString().slice(0, 10),
  minGameVersion: '0.3.0',
  defaultCountry: prev.defaultCountry ?? 'MY',
  countries: countries.map(({ code, path, sha256, bytes }) => ({ code, path, sha256, bytes })),
  worlds: worlds.map(({ id, country, path, sha256, bytes }) => ({ id, country, path, sha256, bytes })),
  modules: modules.map(({ id, version, enabled, path, sha256, bytes, ...rest }) => ({ id, version, enabled, ...('rolloutPercent' in rest ? { rolloutPercent: rest.rolloutPercent } : {}), path, sha256, bytes })),
  killSwitch: prev.killSwitch ?? { modules: [] },
  flags: prev.flags ?? {},
};
const check = run(indexSchema, index);
if (!check.ok) errors.push(...check.issues.map((i) => `index ${i.path}: ${i.message}`));

for (const w of warnings) console.warn(`warn  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error ${e}`);
  console.error(`\n${errors.length} content error(s); index not written.`);
  process.exit(1);
}
writeFileSync(join(ROOT, 'index.json'), `${JSON.stringify(index, null, 1)}\n`);
rmSync(PUBLIC, { recursive: true, force: true });
mkdirSync(PUBLIC, { recursive: true });
cpSync(ROOT, PUBLIC, { recursive: true });
console.log(`content ok: ${countries.length} countries, ${worlds.length} worlds, ${modules.length} modules → ${relative(process.cwd(), PUBLIC)}`);
