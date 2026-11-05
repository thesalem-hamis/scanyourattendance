import { describe, expect, it } from 'vitest';
import { memberFormSchema } from './memberSchema';

const valid = {
  fullName: ' Ada Obi ',
  phone: '0803 123 4567',
  age: 15,
  gender: 'Female',
  churchGroup: 'Church 1',
  consentGiven: false,
};

const firstMessage = (input: unknown) => {
  const result = memberFormSchema.safeParse(input);
  return result.success ? null : result.error.issues[0].message;
};

describe('memberFormSchema', () => {
  it('accepts a valid member and trims the name', () => {
    const result = memberFormSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fullName).toBe('Ada Obi');
  });

  it('allows the age to be left empty', () => {
    expect(memberFormSchema.safeParse({ ...valid, age: null }).success).toBe(true);
  });

  it('rejects ages outside what the database allows', () => {
    expect(firstMessage({ ...valid, age: 0 })).toContain('at least 1');
    expect(firstMessage({ ...valid, age: 25 })).toContain('24 or less');
    expect(firstMessage({ ...valid, age: 15.5 })).toBe('Enter a whole number');
    expect(firstMessage({ ...valid, age: Number.NaN })).toBe('Enter a number, or leave it empty');
  });

  it('accepts a young member that the public form would refuse (imported lists can have them)', () => {
    expect(memberFormSchema.safeParse({ ...valid, age: 6 }).success).toBe(true);
  });

  it('checks name, phone, gender and church', () => {
    expect(firstMessage({ ...valid, fullName: 'A' })).toBe('Enter a full name');
    expect(firstMessage({ ...valid, phone: '' })).toBe('Enter a phone number');
    expect(firstMessage({ ...valid, phone: '12345' })).toContain('valid mobile number');
    expect(firstMessage({ ...valid, gender: null })).toBe('Choose one');
    expect(firstMessage({ ...valid, churchGroup: '' })).toBe('Choose a church');
  });
});