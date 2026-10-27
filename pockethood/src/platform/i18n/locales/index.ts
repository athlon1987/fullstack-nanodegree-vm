// Collects every namespace file. Each namespace is a flat map of prefixed keys
// ("build.title"); the Malay file for a namespace is typed against the English one.
type Dict = Record<string, string>;

const merge = (mods: Record<string, unknown>): Dict =>
  Object.assign({}, ...Object.values(mods).map((m) => (m as { default: Dict }).default));

export const DICTS: Record<'en' | 'ms', Dict> = {
  en: merge(import.meta.glob('./en/*.ts', { eager: true })),
  ms: merge(import.meta.glob('./ms/*.ts', { eager: true })),
};
