import { createHash } from 'node:crypto';
import path from 'node:path';
import type { NextConfig } from 'next';
import { legacyRedirects } from './src/lib/seo/legacy-redirects';
import { alternateLinkRules } from './src/lib/seo/link-headers';
import { API_HEADERS, NOINDEX_HEADERS, ROUTE_SECURITY_OVERRIDES, overrideHeaders, securityHeaders } from './src/lib/seo/security-headers';
import { PREFERENCES_INIT_SCRIPT } from './src/lib/preferences';

/**
 * Platform settings: security headers, legacy redirects and the designed global 404 are owned by
 * the platform team (docs/engineering/handoffs/platform.md, docs/engineering/security.md).
 */
const isDev = process.env.NODE_ENV === 'development';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
/** Search engines may index the site only when its owner says so (it is a concept prototype). */
const indexable = process.env.SITE_INDEXING === 'allow';
/**
 * A version per build: it names the service worker's caches and makes a new deployment show
 * the "new version" prompt. Set APP_VERSION (for example the commit) in CI for repeatable builds.
 */
const appVersion = process.env.APP_VERSION ?? new Date().toISOString().replace(/\D/g, '').slice(0, 12);
/** Hash of the inline preferences script, allowed by the report-only CSP (security-07). */
const headerOptions = {
  dev: isDev,
  https: siteUrl.startsWith('https://'),
  scriptHashes: [createHash('sha256').update(PREFERENCES_INIT_SCRIPT).digest('base64')],
};

const nextConfig: NextConfig = {
  // NEXT_DIST_DIR lets several engineers run isolated dev servers in one checkout (for example
  // NEXT_DIST_DIR=.next-map npx next dev -p 3201). Production builds use the default .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // The parent folder holds an unrelated app with its own lockfile: keep Turbopack's root here.
    root: path.join(__dirname),
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  compiler: {
    // The service worker is compiled in its own chunking context, where `process` cannot be
    // polyfilled (the build fails on `node:process`); it reads this constant instead.
    define: { __MA_BUILD__: JSON.stringify(appVersion) },
  },
  // Unmatched URLs outside `[lang]` (the root layout lives there) get `src/app/global-not-found.tsx`.
  experimental: {
    globalNotFound: true,
  },
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders(headerOptions) },
      // Per-route widening (a checkout with a payment partner), later rules win on these routes only.
      ...ROUTE_SECURITY_OVERRIDES.map((override) => ({ source: override.source, headers: overrideHeaders(headerOptions, override) })),
      { source: '/api/:path*', headers: API_HEADERS },
      // Canonical and en/ms alternates for every localised page (docs-02).
      ...alternateLinkRules(siteUrl),
      ...(indexable ? [] : [{ source: '/:path*', headers: NOINDEX_HEADERS }]),
    ];
  },
  async redirects() {
    return legacyRedirects();
  },
  async rewrites() {
    // `[lang]` is a root segment, so it matches ANY first segment (`/api/nope`, `/x.txt`): such
    // URLs never count as unmatched, reach the root layout with an invalid locale and get the
    // framework's bare 404. Locale-less pages are redirected by `src/proxy.ts`; the rest (file-like
    // paths) are sent here to the designed global 404 (status 404). Unknown `/api/*` paths are left
    // to `src/app/api/[[...rest]]/route.ts`, which answers a JSON 404. Array
    // rewrites run after static routes and files (API handlers, icons, robots, sitemap) and before
    // dynamic routes, so nothing that exists is affected. `-` is the shared Open Graph image
    // (`/-/opengraph-image.png`).
    return [{ source: '/:path((?!(?:en|ms|_next|api|-)(?:/|$)).+)', destination: '/_not-found' }];
  },
};

export default nextConfig;
