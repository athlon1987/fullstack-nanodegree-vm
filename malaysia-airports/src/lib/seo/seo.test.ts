import { describe, expect, it } from 'vitest';
import { AIRPORTS, getAirport, guideSlugs } from '@/content';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import manifest from '@/app/manifest';
import { serializeJsonLd } from './json-ld';
import { pageMetadata } from './metadata';
import { airportJsonLd, breadcrumbJsonLd, organizationJsonLd } from './schemas';
import { SITEMAP_EXCLUDED, sitemapPaths, staticRoutePaths } from './site-routes';

describe('sitemap', () => {
  const entries = sitemap();

  it('lists every page in both languages with hreflang alternates', () => {
    const urls = entries.map((entry) => new URL(entry.url).pathname);
    expect(urls).toContain('/en');
    expect(urls).toContain('/ms');
    expect(urls).toContain('/en/kul/parking');
    expect(urls).toContain('/ms/kul/parking');
    for (const slug of guideSlugs()) expect(urls).toContain(`/ms/guides/${slug}`);
    for (const airport of AIRPORTS) expect(urls).toContain(`/en/${airport.slug}`);
    expect(entries.length).toBe(sitemapPaths().length * 2);
    const kul = entries.find((entry) => entry.url.endsWith('/en/kul'));
    expect(kul?.alternates?.languages).toMatchObject({ en: expect.stringMatching(/\/en\/kul$/), ms: expect.stringMatching(/\/ms\/kul$/), 'x-default': expect.stringMatching(/\/en\/kul$/) });
  });

  it('leaves out personal, utility and demonstration pages', () => {
    const paths = sitemapPaths();
    for (const excluded of ['/search', '/journey', '/offline', '/design-system']) expect(paths).not.toContain(excluded);
    expect(paths.some((path) => /\/flights\/./.test(path))).toBe(false);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('only lists airport sections the airport has', () => {
    const paths = sitemapPaths();
    expect(paths).toContain('/kul/map');
    expect(paths).not.toContain('/kch/parking');
  });

  it('lists every static page folder except the deliberate exclusions (docs-01)', () => {
    const paths = new Set(sitemapPaths());
    const statics = staticRoutePaths();
    expect(statics).toEqual(expect.arrayContaining(['/', '/corporate', '/corporate/about', '/corporate/careers', '/corporate/news', '/privacy']));
    for (const path of statics) expect(paths.has(path) || (SITEMAP_EXCLUDED as readonly string[]).includes(path)).toBe(true);
  });

  it('matches the generateStaticParams of the dynamic routes (docs-01)', async () => {
    const paths = new Set(sitemapPaths());
    const news = await import('@/app/[lang]/corporate/news/[slug]/page');
    const guides = await import('@/app/[lang]/guides/[topic]/page');
    const help = await import('@/app/[lang]/help/[topic]/page');
    const outlets = await import('@/app/[lang]/[airport]/shop-dine/[outlet]/page');
    const newsParams = news.generateStaticParams();
    expect(newsParams.length).toBeGreaterThanOrEqual(14);
    for (const { slug } of newsParams) expect(paths.has(`/corporate/news/${slug}`)).toBe(true);
    for (const { topic } of guides.generateStaticParams()) expect(paths.has(`/guides/${topic}`)).toBe(true);
    for (const { topic } of help.generateStaticParams()) expect(paths.has(`/help/${topic}`)).toBe(true);
    for (const { airport, outlet } of outlets.generateStaticParams() as { airport: string; outlet: string }[]) {
      if (outlet !== '__none__') expect(paths.has(`/${airport}/shop-dine/${outlet}`)).toBe(true);
    }
  });
});

describe('robots and manifest', () => {
  it('points crawlers at the sitemap and keeps them out of the API and search results', () => {
    const rules = robots();
    expect(rules.sitemap).toMatch(/\/sitemap\.xml$/);
    const disallow = [rules.rules].flat()[0].disallow;
    expect(disallow).toContain('/api/');
    expect(disallow).toContain('/en/search');
  });

  it('describes an installable app with any and maskable icons', () => {
    const app = manifest();
    expect(app.start_url).toBe('/');
    expect(app.display).toBe('standalone');
    expect(app.icons?.map((icon) => `${icon.sizes} ${icon.purpose}`)).toEqual(['192x192 any', '512x512 any', '512x512 maskable']);
    expect((app as { description_localized?: { ms?: string } }).description_localized?.ms).toBeTruthy();
  });
});

describe('structured data', () => {
  it('escapes markup so content cannot close the script element', () => {
    expect(serializeJsonLd({ name: '</script><script>alert(1)</script>' })).not.toContain('<');
  });

  it('describes an airport with published fields only', () => {
    const pen = getAirport('pen');
    if (!pen) throw new Error('PEN missing from the registry');
    const data = airportJsonLd(pen, 'en');
    expect(data['@type']).toBe('Airport');
    expect(data.iataCode).toBe('PEN');
    expect(data).not.toHaveProperty('geo');
    const unverified = AIRPORTS.find((airport) => airport.icao && airport.unverifiedFields.includes('icao'));
    if (unverified) expect(airportJsonLd(unverified, 'en').icaoCode).toBeUndefined();
  });

  it('describes the organisation without a logo it does not own', () => {
    const data = organizationJsonLd('ms');
    expect(data.name).toBe('Malaysia Airports Holdings Berhad');
    expect(data).not.toHaveProperty('logo');
    expect(Array.isArray(data.contactPoint)).toBe(true);
  });

  it('builds breadcrumbs starting at home, with absolute URLs in the right language', () => {
    const data = breadcrumbJsonLd('ms', [{ name: 'KLIA', path: '/kul' }]) as { itemListElement: { position: number; item: string }[] };
    expect(data.itemListElement.map((item) => item.position)).toEqual([1, 2]);
    expect(data.itemListElement[1].item).toMatch(/^https?:\/\/[^/]+\/ms\/kul$/);
  });
});

describe('page metadata helper', () => {
  it('sets canonical and hreflang alternates without overriding the prototype robots rule', () => {
    const meta = pageMetadata({ lang: 'ms', path: '/kul/parking', title: 'Parkir', description: 'd' });
    expect(meta.alternates?.canonical).toBe('/ms/kul/parking');
    expect(meta.alternates?.languages).toMatchObject({ en: '/en/kul/parking', ms: '/ms/kul/parking', 'x-default': '/en/kul/parking' });
    expect(meta).not.toHaveProperty('robots');
    expect(pageMetadata({ lang: 'en', path: '/offline', title: 't', description: 'd', noindex: true }).robots).toMatchObject({ index: false });
  });
});

describe('CSP report aggregation (security-07)', () => {
  it('reads both report formats and keeps only aggregate, path-level counts', async () => {
    const { createCspReportStore, parseCspReports } = await import('./csp-reports');
    const legacy = parseCspReports({ 'csp-report': { 'effective-directive': 'script-src-elem', 'blocked-uri': 'inline', 'document-uri': 'https://site.example/en/kul/flights/mh1?ref=me#x', 'script-sample': 'self.__next_f.push([1,"x"])' } });
    const modern = parseCspReports([{ type: 'csp-violation', body: { effectiveDirective: 'script-src-elem', blockedURL: 'https://evil.example/x.js?token=1', documentURL: 'https://site.example/ms', sample: '' } }, { type: 'deprecation', body: {} }]);
    expect(legacy).toEqual([{ directive: 'script-src-elem', blocked: 'inline', page: '/en/kul/flights', sample: 'framework:flight-data' }]);
    expect(modern).toEqual([{ directive: 'script-src-elem', blocked: 'https://evil.example', page: '/ms', sample: '' }]);
    const store = createCspReportStore(1);
    store.add([...legacy, ...legacy, ...modern]);
    expect(store.summary()).toEqual({ total: 3, groups: [{ key: 'script-src-elem | inline | /en/kul/flights | framework:flight-data', count: 2 }, { key: 'other', count: 1 }] });
  });
});
