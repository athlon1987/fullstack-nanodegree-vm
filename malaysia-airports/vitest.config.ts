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
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'e2e'],
  },
});
