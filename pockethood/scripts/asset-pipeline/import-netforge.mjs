// Asset import pipeline: asset-sources/netforge  ->  public/assets/models + catalog.
//  1. verify every source file against the mirror's sha256 index (provenance check)
//  2. read with glTF Transform (meshopt aware), prune + dedup
//  3. harmonise palette: override base colours by material name (see selection.mjs)
//  4. write runtime GLB (meshopt re-encoded), record bounds/tris/clips/bytes
//  5. emit src/rendering/models/catalog.generated.json for the runtime loader
// Originals in asset-sources/ are never modified.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { SELECTION } from './selection.mjs';

const SRC = 'asset-sources/netforge';
const OUT = 'public/assets/models';
const index = JSON.parse(readFileSync(join(SRC, 'index.json'), 'utf8')).assets;
const manifest = JSON.parse(readFileSync(join(SRC, 'manifest-lowpoly.json'), 'utf8')).assets;
const byId = Object.fromEntries(manifest.map((a) => [a.id, a]));

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const hexToLinear = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
};

const catalog = {};
let failures = 0;
for (const sel of SELECTION) {
  const key = `style.lowpoly.${sel.id}`;
  const srcPath = join(SRC, 'lowpoly', `${sel.id}.glb`);
  const bytes = readFileSync(srcPath);
  const sha = createHash('sha256').update(bytes).digest('hex');
  if (!index[key] || index[key].sha256 !== sha) {
    console.error(`✗ ${sel.id}: sha256 mismatch or not in index — skipped`);
    failures++;
    continue;
  }
  const doc = await io.readBinary(new Uint8Array(bytes));
  const root = doc.getRoot();
  for (const mat of root.listMaterials()) {
    const hex = sel.overrides?.[mat.getName()];
    if (hex) mat.setBaseColorFactor([...hexToLinear(hex), 1]);
  }
  await doc.transform(prune({ keepLeaves: false }), dedup());
  const outPath = join(OUT, sel.category, `${sel.id}.glb`);
  mkdirSync(dirname(outPath), { recursive: true });
  const outBytes = await io.writeBinary(doc);
  writeFileSync(outPath, outBytes);
  const b = getBounds(root.getDefaultScene() ?? root.listScenes()[0]);
  let tris = 0;
  for (const m of root.listMeshes())
    for (const p of m.listPrimitives()) tris += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
  const meta = byId[key] ?? {};
  catalog[sel.id] = {
    url: `assets/models/${sel.category}/${sel.id}.glb`,
    category: sel.category,
    kind: meta.kind,
    refHeight: meta.height,
    rig: meta.rig ?? null,
    pack: meta.source?.pack,
    sourcePath: meta.source?.path ?? meta.source?.page,
    sha256: sha,
    bytes: outBytes.byteLength,
    tris: Math.round(tris),
    bounds: { min: b.min.map((v) => +v.toFixed(3)), max: b.max.map((v) => +v.toFixed(3)) },
    clips: root.listAnimations().map((a) => a.getName()),
    harmonised: !!sel.overrides,
  };
  console.log(`✓ ${sel.id.padEnd(18)} ${sel.category.padEnd(12)} ${String(outBytes.byteLength).padStart(7)} B  ${Math.round(tris)} tris  ${catalog[sel.id].clips.length} clips`);
}

// Audio: Kenney interface/impact SFX (CC0)
mkdirSync('public/assets/audio/sfx', { recursive: true });
for (const f of readdirSync(join(SRC, 'sfx'))) {
  const key = `audio.sfx.${f.replace('.ogg', '')}`;
  const sha = createHash('sha256').update(readFileSync(join(SRC, 'sfx', f))).digest('hex');
  if (index[key]?.sha256 !== sha) { console.error(`✗ sfx ${f}: sha mismatch`); failures++; continue; }
  copyFileSync(join(SRC, 'sfx', f), join('public/assets/audio/sfx', f));
}

writeFileSync('src/rendering/models/catalog.generated.json', JSON.stringify(catalog, null, 1) + '\n');
const total = Object.values(catalog).reduce((s, c) => s + c.bytes, 0);
console.log(`\n${Object.keys(catalog).length} models, ${(total / 1024).toFixed(0)} KiB runtime, ${failures} failures`);
if (failures) process.exit(1);
