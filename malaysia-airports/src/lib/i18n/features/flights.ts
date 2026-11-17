/**
 * Interface copy for: Flight board, flight detail and My journey pages.
 * Owned by the flights feature team. Only that team edits this file.
 *
 * Read in components as `t('flightPages.<key>')` (server: getT(lang); client: useT()).
 * Both languages live here. `flightPagesMs` must have exactly the same keys as `flightPagesEn`
 * (TypeScript enforces it). Plurals are { one, other } objects read with `t.count`.
 * Same copy rules as en.ts: sentence case, plain and warm, no facts (facts live in src/content).
 * The Malay copy is a draft pending review by a native-speaking editor.
 */
export const flightPagesEn = {
  title: 'Flights',
};

export const flightPagesMs: typeof flightPagesEn = {
  title: 'Penerbangan',
};
