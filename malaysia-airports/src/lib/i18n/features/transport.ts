/**
 * Interface copy for: Ground transport planner and parking pages.
 * Owned by the transport feature team. Only that team edits this file.
 *
 * Read in components as `t('transportPages.<key>')` (server: getT(lang); client: useT()).
 * Both languages live here. `transportPagesMs` must have exactly the same keys as `transportPagesEn`
 * (TypeScript enforces it). Plurals are { one, other } objects read with `t.count`.
 * Same copy rules as en.ts: sentence case, plain and warm, no facts (facts live in src/content).
 * The Malay copy is a draft pending review by a native-speaking editor.
 */
export const transportPagesEn = {
  title: 'Getting here',
};

export const transportPagesMs: typeof transportPagesEn = {
  title: 'Cara ke sini',
};
