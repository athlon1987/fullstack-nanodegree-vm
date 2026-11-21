import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as lucide from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/cn';
import { GLYPHS, buildIconData, renderIconNames, renderSprite } from './icon-data.generate.mjs';
import { ICON_NAMES, Icon, iconClassName, resolveIconName } from './icon';

const sprite = readFileSync(new URL('./icons.svg', import.meta.url), 'utf8');
const names = readFileSync(new URL('./icon-names.ts', import.meta.url), 'utf8');
const inner = (markup: string) => markup.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const symbol = (name: string) => new RegExp(`<symbol id="${name}" viewBox="0 0 24 24">(.*?)</symbol>`).exec(sprite)?.[1];

describe('icon registry (round 5: one sprite instead of lucide Client Components)', () => {
  it('icons.svg and icon-names.ts are up to date with lucide-react and the generator list', async () => {
    const data = await buildIconData();
    expect(sprite).toBe(renderSprite(data));
    expect(names).toBe(renderIconNames(data));
    expect([...ICON_NAMES]).toEqual(Object.keys(GLYPHS));
  });

  it('each symbol holds the geometry lucide-react renders for that icon', () => {
    for (const name of ICON_NAMES) {
      const component = (lucide as unknown as Record<string, lucide.LucideIcon>)[(GLYPHS as Record<string, string>)[name]];
      // React writes `<path d="…"></path>`; the sprite uses self-closing tags.
      const theirs = inner(renderToStaticMarkup(createElement(component))).replace(/><\/(path|circle|rect|line|ellipse|polyline|polygon)>/g, '/>');
      expect(symbol(name), name).toBe(theirs);
    }
  });

  it('renders a plain SVG that points at the sprite, with lucide’s attributes', () => {
    const markup = renderToStaticMarkup(createElement(Icon, { name: 'plane-takeoff', size: 'sm' }));
    expect(markup).toMatch(/<use href="[^"]*icons[^"]*\.svg#plane-takeoff"><\/use>/);
    for (const attribute of ['viewBox="0 0 24 24"', 'fill="none"', 'stroke="currentColor"', 'stroke-width="1.5"', 'stroke-linecap="round"', 'stroke-linejoin="round"', 'aria-hidden="true"', 'focusable="false"', 'class="shrink-0 size-4"'])
      expect(markup, attribute).toContain(attribute);
    expect(renderToStaticMarkup(createElement(Icon, { name: 'plane', label: 'Flight' }))).toMatch(/role="img" aria-label="Flight"/);
    expect(renderToStaticMarkup(createElement(Icon, { name: 'prayer-room' }))).toContain('#moon-star"');
  });

  it('keeps aliases and the circle fallback', () => {
    expect(resolveIconName('prayer-room')).toBe('moon-star');
    expect(resolveIconName('constructor')).toBe('circle');
    expect(resolveIconName('no-such-icon')).toBe('circle');
  });

  it('merges classes as cn() did for the classes icons are given, without tailwind-merge', () => {
    const cases: [Parameters<typeof iconClassName>[0], string | undefined, string][] = [
      ['md', undefined, 'shrink-0 size-5'],
      ['sm', 'mt-0.5 shrink-0 text-ink-2', 'shrink-0 size-4 mt-0.5 text-ink-2'],
      ['md', 'sm:size-4', 'shrink-0 size-5 sm:size-4'],
      ['md', 'size-3', 'shrink-0 size-3'],
      ['lg', 'h-4 w-4 text-gold', 'shrink-0 size-6 h-4 w-4 text-gold'],
      ['xs', 'shrink-0 opacity-70 max-xs:hidden', 'shrink-0 size-3.5 opacity-70 max-xs:hidden'],
    ];
    const sizes = { xs: 'size-3.5', sm: 'size-4', md: 'size-5', lg: 'size-6', xl: 'size-8' } as const;
    for (const [size, className, expected] of cases) {
      expect(iconClassName(size, className)).toBe(expected);
      // The same set of classes tailwind-merge kept (order aside).
      expect(new Set(iconClassName(size, className).split(' '))).toEqual(new Set(cn('shrink-0', sizes[size], className).split(' ')));
    }
  });
});
