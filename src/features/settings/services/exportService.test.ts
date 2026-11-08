import Papa from 'papaparse';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  calls: [] as [string, unknown[]][],
  pages: [] as unknown[][],
  error: null as unknown,
}));

vi.mock('@/lib/supabase', () => {
  // each `from()` is a new query; awaiting it after .range(a, b) returns that slice of h.pages
  return {
    supabase: {
      from: (table: string) => {
        h.calls.push(['from', [table]]);
        let range: [number, number] = [0, 0];
        const builder: unknown = new Proxy(
          {},
          {
            get(_t, prop: string) {
              if (prop === 'then') {
                return (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
                  Promise.resolve(h.error ? { data: null, error: h.error } : { data: h.pages[range[0] / 1000] ?? [], error: null }).then(res, rej);
              }
              return (...args: unknown[]) => {
                h.calls.push([prop, args]);
                if (prop === 'range') range = [args[0] as number, args[1] as number];
                return builder;
              };
            },
          },
        );
        return builder;
      },
    },
  };
});

import { attendanceCsv, fetchAllPages, fetchAttendanceForExport, fetchMembersForExport, membersCsv } from './exportService';

const calls = (name: string) => h.calls.filter(([n]) => n === name).map(([, a]) => a);
const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ i }));

beforeEach(() => {
  h.calls = [];
  h.pages = [];
  h.error = null;
});

describe('fetchAllPages', () => {
  it('keeps asking until a page comes back short, so nobody is left out of an export', async () => {
    const asked: [number, number][] = [];
    const data = [rows(1000), rows(1000), rows(250)];
    const result = await fetchAllPages((from, to) => {
      asked.push([from, to]);
      return Promise.resolve({ data: data[from / 1000], error: null });
    });
    expect(result).toHaveLength(2250);
    expect(asked).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });

  it('stops after one page when it is not full', async () => {
    const asked: number[] = [];
    await fetchAllPages((from) => (asked.push(from), Promise.resolve({ data: rows(3), error: null })));
    expect(asked).toEqual([0]);
  });

  it('handles an exact multiple of the page size with one extra empty look', async () => {
    const data = [rows(1000), []];
    const result = await fetchAllPages((from) => Promise.resolve({ data: data[from / 1000], error: null }));
    expect(result).toHaveLength(1000);
  });

  it('gives up with a friendly message if a page fails', async () => {
    await expect(fetchAllPages(() => Promise.resolve({ data: null, error: { code: '42501', message: 'x' } }))).rejects.toThrow("don't have permission");
  });
});

describe('members export', () => {
  const member = {
    member_code: 'MEM-10001', full_name: '=HYPERLINK("http://evil.example")', phone: '+2348031234567', age: 15,
    gender: 'Female' as const, church_group: 'Church 1' as const, status: 'active',
    created_at: '2026-11-01T23:30:00Z', consent_at: null,
  };

  it('reads everyone, in a stable order', async () => {
    h.pages = [[member]];
    expect(await fetchMembersForExport()).toHaveLength(1);
    expect(calls('order')).toEqual([['full_name'], ['id']]);
  });

  it('writes the columns an admin expects, with dates in Lagos time, and keeps phone numbers intact', () => {
    const parsed = Papa.parse<string[]>(membersCsv([member, { ...member, full_name: 'Ọlá Adéyẹmí', age: null, consent_at: '2026-11-01T08:00:00Z' }])).data;
    expect(parsed[0]).toEqual(['Member code', 'Name', 'Phone', 'Age', 'Gender', 'Church', 'Status', 'Joined', 'Consent recorded']);
    expect(parsed[2]).toEqual(['MEM-10001', 'Ọlá Adéyẹmí', '+2348031234567', '', 'Female', 'Church 1', 'active', '2026-11-02', '2026-11-01']);
  });

  it('defuses a malicious name typed into the public sign-up form', () => {
    expect(Papa.parse<string[]>(membersCsv([member])).data[1][1].startsWith("'=")).toBe(true);
  });
});

describe('attendance export', () => {
  const entry = {
    service_date: '2026-11-01', check_in_time: '2026-11-01T08:05:00Z', check_in_method: 'qr_scan' as const,
    members: { member_code: 'MEM-10001', full_name: 'Ada Obi', church_group: 'Church 2' as const },
  };

  it('can be limited to a range of dates', async () => {
    h.pages = [[entry]];
    await fetchAttendanceForExport({ from: '2026-10-01', to: '2026-11-30' });
    expect(calls('gte')).toEqual([['service_date', '2026-10-01']]);
    expect(calls('lte')).toEqual([['service_date', '2026-11-30']]);
  });

  it('exports everything when no range is given', async () => {
    h.pages = [[entry]];
    await fetchAttendanceForExport({});
    expect(calls('gte')).toEqual([]);
    expect(calls('lte')).toEqual([]);
  });

  it('rejects bad or backwards dates without asking the database', async () => {
    await expect(fetchAttendanceForExport({ from: '1/2/2026' })).rejects.toThrow('valid dates');
    await expect(fetchAttendanceForExport({ from: '2026-11-30', to: '2026-10-01' })).rejects.toThrow('must not be after');
    expect(calls('from')).toEqual([]);
  });

  it('writes one line per check-in, and copes with a member who was removed', () => {
    const csv = attendanceCsv([entry, { ...entry, members: null, check_in_method: 'manual_search' }]);
    const parsed = Papa.parse<string[]>(csv).data;
    expect(parsed[0]).toEqual(['Date', 'Name', 'Member code', 'Church', 'Time', 'How']);
    expect(parsed[1]).toEqual(['2026-11-01', 'Ada Obi', 'MEM-10001', 'Church 2', expect.stringMatching(/^9:05\s?(am|AM)$/), 'Scanned']);
    expect(parsed[2].slice(1, 4)).toEqual(['(removed member)', '', '']);
    expect(parsed[2][5]).toBe('Added by hand');
  });
});