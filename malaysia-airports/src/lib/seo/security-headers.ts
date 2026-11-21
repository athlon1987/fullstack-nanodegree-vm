/**
 * HTTP security headers, applied to every response from `next.config.ts` `headers()`.
 * Rationale for each directive: docs/engineering/security.md, section 3.
 *
 * Static headers, not nonces (Next.js notes, section 7): every page is prerendered, and a nonce
 * would force per-request rendering and still miss the framework's inline scripts. The cost is
 * `'unsafe-inline'` in `script-src`; everything else is locked to this origin.
 *
 * The way out (security-07): a second, report-only policy (`reportOnlyPolicy`) that allows only
 * our bundles and the hash of the preferences script, requires Trusted Types, and reports every
 * violation (with a sample) to `/api/csp-report`. Once the report window shows only the
 * framework's own inline scripts, the enforced policy can drop `'unsafe-inline'`: hashes on the
 * prerendered pages and nonces on the per-request routes (docs/engineering/security.md, 3).
 *
 * Per-route overrides (`RouteSecurityOverride`) let a future checkout route allow `payment` for
 * itself and a named payment origin, and frame or connect to named partners, without loosening
 * any other route (exec-commerce-14).
 *
 * Pure module with NO imports: `next.config.ts` loads it outside the app bundle.
 */

export interface SecurityHeaderOptions {
  /** `next dev`: React needs `eval` for debugging, and the dev overlay uses web sockets and data: fonts. */
  dev: boolean;
  /** The site is served over HTTPS (production): ask browsers to upgrade any stray http: request. */
  https: boolean;
  /** Base64 SHA-256 hashes of our own inline scripts (the preferences script), for the report-only policy. */
  scriptHashes?: readonly string[];
}

/** Where browsers send CSP violation reports (same origin; rate limited in `src/proxy.ts`). */
export const CSP_REPORT_PATH = '/api/csp-report';
/** The Reporting API endpoint name used by `report-to`. */
export const CSP_REPORT_GROUP = 'csp';

/**
 * Extra permissions for one group of routes, for example a checkout that embeds a payment
 * partner. Origins must be exact `https://host` values; nothing here applies to other routes.
 */
export interface RouteSecurityOverride {
  /** `next.config.ts` `headers()` source, e.g. `/:lang(en|ms)/checkout/:path*`. */
  source: string;
  /** Allow the Payment Request API for this origin and these payment origins. */
  payment?: readonly string[];
  /** Partner origins this route may frame (widgets, 3-D Secure pages). */
  frameSrc?: readonly string[];
  /** Partner origins this route may call with fetch. */
  connectSrc?: readonly string[];
  /** Partner origins this route may load scripts from (a payment SDK). */
  scriptSrc?: readonly string[];
  /** Partner origins this route's forms may post to. */
  formAction?: readonly string[];
}

/**
 * Per-route overrides in force. Empty: no checkout or partner widget exists yet, and no partner
 * origin may be named until MAHB and the partner confirm it (needs partner data).
 */
export const ROUTE_SECURITY_OVERRIDES: readonly RouteSecurityOverride[] = [];

const ORIGIN = /^https:\/\/[a-z0-9.-]+(?::\d{1,5})?$/;

function origins(values: readonly string[] | undefined): string {
  const valid = (values ?? []).filter((value) => ORIGIN.test(value));
  if (valid.length !== (values ?? []).length) throw new Error('Security override origins must be exact https:// origins');
  return valid.length ? ` ${valid.join(' ')}` : '';
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

export function contentSecurityPolicy(options: SecurityHeaderOptions, override?: RouteSecurityOverride): string {
  return applyOverride(cspDirectives(options), override).join('; ');
}

/** Widen only the directives an override names, for its own routes. */
function applyOverride(directives: string[], override?: RouteSecurityOverride): string[] {
  if (!override) return directives;
  return directives.map((directive) => {
    const [name] = directive.split(' ');
    if (name === 'frame-src' && override.frameSrc?.length) return `frame-src${origins(override.frameSrc)}`;
    if (name === 'connect-src' && override.connectSrc?.length) return `${directive}${origins(override.connectSrc)}`;
    if (name === 'script-src' && override.scriptSrc?.length) return `${directive}${origins(override.scriptSrc)}`;
    if (name === 'form-action' && override.formAction?.length) return `${directive}${origins(override.formAction)}`;
    return directive;
  });
}

/**
 * The report-only policy: what the enforced policy will become. No `'unsafe-inline'` for
 * scripts (only our bundles and the preferences script's hash), Trusted Types required, and
 * every violation reported with a sample so the framework's own inline scripts can be told apart
 * from anything injected.
 */
export function reportOnlyPolicy(options: SecurityHeaderOptions, override?: RouteSecurityOverride): string {
  const hashes = (options.scriptHashes ?? []).map((hash) => ` 'sha256-${hash}'`).join('');
  const directives = cspDirectives(options).map((directive) =>
    directive.startsWith('script-src ') ? `script-src 'self'${hashes}${options.dev ? " 'unsafe-eval'" : ''} 'report-sample'` : directive,
  );
  return [...applyOverride(directives, override), "require-trusted-types-for 'script'", `report-uri ${CSP_REPORT_PATH}`, `report-to ${CSP_REPORT_GROUP}`].join('; ');
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

/** `Permissions-Policy` for a route, with `payment` widened only where an override asks. */
export function permissionsPolicy(override?: RouteSecurityOverride): string {
  if (!override?.payment) return PERMISSIONS_POLICY;
  origins(override.payment); // throws on anything but exact https:// origins
  const allow = ['self', ...override.payment.map((origin) => `"${origin}"`)].join(' ');
  return PERMISSIONS_POLICY.replace('payment=()', `payment=(${allow})`);
}

/** Headers for every response. */
export function securityHeaders(options: SecurityHeaderOptions): HeaderRule[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(options) },
    { key: 'Content-Security-Policy-Report-Only', value: reportOnlyPolicy(options) },
    { key: 'Reporting-Endpoints', value: `${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"` },
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

/** The header rules for one override's routes (they replace the defaults on those routes only). */
export function overrideHeaders(options: SecurityHeaderOptions, override: RouteSecurityOverride): HeaderRule[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(options, override) },
    { key: 'Content-Security-Policy-Report-Only', value: reportOnlyPolicy(options, override) },
    { key: 'Permissions-Policy', value: permissionsPolicy(override) },
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
