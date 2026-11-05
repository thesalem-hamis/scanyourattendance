import Papa from 'papaparse';
import { AppError } from '@/lib/error';
import type { ParsedCsv } from '../types';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_ROWS = 5000;

/** Parses CSV text into trimmed rows keyed by header. Throws a friendly AppError if unusable. */
export function parseCsvText(text: string, fileName = 'import.csv'): ParsedCsv {
  const clean = text.replace(/^\uFEFF/, ''); // Excel's invisible "this is UTF-8" marker
  const result = Papa.parse<Record<string, string>>(clean, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  });

  const headers = (result.meta.fields ?? []).filter((header) => header !== '');
  if (headers.length === 0) {
    throw new AppError('That file looks empty. It needs a header row, then one row per member.', 'validation');
  }

  const rows = result.data.map((row) =>
    Object.fromEntries(headers.map((header) => [header, String(row[header] ?? '').trim()])),
  );

  if (rows.length === 0) throw new AppError('That file has a header row but no members in it.', 'validation');
  if (rows.length > MAX_ROWS) {
    throw new AppError(
      `That file has ${rows.length.toLocaleString()} rows. Import at most ${MAX_ROWS.toLocaleString()} at a time: split the file and import it in parts.`,
      'validation',
    );
  }

  const warnings: string[] = [];
  if (rows.some((row) => Object.values(row).some((cell) => cell.includes('\uFFFD')))) {
    warnings.push(
      'Some characters look garbled. In Excel use File → Save As → "CSV UTF-8", then upload that file so names with accents come through correctly.',
    );
  }
  const ragged = result.errors.filter((error) => error.code === 'TooManyFields' || error.code === 'TooFewFields');
  if (ragged.length > 0) {
    warnings.push(
      `${ragged.length} row${ragged.length === 1 ? ' has' : 's have'} a different number of columns from the header. Check that names with commas are in quotes.`,
    );
  }

  return { fileName, headers, rows, warnings };
}

export async function parseCsvFile(file: File): Promise<ParsedCsv> {
  if (/\.(xlsx|xls|xlsm|numbers|ods)$/i.test(file.name)) {
    throw new AppError(
      "That's a spreadsheet file, not a CSV. In Excel choose File → Save As → \"CSV UTF-8\", then upload that.",
      'validation',
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new AppError('That file is larger than 5 MB. Split it into smaller files.', 'validation');
  }
  return parseCsvText(await file.text(), file.name);
}