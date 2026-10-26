// Converts runtime GLBs into self-contained JSON glTF (buffers and textures as
// data: URIs) named *.gltf.json, for hosts that only serve text/web types.
// Usage: node scripts/asset-pipeline/export-embedded.mjs <dir>   (e.g. dist/assets/models)
import { readdirSync, writeFileSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const dir = process.argv[2];
let n = 0;
let bytes = 0;
const walk = async (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.name.endsWith('.glb')) {
      const doc = await io.read(p);
      const { json, resources } = await io.writeJSON(doc);
      const mimeOf = (uri) => (uri.endsWith('.png') ? 'image/png' : uri.endsWith('.jpg') || uri.endsWith('.jpeg') ? 'image/jpeg' : 'application/octet-stream');
      const toData = (uri) => `data:${mimeOf(uri)};base64,${Buffer.from(resources[uri]).toString('base64')}`;
      for (const b of json.buffers ?? []) if (b.uri && resources[b.uri]) b.uri = toData(b.uri);
      for (const img of json.images ?? []) if (img.uri && resources[img.uri]) img.uri = toData(img.uri);
      const out = p.replace(/\.glb$/, '.gltf.json');
      writeFileSync(out, JSON.stringify(json));
      bytes += statSync(out).size;
      unlinkSync(p);
      n++;
    }
  }
};
await walk(dir);
console.log(`embedded ${n} models, ${(bytes / 1048576).toFixed(2)} MiB`);
