import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getAirportContent, guideSlugs, helpTopicSlugs } from '@/content';
import { airportSections } from '@/components/shell/sections.server';
import { LEGACY_AIRPORTS, LEGACY_TOPICS, legacyMappings, legacyRedirects } from './legacy-redirects';

const root = process.cwd();
const require = createRequire(import.meta.url);
// The matcher Next.js itself uses for `redirects()` sources.
const { match, compile } = require('next/dist/compiled/path-to-regexp') as {
  match: (pattern: string, options?: object) => (path: string) => false | { params: Record<string, string | string[]> };
  compile: (pattern: string, options?: object) => (params: object) => string;
};

/** Follow the rules the way Next.js does: first matching source wins. */
function redirect(path: string): { to: string; permanent: boolean } | null {
  for (const rule of legacyRedirects()) {
    const [pathPattern, query] = rule.destination.split('?');
    const result = match(rule.source, { decode: decodeURIComponent })(path);
    if (result) return { to: `${compile(pathPattern)(result.params)}${query ? `?${query}` : ''}`, permanent: rule.permanent };
  }
  return null;
}

/** Does a page exist at this path (without the locale)? */
function pageExists(path: string): boolean {
  const [pathname] = path.split(/[?#]/);
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'guides' && parts[1]) return guideSlugs().includes(parts[1]);
  if (parts[0] === 'help' && parts[1]) return helpTopicSlugs().includes(parts[1]);
  if (parts.length > 0 && /^[a-z]{3}$/.test(parts[0])) {
    const section = parts[1] ?? 'overview';
    return airportSections(parts[0]).includes(section as never);
  }
  return existsSync(join(root, 'src/app/[lang]', ...parts, 'page.tsx'));
}

describe('legacy redirects', () => {
  it('cover every URL in the published MAHB sitemap', () => {
    const urls = readFileSync(join(root, 'docs/research/direct/mahb-sitemap-urls-2026-11-16.txt'), 'utf8').split('\n').filter(Boolean);
    expect(urls.length).toBe(276);
    const explicit = new Set(legacyMappings().map((mapping) => mapping.from));
    for (const url of urls) {
      const path = new URL(url).pathname.replace(/^\/en/, '');
      expect(explicit, url).toContain(path);
      expect(redirect(`/en${path}`), url).not.toBeNull();
    }
  });

  it('send every old path to a page that exists', () => {
    for (const mapping of legacyMappings()) expect(pageExists(mapping.to), `${mapping.from} -> ${mapping.to}`).toBe(true);
  });

  it('only claim sections the airports really have', () => {
    for (const airport of LEGACY_AIRPORTS) {
      const actual = airportSections(airport.slug);
      for (const section of airport.sections) expect(actual, `${airport.legacy}: ${section}`).toContain(section);
      const missed = actual.filter((section) => !airport.sections.includes(section));
      // Not a failure: a section published after this table was written. Update LEGACY_AIRPORTS.
      if (missed.length > 0) console.warn(`legacy-redirects: ${airport.slug} now also has ${missed.join(', ')}; update LEGACY_AIRPORTS`);
    }
  });

  it('map KLIA terminals to the terminal filter and keep the flight board direction', () => {
    expect(redirect('/en/klia1/parking')).toEqual({ to: '/en/kul/parking?t=T1', permanent: true });
    expect(redirect('/en/klia1/air-travel/parking')).toEqual({ to: '/en/kul/parking?t=T1', permanent: true });
    expect(redirect('/en/klia2/flight-information/departures')).toEqual({ to: '/en/kul/flights?t=T2&dir=d', permanent: true });
    expect(redirect('/ms/klia2/flight-information/arrivals')).toEqual({ to: '/ms/kul/flights?t=T2&dir=a', permanent: true });
    expect(redirect('/en/klia1')).toEqual({ to: '/en/kul?t=T1', permanent: true });
  });

  it('use the new airport codes and collapse duplicated topics', () => {
    expect(redirect('/en/penang/parking')).toEqual({ to: '/en/pen/parking', permanent: true });
    expect(redirect('/en/kota-kinabalu/air-travel/public-transport')).toEqual({ to: '/en/bki/transport', permanent: true });
    for (const path of ['butterfly-effect', 'booking-services/butterfly-effect', 'air-travel/services/butterfly-effect']) {
      expect(redirect(`/en/langkawi/${path}`)?.to).toBe('/en/guides/neurodivergent');
    }
    expect(redirect('/en/klia2/transit/inter-terminal-transfer')?.to).toBe(redirect('/en/klia2/air-travel/inter-terminal-transfer')?.to);
  });

  it('answer with 307 where the closest page is a stand-in (docs-07)', () => {
    expect(redirect('/en/kuching/parking')).toEqual({ to: '/en/kch', permanent: false });
    expect(redirect('/en/penang/air-travel/services/fast-track')).toEqual({ to: '/en/pen/facilities', permanent: false });
    for (const legacy of ['klia1', 'klia2', 'penang', 'kota-kinabalu']) expect(redirect(`/en/${legacy}/air-travel/services/wifi`)?.permanent).toBe(false);
    expect(redirect('/en/klia1/air-travel/rental-services')).toEqual({ to: '/en/kul/transport?t=T1', permanent: false });
    expect(redirect('/en/penang/something/not/in/the/sitemap')).toEqual({ to: '/en/pen', permanent: false });
  });

  it('land on the record the old page was about, where it exists (docs-07)', () => {
    expect(redirect('/en/klia1/air-travel/services/fast-track')).toEqual({ to: '/en/kul/facilities?t=T1#kul-t1-fast-track', permanent: true });
    expect(redirect('/ms/klia2/air-travel/services/fast-track')).toEqual({ to: '/ms/kul/facilities?t=T2#kul-t2-fast-track', permanent: true });
    expect(redirect('/en/penang/air-travel/rental-services')).toEqual({ to: '/en/pen/transport#transport-pen-car-rental', permanent: true });
  });

  it('only redirect permanently to pages with the content (content anchor for each destination)', () => {
    for (const mapping of legacyMappings().filter((entry) => entry.permanent)) {
      const [, hash] = mapping.to.split('#');
      if (!hash) continue;
      const slug = mapping.to.split('/')[1];
      const content = getAirportContent(slug);
      const anchors = [
        ...(content?.facilities ?? []).map((facility) => facility.id),
        ...(content?.transport ?? []).map((option) => `transport-${option.id}`),
      ];
      expect(anchors, `${mapping.from} -> ${mapping.to}`).toContain(hash);
    }
    // Topics with no verified content anywhere stay temporary everywhere.
    expect(legacyMappings().filter((entry) => /wifi$/.test(entry.from)).every((entry) => !entry.permanent)).toBe(true);
  });

  it('leave current URLs alone', () => {
    for (const path of ['/en/kul/parking', '/en/pen', '/ms/guides/baggage', '/en/airports']) expect(redirect(path)).toBeNull();
  });

  it('have unique sources and one rule per topic per airport plus a catch-all', () => {
    const rules = legacyRedirects();
    expect(new Set(rules.map((rule) => rule.source)).size).toBe(rules.length);
    expect(rules.length).toBe(LEGACY_AIRPORTS.length * (LEGACY_TOPICS.length + 1));
  });
});
