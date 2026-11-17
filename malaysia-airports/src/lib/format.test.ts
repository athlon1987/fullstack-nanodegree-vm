import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDistance, formatDuration, formatList, formatNumber, formatQualifiedNumber } from './format';

describe('format', () => {
  it('formats ringgit, dropping the sen for whole amounts', () => {
    expect(formatCurrency(12.5)).toBe('RM 12.50');
    expect(formatCurrency(12)).toBe('RM 12');
    expect(formatCurrency(12, 'en', { alwaysShowSen: true })).toBe('RM 12.00');
    expect(formatCurrency({ amount: 4, currency: 'MYR' }, 'ms')).toBe('RM 4');
  });

  it('formats durations in both languages', () => {
    expect(formatDuration(45, 'en')).toBe('45 min');
    expect(formatDuration(85, 'en')).toBe('1 h 25 min');
    expect(formatDuration(85, 'ms')).toBe('1 j 25 min');
    expect(formatDuration(120, 'en')).toBe('2 h');
    expect(formatDuration(1500, 'en')).toBe('1 day 1 h');
    expect(formatDuration(2880, 'ms')).toBe('2 hari');
  });

  it('formats distances in metres and kilometres', () => {
    expect(formatDistance(347)).toBe('350 m');
    expect(formatDistance(1234)).toBe('1.2 km');
    expect(formatDistance(6)).toBe('6 m');
  });

  it('formats lists and qualified numbers per locale', () => {
    expect(formatList(['A', 'B', 'C'], 'en')).toBe('A, B and C');
    expect(formatList(['A', 'B', 'C'], 'ms')).toBe('A, B dan C');
    expect(formatList(['A', 'B'], 'en', 'disjunction')).toBe('A or B');
    expect(formatNumber(5700)).toBe('5,700');
    expect(formatQualifiedNumber(5700, 'over', 'en')).toBe('over 5,700');
    expect(formatQualifiedNumber(300, 'about', 'ms')).toBe('kira-kira 300');
  });
});
