/**
 * Interface copy for: Terminal map, wayfinding and facilities directory.
 * Owned by the map feature team. Only that team edits this file.
 *
 * Read in components as `t('mapPages.<key>')` (server: getT(lang); client: useT()).
 * Both languages live here. `mapPagesMs` must have exactly the same keys as `mapPagesEn`
 * (TypeScript enforces it). Plurals are { one, other } objects read with `t.count`.
 * Same copy rules as en.ts: sentence case, plain and warm, no facts (facts live in src/content).
 * The Malay copy is a draft pending review by a native-speaking editor.
 */
export const mapPagesEn = {
  title: 'Terminal map',
};

export const mapPagesMs: typeof mapPagesEn = {
  title: 'Peta terminal',
};
