import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BRAND_COLORS } from './brand';
import { CACHE_NAMES, SAVE_FETCH_CACHE, classifyRequest, extractAssetUrls, extractTitle, isStorable, offlinePagePath, pageKey, precachePaths, type RequestInfo } from './sw-routes';

const ORIGIN = 'https://example.org';
const nav: RequestInfo = { method: 'GET', mode: 'navigate', destination: 'document', rsc: false, sameOrigin: true };
const sub: RequestInfo = { method: 'GET', mode: 'cors', destination: '', rsc: false, sameOrigin: true };
const kind = (path: string, info: RequestInfo = nav) => classifyRequest(new URL(path, ORIGIN), info);

describe('service worker routing', () => {
  it('never touches the API, other origins, non-GET or React Server Component requests', () => {
    expect(kind('/api/flights?airport=kul', sub)).toBe('bypass');
    expect(kind('/api/concierge', { ...sub, method: 'POST' })).toBe('bypass');
    expect(kind('/en/kul/parking', { ...nav, sameOrigin: false })).toBe('bypass');
    expect(kind('/en/kul/parking', { ...sub, rsc: true })).toBe('bypass');
    expect(kind('/en/kul/parking?_rsc=abc', sub)).toBe('bypass');
    expect(kind('/_next/static/service-worker/sw.js', sub)).toBe('bypass');
  });

  it('precaches only the visitor language shell and offline page, revalidating instead of re-downloading (performance-11)', () => {
    expect(precachePaths('en')).toEqual(['/en', '/en/offline']);
    expect(precachePaths('ms')).toEqual(['/ms', '/ms/offline']);
    expect(SAVE_FETCH_CACHE).toBe('no-cache');
    const worker = readFileSync(join(__dirname, 'service-worker.ts'), 'utf8');
    expect(worker).not.toContain("cache: 'reload'");
    expect(worker).toContain('assetsInFlight');
  });

  it('names caches by storage format, not by build, so saved pages survive a deployment (docs-13)', () => {
    expect(Object.values(CACHE_NAMES)).toEqual(['ma-v1-static', 'ma-v1-pages', 'ma-v1-data']);
  });

  it('never stores search results (the query is personal)', () => {
    expect(kind('/en/search?q=lost+passport')).toBe('bypass');
    expect(kind('/ms/search')).toBe('bypass');
  });

  it('serves bundles, fonts and icons cache first', () => {
    for (const path of ['/_next/static/chunks/a1.js', '/_next/static/media/f.woff2', '/icon.svg', '/icon2.png', '/apple-icon.png', '/en/opengraph-image.png']) {
      expect(kind(path, sub), path).toBe('static');
    }
  });

  it('revalidates guidance pages in the background', () => {
    for (const path of ['/en/kul', '/ms/kul/transport', '/en/kul/parking', '/en/guides', '/en/guides/baggage', '/ms/help/lost-property', '/en/accessibility', '/en/airports', '/en/kul/shop-dine/some-outlet']) {
      expect(kind(path), path).toBe('guidance');
    }
    expect(kind('/en/search/index.json', sub)).toBe('data');
    expect(kind('/ms/concierge/knowledge.json', sub)).toBe('data');
    expect(kind('/manifest.webmanifest', sub)).toBe('data');
  });

  it('fetches other pages from the network first', () => {
    for (const path of ['/en', '/en/notices', '/en/kul/flights', '/en/kul/flights/mh2610-20261117-d', '/en/journey', '/en/offline', '/en/concierge']) {
      expect(kind(path), path).toBe('page');
    }
    expect(kind('/')).toBe('root');
    expect(kind('/journey')).toBe('root');
    expect(kind('/robots.txt')).toBe('bypass');
  });

  it('stores pages by path only, so queries never reach the device', () => {
    expect(pageKey(new URL('/en/kul/parking/?t=T1#x', ORIGIN))).toBe(`${ORIGIN}/en/kul/parking`);
    expect(offlinePagePath('ms', '/ms/kul/map')).toBe('/ms/offline?from=%2Fms%2Fkul%2Fmap');
  });
});

describe('page parsing', () => {
  it('finds the bundles a page needs, including chunks named in the inline flight data', () => {
    const html = `<link rel="stylesheet" href="/_next/static/css/app.css"/><script src="/_next/static/chunks/main.js" async></script>
      <script>self.__next_f.push([1,"2:I[\\"/_next/static/chunks/client.js\\",[]]"])</script><img src="https://other.example/x.png">`;
    expect(extractAssetUrls(html, `${ORIGIN}/en`)).toEqual([`${ORIGIN}/_next/static/css/app.css`, `${ORIGIN}/_next/static/chunks/main.js`, `${ORIGIN}/_next/static/chunks/client.js`]);
    // Round 5: the icon sprite is stored once, without the fragment of each icon.
    expect(extractAssetUrls('<svg><use href="/_next/static/media/icons.abc.svg#plane"></use></svg><svg><use href="/_next/static/media/icons.abc.svg#x"></use></svg>', `${ORIGIN}/en`)).toEqual([`${ORIGIN}/_next/static/media/icons.abc.svg`]);
    // Round 5 (E-12): the legacy polyfill bundle is never stored.
    expect(extractAssetUrls('<script src="/_next/static/chunks/polyfills.js" noModule=""></script><script src="/_next/static/chunks/main.js" async=""></script>', `${ORIGIN}/en`)).toEqual([`${ORIGIN}/_next/static/chunks/main.js`]);
    const css = '@font-face{src:url(../media/hanken.woff2) format("woff2")}.m{mask:url("data:image/svg+xml,x")}';
    expect(extractAssetUrls(css, `${ORIGIN}/_next/static/css/app.css`)).toEqual([`${ORIGIN}/_next/static/media/hanken.woff2`]);
  });

  it('reads and decodes the title', () => {
    expect(extractTitle('<head><title>Parking: KLIA &amp; more | Malaysia Airports</title></head>')).toBe('Parking: KLIA & more | Malaysia Airports');
    expect(extractTitle('<p>none</p>')).toBe('');
  });

  it('stores only complete, public, same-origin HTML', () => {
    const response = (status: number, headers: Record<string, string>, extra: Partial<{ type: string; redirected: boolean }> = {}) => ({
      ok: status >= 200 && status < 300,
      status,
      type: extra.type ?? 'basic',
      redirected: extra.redirected ?? false,
      headers: new Headers(headers),
    });
    expect(isStorable(response(200, { 'content-type': 'text/html; charset=utf-8' }), 'html')).toBe(true);
    expect(isStorable(response(404, { 'content-type': 'text/html' }), 'html')).toBe(false);
    expect(isStorable(response(200, { 'content-type': 'text/html', 'cache-control': 'private, no-store' }), 'html')).toBe(false);
    expect(isStorable(response(200, { 'content-type': 'text/html' }, { type: 'opaqueredirect' }), 'html')).toBe(false);
    expect(isStorable(response(200, { 'content-type': 'application/json' }), 'html')).toBe(false);
  });
});

describe('brand colours', () => {
  it('match the design tokens in globals.css', () => {
    const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
    expect(css).toContain(`--color-page: ${BRAND_COLORS.page};`);
    expect(css).toContain(`--color-primary: ${BRAND_COLORS.primary};`);
    expect(css).toContain(`--color-on-primary: ${BRAND_COLORS.onPrimary};`);
    expect(css).toContain(`--color-gold: ${BRAND_COLORS.goldOnDark};`);
    expect(css).toContain(`--color-page: ${BRAND_COLORS.pageDark};`);
  });
});
