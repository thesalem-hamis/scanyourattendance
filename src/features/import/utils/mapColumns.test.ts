import { describe, expect, it } from 'vitest';
import { autoMapColumns, missingRequired } from './mapColumns';

describe('autoMapColumns', () => {
  it('recognises common header names, whatever the capitals and punctuation', () => {
    expect(autoMapColumns(['Full Name', 'Phone Number', 'Age', 'Gender', 'Church'])).toEqual({
      fullName: 'Full Name',
      firstName: null,
      lastName: null,
      phone: 'Phone Number',
      age: 'Age',
      gender: 'Gender',
      churchGroup: 'Church',
    });
  });

  it('recognises other wording', () => {
    const mapping = autoMapColumns(['S/N', 'NAME', 'GSM', 'SEX', 'AGE', 'Church Group']);
    expect(mapping).toMatchObject({ fullName: 'NAME', phone: 'GSM', gender: 'SEX', age: 'AGE', churchGroup: 'Church Group' });
  });

  it('finds first and last name columns', () => {
    const mapping = autoMapColumns(['First Name', 'Surname', 'Mobile', 'Sex']);
    expect(mapping).toMatchObject({ fullName: null, firstName: 'First Name', lastName: 'Surname', phone: 'Mobile' });
  });

  it('never uses one column for two fields', () => {
    const mapping = autoMapColumns(['Contact', 'Phone']);
    expect(mapping.phone).toBe('Contact'); // first match
    expect(Object.values(mapping).filter((value) => value === 'Contact')).toHaveLength(1);
  });

  it('leaves unknown columns unmatched', () => {
    const mapping = autoMapColumns(['Favourite colour', 'Shoe size']);
    expect(Object.values(mapping).every((value) => value === null)).toBe(true);
  });
});

describe('missingRequired', () => {
  const full = autoMapColumns(['Name', 'Phone', 'Gender', 'Church']);

  it('is empty when everything needed is matched', () => {
    expect(missingRequired(full, null)).toEqual([]);
  });

  it('asks for a name, phone and gender', () => {
    const none = autoMapColumns(['Foo']);
    expect(missingRequired(none, 'Church 1')).toEqual([
      'Name (a full-name column, or first and last name)',
      'Phone number',
      'Gender',
    ]);
  });

  it('needs a church column unless one church was chosen for the whole file', () => {
    const noChurch = autoMapColumns(['Name', 'Phone', 'Gender']);
    expect(missingRequired(noChurch, null)).toEqual(['Church (or choose one church for the whole file)']);
    expect(missingRequired(noChurch, 'Church 2')).toEqual([]);
  });

  it('accepts first + last name instead of a full name', () => {
    expect(missingRequired(autoMapColumns(['First Name', 'Last Name', 'Phone', 'Sex', 'Church']), null)).toEqual([]);
    expect(missingRequired(autoMapColumns(['First Name', 'Phone', 'Sex', 'Church']), null)).toHaveLength(1);
  });
});
