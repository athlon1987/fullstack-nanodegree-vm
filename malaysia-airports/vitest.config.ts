import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Unit tests: pure logic only (content validation, providers, flights, journey, parking,
 * transport, map, search, i18n, storage). Tests live next to the code as `*.test.ts` and run in
 * a Node environment. End-to-end tests are Playwright's job (`e2e/`).
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `server-only` throws outside a React Server Components build; unit tests run server
      // modules directly, so they get an empty stand-in. The real guard still applies to builds.
      'server-only': fileURLToPath(new URL('./src/lib/testing/server-only.ts', import.meta.url)),
      // `next/root-params` is likewise replaced by the compiler (round 2: `I18nPageScope`).
      'next/root-params': fileURLToPath(new URL('./src/lib/testing/root-params.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'e2e'],
  },
});
