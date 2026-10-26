// Inspect GLB files: bounds, node/mesh/material counts, animation clips.
// Usage: node scripts/asset-pipeline/inspect.mjs <file.glb> [...]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';

export async function createIO() {
  await MeshoptDecoder.ready;
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
}

export async function inspect(io, file) {
  const doc = await io.read(file);
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const b = getBounds(scene);
  let tris = 0;
  for (const mesh of root.listMeshes())
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      tris += idx ? idx.getCount() / 3 : prim.getAttribute('POSITION').getCount() / 3;
    }
  return {
    file,
    size: b.max.map((v, i) => +(v - b.min[i]).toFixed(3)),
    min: b.min.map((v) => +v.toFixed(3)),
    tris: Math.round(tris),
    materials: root.listMaterials().map((m) => m.getName() || '(unnamed)'),
    textures: root.listTextures().length,
    skins: root.listSkins().length,
    animations: root.listAnimations().map((a) => a.getName()),
  };
}

if (process.argv[1] && process.argv[1].endsWith('inspect.mjs')) {
  const io = await createIO();
  for (const f of process.argv.slice(2)) console.log(JSON.stringify(await inspect(io, f)));
}
