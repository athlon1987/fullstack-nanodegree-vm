/**
 * Interface copy for: Offline page, install and update prompts, platform notices.
 * Owned by the platform feature team. Only that team edits this file.
 *
 * Read in components as `t('platformPages.<key>')` (server: getT(lang); client: useT()).
 * Both languages live here. `platformPagesMs` must have exactly the same keys as `platformPagesEn`
 * (TypeScript enforces it). Plurals are { one, other } objects read with `t.count`.
 * Same copy rules as en.ts: sentence case, plain and warm, no facts (facts live in src/content).
 * The Malay copy is a draft pending review by a native-speaking editor.
 */
export const platformPagesEn = {
  title: 'Offline',
};

export const platformPagesMs: typeof platformPagesEn = {
  title: 'Luar talian',
};
