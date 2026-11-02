import { describe, expect, it } from 'vitest';
import { formatPhoneDisplay, isValidPhone, normalizePhone, toWhatsAppNumber } from './phone';

const NG = '+2348031234567';

describe('normalizePhone: Nigerian formats', () => {
  it.each([
    ['08031234567'],
    ['0803 123 4567'],
    ['0803-123-4567'],
    ['(0803) 123 4567'],
    ['0803.123.4567'],
    ['+2348031234567'],
    ['+234 803 123 4567'],
    ['2348031234567'],
    ['234 803 123 4567'],
    ['002348031234567'],
    ['8031234567'], // Excel stripped the leading zero
    ['+2340803 123 4567'], // trunk zero typed after +234
    ['2340803 123 4567'],
    ['  08031234567  '],
  ])('%s -> +2348031234567', (input) => {
    expect(normalizePhone(input)).toBe(NG);
  });

  it.each([
    ['07012345678', '+2347012345678'],
    ['08112345678', '+2348112345678'],
    ['09012345678', '+2349012345678'],
    ['09112345678', '+2349112345678'],
  ])('accepts other mobile prefixes: %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
});

describe('normalizePhone: other countries', () => {
  it('accepts international numbers typed with +', () => {
    expect(normalizePhone('+447911123456')).toBe('+447911123456');
    expect(normalizePhone('+1 (415) 555-2671')).toBe('+14155552671');
    expect(normalizePhone('00447911123456')).toBe('+447911123456');
  });
});

describe('normalizePhone: rejects bad input', () => {
  it.each([
    [''],
    ['   '],
    ['abc'],
    ['0803abc4567'],
    ['080+31234567'],
    ['+08031234567'],
    ['0803123456'], // too short
    ['080312345678'], // too long
    ['01234567890'], // not a mobile prefix
    ['+234123456789'],
    ['12345'],
    ['+'],
    ['---'],
  ])('%j -> null', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe('isValidPhone', () => {
  it('mirrors normalizePhone', () => {
    expect(isValidPhone('0803 123 4567')).toBe(true);
    expect(isValidPhone('nope')).toBe(false);
  });
});

describe('formatPhoneDisplay', () => {
  it('formats Nigerian numbers in local style', () => {
    expect(formatPhoneDisplay(NG)).toBe('0803 123 4567');
    expect(formatPhoneDisplay('+2347012345678')).toBe('0701 234 5678');
  });
  it('leaves other numbers alone', () => {
    expect(formatPhoneDisplay('+14155552671')).toBe('+14155552671');
  });
});

describe('toWhatsAppNumber', () => {
  it('drops the plus', () => {
    expect(toWhatsAppNumber(NG)).toBe('2348031234567');
  });
});
