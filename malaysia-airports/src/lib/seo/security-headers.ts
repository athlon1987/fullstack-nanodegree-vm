/**
 * HTTP security headers, applied to every response from `next.config.ts` `headers()`.
 * Rationale for each directive: docs/engineering/security.md, section 3.
 *
 * Static headers, not nonces (Next.js notes, section 7): every page is prerendered, and a nonce
 * would force per-request rendering and still miss the framework's inline scripts. The cost is
 * `'unsafe-inline'` in `script-src`; everything else is locked to this origin.
 *
 * Pure module with NO imports: `next.config.ts` loads it outside the app bundle.
 */

export interface SecurityHeaderOptions {
  /** `next dev`: React needs `eval` for debugging, and the dev overlay uses web sockets and data: fonts. */
  dev: boolean;
  /** The site is served over HTTPS (production): ask browsers to upgrade any stray http: request. */
  https: boolean;
}

export interface HeaderRule {
  key: string;
  value: string;
}

/**
 * The Content-Security-Policy directives, in the order they are sent. Each one is the narrowest
 * value the site works with: no third-party origin appears anywhere (build-spec, section 2).
 */
export function cspDirectives({ dev, https }: SecurityHeaderOptions): string[] {
  return [
    // Anything not listed below: this origin only.
    "default-src 'self'",
    // Our bundles from /_next/static, plus the inline scripts in prerendered HTML (the framework's
    // flight data and the preferences script that sets the theme before first paint).
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
    // Stylesheets from this origin; inline style attributes are set by React and Radix.
    "style-src 'self' 'unsafe-inline'",
    // Images and icons we serve; data: for CSS pattern masks and inline SVG; blob: for generated images.
    "img-src 'self' data: blob:",
    // Self-hosted fonts (next/font/local); the dev overlay inlines its own.
    `font-src 'self'${dev ? ' data:' : ''}`,
    // fetch() to our API routes and static JSON; the dev server's hot reload uses web sockets.
    `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
    "media-src 'self'",
    // The service worker is served from /_next/static/service-worker/ on this origin.
    "worker-src 'self'",
    "manifest-src 'self'",
    // We embed nothing, and nothing may embed us (clickjacking).
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    // No <base> element is ever needed; forms (search) submit to this origin only.
    "base-uri 'none'",
    "form-action 'self'",
    ...(https ? ['upgrade-insecure-requests'] : []),
  ];
}

export function contentSecurityPolicy(options: SecurityHeaderOptions): string {
  return cspDirectives(options).join('; ');
}

/**
 * Powerful features this site never uses. Empty allowlists switch them off for this page and
 * every frame. Notifications are not a policy-controlled feature and stay available (flight
 * alerts ask for permission themselves).
 */
export const PERMISSIONS_POLICY = [
  'camera=()',
  'microphone=()',
  'geolocation=()',
  'payment=()',
  'usb=()',
  'display-capture=()',
].join(', ');

/** Headers for every response. */
export function securityHeaders(options: SecurityHeaderOptions): HeaderRule[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(options) },
    // Two years, all subdomains. Browsers ignore it on plain HTTP, so it is safe in development.
    // `preload` is a separate, hard-to-undo decision for the domain owner (security.md, 3).
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
    // Pop-ups we open cannot reach back into this window, and vice versa.
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    // Legacy equivalent of frame-ancestors 'none' for older browsers.
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Origin-Agent-Cluster', value: '?1' },
  ];
}

/** API responses are data for this site only: other origins may not load them, even as no-cors. */
export const API_HEADERS: HeaderRule[] = [{ key: 'Cross-Origin-Resource-Policy', value: 'same-origin' }];

/**
 * While the site is a concept prototype it must not appear in search results (build-spec,
 * section 1). Pages already carry `<meta name="robots" content="noindex">`; this header covers
 * everything else (JSON, images, the sitemap). Switched off by `SITE_INDEXING=allow`.
 */
export const NOINDEX_HEADERS: HeaderRule[] = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
