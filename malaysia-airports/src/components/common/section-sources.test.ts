import { describe, expect, it } from 'vitest';
import type { Source } from '@/content/types';
import { sectionSources } from './section-sources';

const source = (id: string) => ({ id, title: id, publisher: 'P', url: `https://example.com/${id}`, kind: 'official', retrieved: '2026-11-16' }) as unknown as Source;
const lookup = { a: source('a'), b: source('b'), c: source('c') };

describe('sectionSources (round 4, one source list per section)', () => {
  it('lists each source once, in first-cited order, with every item it supports', () => {
    const items = [
      { name: 'Plaza Premium Lounge', ids: ['a', 'b'] },
      { name: 'Travel Club Lounge', ids: ['b'] },
      { name: 'Golden Lounge', ids: ['c', 'a'] },
    ];
    const result = sectionSources(items, (item) => item.ids, (item) => item.name, lookup);
    expect(result.sources.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(result.citedBy).toEqual({ a: ['Plaza Premium Lounge', 'Golden Lounge'], b: ['Plaza Premium Lounge', 'Travel Club Lounge'], c: ['Golden Lounge'] });
  });

  it('skips unknown ids and repeated names', () => {
    const items = [
      { name: 'Fast Track', ids: ['a', 'missing'] },
      { name: 'Fast Track', ids: ['a'] },
    ];
    const result = sectionSources(items, (item) => item.ids, (item) => item.name, lookup);
    expect(result.sources).toHaveLength(1);
    expect(result.citedBy).toEqual({ a: ['Fast Track'] });
  });
});
