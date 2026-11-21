import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against a production build (`next build` + `next start`): prefetching,
 * status codes and the proxy only behave for real there (docs/engineering/next16-notes.md, 16).
 *
 * `npm run e2e` builds once and serves on port 3100. If a server is already listening there
 * (for example while you iterate), it is reused, except on CI.
 */
const PORT = 3100;
/**
 * PLAYWRIGHT_BASE_URL points the suite at a server that is already running (for example the
 * shared dev server while features are built in parallel). No web server is started then.
 */
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? `http://localhost:${PORT}`;
/**
 * Safari on iPhone (docs-12): a WebKit phone project, on when PLAYWRIGHT_WEBKIT=1. CI installs
 * WebKit and sets it; locally it stays off where the WebKit browser is not installed
 * (`npx playwright install webkit` to add it).
 */
const withWebKit = process.env.PLAYWRIGHT_WEBKIT === '1';
/**
 * Request limits key on a client address from a trusted source (src/lib/concierge/rate-limit.ts),
 * which production must configure (docs/engineering/handoffs/platform.md). Unconfigured, every
 * client shares one bucket, and parallel workers lock each other out of flight pages and the
 * board feed (verification round, 21 November 2026). So the e2e server is configured like
 * production: it trusts this header (start a reused server with
 * `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip`), and each worker sends its own address.
 */
const E2E_CLIENT_HEADER = 'x-e2e-client-ip';
const workerAddress = `10.0.0.${Number(process.env.TEST_PARALLEL_INDEX ?? 0) + 1}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    extraHTTPHeaders: { [E2E_CLIENT_HEADER]: workerAddress },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      // A Chromium phone profile at the size the design is judged at (390 by 844, touch).
      name: 'phone',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
    ...(withWebKit
      ? [
          {
            // WebKit on an iPhone profile at the same size: Safari's engine, touch and its quirks.
            name: 'webkit-phone',
            use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 } },
          },
        ]
      : []),
  ],
  webServer: externalBaseURL ? undefined : {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `${baseURL}/en`,
    reuseExistingServer: !process.env.CI,
    env: { TRUSTED_CLIENT_IP_HEADER: E2E_CLIENT_HEADER },
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
