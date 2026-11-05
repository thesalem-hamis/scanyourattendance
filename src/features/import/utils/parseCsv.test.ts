import { describe, expect, it } from 'vitest';
import { MAX_ROWS, parseCsvFile, parseCsvText } from './parseCsv';

describe('parseCsvText', () => {
  it('reads headers and trimmed rows', () => {
    const csv = parseCsvText('Name, Phone\n Ada Obi ,0803 123 4567\nTunde,0701 234 5678\n', 'x.csv');
    expect(csv.headers).toEqual(['Name', 'Phone']);
    expect(csv.rows).toEqual([
      { Name: 'Ada Obi', Phone: '0803 123 4567' },
      { Name: 'Tunde', Phone: '0701 234 5678' },
    ]);
    expect(csv.fileName).toBe('x.csv');
    expect(csv.warnings).toEqual([]);
  });

  it('copes with Excel\'s invisible UTF-8 marker, Windows line endings, and blank lines', () => {
    const csv = parseCsvText('\uFEFFName,Phone\r\nAda,0803\r\n\r\n,\r\nTunde,0701\r\n');
    expect(csv.headers).toEqual(['Name', 'Phone']);
    expect(csv.rows.map((row) => row.Name)).toEqual(['Ada', 'Tunde']);
  });

  it('keeps commas inside quoted names', () => {
    const csv = parseCsvText('Name,Phone\n"Obi, Ada",0803\n');
    expect(csv.rows[0].Name).toBe('Obi, Ada');
  });

  it('understands semicolon-separated files (common in some regions)', () => {
    const csv = parseCsvText('Name;Phone\nAda;0803\n');
    expect(csv.headers).toEqual(['Name', 'Phone']);
    expect(csv.rows[0]).toEqual({ Name: 'Ada', Phone: '0803' });
  });

  it('keeps accented and Yoruba names intact', () => {
    expect(parseCsvText('Name\nỌlá Adéyẹmí\nJosé\n').rows.map((row) => row.Name)).toEqual(['Ọlá Adéyẹmí', 'José']);
  });

  it('warns about garbled characters', () => {
    const csv = parseCsvText('Name\nJos\uFFFD\n');
    expect(csv.warnings[0]).toContain('CSV UTF-8');
  });

  it('warns about rows with the wrong number of columns', () => {
    const csv = parseCsvText('Name,Phone\nAda,0803,extra\nTunde\n');
    expect(csv.warnings.join(' ')).toContain('2 rows have a different number of columns');
  });

  it('rejects an empty file and a header-only file with a clear message', () => {
    expect(() => parseCsvText('')).toThrow('looks empty');
    expect(() => parseCsvText('Name,Phone\n')).toThrow('no members');
  });

  it('rejects too many rows', () => {
    const body = Array.from({ length: MAX_ROWS + 1 }, (_, i) => `Person ${i},080${i}`).join('\n');
    expect(() => parseCsvText(`Name,Phone\n${body}`)).toThrow('Import at most 5,000');
  });
});

describe('parseCsvFile', () => {
  it('reads a File', async () => {
    const file = new File(['Name,Phone\nAda,0803\n'], 'members.csv', { type: 'text/csv' });
    const csv = await parseCsvFile(file);
    expect(csv.fileName).toBe('members.csv');
    expect(csv.rows).toHaveLength(1);
  });

  it('tells people who upload an Excel file what to do instead', async () => {
    const file = new File(['x'], 'members.xlsx');
    await expect(parseCsvFile(file)).rejects.toThrow('Save As');
  });

  it('refuses files over 5 MB', async () => {
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.csv');
    await expect(parseCsvFile(big)).rejects.toThrow('larger than 5 MB');
  });
});