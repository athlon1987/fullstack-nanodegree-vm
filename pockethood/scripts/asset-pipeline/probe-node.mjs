import { createIO } from './inspect.mjs';
const io = await createIO();
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();
for (const n of root.listNodes()) console.log('node', n.getName(), n.getTranslation(), n.getScale(), n.getRotation(), !!n.getMesh());
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) { const a = p.getAttribute('POSITION'); console.log('pos', a.getComponentType(), a.getNormalized(), a.getMin([]), a.getMax([])); }
console.log(root.listExtensionsUsed().map(e=>e.extensionName));
