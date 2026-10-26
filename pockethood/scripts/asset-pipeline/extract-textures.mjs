// Extract embedded textures from a GLB for inspection. Usage: node extract-textures.mjs in.glb outdir
import { createIO } from './inspect.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';
const io = await createIO();
const [file, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const doc = await io.read(file);
doc.getRoot().listTextures().forEach((t, i) => {
  const ext = t.getMimeType().split('/')[1];
  const p = `${out}/${basename(file, '.glb')}_${i}.${ext}`;
  writeFileSync(p, t.getImage());
  console.log(p, t.getSize());
});
