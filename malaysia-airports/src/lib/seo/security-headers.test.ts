import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { PREFERENCES_INIT_SCRIPT } from '@/lib/preferences';
import { API_HEADERS, NOINDEX_HEADERS, ROUTE_SECURITY_OVERRIDES, contentSecurityPolicy, overrideHeaders, permissionsPolicy, reportOnlyPolicy, securityHeaders } from './security-headers';

const header = (key: string, dev = false, https = true) => securityHeaders({ dev, https }).find((rule) => rule.key === key)?.value;

describe('security headers', () => {
  it('lock the CSP to this origin, with no third party anywhere', () => {
    const csp = contentSecurityPolicy({ dev: false, https: true });
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain('upgrade-insecure-requests');
    expect(csp).not.toMatch(/https?:\/\//);
    expect(csp).not.toContain('*');
  });

  it("allow eval and web sockets only in development", () => {
    expect(contentSecurityPolicy({ dev: false, https: false })).not.toContain('unsafe-eval');
    expect(contentSecurityPolicy({ dev: false, https: false })).not.toContain('ws:');
    expect(contentSecurityPolicy({ dev: true, https: false })).toContain("'unsafe-eval'");
    expect(contentSecurityPolicy({ dev: true, https: false })).toContain('ws:');
    expect(contentSecurityPolicy({ dev: false, https: false })).not.toContain('upgrade-insecure-requests');
  });

  it('send the transport, sniffing, referrer, isolation and feature headers', () => {
    expect(header('Strict-Transport-Security')).toBe('max-age=63072000; includeSubDomains');
    expect(header('X-Content-Type-Options')).toBe('nosniff');
    expect(header('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(header('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(header('X-Frame-Options')).toBe('DENY');
    for (const feature of ['camera', 'microphone', 'geolocation']) expect(header('Permissions-Policy')).toContain(`${feature}=()`);
  });

  it('protect API responses and keep the prototype out of search results', () => {
    expect(API_HEADERS).toContainEqual({ key: 'Cross-Origin-Resource-Policy', value: 'same-origin' });
    expect(NOINDEX_HEADERS).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
  });

  it('report a stricter policy: no inline scripts but the preferences hash, Trusted Types, same-origin reports (security-07)', () => {
    const hash = createHash('sha256').update(PREFERENCES_INIT_SCRIPT).digest('base64');
    const options = { dev: false, https: true, scriptHashes: [hash] };
    const reportOnly = reportOnlyPolicy(options);
    expect(reportOnly).toContain(`script-src 'self' 'sha256-${hash}' 'report-sample'`);
    expect(reportOnly).not.toContain('unsafe-inline\' \'report-sample');
    expect(reportOnly.split('; ').find((directive) => directive.startsWith('script-src'))).not.toContain('unsafe-inline');
    expect(reportOnly).toContain("require-trusted-types-for 'script'");
    expect(reportOnly).toContain('report-uri /api/csp-report');
    expect(reportOnly).toContain('report-to csp');
    const headers = securityHeaders(options);
    expect(headers.find((rule) => rule.key === 'Content-Security-Policy-Report-Only')?.value).toBe(reportOnly);
    expect(headers.find((rule) => rule.key === 'Reporting-Endpoints')?.value).toBe('csp="/api/csp-report"');
  });

  it('let one route group allow payment and named partners without loosening the others (exec-commerce-14)', () => {
    const options = { dev: false, https: true };
    const checkout = { source: '/:lang(en|ms)/checkout/:path*', payment: ['https://pay.partner.example'], frameSrc: ['https://pay.partner.example'], connectSrc: ['https://api.partner.example'] };
    const rules = overrideHeaders(options, checkout);
    const csp = rules.find((rule) => rule.key === 'Content-Security-Policy')?.value ?? '';
    expect(csp).toContain('frame-src https://pay.partner.example');
    expect(csp).toContain("connect-src 'self' https://api.partner.example");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(rules.find((rule) => rule.key === 'Permissions-Policy')?.value).toContain('payment=(self "https://pay.partner.example")');
    // Every other route keeps the closed defaults.
    expect(contentSecurityPolicy(options)).toContain("frame-src 'none'");
    expect(permissionsPolicy()).toContain('payment=()');
    expect(() => overrideHeaders(options, { ...checkout, frameSrc: ['https://*.example'] })).toThrow();
    expect(() => permissionsPolicy({ source: '/x', payment: ['http://insecure.example'] })).toThrow();
    expect(ROUTE_SECURITY_OVERRIDES).toEqual([]);
  });
});
