import { describe, expect, it } from 'vitest';
import { API_HEADERS, NOINDEX_HEADERS, contentSecurityPolicy, securityHeaders } from './security-headers';

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
});
