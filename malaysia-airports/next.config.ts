import path from 'node:path';
import type { NextConfig } from 'next';
import { legacyRedirects } from './src/lib/seo/legacy-redirects';
import { API_HEADERS, NOINDEX_HEADERS, securityHeaders } from './src/lib/seo/security-headers';

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

const nextConfig: NextConfig = {
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
      { source: '/:path*', headers: securityHeaders({ dev: isDev, https: siteUrl.startsWith('https://') }) },
      { source: '/api/:path*', headers: API_HEADERS },
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
    // paths and unknown `/api/*`) are sent here to the designed global 404 (status 404). Array
    // rewrites run after static routes and files (API handlers, icons, robots, sitemap) and before
    // dynamic routes, so nothing that exists is affected. `-` is the shared Open Graph image
    // (`/-/opengraph-image.png`).
    return [{ source: '/:path((?!(?:en|ms|_next|-)(?:/|$)).+)', destination: '/_not-found' }];
  },
};

export default nextConfig;
