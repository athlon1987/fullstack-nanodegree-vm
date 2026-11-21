import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as lucide from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/cn';
import { GLYPHS, buildIconData } from './icon-data.generate.mjs';
import { ICON_DATA } from './icon-data';
import { ICON_NAMES, Icon, iconClassName, resolveIconName } from './icon';

const inner = (markup: string) => markup.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

describe('icon registry (round 5: plain SVG data instead of lucide Client Components)', () => {
  it('icon-data.ts is up to date with lucide-react and the generator list', async () => {
    expect(await buildIconData()).toEqual(ICON_DATA);
    expect(Object.keys(ICON_DATA)).toEqual(Object.keys(GLYPHS));
  });

  it('renders the same geometry and SVG attributes as lucide-react for every icon', () => {
    for (const name of ICON_NAMES) {
      const component = (lucide as unknown as Record<string, lucide.LucideIcon>)[(GLYPHS as Record<string, string>)[name]];
      const theirs = renderToStaticMarkup(createElement(component, { strokeWidth: 1.5, focusable: 'false', 'aria-hidden': true }));
      const ours = renderToStaticMarkup(createElement(Icon, { name }));
      expect(inner(ours), name).toBe(inner(theirs));
      for (const attribute of ['viewBox="0 0 24 24"', 'fill="none"', 'stroke="currentColor"', 'stroke-width="1.5"', 'stroke-linecap="round"', 'stroke-linejoin="round"', 'aria-hidden="true"'])
        expect(ours, `${name} ${attribute}`).toContain(attribute);
    }
  });

  it('keeps labels, aliases and the circle fallback', () => {
    expect(renderToStaticMarkup(createElement(Icon, { name: 'plane', label: 'Flight' }))).toMatch(/role="img" aria-label="Flight"/);
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
