import { IMPORT_FIELDS, type ColumnMapping, type ImportField } from '../types';

/** Header names (lower-case, letters and digits only) we recognise for each field. */
const SYNONYMS: Record<ImportField, readonly string[]> = {
  fullName: ['fullname', 'fullnames', 'name', 'names', 'membername', 'teenname', 'studentname', 'nameofteen'],
  firstName: ['firstname', 'firstnames', 'givenname', 'forename'],
  lastName: ['lastname', 'surname', 'familyname'],
  phone: [
    'phone',
    'phones',
    'phonenumber',
    'phonenumbers',
    'phoneno',
    'mobile',
    'mobilenumber',
    'mobileno',
    'tel',
    'telephone',
    'whatsapp',
    'whatsappnumber',
    'contact',
    'contactnumber',
    'gsm',
    'gsmnumber',
  ],
  age: ['age', 'ages'],
  gender: ['gender', 'sex'],
  churchGroup: ['churchgroup', 'church', 'group', 'branch', 'churchbranch', 'location', 'assembly', 'churchname'],
};

const simplify = (header: string): string => header.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Guesses which CSV column holds which field. The admin can correct any guess. */
export function autoMapColumns(headers: readonly string[]): ColumnMapping {
  const mapping = Object.fromEntries(IMPORT_FIELDS.map((field) => [field, null])) as ColumnMapping;
  const used = new Set<string>();

  for (const field of IMPORT_FIELDS) {
    const match = headers.find((header) => !used.has(header) && SYNONYMS[field].includes(simplify(header)));
    if (match) {
      mapping[field] = match;
      used.add(match);
    }
  }
  return mapping;
}

/** What still has to be matched before the import can go ahead. Empty = good to go. */
export function missingRequired(mapping: ColumnMapping, fixedChurch: string | null): string[] {
  const missing: string[] = [];
  if (!mapping.fullName && !(mapping.firstName && mapping.lastName)) missing.push('Name (a full-name column, or first and last name)');
  if (!mapping.phone) missing.push('Phone number');
  if (!mapping.gender) missing.push('Gender');
  if (!fixedChurch && !mapping.churchGroup) missing.push('Church (or choose one church for the whole file)');
  return missing;
}
