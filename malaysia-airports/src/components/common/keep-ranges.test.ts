import { isValidElement, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { keepRanges } from './keep-ranges';

/** Round 6 (review-3 9.1 item 8): "kaunter 2- / 7" broke inside the range at 125% text. */
describe('keepRanges', () => {
  const nowrap = (node: unknown) => (Array.isArray(node) ? node : [node]).filter((part): part is ReactElement<{ className: string; children: string }> => isValidElement(part) && (part.props as { className?: string }).className === 'whitespace-nowrap').map((part) => part.props.children);

  it('keeps counter ranges, time ranges and model numbers on one line, with their own characters', () => {
    expect(nowrap(keepRanges('Daftar masuk: Baris X, kaunter 2-7'))).toEqual(['2-7']);
    expect(nowrap(keepRanges('Check in: Row H, counters 1–18 · Boarding 21:45'))).toEqual(['1–18']);
    expect(nowrap(keepRanges('Open 07:05–08:00 and 4 - 12'))).toEqual(['07:05–08:00', '4 - 12']);
    expect(nowrap(keepRanges('Boeing 737-800'))).toEqual(['737-800']);
  });

  it('returns text without a range unchanged', () => {
    expect(keepRanges('Check-in closes 06:40')).toBe('Check-in closes 06:40');
  });
});
