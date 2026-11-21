import { describe, expect, it } from 'vitest';
import { BLOCKED_HREF, localeFromPath, localeHref, negotiateLang, stripLocale, switchLocalePath } from './locale';

describe('locale paths', () => {
  it('prefixes internal paths with the language', () => {
    expect(localeHref('ms', '/kul/flights')).toBe('/ms/kul/flights');
    expect(localeHref('en', '/')).toBe('/en');
    expect(localeHref('en', 'kul/map?to=gate#top')).toBe('/en/kul/map?to=gate#top');
  });

  it('leaves external links, hash links and API routes alone', () => {
    expect(localeHref('ms', 'https://airports.malaysiaairports.com.my/en/klia1/parking')).toBe('https://airports.malaysiaairports.com.my/en/klia1/parking');
    expect(localeHref('ms', 'tel:+60387770000')).toBe('tel:+60387770000');
    expect(localeHref('ms', '#main')).toBe('#main');
    expect(localeHref('ms', '/api/flights?airport=kul')).toBe('/api/flights?airport=kul');
  });

  it('passes through only https:, mailto: and tel:, and blocks other schemes (security-09)', () => {
    expect(localeHref('en', 'mailto:help@example.com')).toBe('mailto:help@example.com');
    for (const href of ['https://evil.example/login'.replace('https', 'http'), '//evil.example/x', '/\\evil.example/x', '\\\\evil.example', 'data:text/html,<script>alert(1)</script>', 'javascript:alert(1)', ' JavaScript:alert(1)', 'https:/\\evil.example', 'java\tscript:alert(1)']) {
      expect(localeHref('en', href)).toBe(BLOCKED_HREF);
    }
  });

  it('never double-prefixes a path that already has a locale', () => {
    expect(localeHref('ms', '/en/kul')).toBe('/ms/kul');
    expect(localeHref('en', '/en')).toBe('/en');
  });

  it('strips and detects the locale', () => {
    expect(stripLocale('/en/kul/flights')).toBe('/kul/flights');
    expect(stripLocale('/ms')).toBe('/');
    expect(stripLocale('/kul/flights')).toBe('/kul/flights');
    expect(stripLocale('/english/page')).toBe('/english/page');
    expect(localeFromPath('/ms/kul')).toBe('ms');
    expect(localeFromPath('/kul')).toBeUndefined();
  });

  it('switches language while keeping the page, query and hash', () => {
    expect(switchLocalePath('/en/kul/map?to=g-gates-c#route', 'ms')).toBe('/ms/kul/map?to=g-gates-c#route');
    expect(switchLocalePath('/ms', 'en')).toBe('/en');
  });

  it('negotiates a language from Accept-Language', () => {
    expect(negotiateLang('ms-MY,ms;q=0.9,en;q=0.8')).toBe('ms');
    expect(negotiateLang('fr-FR,fr;q=0.9,en;q=0.5,ms;q=0.4')).toBe('en');
    expect(negotiateLang('zh-CN,zh;q=0.9')).toBe('en');
    expect(negotiateLang(null)).toBe('en');
  });
});
