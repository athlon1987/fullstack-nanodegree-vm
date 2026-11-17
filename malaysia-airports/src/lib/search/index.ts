/**
 * Site search. Server-side entry point: re-exports the document builder (which imports all
 * content) and the engine.
 *
 * Client Components: import from `@/lib/search/engine` only, and receive the documents as a
 * prop or over the network.
 */
export * from './engine';
export { buildSearchDocuments } from './documents';
