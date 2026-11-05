import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';
import { buildErrorReportCsv } from './buildErrorReport';

const headers = ['Name', 'Phone'];

describe('buildErrorReportCsv', () => {
  it('lists the row number, the problem and the original columns', () => {
    const csv = buildErrorReportCsv(
      [{ rowNumber: 4, reason: 'Invalid phone number', raw: { Name: 'Ada Obi', Phone: '123' } }],
      headers,
    );
    expect(Papa.parse(csv).data).toEqual([
      ['Row number', 'Problem', 'Name', 'Phone'],
      ['4', 'Invalid phone number', 'Ada Obi', '123'],
    ]);
  });

  it('quotes commas and quotes properly', () => {
    const csv = buildErrorReportCsv(
      [{ rowNumber: 2, reason: 'Name is missing or too short; Invalid phone number', raw: { Name: 'Obi, "Ada"', Phone: '' } }],
      headers,
    );
    const parsed = Papa.parse<string[]>(csv).data;
    expect(parsed[1]).toEqual(['2', 'Name is missing or too short; Invalid phone number', 'Obi, "Ada"', '']);
  });

  it('defuses spreadsheet formulas copied from the uploaded file', () => {
    const csv = buildErrorReportCsv(
      [{ rowNumber: 2, reason: 'x', raw: { Name: '=HYPERLINK("http://evil.example")', Phone: '+2348031234567' } }],
      headers,
    );
    const row = Papa.parse<string[]>(csv).data[1];
    expect(row[2].startsWith("'=")).toBe(true);
    expect(row[3].startsWith("'+")).toBe(true);
  });

  it('leaves normal text untouched', () => {
    const csv = buildErrorReportCsv([{ rowNumber: 2, reason: 'x', raw: { Name: 'Ada', Phone: '0803' } }], headers);
    expect(Papa.parse<string[]>(csv).data[1].slice(2)).toEqual(['Ada', '0803']);
  });

  it('copes with a missing column value', () => {
    const csv = buildErrorReportCsv([{ rowNumber: 2, reason: 'x', raw: { Name: 'Ada' } }], headers);
    expect(Papa.parse<string[]>(csv).data[1]).toEqual(['2', 'x', 'Ada', '']);
  });
});