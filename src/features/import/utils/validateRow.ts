import { AGE_LIMITS } from '../constants';
import { normalizePhone } from '@/lib/phone';
import type { ChurchGroup, Gender } from '@/types';
import type { ColumnMapping, ImportRow, RowIssue, ValidationResult } from '../types';

export function normalizeGender(value: string): Gender | null {
  const text = value.trim().toLowerCase();
  if (['m', 'male', 'boy', 'man', 'masculine'].includes(text)) return 'Male';
  if (['f', 'female', 'girl', 'woman', 'feminine'].includes(text)) return 'Female';
  return null;
}

export function normalizeChurch(value: string): ChurchGroup | null {
  const text = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['1', 'one', 'c1', 'church1', 'churchone', 'first'].includes(text)) return 'Church 1';
  if (['2', 'two', 'c2', 'church2', 'churchtwo', 'second'].includes(text)) return 'Church 2';
  return null;
}

/** "15", "15 yrs", "15 years" -> 15. Blank -> no age. Anything else -> invalid. */
export function parseAge(value: string): { ok: true; age: number | null } | { ok: false } {
  const text = value.trim();
  if (text === '') return { ok: true, age: null };
  const match = text.match(/^(\d{1,2})\s*(y|yr|yrs|year|years)?$/i);
  if (!match) return { ok: false };
  const age = Number(match[1]);
  return age >= AGE_LIMITS.min && age <= AGE_LIMITS.max ? { ok: true, age } : { ok: false };
}

const cell = (raw: Record<string, string>, header: string | null): string => (header ? (raw[header] ?? '').trim() : '');

export function validateRow(
  raw: Record<string, string>,
  rowNumber: number,
  mapping: ColumnMapping,
  fixedChurch: ChurchGroup | null,
): { ok: true; row: ImportRow } | { ok: false; reason: string } {
  const problems: string[] = [];

  const fullName =
    cell(raw, mapping.fullName) ||
    [cell(raw, mapping.firstName), cell(raw, mapping.lastName)].filter(Boolean).join(' ');
  const name = fullName.replace(/\s+/g, ' ').trim();
  if (name.length < 2) problems.push('Name is missing or too short');
  else if (name.length > 100) problems.push('Name is too long');

  const rawPhone = cell(raw, mapping.phone);
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    problems.push(
      /\d\.?\d*e\+\d+/i.test(rawPhone)
        ? 'Phone number was turned into scientific notation by Excel (format the column as Text and re-enter it)'
        : rawPhone === ''
          ? 'Phone number is missing'
          : 'Invalid phone number',
    );
  }

  const age = parseAge(cell(raw, mapping.age));
  if (!age.ok) problems.push(`Age must be a number from ${AGE_LIMITS.min} to ${AGE_LIMITS.max}`);

  const gender = normalizeGender(cell(raw, mapping.gender));
  if (!gender) problems.push('Gender must be Male or Female');

  const church = fixedChurch ?? normalizeChurch(cell(raw, mapping.churchGroup));
  if (!church) problems.push('Church must be Church 1 or Church 2');

  if (problems.length > 0 || !phone || !age.ok || !gender || !church) {
    return { ok: false, reason: problems.join('; ') };
  }
  return { ok: true, row: { rowNumber, fullName: name, phone, age: age.age, gender, churchGroup: church } };
}

/** Checks every row. If a phone number appears twice in the file, the first one wins. */
export function validateRows(
  rows: readonly Record<string, string>[],
  mapping: ColumnMapping,
  fixedChurch: ChurchGroup | null,
): ValidationResult {
  const valid: ImportRow[] = [];
  const invalid: RowIssue[] = [];
  const duplicates: RowIssue[] = [];
  const firstSeen = new Map<string, number>();

  rows.forEach((raw, index) => {
    const rowNumber = index + 2; // row 1 is the header
    const result = validateRow(raw, rowNumber, mapping, fixedChurch);

      if ('reason' in result) { //{ if (!result.ok) { corrected this so no error on ts.
      invalid.push({ rowNumber, reason: result.reason, raw });
      return;
    }
    const earlier = firstSeen.get(result.row.phone);
    if (earlier !== undefined) {
      duplicates.push({ rowNumber, reason: `Same phone number as row ${earlier}`, raw });
      return;
    }
    firstSeen.set(result.row.phone, rowNumber);
    valid.push(result.row);
  });

  return { valid, invalid, duplicates };
}
