import { describe, expect, it } from 'vitest';
import { formatServiceDate, formatTime, todayInLagos } from './dates';

describe('todayInLagos', () => {
  it('uses the Lagos calendar day, not UTC', () => {
    // Lagos is UTC+1
    expect(todayInLagos(new Date('2026-11-01T22:59:59Z'))).toBe('2026-11-01');
    expect(todayInLagos(new Date('2026-11-01T23:00:00Z'))).toBe('2026-11-02');
    expect(todayInLagos(new Date('2026-11-02T00:30:00Z'))).toBe('2026-11-02');
  });

  it('is zero-padded YYYY-MM-DD', () => {
    expect(todayInLagos(new Date('2026-03-05T10:00:00Z'))).toBe('2026-03-05');
  });
});

describe('formatTime', () => {
  it('shows Lagos local time', () => {
    expect(formatTime('2026-11-01T08:05:00Z')).toMatch(/^9:05\s?(am|AM)$/);
    expect(formatTime('2026-11-01T11:30:00Z')).toMatch(/^12:30\s?(pm|PM)$/);
  });
});

describe('formatServiceDate', () => {
  it('names the weekday', () => {
    expect(formatServiceDate('2026-11-01')).toMatch(/Sunday,? 1 Nov(ember)? 2026/);
  });
});