/**
 * Interface copy for: Plan your journey guides, transit planner, accessibility hub and help centre.
 * Owned by the guides feature team. Only that team edits this file.
 *
 * Read in components as `t('guidePages.<key>')` (server: getT(lang); client: useT()).
 * Both languages live here. `guidePagesMs` must have exactly the same keys as `guidePagesEn`
 * (TypeScript enforces it). Plurals are { one, other } objects read with `t.count`.
 * Same copy rules as en.ts: sentence case, plain and warm, no facts (facts live in src/content).
 * The Malay copy is a draft pending review by a native-speaking editor.
 */
export const guidePagesEn = {
  title: 'Plan your journey',
};

export const guidePagesMs: typeof guidePagesEn = {
  title: 'Rancang perjalanan',
};
