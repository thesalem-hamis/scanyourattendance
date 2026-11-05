import type { ChurchGroup, Gender } from '@/types';

/** The pieces of information we look for in a CSV file. */
export const IMPORT_FIELDS = ['fullName', 'firstName', 'lastName', 'phone', 'age', 'gender', 'churchGroup'] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

/** For each field, the name of the CSV column that holds it (or null if the file has none). */
export type ColumnMapping = Record<ImportField, string | null>;

export interface ParsedCsv {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
  /** Non-blocking things worth telling the admin (garbled characters, ragged rows). */
  warnings: string[];
}

/** One row that passed every check, in exactly the shape the database wants. */
export interface ImportRow {
  /** Spreadsheet row number (header is row 1), so errors point at the right line. */
  rowNumber: number;
  fullName: string;
  phone: string;
  age: number | null;
  gender: Gender;
  churchGroup: ChurchGroup;
}

export interface RowIssue {
  rowNumber: number;
  reason: string;
  raw: Record<string, string>;
}

export interface ValidationResult {
  valid: ImportRow[];
  invalid: RowIssue[];
  /** Rows whose phone number already appeared earlier in the same file. */
  duplicates: RowIssue[];
}

export interface ImportOptions {
  /** When set, every row goes to this church and the church column is ignored. */
  fixedChurch: ChurchGroup | null;
  /** The admin confirmed these people (or their parents) agreed to be on the list. */
  consentConfirmed: boolean;
  /** What to do with people who are already members. */
  updateExisting: boolean;
}

export interface ImportResult {
  created: number;
  updated: number;
  /** Already members and left unchanged (by choice, or because they appeared meanwhile). */
  skippedExisting: number;
  failedBatches: { rowNumbers: number[]; message: string }[];
}
