/**
 * Interface copy for: Corporate section and the prototype transparency, privacy and terms pages.
 * Owned by the corporate feature team. Only that team edits this file.
 *
 * Read in components as `t('corporatePages.<key>')` (server: getT(lang); client: useT()).
 * Both languages live here. `corporatePagesMs` must have exactly the same keys as `corporatePagesEn`
 * (TypeScript enforces it). Plurals are { one, other } objects read with `t.count`.
 * Same copy rules as en.ts: sentence case, plain and warm, no facts (facts live in src/content).
 * The Malay copy is a draft pending review by a native-speaking editor.
 */
export const corporatePagesEn = {
  title: 'Corporate',
};

export const corporatePagesMs: typeof corporatePagesEn = {
  title: 'Korporat',
};
