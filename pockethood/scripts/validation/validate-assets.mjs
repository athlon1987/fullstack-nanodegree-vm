// Asset validation: every catalogued model exists, fits the size/poly budget,
// rigged characters carry the clips the animation state machine needs, and
// every model referenced by rendering code is actually in the catalog.
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const catalog = JSON.parse(readFileSync('src/rendering/models/catalog.generated.json', 'utf8'));
const BUDGET = { modelBytes: 512 * 1024, totalBytes: 6 * 1024 * 1024, tris: 6000 };
const REQUIRED_CLIPS = { characters: ['idle', 'walk', 'sit', 'emote-yes', 'interact-right', 'pick-up'], animals: ['Idle'] };
const problems = [];
let total = 0;
for (const [id, c] of Object.entries(catalog)) {
  const path = join('public', c.url);
  let size = 0;
  try {
    size = statSync(path).size;
  } catch {
    problems.push(`${id}: missing runtime file ${path}`);
    continue;
  }
  total += size;
  if (size > BUDGET.modelBytes) problems.push(`${id}: ${(size / 1024).toFixed(0)} KiB exceeds ${BUDGET.modelBytes / 1024} KiB`);
  if (c.tris > BUDGET.tris) problems.push(`${id}: ${c.tris} tris exceeds ${BUDGET.tris}`);
  for (const clip of REQUIRED_CLIPS[c.category] ?? []) {
    if (!c.clips.some((n) => n.split('|').pop() === clip || n.endsWith(`_${clip}`))) problems.push(`${id}: missing clip "${clip}"`);
  }
}
if (total > BUDGET.totalBytes) problems.push(`total ${(total / 1048576).toFixed(2)} MiB exceeds budget`);

// Every model name used in rendering code must exist in the catalog.
const files = [];
const walk = (d) => readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(join(d, e.name)) : /\.tsx?$/.test(e.name) && files.push(join(d, e.name))));
walk('src/rendering');
const used = new Set();
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/(?:prop\(\w+,\s*|model\()'([a-z_]+)'/g)) used.add(m[1]);
}
for (const n of used) if (!catalog[n]) problems.push(`rendering references unknown model "${n}"`);

console.log(`${Object.keys(catalog).length} models, ${(total / 1048576).toFixed(2)} MiB, ${used.size} referenced by name in rendering code`);
if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  process.exit(1);
}
console.log('✓ all assets valid');
