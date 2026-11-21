/**
 * Unit-test stand-in for the `server-only` package (aliased in vitest.config.ts). The real package
 * throws when a module that imports it is bundled for the browser; Vitest runs server modules
 * directly in Node, where that guard has nothing to protect.
 */
export {};
