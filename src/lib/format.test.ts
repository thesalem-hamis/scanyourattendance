import { describe, expect, it } from 'vitest';
import { formatPercent, ratio } from './format';

describe('formatPercent', () => {
  it('rounds to a whole percent', () => {
    expect(formatPercent(0.4567)).toBe('46%');
    expect(formatPercent(0.995)).toBe('100%');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(1)).toBe('100%');
  });
  it('shows a dash when there is nothing to measure', () => {
    expect(formatPercent(null)).toBe('–');
    expect(formatPercent(Number.NaN)).toBe('–');
  });
});

describe('ratio', () => {
  it('divides', () => {
    expect(ratio(1, 4)).toBe(0.25);
    expect(ratio(0, 10)).toBe(0);
  });
  it('is null, not Infinity, when the whole is zero', () => {
    expect(ratio(5, 0)).toBeNull();
    expect(ratio(0, 0)).toBeNull();
  });
});
