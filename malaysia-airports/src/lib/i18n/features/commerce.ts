/**
 * Interface copy for: Shop and dine discovery, outlet pages, lounges and rest.
 * Owned by the commerce feature team. Only that team edits this file.
 *
 * Read in components as `t('commercePages.<key>')` (server: getT(lang); client: useT()).
 * Both languages live here. `commercePagesMs` must have exactly the same keys as `commercePagesEn`
 * (TypeScript enforces it). Plurals are { one, other } objects read with `t.count`.
 * Same copy rules as en.ts: sentence case, plain and warm, no facts (facts live in src/content).
 * The Malay copy is a draft pending review by a native-speaking editor.
 */
export const commercePagesEn = {
  title: 'Shop & dine',
};

export const commercePagesMs: typeof commercePagesEn = {
  title: 'Beli-belah & makan',
};
