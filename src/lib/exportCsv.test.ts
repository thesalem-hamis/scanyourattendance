import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';
import { buildCsv, defuseCell } from './exportCsv';

describe('defuseCell', () => {
  it('defuses anything a spreadsheet could run as a formula', () => {
    for (const evil of ['=1+1', '=HYPERLINK("http://evil.example")', '+cmd|\' /C calc\'!A0', '-2+3', '@SUM(1)', '\tTab']) {
      expect(defuseCell(evil).startsWith("'")).toBe(true);
    }
  });
  it('leaves ordinary text alone, including names with accents', () => {
    expect(defuseCell('Ada Obi')).toBe('Ada Obi');
    expect(defuseCell('Ọlá Adéyẹmí')).toBe('Ọlá Adéyẹmí');
    expect(defuseCell('')).toBe('');
  });
  it('leaves a plain international phone number alone (and only that)', () => {
    expect(defuseCell('+2348031234567')).toBe('+2348031234567');
    expect(defuseCell('+234803123456x')).toBe("'+234803123456x");
    expect(defuseCell('+1+1')).toBe("'+1+1");
  });
});

describe('buildCsv', () => {
  it('writes a header row then the data, quoting properly', () => {
    const csv = buildCsv(['Name', 'Phone', 'Age'], [['Obi, "Ada"', '+2348031234567', 15], ['Tunde', '', null]]);
    expect(Papa.parse(csv).data).toEqual([
      ['Name', 'Phone', 'Age'],
      ['Obi, "Ada"', '+2348031234567', '15'],
      ['Tunde', '', ''],
    ]);
  });
  it('defuses a malicious name typed into the sign-up form', () => {
    const csv = buildCsv(['Name'], [['=HYPERLINK("http://evil.example","click")']]);
    expect((Papa.parse<string[]>(csv).data[1][0] ?? '').startsWith("'=")).toBe(true);
  });
  it('handles no rows', () => {
    // a header-only file is a valid CSV (a trailing line break is fine)
    expect(Papa.parse(buildCsv(['A', 'B'], []), { skipEmptyLines: true }).data).toEqual([['A', 'B']]);
  });
});