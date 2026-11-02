import { describe, expect, it } from 'vitest';
import { registerSchema } from './registerSchema';

const valid = {
  fullName: '  Ada Obi  ',
  phone: '0803 123 4567',
  age: 15,
  gender: 'Female',
  churchGroup: 'Church 1',
  consent: true,
  website: '',
};

const firstMessage = (input: unknown) => {
  const result = registerSchema.safeParse(input);
  return result.success ? null : result.error.issues[0].message;
};

describe('registerSchema', () => {
  it('accepts a valid registration and trims the name', () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fullName).toBe('Ada Obi');
  });

  it('requires a real name', () => {
    expect(firstMessage({ ...valid, fullName: 'A' })).toBe('Enter your full name');
    expect(firstMessage({ ...valid, fullName: '   ' })).toBe('Enter your full name');
  });

  it('rejects bad phone numbers', () => {
    expect(firstMessage({ ...valid, phone: '' })).toBe('Enter your phone number');
    expect(firstMessage({ ...valid, phone: '12345' })).toContain('valid mobile number');
  });

  it('checks the age range and type', () => {
    expect(firstMessage({ ...valid, age: 5 })).toContain('at least');
    expect(firstMessage({ ...valid, age: 40 })).toContain('or less');
    expect(firstMessage({ ...valid, age: 15.5 })).toBe('Enter a whole number');
    expect(firstMessage({ ...valid, age: Number.NaN })).toBe('Enter your age');
    expect(firstMessage({ ...valid, age: undefined })).toBe('Enter your age');
  });

  it('requires gender and church to be chosen', () => {
    expect(firstMessage({ ...valid, gender: undefined })).toBe('Choose one');
    expect(firstMessage({ ...valid, churchGroup: undefined })).toBe('Choose your church');
    expect(firstMessage({ ...valid, churchGroup: 'Church 3' })).toBe('Choose your church');
    // react-hook-form reports an unselected radio group as null, not undefined
    expect(firstMessage({ ...valid, gender: null })).toBe('Choose one');
    expect(firstMessage({ ...valid, churchGroup: null })).toBe('Choose your church');
  });

  it('requires consent', () => {
    expect(firstMessage({ ...valid, consent: false })).toBe('Please tick this box to continue');
  });
});
