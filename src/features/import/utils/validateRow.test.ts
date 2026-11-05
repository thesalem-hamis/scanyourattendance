import { describe, expect, it } from 'vitest';
import type { ColumnMapping } from '../types';
import { normalizeChurch, normalizeGender, parseAge, validateRow, validateRows } from './validateRow';

const mapping: ColumnMapping = {
  fullName: 'Name',
  firstName: null,
  lastName: null,
  phone: 'Phone',
  age: 'Age',
  gender: 'Sex',
  churchGroup: 'Church',
};

const good = { Name: 'Ada Obi', Phone: '0803 123 4567', Age: '15', Sex: 'F', Church: 'Church 1' };

describe('normalizeGender', () => {
  it.each([
    ['Male', 'Male'], ['male', 'Male'], ['M', 'Male'], [' boy ', 'Male'],
    ['Female', 'Female'], ['F', 'Female'], ['girl', 'Female'], ['WOMAN', 'Female'],
  ])('%j -> %s', (input, expected) => expect(normalizeGender(input)).toBe(expected));

  it.each([[''], ['x'], ['other'], ['mf']])('%j -> null', (input) => expect(normalizeGender(input)).toBeNull());
});

describe('normalizeChurch', () => {
  it.each([
    ['Church 1', 'Church 1'], ['church1', 'Church 1'], ['1', 'Church 1'], ['C1', 'Church 1'], ['One', 'Church 1'],
    ['Church 2', 'Church 2'], ['CHURCH-2', 'Church 2'], ['2', 'Church 2'], ['c2', 'Church 2'],
  ])('%j -> %s', (input, expected) => expect(normalizeChurch(input)).toBe(expected));

  it.each([[''], ['3'], ['church'], ['Church 12'], ['Lagos']])('%j -> null', (input) => expect(normalizeChurch(input)).toBeNull());
});

describe('parseAge', () => {
  it('reads plain numbers and "15 yrs" style', () => {
    expect(parseAge('15')).toEqual({ ok: true, age: 15 });
    expect(parseAge(' 9 ')).toEqual({ ok: true, age: 9 });
    expect(parseAge('15 yrs')).toEqual({ ok: true, age: 15 });
    expect(parseAge('16years')).toEqual({ ok: true, age: 16 });
  });
  it('treats blank as "no age"', () => {
    expect(parseAge('')).toEqual({ ok: true, age: null });
    expect(parseAge('   ')).toEqual({ ok: true, age: null });
  });
  it.each([['0'], ['25'], ['99'], ['abc'], ['15.5'], ['-3'], ['1 5'], ['100']])('rejects %j', (input) => {
    expect(parseAge(input)).toEqual({ ok: false });
  });
});

describe('validateRow', () => {
  it('accepts a good row and normalises every value', () => {
    expect(validateRow(good, 2, mapping, null)).toEqual({
      ok: true,
      row: { rowNumber: 2, fullName: 'Ada Obi', phone: '+2348031234567', age: 15, gender: 'Female', churchGroup: 'Church 1' },
    });
  });

  it('tidies the name', () => {
    const result = validateRow({ ...good, Name: '  Ada    Obi ' }, 2, mapping, null);
    expect(result.ok && result.row.fullName).toBe('Ada Obi');
  });

  it('builds the name from first + last when there is no full-name column', () => {
    const split: ColumnMapping = { ...mapping, fullName: null, firstName: 'First', lastName: 'Last' };
    const result = validateRow({ ...good, First: 'Ada', Last: 'Obi' }, 2, split, null);
    expect(result.ok && result.row.fullName).toBe('Ada Obi');
  });

  it('uses the fixed church and ignores the church column', () => {
    const result = validateRow({ ...good, Church: 'nonsense' }, 2, mapping, 'Church 2');
    expect(result.ok && result.row.churchGroup).toBe('Church 2');
  });

  it('allows a missing age', () => {
    const result = validateRow({ ...good, Age: '' }, 2, mapping, null);
    expect(result.ok && result.row.age).toBeNull();
  });

  it('keeps Excel-stripped phone numbers (leading zero lost)', () => {
    const result = validateRow({ ...good, Phone: '8031234567' }, 2, mapping, null);
    expect(result.ok && result.row.phone).toBe('+2348031234567');
  });

  it('lists every problem in a bad row, so it can be fixed in one go', () => {
    const result = validateRow({ Name: 'A', Phone: '123', Age: '40', Sex: '?', Church: '9' }, 7, mapping, null);
    expect(result.ok).toBe(false);
    // if (!result.ok) {
      if ('reason' in result) {
      expect(result.reason).toBe(
        'Name is missing or too short; Invalid phone number; Age must be a number from 1 to 24; Gender must be Male or Female; Church must be Church 1 or Church 2',
      );
    }
  });

  it('explains the Excel scientific-notation phone problem', () => {
    const result = validateRow({ ...good, Phone: '8.03E+09' }, 2, mapping, null);
    // expect(!result.ok && result.reason).toContain('scientific notation');
    expect('reason' in result && result.reason).toContain('scientific notation');
  });

  it('says when the phone is simply missing', () => {
    const result = validateRow({ ...good, Phone: '' }, 2, mapping, null);
    // expect(!result.ok && result.reason).toBe('Phone number is missing');
    expect('reason' in result && result.reason).toBe('Phone number is missing');
  });
});

describe('validateRows', () => {
  it('numbers rows like a spreadsheet (header is row 1)', () => {
    const result = validateRows([good, { ...good, Phone: 'bad' }], mapping, null);
    expect(result.valid.map((row) => row.rowNumber)).toEqual([2]);
    expect(result.invalid.map((issue) => issue.rowNumber)).toEqual([3]);
  });

  it('keeps the first of two rows with the same phone number, and flags the second', () => {
    const rows = [
      good,
      { ...good, Name: 'Someone Else', Phone: '+234 803 123 4567' }, // same number, different format
      { ...good, Name: 'Third Person', Phone: '08039999999' },
    ];
    const result = validateRows(rows, mapping, null);
    expect(result.valid.map((row) => row.fullName)).toEqual(['Ada Obi', 'Third Person']);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]).toMatchObject({ rowNumber: 3, reason: 'Same phone number as row 2' });
  });

  it('handles an empty list', () => {
    expect(validateRows([], mapping, null)).toEqual({ valid: [], invalid: [], duplicates: [] });
  });
});