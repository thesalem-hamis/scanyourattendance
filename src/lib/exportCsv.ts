import Papa from 'papaparse';

type Cell = string | number | null | undefined;

/**
 * Spreadsheet programs run text that starts with = + - or @ as a formula. Names come from a
 * public sign-up form, so someone could register as "=HYPERLINK(...)" and have it run when an
 * admin opens an export. Defuse any such text. A plain phone number (+ and digits only) is safe
 * and is left alone.
 */
export function defuseCell(value: string): string {
  if (/^\+\d{7,15}$/.test(value)) return value;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** CSV text with a header row. Numbers stay numbers; text is made safe to open in a spreadsheet. */
export function buildCsv(headers: readonly string[], rows: readonly (readonly Cell[])[]): string {
  return Papa.unparse({
    fields: [...headers],
    data: rows.map((row) => row.map((cell) => (typeof cell === 'string' ? defuseCell(cell) : (cell ?? '')))),
  });
}

/** Downloads text as a file. The BOM makes Excel read accents and Yoruba characters correctly. */
export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
