import Papa from 'papaparse';
import type { RowIssue } from '../types';

/**
 * Spreadsheet programs run text that starts with = + - or @ as a formula. A cell copied from an
 * uploaded file could therefore do something nasty when the report is opened, so we defuse it.
 */
const defuse = (value: string): string => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);

/** A CSV of the rows that were NOT imported, with the reason, ready to fix and re-upload. */
export function buildErrorReportCsv(issues: readonly RowIssue[], headers: readonly string[]): string {
  return Papa.unparse({
    fields: ['Row number', 'Problem', ...headers],
    data: issues.map((issue) => [
      String(issue.rowNumber),
      issue.reason,
      ...headers.map((header) => defuse(issue.raw[header] ?? '')),
    ]),
  });
}

/** Downloads text as a file. The BOM makes Excel read accents correctly. */
export function downloadTextFile(fileName: string, text: string): void {
  const blob = new Blob([`\uFEFF${text}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}