import { describe, expect, it } from 'vitest';
import { buildSearchFilter, parseCheckInResult } from './checkinService';

const member = { id: 'm1', full_name: 'Ada Obi', church_group: 'Church 2', member_code: 'MEM-10001' };

describe('parseCheckInResult', () => {
  it.each(['checked_in', 'already_checked_in', 'inactive'] as const)('reads a %s answer', (result) => {
    expect(parseCheckInResult({ result, member })).toEqual({
      result,
      member: { id: 'm1', fullName: 'Ada Obi', churchGroup: 'Church 2', memberCode: 'MEM-10001' },
    });
  });

  it('reads not_found', () => {
    expect(parseCheckInResult({ result: 'not_found' })).toEqual({ result: 'not_found' });
  });

  it.each([
    [null],
    [{}],
    [{ result: 'maybe' }],
    [{ result: 'checked_in' }], // member missing
    [{ result: 'checked_in', member: { ...member, church_group: 'Church 9' } }],
    ['checked_in'],
  ])('rejects an unexpected answer: %j', (data) => {
    expect(() => parseCheckInResult(data)).toThrow('Unexpected response');
  });
});

describe('buildSearchFilter', () => {
  it('needs at least 2 characters', () => {
    expect(buildSearchFilter('')).toBeNull();
    expect(buildSearchFilter(' a ')).toBeNull();
  });

  it('searches name and member code for text', () => {
    expect(buildSearchFilter('ada')).toBe('full_name.ilike.*ada*,member_code.ilike.*ada*');
    expect(buildSearchFilter('  Ada   Obi ')).toBe('full_name.ilike.*Ada Obi*,member_code.ilike.*Ada Obi*');
    expect(buildSearchFilter('MEM-10001')).toBe('full_name.ilike.*MEM-10001*,member_code.ilike.*MEM-10001*');
  });

  it('matches phone numbers by digits without the leading 0', () => {
    expect(buildSearchFilter('0803 123 4567')).toBe('phone.ilike.*8031234567*,member_code.ilike.*8031234567*');
    expect(buildSearchFilter('+234 803')).toBe('phone.ilike.*234803*,member_code.ilike.*234803*');
    expect(buildSearchFilter('08031')).toBe('phone.ilike.*8031*,member_code.ilike.*8031*');
  });

  it('needs at least 3 digits for a number search', () => {
    expect(buildSearchFilter('080')).toBeNull(); // only "80" after the leading 0
    expect(buildSearchFilter('12')).toBeNull();
    expect(buildSearchFilter('0803')).not.toBeNull();
  });

  it('strips characters that could break the filter or act as wildcards', () => {
    const filter = buildSearchFilter('a,b)(c*d%e\\f"g\'h') ?? '';
    expect(filter).not.toMatch(/[()%\\"']/);
    // the only comma left is the one separating the two conditions
    expect(filter.split(',').length).toBe(2);
    expect(filter).not.toContain('**');
  });
});