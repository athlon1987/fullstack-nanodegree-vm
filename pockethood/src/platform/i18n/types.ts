/** A translation must provide every key of the English namespace it mirrors. */
export type Translation<T> = { readonly [K in keyof T]: string };
