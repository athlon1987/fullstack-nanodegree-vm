import { defineConfig } from '@playwright/test';

// The sandbox has no GPU, so WebGL runs on SwiftShader (slow): generous timeouts.
export default defineConfig({
  testDir: './e2e',
  timeout: 240_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5199',
    viewport: { width: 1100, height: 720 },
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run content:build && npx vite --port 5199 --strictPort',
    port: 5199,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
